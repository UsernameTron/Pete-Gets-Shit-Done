---
phase: 24
plan: 1
title: "Utility & Lifecycle Tests"
status: complete
requirements_covered: ["E2E-07", "E2E-08", "E2E-09", "E2E-10"]
tests_added: 54
total_e2e_tests: 95
---

# SUMMARY — Phase 24, Plan 01: Utility & Lifecycle Tests

## What Was Built

Four E2E test files covering utility commands, progress/stats/health, milestone lifecycle, and workstream management:

### Task 1: `tests/e2e/utility-commands.test.cjs` (12 tests)
- JSON structure validation for `init quick`
- Slug generation: sanitization, special characters, truncation at 40 chars
- quick_id format: YYMMDD-base36 pattern validation
- Empty project fixture: planning_exists and roadmap_exists detection

### Task 2: `tests/e2e/progress-stats-health.test.cjs` (18 tests)
- progress json: milestone version, phases array, percent calculation
- progress table: rendered markdown table output
- progress bar: bar string with percent and counts
- stats json: milestone, phase, requirement counts
- validate health: healthy project detection, corrupt project error codes (E003)

### Task 3: `tests/e2e/milestone-lifecycle.test.cjs` (16 tests)
- init new-milestone: model strings, milestone detection, project state flags
- init milestone-op: phase counting, all_phases_complete detection, archive tracking
- init progress: phase array with status values, current/next phase identification

### Task 4: `tests/e2e/workstream-management.test.cjs` (8 tests)
- Flat project detection (mode: 'flat')
- Workstream creation with all expected fields
- Duplicate creation error handling (already_exists)
- List after creation with workstream metadata
- Status for existing and non-existent workstreams
- Complete for non-existent workstream error handling

## Files Created

| File | Tests | Lines |
|------|-------|-------|
| `tests/e2e/utility-commands.test.cjs` | 12 | ~250 |
| `tests/e2e/progress-stats-health.test.cjs` | 18 | ~400 |
| `tests/e2e/milestone-lifecycle.test.cjs` | 16 | ~370 |
| `tests/e2e/workstream-management.test.cjs` | 8 | ~200 |

## Key Technical Decisions

1. **`execFileSync` over `execSync`**: Shell injection safety per SEC-01
2. **Separate `runGsdToolsRaw` helper**: progress table/bar use `rawValue` path that emits plain text with `--raw`
3. **PLAN.md files in fixtures**: `cmdInitProgress` requires `plan_count > 0` for 'complete' status
4. **Flat-mode workstream list**: Does not include `count` field — only workstream mode does
5. **`fs.realpathSync(os.tmpdir())`**: macOS `/var/folders` symlink handling

## Acceptance Criteria

- [x] init quick returns all expected fields with correct types
- [x] quick_id matches YYMMDD-xxx format
- [x] slug is properly sanitized from description
- [x] planning_exists and roadmap_exists reflect fixture state
- [x] progress json returns all expected fields
- [x] progress table returns rendered markdown
- [x] progress bar returns bar string with percent
- [x] stats returns milestone, phase, and requirement counts
- [x] validate health detects healthy and broken states
- [x] Error codes (E003) present for missing files
- [x] init new-milestone returns all expected fields
- [x] init milestone-op phase counting matches fixture state
- [x] all_phases_complete is true for completed fixtures, false for mid-milestone
- [x] init progress returns phase array with correct status values
- [x] current_phase and next_phase correctly identified
- [x] Flat project correctly detected as mode: 'flat'
- [x] Workstream creation returns all expected fields
- [x] Duplicate creation returns already_exists error
- [x] List reflects created workstreams with correct metadata
- [x] Status returns found: true/false correctly
- [x] Complete handles existing and non-existent workstreams

## Test Results

```
# tests 95
# suites 44
# pass 95
# fail 0
# duration_ms 1434ms
```
