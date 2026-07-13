<purpose>
Execute one small change with verification structurally impossible to forget, then gate exactly
once — at the push. This is W4 (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md:120-134`), autonomy
level L2. *"Automate the reversible; gate the irreversible"*: the local atomic commits are
reversible and automated; the single irreversible step (push + draft PR) is the one gate.
Everything stays branch-local until GATE 1 resolves to "Push".
</purpose>

<process>

<step name="scope_self_check">
Parse `$ARGUMENTS` as the change description.

Lesson 2026-03-25 [Scope]: "If a 'quick fix' requires 3+ files, it is not quick. Re-plan."
Estimate the blast radius from the description plus a targeted scan (grep the named symbols
and paths). **If the change needs 3+ files: STOP and escalate** — display the lesson, then run
`@$HOME/.claude/get-shit-done/workflows/idea-to-shipped.md` with the same description instead.
The escalation stop is a routing decision, not a rubber stamp — it fires only when the 3-file
rule trips.
</step>

<step name="branch_guard">
```bash
CURRENT_BRANCH=$(git branch --show-current)
BASELINE_SHA=$(git rev-parse HEAD)
```

If on `main`/`master`: create and switch to `quick/{slug}` first and re-record both variables,
so the commits land branch-local. `BASELINE_SHA` is the rollback point for "Discard" at GATE 1
— the design's `git reset --hard` rollback, generalized to quick's possibly-multiple commits,
and never executed on `main`.
</step>

<step name="quick_full">
```
Skill(skill="gsd:quick", args="--full ${DESCRIPTION}")
```

**`--full` is non-negotiable in this bundle:** quick's default path runs zero automated
verification — the plan-checker loop (`quick.md` step 5.5) and the verifier (step 6.5) run
only under `--full`. planner → executor (worktree) → verifier, with branch-local atomic
commits (reversible — automated, per the two-gate doctrine; the push below stays the gate).

**At quick's `gaps_found` menu** ("1) Re-run executor to fix gaps, 2) Accept as-is"): select
option 1 once, logging `[auto] gap-closure iteration 1/1` (the `--auto` flag-family shape). If
verification still reports gaps after that one iteration: stop-and-report — never reach the
push gate with known gaps, and never select "Accept as-is" on the operator's behalf.
</step>

<step name="full_suite">
Run the FULL suite so the gate can honestly say "suite green" — lesson 2026-03-25 [Testing]:
"Run the full test suite, not just tests for the changed module."

```bash
npm test
```

**If the suite fails:** stop-and-report; do not present GATE 1. Commits stay local for
inspection; print the exact rollback command (`git reset --hard ${BASELINE_SHA}` on
`${CURRENT_BRANCH}`) without executing it.
</step>

<step name="gate_1_approve_push">
## GATE 1 — Approve Push

Present: diff stat vs `${BASELINE_SHA}`, verifier verdict from `${quick_id}-VERIFICATION.md`,
suite result. If the executed change touched 3+ files despite the pre-check, flag the
scope-rule breach in the presentation (log it — the operator decides at this gate).

**Prompt text (verbatim):** "Done and verified locally ({files}, {±lines}; suite green). Push
and open draft PR? [Push / Keep local / Discard]"

- **"Push"** → `push_pr_watch`
- **"Keep local"** → end; commits stay on the local branch, nothing leaves the machine.
- **"Discard"** → `git reset --hard ${BASELINE_SHA}` on the working branch (never `main`);
  report what was dropped.
</step>

<step name="push_pr_watch">
Push the current branch — same semantics as `ship.md`'s `push_branch` step (upstream
fallback); the target is always the working branch, never `main`:

```bash
git push origin ${CURRENT_BRANCH} 2>&1 || git push --set-upstream origin ${CURRENT_BRANCH}
gh pr create --draft --title "${DESCRIPTION}" --body-file "${QUICK_DIR}/${quick_id}-SUMMARY.md"
```

(`${QUICK_DIR}` and `${quick_id}` come from quick's own init.) Then:

```
Skill(skill="gsd:ci-watch")
```

Draft PR only — nothing marked ready-for-review, nothing merges; merge stays human, on GitHub,
forever (branch protection). On CI red: apply ci-watch's suggested fix within GATE-1-approved
scope, cap one automated retry, then stop-and-report. If `gh pr create` fails after a
successful push: report it, give the exact retry command, do not retry automatically
(`wrap-and-sync.md`'s contract for the same failure).
</step>

</process>

<success_criteria>
- [ ] 3-file scope rule checked before execution; 3+ files escalates to `idea-to-shipped`
- [ ] `gsd:quick` always invoked with `--full` — no path through this workflow skips verification
- [ ] `gaps_found` auto-answered with ONE fix iteration, logged `[auto]`; "Accept as-is" never auto-selected
- [ ] Full `npm test` runs before the gate; the gate is presented only on green
- [ ] GATE 1 carries the verbatim W4 prompt; push, PR, and ci-watch happen only on "Push"
- [ ] PR is draft; merge stays human; rollback is a branch-local reset to `${BASELINE_SHA}`
</success_criteria>
