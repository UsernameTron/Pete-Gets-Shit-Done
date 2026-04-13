---
phase: 41-hook-ports
plan: "02"
subsystem: hooks
tags: [hooks, cost-tracking, build-pipeline, installer, PostToolUse, JSONL]
dependency_graph:
  requires: [41-01]
  provides: [hooks/gsd-cost-tracker.js, scripts/build-hooks.js, bin/install.js]
  affects: [hooks, tests, build, installer]
tech_stack:
  added: []
  patterns: [GSD-stdin-pattern, JSONL-metrics, inlined-utilities, fail-closed-blocking]
key_files:
  created:
    - hooks/gsd-cost-tracker.js
    - tests/cost-tracker-hook.test.cjs
  modified:
    - scripts/build-hooks.js
    - bin/install.js
    - tests/integ-governance-hooks.test.cjs
decisions:
  - "No stdout passthrough in cost-tracker: GSD PostToolUse hooks exit 0 silently; ECC's process.stdout.write(raw) omitted as unnecessary"
  - "appendFileSync over appendFile utility: cost-tracker is zero-dep; fs.appendFileSync is built-in and eliminates the ECC lib/utils import"
  - "config-protection registered with Write|Edit matcher (not all tools): only file-write operations can touch config files — matcher narrows false-positive surface"
  - "Auto-fixed 3 stale integ test assertions: prompt guard changed to fail-closed in plan 01 but integ-governance-hooks.test.cjs still asserted exit 0 advisory behavior"
metrics:
  duration_minutes: 4
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
  tests_added: 17
  completed_date: "2026-04-13T20:46:22Z"
requirements_satisfied: [HOOK-03]
---

# Phase 41 Plan 02: Hook Ports Summary

Cost tracker hook ported from ECC with inlined utilities, JSONL metrics writing, and three-tier pricing; all Phase 41 hooks (prompt guard, config protection, cost tracker) wired into build pipeline and installer registration.

## What Was Built

### Task 1: gsd-cost-tracker.js — JSONL cost tracking PostToolUse hook (HOOK-03)

New hook at `hooks/gsd-cost-tracker.js`. Source: ECC diamond hunt `cost-tracker.js`.

Adaptations made during port:
- Removed `require('../lib/utils')` (ECC's `ensureDir`, `appendFile`, `getClaudeDir`) — replaced with inlined equivalents
- Replaced ECC's `process.stdout.write(raw)` passthrough with `process.exit(0)` — GSD PostToolUse hooks are advisory and exit silently
- Added `const os = require('os')` for `os.homedir()` fallback in `getClaudeDir()`
- Added `setTimeout(() => process.exit(0), 3000)` GSD stdin timeout pattern
- Used `fs.appendFileSync` instead of ECC's `appendFile` utility
- Kept cost estimation logic verbatim: haiku (0.8/4.0), sonnet (3.0/15.0), opus (15.0/75.0) per 1M tokens
- Kept JSONL row format: `{ timestamp, session_id, model, input_tokens, output_tokens, estimated_cost_usd }`
- Kept 1MB stdin guard (`MAX_STDIN`) and silent catch pattern

### Task 2: Build pipeline and installer wiring for all 3 Phase 41 hooks

**scripts/build-hooks.js** — HOOKS_TO_COPY array expanded from 5 to 7 entries:
- Added `gsd-config-protection.js` (Plan 01)
- Added `gsd-cost-tracker.js` (this plan)
- Build produces 7 dist files; syntax-validates each before copying

**bin/install.js** — four changes:
1. `configProtectionCommand` and `costTrackerCommand` variables added after `promptGuardCommand`
2. `cost-tracker` registered in `PostToolUse` (no matcher — tracks all tool calls)
3. `config-protection` registered in `PreToolUse` with `Write|Edit` matcher (only file edits can touch config files)
4. Uninstall `gsdHooks` array expanded to include `gsd-cost-tracker.js` and `gsd-config-protection.js`

## Test Coverage

| File | Tests | Result |
|------|-------|--------|
| tests/cost-tracker-hook.test.cjs | 17 | All pass |
| **Total (plan 02)** | **17** | **All pass** |
| **Total (phase 41)** | **55** | **All pass** |

Full suite: 2448 tests pass, 0 failures.

## Commits

| Hash | Description |
|------|-------------|
| ff8412c | feat(41-02): port cost tracker hook from ECC |
| 3acb687 | feat(41-02): wire hooks into build pipeline and installer |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3 stale integration test assertions for prompt guard**
- **Found during:** Task 2 — full test suite run
- **Issue:** `tests/integ-governance-hooks.test.cjs` contained 3 tests asserting `exitCode === 0` and advisory-style output for the prompt guard. Plan 01 changed the guard to fail-closed (exit 2), but these integration tests were not updated.
- **Fix:** Updated assertions to `exitCode === 2` and added `permissionDecision === 'deny'` checks. JSON stdout still accessible from `result.stdout` — the hook writes JSON before calling `process.exit(2)`.
- **Files modified:** `tests/integ-governance-hooks.test.cjs`
- **Commit:** 3acb687

## Known Stubs

None — all hooks are fully functional and wired.

## Self-Check: PASSED

Files exist:
- hooks/gsd-cost-tracker.js: FOUND
- tests/cost-tracker-hook.test.cjs: FOUND
- scripts/build-hooks.js (modified): FOUND
- bin/install.js (modified): FOUND
- tests/integ-governance-hooks.test.cjs (modified): FOUND

Commits exist:
- ff8412c: FOUND
- 3acb687: FOUND

Verification:
- node --test tests/cost-tracker-hook.test.cjs: 17/17 pass
- node scripts/build-hooks.js: 7 dist files, no errors
- hooks/dist/gsd-config-protection.js: FOUND
- hooks/dist/gsd-cost-tracker.js: FOUND
- grep gsd-config-protection bin/install.js: 4 occurrences (var, registration, uninstall, exists-check)
- grep gsd-cost-tracker bin/install.js: 4 occurrences (var, registration, uninstall, exists-check)
- npm test: 2448/2448 pass
