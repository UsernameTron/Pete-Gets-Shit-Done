#!/usr/bin/env node
'use strict';

/**
 * check-doc-drift.cjs — Doc Drift Detector
 *
 * Measures live test counts, coverage, and filesystem inventory and compares
 * those values to numeric claims in CLAUDE.md, README.md, and
 * docs/DEVOPS-HANDOFF.md. Exits 0 on agreement, 1 on drift, 2 on runtime
 * error (missing/stale coverage data, unreadable doc).
 *
 * Usage:
 *   node scripts/check-doc-drift.cjs                       # check the whole repo
 *   node scripts/check-doc-drift.cjs --json                # JSON output
 *   node scripts/check-doc-drift.cjs --root <dir>          # check a specific tree (used by tests)
 *   node scripts/check-doc-drift.cjs --coverage-stale-secs <N>  # override 1h staleness check
 *   node scripts/check-doc-drift.cjs --help                # usage and exit 0
 *
 * Requirements: DOCDRIFT-01, DOCDRIFT-02, DOCDRIFT-03, DOCDRIFT-04, DOCDRIFT-05
 *
 * Plan 56-01 (this file's pure surfaces): METRICS registry + stripCommas,
 *   parsePercent, asInt, parseTapSummary, aggregateCoverage, extractClaims,
 *   compareClaim, formatDriftTable. Direct invocation exits 2 (placeholder).
 * Plan 56-02: measure* I/O functions + main() entrypoint.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

// ─── Normalize Helpers ────────────────────────────────────────────────────────

/**
 * Strip commas from a numeric string. "2,667" -> "2667".
 * @param {string} s
 * @returns {string}
 */
function stripCommas(s) {
  return String(s).replace(/,/g, '');
}

/**
 * Parse a percent string (with or without trailing %) to a float.
 * "91.23" -> 91.23. "91.23%" -> 91.23.
 * @param {string} s
 * @returns {number}
 */
function parsePercent(s) {
  return parseFloat(String(s).replace(/%$/, ''));
}

/**
 * Parse a string to int. Returns NaN for non-numeric input
 * (parseInt('abc', 10) === NaN — the caller is responsible for NaN-handling).
 * @param {string} s
 * @returns {number}
 */
function asInt(s) {
  return parseInt(String(s), 10);
}

// ─── METRICS Registry ─────────────────────────────────────────────────────────

