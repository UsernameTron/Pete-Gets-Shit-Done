# Phase 46: Housekeeping - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Source:** Research agents + foundation audit findings

<domain>
## Phase Boundary

Close the 4 remaining WARN items from the v2.4 foundation audit. All items are documentation drift, coverage gaps, or convention issues — no new features, no architectural changes.

</domain>

<decisions>
## Implementation Decisions

### DOC-01: Documentation Count Accuracy
- README.md currently states 16 agents / 61 commands; actual count is 18 agents / 63 commands
- Missing agents: `gsd-dependency-auditor`, `gsd-ecosystem-auditor`
- Missing commands: `/gsd:audit-agents`, `/gsd:audit-deps`
- Both README.md and CLAUDE.md must be updated
- Agent count appears in README.md lines referencing "16 agents" and in the agent table
- Command count appears in README.md lines referencing "61 commands" and in the GSD Commands table
- CLAUDE.md references "16 built-in agents" and "61 slash commands"

### COV-01: Branch Coverage Gaps
- `workstream.cjs` (get-shit-done/bin/lib/workstream.cjs): 50.68% branch coverage, target 80%
  - Uncovered: error rollback in migrateToWorkstreams, cmdWorkstreamCreate migration failure, cmdWorkstreamComplete error rollback, getOtherActiveWorkstreams edge cases
  - File is 492 lines with 9 exported functions
  - Existing tests: tests/workstream.test.cjs (513 tests), tests/e2e/workstream-management.test.cjs
- `build-hooks.js` (scripts/build-hooks.js): 63.63% branch coverage, target 80%
  - Uncovered: non-SyntaxError exception in validateSyntax, missing source file path, syntax error detection in hook files, build failure exit code, pattern injection edge cases
  - File is 116 lines with 2 main functions
  - Existing tests: tests/build-hooks.test.cjs (7 tests)

### LINK-01: Command/Workflow Convention
- 63 commands in commands/gsd/, 56 workflows in get-shit-done/workflows/
- 15 commands without matching workflows: add-backlog, audit-agents, audit-deps, crew, debug, finalize, join-discord, portfolio, prime-patterns, reapply-patches, resume-work, review-backlog, set-profile, thread, workstreams
- 8 workflows without matching commands: diagnose-issues, discovery-phase, discuss-phase-assumptions, execute-plan, node-repair, resume-project, transition, verify-phase
- Known cross-references: resume-work command -> resume-project workflow
- 2 commands already have exemption comments: audit-agents ("orchestration is simple enough to live inline"), audit-deps (same)
- Orphaned workflows are internal sub-workflows (used by other workflows, not user-facing)
- Convention is NOT documented anywhere centrally
- Hybrid approach: add exemption comments to commands with simple inline logic, document convention in a dedicated section

### REF-01: Hardcoded Path in crew.md
- File: commands/gsd/crew.md, line 33
- Contains: `~/projects/Pete-Gets-Shit-Done/agents/`
- Fix: Replace with portable fallback using get-shit-done plugin's own agents/ directory relative to the skill file, or use a dynamic path construction

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Documentation
- `README.md` — Public-facing docs with agent/command counts and tables
- `CLAUDE.md` — Project governance with agent roster and command counts

### Coverage Targets
- `get-shit-done/bin/lib/workstream.cjs` — Workstream management module (coverage target)
- `scripts/build-hooks.js` — Hook build script (coverage target)
- `tests/workstream.test.cjs` — Existing workstream tests (extend, don't replace)
- `tests/build-hooks.test.cjs` — Existing build-hooks tests (extend, don't replace)

### Convention
- `commands/gsd/` — All 63 command files
- `get-shit-done/workflows/` — All 56 workflow files
- `commands/gsd/audit-agents.md` — Example of inline exemption comment pattern
- `commands/gsd/audit-deps.md` — Example of inline exemption comment pattern

### Portability
- `commands/gsd/crew.md` — Contains hardcoded path at line 33

</canonical_refs>

<specifics>
## Specific Ideas

- For LINK-01, a simple comment like `<!-- workflow: inline — orchestration simple enough to live in the command -->` at the top of command files that don't need separate workflows
- For REF-01, the fix is a single line change — replace the hardcoded path with the plugin's own agents directory or a dynamic CWD-based resolution
- For COV-01, focus on error injection tests (mock fs failures) for workstream.cjs and edge-case tests for build-hooks.js

</specifics>

<deferred>
## Deferred Ideas

None — this phase closes the v2.4 foundation audit. No further scope.

</deferred>

---

*Phase: 46-housekeeping*
*Context gathered: 2026-04-16 via research agents*
