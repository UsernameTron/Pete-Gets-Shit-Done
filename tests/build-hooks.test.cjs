/**
 * Tests for scripts/build-hooks.js
 *
 * The build script validates JavaScript syntax of hook files using vm.Script
 * and copies them to hooks/dist/. We test syntax validation logic and
 * the integration check that all hook source files are valid.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const vm = require('vm');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'build-hooks.js');
const HOOKS_DIR = path.join(__dirname, '..', 'hooks');

let tmpDirs = [];

function makeTmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-bh-test-'));
  tmpDirs.push(d);
  return d;
}

afterEach(() => {
  for (const d of tmpDirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {} }
  tmpDirs = [];
});

// Replicate validateSyntax locally since the script doesn't export it
function validateSyntax(content) {
  try {
    new vm.Script(content, { filename: 'test.js' });
    return null;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return e.message;
    }
    throw e;
  }
}

describe('build-hooks script', () => {
  // ── validateSyntax logic ───────────────────────────────────

  it('returns null for valid JavaScript syntax', () => {
    const result = validateSyntax('const x = 1;\nconsole.log(x);');
    assert.equal(result, null, 'valid JS should return null');
  });

  it('returns error message for invalid JavaScript syntax', () => {
    const result = validateSyntax('const x = ;');
    assert.ok(typeof result === 'string', 'invalid JS should return error string');
    assert.ok(result.length > 0, 'error message should not be empty');
  });

  it('detects duplicate const declaration', () => {
    const result = validateSyntax('const x = 1;\nconst x = 2;');
    assert.ok(typeof result === 'string', 'duplicate const should return error');
  });

  // ── All hook source files have valid syntax (integration) ──

  it('all 5 hook source files have valid JavaScript syntax', () => {
    const hookFiles = [
      'gsd-check-update.js',
      'gsd-context-monitor.js',
      'gsd-prompt-guard.js',
      'gsd-statusline.js',
      'gsd-workflow-guard.js',
    ];

    for (const hookFile of hookFiles) {
      const filePath = path.join(HOOKS_DIR, hookFile);
      assert.ok(fs.existsSync(filePath), `${hookFile} should exist`);

      const content = fs.readFileSync(filePath, 'utf8');
      const error = validateSyntax(content);
      assert.equal(error, null, `${hookFile} should have valid syntax, got: ${error}`);
    }
  });

  // ── Full build script execution ────────────────────────────

  it('build script creates dist directory when absent', () => {
    const distDir = path.join(HOOKS_DIR, 'dist');
    // Remove dist so the mkdir branch is exercised
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }

    let stdout;
    try {
      stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
        encoding: 'utf8',
        timeout: 10000,
        cwd: path.join(__dirname, '..'),
      });
    } catch (e) {
      assert.fail(`build-hooks.js failed with exit code ${e.status}: ${e.stderr}`);
    }

    assert.ok(fs.existsSync(distDir), 'dist directory should be created');
    assert.ok(stdout.includes('Build complete'), 'should report build complete');
  });

  it('build script runs successfully and creates dist files', () => {
    let stdout;
    try {
      stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
        encoding: 'utf8',
        timeout: 10000,
        cwd: path.join(__dirname, '..'),
      });
    } catch (e) {
      assert.fail(`build-hooks.js failed with exit code ${e.status}: ${e.stderr}`);
    }

    assert.ok(stdout.includes('Build complete'), 'should report build complete');

    // Verify dist files were created
    const distDir = path.join(HOOKS_DIR, 'dist');
    assert.ok(fs.existsSync(distDir), 'dist directory should exist');

    const expectedFiles = [
      'gsd-check-update.js',
      'gsd-context-monitor.js',
      'gsd-prompt-guard.js',
      'gsd-statusline.js',
      'gsd-workflow-guard.js',
    ];

    for (const f of expectedFiles) {
      assert.ok(
        fs.existsSync(path.join(distDir, f)),
        `dist/${f} should exist after build`
      );
    }
  });
});
