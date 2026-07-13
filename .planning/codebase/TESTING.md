# Testing Patterns

**Analysis Date:** 2026-07-12

## Test Framework & Configuration

**Runner:**
- Node.js built-in test runner (`node:test`) — zero external test framework dependencies (`package.json` has no `dependencies`, only `devDependencies`: `c8`, `esbuild`)
- No `jest.config`, `vitest.config`, or similar
- Custom cross-platform runners wrap `node --test` (glob resolution done in JS, not shell, so it works on Windows PowerShell/cmd where shell globbing fails):
  - `scripts/run-tests.cjs` — reads `tests/*.test.cjs` directly (non-recursive — this is why `tests/e2e/` and `tests/perf/` are excluded from `npm test`)
  - `scripts/run-e2e-tests.cjs` — reads `tests/e2e/*.test.cjs`; `--smoke` flag restricts to `tests/e2e/*.smoke.test.cjs`
  - Both propagate `NODE_V8_COVERAGE` to the spawned child process so `c8` can collect coverage from it

**Assertion Library:**
- `node:assert` (70 files) and `node:assert/strict` (19 files) — no external assertion library, no bare `require('assert')`
- Matcher usage across `tests/*.test.cjs` (by call count): `ok` (3,386), `strictEqual` (2,414), `equal` (337), `deepStrictEqual` (210), `match` (80), `throws` (42), `doesNotThrow` (18). `assert.rejects` has **zero** uses — async-rejection assertions are essentially absent because most tests exercise a CLI subprocess or hook script synchronously (see Common Patterns below).

**Run Commands (verified against `package.json` and `CONTRIBUTING.md`):**
```bash
npm test                              # Run all unit + integration tests (tests/*.test.cjs)
node --test tests/core.test.cjs       # Run a single file directly
npm run test:coverage                 # Coverage: text + json reporters
npm run test:coverage:full            # Coverage: text + lcov + json reporters
npm run test:e2e                      # Run all E2E tests
npm run test:e2e:smoke                # Run only *.smoke.test.cjs E2E files
```

## Test Directory Structure

```
tests/
  *.test.cjs              # Unit and integration tests (89 files)
  helpers.cjs              # Shared test utilities for gsd-tools CLI
  hook-helpers.cjs         # Shared test utilities for hook scripts
  e2e/
    *.test.cjs             # End-to-end pipeline tests (12 files)
    *.smoke.test.cjs        # Smoke subset (1 file)
    assertions.cjs          # Custom E2E assertion helpers
    mock-layer.cjs           # Deterministic mock factories
    fixtures.cjs             # Project scaffold factories for E2E
  perf/
    routing-benchmark.test.cjs  # Performance regression test (Requirement INTEL-20)
governance/tests/
  test_health_check.sh    # Bash-based governance script tests
  test_install.sh
  test_install_plugins.sh
  test_integration.sh
  test_scaffold.sh
```

All node:test files use the `.cjs` extension and `.test.cjs` suffix. Governance tests are plain bash (`.sh`) and run outside `node:test`/`c8` entirely.

## Test Categories

### Unit / Integration Tests (2,932 tests across 573 `describe` suites, 89 files)

Test individual modules by requiring source files directly and calling functions, or by round-tripping the real CLI/hook binary as a child process against a temp directory. Numbers below are from an actual `npm test` run against the current tree (0 failures, ~41–53s).

**Pattern — CLI tool testing via `helpers.cjs` (black-box, spawns the real `gsd-tools.cjs`):**
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

**Pattern — direct module testing (in-process, no subprocess):**
```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { COMPLEXITY_LEVELS, classifyTask } = require('../get-shit-done/bin/lib/classify.cjs');

describe('COMPLEXITY_LEVELS', () => {
  test('exports all 4 levels with correct string values', () => {
    assert.strictEqual(COMPLEXITY_LEVELS.TRIVIAL, 'trivial');
    assert.strictEqual(Object.keys(COMPLEXITY_LEVELS).length, 4);
  });

  test('object is frozen', () => {
    assert.ok(Object.isFrozen(COMPLEXITY_LEVELS));
  });
});
```

