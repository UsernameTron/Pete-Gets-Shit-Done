---
phase: phase-20
plan: 02
requirement: MAINT-04
status: done
---

# Plan 20-02 Summary: Orphaned Skills Audit and Cleanup

## What Was Built
- `auditSkills(cwd)` function in init.cjs — discovers all skills on disk, cross-references with config's `agent_skills`, reports orphaned (on disk, not in config), missing (in config, not on disk), and broken composition refs
- `cmdAuditSkills(cwd, raw)` CLI wrapper with structured JSON output
- `audit-skills` command routing in gsd-tools.cjs

## Tests Added
7 tests in `auditSkills` describe block:
- Empty results when no skills configured
- Detects orphaned skills (on disk but not in config)
- Detects missing skills (in config but not on disk)
- Detects broken composition refs
- Reports totals correctly
- CLI command works
- No false positives when config matches disk

## Key Decisions
- Used `loadConfig(cwd)` (reads `.planning/config.json`) for config access, consistent with all other GSD functions
- Orphan detection uses `discoverSkills()` from Plan 20-01, confirming wave dependency was correct
- Broken refs check validates the `skills` composition field in SKILL.md frontmatter
