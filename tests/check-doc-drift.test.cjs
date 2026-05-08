/**
 * check-doc-drift.cjs — Unit Tests
 *
 * Tests for: stripCommas, parsePercent, asInt, parseTapSummary, aggregateCoverage,
 * extractClaims, compareClaim, formatDriftTable, METRICS registry shape,
 * measureCoverageFromJson, measureTestCounts, measure* (filesystem), main()
 * integration via spawnSync.
 *
 * Requirements: DOCDRIFT-01, DOCDRIFT-02, DOCDRIFT-03, DOCDRIFT-04, DOCDRIFT-05
 */
'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const {
  METRICS,
  stripCommas,
  parsePercent,
  asInt,
  aggregateCoverage,
  parseTapSummary,
  extractClaims,
  compareClaim,
  formatDriftTable,
  measureCoverageFromJson,
  measureTestCounts,
  measureAgentCount,
  measureCommandCount,
  measureSkillCount,
  measureHookCount,
} = require('../scripts/check-doc-drift.cjs');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'check-doc-drift.cjs');

function runScript(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
    ...opts,
  });
}

const FIXTURES = path.join(__dirname, 'fixtures', 'doc-drift');

// ─── METRICS registry ─────────────────────────────────────────────────────────

describe('METRICS registry', () => {
  test('METRICS is an array', () => {
    assert.ok(Array.isArray(METRICS));
  });

  test('METRICS.length === 9', () => {
    assert.strictEqual(METRICS.length, 9, `expected 9 entries, got ${METRICS.length}`);
  });

  test('every entry has id, label, claims properties', () => {
    for (const m of METRICS) {
      assert.ok(typeof m.id === 'string', `entry missing id: ${JSON.stringify(m)}`);
      assert.ok(typeof m.label === 'string', `entry missing label: ${m.id}`);
      assert.ok(Array.isArray(m.claims), `entry missing claims array: ${m.id}`);
    }
  });

  test('every entry id matches /^[a-z_]+$/ (snake_case)', () => {
    for (const m of METRICS) {
      assert.match(m.id, /^[a-z_]+$/, `id not snake_case: ${m.id}`);
    }
  });

  test('test_count has 4 claims', () => {
    const m = METRICS.find(m => m.id === 'test_count');
    assert.ok(m, 'test_count not found');
    assert.strictEqual(m.claims.length, 4);
  });

  test('agent_count has 5 claims', () => {
    const m = METRICS.find(m => m.id === 'agent_count');
    assert.ok(m, 'agent_count not found');
    assert.strictEqual(m.claims.length, 5);
  });

  test('command_count has 4 claims', () => {
    const m = METRICS.find(m => m.id === 'command_count');
    assert.ok(m, 'command_count not found');
    assert.strictEqual(m.claims.length, 4);
  });

  test('skill_count has 4 claims', () => {
    const m = METRICS.find(m => m.id === 'skill_count');
    assert.ok(m, 'skill_count not found');
    assert.strictEqual(m.claims.length, 4);
  });

  test('hook_count_execution has 3 claims', () => {
    const m = METRICS.find(m => m.id === 'hook_count_execution');
    assert.ok(m, 'hook_count_execution not found');
    assert.strictEqual(m.claims.length, 3);
  });

  test('branch_coverage has 0 claims (Pitfall 4 — empty claims is valid)', () => {
    const m = METRICS.find(m => m.id === 'branch_coverage');
    assert.ok(m, 'branch_coverage not found');
    assert.strictEqual(m.claims.length, 0);
  });

  test('function_coverage has 0 claims', () => {
    const m = METRICS.find(m => m.id === 'function_coverage');
    assert.ok(m, 'function_coverage not found');
    assert.strictEqual(m.claims.length, 0);
  });

  test('every claim regex is a RegExp instance', () => {
    for (const metric of METRICS) {
      for (const c of metric.claims) {
        assert.ok(c.regex instanceof RegExp, `${metric.id} claim has non-RegExp regex`);
      }
    }
  });

  test('every claim normalize is one of stripCommas, parsePercent, asInt', () => {
    const valid = new Set([stripCommas, parsePercent, asInt]);
    for (const metric of METRICS) {
      for (const c of metric.claims) {
        assert.ok(valid.has(c.normalize), `${metric.id} claim has unknown normalize fn`);
      }
    }
  });

  test('every claim file is one of CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md', () => {
    const allowed = new Set(['CLAUDE.md', 'README.md', 'docs/DEVOPS-HANDOFF.md']);
    for (const metric of METRICS) {
      for (const c of metric.claims) {
        assert.ok(allowed.has(c.file), `${metric.id} claim has unexpected file: ${c.file}`);
      }
    }
  });

  test('empty-claims guard: every enforced metric has non-empty claims (branch_coverage and function_coverage are allowed empty in v1)', () => {
    const allowedEmpty = new Set(['branch_coverage', 'function_coverage']);
    for (const entry of METRICS) {
      if (!allowedEmpty.has(entry.id)) {
        assert.ok(
          entry.claims.length > 0,
          `METRICS entry '${entry.id}' has empty claims array — either add the regex or add it to the v1 allowed-empty list`
        );
      }
    }
  });
});

