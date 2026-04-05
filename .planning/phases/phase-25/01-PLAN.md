---
phase: 25
plan: 1
title: "Error Path & Edge Case Tests"
requirements: ["E2E-11", "E2E-12", "E2E-13"]
complexity: medium
created: "2026-04-04"
---

# PLAN — Phase 25: Error Path & Edge Case Tests

**Phase goal:** Write E2E tests covering failure modes, edge cases with corrupt/missing project states, and CI integration validation.

**Requirements:** E2E-11, E2E-12, E2E-13
**Complexity:** Medium
**Target directory:** `tests/e2e/`

---

## Tasks

### Task 1: E2E test for failure modes and error codes (E2E-11)

**Files:**
- `tests/e2e/failure-modes.test.cjs` (new)

**Actions:**
1. Test `validate health` on project missing `.planning/` directory entirely:
   - Returns `status: 'broken'`
   - `errors[]` contains object with `code: 'E001'`
2. Test `validate health` on project missing PROJECT.md:
   - Returns `status: 'broken'`
   - `errors[]` contains `code: 'E002'`
3. Test `validate health` on `createCorruptProject('missing-roadmap')`:
   - Returns `status: 'broken'`
   - `errors[]` contains `code: 'E003'`
4. Test `validate health` on `createCorruptProject('invalid-yaml')`:
   - Returns `status` of `'broken'` or `'error'`
   - `errors[]` is non-empty
5. Test `validate health` on healthy project (`createEmptyProject()`):
   - Returns `status: 'healthy'`
   - `errors[]` is empty array
6. Test `validate health` on `createMidMilestoneProject()`:
   - Returns `status: 'healthy'`
   - `repairable_count` is a number
7. Test commands against non-existent directory:
   - `init new-project` with cwd pointing to a non-existent path → throws or returns error
8. Test `state begin-phase` with missing required flags:
   - Missing `--phase` → returns error or exits non-zero

