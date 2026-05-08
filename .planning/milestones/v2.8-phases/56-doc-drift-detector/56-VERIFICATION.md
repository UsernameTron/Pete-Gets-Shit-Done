---
status: passed
phase: 56-doc-drift-detector
verified: 2026-05-08T00:00:00Z
must_haves_verified: 8/8
requirements_covered: 5/5
hardening_edits_verified: 5/5
---

# Phase 56: Doc Drift Detector — Verification Report

**Phase Goal:** Numeric claims in the three living docs are automatically compared against measured live values, and any disagreement fails the run with a structured drift report.

**Verified:** 2026-05-08
**Status:** passed
**Re-verification:** No (initial verification)

---

## Goal Achievement

| Observable Truth | Status | Evidence |
|---|---|---|
| Detector exits 0 on a clean repo where all numeric claims match | VERIFIED | `node scripts/check-doc-drift.cjs` printed `check-doc-drift: all 23 numeric claim(s) match live values (3 files, 9 metrics)`, exit 0 |
| Detector exits 1 with a structured drift table when a claim disagrees | VERIFIED | `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/drift` printed a 17-row table with FILE/LINE/METRIC/CLAIMED/ACTUAL columns, exit 1 |
| Detector exits 2 on runtime/coverage error | VERIFIED | `node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/edge/no-coverage` printed `coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs`, exit 2 |
| `--json` mode emits a structured envelope | VERIFIED | JSON output: `{"status":"clean","checked":23,"files":3,"metrics":9,"drift":[]}`, exit 0 |
| Drift table identifies file, line, claimed value, actual value, and metric name | VERIFIED | Drift fixture run produced explicit columns; e.g., `CLAUDE.md  6  test_count  9999  100` |
| At least six metric categories are measured | VERIFIED | METRICS registry has 9 entries: `test_count`, `suite_count`, `line_coverage`, `branch_coverage`, `function_coverage`, `agent_count`, `command_count`, `skill_count`, `hook_count_execution` (scripts/check-doc-drift.cjs lines 64-277) |
| Detector reference text in living docs does NOT introduce false-positive drift | VERIFIED | Live-repo run after Wave 3 doc updates exits 0 with `checked=23` (collision-safe wording confirmed) |
| Test suite green and coverage thresholds preserved | VERIFIED | `npm test`: 2,805/2,805 pass; coverage 91.58% line / 83.4% branch overall; 98.28% line on scripts/check-doc-drift.cjs |

**Score:** 8/8 must-haves verified.

---

## Success Criteria

Cross-referenced against the four Success Criteria from ROADMAP.md.

### SC-1: Running detector on clean repo where all numeric claims match exits zero

PASS. Live-repo run produced:
```
$ node scripts/check-doc-drift.cjs
check-doc-drift: all 23 numeric claim(s) match live values (3 files, 9 metrics)
$ echo $?
0
```

### SC-2: Running detector after manually editing a claimed value to incorrect produces a drift table row identifying file/line/claimed/actual/metric and exits non-zero

PASS. Drift fixture run produced:
```
$ node scripts/check-doc-drift.cjs --root tests/fixtures/doc-drift/drift
check-doc-drift: 17 drift(s) found

FILE       LINE  METRIC                CLAIMED  ACTUAL
---------  ----  --------------------  -------  ------
CLAUDE.md  6     test_count            9999     100
... (16 more rows)
$ echo $?
1
```
The five required columns (FILE, LINE, METRIC, CLAIMED, ACTUAL) are present in the drift table and verifier confirmed all 17 rows. Same shape was confirmed against the live repo before Wave 3 fixes (14 rows recorded in 56-03-SUMMARY.md "Detector Run Against Real Repo" section).

### SC-3: Detector measures at least six metric categories (test count, suite count, line coverage, branch coverage, function coverage, and filesystem-derived counts)

PASS. METRICS registry holds **9** entries (scripts/check-doc-drift.cjs lines 64-277):