// ─── stripCommas ──────────────────────────────────────────────────────────────

describe('stripCommas', () => {
  test('strips commas from formatted number', () => {
    assert.strictEqual(stripCommas('2,667'), '2667');
  });

  test('leaves number without commas unchanged', () => {
    assert.strictEqual(stripCommas('2667'), '2667');
  });

  test('strips multiple commas (millions)', () => {
    assert.strictEqual(stripCommas('1,234,567'), '1234567');
  });

  test('handles zero', () => {
    assert.strictEqual(stripCommas('0'), '0');
  });

  test('handles empty string', () => {
    assert.strictEqual(stripCommas(''), '');
  });
});

// ─── parsePercent ─────────────────────────────────────────────────────────────

describe('parsePercent', () => {
  test('parses plain percent string to float', () => {
    assert.strictEqual(parsePercent('91.23'), 91.23);
  });

  test('strips trailing % before parsing', () => {
    assert.strictEqual(parsePercent('91.23%'), 91.23);
  });

  test('parses 100', () => {
    assert.strictEqual(parsePercent('100'), 100);
  });

  test('parses 0', () => {
    assert.strictEqual(parsePercent('0'), 0);
  });

  test('parses small fractional value', () => {
    assert.strictEqual(parsePercent('0.01'), 0.01);
  });
});

// ─── asInt ────────────────────────────────────────────────────────────────────

describe('asInt', () => {
  test('parses numeric string to int', () => {
    assert.strictEqual(asInt('17'), 17);
  });

  test('parses zero', () => {
    assert.strictEqual(asInt('0'), 0);
  });

  test('parses large number', () => {
    assert.strictEqual(asInt('999'), 999);
  });

  test('returns NaN for non-numeric input', () => {
    assert.ok(Number.isNaN(asInt('not-a-number')));
  });
});

// ─── parseTapSummary ──────────────────────────────────────────────────────────

describe('parseTapSummary', () => {
  test('parses full TAP block with tests and suites', () => {
    const r = parseTapSummary('# tests 2723\n# suites 545\n# pass 2723\n# fail 0\n');
    assert.strictEqual(r.tests, 2723);
    assert.strictEqual(r.suites, 545);
  });

  test('defaults suites to 0 when line absent (Pitfall 6 fallback)', () => {
    const r = parseTapSummary('# tests 100\n# pass 100\n# fail 0\n');
    assert.strictEqual(r.tests, 100);
    assert.strictEqual(r.suites, 0);
  });

  test('empty input returns { tests: 0, suites: 0 }', () => {
    const r = parseTapSummary('');
    assert.strictEqual(r.tests, 0);
    assert.strictEqual(r.suites, 0);
  });

  test('CRLF line endings (whitespace-tolerant)', () => {
    const r = parseTapSummary('# tests 100\r\n# suites 50\r\n');
    assert.strictEqual(r.tests, 100);
    assert.strictEqual(r.suites, 50);
  });
});

// ─── aggregateCoverage ────────────────────────────────────────────────────────

describe('aggregateCoverage', () => {
  test('clean fixture aggregates to ~90.00% line, ~75.00% branch, ~100.00% function', () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, 'clean', 'coverage', 'coverage-final.json'), 'utf8')
    );
    const { line, branch, function: function_ } = aggregateCoverage(data);
    assert.ok(Math.abs(line - 90.00) < 0.01, `line ${line} not ~90.00`);
    assert.ok(Math.abs(branch - 75.00) < 0.01, `branch ${branch} not ~75.00`);
    assert.ok(Math.abs(function_ - 100.00) < 0.01, `function ${function_} not ~100.00`);
  });

  test('drift fixture aggregates to ~90.00% line (same JSON shape as clean)', () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, 'drift', 'coverage', 'coverage-final.json'), 'utf8')
    );
    const { line } = aggregateCoverage(data);
    assert.ok(Math.abs(line - 90.00) < 0.01, `drift fixture line ${line} not ~90.00`);
  });

  test('branch flatten (Pitfall 7): arrays are unpacked, not counted as scalars', () => {
    // b: { '0': [1,0,1], '1': [0,0] } => flat = [1,0,1,0,0] => covered=2, total=5 => 40%
    const data = {
      f: {
        s: { '0': 1 },
        b: { '0': [1, 0, 1], '1': [0, 0] },
        f: { '0': 1 },
      },
    };
    const { branch } = aggregateCoverage(data);
    assert.ok(Math.abs(branch - 40.00) < 0.01, `branch ${branch} not ~40.00`);
  });

  test('empty data returns { line: 0, branch: 0, function: 0 } without throwing', () => {
    const r = aggregateCoverage({});
    assert.strictEqual(r.line, 0);
    assert.strictEqual(r.branch, 0);
    assert.strictEqual(r.function, 0);
  });
});

