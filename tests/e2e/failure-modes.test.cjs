/**
 * E2E Tests — Failure modes and error codes (E2E-11)
 *
 * Validates error detection in `validate health`, command error handling,
 * and structured error/warning object formats across corrupt, broken,
 * and edge-case project states.
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
  createMidMilestoneProject,
  createCorruptProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GSD_TOOLS = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

/** Manually created temp dirs that need cleanup outside the fixture registry. */
const _manualTmpDirs = [];

/**
 * Run gsd-tools with --raw flag, parse and return JSON output.
 * Throws on non-zero exit (use runGsdToolsSafe for expected failures).
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
 * Run gsd-tools safely — catches non-zero exits and attempts to parse output.
 * Returns { success, data?, raw?, exitCode? }.
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

/**
 * Create a bare temp directory with no .planning/ at all.
 * Registered for manual cleanup in afterEach.
 */
function createBareDir() {
  const dir = path.join(
    fs.realpathSync(os.tmpdir()),
    `gsd-e2e-bare-${crypto.randomBytes(4).toString('hex')}`
  );
  fs.mkdirSync(dir, { recursive: true });
  _manualTmpDirs.push(dir);
  return dir;
}

/**
 * Create a temp directory with .planning/ containing STATE.md and ROADMAP.md
 * but missing PROJECT.md entirely.
 */
function createMissingProjectMdDir() {
  const dir = path.join(
    fs.realpathSync(os.tmpdir()),
    `gsd-e2e-noproject-${crypto.randomBytes(4).toString('hex')}`
  );
  fs.mkdirSync(path.join(dir, '.planning'), { recursive: true });

  fs.writeFileSync(path.join(dir, '.planning', 'STATE.md'), [
    '---',
    'gsd_state_version: 1.0',
    'milestone: v0.1',
    'milestone_name: No Project Test',
    'status: active',
    'last_updated: "2026-01-01T00:00:00.000Z"',
    'last_activity: 2026-01-01 -- created',
    'progress:',
    '  total_phases: 0',
    '  completed_phases: 0',
    '  total_plans: 0',
    '  completed_plans: 0',
    '---',
    '',
    '# STATE',
    '',
    '## Current Position',
    'Phase: none',
    '',
  ].join('\n'));

  fs.writeFileSync(path.join(dir, '.planning', 'ROADMAP.md'), [
    '# Roadmap',
    '',
    '## Current Milestone',
    '**v0.1 No Project Test**',
    '',
  ].join('\n'));

  _manualTmpDirs.push(dir);
  return dir;
}

// ---------------------------------------------------------------------------
// Tests — validate health error detection
// ---------------------------------------------------------------------------