**Testable surface:**
- `gsd-tools.cjs validate health` → `cmdValidateHealth` (verify.cjs:522-714)
- `gsd-tools.cjs init new-project` → `cmdInitNewProject` (init.cjs)
- `gsd-tools.cjs state begin-phase` → `cmdStateBeginPhase` (state.cjs)
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`, `createCorruptProject(type)`

**Acceptance criteria:**
- [ ] E001 detected for missing .planning/ directory
- [ ] E002 detected for missing PROJECT.md
- [ ] E003 detected for missing ROADMAP.md
- [ ] Invalid YAML triggers error status
- [ ] Healthy projects correctly return status: 'healthy'
- [ ] Commands handle missing/invalid arguments gracefully

### Task 2: E2E test for edge cases with corrupt projects (E2E-12)

**Files:**
- `tests/e2e/edge-cases.test.cjs` (new)

**Actions:**
1. Test `createCorruptProject('orphan-phase')`:
   - `validate health` returns warnings about orphan phase directory
   - `warnings[]` is non-empty
2. Test `createCorruptProject('version-mismatch')`:
   - `validate health` detects version inconsistency between STATE.md and ROADMAP.md
3. Test `init new-project` on completely empty directory (no files at all):
   - Returns valid JSON with `project_exists: false`, `planning_exists: false`
4. Test `init progress` on empty project (no phases):
   - Returns `phases: []` or similar empty state
   - `phase_count: 0`, `completed_count: 0`
5. Test `progress json` on empty project:
   - Returns valid JSON with `percent: 0` or appropriate defaults
6. Test `stats json` on empty project:
   - Returns valid JSON with zero counts
7. Test `workstream status` on flat project with no workstreams:
   - Returns `found: false` for any name queried
8. Test `init quick` with empty description:
   - Returns valid response (slug may be empty or default)
9. Test `init quick` with very long description (200+ chars):
   - slug is truncated at 40 characters
10. Test `init milestone-op` on empty project (no phases, no archive):
    - Returns `phase_count: 0`, `completed_phases: 0`, `all_phases_complete: false`

**Testable surface:**
- `gsd-tools.cjs validate health` → `cmdValidateHealth` (verify.cjs:522-714)
- `gsd-tools.cjs init new-project` → `cmdInitNewProject` (init.cjs)
- `gsd-tools.cjs init progress` → `cmdInitProgress` (init.cjs:1046-1191)
- `gsd-tools.cjs progress json` → `cmdProgressRender` (commands.cjs)
- `gsd-tools.cjs stats json` → `cmdStats` (commands.cjs)
- `gsd-tools.cjs workstream status` → workstream.cjs
- `gsd-tools.cjs init quick` → `cmdInitQuick` (init.cjs:394-450)
- `gsd-tools.cjs init milestone-op` → `cmdInitMilestoneOp` (init.cjs:704-763)
- Fixtures: `createCorruptProject(type)`, `createEmptyProject()`, bare temp directory

**Acceptance criteria:**
- [ ] Orphan phase triggers warnings
- [ ] Version mismatch detected between STATE.md and ROADMAP.md
- [ ] Empty directory returns valid JSON with project_exists: false
- [ ] Empty project returns zero counts for progress/stats
- [ ] Workstream status returns found: false on flat project
- [ ] Very long description produces truncated slug
- [ ] milestone-op on empty project returns zero phase counts

### Task 3: E2E test for CI integration and test runner (E2E-13)

**Files:**
- `tests/e2e/ci-integration.test.cjs` (new)

**Actions:**
1. Test that `scripts/run-e2e-tests.cjs` exists and is valid JavaScript:
   - File exists at expected path
   - Can be parsed without syntax errors (`node --check`)
2. Test that `scripts/run-e2e-tests.cjs` discovers test files:
   - Run with `--smoke` flag → finds `*.smoke.test.cjs` files
   - Run without flag → finds all `*.test.cjs` files
3. Test that `package.json` has `test:e2e` and `test:e2e:smoke` scripts:
   - Parse package.json, verify script entries exist
   - Script values reference `run-e2e-tests.cjs`
4. Test that smoke test files follow naming convention:
   - All files matching `*.smoke.test.cjs` exist in `tests/e2e/`
5. Test that all E2E test files follow the zero-dependency pattern:
   - No `require('jest')`, `require('mocha')`, `require('vitest')` in any test file
   - All test files use `require('node:test')` and `require('node:assert/strict')`
6. Test that the test runner propagates exit codes:
   - Create a temporary test file that exits 0 → runner exits 0
   - Create a temporary test file that fails → runner exits non-zero

**Testable surface:**
- `scripts/run-e2e-tests.cjs` — test runner implementation
- `package.json` — script entries
- `tests/e2e/*.test.cjs` — file conventions
- Fixtures: temp directories with synthetic test files

**Acceptance criteria:**
- [ ] Test runner script exists and is valid JS
- [ ] --smoke flag filters to smoke tests only
- [ ] package.json has test:e2e and test:e2e:smoke scripts
- [ ] All E2E test files use node:test (zero external dependencies)
- [ ] Test runner propagates exit codes correctly

---

## Execution Order

| Wave | Tasks | Dependencies |
|------|-------|-------------|
| 1 | Task 1 (failure modes), Task 2 (edge cases), Task 3 (CI integration) | Phase 22 infrastructure |

All three tasks are independent — they test different concerns and can execute in parallel.

---

## Read First

Before implementing, read these files for patterns and conventions:
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` — E2E test patterns
- `tests/e2e/fixtures.cjs` — fixture factories (especially `createCorruptProject`)
- `tests/e2e/assertions.cjs` — assertion helpers
- `tests/e2e/new-project.test.cjs` — `runGsdTools` helper pattern
- `tests/e2e/progress-stats-health.test.cjs` — validate health test patterns
- `get-shit-done/bin/lib/verify.cjs` — error/warning code taxonomy
- `scripts/run-e2e-tests.cjs` — CI test runner

## Design Notes

- All tests call `gsd-tools.cjs` via `execFileSync` with `--raw` flag for JSON output
- Tests create temp fixtures, run commands against them, and assert results
- No real LLM calls — tests only exercise the init/state/command layer
- Each test file is self-contained with its own `describe()` and `afterEach(fixtureCleanup)`
- Use `fs.realpathSync(os.tmpdir())` for macOS symlink handling
- Use `crypto.randomBytes` for temp directory names (SEC-01)
- For Task 3 CI tests, use temp directories with synthetic test files to avoid coupling to current test count