// ─── extractClaims ────────────────────────────────────────────────────────────

describe('extractClaims', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('clean CLAUDE.md test_count claim returns 1 record with claimed=100', () => {
    const claimsForFile = METRICS
      .find(m => m.id === 'test_count').claims
      .filter(c => c.file === 'CLAUDE.md')
      .map(c => ({ ...c, metric: 'test_count' }));
    const results = extractClaims(
      path.join(FIXTURES, 'clean', 'CLAUDE.md'),
      claimsForFile
    );
    assert.strictEqual(results.length, 1, `expected 1 claim, got ${results.length}`);
    assert.ok(results[0].line > 0, 'line should be positive int');
    assert.strictEqual(results[0].metric, 'test_count');
    assert.strictEqual(results[0].claimed, '100');
  });

  test('clean CLAUDE.md agent_count returns 2 records both with claimed=0', () => {
    const claimsForFile = METRICS
      .find(m => m.id === 'agent_count').claims
      .filter(c => c.file === 'CLAUDE.md')
      .map(c => ({ ...c, metric: 'agent_count' }));
    const results = extractClaims(
      path.join(FIXTURES, 'clean', 'CLAUDE.md'),
      claimsForFile
    );
    assert.strictEqual(results.length, 2, `expected 2 agent_count claims, got ${results.length}`);
    for (const r of results) {
      assert.strictEqual(r.claimed, '0', `expected claimed=0, got ${r.claimed}`);
    }
  });

  test('drift CLAUDE.md command_count returns at least 1 record with claimed=999', () => {
    const claimsForFile = METRICS
      .find(m => m.id === 'command_count').claims
      .filter(c => c.file === 'CLAUDE.md')
      .map(c => ({ ...c, metric: 'command_count' }));
    const results = extractClaims(
      path.join(FIXTURES, 'drift', 'CLAUDE.md'),
      claimsForFile
    );
    assert.ok(results.length >= 1, `expected at least 1 command_count claim, got ${results.length}`);
    assert.ok(results.some(r => r.claimed === '999'), 'expected at least one claimed=999');
  });

  test('empty claims array returns []', () => {
    const results = extractClaims(
      path.join(FIXTURES, 'clean', 'CLAUDE.md'),
      []
    );
    assert.deepStrictEqual(results, []);
  });

  test('non-existent file returns [] gracefully (does not throw)', () => {
    const claimsForFile = METRICS
      .find(m => m.id === 'test_count').claims
      .filter(c => c.file === 'CLAUDE.md')
      .map(c => ({ ...c, metric: 'test_count' }));
    const results = extractClaims(
      path.join(FIXTURES, 'does-not-exist.md'),
      claimsForFile
    );
    assert.deepStrictEqual(results, []);
  });

  test('regex anchoring (Pitfall 1): agent_count regex does not match "widgets" instead of "agents"', () => {
    // The agent_count regex /(\d+)\s+agents,\s+\d+\s+hooks/ should NOT match "99 widgets, 33 hooks"
    const tmpFile = path.join(tmpDir, 'README.md');
    fs.writeFileSync(tmpFile, '99 widgets, 33 hooks\n', 'utf8');
    const claimsForFile = METRICS
      .find(m => m.id === 'agent_count').claims
      .filter(c => c.file === 'README.md')
      .map(c => ({ ...c, metric: 'agent_count' }));
    const results = extractClaims(tmpFile, claimsForFile);
    assert.deepStrictEqual(results, [], 'regex matched "widgets" when it should only match "agents"');
  });

  test('cross-file isolation (Pitfall 1): README.md claim regexes do not match CLAUDE.md content', () => {
    // Pass claims whose file='README.md' against a CLAUDE.md path content
    // The README table pattern (/\|\s*Test assertions\s*\|\s*(\d+)\s*\|/) won't match
    // the CLAUDE.md Scale line format ("5 test suites, 100 assertions")
    const claimsForFile = METRICS
      .find(m => m.id === 'test_count').claims
      .filter(c => c.file === 'README.md')
      .map(c => ({ ...c, metric: 'test_count' }));
    const results = extractClaims(
      path.join(FIXTURES, 'clean', 'CLAUDE.md'),
      claimsForFile
    );
    assert.deepStrictEqual(results, [], 'README.md regexes should not match CLAUDE.md content');
  });

  test('multi-line sanity: live CLAUDE.md/README.md/DEVOPS-HANDOFF.md claims are all single-line', () => {
    // For every living doc, verify that the line-by-line scan misses no claim
    // that a whole-file scan with the m flag would find. If this test fails,
    // a future doc edit has wrapped a claim across lines — the detector would
    // silently miss it. The invariant: wholeFileMatches > 0 implies lineByLineMatches > 0.
    const repoRoot = path.join(__dirname, '..');
    const docPaths = [
      path.join(repoRoot, 'CLAUDE.md'),
      path.join(repoRoot, 'README.md'),
      path.join(repoRoot, 'docs', 'DEVOPS-HANDOFF.md'),
    ];
    const docBasenames = ['CLAUDE.md', 'README.md', 'docs/DEVOPS-HANDOFF.md'];

    for (let di = 0; di < docPaths.length; di++) {
      const docPath = docPaths[di];
      const docBasename = docBasenames[di];
      if (!fs.existsSync(docPath)) continue;

      const fullText = fs.readFileSync(docPath, 'utf8');
      const lines = fullText.split('\n');

      for (const metric of METRICS) {
        for (const claim of metric.claims) {
          if (claim.file !== docBasename) continue;

          // Line-by-line matches (current impl behavior)
          const lineByLineMatches = lines.filter(l => claim.regex.test(l)).length;

          // Whole-file matches with global+multiline flag
          const gFlag = new RegExp(claim.regex.source, 'gm');
          let wholeFileMatches = 0;
          let match;
          while ((match = gFlag.exec(fullText)) !== null) {
            wholeFileMatches++;
          }

          // If whole-file found matches but line-by-line found none => claim spans lines
          if (wholeFileMatches > 0 && lineByLineMatches === 0) {
            assert.fail(
              `Metric '${metric.id}' claim in '${docBasename}' appears to span lines — ` +
              `whole-file found ${wholeFileMatches} match(es) but line-by-line found 0. ` +
              `This means the claim wraps across a newline and will be silently missed.`
            );
          }
        }
      }
    }
    // If we reach here: all living doc claims are single-line (invariant holds)
  });
});

