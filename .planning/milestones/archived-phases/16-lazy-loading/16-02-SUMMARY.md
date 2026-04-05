---
phase: 16-lazy-loading
plan: 02
status: complete
requirement: PERF-04
started: "2026-04-04"
completed: "2026-04-04"
---

# Plan 16-02 Summary: lazyRegistry Utility

## What Was Built

Generic `lazyRegistry(initFn)` utility in `core.cjs` that creates a lazy-initialized, cached registry. The initFn is never called until `.get()` is first invoked, and the result is cached for all subsequent calls.

## Key Changes

- **core.cjs**: `lazyRegistry` function with Symbol sentinel pattern, exported in module.exports
- **tests/core.test.cjs**: 9 new tests covering deferred init, caching, `.initialized` flag, and all return types (object, array, string, number, null, undefined)

## Design Decisions

- `Symbol('lazyRegistry.UNSET')` sentinel — allows initFn to legitimately return null or undefined without triggering re-initialization on every `.get()` call
- Returns plain object with `.get()` method and `.initialized` getter — simple, explicit API
- No error handling wrapping — if initFn throws, error propagates naturally and next `.get()` retries (since _value is still UNSET)
- Zero dependencies, synchronous, pure CommonJS

## Verification

- `node --test tests/core.test.cjs` — 238 tests, 0 failures
- Smoke test: `0 false` → `1 true ok` confirms deferred init and caching
- All existing tests pass (no regressions)
