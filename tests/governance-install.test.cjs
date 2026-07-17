/**
 * GSD Tools Tests - Governance Install
 *
 * Tests for governance installation: mergeGovernanceJson, installGovernance,
 * scaffoldProject, uninstallGovernance, copyDirRecursive.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  mergeGovernanceJson,
  installGovernance,
  scaffoldProject,
  uninstallGovernance,
  copyDirRecursive,
  installGovernancePlugins,
} = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'gov-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/** Write a JSON file. */
function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/** Read a JSON file. */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ─── mergeGovernanceJson ────────────────────────────────────────────────────

describe('mergeGovernanceJson', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('adds hooks to empty settings', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov-hooks.json');

    writeJson(settingsPath, {});
    writeJson(govPath, {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'echo hello' }] },
        ],
      },
    });

    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, true);

    const result = readJson(settingsPath);
    assert.ok(result.hooks, 'hooks key should exist');
    assert.ok(result.hooks.SessionStart, 'SessionStart should exist');
    assert.strictEqual(result.hooks.SessionStart.length, 1);
  });

  test('is idempotent — does not duplicate existing hooks', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov-hooks.json');

    const hookEntry = {
      hooks: [{ type: 'command', command: 'echo scanning' }],
    };

    writeJson(govPath, { hooks: { SessionStart: [hookEntry] } });
    writeJson(settingsPath, {});

    // First merge
    mergeGovernanceJson(settingsPath, govPath, 'test');
    const after1 = readJson(settingsPath);

    // Second merge — should not change
    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, false, 'Second merge should report no changes');

    const after2 = readJson(settingsPath);
    assert.deepStrictEqual(after2, after1, 'Settings should be identical after second merge');
  });

  test('adds permissions additively', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov-perms.json');

    writeJson(settingsPath, {
      permissions: { allow: ['Bash(git *)'] },
    });
    writeJson(govPath, {
      permissions: { allow: ['Read(*)', 'Bash(git *)'] },
    });

    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, true);

    const result = readJson(settingsPath);
    assert.ok(result.permissions.allow.includes('Bash(git *)'), 'Original rule preserved');
    assert.ok(result.permissions.allow.includes('Read(*)'), 'New rule added');
    // Should not duplicate Bash(git *)
    const gitCount = result.permissions.allow.filter(r => r === 'Bash(git *)').length;
    assert.strictEqual(gitCount, 1, 'Should not duplicate existing permission');
  });

  test('returns false when governance file does not exist', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    writeJson(settingsPath, {});
    const result = mergeGovernanceJson(settingsPath, path.join(tmpDir, 'nope.json'), 'test');
    assert.strictEqual(result, false);
  });
});

// ─── installGovernance ──────────────────────────────────────────────────────

