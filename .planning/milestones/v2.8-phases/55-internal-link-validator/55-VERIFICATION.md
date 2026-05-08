---
phase: 55-internal-link-validator
verified: 2026-05-07T00:00:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase 55: Internal Link Validator — Verification Report

**Phase Goal (ROADMAP):** Every broken relative-path and anchor ref in tracked `.md` files is detected, reported in a structured table, and fails CI on a non-zero exit.
**Verified:** 2026-05-07
**Status:** passed
**Re-verification:** No (initial)

---

## Goal Achievement Summary

All four phase success criteria are satisfied with hard evidence (test runs, fixture invocations, JSON parse, schema check). All four DOCLINK requirement IDs trace to implementation and tests. No gaps found.

---

## Requirement Traceability

| Requirement | Description | Plans Claiming | Implementation Evidence | Status |
|-------------|-------------|----------------|--------------------------|--------|
| **DOCLINK-01** | Validator identifies broken relative-path refs in tracked `.md` files | 55-01, 55-02, 55-03 | `validateLink` (scripts/validate-doc-links.cjs:178-247) returns `{reason: "file not found"}` when target doesn't exist; tested in `validateLink` block (test "missing file returns reason 'file not found' with correct line and ref"); broken fixture run produces `file not found` rows | SATISFIED |
| **DOCLINK-02** | Validator identifies broken anchor refs within and across files | 55-01, 55-03 | `validateLink` anchor branch (scripts/validate-doc-links.cjs:211-244) emits `anchor #X not found in target` and `anchor #X not found in target (0 headings)`; tested by 3 tests in `validateLink` block; JSON output test asserts at least one record's reason starts with `anchor #` | SATISFIED |
| **DOCLINK-03** | Validator outputs structured table — file, line, broken-ref, reason | 55-01, 55-03 | `formatTable` (scripts/validate-doc-links.cjs:260-288) produces FILE/LINE/REF/REASON columns; 5 tests in `formatTable` block (empty array, single record, header underline regex, multi-record alignment, repo-relative path); broken fixture text run shows table | SATISFIED |
| **DOCLINK-04** | Validator exits non-zero on any broken link, zero on clean run, with `--json` flag | 55-02, 55-03 | `main(argv)` (scripts/validate-doc-links.cjs:370-424) exits 0/1/2; `--json` emits `{status, checked, files, broken[]}` envelope; 4 exit-code tests + 5 JSON output tests + 1 argument-validation test all pass | SATISFIED |

**No orphaned requirements:** REQUIREMENTS.md maps DOCLINK-01..04 to Phase 55 only; all four are claimed by phase plans.

---

## Phase Success Criteria Validation

| # | Success Criterion | Evidence | Status |
|---|-------------------|----------|--------|
| 1 | Running validator on the repo produces a table listing every broken ref (file, line number, broken ref text, reason) and exits non-zero when any broken link exists | `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/broken` output: `validate-doc-links: 3 broken link(s) found` followed by FILE/LINE/REF/REASON aligned table; exit code = 1. SUMMARY-03 records 109 broken links found in real-repo run, also exit 1, table emitted. | PASS |
| 2 | Running the validator on a repo with no broken links exits zero and prints a clean-pass message | `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/clean` output: `validate-doc-links: all links valid (3 checked across 2 files)`; exit code = 0 | PASS |
| 3 | Running with `--json` outputs `{ status: "clean"|"broken", checked, files, broken: [<{file, line, ref, reason}>] }` | Both clean and broken `--json` runs emit valid JSON parsed by `JSON.parse`. Clean: `{"status":"clean","checked":3,"files":2,"broken":[]}`. Broken: full envelope with 3 records, each having `file`/`line`/`ref`/`reason` of correct types. JSON schema-check test asserts types. | PASS |
| 4 | Broken anchor refs are identified and reported separately from broken file-path refs | Reason strings differ by category: `file not found` (missing file path), `path escapes repository root` (traversal), `anchor #X not found in target` (cross-file or same-file anchor miss), `anchor #X not found in target (0 headings)` (anchor against heading-less target). Real-repo summary: 100 file-not-found vs 8+1 anchor reasons. | PASS |

---

## Plan must_haves Checklist

### Plan 55-01 (Wave 1: TDD core)

| must_have truth | Result |
|------------------|--------|
| Fixture directories exist (clean, broken, edge) | PASS — 17 fixture files present |
| Test file exists | PASS — tests/validate-doc-links.test.cjs (640+ lines) |
| Five core functions exported (`require + typeof`) | PASS — toGfmSlug, extractHeadingSlugs, extractLinks, validateLink, formatTable all present |
| Script has `'use strict'` and `require.main === module` guard | PASS — line 2 strict, line 439 main guard |
| `node --test tests/validate-doc-links.test.cjs` exits 0 | PASS — 56 tests, 9 suites, 0 fail |
| `validateLink` returns canonical reasons | PASS — `file not found` and `anchor #nope not found in target` returned for the embedded probes |
| `formatTable` header line and underline regex | PASS — header `FILE  LINE  REF  REASON`, underline matches `/^-+( +-+)+$/` |

