/**
 * E2E Intelligence Pipeline Tests
 *
 * Exercises the full intelligence pipeline: classify -> route -> record -> learn.
 * Validates that gsd-tools init commands respect routing_strategy, adaptive flags,
 * and that the history module correctly records/queries/detects patterns.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  createMidMilestoneProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

const {
  assertFileExists,
  assertFileContains,
} = require('./assertions.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GSD_TOOLS = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

/**
 * Run gsd-tools with --raw and parse the JSON output.
 *
 * @param {string[]} args - Command arguments (e.g. ['init', 'plan-phase', '2'])
 * @param {string} cwd - Working directory (fixture root)
 * @returns {object} Parsed JSON output
 */
function runGsdTools(args, cwd) {
  const result = execFileSync(process.execPath, [GSD_TOOLS, ...args, '--raw'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  });
  return JSON.parse(result);
}

/**
 * Overwrite config.json in a fixture project.
 *
 * @param {string} dir - Project root
 * @param {object} overrides - Config fields to merge with defaults
 */
function setConfig(dir, overrides) {
  const configPath = path.join(dir, '.planning', 'config.json');
  const base = {
    config_version: 1,
    model_profile: 'balanced',
    commit_docs: false,
  };
  fs.writeFileSync(configPath, JSON.stringify({ ...base, ...overrides }, null, 2) + '\n');
}

/**
 * Write a minimal PLAN file into a phase directory.
 *
 * @param {string} dir - Project root
 * @param {number} phase - Phase number
 * @param {number} plan - Plan number
 * @param {string} [title] - Optional title
 */
