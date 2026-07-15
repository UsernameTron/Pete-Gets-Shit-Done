---
name: workflow:frontend-phase
description: Run a frontend/UI phase end to end with the UI lifecycle folded in — UI-SPEC design contract first, discuss, plan (gate 1 approves plan + spec together), execute, 6-pillar visual audit, verify (gate 2 accepts or routes fixes). Two gates; never pushes or ships.
---
<purpose>

Run a frontend phase end to end with the UI lifecycle folded in: design contract → discuss →
plan → execute → visual audit → verify, unattended between exactly two human gates. Frontend
phases carry two extra commands (`ui-phase` before planning, `ui-review` after execution) that
`idea-to-shipped` doesn't include — operators either forget the UI-SPEC contract or bolt the
review on late. This workflow makes both structurally impossible to skip.

This is W11 (`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`), a variant of W2 `idea-to-shipped` at the
same two-gate shape: the UI design contract is folded into GATE 1 alongside plan approval, and
the 6-pillar visual audit lands before GATE 2 alongside functional verification. Per the
project's north star — *"Automate the reversible; gate the irreversible"* — everything between
the gates writes only to the phase directory and the working branch; nothing here pushes, opens
a PR, or merges. Shipping remains a separate intent (`/gsd:ship` or the `idea-to-shipped`
tail), invoked by the operator after GATE 2 accepts the phase.

</purpose>

<process>

<step name="intake">

## 1. Intake

Extract the phase number from `$ARGUMENTS`. Accept an integer or decimal (e.g., `7` or `7.1`).

**If no phase number is present in `$ARGUMENTS`:** list the incomplete phases from
`.planning/ROADMAP.md` and prompt via **AskUserQuestion**:

```
AskUserQuestion:
  question: "Which phase is the UI work? (frontend-phase runs ui-phase → discuss → plan → execute → ui-review → verify for it)"
  options:
    - one option per incomplete phase, label "Phase {N} — {name}"
```

Set `PHASE_NUM` from the argument or the answer.

Validate the phase and load paths:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse from JSON: `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `has_context`,
`has_plans`. **If the phase is not found in the roadmap:** error with the available phase list
and exit — nothing has run yet.

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► FRONTEND-PHASE ▸ Phase ${PHASE_NUM}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Chain: ui-phase → discuss → plan → [GATE 1] → execute → ui-review → verify → [GATE 2]
```

</step>

<step name="ui_contract">

## 2. UI Design Contract (first, deliberately)

```
Skill(skill="gsd:ui-phase", args="${PHASE_NUM}")
```

`ui-phase` runs its own `gsd-ui-researcher` → `gsd-ui-checker` revision loop internally and
writes `${phase_dir}/${padded_phase}-UI-SPEC.md`. It runs FIRST — before discuss and plan — so
spacing, typography, color, copy, and design-system decisions are locked before the planner
creates tasks, not retrofitted after execution. If a UI-SPEC already exists, `ui-phase`'s own
existing-spec prompt (Update / View / Skip) handles it; "Skip" keeps the current contract and
this workflow proceeds with it.

**If `ui-phase` reports UI phase disabled in config** (`workflow.ui_phase` is `false`): stop
cleanly — this workflow is pointless without the contract. Report: "UI phase is disabled via
/gsd:settings. Enable it, or run the plain pipeline with /gsd:plan-phase ${PHASE_NUM}."

Verify the contract was written:

```bash
UI_SPEC_FILE=$(ls "${phase_dir}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

If empty → go to `handle_step_failure` with "ui-phase for phase ${PHASE_NUM} did not produce
UI-SPEC.md" and resume command `/gsd:ui-phase ${PHASE_NUM}`.

Record the checker's verdict (PASS/FLAG from `ui-phase`'s output) as `UI_SPEC_VERDICT` for the
GATE 1 prompt.

</step>

<step name="discuss">

## 3. Discuss

Execute the smart-discuss workflow from
`@$HOME/.claude/get-shit-done/workflows/smart-discuss.md` with `${PHASE_NUM} --auto` — the same
delegation `idea-to-shipped`'s discuss step uses. Under `--auto` it folds each grey area to its
recommended defaults, emits an `[auto]` receipt table, and asks only areas it cannot responsibly
default; the folded decisions still reach human review at GATE 1 through the plan built from
them. Produces `${phase_dir}/${padded_phase}-CONTEXT.md`. Because the UI-SPEC already exists,
smart-discuss reads it as prior context and does not re-ask visual decisions the contract locked.

Verify context was written:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Check `has_context`. If false → go to `handle_step_failure` with "Smart discuss for phase
${PHASE_NUM} did not produce CONTEXT.md" and resume command `/gsd:discuss-phase ${PHASE_NUM}`.

</step>

<step name="plan">

## 4. Plan

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
```