// ─── compareClaim ─────────────────────────────────────────────────────────────

describe('compareClaim', () => {
  test('integer match after stripCommas returns null', () => {
    const r = compareClaim({ claimed: '2,723', actual: 2723, normalize: stripCommas });
    assert.strictEqual(r, null);
  });

  test('integer drift after stripCommas returns drift object with claimed and actual', () => {
    const r = compareClaim({ claimed: '2,667', actual: 2723, normalize: stripCommas });
    assert.ok(r !== null, 'expected drift object, got null');
    assert.strictEqual(r.claimed, '2,667');
    assert.strictEqual(r.actual, '2723');
  });

  test('percentage match within tolerance returns null', () => {
    // delta = 0.005 <= 0.01
    const r = compareClaim({ claimed: '91.23', actual: 91.235, normalize: parsePercent, epsilon: 0.01 });
    assert.strictEqual(r, null);
  });

  test('percentage drift outside tolerance returns drift object', () => {
    // delta = 0.11 > 0.01
    const r = compareClaim({ claimed: '91.23', actual: 91.34, normalize: parsePercent, epsilon: 0.01 });
    assert.ok(r !== null, 'expected drift object, got null');
  });

  test('default epsilon of 0.01 used when epsilon not supplied', () => {
    // delta = 0.004 <= 0.01 — should match
    const r = compareClaim({ claimed: '91.23', actual: 91.234, normalize: parsePercent });
    assert.strictEqual(r, null);
  });

  test('integer claim-actual exact match with asInt returns null', () => {
    const r = compareClaim({ claimed: '17', actual: 17, normalize: asInt });
    assert.strictEqual(r, null);
  });
});

// ─── formatDriftTable ─────────────────────────────────────────────────────────

