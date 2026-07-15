---
name: workflow:ship-and-merge
description: Take a done, verified phase all the way to a merged PR — verify, add missing tests, build a .planning/-filtered PR branch, open the PR (gate 1), watch CI with a bounded fix loop, then merge (gate 2). Two gates; branch protection independently backstops the merge.
---
<purpose>
Take a done phase to a merged PR: verify → tests → clean PR branch → PR → CI → merge. This is
W9 (`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`), autonomy level L2 — verification, test
generation, branch filtering, and the CI fix loop run unattended; exactly two decisions stay
human: opening the PR (GATE 1) and merging it (GATE 2). *"Automate the reversible; gate the
irreversible"*: nothing is pushed before GATE 1 resolves, nothing merges before GATE 2 resolves.
The merge itself is performed here via `gh` — but branch protection on `main` (5 required
checks, PR-only) is the independent backstop: GATE 2 approval cannot merge a red PR.
</purpose>

<process>

<step name="intake_and_branch_guard">

## 1. Intake

Parse `$ARGUMENTS` for a phase number (integer, decimal, or letter-suffix) → `PHASE_NUM`.

**If no phase number found**, ask via AskUserQuestion — one question, options built from the
most recently executed phases:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load
```

Read the current phase from state; offer it plus its neighbors as options.

Load phase context:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_NUM}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `has_verification`. If
`phase_found` is false → stop: "Phase ${PHASE_NUM} not found in .planning/phases/."

Branch guard:

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

If on `main`/`master`: stop — there is nothing branch-local to ship; phase work lands on
feature branches. Report and end.

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SHIP-AND-MERGE ▸ Phase ${PHASE_NUM}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Branch: ${CURRENT_BRANCH}
```

</step>

<step name="verify">

## 2. Verify (skip if UAT already passed)

Check the phase's existing verification: if `has_verification` is true and
`${phase_dir}/*-VERIFICATION.md` carries `status: passed`, skip this step with a receipt line
(`[skip] verification already passed — {file}`). Otherwise:

```
Skill(skill="gsd:verify-work", args="${PHASE_NUM}")
```

Default mode only — never `--mode=schema`, which skips the automated must-have UAT
(`verify-work.md`: schema-only completes after the schema check alone).

