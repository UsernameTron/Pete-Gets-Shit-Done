/**
 * E2E Tests — Edge cases with corrupt/empty projects (E2E-12)
 *
 * Validates error paths, boundary conditions, and degenerate inputs
 * across corrupt project fixtures, empty/minimal projects, edge-case
 * inputs, and completed milestone states.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const {
  createEmptyProject,
  createCompletedMilestoneProject,
  createCorruptProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GSD_TOOLS = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

/**
 * Run gsd-tools with --raw flag, parse and return JSON output.
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
 * Run gsd-tools safely — captures both success and failure cases.
 * Returns { success, data, exitCode } or { success, raw, exitCode }.
 */
function runGsdToolsSafe(args, cwd) {
  try {
    const result = execFileSync(process.execPath, [GSD_TOOLS, ...args, '--raw'], {
      cwd,
      encoding: 'utf-8',
      timeout: 15000,
    });
    return { success: true, data: JSON.parse(result) };
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    try {
      return { success: false, data: JSON.parse(output), exitCode: err.status };
    } catch {
      return { success: false, raw: output, exitCode: err.status };
    }
  }
}

// Track bare temp directories for manual cleanup (not registered with fixtureCleanup)
const _bareDirs = [];

function createBareDir() {
  const dir = path.join(
    fs.realpathSync(os.tmpdir()),
    `gsd-e2e-bare-${crypto.randomBytes(4).toString('hex')}`
  );
  fs.mkdirSync(dir, { recursive: true });
  _bareDirs.push(dir);
  return dir;
}

function bareDirCleanup() {
  for (const dir of _bareDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  _bareDirs.length = 0;
}

// ---------------------------------------------------------------------------
// Tests — Corrupt project fixture types
// ---------------------------------------------------------------------------

describe('corrupt project edge cases', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: orphan-phase health check
  // -------------------------------------------------------------------------

  it('orphan-phase produces warnings about disk/roadmap mismatches', () => {
    const dir = createCorruptProject('orphan-phase');
    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(
      ['healthy', 'degraded'].includes(result.status),
      `orphan-phase status should be healthy or degraded, got "${result.status}"`
    );
    assert.ok(Array.isArray(result.warnings), 'warnings should be an array');
    // Orphan phase directory (empty dir on disk) should generate at least
    // informational or warning messages about disk/roadmap state
    const allIssues = [...result.warnings, ...result.info];
    assert.ok(allIssues.length > 0, 'orphan-phase should produce at least one warning or info item');
  });

  // -------------------------------------------------------------------------
  // Test 2: version-mismatch health check
  // -------------------------------------------------------------------------

  it('version-mismatch is not healthy — broken or degraded with warnings', () => {
    const dir = createCorruptProject('version-mismatch');
    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(
      result.status !== 'healthy',
      `version-mismatch should NOT be healthy, got "${result.status}"`
    );
    assert.ok(
      ['broken', 'degraded'].includes(result.status),
      `version-mismatch should be broken or degraded, got "${result.status}"`
    );
    const allIssues = [...result.errors, ...result.warnings];
    assert.ok(allIssues.length > 0, 'version-mismatch should have errors or warnings about the mismatch');
  });
});

// ---------------------------------------------------------------------------
// Tests — Empty/minimal project edge cases
// ---------------------------------------------------------------------------

describe('empty and minimal project edge cases', () => {
  afterEach(() => {
    fixtureCleanup();
    bareDirCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 3: completely empty directory — init new-project
  // -------------------------------------------------------------------------

  it('init new-project on bare directory detects no planning and no project', () => {
    const dir = createBareDir();
    const result = runGsdToolsSafe(['init', 'new-project'], dir);

    // Command should succeed and return valid JSON
    assert.ok(result.success || result.data, 'init new-project should return parseable JSON');
    const data = result.data;
    assert.strictEqual(data.project_exists, false, 'project_exists should be false on bare directory');
    assert.strictEqual(data.planning_exists, false, 'planning_exists should be false on bare directory');
  });

  // -------------------------------------------------------------------------
  // Test 4: init progress on empty project
  // -------------------------------------------------------------------------

  it('init progress on empty project returns zero phases', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['init', 'progress'], dir);

    assert.ok(Array.isArray(result.phases), 'phases should be an array');
    assert.strictEqual(result.phase_count, 0, 'phase_count should be 0 on empty project');
  });

  // -------------------------------------------------------------------------
  // Test 5: progress json on empty project
  // -------------------------------------------------------------------------

  it('progress json on empty project returns all-zero aggregates', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['progress', 'json'], dir);

    assert.strictEqual(result.percent, 0, 'percent should be 0');
    assert.strictEqual(result.total_plans, 0, 'total_plans should be 0');
    assert.strictEqual(result.total_summaries, 0, 'total_summaries should be 0');
    assert.ok(Array.isArray(result.phases), 'phases should be an array');
    assert.strictEqual(result.phases.length, 0, 'phases array should be empty');
  });

  // -------------------------------------------------------------------------
  // Test 6: stats json on empty project
  // -------------------------------------------------------------------------

  it('stats json on empty project returns all-zero statistics', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['stats', 'json'], dir);

    assert.strictEqual(result.total_plans, 0, 'total_plans should be 0');
    assert.strictEqual(result.total_summaries, 0, 'total_summaries should be 0');
    assert.strictEqual(result.percent, 0, 'percent should be 0');
    assert.strictEqual(result.requirements_total, 0, 'requirements_total should be 0');
  });
});

