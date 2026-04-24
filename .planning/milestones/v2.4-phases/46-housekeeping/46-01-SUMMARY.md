---
phase: 46-housekeeping
plan: 01
status: complete
started: 2026-04-16
completed: 2026-04-16
---

## Summary

Updated README.md and CLAUDE.md to reflect actual counts (18 agents, 63 commands), added missing `/gsd:audit-agents` and `/gsd:audit-deps` to the README command table, added `gsd-dependency-auditor` and `gsd-ecosystem-auditor` to the CLAUDE.md agent roster, and replaced the hardcoded path in crew.md with a portable reference.

## Key Files

### Created
(none)

### Modified
- `README.md` — Updated counts (63 commands, 18 agents), added 2 command table rows
- `CLAUDE.md` — Updated counts (63 slash commands, 18 built-in agents), expanded agent roster
- `commands/gsd/crew.md` — Replaced hardcoded `~/projects/Pete-Gets-Shit-Done/agents/` with portable plugin path resolution

## Decisions
- Used alphabetical insertion for new command table rows (audit-agents before audit-milestone)
- Portable path in crew.md references "get-shit-done plugin install path" rather than any absolute path

## Self-Check: PASSED
- README.md: 63 commands (3 occurrences), 18 agents (2 occurrences), audit-agents and audit-deps in table
- CLAUDE.md: 63 slash commands, 18 built-in agents (2 occurrences), all 18 agents listed
- crew.md: 0 occurrences of "Pete-Gets-Shit-Done"
