# Phase 56: Doc Drift Detector — Research

**Researched:** 2026-05-07
**Domain:** Node.js CJS scripting — live metric measurement, regex-anchored claim extraction, drift reporting
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCDRIFT-01 | Detector measures live test count, suite count, line/branch/function coverage | TAP summary parsing (`# tests N` / `# suites N`) confirmed on Node 22; coverage-final.json aggregation verified against live repo |
| DOCDRIFT-02 | Detector measures live agent count, command count, skill count, hook count from filesystem | All four glob patterns confirmed with live counts: 66 commands, 17 agents, 45 skills, 6 hooks in dist/ |
| DOCDRIFT-03 | Detector compares measured values against numeric claims in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md using regex-anchored extractors | All claims inventoried per-file with line numbers and proposed regex shapes in Section 2 |
| DOCDRIFT-04 | Detector outputs structured drift table — doc, file:line, claimed value, actual value, metric name | Same `formatTable` column-pad pattern as Phase 55; drift envelope shape specified in CONTEXT.md D-12/D-13 |
| DOCDRIFT-05 | Detector exits non-zero on any drift, zero on agreement, with `--json` flag | Exit codes 0/1/2 pattern confirmed against Phase 55; `--json` envelope shape in D-13 |
</phase_requirements>

---

## Phase Summary

Phase 56 ships `scripts/check-doc-drift.cjs` — a zero-dependency Node CJS script that (1) measures nine live metrics from the filesystem and from TAP/coverage output, (2) extracts the corresponding numeric claims from CLAUDE.md, README.md, and docs/DEVOPS-HANDOFF.md using anchored per-claim regexes, (3) compares measured vs. claimed values with comma-tolerant integer equality and ±0.01 percent tolerance, and (4) exits non-zero with a padded drift table (or JSON envelope) whenever any claim is stale. The script mirrors Phase 55's architecture exactly: single CJS file, `'use strict'`, named exports, `if (require.main === module)` guard, `node:test` unit tests, fixture trees for clean/drift/edge cases, three TDD waves, and a Wave 3 real-repo run that surfaces the first genuine drift (command_count: docs claim 65, actual is 66).

---

## Concrete Claim Extraction (per metric, per file, with regex + sample)

All claims below are extracted from the live files as of 2026-05-07. Line numbers are 1-based. Regex group indices are 1-based.

### Metric: `test_count` (assertions)

**Live value:** 2,723

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 51 | `536 test suites, 2,667 assertions` | `/-\s+\*\*Scale\*\*:\s+(\d{1,3}(?:,\d{3})*\|\d+)\s+test suites,\s+(\d{1,3}(?:,\d{3})*\|\d+)\s+assertions/` | 2 | `stripCommas` |
| README.md | 76 | `\| Test assertions \| 2,667 \|` | `/\|\s*Test assertions\s*\|\s*(\d{1,3}(?:,\d{3})*\|\d+)\s*\|/` | 1 | `stripCommas` |
| DEVOPS-HANDOFF.md | 72 | `\| \`npm test\` \| Run 2,667 unit tests via...` | `/Run\s+(\d{1,3}(?:,\d{3})*\|\d+)\s+unit tests via/` | 1 | `stripCommas` |
| DEVOPS-HANDOFF.md | 87 | `\| Unit tests \| 2,667 \|` | `/\|\s*Unit tests\s*\|\s*(\d{1,3}(?:,\d{3})*\|\d+)\s*\|/` | 1 | `stripCommas` |

**Note on test_count vs assertions:** The TAP summary line `# tests N` reports individual `test()` calls (assertions), not describe-block suites. The doc claim word "assertions" maps to `# tests` in TAP. Current live value is 2,723 — all docs claim 2,667, which is genuine drift to be fixed in Wave 3.

### Metric: `suite_count`

**Live value:** 545

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 51 | `536 test suites, 2,667 assertions` | `/-\s+\*\*Scale\*\*:\s+(\d{1,3}(?:,\d{3})*\|\d+)\s+test suites/` | 1 | `stripCommas` |
| README.md | 75 | `\| Test suites \| 536 \|` | `/\|\s*Test suites\s*\|\s*(\d{1,3}(?:,\d{3})*\|\d+)\s*\|/` | 1 | `stripCommas` |

**Note:** DEVOPS-HANDOFF.md has no suite_count claim (only unit test assertion count). README.md inventory table at line 75 is the primary target for suite_count.

### Metric: `line_coverage`

**Live value:** 91.34% (verified by aggregating coverage-final.json: 20303/22227 statements covered)

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 51 | `91.23% line coverage` | `/-\s+\*\*Scale\*\*:.*?(\d{2,3}\.\d{1,2})%\s+line coverage/` | 1 | `parsePercent` |

**Note:** README.md and DEVOPS-HANDOFF.md do not contain an explicit `XX.XX% line coverage` claim. DEVOPS-HANDOFF.md has a per-module table (lines 129-135) with individual module percentages but no aggregate claim. Those per-module rows are out of scope for v1 (registry targets aggregate only). The CLAUDE.md Scale line is the sole target for line_coverage.

### Metric: `branch_coverage`

**Live value:** 83.22% (verified: 4770/5732 branches covered)

No doc currently states aggregate branch coverage as a single claim. The coverage thresholds section in CLAUDE.md says `80% per module` and `95% security-critical` — these are thresholds, not measured values, so they are not valid targets for drift detection. The DEVOPS-HANDOFF.md has no aggregate branch figure. The STATE.md (out of scope per D-11) has `83.01% branches`.

**Decision for the planner:** `branch_coverage` is in the METRICS registry (D-04) to track the live value, but it may have zero claims to check in v1 if no doc states it as a percentage. The registry entry should exist but its `claims` array will be empty on first pass. Wave 3 may discover a claim to add. Do not skip the metric — emit it in the `--json` envelope's `metrics: N` count regardless.

