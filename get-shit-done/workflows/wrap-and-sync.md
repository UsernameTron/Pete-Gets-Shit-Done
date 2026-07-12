<purpose>
Wrap a session before stopping: re-measure coverage, close doc drift in the same commit unit, refresh session state, capture-or-exempt a lesson, checkpoint, and generate a session report — then gate exactly once before anything leaves the working tree. Codifies lesson 2026-05-11 [Pre-Push Validation / Drift] (drift must be re-checked AFTER the session's last change, not trusted from an earlier run) and lesson 2026-04-10 [Hook Design] (never force a commit — or a push — past a state where the operator deferred review) as executable steps, in place of the unwired `.claude/hooks/lesson-capture-gate.cjs` Stop hook.
</purpose>

<process>

<step name="run_coverage">
Run the full coverage suite as the freshest measurement in the session — after the session's last code or test change (lesson 2026-05-11 [Pre-Push Validation / Drift]: "validation passed earlier" does not mean "validation will pass on this exact tree").

```bash
npm run test:coverage
```

Note the exit code, plus the reported test count, suite count, and line/branch/function coverage percentages.

**If the run fails:** report the failure plainly and continue the wrap WITHOUT any doc updates — state explicitly that the doc-drift check is impossible on a failing tree. Never guess numbers to fill in `CLAUDE.md`, `README.md`, or `docs/DEVOPS-HANDOFF.md`. Set `$DRIFT_SUMMARY` = "drift check impossible — coverage run failed" and skip straight to `refresh_state_and_handoff`.
</step>

<step name="check_doc_drift">
Skip this step entirely if `run_coverage` failed.

```bash
node scripts/check-doc-drift.cjs
```

Exit codes: `0` = docs agree with measured values, `1` = drift found, `2` = runtime error (stale or missing coverage data, unreadable doc).

- **Exit 0:** `$DRIFT_SUMMARY` = "no drift". No doc edits needed.
- **Exit 1:** read the drift table from the command's output and edit `CLAUDE.md`, `README.md`, and `docs/DEVOPS-HANDOFF.md` so every flagged numeric claim matches the value measured in `run_coverage` this session — same commit unit as the rest of the wrap (nothing commits yet; that happens at the gate). Set `$DRIFT_SUMMARY` to a one-line summary of what changed, e.g. `"test_count 2845→2861, line_coverage 91.63%→91.82%"`.
- **Exit 2:** doc-drift check is impossible (stale or missing coverage data). State so plainly, do not guess numbers. Set `$DRIFT_SUMMARY` = "drift check impossible — runtime error".
</step>

<step name="refresh_state_and_handoff">
Refresh session state so a cold session (or the future `daily-startup` workflow) can resume without re-reading everything.

Update `.planning/STATE.md`'s `last_activity` frontmatter field:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update "last_activity" "$(date +%Y-%m-%d) -- {one-line session summary}"
```

Append a new session-handoff section to the END of `tasks/todo.md`, in the exact shape of the most recent existing block there (`**Branch**:`, a numbered actions/shipped list, `**Tests:**`, `**Next:**`), separated from the prior block by a `---` line:

```markdown
---

## Session Handoff (YYYY-MM-DD — {one-line summary})

**Branch**: `{branch}` ({clean/dirty})

**Session actions:**
1. {action}
2. {action}

**Tests:** {N} passing / {M} suites / 0 failures. Coverage {X}% line / {Y}% branch / {Z}% function.

**Next:**
1. {next step}
```
</step>

<step name="lessons_check">
Replicates the unwired `.claude/hooks/lesson-capture-gate.cjs` Stop-hook contract by hand, since that hook (Stop event, correction-signal transcript scan) is registered nowhere in `.claude/settings.json` (lesson 2026-04-13 [Integration]) and never fires. This step performs the check the hook was meant to perform.

Review the session for an operator correction — the operator told you something you did or said was wrong and you changed course as a result. An instructional mention ("don't touch X", "stop at Layer 1") is not a correction.

- **If the session contained a correction:** append a new rule to the `### Learned Rules` section of `tasks/lessons.md`, in the standard format: `- [YYYY-MM-DD] [Category]: Rule. Triggered by: what went wrong.`
- **If it did not:** append a one-line dated exemption to the `## Session Exemptions` section of `tasks/lessons.md`: `- [YYYY-MM-DD] {reason this session legitimately has no rule to capture}.`

Set `$LESSONS_STATUS` to `captured` or `exempt` for the gate prompt.
</step>

<step name="write_checkpoint">
Write a deterministic checkpoint for the next session — same invocation style as `@~/.claude/get-shit-done/workflows/checkpoint.md`:

```bash
node -e "
  const { writeCheckpoint } = require('$HOME/.claude/get-shit-done/bin/lib/checkpoint.cjs');
  const result = writeCheckpoint('.planning', { context_note: '{one-line wrap summary}' });
  console.log(JSON.stringify(result, null, 2));
"
```

`writeCheckpoint` reads git state and STATE.md and scans the phase directory itself — only `context_note` needs an override here.
</step>

<step name="generate_session_report">
Follow `@~/.claude/get-shit-done/workflows/session-report.md` end-to-end: gathers STATE.md, git log, and plan/summary data, then writes `.planning/reports/SESSION_REPORT.md` (or a dated variant if one already exists this session).
</step>

<step name="check_review_sentinel">
Before the gate, check for a review-pending sentinel (lesson 2026-04-10 [Hook Design]: a Stop-style gate must never force a commit — or a push — past a state where the operator explicitly deferred review; it cannot tell "forgot to commit" from "mid-review, deferred on purpose").

```bash
test -f .planning/.review-pending && echo present || echo absent
```

If `.planning/.review-pending` exists: the gate's ceiling is forced to **Commit local only**. Do not offer, and do not execute, "Commit + push" while the sentinel is present — regardless of which option the operator would otherwise pick. Say so explicitly when presenting the gate.
</step>

<step name="gate_approve_wrap">
Present everything about to become a commit, then stop and wait. Nothing before this step is irreversible — no `git add`, no commit, no push has happened yet.

**Prompt text (verbatim):** "Wrap ready: {files} ({drift summary}; lessons: {captured/exempt}). Commit and push? [Commit + push / Commit local only / Discard]"

```
AskUserQuestion:
  question: "Wrap ready: {files} ({drift summary}; lessons: {captured/exempt}). Commit and push?"
  options:
    - label: "Commit + push"
      description: "Single commit unit, pushed to the current branch, opens a draft PR (branch protection forbids direct pushes to main)"
    - label: "Commit local only"
      description: "Single commit unit, stays on the local branch — nothing leaves the machine"
    - label: "Discard"
      description: "Restore the wrap edits; keep generated report and checkpoint files on disk, untracked"
```

If `check_review_sentinel` found the sentinel present: drop "Commit + push" from what is actually offered — present only "Commit local only" and "Discard", and state why.
</step>

<step name="execute_wrap_decision">
The files touched by a wrap are always a subset of: `.planning/STATE.md`, `tasks/todo.md`, `tasks/lessons.md`, `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` — only the docs actually edited in `check_doc_drift` need staging.

**If "Commit + push":**

```bash
git add .planning/STATE.md tasks/todo.md tasks/lessons.md CLAUDE.md README.md docs/DEVOPS-HANDOFF.md
git commit -m "chore(wrap): session wrap -- {one-line summary}"
git push origin $(git branch --show-current) 2>&1
```

If the push fails for lack of an upstream, set one: `git push --set-upstream origin $(git branch --show-current)`. The target is always the current branch — never `main` (branch protection blocks a direct push anyway). Then open a draft PR:

```bash
gh pr create --draft --title "chore(wrap): {one-line summary}" --body "Session wrap: coverage re-measured, drift closed, lessons {captured/exempt}."
```

**If "Commit local only":**

```bash
git add .planning/STATE.md tasks/todo.md tasks/lessons.md CLAUDE.md README.md docs/DEVOPS-HANDOFF.md
git commit -m "chore(wrap): session wrap -- {one-line summary}"
```

**If "Discard":**

```bash
git restore --staged .planning/STATE.md tasks/todo.md tasks/lessons.md CLAUDE.md README.md docs/DEVOPS-HANDOFF.md 2>/dev/null
git restore .planning/STATE.md tasks/todo.md tasks/lessons.md CLAUDE.md README.md docs/DEVOPS-HANDOFF.md 2>/dev/null
```

Leave `.planning/reports/SESSION_REPORT*.md` and `.planning/CHECKPOINT.json` alone — they are generated artifacts, not wrap edits, and discarding the commit does not delete them. They stay on disk, untracked, for the operator to inspect or clean up later.
</step>

</process>

<error_handling>
**If `npm run test:coverage` fails:** see `run_coverage` — continue the wrap, skip doc updates, never guess numbers.

**If `.planning/STATE.md` or `tasks/todo.md` is missing:** report which file is missing and skip only that sub-step; the rest of the wrap still runs. A missing `tasks/lessons.md` is a harder stop — report it and go straight to `gate_approve_wrap` with `$LESSONS_STATUS` = "unavailable — tasks/lessons.md not found".

**If `.planning/.review-pending` exists:** see `check_review_sentinel` — the gate's ceiling is capped at "Commit local only" no matter what.

**If `gh pr create` fails after a successful push:** report the branch was pushed but no draft PR was opened; give the operator the exact `gh pr create --draft` command to retry manually. Do not retry automatically — a second push is not a git error to paper over.
</error_handling>

<success_criteria>
- [ ] Coverage re-measured after the session's last change, or its failure reported plainly with doc updates explicitly skipped
- [ ] Doc drift closed in the same commit unit, or marked impossible — never guessed
- [ ] `.planning/STATE.md` `last_activity` and a new `tasks/todo.md` handoff block are current
- [ ] A lesson was captured or a dated exemption was logged — never neither
- [ ] `.planning/CHECKPOINT.json` and a session report are written
- [ ] Review-pending sentinel checked before the gate; "Commit + push" never offered while it is present
- [ ] Nothing added, committed, or pushed until the gate is answered
- [ ] A push, if any, targets the current branch only, never `main`
</success_criteria>
