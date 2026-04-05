---
phase: 22
plan: 1
title: "E2E Test Infrastructure"
requirements: ["E2E-01", "E2E-02", "E2E-03"]
complexity: medium
created: "2026-04-04"
---

# PLAN — Phase 22: E2E Test Infrastructure

**Phase goal:** Build the E2E test harness, mock layer, fixture system, and assertion helpers that all subsequent E2E test phases (23-25) depend on.

**Requirements:** E2E-01, E2E-02, E2E-03
**Complexity:** Medium
**Target directory:** `tests/e2e/`

---

## Tasks

### Task 1: Create E2E test runner and package.json scripts

**Files:**
- `scripts/run-e2e-tests.cjs` (new)
- `package.json` (modify test scripts)

**Actions:**
1. Create `scripts/run-e2e-tests.cjs` — mirrors `scripts/run-tests.cjs` but scans `tests/e2e/` for `*.test.cjs` files
2. Add `test:e2e` script to `package.json`: `"node scripts/run-e2e-tests.cjs"`
3. Add `test:e2e:smoke` script to `package.json`: `"node scripts/run-e2e-tests.cjs --smoke"` — runner filters to files matching `*.smoke.test.cjs` when `--smoke` flag present
4. Create `tests/e2e/` directory with a placeholder `.gitkeep`

**Acceptance criteria:**
- [ ] `npm run test:e2e` discovers and runs `tests/e2e/*.test.cjs` files
- [ ] `npm run test:e2e:smoke` runs only `*.smoke.test.cjs` files
- [ ] Runner exits 0 on success, non-zero on failure
- [ ] Runner propagates `NODE_V8_COVERAGE` for c8 compatibility

### Task 2: Build the mock layer (E2E-01)

**Files:**
- `tests/e2e/mock-layer.cjs` (new)

**Actions:**
1. Create `mockSubagent(name, cannedResponse)` — registers a canned response for a named subagent call. Returns `{ calls: [] }` tracker that records each invocation with args.
2. Create `createMockContext(overrides)` — returns a mock GSD context object with sensible defaults (project root, state path, config) that can be passed to functions under test. Overrides merge on top of defaults.
3. Create `interceptCoreExports(stubs)` — takes an object of `{ functionName: stubFn }` and monkey-patches `core.cjs` exports for the duration of a test. Returns a `restore()` function that resets originals. This is the primary mock mechanism — it intercepts at the function level on core.cjs exports, matching existing test patterns.
4. Create `createDeterministicResponses(scenario)` — factory that returns pre-built response sets for common scenarios: `'plan-phase'` (returns mock PLAN.md content), `'execute-phase'` (returns mock SUMMARY.md content), `'verify-work'` (returns mock VERIFICATION.md content).

**Design notes:**
- All mocks are synchronous (CommonJS constraint)
- No external dependencies — uses only Node built-ins
- Mock layer is stateless between tests — each test creates fresh mocks
- `interceptCoreExports` uses `require.cache` manipulation to swap module exports

**Acceptance criteria:**
- [ ] `mockSubagent` returns deterministic canned responses and records call history
- [ ] `interceptCoreExports` can stub any core.cjs export and restore originals
- [ ] `createMockContext` produces a valid context object usable by gsd-tools commands
- [ ] `createDeterministicResponses` covers plan/execute/verify scenarios
- [ ] All mocks work within zero-dependency CommonJS constraint

### Task 3: Build the fixture system (E2E-02)

**Files:**
- `tests/e2e/fixtures.cjs` (new)