### Metric: `function_coverage`

**Live value:** 97.47% (verified: 463/475 functions covered)

Same situation as branch_coverage — no aggregate function coverage percentage found in any of the three living docs. Registry entry exists, `claims` array is empty in v1.

### Metric: `agent_count`

**Live value:** 17 (confirmed: `ls agents/gsd-*.md | wc -l`)

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 15 | `**17 built-in agents**` | `/\*\*(\d+)\s+built-in agents\*\*/` | 1 | `asInt` |
| CLAUDE.md | 78 | `GSD also ships 17 built-in agents` | `/GSD also ships\s+(\d+)\s+built-in agents/` | 1 | `asInt` |
| README.md | 59 | `65 commands, 17 agents, 7 hooks` | `/(\d+)\s+agents,\s+\d+\s+hooks/` | 1 | `asInt` |
| README.md | 70 | `\| Specialized agents \| 17 \|` | `/\|\s*Specialized agents\s*\|\s*(\d+)\s*\|/` | 1 | `asInt` |
| DEVOPS-HANDOFF.md | 47 | `\| Agents \| ... \| 17 specialized agent definitions \|` | `/(\d+)\s+specialized agent definitions/` | 1 | `asInt` |

**Collision note:** CLAUDE.md has two distinct sentences claiming `17 built-in agents` (lines 15 and 78). Per D-10 both are independent claim records. If agent_count drifts, both will appear in the drift report.

### Metric: `command_count`

**Live value:** 66 (confirmed: `ls commands/gsd/*.md | wc -l`)

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 14 | `**65 slash commands**` | `/\*\*(\d+)\s+slash commands\*\*/` | 1 | `asInt` |
| README.md | 59 | `65 commands, 17 agents, 7 hooks` | `/(\d+)\s+commands,\s+\d+\s+agents/` | 1 | `asInt` |
| README.md | 69 | `\| GSD commands \| 65 \|` | `/\|\s*GSD commands\s*\|\s*(\d+)\s*\|/` | 1 | `asInt` |
| DEVOPS-HANDOFF.md | 46 | `\| Commands \| ... \| 65 GSD slash commands \|` | `/(\d+)\s+GSD slash commands/` | 1 | `asInt` |

**This is the confirmed live drift for Wave 3.** All docs claim 65; actual is 66. The drift table will show four records (three unique text patterns across CLAUDE.md, README.md×2, DEVOPS-HANDOFF.md).

### Metric: `skill_count`

**Live value:** 45 (confirmed: `ls -d plugins/*/skills/*/ | wc -l`)

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| CLAUDE.md | 16 | `**45 Claude Code skills**` | `/\*\*(\d+)\s+Claude Code skills\*\*/` | 1 | `asInt` |
| README.md | 60 | `2 plugin engines (45 skills, 10 subagents)` | `/\((\d+)\s+skills,\s+\d+\s+subagents\)/` | 1 | `asInt` |
| README.md | 72 | `\| Plugin skills \| 45 ...` | `/\|\s*Plugin skills\s*\|\s*(\d+)/` | 1 | `asInt` |
| DEVOPS-HANDOFF.md | 51 | `\| Plugins \| ... \| 45 skills, 10 subagents...` | `/(\d+)\s+skills,\s+\d+\s+subagents/` | 1 | `asInt` |

### Metric: `hook_count_execution`

**Live value:** 6 (confirmed: `ls hooks/dist/*.js | wc -l` → 6 files)

The six bundled execution hooks are:
- `hooks/dist/gsd-check-update.js`
- `hooks/dist/gsd-config-protection.js`
- `hooks/dist/gsd-context-monitor.js`
- `hooks/dist/gsd-cost-tracker.js`
- `hooks/dist/gsd-prompt-guard.js`
- `hooks/dist/gsd-statusline.js`

The living docs state varying counts for "hooks" depending on context. Only the "execution hooks (bundled JS)" sense is targeted by this metric.

| File | Line | Sample text | Regex | Capture group | Normalize |
|------|------|-------------|-------|---------------|-----------|
| README.md | 59 | `65 commands, 17 agents, 7 hooks` | `/\d+\s+agents,\s+(\d+)\s+hooks,\s+wave-based/` | 1 | `asInt` |
| README.md | 71 | `Runtime hooks \| 16 (7 execution + 10 governance, 1 shared)` | `/(\d+)\s+execution\s+\+\s+\d+\s+governance/` | 1 | `asInt` |
| DEVOPS-HANDOFF.md | 48 | `\| Hooks \| ... \| 7 execution hooks (bundled JS) \|` | `/(\d+)\s+execution hooks \(bundled JS\)/` | 1 | `asInt` |

**This is a second confirmed live drift.** All three claims targeting execution hooks say 7; actual is 6. README.md line 59's "7 hooks" and DEVOPS-HANDOFF.md line 48's "7 execution hooks (bundled JS)" are both wrong. README.md line 71 claims "7 execution" as the parenthetical — also wrong. Wave 3 will correct all three.

**Out-of-scope hook claims (deferred per CONTEXT.md):**
- README.md line 1109: `15 hooks fire automatically` — refers to total lifecycle hooks, not dist/ count
- README.md line 60: `10 hooks` (governance) — separate category
- DEVOPS-HANDOFF.md line 50: `10 governance hooks` — separate category

---

## Measurement Validation (test count + coverage primitives confirmed against live repo)

### Test Count Measurement

**Spawn command:** `node --test --test-reporter=tap tests/*.test.cjs`

**TAP summary block (confirmed on Node v22.21.1, 2026-05-07):**
```
# tests 2723
# suites 545
# pass 2723
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7582.059
```

