---
phase: 56-doc-drift-detector
plan: 03
status: complete
created: 2026-05-08
---

# Phase 56 Plan 03 Summary — Real-Repo Acceptance + Doc Updates

## Detector Run Against Real Repo (BEFORE doc updates)

**Command:** `node scripts/check-doc-drift.cjs`
**Exit code:** 1
**Files scanned:** 3
**Metrics in registry:** 9
Numeric claims checked: 23
Drift records: 14

### Drift Records Found (from JSON output)

FILE                    LINE  METRIC                CLAIMED  ACTUAL
----------------------  ----  --------------------  -------  -----------------
CLAUDE.md               14    command_count         65       66
CLAUDE.md               51    test_count            2,667    2805
CLAUDE.md               51    suite_count           536      560
CLAUDE.md               51    line_coverage         91.23    91.58890673147867
README.md               59    command_count         65       66
README.md               59    hook_count_execution  7        6
README.md               69    command_count         65       66
README.md               71    hook_count_execution  7        6
README.md               75    suite_count           536      560
README.md               76    test_count            2,667    2805
docs/DEVOPS-HANDOFF.md  46    command_count         65       66
docs/DEVOPS-HANDOFF.md  48    hook_count_execution  7        6
docs/DEVOPS-HANDOFF.md  72    test_count            2,667    2805
docs/DEVOPS-HANDOFF.md  87    test_count            2,667    2805

**Note:** Research §7 (dated 2026-05-07) projected test_count=2,723, suite_count=545, line_coverage=91.34. Phase 56 Wave 2 added 82 new detector tests, raising the live counts to test_count=2,805, suite_count=560, line_coverage=91.58. The drift records and metric categories match §7's expected shape exactly; only the live values grew.

### Coverage Data Used

- `coverage/coverage-final.json` mtime: 2026-05-08T08:50 local
- Aggregated values:
  - line: 91.59% (covered 21103 / total 23041)
  - branch: 83.41% (covered 4912 / total 5889)
  - function: 97.22% (covered 489 / total 503)

### Filesystem Inventory Snapshot

- `agents/gsd-*.md`: 17
- `commands/gsd/*.md`: 66
- `plugins/<plugin>/skills/<skill>/`: 45
- `hooks/dist/*.js`: 6

## Suite + Coverage Evidence (after Step 0 above)

- `npm test`: PASS, 2,805 assertions across 560 suites
- Project-wide line coverage: 91.58% (threshold: >=91%)
- Project-wide branch coverage: 83.41% (threshold: >=83%)
- `scripts/check-doc-drift.cjs` per-module coverage: 98.28% lines (threshold: >=80%)

## Doc Updates Applied (Task 2)

### Drift fixes

- CLAUDE.md L14: `command_count` 65 → 66
- CLAUDE.md L51: `test_count` 2,667 → 2,805; `suite_count` 536 → 560; `line_coverage` 91.23 → 91.58
- README.md L59: `command_count` 65 → 66; `hook_count_execution` 7 → 6
- README.md L69: `command_count` 65 → 66 (table row)
- README.md L71: `hook_count_execution` 7 → 6 (parenthetical)
- README.md L75: `suite_count` 536 → 560
- README.md L76: `test_count` 2,667 → 2,805
- docs/DEVOPS-HANDOFF.md L46: `command_count` 65 → 66
- docs/DEVOPS-HANDOFF.md L48: `hook_count_execution` 7 → 6
- docs/DEVOPS-HANDOFF.md L72: `test_count` 2,667 → 2,805 (Run line)
- docs/DEVOPS-HANDOFF.md L87: `test_count` 2,667 → 2,805 (Unit tests row)

### Detector references added

CLAUDE.md (Tests and Coverage section, after validate-doc-links line):
> `node scripts/check-doc-drift.cjs` — validate that numeric claims in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md match live measured values; exits non-zero on drift. Use `--json` for machine-readable output. Requires `npm run test:coverage` to have been run within the last hour. (Wired into CI in Phase 57.)

README.md (Documentation Tools table, new row):
> | `node scripts/check-doc-drift.cjs` | Validates numeric claims in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md against live test counts, coverage percentages, and filesystem inventory. Exits non-zero on drift. Use `--json` for machine output. |

docs/DEVOPS-HANDOFF.md (Key npm Scripts table, new row):
> | `node scripts/check-doc-drift.cjs` | Doc drift detector. Compares live test counts, coverage, agent/command/skill/hook inventory against numeric claims in the three living docs. Exit 0 = clean, 1 = drift, 2 = runtime/coverage error. Phase 57 wires this as a blocking step in `.github/workflows/test.yml`. |

**Wording collision check:** None of the three reference lines contain numeric literals that would match any METRICS claim regex. The `check-doc-drift` references do not contain patterns matching `/(\d+)\s+commands,\s+\d+\s+agents/`, `/(\d+)\s+assertions/`, `/(\d{2,3}\.\d{1,2})%\s+line coverage/`, or `/(\d+)\s+execution\s+\+\s+\d+\s+governance/`. Confirmed by post-fix JSON check: `checked=23` (unchanged from pre-reference-text baseline).

## Final Detector Run (AFTER doc updates)

**Command:** `node scripts/check-doc-drift.cjs`
**Exit code:** 0
**Output:** `check-doc-drift: all 23 numeric claim(s) match live values (3 files, 9 metrics)`

JSON envelope post-fix: `{ status: "clean", checked: 23, files: 3, metrics: 9, drift: [] }`

## Acceptance Mapping (ROADMAP Phase 56 Success Criteria)

| Success Criterion | Evidence |
|-------------------|----------|
| Detector on clean repo where all numeric claims match exits zero | Final detector run after Wave 3 doc updates exits 0 with "match live values" message |
| Detector after manually editing a claimed value to incorrect produces a drift table row identifying file/line/claimed/actual/metric and exits non-zero | Initial real-repo run produced 14 drift records (see Task 1 section); fixture-based drift run produces same shape (plan 56-02 Wave 2 integration tests) |
| Detector measures at least six metric categories (test, suite, line coverage, branch coverage, function coverage, filesystem-derived) | METRICS registry has 9 entries: test_count, suite_count, line_coverage, branch_coverage, function_coverage, agent_count, command_count, skill_count, hook_count_execution |
| Detector with `--json` outputs machine-readable JSON suitable for programmatic consumption | JSON envelope `{ status, checked, files, metrics, drift }` confirmed via Wave 2 spawnSync tests; verified manually in Task 1; post-fix JSON check confirms `status: "clean"` |

### DOCDRIFT Requirements Evidence

| Req ID | Requirement | Evidence |
|--------|-------------|----------|
| DOCDRIFT-01 | Detector measures live test count, suite count, line/branch/function coverage | TAP parsing + coverage-final.json aggregation confirmed; live values: 2,805 tests, 560 suites, 91.58% line |
| DOCDRIFT-02 | Detector measures live agent/command/skill/hook counts from filesystem | Filesystem snapshot: 17 agents, 66 commands, 45 skills, 6 hooks confirmed in Task 1 |
| DOCDRIFT-03 | Detector compares measured values against numeric claims using regex-anchored extractors | 23 claims extracted across 3 files; 14 drift records surfaced on initial run |
| DOCDRIFT-04 | Detector outputs structured drift table — doc, file:line, claimed, actual, metric | Drift table with FILE/LINE/METRIC/CLAIMED/ACTUAL columns confirmed in Task 1 output |
| DOCDRIFT-05 | Detector exits non-zero on drift, zero on agreement, with `--json` flag | Exit 1 before fixes; exit 0 after fixes; `--json` envelope verified clean |
