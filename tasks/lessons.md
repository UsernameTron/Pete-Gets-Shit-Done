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

## Archived
<!-- Rules that no longer apply -->
