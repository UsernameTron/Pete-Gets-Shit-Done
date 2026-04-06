# Testing Patterns

**Analysis Date:** 2026-04-06

## Test Framework & Configuration

**Runner:**
- Node.js built-in test runner (`node:test`) -- zero external test framework dependencies
- No jest.config, vitest.config, or similar config files
- Custom test runners wrap `node --test`:
  - `scripts/run-tests.cjs` -- unit + integration tests (reads `tests/*.test.cjs`)
  - `scripts/run-e2e-tests.cjs` -- E2E tests (reads `tests/e2e/*.test.cjs`), supports `--smoke` flag

**Assertion Library:**
- `node:assert` and `node:assert/strict` -- no external assertion libraries

**Coverage Tool:**
- `c8` (v11.x) -- V8-native coverage via `NODE_V8_COVERAGE`
- Config: `.c8rc.json`
- Includes: `get-shit-done/bin/lib/*.cjs`, `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, `hooks/*.js`, `scripts/build-hooks.js`
- Excludes: `hooks/dist/**`, `tests/**`
- `"all": true` -- reports on all included files even without test coverage

**Run Commands:**
```bash
npm test                    # Run all unit + integration tests
npm run test:coverage       # Coverage with text + JSON reporters
npm run test:coverage:full  # Coverage with text + lcov + JSON reporters
npm run test:e2e            # Run all E2E tests
npm run test:e2e:smoke      # Run only *.smoke.test.cjs E2E files
```

## Test Directory Structure

```
tests/
  *.test.cjs              # Unit and integration tests (66 files)
  helpers.cjs             # Shared test utilities for gsd-tools CLI
  hook-helpers.cjs        # Shared test utilities for hook scripts
  e2e/
    *.test.cjs            # End-to-end pipeline tests (12 files)
    *.smoke.test.cjs      # Smoke subset (1 file)
    assertions.cjs        # Custom E2E assertion helpers
    mock-layer.cjs        # Deterministic mock factories
    fixtures.cjs          # Project scaffold factories for E2E
  perf/
    routing-benchmark.test.cjs  # Performance regression test
governance/tests/
  test_health_check.sh    # Bash-based governance script tests
  test_install.sh
  test_install_plugins.sh
  test_integration.sh
  test_scaffold.sh
```

All test files use `.cjs` extension (CommonJS). All tests use `.test.cjs` suffix.

## Test Categories

### Unit Tests (~1968 test cases across 66 files)

Test individual modules by requiring source files directly and calling functions. Use temp directories for filesystem isolation.

**Pattern -- CLI tool testing via `helpers.cjs`:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('feature under test', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();  // creates temp dir with .planning/phases/
  });

  afterEach(() => {
    cleanup(tmpDir);  // rm -rf temp dir
  });

  test('does the expected thing', () => {
    const result = runGsdTools('command subcommand --flag', tmpDir);
    assert.strictEqual(result.success, true, `Failed: ${result.error}`);
    assert.ok(result.output.includes('expected'), `Got: ${result.output}`);
  });
});
```

**Pattern -- Hook testing via `hook-helpers.cjs`:**
```javascript
const { runHook } = require('./hook-helpers.cjs');

it('exits 0 for clean content', () => {
  const result = runHook(HOOK_PATH, {
    tool_name: 'Write',
    tool_input: {
      file_path: '/project/.planning/STATE.md',
      content: '# State\n\nPhase 2 complete.',
    },
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout.trim(), '');
});
```

**Pattern -- Direct module testing:**
```javascript
const { classifyTask, extractSignals } = require('../../get-shit-done/bin/lib/classify.cjs');

it('classifies correctly', () => {
  const result = classifyTask('implement auth module');
  assert.strictEqual(result.complexity, 'standard');
});
```

**Key unit test files by domain:**
- `tests/dispatcher.test.cjs` -- CLI dispatch routing and error paths
- `tests/state.test.cjs` -- STATE.md read/write operations
- `tests/phase.test.cjs` -- Phase management commands
- `tests/milestone.test.cjs` -- Milestone lifecycle
- `tests/roadmap.test.cjs` -- Roadmap parsing and updates
- `tests/frontmatter.test.cjs` -- YAML frontmatter parsing
- `tests/security.test.cjs` -- Input validation, path traversal, prompt injection
- `tests/verify.test.cjs` -- Verification commands
- `tests/workspace.test.cjs` -- Workspace management
- `tests/workstream.test.cjs` -- Parallel workstream management
- `tests/classify.test.cjs` -- Task classification intelligence
- `tests/config.test.cjs` -- Configuration management
- `tests/model-profiles.test.cjs` -- Model selection profiles
- `tests/architecture.test.cjs` -- Architecture layer validation
- `tests/commands.test.cjs` -- Command definitions
- `tests/core.test.cjs` -- Core library functions

**Hook test files:**
- `tests/build-hooks.test.cjs` -- Hook build script
- `tests/prompt-guard-hook.test.cjs` -- Prompt injection guard
- `tests/workflow-guard-hook.test.cjs` -- Workflow guard
- `tests/statusline-hook.test.cjs` -- Status line display
- `tests/context-monitor-hook.test.cjs` -- Context window monitoring
- `tests/check-update-hook.test.cjs` -- Update checker

**Integration test files (in `tests/` root, `integ-` prefix):**
- `tests/integ-gsd-flow.test.cjs` -- CLI command chain and state progression
- `tests/integ-governance-hooks.test.cjs` -- Governance hook integration
- `tests/integ-plugin-ecosystem.test.cjs` -- Plugin system integration

### E2E Tests (~143 test cases across 12 files)

Full pipeline tests that scaffold realistic projects and run multi-step GSD workflows. Use dedicated fixture factories.

**Key E2E files:**
- `tests/e2e/new-project.test.cjs` -- Project initialization, brownfield detection
- `tests/e2e/pipeline-plan-execute.test.cjs` -- Plan-then-execute pipeline
- `tests/e2e/pipeline-verify-ship.test.cjs` -- Verify-then-ship pipeline
- `tests/e2e/milestone-lifecycle.test.cjs` -- Full milestone lifecycle
- `tests/e2e/workstream-management.test.cjs` -- Parallel workstream operations
- `tests/e2e/utility-commands.test.cjs` -- Utility command coverage
- `tests/e2e/progress-stats-health.test.cjs` -- Progress/stats/health commands
- `tests/e2e/failure-modes.test.cjs` -- Error path and corrupt state handling
- `tests/e2e/edge-cases.test.cjs` -- Boundary conditions
- `tests/e2e/ci-integration.test.cjs` -- CI/CD integration scenarios
- `tests/e2e/intelligence-pipeline.test.cjs` -- Classify/route intelligence
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` -- Smoke test for E2E infra

### Performance Tests (1 file)

- `tests/perf/routing-benchmark.test.cjs` -- Proves dynamic routing adds <5ms median overhead vs static routing. Uses `process.hrtime.bigint()` for nanosecond precision.

### Governance Shell Tests (5 files)

Bash-based tests in `governance/tests/` for governance scripts:
- `governance/tests/test_health_check.sh`
- `governance/tests/test_install.sh`
- `governance/tests/test_install_plugins.sh`
- `governance/tests/test_integration.sh`
- `governance/tests/test_scaffold.sh`

## Test Utilities & Helpers

### `tests/helpers.cjs` -- Core Test Helpers

| Export | Purpose |
|--------|---------|
| `runGsdTools(args, cwd, env)` | Run gsd-tools CLI command, return `{ success, output, error }`. Accepts string (shell) or array (safe) args. |
| `createTempDir(prefix)` | Create bare temp directory |
| `createTempProject(prefix)` | Create temp dir with `.planning/phases/` structure |
| `createTempGitProject(prefix)` | Create temp dir with `.planning/`, git init, and initial commit |
| `cleanup(tmpDir)` | Remove temp directory recursively |
| `TOOLS_PATH` | Absolute path to `get-shit-done/bin/gsd-tools.cjs` |

### `tests/hook-helpers.cjs` -- Hook Test Helpers

| Export | Purpose |
|--------|---------|
| `runHook(hookPath, stdinObj, opts)` | Run hook script with JSON stdin, return `{ exitCode, stdout, stderr }` |
| `createTempWithConfig(configObj)` | Create temp dir with `.planning/config.json` |
| `writeBridgeFile(sessionId, metricsObj)` | Write context bridge file for session testing |
| `cleanup(tmpDir)` | Remove temp directory |

### `tests/e2e/assertions.cjs` -- E2E Assertion Library

| Export | Purpose |
|--------|---------|
| `assertSuccess(result, msg)` | Assert `result.success === true` with error details |
| `assertFailure(result, msg)` | Assert `result.success === false` |
| `assertFileExists(filePath)` | Assert file exists on disk |
| `assertFileNotExists(filePath)` | Assert file does not exist |
| `assertFileContains(filePath, pattern)` | Assert file contents match string or RegExp |
| `assertFileNotContains(filePath, pattern)` | Assert file contents do not match |
| `assertStateField(projectDir, field, value)` | Assert STATE.md YAML frontmatter field value |
| `assertJsonOutput(result, assertions)` | Parse JSON output and assert dot-notation paths |
| `assertValidFrontmatter(filePath, requiredFields)` | Assert file has YAML frontmatter with required keys |

### `tests/e2e/mock-layer.cjs` -- Deterministic Mock Factories

| Export | Purpose |
|--------|---------|
| `mockSubagent(name, cannedResponse)` | Register canned subagent response with call tracking |
| `createMockContext(overrides)` | Build mock GSD context object with sensible defaults |
| `interceptCoreExports(stubs)` | Monkey-patch core.cjs exports via `require.cache`, returns `restore()` |
| `createDeterministicResponses(scenario)` | Factory for realistic canned responses (`plan-phase`, `execute-phase`, `verify-work`) |

### `tests/e2e/fixtures.cjs` -- Project Scaffold Factories

| Export | Purpose |
|--------|---------|
| `createEmptyProject()` | Bare `.planning/` with minimal files, no git |
| `createMidMilestoneProject(opts)` | Mid-milestone with git, phases, config; Phase 1 done, Phase 2 in-progress |
| `createCompletedMilestoneProject()` | Fully shipped milestone with all phases complete |
| `createCorruptProject(corruption)` | Intentionally broken state: `invalid-yaml`, `missing-roadmap`, `orphan-phase`, `version-mismatch` |
| `fixtureCleanup()` | Remove all registered temp directories |

## Coverage Configuration

**Tool:** c8 (V8-native)
**Config file:** `.c8rc.json`

**Coverage scope:**
- `get-shit-done/bin/lib/*.cjs` -- Core library modules
- `get-shit-done/bin/gsd-tools.cjs` -- Main CLI entry point
- `bin/install.js` -- NPM install script
- `hooks/*.js` -- Hook source files (pre-build)
- `scripts/build-hooks.js` -- Build script

**Reporters available:**
- `text` -- Console table (default with `test:coverage`)
- `json` -- Machine-readable (default with `test:coverage`)
- `lcov` -- HTML coverage report (with `test:coverage:full`)

**Coverage target (per CLAUDE.md):**
- Overall: >=90%
- Per module: >=80%
- Security-critical modules: >=95%

## Test Metrics

| Metric | Value |
|--------|-------|
| Unit/integration test files | 66 |
| E2E test files | 12 |
| Performance test files | 1 |
| Governance shell test files | 5 |
| Total test declarations (unit/integ) | ~1,968 |
| Total test declarations (E2E) | ~143 |
| Total lines of test code | ~36,739 |
| Test helper modules | 5 (`helpers.cjs`, `hook-helpers.cjs`, `assertions.cjs`, `mock-layer.cjs`, `fixtures.cjs`) |
| Describe blocks | ~461 |

## Test Conventions

**When writing new tests:**

1. Use `node:test` (`describe`, `test`/`it`, `beforeEach`, `afterEach`) -- never Jest or Vitest
2. Use `node:assert` or `node:assert/strict` -- never Chai or expect
3. File naming: `tests/{module-name}.test.cjs` for unit tests
4. Integration tests: prefix with `integ-` (e.g., `tests/integ-gsd-flow.test.cjs`)
5. E2E tests: place in `tests/e2e/{scenario-name}.test.cjs`
6. Always create temp directories via helper factories -- never write to project tree
7. Always clean up temp directories in `afterEach` or via `fixtureCleanup()`
8. Include requirement IDs in test file doc comments (e.g., `Requirements: DISP-01, DISP-02`)
9. Use `GSD_TEST_MODE=1` environment variable for integration tests that need test isolation
10. For CLI tests, use `runGsdTools()` from `helpers.cjs` -- never shell out directly
11. For hook tests, use `runHook()` from `hook-helpers.cjs` with JSON stdin objects
12. Assertion messages should include actual values for debugging: `assert.ok(x, \`Expected Y, got: \${x}\`)`
13. Zero external test dependencies -- Node built-ins only

**Test isolation pattern:**
- Every test creates its own temp directory
- Tests never share mutable state
- E2E mock factories return fresh objects on every call
- `require.cache` monkey-patching via `interceptCoreExports()` always restores originals

**Error path testing:**
- Every command group has "unknown subcommand" error tests in `tests/dispatcher.test.cjs`
- `tests/e2e/failure-modes.test.cjs` covers corrupt state scenarios
- `tests/e2e/fixtures.cjs` provides `createCorruptProject()` for error path E2E tests

## Known Gaps

- Governance shell tests (`governance/tests/*.sh`) run outside the Node test runner and are not included in c8 coverage
- No browser/DOM tests (not applicable -- CLI-only project)
- Performance benchmark has a single file; no regression tracking infrastructure beyond the test assertion
- Hook tests test pre-build source (`hooks/*.js`), not the esbuild-bundled output (`hooks/dist/`)

---

*Testing analysis: 2026-04-06*