`plan-phase` runs its own internal `gsd-planner` → `gsd-verifier` (scope: plan) revision loop
(max 3 iterations) before returning — no separate plan-quality gate is added here. The planner
reads the UI-SPEC as a locked input, so tasks inherit the design contract.

Verify plans were produced — re-run `init phase-op ${PHASE_NUM}` and check `has_plans`. If false
→ go to `handle_step_failure` with "Plan phase ${PHASE_NUM} did not produce any plans" and
resume command `/gsd:plan-phase ${PHASE_NUM}`.

Gather for the gate: task count, wave count, files touched (from `PLAN.md` frontmatter under
`${phase_dir}`), and a 3–5 line summary of the UI-SPEC's locked decisions (design system,
typography, spacing scale, key components).

</step>

<step name="gate_1_approve_plan_and_spec">

## 5. GATE 1 — Approve Plan + UI Spec Together

Present the plan summary AND the UI-SPEC summary as one package — this is the single point where
the operator approves both what will be built and what it will look like. Then prompt via
**AskUserQuestion**.

**Prompt text (verbatim):** "Plan verified (N tasks, M waves, files: …) with UI contract locked (spec: {verdict}). Execute now? [Execute / Adjust scope / Stop here — keep plan and spec]"

```
AskUserQuestion:
  question: "Plan verified (N tasks, M waves, files: …) with UI contract locked (spec: {verdict}). Execute now?"
  options:
    - label: "Execute"
      description: "Begin wave-parallel execution now on the current branch, honoring the UI-SPEC"
    - label: "Adjust scope"
      description: "Revise the plan and/or the UI-SPEC before executing"
    - label: "Stop here — keep plan and spec"
      description: "End the workflow now; PLAN.md and UI-SPEC.md stay on disk, nothing executes"
```

**On "Execute":** proceed to `execute`.

**On "Adjust scope":** ask conversationally whether the adjustment is to the plan, the UI-SPEC,
or both. Re-run `ui_contract` (its Update path) and/or `plan` accordingly, then re-present this
gate.

**On "Stop here — keep plan and spec":** display:

```
Stopping per request. Plan and UI-SPEC kept at: ${phase_dir}
Resume any time with: /gsd:execute-phase ${PHASE_NUM}
```

Nothing further in this workflow runs.

</step>

<step name="execute">

## 6. Execute

```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

`--no-transition` keeps this workflow, not `execute-phase`, in control of what happens after
execution — same flag and same `Skill()`-not-`Task()` rationale as `idea-to-shipped` (avoids
nested-agent freezes from deep Task-in-Task nesting). `execute-phase` runs its wave-parallel
`gsd-executor` (worktree isolation), regression gate, and phase-goal `gsd-verifier` pass
internally.

**If execute-phase reports an executor failure mid-wave:** go to `handle_step_failure` — never
auto-debug into an unreviewed rewrite (see `<error_handling>`).

</step>

<step name="ui_review">

## 7. UI Review — 6-Pillar Visual Audit

```
Skill(skill="gsd:ui-review", args="${PHASE_NUM}")
```

`ui-review` spawns `gsd-ui-auditor` for the retroactive 6-pillar visual audit, auditing against
the UI-SPEC written in step 2 (the whole point of running the contract first: the audit has a
baseline, not abstract standards). Produces `${phase_dir}/${padded_phase}-UI-REVIEW.md` with a
score. If a prior UI-REVIEW exists, take its "Re-audit" path — this run must grade THIS
execution.

Read the audit score and top findings; record as `UI_AUDIT_RESULT` for GATE 2. A poor audit
score does not halt here — it is a decision input for GATE 2, where the operator chooses
between accepting and routing fixes. Only a hard failure (auditor produced no UI-REVIEW.md)
routes to `handle_step_failure` with resume command `/gsd:ui-review ${PHASE_NUM}`.

</step>

<step name="verify">

## 8. Verify

```
Skill(skill="gsd:verify-work", args="${PHASE_NUM}")
```

**Do not pass `--mode=schema`.** The default mode runs the schema pre-flight AND the automated
`must_have` UAT; schema-only mode would silently skip the must-have checks GATE 2 reports on —
same rationale as `idea-to-shipped`'s verify step.

Read the automated UAT results: passed / failed / manual counts. All three outcomes flow to
GATE 2 — unlike `idea-to-shipped`, this workflow does not run an automatic gap-closure cycle,
because GATE 2's "Route fixes" answer IS the gap-closure decision, made by the operator with the
UI audit and the UAT table side by side.

</step>

<step name="gate_2_accept_phase">

## 9. GATE 2 — Accept Phase or Route Fixes

Present the verification table (X/Y must-haves passed, manual items listed), the UI audit score
and top findings, and the diff stat. Then prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Phase ${PHASE_NUM} built and audited (X/Y must-haves; UI audit: {score}). Accept the phase? [Accept phase / Route fixes / Stop — leave as-is]"

```
AskUserQuestion:
  question: "Phase ${PHASE_NUM} built and audited (X/Y must-haves; UI audit: {score}). Accept the phase?"
  options:
    - label: "Accept phase"
      description: "Mark the phase done; ship later with /gsd:ship or idea-to-shipped — nothing is pushed by this workflow"
    - label: "Route fixes"
      description: "Convert the UAT failures and UI audit findings into gap plans, then stop cleanly for review"
    - label: "Stop — leave as-is"
      description: "End the workflow; all artifacts stay on disk, nothing else runs"
