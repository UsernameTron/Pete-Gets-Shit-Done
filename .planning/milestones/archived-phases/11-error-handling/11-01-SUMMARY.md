---
phase: 11-error-handling
plan: 01
subsystem: error-handling
tags: [error-class, error-codes, commonjs, core]

requires: []
provides:
  - GsdError class with code, context, and cause fields
  - GSD_ERROR_CODES frozen registry with 17 error categories
affects: [11-PLAN-02, 11-PLAN-03]

tech-stack:
  added: []
  patterns: [structured-error-class, frozen-error-code-registry]

key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
    - tests/core.test.cjs

key-decisions:
  - "Error codes use key-equals-value pattern (e.g., CONFIG_READ: 'CONFIG_READ') for simple equality checks"
  - "GsdError defaults context and cause to null rather than undefined for consistent serialization"

patterns-established:
  - "GsdError(code, message, {context, cause}): standard error construction signature for all GSD error paths"
  - "GSD_ERROR_CODES: single frozen registry all error-throwing code references"

requirements-completed: [CORR-01]

duration: 2min
completed: 2026-04-04
---

# Phase 11 Plan 01: GsdError Class and Error Code Registry Summary

**GsdError class extending Error with code/context/cause fields, plus 17-code frozen GSD_ERROR_CODES registry, fully tested**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T18:47:55Z
- **Completed:** 2026-04-04T18:49:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- GsdError class in core.cjs with structured error fields (code, context, cause)
- GSD_ERROR_CODES frozen registry covering config, state, phase, lock, git, file, parse, command, template, and validation categories
- Both exported from core.cjs module.exports
- 8 new unit tests covering construction, field storage, null defaults, combined fields, frozen check, expected codes, and string value validation
- All 187 tests pass (0 failures)

## Task Commits

Each task was committed atomically:

1. **Task 1+2: GsdError class, error codes, and tests** - `44bf248` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/core.cjs` - Added GsdError class and GSD_ERROR_CODES frozen registry; exported both
- `tests/core.test.cjs` - Added describe('GsdError') with 5 tests and describe('GSD_ERROR_CODES') with 3 tests

## Decisions Made
- Error codes use key-equals-value pattern (CONFIG_READ: 'CONFIG_READ') so code can be compared with either the constant or a raw string -- keeps things simple for a zero-dependency CommonJS module
- GsdError defaults context and cause to null rather than undefined, ensuring consistent behavior in JSON serialization and explicit null checks
- Combined both tasks into a single commit since the class and its tests are a single logical unit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GsdError and GSD_ERROR_CODES are exported and ready for Plans 02 and 03 to wrap existing catch blocks
- No blockers for downstream plans

## Self-Check: PASSED

- FOUND: get-shit-done/bin/lib/core.cjs
- FOUND: tests/core.test.cjs
- FOUND: .planning/phases/11-error-handling/11-01-SUMMARY.md
- FOUND: commit 44bf248

---
*Phase: 11-error-handling*
*Completed: 2026-04-04*
