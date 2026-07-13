<purpose>

Drive all remaining milestone phases autonomously. For each incomplete phase: discuss → plan → execute using Skill() flat invocations. Pauses only for explicit user decisions (grey area acceptance, blockers, validation requests). Re-reads ROADMAP.md after each phase to catch dynamically inserted phases.

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

<step name="initialize" priority="first">

## 1. Initialize

Parse `$ARGUMENTS` for `--from N` flag:

```bash
FROM_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-from\s+[0-9]'; then
  FROM_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-from\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi
```

Bootstrap via milestone-level init:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `milestone_version`, `milestone_name`, `phase_count`, `completed_phases`, `roadmap_exists`, `state_exists`, `commit_docs`.

**If `roadmap_exists` is false:** Error — "No ROADMAP.md found. Run `/gsd:new-milestone` first."
**If `state_exists` is false:** Error — "No STATE.md found. Run `/gsd:new-milestone` first."

Display startup banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Phases: {phase_count} total, {completed_phases} complete
```

If `FROM_PHASE` is set, display: `Starting from phase ${FROM_PHASE}`

</step>

<step name="discover_phases">

## 2. Discover Phases

Run phase discovery:

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

Parse the JSON `phases` array.

**Filter to incomplete phases:** Keep only phases where `disk_status !== "complete"` OR `roadmap_complete === false`.

**Apply `--from N` filter:** If `FROM_PHASE` was provided, additionally filter out phases where `number < FROM_PHASE` (use numeric comparison — handles decimal phases like "5.1").

**Sort by `number`** in numeric ascending order.

**If no incomplete phases remain:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phases complete! Nothing left to do.
```

Exit cleanly.

**Display phase plan:**

```
## Phase Plan

| # | Phase | Status |
|---|-------|--------|
| 5 | Skill Scaffolding & Phase Discovery | In Progress |
| 6 | Smart Discuss | Not Started |
| 7 | Auto-Chain Refinements | Not Started |
| 8 | Lifecycle Orchestration | Not Started |
```

**Fetch details for each phase:**

```bash
DETAIL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase ${PHASE_NUM})
```

Extract `phase_name`, `goal`, `success_criteria` from each. Store for use in execute_phase and transition messages.

</step>

<step name="execute_phase">

## 3. Execute Phase

For the current phase, display the progress banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ Phase {N}/{T}: {Name} [████░░░░] {P}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Where N = current phase number (from the ROADMAP, e.g., 6), T = total milestone phases (from `phase_count` parsed in initialize step, e.g., 8), P = percentage of all milestone phases completed so far. Calculate P as: (number of phases with `disk_status` "complete" from the latest `roadmap analyze` / T × 100). Use █ for filled and ░ for empty segments in the progress bar (8 characters wide).

**3a. Smart Discuss**

Check if CONTEXT.md already exists for this phase:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Parse `has_context` from JSON.

**If has_context is true:** Skip discuss — context already gathered. Display:

```
Phase ${PHASE_NUM}: Context exists — skipping discuss.
```

Proceed to 3b.

**If has_context is false:** Check if discuss is disabled via settings:

```bash
SKIP_DISCUSS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.skip_discuss 2>/dev/null || echo "false")
```

**If SKIP_DISCUSS is `true`:** Skip discuss entirely — the ROADMAP phase description is the spec. Display:

```
Phase ${PHASE_NUM}: Discuss skipped (workflow.skip_discuss=true) — using ROADMAP phase goal as spec.
```

Write a minimal CONTEXT.md so downstream plan-phase has valid input. Get phase details:

```bash
DETAIL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase ${PHASE_NUM})
```

Extract `goal` and `requirements` from JSON. Write `${phase_dir}/${padded_phase}-CONTEXT.md` with:

```markdown
# Phase {PHASE_NUM}: {Phase Name} - Context

**Gathered:** {date}
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

{goal from ROADMAP phase description}

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — discuss phase skipped. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
```