**Pattern — hook testing via `hook-helpers.cjs`:**
```javascript
const { runHook } = require('./hook-helpers.cjs');

it('exits 0 for clean content', () => {
  const result = runHook(HOOK_PATH, { tool_name: 'Write', tool_input: { file_path: '...', content: '...' } });
  assert.equal(result.exitCode, 0);
});
```

**Key unit test files by domain:**
- `tests/dispatcher.test.cjs` — CLI dispatch routing and error paths
- `tests/state.test.cjs`, `tests/phase.test.cjs`, `tests/milestone.test.cjs`, `tests/roadmap.test.cjs`, `tests/workstream.test.cjs` — lifecycle modules
- `tests/frontmatter.test.cjs`, `tests/config.test.cjs`, `tests/core.test.cjs` — foundation/domain layer
- `tests/security.test.cjs`, `tests/security-hardening-v2.2.test.cjs`, `tests/prompt-injection-scan.test.cjs` — input validation, path traversal, prompt injection
- `tests/verify.test.cjs`, `tests/verify-health.test.cjs` — verification commands
- `tests/classify.test.cjs`, `tests/model-profiles.test.cjs` — v2.0 Intelligence Layer
- `tests/architecture.test.cjs` — enforces the layer-dependency rules described in `CONVENTIONS.md`
- `tests/enforcement-contracts.test.cjs` — governance contract tests (write-once hook registration, feature-flag security perimeter, `gsd-` type-name collision detection)
- `tests/install-coverage-utils.test.cjs`, `-converters.test.cjs`, `-governance.test.cjs` — targeted suites closing specific coverage gaps in `bin/install.js`, explicitly scoped to not duplicate the 12 pre-existing install test files

**Hook test files:** `tests/build-hooks.test.cjs`, `tests/prompt-guard-hook.test.cjs`, `tests/config-protection-hook.test.cjs`, `tests/cost-tracker-hook.test.cjs`, `tests/context-monitor-hook.test.cjs`, `tests/statusline-hook.test.cjs`, `tests/check-update-hook.test.cjs`, `tests/lesson-capture-gate.test.cjs`

**Integration test files (`integ-` prefix in `tests/` root):** `tests/integ-gsd-flow.test.cjs`, `tests/integ-governance-hooks.test.cjs`, `tests/integ-plugin-ecosystem.test.cjs`

**Workflow-contract test files** (see "Workflow Contract Tests" under Common Patterns): `tests/wrap-and-sync.test.cjs`, `tests/daily-startup.test.cjs`, `tests/closeout.test.cjs`, `tests/do-routing.test.cjs`, `tests/quick-branching.test.cjs`, `tests/quick-research.test.cjs`, `tests/idea-to-shipped.test.cjs`, `tests/execute-phase-wave.test.cjs`, `tests/ecosystem-map.test.cjs`, `tests/forensics.test.cjs`, `tests/milestone-summary.test.cjs`, `tests/workspace.test.cjs`, `tests/phase.test.cjs`, `tests/antigravity-install.test.cjs` (14 files total)

### E2E Tests (143 tests across 57 suites, 12 files)

Full pipeline tests that scaffold realistic projects and run multi-step GSD workflows against the real CLI. Confirmed via live run: 0 failures, ~5s.

