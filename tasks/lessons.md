# Lessons

## Active Rules

### Seed Rules
- [2026-03-25] [Config]: Never modify shared config files without checking downstream consumers.
- [2026-03-25] [Scope]: If a "quick fix" requires 3+ files, it is not quick. Re-plan.
- [2026-03-25] [Testing]: Run the full test suite, not just tests for the changed module.
- [2026-03-25] [Dependencies]: Never add dependencies without explicit user approval.
- [2026-03-25] [Data]: Never delete production data, migrations, or seed data without approval.

### Learned Rules
- [2026-03-25] [Git/Remote]: Never create a new GitHub repo when pushing — always ask Pete for the correct remote URL first. Existing repos may already be configured for the project. Triggered by: created `Pete-Gets-Shit-Done` repo instead of pushing to the existing `Petes-Get-Shit-Done-Coding-Automation`.
- [2026-03-26] [CI/Ship]: Never mark a phase complete or merge a PR until all CI checks pass (green). If CI is failing, diagnose and fix before /gsd:ship or merge. "Tests pass locally" is not sufficient — CI must be green. Triggered by: multiple PRs shipped while CI checks were still pending or failing.
- [2026-04-09] [Spec vs Reality]: When a design spec line contradicts observable on-disk state, trust reality over the spec and flag the delta back to the operator. Do not literally implement a spec that is provably wrong. Triggered by: `deriveSlug` spec said `'-' + cwd.replaceAll('/', '-')` which double-dashes absolute paths; the actual Claude Code project slug at `~/.claude/projects/-Users-cpconnor-projects-Pete-Gets-Shit-Done/` uses a single leading dash. Shipped the bug into test-runner instead of catching it while writing the function.
- [2026-04-09] [Signal Detection]: Correction-phrase gates must distinguish instructional mentions ("don't touch X", "stop at Layer 1") from actual corrections ("don't do that — you're wrong"). Bare keyword matching on "don't"/"stop"/"no,"/"correction" inflates signal counts inside normal planning text. Fix: require a preceding corrective marker (e.g., phrase must follow "you" or start a sentence after a rebuttal), or drop the weakest phrases from the set, or weight by position in a user turn that follows an assistant turn. Triggered by: the lesson-capture gate fired with 6 signals on its own introduction session, where the only real correction was the deriveSlug fix.

## Session Exemptions
<!-- Single-line justifications when a session legitimately has no rule to capture -->
- [2026-04-09] Session was a `/gsd:prime-patterns` boot only — no corrections from operator, no implementation work. Signal is a known false positive per the 2026-04-09 signal-detection lesson.
- [2026-04-09] Second `/gsd:prime-patterns` boot after /clear — 1 signal fired on boot context, no operator corrections, no implementation. Same known false positive class; Layer 2 Commit 1 is the fix.
- [2026-04-09] Commit 1 planning session (continuation) — signals will fire on the plan text itself (Strong phrases quoted inside matcher design, test cases, and rollback criteria). No operator corrections in this session; Pete approved the plan unchanged. Committed 615512b (plan), 5ad94bc (approvals). Stopped before fixture build at 78% context budget per hard rule. This session's transcript is itself Section 3 of the fixture to be built next session.
- [2026-04-09] Post-/clear `/prime` boot session — no operator corrections, no implementation work, only CLAUDE.md/lessons/todo/session-log reads and a status report. Single signal is the known false-positive class pending Commit 1 fix.
- [2026-04-09] Second post-/clear `/prime` boot session (after fixture commit) — no operator corrections, no implementation, only status reads + handoff report. Flagged stale STATE.md but took no action. Single signal is the known false-positive class pending Commit 2 matcher fix.

## Archived
<!-- Rules that no longer apply -->

## Session Exemptions

- 2026-04-09 (Commit 2 audit session): Stop gate fired 5 signals on meta-quoted test case discussion. False positives are the structural fix being designed in Commit 2 itself — no rule to capture, exemption is the correct close. Audit findings folded into resumed-session build plan (double-quote stripping + strong-assistant sentence-start tightening).
