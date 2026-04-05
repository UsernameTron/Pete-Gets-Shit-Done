/**
 * Task Classification Tests
 *
 * Tests for COMPLEXITY_LEVELS, PHASE_TYPE_KEYWORDS, extractSignals,
 * classifyTask, and adaptWorkflowGates.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  COMPLEXITY_LEVELS,
  PHASE_TYPE_KEYWORDS,
  extractSignals,
  classifyTask,
  adaptWorkflowGates,
} = require('../get-shit-done/bin/lib/classify.cjs');

// ─── COMPLEXITY_LEVELS ───────────────────────────────────────────────────────

describe('COMPLEXITY_LEVELS', () => {
  test('exports all 4 levels with correct string values', () => {
    assert.strictEqual(COMPLEXITY_LEVELS.TRIVIAL, 'trivial');
    assert.strictEqual(COMPLEXITY_LEVELS.STANDARD, 'standard');
    assert.strictEqual(COMPLEXITY_LEVELS.COMPLEX, 'complex');
    assert.strictEqual(COMPLEXITY_LEVELS.CRITICAL, 'critical');
    assert.strictEqual(Object.keys(COMPLEXITY_LEVELS).length, 4);
  });

  test('object is frozen', () => {
    assert.ok(Object.isFrozen(COMPLEXITY_LEVELS), 'COMPLEXITY_LEVELS should be frozen');
  });
});

// ─── PHASE_TYPE_KEYWORDS ─────────────────────────────────────────────────────

describe('PHASE_TYPE_KEYWORDS', () => {
  test('exports expected keyword mappings', () => {
    assert.strictEqual(PHASE_TYPE_KEYWORDS.research, 'research');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.plan, 'planning');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.execute, 'execution');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.verify, 'verification');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.test, 'verification');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.document, 'documentation');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.integration, 'integration');
    assert.strictEqual(PHASE_TYPE_KEYWORDS.cleanup, 'maintenance');
    assert.strictEqual(Object.keys(PHASE_TYPE_KEYWORDS).length, 8);
  });

  test('object is frozen', () => {
    assert.ok(Object.isFrozen(PHASE_TYPE_KEYWORDS), 'PHASE_TYPE_KEYWORDS should be frozen');
  });
});

// ─── extractSignals ──────────────────────────────────────────────────────────

describe('extractSignals', () => {
  test('returns all 6 fields with null/undefined inputs (safe defaults)', () => {
    const signals = extractSignals(null, null, null);
    assert.strictEqual(signals.file_count, 0);
    assert.strictEqual(signals.requirement_count, 0);
    assert.strictEqual(signals.phase_type, 'execution');
    assert.strictEqual(signals.dependency_depth, 0);
    assert.strictEqual(signals.historical_failure_rate, null);
    assert.strictEqual(signals.plan_count, 0);
  });

  test('extracts file_count from planInventory with files_to_modify', () => {
    const plans = [
      { files_to_modify: ['a.cjs', 'b.cjs'] },
      { files_to_modify: ['c.cjs'] },
    ];
    const signals = extractSignals(null, plans, null);
    assert.strictEqual(signals.file_count, 3);
    assert.strictEqual(signals.plan_count, 2);
  });

  test('extracts requirement_count from comma-separated reqIds string', () => {
    const signals = extractSignals(null, [], { reqIds: 'INTEL-07, INTEL-08, INTEL-09' });
    assert.strictEqual(signals.requirement_count, 3);
  });

  test('detects phase_type from phase name keywords', () => {
    const signals = extractSignals({ name: 'Research & Analysis' }, [], null);
    assert.strictEqual(signals.phase_type, 'research');
  });

  test('counts dependency_depth from plans with depends_on arrays', () => {
    const plans = [
      { depends_on: ['plan-1'] },
      { depends_on: [] },
      { depends_on: ['plan-2', 'plan-3'] },
    ];
    const signals = extractSignals(null, plans, null);
    assert.strictEqual(signals.dependency_depth, 2);
  });

  test('passes through historical_failure_rate from context', () => {
    const signals = extractSignals(null, [], { failureRate: 0.35 });
    assert.strictEqual(signals.historical_failure_rate, 0.35);
  });

  test('default phase_type is execution when no keywords match', () => {
    const signals = extractSignals({ name: 'Build Amazing Widget' }, [], null);
    assert.strictEqual(signals.phase_type, 'execution');
  });
});

// ─── classifyTask ────────────────────────────────────────────────────────────

describe('classifyTask', () => {
  test('trivial: 1 plan, 1 requirement', () => {
    const result = classifyTask(
      { name: 'Documentation update' },
      [{ files_to_modify: ['readme.md'] }],
      { reqIds: 'DOC-01' }
    );
    assert.strictEqual(result.complexity, 'trivial');
  });

  test('standard: 3 plans, 4 requirements', () => {
    const result = classifyTask(
      { name: 'Execute feature build' },
      [
        { files_to_modify: ['a.cjs', 'b.cjs'] },
        { files_to_modify: ['c.cjs'] },
        { files_to_modify: ['d.cjs'] },
      ],
      { reqIds: 'REQ-01, REQ-02, REQ-03, REQ-04' }
    );
    assert.strictEqual(result.complexity, 'standard');
  });

  test('complex: 5 plans, 7 requirements', () => {
    // plan_count=5 -> score 2, w2.0 = 4.0
    // requirement_count=7 -> score 2, w2.0 = 4.0
    // phase_type='execution' -> score 1, w1.5 = 1.5
    // dependency_depth=0 -> score 0, w1.0 = 0.0
    // historical_failure_rate=null -> score 0, w1.5 = 0.0
    // Total = 9.5 -> complex (6 <= 9.5 < 10)
    const result = classifyTask(
      { name: 'Execute feature build' },
      [
        { files_to_modify: ['a.cjs'] },
        { files_to_modify: ['b.cjs'] },
        { files_to_modify: ['c.cjs'] },
        { files_to_modify: ['d.cjs'] },
        { files_to_modify: ['e.cjs'] },
      ],
      { reqIds: 'R-1,R-2,R-3,R-4,R-5,R-6,R-7' }
    );
    assert.strictEqual(result.complexity, 'complex');
  });

  test('critical: 8 plans, 10 requirements', () => {
    const result = classifyTask(
      { name: 'Verify integration' },
      [
        { files_to_modify: ['a.cjs'], depends_on: ['p1'] },
        { files_to_modify: ['b.cjs'], depends_on: ['p2'] },
        { files_to_modify: ['c.cjs'], depends_on: ['p3'] },
        { files_to_modify: ['d.cjs'], depends_on: ['p4'] },
        { files_to_modify: ['e.cjs'] },
        { files_to_modify: ['f.cjs'] },
        { files_to_modify: ['g.cjs'] },
        { files_to_modify: ['h.cjs'] },
      ],
      { reqIds: 'R-1,R-2,R-3,R-4,R-5,R-6,R-7,R-8,R-9,R-10', failureRate: 0.6 }
    );
    assert.strictEqual(result.complexity, 'critical');
  });

  test('returns confidence between 0 and 1', () => {
    const result = classifyTask(null, null, null);
    assert.ok(result.confidence >= 0, 'confidence should be >= 0');
    assert.ok(result.confidence <= 1, 'confidence should be <= 1');
  });

  test('returns all expected shape keys (complexity, signals, confidence)', () => {
    const result = classifyTask(null, [], {});
    assert.ok('complexity' in result, 'should have complexity key');
    assert.ok('signals' in result, 'should have signals key');
    assert.ok('confidence' in result, 'should have confidence key');
    assert.strictEqual(typeof result.complexity, 'string');
    assert.strictEqual(typeof result.signals, 'object');
    assert.strictEqual(typeof result.confidence, 'number');
  });
});

// ─── adaptWorkflowGates ─────────────────────────────────────────────────────

describe('adaptWorkflowGates', () => {
  test('returns empty object when config.adaptive is false/undefined', () => {
    const result = adaptWorkflowGates({ complexity: 'trivial' }, {});
    assert.deepStrictEqual(result, {});

    const result2 = adaptWorkflowGates({ complexity: 'trivial' }, { adaptive: false });
    assert.deepStrictEqual(result2, {});

    const result3 = adaptWorkflowGates({ complexity: 'critical' }, undefined);
    assert.deepStrictEqual(result3, {});
  });

  test('returns skip_research for trivial tasks', () => {
    const result = adaptWorkflowGates({ complexity: 'trivial' }, { adaptive: true });
    assert.strictEqual(result.skip_research, true);
    assert.strictEqual(result.plan_checker_enabled, false);
    assert.strictEqual(result.verification_rigor, 'light');
  });

  test('returns verification_rigor thorough for complex tasks', () => {
    const result = adaptWorkflowGates({ complexity: 'complex' }, { adaptive: true });
    assert.strictEqual(result.verification_rigor, 'thorough');
    assert.strictEqual(result.parallelization_wave_size, 2);
  });

  test('returns parallelization_wave_size 1 for critical tasks', () => {
    const result = adaptWorkflowGates({ complexity: 'critical' }, { adaptive: true });
    assert.strictEqual(result.parallelization_wave_size, 1);
    assert.strictEqual(result.force_quality_tier, true);
    assert.strictEqual(result.verification_rigor, 'thorough');
  });
});
