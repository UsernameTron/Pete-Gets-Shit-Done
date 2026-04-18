/**
 * checkpoint.cjs — Unit Tests
 *
 * Tests for checkpoint module: writeCheckpoint, readCheckpoint, scanPlanStatus.
 *
 * Requirements: CP-01, CP-04, CP-05, CP-06
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { createTempProject, createTempGitProject, cleanup } = require('./helpers.cjs');

const {
  writeCheckpoint,
  readCheckpoint,
  scanPlanStatus,
  CHECKPOINT_FILE,
  CHECKPOINT_VERSION,
} = require('../get-shit-done/bin/lib/checkpoint.cjs');

// ─── writeCheckpoint tests ────────────────────────────────────────────────────

describe('writeCheckpoint', () => {
  let tmpDir;
  let planDir;

  beforeEach(() => {
    tmpDir = createTempGitProject('gsd-cp-write-');
    planDir = path.join(tmpDir, '.planning');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('Test 1: produces JSON with all required fields', () => {
    const result = writeCheckpoint(planDir);
    assert.ok(result, 'should return a checkpoint object');
    assert.strictEqual(result.version, CHECKPOINT_VERSION, 'version must equal CHECKPOINT_VERSION');
    assert.ok(typeof result.timestamp === 'string', 'timestamp must be a string');
    assert.ok(typeof result.branch === 'string', 'branch must be a string');
    assert.ok(typeof result.commit === 'string', 'commit must be a string');
    assert.ok('milestone' in result, 'must have milestone field');
    assert.ok('phase' in result, 'must have phase field');
    assert.ok('phase_name' in result, 'must have phase_name field');
    assert.ok('plans' in result, 'must have plans field');
    assert.ok('tests' in result, 'must have tests field');
    assert.ok('files_modified' in result, 'must have files_modified field');
    assert.ok('next_action' in result, 'must have next_action field');
    assert.ok('context_note' in result, 'must have context_note field');
  });

  test('Test 2: returns checkpoint object (not just writes file)', () => {
    const result = writeCheckpoint(planDir);
    assert.ok(result !== null && typeof result === 'object', 'must return an object');
    assert.strictEqual(result.version, CHECKPOINT_VERSION);
  });

  test('Test 3: creates file at planDir/CHECKPOINT.json', () => {
    writeCheckpoint(planDir);
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    assert.ok(fs.existsSync(filePath), 'CHECKPOINT.json must exist');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.strictEqual(content.version, CHECKPOINT_VERSION);
  });

  test('Test 4: overrides={context_note: "test"} merges into output', () => {
    const result = writeCheckpoint(planDir, { context_note: 'test note' });
    assert.strictEqual(result.context_note, 'test note', 'context_note override should be applied');
    // Verify the file also has the override
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.strictEqual(content.context_note, 'test note');
  });

  test('Test 5: overrides={tests: {pass: 10, fail: 0}} replaces default tests value', () => {
    const result = writeCheckpoint(planDir, { tests: { pass: 10, fail: 0 } });
    assert.deepStrictEqual(result.tests, { pass: 10, fail: 0 }, 'tests override should replace default');
  });
});

// ─── readCheckpoint tests ─────────────────────────────────────────────────────

describe('readCheckpoint', () => {
  let tmpDir;
  let planDir;

  beforeEach(() => {
    tmpDir = createTempProject('gsd-cp-read-');
    planDir = path.join(tmpDir, '.planning');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('Test 6: returns null when CHECKPOINT.json does not exist', () => {
    const result = readCheckpoint(planDir);
    assert.strictEqual(result, null, 'must return null for missing file');
  });

  test('Test 7: returns null for corrupt JSON', () => {
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, 'not valid json at all', 'utf8');
    const result = readCheckpoint(planDir);
    assert.strictEqual(result, null, 'must return null for corrupt JSON');
  });

  test('Test 8: returns null for wrong version', () => {
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, JSON.stringify({ version: 999, timestamp: new Date().toISOString() }), 'utf8');
    const result = readCheckpoint(planDir);
    assert.strictEqual(result, null, 'must return null for wrong version');
  });

  test('Test 9: returns parsed object for valid checkpoint', () => {
    const now = new Date().toISOString();
    const checkpoint = {
      version: CHECKPOINT_VERSION,
      timestamp: now,
      branch: 'main',
      commit: 'abc1234',
      milestone: 'v2.7',
      phase: 52,
      phase_name: 'checkpoint-engine',
      plans: { total: 2, completed: [], active: '52-01', pending: ['52-02'] },
      tests: { pass: 100, fail: 0 },
      files_modified: [],
      next_action: '',
      context_note: '',
    };
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');

    const result = readCheckpoint(planDir);
    assert.ok(result !== null, 'must return object for valid checkpoint');
    assert.strictEqual(result.version, CHECKPOINT_VERSION);
    assert.strictEqual(result.milestone, 'v2.7');
    assert.strictEqual(result.phase, 52);
  });

  test('Test 10: marks >24h old checkpoint as _stale=true', () => {
    // 25 hours ago
    const past = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const checkpoint = {
      version: CHECKPOINT_VERSION,
      timestamp: past,
      branch: 'main',
      commit: 'abc1234',
      milestone: 'v2.7',
      phase: 52,
      phase_name: 'checkpoint-engine',
      plans: { total: 0, completed: [], active: null, pending: [] },
      tests: { pass: 0, fail: 0 },
      files_modified: [],
      next_action: '',
      context_note: '',
    };
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');

    const result = readCheckpoint(planDir);
    assert.ok(result !== null);
    assert.strictEqual(result._stale, true, 'checkpoint >24h old must be marked stale');
  });

  test('Test 11: marks <1h old checkpoint as _stale=false', () => {
    // 30 minutes ago
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const checkpoint = {
      version: CHECKPOINT_VERSION,
      timestamp: recent,
      branch: 'main',
      commit: 'abc1234',
      milestone: 'v2.7',
      phase: 52,
      phase_name: 'checkpoint-engine',
      plans: { total: 0, completed: [], active: null, pending: [] },
      tests: { pass: 0, fail: 0 },
      files_modified: [],
      next_action: '',
      context_note: '',
    };
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');

    const result = readCheckpoint(planDir);
    assert.ok(result !== null);
    assert.strictEqual(result._stale, false, 'checkpoint <1h old must not be stale');
  });

  test('Test 12: sets _ageHours to approximate hours since timestamp', () => {
    // 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const checkpoint = {
      version: CHECKPOINT_VERSION,
      timestamp: threeHoursAgo,
      branch: 'main',
      commit: 'abc1234',
      milestone: 'v2.7',
      phase: 52,
      phase_name: 'checkpoint-engine',
      plans: { total: 0, completed: [], active: null, pending: [] },
      tests: { pass: 0, fail: 0 },
      files_modified: [],
      next_action: '',
      context_note: '',
    };
    const filePath = path.join(planDir, CHECKPOINT_FILE);
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');

    const result = readCheckpoint(planDir);
    assert.ok(result !== null);
    assert.ok(typeof result._ageHours === 'number', '_ageHours must be a number');
    // Allow ±1 hour tolerance for timing
    assert.ok(result._ageHours >= 2 && result._ageHours <= 4, `_ageHours should be ~3, got ${result._ageHours}`);
  });
});

// ─── Round-trip tests ─────────────────────────────────────────────────────────

describe('writeCheckpoint + readCheckpoint round-trip', () => {
  let tmpDir;
  let planDir;

  beforeEach(() => {
    tmpDir = createTempGitProject('gsd-cp-roundtrip-');
    planDir = path.join(tmpDir, '.planning');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('Test 13: write then read produces matching version, milestone, phase', () => {
    // Write a STATE.md so parseState can find milestone/phase
    fs.writeFileSync(
      path.join(planDir, 'STATE.md'),
      '---\nmilestone: v2.7\nphase: 52\n---\n\n# STATE\n'
    );

    const written = writeCheckpoint(planDir, {
      milestone: 'v2.7',
      phase: 52,
      phase_name: 'checkpoint-engine',
    });

    const read = readCheckpoint(planDir);
    assert.ok(read !== null, 'readCheckpoint must return object after write');
    assert.strictEqual(read.version, written.version, 'version must match');
    assert.strictEqual(read.milestone, written.milestone, 'milestone must match');
    assert.strictEqual(read.phase, written.phase, 'phase must match');
  });
});

// ─── scanPlanStatus tests ─────────────────────────────────────────────────────

describe('scanPlanStatus', () => {
  let tmpDir;
  let planDir;

  beforeEach(() => {
    tmpDir = createTempProject('gsd-cp-scan-');
    planDir = path.join(tmpDir, '.planning');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('Test 14: PLAN.md + SUMMARY.md marks plan as completed', () => {
    // Create a phase directory with both plan and summary
    const phaseDir = path.join(planDir, 'phases', '52-checkpoint-engine');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '52-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(phaseDir, '52-01-SUMMARY.md'), '# Summary\n');

    const result = scanPlanStatus(planDir, '52');
    assert.ok(result.completed.includes('52-01'), '52-01 should be in completed');
    assert.strictEqual(result.pending.length, 0, 'no plans should be pending');
  });

  test('Test 15: PLAN.md but no SUMMARY.md marks plan as pending/active', () => {
    const phaseDir = path.join(planDir, 'phases', '52-checkpoint-engine');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '52-01-PLAN.md'), '# Plan\n');
    // No SUMMARY.md

    const result = scanPlanStatus(planDir, '52');
    assert.ok(!result.completed.includes('52-01'), '52-01 should NOT be in completed');
    assert.ok(
      result.active === '52-01' || result.pending.includes('52-01'),
      '52-01 should be active or pending'
    );
  });

  test('Test 16: sets active to first incomplete plan ID', () => {
    const phaseDir = path.join(planDir, 'phases', '52-checkpoint-engine');
    fs.mkdirSync(phaseDir, { recursive: true });
    // Plan 01 complete, Plan 02 incomplete, Plan 03 incomplete
    fs.writeFileSync(path.join(phaseDir, '52-01-PLAN.md'), '# Plan 01\n');
    fs.writeFileSync(path.join(phaseDir, '52-01-SUMMARY.md'), '# Summary 01\n');
    fs.writeFileSync(path.join(phaseDir, '52-02-PLAN.md'), '# Plan 02\n');
    fs.writeFileSync(path.join(phaseDir, '52-03-PLAN.md'), '# Plan 03\n');

    const result = scanPlanStatus(planDir, '52');
    assert.strictEqual(result.active, '52-02', 'active must be first incomplete plan');
    assert.ok(result.pending.includes('52-03'), '52-03 should be in pending');
  });

  test('Test 17: handles empty phase directory (total=0, completed=[], active=null, pending=[])', () => {
    const phaseDir = path.join(planDir, 'phases', '52-checkpoint-engine');
    fs.mkdirSync(phaseDir, { recursive: true });
    // Empty directory — no PLAN.md files

    const result = scanPlanStatus(planDir, '52');
    assert.strictEqual(result.total, 0, 'total must be 0 for empty phase dir');
    assert.deepStrictEqual(result.completed, [], 'completed must be empty array');
    assert.strictEqual(result.active, null, 'active must be null');
    assert.deepStrictEqual(result.pending, [], 'pending must be empty array');
  });

  test('Test 18: handles missing phase directory gracefully', () => {
    // No phase directory created at all — phaseNum doesn't match any directory
    const result = scanPlanStatus(planDir, '99');
    assert.strictEqual(result.total, 0);
    assert.deepStrictEqual(result.completed, []);
    assert.strictEqual(result.active, null);
    assert.deepStrictEqual(result.pending, []);
  });
});
