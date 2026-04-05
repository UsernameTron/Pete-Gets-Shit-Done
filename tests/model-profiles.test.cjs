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
  MODEL_TIERS,
  dynamicSelect,
  formatAgentToModelMapAsTable,
  getAgentToModelMapForProfile,
} = require('../get-shit-done/bin/lib/model-profiles.cjs');

// ─── MODEL_PROFILES data integrity ────────────────────────────────────────────

describe('MODEL_PROFILES', () => {
  test('contains all expected GSD agents', () => {
    const expectedAgents = [
      'gsd-planner', 'gsd-roadmapper', 'gsd-executor',
      'gsd-research-orchestrator', 'gsd-research-synthesizer',
      'gsd-debugger', 'gsd-codebase-mapper', 'gsd-verifier',
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
    assert.strictEqual(map['gsd-research-orchestrator'], 'haiku');
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

// ─── MODEL_TIERS ─────────────────────────────────────────────────────────────

describe('MODEL_TIERS', () => {
  test('contains all 4 complexity keys', () => {
    const expectedKeys = ['trivial', 'standard', 'complex', 'critical'];
    for (const key of expectedKeys) {
      assert.ok(key in MODEL_TIERS, `Missing key: ${key}`);
    }
    assert.strictEqual(Object.keys(MODEL_TIERS).length, 4, 'should have exactly 4 keys');
  });

  test('maps to valid profile names', () => {
    const validTiers = ['budget', 'balanced', 'quality'];
    for (const [key, tier] of Object.entries(MODEL_TIERS)) {
      assert.ok(
        validTiers.includes(tier),
        `${key} maps to invalid tier "${tier}" — expected one of ${validTiers.join(', ')}`
      );
    }
  });

  test('is frozen', () => {
    assert.ok(Object.isFrozen(MODEL_TIERS), 'MODEL_TIERS should be frozen');
  });

  test('critical maps to same tier as complex', () => {
    assert.strictEqual(MODEL_TIERS.critical, MODEL_TIERS.complex,
      'critical and complex should both map to quality');
  });
});

// ─── dynamicSelect() ─────────────────────────────────────────────────────────

describe('dynamicSelect()', () => {
  const balancedConfig = { model_profile: 'balanced' };
  const qualityConfig = { model_profile: 'quality' };
  const budgetConfig = { model_profile: 'budget' };

  test('trivial complexity + balanced profile returns budget tier', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'trivial' }, balancedConfig);
    assert.strictEqual(result.tier, 'budget');
    assert.strictEqual(result.alias, 'sonnet'); // gsd-executor budget = sonnet
  });

  test('standard complexity + balanced profile returns balanced tier', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'standard' }, balancedConfig);
    assert.strictEqual(result.tier, 'balanced');
    assert.strictEqual(result.alias, 'sonnet'); // gsd-executor balanced = sonnet
  });

  test('complex complexity + balanced profile returns quality tier', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'complex' }, balancedConfig);
    assert.strictEqual(result.tier, 'quality');
    assert.strictEqual(result.alias, 'opus'); // gsd-executor quality = opus
  });

  test('critical complexity + balanced profile returns quality tier', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'critical' }, balancedConfig);
    assert.strictEqual(result.tier, 'quality');
    assert.strictEqual(result.alias, 'opus');
  });

  test('quality profile never downgrades — trivial stays at quality', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'trivial' }, qualityConfig);
    assert.strictEqual(result.tier, 'quality');
    assert.strictEqual(result.alias, 'opus'); // gsd-executor quality = opus
  });

  test('budget profile caps at balanced — complex does not reach quality', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'complex' }, budgetConfig);
    assert.strictEqual(result.tier, 'balanced');
    assert.strictEqual(result.alias, 'sonnet'); // gsd-executor balanced = sonnet
  });

  test('unknown agent returns default sonnet', () => {
    const result = dynamicSelect('nonexistent-agent', { complexity: 'complex' }, balancedConfig);
    assert.strictEqual(result.alias, 'sonnet');
    assert.strictEqual(result.tier, 'balanced');
    assert.ok(result.rationale.includes('unknown agent'), 'rationale should mention unknown agent');
  });

  test('null taskContext defaults to standard complexity', () => {
    const result = dynamicSelect('gsd-executor', null, balancedConfig);
    assert.strictEqual(result.tier, 'balanced'); // standard -> balanced
    assert.strictEqual(result.alias, 'sonnet');
  });

  test('undefined taskContext defaults to standard complexity', () => {
    const result = dynamicSelect('gsd-executor', undefined, balancedConfig);
    assert.strictEqual(result.tier, 'balanced');
  });

  test('missing complexity field defaults to standard', () => {
    const result = dynamicSelect('gsd-executor', {}, balancedConfig);
    assert.strictEqual(result.tier, 'balanced'); // standard -> balanced
  });

  test('return shape has alias, tier, and rationale as strings', () => {
    const result = dynamicSelect('gsd-planner', { complexity: 'complex' }, balancedConfig);
    assert.strictEqual(typeof result.alias, 'string');
    assert.strictEqual(typeof result.tier, 'string');
    assert.strictEqual(typeof result.rationale, 'string');
    assert.ok(result.rationale.includes('complexity='), 'rationale should include complexity');
    assert.ok(result.rationale.includes('profile='), 'rationale should include profile');
  });

  test('rationale includes all decision factors', () => {
    const result = dynamicSelect('gsd-verifier', { complexity: 'trivial' }, budgetConfig);
    assert.ok(result.rationale.includes('complexity=trivial'));
    assert.ok(result.rationale.includes('targetTier=budget'));
    assert.ok(result.rationale.includes('effectiveTier='));
    assert.ok(result.rationale.includes('profile=budget'));
  });

  test('config without model_profile defaults to balanced', () => {
    const result = dynamicSelect('gsd-executor', { complexity: 'complex' }, {});
    assert.strictEqual(result.tier, 'quality'); // complex -> quality, no profile override
    assert.ok(result.rationale.includes('profile=balanced'));
  });

  // ── History-based promotion (INTEL-16) ──────────────────────────────────

  test('promotes to quality when agent_tier_mismatch pattern exists', () => {
    const taskContext = {
      complexity: 'standard',
      historyHints: {
        failureRate: 0.6,
        patterns: [
          { type: 'agent_tier_mismatch', agent: 'gsd-executor', recommended_tier: 'quality', evidence: '60% fail on budget' },
        ],
        summary: null,
      },
    };
    const result = dynamicSelect('gsd-executor', taskContext, balancedConfig);
    assert.strictEqual(result.tier, 'quality');
    assert.strictEqual(result.alias, 'opus'); // gsd-executor quality = opus
  });

  test('promotes budget to balanced when phase has high failure rate', () => {
    const taskContext = {
      complexity: 'trivial',
      historyHints: {
        failureRate: 0.5,
        patterns: [
          { type: 'failing_phase', phase: 5, failure_rate: 0.5, executions: 10 },
        ],
        summary: null,
      },
    };
    const result = dynamicSelect('gsd-codebase-mapper', taskContext, budgetConfig);
    // trivial -> budget tier, but phase failure promotes budget -> balanced
    assert.strictEqual(result.tier, 'balanced');
  });

  test('rationale includes history-promoted annotation', () => {
    const taskContext = {
      complexity: 'standard',
      historyHints: {
        failureRate: 0.4,
        patterns: [
          { type: 'agent_tier_mismatch', agent: 'gsd-planner', recommended_tier: 'quality', evidence: '70% fail on budget' },
        ],
        summary: null,
      },
    };
    const result = dynamicSelect('gsd-planner', taskContext, balancedConfig);
    assert.ok(result.rationale.includes('history-promoted=true'));
    assert.ok(result.rationale.includes('70% fail on budget'));
  });

  test('with no historyHints produces same result as before', () => {
    const withHints = dynamicSelect('gsd-executor', { complexity: 'standard' }, balancedConfig);
    const without = dynamicSelect('gsd-executor', { complexity: 'standard', historyHints: undefined }, balancedConfig);
    assert.strictEqual(withHints.tier, without.tier);
    assert.strictEqual(withHints.alias, without.alias);
  });

  test('does not promote when already at quality tier', () => {
    const taskContext = {
      complexity: 'critical',
      historyHints: {
        failureRate: 0.8,
        patterns: [
          { type: 'agent_tier_mismatch', agent: 'gsd-executor', recommended_tier: 'quality', evidence: '80% fail on budget' },
        ],
        summary: null,
      },
    };
    // quality config forces quality tier — already at max, no promotion should happen
    const result = dynamicSelect('gsd-executor', taskContext, qualityConfig);
    assert.strictEqual(result.tier, 'quality');
    assert.ok(!result.rationale.includes('history-promoted'), 'should not promote when already quality');
  });

  test('with empty patterns array does not promote', () => {
    const taskContext = {
      complexity: 'trivial',
      historyHints: {
        failureRate: 0.1,
        patterns: [],
        summary: null,
      },
    };
    const result = dynamicSelect('gsd-codebase-mapper', taskContext, budgetConfig);
    assert.strictEqual(result.tier, 'budget');
    assert.ok(!result.rationale.includes('history-promoted'));
    assert.ok(!result.rationale.includes('phase-promoted'));
  });
});
