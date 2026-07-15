---
name: workflow:quality-sweep
description: Audit the whole project in one read-only sweep — planning health, outstanding UAT, dependency CVEs, agent ecosystem, and validation gaps — presented as one severity-ordered report. One gate guarding the only mutation (applying repairs); pass --deep to add the ecosystem checkup group.
---
<trigger>
Use when:
- User runs /gsd:do with intent "audit everything" | "quality sweep" | "health check the project"
- User asks "what's broken?" across the whole project rather than one surface
- With `--deep`: "ecosystem checkup" | "agent health" | "infrastructure audit" (W14, folded in here)
</trigger>

<purpose>
Run every read-only audit surface GSD has — planning-directory health, outstanding UAT,
dependency CVEs, agent-ecosystem integrity, and Nyquist validation gaps for the last executed
phase — as one sweep, then present ONE consolidated findings report ordered by severity. With
`--deep`, the ecosystem group (crew self-assessment, agent status, ecosystem-map dry run,
project stats) joins the sweep; this is W14 `ecosystem-checkup` folded into W10 as a flag
(`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`).

This is W10 at the read-only end of the north star — *"Automate the reversible; gate the
irreversible"* (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`): every finding step is read-only, so
none of them gate. Exactly ONE gate exists, and it guards the only mutation: applying repairs.
Declining the gate costs nothing — the report and its remediation command list stand on their own.

**Ideal weekly scheduled-run candidate:** findings-only, zero mutation risk before the gate. A
scheduled run that ends at the gate unanswered has still done its whole job.

Run individually, these five audits get skipped; run as one sweep, they become a habit.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-dependency-auditor — Dependency CVE/staleness/license audit (spawned by the audit-deps leg)
- gsd-ecosystem-auditor — Agent roster frontmatter/hygiene/drift audit (spawned by the audit-agents leg)
</available_agent_types>

<process>

<step name="parse_args">
Parse `$ARGUMENTS`:

- `--deep` present → set `DEEP=true` (adds the ecosystem group, step `deep_group`). Default `false`.
- Any other argument: warn and ignore (same tolerance as `audit-deps.md` / `audit-agents.md`).
</step>

<step name="resolve_scope">
Display banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► QUALITY-SWEEP{ ▸ DEEP if --deep}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Resolve the last executed phase — "executed" means a SUMMARY exists on disk, which is exactly
what `validate-phase.md`'s own State B detection keys on:

```bash
LAST_EXECUTED=$(ls .planning/phases/*/*-SUMMARY.md 2>/dev/null \
  | sed -E 's|^\.planning/phases/([0-9]+(\.[0-9]+)?)-.*|\1|' | sort -V | tail -1)
```

Cross-check against `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state get` — if
STATE.md names a current phase with summaries that the scan missed, prefer the scan (the disk
is ground truth; a STATE.md mismatch is itself a finding for the report, surfaced as a warning).

If `LAST_EXECUTED` is empty: the validate-phase leg is skipped and recorded in the report as
`validate-phase: skipped — no executed phase found`. All other legs still run.
</step>

<step name="spawn_parallel_audits">
The two agent-backed audits are independent and read-only — spawn BOTH in a single message so
they run in parallel while the inline legs execute.

This step composes the orchestration of `commands/gsd/audit-deps.md` and
`commands/gsd/audit-agents.md` with their `--no-commit --quiet` behavior: no branch is created,
no report is committed, no SUMMARY block is echoed mid-sweep — verdicts surface once, in the
consolidated report. Their pre-flight short-circuits are kept: skip the deps leg (recorded as
`skipped — no supported package manifest`) if no manifest from the set
`package.json, pnpm-lock.yaml, pyproject.toml, requirements.txt, Cargo.toml, go.mod, Gemfile, composer.json`
globs; skip the agents leg (recorded as `skipped — no agents/gsd-*.md roster`) if `agents/`
has no `gsd-*.md` files.

