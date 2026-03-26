/**
 * Integration tests — GSD CLI command chain and state progression
 *
 * Validates INTG-01: the GSD pipeline works as a composed system,
 * not just individual commands.
 */

process.env.GSD_TEST_MODE = '1';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempGitProject, cleanup } = require('./helpers.cjs');

// ─── Describe 1: GSD CLI command chain ──────────────────────────────────────

describe('GSD CLI command chain', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject('integ-chain-');

    // Populate realistic .planning/ state
    const planningDir = path.join(tmpDir, '.planning');

    fs.writeFileSync(
      path.join(planningDir, 'ROADMAP.md'),
      [
        '# Roadmap',
        '',
        '## Phase 1: Foundation',
        '**Goal:** Set up project scaffolding',
        '**Requirements:** TEST-01',
        '**Success Criteria:** All scaffolding in place',
        '**Plans:** TBD',
        '',
      ].join('\n')
    );

    fs.writeFileSync(
      path.join(planningDir, 'STATE.md'),
      [
        '# State',
        '',
        '**Current Phase:** 1',
        '**Status:** planning',
        '',
      ].join('\n')
    );

    fs.writeFileSync(
      path.join(planningDir, 'config.json'),
      JSON.stringify({ model_profile: 'balanced', commit_docs: false }, null, 2)
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('init resume returns valid JSON with project state', () => {
    const result = runGsdTools(['init', 'resume'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.state_exists, true);
    assert.equal(data.roadmap_exists, true);
    assert.equal(typeof data.commit_docs, 'boolean');
  });

  it('init phase-op returns phase metadata for existing phase', () => {
    const result = runGsdTools(['init', 'phase-op', '1'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.phase_found, true);
    assert.ok(
      data.phase_number === '1' || data.phase_number === '01',
      `Expected phase_number "1" or "01", got "${data.phase_number}"`
    );
  });

  it('state update modifies STATE.md field', () => {
    const result = runGsdTools(['state', 'update', 'Status', 'executing'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const stateContent = fs.readFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      'utf-8'
    );
    assert.ok(
      stateContent.includes('executing'),
      'STATE.md should contain "executing" after update'
    );
  });

  it('state load returns current state after update', () => {
    // First update the state
    runGsdTools(['state', 'update', 'Status', 'executing'], tmpDir);

    // Then load it
    const result = runGsdTools(['state', 'load'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.state_exists, true);
    assert.equal(data.roadmap_exists, true);
  });

  it('CLI chain executes in sequence without errors', () => {
    // Step 1: init resume
    const resume = runGsdTools(['init', 'resume'], tmpDir, { HOME: tmpDir });
    assert.ok(resume.success, `init resume failed: ${resume.error}`);

    // Step 2: init phase-op 1
    const phaseOp = runGsdTools(['init', 'phase-op', '1'], tmpDir, { HOME: tmpDir });
    assert.ok(phaseOp.success, `init phase-op failed: ${phaseOp.error}`);

    // Step 3: state update Status executing
    const stateUp = runGsdTools(['state', 'update', 'Status', 'executing'], tmpDir);
    assert.ok(stateUp.success, `state update failed: ${stateUp.error}`);

    // Step 4: create a dummy SUMMARY.md for verify-summary
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      [
        '# Summary',
        '',
        '## What was built',
        'Created `.planning/phases/01-test/01-01-PLAN.md` for testing.',
        '',
        '## Self-Check',
        'All pass.',
        '',
      ].join('\n')
    );

    // Create the file referenced in the summary so verify-summary can find it
    fs.writeFileSync(
      path.join(phaseDir, '01-01-PLAN.md'),
      '---\nphase: 01\nplan: 01\ntype: execute\nwave: 1\n---\n# Plan\n'
    );

    // Step 5: verify-summary
    const verify = runGsdTools(
      ['verify-summary', '.planning/phases/01-test/01-01-SUMMARY.md'],
      tmpDir
    );
    assert.ok(verify.success, `verify-summary failed: ${verify.error}`);

    const verifyData = JSON.parse(verify.output);
    assert.equal(verifyData.checks.summary_exists, true);
  });
});

// ─── Describe 2: GSD state progression ──────────────────────────────────────

describe('GSD state progression', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject('integ-state-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('fresh project: init resume reports no state', () => {
    // createTempGitProject creates .planning/ with PROJECT.md but no STATE.md or ROADMAP.md
    const result = runGsdTools(['init', 'resume'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.state_exists, false);
    assert.equal(data.roadmap_exists, false);
  });

  it('after planning: ROADMAP + STATE exist, plan-phase resolves', () => {
    const planningDir = path.join(tmpDir, '.planning');

    // Write ROADMAP with Phase 1
    fs.writeFileSync(
      path.join(planningDir, 'ROADMAP.md'),
      [
        '# Roadmap',
        '',
        '## Phase 1: Testing',
        '**Goal:** Test integration',
        '**Requirements:** TEST-01',
        '**Success Criteria:** Tests pass',
        '**Plans:** TBD',
        '',
      ].join('\n')
    );

    // Write STATE.md
    fs.writeFileSync(
      path.join(planningDir, 'STATE.md'),
      [
        '# State',
        '',
        '**Current Phase:** 1',
        '**Status:** planning',
        '',
      ].join('\n')
    );

    // Create phase directory with a plan file
    const phaseDir = path.join(planningDir, 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(
      path.join(phaseDir, '01-01-PLAN.md'),
      '---\nphase: 01\nplan: 01\ntype: execute\nwave: 1\n---\n# Plan\nTest plan.\n'
    );

    // Write config so loadConfig finds it
    fs.writeFileSync(
      path.join(planningDir, 'config.json'),
      JSON.stringify({ model_profile: 'balanced', commit_docs: false }, null, 2)
    );

    const result = runGsdTools(['init', 'plan-phase', '1'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.phase_found, true);
    // plans array should include the plan file we created
    assert.ok(
      Array.isArray(data.plans) || typeof data.plan_count === 'number',
      'Expected plans array or plan_count in response'
    );
  });

  it('after execution: state updated, verify-summary validates', () => {
    const planningDir = path.join(tmpDir, '.planning');

    // Set up planning-stage state
    fs.writeFileSync(
      path.join(planningDir, 'ROADMAP.md'),
      '# Roadmap\n\n## Phase 1: Testing\n**Goal:** Test\n**Requirements:** TEST-01\n'
    );
    fs.writeFileSync(
      path.join(planningDir, 'STATE.md'),
      '# State\n\n**Current Phase:** 1\n**Status:** planning\n'
    );
    fs.writeFileSync(
      path.join(planningDir, 'config.json'),
      JSON.stringify({ model_profile: 'balanced', commit_docs: false }, null, 2)
    );

    // Transition to executing
    const updateResult = runGsdTools(['state', 'update', 'Status', 'executing'], tmpDir);
    assert.ok(updateResult.success, `state update failed: ${updateResult.error}`);

    // Create phase dir and summary
    const phaseDir = path.join(planningDir, 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    // Create a PLAN.md so verify-summary can find the referenced file
    fs.writeFileSync(
      path.join(phaseDir, '01-01-PLAN.md'),
      '---\nphase: 01\nplan: 01\ntype: execute\nwave: 1\n---\n# Plan\n'
    );

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      [
        '# Summary',
        '',
        '## What was built',
        'Implemented `.planning/phases/01-test/01-01-PLAN.md`.',
        '',
        '## Self-Check',
        'All pass.',
        '',
      ].join('\n')
    );

    const verifyResult = runGsdTools(
      ['verify-summary', '.planning/phases/01-test/01-01-SUMMARY.md'],
      tmpDir
    );
    assert.ok(verifyResult.success, `verify-summary failed: ${verifyResult.error}`);

    const data = JSON.parse(verifyResult.output);
    assert.equal(data.checks.summary_exists, true);
  });

  it('missing phase directory: init phase-op returns phase_found false', () => {
    const result = runGsdTools(['init', 'phase-op', '99'], tmpDir, { HOME: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const data = JSON.parse(result.output);
    assert.equal(data.phase_found, false);
  });
});
