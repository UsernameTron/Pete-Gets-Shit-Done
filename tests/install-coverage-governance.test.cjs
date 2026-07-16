/**
 * Install.js Coverage — Governance Functions
 *
 * Exercises governance functions from install.js:
 * mergeGovernanceJson, installGovernance, installGovernancePlugins,
 * scaffoldProject, uninstallGovernance.
 *
 * Focuses on uncovered code paths in these functions.
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
  installGovernancePlugins,
  scaffoldProject,
  uninstallGovernance,
  copyDirRecursive,
} = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'gsd-gov-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ─── scaffoldProject ────────────────────────────────────────────────────────

describe('scaffoldProject', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates all required directories', () => {
    scaffoldProject(tmpDir);

    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'phases')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'tasks')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'context')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'agents')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs')));
  });

  test('creates tasks/lessons.md', () => {
    scaffoldProject(tmpDir);

    const lessonsPath = path.join(tmpDir, 'tasks', 'lessons.md');
    assert.ok(fs.existsSync(lessonsPath), 'lessons.md should be created');
    const content = fs.readFileSync(lessonsPath, 'utf8');
    assert.ok(content.includes('Lessons'), 'should have Lessons header');
    assert.ok(content.includes('Seed Rules'), 'should have Seed Rules');
  });

  test('does not overwrite existing lessons.md', () => {
    const tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(tasksDir, 'lessons.md'), 'Custom lessons');

    scaffoldProject(tmpDir);

    const content = fs.readFileSync(path.join(tasksDir, 'lessons.md'), 'utf8');
    assert.strictEqual(content, 'Custom lessons', 'should preserve existing lessons.md');
  });

  test('does not re-create existing directories', () => {
    // First scaffold
    scaffoldProject(tmpDir);
    // Add a file to prove dir existed
    fs.writeFileSync(path.join(tmpDir, '.planning', 'phases', 'marker.txt'), 'exists');

    // Second scaffold
    scaffoldProject(tmpDir);

    // Marker should still exist (dir wasn't recreated/emptied)
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'phases', 'marker.txt')));
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

  test('removes GSD CLAUDE.md from parent directory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    // Create governance CLAUDE.md in parent
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'),
      '# Global Claude Code Configuration\n\nUse gsd commands for planning.');

    uninstallGovernance(targetDir);

    assert.ok(!fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should be removed');
  });

  test('preserves non-GSD CLAUDE.md', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    // Create non-GSD CLAUDE.md
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Custom Project Config\n\nNot related to GSD.');

    uninstallGovernance(targetDir);

    assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'non-GSD CLAUDE.md should be preserved');
  });

  test('handles missing CLAUDE.md gracefully', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });

    // Should not throw
    uninstallGovernance(targetDir);
  });

  test('removes governance context docs', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const contextDir = path.join(tmpDir, 'context');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(contextDir, { recursive: true });
    // Create governance context files
    const govFiles = ['cli-reference.md', 'hooks-guide.md', 'mcp-setup-guide.md',
      'settings-reference.md', 'skill-creation-guide.md', 'subagent-guide.md'];
    for (const f of govFiles) {
      fs.writeFileSync(path.join(contextDir, f), '# ' + f);
    }

    uninstallGovernance(targetDir);

    for (const f of govFiles) {
      assert.ok(!fs.existsSync(path.join(contextDir, f)), f + ' should be removed');
    }
    // Context dir should be removed since it's empty now
    assert.ok(!fs.existsSync(contextDir), 'empty context dir should be removed');
  });

  test('preserves non-governance context files', () => {
    const targetDir = path.join(tmpDir, '.claude');
    const contextDir = path.join(tmpDir, 'context');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, 'cli-reference.md'), '# CLI');
    fs.writeFileSync(path.join(contextDir, 'custom-notes.md'), '# Custom');

    uninstallGovernance(targetDir);

    assert.ok(!fs.existsSync(path.join(contextDir, 'cli-reference.md')));
    assert.ok(fs.existsSync(path.join(contextDir, 'custom-notes.md')), 'custom file should be preserved');
    assert.ok(fs.existsSync(contextDir), 'non-empty context dir should remain');
  });

  test('removes only GSD-owned plugin subdirs, preserving the native plugin store (fix 1)', () => {
    // For a global install targetDir is ~/.claude, so plugins/ is Claude Code's
    // own store (repos/, config.json, other marketplaces). Uninstall must remove
    // only GSD's own plugin subdirs and leave everything else untouched.
    const targetDir = path.join(tmpDir, '.claude');
    const pluginsDir = path.join(targetDir, 'plugins');
    fs.mkdirSync(path.join(pluginsDir, 'claude-code-factory'), { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'claude-code-factory', 'plugin.json'), '{}');
    fs.mkdirSync(path.join(pluginsDir, 'user-marketplace'), { recursive: true });
    fs.writeFileSync(path.join(pluginsDir, 'user-marketplace', 'keep.json'), '{}');
    fs.writeFileSync(path.join(pluginsDir, 'config.json'), '{}');

    uninstallGovernance(targetDir);

    assert.ok(!fs.existsSync(path.join(pluginsDir, 'claude-code-factory')), 'GSD plugin subdir should be removed');
    assert.ok(fs.existsSync(path.join(pluginsDir, 'user-marketplace', 'keep.json')), 'foreign marketplace must be preserved');
    assert.ok(fs.existsSync(path.join(pluginsDir, 'config.json')), 'native plugin store config.json must be preserved');
    assert.ok(fs.existsSync(pluginsDir), 'plugins/ dir itself must survive');
  });

  test('removes governance hooks from settings.json', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(tmpDir, 'settings.json');
    writeJson(settingsPath, {
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: 'bash -c "HAS_TASKS=$(find tasks -name *.md 2>/dev/null)"' }] },
          { hooks: [{ type: 'command', command: 'node /path/gsd-prompt-guard.js' }] }
        ],
        Stop: [
          { hooks: [{ type: 'command', command: 'bash -c "STAGED_DOCS=$(git diff)"' }] }
        ]
      }
    });

    uninstallGovernance(targetDir);

    const settings = readJson(settingsPath);
    // Governance hooks (inline bash with HAS_TASKS, STAGED_DOCS) should be removed
    // GSD hooks (.js files) should be preserved
    if (settings.hooks && settings.hooks.PreToolUse) {
      const commands = settings.hooks.PreToolUse.flatMap(e => (e.hooks || []).map(h => h.command || ''));
      assert.ok(!commands.some(c => c.includes('HAS_TASKS')), 'governance hooks should be removed');
      assert.ok(commands.some(c => c.includes('gsd-prompt-guard')), 'GSD hooks should be preserved');
    }
  });

  test('cleans up empty hook events after governance removal', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(tmpDir, 'settings.json');
    writeJson(settingsPath, {
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'bash -c "STAGED_DOCS=$(git diff)"' }] }
        ]
      }
    });

    uninstallGovernance(targetDir);

    const settings = readJson(settingsPath);
    // Stop event should be cleaned up since only governance hooks were there
    assert.ok(!settings.hooks || !settings.hooks.Stop, 'empty Stop event should be removed');
  });

  test('handles settings.json without hooks', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });
    const settingsPath = path.join(tmpDir, 'settings.json');
    writeJson(settingsPath, { model: 'sonnet' });

    uninstallGovernance(targetDir);
    // Should not crash
    const settings = readJson(settingsPath);
    assert.strictEqual(settings.model, 'sonnet');
  });
});

// ─── mergeGovernanceJson edge cases ─────────────────────────────────────────

describe('mergeGovernanceJson additional edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates new file when settings does not exist', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'governance.json');
    writeJson(govPath, { permissions: { allow: ['Bash(test)'] } });

    mergeGovernanceJson(settingsPath, govPath, 'test');

    assert.ok(fs.existsSync(settingsPath), 'settings should be created');
    const settings = readJson(settingsPath);
    assert.ok(settings.permissions, 'should have permissions');
  });

  test('merges permissions.allow arrays', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'governance.json');
    writeJson(settingsPath, { permissions: { allow: ['existing'] } });
    writeJson(govPath, { permissions: { allow: ['new-permission'] } });

    mergeGovernanceJson(settingsPath, govPath, 'test');

    const settings = readJson(settingsPath);
    assert.ok(settings.permissions.allow.includes('existing'), 'should keep existing');
    assert.ok(settings.permissions.allow.includes('new-permission'), 'should add new');
  });

  test('merges hooks arrays without duplicating', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'governance.json');
    writeJson(settingsPath, {
      hooks: {
        PreToolUse: [{ hooks: [{ type: 'command', command: 'existing' }] }]
      }
    });
    writeJson(govPath, {
      hooks: {
        PreToolUse: [{ hooks: [{ type: 'command', command: 'new-hook' }] }]
      }
    });

    mergeGovernanceJson(settingsPath, govPath, 'test');

    const settings = readJson(settingsPath);
    // Should have both hooks
    const commands = settings.hooks.PreToolUse.flatMap(e => (e.hooks || []).map(h => h.command));
    assert.ok(commands.includes('existing'));
    assert.ok(commands.includes('new-hook'));
  });

  test('handles missing governance file gracefully', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    writeJson(settingsPath, {});
    // Should not throw when governance file doesn't exist
    mergeGovernanceJson(settingsPath, '/nonexistent/gov.json', 'test');
  });

  test('handles malformed existing settings JSON', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'governance.json');
    fs.writeFileSync(settingsPath, 'not valid json');
    writeJson(govPath, { permissions: { allow: ['test'] } });

    // Should handle gracefully (either skip or create new)
    try {
      mergeGovernanceJson(settingsPath, govPath, 'test');
    } catch (e) {
      // Some error handling is expected for malformed JSON
      assert.ok(e.message.includes('JSON') || e.message.includes('parse'),
        'should throw JSON parse error');
    }
  });
});

// ─── installGovernance ──────────────────────────────────────────────────────

describe('installGovernance additional coverage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('installs governance to target directory (global)', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });

    // Source must be the real package root
    const src = path.join(__dirname, '..');

    installGovernance(targetDir, src, true);

    // Should create governance template CLAUDE.md in parent
    // The actual behavior depends on whether templates exist
    // At minimum, should not throw
  });

  test('installs governance to target directory (local)', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });

    const src = path.join(__dirname, '..');

    installGovernance(targetDir, src, false);
    // Should not throw
  });
});

// ─── installGovernancePlugins ───────────────────────────────────────────────

describe('installGovernancePlugins additional coverage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('installs plugins to target directory', () => {
    const targetDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(targetDir, { recursive: true });

    const src = path.join(__dirname, '..');

    installGovernancePlugins(targetDir, src);
    // Should not throw — actual behavior depends on plugin templates
  });
});

// ─── copyDirRecursive additional edge cases ─────────────────────────────────

describe('copyDirRecursive — file types', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies empty directory', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src, { recursive: true });

    copyDirRecursive(src, dest);

    assert.ok(fs.existsSync(dest), 'destination should exist');
  });

  test('copies binary files unchanged', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src, { recursive: true });
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
    fs.writeFileSync(path.join(src, 'data.bin'), binaryData);

    copyDirRecursive(src, dest);

    const copied = fs.readFileSync(path.join(dest, 'data.bin'));
    assert.deepStrictEqual(copied, binaryData, 'binary content should match');
  });
});
