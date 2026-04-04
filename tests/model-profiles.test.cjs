/**
 * Model Profiles Tests
 *
 * Tests for MODEL_PROFILES data structure, VALID_PROFILES list,
 * formatAgentToModelMapAsTable, and getAgentToModelMapForProfile.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  MODEL_PROFILES,
  VALID_PROFILES,
  formatAgentToModelMapAsTable,
  getAgentToModelMapForProfile,
} = require('../get-shit-done/bin/lib/model-profiles.cjs');

// ─── MODEL_PROFILES data integrity ────────────────────────────────────────────

describe('MODEL_PROFILES', () => {
  test('contains all expected GSD agents', () => {
    const expectedAgents = [
      'gsd-planner', 'gsd-roadmapper', 'gsd-executor',
      'gsd-phase-researcher', 'gsd-project-researcher', 'gsd-research-synthesizer',
      'gsd-debugger', 'gsd-codebase-mapper', 'gsd-verifier',
      'gsd-plan-checker', 'gsd-integration-checker', 'gsd-nyquist-auditor',
      'gsd-ui-researcher', 'gsd-ui-checker', 'gsd-ui-auditor',
    ];
    for (const agent of expectedAgents) {
      assert.ok(MODEL_PROFILES[agent], `Missing agent: ${agent}`);
    }
  });

  test('every agent has quality, balanced, and budget profiles', () => {
    for (const [agent, profiles] of Object.entries(MODEL_PROFILES)) {
      assert.ok(profiles.quality, `${agent} missing quality profile`);
      assert.ok(profiles.balanced, `${agent} missing balanced profile`);
      assert.ok(profiles.budget, `${agent} missing budget profile`);
    }
  });

  test('all profile values are valid model aliases', () => {
    const validModels = ['opus', 'sonnet', 'haiku'];
    for (const [agent, profiles] of Object.entries(MODEL_PROFILES)) {
      for (const [profile, model] of Object.entries(profiles)) {
        assert.ok(
          validModels.includes(model),
          `${agent}.${profile} has invalid model "${model}" — expected one of ${validModels.join(', ')}`
        );
      }
    }
  });

  test('quality profile never uses haiku', () => {
    for (const [agent, profiles] of Object.entries(MODEL_PROFILES)) {
      assert.notStrictEqual(
        profiles.quality, 'haiku',
        `${agent} quality profile should not use haiku`
      );
    }
  });
});

// ─── VALID_PROFILES ───────────────────────────────────────────────────────────

describe('VALID_PROFILES', () => {
  test('contains quality, balanced, and budget', () => {
    assert.deepStrictEqual(VALID_PROFILES.sort(), ['balanced', 'budget', 'quality']);
  });

  test('is derived from MODEL_PROFILES keys', () => {
    const fromData = Object.keys(MODEL_PROFILES['gsd-planner']);
    assert.deepStrictEqual(VALID_PROFILES.sort(), fromData.sort());
  });
});

// ─── getAgentToModelMapForProfile ─────────────────────────────────────────────

describe('getAgentToModelMapForProfile', () => {
  test('returns correct models for balanced profile', () => {
    const map = getAgentToModelMapForProfile('balanced');
    assert.strictEqual(map['gsd-planner'], 'opus');
    assert.strictEqual(map['gsd-codebase-mapper'], 'haiku');
    assert.strictEqual(map['gsd-verifier'], 'sonnet');
  });

  test('returns correct models for budget profile', () => {
    const map = getAgentToModelMapForProfile('budget');
    assert.strictEqual(map['gsd-planner'], 'sonnet');
    assert.strictEqual(map['gsd-phase-researcher'], 'haiku');
  });

  test('returns correct models for quality profile', () => {
    const map = getAgentToModelMapForProfile('quality');
    assert.strictEqual(map['gsd-planner'], 'opus');
    assert.strictEqual(map['gsd-executor'], 'opus');
  });

  test('returns all agents in the map', () => {
    const map = getAgentToModelMapForProfile('balanced');
    const agentCount = Object.keys(MODEL_PROFILES).length;
    assert.strictEqual(Object.keys(map).length, agentCount);
  });
});

// ─── formatAgentToModelMapAsTable ─────────────────────────────────────────────

describe('formatAgentToModelMapAsTable', () => {
  test('produces a table with header and separator', () => {
    const map = { 'gsd-planner': 'opus', 'gsd-executor': 'sonnet' };
    const table = formatAgentToModelMapAsTable(map);
    assert.ok(table.includes('Agent'), 'should have Agent header');
    assert.ok(table.includes('Model'), 'should have Model header');
    assert.ok(table.includes('─'), 'should have separator line');
    assert.ok(table.includes('gsd-planner'), 'should list agent');
    assert.ok(table.includes('opus'), 'should list model');
  });

  test('pads columns correctly', () => {
    const map = { 'a': 'opus', 'very-long-agent-name': 'haiku' };
    const table = formatAgentToModelMapAsTable(map);
    const lines = table.split('\n').filter(l => l.trim());
    // Separator line uses ┼, data/header lines use │
    const dataLines = lines.filter(l => l.includes('│'));
    const pipePositions = dataLines.map(l => l.indexOf('│'));
    const unique = [...new Set(pipePositions)];
    assert.strictEqual(unique.length, 1, 'all data lines should align on │');
  });

  test('handles empty map', () => {
    const table = formatAgentToModelMapAsTable({});
    assert.ok(table.includes('Agent'), 'should still have header');
  });
});

// --- Lazy initialization ---------------------------------------------------------

describe('lazy initialization', () => {
  // Helper: get a fresh copy of the module by clearing require cache
  function freshRequire() {
    const modPath = require.resolve('../get-shit-done/bin/lib/model-profiles.cjs');
    delete require.cache[modPath];
    return require(modPath);
  }

  test('requiring module does not trigger initialization', () => {
    const mod = freshRequire();
    assert.strictEqual(mod._getInitCount(), 0,
      'init should not run on require()');
  });

  test('accessing MODEL_PROFILES triggers initialization', () => {
    const mod = freshRequire();
    const profiles = mod.MODEL_PROFILES;
    assert.strictEqual(mod._getInitCount(), 1,
      'init should run exactly once on first access');
    assert.ok(profiles['gsd-planner'], 'should contain gsd-planner');
    assert.ok(profiles['gsd-planner'].quality, 'should have quality profile');
  });

  test('accessing VALID_PROFILES triggers initialization and returns correct values', () => {
    const mod = freshRequire();
    const valid = mod.VALID_PROFILES;
    assert.ok(mod._getInitCount() >= 1, 'init should have run');
    assert.deepStrictEqual([...valid].sort(), ['balanced', 'budget', 'quality']);
  });

  test('repeat MODEL_PROFILES access returns cached reference', () => {
    const mod = freshRequire();
    const first = mod.MODEL_PROFILES;
    const second = mod.MODEL_PROFILES;
    assert.strictEqual(first, second,
      'should return same object reference on repeat access');
    assert.strictEqual(mod._getInitCount(), 1,
      'init should run only once despite two accesses');
  });

  test('getAgentToModelMapForProfile works after lazy init', () => {
    const mod = freshRequire();
    const map = mod.getAgentToModelMapForProfile('balanced');
    assert.strictEqual(map['gsd-planner'], 'opus');
    assert.strictEqual(map['gsd-verifier'], 'sonnet');
  });

  test('formatAgentToModelMapAsTable works after lazy init', () => {
    const mod = freshRequire();
    const table = mod.formatAgentToModelMapAsTable({ 'gsd-test': 'opus' });
    assert.ok(table.includes('Agent'), 'should have Agent header');
    assert.ok(table.includes('Model'), 'should have Model header');
  });
});
