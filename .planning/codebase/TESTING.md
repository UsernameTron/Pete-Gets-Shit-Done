# Testing Patterns

**Analysis Date:** 2026-10-26

Live counts: run `npm test` (do not copy numbers into docs; `scripts/check-doc-drift.cjs` guards the ones in `CLAUDE.md`/`README.md`).

## Test Framework

**Runner:**
- Node built-in `node:test`. No Jest/Vitest config. Requires Node >= 20.
- `scripts/run-tests.cjs` lists `tests/*.test.cjs` (non-recursive, sorted) and spawns `node --test <files>`. Glob resolution is in JS so it works on Windows. Subdirectories such as `tests/e2e/` are NOT part of `npm test`.
- Hermetic sandbox: the runner sets `HOME` and `USERPROFILE` to a throwaway temp dir and blanks `CLAUDE_CONFIG_DIR`, so installer tests never touch the real `~/.claude`. Keep any new test that runs the installer or hooks compatible with this (never read the real home).
- `scripts/run-e2e-tests.cjs` runs `tests/e2e/*.test.cjs`; `--smoke` restricts to `tests/e2e/*.smoke.test.cjs`.

**Assertion library:** `node:assert` (`assert.strictEqual`, `assert.ok`, `assert.deepStrictEqual`, `assert.match`) or `node:assert/strict` (newer files, hooks, e2e).

**Run commands:**
```bash
npm test                      # full unit/integration suite
npm run test:coverage         # c8, text + json reporters
npm run test:coverage:full    # adds lcov (used by CI)
npm run test:e2e              # tests/e2e/*
npm run test:e2e:smoke        # smoke subset
node --test tests/phase.test.cjs   # single file
```

## Test File Organization

**Location:** flat in `tests/`, one file per module/feature, named `<topic>.test.cjs`. Examples: `tests/phase.test.cjs`, `tests/security.test.cjs`, `tests/prompt-guard-hook.test.cjs`, `tests/architecture.test.cjs`, `tests/install-cli-matrix.test.cjs`.

```
tests/
├── *.test.cjs         # run by npm test
├── helpers.cjs        # runGsdTools, createTempProject, createTempGitProject, cleanup
├── hook-helpers.cjs   # runHook and temp-config helpers for hooks
├── fixtures/          # static corpora (doc-drift, doc-links, layer1-false-positives.jsonl)
└── e2e/               # *.test.cjs + assertions.cjs, fixtures.cjs, mock-layer.cjs
```

Naming conventions:
- `<module>.test.cjs` for lib modules.
- `<hook>-hook.test.cjs` for hooks.
- `install-*.test.cjs` and `<runtime>-install.test.cjs` for installer paths.
- `integ-*.test.cjs` for cross-component tests.
- `e2e/*.smoke.test.cjs` for smoke subset.

## Test Structure

**Suite organization (default pattern):**
```javascript
const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('phases list command', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => { cleanup(tmpDir); });

  test('empty phases directory returns empty array', () => {
    const result = runGsdTools('phases list', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.deepStrictEqual(output.directories, []);
  });
});
```

**Rules:**
- Use `describe` + `test` (or `it`; both appear, `it` mostly in hook/e2e tests). Include a `/** ... */` header naming the unit under test.
- Always create state in temp dirs and remove it in `afterEach`/`after`.
- Include a failure message on `assert.ok(result.success, ...)` showing `result.error`.
- Test names describe behaviour: `'rejects ../ traversal escaping base'`.

## CLI and Hook Testing (no mocks, real child processes)

**CLI:** `runGsdTools(args, cwd, env)` in `tests/helpers.cjs` spawns `get-shit-done/bin/gsd-tools.cjs` and returns `{ success, output, error }`. Pass an array for shell-safe args (`execFileSync`), a string for shell-interpreted. Pass `{ HOME: cwd }` as env when asserting config values a developer's `~/.gsd/defaults.json` could override.

**Hooks:** `runHook(hookPath, stdinObj, { env, cwd })` in `tests/hook-helpers.cjs` pipes JSON to stdin and returns `{ exitCode, stdout, stderr }`:
```javascript
const result = runHook(HOOK_PATH, { tool_name: 'Write', tool_input: { file_path: '/project/.planning/STATE.md', content: '...' } });
assert.equal(result.exitCode, 2);   // 2 = block, 0 = allow
```

**Installer:** `tests/install-cli-matrix.test.cjs` drives `bin/install.js` with `spawnSync`, using a `sandboxEnv(home, extra)` that sets a fresh `HOME`/`USERPROFILE` and deletes runtime override env vars (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `OPENCODE_CONFIG_DIR`, `XDG_CONFIG_HOME`, `GSD_TEST_MODE`, etc.). It iterates `ALL_RUNTIMES` (claude, opencode, gemini, codex, copilot, antigravity, cursor, windsurf) for install/uninstall. Reuse this `run()`/`sandboxEnv()` pattern for new installer CLI cases. Children's coverage is collected because c8 propagates `NODE_V8_COVERAGE`.

**Installer unit tests:** `tests/install-coverage-utils.test.cjs`, `-converters`, `-governance` require modules from `bin/lib/` directly (e.g. `require('../bin/lib/settings')`) or set `GSD_TEST_MODE` so `bin/install.js` exports internals instead of running.

## Mocking

**Framework:** none; no sinon/jest. Mocking is rare and manual: save the original, replace, restore in `afterEach`.

