/**
 * Tests for hooks/gsd-context-monitor.js
 *
 * The context monitor is a PostToolUse hook that reads bridge file metrics
 * and injects context usage warnings as additionalContext when thresholds
 * are exceeded. Advisory only -- always exits 0.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runHook, writeBridgeFile, createTempWithConfig, cleanup } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-context-monitor.js');

// Unique session IDs per test to avoid cross-contamination
let testCounter = 0;
function uniqueSession() {
  return `ctx-mon-test-${process.pid}-${++testCounter}`;
}

// Clean up bridge and warn files for a session
function cleanupSession(sessionId) {
  const tmpDir = os.tmpdir();
  for (const suffix of ['', '-warned']) {
    const f = path.join(tmpDir, `claude-ctx-${sessionId}${suffix}.json`);
    try { fs.unlinkSync(f); } catch (e) {}
  }
}

describe('gsd-context-monitor hook', () => {
  let sessionId;

  beforeEach(() => {
    sessionId = uniqueSession();
  });

  afterEach(() => {
    cleanupSession(sessionId);
  });

  // ── No bridge file ──────────────────────────────────────────

  it('exits 0 silently when no bridge file exists', () => {
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'no output when bridge file missing');
  });

  // ── High remaining (no warning) ────────────────────────────

  it('exits 0 silently when remaining is above 35%', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 50,
      used_pct: 50,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'no warning at 50% remaining');
  });

  // ── Thresholds: no usage countdowns ────────────────────────
  // The harness auto-compacts; injecting remaining-% makes the model wrap up
  // early. Only a GSD session at CRITICAL gets a note, and it carries no numbers.

  function gsdDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-ctx-test-'));
    fs.mkdirSync(path.join(dir, '.planning'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.planning', 'STATE.md'), '# State');
    return dir;
  }

  function bridge(remaining) {
    writeBridgeFile(sessionId, {
      remaining_percentage: remaining,
      used_pct: 100 - remaining,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }

  it('stays silent at WARNING level (35%)', () => {
    const dir = gsdDir();
    bridge(35);
    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'no countdown at WARNING');
    cleanup(dir);
  });

  it('GSD session at CRITICAL gets the STATE.md note with no percentages', () => {
    const dir = gsdDir();
    bridge(25);
    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.equal(result.exitCode, 0);
    const ctx = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
    assert.ok(ctx.includes('STATE.md'), 'mentions STATE.md');
    assert.ok(!/\d+%/.test(ctx), 'no usage percentages');
    cleanup(dir);
  });

  it('stays silent at CRITICAL outside a GSD project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-ctx-test-'));
    bridge(10);
    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'no countdown for non-GSD sessions');
    cleanup(dir);
  });

  // ── Debounce ───────────────────────────────────────────────

  it('debounces repeated CRITICAL notes within DEBOUNCE_CALLS', () => {
    const dir = gsdDir();
    bridge(20);
    const first = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.ok(first.stdout.includes('STATE.md'), 'first call should note');
    for (let i = 2; i <= 5; i++) {
      const r = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
      assert.equal(r.exitCode, 0);
      assert.equal(r.stdout.trim(), '', `call ${i} should be debounced`);
    }
    const sixth = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.ok(sixth.stdout.includes('STATE.md'), 'call after debounce should note');
    cleanup(dir);
  });

  it('severity escalation from WARNING to CRITICAL bypasses debounce', () => {
    const dir = gsdDir();
    bridge(30);
    const first = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.equal(first.stdout.trim(), '', 'WARNING is silent');
    bridge(20);
    const second = runHook(HOOK_PATH, { session_id: sessionId, cwd: dir });
    assert.ok(second.stdout.includes('STATE.md'), 'escalation should bypass debounce');
    cleanup(dir);
  });

  // ── Stale bridge file ──────────────────────────────────────

  it('ignores stale bridge file (timestamp > 60s ago)', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 20,
      used_pct: 80,
      timestamp: Math.floor(Date.now() / 1000) - 120, // 2 minutes ago
    });
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'should ignore stale metrics');
  });

  // ── Invalid JSON bridge file ───────────────────────────────

  it('exits 0 silently when bridge file contains invalid JSON', () => {
    const bridgePath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
    fs.writeFileSync(bridgePath, 'not valid json {{{');

    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'should silently pass on invalid JSON');
  });

  // ── Invalid / missing stdin ────────────────────────────────

  it('exits 0 silently on invalid stdin JSON', () => {
    const result = runHook(HOOK_PATH, 'not json at all');
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '');
  });

  it('exits 0 silently when session_id is missing', () => {
    const result = runHook(HOOK_PATH, { tool_name: 'Bash' });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '');
  });

  // ── Config disables warnings ───────────────────────────────

  it('exits 0 silently when config.json disables context_warnings', () => {
    const tmpDir = createTempWithConfig({ hooks: { context_warnings: false } });

    writeBridgeFile(sessionId, {
      remaining_percentage: 20,
      used_pct: 80,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'should not warn when disabled by config');

    cleanup(tmpDir);
  });
});