describe('validate health error detection', () => {
  afterEach(() => {
    fixtureCleanup();
    for (const dir of _manualTmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    _manualTmpDirs.length = 0;
  });

  // -------------------------------------------------------------------------
  // Test 1: Missing .planning/ directory entirely
  // -------------------------------------------------------------------------

  it('reports E001 when .planning/ directory is missing', () => {
    const dir = createBareDir();

    const result = runGsdTools(['validate', 'health'], dir);

    assert.strictEqual(result.status, 'broken', 'bare dir should report broken status');
    assert.ok(Array.isArray(result.errors), 'errors should be an array');
    assert.ok(result.errors.length > 0, 'should have at least one error');

    const errorCodes = result.errors.map(e => e.code);
    assert.ok(errorCodes.includes('E001'), 'errors should include E001 for missing .planning/');
  });

  // -------------------------------------------------------------------------
  // Test 2: Missing PROJECT.md
  // -------------------------------------------------------------------------

  it('reports E002 when PROJECT.md is missing', () => {
    const dir = createMissingProjectMdDir();

    const result = runGsdTools(['validate', 'health'], dir);

    assert.strictEqual(result.status, 'broken', 'missing PROJECT.md should report broken status');
    assert.ok(Array.isArray(result.errors), 'errors should be an array');

    const errorCodes = result.errors.map(e => e.code);
    assert.ok(errorCodes.includes('E002'), 'errors should include E002 for missing PROJECT.md');
  });

  // -------------------------------------------------------------------------
  // Test 3: Missing ROADMAP.md
  // -------------------------------------------------------------------------

  it('reports E003 when ROADMAP.md is missing', () => {
    const dir = createCorruptProject('missing-roadmap');

    const result = runGsdTools(['validate', 'health'], dir);

    assert.strictEqual(result.status, 'broken', 'missing ROADMAP.md should report broken status');
    assert.ok(Array.isArray(result.errors), 'errors should be an array');

    const errorCodes = result.errors.map(e => e.code);
    assert.ok(errorCodes.includes('E003'), 'errors should include E003 for missing ROADMAP.md');
  });

  // -------------------------------------------------------------------------
  // Test 4: Invalid YAML in STATE.md
  // -------------------------------------------------------------------------

  it('reports broken or degraded for invalid YAML in STATE.md', () => {
    const dir = createCorruptProject('invalid-yaml');

    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(
      ['broken', 'degraded'].includes(result.status),
      `invalid YAML should be broken or degraded, got "${result.status}"`
    );
    assert.ok(Array.isArray(result.errors), 'errors should be an array');
    const allIssues = [...result.errors, ...result.warnings];
    assert.ok(allIssues.length > 0, 'invalid YAML should produce at least one issue');
  });

  // -------------------------------------------------------------------------
  // Test 5: Healthy empty project
  // -------------------------------------------------------------------------

  it('reports healthy or degraded for well-formed empty project', () => {
    const dir = createEmptyProject();

    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(
      ['healthy', 'degraded'].includes(result.status),
      `well-formed project should be healthy or degraded, got "${result.status}"`
    );
    assert.ok(Array.isArray(result.errors), 'errors should be an array');
    assert.strictEqual(result.errors.length, 0, 'well-formed project should have 0 errors');
  });

  // -------------------------------------------------------------------------
  // Test 6: Healthy mid-milestone project
  // -------------------------------------------------------------------------

  it('reports healthy or degraded for mid-milestone project with valid repairable_count', () => {
    const dir = createMidMilestoneProject();

    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(
      ['healthy', 'degraded'].includes(result.status),
      `mid-milestone should be healthy or degraded, got "${result.status}"`
    );
    assert.strictEqual(typeof result.repairable_count, 'number', 'repairable_count should be a number');
    assert.ok(result.repairable_count >= 0, 'repairable_count should be non-negative');
  });
});

// ---------------------------------------------------------------------------
// Tests — command error handling
// ---------------------------------------------------------------------------

describe('command error handling', () => {
  afterEach(() => {
    fixtureCleanup();
    for (const dir of _manualTmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    _manualTmpDirs.length = 0;
  });

  // -------------------------------------------------------------------------
  // Test 7: Non-existent cwd
  // -------------------------------------------------------------------------

  it('fails when cwd does not exist', () => {
    const fakeCwd = path.join(
      fs.realpathSync(os.tmpdir()),
      `gsd-nonexistent-dir-${crypto.randomBytes(4).toString('hex')}`
    );

    const result = runGsdToolsSafe(['init', 'new-project'], fakeCwd);

    // execFileSync should throw ENOENT or the command should return error JSON
    assert.strictEqual(result.success, false, 'non-existent cwd should fail');
  });

  // -------------------------------------------------------------------------
  // Test 8: state begin-phase missing required flags
  // -------------------------------------------------------------------------

  it('fails when state begin-phase is called without required flags', () => {
    const dir = createMidMilestoneProject();

    // Call begin-phase without --phase, --name, --plans
    const result = runGsdToolsSafe(['state', 'begin-phase'], dir);

    // Should either throw (non-zero exit) or return error JSON
    if (result.success && result.data) {
      // If it returned JSON, it should indicate an error condition
      // (e.g., null phase, missing fields, or empty updated array)
      const hasError = result.data.error ||
        result.data.phase === null ||
        result.data.phase === undefined ||
        (Array.isArray(result.data.updated) && result.data.updated.length === 0);
      assert.ok(hasError, 'begin-phase without flags should indicate an error or have no updates');
    } else {
      // Non-zero exit is also acceptable
      assert.strictEqual(result.success, false, 'begin-phase without flags should fail');
    }
  });

  // -------------------------------------------------------------------------
  // Test 9: Unknown command produces error
  // -------------------------------------------------------------------------

  it('fails for unknown subcommand', () => {
    const dir = createEmptyProject();

    const result = runGsdToolsSafe(['init', 'nonexistent-workflow'], dir);

    assert.strictEqual(result.success, false, 'unknown subcommand should fail');
    assert.ok(
      result.exitCode !== 0 || (result.raw && result.raw.length > 0),
      'should have non-zero exit or error output'
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — error and warning object structure
// ---------------------------------------------------------------------------

describe('error and warning object structure', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 10: Error objects have code and message
  // -------------------------------------------------------------------------

  it('error objects have string code starting with E and string message', () => {
    const dir = createCorruptProject('missing-roadmap');

    const result = runGsdTools(['validate', 'health'], dir);

    assert.ok(result.errors.length > 0, 'missing-roadmap should produce errors');

    for (const err of result.errors) {
      assert.strictEqual(typeof err.code, 'string', 'error.code should be a string');
      assert.strictEqual(typeof err.message, 'string', 'error.message should be a string');
      assert.ok(err.code.startsWith('E'), `error code "${err.code}" should start with E`);
      assert.ok(err.message.length > 0, 'error.message should be non-empty');
    }
  });

  // -------------------------------------------------------------------------
  // Test 11: Error objects have fix field
  // -------------------------------------------------------------------------

  it('error objects include a fix suggestion', () => {
    const dir = createCorruptProject('missing-roadmap');

    const result = runGsdTools(['validate', 'health'], dir);

    for (const err of result.errors) {
      assert.strictEqual(typeof err.fix, 'string', 'error.fix should be a string');
      assert.ok(err.fix.length > 0, 'error.fix should be non-empty');
    }
  });

  // -------------------------------------------------------------------------
  // Test 12: Warning objects have code starting with W and string message
  // -------------------------------------------------------------------------

  it('warning objects have string code starting with W and string message', () => {
    const dir = createEmptyProject();

    const result = runGsdTools(['validate', 'health'], dir);

    // Empty project may have warnings about missing sections (W001) or missing config (W003)
    for (const warning of result.warnings) {
      assert.strictEqual(typeof warning.code, 'string', 'warning.code should be a string');
      assert.strictEqual(typeof warning.message, 'string', 'warning.message should be a string');
      assert.ok(warning.code.startsWith('W'), `warning code "${warning.code}" should start with W`);
      assert.ok(warning.message.length > 0, 'warning.message should be non-empty');
    }
  });

  // -------------------------------------------------------------------------
  // Test 13: Info objects have code starting with I and string message
  // -------------------------------------------------------------------------

  it('info objects have string code starting with I and string message', () => {
    const dir = createEmptyProject();

    const result = runGsdTools(['validate', 'health'], dir);

    for (const item of result.info) {
      assert.strictEqual(typeof item.code, 'string', 'info.code should be a string');
      assert.strictEqual(typeof item.message, 'string', 'info.message should be a string');
      assert.ok(item.code.startsWith('I'), `info code "${item.code}" should start with I`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 14: E001 early-exit produces minimal response with no warnings/info
  // -------------------------------------------------------------------------

  it('E001 early-exit returns errors only with empty warnings and info', () => {
    const dir = path.join(
      fs.realpathSync(os.tmpdir()),
      `gsd-e2e-bare-${crypto.randomBytes(4).toString('hex')}`
    );
    fs.mkdirSync(dir, { recursive: true });

    try {
      const result = runGsdTools(['validate', 'health'], dir);

      assert.strictEqual(result.status, 'broken', 'E001 should be broken');
      assert.strictEqual(result.errors.length, 1, 'E001 early-exit should have exactly 1 error');
      assert.strictEqual(result.errors[0].code, 'E001', 'the single error should be E001');
      assert.strictEqual(result.warnings.length, 0, 'E001 early-exit should have 0 warnings');
      assert.strictEqual(result.info.length, 0, 'E001 early-exit should have 0 info');
      assert.strictEqual(result.repairable_count, 0, 'E001 early-exit should have 0 repairable');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Test 15: Multiple errors can coexist in a single validation
  // -------------------------------------------------------------------------

  it('multiple errors coexist when both PROJECT.md and ROADMAP.md are missing', () => {
    // Create a dir with .planning/ containing only STATE.md — no PROJECT.md, no ROADMAP.md
    const dir = path.join(
      fs.realpathSync(os.tmpdir()),
      `gsd-e2e-multi-err-${crypto.randomBytes(4).toString('hex')}`
    );
    fs.mkdirSync(path.join(dir, '.planning'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.planning', 'STATE.md'), [
      '---',
      'gsd_state_version: 1.0',
      'milestone: v0.1',
      'status: active',
      '---',
      '',
      '# STATE',
      '',
    ].join('\n'));

    try {
      const result = runGsdTools(['validate', 'health'], dir);

      assert.strictEqual(result.status, 'broken', 'multiple missing files should be broken');
      assert.ok(result.errors.length >= 2, 'should have at least 2 errors');

      const errorCodes = result.errors.map(e => e.code);
      assert.ok(errorCodes.includes('E002'), 'should include E002 for missing PROJECT.md');
      assert.ok(errorCodes.includes('E003'), 'should include E003 for missing ROADMAP.md');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