```

**On "Accept phase":** display the completion summary and the natural next command:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► FRONTEND-PHASE ▸ Phase ${PHASE_NUM} ACCEPTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 UI-SPEC / CONTEXT / PLAN / SUMMARY / UI-REVIEW / VERIFICATION: ${phase_dir}
 Ship when ready: /gsd:ship ${PHASE_NUM}
```

The workflow ends. Nothing was pushed; shipping is the operator's next intent.

**On "Route fixes":** report the resume path and stop cleanly — do not loop back into execution:

```
Fixes routed. Gaps from verification and the UI audit are recorded in ${phase_dir}.
Resume with: /gsd:plan-phase ${PHASE_NUM} --gaps
(then /gsd:execute-phase ${PHASE_NUM}, and re-run /gsd:ui-review ${PHASE_NUM} + /gsd:verify-work ${PHASE_NUM})
```

Stopping here rather than auto-looping keeps the fix scope a deliberate, reviewable plan — the
operator sees the gap plan before more code is written.

**On "Stop — leave as-is":** end the workflow. All artifacts remain on disk untouched.

</step>

</process>

<error_handling>

**`handle_step_failure`** — used for: `ui-phase` producing no UI-SPEC.md, smart-discuss
producing no CONTEXT.md, plan-phase producing no plans, execute-phase reporting a mid-wave
executor failure, and ui-review producing no UI-REVIEW.md.

Stop and report plainly — never auto-`/gsd:debug` into an unreviewed rewrite. Hand off via:

```
Skill(skill="gsd:pause-work")
```

`pause-work` writes `.continue-here.md` and `.planning/HANDOFF.json` with the current position,
what completed, what remains, and the specific failure. Display the handoff location, the
failing step's own resume command (named per step above), and stop the workflow.

**Rollback:** nothing in this workflow touches `main` and nothing leaves the machine — there is
no push, no PR, no merge anywhere in the chain. Rollback at any point is branch-local: discard
uncommitted changes or drop commits on the working branch. Artifacts under `${phase_dir}` are
plain committed docs; abandoning the phase leaves no remote trace.

</error_handling>

<success_criteria>
- [ ] Intake resolves `PHASE_NUM` from `$ARGUMENTS` or via AskUserQuestion before any step runs,
      and validates it against the roadmap via `gsd-tools.cjs init phase-op`
- [ ] `ui-phase` runs FIRST — before discuss and plan — and the workflow verifies
      `${phase_dir}/*-UI-SPEC.md` exists before continuing
- [ ] Discuss step invokes the extracted `get-shit-done/workflows/smart-discuss.md` workflow with
      `PHASE_NUM --auto` — not an inlined copy of its sub-steps
- [ ] Plan step invokes `gsd:plan-phase` and its internal revision loop, no separate plan-quality
      gate added on top
- [ ] Exactly TWO gates exist, mirroring `idea-to-shipped`, with the UI contract folded into
      GATE 1 — no third gate for the UI-SPEC alone
- [ ] GATE 1 carries the exact verbatim prompt text: "Plan verified (N tasks, M waves, files:
      …) with UI contract locked (spec: {verdict}). Execute now? [Execute / Adjust scope / Stop
      here — keep plan and spec]"
- [ ] Execute step invokes `gsd:execute-phase` with `--no-transition`, via `Skill()` not `Task()`
- [ ] `ui-review` runs after execution and before `verify-work`, auditing against the UI-SPEC
      from step 2; its score is a GATE 2 input, not an automatic halt
- [ ] Verify step invokes `gsd:verify-work` in default mode — `--mode=schema` is never passed
- [ ] GATE 2 carries the exact verbatim prompt text: "Phase ${PHASE_NUM} built and audited (X/Y
      must-haves; UI audit: {score}). Accept the phase? [Accept phase / Route fixes / Stop —
      leave as-is]"
- [ ] "Route fixes" at GATE 2 reports `/gsd:plan-phase ${PHASE_NUM} --gaps` as the resume
      command and stops cleanly — it does not loop back into execution
- [ ] No `git push`, `gh pr`, `gsd:ship`, or merge reference appears anywhere in the chain —
      shipping is a separate operator intent after acceptance
- [ ] Any step failure routes to stop-and-report with a `gsd:pause-work` handoff plus that
      step's own resume command — never auto-debug into an unreviewed rewrite
- [ ] Every referenced repo file path resolves on disk
</success_criteria>