describe('installGovernance', () => {
  let tmpDir;
  const REPO_ROOT = path.join(__dirname, '..');

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('global: CLAUDE.md and context land under targetDir (~/.claude), not its parent', () => {
    // Fix 2b: for a global install targetDir is ~/.claude, and Claude Code reads
    // ~/.claude/CLAUDE.md — so memory files must live under targetDir, not ~/.
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    installGovernance(claudeDir, REPO_ROOT, true);

    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    assert.ok(fs.existsSync(claudeMdPath), 'CLAUDE.md should be installed under targetDir');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md must NOT land in the parent for a global install');

    const contextDir = path.join(claudeDir, 'context');
    assert.ok(fs.existsSync(contextDir), 'context/ should exist under targetDir');
    assert.ok(fs.existsSync(path.join(contextDir, 'cli-reference.md')), 'cli-reference.md should be copied');

    // settings.json always lives inside the config dir (targetDir), never parent
    assert.ok(fs.existsSync(path.join(claudeDir, 'settings.json')), 'settings.json should be under targetDir');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'settings.json')), 'settings.json must NOT land in the parent');
  });

  test('local: CLAUDE.md/context land at the project root (parent of .claude)', () => {
    // For a local/project install, ./CLAUDE.md at the repo root is the correct
    // project-memory convention, so memory files stay at the parent.
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    installGovernance(claudeDir, REPO_ROOT, false);

    assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should land at the project root');
    assert.ok(fs.existsSync(path.join(tmpDir, 'context', 'cli-reference.md')), 'context should land at the project root');
    // settings still goes under .claude/ even for local installs
    assert.ok(fs.existsSync(path.join(claudeDir, 'settings.json')), 'settings.json should be under .claude/ for local installs too');
  });

  test('reports missing governance pieces instead of failing open', () => {
    // Fix 2a: a package with no governance/ dir must return a non-empty missing
    // list, not silently claim success.
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const emptySrc = path.join(tmpDir, 'empty-src');
    fs.mkdirSync(emptySrc, { recursive: true });

    const missing = installGovernance(claudeDir, emptySrc, true);
    assert.ok(Array.isArray(missing) && missing.length > 0, 'missing governance source must be reported');
  });

  test('preserves existing customized CLAUDE.md (no clobber, no backup litter)', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // Create an existing customized CLAUDE.md where a global install writes it
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, '# Original content');

    installGovernance(claudeDir, REPO_ROOT, true);

    // The customized file must survive untouched — reruns used to overwrite it
    // with the template and mint a .backup.<ts> file per run (122 on 2026-07-16)
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    assert.equal(content, '# Original content', 'Existing CLAUDE.md must be preserved');

    const files = fs.readdirSync(claudeDir);
    const backups = files.filter(f => f.startsWith('CLAUDE.md.backup.'));
    assert.equal(backups.length, 0, 'No backup files should be created');
  });

  test('installs template CLAUDE.md when none exists, no-ops when identical', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    installGovernance(claudeDir, REPO_ROOT, true);
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    assert.ok(content.includes('Global Claude Code Configuration'), 'Fresh install should write the governance CLAUDE.md');

    // Rerun with the file identical to the template: no backup, content unchanged
    installGovernance(claudeDir, REPO_ROOT, true);
    assert.equal(fs.readFileSync(claudeMdPath, 'utf8'), content, 'Identical file must be left as-is');
    const backups = fs.readdirSync(claudeDir).filter(f => f.startsWith('CLAUDE.md.backup.'));
    assert.equal(backups.length, 0, 'Rerun must not create backups');
  });
});

// ─── scaffoldProject ────────────────────────────────────────────────────────

describe('scaffoldProject', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates expected directories', () => {
    scaffoldProject(tmpDir);

    const expected = [
      '.planning/phases',
      'tasks',
      'context',
      '.claude/agents',
      'docs',
    ];

    for (const dir of expected) {
      assert.ok(
        fs.existsSync(path.join(tmpDir, dir)),
        `Directory ${dir} should be created`
      );
    }
  });

  test('creates tasks/lessons.md', () => {
    scaffoldProject(tmpDir);

    const lessonsPath = path.join(tmpDir, 'tasks', 'lessons.md');
    assert.ok(fs.existsSync(lessonsPath), 'tasks/lessons.md should be created');

    const content = fs.readFileSync(lessonsPath, 'utf8');
    assert.ok(content.includes('# Lessons'), 'Should contain Lessons heading');
    assert.ok(content.includes('Seed Rules'), 'Should contain seed rules');
  });
});

// ─── uninstallGovernance ────────────────────────────────────────────────────

describe('uninstallGovernance', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('removes governance CLAUDE.md', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // Create a governance-style CLAUDE.md
    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, '# Global Claude Code Configuration\n\ngsd commands here\n');

    uninstallGovernance(claudeDir);

    assert.ok(!fs.existsSync(claudeMdPath), 'Governance CLAUDE.md should be removed');
  });

  test('does not remove non-governance CLAUDE.md', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // Create a user CLAUDE.md (not governance)
    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, '# My Custom Config\n');

    uninstallGovernance(claudeDir);

    assert.ok(fs.existsSync(claudeMdPath), 'Non-governance CLAUDE.md should be preserved');
  });
});

