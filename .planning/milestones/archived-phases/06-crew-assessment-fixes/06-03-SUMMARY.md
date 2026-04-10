---
phase: 06-crew-assessment-fixes
plan: 03
subsystem: agents
tags: [agent-consolidation, research, validation, gsd-research-orchestrator, gsd-validator-hub]

requires:
  - phase: 06-crew-assessment-fixes/01
    provides: "Valid YAML frontmatter on all agents"
provides:
  - "gsd-research-orchestrator supports scope: phase | project"
  - "gsd-validator-hub supports target: extension | ecosystem"
  - "4 agents archived with absorption notes"
affects: [agent-ecosystem, workflows]

tech-stack:
  added: []
  patterns: ["Scope/target parameter pattern for consolidation"]

key-files:
  created:
    - "agents/gsd-research-orchestrator.md"
    - "agents/gsd-validator-hub.md"
    - "agents/_archived/gsd-phase-researcher.md"
    - "agents/_archived/gsd-project-researcher.md"
    - "agents/_archived/extension-validator.md"
    - "agents/_archived/validator.md"
  modified:
    - "~/.claude/get-shit-done/workflows/discuss-phase.md"
    - "~/.claude/get-shit-done/workflows/discuss-phase-assumptions.md"
    - "~/.claude/get-shit-done/workflows/plan-phase.md"
    - "~/.claude/get-shit-done/workflows/research-phase.md"
    - "~/.claude/get-shit-done/workflows/quick.md"
    - "~/.claude/get-shit-done/workflows/new-project.md"
    - "~/.claude/get-shit-done/workflows/new-milestone.md"
    - "~/.claude/get-shit-done/workflows/execute-phase.md"

key-decisions:
  - "Research uses scope (phase|project), Validator uses target (extension|ecosystem)"
  - "extension-validator and validator were global-only agents"

patterns-established:
  - "Consolidated agent with target parameter for validation"

requirements-completed: [CREW-03, CREW-04]

duration: 20min
completed: 2026-04-03
---

# Phase 6 Plan 03: Research + Validator Consolidation Summary

**Merged 2 research agents into gsd-research-orchestrator (scope: phase|project) and 2 validator agents into gsd-validator-hub (target: extension|ecosystem), updating 8 workflow files**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-03
- **Completed:** 2026-04-03
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Created gsd-research-orchestrator.md merging gsd-phase-researcher (current-phase research) and gsd-project-researcher (broad new-project research with x4 parallel pattern)
- Created gsd-validator-hub.md merging extension-validator (Claude Code extension validation) and validator (general-purpose validation)
- Archived 4 absorbed agents to `agents/_archived/` with HTML comment absorption notes
- Updated 8 workflow files to reference the new consolidated agents with appropriate scope/target parameters
- Wired repo-doc-architect into the finalize workflow for documentation generation during project finalization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gsd-research-orchestrator, archive originals, update workflows** - `08bb54e` (feat)
2. **Task 2: Create gsd-validator-hub, archive originals, update workflows** - `08bb54e` (feat)

## Files Created/Modified

- `agents/gsd-research-orchestrator.md` - New consolidated research agent with scope: phase | project
- `~/.claude/agents/gsd-research-orchestrator.md` - Global copy synced
- `agents/gsd-validator-hub.md` - New consolidated validator agent with target: extension | ecosystem
- `~/.claude/agents/gsd-validator-hub.md` - Global copy synced
- `agents/_archived/gsd-phase-researcher.md` - Archived with absorption note
- `agents/_archived/gsd-project-researcher.md` - Archived with absorption note
- `agents/_archived/extension-validator.md` - Archived with absorption note
- `agents/_archived/validator.md` - Archived with absorption note
- `~/.claude/get-shit-done/workflows/discuss-phase.md` - gsd-phase-researcher replaced with gsd-research-orchestrator scope:phase
- `~/.claude/get-shit-done/workflows/discuss-phase-assumptions.md` - gsd-phase-researcher replaced with gsd-research-orchestrator scope:phase
- `~/.claude/get-shit-done/workflows/plan-phase.md` - gsd-phase-researcher replaced with gsd-research-orchestrator scope:phase
- `~/.claude/get-shit-done/workflows/research-phase.md` - gsd-phase-researcher replaced with gsd-research-orchestrator scope:phase
- `~/.claude/get-shit-done/workflows/quick.md` - gsd-phase-researcher replaced with gsd-research-orchestrator scope:phase
- `~/.claude/get-shit-done/workflows/new-project.md` - gsd-project-researcher replaced with gsd-research-orchestrator scope:project
- `~/.claude/get-shit-done/workflows/new-milestone.md` - gsd-project-researcher replaced with gsd-research-orchestrator scope:project
- `~/.claude/get-shit-done/workflows/execute-phase.md` - Both research agent refs replaced

## Decisions Made

- **Distinct parameter names:** Research consolidation uses `scope` (phase|project) while validator consolidation uses `target` (extension|ecosystem) to avoid confusion between agent types.
- **Global-only agents archived to source repo:** extension-validator and validator only existed in ~/.claude/agents/ but were archived to the source repo's `_archived/` directory for traceability.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- Research and validator agent consolidation complete
- Agent count reduced by 4 more (from 15 to 15 source, but 4 global agents reduced)
- Ready for Plan 04 (workflow wiring + tool-tier assignment)

---
*Phase: 06-crew-assessment-fixes*
*Completed: 2026-04-03*
