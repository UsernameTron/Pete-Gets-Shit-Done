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
 * Security note: execSync is used intentionally here. The pattern registry
 * generates read-only shell commands (file existence checks, grep, diff,
 * node -p). All commands are structurally verified to contain no write
 * operators. This is the UAT assertion engine — it must execute shell
 * commands to verify system state. See uat-patterns.cjs for the safety
 * guarantees on generated commands.
 */

'use strict';

const { execSync } = require('child_process');
const { safeReadFile } = require('./core.cjs');
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

      try {
        const actual = execSync(matched.assertion.command, {
          encoding: 'utf8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (compareResult(actual, matched.assertion.expected, matched.assertion.compare)) {
          results.passed.push({ mustHave: truth, pattern: matched.pattern, actual });
        } else {
          results.failed.push({
            mustHave: truth,
            pattern: matched.pattern,
            expected: matched.assertion.expected,
            actual,
            command: matched.assertion.command,
          });
        }
      } catch (err) {
        results.failed.push({
          mustHave: truth,
          pattern: matched.pattern,
          expected: matched.assertion.expected,
          actual: 'ERROR: ' + (err.message || String(err)),
          command: matched.assertion.command,
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
