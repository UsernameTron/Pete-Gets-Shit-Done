<purpose>

Drive an end-to-end project closeout: orient → audit → verify → capture → ship-or-freeze → finalize → optional polish. Wraps the existing `/gsd:finalize` command rather than duplicating its gates. Stops on BLOCK audit verdicts; prompts the user on FLAG verdicts.

Designed to be project-agnostic and idempotent. Re-running on an archived milestone fast-exits at Gate 0.

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

<step name="initialize" priority="first">

## 0. Initialize

Parse `$ARGUMENTS` for flags and the optional milestone positional:

```bash
ARGS="$ARGUMENTS"
MILESTONE_ARG=""
MODE_OVERRIDE=""
SKIP_AUDITS=false
SKIP_VERIFY=false
SKIP_SHIP=false
RUN_WRAP=false
RUN_PROFILE=false
DRY_RUN=false

if echo "$ARGS" | grep -qE '\-\-mode\s+(ship|freeze)'; then
  MODE_OVERRIDE=$(echo "$ARGS" | grep -oE '\-\-mode\s+(ship|freeze)' | awk '{print $2}')
fi
echo "$ARGS" | grep -q -- '--no-audits' && SKIP_AUDITS=true
echo "$ARGS" | grep -q -- '--no-verify' && SKIP_VERIFY=true
echo "$ARGS" | grep -q -- '--no-ship' && SKIP_SHIP=true
echo "$ARGS" | grep -q -- '--wrap' && RUN_WRAP=true
echo "$ARGS" | grep -q -- '--profile' && RUN_PROFILE=true
echo "$ARGS" | grep -q -- '--dry-run' && DRY_RUN=true

# First non-flag token is the milestone positional
MILESTONE_ARG=$(echo "$ARGS" | tr ' ' '\n' | grep -v '^--' | grep -v '^$' | head -1)
```

Verify upstream tracking (closeout requires a pushable branch):

```bash
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
if [ -z "$UPSTREAM" ]; then
  echo "ERROR: No upstream branch tracked. Closeout requires a tracked remote — push the branch first or set upstream with 'git push -u origin <branch>'." >&2
  exit 1
fi
```

Bootstrap milestone context:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse from the JSON: `milestone_version`, `milestone_name`, `state_status`, `paused_at`, `phase_count`, `completed_phases`. If `MILESTONE_ARG` is empty, default it to `milestone_version`.

Display startup banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CLOSEOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Status: {state_status}
 Phases: {completed_phases}/{phase_count}
 Mode: {auto-detect placeholder — resolved at Gate 3}
```

**Already-finalized fast exit.** If `state_status === "archived"`:

```
This milestone is already archived. Nothing to do.

Recent: git log --oneline -3
```

Display recent commits and exit cleanly. No further gates.

**Dry-run short-circuit.** If `DRY_RUN` is `true`, print the full gate plan and plugin probes, then exit without running any `Skill()` call. Use this template:

```
## Gate Plan (dry-run)

Gate 0: orient — prime-patterns, progress, stats           [run]
Gate 1: audit  — health, audit-agents, audit-uat,
                 audit-deps, audit-milestone, sync-docs    [{run/skipped via --no-audits}]
Gate 2: verify — verify-work + gsd-tools verify            [{run/skipped via --no-verify}]
Gate 3: mode   — auto-detect ship vs freeze                [run]
Gate 4: capture — milestone-summary (+ pause-work, session-report if freeze)  [run]
Gate 5: ship   — gsd:ship + pr-review-toolkit              [{run/skipped via --no-ship}]
Gate 6: clean  — clean_gone or 'git remote prune origin'   [run]
Gate 7: finalize — gsd:finalize {milestone}                [run]
Gate 8: polish — wrap / profile-user                       [{run if flagged}]

## Plugin Probes

