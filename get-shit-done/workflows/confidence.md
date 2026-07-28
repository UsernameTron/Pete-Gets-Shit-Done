---
name: workflow:confidence
description: Full-confidence chained sweep — health, audits, real build/test/lint, map refresh, doc sync, repo cleanliness, weighted scorecard, single ship gate
---

<purpose>
One command that earns the sentence "everything works" instead of asserting it.
Chains every existing verification surface plus three new legs (real build/test/lint,
repo cleanliness, confidence rollup) into a single pass with exactly one gate.

Doctrine: automate the reversible; gate the irreversible. Legs 1-7 mutate nothing the
next commit can't absorb (reports, doc syncs, map refreshes). Ship (finalize) is the
only irreversible step and holds the only gate.
</purpose>

<available_agent_types>
- gsd-codebase-mapper — spawned indirectly via gsd:map-codebase
- gsd-verifier — spawned indirectly via quality-sweep legs
No agents are spawned directly by this workflow. All delegation goes through Skill()
or workflow execution; never fall back to 'general-purpose'.
</available_agent_types>

<process>

<step name="init" priority="first">
Parse `$ARGUMENTS`: `--dry-run`, `--deep`, `--yes-ship`.

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op 2>/dev/null)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Require: git repo (`git rev-parse --git-dir`), `.planning/` exists. If `.planning/` is
missing, stop: "Not a GSD project. Run workflow:adopt-codebase first (or /gsd:new-project)."

Probe optional cross-plugin dependencies (pattern from closeout.md — missing plugin
prints `[skipped]`, never errors):

```bash
probe_plugin() {
  jq -e --arg p "$1" 'to_entries[] | .value | keys[] | select(startswith($p))' \
    "$HOME/.claude/plugins/installed_plugins.json" >/dev/null 2>&1 \
    && echo "available" || echo "skipped"
}
COMMIT_CMDS=$(probe_plugin "commit-commands")
```

**If `--dry-run`:** print the leg plan below with each leg's target report file and
plugin probe results, then STOP. Zero Skill() calls, zero mutation.

```
## /gsd:confidence — dry run
Leg 1  health           → planning-dir integrity          (gsd-tools validate health)
Leg 2  quality-sweep    → BLOCKING/WARNINGS/INFO report   {--deep: +crew/agents/ecosystem/stats}
Leg 3  build-verify     → real build + tests + lint       (references/build-verification.md)
Leg 4  map refresh      → .planning/codebase/*.md         (gsd:map-codebase)
Leg 5  doc sync         → README/CLAUDE.md/PROJECT.md     (gsd:sync-docs)
Leg 6  repo cleanliness → untracked junk, stale branches, oversized files
Leg 7  scorecard        → .planning/CONFIDENCE.md         (weighted rollup + verdict)
GATE   ship?            → Skill(gsd:finalize)             [commit-commands: {probe result}]
```
</step>

<step name="leg_1_health">
```
Skill(skill="gsd:health")
```
Post-condition: capture the health verdict (healthy / issues found). Record as
`LEG1=PASS|WARN|FAIL`. A FAIL here (structurally broken .planning/) offers one
`--repair` pass via `gsd-tools validate health --repair`, then re-check. Still broken →
record FAIL and continue (the scorecard blocks later; collecting remaining evidence
is still useful).
</step>

<step name="leg_2_quality_sweep">
Execute @~/.claude/get-shit-done/workflows/quality-sweep.md end-to-end (pass `--deep`
through if set). It runs its audit legs in parallel and emits one severity-ordered
report.

Post-condition (never trust a spawn silently):
```bash
test -s .planning/QUALITY-SWEEP.md 2>/dev/null || ls .planning/*-SWEEP* 2>/dev/null
```
Parse the report's BLOCKING / WARNINGS / INFO counts. Record `LEG2=PASS` (0 blocking),
`WARN` (0 blocking, >0 warnings), or `FAIL` (>0 blocking).
</step>

<step name="leg_3_build_verify">
Run the shared build-verification procedure from
@~/.claude/get-shit-done/references/build-verification.md end-to-end.

Record `LEG3` from its parseable verdict line (`build-verification: PASS|FAIL`).
All-SKIPPED (no build commands defined) records `LEG3=WARN`.
This is the leg quality-sweep deliberately omits — the sweep is read-only; this leg
actually executes the suite.
</step>

<step name="leg_4_map_refresh">
```
Skill(skill="gsd:map-codebase")
```
Take the Refresh path if maps exist. Post-condition:
```bash
STALE_MAPS=$(find .planning/codebase -name '*.md' -newer .git/FETCH_HEAD 2>/dev/null | wc -l)
ls .planning/codebase/*.md >/dev/null 2>&1
```
Record `LEG4=PASS` if `.planning/codebase/` has ≥1 doc updated this run, else `WARN`.
</step>

<step name="leg_5_doc_sync">
```
Skill(skill="gsd:sync-docs", args="--dry-run")
```
If the dry run reports drift: run `Skill(skill="gsd:sync-docs")` for real to fix it,
then record `LEG5=PASS (drift fixed: <n> files)`. No drift → `LEG5=PASS (clean)`.
Sync failure → `LEG5=FAIL`.
</step>

<step name="leg_6_repo_cleanliness">
Inline bash — the leg no other GSD surface covers:

