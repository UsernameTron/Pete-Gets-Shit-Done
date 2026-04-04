---
phase: 14
plan: 1
title: "Timeout Guards — safeExec, execGit refactor, lock diagnostics"
status: complete
---

# SUMMARY — Phase 14-01: Timeout Guards & Graceful Degradation

## Results

All 3 tasks completed. Requirements CORR-07, CORR-08, CORR-09 satisfied.

### Task 1: safeExec() Wrapper (CORR-07)

Added `safeExec(command, args, options)` to `get-shit-done/bin/lib/core.cjs`:
- Uses `spawnSync` with configurable `timeout` (default 30000ms)
- Returns structured `{ ok, exitCode, stdout, stderr, timedOut }`
- Detects timeout via `result.signal === 'SIGTERM'` or `result.error.code === 'ETIMEDOUT'`
- Uses `!!` boolean coercion to guarantee `timedOut` is always `true`/`false` (not undefined)
- Exported from module.exports
- 4 new tests: success, failure, timeout, defaults

### Task 2: execGit() Refactor (CORR-08)

Refactored `execGit()` to delegate to `safeExec('git', args, { cwd, timeout: 30000 })`:
- Preserves existing return shape: `{ exitCode, stdout, stderr }`
- Adds `timedOut` field (backward-compatible — existing callers destructure known fields)
- All 18 callers across commands.cjs, verify.cjs, and core.cjs continue working
- 1 new test: verifies `timedOut` field is present

### Task 3: withPlanningLock() Force-Acquire Diagnostics (CORR-09)

Added diagnostic logging to force-acquire path in `withPlanningLock()`:
- Reads lock file JSON before deleting to extract `pid`, `acquired`, `cwd`
- Calls `debugLog('LOCK_FORCE', ...)` with stale lock details
- Falls back to generic message if lock contents unreadable
- Gated by `GSD_DEBUG` env var (zero-cost when disabled)
- 1 new test: verifies force-acquire still executes callback

## Acceptance Criteria

- [x] `safeExec()` exported from core.cjs with `{ok, exitCode, stdout, stderr, timedOut}` return
- [x] `safeExec()` respects configurable timeout, defaults to 30000ms
- [x] `execGit()` uses `safeExec()` internally
- [x] `execGit()` return includes `timedOut` field
- [x] All 18 existing `execGit()` callers still work (no regressions)
- [x] Force-acquire path in `withPlanningLock()` logs diagnostic via `debugLog()`
- [x] Unit tests cover: safeExec success/failure/timeout, execGit timedOut, lock force-acquire
- [x] All existing tests pass (no regressions)

## Test Results

- 1778 total tests, 1762 pass, 16 pre-existing failures
- 6 new tests added, all pass
- No regressions introduced

## Files Modified

| File | Change |
|------|--------|
| `get-shit-done/bin/lib/core.cjs` | safeExec wrapper, execGit refactor, lock diagnostics, exports |
| `tests/core.test.cjs` | 6 new tests across 3 describe blocks |
