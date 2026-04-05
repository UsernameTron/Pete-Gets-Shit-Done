# Phase 16: Lazy Loading - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase -- autonomous mode)

<domain>
## Phase Boundary

Defer agent definition parsing and skill registry scanning until first access, reducing startup cost for commands that never touch those registries.

Requirements: PERF-03 (lazy-load agent definitions in model-profiles.cjs), PERF-04 (lazy-load skill registry).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion -- pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints:
- Zero-dependency CommonJS (no npm packages)
- Synchronous architecture
- Backward compatible: all existing callers of MODEL_PROFILES and skill APIs continue working without changes
- model-profiles.cjs currently defines MODEL_PROFILES at module scope (line 9-20), parsed on require()
- readSubdirectories in core.cjs is the primary directory scanning primitive
- Tests in tests/model-profiles.test.cjs cover model profile behavior

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `get-shit-done/bin/lib/model-profiles.cjs` -- Agent-to-model mapping, target for PERF-03 lazy loading
- `tests/model-profiles.test.cjs` -- Test suite for model profiles
- `get-shit-done/bin/lib/core.cjs` -- Main utility library, may host skill registry lazy loading (PERF-04)
- `tests/core.test.cjs` -- Test suite for core utilities

### Current model-profiles.cjs Pattern
- `MODEL_PROFILES` object defined at module scope (immediate parse)
- `VALID_PROFILES` derived from MODEL_PROFILES at module scope
- `getAgentToModelMapForProfile()` iterates MODEL_PROFILES
- `formatAgentToModelMapAsTable()` formats mapping as table
- All four exported via module.exports

### Established Patterns
- CommonJS module.exports pattern
- Node.js built-in modules only (path, fs, child_process, crypto)
- c8 coverage instrumentation
- readSubdirectories() in core.cjs for filesystem scanning

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
