---
phase: phase-20
plan: 03
requirement: MAINT-05
status: done
---

# Plan 20-03 Summary: Skill Versioning System

## What Was Built
- `checkSkillVersions(cwd)` function in init.cjs — parses `path@version` syntax from config, compares against SKILL.md metadata version field, reports matches, drifts, unversioned refs, and missing versions
- `cmdCheckSkillVersions(cwd, raw)` CLI wrapper with structured JSON output
- `check-skill-versions` command routing in gsd-tools.cjs
- `buildAgentSkillsBlock` updated to parse `path@version` syntax — strips version for path resolution, emits stderr warning on drift

## Tests Added
8 tests in `checkSkillVersions` describe block:
- Detects version match
- Detects version drift
- Detects unversioned refs
- Detects missing version in skill metadata
- Handles missing SKILL.md for versioned ref
- CLI command works
- buildAgentSkillsBlock strips version from path
- buildAgentSkillsBlock emits version drift warning

## Key Decisions
- Version is optional in SKILL.md — unversioned skills work fine, versioned refs just add a safety check
- Drift is a warning, not a blocker — buildAgentSkillsBlock still renders the skill even if version mismatches
- `@` parsing only triggers when `@` appears after position 0 (avoids false positives on email-like strings)
