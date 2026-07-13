<purpose>

Turn a freeform idea into shipped code: discuss → plan → execute → verify → ship, unattended
between exactly two human gates. Also serves "research + plan a new thing" — if the operator's
intent says research/plan only, the workflow ends cleanly after GATE 1 with the plan kept, and
never reaches execution.

This is W2 (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) at autonomy level L3: plan → execute →
verify → iterate run unattended between the two gates; only the irreversible steps (starting
execution, and pushing/opening a PR) are gated. Per the project's north star — *"Automate the
reversible; gate the irreversible"* — merge itself is never automated: it stays human, on
GitHub, forever, enforced by branch protection independent of anything in this workflow.

</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-verifier — Clean-context quality review of the executed diff before GATE 2 (scope: general)
</available_agent_types>

<process>

<step name="intake">

## 1. Intake

Parse `$ARGUMENTS` as the freeform idea description.

**Detect plan-only intent.** Scan the intake text for research/plan-only language — phrases like
"research and plan", "just plan", "plan only", "stop at the plan", "don't build yet", "research
only", "plan it, don't execute". If any such phrase is present, set `PLAN_ONLY=true`. Otherwise
`PLAN_ONLY=false`. This flag decides how `gate_1_approve_plan` below resolves — it does not skip
any step before that gate; discuss and plan still run in full so the plan gate has something real
to show.

**Resolve the phase.** If the idea text names an existing phase number, or an existing incomplete
phase's goal clearly matches the idea, reuse that `PHASE_NUM`. Otherwise create a new phase:

```bash
RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase add "${IDEA_DESCRIPTION}")
```

Extract `phase_number` from the result and set `PHASE_NUM` to it (mirrors `add-phase.md`'s own
`add_phase` step — this workflow delegates to the same CLI, not a re-implementation of it).

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► IDEA-TO-SHIPPED ▸ Phase ${PHASE_NUM}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Idea: {one-line idea summary}
 Plan-only: {yes/no}
```

</step>

<step name="discuss">

## 2. Discuss

Execute the smart-discuss workflow from
`@$HOME/.claude/get-shit-done/workflows/smart-discuss.md` with `${PHASE_NUM} --auto` — the same
extracted workflow `autonomous.md`'s `smart_discuss` step now calls. Under `--auto` it folds each
grey area to its recommended defaults, emits an `[auto]` receipt table (area | default taken |
why), and asks only areas it cannot responsibly default; the folded decisions still reach human
review at GATE 1 through the plan built from them, so the two-gate contract holds. Produces
`${phase_dir}/${padded_phase}-CONTEXT.md`, identical output shape to `discuss-phase`.

After it completes, verify context was written:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Check `has_context`. If false → go to `handle_executor_failure` with "Smart discuss for phase
${PHASE_NUM} did not produce CONTEXT.md."

</step>

<step name="plan">

## 3. Plan

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
```

`plan-phase` runs its own internal `gsd-planner` → `gsd-verifier` (scope: plan) revision loop
(max 3 iterations) before returning — no separate plan-quality gate is needed here, only the
human approval gate below.

Verify plan produced output — re-run `init phase-op` and check `has_plans`. If false → go to
`handle_executor_failure`: "Plan phase ${PHASE_NUM} did not produce any plans."

Gather the plan summary for the gate: task count, wave count, and the file list touched across
all plans (read from `PLAN.md` frontmatter under `${phase_dir}`).

</step>

<step name="gate_1_approve_plan">

## 4. GATE 1 — Approve Plan

**If `PLAN_ONLY` is true:** do not present the AskUserQuestion below — the operator already said
"stop at the plan." Display the plan summary read-only and end the workflow cleanly:

```
Plan-only intent detected — stopping here per request.
Plan kept at: ${phase_dir}
Resume execution any time with: /gsd:execute-phase ${PHASE_NUM}
```

Nothing further in this workflow runs. This is the "research + plan a new thing" variant of W2.

