---
phase: 30
plan: 2
title: "Config Extension and resolveModelInternal() Dynamic Path"
status: complete
requirements_covered: ["INTEL-01", "INTEL-04", "INTEL-06"]
tests_added: 20
---

# SUMMARY — Phase 30.2: Config Extension and resolveModelInternal() Dynamic Path

## What Was Built

### Task 1: routing_strategy in VALID_CONFIG_KEYS (INTEL-04)
- Added `'routing_strategy'` to the `VALID_CONFIG_KEYS` Set in `config.cjs`
- Configs containing `routing_strategy` now pass validation

### Task 2: routing_strategy default in loadConfig() (INTEL-04)
- Added `routing_strategy: 'static'` to defaults in `core.cjs:loadConfig()`
- Default ensures zero behavior change for all existing users
- User config `{ routing_strategy: 'dynamic' }` overrides correctly
- Frozen config object includes `routing_strategy`

### Task 3: Extended resolveModelInternal() with taskContext (INTEL-01, INTEL-06)
- Changed signature: `resolveModelInternal(cwd, agentType, taskContext)`
- Added dynamic routing branch after override/omit checks, before static lookup
- When `taskContext` is undefined (all existing callers), exact v1.9 code path
- When `taskContext` provided AND `routing_strategy !== 'static'`:
  - Lazy-requires `model-profiles.cjs` inside branch (avoids circular deps)
  - Calls `dynamicSelect(agentType, taskContext, config)`
  - Logs routing rationale via `debugLog('MODEL_ROUTE', ...)`
  - Extra log for critical complexity via `debugLog('MODEL_ROUTE_CRITICAL', ...)`
  - Resolves alias through `MODEL_ALIAS_MAP` when `resolve_model_ids` is set

### Task 4: Unit tests
- 13 tests for dynamic routing behavior (backward compat, strategy handling, overrides, omit, resolve_model_ids)
- 4 tests for debug logging (dynamic path logs, critical extra log, static path no logs)
- 3 config validation tests (routing_strategy in valid keys, dynamic passes validation)

## Files Modified
- `get-shit-done/bin/lib/config.cjs` — VALID_CONFIG_KEYS addition
- `get-shit-done/bin/lib/core.cjs` — loadConfig defaults + resolveModelInternal extension
- `tests/core.test.cjs` — 17 new tests
- `tests/config.test.cjs` — 3 new tests

## Test Results
- 20 new tests, all passing
- Full suite: 1950 tests (cumulative with Wave 1), 0 failures
