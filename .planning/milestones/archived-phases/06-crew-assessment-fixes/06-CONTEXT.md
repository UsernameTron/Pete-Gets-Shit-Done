# Phase 6: Crew Assessment Fixes - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Source:** PRD Express Path (docs/crew-assessment-fix-prompt.md)

<domain>
## Phase Boundary

Execute all 7 priorities from the `/gsd:crew --assess` output to consolidate overlapping agents (37→31), fix YAML parsing issues, introduce tool-access tiers, and add quality sections to low-scoring agents. All changes must be applied to both source (`~/projects/Pete-Gets-Shit-Done/agents/`) and global (`~/.claude/agents/`) copies.

</domain>

<decisions>
## Implementation Decisions

### Priority 1: YAML Parsing (8 agents)
- Convert all multi-line `description: >` blocks to single-line `description: "..."` strings
- Affected agents: architect, scaffolder, auditor, validator, memory-seeder, extension-validator, hook-engineer, plugin-builder
- Edit both source and global copies
- Verify YAML parses cleanly after each edit

### Priority 2: Verification Agent Consolidation (4→1)
- Merge gsd-plan-checker, gsd-integration-checker, gsd-nyquist-auditor INTO gsd-verifier
- gsd-verifier gets `scope` parameter: plan | integration | nyquist | general (default)
- Each mode inherits specific instructions from absorbed agent
- Add "what NOT to do" section and output format specs per mode
- Update workflow files: plan-phase → scope:plan, verify-work → scope:integration, execute/validate → scope:nyquist
- Archive 3 absorbed agents to agents/_archived/ with absorption note

### Priority 3: Research Agent Consolidation (2→1)
- Merge gsd-phase-researcher and gsd-project-researcher into gsd-research-orchestrator
- `scope: phase | project` parameter
- Phase scope = current phase plan and codebase research
- Project scope = broad new-project bootstrapping (×4 parallel pattern)
- Update workflows: discuss-phase/plan-phase → scope:phase, new-project → scope:project
- Archive both originals to _archived/

### Priority 4: Validator Agent Merge (2→1)
- Merge extension-validator and validator into gsd-validator-hub
- `target: extension | general` parameter
- Archive both originals to _archived/
- Update referencing workflows

### Priority 5: Utility Agent Workflow Wiring
- Wire repo-doc-architect into /gsd:finalize workflow (auto-generate docs during finalization)
- Wire repo-commit-documenter into /gsd:ship workflow (commit docs during shipping)
- Update workflow files only — agents stay standalone but get spawned

### Priority 6: Tool-Access Tiers
- Define 4 tiers: Explore (Read/Glob/Grep/Bash read-only), Research (Explore+WebSearch/WebFetch), Modify (Read/Write/Edit/Bash/Glob/Grep), Full (all tools+MCP)
- Assign minimum tier to every agent
- Update `allowed-tools` in YAML frontmatter
- Add `# Tier: [name]` comment for visibility
- Flag agents currently at Full that could operate lower

### Priority 7: Quality Sections for Low-Scoring Agents
- For every agent scoring 6-7/10: add "What NOT to do" (3-5 anti-patterns), output format spec, error handling instructions
- Use gsd-planner.md and gsd-verifier.md (both 9/10) as quality reference

### Execution Rules (Locked)
- Work priorities 1-7 in sequence
- Edit BOTH source and global copies for every file change
- After all 7: verification pass confirming zero YAML parsing errors
- Single commit: "crew-assessment: execute all 7 improvement priorities — consolidate agents 37→31, fix YAML, add quality sections"
- Update .planning/CREW-ASSESSMENT.md with execution log

### Claude's Discretion
- Internal structure of consolidated agent prompts (how to organize mode-specific instructions)
- Specific anti-patterns for Priority 7 quality sections (domain-appropriate choices)
- Order of agent processing within each priority
- Whether to batch or sequential-process tool-tier assignments

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent Source Files
- `agents/*.md` — All 37 current agent definitions (source of truth)
- `~/.claude/agents/*.md` — Global copies that must mirror source

### Workflow Files
- `~/.claude/get-shit-done/workflows/plan-phase.md` — References gsd-plan-checker, gsd-phase-researcher
- `~/.claude/get-shit-done/workflows/verify-work.md` — References gsd-integration-checker
- `~/.claude/get-shit-done/workflows/execute-phase.md` — References gsd-nyquist-auditor
- `~/.claude/get-shit-done/workflows/new-project.md` — References gsd-project-researcher
- `~/.claude/get-shit-done/workflows/finalize.md` — Target for repo-doc-architect wiring
- `~/.claude/get-shit-done/workflows/ship.md` — Target for repo-commit-documenter wiring

### Assessment
- `.planning/CREW-ASSESSMENT.md` — Assessment results with scores and priorities

</canonical_refs>

<specifics>
## Specific Ideas

- Agent count reduction: 37→31 (6 agents archived via consolidation in P2/P3/P4)
- Quality reference: gsd-planner.md and gsd-verifier.md as 9/10 exemplars
- Tool tier names map to capability levels, not trust levels

</specifics>

<deferred>
## Deferred Ideas

None — outline covers full phase scope

</deferred>

---

*Phase: 06-crew-assessment-fixes*
*Context gathered: 2026-04-03 via PRD Express Path*