**If `PLAN_ONLY` is false:** present the plan summary, then prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Plan verified (N tasks, M waves, files: …). Execute now? [Execute / Adjust scope / Stop here — keep the plan]"

```
AskUserQuestion:
  question: "Plan verified (N tasks, M waves, files: …). Execute now?"
  options:
    - label: "Execute"
      description: "Begin wave-parallel execution now on the current branch"
    - label: "Adjust scope"
      description: "Go back and re-plan with different scope before executing"
    - label: "Stop here — keep the plan"
      description: "End the workflow now; the plan stays on disk, nothing executes"
```

**On "Execute":** proceed to `execute`.

**On "Adjust scope":** loop back to `plan` (re-invoke `gsd:plan-phase`, optionally with adjusted
context gathered conversationally first), then re-present this gate.

**On "Stop here — keep the plan":** display the same message as the `PLAN_ONLY` branch above and
end the workflow cleanly. Nothing executes, nothing is pushed.

</step>

<step name="execute">

## 5. Execute

```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

`--no-transition` keeps this workflow, not `execute-phase`, in control of what happens after
verification — mirrors the same flag usage in `autonomous.md`'s `execute_phase` step and
`plan-phase.md`'s auto-advance chain, both of which use `Skill()` rather than `Task()` here
specifically to avoid nested-agent freezes from deep Task-in-Task nesting.

`execute-phase` runs its own wave-parallel `gsd-executor` (worktree isolation), regression gate,
and phase-goal `gsd-verifier` pass internally, and produces `${phase_dir}/*-VERIFICATION.md`.

**If execute-phase reports an executor failure mid-wave:** go to `handle_executor_failure` —
never auto-debug into an unreviewed rewrite (see `<error_handling>`).

</step>

<step name="verify">

## 6. Verify

```
Skill(skill="gsd:verify-work", args="${PHASE_NUM}")
```

**Do not pass `--mode=schema`.** The default mode runs the schema pre-flight check AND the
automated `must_have` UAT (`verify-work.md`'s `automated_uat` step); `--mode=schema` completes
after the schema check alone and explicitly skips the UAT flow (`verify-work.md`: "If mode =
'schema' only: Complete after schema check (skip UAT flow)"). `idea-to-shipped` needs the
automated must-have verification to actually run, so the default (both-mode) invocation is
required here — schema-only would silently skip the must-have checks GATE 2 reports on.

Read the automated UAT results: passed / failed / manual counts.

- **If `failed > 0`:** go to `handle_gaps_found` with the failure details — do not proceed to
  quality review with known failing must-haves.
- **If `manual > 0` and `failed = 0`:** the remaining conversational UAT items surface at GATE 2
  alongside the automated results, rather than blocking here — GATE 2's prompt reports "X/Y
  must-haves" using the combined automated + manual-confirmed count.
- **If all passed:** proceed to `quality_review`.

</step>

<step name="quality_review">

## 7. Quality Review

Spawn a clean-context `gsd-verifier` for a general-scope quality pass on the diff — this reviewer
shares **zero context** with the `gsd-executor` subagents it is grading, mirroring the isolation
`execute-phase.md`'s own `verify_phase_goal` step uses for its `gsd-verifier` spawn:

```bash
VERIFIER_SKILLS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-verifier 2>/dev/null)
```

```
Task(
  prompt="Quality review of phase ${PHASE_NUM}'s complete diff, general scope (not phase-goal
scope — this is the pre-ship quality gate, not the phase-goal check execute-phase already ran).
Apply the 4D rubric (security 35% / performance 25% / correctness 25% / maintainability 15%).
Phase directory: ${phase_dir}
${VERIFIER_SKILLS}",
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

Record the verdict as `PASS` or not-`PASS` for the GATE 2 prompt.

**If not `PASS`:** treat identically to `verify` reporting `failed > 0` — go to
`handle_gaps_found` with the review's findings, rather than presenting GATE 2 with a failing
review result.

</step>

<step name="gate_2_approve_ship">

## 8. GATE 2 — Approve Ship

Present the verification table (X/Y must-haves passed), diff stat, quality-review verdict, and
target branch. Then prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Verification passed (X/Y must-haves; review: PASS). Push branch and open draft PR? [Ship it / Fix issues first / Stop — keep local]"

```
AskUserQuestion:
  question: "Verification passed (X/Y must-haves; review: PASS). Push branch and open draft PR?"
  options:
    - label: "Ship it"
      description: "Push the current branch and open a draft PR — nothing merges automatically"
    - label: "Fix issues first"
      description: "Go back into execution to address something before shipping"
    - label: "Stop — keep local"
      description: "End the workflow now; the branch stays local, nothing is pushed"
```

**On "Ship it":** proceed to `ship`.

**On "Fix issues first":** loop back to `execute` (re-run the wave(s) needing the fix, then
`verify` and `quality_review` again) — the scope already approved at this gate covers the fix
loop; no new gate is required to re-attempt shipping once the fix passes `verify` and
`quality_review` again.

**On "Stop — keep local":** end the workflow. Nothing is pushed, nothing leaves the machine.

</step>

<step name="ship">

## 9. Ship

```
Skill(skill="gsd:ship", args="${PHASE_NUM} --draft")
```

`--draft` opens the PR in draft state — nothing is marked ready-for-review automatically.
`ship.md`'s own post-PR review question (`optional_review` step) may still fire; answering it is
part of running `ship`, not a second gate owned by this workflow.

</step>

<step name="ci_watch">

## 10. CI Watch

```
Skill(skill="gsd:ci-watch")
```

Polls to a terminal state. On green: report done, present the PR URL, and stop — **merge stays
human, on GitHub, forever.** `ship` never merges (branch protection enforces this independent of
anything in this workflow); nothing in `idea-to-shipped` ever calls a merge API or auto-approves
a PR.

**On CI red:** `ci-watch` already diagnoses via its own pattern library (Tier 1) with an LLM
fallback (Tier 2, `ci-watch.md`'s `diagnose_and_suggest` step). Apply the suggested fix, still
within the scope GATE 2 already approved — do not re-present GATE 2 for a same-scope fix. Commit
the fix on the current branch (already pushed once; this is a follow-up push to the same branch,
never a new PR), then re-invoke `ci-watch`. Cap this fix loop at 1 automatic retry — if CI is
still red after the retry, go to `handle_executor_failure`: "CI remained red after one automated
fix attempt on phase ${PHASE_NUM}."

</step>

</process>

<error_handling>

**`handle_executor_failure`** — used for: execute-phase reporting a mid-wave executor failure,
smart-discuss failing to produce CONTEXT.md, plan-phase failing to produce plans, and CI staying
red after the one automated fix retry.

Stop and report plainly — never auto-`/gsd:debug` into an unreviewed rewrite. Hand off via:

```
Skill(skill="gsd:pause-work")
```

`pause-work` writes `.continue-here.md` and `.planning/HANDOFF.json` with the current position,
what completed, what remains, and the specific failure — so the operator can resume with full
context rather than starting over. Display the handoff location and stop the workflow. This
mirrors `bug-to-branch`'s failure contract (`INVESTIGATION INCONCLUSIVE` → stop-and-report with a
resumable state file) rather than `quick-change`'s (auto-revert) — a mid-wave executor failure on
a multi-plan phase is not safely auto-revertible the way a single quick-change commit is.

**`handle_gaps_found`** — used for: `verify` reporting `failed > 0`, and `quality_review`
returning anything other than `PASS`.

Run exactly **one** automatic gap-closure cycle — this mirrors `autonomous.md`'s own 1-retry cap
on gap closure, for the same reason (prevent infinite loops):

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --gaps")
```

Verify gap plans were created (re-run `init phase-op ${PHASE_NUM}`, check `has_plans` grew). If
not → go to `handle_executor_failure`: "Gap closure planning for phase ${PHASE_NUM} did not
produce plans."

Re-execute:

```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

Re-run `verify` and `quality_review`. If both now pass → proceed to `gate_2_approve_ship`. If
either still fails after this one retry → go to `handle_executor_failure`: "Gaps persist after
one closure attempt on phase ${PHASE_NUM}." Do not attempt a second automatic cycle.

**Rollback:** nothing in this workflow touches `main`. Before GATE 2, rollback is always
branch-discard — the operator can abandon the branch entirely with no trace on `main` (no push
has happened). After `ship` has pushed, rollback is still branch-discard from the operator's
side (`git branch -D` the local branch, close the draft PR) — `idea-to-shipped` never merges, so
there is nothing on `main` to revert in the first place.

**No push, no PR, ever, before GATE 2 is answered "Ship it."** Every write that leaves the
machine — the push inside `ship`, the draft PR it opens, and `ci-watch`'s follow-up push on CI
red — happens strictly after `gate_2_approve_ship` resolves to "Ship it."

</error_handling>

<success_criteria>
- [ ] Intake parses the freeform idea, resolves or creates `PHASE_NUM`, and detects `PLAN_ONLY`
      intent before any other step runs
- [ ] Discuss step invokes the extracted `get-shit-done/workflows/smart-discuss.md` workflow with
      `PHASE_NUM --auto` — not an inlined copy of its sub-steps — so only unresolvable grey areas
      pause the chain before GATE 1
- [ ] Plan step invokes `gsd:plan-phase` and its internal revision loop, no separate plan-quality
      gate added on top
- [ ] GATE 1 carries the exact verbatim prompt text: "Plan verified (N tasks, M waves, files:
      …). Execute now? [Execute / Adjust scope / Stop here — keep the plan]"
- [ ] `PLAN_ONLY=true` ends the workflow cleanly after GATE 1 with the plan kept, without
      presenting the GATE 1 AskUserQuestion — the "research + plan a new thing" variant
- [ ] "Adjust scope" at GATE 1 loops back to the plan step; "Stop here" ends cleanly with the
      plan kept, identical to the `PLAN_ONLY` branch
- [ ] Execute step invokes `gsd:execute-phase` with `--no-transition`, via `Skill()` not `Task()`
      (avoids nested-agent freeze, same rationale as `autonomous.md` and `plan-phase.md`)
- [ ] Verify step invokes `gsd:verify-work` in default mode — `--mode=schema` is never passed —
      with an explicit note that schema-only mode would skip the automated must-have UAT
- [ ] Quality review spawns a clean-context `gsd-verifier` (`Task()`, general scope) that shares
      zero context with the `gsd-executor` subagents it grades, and runs before GATE 2
- [ ] GATE 2 carries the exact verbatim prompt text: "Verification passed (X/Y must-haves;
      review: PASS). Push branch and open draft PR? [Ship it / Fix issues first / Stop — keep
      local]"
- [ ] No `git push`, `gh pr`, or `gsd:ship` reference appears anywhere before the GATE 2 step —
      nothing leaves the machine until GATE 2 resolves to "Ship it"
- [ ] Ship step invokes `gsd:ship` with `--draft`; CI watch step invokes `gsd:ci-watch`
- [ ] Merge stays human, on GitHub, forever — explicitly stated; `ship` never merges and this
      workflow never calls a merge API
- [ ] Executor failure mid-wave (or smart-discuss/plan-phase producing no output, or CI staying
      red after one fix retry) routes to stop-and-report with a `gsd:pause-work` handoff — never
      auto-debug into an unreviewed rewrite
- [ ] `verify` or `quality_review` failure triggers exactly ONE automatic gap-closure cycle
      (`plan-phase --gaps` → re-execute → re-verify), then stop-and-report if gaps persist —
      mirrors `autonomous.md`'s 1-retry cap
- [ ] Rollback before GATE 2 is always branch-discard — nothing has touched `main`
- [ ] Every referenced repo file path resolves on disk
</success_criteria>
