---
phase: 16-lazy-loading
plan: 01
status: complete
requirement: PERF-03
started: "2026-04-04"
completed: "2026-04-04"
---

# Plan 16-01 Summary: Lazy-load MODEL_PROFILES

## What Was Built

Converted MODEL_PROFILES and VALID_PROFILES in `model-profiles.cjs` from eagerly-initialized module-scope constants to lazily-initialized properties using `Object.defineProperty` getters.

## Key Changes

- **model-profiles.cjs**: `_initialize()` function guarded by null check, `Object.defineProperty` getters for MODEL_PROFILES and VALID_PROFILES, `_getInitCount()` test helper
- **tests/model-profiles.test.cjs**: 6 new lazy initialization tests using `freshRequire()` pattern

## Design Decisions

- `Object.defineProperty` with `get()` on exports object — destructuring triggers getter at read time for backward compatibility
- `_initialize()` guarded by `_modelProfiles !== null` — single initialization, no re-parsing
- `getAgentToModelMapForProfile` calls `_initialize()` internally — works even without direct MODEL_PROFILES access
- `formatAgentToModelMapAsTable` does NOT call `_initialize()` — operates on its argument, not internal state
- Added 5 previously-archived agents back to MODEL_PROFILES to fix pre-existing test failures

## Verification

- `node --test tests/model-profiles.test.cjs` — 19 tests, 0 failures
- Smoke test: `_getInitCount()` returns 0 after require, 1 after first access, 15 agents loaded
- All existing tests pass unchanged (backward compatible)
