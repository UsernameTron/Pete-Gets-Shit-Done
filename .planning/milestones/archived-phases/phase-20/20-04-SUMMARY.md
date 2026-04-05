---
phase: phase-20
plan: 04
requirement: MAINT-09
status: done
---

# Plan 20-04 Summary: Skill-Forge Consolidation into Core Registry

## What Was Built
- `validateSkillMetadata(metadata)` in init.cjs — validates name format (`/^[a-z0-9][a-z0-9-]*$/`, <=64 chars), description (non-empty, <=1024 chars), returns `{ valid, warnings, errors }`
- `validateSkillStructure(skillPath, projectRoot)` in init.cjs — validates SKILL.md exists, readable, non-empty, size <50KB, detects supporting files
- `cmdValidateSkill(cwd, skillPath, raw)` CLI wrapper — runs both validations, structured output, exit code 1 on errors
- `validate-skill` command routing in gsd-tools.cjs
- Feature-flagged integration into `buildAgentSkillsBlock` — when `skill_validation` flag enabled, runs metadata validation on load with stderr warnings/errors

## Tests Added
- 10 tests in `validateSkillMetadata` describe block: valid passes, missing name, invalid format, hyphen start, name too long, missing description, description too long, short description warning, missing version warning, null metadata
- 7 tests in `validateSkillStructure` describe block: valid structure, missing SKILL.md, empty SKILL.md, oversized, supporting files, CLI command, CLI exit code 1

## Key Decisions
- Feature flag `skill_validation` defaults to off — backward compatible, no behavior change unless explicitly enabled
- Validation in buildAgentSkillsBlock is additive (warnings only) — never blocks skill loading
- Consolidates skill-forge quality gates into the registry itself, making external validation optional