pr-review-toolkit       : {installed/missing}
commit-commands         : {installed/missing}
claude-mcp-ecosystem    : {installed/missing}
```

For plugin probes, run:

```bash
PLUGINS_FILE="$HOME/.claude/plugins/installed_plugins.json"
probe_plugin() {
  local name="$1"
  if [ ! -f "$PLUGINS_FILE" ]; then echo "missing"; return; fi
  if jq -e --arg n "$name" '.plugins | keys | map(select(startswith($n + "@") or . == $n)) | length > 0' "$PLUGINS_FILE" >/dev/null 2>&1; then
    echo "installed"
  else
    echo "missing"
  fi
}
```

After printing the dry-run report, exit cleanly.

</step>

<step name="orient">

## Gate 0 (continued): Orient

Run the orientation triplet sequentially. These are read-only and do not mutate state:

```
Skill(skill="gsd:prime-patterns")
```

```
Skill(skill="gsd:progress")
```

```
Skill(skill="gsd:stats")
```

After all three return, capture the numerical snapshot for the closing report (test count, coverage, phase count). The audits in Gate 1 may change file state (sync-docs writes diffs, audit-deps may auto-commit), so anchoring "before" numbers here is the only chance to do it cleanly.

</step>

<step name="audit">

## Gate 1: Audit

If `SKIP_AUDITS` is `true`, display `Gate 1 ⏭ Skipped (--no-audits)` and proceed to Gate 2.

Otherwise run the six audits sequentially in cheap-to-expensive order. After each, parse the audit's report file for verdict and route via `handle_audit_verdict`.

**1a. Health**

```
Skill(skill="gsd:health")
```

After return, no report file is produced — `gsd:health` reports inline. If the user was prompted with repair options, treat any unresolved BLOCK as a hard stop. Otherwise continue.

**1b. Agent ecosystem**

```
Skill(skill="gsd:audit-agents")
```

```bash
VERDICT=$(grep -m1 -E "^(verdict|status):" .planning/ECOSYSTEM-REPORT.md 2>/dev/null | cut -d: -f2 | tr -d ' ')
```

Route via `handle_audit_verdict` with name `audit-agents` and the parsed verdict.

**1c. UAT items**

```
Skill(skill="gsd:audit-uat")
```

```bash
VERDICT=$(grep -m1 -E "^(verdict|status):" .planning/UAT-AUDIT.md 2>/dev/null | cut -d: -f2 | tr -d ' ')
```

If no report file exists, treat as `PASS`. Route via `handle_audit_verdict` with name `audit-uat`.

**1d. Dependencies (slowest — network call)**

```
Skill(skill="gsd:audit-deps")
```

```bash
VERDICT=$(grep -m1 -E "^(verdict|status):" .planning/DEPENDENCIES-REPORT.md 2>/dev/null | cut -d: -f2 | tr -d ' ')
```

Route via `handle_audit_verdict` with name `audit-deps`.

**1e. Milestone definition-of-done**

```
Skill(skill="gsd:audit-milestone")
```

```bash
VERDICT=$(grep -m1 "^status:" .planning/v${milestone_version}-MILESTONE-AUDIT.md 2>/dev/null | cut -d: -f2 | tr -d ' ')
```

Map `passed` → PASS, `gaps_found` → FLAG, `tech_debt` → FLAG, anything else → unknown (treat as FLAG). Route via `handle_audit_verdict`.

**1f. Documentation drift (diff-only mode)**

Run `gsd:sync-docs` in dry-run mode if it supports the flag, otherwise run normally and route the verdict the same way. The point is to capture drift signal without re-rewriting files that finalize Gate 5.5 will rewrite.

```
Skill(skill="gsd:sync-docs", args="--dry-run")
```

If the report file `.planning/SYNC-DOCS-REPORT.md` (or whatever `sync-docs` produces) shows clean → PASS. Drift identified → FLAG. Route via `handle_audit_verdict` with `audit-deferred-to-finalize=true` so the user knows finalize Gate 5.5 will handle the rewrite.

After all six audits route through, display:

```
✓ Gate 1: audits complete
```

</step>

<step name="verify">

## Gate 2: Verify

If `SKIP_VERIFY` is `true`, display:

```
⚠ Gate 2 ⏭ Skipped (--no-verify) — verification gate bypassed.
   Closeout will not catch test/build regressions before ship.