// ─── copyDirRecursive ───────────────────────────────────────────────────────

describe('copyDirRecursive', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies files and nested directories', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');

    // Create source structure
    fs.mkdirSync(path.join(src, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(src, 'a.txt'), 'file a');
    fs.writeFileSync(path.join(src, 'sub', 'b.txt'), 'file b');

    copyDirRecursive(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'a.txt')), 'a.txt should be copied');
    assert.ok(fs.existsSync(path.join(dest, 'sub', 'b.txt')), 'sub/b.txt should be copied');
    assert.strictEqual(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'file a');
    assert.strictEqual(fs.readFileSync(path.join(dest, 'sub', 'b.txt'), 'utf8'), 'file b');
  });
});

// ─── installGovernancePlugins ─────────────────────────────────────────────────

describe('installGovernancePlugins', () => {
  let srcDir;
  let targetDir;

  beforeEach(() => {
    srcDir = createTempDir('gov-plug-src-');
    targetDir = createTempDir('gov-plug-tgt-');
  });

  afterEach(() => {
    cleanup(srcDir);
    cleanup(targetDir);
  });

  test('copies plugin directories to target', () => {
    // Create source with two plugins
    const pluginA = path.join(srcDir, 'plugins', 'plugin-a');
    const pluginB = path.join(srcDir, 'plugins', 'plugin-b');
    fs.mkdirSync(pluginA, { recursive: true });
    fs.mkdirSync(pluginB, { recursive: true });
    fs.writeFileSync(path.join(pluginA, 'plugin.json'), '{"name":"plugin-a"}');
    fs.writeFileSync(path.join(pluginB, 'plugin.json'), '{"name":"plugin-b"}');

    installGovernancePlugins(targetDir, srcDir);

    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'plugin-a', 'plugin.json')),
      'plugin-a/plugin.json should be copied to target'
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'plugin-b', 'plugin.json')),
      'plugin-b/plugin.json should be copied to target'
    );
  });

  test('missing plugins directory — returns silently', () => {
    // srcDir has no plugins/ subdirectory
    installGovernancePlugins(targetDir, srcDir);

    assert.ok(
      !fs.existsSync(path.join(targetDir, 'plugins')),
      'No plugins/ directory should be created in target when source has none'
    );
  });

  test('nested plugin files copied recursively', () => {
    const pluginDir = path.join(srcDir, 'plugins', 'my-plugin');
    fs.mkdirSync(path.join(pluginDir, 'commands'), { recursive: true });
    fs.mkdirSync(path.join(pluginDir, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'commands', 'cmd.md'), '# Command');
    fs.writeFileSync(path.join(pluginDir, 'skills', 'skill.md'), '# Skill');

    installGovernancePlugins(targetDir, srcDir);

    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'my-plugin', 'commands', 'cmd.md')),
      'Nested commands/cmd.md should be copied'
    );
    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'my-plugin', 'skills', 'skill.md')),
      'Nested skills/skill.md should be copied'
    );
  });

  test('idempotent — second call overwrites cleanly', () => {
    const pluginDir = path.join(srcDir, 'plugins', 'idempotent-plugin');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'plugin.json'), '{"name":"idempotent"}');

    // First call
    installGovernancePlugins(targetDir, srcDir);
    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'idempotent-plugin', 'plugin.json')),
      'plugin.json should exist after first call'
    );

    // Second call — should not throw
    installGovernancePlugins(targetDir, srcDir);
    assert.ok(
      fs.existsSync(path.join(targetDir, 'plugins', 'idempotent-plugin', 'plugin.json')),
      'plugin.json should still exist after second call'
    );

    const content = fs.readFileSync(
      path.join(targetDir, 'plugins', 'idempotent-plugin', 'plugin.json'),
      'utf8'
    );
    assert.strictEqual(content, '{"name":"idempotent"}', 'Content should match source');
  });
});