**Parsing regexes:**
```javascript
const testCountRe  = /^# tests (\d+)$/m;
const suiteCountRe = /^# suites (\d+)$/m;
```

**TAP format stability:** `# tests N` and `# suites N` are emitted by `node:test`'s built-in TAP reporter on both Node 20 and Node 22. The format is stable across minor versions within Node 22 (verified on v22.21.1). Node 20 emits the same block (confirmed in CONTEXT.md D-05 rationale). Whitespace is exactly one space between `#` and the keyword; no comma formatting.

**Test file discovery:** `scripts/run-tests.cjs` uses `readdirSync(testDir).filter(f => f.endsWith('.test.cjs'))`. The detector must use the same resolved-glob approach — pass `readdirSync('tests').filter(...).sort().map(f => path.join('tests', f))` as arguments to `node --test`, not a shell glob. This is necessary for cross-platform correctness (Windows PowerShell does not expand `*.test.cjs`).

**Test files found:** 83 files in `tests/*.test.cjs` as of 2026-05-07. All are picked up by the `tests/` readdirSync pattern. No subdirectory test files are included (e2e tests live in `tests/e2e/` and are excluded from the unit suite).

**TAP `# tests` counts individual `test()` calls, not assertions in the `node:assert` sense.** The doc phrase "2,667 assertions" historically mapped to this count. The Wave 3 doc update should normalize language to "test cases" or match whatever the TAP `# tests` line says.

### Coverage Measurement

**Source file:** `coverage/coverage-final.json` (emitted by `npm run test:coverage`)

**Schema:** Each key is an absolute file path. Each value has:
- `s`: `{index: hitCount}` — statement/line hit counts
- `b`: `{index: [hitCount, hitCount, ...]}` — branch hit counts (array per branch, one entry per branch arm)
- `f`: `{index: hitCount}` — function hit counts

**Aggregation (verified against live file, 2026-05-07):**
```
lineCoverage     = sum(covered_s) / sum(total_s) * 100
branchCoverage   = sum(covered_b_flat) / sum(total_b_flat) * 100
functionCoverage = sum(covered_f) / sum(total_f) * 100
```
Where `covered_s = values where v > 0`, `total_s = all values`, and branches are flattened from `b` arrays.

**Verified totals:**
- Line: 91.34% (20303/22227) — CLAUDE.md claims 91.23%, delta = 0.11% — this is drift (exceeds ±0.01 tolerance)
- Branch: 83.22% (4770/5732) — no doc claim, nothing to compare
- Function: 97.47% (463/475) — no doc claim, nothing to compare

**Coverage file age:** 45 minutes at time of research. The file is recent enough. The stale-check threshold in D-06 is 3600 seconds (1 hour); the detector will accept coverage data up to 1 hour old and reject older data with exit 2.

**If coverage-final.json is missing:** The detector exits 2 with the exact message:
```
coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs
```

**File path:** `coverage/coverage-final.json` relative to `--root`. This path is written by c8 when `test:coverage` runs — confirmed by the `.c8rc.json` config which writes JSON reporter output to the default c8 output directory. The path is stable.

---

## Sibling-Phase Pattern Catalog (verbatim patterns to replicate)

Phase 56 must replicate the following patterns from Phase 55 exactly. The planner should reference these as constraints in every task description.

### 1. File Header Shape

```javascript
#!/usr/bin/env node
'use strict';

/**
 * check-doc-drift.cjs — Doc Drift Detector
 *
 * [description]
 *
 * Usage:
 *   node scripts/check-doc-drift.cjs
 *   node scripts/check-doc-drift.cjs --json
 *   node scripts/check-doc-drift.cjs --root <dir>
 *   node scripts/check-doc-drift.cjs --coverage-stale-secs <N>
 *
 * Requirements: DOCDRIFT-01, DOCDRIFT-02, DOCDRIFT-03, DOCDRIFT-04, DOCDRIFT-05
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
```

### 2. Section Divider Convention

```javascript
// ─── Constants ────────────────────────────────────────────────────────────────
// ─── METRICS Registry ─────────────────────────────────────────────────────────
// ─── Normalize Helpers ────────────────────────────────────────────────────────
// ─── Measurement Functions ────────────────────────────────────────────────────
// ─── Claim Extraction ─────────────────────────────────────────────────────────
// ─── Comparison ───────────────────────────────────────────────────────────────
// ─── Output Formatting ────────────────────────────────────────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
```

### 3. Module Export + `require.main` Guard Shape

```javascript
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

if (require.main === module) {
  main(process.argv.slice(2));
}
```

### 4. `formatDriftTable` Column-Pad Helper Pattern

Identical logic to Phase 55's `formatTable`. For Phase 56, columns are `FILE`, `LINE`, `METRIC`, `CLAIMED`, `ACTUAL`. Column widths computed as `max(header.length, max data length)`. Separator is `  ` (two spaces). Underline is `-` repeated to column width. Records sorted by document order then line number.

```javascript
function formatDriftTable(records, repoRoot) {
  if (records.length === 0) return '';
  const cols = ['FILE', 'LINE', 'METRIC', 'CLAIMED', 'ACTUAL'];
  const rows = records.map(r => [
    path.relative(repoRoot, r.file),
    String(r.line),
    r.metric,
    r.claimed,
    r.actual,
  ]);
  const widths = cols.map((c, i) =>
    Math.max(c.length, ...rows.map(row => row[i].length))
  );
  const pad = (s, w) => s + ' '.repeat(w - s.length);
  const sep = '  ';
  const headerLine = cols.map((c, i) => pad(c, widths[i])).join(sep);
  const underline = widths.map(w => '-'.repeat(w)).join(sep);
  const dataLines = rows.map(row => row.map((c, i) => pad(c, widths[i])).join(sep));
  return [headerLine, underline, ...dataLines].join('\n');
}
```

