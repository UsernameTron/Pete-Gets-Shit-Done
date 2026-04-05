---
phase: phase-20
name: Skills System Overhaul
status: planning
requirements:
  - MAINT-03
  - MAINT-04
  - MAINT-05
  - MAINT-09
---

# Phase 20 Context: Skills System Overhaul

## Current Skills System Architecture

### Registry Location
- **Primary code**: `get-shit-done/bin/lib/init.cjs` lines 1363-1420
- **Config storage**: `.planning/config.json` under `agent_skills` key
- **Config validation**: `get-shit-done/bin/lib/config.cjs` — dynamic key pattern `/^agent_skills\.[a-zA-Z0-9_-]+$/`

### Core Functions
| Function | Location | Purpose |
|----------|----------|---------|
| `buildAgentSkillsBlock(config, agentType, projectRoot)` | init.cjs:1363 | Format skills into XML injection block |
| `cmdAgentSkills(cwd, agentType, raw)` | init.cjs:1406 | CLI entry point for `agent-skills` command |
| `isValidConfigKey(keyPath)` | config.cjs:37 | Validate `agent_skills.<type>` keys |
| `buildNewProjectConfig()` | config.cjs:95 | Default `agent_skills: {}` in config |

### Data Model
```json
{
  "agent_skills": {
    "<agent-type>": ["path/to/skill", "path/to/other-skill"]
  }
}
```
- Values: single string or array of strings (normalized to array internally)
- Paths: relative to project root, validated via `security.cjs:validatePath()`
- Each path must contain a `SKILL.md` file

### What Exists
1. Path-based skill loading with security validation
2. XML block formatting for injection into Task() prompts
3. Multi-skill-per-agent support (arrays)
4. Three-level config merge (hardcoded ← userDefaults ← choices)
5. 9 tests in `tests/agent-skills.test.cjs` (207 lines)

### What Does NOT Exist
1. **No skill composition** — skills cannot reference other skills programmatically
2. **No metadata parsing** — SKILL.md frontmatter is never read by get-shit-done code; only file existence is checked
3. **No dynamic discovery** — skills are only found via explicit config paths
4. **No orphan detection** — no mechanism to find configured-but-missing or unconfigured-but-present skills
5. **No versioning** — no version field in metadata, no pinned references, no drift detection
6. **No skill-forge integration** — skill-forge is an external Claude Code skill (`skill-factory` in marketplace), not code in get-shit-done

### Architecture Constraints
- **Zero dependencies** — all code sync CommonJS, no npm packages
- **Layer rules** — init.cjs is Layer 3 (Application), can import from any lower layer
- **Frontmatter parsing** — `frontmatter.cjs` already exists with `parseFrontmatter()` for PLAN.md files; can be reused for SKILL.md parsing
- **Feature flags** — Phase 19 shipped `createFeatureFlags(config)` in core.cjs; can gate experimental skill features

## Requirements Analysis

### MAINT-03: Skills Extensibility
**Scope**: Composition, metadata queries, dynamic discovery
**Design decisions**:
- Composition: add `skills` field awareness to metadata parser (skills that auto-load other skills)
- Metadata queries: parse SKILL.md frontmatter, return structured data (name, description, tools, version, skills refs)
- Dynamic discovery: scan known directories (project `.claude/skills/`, plugin skill dirs) for SKILL.md files
- All functions added to init.cjs (Layer 3) — reuse `parseFrontmatter()` from frontmatter.cjs

### MAINT-04: Orphaned Skills Audit
**Scope**: Scan, identify dead skills, archive/remove
**Design decisions**:
- New `audit-skills` CLI command in gsd-tools.cjs
- Cross-reference discovered skills (from MAINT-03 discovery) with config.agent_skills entries
- Report: unconfigured skills, configured-but-missing skills, skills with broken `skills` references
- Output: structured JSON for programmatic consumption

### MAINT-05: Skill Versioning
**Scope**: Version metadata, pinned references, drift warnings
**Design decisions**:
- Parse `version` field from SKILL.md frontmatter (MAINT-03 metadata parser handles this)
- Support `path@version` syntax in config references
- `check-skill-versions` command: compare declared versions against SKILL.md frontmatter
- Emit warnings to stderr when configured version != SKILL.md version

### MAINT-09: Skill-Forge Consolidation
**Scope**: Merge skill-forge engineering patterns into core registry
**Design decisions**:
- skill-forge is NOT a code module — it's an external skill/protocol for building high-quality skills
- "Consolidation" = add skill validation functions to get-shit-done registry
- `validateSkillMetadata(skillPath)` — check required fields, field formats, description quality
- `validateSkillStructure(skillPath)` — check SKILL.md exists, file size reasonable, no broken references
- Integrate validation into `buildAgentSkillsBlock()` — emit warnings for invalid skills

## Wave Analysis

**Wave 1**: MAINT-03 (extensibility) — foundational; metadata parsing and discovery needed by all other plans
**Wave 2**: MAINT-04, MAINT-05, MAINT-09 — all depend on MAINT-03's metadata parser and discovery functions

## Files to Modify

| File | Plans | Changes |
|------|-------|---------|
| `get-shit-done/bin/lib/init.cjs` | 03, 04, 05, 09 | Metadata parser, discovery, audit, versioning, validation |
| `get-shit-done/bin/gsd-tools.cjs` | 04, 05 | New CLI commands: audit-skills, check-skill-versions |
| `tests/agent-skills.test.cjs` | 03, 04, 05, 09 | Tests for all new functions |

## Existing Test Baseline
- `tests/agent-skills.test.cjs`: 9 tests (207 lines)
- All passing as of Phase 19 commit
