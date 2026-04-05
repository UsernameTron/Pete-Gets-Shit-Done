# Phase 15: Core Performance Primitives - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — autonomous mode)

<domain>
## Phase Boundary

Provide streaming output and deterministic ordering utilities so downstream code can write incrementally and produce cache-stable hashes.

Requirements: PERF-01 (streaming output helper), PERF-02 (cache-stable ordering utility).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints:
- Zero-dependency CommonJS (no npm packages)
- Synchronous architecture (no async streaming / ReadableStream)
- Functions added to core.cjs following existing export patterns
- Tests added to tests/core.test.cjs following existing test patterns

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `get-shit-done/bin/lib/core.cjs` — Main utility library, target for new functions
- `get-shit-done/tests/core.test.cjs` — Test suite for core utilities

### Established Patterns
- CommonJS module.exports pattern
- Node.js built-in modules only (path, fs, child_process, crypto)
- c8 coverage instrumentation
- Existing utilities: deepFreeze(), safeExec(), GsdError, loadConfig(), etc.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