Commit the minimal context:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${PADDED_PHASE}): auto-generated context (discuss skipped)" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```

Proceed to 3b.

**If SKIP_DISCUSS is `false` (or unset):** Execute the smart_discuss step for this phase.

After smart_discuss completes, verify context was written:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Check `has_context`. If false → go to handle_blocker: "Smart discuss for phase ${PHASE_NUM} did not produce CONTEXT.md."

**3b. Plan**

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
```

Verify plan produced output — re-run `init phase-op` and check `has_plans`. If false → go to handle_blocker: "Plan phase ${PHASE_NUM} did not produce any plans."

**3c. Execute**

```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

**3d. Post-Execution Routing**

After execute-phase returns, read the verification result:

```bash
VERIFY_STATUS=$(grep "^status:" "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

Where `PHASE_DIR` comes from the `init phase-op` call already made in step 3a. If the variable is not in scope, re-fetch:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Parse `phase_dir` from the JSON.

**If VERIFY_STATUS is empty** (no VERIFICATION.md or no status field):

Go to handle_blocker: "Execute phase ${PHASE_NUM} did not produce verification results."

**If `passed`:**

Display:
```
Phase ${PHASE_NUM} ✅ ${PHASE_NAME} — Verification passed
```

Proceed to iterate step.

**If `human_needed`:**

Read the human_verification section from VERIFICATION.md to get the count and items requiring manual testing.

Display the items, then ask user via AskUserQuestion:
- **question:** "Phase ${PHASE_NUM} has items needing manual verification. Validate now or continue to next phase?"
- **options:** "Validate now" / "Continue without validation"

On **"Validate now"**: Present the specific items from VERIFICATION.md's human_verification section. After user reviews, ask:
- **question:** "Validation result?"
- **options:** "All good — continue" / "Found issues"

On "All good — continue": Display `Phase ${PHASE_NUM} ✅ Human validation passed` and proceed to iterate step.

On "Found issues": Go to handle_blocker with the user's reported issues as the description.

On **"Continue without validation"**: Display `Phase ${PHASE_NUM} ⏭ Human validation deferred` and proceed to iterate step.

**If `gaps_found`:**

Read gap summary from VERIFICATION.md (score and missing items). Display:
```
⚠ Phase ${PHASE_NUM}: ${PHASE_NAME} — Gaps Found
Score: {N}/{M} must-haves verified
```

Ask user via AskUserQuestion:
- **question:** "Gaps found in phase ${PHASE_NUM}. How to proceed?"
- **options:** "Run gap closure" / "Continue without fixing" / "Stop autonomous mode"

On **"Run gap closure"**: Execute gap closure cycle (limit: 1 attempt):

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --gaps")
```

Verify gap plans were created — re-run `init phase-op ${PHASE_NUM}` and check `has_plans`. If no new gap plans → go to handle_blocker: "Gap closure planning for phase ${PHASE_NUM} did not produce plans."

