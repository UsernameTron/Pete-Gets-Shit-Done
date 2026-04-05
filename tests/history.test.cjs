/**
 * history.cjs — Unit Tests
 *
 * Tests for execution history module: recordExecution, queryHistory, detectPatterns.
 *
 * Requirements: INTEL-13, INTEL-14, INTEL-15
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { createTempProject, cleanup } = require('./helpers.cjs');

const {
  OUTCOME_VALUES,
  HISTORY_DIR,
  HISTORY_FILE,
  ROTATION_THRESHOLD,
  ROTATION_KEEP,
  getHistoryPath,
  parseJsonlSafe,
  recordExecution,
  queryHistory,
  detectPatterns,
  formatHistoryList,
  formatHistoryStats,
  pruneHistory,
} = require('../get-shit-done/bin/lib/history.cjs');

// ─── OUTCOME_VALUES tests ─────────────────────────────────────────────────────

describe('OUTCOME_VALUES', () => {
  test('exports all 3 values with correct strings', () => {
    assert.strictEqual(OUTCOME_VALUES.PASS, 'pass');
    assert.strictEqual(OUTCOME_VALUES.FAIL, 'fail');
    assert.strictEqual(OUTCOME_VALUES.PARTIAL, 'partial');
    assert.strictEqual(Object.keys(OUTCOME_VALUES).length, 3);
  });

  test('object is frozen', () => {
    assert.ok(Object.isFrozen(OUTCOME_VALUES));
  });
});

// ─── parseJsonlSafe / edge cases ──────────────────────────────────────────────

describe('parseJsonlSafe', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array for missing file', () => {
    const result = parseJsonlSafe(path.join(tmpDir, 'nonexistent.jsonl'));
    assert.deepStrictEqual(result, []);
  });

  test('skips blank lines', () => {
    const filePath = path.join(tmpDir, 'test.jsonl');
    fs.writeFileSync(filePath, '{"a":1}\n\n\n{"b":2}\n\n', 'utf8');
    const result = parseJsonlSafe(filePath);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], { a: 1 });
    assert.deepStrictEqual(result[1], { b: 2 });
  });

  test('skips malformed JSON lines', () => {
    const filePath = path.join(tmpDir, 'test.jsonl');
    fs.writeFileSync(filePath, '{"a":1}\nnot-json\n{"b":2}\n', 'utf8');
    const result = parseJsonlSafe(filePath);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], { a: 1 });
    assert.deepStrictEqual(result[1], { b: 2 });
  });

  test('parses valid JSONL correctly', () => {
    const filePath = path.join(tmpDir, 'test.jsonl');
    const records = [
      { phase: 1, outcome: 'pass' },
      { phase: 2, outcome: 'fail' },
      { phase: 3, outcome: 'partial' },
    ];
    fs.writeFileSync(filePath, records.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
    const result = parseJsonlSafe(filePath);
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result, records);
  });
});

// ─── recordExecution tests ────────────────────────────────────────────────────

describe('recordExecution', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates history directory and file when missing', () => {
    const histDir = path.join(tmpDir, HISTORY_DIR);
    assert.ok(!fs.existsSync(histDir), 'history dir should not exist yet');

    recordExecution(tmpDir, 1, 1, { outcome: 'pass' });

    assert.ok(fs.existsSync(histDir), 'history dir should be created');
    assert.ok(fs.existsSync(getHistoryPath(tmpDir)), 'history file should be created');
  });

  test('appends JSONL record with correct fields', () => {
    const record = recordExecution(tmpDir, 5, 2, {
      outcome: 'pass',
      agent: 'gsd-executor',
      model_used: 'sonnet',
      duration_ms: 12500,
      files_changed: 3,
    });

    assert.strictEqual(record.phase, 5);
    assert.strictEqual(record.plan, 2);
    assert.strictEqual(record.agent, 'gsd-executor');
    assert.strictEqual(record.model_used, 'sonnet');
    assert.strictEqual(record.duration_ms, 12500);
    assert.strictEqual(record.outcome, 'pass');
    assert.strictEqual(record.error_code, null);
    assert.strictEqual(record.files_changed, 3);
    assert.ok(record.timestamp, 'should have a timestamp');

    // Verify file content
    const content = fs.readFileSync(getHistoryPath(tmpDir), 'utf8');
    const parsed = JSON.parse(content.trim());
    assert.strictEqual(parsed.phase, 5);
    assert.strictEqual(parsed.outcome, 'pass');
  });

  test('coerces phaseNum and planNum to numbers', () => {
    const record = recordExecution(tmpDir, '32', '1', { outcome: 'pass' });
    assert.strictEqual(record.phase, 32);
    assert.strictEqual(record.plan, 1);
    assert.strictEqual(typeof record.phase, 'number');
    assert.strictEqual(typeof record.plan, 'number');
  });

  test('includes ISO timestamp', () => {
    const before = new Date().toISOString();
    const record = recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    const after = new Date().toISOString();

    assert.ok(record.timestamp >= before, 'timestamp should be >= test start');
    assert.ok(record.timestamp <= after, 'timestamp should be <= test end');
    // Verify ISO format
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(record.timestamp));
  });

  test('throws on invalid outcome value', () => {
    assert.throws(
      () => recordExecution(tmpDir, 1, 1, { outcome: 'invalid' }),
      /Invalid outcome value/
    );
  });

  test('defaults agent to unknown when not provided', () => {
    const record = recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    assert.strictEqual(record.agent, 'unknown');
  });

  test('defaults files_changed to 0', () => {
    const record = recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    assert.strictEqual(record.files_changed, 0);
  });

  test('multiple calls append multiple lines', () => {
    recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 2, 1, { outcome: 'fail', error_code: 'TEST_FAIL' });
    recordExecution(tmpDir, 3, 1, { outcome: 'partial' });

    const content = fs.readFileSync(getHistoryPath(tmpDir), 'utf8');
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 3);

    const records = lines.map(l => JSON.parse(l));
    assert.strictEqual(records[0].phase, 1);
    assert.strictEqual(records[0].outcome, 'pass');
    assert.strictEqual(records[1].phase, 2);
    assert.strictEqual(records[1].outcome, 'fail');
    assert.strictEqual(records[1].error_code, 'TEST_FAIL');
    assert.strictEqual(records[2].phase, 3);
    assert.strictEqual(records[2].outcome, 'partial');
  });
});

// ─── queryHistory tests ───────────────────────────────────────────────────────

describe('queryHistory', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Seed test data
    recordExecution(tmpDir, 30, 1, { outcome: 'pass', agent: 'gsd-executor', model_used: 'sonnet' });
    recordExecution(tmpDir, 30, 2, { outcome: 'fail', agent: 'gsd-planner', model_used: 'haiku' });
    recordExecution(tmpDir, 31, 1, { outcome: 'pass', agent: 'gsd-executor', model_used: 'opus' });
    recordExecution(tmpDir, 32, 1, { outcome: 'fail', agent: 'gsd-executor', model_used: 'sonnet' });
    recordExecution(tmpDir, 32, 2, { outcome: 'partial', agent: 'gsd-planner', model_used: 'haiku' });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns all records with no filters', () => {
    const result = queryHistory(tmpDir);
    assert.strictEqual(result.records.length, 5);
    assert.strictEqual(result.total, 5);
  });

  test('filters by agent name', () => {
    const result = queryHistory(tmpDir, { agent: 'gsd-executor' });
    assert.strictEqual(result.total, 3);
    assert.ok(result.records.every(r => r.agent === 'gsd-executor'));
  });

  test('filters by phase range', () => {
    const result = queryHistory(tmpDir, { phaseRange: [31, 32] });
    assert.strictEqual(result.total, 3);
    assert.ok(result.records.every(r => r.phase >= 31 && r.phase <= 32));
  });

  test('filters by outcome', () => {
    const result = queryHistory(tmpDir, { outcome: 'fail' });
    assert.strictEqual(result.total, 2);
    assert.ok(result.records.every(r => r.outcome === 'fail'));
  });

  test('filters by date range', () => {
    // All records were just created, so filtering to today should return all
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const result = queryHistory(tmpDir, { dateRange: [today, tomorrow] });
    assert.strictEqual(result.total, 5);

    // Filter to a date far in the past — should return none
    const pastResult = queryHistory(tmpDir, { dateRange: ['2020-01-01', '2020-12-31'] });
    assert.strictEqual(pastResult.total, 0);
  });

  test('applies limit (returns last N)', () => {
    const result = queryHistory(tmpDir, { limit: 2 });
    assert.strictEqual(result.records.length, 2);
    assert.strictEqual(result.total, 5); // total before limit
    // Should be the last 2 records
    assert.strictEqual(result.records[0].phase, 32);
    assert.strictEqual(result.records[0].plan, 1);
    assert.strictEqual(result.records[1].phase, 32);
    assert.strictEqual(result.records[1].plan, 2);
  });

  test('combines multiple filters', () => {
    const result = queryHistory(tmpDir, {
      agent: 'gsd-executor',
      outcome: 'pass',
    });
    assert.strictEqual(result.total, 2);
    assert.ok(result.records.every(r => r.agent === 'gsd-executor' && r.outcome === 'pass'));
  });

  test('returns total count in result', () => {
    const result = queryHistory(tmpDir, { agent: 'gsd-planner' });
    assert.strictEqual(typeof result.total, 'number');
    assert.strictEqual(result.total, 2);
    assert.strictEqual(result.records.length, 2);
  });
});

// ─── detectPatterns tests ─────────────────────────────────────────────────────

describe('detectPatterns', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns insufficient_data: true with fewer than 5 records', () => {
    recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 2, 1, { outcome: 'fail' });

    const result = detectPatterns(tmpDir);
    assert.strictEqual(result.insufficient_data, true);
    assert.deepStrictEqual(result.patterns, []);
  });

  test('identifies frequently-failing phases (>30% failure rate)', () => {
    // Phase 10: 4 executions, 3 failures = 75% failure rate
    recordExecution(tmpDir, 10, 1, { outcome: 'fail' });
    recordExecution(tmpDir, 10, 2, { outcome: 'fail' });
    recordExecution(tmpDir, 10, 3, { outcome: 'fail' });
    recordExecution(tmpDir, 10, 4, { outcome: 'pass' });
    // Phase 11: 3 executions, 0 failures — should NOT be flagged
    recordExecution(tmpDir, 11, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 11, 2, { outcome: 'pass' });
    recordExecution(tmpDir, 11, 3, { outcome: 'pass' });

    const result = detectPatterns(tmpDir);
    assert.strictEqual(result.insufficient_data, false);

    const failingPhase = result.patterns.find(
      p => p.type === 'failing_phase' && p.phase === 10
    );
    assert.ok(failingPhase, 'Should detect phase 10 as frequently-failing');
    assert.strictEqual(failingPhase.failure_rate, 0.75);
    assert.strictEqual(failingPhase.executions, 4);

    // Phase 11 should not appear
    const phase11 = result.patterns.find(
      p => p.type === 'failing_phase' && p.phase === 11
    );
    assert.strictEqual(phase11, undefined, 'Phase 11 should not be flagged');
  });

  test('returns summary with total_executions and pass_rate', () => {
    // Create 5 records: 4 pass, 1 fail
    recordExecution(tmpDir, 1, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 2, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 3, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 4, 1, { outcome: 'pass' });
    recordExecution(tmpDir, 5, 1, { outcome: 'fail' });

    const result = detectPatterns(tmpDir);
    assert.strictEqual(result.summary.total_executions, 5);
    assert.strictEqual(result.summary.overall_pass_rate, 0.8);
  });

  test('returns model_distribution in summary', () => {
    recordExecution(tmpDir, 1, 1, { outcome: 'pass', model_used: 'sonnet' });
    recordExecution(tmpDir, 2, 1, { outcome: 'pass', model_used: 'sonnet' });
    recordExecution(tmpDir, 3, 1, { outcome: 'pass', model_used: 'haiku' });
    recordExecution(tmpDir, 4, 1, { outcome: 'pass', model_used: 'opus' });
    recordExecution(tmpDir, 5, 1, { outcome: 'fail', model_used: 'haiku' });

    const result = detectPatterns(tmpDir);
    assert.deepStrictEqual(result.summary.model_distribution, {
      sonnet: 2,
      haiku: 2,
      opus: 1,
    });
  });

  test('handles empty history gracefully', () => {
    const result = detectPatterns(tmpDir);
    assert.strictEqual(result.insufficient_data, true);
    assert.deepStrictEqual(result.patterns, []);
  });

  test('calculates avg_duration_ms (skipping null durations)', () => {
    recordExecution(tmpDir, 1, 1, { outcome: 'pass', duration_ms: 10000 });
    recordExecution(tmpDir, 2, 1, { outcome: 'pass', duration_ms: 20000 });
    recordExecution(tmpDir, 3, 1, { outcome: 'pass', duration_ms: 30000 });
    recordExecution(tmpDir, 4, 1, { outcome: 'pass' }); // null duration
    recordExecution(tmpDir, 5, 1, { outcome: 'pass' }); // null duration

    const result = detectPatterns(tmpDir);
    // Average of 10000, 20000, 30000 = 20000
    assert.strictEqual(result.summary.avg_duration_ms, 20000);
  });
});