**If verify-work reports `failed > 0` or ends with `gaps_found`:** → `handle_step_failure`
("Verification found gaps on phase ${PHASE_NUM} — close them via /gsd:plan-phase ${PHASE_NUM}
--gaps before shipping"). Shipping unverified work is exactly what this workflow exists to
prevent.

</step>

<step name="add_tests">

## 3. Add Tests (only if the phase lacks coverage)

Check whether the phase's commits touched any test file:

```bash
MERGE_BASE=$(git merge-base main "$CURRENT_BRANCH")
TEST_TOUCHED=$(git diff --name-only "$MERGE_BASE"..HEAD | grep -cE '(^|/)(tests?|__tests__)/|\.(test|spec)\.[cm]?[jt]sx?$' || true)
```

**If `TEST_TOUCHED` > 0:** skip with a receipt (`[skip] phase already touches ${TEST_TOUCHED}
test file(s)`).

**If 0:**

```
Skill(skill="gsd:add-tests", args="${PHASE_NUM}")
```

Then run the full suite — lesson 2026-03-25 [Testing]: whole suite, not just the changed module:

```bash
npm test
```

**If the suite fails:** → `handle_step_failure` ("Generated tests fail on phase
${PHASE_NUM}"). Never ship a red suite.

</step>

<step name="pr_branch">

## 4. Clean PR Branch

Count planning-only commits ahead of main:

```bash
PLANNING_ONLY=0
for HASH in $(git rev-list main..HEAD --no-merges); do
  NONPLANNING=$(git diff-tree --no-commit-id --name-only -r "$HASH" | grep -vc "^\.planning/" || true)
  [ "$NONPLANNING" = "0" ] && PLANNING_ONLY=$((PLANNING_ONLY+1))
done
```

**If `PLANNING_ONLY` = 0:** no filtering needed — set `SHIP_BRANCH="$CURRENT_BRANCH"` and skip
with a receipt.

**If > 0:**

```
Skill(skill="gsd:pr-branch")
```

`pr-branch` creates `${CURRENT_BRANCH}-pr` from main via cherry-pick with `.planning/`
filtering, then returns to the original branch. Set `SHIP_BRANCH="${CURRENT_BRANCH}-pr"` and
verify its diff is clean:

```bash
git diff --name-only main.."$SHIP_BRANCH" | grep -c "^\.planning/" || true
```

Must be 0. If not → `handle_step_failure` ("pr-branch left .planning/ files in the PR diff").

</step>

<step name="gate_1_open_pr">

## 5. GATE 1 — Open the PR

Present: verification status, test coverage receipt, `SHIP_BRANCH`, commit count and diff stat
vs main, planning-only commits filtered. Then prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Phase ${PHASE_NUM} verified; PR branch ready ({N} commits,
{M} planning-only filtered). Push and open the PR? [Open PR / Hold — keep local / Stop]"

```
AskUserQuestion:
  question: "Phase ${PHASE_NUM} verified; PR branch ready ({N} commits, {M} planning-only filtered). Push and open the PR?"
  options:
    - label: "Open PR"
      description: "Push ${SHIP_BRANCH} and open the PR — merge stays behind GATE 2"
    - label: "Hold — keep local"
      description: "End the workflow; the branch stays local, nothing is pushed"
    - label: "Stop"
      description: "End the workflow now; all artifacts stay on disk"
```

**On "Open PR":** if `SHIP_BRANCH` differs from `CURRENT_BRANCH`, `git checkout "$SHIP_BRANCH"`
first so `ship` pushes the filtered branch. Proceed to `ship`.

**On "Hold — keep local" or "Stop":** end. Nothing has been pushed.

</step>

<step name="ship">

## 6. Ship

```
Skill(skill="gsd:ship", args="${PHASE_NUM}")
```

No `--draft` — GATE 2 below merges this PR, and a draft PR cannot merge; opening it
ready-for-review is what GATE 1 just approved. `ship` pushes the current branch, generates the
PR body from planning artifacts, and creates the PR. Its own post-PR review question
(`ship.md`'s `optional_review` step) belongs to `ship`, not a new gate owned here.

Record `PR_NUMBER` and the PR URL from `ship`'s report.

</step>

<step name="ci_watch_and_fix_loop">

## 7. CI Watch (fix loop, NO gate)

```
Skill(skill="gsd:ci-watch")
```

**On green:** proceed to `gate_2_merge`.

**On red:** loop through debug — this loop carries **no gate** (matches W3's philosophy: the
push was already approved at GATE 1; a same-scope CI fix is a follow-up push to the same
branch, never a new PR). Iteration `i` of at most **2**:

1. ```
   Skill(skill="gsd:debug", args="CI failure on PR #${PR_NUMBER}: {failed job name + first error lines from ci-watch's log fetch}")
   ```
   `debug`'s own root-cause flow (persistent state in `.planning/debug/`) is `debug.md`'s,
   reused by reference — its internal questions are the command's, not workflow gates.
2. Apply the fix on `SHIP_BRANCH`, then re-run the full suite locally: `npm test`. If red →
   `handle_step_failure`.
3. Commit, push to the same branch, re-invoke `Skill(skill="gsd:ci-watch")`.

**If CI is still red after 2 iterations:** → `handle_step_failure` ("CI remained red on PR
#${PR_NUMBER} after 2 automated debug iterations").

</step>

<step name="gate_2_merge">

## 8. GATE 2 — Merge

Present: PR number and URL, CI check summary (X/Y green), diff stat, target branch. Then
prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "CI green on PR #${PR_NUMBER} ({X}/{Y} checks). Merge now?
[Merge / Leave open / Stop]"

```
AskUserQuestion:
  question: "CI green on PR #${PR_NUMBER} ({X}/{Y} checks). Merge now?"
  options:
    - label: "Merge"
      description: "Squash-merge the PR via gh — branch protection independently re-verifies the required checks"
    - label: "Leave open"
      description: "End the workflow; the PR stays open for later review or merge on GitHub"
    - label: "Stop"
      description: "End the workflow now; nothing merges"
```

**On "Merge":**

```bash
gh pr merge "$PR_NUMBER" --squash
```

The merge is gated here, but branch protection on `main` is the independent backstop — `gh`
cannot complete this merge unless the 5 required status checks pass, regardless of what this
workflow believes. If the merge is rejected by protection → `handle_step_failure` with the
`gh` error verbatim.

Then update state and report:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update "Status" "Phase ${PHASE_NUM} merged — PR #${PR_NUMBER}"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SHIP-AND-MERGE ▸ Phase ${PHASE_NUM} — MERGED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 PR #${PR_NUMBER} merged to main.
 Next: /clean-gone (prune the merged branch) · /gsd:progress
```

**On "Leave open" or "Stop":** end cleanly; the PR remains on GitHub, untouched.

</step>

</process>

<error_handling>

**`handle_step_failure`** — used for: verification gaps, generated tests failing the suite,
pr-branch leaving `.planning/` files in the diff, CI red after 2 debug iterations, and a
protection-rejected merge.

Fail loud: stop immediately, report the exact failure, and write state so the run is
resumable:

```
Skill(skill="gsd:pause-work")
```

`pause-work` writes `.continue-here.md` and `.planning/HANDOFF.json` with position, what
completed, and the failure. Then display the exact resume command and stop:

```
Resume with: /gsd:do "ship phase ${PHASE_NUM}"
(completed steps skip themselves — verification and tests are detected as done on re-entry)
```

**Rollback:** before GATE 1, everything is branch-local — rollback is branch-discard, `main`
untouched. After GATE 1 has pushed, rollback is close-the-PR + branch-discard; nothing is on
`main` until GATE 2's merge, and that merge is additionally guarded by branch protection.

**No push before GATE 1 resolves "Open PR". No merge outside GATE 2's "Merge".** The only
pushes in this workflow are `ship`'s (post-GATE 1) and the CI fix loop's follow-up pushes to
the same already-approved branch.

</error_handling>

<success_criteria>
- [ ] `PHASE_NUM` extracted from `$ARGUMENTS` or asked via AskUserQuestion; branch guard stops
      on `main`
- [ ] Verify step skips only when `*-VERIFICATION.md` carries `status: passed`; otherwise runs
      `gsd:verify-work ${PHASE_NUM}` in default mode (never `--mode=schema`)
- [ ] Add-tests runs only when the phase diff touches zero test files; full `npm test` after
      generation
- [ ] pr-branch runs only when planning-only commits exist; PR diff verified to contain zero
      `.planning/` files; `SHIP_BRANCH` set accordingly
- [ ] GATE 1 carries the exact verbatim prompt text: "Phase ${PHASE_NUM} verified; PR branch
      ready ({N} commits, {M} planning-only filtered). Push and open the PR? [Open PR / Hold —
      keep local / Stop]"
- [ ] No `git push`, `gh pr`, or `gsd:ship` reference before GATE 1 resolves "Open PR"
- [ ] Ship invokes `gsd:ship ${PHASE_NUM}` without `--draft` (GATE 2 merges; drafts can't)
- [ ] CI red loops through `gsd:debug` with the CI failure, re-runs the full suite, pushes the
      fix — max 2 iterations, NO gate inside the loop
- [ ] GATE 2 carries the exact verbatim prompt text: "CI green on PR #${PR_NUMBER} ({X}/{Y}
      checks). Merge now? [Merge / Leave open / Stop]"
- [ ] Merge performed via `gh pr merge --squash` only on GATE 2 "Merge"; branch protection
      named as the independent backstop
- [ ] Every failure path stops, writes a `gsd:pause-work` handoff, and prints the exact resume
      command
</success_criteria>