const METRICS = [
  {
    id: 'test_count',
    label: 'test count',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /-\s+\*\*Scale\*\*:\s+(\d{1,3}(?:,\d{3})*|\d+)\s+test suites,\s+(\d{1,3}(?:,\d{3})*|\d+)\s+assertions/,
        captureIndex: 2,
        normalize: stripCommas,
      },
      {
        file: 'README.md',
        regex: /\|\s*Test assertions\s*\|\s*(\d{1,3}(?:,\d{3})*|\d+)\s*\|/,
        captureIndex: 1,
        normalize: stripCommas,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /Run\s+(\d{1,3}(?:,\d{3})*|\d+)\s+unit tests via/,
        captureIndex: 1,
        normalize: stripCommas,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /\|\s*Unit tests\s*\|\s*(\d{1,3}(?:,\d{3})*|\d+)\s*\|/,
        captureIndex: 1,
        normalize: stripCommas,
      },
    ],
  },
  {
    id: 'suite_count',
    label: 'suite count',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /-\s+\*\*Scale\*\*:\s+(\d{1,3}(?:,\d{3})*|\d+)\s+test suites/,
        captureIndex: 1,
        normalize: stripCommas,
      },
      {
        file: 'README.md',
        regex: /\|\s*Test suites\s*\|\s*(\d{1,3}(?:,\d{3})*|\d+)\s*\|/,
        captureIndex: 1,
        normalize: stripCommas,
      },
    ],
  },
  {
    id: 'line_coverage',
    label: 'line coverage',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /-\s+\*\*Scale\*\*:.*?(\d{2,3}\.\d{1,2})%\s+line coverage/,
        captureIndex: 1,
        normalize: parsePercent,
      },
    ],
  },
  {
    id: 'branch_coverage',
    label: 'branch coverage',
    measure: null,
    // V1 allowed-empty (Codex suggestion adopted from REVIEWS.md #4):
    // The `describe('METRICS registry')` empty-claims guard test whitelists
    // exactly ['branch_coverage', 'function_coverage']. No living doc currently
    // makes an aggregate claim for branch coverage or function coverage as of
    // 2026-05-08. If that changes (e.g., a future doc adds "branch coverage:
    // 83.22%"), add the regex here and remove the id from the whitelist.
    claims: [
      // Empty in v1 — no doc states aggregate branch coverage as a single percent.
      // Per D-04 + Pitfall 4, the metric still exists but has no claims to compare.
    ],
  },
  {
    id: 'function_coverage',
    label: 'function coverage',
    measure: null,
    // V1 allowed-empty — same rationale as branch_coverage above. Whitelisted in
    // the empty-claims guard test (REVIEWS.md "Recommended Replanning" #4).
    claims: [
      // Empty in v1 — same reason as branch_coverage.
    ],
  },
  {
    id: 'agent_count',
    label: 'agent count',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /\*\*(\d+)\s+built-in agents\*\*/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'CLAUDE.md',
        regex: /GSD also ships\s+(\d+)\s+built-in agents/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /(\d+)\s+agents,\s+\d+\s+hooks/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /\|\s*Specialized agents\s*\|\s*(\d+)\s*\|/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /(\d+)\s+specialized agent definitions/,
        captureIndex: 1,
        normalize: asInt,
      },
    ],
  },
  {
    id: 'command_count',
    label: 'command count',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /\*\*(\d+)\s+slash commands\*\*/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /(\d+)\s+commands,\s+\d+\s+agents/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /\|\s*GSD commands\s*\|\s*(\d+)\s*\|/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /(\d+)\s+GSD slash commands/,
        captureIndex: 1,
        normalize: asInt,
      },
    ],
  },
  {
    id: 'skill_count',
    label: 'skill count',
    measure: null,
    claims: [
      {
        file: 'CLAUDE.md',
        regex: /\*\*(\d+)\s+Claude Code skills\*\*/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /\((\d+)\s+skills,\s+\d+\s+subagents\)/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /\|\s*Plugin skills\s*\|\s*(\d+)/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /(\d+)\s+skills,\s+\d+\s+subagents/,
        captureIndex: 1,
        normalize: asInt,
      },
    ],
  },
  {
    id: 'hook_count_execution',
    label: 'execution hooks',
    measure: null,
    claims: [
      {
        file: 'README.md',
        regex: /\d+\s+agents,\s+(\d+)\s+hooks,\s+wave-based/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'README.md',
        regex: /(\d+)\s+execution\s+\+\s+\d+\s+governance/,
        captureIndex: 1,
        normalize: asInt,
      },
      {
        file: 'docs/DEVOPS-HANDOFF.md',
        regex: /(\d+)\s+execution hooks \(bundled JS\)/,
        captureIndex: 1,
        normalize: asInt,
      },
    ],
  },
];

// ─── Wire measure callbacks onto METRICS ──────────────────────────────────────
//
// CONTEXT D-04 maps metric IDs to measurement functions. Each callback receives
// a context object containing the precomputed coverage and test-stats so per-
// metric measurement does not redo I/O.
// NOTE: metricMeasureMap references the measure* functions defined below the
// METRICS registry. The wiring loop runs at module load time — after all
// functions are hoisted by Node's CJS module evaluation.

const metricMeasureMap = {
  test_count: (ctx) => ctx.testStats.tests,
  suite_count: (ctx) => ctx.testStats.suites,
  line_coverage: (ctx) => ctx.coverage.line,
  branch_coverage: (ctx) => ctx.coverage.branch,
  function_coverage: (ctx) => ctx.coverage.function,
  agent_count: (ctx) => measureAgentCount(ctx.repoRoot),
  command_count: (ctx) => measureCommandCount(ctx.repoRoot),
  skill_count: (ctx) => measureSkillCount(ctx.repoRoot),
  hook_count_execution: (ctx) => measureHookCount(ctx.repoRoot),
};

for (const m of METRICS) {
  m.measure = metricMeasureMap[m.id];
  if (typeof m.measure !== 'function') {
    throw new Error(`METRICS registry: no measure callback wired for id=${m.id}`);
  }
}

// ─── parseTapSummary ──────────────────────────────────────────────────────────

/**
 * Parse the TAP summary block emitted by `node --test --test-reporter=tap`.
 * Looks for `# tests N` and `# suites N` lines (start-of-line anchored, multiline mode).
 * Returns { tests, suites }; suites defaults to 0 if line absent (Pitfall 6).
 *
 * @param {string} tapOutput
 * @returns {{ tests: number, suites: number }}
 */
