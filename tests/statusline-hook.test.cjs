/**
 * Tests for hooks/gsd-statusline.js
 *
 * The statusline hook formats context usage, current task, and update
 * notifications for the Claude Code statusline. It also writes a bridge
 * file consumed by the context-monitor hook.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runHook, cleanup } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-statusline.js');

let tmpDirs = [];

function makeTmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-sl-test-'));
  tmpDirs.push(d);
  return d;
}

// Clean bridge files written during tests
let bridgeFiles = [];
function cleanBridge(sessionId) {
  const f = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
  bridgeFiles.push(f);
}

afterEach(() => {
  for (const d of tmpDirs) { try { cleanup(d); } catch (e) {} }
  tmpDirs = [];
  for (const f of bridgeFiles) { try { fs.unlinkSync(f); } catch (e) {} }
  bridgeFiles = [];
});

describe('gsd-statusline hook', () => {
  // ── Bridge file writing ────────────────────────────────────

  it('writes bridge file with correct metrics structure', () => {
    const sid = `sl-bridge-${process.pid}`;
    cleanBridge(sid);

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude Opus' },
      context_window: { remaining_percentage: 60 },
      workspace: { current_dir: '/tmp/test-project' },
    });
    assert.equal(result.exitCode, 0);

    const bridgePath = path.join(os.tmpdir(), `claude-ctx-${sid}.json`);
    assert.ok(fs.existsSync(bridgePath), 'bridge file should exist');

    const metrics = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
    assert.equal(metrics.session_id, sid);
    assert.equal(metrics.remaining_percentage, 60);
    assert.equal(typeof metrics.used_pct, 'number');
    assert.equal(typeof metrics.timestamp, 'number');
  });

  // ── Progress bar formatting ────────────────────────────────

  it('shows green progress bar at low usage (remaining ~90%)', () => {
    const sid = `sl-green-${process.pid}`;
    cleanBridge(sid);

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      context_window: { remaining_percentage: 90 },
      workspace: { current_dir: '/tmp/proj' },
    });
    assert.equal(result.exitCode, 0);
    // Green ANSI: \x1b[32m
    assert.ok(result.stdout.includes('\x1b[32m'), 'should use green color for low usage');
    assert.ok(result.stdout.includes('%'), 'should include percentage');
  });

  it('shows yellow progress bar at medium usage (~50% remaining)', () => {
    const sid = `sl-yellow-${process.pid}`;
    cleanBridge(sid);

    // remaining_percentage=40 -> usableRemaining = (40-16.5)/(83.5)*100 ~ 28.1 -> used ~ 72
    // That puts us in the orange range. Let's pick remaining=50 -> usable ~ 40.1 -> used ~ 60
    // used=60 is in the 50-65 range = yellow
    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      context_window: { remaining_percentage: 50 },
      workspace: { current_dir: '/tmp/proj' },
    });
    assert.equal(result.exitCode, 0);
    // Yellow ANSI: \x1b[33m
    assert.ok(result.stdout.includes('\x1b[33m'), 'should use yellow color at ~60% used');
  });

  it('shows red/blinking progress bar at very high usage (remaining ~20%)', () => {
    const sid = `sl-red-${process.pid}`;
    cleanBridge(sid);

    // remaining_percentage=20 -> usableRemaining = (20-16.5)/(83.5)*100 ~ 4.2 -> used ~ 96
    // used >= 80 -> red blinking
    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      context_window: { remaining_percentage: 20 },
      workspace: { current_dir: '/tmp/proj' },
    });
    assert.equal(result.exitCode, 0);
    // Red blinking: \x1b[5;31m
    assert.ok(result.stdout.includes('\x1b[5;31m'), 'should use red blinking at high usage');
  });

  // ── Without context data ───────────────────────────────────

  it('outputs model and dirname without context bar when no context_window', () => {
    const result = runHook(HOOK_PATH, {
      session_id: 'sl-noctx',
      model: { display_name: 'Sonnet' },
      workspace: { current_dir: '/Users/pete/my-project' },
    });
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('Sonnet'), 'should include model name');
    assert.ok(result.stdout.includes('my-project'), 'should include dirname');
    // No progress bar characters
    assert.ok(!result.stdout.includes('%'), 'no percentage without context data');
  });

  // ── Current task from todos ────────────────────────────────

  it('shows active task when todo file exists', () => {
    const tmpDir = makeTmpDir();
    const sid = `sl-task-${process.pid}`;
    cleanBridge(sid);

    // Create todos directory with a matching session file
    const todosDir = path.join(tmpDir, 'todos');
    fs.mkdirSync(todosDir, { recursive: true });
    const todoFile = path.join(todosDir, `${sid}-agent-main.json`);
    fs.writeFileSync(todoFile, JSON.stringify([
      { status: 'completed', activeForm: 'Done task' },
      { status: 'in_progress', activeForm: 'Writing tests' },
    ]));

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      context_window: { remaining_percentage: 80 },
      workspace: { current_dir: '/tmp/proj' },
    }, { env: { CLAUDE_CONFIG_DIR: tmpDir } });

    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('Writing tests'), 'should show in_progress task');
  });

  // ── Update notification ────────────────────────────────────

  it('shows update notification when cache file indicates update available', () => {
    const tmpDir = makeTmpDir();
    const sid = `sl-update-${process.pid}`;
    cleanBridge(sid);

    const cacheDir = path.join(tmpDir, 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      path.join(cacheDir, 'gsd-update-check.json'),
      JSON.stringify({ update_available: true, installed: '1.0.0', latest: '1.1.0' })
    );

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/tmp/proj' },
    }, { env: { CLAUDE_CONFIG_DIR: tmpDir } });

    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('/gsd:update'), 'should show update notification');
  });

  it('shows stale hooks warning when cache indicates stale hooks', () => {
    const tmpDir = makeTmpDir();
    const sid = `sl-stale-${process.pid}`;
    cleanBridge(sid);

    const cacheDir = path.join(tmpDir, 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      path.join(cacheDir, 'gsd-update-check.json'),
      JSON.stringify({ update_available: false, stale_hooks: [{ file: 'gsd-foo.js' }] })
    );

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/tmp/proj' },
    }, { env: { CLAUDE_CONFIG_DIR: tmpDir } });

    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('stale hooks'), 'should show stale hooks warning');
  });

  // ── CLAUDE_CONFIG_DIR override ─────────────────────────────

  it('respects CLAUDE_CONFIG_DIR for todos and cache lookup', () => {
    const tmpDir = makeTmpDir();
    const sid = `sl-cfgdir-${process.pid}`;
    cleanBridge(sid);

    // Create cache with no update — just verify it does not crash
    const cacheDir = path.join(tmpDir, 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      path.join(cacheDir, 'gsd-update-check.json'),
      JSON.stringify({ update_available: false })
    );

    const result = runHook(HOOK_PATH, {
      session_id: sid,
      model: { display_name: 'Claude' },
      workspace: { current_dir: '/tmp/proj' },
    }, { env: { CLAUDE_CONFIG_DIR: tmpDir } });

    assert.equal(result.exitCode, 0);
    // Should not crash and should include basic output
    assert.ok(result.stdout.includes('Claude'), 'should produce output with custom config dir');
  });

  // ── Error resilience ───────────────────────────────────────

  it('exits 0 silently on invalid stdin JSON', () => {
    const result = runHook(HOOK_PATH, 'not json');
    assert.equal(result.exitCode, 0);
  });
});
