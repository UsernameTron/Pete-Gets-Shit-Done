/**
 * GSD Tools Tests — harden-repo
 *
 * Tests branch protection audit and merge logic.
 * Pure-function tests (buildGapTable, mergePolicy) use fabricated GitHub API
 * response objects — no gh CLI mocking needed.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { runGsdTools } = require('./helpers.cjs');
const { STANDARD_POLICY, buildGapTable, mergePolicy } = require('../get-shit-done/bin/lib/harden-repo.cjs');

// ─── Fixtures: GitHub GET response shapes ─────────────────────────────────────

/**
 * A fully-compliant GET response — matches STANDARD_POLICY exactly.
 */
function makeCompliantResponse() {
  return {
    required_pull_request_reviews: {
      required_approving_review_count: 0,
      dismiss_stale_reviews: false,
      require_code_owner_reviews: false,
      url: 'https://api.github.com/repos/owner/repo/branches/main/protection/required_pull_request_reviews',
    },
    required_status_checks: {
      strict: true,
      contexts: ['test ubuntu-latest/20', 'test ubuntu-latest/22', 'test macos-latest/22', 'governance'],
      url: 'https://api.github.com/repos/owner/repo/branches/main/protection/required_status_checks',
    },
    enforce_admins: { enabled: false, url: 'https://api.github.com/repos/owner/repo/branches/main/protection/enforce_admins' },
    restrictions: null,
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
    required_linear_history: { enabled: false },
  };
}

/**
 * A non-compliant GET response — several settings wrong.
 */
function makeNonCompliantResponse() {
  return {
    required_pull_request_reviews: {
      required_approving_review_count: 2,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: true,
      url: 'https://api.github.com/repos/owner/repo/branches/main/protection/required_pull_request_reviews',
    },
    required_status_checks: {
      strict: false,
      contexts: ['ci/build'],
      url: 'https://api.github.com/repos/owner/repo/branches/main/protection/required_status_checks',
    },
    enforce_admins: { enabled: true, url: 'https://api.github.com/repos/owner/repo/branches/main/protection/enforce_admins' },
    restrictions: null,
    allow_force_pushes: { enabled: true },
    allow_deletions: { enabled: false },
    required_linear_history: { enabled: true },
  };
}

/**
 * Partial protection: status checks only, no PR reviews.
 */
function makeStatusChecksOnlyResponse() {
  return {
    required_pull_request_reviews: null,
    required_status_checks: {
      strict: true,
      contexts: ['test'],
    },
    enforce_admins: { enabled: false },
    restrictions: null,
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
    required_linear_history: { enabled: false },
  };
}

// ─── STANDARD_POLICY shape ────────────────────────────────────────────────────

describe('STANDARD_POLICY', () => {
  test('has all required top-level keys', () => {
    const required = [
      'required_pull_request_reviews',
      'required_status_checks',
      'enforce_admins',
      'restrictions',
      'allow_force_pushes',
      'allow_deletions',
      'required_linear_history',
    ];
    for (const key of required) {
      assert.ok(key in STANDARD_POLICY, `missing key: ${key}`);
    }
  });

  test('required_approving_review_count is 0', () => {
    assert.strictEqual(
      STANDARD_POLICY.required_pull_request_reviews.required_approving_review_count,
      0,
      'single-dev repos need 0 approvals to force PR path without human gate',
    );
  });

  test('enforce_admins is false', () => {
    assert.strictEqual(STANDARD_POLICY.enforce_admins, false);
  });

  test('restrictions is null', () => {
    assert.strictEqual(STANDARD_POLICY.restrictions, null);
  });

  test('force pushes are blocked', () => {
    assert.strictEqual(STANDARD_POLICY.allow_force_pushes, false);
  });

  test('deletions are blocked', () => {
    assert.strictEqual(STANDARD_POLICY.allow_deletions, false);
  });

  test('contexts sentinel is __PRESERVE_EXISTING__', () => {
    assert.strictEqual(
      STANDARD_POLICY.required_status_checks.contexts,
      '__PRESERVE_EXISTING__',
      'sentinel tells merge logic to keep existing contexts',
    );
  });

  test('strict status checks enabled', () => {
    assert.strictEqual(STANDARD_POLICY.required_status_checks.strict, true);
  });
});

// ─── buildGapTable ────────────────────────────────────────────────────────────