function parseTapSummary(tapOutput) {
  const text = String(tapOutput || '');
  const tm = text.match(/^# tests (\d+)$/m);
  const sm = text.match(/^# suites (\d+)$/m);
  return {
    tests: tm ? parseInt(tm[1], 10) : 0,
    suites: sm ? parseInt(sm[1], 10) : 0,
  };
}

// ─── aggregateCoverage ────────────────────────────────────────────────────────

/**
 * Aggregate per-file s/b/f maps from a parsed coverage-final.json object.
 * Per RESEARCH §3 + §6 Pitfall 7:
 *   - s values are scalar hit counts: covered = filter(v=>v>0).length, total = .length
 *   - b values are arrays per branch (per Istanbul/c8 schema): flatten then count
 *   - f values are scalar hit counts: same shape as s
 *
 * @param {object} jsonData  Parsed coverage-final.json (each value has s, b, f maps)
 * @returns {{ line: number, branch: number, function: number }}
 */
function aggregateCoverage(jsonData) {
  let sCov = 0, sTot = 0, bCov = 0, bTot = 0, fCov = 0, fTot = 0;
  for (const info of Object.values(jsonData || {})) {
    const sVals = Object.values(info.s || {});
    sCov += sVals.filter(v => v > 0).length;
    sTot += sVals.length;
    const bFlat = Object.values(info.b || {}).flat();
    bCov += bFlat.filter(v => v > 0).length;
    bTot += bFlat.length;
    const fVals = Object.values(info.f || {});
    fCov += fVals.filter(v => v > 0).length;
    fTot += fVals.length;
  }
  return {
    line: sTot > 0 ? (sCov / sTot) * 100 : 0,
    branch: bTot > 0 ? (bCov / bTot) * 100 : 0,
    function: fTot > 0 ? (fCov / fTot) * 100 : 0,
  };
}

// ─── Measurement Functions ────────────────────────────────────────────────────

/**
 * Read coverage/coverage-final.json under repoRoot and aggregate.
 * Exits 2 via process.exit if the file is missing or older than staleSecs
 * (default 3600). Set staleSecs = 0 to disable the freshness check.
 *
 * @param {string} repoRoot
 * @param {number} staleSecs
 * @returns {{ line: number, branch: number, function: number }}
 */
function measureCoverageFromJson(repoRoot, staleSecs = 3600) {
  const covPath = path.join(repoRoot, 'coverage', 'coverage-final.json');
  if (!fs.existsSync(covPath)) {
    process.stderr.write(
      "coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs\n"
    );
    process.exit(2);
  }
  if (staleSecs > 0) {
    const ageMs = Date.now() - fs.statSync(covPath).mtimeMs;
    if (ageMs > staleSecs * 1000) {
      process.stderr.write(
        "coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs\n"
      );
      process.exit(2);
    }
  }
  const json = JSON.parse(fs.readFileSync(covPath, 'utf8'));
  return aggregateCoverage(json);
}

/**
 * Measure live test count and suite count.
 *
 * Resolution order:
 *   1. If <repoRoot>/coverage/test-stats.json exists, return its {tests, suites}.
 *   2. Otherwise spawn `node --test --test-reporter=tap` against tests/*.test.cjs.
 *
 * @param {string} repoRoot
 * @returns {{ tests: number, suites: number }}
 */
function measureTestCounts(repoRoot) {
  const statsPath = path.join(repoRoot, 'coverage', 'test-stats.json');
  if (fs.existsSync(statsPath)) {
    const s = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    return { tests: Number(s.tests) || 0, suites: Number(s.suites) || 0 };
  }
  const testsDir = path.join(repoRoot, 'tests');
  if (!fs.existsSync(testsDir)) return { tests: 0, suites: 0 };
  const testFiles = fs.readdirSync(testsDir)
    .filter(f => f.endsWith('.test.cjs'))
    .sort()
    .map(f => path.join(testsDir, f));
  if (testFiles.length === 0) return { tests: 0, suites: 0 };
  let tap = '';
  try {
    // maxBuffer: 16 * 1024 * 1024 hardens against TAP-stdout truncation when the
    // suite grows past Node's default 1MB limit (Codex MEDIUM, REVIEWS.md). Without
    // this, large suites can throw ENOBUFS and the catch-block returns 0 tests
    // even though the run was healthy.
    tap = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    // node --test exits non-zero when any test fails; we still want the TAP summary.
    // If err.stdout is undefined OR an empty string (catastrophic spawn failure
    // such as a syntax error in a test file before any TAP emission), short-
    // circuit and return { tests: 0, suites: 0 } without invoking parseTapSummary —
    // this matches the documented Wave 1 fallback semantics and keeps the catch
    // resilient to spawn-level failures (Gemini LOW + Codex robustness suggestion).
    if (err.stdout === undefined || err.stdout === '') {
      return { tests: 0, suites: 0 };
    }
    tap = err.stdout.toString();
  }
  return parseTapSummary(tap);
}

/** @returns {number} */
function measureAgentCount(repoRoot) {
  const dir = path.join(repoRoot, 'agents');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => /^gsd-.*\.md$/.test(f)).length;
}

/** @returns {number} */
function measureCommandCount(repoRoot) {
  const dir = path.join(repoRoot, 'commands', 'gsd');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

/**
 * Count <repoRoot>/plugins/<plugin>/skills/<skill>/ directories — depth-2
 * directory listing under plugins/, mirroring "ls -d plugins/*\/skills/*\/"
 * from sync-docs.md.
 *
 * @returns {number}
 */
function measureSkillCount(repoRoot) {
  const pluginsDir = path.join(repoRoot, 'plugins');
  if (!fs.existsSync(pluginsDir)) return 0;
  let total = 0;
  for (const plugin of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!plugin.isDirectory()) continue;
    const skillsDir = path.join(pluginsDir, plugin.name, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const skill of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (skill.isDirectory()) total++;
    }
  }
  return total;
}

/** @returns {number} */
function measureHookCount(repoRoot) {
  const dir = path.join(repoRoot, 'hooks', 'dist');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).length;
}

