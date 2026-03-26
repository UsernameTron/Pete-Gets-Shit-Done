/**
 * GSD Tools Tests - JSON Merge Idempotency (Phase 6b Risk)
 *
 * Focused tests for mergeGovernanceJson idempotency: verifying that
 * repeated merges do not duplicate hooks or permissions.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { mergeGovernanceJson } = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'merge-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('mergeGovernanceJson idempotency', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('first merge adds hooks to empty settings', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    writeJson(settingsPath, {});
    writeJson(govPath, {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo guard' }] },
        ],
        Stop: [
          { hooks: [{ type: 'command', command: 'echo stop-check' }] },
        ],
      },
    });

    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, true, 'First merge should report changes');

    const result = readJson(settingsPath);
    assert.strictEqual(result.hooks.PreToolUse.length, 1);
    assert.strictEqual(result.hooks.Stop.length, 1);
  });

  test('second merge produces no changes (identical content)', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    writeJson(settingsPath, {});
    writeJson(govPath, {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo guard' }] },
        ],
      },
    });

    // First merge
    mergeGovernanceJson(settingsPath, govPath, 'test');
    const contentAfter1 = fs.readFileSync(settingsPath, 'utf8');

    // Second merge
    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, false, 'Second merge should report no changes');

    const contentAfter2 = fs.readFileSync(settingsPath, 'utf8');
    assert.strictEqual(contentAfter2, contentAfter1, 'File should be byte-identical');
  });

  test('merge with pre-existing hooks does not create duplicates', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    // Pre-existing settings with a hook already present
    writeJson(settingsPath, {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo guard' }] },
        ],
      },
    });

    // Governance wants to add the same hook
    writeJson(govPath, {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo guard' }] },
        ],
      },
    });

    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, false, 'Should not change when hook already exists');

    const result = readJson(settingsPath);
    assert.strictEqual(
      result.hooks.PreToolUse.length,
      1,
      'Should still have exactly 1 PreToolUse hook, not 2'
    );
  });

  test('merge with pre-existing permissions is additive only', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    // Pre-existing settings with some permissions
    writeJson(settingsPath, {
      permissions: {
        allow: ['Bash(git *)', 'Read(*)'],
        deny: ['Read(.env)'],
      },
    });

    // Governance adds new permissions but overlaps on some
    writeJson(govPath, {
      permissions: {
        allow: ['Write(*)', 'Read(*)'],  // Read(*) already exists
        deny: ['Read(.env)', 'Read(.env.*)'],  // Read(.env) already exists
      },
    });

    const changed = mergeGovernanceJson(settingsPath, govPath, 'test');
    assert.strictEqual(changed, true, 'Should report changes for new rules');

    const result = readJson(settingsPath);

    // Original permissions preserved
    assert.ok(result.permissions.allow.includes('Bash(git *)'), 'Original allow rule preserved');
    assert.ok(result.permissions.deny.includes('Read(.env)'), 'Original deny rule preserved');

    // New permissions added
    assert.ok(result.permissions.allow.includes('Write(*)'), 'New allow rule added');
    assert.ok(result.permissions.deny.includes('Read(.env.*)'), 'New deny rule added');

    // No duplicates
    const readStarCount = result.permissions.allow.filter(r => r === 'Read(*)').length;
    assert.strictEqual(readStarCount, 1, 'Read(*) should not be duplicated');

    const envCount = result.permissions.deny.filter(r => r === 'Read(.env)').length;
    assert.strictEqual(envCount, 1, 'Read(.env) should not be duplicated');
  });

  test('triple merge remains stable', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    writeJson(settingsPath, {});
    writeJson(govPath, {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'echo scan' }] },
        ],
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo check' }] },
        ],
      },
      permissions: {
        allow: ['Bash(git *)', 'Read(*)'],
      },
    });

    // Three consecutive merges
    mergeGovernanceJson(settingsPath, govPath, 'test');
    mergeGovernanceJson(settingsPath, govPath, 'test');
    const changed3 = mergeGovernanceJson(settingsPath, govPath, 'test');

    assert.strictEqual(changed3, false, 'Third merge should report no changes');

    const result = readJson(settingsPath);
    assert.strictEqual(result.hooks.SessionStart.length, 1, 'SessionStart should have 1 entry');
    assert.strictEqual(result.hooks.PreToolUse.length, 1, 'PreToolUse should have 1 entry');
    assert.strictEqual(result.permissions.allow.length, 2, 'Should have exactly 2 allow rules');
  });
});