### 5. spawnSync Integration Test Harness Pattern

```javascript
// From validate-doc-links.test.cjs — reuse verbatim in check-doc-drift.test.cjs
const SCRIPT = path.join(__dirname, '..', 'scripts', 'check-doc-drift.cjs');

function runScript(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
    ...opts,
  });
}
```

Integration tests use `runScript(['--root', fixtureDir])` for fixture-tree tests and `runScript([])` for the real-repo test in Wave 3.

### 6. Fixture Tree Layout

Phase 55 used `tests/fixtures/doc-links/{clean,broken,edge}/`. Phase 56 uses:

```
tests/fixtures/doc-drift/
  clean/
    CLAUDE.md        # Claims match the fixture's live values (use small, stable numbers)
    README.md
    DEVOPS-HANDOFF.md
    coverage/
      coverage-final.json   # Pre-baked JSON with known coverage values
  drift/
    CLAUDE.md        # Claims intentionally wrong (e.g., claims 10 agents, actual is 17)
    README.md
    DEVOPS-HANDOFF.md
    coverage/
      coverage-final.json
  edge/
    # Docs with: no claims (should emit zero drift records), claims matching after comma stripping,
    # percentage within tolerance, missing coverage-final.json (should exit 2)
```

**Important:** The clean/ and drift/ fixture trees must be self-contained (no real `node --test` spawn) because test runs in clean/ would take 30s. The detector's `measureTestCounts(root)` must be spyable or the fixture tree must include a precomputed TAP stats file. The simplest approach: when `--root` is set to a fixture dir, the detector falls back to reading a `coverage/test-stats.json` file (`{ tests: N, suites: N }`) if present, instead of spawning `node --test`. This avoids running the full suite in unit tests.

**Alternative (simpler):** unit tests for `parseTapSummary` are pure (no spawn), and integration tests for `measureTestCounts` mock the spawn via a fixture `.tap` file. The spawnSync test for exit codes uses the full real-repo (Wave 3 only). This matches Phase 55's pattern where fixture integration tests only validated exit codes, not live measurements.

**For the planner:** Wave 1 fixtures provide the doc files and coverage JSON. Wave 2 integration tests validate exit codes with those fixtures, but do NOT spawn `node --test` — they use precomputed `test-stats.json` or a fixture `.tap` output file.

### 7. `.c8rc.json` `include` Array Entry Shape

```json
{
  "include": [
    "get-shit-done/bin/lib/*.cjs",
    "get-shit-done/bin/gsd-tools.cjs",
    "bin/install.js",
    "hooks/*.js",
    "scripts/build-hooks.js",
    ".claude/hooks/lesson-capture-gate.cjs",
    "scripts/validate-doc-links.cjs",
    "scripts/check-doc-drift.cjs"
  ]
}
```

Wave 2 adds `"scripts/check-doc-drift.cjs"` as the final entry. The file already includes `scripts/validate-doc-links.cjs` from Phase 55.

### 8. Test File Header and Describe-Block Organization

```javascript
/**
 * check-doc-drift.cjs — Unit Tests
 *
 * Tests for: stripCommas, parsePercent, asInt, aggregateCoverage,
 * parseTapSummary, extractClaims, compareClaim, formatDriftTable.
 * measureTestCounts, measureCoverageFromJson, measure* (filesystem), main()
 * tested in plan 56-02.
 *
 * Requirements: DOCDRIFT-01, DOCDRIFT-02, DOCDRIFT-03, DOCDRIFT-04, DOCDRIFT-05
 */
'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  stripCommas,
  parsePercent,
  asInt,
  aggregateCoverage,
  parseTapSummary,
  extractClaims,
  compareClaim,
  formatDriftTable,
} = require('../scripts/check-doc-drift.cjs');

const FIXTURES = path.join(__dirname, 'fixtures', 'doc-drift');
```

**Describe-block structure (Wave 1):**
- `describe('stripCommas')` — pure
- `describe('parsePercent')` — pure
- `describe('asInt')` — pure
- `describe('parseTapSummary')` — pure (parses TAP string, no spawn)
- `describe('aggregateCoverage')` — reads fixture coverage JSON
- `describe('extractClaims')` — reads fixture doc files
- `describe('compareClaim')` — pure
- `describe('formatDriftTable')` — pure

**Describe-block structure (Wave 2 additions):**
- `describe('measureCoverageFromJson')` — reads fixture coverage file, tests stale detection
- `describe('measureTestCounts')` — tests with fixture `.tap` output (no real spawn)
- `describe('measure* filesystem')` — uses temp dirs for agent/command/skill/hook counts
- `describe('main() exit codes')` — spawnSync against fixture trees
- `describe('--json output')` — spawnSync with `--json` flag

---

## Validation Architecture (Nyquist Dimension 8)

`nyquist_validation: true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert` |
| Config file | None (auto-discovered by `scripts/run-tests.cjs` via `readdirSync`) |
| Quick run command | `node --test tests/check-doc-drift.test.cjs` |
| Full suite command | `npm test` |
| Estimated runtime | ~2s for the file alone; ~30s for full suite |

### What "Validation" Means for This Phase

The detector must be correct in three senses:

1. **Functional correctness:** When a doc claim disagrees with a live value, the detector reports it (no false negatives). When a doc claim matches, the detector does not report it (no false positives).
2. **False-positive resistance:** Comma formatting (`2,667` vs `2667`), percent tolerance (±0.01), and regex anchoring to surrounding context prevent spurious drift records.
3. **False-negative resistance:** Every claim in every doc for every tracked metric is registered in the METRICS registry. A claim that exists in the doc but has no registry entry is a false negative — it will be silently missed. The Wave 3 real-repo run validates this by checking that the detector's output matches a manually-verified ground truth.

