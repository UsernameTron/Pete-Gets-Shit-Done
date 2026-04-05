/**
 * E2E Tests — CI integration and test runner validation (E2E-13)
 *
 * Validates that the test runner script, package.json script entries,
 * test file conventions, and exit code propagation all work correctly.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const RUNNER_PATH = path.join(PROJECT_ROOT, 'scripts', 'run-e2e-tests.cjs');
const PKG_PATH = path.join(PROJECT_ROOT, 'package.json');
const E2E_DIR = path.join(PROJECT_ROOT, 'tests', 'e2e');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a clean env for child `node --test` processes.
 * When this file itself runs under `node --test`, the parent sets
 * NODE_TEST_CONTEXT which causes child `node --test` invocations to
 * detect recursion and silently skip file execution. Stripping that
 * variable lets the child runner behave normally.
 */
function childTestEnv() {
  const env = Object.assign({}, process.env);
  delete env.NODE_TEST_CONTEXT;
  return env;
}

// ---------------------------------------------------------------------------
// Cleanup registry
// ---------------------------------------------------------------------------

const _tmpDirs = [];

function cleanupTmpDirs() {
  for (const dir of _tmpDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* best-effort */ }
  }
  _tmpDirs.length = 0;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CI Integration — Test Runner Validation', () => {
  afterEach(() => {
    cleanupTmpDirs();
  });

  // -------------------------------------------------------------------------
  // Group 1: Test runner script validation
  // -------------------------------------------------------------------------

  describe('Test runner script', () => {
    it('scripts/run-e2e-tests.cjs exists on disk', () => {
      assert.ok(
        fs.existsSync(RUNNER_PATH),
        `Expected runner script at ${RUNNER_PATH}`
      );
    });

    it('scripts/run-e2e-tests.cjs is valid JavaScript', () => {
      // node --check performs syntax validation without executing the file
      execFileSync(process.execPath, ['--check', RUNNER_PATH], {
        encoding: 'utf-8',
        timeout: 10000,
      });
      // If we reach here without throwing, the file has no syntax errors
    });
  });

  // -------------------------------------------------------------------------
  // Group 2: package.json script entries
  // -------------------------------------------------------------------------

  describe('package.json script entries', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));

    it('test:e2e script exists and is a string', () => {
      assert.ok(
        pkg.scripts && typeof pkg.scripts['test:e2e'] === 'string',
        'package.json should have a test:e2e script entry'
      );
    });

    it('test:e2e:smoke script exists and is a string', () => {
      assert.ok(
        pkg.scripts && typeof pkg.scripts['test:e2e:smoke'] === 'string',
        'package.json should have a test:e2e:smoke script entry'
      );
    });

    it('test:e2e references run-e2e-tests', () => {
      assert.ok(
        pkg.scripts['test:e2e'].includes('run-e2e-tests'),
        'test:e2e script should reference run-e2e-tests'
      );
    });

    it('test:e2e:smoke references --smoke flag', () => {
      assert.ok(
        pkg.scripts['test:e2e:smoke'].includes('--smoke'),
        'test:e2e:smoke script should include --smoke flag'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Group 3: Test file conventions
  // -------------------------------------------------------------------------

  describe('Test file conventions', () => {
    const testFiles = fs.readdirSync(E2E_DIR)
      .filter(f => f.endsWith('.test.cjs'))
      .map(f => ({
        name: f,
        content: fs.readFileSync(path.join(E2E_DIR, f), 'utf-8'),
      }));

    it('all E2E test files use node:test', () => {
      assert.ok(testFiles.length > 0, 'Should find at least one .test.cjs file');

      for (const { name, content } of testFiles) {
        assert.ok(
          content.includes("require('node:test')"),
          `${name} should require('node:test')`
        );
      }
    });

    it('no E2E test files use external test frameworks', () => {
      const forbidden = /require\(['"](?:jest|mocha|vitest|ava)['"]\)/;

      for (const { name, content } of testFiles) {
        assert.ok(
          !forbidden.test(content),
          `${name} must not require jest, mocha, vitest, or ava`
        );
      }
    });

    it('all E2E test files use node:assert/strict', () => {
      for (const { name, content } of testFiles) {
        assert.ok(
          content.includes("require('node:assert/strict')"),
          `${name} should require('node:assert/strict')`
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // Group 4: Test runner exit code propagation
  // -------------------------------------------------------------------------

  describe('Exit code propagation', () => {
    it('node --test exits 0 for a passing smoke test', () => {
      const smokeFile = path.join(E2E_DIR, 'e2e-infrastructure.smoke.test.cjs');
      assert.ok(
        fs.existsSync(smokeFile),
        'Smoke test file should exist for exit code validation'
      );

      // Running node --test on the smoke test should exit 0.
      // Use childTestEnv() to avoid NODE_TEST_CONTEXT recursion guard.
      execFileSync(process.execPath, ['--test', smokeFile], {
        encoding: 'utf-8',
        timeout: 30000,
        cwd: PROJECT_ROOT,
        env: childTestEnv(),
      });
      // If we reach here without throwing, exit code was 0
    });

    it('node --test exits non-zero for a deliberately failing test', () => {
      const tmpBase = fs.realpathSync(os.tmpdir());
      const tmpDir = path.join(
        tmpBase,
        `gsd-e2e-ci-${crypto.randomBytes(4).toString('hex')}`
      );
      fs.mkdirSync(tmpDir, { recursive: true });
      _tmpDirs.push(tmpDir);

      const failingTest = path.join(tmpDir, 'always-fails.test.cjs');
      fs.writeFileSync(failingTest, [
        "'use strict';",
        "const { describe, it } = require('node:test');",
        "const assert = require('node:assert/strict');",
        "describe('deliberate failure', () => {",
        "  it('should fail', () => {",
        "    assert.strictEqual(1, 2, 'deliberate failure');",
        '  });',
        '});',
        '',
      ].join('\n'));

      let threw = false;
      try {
        execFileSync(process.execPath, ['--test', failingTest], {
          encoding: 'utf-8',
          timeout: 15000,
          env: childTestEnv(),
        });
      } catch (err) {
        threw = true;
        assert.ok(
          err.status !== 0,
          `Expected non-zero exit code, got ${err.status}`
        );
      }

      assert.ok(threw, 'execFileSync should have thrown for failing test');
    });
  });
});
