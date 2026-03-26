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

  // ── WARNING threshold (<=35%) ──────────────────────────────

  it('emits WARNING when remaining is 35%', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 35,
      used_pct: 65,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(output.hookSpecificOutput?.additionalContext, 'should have additionalContext');
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('CONTEXT WARNING'),
      'should include WARNING level'
    );
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('65%'),
      'should include used percentage'
    );
  });

  // ── CRITICAL threshold (<=25%) ─────────────────────────────

  it('emits CRITICAL when remaining is 25%', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 25,
      used_pct: 75,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('CONTEXT CRITICAL'),
      'should include CRITICAL level'
    );
  });

  it('emits CRITICAL when remaining is 10%', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 10,
      used_pct: 90,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const result = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('CONTEXT CRITICAL'),
      'should include CRITICAL at 10%'
    );
  });

  // ── Debounce ───────────────────────────────────────────────

  it('debounces repeated warnings within DEBOUNCE_CALLS', () => {
    writeBridgeFile(sessionId, {
      remaining_percentage: 30,
      used_pct: 70,
      timestamp: Math.floor(Date.now() / 1000),
    });

    // First call: should warn
    const first = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(first.exitCode, 0);
    assert.ok(first.stdout.includes('CONTEXT WARNING'), 'first call should warn');

    // Calls 2-5: should be debounced (within DEBOUNCE_CALLS=5)
    for (let i = 2; i <= 5; i++) {
      const r = runHook(HOOK_PATH, { session_id: sessionId });
      assert.equal(r.exitCode, 0);
      assert.equal(r.stdout.trim(), '', `call ${i} should be debounced`);
    }

    // Call 6: should warn again (debounce counter reset at 5)
    const sixth = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(sixth.exitCode, 0);
    assert.ok(sixth.stdout.includes('CONTEXT WARNING'), 'call after debounce should warn');
  });

  // ── Severity escalation bypasses debounce ──────────────────

  it('severity escalation from WARNING to CRITICAL bypasses debounce', () => {
    // First call at WARNING level
    writeBridgeFile(sessionId, {
      remaining_percentage: 30,
      used_pct: 70,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const first = runHook(HOOK_PATH, { session_id: sessionId });
    assert.ok(first.stdout.includes('CONTEXT WARNING'), 'first call should warn');

    // Second call — escalate to CRITICAL (should bypass debounce)
    writeBridgeFile(sessionId, {
      remaining_percentage: 20,
      used_pct: 80,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const second = runHook(HOOK_PATH, { session_id: sessionId });
    assert.equal(second.exitCode, 0);
    assert.ok(
      second.stdout.includes('CONTEXT CRITICAL'),
      'severity escalation should bypass debounce'
    );
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

  // ── GSD-active vs not-active ───────────────────────────────

  it('includes GSD-specific guidance when .planning/STATE.md exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-ctx-test-'));
    const planningDir = path.join(tmpDir, '.planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), '# State');

    writeBridgeFile(sessionId, {
      remaining_percentage: 20,
      used_pct: 80,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    // CRITICAL + GSD-active message references STATE.md
    assert.ok(
      output.hookSpecificOutput.additionalContext.includes('STATE.md'),
      'GSD-active CRITICAL warning should mention STATE.md'
    );

    cleanup(tmpDir);
  });

  it('uses generic guidance when .planning/STATE.md does not exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-ctx-test-'));

    writeBridgeFile(sessionId, {
      remaining_percentage: 20,
      used_pct: 80,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const result = runHook(HOOK_PATH, { session_id: sessionId, cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(
      !output.hookSpecificOutput.additionalContext.includes('STATE.md'),
      'non-GSD CRITICAL warning should not mention STATE.md'
    );

    cleanup(tmpDir);
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
