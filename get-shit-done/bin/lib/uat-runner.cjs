/**
 * uat-runner.cjs — Automated UAT Runner
 *
 * Reads PLAN.md files, extracts must_haves.truths from frontmatter,
 * routes each through the pattern registry, executes generated shell
 * commands, and returns structured pass/fail/manual results.
 *
 * Layer 3 module. Imports: core.cjs (L1), frontmatter.cjs (L2), uat-patterns.cjs (L3 peer).
 *
 * Requirements: UAT-01, UAT-04, UAT-05, UAT-06, UAT-08, UAT-09
 *
 * Security note: assertions carrying PLAN.md-derived data run through
 * safeExec (spawnSync, no shell) with the captured values as argv elements, so
 * untrusted must_have text cannot inject commands. Only the two STATIC pipeline
 * patterns (test_suite_green, coverage_threshold) — which contain no PLAN.md
 * interpolation — are tagged shell:true and run via execSync. See
 * uat-patterns.cjs for the assertion contract.
 */

'use strict';

const { execSync } = require('child_process');
const { safeReadFile, safeExec } = require('./core.cjs');
const { parseMustHavesBlock } = require('./frontmatter.cjs');
const { matchPattern } = require('./uat-patterns.cjs');

/**
 * Compare an actual value against an expected value using the specified mode.
 *
 * @param {string} actual - The actual output from the shell command
 * @param {string} expected - The expected value from the pattern
 * @param {string} mode - Comparison mode: 'equals', 'contains', 'gt', 'gte'
 * @returns {boolean}
 */
function compareResult(actual, expected, mode) {
  switch (mode) {
    case 'equals':
      return actual === expected;
    case 'contains':
      return actual.includes(expected);
    case 'gt':
      return parseFloat(actual) > parseFloat(expected);
    case 'gte':
      return parseFloat(actual) >= parseFloat(expected);
    default:
      return actual === expected;
  }
}

/**
 * Execute one assertion and return the derived `actual` token to compare.
 *
 * argv assertions carry PLAN.md-derived values as data and run with no shell
 * (safeExec). Only shell:true assertions — the static test/coverage pipelines,
 * which never interpolate untrusted text — run via execSync.
 *
 * @param {object} assertion
 * @returns {string}
 */
function runAssertion(assertion) {
  if (assertion.shell) {
    return execSync(assertion.command, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  }

  const res = safeExec(assertion.argv[0], assertion.argv.slice(1), { timeout: 30000 });
  switch (assertion.result) {
    case 'exit':
      return res.exitCode === 0 ? assertion.onZero : assertion.onNonzero;
    case 'grepcount':
      // grep -c prints the count on stdout (even "0", exit 1 on no-match); on
      // error (missing file, exit 2) stdout is empty → treat as "0".
      return res.stdout || '0';
    case 'stdout':
    default:
      return res.stdout;
  }
}

/**
 * Run automated UAT assertions against plan must_haves.
 *
 * @param {string[]} planPaths - Absolute paths to PLAN.md files
 * @returns {{ passed: object[], failed: object[], manual: object[], total: number }}
 */
function runAutomatedUAT(planPaths) {
  const results = { passed: [], failed: [], manual: [], total: 0 };

  for (const planPath of planPaths) {
    const content = safeReadFile(planPath);
    if (!content) continue;

    const rawTruths = parseMustHavesBlock(content, 'truths');
    const truths = rawTruths.filter(t => typeof t === 'string' && t.length > 0);

    for (const truth of truths) {
      results.total++;
      const matched = matchPattern(truth);

      if (!matched.pattern) {
        results.manual.push({ mustHave: truth, reason: 'No automated pattern match' });
        continue;
      }

      // Pattern matched but declined to build a safe assertion (e.g. an unsafe
      // module path) — route to manual rather than executing anything.
      if (matched.assertion.manual) {
        results.manual.push({ mustHave: truth, reason: matched.assertion.reason });
        continue;
      }

      const displayCmd = matched.assertion.command || matched.assertion.argv.join(' ');

      try {
        const actual = runAssertion(matched.assertion);

        if (compareResult(actual, matched.assertion.expected, matched.assertion.compare)) {
          results.passed.push({ mustHave: truth, pattern: matched.pattern, actual });
        } else {
          results.failed.push({
            mustHave: truth,
            pattern: matched.pattern,
            expected: matched.assertion.expected,
            actual,
            command: displayCmd,
          });
        }
      } catch (err) {
        results.failed.push({
          mustHave: truth,
          pattern: matched.pattern,
          expected: matched.assertion.expected,
          actual: 'ERROR: ' + (err.message || String(err)),
          command: displayCmd,
        });
      }
    }
  }

  return results;
}

/**
 * Format UAT results into a human-readable string.
 *
 * @param {{ passed: object[], failed: object[], manual: object[], total: number }} results
 * @returns {string}
 */
function formatUATResults(results) {
  const lines = [];

  lines.push('## Automated UAT Results');
  lines.push('');

  if (results.passed.length > 0) {
    lines.push('### Passed');
    for (const item of results.passed) {
      lines.push(`  [PASS] ${item.mustHave}`);
    }
    lines.push('');
  }

  if (results.failed.length > 0) {
    lines.push('### Failed');
    for (const item of results.failed) {
      lines.push(`  [FAIL] ${item.mustHave}`);
      lines.push(`         Expected: ${item.expected}`);
      lines.push(`         Got:      ${item.actual}`);
      lines.push(`         Command:  ${item.command}`);
    }
    lines.push('');
  }

  if (results.manual.length > 0) {
    lines.push('### Manual Verification Needed');
    for (const item of results.manual) {
      lines.push(`  [MANUAL] ${item.mustHave} — ${item.reason}`);
    }
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`${results.passed.length} pass / ${results.failed.length} fail / ${results.manual.length} manual (${results.total} total)`);

  return lines.join('\n');
}

module.exports = { runAutomatedUAT, formatUATResults, compareResult };