**Key E2E files:**
- `tests/e2e/new-project.test.cjs` — project initialization, brownfield detection
- `tests/e2e/pipeline-plan-execute.test.cjs`, `tests/e2e/pipeline-verify-ship.test.cjs` — phase pipelines
- `tests/e2e/milestone-lifecycle.test.cjs` — full milestone lifecycle
- `tests/e2e/workstream-management.test.cjs` — parallel workstream operations
- `tests/e2e/utility-commands.test.cjs`, `tests/e2e/progress-stats-health.test.cjs` — utility command coverage
- `tests/e2e/failure-modes.test.cjs`, `tests/e2e/edge-cases.test.cjs` — error paths and boundary conditions
- `tests/e2e/ci-integration.test.cjs` — CI/CD integration scenarios
- `tests/e2e/intelligence-pipeline.test.cjs` — classify/route intelligence
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` — smoke test for E2E infrastructure itself

### Performance Tests (1 file, 1 suite, 5 tests)

- `tests/perf/routing-benchmark.test.cjs` — proves dynamic routing adds negligible overhead vs. static routing (Requirement INTEL-20). Uses `process.hrtime.bigint()` for nanosecond precision. Confirmed via live run: 0 failures, ~140ms.

### Governance Shell Tests (5 files)

Bash-based tests in `governance/tests/` for governance scripts, run directly with `bash` (not through `node:test`, not included in `c8` coverage). Executed in CI as their own `governance` job, separate from the Node test matrix. Example strategy (`test_health_check.sh`): since `health-check.sh` hardcodes `~/.claude`/`$HOME`, the test extracts individual `check()` functions and runs them against a temp directory with `HOME` overridden.

## Test Utilities & Helpers

### `tests/helpers.cjs` — Core Test Helpers

| Export | Purpose |
|--------|---------|
| `runGsdTools(args, cwd, env)` | Run `gsd-tools.cjs` CLI as a real subprocess, return `{ success, output, error }`. Accepts a string (shell-interpreted via `execSync`) or an array (shell-bypassed via `execFileSync`, safe for JSON/`$`). |
| `createTempDir(prefix)` | Create a bare temp directory |
| `createTempProject(prefix)` | Create a temp dir with `.planning/phases/` structure |
| `createTempGitProject(prefix)` | Create a temp dir with `.planning/`, real `git init` + config + initial commit |
| `cleanup(tmpDir)` | Remove the temp directory recursively |
| `TOOLS_PATH` | Absolute path to `get-shit-done/bin/gsd-tools.cjs` |
| `TMP_ROOT` | OS temp root (`os.tmpdir()`), exported for tests that need to build their own paths |

### `tests/hook-helpers.cjs` — Hook Test Helpers

| Export | Purpose |
|--------|---------|
| `runHook(hookPath, stdinObj, opts)` | Spawn a hook script with JSON piped to stdin, return `{ exitCode, stdout, stderr }` |
| `createTempWithConfig(configObj)` | Create a temp dir with `.planning/config.json` |
| `writeBridgeFile(sessionId, metricsObj)` | Write a context-bridge file for statusline/context-monitor hook tests |
| `cleanup(tmpDir)` | Remove the temp directory |

### `tests/e2e/assertions.cjs` — E2E Assertion Library

| Export | Purpose |
|--------|---------|
| `assertSuccess(result, msg)` / `assertFailure(result, msg)` | Assert `result.success` with error detail on failure |
| `assertFileExists(filePath)` / `assertFileNotExists(filePath)` | Filesystem existence checks |
| `assertFileContains(filePath, pattern)` / `assertFileNotContains(filePath, pattern)` | String or RegExp content checks |
| `assertStateField(projectDir, field, value)` | Assert a STATE.md YAML frontmatter field value |
| `assertJsonOutput(result, assertions)` | Parse JSON output, assert dot-notation paths |
| `assertValidFrontmatter(filePath, requiredFields)` | Assert a file has YAML frontmatter with required keys |

### `tests/e2e/mock-layer.cjs` — Deterministic Mock Factories

| Export | Purpose |
|--------|---------|
| `mockSubagent(name, cannedResponse)` | Register a canned subagent response with call tracking |
| `createMockContext(overrides)` | Build a mock GSD context object with sensible defaults |
| `interceptCoreExports(stubs)` | Monkey-patch `core.cjs` exports via `require.cache`, returns a `restore()` function |
| `createDeterministicResponses(scenario)` | Factory for realistic canned responses (`plan-phase`, `execute-phase`, `verify-work`) |

### `tests/e2e/fixtures.cjs` — Project Scaffold Factories

| Export | Purpose |
|--------|---------|
| `createEmptyProject()` | Bare `.planning/` with minimal files, no git |
| `createMidMilestoneProject(opts)` | Mid-milestone with git, phases, config; Phase 1 done, Phase 2 in progress |
| `createCompletedMilestoneProject()` | Fully shipped milestone, all phases complete |
| `createCorruptProject(corruption)` | Intentionally broken state: `invalid-yaml`, `missing-roadmap`, `orphan-phase`, `version-mismatch` |
| `fixtureCleanup()` | Remove all registered temp directories |

## Coverage Configuration

**Tool:** c8 v11 (V8-native coverage via `NODE_V8_COVERAGE`)
**Config file:** `.c8rc.json`

**Coverage scope (`include`, 8 entries):**
```
get-shit-done/bin/lib/*.cjs
get-shit-done/bin/gsd-tools.cjs
bin/install.js
hooks/*.js
scripts/build-hooks.js
.claude/hooks/lesson-capture-gate.cjs
scripts/validate-doc-links.cjs
scripts/check-doc-drift.cjs
```
**Exclude:** `hooks/dist/**`, `tests/**`. `"all": true` — reports on every included file even if it has zero test coverage.

**Reporters:** `text` + `json` (default, `test:coverage`); adds `lcov` with `test:coverage:full` (produces `coverage/lcov.info`, uploaded as a CI artifact).

**Live-measured coverage (this run, 2026-07-12):**

| Scope | Stmts | Branch | Funcs | Lines |
|-------|-------|--------|-------|-------|
| All files | 91.74% | 83.52% | 97.62% | 91.74% |

Notable per-module figures: `security.cjs` and `uat-patterns.cjs` at 100%; lowest are `bin/install.js` (81.98%), `harden-repo.cjs` (83.33%), `profile-pipeline.cjs` (83.67%) — all still clear the 80% per-module floor.

**Enforcement is NOT a hard c8 gate.** `.c8rc.json` has no `check-coverage`/`branches`/`lines` threshold keys, and `scripts/ci-coverage-report.sh` — which posts the per-module markdown table to the GitHub Actions job summary — is explicitly advisory: it prints a warning below 80% but always `exit 0`s ("Advisory only — never fail the build"). The actual enforcement path is `node scripts/check-doc-drift.cjs`, which fails CI if the coverage numbers hardcoded into `CLAUDE.md`/`README.md`/`docs/DEVOPS-HANDOFF.md` drift from a freshly measured run — i.e., coverage regressions are caught indirectly, by making the documented numbers go stale.

**Coverage targets (per `CLAUDE.md`, not a code-level constant):**
- Overall: ≥90% (currently 91.74% lines — passing)
- Per module: ≥80%
- Security-critical modules: ≥95%

**View Coverage:**
```bash
npm run test:coverage:full
open coverage/lcov-report/index.html
```

**CI enforcement (`.github/workflows/test.yml`):** a 3-leg matrix job (`ubuntu-latest`/Node 20/full suite, `ubuntu-latest`/Node 22/full suite, `macos-latest`/Node 22/partial — only the two `ubuntu` legs run `check-doc-drift.cjs` and upload the lcov artifact) plus a `governance` job (runs the 5 bash test files) and a `docs-integrity` job (`validate-doc-links.cjs`). These 5 checks are the required branch-protection gates for `main`.

## Test Types

**Unit Tests:**
- Either require a `lib/` module directly and call its exports in-process, or spawn the real `gsd-tools.cjs`/hook script as a child process against a disposable temp directory
- Every test creates and tears down its own temp directory — no shared mutable fixtures
- Fast: the full 2,932-test unit/integration run completes in ~41–53s

**Integration Tests:**
- `integ-*.test.cjs` files exercise multi-command sequences against one temp project (e.g. init → plan → execute → verify state transitions)

**E2E Tests:**
- Scaffold a realistic `.planning/` tree via `tests/e2e/fixtures.cjs`, then drive multi-step workflows through the real CLI
- Not a separate framework — same `node:test` runner, just a different file glob (`tests/e2e/*.test.cjs`) and a slower per-test setup cost

## Common Patterns

**Suite Organization:** `describe()` grouped by exported symbol or command, `test()` (dominant — 77 files) or `it()` (minority alias — 12 files) for individual cases, separated by the same Unicode-box-drawing section comments used in source files:
```javascript
// ─── COMPLEXITY_LEVELS ───────────────────────────────────────────────────────
describe('COMPLEXITY_LEVELS', () => {
  test('exports all 4 levels with correct string values', () => { ... });
  test('object is frozen', () => { ... });
});
```
`beforeEach`/`afterEach` are used in roughly half the files (43 and 48 of 89, respectively) for per-test setup/teardown; one-time `before()`/`after()` is rare (3 files) — the codebase prefers full per-test isolation over shared suite-level fixtures. There are **no explicit arrange/act/assert comments** anywhere in the suite; tests rely on descriptive test-name strings instead.

**Mocking — this is a CLI tool, so the primary boundary is the OS process, not a JS module graph:**
1. **Black-box subprocess (the default):** `runGsdTools()`/`runHook()` spawn the real binary/hook script against a temp directory. Nothing internal is mocked; output and exit code are asserted directly.
2. **In-process output capture (rare, targeted):** because `output()` writes through `fs.writeSync(1, ...)` rather than `console.log`, the handful of tests that need to intercept it monkey-patch `fs.writeSync` in `beforeEach` and restore it in `afterEach`. `tests/commands.test.cjs`'s `websearch command` suite does this and also swaps `global.fetch` for a fake to avoid a real network call:
```javascript
beforeEach(() => {
  origWriteSync = fs.writeSync;
  captured = '';
  fs.writeSync = (fd, data) => { if (fd === 1) captured += data; return Buffer.byteLength(String(data)); };
});
afterEach(() => { fs.writeSync = origWriteSync; });

test('returns results for successful API response', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ web: { /* ... */ } }) });
  await cmdWebsearch('test query', {}, false);
  assert.strictEqual(JSON.parse(captured).available, true);
});
```
3. **E2E-only module interception:** `tests/e2e/mock-layer.cjs`'s `interceptCoreExports()` monkey-patches `require.cache` entries for `core.cjs`, always paired with a `restore()` call.

**What's NOT mocked:** git — `createTempGitProject()` runs a real `git init`/`add`/`commit` against a temp dir; the CLI itself in unit tests, which is invoked as the real subprocess rather than stubbed.

**Workflow Contract Tests** — a distinctive pattern unique to this codebase, used in 14 of 89 root test files (~16%): rather than testing code, these tests treat the markdown workflow definitions in `get-shit-done/workflows/*.md` as testable contracts. They assert the required XML-ish sections exist, that steps appear in the documented order (via `indexOf()` position comparisons), that gate prompts match verbatim, and that every file path referenced in the workflow text actually resolves on disk:
```javascript
test('workflow file exists', () => assert.ok(fs.existsSync(WORKFLOW_PATH)));

test('has purpose, process, and success_criteria sections', () => {
  assert.match(wf, /<purpose>[\s\S]+<\/purpose>/);
  assert.match(wf, /<process>[\s\S]+<\/process>/);
});

test('steps run in contract order: coverage -> drift-check -> gate', () => {
  assert.ok(wf.indexOf('npm run test:coverage') < wf.indexOf('check-doc-drift.cjs'));
});
```
(from `tests/wrap-and-sync.test.cjs`). If you add or edit a workflow `.md` file under `get-shit-done/workflows/`, expect — or add — a matching contract test.

**Async Testing:** Rare — only 15 test callbacks across the entire unit/integration suite use `async () => {}`, because most operations round-trip a synchronous subprocess. The real pattern (above) mocks `global.fetch` rather than testing a bare async function in isolation.

**Error Testing:** Since most "errors" in this CLI surface as a non-zero exit code plus a stderr message (not a thrown JS exception observable from outside the process), black-box tests assert on `result.success === false` / `result.error` from `runGsdTools()`/`runHook()`. Direct `assert.throws()` (42 uses) is reserved for in-process module tests of functions that genuinely throw, e.g. `GsdError`.

## Test Metrics

| Metric | Value |
|--------|-------|
| Unit/integration test files | 89 |
| Unit/integration suites (`describe`) / tests | 573 / 2,932 |
| E2E test files (incl. 1 smoke) | 12 |
| E2E suites / tests | 57 / 143 |
| Performance test files | 1 |
| Performance suites / tests | 1 / 5 |
| Governance shell test files | 5 |
| **Combined node:test suites / tests** | **631 / 3,080** |
| Test helper modules | 5 (`helpers.cjs`, `hook-helpers.cjs`, `assertions.cjs`, `mock-layer.cjs`, `fixtures.cjs`) |
| Workflow-contract test files | 14 (~16% of unit/integration files) |
| Full unit/integration run time | ~41–53s (0 failures, live-measured) |
| Full E2E run time | ~5s (0 failures, live-measured) |

## Test Conventions

**When writing new tests:**

1. Use `node:test` (`describe`, `test` — preferred over the `it` alias — `beforeEach`, `afterEach`) — never Jest or Vitest
2. Use `node:assert` or `node:assert/strict` — never Chai or `expect`
3. File naming: `tests/{module-name}.test.cjs` for unit tests
4. Integration tests: prefix with `integ-` (e.g. `tests/integ-gsd-flow.test.cjs`)
5. E2E tests: place in `tests/e2e/{scenario-name}.test.cjs`
6. Always create temp directories via the helper factories — never write to the project tree
7. Always clean up temp directories in `afterEach` or via `fixtureCleanup()`
8. Reference requirement IDs in test file doc comments where one exists (e.g. `Requirement: INTEL-20`)
9. Set `GSD_TEST_MODE=1` for integration tests that need test isolation
10. For CLI tests, use `runGsdTools()` from `helpers.cjs` — never shell out directly
11. For hook tests, use `runHook()` from `hook-helpers.cjs` with JSON stdin objects
12. Assertion messages should include actual values for debugging: `assert.ok(x, \`Expected Y, got: \${x}\`)`
13. Zero external test dependencies — Node built-ins only
14. If a test needs to intercept CLI output, monkey-patch `fs.writeSync` (not `console.log`) and always restore it in `afterEach`
15. When adding or editing a `get-shit-done/workflows/*.md` file, add or update the matching workflow-contract test

**Test isolation pattern:**
- Every test creates its own temp directory
- Tests never share mutable state
- E2E mock factories return fresh objects on every call
- `require.cache` monkey-patching via `interceptCoreExports()` always restores originals

**Error path testing:**
- Every command group has "unknown subcommand" error tests in `tests/dispatcher.test.cjs`
- `tests/e2e/failure-modes.test.cjs` covers corrupt-state scenarios
- `tests/e2e/fixtures.cjs` provides `createCorruptProject()` for error-path E2E tests

## Known Gaps

- Governance shell tests (`governance/tests/*.sh`) run outside the Node test runner and are excluded from `c8` coverage (`.c8rc.json` excludes `tests/**`, and the `.sh` files aren't `.cjs` in the first place)
- No browser/DOM tests (not applicable — CLI-only project)
- Performance benchmark is a single file (`tests/perf/routing-benchmark.test.cjs`); no historical regression tracking beyond the in-test assertion
- Hook tests exercise pre-build source (`hooks/*.js`), not the esbuild-bundled output (`hooks/dist/`) — `.c8rc.json` explicitly excludes `hooks/dist/**`
- Coverage thresholds (90%/80%/95%) are enforced indirectly via doc-drift detection (`check-doc-drift.cjs`), not a hard `c8` failure gate — a coverage regression that happens to also update the documented percentage would not be caught by CI

---

*Testing analysis: 2026-07-12*
