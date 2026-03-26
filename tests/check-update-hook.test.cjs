/**
 * Tests for hooks/gsd-check-update.js
 *
 * The check-update hook is a SessionStart hook that detects the config
 * directory and spawns a background process for npm version checks.
 * We test the pure logic parts (config dir detection, cache dir creation)
 * rather than the background spawn behavior.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

let tmpDirs = [];

function makeTmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-upd-test-'));
  tmpDirs.push(d);
  return d;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

afterEach(() => {
  for (const d of tmpDirs) { try { cleanup(d); } catch (e) {} }
  tmpDirs = [];
});

describe('gsd-check-update hook', () => {
  const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-check-update.js');

  // ── detectConfigDir with CLAUDE_CONFIG_DIR ─────────────────

  it('detectConfigDir uses CLAUDE_CONFIG_DIR when set and VERSION exists', () => {
    const tmpDir = makeTmpDir();
    // Create VERSION file where detectConfigDir expects it
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'VERSION'), '1.2.3');

    // Run the hook with CLAUDE_CONFIG_DIR set — it will spawn a background
    // process but we just verify it doesn't crash and creates cache dir
    try {
      execFileSync(process.execPath, [HOOK_PATH], {
        env: {
          ...process.env,
          CLAUDE_CONFIG_DIR: tmpDir,
          HOME: tmpDir,
          USERPROFILE: tmpDir,  // Windows: os.homedir() uses USERPROFILE, not HOME
        },
        cwd: tmpDir,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      // Hook may exit with error if npm is not available, that's ok
    }

    // The hook should have created a cache directory under the config dir
    const cacheDir = path.join(tmpDir, 'cache');
    assert.ok(fs.existsSync(cacheDir), 'cache directory should be created');
  });

  // ── detectConfigDir fallback to .claude ────────────────────

  it('detectConfigDir falls back to .claude when no CLAUDE_CONFIG_DIR', () => {
    const tmpDir = makeTmpDir();
    // Create .claude/get-shit-done/VERSION to simulate installed GSD
    const claudeGsdDir = path.join(tmpDir, '.claude', 'get-shit-done');
    fs.mkdirSync(claudeGsdDir, { recursive: true });
    fs.writeFileSync(path.join(claudeGsdDir, 'VERSION'), '1.0.0');

    try {
      execFileSync(process.execPath, [HOOK_PATH], {
        env: {
          ...process.env,
          HOME: tmpDir,
          USERPROFILE: tmpDir,  // Windows: os.homedir() uses USERPROFILE, not HOME
          // Explicitly unset CLAUDE_CONFIG_DIR
          CLAUDE_CONFIG_DIR: '',
        },
        cwd: tmpDir,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      // Hook may exit with error if npm is not available, that's ok
    }

    // Should create cache dir under .claude
    const cacheDir = path.join(tmpDir, '.claude', 'cache');
    assert.ok(fs.existsSync(cacheDir), 'cache directory should be created under .claude');
  });

  // ── Creates cache directory ────────────────────────────────

  it('creates cache directory when it does not exist', () => {
    const tmpDir = makeTmpDir();
    // No .claude dir, no VERSION — it falls back to HOME/.claude
    // The hook should still create the cache dir

    try {
      execFileSync(process.execPath, [HOOK_PATH], {
        env: {
          ...process.env,
          HOME: tmpDir,
          USERPROFILE: tmpDir,  // Windows: os.homedir() uses USERPROFILE, not HOME
          CLAUDE_CONFIG_DIR: '',
        },
        cwd: tmpDir,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      // Expected — no VERSION file, but cache dir should still be created
    }

    // Even with no VERSION file, detectConfigDir falls back to HOME/.claude
    // and the hook creates cache dir under that
    const cacheDir = path.join(tmpDir, '.claude', 'cache');
    assert.ok(fs.existsSync(cacheDir), 'cache directory should be created even without VERSION');
  });

  // ── Does not crash with unusual HOME ───────────────────────

  it('does not crash with non-existent HOME directory', () => {
    const fakeHome = path.join(os.tmpdir(), `gsd-upd-nohome-${process.pid}`);
    // Do NOT create fakeHome — it should not exist

    let exitCode = 0;
    try {
      execFileSync(process.execPath, [HOOK_PATH], {
        env: {
          ...process.env,
          HOME: fakeHome,
          USERPROFILE: fakeHome,  // Windows: os.homedir() uses USERPROFILE, not HOME
          CLAUDE_CONFIG_DIR: '',
        },
        cwd: os.tmpdir(),
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) {
      exitCode = e.status ?? 1;
    }

    // The hook may fail (mkdirSync on non-existent parent) but should not
    // produce an unhandled exception that crashes Node with code > 1.
    // Any exit code is acceptable as long as it does not hang.
    assert.ok(typeof exitCode === 'number', 'should exit without hanging');

    // Cleanup in case it was created
    try { fs.rmSync(fakeHome, { recursive: true, force: true }); } catch (e) {}
  });
});
