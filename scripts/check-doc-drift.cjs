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
 * @param {{claimed: string, actual: number|string, normalize: Function, epsilon?: number}} args
 * @returns {{claimed: string, actual: string} | null}
 */
function compareClaim({ claimed, actual, normalize, epsilon = 0.01 }) {
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
};

// ─── Main guard ───────────────────────────────────────────────────────────────

if (require.main === module) {
  // Stub for now — main() lands in plan 56-02
  process.stderr.write('check-doc-drift: main() not yet implemented (plan 56-02)\n');
  process.exit(2);
}
