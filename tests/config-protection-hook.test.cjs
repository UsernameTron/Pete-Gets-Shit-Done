/**
 * Tests for hooks/gsd-config-protection.js
 *
 * The config protection hook is a PreToolUse hook that blocks Write/Edit
 * operations targeting linter/formatter config files.
 * Agents frequently modify these to make checks pass instead of fixing code.
 *
 * Exit codes:
 *   0 = allow (not a protected config file, or non-Write/Edit tool)
 *   2 = block (protected config file modification attempted)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runHook } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-config-protection.js');

describe('gsd-config-protection hook', () => {
  // ── Blocked config files (exit 2) ────────────────────────────

  it('blocks (exit 2) Write to .eslintrc.js', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.eslintrc.js',
        content: 'module.exports = { rules: {} };',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'), 'stderr should include BLOCKED');
    assert.ok(result.stderr.includes('.eslintrc.js'), 'stderr should include filename');
  });

  it('blocks (exit 2) Edit to prettier.config.js', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Edit',
      tool_input: {
        file_path: '/project/prettier.config.js',
        old_string: 'semi: true',
        new_string: 'semi: false',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
    assert.ok(result.stderr.includes('prettier.config.js'));
  });

  it('blocks (exit 2) Write to biome.json', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/biome.json',
        content: '{}',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
    assert.ok(result.stderr.includes('biome.json'));
  });

  it('blocks (exit 2) Write to ruff.toml', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/ruff.toml',
        content: '[tool.ruff]\nline-length = 120',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
    assert.ok(result.stderr.includes('ruff.toml'));
  });

  it('blocks (exit 2) Write to .markdownlint.json', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.markdownlint.json',
        content: '{ "MD013": false }',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
    assert.ok(result.stderr.includes('.markdownlint.json'));
  });

  it('blocks (exit 2) Write to .eslintrc (bare, no extension)', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.eslintrc',
        content: '{}',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
  });

  it('blocks (exit 2) Edit to eslint.config.mjs', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Edit',
      tool_input: {
        file_path: '/project/eslint.config.mjs',
        old_string: 'rules: {}',
        new_string: 'rules: { "no-unused-vars": "off" }',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
  });

  it('blocks (exit 2) Write to .prettierrc', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.prettierrc',
        content: '{ "semi": false }',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
  });

  it('blocks (exit 2) Write to .ruff.toml', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.ruff.toml',
        content: '[lint]\nselect = []',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
  });

  it('blocks (exit 2) Write to .shellcheckrc', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/.shellcheckrc',
        content: 'disable=SC2086',
      },
    });
    assert.equal(result.exitCode, 2);
    assert.ok(result.stderr.includes('BLOCKED'));
  });

  // ── Allowed files (exit 0) ─────────────────────────────────────

  it('allows (exit 0) Write to src/index.js', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/src/index.js',
        content: 'console.log("hello");',
      },
    });
    assert.equal(result.exitCode, 0);
  });

  it('allows (exit 0) Write to pyproject.toml (intentionally not protected)', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/pyproject.toml',
        content: '[project]\nname = "myapp"',
      },
    });
    assert.equal(result.exitCode, 0);
  });

  it('allows (exit 0) non-Write/non-Edit tool (Bash)', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Bash',
      tool_input: {
        command: 'cat .eslintrc.js',
      },
    });
    assert.equal(result.exitCode, 0);
  });

  it('allows (exit 0) Read tool on protected file', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Read',
      tool_input: {
        file_path: '/project/.eslintrc.js',
      },
    });
    assert.equal(result.exitCode, 0);
  });

  it('allows (exit 0) Write to package.json (not a linter config)', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {
        file_path: '/project/package.json',
        content: '{"name": "myapp"}',
      },
    });
    assert.equal(result.exitCode, 0);
  });

  // ── Edge cases ────────────────────────────────────────────────

  it('exits 0 on empty stdin', () => {
    const result = runHook(HOOK_PATH, '');
    assert.equal(result.exitCode, 0);
  });

  it('exits 0 on invalid JSON stdin', () => {
    const result = runHook(HOOK_PATH, 'not valid json {{{');
    assert.equal(result.exitCode, 0);
  });

  it('exits 0 when tool_input has no file_path', () => {
    const result = runHook(HOOK_PATH, {
      tool_name: 'Write',
      tool_input: {},
    });
    assert.equal(result.exitCode, 0);
  });
});