describe('buildGapTable', () => {
  test('fully compliant response yields all PASS', () => {
    const result = buildGapTable(makeCompliantResponse(), STANDARD_POLICY);
    assert.strictEqual(result.allPass, true, 'all settings should pass');
    assert.strictEqual(result.passCount, result.totalCount, 'passCount should equal totalCount');
    for (const gap of result.gaps) {
      assert.strictEqual(gap.pass, true, `${gap.setting} should pass, got expected=${gap.expected} actual=${gap.actual}`);
    }
  });

  test('null protection (no protection) yields mostly FAIL', () => {
    const result = buildGapTable(null, STANDARD_POLICY);
    assert.strictEqual(result.allPass, false, 'no protection should fail overall');
    // restrictions: null matches policy null, so 1 pass is expected
    assert.ok(result.passCount <= 1, `at most 1 setting should pass (restrictions=null), got ${result.passCount}`);
    assert.ok(result.totalCount > 0, 'should check multiple settings');
    assert.ok(result.totalCount - result.passCount >= 9, 'at least 9 settings should fail when unprotected');
  });

  test('non-compliant response yields mixed PASS/FAIL', () => {
    const result = buildGapTable(makeNonCompliantResponse(), STANDARD_POLICY);
    assert.strictEqual(result.allPass, false, 'non-compliant should not all pass');
    assert.ok(result.passCount > 0, 'some settings should still pass');
    assert.ok(result.passCount < result.totalCount, 'some settings should fail');
  });

  test('enforce_admins: { enabled: true } detected as FAIL', () => {
    const response = makeCompliantResponse();
    response.enforce_admins = { enabled: true };
    const result = buildGapTable(response, STANDARD_POLICY);
    const enforceGap = result.gaps.find(g => g.setting === 'enforce_admins');
    assert.ok(enforceGap, 'should have enforce_admins gap entry');
    assert.strictEqual(enforceGap.pass, false, 'enforce_admins=true should fail against policy false');
    assert.strictEqual(enforceGap.actual, true, 'actual should be extracted from .enabled');
  });

  test('allow_force_pushes: { enabled: true } detected as FAIL', () => {
    const response = makeCompliantResponse();
    response.allow_force_pushes = { enabled: true };
    const result = buildGapTable(response, STANDARD_POLICY);
    const forceGap = result.gaps.find(g => g.setting === 'allow_force_pushes');
    assert.ok(forceGap, 'should have allow_force_pushes gap entry');
    assert.strictEqual(forceGap.pass, false, 'force_pushes=true should fail');
  });

  test('status checks only (no PR reviews) flags PR reviews as FAIL', () => {
    const result = buildGapTable(makeStatusChecksOnlyResponse(), STANDARD_POLICY);
    const prExists = result.gaps.find(g => g.setting === 'required_pull_request_reviews (exists)');
    assert.ok(prExists, 'should check PR reviews existence');
    assert.strictEqual(prExists.pass, false, 'missing PR reviews should fail');

    const statusExists = result.gaps.find(g => g.setting === 'required_status_checks (exists)');
    assert.ok(statusExists, 'should check status checks existence');
    assert.strictEqual(statusExists.pass, true, 'status checks present should pass');
  });

  test('gap table has consistent shape', () => {
    const result = buildGapTable(makeCompliantResponse(), STANDARD_POLICY);
    assert.ok(Array.isArray(result.gaps), 'gaps should be array');
    assert.ok(typeof result.allPass === 'boolean', 'allPass should be boolean');
    assert.ok(typeof result.passCount === 'number', 'passCount should be number');
    assert.ok(typeof result.totalCount === 'number', 'totalCount should be number');
    for (const gap of result.gaps) {
      assert.ok('setting' in gap, 'gap should have setting');
      assert.ok('expected' in gap, 'gap should have expected');
      assert.ok('actual' in gap, 'gap should have actual');
      assert.ok('pass' in gap, 'gap should have pass');
    }
  });
});

// ─── mergePolicy ──────────────────────────────────────────────────────────────