describe('formatDriftTable', () => {
  test('empty array returns empty string', () => {
    assert.strictEqual(formatDriftTable([], '/repo'), '');
  });

  test('single record output contains all five column headers', () => {
    const out = formatDriftTable(
      [{ file: '/repo/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' }],
      '/repo'
    );
    assert.ok(out.includes('FILE'), 'missing FILE header');
    assert.ok(out.includes('LINE'), 'missing LINE header');
    assert.ok(out.includes('METRIC'), 'missing METRIC header');
    assert.ok(out.includes('CLAIMED'), 'missing CLAIMED header');
    assert.ok(out.includes('ACTUAL'), 'missing ACTUAL header');
  });

  test('single record data row contains expected values', () => {
    const out = formatDriftTable(
      [{ file: '/repo/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' }],
      '/repo'
    );
    assert.ok(out.includes('CLAUDE.md'), 'missing CLAUDE.md in output');
    assert.ok(out.includes('14'), 'missing line 14 in output');
    assert.ok(out.includes('command_count'), 'missing metric in output');
    assert.ok(out.includes('65'), 'missing claimed in output');
    assert.ok(out.includes('66'), 'missing actual in output');
  });

  test('repoRoot is stripped from file paths', () => {
    const out = formatDriftTable(
      [{ file: '/repo/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' }],
      '/repo'
    );
    assert.ok(!out.includes('/repo/CLAUDE.md'), 'full path should be stripped to relative');
  });

  test('header underline matches /^-+( +-+)+$/', () => {
    const out = formatDriftTable(
      [{ file: '/repo/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' }],
      '/repo'
    );
    const lines = out.split('\n');
    assert.ok(lines.length >= 2, 'expected at least header + underline');
    assert.match(lines[1], /^-+( +-+)+$/, `underline line does not match: "${lines[1]}"`);
  });

  test('multi-record output has stable column widths (header FILE aligns with data)', () => {
    const records = [
      { file: '/r/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' },
      { file: '/r/README.md', line: 59, metric: 'test_count', claimed: '2,667', actual: '2723' },
    ];
    const out = formatDriftTable(records, '/r');
    const lines = out.split('\n');
    const headerLine = lines[0];
    assert.ok(headerLine.startsWith('FILE'), 'header should start with FILE');
  });

  test('document-order sorting: CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md regardless of insertion order', () => {
    const records = [
      { file: '/r/docs/DEVOPS-HANDOFF.md', line: 46, metric: 'command_count', claimed: '65', actual: '66' },
      { file: '/r/CLAUDE.md', line: 14, metric: 'command_count', claimed: '65', actual: '66' },
      { file: '/r/README.md', line: 59, metric: 'command_count', claimed: '65', actual: '66' },
    ];
    const out = formatDriftTable(records, '/r');
    const dataLines = out.split('\n').slice(2); // skip header + underline
    assert.ok(dataLines[0].includes('CLAUDE.md'), `first data row should be CLAUDE.md, got: ${dataLines[0]}`);
    assert.ok(dataLines[1].includes('README.md'), `second data row should be README.md, got: ${dataLines[1]}`);
    assert.ok(dataLines[2].includes('DEVOPS-HANDOFF.md'), `third data row should be DEVOPS-HANDOFF.md, got: ${dataLines[2]}`);
  });
});

// ─── measureCoverageFromJson ──────────────────────────────────────────────────

describe('measureCoverageFromJson', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-cov-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('reads clean fixture and returns ~90.00% line coverage', () => {
    const result = measureCoverageFromJson(path.join(FIXTURES, 'clean'), 3600);
    assert.ok(typeof result.line === 'number', 'line should be a number');
    assert.ok(typeof result.branch === 'number', 'branch should be a number');
    assert.ok(typeof result.function === 'number', 'function should be a number');
    assert.ok(Math.abs(result.line - 90.00) < 0.01, `line ${result.line} not ~90.00`);
  });

  test('stale coverage-final.json exits 2 with remediation message in stderr', () => {
    // Write a coverage dir with a JSON file then backdate it by 2 hours
    const covDir = path.join(tmpDir, 'coverage');
    fs.mkdirSync(covDir, { recursive: true });
    const covPath = path.join(covDir, 'coverage-final.json');
    const cleanData = fs.readFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'coverage-final.json'),
      'utf8'
    );
    fs.writeFileSync(covPath, cleanData, 'utf8');
    // Backdate by 2 hours (7200 seconds)
    const twoHoursAgo = new Date(Date.now() - 7200 * 1000);
    fs.utimesSync(covPath, twoHoursAgo, twoHoursAgo);
    // Also copy test-stats.json so the script gets past test-count step
    fs.writeFileSync(path.join(covDir, 'test-stats.json'), '{"tests":100,"suites":5}', 'utf8');
    // Spawn with default staleSecs=3600 — must exit 2 due to staleness
    const result = runScript(['--root', tmpDir]);
    assert.strictEqual(result.status, 2, `expected exit 2 (stale), got ${result.status}`);
    assert.ok(
      result.stderr.includes('coverage data missing or stale'),
      `expected "coverage data missing or stale" in stderr, got: ${result.stderr}`
    );
  });

  test('--coverage-stale-secs 0 disables the staleness check', () => {
    // Same stale fixture as above — should NOT exit 2 for staleness reasons
    const covDir = path.join(tmpDir, 'coverage');
    fs.mkdirSync(covDir, { recursive: true });
    const covPath = path.join(covDir, 'coverage-final.json');
    const cleanData = fs.readFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'coverage-final.json'),
      'utf8'
    );
    fs.writeFileSync(covPath, cleanData, 'utf8');
    const twoHoursAgo = new Date(Date.now() - 7200 * 1000);
    fs.utimesSync(covPath, twoHoursAgo, twoHoursAgo);
    fs.writeFileSync(path.join(covDir, 'test-stats.json'), '{"tests":100,"suites":5}', 'utf8');
    // With --coverage-stale-secs 0, staleness check is skipped
    const result = runScript(['--root', tmpDir, '--coverage-stale-secs', '0']);
    // Should NOT exit 2 with a "missing or stale" message (may exit 0 or 1 due to missing docs)
    const staleExit = result.status === 2 && result.stderr.includes('coverage data missing or stale');
    assert.ok(!staleExit, `--coverage-stale-secs 0 should disable staleness check, got exit ${result.status} and stderr: ${result.stderr}`);
  });

  test('missing coverage-final.json exits 2 (edge/no-coverage fixture)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'edge', 'no-coverage')]);
    assert.strictEqual(result.status, 2, `expected exit 2 (no coverage), got ${result.status}`);
    assert.ok(
      result.stderr.includes('coverage data missing or stale'),
      `expected "coverage data missing or stale" in stderr, got: ${result.stderr}`
    );
  });
});