### Five Validation Dimensions

| Dimension | What it proves | Tested in |
|-----------|---------------|-----------|
| 1. Functional correctness | `compareClaim` returns drift when claimed ≠ actual, null when equal | Wave 1 unit tests (`describe('compareClaim')`) |
| 2. Fixture coverage | clean/ exit 0, drift/ exit 1, edge/ (missing coverage) exit 2 | Wave 2 integration tests (spawnSync) |
| 3. Real-repo agreement | running against actual repo surfaces exactly the known drift (command_count 65→66, hook_count 7→6, test counts) and no spurious drift | Wave 3 acceptance test |
| 4. Regression on clean repo | after Wave 3 doc updates, re-running the detector exits 0 | Wave 3 final verification step |
| 5. Exit-code contract | exit 0 = clean, exit 1 = drift, exit 2 = runtime error (missing coverage) | Wave 2 spawnSync tests |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCDRIFT-01 | TAP parsing + coverage aggregation returns correct numeric values | Unit (`parseTapSummary`, `aggregateCoverage`) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-01 | `measureCoverageFromJson` exits 2 when coverage file missing/stale | Integration (spawnSync, edge/) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-02 | Filesystem glob counts return correct agent/command/skill/hook values | Unit (`measure*` functions on temp dirs) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-03 | `extractClaims` returns correct (line, claimed, metric) records per doc | Unit (`extractClaims` on fixture docs) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-03 | regex-anchored extraction does NOT fire on unrelated numeric text in fixtures | Unit (`extractClaims`, edge fixture with numeric noise) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-04 | `formatDriftTable` produces correct column widths and FILE/LINE/METRIC/CLAIMED/ACTUAL structure | Unit (`formatDriftTable`) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-04 | Drift report sorted by (file, line) in canonical document order | Unit (`compareClaim` + sort logic) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-05 | Exit 0 when all claims match (clean/ fixture) | Integration (spawnSync) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-05 | Exit 1 when any claim drifts (drift/ fixture) | Integration (spawnSync) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-05 | Exit 2 when coverage-final.json missing (edge/ fixture) | Integration (spawnSync) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |
| DOCDRIFT-05 | `--json` flag emits `{ status, checked, files, metrics, drift }` envelope | Integration (spawnSync + JSON.parse) | `node --test tests/check-doc-drift.test.cjs` | No — Wave 0 |

### Specific Assertions per Dimension

**Dimension 1 — Functional correctness:**
- `compareClaim({ claimed: '2,667', actual: 2723, normalize: stripCommas })` returns a drift record
- `compareClaim({ claimed: '2,723', actual: 2723, normalize: stripCommas })` returns null
- `compareClaim({ claimed: '91.23', actual: 91.34, normalize: parsePercent })` returns a drift record (delta 0.11 > 0.01)
- `compareClaim({ claimed: '91.23', actual: 91.235, normalize: parsePercent })` returns null (delta 0.005 ≤ 0.01)
- `stripCommas('2,667')` returns `'2667'`; `stripCommas('2667')` returns `'2667'`
- `parseTapSummary('# tests 2723\n# suites 545\n# pass 2723\n...')` returns `{ tests: 2723, suites: 545 }`

**Dimension 2 — Fixture coverage:**
- `runScript(['--root', path.join(FIXTURES, 'clean')])` → `status === 0`
- `runScript(['--root', path.join(FIXTURES, 'drift')])` → `status === 1`
- `runScript(['--root', path.join(FIXTURES, 'edge', 'no-coverage')])` → `status === 2`

**Dimension 3 — Real-repo agreement (Wave 3 only, manual + automated):**
- `runScript([])` from repo root → `status === 1` (known drift present before docs are updated)
- Stdout contains `command_count` drift record with `claimed: "65"` and `actual: "66"`
- Stdout contains `hook_count_execution` drift record with `claimed: "7"` and `actual: "6"`
- After docs updated to match live values: `runScript([])` → `status === 0`

**Dimension 4 — Regression (Wave 3 final):**
- `npm test` → exits 0, all tests pass
- `npm run test:coverage` → line ≥ 90%, branch ≥ 83%

**Dimension 5 — Exit-code contract:**
- `runScript(['--root', path.join(FIXTURES, 'clean'), '--json'])` → status 0, stdout parses as JSON with `status: "clean"`, `drift: []`
- `runScript(['--root', path.join(FIXTURES, 'drift'), '--json'])` → status 1, stdout parses as JSON with `status: "drift"`, `drift.length >= 1`

### Sampling Rate

- **After every task commit (per-task):** `node --test tests/check-doc-drift.test.cjs`
- **After every wave merge:** `npm test`
- **Before `/gsd:verify-work`:** Full suite green, coverage ≥ 91% line / ≥ 83% branch

### Wave 0 Gaps

All of the following are missing and must be created before implementation begins:

- [ ] `tests/check-doc-drift.test.cjs` — covers DOCDRIFT-01 through DOCDRIFT-05
- [ ] `tests/fixtures/doc-drift/clean/CLAUDE.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/README.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/DEVOPS-HANDOFF.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/coverage/coverage-final.json` — pre-baked coverage JSON
- [ ] `tests/fixtures/doc-drift/drift/CLAUDE.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/README.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/DEVOPS-HANDOFF.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/coverage/coverage-final.json` — coverage matching drift fixture's "actual"
- [ ] `tests/fixtures/doc-drift/edge/no-coverage/CLAUDE.md` — any doc file (to test missing coverage)
- [ ] `scripts/check-doc-drift.cjs` — the script itself, with `require.main === module` guard
- [ ] `.c8rc.json` — add `"scripts/check-doc-drift.cjs"` to the `include` array (Wave 2)

---

## Pitfalls and Edge Cases