**Task 1 — gsd-dependency-auditor** (prompt per `audit-deps.md` Step 2):

```
Perform a full dependency audit of the current working directory.

<files_to_read>
(list every manifest file found above)
</files_to_read>

Audit scope: security (CVEs), staleness (stale/outdated prod deps), licenses.

Write your structured report to `.planning/dependencies/DEPENDENCIES-REPORT.md` following the
format specified in your role instructions. Echo the SUMMARY block to stdout.

Respect all rules in your <anti_patterns> section. Specifically: no minor-version upsells, no
invented CVE numbers, no file modifications outside the single report file.
```

**Task 2 — gsd-ecosystem-auditor** (prompt per `audit-agents.md` Step 2):

```
Perform a full ecosystem audit of the GSD agent roster in the current working directory.

Audit scope: frontmatter schema, tool/permission consistency, hygiene compliance, description
quality, naming collisions, install drift.

Source directory: ./agents/
Installed directory: ~/.claude/agents/

Write your structured report to .planning/ecosystem/ECOSYSTEM-REPORT.md following the format
specified in your role instructions. Echo the SUMMARY block to stdout.

Respect all rules in your anti_patterns section. Specifically: no file modifications outside
the single report file, no roster-composition opinions, no hedged verdicts.
```
</step>

<step name="run_inline_audits">
While the two auditors run, execute the three CLI-backed legs inline — they are direct
gsd-tools calls with no spawn cost.

**Health (read-only — deliberately WITHOUT `--repair`; repair belongs behind the gate):**

```bash
HEALTH=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health)
```

Parse per `health.md`: `status` (healthy/degraded/broken), `errors[]`, `warnings[]`, `info[]`,
`repairable_count`. Hold `repairable_count` for the gate prompt.

