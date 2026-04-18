/**
 * daily.cjs — Unit Tests
 *
 * TDD tests for the daily dashboard module: gatherDailyState, determineNextAction, formatDashboard.
 *
 * Requirements: DAILY-01, DAILY-02, DAILY-03, DAILY-04, DAILY-05, DAILY-06
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  gatherDailyState,
  determineNextAction,
  formatDashboard,
} = require('../get-shit-done/bin/lib/daily.cjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TMP_ROOT = require('os').tmpdir();

function createTempPlanningDir(prefix = 'gsd-daily-') {
  const tmpDir = fs.mkdtempSync(path.join(TMP_ROOT, prefix));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch { /* ignore */ }
}

function makeValidCheckpoint(overrides = {}) {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    branch: 'feat/test-branch',
    commit: 'abc1234',
    milestone: 'v2.7',
    phase: 53,
    phase_name: 'daily-dashboard',
    plans: { total: 2, completed: ['53-01'], active: '53-02', pending: [] },
    tests: { pass: 100, fail: 0 },
    files_modified: [],
    next_action: '',
    context_note: '',
    ...overrides,
  };
}

// ─── gatherDailyState tests ───────────────────────────────────────────────────

describe('gatherDailyState', () => {
  let tmpDir;
  let planDir;

  beforeEach(() => {
    tmpDir = createTempPlanningDir();
    planDir = path.join(tmpDir, '.planning');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('Test 1: returns checkpoint data with _source=checkpoint when valid CHECKPOINT.json present', async () => {
    const checkpoint = makeValidCheckpoint();
    fs.writeFileSync(
      path.join(planDir, 'CHECKPOINT.json'),
      JSON.stringify(checkpoint, null, 2),
      'utf8'
    );

    const state = gatherDailyState(planDir);
    assert.strictEqual(state._source, 'checkpoint', 'must set _source to "checkpoint"');
    assert.strictEqual(state.milestone, 'v2.7', 'must carry milestone from checkpoint');
    assert.strictEqual(state.phase, 53, 'must carry phase from checkpoint');
    assert.strictEqual(state.branch, 'feat/test-branch', 'must carry branch from checkpoint');
  });

  test('Test 2: falls back to STATE.md with _source=state when CHECKPOINT.json is missing', async () => {
    // Write a STATE.md with frontmatter
    fs.writeFileSync(
      path.join(planDir, 'STATE.md'),
      [
        '---',
        'milestone: v2.7',
        'milestone_name: Session Continuity',
        '---',
        '',
        '# STATE',
        '',
        'Current focus: Phase 53 — daily-dashboard',
      ].join('\n'),
      'utf8'
    );
    // No CHECKPOINT.json

    const state = gatherDailyState(planDir);
    assert.strictEqual(state._source, 'state', 'must set _source to "state" when no checkpoint');
    assert.strictEqual(state.milestone, 'v2.7', 'must read milestone from STATE.md frontmatter');
  });

  test('Test 3: falls back to STATE.md when CHECKPOINT.json is corrupt', async () => {
    // Write corrupt checkpoint
    fs.writeFileSync(
      path.join(planDir, 'CHECKPOINT.json'),
      'this is not valid json }{',
      'utf8'
    );
    // Write valid STATE.md
    fs.writeFileSync(
      path.join(planDir, 'STATE.md'),
      '---\nmilestone: v2.7\n---\n\n# STATE\n',
      'utf8'
    );

    const state = gatherDailyState(planDir);
    assert.strictEqual(state._source, 'state', 'must fall back to STATE.md on corrupt checkpoint');
    assert.strictEqual(state.milestone, 'v2.7', 'must still read milestone from STATE.md');
  });

  test('Test 4: returns safe defaults with _source=none when neither file exists', async () => {
    // planDir exists but has no CHECKPOINT.json or STATE.md
    let threw = false;
    let state;
    try {
      state = gatherDailyState(planDir);
    } catch {
      threw = true;
    }
    assert.strictEqual(threw, false, 'must not throw when both files are missing');
    assert.strictEqual(state._source, 'none', 'must set _source to "none"');
    assert.strictEqual(typeof state.phase, 'number', 'phase must be a number');
    assert.strictEqual(state.phase, 0, 'phase must default to 0');
    assert.strictEqual(typeof state.branch, 'string', 'branch must be a string');
    assert.ok(Array.isArray(state.plans.completed), 'plans.completed must be an array');
  });
});

// ─── determineNextAction tests ────────────────────────────────────────────────

describe('determineNextAction', () => {
  test('Test 5: returns /gsd:execute-phase N when there is an active plan', () => {
    const state = {
      phase: 52,
      _source: 'checkpoint',
      next_action: '',
      plans: { total: 3, completed: ['52-01'], active: '52-02', pending: ['52-03'] },
    };
    const action = determineNextAction(state);
    assert.ok(action.includes('/gsd:execute-phase'), 'must return execute-phase command');
    assert.ok(action.includes('52'), 'must include phase number');
  });

  test('Test 6: returns /gsd:verify-work N when all plans are complete', () => {
    const state = {
      phase: 52,
      _source: 'checkpoint',
      next_action: '',
      plans: { total: 2, completed: ['52-01', '52-02'], active: null, pending: [] },
    };
    const action = determineNextAction(state);
    assert.ok(
      action.includes('/gsd:verify-work') || action.includes('/gsd:execute-phase'),
      'must return verify-work or phase advancement command'
    );
  });

  test('Test 7: returns /gsd:plan-phase N when phase has no plans', () => {
    const state = {
      phase: 52,
      _source: 'checkpoint',
      next_action: '',
      plans: { total: 0, completed: [], active: null, pending: [] },
    };
    const action = determineNextAction(state);
    assert.ok(
      action.includes('/gsd:plan-phase') || action.includes('/gsd:discuss-phase'),
      'must return plan-phase or discuss-phase command'
    );
    assert.ok(action.includes('52'), 'must include phase number');
  });

  test('Test 8: returns /gsd:new-project when _source is none (no roadmap)', () => {
    const state = { _source: 'none' };
    const action = determineNextAction(state);
    assert.ok(
      action.includes('/gsd:new-project') || action.includes('/gsd:new-milestone'),
      'must return new-project or new-milestone for _source=none'
    );
  });

  test('Test 8b: uses checkpoint next_action when explicitly set', () => {
    const state = {
      phase: 52,
      _source: 'checkpoint',
      next_action: '/gsd:execute-phase 52',
      plans: { total: 3, completed: ['52-01'], active: '52-02', pending: ['52-03'] },
    };
    const action = determineNextAction(state);
    assert.strictEqual(action, '/gsd:execute-phase 52', 'must honor explicit next_action from checkpoint');
  });
});

// ─── formatDashboard tests ────────────────────────────────────────────────────

describe('formatDashboard', () => {
  test('Test 9: includes all required sections — milestone, phase, plan progress, branch, next action', () => {
    const state = {
      _source: 'checkpoint',
      milestone: 'v2.7',
      phase: 53,
      phase_name: 'daily-dashboard',
      branch: 'feat/phase-53',
      commit: 'abc1234',
      _stale: false,
      _ageHours: 0,
      _gitDirty: false,
      next_action: '',
      context_note: '',
      plans: { total: 2, completed: ['53-01'], active: '53-02', pending: [] },
    };
    const output = formatDashboard(state);
    assert.ok(typeof output === 'string', 'output must be a string');
    assert.ok(output.includes('v2.7'), 'must include milestone');
    assert.ok(output.includes('53'), 'must include phase number');
    assert.ok(output.includes('daily-dashboard'), 'must include phase name');
    assert.ok(output.includes('feat/phase-53'), 'must include branch');
    // Plan progress section
    assert.ok(
      output.includes('1/2') || output.includes('Plan Progress') || output.includes('53-01'),
      'must include plan progress information'
    );
    // Next action section
    assert.ok(
      output.includes('Next Action') || output.includes('/gsd:'),
      'must include next action section'
    );
  });

  test('Test 10: includes dirty working tree warning when _gitDirty is true', () => {
    const state = {
      _source: 'checkpoint',
      milestone: 'v2.7',
      phase: 53,
      phase_name: 'daily-dashboard',
      branch: 'feat/phase-53',
      commit: 'abc1234',
      _stale: false,
      _ageHours: 0,
      _gitDirty: true,
      next_action: '',
      context_note: '',
      plans: { total: 1, completed: [], active: '53-01', pending: [] },
    };
    const output = formatDashboard(state);
    assert.ok(
      output.toLowerCase().includes('dirty') || output.includes('uncommitted'),
      'must include dirty working tree warning'
    );
  });

  test('Test 11: includes stale checkpoint warning when _stale is true', () => {
    const state = {
      _source: 'checkpoint',
      milestone: 'v2.7',
      phase: 53,
      phase_name: 'daily-dashboard',
      branch: 'feat/phase-53',
      commit: 'abc1234',
      _stale: true,
      _ageHours: 30,
      _gitDirty: false,
      next_action: '',
      context_note: '',
      plans: { total: 1, completed: [], active: '53-01', pending: [] },
    };
    const output = formatDashboard(state);
    assert.ok(
      output.toLowerCase().includes('stale') || output.includes('30'),
      'must include stale checkpoint warning with age'
    );
  });

  test('Test 12: handles _source=none gracefully — shows no project state message', () => {
    const state = {
      _source: 'none',
      milestone: '',
      phase: 0,
      phase_name: '',
      branch: 'unknown',
      commit: '0000000',
      _stale: false,
      _ageHours: 0,
      _gitDirty: false,
      next_action: '',
      context_note: '',
      plans: { total: 0, completed: [], active: null, pending: [] },
    };
    let threw = false;
    let output;
    try {
      output = formatDashboard(state);
    } catch {
      threw = true;
    }
    assert.strictEqual(threw, false, 'must not throw for _source=none');
    assert.ok(typeof output === 'string', 'output must be a string');
    assert.ok(
      output.toLowerCase().includes('no project') ||
      output.toLowerCase().includes('not found') ||
      output.toLowerCase().includes('initialize') ||
      output.includes('/gsd:new-project'),
      'must show a message about missing project state'
    );
  });
});
