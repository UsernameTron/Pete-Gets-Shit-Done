/**
 * E2E Pipeline Tests — plan-phase and execute-phase init commands
 *
 * Validates that gsd-tools init commands return correct JSON structures
 * for the plan-phase and execute-phase workflows, including plan discovery,
 * state transitions, and ROADMAP fallback behavior.
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
 * Write a minimal PLAN file into a phase directory.
 *
 * @param {string} dir - Project root
 * @param {number} phase - Phase number
 * @param {number} plan - Plan number (e.g. 1 -> 01-PLAN.md)
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

/**
 * Write a minimal SUMMARY file into a phase directory.
 *
 * @param {string} dir - Project root
 * @param {number} phase - Phase number
 * @param {number} plan - Plan number (e.g. 1 -> 01-SUMMARY.md)
 */
function writeMockSummary(dir, phase, plan) {
  const padPhase = String(phase).padStart(2, '0');
  const padPlan = String(plan).padStart(2, '0');
  const phaseDir = path.join(dir, '.planning', 'phases', `phase-${padPhase}`);
  fs.mkdirSync(phaseDir, { recursive: true });
  const summaryPath = path.join(phaseDir, `${padPlan}-SUMMARY.md`);
  fs.writeFileSync(summaryPath, [
    `# Summary — Plan ${plan}`,
    '',
    '## Outcome',
    'Completed successfully.',
    '',
  ].join('\n'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pipeline: plan-phase and execute-phase init', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: plan-phase init returns correct JSON
  // -------------------------------------------------------------------------

  it('plan-phase init returns correct JSON structure for in-progress phase', () => {
    const dir = createMidMilestoneProject();
    const result = runGsdTools(['init', 'plan-phase', '2'], dir);

    // Phase found — phase 2 exists on disk (in-progress in mid-milestone)
    assert.strictEqual(result.phase_found, true, 'phase_found should be true');

    // Type checks for all required fields
    assert.strictEqual(typeof result.phase_dir, 'string', 'phase_dir should be a string');
    assert.ok(
      typeof result.phase_number === 'number' || typeof result.phase_number === 'string',
      'phase_number should be a number or string'
    );
    assert.ok(
      result.phase_name === null || typeof result.phase_name === 'string',
      'phase_name should be a string or null (null when dir has no name suffix)'
    );
    assert.ok(
      result.phase_slug === null || typeof result.phase_slug === 'string',
      'phase_slug should be a string or null (null when dir has no name suffix)'
    );
    assert.strictEqual(typeof result.has_context, 'boolean', 'has_context should be a boolean');
    assert.strictEqual(typeof result.has_plans, 'boolean', 'has_plans should be a boolean');
    assert.strictEqual(typeof result.has_research, 'boolean', 'has_research should be a boolean');
    assert.strictEqual(typeof result.has_reviews, 'boolean', 'has_reviews should be a boolean');
    assert.strictEqual(typeof result.planner_model, 'string', 'planner_model should be a string');
    assert.strictEqual(typeof result.checker_model, 'string', 'checker_model should be a string');
    assert.strictEqual(typeof result.plan_count, 'number', 'plan_count should be a number');

    // Phase 2 has a CONTEXT.md but no PLANs in the fixture
    assert.strictEqual(result.has_context, true, 'phase 2 fixture should have context');
    assert.strictEqual(result.has_plans, false, 'phase 2 fixture has no PLAN files');
    assert.strictEqual(result.plan_count, 0, 'phase 2 fixture should have 0 plans');

    // Environment paths
    assert.strictEqual(typeof result.planning_exists, 'boolean', 'planning_exists should be a boolean');
    assert.strictEqual(typeof result.roadmap_exists, 'boolean', 'roadmap_exists should be a boolean');
    assert.strictEqual(result.planning_exists, true, '.planning/ should exist');
    assert.strictEqual(result.roadmap_exists, true, 'ROADMAP.md should exist');

    // File paths present
    assert.ok(result.state_path, 'state_path should be set');
    assert.ok(result.roadmap_path, 'roadmap_path should be set');
    assert.ok(result.requirements_path, 'requirements_path should be set');

    // Model fields populated
    assert.ok(result.researcher_model, 'researcher_model should be set');
    assert.ok(result.planner_model, 'planner_model should not be empty');
    assert.ok(result.checker_model, 'checker_model should not be empty');
  });

  // -------------------------------------------------------------------------
  // Test 2: execute-phase init returns correct JSON
  // -------------------------------------------------------------------------

  it('execute-phase init returns correct JSON structure for in-progress phase', () => {
    const dir = createMidMilestoneProject();
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    // Phase found
    assert.strictEqual(result.phase_found, true, 'phase_found should be true');

    // Type checks for required fields
    assert.ok(
      result.phase_dir === null || typeof result.phase_dir === 'string',
      'phase_dir should be string or null'
    );
    assert.ok(
      typeof result.phase_number === 'number' || typeof result.phase_number === 'string',
      'phase_number should be a number or string'
    );
    assert.strictEqual(typeof result.executor_model, 'string', 'executor_model should be a string');
    assert.ok(Array.isArray(result.plans), 'plans should be an array');
    assert.ok(Array.isArray(result.summaries), 'summaries should be an array');
    assert.ok(Array.isArray(result.incomplete_plans), 'incomplete_plans should be an array');
    assert.strictEqual(typeof result.plan_count, 'number', 'plan_count should be a number');
    assert.strictEqual(typeof result.incomplete_count, 'number', 'incomplete_count should be a number');
    assert.strictEqual(typeof result.milestone_version, 'string', 'milestone_version should be a string');
    assert.strictEqual(typeof result.milestone_name, 'string', 'milestone_name should be a string');
    assert.strictEqual(typeof result.state_exists, 'boolean', 'state_exists should be a boolean');
    assert.strictEqual(typeof result.roadmap_exists, 'boolean', 'roadmap_exists should be a boolean');

    // Milestone values match fixture
    assert.strictEqual(result.milestone_version, 'v1.0', 'milestone_version should be v1.0');
    assert.ok(result.milestone_name.length > 0, 'milestone_name should not be empty');

    // File existence
    assert.strictEqual(result.state_exists, true, 'STATE.md should exist');
    assert.strictEqual(result.roadmap_exists, true, 'ROADMAP.md should exist');

    // Phase 2 fixture has no PLAN files — plan_count should be 0
    assert.strictEqual(result.plan_count, 0, 'phase 2 fixture should have 0 plans');
    assert.strictEqual(result.incomplete_count, 0, 'phase 2 fixture should have 0 incomplete plans');
  });

  // -------------------------------------------------------------------------
  // Test 3: State transitions through pipeline
  // -------------------------------------------------------------------------

  it('state transitions: begin-phase then execute-phase discovers plans', () => {
    const dir = createMidMilestoneProject();

    // Overwrite ROADMAP with colon-format phase headings so the ROADMAP
    // parser regex (which requires "Phase N: Name") can find phase 3.
    // The default fixture uses em-dash format which the parser does not match.
    const roadmapPath = path.join(dir, '.planning', 'ROADMAP.md');
    fs.writeFileSync(roadmapPath, [
      '# ROADMAP — Test Milestone v1.0',
      '',
      '## Phases',
      '',
      '### Phase 1: Foundation',
      'Status: complete',
      '',
      '### Phase 2: Core Features',
      'Status: in-progress',
      '',
      '### Phase 3: Phase 3 Work',
      'Status: pending',
      '',
    ].join('\n'));

    // Step 1: begin-phase for phase 3
    const beginResult = runGsdTools(
      ['state', 'begin-phase', '--phase', '3', '--name', 'Test Phase'],
      dir
    );
    // begin-phase outputs an object with updated fields
    assert.ok(beginResult, 'begin-phase should return a result');

    // Verify STATE.md was updated with phase 3 info
    const statePath = path.join(dir, '.planning', 'STATE.md');
    assertFileExists(statePath);
    assertFileContains(statePath, 'Phase 3');

    // Step 2: Write a mock PLAN-01.md to phase-03 directory
    writeMockPlan(dir, 3, 1, 'Test Plan');

    // Step 3: Call init execute-phase 3 — verify it discovers the plan
    const execResult = runGsdTools(['init', 'execute-phase', '3'], dir);
    assert.strictEqual(execResult.phase_found, true, 'phase 3 should be found after creating dir');
    assert.ok(Array.isArray(execResult.plans), 'plans should be an array');
    assert.strictEqual(execResult.plans.length, 1, 'should discover 1 plan');
    assert.ok(
      execResult.plans[0].includes('PLAN'),
      'plan filename should contain PLAN'
    );

    // Step 4: Verify incomplete_plans includes the plan (no SUMMARY yet)
    assert.ok(Array.isArray(execResult.incomplete_plans), 'incomplete_plans should be an array');
    assert.strictEqual(
      execResult.incomplete_plans.length,
      1,
      'plan without SUMMARY should be in incomplete_plans'
    );
    assert.strictEqual(execResult.incomplete_count, 1, 'incomplete_count should be 1');
  });

  // -------------------------------------------------------------------------
  // Test 4: Plan discovery with multiple plans
  // -------------------------------------------------------------------------

  it('execute-phase discovers multiple plans and tracks incomplete ones', () => {
    const dir = createMidMilestoneProject();

    // Write PLAN-01.md and PLAN-02.md to phase-02
    writeMockPlan(dir, 2, 1, 'First Plan');
    writeMockPlan(dir, 2, 2, 'Second Plan');

    // Call init execute-phase 2
    const result = runGsdTools(['init', 'execute-phase', '2'], dir);

    assert.strictEqual(result.phase_found, true, 'phase 2 should be found');
    assert.strictEqual(result.plan_count, 2, 'plan_count should be 2');
    assert.ok(Array.isArray(result.plans), 'plans should be an array');
    assert.strictEqual(result.plans.length, 2, 'should discover 2 plans');

    // Both should be incomplete (no SUMMARY files)
    assert.strictEqual(
      result.incomplete_plans.length,
      2,
      'both plans should be incomplete (no SUMMARY files)'
    );
    assert.strictEqual(result.incomplete_count, 2, 'incomplete_count should be 2');

    // Now add a SUMMARY for plan 1 — only plan 2 should remain incomplete
    writeMockSummary(dir, 2, 1);

    const result2 = runGsdTools(['init', 'execute-phase', '2'], dir);
    assert.strictEqual(result2.plan_count, 2, 'plan_count should still be 2');
    assert.strictEqual(
      result2.incomplete_plans.length,
      1,
      'only plan 2 should be incomplete after adding SUMMARY-01'
    );
    assert.strictEqual(result2.incomplete_count, 1, 'incomplete_count should be 1');
    assert.ok(
      result2.incomplete_plans[0].includes('02'),
      'remaining incomplete plan should be plan 02'
    );
  });

  // -------------------------------------------------------------------------
  // Test 5: plan-phase for phase without directory (ROADMAP fallback)
  // -------------------------------------------------------------------------

  it('plan-phase falls back to ROADMAP when phase directory does not exist', () => {
    const dir = createMidMilestoneProject();

    // Overwrite ROADMAP with colon-format phase headings so the ROADMAP
    // parser regex (which requires "Phase N: Name") can find phase 3.
    const roadmapPath = path.join(dir, '.planning', 'ROADMAP.md');
    fs.writeFileSync(roadmapPath, [
      '# ROADMAP — Test Milestone v1.0',
      '',
      '## Phases',
      '',
      '### Phase 1: Foundation',
      'Status: complete',
      '',
      '### Phase 2: Core Features',
      'Status: in-progress',
      '',
      '### Phase 3: Phase 3 Work',
      'Status: pending',
      '',
    ].join('\n'));

    // Phase 3 is in ROADMAP as "pending" but has no directory on disk
    const phase3Dir = path.join(dir, '.planning', 'phases', 'phase-03');
    assert.ok(
      !fs.existsSync(phase3Dir),
      'phase-03 directory should not exist in the fixture'
    );

    const result = runGsdTools(['init', 'plan-phase', '3'], dir);

    // Phase should be found via ROADMAP fallback
    assert.strictEqual(result.phase_found, true, 'phase_found should be true via ROADMAP fallback');

    // phase_dir should be null (no directory on disk)
    assert.strictEqual(result.phase_dir, null, 'phase_dir should be null when directory does not exist');

    // Phase metadata should still be populated from ROADMAP
    assert.ok(
      typeof result.phase_number === 'number' || typeof result.phase_number === 'string',
      'phase_number should be present from ROADMAP'
    );
    assert.strictEqual(typeof result.phase_name, 'string', 'phase_name should be a string from ROADMAP');
    assert.ok(result.phase_name.length > 0, 'phase_name should not be empty');
    assert.strictEqual(typeof result.phase_slug, 'string', 'phase_slug should be a string');

    // No artifacts since directory does not exist
    assert.strictEqual(result.has_research, false, 'has_research should be false');
    assert.strictEqual(result.has_context, false, 'has_context should be false');
    assert.strictEqual(result.has_reviews, false, 'has_reviews should be false');
    assert.strictEqual(result.has_plans, false, 'has_plans should be false');
    assert.strictEqual(result.plan_count, 0, 'plan_count should be 0');

    // Model fields still populated
    assert.ok(result.planner_model, 'planner_model should be set even without directory');
    assert.ok(result.checker_model, 'checker_model should be set even without directory');
  });
});