**UAT audit** (per `audit-uat.md`'s `initialize` step):

```bash
UAT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" audit-uat --raw)
```

Parse `summary` and `results`. `summary.total_items` of 0 is a clean PASS for this leg. For
non-zero items, apply `audit-uat.md`'s categorization: Testable Now vs Needs Prerequisites vs
stale (Grep/Read spot-check that referenced features still exist).

**Validation gap analysis for phase `${LAST_EXECUTED}`** — run `validate-phase.md` Steps 0–3
ONLY (initialize, detect input state, discovery, gap analysis). Do NOT proceed into its Step 4
AskUserQuestion or Step 5 gap-filling spawn: this sweep has exactly one gate, and it is not
that one. Gap-filling is offered as a remediation command instead. Its own guards carry over:
if `workflow.nyquist_validation` config is `false`, record `validate-phase: skipped — Nyquist
validation disabled` (not an error); State C (no summaries) cannot occur here because
`resolve_scope` already required one. Output of this leg: the COVERED/PARTIAL/MISSING
classification table.
</step>

<step name="collect_and_verify">
Verify the delegated legs actually produced their artifacts (never trust a spawn silently —
same contract as `audit-deps.md`/`audit-agents.md` Step 3):

```bash
test -f .planning/dependencies/DEPENDENCIES-REPORT.md && echo "deps report exists" || echo "deps report missing"
test -f .planning/ecosystem/ECOSYSTEM-REPORT.md && echo "eco report exists" || echo "eco report missing"
```

A missing report means that auditor failed: print its response text verbatim and record the leg
in the consolidated report as `SEVERITY: ERROR — audit leg failed` with the standalone command
to re-run it (`/gsd:audit-deps --no-commit` / `/gsd:audit-agents --no-commit`). A failed
read-only leg degrades to a finding rather than aborting the sweep — the sweep's job is to
report what is broken, and a broken audit is itself a finding. (The remediation step after the
gate is the opposite: it fails loud and stops — see `error_handling`.)

Extract verdicts from the reports that exist:

```bash
grep -m1 "^Overall verdict:" .planning/dependencies/DEPENDENCIES-REPORT.md | awk '{print $3}'
grep -m1 "^Overall verdict:" .planning/ecosystem/ECOSYSTEM-REPORT.md | awk '{print $3}'
```

Per those commands' own anti-patterns: use only the SUMMARY content, never parse DETAILED
FINDINGS for tooling decisions. Reports stay uncommitted — committing is the operator's call
after the sweep.
</step>

<step name="deep_group" condition="DEEP=true">
Skip this step entirely unless `--deep` was passed. All four legs are read-only with respect to
project state (crew `--assess` writes only its own diagnostic report file).

1. **Crew self-assessment** — `Skill(skill="gsd:crew", args="--assess")`. Diagnostic-only by
   its own contract (`crew.md`: reports findings to `.planning/CREW-ASSESSMENT.md`, proposes
   nothing). Fold its COVERAGE / OVERLAPS / QUALITY / BOTTLENECKS findings into the
   consolidated report.
2. **Agent status** — attempt the `/agent-status` session command (claude-mcp-ecosystem
   plugin). This command may not be installed: if unavailable, record
   `agent-status: unavailable — claude-mcp-ecosystem plugin not installed` and continue.
   **Non-fatal by design.**
3. **Ecosystem map, dry run** — execute
   `@$HOME/.claude/get-shit-done/workflows/ecosystem-map.md` with `--dry-run`: prints the
   drift table and per-cluster counts, writes NOTHING (its own `write_outputs` step stops on
   `--dry-run`). Do NOT pass `--exec` — the exec one-pager is a publishing artifact, not an
   audit. Fold the drift table (especially non-zero Δ rows and doc-claim drift) into the report.
4. **Stats** — per `stats.md`:

   ```bash
   STATS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" stats json)
   if [[ "$STATS" == @file:* ]]; then STATS=$(cat "${STATS#@file:}"); fi
   ```

   Stats carry no severity — they are the context header of the deep section, not findings.
</step>

<step name="consolidated_report">
Present ONE report, ordered strictly by severity — a reader who stops after the first section
has seen everything blocking:

```
## Quality Sweep — {date}{ (deep) if --deep}

**Scope:** health, UAT, dependencies, agents, validation (phase {LAST_EXECUTED}){ + ecosystem group if --deep}

### BLOCKING ({count})
| # | Source | Finding | Remediation |
|---|--------|---------|-------------|
(health errors[]; BLOCK verdicts from deps/agents; MISSING validation for security-critical
requirements; failed audit legs)

### WARNINGS ({count})
| # | Source | Finding | Remediation |
|---|--------|---------|-------------|
(health warnings[]; FLAG verdicts; UAT items testable now; PARTIAL/MISSING validation gaps;
crew overlaps/gaps and non-zero map drift if --deep)

### INFO ({count})
(health info[]; UAT items needing prerequisites; stale UAT items; stats context if --deep)

### Skipped legs
(each with its one-line reason)

---
**Verdicts:** health {status} · uat {N outstanding} · deps {PASS/FLAG/BLOCK} · agents {PASS/FLAG/BLOCK} · validation {N gaps}
```

Every remediation cell names the exact standalone command: `/gsd:health --repair`,
`/gsd:verify-work {phase}`, `/gsd:add-tests {LAST_EXECUTED}`, `/gsd:validate-phase
{LAST_EXECUTED}`, `/gsd:audit-deps`, `/gsd:audit-agents`, `/agent-diagnose` (deep findings).

If every section is empty: report "Quality sweep clean — nothing outstanding on any surface."
and END the workflow here. Do not present the gate — there is nothing to repair, and a gate
with no mutation behind it is noise.
</step>

<step name="gate_apply_repairs">
The single gate. Nothing before this step has mutated anything; everything after it does.

**Prompt text (verbatim):** "Sweep found {B} blocking / {W} warnings ({repairable_count} auto-repairable; {G} validation gaps). Apply repairs? [Apply repairs / No — keep the report]"

```
AskUserQuestion:
  question: "Sweep found {B} blocking / {W} warnings ({repairable_count} auto-repairable; {G} validation gaps). Apply repairs?"
  options:
    - label: "Apply repairs"
      description: "Run /gsd:health --repair now (auto-fixable planning issues only), then surface /gsd:add-tests for validation gaps"
    - label: "No — keep the report"
      description: "Stop here. The report and its remediation command list stand as-is; nothing is modified"
```

**If "No — keep the report":** stop. Re-print the remediation command list compactly (one
command per line) so it survives as the last thing on screen. The sweep is complete.
</step>

<step name="apply_repairs">
Runs only on "Apply repairs".

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health --repair
```

Report `repairs_performed[]`, then verify — re-run WITHOUT `--repair` exactly as `health.md`'s
`verify_repairs` step does, and confirm the repaired issues no longer appear:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health
```

Repair covers only what `health.md`'s repair-actions table allows (config creation/reset,
STATE.md regeneration, nyquist key). Everything else stays manual — the sweep never auto-fixes
BLOCK verdicts from the deps or agents legs (their own commands forbid it: "This command
reports; it does not remediate").

**Coverage/validation gaps:** if the validation leg found PARTIAL or MISSING requirements,
offer the follow-up explicitly (offer, not execute — test generation is its own workflow with
its own gate):

```
Validation gaps remain for phase {LAST_EXECUTED} ({G} requirements uncovered).
▶ Next: /gsd:add-tests {LAST_EXECUTED}   (or /gsd:validate-phase {LAST_EXECUTED} to gap-fill via gsd-verifier)
```

Close with the final health status line and the report location(s):
`.planning/dependencies/DEPENDENCIES-REPORT.md`, `.planning/ecosystem/ECOSYSTEM-REPORT.md`
(uncommitted), `.planning/CREW-ASSESSMENT.md` if `--deep`.
</step>

</process>

<error_handling>
**If `.planning/` does not exist:** the health leg will report E001 — present that alone with
"Run /gsd:new-project to initialize." and stop; every other leg presumes GSD state.

**If a read-only audit leg fails** (auditor spawn dies, CLI call errors, report file missing):
degrade to a `SEVERITY: ERROR` finding in the consolidated report with the leg's standalone
re-run command — never abort the sweep for one broken leg, and never fabricate a verdict for
it. The other legs' findings are still real.

**If `/agent-status` is unavailable** (`--deep` only): record and continue — non-fatal, see
`deep_group`.

**If `validate health --repair` fails AFTER the gate:** stop immediately and fail loud — the
mutation path gets no degrade-and-continue. Report which repairs (if any) were performed before
the failure, and give the resume command: `/gsd:health --repair` standalone.

**If both auditor Task spawns fail AND all inline legs error:** nothing was audited — stop and
report plainly: "Quality sweep could not run any leg." with the five standalone commands so the
operator can bisect which surface is broken.
</error_handling>

<success_criteria>
- [ ] All five core legs ran or were individually recorded as skipped with a reason
- [ ] Both auditor spawns were verified by report-file existence, never trusted silently
- [ ] validate-phase leg stopped at gap analysis — its Step 4 gate and Step 5 spawn never ran
- [ ] `--deep` added the ecosystem group; `/agent-status` unavailability handled non-fatally;
      ecosystem-map ran with `--dry-run` and wrote nothing; `--exec` never passed
- [ ] Exactly ONE consolidated report, ordered BLOCKING → WARNINGS → INFO, every finding with a
      remediation command
- [ ] Exactly ONE gate, presented only when findings exist; zero mutations before it
- [ ] On approval: `--repair` ran, was re-verified without `--repair`, and `/gsd:add-tests` was
      offered for validation gaps; on decline: report kept, nothing modified
- [ ] Audit report files left uncommitted for the operator's review
</success_criteria>
