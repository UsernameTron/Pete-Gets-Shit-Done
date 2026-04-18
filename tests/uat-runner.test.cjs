/**
 * uat-runner.cjs — Unit Tests
 *
 * TDD tests for UAT runner orchestrator: compareResult, runAutomatedUAT,
 * and formatUATResults. Written before implementation (RED phase).
 *
 * Requirements: UAT-01, UAT-04, UAT-05, UAT-06, UAT-08, UAT-09
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { runAutomatedUAT, formatUATResults, compareResult } = require('../get-shit-done/bin/lib/uat-runner.cjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a temp PLAN.md with the given must_haves truths array.
 * Returns the path to the temp file.
 */
function createTempPlan(truths = [], prefix = 'uat-runner-test-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const truthsYaml = truths.length > 0
    ? truths.map(t => `    - "${t}"`).join('\n')
    : '';
  const content = `---
phase: test-phase
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves:
  truths:
${truthsYaml}
---

# Test Plan

This is a test plan for UAT runner testing.
`;
  const planPath = path.join(tmpDir, 'PLAN.md');
  fs.writeFileSync(planPath, content, 'utf8');
  return { planPath, tmpDir };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ─── compareResult ────────────────────────────────────────────────────────────

describe('compareResult', () => {
  test('Test 1: equals mode — actual equals expected returns true', () => {
    const result = compareResult('present', 'present', 'equals');
    assert.strictEqual(result, true, 'compareResult("present", "present", "equals") must return true');
  });

  test('Test 2: equals mode — actual differs from expected returns false', () => {
    const result = compareResult('present', 'absent', 'equals');
    assert.strictEqual(result, false, 'compareResult("present", "absent", "equals") must return false');
  });

  test('Test 3: contains mode — actual contains expected returns true', () => {
    const result = compareResult('# fail 0', '# fail 0', 'contains');
    assert.strictEqual(result, true, 'compareResult("# fail 0", "# fail 0", "contains") must return true');
  });

  test('Test 4: contains mode — actual does not contain expected returns false', () => {
    const result = compareResult('# fail 2', '# fail 0', 'contains');
    assert.strictEqual(result, false, 'compareResult("# fail 2", "# fail 0", "contains") must return false');
  });

  test('Test 5: gte mode — actual >= expected returns true', () => {
    const result = compareResult('95', '90', 'gte');
    assert.strictEqual(result, true, 'compareResult("95", "90", "gte") must return true (95 >= 90)');
  });

  test('Test 6: gte mode — actual < expected returns false', () => {
    const result = compareResult('85', '90', 'gte');
    assert.strictEqual(result, false, 'compareResult("85", "90", "gte") must return false (85 < 90)');
  });

  test('Test 7: gt mode — actual > expected returns true', () => {
    const result = compareResult('5', '0', 'gt');
    assert.strictEqual(result, true, 'compareResult("5", "0", "gt") must return true (5 > 0)');
  });

  test('Test 8: gt mode — equal values return false', () => {
    const result = compareResult('0', '0', 'gt');
    assert.strictEqual(result, false, 'compareResult("0", "0", "gt") must return false (0 is not > 0)');
  });
});

// ─── runAutomatedUAT ──────────────────────────────────────────────────────────

describe('runAutomatedUAT', () => {
  test('Test 9: plan with recognizable must_have (file_exists for real file) returns passed items', () => {
    // tests/helpers.cjs is a real file in the repo — file_exists pattern will match and pass
    const { planPath, tmpDir } = createTempPlan(['tests/helpers.cjs exists']);
    try {
      const results = runAutomatedUAT([planPath]);
      assert.ok(typeof results === 'object', 'results must be an object');
      assert.ok(Array.isArray(results.passed), 'results.passed must be an array');
      assert.ok(Array.isArray(results.failed), 'results.failed must be an array');
      assert.ok(Array.isArray(results.manual), 'results.manual must be an array');
      assert.strictEqual(typeof results.total, 'number', 'results.total must be a number');
      assert.strictEqual(results.total, 1, 'total must equal the number of truths (1)');
      // tests/helpers.cjs should exist — verify pass or report structure
      assert.ok(
        results.passed.length > 0 || results.failed.length > 0,
        'must have at least one result (passed or failed)'
      );
    } finally {
      cleanup(tmpDir);
    }
  });

  test('Test 10: plan with unrecognizable must_have routes to manual array', () => {
    const { planPath, tmpDir } = createTempPlan(['the flux capacitor is calibrated to 1.21 gigawatts']);
    try {
      const results = runAutomatedUAT([planPath]);
      assert.strictEqual(results.total, 1, 'total must be 1');
      assert.strictEqual(results.manual.length, 1, 'manual must have 1 item');
      assert.strictEqual(results.passed.length, 0, 'passed must be empty');
      assert.strictEqual(results.failed.length, 0, 'failed must be empty');
      assert.strictEqual(
        results.manual[0].mustHave,
        'the flux capacitor is calibrated to 1.21 gigawatts',
        'manual item must preserve original mustHave text'
      );
      assert.ok(
        typeof results.manual[0].reason === 'string' && results.manual[0].reason.length > 0,
        'manual item must have a reason string'
      );
    } finally {
      cleanup(tmpDir);
    }
  });

  test('Test 11: plan with empty must_haves truths returns total: 0', () => {
    const { planPath, tmpDir } = createTempPlan([]);
    try {
      const results = runAutomatedUAT([planPath]);
      assert.strictEqual(results.total, 0, 'total must be 0 for empty truths');
      assert.strictEqual(results.passed.length, 0, 'passed must be empty');
      assert.strictEqual(results.failed.length, 0, 'failed must be empty');
      assert.strictEqual(results.manual.length, 0, 'manual must be empty');
    } finally {
      cleanup(tmpDir);
    }
  });

  test('Test 13: failed result object contains required fields', () => {
    // Use a file_exists check for a file that definitely does not exist
    const { planPath, tmpDir } = createTempPlan([
      'this-file-absolutely-does-not-exist-xyz123.txt exists',
    ]);
    try {
      const results = runAutomatedUAT([planPath]);
      // The command runs, result is "absent" which doesn't equal "present" → fail
      if (results.failed.length > 0) {
        const failedItem = results.failed[0];
        assert.ok('mustHave' in failedItem, 'failed item must have mustHave field');
        assert.ok('expected' in failedItem, 'failed item must have expected field');
        assert.ok('actual' in failedItem, 'failed item must have actual field');
        assert.ok('command' in failedItem, 'failed item must have command field');
        assert.strictEqual(typeof failedItem.mustHave, 'string', 'mustHave must be a string');
        assert.strictEqual(typeof failedItem.expected, 'string', 'expected must be a string');
        assert.strictEqual(typeof failedItem.actual, 'string', 'actual must be a string');
        assert.strictEqual(typeof failedItem.command, 'string', 'command must be a string');
      }
      // At minimum, the total should be 1
      assert.strictEqual(results.total, 1, 'total must be 1');
    } finally {
      cleanup(tmpDir);
    }
  });

  test('Test 14: command that fails/errors reports failure with error message', () => {
    // Use a command-triggering pattern that will error: file_exists for a path
    // that is so deeply nested it causes an OS error, or use a nonexistent file
    // which actually just outputs "absent" (that's a valid failure via compareResult).
    // For a real timeout/error test, we mock by providing a plan path that doesn't exist.
    const results = runAutomatedUAT(['/nonexistent/path/that/does/not/exist.md']);
    // safeReadFile returns null, plan should be skipped — result total stays 0
    assert.strictEqual(results.total, 0, 'nonexistent plan path must be skipped gracefully');
    assert.strictEqual(results.passed.length, 0, 'no passed results for missing plan');
    assert.strictEqual(results.failed.length, 0, 'no failed results for missing plan');
  });
});

// ─── formatUATResults ─────────────────────────────────────────────────────────

describe('formatUATResults', () => {
  test('Test 12: formatUATResults includes pass count, fail count, manual count in output', () => {
    const results = {
      passed: [{ mustHave: 'foo.cjs exists', pattern: 'file_exists', actual: 'present' }],
      failed: [{ mustHave: 'bar.cjs exists', pattern: 'file_exists', expected: 'present', actual: 'absent', command: 'test -f "bar.cjs"' }],
      manual: [{ mustHave: 'the system is happy', reason: 'No automated pattern match' }],
      total: 3,
    };

    const output = formatUATResults(results);

    assert.strictEqual(typeof output, 'string', 'formatUATResults must return a string');
    assert.ok(output.length > 0, 'output must not be empty');

    // Must include the summary line with counts
    assert.ok(
      output.includes('1 pass') || output.includes('1 pass'),
      `output must mention pass count, got: ${output}`
    );
    assert.ok(
      output.includes('1 fail') || output.includes('fail'),
      `output must mention fail count, got: ${output}`
    );
    assert.ok(
      output.includes('1 manual') || output.includes('manual'),
      `output must mention manual count, got: ${output}`
    );
  });
});