```

Then proceed to Gate 3.

Otherwise run conversational UAT first, then automated checks:

**2a. Conversational UAT**

```
Skill(skill="gsd:verify-work")
```

`verify-work` is interactive — it will prompt the user through acceptance criteria. Wait for it to return before continuing.

**2b. Automated build/test/lint**

Replicate finalize.md Gate 2 inline so failures surface before Gate 5 ship rather than after. Reading CLAUDE.md and extracting the project's build/test/lint commands keeps closeout project-agnostic — no hardcoded `npm test` or `make`.

1. Read `CLAUDE.md`. Look for `## Tests`, `## Commands`, or fenced `bash` blocks listing build/test/lint commands.
2. Identify candidate commands: scaffold/structure check, type check (tsc, mypy), lint (biome, ruff, eslint), test suite (`npm test`, `bun test`, `pytest`, `make test-all`).
3. For each command that maps to a tool installed in this project (probe with `command -v` or check `package.json`/`pyproject.toml`/`Makefile` for the script), execute it and record `PASS` / `FAIL` / `SKIPPED`.
4. Present a verification table identical in shape to finalize.md Gate 2:

   ```
   | Check        | Result | Detail            |
   |--------------|--------|-------------------|
   | scaffold     | PASS   | 43/43             |
   | type-check   | PASS   | 0 errors          |
   | lint         | PASS   | clean             |
   | tests        | PASS   | 2,644 passed      |
   ```

5. If any row is `FAIL`, route via `handle_blocker` with description `Gate 2 verify: <check> FAIL` and the captured stderr. Do not proceed.

When closeout completes Gate 7, finalize will re-run the same checks at its own Gate 2 — that is an intentional double-check, not duplication.

Display:

```
✓ Gate 2: verification passed
```

</step>

<step name="mode_branch">

## Gate 3: Mode Branch

Determine ship vs freeze mode.

If `MODE_OVERRIDE` is set, use it. Otherwise auto-detect:

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
ROADMAP_COMPLETE=$(echo "$ROADMAP" | jq -r '.roadmap_complete // false')
PHASES_DONE=$(echo "$ROADMAP" | jq -r '[.phases[] | select(.disk_status == "complete")] | length')
PHASES_TOTAL=$(echo "$ROADMAP" | jq -r '.phases | length')
```

Mode resolution:

- `paused_at` is set in STATE.md → `freeze`.
- `ROADMAP_COMPLETE === true` AND `PHASES_DONE == PHASES_TOTAL` AND no `paused_at` → `ship`.
- Anything else → ambiguous. Ask via AskUserQuestion:
  - **question:** "Closeout mode for this milestone?"
  - **options:** "Ship — milestone is done, push and archive" / "Freeze — pause work, capture handoff, do not ship" / "Abort closeout"

On "Abort closeout", display summary and exit.

Display the resolved mode:

```
✓ Gate 3: mode = {ship|freeze}
```

</step>

<step name="capture_ship">

## Gate 4a: Capture (ship mode only)

Skip if mode is `freeze`.

```
Skill(skill="gsd:milestone-summary")
```

`session-report` is intentionally NOT run here — finalize Gate 6 runs it. Running it twice produces redundant reports.

</step>

<step name="capture_freeze">

## Gate 4b: Capture (freeze mode only)

Skip if mode is `ship`.

```
Skill(skill="gsd:pause-work")
```

```
Skill(skill="gsd:milestone-summary")
```

```
Skill(skill="gsd:session-report")
```

After all three return, display the freeze completion banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CLOSEOUT ▸ FROZEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Status: Paused — context handoff written to .continue-here.md
 Resume with: /gsd:resume-work
```

Exit closeout cleanly. Freeze mode does not run ship, finalize, cleanup, or polish.

</step>

<step name="ship">

## Gate 5: Ship (ship mode only)

If `SKIP_SHIP` is `true`, display `Gate 5 ⏭ Skipped (--no-ship)` and proceed to Gate 6.

**5a. Preflight**

```bash
GH_PRESENT=$(command -v gh >/dev/null 2>&1 && echo "yes" || echo "no")
UNPUSHED=$(git log "@{u}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
```

If `GH_PRESENT` is `no`, ask via AskUserQuestion: "`gh` CLI not found. Skip ship gate?" with options "Skip ship" / "Stop closeout".

**5b. Ship**

If `UNPUSHED > 0` or there are open PRs on the current branch:

```
Skill(skill="gsd:ship")
```

Otherwise display `Gate 5: nothing to ship — branch is up to date with remote` and continue.

**5c. PR review (optional plugin)**

```bash
REVIEW=$(probe_plugin "pr-review-toolkit")
```

If `installed`:

```
Skill(skill="pr-review-toolkit:review-pr")
```

If the Skill tool rejects the namespaced skill name, fall back to surfacing a literal slash-command instruction to the user:

```
Plugin pr-review-toolkit is installed but Skill dispatch failed.
Run manually: /pr-review-toolkit:review-pr
```