// ---------------------------------------------------------------------------
// Tests — Edge case inputs
// ---------------------------------------------------------------------------

describe('edge case inputs', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 7: workstream status on flat project for nonexistent workstream
  // -------------------------------------------------------------------------

  it('workstream status returns found: false for nonexistent workstream on flat project', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['workstream', 'status', 'nonexistent'], dir);

    assert.strictEqual(result.found, false, 'found should be false for nonexistent workstream');
  });

  // -------------------------------------------------------------------------
  // Test 8: init quick with empty description
  // -------------------------------------------------------------------------

  it('init quick with no description returns null slug and null task_dir', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['init', 'quick'], dir);

    assert.strictEqual(result.slug, null, 'slug should be null when description is empty');
    assert.strictEqual(result.description, null, 'description should be null');
    assert.strictEqual(result.task_dir, null, 'task_dir should be null when no slug');
    // quick_id should still be a valid string
    assert.strictEqual(typeof result.quick_id, 'string', 'quick_id should still be a string');
  });

  // -------------------------------------------------------------------------
  // Test 9: init quick with very long description — slug truncation
  // -------------------------------------------------------------------------

  it('init quick truncates slug to 40 characters for long descriptions', () => {
    const dir = createEmptyProject();
    // Build a 200+ character description
    const longDesc = 'This is a deliberately very long description that goes on and on and on to test that the slug generation properly truncates the output to forty characters maximum as specified in the implementation requirements for edge case testing of the GSD tools CLI';
    assert.ok(longDesc.length > 200, `description should be 200+ chars, got ${longDesc.length}`);

    const result = runGsdTools(['init', 'quick', longDesc], dir);

    assert.ok(result.slug.length <= 40, `slug should be at most 40 chars, got ${result.slug.length}: "${result.slug}"`);
    assert.ok(result.slug.length > 0, 'slug should not be empty for a non-empty description');
    assert.ok(!(/[^a-z0-9-]/).test(result.slug), 'slug should contain only lowercase alphanumeric and hyphens');
  });

  // -------------------------------------------------------------------------
  // Test 10: init milestone-op on empty project
  // -------------------------------------------------------------------------

  it('init milestone-op on empty project returns zero phase counts', () => {
    const dir = createEmptyProject();
    const result = runGsdTools(['init', 'milestone-op'], dir);

    assert.strictEqual(result.phase_count, 0, 'phase_count should be 0 on empty project');
    assert.strictEqual(result.completed_phases, 0, 'completed_phases should be 0 on empty project');
    // 0 of 0 phases complete — all_phases_complete can be either true or false
    assert.strictEqual(typeof result.all_phases_complete, 'boolean', 'all_phases_complete should be a boolean');
  });
});

// ---------------------------------------------------------------------------
// Tests — Completed milestone edge cases
// ---------------------------------------------------------------------------

describe('completed milestone edge cases', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 11: init milestone-op on completed project
  // -------------------------------------------------------------------------

  it('init milestone-op on completed project reports all phases complete', () => {
    const dir = createCompletedMilestoneProject();
    const result = runGsdTools(['init', 'milestone-op'], dir);

    assert.strictEqual(result.all_phases_complete, true, 'all_phases_complete should be true');
    assert.ok(result.phase_count >= 1, 'phase_count should be at least 1');
    assert.strictEqual(result.completed_phases, result.phase_count, 'completed_phases should equal phase_count');
  });

  // -------------------------------------------------------------------------
  // Test 12: init progress on completed project — all phases complete
  // -------------------------------------------------------------------------

  it('init progress on completed project shows all phases as complete', () => {
    const dir = createCompletedMilestoneProject();

    // The completed fixture has SUMMARY.md in each phase but no PLAN.md.
    // cmdInitProgress requires plan_count > 0 for 'complete' status.
    // Add PLAN.md to both phases so they register as complete.
    for (const phaseDir of ['phase-01', 'phase-02']) {
      fs.writeFileSync(
        path.join(dir, '.planning', 'phases', phaseDir, 'PLAN.md'),
        '# Plan\n\n## Tasks\n- [x] Done\n'
      );
    }

    const result = runGsdTools(['init', 'progress'], dir);

    assert.ok(Array.isArray(result.phases), 'phases should be an array');
    assert.ok(result.phases.length >= 1, 'should have at least one phase');

    for (const phase of result.phases) {
      assert.strictEqual(
        phase.status,
        'complete',
        `phase ${phase.number} should be complete, got "${phase.status}"`
      );
    }

    assert.strictEqual(result.completed_count, result.phase_count, 'all phases should be complete');
  });
});
