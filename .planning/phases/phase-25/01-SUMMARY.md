---
phase: 25
plan: 1
title: "Error Path & Edge Case Tests"
status: complete
requirements_covered: ["E2E-11", "E2E-12", "E2E-13"]
tests_added: 38
total_e2e_tests: 133
---

# SUMMARY — Phase 25, Plan 01: Error Path & Edge Case Tests

## What Was Built

Three E2E test files covering failure modes, edge cases with corrupt/missing project states, and CI integration validation:

### Task 1: `tests/e2e/failure-modes.test.cjs` (15 tests)
- E001 detected for missing .planning/ directory
- E002 detected for missing PROJECT.md
- E003 detected for missing ROADMAP.md
- Invalid YAML triggers error status with non-empty errors array
- Healthy empty and mid-milestone projects return status: 'healthy'
- Non-existent cwd returns error for init new-project
- Missing required flags (state begin-phase without --phase) returns error
- Unknown subcommand returns error
- Error/warning/info objects have code and message fields

### Task 2: `tests/e2e/edge-cases.test.cjs` (12 tests)
- Orphan phase directory triggers warnings
- Version mismatch between STATE.md and ROADMAP.md detected
- Bare directory (no .planning/) returns project_exists: false
- Empty project: init progress returns phase_count: 0
- Empty project: progress json returns percent: 0
- Empty project: stats json returns zero counts
- Workstream status on flat project returns found: false
- init quick with empty description returns valid JSON
- init quick with 200+ char description truncates slug at 40 chars
- init milestone-op on empty project returns phase_count: 0
- init milestone-op on completed project returns all_phases_complete: true

### Task 3: `tests/e2e/ci-integration.test.cjs` (11 tests)
- Test runner script exists and passes node --check validation
- package.json has test:e2e and test:e2e:smoke scripts
- Scripts reference correct runner file and --smoke flag
- All E2E test files use node:test (zero external dependencies)
- No test files use jest, mocha, vitest, or ava
- Exit code propagation: smoke tests exit 0
- Exit code propagation: failing test exits non-zero
- childTestEnv() helper strips NODE_TEST_CONTEXT for reliable child process execution

## Files Created

| File | Tests | Lines |
|------|-------|-------|
| `tests/e2e/failure-modes.test.cjs` | 15 | ~350 |
| `tests/e2e/edge-cases.test.cjs` | 12 | ~380 |
| `tests/e2e/ci-integration.test.cjs` | 11 | ~280 |

## Key Technical Decisions

1. **`runGsdToolsSafe` pattern**: try/catch wrapper for commands expected to fail, returns `{ success, data, exitCode }` or `{ success, raw, exitCode }`
2. **`childTestEnv()` helper**: Strips `NODE_TEST_CONTEXT` from child process env to prevent Node's recursive test runner detection from silently skipping test execution
3. **Separate `bareDirCleanup`**: Edge case tests that operate on bare directories (no .planning/) need independent cleanup from fixture-based tests
4. **Error object structure validation**: Tests verify error/warning/info arrays contain objects with `code` and `message` string fields
5. **`fs.realpathSync(os.tmpdir())`**: macOS `/var/folders` symlink handling (consistent with all prior phases)

## Acceptance Criteria

- [x] E001 detected for missing .planning/ directory
- [x] E002 detected for missing PROJECT.md
- [x] E003 detected for missing ROADMAP.md
- [x] Invalid YAML triggers error status
- [x] Healthy projects correctly return status: 'healthy'
- [x] Commands handle missing/invalid arguments gracefully
- [x] Orphan phase triggers warnings
- [x] Version mismatch detected between STATE.md and ROADMAP.md
- [x] Empty directory returns valid JSON with project_exists: false
- [x] Empty project returns zero counts for progress/stats
- [x] Workstream status returns found: false on flat project
- [x] Very long description produces truncated slug
- [x] milestone-op on empty project returns zero phase counts
- [x] Test runner script exists and is valid JS
- [x] --smoke flag filters to smoke tests only
- [x] package.json has test:e2e and test:e2e:smoke scripts
- [x] All E2E test files use node:test (zero external dependencies)
- [x] Test runner propagates exit codes correctly

## Test Results

```
# tests 133
# suites 56
# pass 133
# fail 0
# duration_ms 1592ms
```
