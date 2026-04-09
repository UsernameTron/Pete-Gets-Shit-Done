---
phase: 06-crew-assessment-fixes
plan: 04
subsystem: agents
tags: [workflow-wiring, tool-tiers, agent-config]

requires:
  - phase: 06-crew-assessment-fixes/02
    provides: "Consolidated verification agents (4-to-1)"
  - phase: 06-crew-assessment-fixes/03
    provides: "Consolidated research and validator agents"
provides:
  - "repo-doc-architect wired into finalize workflow"
  - "repo-commit-documenter wired into ship workflow"
  - "All 15 source agents have tool-access tier assignments"
affects: [agent-ecosystem, workflows]

tech-stack:
  added: []
  patterns: ["3-tier tool access: Explore, Research, Modify"]

key-files:
  created: []
  modified:
    - "~/.claude/get-shit-done/workflows/ship.md"
    - "~/projects/Pete-Gets-Shit-Done/commands/gsd/finalize.md"

key-decisions:
  - "3 tiers (Explore, Research, Modify) instead of 4 -- Full tier not needed"
  - "Tier assigned via YAML comment for visibility"

patterns-established:
  - "Tool-access tier system for agent least-privilege"

requirements-completed: [CREW-05, CREW-06]

duration: 15min
completed: 2026-04-04
---

# Phase 6 Plan 04: Ship/Finalize Wiring + Tool Tiers Summary

**Wired repo-commit-documenter into ship and repo-doc-architect into finalize workflows, then assigned 3-tier tool access (Explore, Research, Modify) to all 15 source agents**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-04
- **Completed:** 2026-04-04
- **Tasks:** 2
- **Files modified:** 17 (2 workflows + 15 agent files)

## Accomplishments

- Wired repo-commit-documenter into the ship workflow for automatic commit documentation generation
- Wired repo-doc-architect into the finalize command for automatic project documentation updates during finalization
- Defined 3-tier tool access model: Explore (read-only), Research (read + web), Modify (read + write + edit)
- Assigned appropriate tier to all 15 source agents based on their actual operational needs
- Added YAML comment `# Tier: [TierName]` to each agent for visibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire utility agents into GSD workflows** - `db5475a` (feat)
2. **Task 2: Assign tool-access tiers to all active agents** - `db5475a` (feat)

## Files Created/Modified

- `~/.claude/get-shit-done/workflows/ship.md` - Added repo-commit-documenter spawn step
- `~/projects/Pete-Gets-Shit-Done/commands/gsd/finalize.md` - Added repo-doc-architect spawn step

**Agent tier assignments (15 agents):**

| Tier | Agents |
|------|--------|
| **Explore** (Read, Glob, Grep, Bash read-only) | gsd-assumptions-analyzer, gsd-ui-checker, gsd-user-profiler, gsd-validator-hub |
| **Research** (Read, Glob, Grep, Bash, WebSearch, WebFetch) | gsd-advisor-researcher, gsd-research-orchestrator, gsd-ui-researcher |
| **Modify** (Read, Write, Edit, Bash, Glob, Grep) | gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-verifier |

## Decisions Made

- **3 tiers instead of 4:** The Full tier (all tools including MCP) was not needed by any current agent. Dropping it simplifies the model and avoids granting unnecessary permissions.
- **Tier via YAML comment:** Using `# Tier: Explore` comments instead of a separate metadata field keeps the tier visible to humans reading agent files without requiring parser changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- All utility agents wired into their respective GSD workflows
- All 15 source agents have explicit tool-access tier assignments following least-privilege
- Ready for Plan 05 (quality sections and final verification)

---
*Phase: 06-crew-assessment-fixes*
*Completed: 2026-04-04*