### Pitfall 1: Regex Collision Across Sentences

**What goes wrong:** A regex like `/(\d+)\s+built-in agents/` matches both line 15 (`**17 built-in agents**`) and line 78 (`GSD also ships 17 built-in agents`) in CLAUDE.md. Both fire independently per D-10 — this is the intended behavior. However, a poorly-anchored regex could also match numeric references in unrelated text (e.g., DEVOPS-HANDOFF.md's "17 specialized agent definitions" and CLAUDE.md's "17 built-in agents" both exist — two different agents claims in two different files, both valid targets).

**How to avoid:** Each claim entry specifies both `file` and `regex`. The regex is evaluated only on the named file. The `extractClaims` function reads each file once, scans all lines, and applies only the regexes whose `file` field matches the current file. Cross-file contamination is structurally impossible.

**Warning sign:** A drift record appearing in the report for a file that does not contain the pattern — indicates a `file` field typo in the registry.

### Pitfall 2: TAP Output Variance Across Node Versions

**What goes wrong:** CI runs Node 20 and Node 22 (per `.github/workflows/test.yml`). The TAP summary format must be identical across both for consistent parsing.

**Verified:** Node 22 emits `# tests N\n# suites N\n# pass N\n...` at the end of the TAP stream. Node's test runner documentation specifies this format as part of the TAP reporter contract. The `# tests` and `# suites` keywords are stable and have been so since `node:test` shipped in Node 18.

**How to avoid:** Use `/^# tests (\d+)$/m` and `/^# suites (\d+)$/m` — anchored to start-of-line with `m` flag. Do not parse specific line positions or hardcode the TAP structure beyond these two lines.

**Warning sign:** `parseTapSummary` returns `null` for tests or suites — the regex didn't match. Add a fallback: if `# suites` is missing (early Node 18 behavior), derive suite count from `# files` if present, otherwise return 0 for suites.

### Pitfall 3: Coverage Staleness False Alarms in Local Development

**What goes wrong:** The stale-check default of 3600 seconds (1 hour) is too strict during interactive development — the developer runs `npm test` (no coverage) and then immediately runs `check-doc-drift.cjs`, which exits 2 because the coverage file is absent or older than 1 hour from a previous run.

**How to avoid:** The `--coverage-stale-secs 0` flag disables the check entirely (per D-18). The remediation message is exact and actionable: `run 'npm run test:coverage' before check-doc-drift.cjs`. In CI, Phase 57 will ensure coverage is run before the drift check in the same workflow step.

**Warning sign:** CI logs showing exit 2 when coverage was expected to exist — means the CI step order is wrong, not a bug in the detector.

### Pitfall 4: Missing Claim — Drift or Ignore?

**What goes wrong:** A metric (e.g., `branch_coverage`) has an entry in the METRICS registry but its `claims` array is empty because no doc makes a numeric claim for that metric. This must NOT be reported as drift. It should be silently tracked internally and contribute to the `metrics: N` count in `--json` output.

**How to avoid:** `extractClaims` returns an empty array if no regexes match (or if `claims` array is empty). The comparison loop simply skips metrics with zero claims. The `checked` count in `--json` reflects claims checked (not metrics), so empty-claims metrics add 0 to `checked`.

**Warning sign:** `metrics: 9` in JSON output but `checked: 0` — means all metrics have empty `claims` arrays. Valid only if all nine metrics have no doc claims, which should never be true in a real run.

### Pitfall 5: Regex False Negative for Comma-Formatted Numbers

**What goes wrong:** A regex like `(\d+)` will fail to match `2,667` entirely if the comma is not accounted for. The surrounding context regex must capture `\d{1,3}(?:,\d{3})*|\d+` (or `[\d,]+`) to consume the full comma-formatted number as one capture group.

**How to avoid:** All regexes in the METRICS registry use the pattern `(\d{1,3}(?:,\d{3})*|\d+)` for any claim that may appear with comma formatting in the docs (test_count, suite_count). The `normalize: stripCommas` function then strips the commas before comparison.

**Warning sign:** `extractClaims` returns zero claims for a doc that visibly contains the claim — check that the regex handles comma-formatted numbers.

### Pitfall 6: The `suite_count` TAP line may not be present in all Node versions

