/**
 * Phase coverage tests — targeting uncovered branches in phase.cjs cmdPhaseComplete
 *
 * Covers:
 * - Lines 630-631: error when no phaseNum provided
 * - Lines 642-643: error when phase not found
 * - Lines 656-661: UAT file warnings (pending, blocked, partial, diagnosed)
 * - Lines 664-667: VERIFICATION file warnings (human_needed, gaps_found)
 * - Lines 787-791: next phase lookup from ROADMAP.md fallback
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// cmdPhaseComplete — error branches
// ─────────────────────────────────────────────────────────────────────────────

describe('phase complete error branches', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when no phase number provided', () => {
    const result = runGsdTools('phase complete', tmpDir);
    assert.ok(!result.success, 'should fail without phase number');
    assert.ok(result.error.includes('phase number required'), 'error should mention phase number required');
  });

  test('errors when phase not found', () => {
    const result = runGsdTools('phase complete 99', tmpDir);
    assert.ok(!result.success, 'should fail for nonexistent phase');
    assert.ok(result.error.includes('not found'), 'error should mention not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdPhaseComplete — UAT file warnings
// ─────────────────────────────────────────────────────────────────────────────

describe('phase complete UAT warnings', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function setupPhaseForComplete(tmpDir, uatContent) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 1: Test\n**Goal:** Test\n**Plans:** 1 plans\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Test\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    if (uatContent !== undefined) {
      fs.writeFileSync(path.join(p1, '01-01-UAT.md'), uatContent);
    }

    return p1;
  }

  test('warns when UAT has pending tests', () => {
    setupPhaseForComplete(tmpDir, '# UAT\n\nresult: pending\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('pending')),
      'should warn about pending tests'
    );
  });

  test('warns when UAT has blocked tests', () => {
    setupPhaseForComplete(tmpDir, '# UAT\n\nresult: blocked\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('blocked')),
      'should warn about blocked tests'
    );
  });

  test('warns when UAT has partial status', () => {
    setupPhaseForComplete(tmpDir, '# UAT\n\nstatus: partial\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('partial')),
      'should warn about partial testing'
    );
  });

  test('warns when UAT has diagnosed status', () => {
    setupPhaseForComplete(tmpDir, '# UAT\n\nstatus: diagnosed\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('diagnosed')),
      'should warn about diagnosed gaps'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdPhaseComplete — VERIFICATION file warnings
// ─────────────────────────────────────────────────────────────────────────────

describe('phase complete VERIFICATION warnings', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function setupPhaseWithVerification(tmpDir, verificationContent) {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 1: Test\n**Goal:** Test\n**Plans:** 1 plans\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Test\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(path.join(p1, '01-01-VERIFICATION.md'), verificationContent);

    return p1;
  }

  test('warns when VERIFICATION has human_needed status', () => {
    setupPhaseWithVerification(tmpDir, '# Verification\n\nstatus: human_needed\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('human verification')),
      'should warn about human verification needed'
    );
  });

  test('warns when VERIFICATION has gaps_found status', () => {
    setupPhaseWithVerification(tmpDir, '# Verification\n\nstatus: gaps_found\n');

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.warnings && output.warnings.length > 0, 'should have warnings');
    assert.ok(
      output.warnings.some(w => w.includes('unresolved gaps')),
      'should warn about unresolved gaps'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdPhaseComplete — ROADMAP.md fallback for next phase
// ─────────────────────────────────────────────────────────────────────────────

describe('phase complete ROADMAP fallback for next phase', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('finds next phase from ROADMAP when no directory exists on disk', () => {
    // ROADMAP defines phases 1 and 2, but only phase 1 has a directory
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

### Phase 1: Foundation
**Goal:** Setup
**Plans:** 1 plans

### Phase 2: Features
**Goal:** Build features
`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Foundation\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    // NOTE: No 02-features directory exists on disk

    const result = runGsdTools('phase complete 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.is_last_phase, false, 'should NOT be last phase — phase 2 is in ROADMAP');
    assert.ok(output.next_phase, 'next phase should be found from ROADMAP');
  });
});
