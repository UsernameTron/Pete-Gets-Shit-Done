/**
 * Tests for the CI failure pattern library (lib/ci-patterns.json).
 *
 * Validates structure, regex compilation, positive pattern matching for all
 * 6 seeded failure categories, negative matching for clean output, and
 * category uniqueness.
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const patterns = require(path.join(__dirname, '../lib/ci-patterns.json'));

function findMatch(text) {
  return patterns.find(p => new RegExp(p.source, p.flags).test(text));
}

// ─── Schema Validation ───────────────────────────────────────────────────────

describe('schema validation', () => {
  it('ci-patterns.json loads as a non-empty array', () => {
    assert.ok(Array.isArray(patterns), 'patterns should be an array');
    assert.ok(patterns.length > 0, 'patterns array should not be empty');
  });

  it('every pattern has required fields: source, flags, category, description, fix', () => {
    for (const p of patterns) {
      assert.ok(typeof p.source === 'string' && p.source.length > 0,
        `pattern category "${p.category}" missing source`);
      assert.ok(typeof p.flags === 'string',
        `pattern category "${p.category}" missing flags`);
      assert.ok(typeof p.category === 'string' && p.category.length > 0,
        `a pattern is missing category`);
      assert.ok(typeof p.description === 'string' && p.description.length > 0,
        `pattern category "${p.category}" missing description`);
      assert.ok(typeof p.fix === 'string' && p.fix.length > 0,
        `pattern category "${p.category}" missing fix`);
    }
  });

  it('every pattern source compiles as a valid RegExp with its flags', () => {
    for (const p of patterns) {
      assert.doesNotThrow(() => {
        // eslint-disable-next-line no-new
        new RegExp(p.source, p.flags);
      }, `pattern category "${p.category}" has invalid regex: ${p.source}`);
    }
  });
});

// ─── Pattern Matching — Positive ─────────────────────────────────────────────

describe('pattern matching — positive', () => {
  it('EXDEV pattern matches cross-device link error', () => {
    const match = findMatch('Error: EXDEV: cross-device link not permitted');
    assert.ok(match, 'should match EXDEV cross-device error');
    assert.equal(match.category, 'cross-device');
  });

  it('missing-module pattern matches "Cannot find module"', () => {
    const match = findMatch("Error: Cannot find module './foo'");
    assert.ok(match, 'should match Cannot find module error');
    assert.equal(match.category, 'missing-module');
  });

  it('missing-module pattern matches MODULE_NOT_FOUND error', () => {
    const match = findMatch('Error [MODULE_NOT_FOUND]: Cannot find module');
    assert.ok(match, 'should match MODULE_NOT_FOUND error');
    assert.equal(match.category, 'missing-module');
  });

  it('sha-pin pattern matches unresolvable GitHub Actions reference', () => {
    const match = findMatch(
      "Unable to resolve action `actions/checkout@deadbeef`, uses: actions/checkout@deadbeef"
    );
    assert.ok(match, 'should match sha-pin error');
    assert.equal(match.category, 'sha-pin');
  });

  it('node-version pattern matches unexpected token syntax error', () => {
    const match = findMatch("SyntaxError: Unexpected token 'export'");
    assert.ok(match, 'should match node-version syntax error');
    assert.equal(match.category, 'node-version');
  });

  it('test-failure pattern matches TAP not-ok line', () => {
    const match = findMatch('not ok 5 - should return correct value');
    assert.ok(match, 'should match TAP not ok line');
    assert.equal(match.category, 'test-failure');
  });

  it('test-failure pattern matches Jest FAIL output', () => {
    const match = findMatch('FAIL tests/unit/core.test.cjs');
    assert.ok(match, 'should match Jest FAIL line');
    assert.equal(match.category, 'test-failure');
  });

  it('exit-code pattern matches process exit with code', () => {
    const match = findMatch('Process exited with code 1');
    assert.ok(match, 'should match process exit code error');
    assert.equal(match.category, 'exit-code');
  });
});

// ─── Pattern Matching — Negative ─────────────────────────────────────────────

describe('pattern matching — negative', () => {
  it('no pattern matches clean "All tests passed" output', () => {
    const match = findMatch('All tests passed successfully');
    assert.equal(match, undefined, 'clean success output should not match any pattern');
  });

  it('no pattern matches clean "Build completed" output', () => {
    const match = findMatch('Build completed in 45s');
    assert.equal(match, undefined, 'clean build output should not match any pattern');
  });
});

// ─── Uniqueness ───────────────────────────────────────────────────────────────

describe('uniqueness', () => {
  it('category field is unique across all patterns', () => {
    const categories = patterns.map(p => p.category);
    const unique = new Set(categories);
    assert.equal(unique.size, categories.length,
      `duplicate categories found: ${categories.filter((c, i) => categories.indexOf(c) !== i).join(', ')}`);
  });
});
