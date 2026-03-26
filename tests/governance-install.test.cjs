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

  test('copies CLAUDE.md and context docs', () => {
    // installGovernance expects targetDir to be .claude dir, with CLAUDE.md going to parent
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    installGovernance(claudeDir, REPO_ROOT, true);

    // CLAUDE.md should be in tmpDir (parent of .claude)
    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    assert.ok(fs.existsSync(claudeMdPath), 'CLAUDE.md should be installed');

    // Context docs should be in tmpDir/context/
    const contextDir = path.join(tmpDir, 'context');
    assert.ok(fs.existsSync(contextDir), 'context/ directory should exist');
    assert.ok(fs.existsSync(path.join(contextDir, 'cli-reference.md')), 'cli-reference.md should be copied');
  });

  test('backs up existing CLAUDE.md', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    // Create an existing CLAUDE.md
    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, '# Original content');

    installGovernance(claudeDir, REPO_ROOT, true);

    // The backup should exist
    const files = fs.readdirSync(tmpDir);
    const backups = files.filter(f => f.startsWith('CLAUDE.md.backup.'));
    assert.ok(backups.length >= 1, 'At least one backup should be created');

    // The new CLAUDE.md should be the governance version
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    assert.ok(content.includes('Global Claude Code Configuration'), 'Should install governance CLAUDE.md');
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