// ─── Claim Extraction ─────────────────────────────────────────────────────────

/**
 * Extract claims from one doc file matching the supplied per-file claim entries.
 * Reads the file, scans line-by-line, applies each regex whose `file` matches
 * the doc filename (basename or relative path; caller passes claims pre-filtered).
 *
 * Returns an array of claim records: { line, metric, claimed, normalize }.
 * Returns [] gracefully on file read errors.
 *
 * Supports multiple matches per file per metric (D-10) — each occurrence is its
 * own record.
 *
 * Multi-line claims constraint (Codex MEDIUM consensus, REVIEWS.md):
 * Each claim regex is matched line-by-line. Multi-line claims (where the
 * regex would span a newline) are out of scope and will not be detected.
 * The three living docs are conventionally single-line for all numeric
 * claims; this is enforced by the sanity test in
 * tests/check-doc-drift.test.cjs ('live CLAUDE.md/README.md/DEVOPS-HANDOFF.md
 * claims are all single-line'). If a future doc edit wraps a claim across
 * lines, the sanity test will fail BEFORE the claim is silently missed.
 *
 * @param {string} filePath  Absolute path to .md file
 * @param {Array<{ metric: string, regex: RegExp, captureIndex: number, normalize: Function }>} claimsForFile
 * @returns {Array<{ line: number, metric: string, claimed: string, normalize: Function }>}
 */
function extractClaims(filePath, claimsForFile) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  const lines = raw.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const claim of claimsForFile) {
      const m = line.match(claim.regex);
      if (!m) continue;
      out.push({
        line: i + 1,
        metric: claim.metric,
        claimed: m[claim.captureIndex],
        normalize: claim.normalize,
      });
    }
  }
  return out;
}

// ─── Comparison ───────────────────────────────────────────────────────────────

/**
 * Compare a claim against the live measured value. Returns null when they
 * match within tolerance, or a drift record { claimed, actual } when they
 * disagree.
 *
 * Comparison rules per CONTEXT D-08, D-09:
 *   - Integer (normalize = stripCommas or asInt): comma-tolerant string equality.
 *   - Percentage (normalize = parsePercent): |parsedClaimed - actual| <= epsilon.
 *
 * Default epsilon for percentage claims is 0.1 (one tenth of one percent).
 * This tolerates legitimate cross-platform coverage variance (c8 instrumentation
 * on macOS vs ubuntu produces deltas of ~0.06% over ~23k statements due to OS
 * filesystem semantics) while still catching real drift (a typo from 91.6% to
 * 81.6% would still be flagged). Pre-existing per-test epsilon overrides
 * (`epsilon: 0.01`) remain in effect where the test exercises tighter bounds.
 *
 * @param {{claimed: string, actual: number|string, normalize: Function, epsilon?: number}} args
 * @returns {{claimed: string, actual: string} | null}
 */