// ─── measureTestCounts ────────────────────────────────────────────────────────

describe('measureTestCounts', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-tc-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('when coverage/test-stats.json exists, returns its { tests, suites }', () => {
    const result = measureTestCounts(path.join(FIXTURES, 'clean'));
    assert.strictEqual(result.tests, 100, `expected tests=100, got ${result.tests}`);
    assert.strictEqual(result.suites, 5, `expected suites=5, got ${result.suites}`);
  });

  test('drift fixture test-stats.json returns { tests: 100, suites: 5 }', () => {
    const result = measureTestCounts(path.join(FIXTURES, 'drift'));
    assert.strictEqual(result.tests, 100, `expected tests=100, got ${result.tests}`);
    assert.strictEqual(result.suites, 5, `expected suites=5, got ${result.suites}`);
  });

  test('measureTestCounts returns { tests: 0, suites: 0 } when execFileSync throws with empty stdout', () => {
    // Create a temp dir WITHOUT test-stats.json so function falls through to spawn path.
    // Populate tests/broken.test.cjs with deliberately invalid JS so node --test fails
    // before emitting any TAP (err.stdout === '').
    const testsDir = path.join(tmpDir, 'tests');
    fs.mkdirSync(testsDir, { recursive: true });
    fs.writeFileSync(path.join(testsDir, 'broken.test.cjs'), 'const ;;; this is not valid;', 'utf8');
    // No coverage/test-stats.json — fall through to spawn
    const result = measureTestCounts(tmpDir);
    assert.strictEqual(result.tests, 0, `expected tests=0 on broken spawn, got ${result.tests}`);
    assert.strictEqual(result.suites, 0, `expected suites=0 on broken spawn, got ${result.suites}`);
  });
});

// ─── measure filesystem (agent/command/skill/hook) ────────────────────────────

describe('measure filesystem (agent/command/skill/hook)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-fs-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('measureAgentCount counts gsd-*.md files only', () => {
    const agentsDir = path.join(tmpDir, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(path.join(agentsDir, 'gsd-foo.md'), '', 'utf8');
    fs.writeFileSync(path.join(agentsDir, 'gsd-bar.md'), '', 'utf8');
    fs.writeFileSync(path.join(agentsDir, 'other.md'), '', 'utf8');
    fs.writeFileSync(path.join(agentsDir, 'notes.txt'), '', 'utf8');
    assert.strictEqual(measureAgentCount(tmpDir), 2, 'only gsd-*.md files should count');
  });

  test('measureCommandCount counts *.md files in commands/gsd/', () => {
    const gsdDir = path.join(tmpDir, 'commands', 'gsd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.md'), '', 'utf8');
    fs.writeFileSync(path.join(gsdDir, 'b.md'), '', 'utf8');
    fs.writeFileSync(path.join(gsdDir, 'c.md'), '', 'utf8');
    fs.writeFileSync(path.join(gsdDir, 'notes.txt'), '', 'utf8');
    assert.strictEqual(measureCommandCount(tmpDir), 3, 'only .md files should count');
  });

  test('measureSkillCount counts depth-2 skill directories under plugins/', () => {
    const fooSkills = path.join(tmpDir, 'plugins', 'foo', 'skills');
    const barSkills = path.join(tmpDir, 'plugins', 'bar', 'skills');
    fs.mkdirSync(path.join(fooSkills, 'skill-a'), { recursive: true });
    fs.mkdirSync(path.join(fooSkills, 'skill-b'), { recursive: true });
    fs.mkdirSync(path.join(barSkills, 'skill-c'), { recursive: true });
    assert.strictEqual(measureSkillCount(tmpDir), 3, 'expected 3 skill directories');
  });

  test('measureHookCount counts *.js files in hooks/dist/ (excludes .js.map)', () => {
    const distDir = path.join(tmpDir, 'hooks', 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'a.js'), '', 'utf8');
    fs.writeFileSync(path.join(distDir, 'b.js'), '', 'utf8');
    fs.writeFileSync(path.join(distDir, 'c.js.map'), '', 'utf8');
    assert.strictEqual(measureHookCount(tmpDir), 2, 'only .js files should count (not .js.map)');
  });

  test('missing dirs return 0 without throwing', () => {
    // Empty tmpDir — no agents, commands, plugins, hooks dirs
    assert.strictEqual(measureAgentCount(tmpDir), 0);
    assert.strictEqual(measureCommandCount(tmpDir), 0);
    assert.strictEqual(measureSkillCount(tmpDir), 0);
    assert.strictEqual(measureHookCount(tmpDir), 0);
  });
});

