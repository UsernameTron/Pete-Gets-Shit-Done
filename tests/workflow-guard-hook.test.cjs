/**
 * Tests for hooks/gsd-workflow-guard.js
 *
 * The workflow guard is a PreToolUse hook that warns when Write/Edit
 * operations target files outside .planning/ without an active GSD
 * workflow. Disabled by default — requires hooks.workflow_guard: true
 * in .planning/config.json.
 *
 * Advisory only — always exits 0 and never blocks.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runHook, createTempWithConfig, cleanup } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-workflow-guard.js');

let tmpDirs = [];

function trackTmp(dir) {
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tmpDirs) {
    cleanup(d);
  }
  tmpDirs = [];
});

describe('gsd-workflow-guard hook', () => {
  // ── Disabled by default ───────────────────────────────────────

  it('silently passes when no config exists (no .planning/config.json)', () => {
    // No cwd override — hook checks process.cwd() which won't have .planning/
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: { file_path: '/project/src/app.js', content: 'code' },
      cwd: '/nonexistent/path',
    }, { cwd: require('os').tmpdir() });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'disabled without config — no warning');
  });

  it('silently passes when workflow_guard is explicitly false', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: false } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: { file_path: path.join(tmpDir, 'src', 'app.js'), content: 'code' },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'disabled explicitly — no warning');
  });

  // ── Enabled: allowed paths ────────────────────────────────────

  it('allows Write to .planning/ file when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, '.planning', 'STATE.md'),
        content: '# State',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', '.planning/ writes should be allowed');
  });

  it('allows Write to CLAUDE.md when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, 'CLAUDE.md'),
        content: '# CLAUDE.md',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'CLAUDE.md should be an allowed pattern');
  });

  it('allows Write to .gitignore when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, '.gitignore'),
        content: 'node_modules/',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', '.gitignore should be allowed');
  });

  it('allows Write to settings.json when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, '.claude', 'settings.json'),
        content: '{}',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'settings.json should be allowed');
  });

  // ── Enabled: blocked paths (advisory warning) ─────────────────

  it('warns on Write to arbitrary file when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, 'src', 'foo.js'),
        content: 'console.log("hi")',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(
      output.hookSpecificOutput?.additionalContext.includes('WORKFLOW ADVISORY'),
      'should produce workflow advisory warning'
    );
  });

  it('warns on Edit to arbitrary file when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Edit',
      tool_input: {
        file_path: path.join(tmpDir, 'lib', 'utils.js'),
        old_string: 'old',
        new_string: 'new',
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.ok(
      output.hookSpecificOutput?.additionalContext.includes('WORKFLOW ADVISORY'),
      'Edit to non-allowed file should warn'
    );
  });

  // ── Non-Write/Edit tools ──────────────────────────────────────

  it('silently passes for non-Write/Edit tool when enabled', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Bash',
      tool_input: { command: 'echo hello' },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'Bash tool should not trigger guard');
  });

  // ── Subagent bypass ───────────────────────────────────────────

  it('silently passes when is_subagent flag is set', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, 'src', 'generated.js'),
        content: 'code',
        is_subagent: true,
      },
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'subagent writes should bypass guard');
  });

  it('silently passes when session_type is task', () => {
    const tmpDir = trackTmp(createTempWithConfig({ hooks: { workflow_guard: true } }));
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: path.join(tmpDir, 'src', 'generated.js'),
        content: 'code',
      },
      session_type: 'task',
      cwd: tmpDir,
    }, { cwd: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '', 'task session type should bypass guard');
  });

  // ── Error handling ────────────────────────────────────────────

  it('silently exits 0 on invalid JSON stdin', () => {
    const result = runHook(HOOK_PATH, 'not valid json!!!');
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout.trim(), '');
  });
});
