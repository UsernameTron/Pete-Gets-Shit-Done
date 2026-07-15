---
name: workflow:hardened-plan
description: Plan a high-stakes phase with cross-AI review baked in — batch discuss, surface assumptions (gate 1 confirms them and consents to the external send), plan, external peer review, replan with feedback folded in (gate 2 approves). Two gates; planning only — never executes, pushes, or ships.
---
<purpose>

Plan a high-stakes phase with cross-AI review baked in: batch discuss → surface assumptions →
plan → external peer review → replan with feedback folded in, unattended between exactly two
human gates. The review loop (`plan` → `/gsd:review --all` → `plan-phase --reviews`) already
exists as primitives, but nobody remembers the replan flag — for phases that matter, it should
be one intent.

This is W12 (`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`). It is a planning workflow: it produces
an approved, review-hardened PLAN.md and stops. It never executes, pushes, or ships anything.

**Safety contract — the external send is gated.** `.planning/GSD-AUTONOMOUS-WORKFLOWS.md`
("Would NOT automate yet", item 2) forbids any auto-chain into `/gsd:review`'s external CLIs,
because `review` sends plan content to whatever AI CLIs are installed (gemini / claude / codex)
with no gate of its own (`review.md`'s `invoke_reviewers` step). This workflow therefore makes
GATE 1 do double duty: confirming the assumptions ALSO explicitly consents to the external send,
disclosed in the gate's own prompt text. Nothing leaves the machine for an external CLI before
GATE 1 resolves to "Confirm". The workflow stays at exactly two gates — consent is folded into
GATE 1's wording, never added as a third gate.

</purpose>

<process>

<step name="intake">

## 1. Intake

Extract the phase number from `$ARGUMENTS`. Accept an integer or decimal (e.g., `7` or `7.1`).

**If no phase number is present in `$ARGUMENTS`:** list the unplanned phases from
`.planning/ROADMAP.md` and prompt via **AskUserQuestion**:

```
AskUserQuestion:
  question: "Which phase gets the hardened plan? (discuss → assumptions → plan → cross-AI review → replan)"
  options:
    - one option per unplanned phase, label "Phase {N} — {name}"
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
 GSD ► HARDENED-PLAN ▸ Phase ${PHASE_NUM}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Chain: discuss --batch → assumptions → [GATE 1: confirm + consent to external review]
        → plan → review --all → plan --reviews → [GATE 2: approve final plan]

 Note: after GATE 1, plan content will be sent to external AI CLIs for review.
```

</step>

<step name="discuss">

## 2. Discuss (batch mode)

```
Skill(skill="gsd:discuss-phase", args="${PHASE_NUM} --batch")
```

`--batch` groups the context questions into one turn of 2–5 numbered questions instead of
sequential single questions — the right shape for an operator who chose the careful pipeline:
one focused Q&A pass, full attention, minimal round trips. Produces
`${phase_dir}/${padded_phase}-CONTEXT.md`.

Verify context was written:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Check `has_context`. If false → go to `handle_step_failure` with "discuss-phase for phase
${PHASE_NUM} did not produce CONTEXT.md" and resume command
`/gsd:discuss-phase ${PHASE_NUM} --batch`.

</step>

<step name="assumptions">

## 3. Surface Assumptions

```
Skill(skill="gsd:list-phase-assumptions", args="${PHASE_NUM}")
```

`list-phase-assumptions` is ANALYSIS of what Claude thinks, not intake of what the operator
knows — it produces no file, only a conversational assumptions list (approach, scope, technical
choices, integration points, each with confidence). This is the cheap early redirect: a wrong
assumption corrected here costs one message; the same assumption corrected after planning costs
a full replan, and after cross-AI review it costs external tokens too.

Hold the assumptions list on screen for GATE 1. Set `ASSUMPTION_RETRY=0`.

</step>

<step name="gate_1_confirm_and_consent">

## 4. GATE 1 — Assumptions Correct? (+ Consent to External Send)

Present the assumptions list, then prompt via **AskUserQuestion**. This gate carries two
decisions in one prompt by design: (1) are the assumptions right, and (2) consent to sending
plan content off-machine — because everything after this gate, through GATE 2, runs unattended,
and `/gsd:review` performs an ungated external send the moment it is invoked
(`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`, "Would NOT automate yet" item 2). Confirming here is
the operator's explicit consent to that send. Keeping consent inside GATE 1 keeps the workflow
at exactly two gates.

**Prompt text (verbatim):** "Assumptions above — correct? Confirming also approves the next step: the plan will be sent to external AI CLIs (gemini/claude/codex — whichever are installed) for cross-AI review. [Confirm — plan and send for review / Correct assumptions / Stop here]"

```
AskUserQuestion:
  question: "Assumptions above — correct? Confirming also approves the next step: the plan will be sent to external AI CLIs (gemini/claude/codex — whichever are installed) for cross-AI review."
  options:
    - label: "Confirm — plan and send for review"
      description: "Assumptions are right; plan the phase, then send plan content to the installed external AI CLIs for review"
    - label: "Correct assumptions"
      description: "Tell me what's wrong; I fold corrections into the phase context and re-derive assumptions once"
    - label: "Stop here"
      description: "End the workflow; CONTEXT.md stays on disk, nothing is planned or sent anywhere"
```

**On "Confirm — plan and send for review":** proceed to `plan`. This answer is the sole
authorization for the `review` step's external send.

**On "Correct assumptions":** gather the corrections conversationally, append them to
`${phase_dir}/${padded_phase}-CONTEXT.md` under its decisions section (commit via
`gsd-tools.cjs commit` with `--files` scoping, matching how discuss-phase commits context), then:

- If `ASSUMPTION_RETRY` is `0`: set it to `1`, re-run the `assumptions` step against the updated
  context, and re-present this gate once.
- If `ASSUMPTION_RETRY` is already `1` and the assumptions are still wrong: stop cleanly —
  repeated misreads mean the phase context itself needs rework, not another loop. Report:
  "Assumptions still off after one correction pass. Context kept at ${phase_dir}. Rework it with
  /gsd:discuss-phase ${PHASE_NUM} --batch, then restart hardened-plan." Nothing has been planned
  and nothing has been sent externally.

**On "Stop here":** end the workflow. CONTEXT.md stays; no plan exists, no external send ever
happened.

</step>

<step name="plan">

## 5. Plan (first pass)

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
```

`plan-phase` runs its own internal `gsd-planner` → `gsd-verifier` (scope: plan) revision loop
(max 3 iterations) before returning. This first-pass plan is the artifact the external reviewers
will grade.

Verify plans were produced — re-run `init phase-op ${PHASE_NUM}` and check `has_plans`. If false
→ go to `handle_step_failure` with "Plan phase ${PHASE_NUM} did not produce any plans" and
resume command `/gsd:plan-phase ${PHASE_NUM}`.

</step>

<step name="review">

## 6. Cross-AI Review (the external send GATE 1 authorized)

```
Skill(skill="gsd:review", args="${PHASE_NUM} --all")
```

`--all` includes every available external CLI (`review.md` detects gemini / claude / codex and
skips the current runtime to preserve independence). This step sends the phase's plan content
off-machine — it runs here, and only here, strictly after GATE 1 resolved to "Confirm". Each
reviewer returns structured feedback; `review` combines them into
`${phase_dir}/${padded_phase}-REVIEWS.md`.

Verify the review artifact exists:

```bash
REVIEWS_FILE=$(ls "${phase_dir}"/*-REVIEWS.md 2>/dev/null | head -1)
```

**If empty** (no external CLIs installed — `review` exits with install instructions — or every
CLI invocation failed): go to `handle_step_failure` with "Cross-AI review for phase ${PHASE_NUM}
produced no REVIEWS.md" and resume commands `/gsd:review ${PHASE_NUM} --all` then
`/gsd:plan-phase ${PHASE_NUM} --reviews`. Do NOT fall through to GATE 2 with the un-reviewed
first-pass plan — an unhardened plan presented by the hardened workflow would be a silent
failure. The first-pass plan stays on disk; the operator can still use it deliberately via
`/gsd:plan-phase` directly.

Record for GATE 2: which CLIs reviewed, and the count of CRITICAL / IMPORTANT / MINOR findings
from the REVIEWS.md verdict summary.

</step>

<step name="replan">

## 7. Replan — Fold Review Feedback In

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --reviews")
```

`--reviews` is the flag nobody remembers — the entire reason this workflow exists. It requires
REVIEWS.md (validated by `plan-phase`'s own prerequisite check, and by this workflow's step 6),
skips the existing-plans prompt, and goes straight to replanning with the review feedback as a
planner input; the internal planner → verifier revision loop runs again on the hardened output.

Verify the replan completed — re-run `init phase-op ${PHASE_NUM}`, confirm `has_plans` is still
true and the PLAN.md files are newer than REVIEWS.md. If `plan-phase --reviews` errored → go to
`handle_step_failure` with resume command `/gsd:plan-phase ${PHASE_NUM} --reviews`.

Gather for the gate: final task count, wave count, files touched (from PLAN.md frontmatter), the
reviewer roster, and a short table of which CRITICAL/IMPORTANT findings the replan addressed.

</step>

<step name="gate_2_approve_final_plan">

## 8. GATE 2 — Approve Final Plan

Present the hardened plan summary: tasks, waves, files touched, which CLIs reviewed it, and how
the replan disposed of their findings. Then prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Hardened plan ready (N tasks, M waves; reviewed by {CLIs}, {K} findings folded in). Approve the plan? [Approve plan / Adjust / Stop — keep everything]"

```
AskUserQuestion:
  question: "Hardened plan ready (N tasks, M waves; reviewed by {CLIs}, {K} findings folded in). Approve the plan?"
  options:
    - label: "Approve plan"
      description: "Accept the hardened plan; execute later with /gsd:execute-phase — this workflow never executes"
    - label: "Adjust"
      description: "Revise the plan once more with your direction before approving"
    - label: "Stop — keep everything"
      description: "End the workflow; PLAN.md, REVIEWS.md, and CONTEXT.md all stay on disk"
```

**On "Approve plan":** display the completion summary and the natural next command:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► HARDENED-PLAN ▸ Phase ${PHASE_NUM} PLAN APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 CONTEXT / PLAN / REVIEWS: ${phase_dir}
 Execute when ready: /gsd:execute-phase ${PHASE_NUM}
```

The workflow ends. Nothing was executed; building is the operator's next intent.

**On "Adjust":** gather the direction conversationally, re-run `replan` (a further
`plan-phase ${PHASE_NUM} --reviews` pass with the operator's notes as additional context — no
new external send occurs; REVIEWS.md is already on disk), then re-present this gate.

**On "Stop — keep everything":** end the workflow. All artifacts remain on disk; the operator
can resume at any point with `/gsd:plan-phase ${PHASE_NUM} --reviews` or execute the plan as-is.

</step>

</process>

<error_handling>

**`handle_step_failure`** — used for: discuss-phase producing no CONTEXT.md, plan-phase
producing no plans (first pass or `--reviews` pass), and cross-AI review producing no
REVIEWS.md.

Stop and report plainly. Hand off via:

```
Skill(skill="gsd:pause-work")
```

`pause-work` writes `.continue-here.md` and `.planning/HANDOFF.json` with the current position,
what completed, what remains, and the specific failure. Display the handoff location, the
failing step's own resume command (named per step above), and stop the workflow. Never silently
downgrade — in particular, a failed review step must never let the un-reviewed first-pass plan
reach GATE 2 wearing the "hardened" label.

**External-send containment:** the ONLY step that sends anything off-machine is `review`
(step 6), and it is reachable ONLY through GATE 1's "Confirm — plan and send for review" answer,
whose prompt text discloses the send explicitly. The assumptions-correction loop, both planning
passes, and GATE 2's "Adjust" loop all stay entirely local. If the workflow stops for any reason
before GATE 1 resolves to "Confirm", zero plan content has left the machine.

**Rollback:** everything this workflow writes is planning docs under `${phase_dir}` on the
working branch — CONTEXT.md, PLAN.md, REVIEWS.md. Nothing touches `main`, nothing pushes,
nothing executes code. Rollback is deleting or recommitting those docs; the external reviews,
once sent, cannot be unsent — which is exactly why the send sits behind GATE 1.

</error_handling>

<success_criteria>
- [ ] Intake resolves `PHASE_NUM` from `$ARGUMENTS` or via AskUserQuestion before any step runs,
      and validates it against the roadmap via `gsd-tools.cjs init phase-op`
- [ ] Discuss step invokes `gsd:discuss-phase` with `${PHASE_NUM} --batch` and verifies
      `has_context` afterwards
- [ ] Assumptions step invokes `gsd:list-phase-assumptions` — conversational analysis, no file
      output expected — before any plan exists
- [ ] Exactly TWO gates exist; external-send consent is folded into GATE 1's wording, never
      added as a third gate
- [ ] GATE 1 carries the exact verbatim prompt text: "Assumptions above — correct? Confirming
      also approves the next step: the plan will be sent to external AI CLIs
      (gemini/claude/codex — whichever are installed) for cross-AI review. [Confirm — plan and
      send for review / Correct assumptions / Stop here]"
- [ ] GATE 1's prompt explicitly discloses the external send BEFORE `/gsd:review` ever runs —
      honoring `.planning/GSD-AUTONOMOUS-WORKFLOWS.md` "Would NOT automate yet" item 2 (no
      unattended chain may trigger an ungated external send)
- [ ] "Correct assumptions" folds corrections into CONTEXT.md and re-runs the assumptions step
      exactly ONCE; if still wrong, the workflow stops cleanly with a rework path — no loop
- [ ] No `gsd:review` invocation, and no gemini/claude/codex reference in an executable
      position, appears anywhere before GATE 1 resolves to "Confirm — plan and send for review"
- [ ] Plan step invokes `gsd:plan-phase ${PHASE_NUM}` (first pass) and verifies `has_plans`
- [ ] Review step invokes `gsd:review` with `${PHASE_NUM} --all` and verifies
      `${phase_dir}/*-REVIEWS.md` exists — a missing REVIEWS.md stops the workflow rather than
      presenting an un-reviewed plan as hardened
- [ ] Replan step invokes `gsd:plan-phase ${PHASE_NUM} --reviews` — the fold-feedback-in flag
      this workflow exists to make unforgettable
- [ ] GATE 2 carries the exact verbatim prompt text: "Hardened plan ready (N tasks, M waves;
      reviewed by {CLIs}, {K} findings folded in). Approve the plan? [Approve plan / Adjust /
      Stop — keep everything]"
- [ ] "Adjust" at GATE 2 re-runs only the local replan — it never triggers a second external
      send
- [ ] The workflow never executes, pushes, ships, or merges anything — it ends by reporting
      `/gsd:execute-phase ${PHASE_NUM}` as the operator's next intent
- [ ] Any step failure routes to stop-and-report with a `gsd:pause-work` handoff plus that
      step's own resume command
- [ ] Every referenced repo file path resolves on disk
</success_criteria>