```bash
UNTRACKED=$(git status --porcelain | grep -c '^??' || true)
GONE_BRANCHES=$(git branch -vv | grep -c ': gone]' || true)
BIG_FILES=$(git ls-files -z | xargs -0 -I{} sh -c 'test -f "{}" && test $(stat -f%z "{}" 2>/dev/null || stat -c%s "{}") -gt 5242880 && echo "{}"' 2>/dev/null | wc -l | tr -d ' ')
ORPHANS=$(ls -d .planning/_absorbed 2>/dev/null | wc -l | tr -d ' ')
DEBUG_LEFT=$(ls .planning/debug/*.md 2>/dev/null | wc -l | tr -d ' ')
TODO_COUNT=$(grep -rIn --exclude-dir={.git,node_modules,.planning} -E 'TODO|FIXME|XXX' . 2>/dev/null | wc -l | tr -d ' ')
```

Present:
```
| Cleanliness check       | Count | Threshold |
|-------------------------|-------|-----------|
| Untracked files         | {n}   | 0         |
| Stale [gone] branches   | {n}   | 0         |
| Tracked files >5MB      | {n}   | 0         |
| Orphaned _absorbed/     | {n}   | 0         |
| Unresolved debug files  | {n}   | 0         |
| TODO/FIXME/XXX markers  | {n}   | info only |
```

If `GONE_BRANCHES > 0` and commit-commands probed available:
`Skill(skill="commit-commands:clean_gone")`; else `git remote prune origin` and report
the branch names for manual deletion. Record `LEG6=PASS` (all zeros), `WARN` (only
TODO markers or untracked), `FAIL` (oversized tracked files — those are permanent
history weight).
</step>

<step name="leg_7_scorecard">
Aggregate every verdict into `.planning/CONFIDENCE.md`. Inputs (all parseable lines,
never prose):
- LEG1..LEG6 records from above
- Per-phase 4D scores: `grep -h "score:" .planning/phases/*/*-VERIFICATION.md` (security 35 / performance 25 / correctness 25 / maintainability 15 — same weights as gsd-verifier)
- quality-sweep BLOCKING/WARNINGS counts

Verdict rules (deterministic, no judgment calls):
- **BLOCKED** — any LEG=FAIL, or any quality-sweep BLOCKING item
- **FIX-FIRST** — no FAILs, but any WARN or any phase 4D score < 70
- **SHIP-READY** — all legs PASS, all phase scores ≥ 70

Write `.planning/CONFIDENCE.md`:
```markdown
---
verdict: SHIP-READY | FIX-FIRST | BLOCKED
score: {weighted mean of phase 4D scores, or n/a}
generated: {ISO date}
---
# Confidence Report

| Leg | Surface | Result | Detail |
|-----|---------|--------|--------|
| 1 | Planning health | ... | ... |
| 2 | Quality audits | ... | {blocking}/{warnings} |
| 3 | Build/test/lint | ... | ... |
| 4 | Codebase map | ... | ... |
| 5 | Docs | ... | ... |
| 6 | Repo cleanliness | ... | ... |

## Ranked fixes (FIX-FIRST/BLOCKED only)
1. {highest-severity finding, source leg, one-line fix}
...
```

Commit the report:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(confidence): confidence sweep report — {verdict}" --files .planning/CONFIDENCE.md
```
</step>

<step name="ship_gate">
The only gate. Present verbatim:

> Confidence: {verdict} ({score}). Ship now via finalize, fix the {n} findings first, or stop?

Options: **Ship** / **Fix-first** / **Stop**.

- `--yes-ship` pre-approves ONLY when verdict is SHIP-READY. Print the receipt
  `[auto-ship] verdict=SHIP-READY score={score} source=flag` and proceed. FIX-FIRST
  and BLOCKED always stop at the gate regardless of the flag.
- **Fix-first** → present the ranked fix list and the re-run command
  (`/gsd:confidence`), then stop.
- **Stop** → stop. Everything above is committed reports only; git state otherwise untouched.

**Ship:**
```
Skill(skill="gsd:finalize", args="{milestone version from STATE.md}")
```
Post-condition verification (never trust the delegation):
```bash
ls .planning/MILESTONES.md >/dev/null 2>&1 || ls .planning/*ARCHIVE* >/dev/null 2>&1
test -z "$(git status --porcelain)" && echo "git: clean"
test "$(git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')" = "0" && echo "unpushed: 0"
```
Any post-condition fails → report which, point at finalize's own output, stop.
</step>

<step name="offer_next">
```
## ✓ Confidence sweep complete — {verdict}

Report: .planning/CONFIDENCE.md
{If shipped: finalize post-conditions verified — archive present, git clean, nothing unpushed.}
{If fix-first: /gsd:confidence — re-run after fixes}
```
Present the next command; do not run it.
</step>

</process>

<error_handling>
- A leg that errors (not FAILs — errors) records `LEG{n}=FAIL (error: <first line>)` and
  the chain continues; the scorecard turns it into BLOCKED. Rationale: partial evidence
  beats no evidence, and legs are independent.
- Exception: init requirements (git repo, .planning/) hard-stop — nothing downstream is
  meaningful without them.
- Re-running after a partial stop is safe: every leg re-detects its own prior output
  (manual resume — no checkpoint state, same as closeout v1).
</error_handling>

<critical_rules>
- Legs 1-7 must never push, tag, or archive. Only the gated ship step may, and only
  through gsd:finalize (which owns its own push-consent protocol).
- `--dry-run` makes zero Skill() calls and zero mutations. Hard contract.
- Verdict lines are the only inter-leg contract — never parse prose.
- `--yes-ship` never overrides FIX-FIRST or BLOCKED.
</critical_rules>

<success_criteria>
- [ ] All 7 legs produced a recorded verdict
- [ ] .planning/CONFIDENCE.md written and committed with frontmatter verdict
- [ ] Gate presented with verbatim text (or receipt printed for pre-approved SHIP-READY)
- [ ] If shipped: all three finalize post-conditions verified in bash
</success_criteria>