function writeMockPlan(dir, phase, plan, title) {
  const padPhase = String(phase).padStart(2, '0');
  const padPlan = String(plan).padStart(2, '0');
  const phaseDir = path.join(dir, '.planning', 'phases', `phase-${padPhase}`);
  fs.mkdirSync(phaseDir, { recursive: true });
  const planPath = path.join(phaseDir, `${padPlan}-PLAN.md`);
  fs.writeFileSync(planPath, [
    '---',
    `phase: ${phase}`,
    `plan: ${plan}`,
    `title: "${title || `Test Plan ${plan}`}"`,
    '---',
    '',
    `# ${title || `Test Plan ${plan}`}`,
    '',
    '## Tasks',
    '',
    '- [ ] Task 1',
    '',
  ].join('\n'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Intelligence Pipeline E2E', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: classify -> route with static strategy
  // -------------------------------------------------------------------------

  it('static strategy: no task_classification in execute-phase output', () => {
    const dir = createMidMilestoneProject();
    setConfig(dir, { routing_strategy: 'static', adaptive: false });

    writeMockPlan(dir, 2, 1, 'Static Test Plan');
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase should be found');
    assert.strictEqual(result.task_classification, null, 'static strategy should not produce task_classification');
  });

  // -------------------------------------------------------------------------
  // Test 2: classify -> route with dynamic strategy + adaptive
  // -------------------------------------------------------------------------

  it('dynamic strategy with adaptive: task_classification present in execute-phase output', () => {
    const dir = createMidMilestoneProject();
    setConfig(dir, { routing_strategy: 'dynamic', adaptive: true });

    writeMockPlan(dir, 2, 1, 'Dynamic Test Plan');
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase should be found');
    assert.ok(result.task_classification !== null, 'dynamic+adaptive should produce task_classification');
    assert.strictEqual(typeof result.task_classification.complexity, 'string', 'complexity should be a string');
    assert.strictEqual(typeof result.task_classification.signals, 'object', 'signals should be an object');
    assert.strictEqual(typeof result.task_classification.confidence, 'number', 'confidence should be a number');
  });

  // -------------------------------------------------------------------------
  // Test 3: classify -> route with auto strategy + adaptive
  // -------------------------------------------------------------------------

  it('auto strategy with adaptive: task_classification present in execute-phase output', () => {
    const dir = createMidMilestoneProject();
    setConfig(dir, { routing_strategy: 'auto', adaptive: true });

    writeMockPlan(dir, 2, 1, 'Auto Test Plan');
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase should be found');
    assert.ok(result.task_classification !== null, 'auto+adaptive should produce task_classification');
    assert.strictEqual(typeof result.task_classification.complexity, 'string', 'complexity field present');
  });

  // -------------------------------------------------------------------------
  // Test 4: adaptive:false suppresses classification
  // -------------------------------------------------------------------------

  it('adaptive:false suppresses task_classification even with dynamic routing', () => {
    const dir = createMidMilestoneProject();
    setConfig(dir, { routing_strategy: 'dynamic', adaptive: false });

    writeMockPlan(dir, 2, 1, 'No Adaptive Plan');
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase should be found');
    assert.strictEqual(
      result.task_classification,
      null,
      'adaptive:false should suppress task_classification regardless of routing_strategy'
    );
  });

  // -------------------------------------------------------------------------
  // Test 5: plan-phase init includes task_classification when adaptive
  // -------------------------------------------------------------------------

  it('plan-phase init includes task_classification with adaptive + dynamic routing', () => {
    const dir = createMidMilestoneProject();
    setConfig(dir, { routing_strategy: 'dynamic', adaptive: true });

    const result = runGsdTools(['init', 'plan-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase should be found');
    assert.ok(result.task_classification !== null, 'plan-phase should include task_classification with adaptive');
    assert.strictEqual(typeof result.task_classification.complexity, 'string', 'complexity present');
    assert.ok(result.task_classification.signals, 'signals present');
  });

  // -------------------------------------------------------------------------
  // Test 6: recordExecution writes JSONL (direct module test)
  // -------------------------------------------------------------------------

  it('recordExecution writes JSONL to history directory', () => {
    const dir = createMidMilestoneProject();
    const history = require('../../get-shit-done/bin/lib/history.cjs');

    const record = history.recordExecution(dir, 33, 1, {
      outcome: 'pass',
      agent: 'gsd-executor',
      model_used: 'sonnet',
      duration_ms: 1200,
      files_changed: 3,
    });

    assert.strictEqual(record.phase, 33, 'recorded phase should be 33');
    assert.strictEqual(record.plan, 1, 'recorded plan should be 1');
    assert.strictEqual(record.outcome, 'pass', 'recorded outcome should be pass');

    const historyPath = path.join(dir, '.planning', 'history', 'executions.jsonl');
    assertFileExists(historyPath);

    const content = fs.readFileSync(historyPath, 'utf-8').trim();
    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.phase, 33, 'JSONL line phase should be 33');
    assert.strictEqual(parsed.plan, 1, 'JSONL line plan should be 1');
    assert.strictEqual(parsed.outcome, 'pass', 'JSONL line outcome should be pass');
    assert.strictEqual(parsed.agent, 'gsd-executor', 'JSONL line agent should be gsd-executor');
  });

  // -------------------------------------------------------------------------
  // Test 7: queryHistory returns filtered results
  // -------------------------------------------------------------------------

  it('queryHistory returns filtered results from JSONL', () => {
    const dir = createMidMilestoneProject();
    const history = require('../../get-shit-done/bin/lib/history.cjs');

    // Write 5 records: 3 pass, 2 fail, across 2 phases
    history.recordExecution(dir, 10, 1, { outcome: 'pass', agent: 'agent-a' });
    history.recordExecution(dir, 10, 2, { outcome: 'fail', agent: 'agent-a' });
    history.recordExecution(dir, 11, 1, { outcome: 'pass', agent: 'agent-b' });
    history.recordExecution(dir, 11, 2, { outcome: 'pass', agent: 'agent-b' });
    history.recordExecution(dir, 11, 3, { outcome: 'fail', agent: 'agent-a' });

    // Query all
    const all = history.queryHistory(dir, {});
    assert.strictEqual(all.total, 5, 'total records should be 5');
    assert.strictEqual(all.records.length, 5, 'all records returned');

    // Filter by outcome
    const passOnly = history.queryHistory(dir, { outcome: 'pass' });
    assert.strictEqual(passOnly.total, 3, 'pass records should be 3');

    // Filter by agent
    const agentA = history.queryHistory(dir, { agent: 'agent-a' });
    assert.strictEqual(agentA.total, 3, 'agent-a records should be 3');

    // Filter by phase range
    const phase11 = history.queryHistory(dir, { phaseRange: [11, 11] });
    assert.strictEqual(phase11.total, 3, 'phase 11 records should be 3');

    // Combined filters
    const phase11Pass = history.queryHistory(dir, { phaseRange: [11, 11], outcome: 'pass' });
    assert.strictEqual(phase11Pass.total, 2, 'phase 11 pass records should be 2');
  });

  // -------------------------------------------------------------------------
  // Test 8: detectPatterns returns summary
  // -------------------------------------------------------------------------

  it('detectPatterns returns summary with sufficient data', () => {
    const dir = createMidMilestoneProject();
    const history = require('../../get-shit-done/bin/lib/history.cjs');

    // Write 10+ records with a mix of pass/fail to trigger pattern detection
    for (let i = 0; i < 6; i++) {
      history.recordExecution(dir, 5, i + 1, {
        outcome: 'pass',
        agent: 'gsd-executor',
        model_used: 'sonnet',
        duration_ms: 1000 + i * 100,
      });
    }
    for (let i = 0; i < 4; i++) {
      history.recordExecution(dir, 6, i + 1, {
        outcome: i < 2 ? 'fail' : 'pass',
        agent: 'gsd-verifier',
        model_used: 'haiku',
        duration_ms: 500 + i * 50,
      });
    }

    const result = history.detectPatterns(dir);
    assert.strictEqual(result.insufficient_data, false, 'should have sufficient data');
    assert.ok(result.summary, 'summary should exist');
    assert.strictEqual(typeof result.summary.total_executions, 'number', 'total_executions should be a number');
    assert.strictEqual(result.summary.total_executions, 10, 'total should be 10');
    assert.strictEqual(typeof result.summary.overall_pass_rate, 'number', 'overall_pass_rate should be a number');
    assert.ok(result.summary.overall_pass_rate >= 0 && result.summary.overall_pass_rate <= 1, 'pass rate in [0,1]');
    assert.ok(Array.isArray(result.patterns), 'patterns should be an array');
  });

  // -------------------------------------------------------------------------
  // Test 9: Full pipeline cycle — classify -> route -> record -> learn
  // -------------------------------------------------------------------------

  it('full pipeline cycle: classify -> route -> record -> detect patterns', () => {
    const dir = createMidMilestoneProject();
    const history = require('../../get-shit-done/bin/lib/history.cjs');
    setConfig(dir, { routing_strategy: 'auto', adaptive: true });

    writeMockPlan(dir, 2, 1, 'Pipeline Cycle Plan');

    // Step 1: Classify + Route via init execute-phase
    const initResult = runGsdTools(['init', 'execute-phase', '2'], dir);
    assert.strictEqual(initResult.phase_found, true, 'phase found');
    assert.ok(initResult.task_classification, 'classification present');
    assert.ok(initResult.executor_model, 'executor model resolved');

    // Step 2: Record execution result
    const record = history.recordExecution(dir, 2, 1, {
      outcome: 'pass',
      agent: 'gsd-executor',
      model_used: initResult.executor_model,
      duration_ms: 1500,
      files_changed: 2,
    });
    assert.strictEqual(record.outcome, 'pass', 'recorded pass');

    // Step 3: Record enough data for patterns (need >= 5)
    for (let i = 2; i <= 6; i++) {
      history.recordExecution(dir, 2, i, {
        outcome: i <= 4 ? 'pass' : 'fail',
        agent: 'gsd-executor',
        model_used: 'sonnet',
        duration_ms: 1000,
      });
    }

    // Step 4: Detect patterns from accumulated history
    const patterns = history.detectPatterns(dir);
    assert.strictEqual(patterns.insufficient_data, false, 'sufficient data for patterns');
    assert.ok(patterns.summary, 'summary present');
    assert.strictEqual(patterns.summary.total_executions, 6, 'total executions should be 6');
  });

  // -------------------------------------------------------------------------
  // Test 10: Coverage gate — c8 config includes intelligence modules
  // -------------------------------------------------------------------------

  it('coverage gate: c8 config includes lib modules for classify, history, model-profiles', () => {
    const c8rcPath = path.resolve(__dirname, '..', '..', '.c8rc.json');
    const c8rc = JSON.parse(fs.readFileSync(c8rcPath, 'utf-8'));

    assert.ok(Array.isArray(c8rc.include), 'c8rc.include should be an array');

    // The pattern 'get-shit-done/bin/lib/*.cjs' covers classify.cjs, history.cjs, model-profiles.cjs
    const hasLibPattern = c8rc.include.some(p => p.includes('lib/*.cjs') || p.includes('lib/'));
    assert.ok(hasLibPattern, 'c8 config should include lib/*.cjs pattern covering intelligence modules');

    // Verify tests directory is excluded from coverage
    assert.ok(Array.isArray(c8rc.exclude), 'c8rc.exclude should be an array');
    const excludesTests = c8rc.exclude.some(p => p.includes('tests'));
    assert.ok(excludesTests, 'c8 config should exclude tests directory');
  });
});
