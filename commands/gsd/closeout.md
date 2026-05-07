---
name: gsd:closeout
description: Comprehensive project closeout — orient, audit, verify, capture, ship, finalize, polish
argument-hint: "[milestone] [--mode ship|freeze] [--no-audits] [--no-verify] [--no-ship] [--wrap] [--profile] [--dry-run]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---
<objective>
End-to-end project closeout. Superset of `/gsd:finalize` — adds pre-flight orientation, full audit gates with BLOCK/FLAG resolution, conversational UAT, milestone summary capture, and ship/freeze branching.

Use this command when you want to fully audit a milestone before declaring it done. Use `/gsd:finalize` directly when audits have already passed and you just need the back-half archive/ship/push sequence.

**Creates/Updates:**
- Audit reports — `.planning/ECOSYSTEM-REPORT.md`, `.planning/DEPENDENCIES-REPORT.md`, milestone audit
- Milestone summary — `.planning/reports/MILESTONE_SUMMARY-*.md`
- Session report — `.planning/reports/SESSION_REPORT-*.md`
- All artifacts that `/gsd:finalize` produces (commits, tags, archive moves)

**After:** Milestone is shipped or frozen. Repo is in clean, returnable state.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/closeout.md
</execution_context>

<context>
Optional positional: `[milestone]` — e.g. `v2.8`. Pass-through to `/gsd:finalize` if it runs. If omitted, the workflow reads it from `.planning/STATE.md`.

Optional flags:
- `--mode ship|freeze` — override auto-detected mode
- `--no-audits` — skip Gate 1
- `--no-verify` — skip Gate 2 (warned)
- `--no-ship` — skip Gate 5 (still runs finalize at Gate 7)
- `--wrap` — opt-in `claude-mcp-ecosystem:wrap` at Gate 8
- `--profile` — opt-in `gsd:profile-user` at Gate 8
- `--dry-run` — print gate plan + plugin probes; run zero Skill calls

Project context, milestone state, and ROADMAP analysis are resolved inside the workflow via `gsd-tools.cjs init milestone-op` and `roadmap analyze`.
</context>

<process>
Execute the closeout workflow from @~/.claude/get-shit-done/workflows/closeout.md end-to-end.
Preserve all gates, BLOCK/FLAG resolution prompts, mode branching, and the `--dry-run` short-circuit.
</process>