**What goes wrong:** Node 18 did not emit `# suites N` in TAP output. If CI ever runs on Node 18 (it doesn't — minimum is Node 20 per STACK.md), suite count would parse as NaN.

**How to avoid:** `parseTapSummary` should return `{ tests, suites }` where `suites` defaults to 0 if the line is absent. In practice, Node 20 and 22 both emit `# suites N`, so this is a defensive measure only.

### Pitfall 7: Branch Coverage Key Format in coverage-final.json

**What goes wrong:** `b` values are arrays of hit counts per branch arm, not scalar integers. Naively doing `Object.values(info.b).filter(v => v > 0)` will always get objects (arrays), not numbers.

**How to avoid:** Flatten the branch arrays: `Object.values(info.b).flat()` gives all branch-arm hit counts as a flat number array. Then `filter(v => v > 0).length` gives covered branches, and `.length` gives total branches.

**Verified:** The live `coverage-final.json` confirms this structure — `b` values are arrays like `[17]` or `[16, 0]`.

### Pitfall 8: Fixture Doc Files Must Be Minimal and Non-Overlapping

**What goes wrong:** A fixture CLAUDE.md that closely mirrors the real CLAUDE.md might accidentally contain numeric text that fires an unintended regex. For example, including the phrase "Phase 56" in a fixture doc could match a regex that captures `56` as an agent count.

**How to avoid:** Fixture docs should contain only the minimum text needed to trigger the target regexes — no extra numeric content. The clean/ fixture claims should use small, round numbers (e.g., "5 test suites, 100 assertions, 90.00% line coverage") that are easily distinguishable from the live values and won't collide with other regexes.

---

## Plan Wave Recommendations

Three TDD waves mirroring Phase 55's structure exactly.

### Wave 1 — Plan 56-01: Fixtures + Pure Functions (TDD)

**Wave type:** TDD — RED then GREEN per function.

**Goal:** Lock in pure/deterministic functions before any I/O is wired. All exported functions testable with `node --test` in under 2 seconds.

**Files created:**
- `scripts/check-doc-drift.cjs` (exports only — no `main()`, exits 2 if invoked directly)
- `tests/check-doc-drift.test.cjs` (Wave 1 describe blocks only)
- `tests/fixtures/doc-drift/clean/CLAUDE.md`
- `tests/fixtures/doc-drift/clean/README.md`
- `tests/fixtures/doc-drift/clean/DEVOPS-HANDOFF.md`
- `tests/fixtures/doc-drift/clean/coverage/coverage-final.json`
- `tests/fixtures/doc-drift/drift/CLAUDE.md`
- `tests/fixtures/doc-drift/drift/README.md`
- `tests/fixtures/doc-drift/drift/DEVOPS-HANDOFF.md`
- `tests/fixtures/doc-drift/drift/coverage/coverage-final.json`
- `tests/fixtures/doc-drift/edge/no-coverage/CLAUDE.md` (no coverage/ dir)

**Functions implemented (TDD per function):**
1. `stripCommas(s)` — pure, removes commas from numeric strings
2. `parsePercent(s)` — pure, parses `"91.23"` or `"91.23%"` to float
3. `asInt(s)` — pure, `parseInt(s, 10)` with NaN guard
4. `parseTapSummary(tapOutput)` — pure, regex on string, returns `{ tests, suites }`
5. `aggregateCoverage(jsonData)` — pure, takes parsed JSON object, returns `{ line, branch, function }`
6. `extractClaims(filePath, metricsForFile)` — reads one file, returns `[{ line, metric, claimed }]` array
7. `compareClaim(claimed, actual, normalize, epsilon)` — pure comparison, returns drift object or null
8. `formatDriftTable(records, repoRoot)` — pure formatting, column-pad table

**Wave 1 must_haves (shape):**
- `node -e "const m = require('./scripts/check-doc-drift.cjs'); for (const fn of ['stripCommas','parsePercent','asInt','parseTapSummary','aggregateCoverage','extractClaims','compareClaim','formatDriftTable','METRICS']) if (!m[fn]) process.exit(1);"` exits 0
- `node --test tests/check-doc-drift.test.cjs` exits 0
- Fixture tree exists: `test -d tests/fixtures/doc-drift/clean && test -d tests/fixtures/doc-drift/drift && test -d tests/fixtures/doc-drift/edge`
- `head -1 scripts/check-doc-drift.cjs` outputs `#!/usr/bin/env node`
- Direct invocation exits 2: `node scripts/check-doc-drift.cjs; test $? -eq 2`

### Wave 2 — Plan 56-02: Measurement + Integration (TDD)

**Wave type:** TDD — adds I/O measurement functions and wires `main(argv)`.

**Depends on:** Wave 1

**Goal:** Full CLI — `node scripts/check-doc-drift.cjs --root <dir>` works end-to-end against fixture trees. Exit codes and JSON output verified via spawnSync.

**Files modified:**
- `scripts/check-doc-drift.cjs` — adds `measureCoverageFromJson`, `measureTestCounts`, filesystem `measure*` functions, and `main(argv)`
- `tests/check-doc-drift.test.cjs` — adds Wave 2 describe blocks
- `.c8rc.json` — adds `"scripts/check-doc-drift.cjs"` to `include` array

**Functions implemented:**
1. `measureCoverageFromJson(root, staleSecs)` — reads `coverage/coverage-final.json`, checks age, aggregates
2. `measureTestCounts(root)` — spawns `node --test --test-reporter=tap`, parses output with `parseTapSummary`
3. `measureAgentCount(root)` — `readdirSync(path.join(root, 'agents')).filter(f => /^gsd-.*\.md$/.test(f)).length`
4. `measureCommandCount(root)` — `readdirSync(path.join(root, 'commands', 'gsd')).filter(f => f.endsWith('.md')).length`
5. `measureSkillCount(root)` — glob `plugins/*/skills/*/` directories
6. `measureHookCount(root)` — `readdirSync(path.join(root, 'hooks', 'dist')).filter(f => f.endsWith('.js')).length`
7. `main(argv)` — parses `--root`, `--json`, `--coverage-stale-secs`, `--help`; orchestrates all measurements, extracts claims, compares, formats, exits

**Wave 2 must_haves (shape):**
- `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/clean` exits 0
- `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/drift` exits 1
- `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/edge/no-coverage` exits 2
- `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/drift --json | node -e "..."` validates JSON envelope shape
- `node -e "const c = JSON.parse(require('fs').readFileSync('.c8rc.json','utf8')); if (!c.include.includes('scripts/check-doc-drift.cjs')) process.exit(1);"` exits 0
- `npm run test:coverage` exits 0 (coverage tracked for new script)
- `node --test tests/check-doc-drift.test.cjs` exits 0

**Key design decision for tests:** The clean/ and drift/ fixture trees contain precomputed `coverage/coverage-final.json` files with known values. The `measureTestCounts` call in `main()` is skipped when `--root` points to a fixture directory that has a `coverage/test-stats.json` file containing `{ tests: N, suites: N }`. This avoids a 30-second `node --test` spawn during integration tests. Alternatively, tests can pass `--coverage-stale-secs 0` and supply a fixture coverage file, then test `measureTestCounts` separately via a TAP string fixture. The planner should choose the `test-stats.json` shortcut approach for cleaner test isolation.

### Wave 3 — Plan 56-03: Real-Repo Run + Doc Updates

**Wave type:** Execute (not TDD)

**Depends on:** Waves 1 and 2

**Goal:** Run the detector against the actual repo, surface and fix confirmed drift, update docs, confirm clean exit.

**Files modified:**
- `CLAUDE.md` — update test count (2,667→2,723), suite count (536→545), line coverage (91.23%→91.34%), command count (65→66)
- `README.md` — update test suites (536→545), test assertions (2,667→2,723), command count (65→66 in three locations), hook count (7→6 in two locations)
- `docs/DEVOPS-HANDOFF.md` — update unit test count (2,667→2,723 in two locations), command count (65→66), hook count (7→6)
- `scripts/check-doc-drift.cjs` — add mention to CLAUDE.md Tests section (same as Phase 55 added validate-doc-links reference)

**Wave 3 tasks:**
1. Run `node scripts/check-doc-drift.cjs` from repo root — record all drift records
2. Fix each drift record in the living docs (surgical edits, preserve surrounding text)
3. Re-run `node scripts/check-doc-drift.cjs` — must exit 0
4. Run `npm test` — must exit 0
5. Run `npm run test:coverage` — line ≥ 91%, branch ≥ 83%
6. Update CLAUDE.md, README.md, DEVOPS-HANDOFF.md to reference `check-doc-drift.cjs`

**Wave 3 must_haves (shape):**
- `node scripts/check-doc-drift.cjs` exits 0 (after doc updates)
- `npm test` exits 0
- `grep -F 'scripts/check-doc-drift.cjs' CLAUDE.md && grep -F 'scripts/check-doc-drift.cjs' README.md && grep -F 'scripts/check-doc-drift.cjs' docs/DEVOPS-HANDOFF.md` each return a match

**Expected initial drift (before doc updates):**

| FILE | LINE | METRIC | CLAIMED | ACTUAL |
|------|------|--------|---------|--------|
| CLAUDE.md | 14 | command_count | 65 | 66 |
| CLAUDE.md | 51 | test_count | 2,667 | 2,723 |
| CLAUDE.md | 51 | suite_count | 536 | 545 |
| CLAUDE.md | 51 | line_coverage | 91.23 | 91.34 |
| README.md | 59 | command_count | 65 | 66 |
| README.md | 59 | hook_count_execution | 7 | 6 |
| README.md | 69 | command_count | 65 | 66 |
| README.md | 71 | hook_count_execution | 7 | 6 |
| README.md | 75 | suite_count | 536 | 545 |
| README.md | 76 | test_count | 2,667 | 2,723 |
| DEVOPS-HANDOFF.md | 46 | command_count | 65 | 66 |
| DEVOPS-HANDOFF.md | 48 | hook_count_execution | 7 | 6 |
| DEVOPS-HANDOFF.md | 72 | test_count | 2,667 | 2,723 |
| DEVOPS-HANDOFF.md | 87 | test_count | 2,667 | 2,723 |

14 drift records expected on first real-repo run. All are fixable in Wave 3 by updating the living docs.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 56 has no external dependencies beyond Node.js built-ins. All measurement primitives use `fs`, `path`, `child_process` (for spawning `node --test`), and reading local files. `node:test` is built into Node 20+ and confirmed available in the CI matrix.

---

## Sources

### Primary (HIGH confidence)

- `.planning/phases/56-doc-drift-detector/56-CONTEXT.md` — all locked decisions D-01 through D-18, metric registry shape, output format, exit codes
- `.planning/phases/55-internal-link-validator/55-RESEARCH.md` — sibling architecture (file header, formatTable, spawnSync harness, fixture layout, describe-block organization)
- `.planning/phases/55-internal-link-validator/55-01-PLAN.md` — TDD plan shape (RED→GREEN task structure, must_haves format, acceptance criteria)
- `scripts/validate-doc-links.cjs` — live sibling implementation (formatTable, LINK_RE, shebang, 'use strict', exports)
- `tests/validate-doc-links.test.cjs` — live sibling test file (spawnSync harness, FIXTURES path, runScript helper)
- `scripts/run-tests.cjs` — cross-platform test discovery pattern (`readdirSync + filter + sort`)
- `.c8rc.json` — coverage include array shape (current entries confirmed)
- TAP output captured live: `node --test --test-reporter=tap tests/*.test.cjs` → `# tests 2723 / # suites 545` on Node v22.21.1
- `coverage/coverage-final.json` aggregated live: line 91.34%, branch 83.22%, function 97.47%

### Secondary (MEDIUM confidence)

- `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` — all numeric claims extracted with `grep -n` and verified by eye against line numbers; MEDIUM because line numbers may shift after Wave 3 edits (the regexes are context-anchored so they remain valid)
- `commands/gsd/sync-docs.md` — authoritative measurement commands; MEDIUM because it defines shell commands but the detector implements them as Node functions (behavior should match but is re-implemented)
- `.planning/REQUIREMENTS.md` — DOCDRIFT-01 through DOCDRIFT-05 verbatim (authoritative scope)

### Tertiary (LOW confidence)

- None — all claims trace to files read or live measurements taken during this research run.

---

## Metadata

**Confidence breakdown:**

- Measurement primitives (TAP parsing, coverage aggregation): HIGH — verified against live output
- Claim extraction (regex shapes): HIGH — verified against live doc content with grep
- Wave 3 expected drift table: HIGH — all entries manually verified by reading each doc
- Sibling-phase patterns: HIGH — read directly from live Phase 55 files
- Fixture design for measureTestCounts isolation: MEDIUM — the `test-stats.json` shortcut is a recommendation; the planner may choose a different isolation strategy

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (all findings are against stable Node built-ins and this project's own source files; the only fast-moving element is the live test/coverage counts, which Wave 3 corrects)