If `missing`, display `[skipped] pr-review-toolkit not installed` and continue.

</step>

<step name="clean">

## Gate 6: Clean (ship mode only)

Run only the cleanup operations that `/gsd:finalize` does NOT do. Finalize Gate 4 already runs `/gsd:cleanup` for phase archival.

**6a. Stale local branches**

```bash
CLEAN_GONE=$(probe_plugin "commit-commands")
```

If `installed`:

```
Skill(skill="commit-commands:clean_gone")
```

If `missing`, fall back to:

```bash
git remote prune origin
```

**6b. Local services (optional)**

```bash
if [ -f docker-compose.yml ] || [ -f compose.yaml ]; then
  HAS_COMPOSE=true
fi
```

If `HAS_COMPOSE` is true, ask via AskUserQuestion: "Docker compose file detected. Run `docker compose down` to stop local services?" with options "Yes — stop services" / "No — leave running".

On "Yes":

```bash
docker compose down 2>&1 || true
```

</step>

<step name="finalize">

## Gate 7: Finalize (ship mode only)

Hand off to the existing finalize pipeline. It runs verify → archive → cleanup → docs → reports → final commit/push → confirm clean state.

```
Skill(skill="gsd:finalize", args="${MILESTONE_ARG}")
```

After return, verify finalize succeeded by checking:

```bash
ARCHIVE_OK=$(ls .planning/milestones/v${milestone_version}-ROADMAP.md 2>/dev/null && echo "yes" || echo "no")
GIT_CLEAN=$(test -z "$(git status --porcelain)" && echo "yes" || echo "no")
UNPUSHED_AFTER=$(git log "@{u}..HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')
```

If `ARCHIVE_OK` is `no` or `GIT_CLEAN` is `no` or `UNPUSHED_AFTER > 0`, route via `handle_blocker` with description `Gate 7 finalize: post-conditions failed (archive_ok=$ARCHIVE_OK, git_clean=$GIT_CLEAN, unpushed=$UNPUSHED_AFTER)`.

</step>

<step name="polish">

## Gate 8: Polish (optional)

Both polish steps are opt-in. Default: skipped.

**8a. Session wrap (claude-mcp-ecosystem plugin)**

If `RUN_WRAP` is `true`:

```bash
WRAP=$(probe_plugin "claude-mcp-ecosystem")
```

If `installed`:

```
Skill(skill="claude-mcp-ecosystem:wrap")
```

If `missing`, display `[skipped] claude-mcp-ecosystem not installed`.

**8b. Behavioral profile**

If `RUN_PROFILE` is `true`:

```
Skill(skill="gsd:profile-user")
```

Display the final closeout banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CLOSEOUT ▸ COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Mode: ship
 Audits: passed
 Verify: passed
 Finalize: archived, pushed, clean
 Repo state: clean

 Next: /gsd:new-milestone or move to another project.
```

</step>

<step name="handle_audit_verdict">

## Audit Verdict Resolution

Helper invoked from Gate 1 after each audit. Inputs: `AUDIT_NAME`, `VERDICT`, optional report path.

**If VERDICT is `PASS` (or empty / unknown for audits that report inline):**

Display `✓ Gate 1.{n}: {AUDIT_NAME} passed` and return to the caller.

**If VERDICT is `FLAG`:**

Display the FLAG findings (read first 50 lines of the report file). Then ask via AskUserQuestion:

- **question:** "{AUDIT_NAME} reported FLAG. How to proceed?"
- **options:**
  - "Resolve now and re-run this audit"
  - "Acknowledge and continue"
  - "Stop closeout"

On **"Resolve now"**: Pause for the user to fix issues. Loop: re-run the same audit `Skill()` call, re-parse the verdict, route again via this step.

On **"Acknowledge and continue"**: Log the FLAG to `.planning/state/closeout-acks.md` (create if missing) with timestamp + audit name + verdict, then return to the caller.

On **"Stop closeout"**: Route to `handle_blocker` with description `User stopped — {AUDIT_NAME} FLAG unresolved`.

**If VERDICT is `BLOCK`:**

Display the BLOCK findings (read first 50 lines of the report file). Then ask via AskUserQuestion:

- **question:** "{AUDIT_NAME} reported BLOCK. How to proceed?"
- **options:**
  - "Resolve now and re-run this audit"
  - "Stop closeout"

No "Acknowledge and continue" option for BLOCK.

On **"Resolve now"**: Loop as in FLAG case.

On **"Stop closeout"**: Route to `handle_blocker` with description `BLOCK from {AUDIT_NAME}: must resolve before closeout`.

</step>

<step name="handle_blocker">

## Handle Blocker

Catastrophic failure handler. Reached only when an audit BLOCK is unresolved, a Gate 2 verify command fails, or a Gate 7 finalize post-condition fails.

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CLOSEOUT ▸ STOPPED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Stopped at: {gate name}
 Reason: {blocker description}
 Milestone: {milestone_version} — not finalized
```

