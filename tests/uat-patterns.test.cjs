/**
 * uat-patterns.cjs — Unit Tests
 *
 * Tests for UAT pattern registry: pattern matching, command generation,
 * read-only safety, and edge cases.
 *
 * Requirements: UAT-02, UAT-03
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { matchPattern } = require('../get-shit-done/bin/lib/uat-patterns.cjs');

// ─── file_exists pattern ──────────────────────────────────────────────────────

describe('uat-patterns: file_exists', () => {
  test('Test 1: matchPattern("get-shit-done/bin/lib/daily.cjs exists") returns file_exists pattern', () => {
    const result = matchPattern('get-shit-done/bin/lib/daily.cjs exists');
    assert.strictEqual(result.pattern, 'file_exists', 'pattern name must be file_exists');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('test -f'),
      `command must contain "test -f", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.expected, 'present', 'expected must be "present"');
    assert.strictEqual(result.original, 'get-shit-done/bin/lib/daily.cjs exists', 'original must be preserved');
  });
});

// ─── file_not_exists pattern ──────────────────────────────────────────────────

describe('uat-patterns: file_not_exists', () => {
  test('Test 2: matchPattern("DEPRECATED.md does not exist") returns file_not_exists pattern', () => {
    const result = matchPattern('DEPRECATED.md does not exist');
    assert.strictEqual(result.pattern, 'file_not_exists', 'pattern name must be file_not_exists');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('test ! -f'),
      `command must contain "test ! -f", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.expected, 'absent', 'expected must be "absent"');
  });
});

// ─── test_suite_green pattern ─────────────────────────────────────────────────

describe('uat-patterns: test_suite_green', () => {
  test('Test 3: matchPattern("npm test passes with 0 failures") returns test_suite_green pattern', () => {
    const result = matchPattern('npm test passes with 0 failures');
    assert.strictEqual(result.pattern, 'test_suite_green', 'pattern name must be test_suite_green');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('npm test'),
      `command must contain "npm test", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.compare, 'contains', 'compare must be "contains"');
  });
});

// ─── coverage_threshold pattern ───────────────────────────────────────────────

describe('uat-patterns: coverage_threshold', () => {
  test('Test 4: matchPattern("coverage >= 90%") returns coverage_threshold pattern with expected=90', () => {
    const result = matchPattern('coverage >= 90%');
    assert.strictEqual(result.pattern, 'coverage_threshold', 'pattern name must be coverage_threshold');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.strictEqual(result.assertion.expected, '90', 'expected must be "90"');
    assert.strictEqual(result.assertion.compare, 'gte', 'compare must be "gte"');
  });
});

// ─── file_contains pattern ────────────────────────────────────────────────────

describe('uat-patterns: file_contains', () => {
  test('Test 5: matchPattern("checkpoint.cjs contains \\"writeCheckpoint\\"") returns file_contains pattern', () => {
    const input = 'checkpoint.cjs contains "writeCheckpoint"';
    const result = matchPattern(input);
    assert.strictEqual(result.pattern, 'file_contains', 'pattern name must be file_contains');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('grep'),
      `command must contain "grep", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.compare, 'gt', 'compare must be "gt" (count > 0 means found)');
  });
});

// ─── file_not_contains pattern ────────────────────────────────────────────────

describe('uat-patterns: file_not_contains', () => {
  test('Test 6: matchPattern("output.log does not contain \\"ERROR\\"") returns file_not_contains pattern', () => {
    const input = 'output.log does not contain "ERROR"';
    const result = matchPattern(input);
    assert.strictEqual(result.pattern, 'file_not_contains', 'pattern name must be file_not_contains');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('grep'),
      `command must contain "grep", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.expected, '0', 'expected must be "0"');
    assert.strictEqual(result.assertion.compare, 'equals', 'compare must be "equals"');
  });
});

// ─── files_identical pattern ──────────────────────────────────────────────────

describe('uat-patterns: files_identical', () => {
  test('Test 7: matchPattern("source.cjs and backup.cjs are byte-identical") returns files_identical pattern', () => {
    const input = 'source.cjs and backup.cjs are byte-identical';
    const result = matchPattern(input);
    assert.strictEqual(result.pattern, 'files_identical', 'pattern name must be files_identical');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('diff'),
      `command must contain "diff", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.expected, 'identical', 'expected must be "identical"');
  });
});

// ─── module_export_count pattern ─────────────────────────────────────────────

describe('uat-patterns: module_export_count', () => {
  test('Test 8: matchPattern("model-profiles.cjs contains 17 entries") returns module_export_count pattern', () => {
    const input = 'model-profiles.cjs contains 17 entries';
    const result = matchPattern(input);
    assert.strictEqual(result.pattern, 'module_export_count', 'pattern name must be module_export_count');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(
      result.assertion.command.includes('node -p'),
      `command must contain "node -p", got: ${result.assertion.command}`
    );
    assert.strictEqual(result.assertion.expected, '17', 'expected must be "17"');
  });
});

// ─── edge cases ───────────────────────────────────────────────────────────────

describe('uat-patterns: edge cases', () => {
  test('Test 9: matchPattern("some completely unrecognized sentence") returns null pattern and null assertion', () => {
    const result = matchPattern('some completely unrecognized sentence');
    assert.strictEqual(result.pattern, null, 'pattern must be null for unrecognized input');
    assert.strictEqual(result.assertion, null, 'assertion must be null for unrecognized input');
    assert.strictEqual(result.original, 'some completely unrecognized sentence', 'original must be preserved');
  });

  test('Test 10: pattern matching is case-insensitive for trigger words (DAILY.CJS EXISTS)', () => {
    const result = matchPattern('DAILY.CJS EXISTS');
    assert.ok(result.pattern !== null, 'should match a pattern regardless of case');
    assert.ok(result.assertion !== null, 'should return an assertion for case-insensitive match');
  });

  test('Test 11: all generated commands are read-only (no write operators)', () => {
    // Check for dangerous write commands only — not shell redirect operators.
    // Rationale: 2>&1, > /dev/null, and > /dev/null 2>&1 are all safe read-only
    // patterns commonly used in shell commands for output control. The key unsafe
    // operations are write-destructive commands like tee, rm, mv, cp, truncate,
    // or redirects to actual user-writable files.
    const WRITE_OPERATORS = /\btee\b|\brm\b|\bmv\b|\bcp\b|\btruncate\b/;
    // Detect > or >> redirecting to a real file path (not /dev/null, not &N fd)
    // Pattern: a > or >> followed by a space+filename that is not /dev/null and not &
    const FILE_REDIRECT = /(?:^|\s)(>>?)\s+(?!\/dev\/null)(?!&)([^\s|&>])/;

    const inputs = [
      'some-file.cjs exists',
      'DEPRECATED.md does not exist',
      'npm test passes with 0 failures',
      'coverage >= 90%',
      'checkpoint.cjs contains "writeCheckpoint"',
      'output.log does not contain "ERROR"',
      'source.cjs and backup.cjs are byte-identical',
      'model-profiles.cjs contains 17 entries',
    ];

    for (const input of inputs) {
      const result = matchPattern(input);
      if (result.assertion && result.assertion.command) {
        const cmd = result.assertion.command;
        assert.ok(
          !WRITE_OPERATORS.test(cmd),
          `Command for "${input}" contains write operator: ${cmd}`
        );
        assert.ok(
          !FILE_REDIRECT.test(cmd),
          `Command for "${input}" contains file redirect: ${cmd}`
        );
      }
    }
  });

  test('Test 12: file_contains with special regex characters in search string returns valid command', () => {
    // The search string "Object.keys(" contains special regex characters
    const input = 'source.cjs contains "Object.keys("';
    const result = matchPattern(input);
    assert.strictEqual(result.pattern, 'file_contains', 'should match file_contains pattern');
    assert.ok(result.assertion, 'must return an assertion object');
    assert.ok(typeof result.assertion.command === 'string', 'command must be a string');
    assert.ok(result.assertion.command.length > 0, 'command must not be empty');
  });

  test('Test 13: matchPattern returns original text in all cases', () => {
    const recognized = 'foo.txt exists';
    const unrecognized = 'totally unrecognized must_have';

    const r1 = matchPattern(recognized);
    const r2 = matchPattern(unrecognized);

    assert.strictEqual(r1.original, recognized, 'original must equal input for recognized patterns');
    assert.strictEqual(r2.original, unrecognized, 'original must equal input for unrecognized patterns');
  });

  test('Test 14: coverage_threshold with "at least" syntax matches correctly', () => {
    const result = matchPattern('coverage at least 80%');
    assert.strictEqual(result.pattern, 'coverage_threshold', 'pattern must be coverage_threshold');
    assert.strictEqual(result.assertion.expected, '80', 'expected must be the threshold number');
    assert.strictEqual(result.assertion.compare, 'gte', 'compare must be "gte"');
  });

  test('Test 15: file_not_exists with "should not exist" phrasing matches correctly', () => {
    const result = matchPattern('OLD_FILE.md should not exist');
    assert.strictEqual(result.pattern, 'file_not_exists', 'pattern must be file_not_exists');
    assert.ok(result.assertion.command.includes('test ! -f'), 'command must use test ! -f');
    assert.strictEqual(result.assertion.expected, 'absent', 'expected must be "absent"');
  });
});