describe('mergePolicy', () => {
  test('preserves existing contexts when sentinel is __PRESERVE_EXISTING__', () => {
    const current = makeCompliantResponse();
    const { payload } = mergePolicy(current, STANDARD_POLICY);
    assert.deepStrictEqual(
      payload.required_status_checks.contexts,
      ['test ubuntu-latest/20', 'test ubuntu-latest/22', 'test macos-latest/22', 'governance'],
      'should preserve the 4 existing status check contexts',
    );
  });

  test('preserves contexts from checks array (newer API format)', () => {
    const current = makeCompliantResponse();
    // Newer API returns checks instead of contexts
    current.required_status_checks = {
      strict: true,
      contexts: [],
      checks: [
        { context: 'ci/build', app_id: null },
        { context: 'ci/test', app_id: null },
      ],
    };
    const { payload } = mergePolicy(current, STANDARD_POLICY);
    assert.deepStrictEqual(
      payload.required_status_checks.contexts,
      ['ci/build', 'ci/test'],
      'should extract contexts from checks array',
    );
  });

  test('null current produces valid PUT payload from policy alone', () => {
    const { payload, warnings } = mergePolicy(null, STANDARD_POLICY);

    assert.ok(payload.required_pull_request_reviews, 'should have PR reviews');
    assert.strictEqual(
      payload.required_pull_request_reviews.required_approving_review_count,
      0,
    );
    assert.ok(payload.required_status_checks, 'should have status checks');
    assert.strictEqual(payload.required_status_checks.strict, true);
    assert.deepStrictEqual(payload.required_status_checks.contexts, [], 'no contexts to preserve');
    assert.ok(warnings.length > 0, 'should warn about empty contexts');
  });

  test('PUT payload has flat booleans (not nested .enabled)', () => {
    const current = makeCompliantResponse();
    const { payload } = mergePolicy(current, STANDARD_POLICY);

    // PUT format uses flat booleans, not { enabled: bool }
    assert.strictEqual(typeof payload.enforce_admins, 'boolean', 'enforce_admins should be flat boolean');
    assert.strictEqual(typeof payload.allow_force_pushes, 'boolean', 'allow_force_pushes should be flat boolean');
    assert.strictEqual(typeof payload.allow_deletions, 'boolean', 'allow_deletions should be flat boolean');
    assert.strictEqual(typeof payload.required_linear_history, 'boolean', 'required_linear_history should be flat boolean');
  });

  test('payload has all required top-level keys for PUT', () => {
    const current = makeCompliantResponse();
    const { payload } = mergePolicy(current, STANDARD_POLICY);

    const required = [
      'required_pull_request_reviews',
      'required_status_checks',
      'enforce_admins',
      'restrictions',
      'allow_force_pushes',
      'allow_deletions',
      'required_linear_history',
    ];
    for (const key of required) {
      assert.ok(key in payload, `PUT payload missing key: ${key}`);
    }
  });

  test('empty contexts triggers warning', () => {
    const current = makeCompliantResponse();
    current.required_status_checks.contexts = [];
    const { warnings } = mergePolicy(current, STANDARD_POLICY);
    assert.ok(warnings.length > 0, 'should warn when no contexts found');
    assert.ok(warnings[0].includes('No existing status check contexts'), 'warning should mention missing contexts');
  });

  test('policy values override non-compliant current settings', () => {
    const current = makeNonCompliantResponse();
    const { payload } = mergePolicy(current, STANDARD_POLICY);

    assert.strictEqual(payload.required_pull_request_reviews.required_approving_review_count, 0);
    assert.strictEqual(payload.required_pull_request_reviews.dismiss_stale_reviews, false);
    assert.strictEqual(payload.required_status_checks.strict, true);
    assert.strictEqual(payload.enforce_admins, false);
    assert.strictEqual(payload.allow_force_pushes, false);
    assert.strictEqual(payload.required_linear_history, false);
  });
});

// ─── Dispatch integration ─────────────────────────────────────────────────────

describe('harden-repo dispatch', () => {
  test('harden-repo without gh available exits with clear error', () => {
    // Run with a fake HOME to ensure gh auth fails
    const result = runGsdTools(
      ['harden-repo'],
      process.cwd(),
      { HOME: '/tmp/fake-home-harden-repo-test', GH_CONFIG_DIR: '/tmp/fake-gh-config' },
    );
    assert.strictEqual(result.success, false, 'should fail when gh is not authenticated');
    assert.ok(
      result.error.includes('gh') || result.error.includes('Error'),
      `error should mention gh or be a clear error message, got: ${result.error}`,
    );
  });
});
