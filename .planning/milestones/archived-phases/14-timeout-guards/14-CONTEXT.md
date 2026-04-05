---
phase: 14
title: "Timeout Guards & Graceful Degradation"
status: context-gathered
---

# CONTEXT — Phase 14: Timeout Guards & Graceful Degradation

## Requirements

- **CORR-07**: Safe execution wrapper in core.cjs returning `{ok, exitCode, stdout, stderr, timedOut}` with configurable timeout
- **CORR-08**: Apply safe wrapper to `execGit()` and other high-frequency shell callers
- **CORR-09**: `withPlanningLock()` force-acquire path must log diagnostic message with stale lock details

## Source Analysis

### execGit() — core.cjs:569-580

Currently uses `spawnSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf-8' })` with NO timeout. Returns `{ exitCode, stdout, stderr }`. Called 18 times across commands.cjs (13), verify.cjs (2), and core.cjs itself (3). All callers check `exitCode` — adding `timedOut` field is backward-compatible.

### withPlanningLock() — core.cjs:621-666

File-based lock with 10s timeout, 30s stale threshold. Force-acquire path at lines 663-665 silently removes the lock and proceeds. No diagnostic output about what lock was stale, who held it, or when it was acquired. `debugLog()` (added in Phase 11, gated by GSD_DEBUG) is available for this.

### init.cjs

Has 3 shell calls with explicit 5000ms timeouts already. No changes needed.

## Design Decisions

- `safeExec()` wraps `spawnSync` with `timeout` option (Node.js built-in) — no external dependencies
- Returns `timedOut: true` when `result.signal === 'SIGTERM'` or `result.error?.code === 'ETIMEDOUT'`
- Default timeout: 30000ms (30s), configurable per-call
- `execGit()` becomes a thin wrapper: calls `safeExec('git', args, { cwd, timeout })` and maps the result
- Force-acquire logging uses existing `debugLog()` — reads lock file JSON before deleting it

## Dependencies

- Phase 11 (GsdError, debugLog) — COMPLETE
- Phase 12 (deepFreeze) — COMPLETE
- Phase 13 (tech debt) — COMPLETE