function compareClaim({ claimed, actual, normalize, epsilon = 0.1 }) {
  if (normalize === parsePercent) {
    const parsedClaimed = parsePercent(claimed);
    const parsedActual = typeof actual === 'number' ? actual : parsePercent(actual);
    if (Math.abs(parsedClaimed - parsedActual) <= epsilon) return null;
    return { claimed: String(claimed), actual: String(actual) };
  }
  // Integer / comma-tolerant path
  const normClaimed = String(normalize(claimed));
  const normActual = String(normalize(String(actual)));
  if (normClaimed === normActual) return null;
  return { claimed: String(claimed), actual: String(actual) };
}

// ─── Output Formatting ────────────────────────────────────────────────────────

// Canonical document order per CONTEXT D-14
const DOC_ORDER = ['CLAUDE.md', 'README.md', 'docs/DEVOPS-HANDOFF.md'];

function docOrderIndex(file) {
  for (let i = 0; i < DOC_ORDER.length; i++) {
    if (file === DOC_ORDER[i] || file.endsWith('/' + DOC_ORDER[i])) return i;
  }
  return DOC_ORDER.length; // unknown files sort last
}

/**
 * Format an array of drift records as a padded text table.
 * Columns: FILE, LINE, METRIC, CLAIMED, ACTUAL.
 * Records sorted by (file in document order, line) per D-14.
 *
 * @param {Array<{file: string, line: number, metric: string, claimed: string, actual: string}>} records
 * @param {string} repoRoot  Strip this prefix for relative display paths
 * @returns {string}
 */
