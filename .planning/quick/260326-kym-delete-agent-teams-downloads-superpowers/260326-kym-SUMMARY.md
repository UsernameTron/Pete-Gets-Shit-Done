---
phase: quick
plan: 260326-kym
subsystem: repo-cleanup
tags: [cleanup, plugins, metadata]
dependency_graph:
  requires: []
  provides: [clean-repo-state]
  affects: [governance-customization, mcp-ecosystem-plugin]
tech_stack:
  added: []
  patterns: []
key_files:
  deleted:
    - plugins/claude-code-factory/downloads/agent-teams/SKILL.md
    - docs/superpowers/plans/2026-03-18-materialize-new-project-config.md
    - docs/superpowers/specs/2026-03-20-multi-project-workspaces-design.md
  modified:
    - docs/governance-customization.md
    - plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json
decisions:
  - Fixed plugin count from 13 to 12 in governance docs to match actual install-plugins.sh array
metrics:
  duration: 65s
  completed: "2026-03-26T20:08:53Z"
  tasks: 2
  files: 5
---

# Quick Task 260326-kym: Delete Agent-Teams, Superpowers, Update Plugin Metadata

Removed obsolete agent-teams download directory and deprecated superpowers docs, updated MCP ecosystem plugin description to list all 9 current commands, and corrected plugin count in governance docs from 13 to 12.

## Tasks Completed

### Task 1: Delete obsolete directories and clean superpowers references

- Deleted `plugins/claude-code-factory/downloads/agent-teams/` (1 file, dead SKILL.md download)
- Deleted `docs/superpowers/` (2 files across plans/ and specs/ subdirectories)
- Removed "superpowers, " from governance-customization.md plugin list
- Corrected plugin count from 13 to 12 (matches actual OFFICIAL array in install-plugins.sh)
- **Commit:** 4bb8a56

### Task 2: Update MCP ecosystem plugin description with all current commands

- Added `/agent-add`, `/agent-remove`, `/agent-reset` to plugin.json description
- Description now lists all 9 commands: /prime, /wrap, /agents, /agent-setup, /agent-status, /agent-diagnose, /agent-add, /agent-remove, /agent-reset
- **Commit:** 307bb1c

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed plugin count from 13 to 12**
- **Found during:** Task 1
- **Issue:** governance-customization.md stated "13 official plugins" but install-plugins.sh OFFICIAL array contains 12 entries. Superpowers was never in the array, so removing the reference revealed the pre-existing count error.
- **Fix:** Changed "13" to "12" in the same line edit.
- **Files modified:** docs/governance-customization.md
- **Commit:** 4bb8a56

## Verification

- `test ! -d plugins/claude-code-factory/downloads/agent-teams/` -- PASS
- `test ! -d docs/superpowers/` -- PASS
- `grep -ri 'superpowers'` (filtered) -- zero hits in active docs
- `plugin.json` contains /agent-add, /agent-remove, /agent-reset -- OK
- `npm test` -- 1,662 tests pass, 0 failures

## Known Stubs

None.
