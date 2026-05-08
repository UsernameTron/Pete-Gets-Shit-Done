---
phase: 56-doc-drift-detector
plan: 01
subsystem: doc-drift
tags: [tdd, pure-functions, metrics-registry, fixture-authoring]
dependency_graph:
  requires: []
  provides:
    - scripts/check-doc-drift.cjs (pure function module — Wave 2 extends with measure* I/O + main)
    - tests/check-doc-drift.test.cjs (Wave 1 unit test suite — Wave 2 adds integration describe blocks)
    - tests/fixtures/doc-drift/ (fixture tree — Wave 2 reads via --root flag)
  affects:
    - tests/ (new test file raises suite count by 9 describes, 58 tests)
    - scripts/ (new check-doc-drift.cjs joins validate-doc-links.cjs as a doc-integrity script)
tech_stack:
  added: []
  patterns:
    - TDD RED to GREEN with node:test + assert (matches project standard)
    - CJS module with require.main === module guard (mirrors validate-doc-links.cjs sibling pattern)
    - METRICS registry constant as single source of truth for measured metrics and claim locations
    - Line-by-line extractClaims with pre-filtered claims array (caller isolates by file)
    - Document-order sort in formatDriftTable (CLAUDE.md then README.md then docs/DEVOPS-HANDOFF.md)
key_files:
  created:
    - scripts/check-doc-drift.cjs
    - tests/check-doc-drift.test.cjs
    - tests/fixtures/doc-drift/clean/CLAUDE.md
    - tests/fixtures/doc-drift/clean/README.md
    - tests/fixtures/doc-drift/clean/DEVOPS-HANDOFF.md
    - tests/fixtures/doc-drift/clean/coverage/coverage-final.json
    - tests/fixtures/doc-drift/drift/CLAUDE.md
    - tests/fixtures/doc-drift/drift/README.md
    - tests/fixtures/doc-drift/drift/DEVOPS-HANDOFF.md
    - tests/fixtures/doc-drift/drift/coverage/coverage-final.json
    - tests/fixtures/doc-drift/edge/no-coverage/CLAUDE.md
  modified:
    - .gitignore (negation pattern for tests/fixtures/**/coverage/)
decisions:
  - "D-01 honored: scripts/check-doc-drift.cjs is CJS with shebang; exports pure functions only in Wave 1"
  - "D-02 honored: all 8 functions + METRICS exported via module.exports single block"
  - "D-08 honored: stripCommas handles comma-formatted numbers; compareClaim routes on normalize identity"
  - "D-09 honored: parsePercent epsilon default = 0.01; compareClaim dispatches on normalize === parsePercent"
  - "D-14 honored: formatDriftTable sorts by DOC_ORDER [CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md]"
  - "V1 allowed-empty: branch_coverage and function_coverage have empty claims arrays per Pitfall 4"
  - "[Rule 3 - Blocking] .gitignore negation added for tests/fixtures/**/coverage/"
metrics:
  duration: ~25 minutes
  completed: 2026-05-08
  tasks_completed: 3
  tasks_total: 3
  commits: 3
  files_created: 12
  files_modified: 1
  test_describes: 9
  test_cases: 58
  test_cases_minimum: 37
---

# Phase 56 Plan 01: Doc Drift Detector — Wave 1 (Pure Functions + TDD) Summary

**One-liner:** Eight pure functions and a 9-entry METRICS registry shipped as a CJS module via TDD RED to GREEN, with 58 unit tests across 9 describe blocks covering DOCDRIFT-01, DOCDRIFT-03, and DOCDRIFT-04.

## What Was Built

### scripts/check-doc-drift.cjs (NEW)

Pure function module with no main(). Direct invocation exits 2 with "main() not yet implemented (plan 56-02)". Exports:

| Export | Role |
|--------|------|
| `stripCommas` | Comma-tolerant numeric normalization: "2,667" to "2667" |
| `parsePercent` | Float from percent string: "91.23%" to 91.23 |
| `asInt` | parseInt wrapper returning NaN for non-numeric input |
| `parseTapSummary` | Parses `# tests N` and `# suites N` from TAP stdout; suites defaults to 0 if absent (Pitfall 6) |
| `aggregateCoverage` | Aggregates s/b/f maps from coverage-final.json; b values flattened with .flat() per Pitfall 7 |
| `extractClaims` | Line-by-line regex scan; returns [] on read error; Multi-line claims constraint documented in JSDoc |
| `compareClaim` | Routes on normalize === parsePercent for epsilon comparison vs. comma-tolerant string equality |
| `formatDriftTable` | Padded text table with document-order sort; empty array returns empty string |
| `METRICS` | 9-entry registry (see claims count table below) |

METRICS registry claims per entry:

| id | claims | notes |
|----|--------|-------|
| test_count | 4 | CLAUDE.md (Scale line captureIndex 2), README.md table, DEVOPS-HANDOFF.md prose + table |
| suite_count | 2 | CLAUDE.md (Scale line captureIndex 1), README.md table |
| line_coverage | 1 | CLAUDE.md (Scale line percent capture) |
| branch_coverage | 0 | V1 allowed-empty per Pitfall 4 |
| function_coverage | 0 | V1 allowed-empty per Pitfall 4 |
| agent_count | 5 | CLAUDE.md x2 (bold + prose), README.md x2 (prose + table), DEVOPS-HANDOFF.md |
| command_count | 4 | CLAUDE.md, README.md x2, DEVOPS-HANDOFF.md |
| skill_count | 4 | CLAUDE.md, README.md x2, DEVOPS-HANDOFF.md |
| hook_count_execution | 3 | README.md x2, DEVOPS-HANDOFF.md |

### tests/check-doc-drift.test.cjs (NEW)

58 test() calls in 9 describe blocks — exceeds plan minimum of 37 by 57%.

| Describe block | Tests | Key assertions |
|---------------|-------|----------------|
| METRICS registry | 15 | Array shape, 9 entries, per-metric claim counts, empty-claims guard (REVIEWS.md #4) |
| stripCommas | 5 | Commas stripped, no-op, millions, zero, empty string |
| parsePercent | 5 | Plain, trailing %, 100, 0, 0.01 |
| asInt | 4 | Numeric, zero, large, NaN for non-numeric |
| parseTapSummary | 4 | Full block, suites-absent fallback, empty input, CRLF |
| aggregateCoverage | 4 | Clean fixture 90%/75%/100%, drift fixture, branch flatten (Pitfall 7), empty data |
| extractClaims | 9 | test_count, agent_count 2 records, command_count drift, empty claims, missing file, regex anchoring (Pitfall 1), cross-file isolation, multi-line sanity |
| compareClaim | 6 | Integer match/drift, percent match/drift, default epsilon, asInt match |
| formatDriftTable | 7 | Empty, headers, data values, repoRoot stripping, underline regex, column alignment, document-order sort |

Multi-line sanity test reads the three living docs at test time and asserts no claim spans a line boundary — provides early warning before the detector silently misses a future multi-line claim (REVIEWS.md #3).

Empty-claims guard iterates METRICS and asserts every entry except branch_coverage and function_coverage has at least one claim — regression guard against accidental claim deletion (REVIEWS.md #4).

### tests/fixtures/doc-drift/ (NEW)

11 fixture files across 3 subtrees:

- **clean/**: Claims match the pre-baked coverage JSON (5 suites, 100 assertions, 90.00% line coverage). Coverage JSON: 9/10 statements covered = 90.00% line; 3/4 branches = 75.00%; 2/2 functions = 100.00%.
- **drift/**: Intentionally wrong claims (99 suites, 9999 assertions, 50.00% line coverage) while coverage JSON still shows 90.00% — every metric has a detectable drift for Wave 2 integration tests.
- **edge/no-coverage/**: CLAUDE.md only; no coverage/ directory — drives the exit-2 missing-coverage path tested in Wave 2.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `8ccda95` | chore | Add fixture tree for doc-drift detector tests |
| `cfb7f76` | test | Add failing unit tests — RED state confirmed (MODULE_NOT_FOUND) |
| `29bd5e7` | feat | Implement check-doc-drift pure functions — GREEN (58/58 pass) |

RED to GREEN transition: `cfb7f76` exits non-zero with MODULE_NOT_FOUND; `29bd5e7` exits 0 with 58/58 pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] .gitignore blocked fixture coverage JSON from being committed**
- **Found during:** Task 1 git add
- **Issue:** Root `.gitignore` contains `coverage/` pattern which matches any directory named `coverage/` anywhere in the tree, including `tests/fixtures/doc-drift/clean/coverage/` and `tests/fixtures/doc-drift/drift/coverage/`. Git refused to stage those files.
- **Fix:** Added `!tests/fixtures/**/coverage/` and `!tests/fixtures/**/coverage/**` negation patterns to `.gitignore` so fixture coverage directories are explicitly unignored.
- **Files modified:** `.gitignore`
- **Commit:** Included in `8ccda95`

## Handoffs to Wave 2 (Plan 56-02)

Wave 2 extends these artifacts:

- `scripts/check-doc-drift.cjs` — add `measureTestCounts()`, `measureCoverageFromJson()`, filesystem inventory functions, and the real `main()` entrypoint (replacing the exit-2 stub)
- `tests/check-doc-drift.test.cjs` — add Wave 2 describe blocks for measure* functions and integration tests using `--root tests/fixtures/doc-drift/clean` and `--root tests/fixtures/doc-drift/drift`
- `tests/fixtures/doc-drift/{clean,drift,edge/no-coverage}/` — read via `--root` CLI arg in Wave 2 integration tests

## Known Stubs

One intentional Wave 2 placeholder in `scripts/check-doc-drift.cjs` (line 487):

```
process.stderr.write('check-doc-drift: main() not yet implemented (plan 56-02)\n');
process.exit(2);
```

This is by design per the plan's staged delivery model. Wave 2 (plan 56-02) replaces this block with the real `main()` implementation. The plan requires this behavior as a success criterion (`node scripts/check-doc-drift.cjs` must exit 2 in Wave 1).

## Self-Check: PASSED