Ask via AskUserQuestion:

- **question:** "Closeout stopped: {description}. How to proceed?"
- **options:**
  - "Retry from this gate" — re-run the failed step
  - "Stop and exit" — surface the failure and exit cleanly

On **"Retry"**: Loop back to the originating gate.

On **"Stop"**: Display the resume hint:

```
Resume after fixes with:
  /gsd:closeout {milestone} [flags]

Or skip the failed gate:
  /gsd:closeout {milestone} --no-{audits|verify|ship}
```

Exit cleanly.

</step>

</process>

<critical_rules>

- **Project-agnostic:** Read milestone version, status, and counts from `gsd-tools.cjs init milestone-op` and `roadmap analyze`. Never hardcode version numbers or file counts.
- **Gate-based:** Do not skip gates silently. If a gate is skipped via flag, display the skip banner. If a gate BLOCKs, route to `handle_blocker`.
- **Idempotent:** Re-running on an archived milestone fast-exits at Gate 0. Re-running after a partial-stop continues from where the operator left off (manual resume — no checkpoint state in v1).
- **Defer to finalize:** Gate 7 calls `/gsd:finalize` rather than re-implementing archive, push, or commit logic. Finalize owns the back half.
- **No destructive operations:** Closeout never force-pushes, resets, or deletes unarchived work. All file moves go through `/gsd:cleanup` (which finalize Gate 4 invokes) or `/gsd:complete-milestone` (which finalize Gate 3 invokes).
- **External plugins are optional:** `pr-review-toolkit`, `commit-commands`, and `claude-mcp-ecosystem` checks must always degrade gracefully — display `[skipped]` if missing, never error.
- **`--dry-run` is a hard contract:** Zero state mutation, zero `Skill()` calls. The dry-run path prints plan + plugin probes only.

</critical_rules>

<success_criteria>
- [ ] Argument parser handles all flags (`--mode`, `--no-audits`, `--no-verify`, `--no-ship`, `--wrap`, `--profile`, `--dry-run`) and the optional milestone positional
- [ ] Upstream-tracking preflight blocks closeout on detached HEAD or untracked branch
- [ ] Already-archived milestones fast-exit at Gate 0 with no further mutation
- [ ] `--dry-run` prints gate plan and plugin probes, runs zero `Skill()` calls
- [ ] Gate 0 runs prime-patterns, progress, stats sequentially
- [ ] Gate 1 runs six audits in cheap-to-expensive order with per-audit verdict routing
- [ ] BLOCK verdicts offer only "Resolve now" or "Stop"; FLAG verdicts add "Acknowledge and continue"
- [ ] FLAG acknowledgements are logged to `.planning/state/closeout-acks.md`
- [ ] Gate 2 runs verify-work then `gsd-tools verify`; any FAIL routes to handle_blocker
- [ ] Gate 3 auto-detects mode from STATE.md `paused_at` and `roadmap analyze` data; ambiguous state prompts the user
- [ ] Ship mode runs Gates 4a → 5 → 6 → 7 → 8; freeze mode runs Gate 4b and exits
- [ ] Gate 5 probes `pr-review-toolkit` via `installed_plugins.json`; degrades to `[skipped]` if missing
- [ ] Gate 6 probes `commit-commands`; falls back to `git remote prune origin`; optional `docker compose down` is gated on file presence + user confirmation
- [ ] Gate 7 invokes `Skill(skill="gsd:finalize")` with the milestone arg; verifies post-conditions before continuing
- [ ] Gate 8 polish steps are opt-in via `--wrap` and `--profile` flags
- [ ] `handle_blocker` offers retry-from-gate or stop with resume-hint
- [ ] All banners use the GSD ► CLOSEOUT banner style
</success_criteria>