Re-execute:
```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

Re-read verification status:
```bash
VERIFY_STATUS=$(grep "^status:" "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

If `passed` or `human_needed`: Route normally (continue or ask user as above).

If still `gaps_found` after this retry: Display "Gaps persist after closure attempt." and ask via AskUserQuestion:
- **question:** "Gap closure did not fully resolve issues. How to proceed?"
- **options:** "Continue anyway" / "Stop autonomous mode"

On "Continue anyway": Proceed to iterate step.
On "Stop autonomous mode": Go to handle_blocker.

This limits gap closure to 1 automatic retry to prevent infinite loops.

On **"Continue without fixing"**: Display `Phase ${PHASE_NUM} ⏭ Gaps deferred` and proceed to iterate step.

On **"Stop autonomous mode"**: Go to handle_blocker with "User stopped — gaps remain in phase ${PHASE_NUM}".

</step>

<step name="smart_discuss">

## Smart Discuss

Execute the smart-discuss workflow from @$HOME/.claude/get-shit-done/workflows/smart-discuss.md with `${PHASE_NUM}` — append `--auto` when config `mode` is `yolo` or `workflow._auto_chain_active` is `true` (smart-discuss also derives auto context itself from config; passing the flag keeps the chain explicit). That workflow proposes grey area answers in batch tables — the user accepts or overrides per area; in auto mode it accepts recommended defaults with an `[auto]` receipt table and asks only unresolvable areas — and produces identical CONTEXT.md output to regular discuss-phase.

> **Note (CTRL-03):** Smart discuss is an autonomous-optimized variant of the `gsd:discuss-phase` skill. It produces identical CONTEXT.md output but uses batch table proposals instead of sequential questioning. The original `discuss-phase` skill remains unchanged. The full sub-step implementation (load prior context, scout codebase, analyze phase and generate proposals, present proposals per area, write CONTEXT.md) has been extracted to `get-shit-done/workflows/smart-discuss.md` — this step is now a thin caller. `get-shit-done/workflows/idea-to-shipped.md` invokes the same extracted workflow directly as a second caller.

**Inputs:** `PHASE_NUM` from execute_phase — pass it through as the sole argument to smart-discuss.md (plus `--auto` per the rule above). That workflow re-derives `phase_dir`, `phase_slug`, `padded_phase`, and `phase_name` itself via its own `init phase-op ${PHASE_NUM}` call, so no additional handoff is required here. Interactive runs are unchanged: grey-area acceptance still pauses per CTRL-01; the auto fold applies only when yolo mode or an active `--auto` chain already sanctions auto-approval.

</step>

<step name="iterate">

## 4. Iterate

After each phase completes, re-read ROADMAP.md to catch phases inserted mid-execution (decimal phases like 5.1):

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

Re-filter incomplete phases using the same logic as discover_phases:
- Keep phases where `disk_status !== "complete"` OR `roadmap_complete === false`
- Apply `--from N` filter if originally provided
- Sort by number ascending

Read STATE.md fresh:

```bash
cat .planning/STATE.md
```

Check for blockers in the Blockers/Concerns section. If blockers are found, go to handle_blocker with the blocker description.

If incomplete phases remain: proceed to next phase, loop back to execute_phase.

If all phases complete, proceed to lifecycle step.

</step>

<step name="lifecycle">

## 5. Lifecycle

After all phases complete, run the milestone lifecycle sequence: audit → complete → cleanup.

Display lifecycle transition banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ LIFECYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phases complete → Starting lifecycle: audit → complete → cleanup
 Milestone: {milestone_version} — {milestone_name}
```

**5a. Audit**

```
Skill(skill="gsd:audit-milestone")
```

After audit completes, detect the result:

```bash
AUDIT_FILE=".planning/v${milestone_version}-MILESTONE-AUDIT.md"
AUDIT_STATUS=$(grep "^status:" "${AUDIT_FILE}" 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

**If AUDIT_STATUS is empty** (no audit file or no status field):

Go to handle_blocker: "Audit did not produce results — audit file missing or malformed."

**If `passed`:**

Display:
```
Audit ✅ passed — proceeding to complete milestone
```

Proceed to 5b (no user pause — per CTRL-01).

**If `gaps_found`:**

Read the gaps summary from the audit file. Display:
```
⚠ Audit: Gaps Found
```

Ask user via AskUserQuestion:
- **question:** "Milestone audit found gaps. How to proceed?"
- **options:** "Continue anyway — accept gaps" / "Stop — fix gaps manually"

On **"Continue anyway"**: Display `Audit ⏭ Gaps accepted — proceeding to complete milestone` and proceed to 5b.

On **"Stop"**: Go to handle_blocker with "User stopped — audit gaps remain. Run /gsd:audit-milestone to review, then /gsd:complete-milestone when ready."

**If `tech_debt`:**

Read the tech debt summary from the audit file. Display:
```
⚠ Audit: Tech Debt Identified
```

Show the summary, then ask user via AskUserQuestion:
- **question:** "Milestone audit found tech debt. How to proceed?"
- **options:** "Continue with tech debt" / "Stop — address debt first"

On **"Continue with tech debt"**: Display `Audit ⏭ Tech debt acknowledged — proceeding to complete milestone` and proceed to 5b.

On **"Stop"**: Go to handle_blocker with "User stopped — tech debt to address. Run /gsd:audit-milestone to review details."

**5b. Complete Milestone**

```
Skill(skill="gsd:complete-milestone", args="${milestone_version}")
```

After complete-milestone returns, verify it produced output:

```bash
ls .planning/milestones/v${milestone_version}-ROADMAP.md 2>/dev/null || true
```

If the archive file does not exist, go to handle_blocker: "Complete milestone did not produce expected archive files."

**5c. Cleanup**

```
Skill(skill="gsd:cleanup")
```

Cleanup shows its own dry-run and asks user for approval internally — this is an acceptable pause per CTRL-01 since it's an explicit decision about file deletion.

**5d. Final Completion**

Display final completion banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Status: Complete ✅
 Lifecycle: audit ✅ → complete ✅ → cleanup ✅

 Ship it! 🚀
```

</step>

<step name="handle_blocker">

## 6. Handle Blocker

When any phase operation fails or a blocker is detected, present 3 options via AskUserQuestion:

**Prompt:** "Phase {N} ({Name}) encountered an issue: {description}"

**Options:**
1. **"Fix and retry"** — Re-run the failed step (discuss, plan, or execute) for this phase
2. **"Skip this phase"** — Mark phase as skipped, continue to the next incomplete phase
3. **"Stop autonomous mode"** — Display summary of progress so far and exit cleanly

**On "Fix and retry":** Loop back to the failed step within execute_phase. If the same step fails again after retry, re-present these options.

**On "Skip this phase":** Log `Phase {N} ⏭ {Name} — Skipped by user` and proceed to iterate.

**On "Stop autonomous mode":** Display progress summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ STOPPED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Completed: {list of completed phases}
 Skipped: {list of skipped phases}
 Remaining: {list of remaining phases}

 Resume with: /gsd:autonomous --from {next_phase}
```

</step>

</process>

<success_criteria>
- [ ] All incomplete phases executed in order (smart discuss → plan → execute each)
- [ ] Smart discuss proposes grey area answers in tables, user accepts or overrides per area
- [ ] Progress banners displayed between phases
- [ ] Execute-phase invoked with --no-transition (autonomous manages transitions)
- [ ] Post-execution verification reads VERIFICATION.md and routes on status
- [ ] Passed verification → automatic continue to next phase
- [ ] Human-needed verification → user prompted to validate or skip
- [ ] Gaps-found → user offered gap closure, continue, or stop
- [ ] Gap closure limited to 1 retry (prevents infinite loops)
- [ ] Plan-phase and execute-phase failures route to handle_blocker
- [ ] ROADMAP.md re-read after each phase (catches inserted phases)
- [ ] STATE.md checked for blockers before each phase
- [ ] Blockers handled via user choice (retry / skip / stop)
- [ ] Final completion or stop summary displayed
- [ ] After all phases complete, lifecycle step is invoked (not manual suggestion)
- [ ] Lifecycle transition banner displayed before audit
- [ ] Audit invoked via Skill(skill="gsd:audit-milestone")
- [ ] Audit result routing: passed → auto-continue, gaps_found → user decides, tech_debt → user decides
- [ ] Audit technical failure (no file/no status) routes to handle_blocker
- [ ] Complete-milestone invoked via Skill() with ${milestone_version} arg
- [ ] Cleanup invoked via Skill() — internal confirmation is acceptable (CTRL-01)
- [ ] Final completion banner displayed after lifecycle
- [ ] Progress bar uses phase number / total milestone phases (not position among incomplete)
- [ ] Smart discuss documents relationship to discuss-phase with CTRL-03 note
</success_criteria>