| ID | Category |
|----|----------|
| test_count | tests |
| suite_count | suites |
| line_coverage | coverage (line) |
| branch_coverage | coverage (branch) |
| function_coverage | coverage (function) |
| agent_count | filesystem (agents/gsd-*.md) |
| command_count | filesystem (commands/gsd/*.md) |
| skill_count | filesystem (plugins/*/skills/*/) |
| hook_count_execution | filesystem (hooks/dist/*.js) |

Six categories required, nine delivered.

### SC-4: Running detector with `--json` outputs machine-readable JSON suitable for programmatic consumption

PASS.
```
$ node scripts/check-doc-drift.cjs --json
{
  "status": "clean",
  "checked": 23,
  "files": 3,
  "metrics": 9,
  "drift": []
}
```
Envelope shape matches D-13 contract: `{ status, checked, files, metrics, drift[] }`. Output is parseable by `JSON.parse`. Verified by integration test `describe('--json output')` in tests/check-doc-drift.test.cjs (passing).

---

## Requirement Coverage

All five DOCDRIFT requirements are marked `[x]` in `.planning/REQUIREMENTS.md` (lines 21-25) and traceability table (lines 63-67).

| Req | Status | Plan(s) Claiming | Implementation Evidence | Test Evidence |
|---|---|---|---|---|
| DOCDRIFT-01 | SATISFIED | 56-01, 56-02, 56-03 | parseTapSummary (lines 317-325), aggregateCoverage (lines 339-357), measureCoverageFromJson (lines 370-389), measureTestCounts (lines 401-440); live values: 2,805 tests, 560 suites, 91.58% line | tests/check-doc-drift.test.cjs `describe('parseTapSummary')`, `describe('aggregateCoverage')`, `describe('measureCoverageFromJson')`, `describe('measureTestCounts')` — all 82 detector tests pass |
| DOCDRIFT-02 | SATISFIED | 56-01, 56-02, 56-03 | measureAgentCount (line 443), measureCommandCount (line 450), measureSkillCount (line 463), measureHookCount (line 479); live values: 17 agents, 66 commands, 45 skills, 6 hooks | tests/check-doc-drift.test.cjs `describe('measure filesystem (agent/command/skill/hook)')` — passing |
| DOCDRIFT-03 | SATISFIED | 56-01, 56-02, 56-03 | METRICS registry with 23 anchored regex claims across CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md (lines 64-277); extractClaims function (lines 511-534) | tests/check-doc-drift.test.cjs `describe('extractClaims')` plus multi-line sanity test at line 397 |
| DOCDRIFT-04 | SATISFIED | 56-01, 56-02, 56-03 | formatDriftTable produces FILE/LINE/METRIC/CLAIMED/ACTUAL columns (lines 585-621); JSON envelope `{ status, checked, files, metrics, drift }` (lines 767-775) | `describe('formatDriftTable')`, `describe('main() exit codes')`, `describe('--json output')` — passing |
| DOCDRIFT-05 | SATISFIED | 56-01, 56-02, 56-03 | main() exits 0/1/2 per drift state (line 787) plus exit 2 on runtime errors (lines 376, 384, 657, 671, 714); --json flag handled at line 647 | Verified by all four CLI smoke runs above (clean=0, drift=1, no-coverage=2, --json clean=0); spawnSync integration tests in `describe('main() exit codes')` |

No orphaned requirements. ROADMAP.md's `Requirements:` field for Phase 56 (DOCDRIFT-01..05) is fully claimed across the three plans' `requirements:` frontmatter fields.

---

## Hardening Edits

All five surgical hardening edits from REVIEWS.md "Recommended Replanning" are live in code AND covered by tests.

### Edit 1: `maxBuffer: 16 * 1024 * 1024` + empty-stdout failure path test

PASS.
- Source: `scripts/check-doc-drift.cjs:425` — `maxBuffer: 16 * 1024 * 1024` on execFileSync options.
- Source: `scripts/check-doc-drift.cjs:434-436` — empty-stdout guard returns `{ tests: 0, suites: 0 }` when `err.stdout === undefined || err.stdout === ''`.
- Test: `tests/check-doc-drift.test.cjs:661-672` — "measureTestCounts returns { tests: 0, suites: 0 } when execFileSync throws with empty stdout" — writes broken JS to a temp test file, asserts {0,0}.

### Edit 2: `isRepoRoot` + `missingDocPolicy` with literal stderr message + integration test

PASS.
- Source: `scripts/check-doc-drift.cjs:687-693` — `isRepoRoot` helper checks `package.json` AND `.gitignore` co-presence; `missingDocPolicy` derived as `'fail'` when `!rootFlagPassed || isRepoRoot(repoRoot)`, else `'skip'`.
- Source: `scripts/check-doc-drift.cjs:712` — literal stderr `check-doc-drift: required living doc not found: <path> — run from repo root or use --root <fixtureDir>\n`.
- Test: `tests/check-doc-drift.test.cjs:786-826` — covers Scenario A (no markers → policy=skip → exit 0) and Scenario B (markers present + missing doc → policy=fail → exit 2 with stderr literal `required living doc not found:`).

### Edit 3: Multi-line claims JSDoc constraint + sanity test

PASS.
- Source: `scripts/check-doc-drift.cjs:498-505` — JSDoc explicitly documents the line-by-line constraint, references the sanity test in tests/, names REVIEWS.md.
- Test: `tests/check-doc-drift.test.cjs:397-444` — "multi-line sanity: live CLAUDE.md/README.md/DEVOPS-HANDOFF.md claims are all single-line" — reads each living doc and asserts no claim regex would span a newline.

### Edit 4: METRICS empty-claims guard test + V1 allowed-empty rationale

PASS.
- Source: `scripts/check-doc-drift.cjs:132-141` — JSDoc-style comment in `branch_coverage` claims array documents the "V1 allowed-empty (Codex suggestion adopted from REVIEWS.md #4)" rationale and names the whitelist; same for `function_coverage` at line 147.
- Test: `tests/check-doc-drift.test.cjs:143-152` — "empty-claims guard: every enforced metric has non-empty claims (branch_coverage and function_coverage are allowed empty in v1)" — iterates METRICS and asserts `claims.length > 0` except for the whitelisted pair.

### Edit 5: Wave 3 must_haves truth + WORDING-COLLISION AVOIDANCE

PASS.
- Plan must_have (56-03-PLAN.md line 24): `"node scripts/check-doc-drift.cjs from repo root after Wave 3 doc updates exits 0 (proves the newly-added detector-reference text in CLAUDE.md, README.md, and docs/DEVOPS-HANDOFF.md does NOT introduce a false-positive drift record — Codex suggestion adopted from REVIEWS.md 'Recommended Replanning' #5)"`.
- Live verification: `node scripts/check-doc-drift.cjs` exits 0 from repo root after Wave 3 reference text was added to all three docs. JSON envelope shows `checked=23` — same baseline as before reference-text introduction. The collision-safe wording avoided patterns like `"checks N metrics"`, `"validates X assertions"`, `"protects N execution hooks"` that would have matched claim regexes.
- 56-03-SUMMARY.md "Wording collision check" subsection (line 89) documents the negative-regex check passed.

---

## Test Suite + Coverage

Full repo regression confirmed.

| Metric | Threshold | Live Value | Status |
|---|---|---|---|
| Tests pass | 2,805/2,805 | 2,805/2,805 | PASS |
| Test suites | — | 560 | informational |
| `tests/check-doc-drift.test.cjs` cases | 82 | 82/82 pass | PASS |
| Overall line coverage | ≥ 91% | 91.58% | PASS |
| Overall branch coverage | ≥ 83% | 83.4% | PASS |
| Overall function coverage | — | 97.21% | PASS |
| `scripts/check-doc-drift.cjs` line coverage | ≥ 80% | 98.28% | PASS |
| `scripts/check-doc-drift.cjs` branch coverage | — | 90.5% | PASS |
| `scripts/check-doc-drift.cjs` function coverage | — | 92.85% | PASS |
| `scripts/check-doc-drift.cjs` size | — | 814 lines | informational |
| `tests/check-doc-drift.test.cjs` size | — | 931 lines | informational |

No regressions. The 23 net suites and 82 net tests added by Phase 56 lifted the project's totals from baseline 537 suites / 2,723 tests to 560 / 2,805.

---

## Out-of-Scope Discipline

Confirmed none of the deferred items were implemented.

| Out-of-Scope Item | Status |
|---|---|
| CI wiring in `.github/workflows/test.yml` (Phase 57) | Not present — `grep -F 'check-doc-drift' .github/workflows/test.yml` returns no match |
| `.planning/PROJECT.md` drift detection | Not implemented — `grep -nE 'PROJECT\.md\|CHANGELOG\.md' scripts/check-doc-drift.cjs` returns no match; only CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md in DOC_ORDER (line 567) |
| `CHANGELOG.md` drift detection | Not implemented (same grep) |
| Auto-fix mode | No `scripts/fix-drift.cjs` or `--fix` flag — `ls scripts/` shows only `check-doc-drift.cjs` for this phase |
| Additional hook count metrics beyond `hook_count_execution` | Confirmed — only `hook_count_execution` ID exists in METRICS (line 253). No `hook_count_governance`, `hook_count_total`, etc. |

Scope discipline: clean.

---

## Cross-Doc Consistency

| Check | Status |
|---|---|
| All 3 living docs reference `scripts/check-doc-drift.cjs` | PASS — `grep -F 'scripts/check-doc-drift.cjs'` returned a match in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md |
| Reference text uses collision-safe wording | PASS — wording uses `"validate that numeric claims … match live measured values"`, `"Validates numeric claims … against live test counts, coverage percentages, and filesystem inventory"`, and `"Compares live test counts, coverage, agent/command/skill/hook inventory against numeric claims in the three living docs"`. None of these phrases match the regex patterns in METRICS for command_count (`(\d+)\s+commands,\s+\d+\s+agents`), test_count (`(\d+)\s+assertions`), line_coverage (`(\d{2,3}\.\d{1,2})%\s+line coverage`), or hook_count_execution (`(\d+)\s+execution\s+\+\s+\d+\s+governance`) |
| Final repo-root run after Wave 3 still exits 0 | PASS — verified via direct `node scripts/check-doc-drift.cjs` invocation: `checked=23`, `drift=[]`, exit 0 |
| All 14 known stale claims are gone | PASS — `grep -E '536 test suites|2,667 assertions|65 slash commands|65 commands|Test suites \| 536|Test assertions \| 2,667|65 GSD slash commands|7 execution hooks \(bundled JS\)|Run 2,667 unit tests|Unit tests \| 2,667' CLAUDE.md README.md docs/DEVOPS-HANDOFF.md` returns no matches |
| Updated values are present | PASS — confirmed `**66 slash commands**` (CLAUDE.md:14), `Scale: 560 test suites, 2,805 assertions, 91.58% line coverage` (CLAUDE.md:51), `66 commands, 17 agents, 6 hooks` (README.md:59), `Test suites \| 560` (README.md), `Test assertions \| 2,805` (README.md:76), `66 GSD slash commands` (docs/DEVOPS-HANDOFF.md:46), `6 execution hooks (bundled JS)` (docs/DEVOPS-HANDOFF.md:48), `Run 2,805 unit tests` (docs/DEVOPS-HANDOFF.md:72), `Unit tests \| 2,805` (docs/DEVOPS-HANDOFF.md:88) |

Cross-doc consistency: clean.

---

## Architecture Score

| Dimension | Weight | Score | Status |
|---|---|---|---|
| Security | 35% | 78 | PASS |
| Performance | 25% | 82 | PASS |
| Correctness | 25% | 92 | PASS |
| Maintainability | 15% | 88 | PASS |
| **Overall** | **100%** | **84** | **PASS** |

### Criteria Detail

**Security (78):**
1. Prompt injection resistance — N/A (script reads only own-repo .md files via fs); 7
2. Permission boundaries — Script writes nothing; only reads coverage JSON, doc files, filesystem inventories; 9
3. Secret handling — No credentials or external network calls; spawn uses `process.execPath` with explicit args (no shell expansion); 8
4. Input validation — `--root` and `--coverage-stale-secs` validate argument shape and exit 2 on malformed input; readdirSync results filtered with anchored regexes; `path.join` used everywhere (no path concatenation); 7

**Performance (82):**
5. Resource bounds — `timeout: 120_000` on TAP spawn, `maxBuffer: 16 * 1024 * 1024` documented hardening; 9
6. Lazy loading — Coverage JSON read once, shared via ctx; metric measure callbacks deferred until claim extraction completes; 8
7. Concurrency design — Single-process serial execution; appropriate for the workload (3 doc files, 9 metrics, ~23 claims); 7

**Correctness (92):**
8. Error handling — Three exit codes (0/1/2) with explicit remediation messages; missing-doc policy derived from path semantics; empty-stdout guard on TAP spawn failure; 10
9. Edge case coverage — Empty claim arrays whitelisted (branch_coverage, function_coverage); multi-line claim sanity test prevents silent regex misses; isRepoRoot probe avoids upward filesystem walk; 9
10. Type safety — Pure function inputs validated via `String(...)` coercion; parseFloat/parseInt handle non-numeric input via NaN; 9
11. Test coverage — 98.28% line on the new script (threshold ≥80%); 82 unit + integration tests; multi-dimensional fixture coverage (clean/drift/edge); 10

**Maintainability (88):**
12. Naming clarity — Function and variable names directly describe intent (`measureCoverageFromJson`, `compareClaim`, `parseTapSummary`, `formatDriftTable`); 9
13. Single responsibility — One concern per function; pure functions separated from I/O; metric registry and measurement wired via separate `metricMeasureMap`; 9
14. Dependency hygiene — Zero external deps maintained (verified — `require('fs')`, `require('path')`, `require('child_process')` only); no circular imports; 8

Verdict: PASS at 84 overall, no dimension below 78.

---

## Gaps

None.

---

## Human Verification Required

None. All Phase 56 deliverables verifiable via automated commands; no UI, real-time, or external-service behavior in scope.

---

_Verified: 2026-05-08_
_Verifier: Claude (gsd-verifier scope:general)_

## VERIFICATION PASSED