### Plan 55-02 (Wave 2: discovery + main + coverage)

| must_have truth | Result |
|------------------|--------|
| `discoverTrackedFiles` is a function | PASS — exported, type=function |
| Clean fixture exits 0 | PASS — exit 0, "all links valid" |
| Broken fixture exits 1 | PASS — exit 1, table emitted |
| `--json` on broken returns `status:"broken"` with `broken[]` array | PASS — JSON parsed, status="broken", broken[] length 3 |
| `--json` on clean returns `status:"clean"` with `broken[].length === 0` | PASS — JSON parsed, status="clean", broken[]=[] |
| `.c8rc.json` includes `scripts/validate-doc-links.cjs` | PASS — include array length 7, contains script |
| Unit suite green | PASS — 56/56 |
| `npm run test:coverage` exits 0 | PASS — coverage exits 0; per-module 96.59% lines / 94.73% branches on validator |

### Plan 55-03 (Wave 3: real-repo run + doc updates)

| must_have truth | Result |
|------------------|--------|
| 55-03-SUMMARY.md exists with "Validator Run Against Real Repo" section | PASS — section exists, 109 broken refs recorded |
| `npm test` exits 0 | PASS — 2723 assertions, 545 suites, 0 fail |
| `npm run test:coverage` exits 0 | PASS — coverage exits 0 |
| Three living docs reference `scripts/validate-doc-links.cjs` | PASS — exactly 1 mention each in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md |
| `git diff --stat HEAD~1 HEAD` shows insertions-only on doc-updates commit | PASS — `git diff --numstat fb27996^ fb27996` shows `2 0`, `6 0`, `1 0` for the three files (zero deletions on each) |

---

## Test Result Summary

**File suite:** `node --test tests/validate-doc-links.test.cjs`
- 9 describe blocks (toGfmSlug, extractHeadingSlugs, extractLinks, validateLink, formatTable, discoverTrackedFiles, exit codes, JSON output, argument validation)
- 56 test cases
- 0 failures
- duration ~390 ms

**Full project suite:** `npm test`
- 2,723 assertions
- 545 suites
- 0 failures
- duration ~7.5 s

**No regressions** — pre-Phase-55 baseline was 2,667 assertions / 536 suites; Phase 55 added 56 assertions / 9 suites without breaking any existing tests.

---

## Coverage Summary

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Project-wide line coverage | 91.34% | >= 91% | PASS |
| Project-wide branch coverage | 83.21% | >= 83% | PASS |
| `scripts/validate-doc-links.cjs` line | 96.59% | >= 95% (security-critical) | PASS |
| `scripts/validate-doc-links.cjs` branch | 94.73% | >= 80% (per-module floor) | PASS |
| `scripts/validate-doc-links.cjs` function | 100% | n/a | PASS |

Uncovered lines on the validator (88-92, 131-135, 221-223, 305-306) are the file-read failure paths in `extractHeadingSlugs`/`extractLinks` (true I/O errors not exercisable from unit tests without filesystem-permission manipulation), the `decodeURIComponent` malformed-input fallback, and the `globMdFiles` unreadable-directory branch. None affect the public contract.

---

## Behavioral Spot-Checks (live runs)

| Check | Command | Expected | Actual | Status |
|-------|---------|----------|--------|--------|
| Clean fixture exit code | `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/clean; echo $?` | 0 | 0 | PASS |
| Broken fixture exit code | `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/broken; echo $?` | 1 | 1 | PASS |
| `--root` without value exit code | `node scripts/validate-doc-links.cjs --root; echo $?` | 2 | 2 | PASS |
| Clean JSON envelope | `... --root .../clean --json` | parses, status=clean, broken=[] | parses, status=clean, broken=[] | PASS |
| Broken JSON envelope | `... --root .../broken --json` | parses, status=broken, broken[].length=3 | parses, status=broken, broken[].length=3, schema typed correctly | PASS |
| Module exports six functions | `Object.keys(require(...)).sort()` | `discoverTrackedFiles,extractHeadingSlugs,extractLinks,formatTable,toGfmSlug,validateLink` | exact match | PASS |

---

## Anti-Patterns Scan

Scanned files: `scripts/validate-doc-links.cjs`, `tests/validate-doc-links.test.cjs`, the 17 fixture files.

- No `TODO` / `FIXME` / `PLACEHOLDER` comments in the implementation script
- No empty handlers or `return null`-only functions hiding stubs (the `null` returns in `validateLink` are the documented success contract)
- No console.log-only error handlers — both `extractHeadingSlugs` and `extractLinks` write to `process.stderr` with file path and error code on failure, then return safe empty values
- No hardcoded test data leaking into production paths — fixtures live exclusively under `tests/fixtures/doc-links/`
- Zero new external dependencies — only `fs`, `path`, `child_process` from Node built-ins (verified via grep against require statements)
- `execFileSync` (not `execSync`) used for git invocation — argument array prevents shell injection

No blocker, warning, or info anti-patterns surfaced.

---

## Doc Sync Spot-Check