```javascript
beforeEach(() => {
  origFetch = global.fetch;
  origWriteSync = fs.writeSync;
  captured = '';
  fs.writeSync = (fd, data) => { if (fd === 1) captured += data; return Buffer.byteLength(String(data)); };
});
afterEach(() => { global.fetch = origFetch; fs.writeSync = origWriteSync; });
```
(from `tests/commands.test.cjs`, capturing `output()` which writes via `fs.writeSync(1, ...)`).

**What to mock:** `global.fetch` for network calls; `fs.writeSync` to capture stdout/stderr; environment variables (save/restore `process.env.X`).

**What NOT to mock:** the filesystem (use real temp dirs), git (use `createTempGitProject`), the CLI or hooks (spawn them).

**E2E mock layer:** `tests/e2e/mock-layer.cjs` provides stateless factories (`mockSubagent(name, canned)` returns `{ calls, invoke }`, plus a context builder). No module-level mutable state; each call returns fresh objects.

## Fixtures and Factories

- `createTempDir`, `createTempProject` (creates `.planning/phases`), `createTempGitProject` (git init, local identity, `commit.gpgsign false`, one commit) in `tests/helpers.cjs`. Always `cleanup(dir)` them.
- `tests/e2e/fixtures.cjs`: `createEmptyProject`, `createMidMilestoneProject`, `fixtureCleanup`.
- `tests/e2e/assertions.cjs`: `assertSuccess`, `assertFailure`, `assertFileExists`, `assertFileContains`, `assertValidFrontmatter` (wrap `node:assert/strict` with richer messages).
- Static corpora in `tests/fixtures/` (see `tests/fixtures/README.md`; `layer1-false-positives.jsonl` is the regression corpus for `.claude/hooks/lesson-capture-gate.cjs`).
- Installer tests allocate temp dirs through a `tmp()` helper tracking `tmpDirs` and remove them in a top-level `after()`.

## Coverage

**Tool:** `c8` configured in `.c8rc.json`.
- Included: `get-shit-done/bin/lib/*.cjs`, `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, `bin/lib/**/*.js`, `hooks/*.js`, `scripts/build-hooks.js`, `.claude/hooks/lesson-capture-gate.cjs`, `scripts/validate-doc-links.cjs`, `scripts/check-doc-drift.cjs`.
- Excluded: `hooks/dist/**`, `tests/**`. `all: true` counts untested files.
- Targets (project policy in `CLAUDE.md`): 90% overall, 80% per module, 95% for security-critical modules (`security.cjs`, input validation). `scripts/ci-coverage-report.sh` warns below an 80% line threshold (`THRESHOLD=80`) and summarizes `coverage/coverage-summary.json`.
- Check per-module numbers, not just the total.
- CI (`.github/workflows/test.yml`): ubuntu Node 20 and 22 run the full coverage suite; macOS Node 22 runs the reduced `test:coverage`. `scripts/check-doc-drift.cjs` runs in the `test` job (needs coverage run within the last hour). The `governance` and `docs-integrity` jobs are separate required checks.

## Test Types

**Unit / module tests:** call lib functions or the CLI per command (`tests/phase.test.cjs`, `state`, `roadmap`, `milestone`, `config`, `frontmatter`, `security`).

**Structural/contract tests:** assert repo invariants, e.g. `tests/architecture.test.cjs` (layer boundaries by scanning `require()` calls), `tests/hook-registration-contract.test.cjs`, `tests/agent-frontmatter.test.cjs`, `tests/enforcement-contracts.test.cjs`, `tests/claude-md.test.cjs`, `tests/check-doc-drift.test.cjs`.

**Security tests:** `tests/security.test.cjs`, `tests/security-hardening-v2.2.test.cjs`, `tests/prompt-injection-scan.test.cjs`, `tests/security-scan.test.cjs`, and per-hook suites (`prompt-guard-hook`, `config-protection-hook`, `cost-tracker-hook`, `context-monitor-hook`).

**Integration:** `tests/integ-*.test.cjs`, `tests/plugin-integration.test.cjs`, installer suites (`install-cli-matrix`, `*-install`, `multi-runtime-select`, `runtime-converters`).

**E2E:** `tests/e2e/*` pipeline scenarios (new-project, plan-execute, verify-ship, milestone lifecycle, failure modes), run separately via `npm run test:e2e`.

## Common Patterns

**Error/exit-code testing:**
```javascript
const r = run(['--global', '--local'], { cwd });
assert.strictEqual(r.status, 1);
assert.match(r.stderr, /Cannot specify both --global and --local/);
```

**Result-object validators:**
```javascript
const result = validatePath('../../etc/passwd', base);
assert.ok(!result.safe);
assert.ok(result.error.includes('escapes allowed directory'));
```

**Async:** declare `test('...', async () => { await cmdWebsearch(...); })`; restore globals in `afterEach`.

## Adding Tests

- New lib module or command: create `tests/<module>.test.cjs`, use `runGsdTools` with `createTempProject`.
- New hook: `tests/<hook>-hook.test.cjs` using `runHook`; cover allow, block, and malformed stdin.
- New installer behaviour: add cases to `tests/install-cli-matrix.test.cjs` or a new `install-*.test.cjs`; always sandbox `HOME`.
- New module under `get-shit-done/bin/lib/`: check it fits a layer in `tests/architecture.test.cjs` (unlisted files are Layer 3).
- Add new source paths to `.c8rc.json` `include` if they sit outside the existing globs.

---

*Testing analysis: 2026-10-26*
