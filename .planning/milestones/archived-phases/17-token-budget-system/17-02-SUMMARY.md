---
phase: 17-token-budget-system
plan: 02
status: complete
requirement: PERF-06
started: "2026-04-04"
completed: "2026-04-04"
---

# Plan 17-02 Summary: budgetContext Utility

## What Was Built

Added `budgetContext(limit, sections, opts)` utility to `core.cjs` that selects the highest-priority content sections that fit within a token budget. Uses `estimateTokens` internally for measurement -- no duplicated heuristic logic.

## Key Changes

- **core.cjs**: `budgetContext` function with greedy priority-first algorithm, stable sort via index preservation, opts.model passthrough to estimateTokens; added to module.exports
- **tests/core.test.cjs**: 9 new tests in `describe('budgetContext')` block covering empty sections, zero limit, single section fits/doesn't fit, priority sorting, budget overflow dropping lower priority, stable sort for equal priorities, model profile affecting budget, and priority-ordered output regardless of input order

## Design Decisions

- **Greedy algorithm**: Iterates priority-sorted sections, includes each if it fits in remaining budget. Optimal for "pack by priority" use case -- higher priority items always included first.
- **Stable sort via index preservation**: Wraps sections with original index, sorts by priority then index. Guarantees stable ordering across all JS engines and makes intent explicit in tests.
- **Skips sections that don't fit**: If a section exceeds remaining budget, it is skipped (not truncated). Partial content is worse than no content for context sections.
- **opts passthrough**: The opts object (containing model) is passed directly to estimateTokens, so the same model profile governs all estimates within a single call.
- **Returns new array**: Does not mutate the input sections array.
- **Zero dependencies beyond estimateTokens**: synchronous, pure CommonJS.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `node --test tests/core.test.cjs` -- 259 tests, 0 failures (9 new budgetContext + 250 existing)
- Smoke test: `budgetContext(100, [{content:'hello world',priority:2},{content:'important',priority:1}])` returns `[1, 2]` priority order; `budgetContext(3, ...)` returns `[1]` only
- Integration test: `estimateTokens('a b c')` returns 4, `budgetContext(4, ...)` fits 1, `budgetContext(3, ...)` fits 0
- All verification greps confirm function, export, and test describe block present