// ─── main() exit codes (DOCDRIFT-05) ─────────────────────────────────────────

describe('main() exit codes (DOCDRIFT-05)', () => {
  let tmpDir1;
  let tmpDir2;

  afterEach(() => {
    if (tmpDir1) {
      fs.rmSync(tmpDir1, { recursive: true, force: true });
      tmpDir1 = null;
    }
    if (tmpDir2) {
      fs.rmSync(tmpDir2, { recursive: true, force: true });
      tmpDir2 = null;
    }
  });

  test('clean fixture exits 0 with "match live values" in stdout', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'clean')]);
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(
      result.stdout.includes('match live values'),
      `expected "match live values" in stdout, got: ${result.stdout}`
    );
  });

  test('drift fixture exits 1 with "drift(s) found" in stdout', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'drift')]);
    assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(
      result.stdout.includes('drift(s) found'),
      `expected "drift(s) found" in stdout, got: ${result.stdout}`
    );
  });

  test('edge/no-coverage fixture exits 2 with "coverage data missing or stale" in stderr', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'edge', 'no-coverage')]);
    assert.strictEqual(result.status, 2, `expected exit 2, got ${result.status}`);
    assert.ok(
      result.stderr.includes('coverage data missing or stale'),
      `expected remediation message in stderr, got: ${result.stderr}`
    );
  });

  test('--help exits 0 with "Usage:" and "--json" in stdout', () => {
    const result = runScript(['--help']);
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}`);
    assert.ok(result.stdout.includes('Usage:'), `expected "Usage:" in stdout, got: ${result.stdout}`);
    assert.ok(result.stdout.includes('--json'), `expected "--json" in stdout, got: ${result.stdout}`);
  });

  test('main() exits 2 when run against a path that is not a fixture and a required living doc is absent', () => {
    // Scenario A: tmpDir WITHOUT package.json or .gitignore => isRepoRoot=false => policy=skip => exit 0
    tmpDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-nodoc1-'));
    const covDir1 = path.join(tmpDir1, 'coverage');
    fs.mkdirSync(covDir1, { recursive: true });
    // Copy coverage-final.json and test-stats.json so detector advances past those checks
    fs.copyFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'coverage-final.json'),
      path.join(covDir1, 'coverage-final.json')
    );
    fs.copyFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'test-stats.json'),
      path.join(covDir1, 'test-stats.json')
    );
    // No package.json, no .gitignore => isRepoRoot returns false => policy=skip
    const result1 = runScript(['--root', tmpDir1]);
    assert.strictEqual(result1.status, 0, `skip mode (no pkg.json): expected exit 0, got ${result1.status}; stderr: ${result1.stderr}`);

    // Scenario B: tmpDir WITH package.json AND .gitignore => isRepoRoot=true => policy=fail => exit 2
    tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-drift-nodoc2-'));
    const covDir2 = path.join(tmpDir2, 'coverage');
    fs.mkdirSync(covDir2, { recursive: true });
    fs.copyFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'coverage-final.json'),
      path.join(covDir2, 'coverage-final.json')
    );
    fs.copyFileSync(
      path.join(FIXTURES, 'clean', 'coverage', 'test-stats.json'),
      path.join(covDir2, 'test-stats.json')
    );
    // Add repo-root markers
    fs.writeFileSync(path.join(tmpDir2, 'package.json'), '{"name":"test"}', 'utf8');
    fs.writeFileSync(path.join(tmpDir2, '.gitignore'), 'node_modules/', 'utf8');
    // No CLAUDE.md, README.md, or docs/DEVOPS-HANDOFF.md => should exit 2
    const result2 = runScript(['--root', tmpDir2]);
    assert.strictEqual(result2.status, 2, `fail mode (has pkg.json): expected exit 2, got ${result2.status}; stderr: ${result2.stderr}`);
    assert.ok(
      result2.stderr.includes('required living doc not found:'),
      `expected "required living doc not found:" in stderr, got: ${result2.stderr}`
    );
    assert.ok(
      result2.stderr.includes('run from repo root or use --root <fixtureDir>'),
      `expected remediation suffix in stderr, got: ${result2.stderr}`
    );
  });
});

// ─── main() --json output (DOCDRIFT-04, DOCDRIFT-05) ─────────────────────────

describe('main() --json output (DOCDRIFT-04, DOCDRIFT-05)', () => {
  test('clean fixture --json returns valid JSON with status=clean, empty drift, metrics=9', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'clean'), '--json']);
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); }, 'stdout should be valid JSON');
    assert.strictEqual(obj.status, 'clean', `expected status=clean, got ${obj.status}`);
    assert.ok(Array.isArray(obj.drift), 'drift should be an array');
    assert.strictEqual(obj.drift.length, 0, `expected drift.length=0, got ${obj.drift.length}`);
    assert.strictEqual(typeof obj.checked, 'number', 'checked should be a number');
    assert.strictEqual(typeof obj.files, 'number', 'files should be a number');
    assert.strictEqual(typeof obj.metrics, 'number', 'metrics should be a number');
    assert.strictEqual(obj.metrics, 9, `expected metrics=9, got ${obj.metrics}`);
  });

  test('drift fixture --json returns valid JSON with status=drift, at least 1 record with proper shape', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'drift'), '--json']);
    assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}; stderr: ${result.stderr}`);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); }, 'stdout should be valid JSON');
    assert.strictEqual(obj.status, 'drift', `expected status=drift, got ${obj.status}`);
    assert.ok(obj.drift.length >= 1, `expected at least 1 drift record, got ${obj.drift.length}`);
    for (const rec of obj.drift) {
      assert.strictEqual(typeof rec.file, 'string', 'drift record file should be string');
      assert.strictEqual(typeof rec.line, 'number', 'drift record line should be number');
      assert.strictEqual(typeof rec.metric, 'string', 'drift record metric should be string');
      assert.strictEqual(typeof rec.claimed, 'string', 'drift record claimed should be string');
      assert.strictEqual(typeof rec.actual, 'string', 'drift record actual should be string');
    }
    // At least one metric should be a known metric id
    const knownMetrics = new Set(['command_count', 'agent_count', 'test_count', 'suite_count', 'line_coverage', 'skill_count', 'hook_count_execution']);
    const hasKnown = obj.drift.some(r => knownMetrics.has(r.metric));
    assert.ok(hasKnown, `expected at least one drift record with a known metric, got: ${obj.drift.map(r => r.metric).join(', ')}`);
  });

  test('drift JSON claimed/actual preserves source representation (test_count=9999 in drift fixture)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'drift'), '--json']);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); });
    const tcRecord = obj.drift.find(r => r.metric === 'test_count');
    if (tcRecord) {
      // CLAUDE.md in drift fixture claims '9999'
      assert.strictEqual(tcRecord.claimed, '9999', `expected claimed='9999', got ${tcRecord.claimed}`);
    }
    // If test_count not in drift (unlikely but possible if fixture changed), skip rather than fail
  });

  test('drift JSON records appear in canonical document order (CLAUDE.md before README.md before DEVOPS-HANDOFF.md)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'drift'), '--json']);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); });
    if (obj.drift.length < 2) return; // not enough records to verify sort
    const docOrder = ['CLAUDE.md', 'README.md', 'docs/DEVOPS-HANDOFF.md'];
    for (let i = 1; i < obj.drift.length; i++) {
      const prev = obj.drift[i - 1];
      const curr = obj.drift[i];
      const pi = docOrder.indexOf(prev.file);
      const ci = docOrder.indexOf(curr.file);
      if (pi !== ci) {
        assert.ok(pi <= ci, `drift records out of document order: ${prev.file} before ${curr.file}`);
      } else {
        assert.ok(prev.line <= curr.line, `within same file, line should be ascending: ${prev.line} > ${curr.line}`);
      }
    }
  });
});

