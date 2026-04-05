/**
 * E2E Pipeline Tests — Verify & Ship Commands
 *
 * Tests the `init verify-work` and `init phase-op` gsd-tools subcommands
 * against mid-milestone and completed-milestone fixtures.
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
  createCompletedMilestoneProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

const {
  assertFileExists,
  assertFileContains,
  assertValidFrontmatter,
} = require('./assertions.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GSD_TOOLS = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

function runGsdTools(args, cwd) {
  const result = execFileSync(process.execPath, [GSD_TOOLS, ...args, '--raw'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  });
  return JSON.parse(result);
}

/**
 * Resolve the real path of a fixture directory.
 * On macOS, os.tmpdir() returns /var/... which is a symlink to /private/var/...
 * gsd-tools resolves to the real path, so we must do the same for comparisons.
 */
function realDir(dir) {
  return fs.realpathSync(dir);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pipeline — Verify & Ship', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -----------------------------------------------------------------------
  // init verify-work
  // -----------------------------------------------------------------------

  describe('init verify-work', () => {
    it('returns correct JSON shape for a completed phase', () => {
      const dir = createMidMilestoneProject();

      const result = runGsdTools(['init', 'verify-work', '1'], dir);

      // Structural assertions — every field from cmdInitVerifyWork
      assert.strictEqual(typeof result.phase_found, 'boolean', 'phase_found should be boolean');
      assert.strictEqual(result.phase_found, true, 'phase 1 should be found');
      assert.strictEqual(typeof result.phase_dir, 'string', 'phase_dir should be a string for existing phase');
      assert.ok(
        typeof result.phase_number === 'number' || typeof result.phase_number === 'string',
        'phase_number should be number or string'
      );
      assert.strictEqual(typeof result.planner_model, 'string', 'planner_model should be a string');
      assert.strictEqual(typeof result.checker_model, 'string', 'checker_model should be a string');
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be boolean');
      assert.strictEqual(typeof result.has_verification, 'boolean', 'has_verification should be boolean');

      // Mid-milestone fixture has commit_docs: false in config.json
      assert.strictEqual(result.commit_docs, false, 'mid-milestone config sets commit_docs to false');

      // Phase 1 directory exists but has no VERIFICATION.md
      assert.strictEqual(result.has_verification, false, 'phase 1 should have no verification yet');

      // withProjectRoot injects project_root (resolve symlinks for macOS)
      assert.strictEqual(result.project_root, realDir(dir), 'project_root should match fixture dir');
    });

    it('detects existing VERIFICATION.md in phase directory', () => {
      const dir = createMidMilestoneProject();

      // Write a VERIFICATION.md into phase-01
      const verificationDir = path.join(dir, '.planning', 'phases', 'phase-01');
      fs.mkdirSync(verificationDir, { recursive: true });
      fs.writeFileSync(path.join(verificationDir, 'VERIFICATION.md'), [
        '---',
        'result: pass',
        '---',
        '# Verification — Phase 1',
        '',
        'All criteria passed.',
        '',
      ].join('\n'));

      // Commit the new file so gsd-tools sees a clean git state
      execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'pipe' });
      execFileSync('git', ['commit', '-m', 'add verification'], { cwd: dir, stdio: 'pipe' });

      const result = runGsdTools(['init', 'verify-work', '1'], dir);

      assert.strictEqual(result.phase_found, true, 'phase 1 should be found');
      assert.strictEqual(result.has_verification, true, 'should detect VERIFICATION.md');
    });

    it('returns phase_found false and phase_dir null for non-existent phase', () => {
      const dir = createMidMilestoneProject();

      // Phase 99 does not exist in directory or ROADMAP
      const result = runGsdTools(['init', 'verify-work', '99'], dir);

      assert.strictEqual(result.phase_found, false, 'non-existent phase should not be found');
      assert.strictEqual(result.phase_dir, null, 'phase_dir should be null');
      assert.strictEqual(result.phase_number, null, 'phase_number should be null');
      assert.strictEqual(result.phase_name, null, 'phase_name should be null');
      assert.strictEqual(result.has_verification, false, 'has_verification should be false');
    });
  });

  // -----------------------------------------------------------------------
  // Ship artifact assembly (file-level verification)
  // -----------------------------------------------------------------------

  describe('Ship artifact assembly', () => {
    it('verifies complete phase artifacts exist with expected content', () => {
      const dir = createMidMilestoneProject();

      // Write complete artifacts into phase-01
      const phaseDir = path.join(dir, '.planning', 'phases', 'phase-01');
      fs.mkdirSync(phaseDir, { recursive: true });

      // 01-PLAN.md with frontmatter (uses *-PLAN.md naming convention)
      fs.writeFileSync(path.join(phaseDir, '01-PLAN.md'), [
        '---',
        'plan_id: PLAN-01',
        'phase: 1',
        'status: complete',
        '---',
        '# Plan 01 — Setup & Configuration',
        '',
        '## Tasks',
        '- [x] Configure project',
        '- [x] Set up dependencies',
        '',
      ].join('\n'));

      // 01-SUMMARY.md (uses *-SUMMARY.md naming convention)
      fs.writeFileSync(path.join(phaseDir, '01-SUMMARY.md'), [
        '# Summary 01 — Setup & Configuration',
        '',
        '## Outcome',
        'All tasks completed successfully.',
        '',
      ].join('\n'));

      // VERIFICATION.md with frontmatter
      fs.writeFileSync(path.join(phaseDir, 'VERIFICATION.md'), [
        '---',
        'result: pass',
        'verified_by: e2e-test',
        '---',
        '# Verification — Phase 1',
        '',
        'All acceptance criteria passed.',
        '',
      ].join('\n'));

      // Assert all files exist
      assertFileExists(path.join(phaseDir, '01-PLAN.md'));
      assertFileExists(path.join(phaseDir, '01-SUMMARY.md'));
      assertFileExists(path.join(phaseDir, 'VERIFICATION.md'));

      // Assert content
      assertFileContains(path.join(phaseDir, '01-PLAN.md'), 'plan_id: PLAN-01');
      assertFileContains(path.join(phaseDir, '01-PLAN.md'), 'Setup & Configuration');
      assertFileContains(path.join(phaseDir, '01-SUMMARY.md'), 'All tasks completed successfully.');
      assertFileContains(path.join(phaseDir, 'VERIFICATION.md'), 'All acceptance criteria passed.');

      // Assert 01-PLAN.md has valid frontmatter
      assertValidFrontmatter(path.join(phaseDir, '01-PLAN.md'), ['plan_id', 'phase', 'status']);

      // Assert VERIFICATION.md has valid frontmatter
      assertValidFrontmatter(path.join(phaseDir, 'VERIFICATION.md'), ['result']);
    });
  });

  // -----------------------------------------------------------------------
  // init phase-op
  // -----------------------------------------------------------------------

  describe('init phase-op', () => {
    it('returns correct plan/summary counts for mid-milestone phase', () => {
      const dir = createMidMilestoneProject();

      // The default mid-milestone fixture has no PLAN files in phase-01.
      // Write 01-PLAN.md (the *-PLAN.md naming convention that filterPlanFiles matches).
      const phaseDir = path.join(dir, '.planning', 'phases', 'phase-01');
      fs.mkdirSync(phaseDir, { recursive: true });
      fs.writeFileSync(path.join(phaseDir, '01-PLAN.md'), [
        '---',
        'plan_id: PLAN-01',
        'phase: 1',
        'status: complete',
        '---',
        '# Plan 01',
        '',
        '## Tasks',
        '- [x] Task one',
        '',
      ].join('\n'));

      // Commit so git state is clean
      execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'pipe' });
      execFileSync('git', ['commit', '-m', 'add plan'], { cwd: dir, stdio: 'pipe' });

      const result = runGsdTools(['init', 'phase-op', '1'], dir);

      assert.strictEqual(result.phase_found, true, 'phase 1 should be found');
      assert.strictEqual(typeof result.plan_count, 'number', 'plan_count should be a number');
      assert.ok(result.plan_count >= 1, 'plan_count should be >= 1 after adding 01-PLAN.md');
      assert.strictEqual(result.has_plans, true, 'has_plans should be true');
      assert.strictEqual(typeof result.has_verification, 'boolean', 'has_verification should be boolean');
      assert.strictEqual(typeof result.phase_dir, 'string', 'phase_dir should be a string');
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be boolean');
      assert.strictEqual(result.commit_docs, false, 'mid-milestone config has commit_docs: false');

      // File paths should be present
      assert.strictEqual(typeof result.state_path, 'string', 'state_path should be a string');
      assert.strictEqual(typeof result.roadmap_path, 'string', 'roadmap_path should be a string');
      assert.strictEqual(typeof result.requirements_path, 'string', 'requirements_path should be a string');

      // Boolean/existence flags
      assert.strictEqual(result.roadmap_exists, true, 'roadmap should exist');
      assert.strictEqual(result.planning_exists, true, 'planning dir should exist');
    });

    it('returns correct data for completed milestone', () => {
      const dir = createCompletedMilestoneProject();

      // Completed fixture has no PLAN files — add one for phase 1
      // Uses *-PLAN.md naming convention that filterPlanFiles matches
      const phaseDir = path.join(dir, '.planning', 'phases', 'phase-01');
      fs.mkdirSync(phaseDir, { recursive: true });
      fs.writeFileSync(path.join(phaseDir, '01-PLAN.md'), [
        '---',
        'plan_id: PLAN-01',
        'phase: 1',
        'status: complete',
        '---',
        '# Plan 01 — Setup',
        '',
        '## Tasks',
        '- [x] Setup task one',
        '',
      ].join('\n'));

      // Commit the plan file
      execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'pipe' });
      execFileSync('git', ['commit', '-m', 'add plan for completed milestone'], { cwd: dir, stdio: 'pipe' });

      const result = runGsdTools(['init', 'phase-op', '1'], dir);

      assert.strictEqual(result.phase_found, true, 'phase 1 should be found');
      assert.strictEqual(result.has_plans, true, 'has_plans should be true');
      assert.ok(result.plan_count >= 1, 'plan_count should be >= 1');

      // Completed milestone fixture has no config.json — defaults apply
      assert.strictEqual(result.commit_docs, true, 'default commit_docs is true when no config.json');
    });
  });
});
