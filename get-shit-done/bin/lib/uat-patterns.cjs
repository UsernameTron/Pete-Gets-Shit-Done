/**
 * uat-patterns.cjs — UAT Pattern Registry
 *
 * Pure function module (no intra-project imports — Layer 0 leaf node).
 * Maps natural-language must_have strings to executable read-only shell commands.
 *
 * Consumed by: uat-runner.cjs (Plan 02)
 *
 * Requirements: UAT-02, UAT-03
 */

'use strict';

/**
 * Assertion shape:
 * {
 *   command: string,   // read-only shell command to execute
 *   expected: string,  // expected output or threshold
 *   compare: 'equals' | 'contains' | 'gt' | 'gte'
 * }
 *
 * MatchResult shape:
 * {
 *   pattern: string | null,       // pattern name or null if unmatched
 *   assertion: Assertion | null,  // generated assertion or null
 *   original: string              // the original must_have text
 * }
 */

/**
 * Pattern registry — ordered by specificity (most specific first).
 *
 * Order matters: file_not_exists must come before file_exists because both
 * match on "exist" but not_exists requires the "not" qualifier. Similarly,
 * file_not_contains comes before file_contains.
 */
const patterns = [
  // ── 1. module_export_count ────────────────────────────────────────────────
  // Matches: "model-profiles.cjs contains 17 entries"
  //          "model-profiles.cjs has 5 exports"
  //          "model-profiles.cjs exports 12 keys"
  {
    name: 'module_export_count',
    regex: /(\S+\.(?:cjs|js|mjs))\s+(?:contains?|has|exports?)\s+(\d+)\s+(?:entries|exports?|keys|items|functions)/i,
    generate: (match) => ({
      command: `node -p "Object.keys(require('./${match[1]}')).length"`,
      expected: match[2],
      compare: 'equals',
    }),
  },

  // ── 2. file_not_exists ────────────────────────────────────────────────────
  // Matches: "DEPRECATED.md does not exist"
  //          "OLD_FILE.md should not exist"
  //          "X must not exist"
  {
    name: 'file_not_exists',
    regex: /(\S+)\s+(?:does not|should not|must not)\s+exist/i,
    generate: (match) => ({
      command: `test ! -f "${match[1]}" && echo "absent" || echo "present"`,
      expected: 'absent',
      compare: 'equals',
    }),
  },

  // ── 3. file_exists ────────────────────────────────────────────────────────
  // Matches: "get-shit-done/bin/lib/daily.cjs exists"
  //          "config.json should exist"
  //          "README.md must exist"
  {
    name: 'file_exists',
    regex: /(\S+)\s+(?:exists|should exist|must exist)/i,
    generate: (match) => ({
      command: `test -f "${match[1]}" && echo "present" || echo "absent"`,
      expected: 'present',
      compare: 'equals',
    }),
  },

  // ── 4. files_identical ───────────────────────────────────────────────────
  // Matches: "source.cjs and backup.cjs are byte-identical"
  //          "fileA.txt and fileB.txt are identical"
  {
    name: 'files_identical',
    regex: /(\S+)\s+and\s+(\S+)\s+are\s+(?:byte-)?identical/i,
    generate: (match) => ({
      command: `diff "${match[1]}" "${match[2]}" > /dev/null 2>&1 && echo "identical" || echo "different"`,
      expected: 'identical',
      compare: 'equals',
    }),
  },

  // ── 5. test_suite_green ──────────────────────────────────────────────────
  // Matches: "npm test passes with 0 failures"
  //          "test suite passes"
  //          "all tests green"
  //          "2500 tests pass"
  {
    name: 'test_suite_green',
    regex: /npm test passes|test suite passes|all tests (?:green|pass)|(\d+)\s+tests?\s+pass/i,
    generate: () => ({
      command: `npm test 2>&1 | grep "# fail" | head -1`,
      expected: '# fail 0',
      compare: 'contains',
    }),
  },

  // ── 6. coverage_threshold ────────────────────────────────────────────────
  // Matches: "coverage >= 90%"
  //          "coverage above 80%"
  //          "coverage at least 75%"
  {
    name: 'coverage_threshold',
    regex: /coverage\s*(?:>=?|above|at least)\s*(\d+)%/i,
    generate: (match) => ({
      command: `npm run test:coverage 2>&1 | grep "All files" | awk '{print $4}'`,
      expected: match[1],
      compare: 'gte',
    }),
  },

  // ── 7. file_not_contains ─────────────────────────────────────────────────
  // Matches: "output.log does not contain "ERROR""
  // Must come before file_contains to avoid partial match
  {
    name: 'file_not_contains',
    regex: /(\S+)\s+does not contain\s+"([^"]+)"/i,
    generate: (match) => ({
      command: `grep -c "${match[2]}" "${match[1]}" 2>/dev/null || echo "0"`,
      expected: '0',
      compare: 'equals',
    }),
  },

  // ── 8. file_contains ─────────────────────────────────────────────────────
  // Matches: 'checkpoint.cjs contains "writeCheckpoint"'
  //          'config.json includes "version"'
  {
    name: 'file_contains',
    regex: /(\S+)\s+(?:contains?|includes?)\s+"([^"]+)"/i,
    generate: (match) => ({
      command: `grep -c "${match[2]}" "${match[1]}"`,
      expected: '0',
      compare: 'gt',
    }),
  },
];

/**
 * matchPattern — Match a must_have string against the pattern registry.
 *
 * Iterates patterns in order and returns the first match as a MatchResult.
 * Unrecognized must_haves return { pattern: null, assertion: null, original }.
 *
 * @param {string} mustHaveText - Natural language must_have string from plan frontmatter
 * @returns {{ pattern: string|null, assertion: object|null, original: string }}
 */
function matchPattern(mustHaveText) {
  for (const p of patterns) {
    const match = mustHaveText.match(p.regex);
    if (match) {
      return {
        pattern: p.name,
        assertion: p.generate(match),
        original: mustHaveText,
      };
    }
  }
  return { pattern: null, assertion: null, original: mustHaveText };
}

module.exports = { patterns, matchPattern };