// ─── main() argument validation ───────────────────────────────────────────────

describe('main() argument validation', () => {
  test('--root without value exits 2 with "--root requires a directory argument" in stderr', () => {
    const result = runScript(['--root']);
    assert.strictEqual(result.status, 2, `expected exit 2, got ${result.status}`);
    assert.ok(
      result.stderr.includes('--root requires a directory argument'),
      `expected "--root requires a directory argument" in stderr, got: ${result.stderr}`
    );
  });

  test('--coverage-stale-secs without value exits 2 with "--coverage-stale-secs requires a numeric value" in stderr', () => {
    const result = runScript(['--coverage-stale-secs']);
    assert.strictEqual(result.status, 2, `expected exit 2, got ${result.status}`);
    assert.ok(
      result.stderr.includes('--coverage-stale-secs requires a numeric value'),
      `expected "--coverage-stale-secs requires a numeric value" in stderr, got: ${result.stderr}`
    );
  });

  test('--coverage-stale-secs with non-numeric value exits 2', () => {
    const result = runScript(['--coverage-stale-secs', 'abc']);
    assert.strictEqual(result.status, 2, `expected exit 2 for non-numeric value, got ${result.status}`);
    assert.ok(
      result.stderr.includes('--coverage-stale-secs requires a numeric value'),
      `expected "--coverage-stale-secs requires a numeric value" in stderr, got: ${result.stderr}`
    );
  });
});