**Actions:**
1. Create `createEmptyProject()` — temp directory with `.planning/` and empty `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `PROJECT.md` files containing valid but minimal frontmatter. Auto-registers for cleanup.
2. Create `createMidMilestoneProject(opts)` — temp directory with a realistic mid-milestone state: PROJECT.md with goals, ROADMAP.md with 3 phases (1 complete, 1 in-progress, 1 pending), STATE.md showing phase 2 active, REQUIREMENTS.md with 6 requirements (2 done, 4 pending). `opts` can override milestone name, phase count, etc.
3. Create `createCompletedMilestoneProject()` — temp directory with all phases complete, STATE.md showing milestone done, all requirements checked.
4. Create `createCorruptProject(corruption)` — temp directory with intentionally broken state for error-path testing. `corruption` enum: `'invalid-yaml'` (bad STATE.md frontmatter), `'missing-roadmap'` (no ROADMAP.md), `'orphan-phase'` (phase dir without plan), `'version-mismatch'` (STATE.md and ROADMAP.md disagree on milestone).
5. All fixture factories use `crypto.randomBytes(8).toString('hex')` for temp dir names (SEC-01 pattern).
6. Create `fixtureCleanup()` — cleanup function that removes all registered temp directories. Designed for use in `afterEach()`.
7. Extend with git initialization where needed — `createMidMilestoneProject` and `createCompletedMilestoneProject` include git init + initial commit for commands that require git context.

**Design notes:**
- Builds on existing `helpers.cjs` patterns (`createTempProject`, `createTempGitProject`) but with richer state
- All STATE.md files use proper YAML frontmatter (gsd_state_version, milestone, status, progress fields)
- All ROADMAP.md files use proper phase table format matching production ROADMAP.md structure
- Temp dirs created via `os.tmpdir()` + `crypto.randomBytes` per SEC-01

**Acceptance criteria:**
- [ ] `createEmptyProject()` produces valid `.planning/` with parseable frontmatter in all 4 files
- [ ] `createMidMilestoneProject()` produces state where `gsd-tools state load` returns valid JSON
- [ ] `createCompletedMilestoneProject()` produces state showing 100% completion
- [ ] `createCorruptProject('invalid-yaml')` produces STATE.md that fails YAML parse
- [ ] `fixtureCleanup()` removes all temp dirs created during the test
- [ ] All temp dir names use cryptographic randomness

### Task 4: Build assertion helpers (E2E-03)

**Files:**
- `tests/e2e/assertions.cjs` (new)

**Actions:**
1. Create `assertExitCode(result, expected)` — asserts that a `runGsdTools` result has the expected success/failure status. Clear message: `"Expected exit code ${expected} but got ${actual} for command: ${cmd}. Stderr: ${stderr}"`.
2. Create `assertSuccess(result)` — shorthand for `assertExitCode(result, 0)` with result.success check.
3. Create `assertFailure(result)` — shorthand for asserting result.success === false.
4. Create `assertFileContains(filePath, pattern)` — reads file, asserts content matches string or regex pattern. Message: `"Expected ${filePath} to contain ${pattern} but it did not. File content (first 200 chars): ${preview}"`.
5. Create `assertFileNotContains(filePath, pattern)` — inverse of assertFileContains.
6. Create `assertFileExists(filePath)` — asserts file exists via `fs.existsSync`. Clear path in message.
7. Create `assertFileNotExists(filePath)` — inverse.
8. Create `assertStateField(projectDir, field, value)` — reads `.planning/STATE.md`, parses YAML frontmatter, asserts the given field equals value. Message: `"Expected STATE.md field '${field}' to be '${value}' but got '${actual}'"`.
9. Create `assertJsonOutput(result, assertions)` — parses result.output as JSON, runs each `{ path, value }` assertion against the parsed object using dot-notation path traversal. Message includes the path that failed.
10. Create `assertValidFrontmatter(filePath, requiredFields)` — reads file, extracts YAML frontmatter between `---` delimiters, asserts all required fields are present and non-empty.

**Design notes:**
- All assertions built on `node:assert/strict` — wrappers add better error messages, not new assertion logic
- Pattern parameters accept both strings (indexOf check) and RegExp objects
- `assertStateField` reuses the YAML frontmatter parser pattern from existing tests

**Acceptance criteria:**
- [ ] `assertExitCode` produces clear failure message with command and stderr
- [ ] `assertFileContains` works with both string and regex patterns
- [ ] `assertStateField` correctly parses YAML frontmatter and extracts named fields
- [ ] `assertJsonOutput` handles nested paths (e.g., `"progress.completed_phases"`)
- [ ] `assertValidFrontmatter` detects missing required fields
- [ ] All helpers use `node:assert/strict` internally — no external dependencies

### Task 5: Integration smoke test

**Files:**
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` (new)

**Actions:**
1. Write a smoke test that validates the E2E infrastructure itself works:
   - Test that `createEmptyProject()` + `fixtureCleanup()` lifecycle works
   - Test that `createMidMilestoneProject()` produces state loadable by `gsd-tools state load`
   - Test that `assertFileContains` correctly passes and fails
   - Test that `assertStateField` reads real STATE.md frontmatter
   - Test that `interceptCoreExports` can stub and restore a function
   - Test that `createDeterministicResponses('plan-phase')` returns expected structure
2. This file uses `*.smoke.test.cjs` naming so it runs under both `test:e2e` and `test:e2e:smoke`

**Acceptance criteria:**
- [ ] Smoke test passes via `npm run test:e2e:smoke`
- [ ] All fixture types create valid temp directories
- [ ] All assertion helpers produce correct pass/fail results
- [ ] Mock layer stubs and restores correctly
- [ ] No temp directories leaked after test run

---

## Execution Order

| Wave | Tasks | Dependencies |
|------|-------|-------------|
| 1 | Task 1 (runner + scripts) | None |
| 2 | Task 2 (mock layer), Task 3 (fixtures), Task 4 (assertions) | Task 1 |
| 3 | Task 5 (smoke test) | Tasks 2, 3, 4 |

---

## Read First

Before implementing, read these files for patterns and conventions:
- `tests/helpers.cjs` — existing test helper API
- `tests/integ-gsd-flow.test.cjs` — integration test patterns
- `tests/core.test.cjs` — unit test patterns
- `scripts/run-tests.cjs` — test runner pattern
- `get-shit-done/bin/lib/core.cjs` — exports to be mocked (Layer 0/1 functions)
- `get-shit-done/bin/gsd-tools.cjs` — CLI entry point for E2E command testing
- `package.json` — existing test script definitions