| Doc | Mention count | Snippet (insertion-only) |
|-----|---------------|--------------------------|
| `CLAUDE.md` | 1 | `- \`node scripts/validate-doc-links.cjs\` — validate internal Markdown links across tracked \`.md\` files; exits non-zero on broken refs. Use \`--json\` for machine-readable output. (Wired into CI in Phase 57.)` (line 64, inserted after Tests/Coverage section) |
| `README.md` | 1 | New `## Documentation Tools` section with one table row (lines 105-109) |
| `docs/DEVOPS-HANDOFF.md` | 1 | One row appended to existing scripts table (line 79) |

`git diff --numstat fb27996^ fb27996` confirms zero deletions across all three files (pre-existing content preserved; Phase 57 will handle DOCREF backfill).

---

## Architecture Score

Phase 55 introduces one new script with strong test coverage and no source-code modifications outside the validator/test/coverage-config triad. The 4D rubric below.

| Dimension | Weight | Score | Status |
|-----------|--------|-------|--------|
| Security | 35% | 92 | PASS |
| Performance | 25% | 88 | PASS |
| Correctness | 25% | 95 | PASS |
| Maintainability | 15% | 90 | PASS |
| **Overall** | **100%** | **91.6** | **PASS** |

### Criteria Detail

**Security (avg 92, weight 35%)**
- *Prompt injection resistance (10):* No LLM/agent surface; pure file-content parser. `decodeURIComponent` wrapped in try/catch to prevent malformed-input crashes. Anchor and path branches cannot escape via crafted input — traversal check rejects any path resolving outside `repoRoot`.
- *Permission boundaries (9):* Script is read-only — `fs.readFileSync` + `fs.existsSync` + `fs.readdirSync` only. No write/edit/delete operations. `git ls-files` invoked via `execFileSync` with explicit argument array (no shell, no injection vector).
- *Secret handling (10):* Never reads or emits credentials; processes only `.md` files. No environment variable consumption.
- *Input validation (8):* `--root` arg validated (must have following non-flag value). `LINK_RE` constrains capture to non-whitespace path chars before optional title attribute. Path traversal explicitly checked and rejected. Minor gap: no length cap on individual links (low risk — Markdown files are bounded by `fs.readFileSync` memory limits).

**Performance (avg 88, weight 25%)**
- *Resource bounds (8):* Uses `fs.readFileSync` synchronously (acceptable for single-pass validators); no streaming for very large files. 30-second timeout in test harness, no equivalent in main loop (acceptable — validator processes finite tree).
- *Lazy loading (8):* No initialization deferred; module loads cheap built-ins only.
- *Concurrency design (9):* Slug cache (`Map`) memoizes per-target heading sets so a target referenced 50 times reads once, not 50. Real-repo run: 320 links checked across 735 files in <2s. No unnecessary re-traversal.

**Correctness (avg 95, weight 25%)**
- *Error handling (10):* Both file-read paths catch `readFileSync` failures, log to stderr, return safe empty values. `decodeURIComponent` wrapped in try/catch with documented fallback to raw anchor. `globMdFiles` catches `readdirSync` failures and returns partial results.
- *Edge case coverage (10):* 56 tests cover empty file, duplicate headings, fenced blocks, image links, external schemes, mailto, percent-encoded paths and anchors, titled links, traversal, UTF-16 (graceful skip), zero-heading anchor target. The fixture set explicitly includes the false-positive cases (e.g., `tests/fixtures/doc-links/edge/` synthetic edges).
- *Type safety (9):* JSDoc annotations on all five core + one discovery function; `Object.keys(...).sort()` smoke check confirms the exports match expected shape. JSON envelope schema asserted in tests (`typeof` for each field).
- *Test coverage (9):* 96.59% line / 94.73% branch on the validator script — exceeds the 95% security-critical threshold for lines and the 80% floor for branches. Uncovered lines are unreachable filesystem-error paths and one `decodeURIComponent` fallback.

**Maintainability (avg 90, weight 15%)**
- *Naming clarity (10):* Function names match contract (`extractHeadingSlugs`, `validateLink`, `discoverTrackedFiles`); reason strings are user-readable and stable; constants `LINK_RE`/`EXTERNAL_RE` describe intent.
- *Single responsibility (9):* Each of six functions has one job; `globMdFiles` is internal helper; `main` orchestrates without duplicating logic.
- *Dependency hygiene (9):* Zero new external dependencies preserved. Only `fs`, `path`, `child_process` from Node built-ins. JSDoc references "Pass 1/Pass 2" review fixes — useful provenance, slight cost in noise.

**Verdict:** PASS. Overall 91.6 with no dimension below 50.

---

## Gap Analysis

**No gaps found.** All four phase success criteria pass with live evidence. All four DOCLINK requirements have implementation evidence and dedicated tests. Coverage and full-suite thresholds are met. Living docs are updated insertion-only as specified.

The 109 broken refs found in the real-repo run are NOT a Phase 55 gap — they are by design routed to Phase 57 (DOCREF-01, DOCREF-02) per the ROADMAP. The validator correctly identifying them is positive evidence.

---

## Human Verification Items

None required. All success criteria are verifiable programmatically and have been verified live.

---

_Verified: 2026-05-07_ / _Verifier: Claude (gsd-verifier scope:general)_
