---
phase: phase-19
plan: 01
status: complete
completed: "2026-04-04"
requirement: MAINT-02
---

# 19-01 Summary: Feature Flags for Experimental Capabilities

## What Was Built

1. **createFeatureFlags(config) factory** in core.cjs:
   - `isEnabled(name)` — returns true only when flag is explicitly `true`
   - `listFlags()` — returns array of flag names
   - `toJSON()` — returns copy of flags object
   - Pure function, no imports, architecture-safe

2. **`features: {}` in config.cjs hardcoded defaults** with three-level merge:
   - hardcoded.features ← userDefaults.features ← choices.features
   - Same merge pattern as git, workflow, hooks, agent_skills

3. **8 new tests** in tests/core.test.cjs:
   - Method existence, enabled/disabled/unset flags, listFlags, toJSON
   - Null config, missing features key — graceful handling

## Verification

- core.test.cjs: 278/278 pass (includes 8 new)
- architecture.test.cjs: 4/4 pass
- No regressions

## Files Changed

| File | Change |
|------|--------|
| `get-shit-done/bin/lib/core.cjs` | +17 lines (factory function + export) |
| `get-shit-done/bin/lib/config.cjs` | +5 lines (features default + merge) |
| `tests/core.test.cjs` | +52 lines (8 tests) |
