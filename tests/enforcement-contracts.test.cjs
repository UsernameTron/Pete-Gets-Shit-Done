/**
 * GSD Enforcement Contract Tests
 *
 * Tests for the three KB patterns codified as enforcement contracts:
 * 1. Write-Once Registration — duplicate hooks are no-ops with warnings
 * 2. Feature Flag Security Perimeter — --no-governance prints advisory
 * 3. Type Name Governance — gsd- prefix collision detection
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  isHookRegistered,
  validateGsdPrefixAgents,
  mergeGovernanceJson,
} = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'enforce-test-') {
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

// ─── Pattern 1: Write-Once Registration ─────────────────────────────────────

describe('Pattern 1: Write-Once Registration', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanup(tmpDir); });

  test('isHookRegistered returns false for empty settings', () => {
    assert.strictEqual(isHookRegistered({}, 'PreToolUse', '/path/to/hook'), false);
  });

  test('isHookRegistered returns false when event has no matching command', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: '/path/to/other-hook' }] },
        ],
      },
    };
    assert.strictEqual(isHookRegistered(settings, 'PreToolUse', '/path/to/hook'), false);
  });

  test('isHookRegistered returns true for exact command match', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: '/path/to/hook' }] },
        ],
      },
    };
    assert.strictEqual(isHookRegistered(settings, 'PreToolUse', '/path/to/hook'), true);
  });

  test('isHookRegistered does not match substrings', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: '/path/to/hook-extended' }] },
        ],
      },
    };
    assert.strictEqual(isHookRegistered(settings, 'PreToolUse', '/path/to/hook'), false);
  });

  test('mergeGovernanceJson skips duplicate hooks on second merge', () => {
    const settingsPath = path.join(tmpDir, 'settings.json');
    const govPath = path.join(tmpDir, 'gov.json');

    writeJson(settingsPath, {});
    writeJson(govPath, {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: '/gsd/workflow-guard.cjs' }] },
        ],
      },
    });

    // First merge — should add
    mergeGovernanceJson(settingsPath, govPath, 'test');
    const after1 = readJson(settingsPath);
    assert.strictEqual(after1.hooks.PreToolUse.length, 1);

    // Second merge — should skip (write-once)
    mergeGovernanceJson(settingsPath, govPath, 'test');
    const after2 = readJson(settingsPath);
    assert.strictEqual(after2.hooks.PreToolUse.length, 1, 'Second merge should not duplicate hooks');
  });
});

// ─── Pattern 3: Type Name Governance ────────────────────────────────────────

describe('Pattern 3: Type Name (gsd- Prefix) Validation', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanup(tmpDir); });

  test('no warning when all gsd- agents are from source', () => {
    const source = path.join(tmpDir, 'source');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(target, { recursive: true });

    fs.writeFileSync(path.join(source, 'gsd-planner.md'), '# planner');
    fs.writeFileSync(path.join(target, 'gsd-planner.md'), '# planner');

    // Should not throw or warn — we capture console.log to verify
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      validateGsdPrefixAgents(target, source);
    } finally {
      console.log = origLog;
    }

    const warnings = logs.filter(l => l.includes('Prefix collision'));
    assert.strictEqual(warnings.length, 0, 'No warnings expected for legitimate GSD agents');
  });

  test('warns on gsd- prefix collision from non-GSD agent', () => {
    const source = path.join(tmpDir, 'source');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(target, { recursive: true });

    fs.writeFileSync(path.join(source, 'gsd-planner.md'), '# planner');
    // Rogue agent in target not from source
    fs.writeFileSync(path.join(target, 'gsd-planner.md'), '# planner');
    fs.writeFileSync(path.join(target, 'gsd-rogue-agent.md'), '# rogue');

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      validateGsdPrefixAgents(target, source);
    } finally {
      console.log = origLog;
    }

    const warnings = logs.filter(l => l.includes('Prefix collision'));
    assert.strictEqual(warnings.length, 1, 'Should warn about gsd-rogue-agent.md');
    assert.ok(warnings[0].includes('gsd-rogue-agent.md'));
  });

  test('ignores non-gsd prefixed agents in target', () => {
    const source = path.join(tmpDir, 'source');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(source, { recursive: true });
    fs.mkdirSync(target, { recursive: true });

    fs.writeFileSync(path.join(source, 'gsd-planner.md'), '# planner');
    fs.writeFileSync(path.join(target, 'custom-agent.md'), '# custom');

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      validateGsdPrefixAgents(target, source);
    } finally {
      console.log = origLog;
    }

    const warnings = logs.filter(l => l.includes('Prefix collision'));
    assert.strictEqual(warnings.length, 0, 'Non-gsd agents should not trigger warnings');
  });

  test('handles missing directories gracefully', () => {
    // Should not throw
    validateGsdPrefixAgents('/nonexistent/target', '/nonexistent/source');
  });
});