function formatDriftTable(records, repoRoot) {
  if (records.length === 0) return '';

  const cols = ['FILE', 'LINE', 'METRIC', 'CLAIMED', 'ACTUAL'];
  const rows = records.map(r => {
    const fileStr = String(r.file);
    const display = fileStr.startsWith(repoRoot + path.sep)
      ? fileStr.slice(repoRoot.length + 1)
      : fileStr;
    return [display, String(r.line), String(r.metric), String(r.claimed), String(r.actual)];
  });

  // Sort by (document-order index, line) per D-14
  rows.sort((a, b) => {
    const ai = docOrderIndex(a[0]);
    const bi = docOrderIndex(b[0]);
    if (ai !== bi) return ai - bi;
    return parseInt(a[1], 10) - parseInt(b[1], 10);
  });

  const widths = cols.map((c, i) => {
    const headerLen = c.length;
    const maxData = rows.reduce((m, row) => Math.max(m, row[i].length), 0);
    return Math.max(headerLen, maxData);
  });

  const pad = (s, w) => s + ' '.repeat(w - s.length);
  const sep = '  ';

  const headerLine = cols.map((c, i) => pad(c, widths[i])).join(sep);
  const underline = widths.map(w => '-'.repeat(w)).join(sep);
  const dataLines = rows.map(row =>
    row.map((c, i) => pad(c, widths[i])).join(sep)
  );

  return [headerLine, underline, ...dataLines].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const HELP_TEXT = [
  'check-doc-drift.cjs — Doc Drift Detector',
  '',
  'Usage:',
  '  node scripts/check-doc-drift.cjs                       # check the whole repo',
  '  node scripts/check-doc-drift.cjs --json                # JSON output',
  '  node scripts/check-doc-drift.cjs --root <dir>          # check a specific tree',
  '  node scripts/check-doc-drift.cjs --coverage-stale-secs <N>  # override 1h staleness check',
  '  node scripts/check-doc-drift.cjs --help                # this help',
  '',
  'Exit codes:',
  '  0  All numeric claims match live values',
  '  1  At least one drift detected',
  '  2  Runtime error (missing/stale coverage data, argument validation failure)',
  '',
].join('\n');

function main(argv) {
  if (argv.includes('--help')) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }
  const wantJson = argv.includes('--json');

  let repoRoot = process.cwd();
  let rootFlagPassed = false;
  const rootIdx = argv.indexOf('--root');
  if (rootIdx !== -1) {
    const next = argv[rootIdx + 1];
    if (!next || next.startsWith('--')) {
      process.stderr.write(
        'check-doc-drift: --root requires a directory argument\n'
      );
      process.exit(2);
    }
    repoRoot = path.resolve(next);
    rootFlagPassed = true;
  }

  let staleSecs = 3600;
  const staleIdx = argv.indexOf('--coverage-stale-secs');
  if (staleIdx !== -1) {
    const next = argv[staleIdx + 1];
    if (next === undefined || next.startsWith('--') || Number.isNaN(Number(next))) {
      process.stderr.write(
        'check-doc-drift: --coverage-stale-secs requires a numeric value\n'
      );
      process.exit(2);
    }
    staleSecs = Number(next);
  }

  // Codex LOW concern (REVIEWS.md "Recommended Replanning" #2): derive a
  // missingDocPolicy to distinguish fixture directories from real repo roots.
  //
  //   - If --root is absent OR --root resolves to a repo root (directory that
  //     contains both package.json AND .gitignore — stable repo-root marker
  //     pair), enforce strict mode: missing living doc => exit 2.
  //   - If --root <fixtureDir> is set to a path that is NOT the repo root,
  //     fall back to silent skip (preserves fixture-convenience behavior).
  //
  // The repo-root probe inspects repoRoot only (no upward tree walk).
  function isRepoRoot(dir) {
    return fs.existsSync(path.join(dir, 'package.json'))
      && fs.existsSync(path.join(dir, '.gitignore'));
  }
  const missingDocPolicy = (!rootFlagPassed || isRepoRoot(repoRoot))
    ? 'fail'
    : 'skip';

  // Measure live values once, share via ctx.
  const coverage = measureCoverageFromJson(repoRoot, staleSecs);
  const testStats = measureTestCounts(repoRoot);
  const ctx = { repoRoot, coverage, testStats };

  // Per-doc claim extraction. Group claims by file across all metrics.
  const docFiles = ['CLAUDE.md', 'README.md', 'docs/DEVOPS-HANDOFF.md']; // D-11 order
  const driftRecords = [];
  let checked = 0;

  for (const docFile of docFiles) {
    const absDoc = path.join(repoRoot, docFile);
    if (!fs.existsSync(absDoc)) {
      if (missingDocPolicy === 'fail') {
        // Strict mode: required living doc missing means the run cannot make
        // progress safely. Exit 2 with a remediation message.
        process.stderr.write(
          `check-doc-drift: required living doc not found: ${absDoc} — run from repo root or use --root <fixtureDir>\n`
        );
        process.exit(2);
      }
      // Fixture mode: silently skip (fixture trees may intentionally omit docs).
      continue;
    }
    // Gather every claim entry across the registry whose file === docFile.
    const claimsForFile = [];
    for (const metric of METRICS) {
      for (const c of metric.claims) {
        if (c.file === docFile) {
          claimsForFile.push({
            metric: metric.id,
            regex: c.regex,
            captureIndex: c.captureIndex,
            normalize: c.normalize,
          });
        }
      }
    }
    const extracted = extractClaims(absDoc, claimsForFile);
    for (const claim of extracted) {
      checked++;
      const metric = METRICS.find(m => m.id === claim.metric);
      const actual = metric.measure(ctx);
      const drift = compareClaim({
        claimed: claim.claimed,
        actual,
        normalize: claim.normalize,
      });
      if (drift) {
        driftRecords.push({
          file: docFile,
          line: claim.line,
          metric: claim.metric,
          claimed: drift.claimed,
          actual: drift.actual,
        });
      }
    }
  }

  // Sort drift records by canonical doc order then line (D-14)
  const docOrderIdx = (f) => {
    const i = docFiles.indexOf(f);
    return i === -1 ? docFiles.length : i;
  };
  driftRecords.sort((a, b) => {
    const ai = docOrderIdx(a.file);
    const bi = docOrderIdx(b.file);
    if (ai !== bi) return ai - bi;
    return a.line - b.line;
  });

  if (wantJson) {
    const payload = {
      status: driftRecords.length === 0 ? 'clean' : 'drift',
      checked,
      files: docFiles.length,
      metrics: METRICS.length,
      drift: driftRecords,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else if (driftRecords.length === 0) {
    process.stdout.write(
      `check-doc-drift: all ${checked} numeric claim(s) match live values (${docFiles.length} files, ${METRICS.length} metrics)\n`
    );
  } else {
    process.stdout.write(
      `check-doc-drift: ${driftRecords.length} drift(s) found\n\n`
    );
    process.stdout.write(formatDriftTable(driftRecords, repoRoot) + '\n');
  }

  process.exit(driftRecords.length === 0 ? 0 : 1);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
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
};

// ─── Main guard ───────────────────────────────────────────────────────────────

if (require.main === module) {
  main(process.argv.slice(2));
}
