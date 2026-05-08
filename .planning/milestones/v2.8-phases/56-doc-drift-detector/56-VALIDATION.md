---
phase: 56
slug: doc-drift-detector
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 56 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert` |
| **Config file** | None (auto-discovered by `scripts/run-tests.cjs`) |
| **Quick run command** | `node --test tests/check-doc-drift.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds for the file alone; ~30s for full suite |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/check-doc-drift.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green; coverage held at ≥91% line / ≥83% branch
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 56-01-01 | 01 | 1 | DOCDRIFT-01..05 (fixtures) | unit (fixtures) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-01-02 | 01 | 1 | DOCDRIFT-01 | unit (`stripCommas`, `parsePercent`, `asInt`, `parseTapSummary`, `aggregateCoverage`) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-01-03 | 01 | 1 | DOCDRIFT-03 | unit (`extractClaims`) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-01-04 | 01 | 1 | DOCDRIFT-04 | unit (`compareClaim`, `formatDriftTable`) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-02-01 | 02 | 2 | DOCDRIFT-01, DOCDRIFT-02 | unit (`measureCoverageFromJson`, `measureTestCounts`, filesystem `measure*`) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-02-02 | 02 | 2 | DOCDRIFT-05 | integration (`spawnSync`, exit codes) | `node --test tests/check-doc-drift.test.cjs` | ❌ W0 | ⬜ pending |
| 56-02-03 | 02 | 2 | DOCDRIFT-04, DOCDRIFT-05 | integration (`spawnSync`, `--json` envelope) + coverage tracking | `node --test tests/check-doc-drift.test.cjs && npm run test:coverage` | ❌ W0 | ⬜ pending |
| 56-03-01 | 03 | 3 | acceptance (real-repo) | manual + automated | `node scripts/check-doc-drift.cjs && npm test` | ✅ | ⬜ pending |
| 56-03-02 | 03 | 3 | doc sync (living docs reference new script) | manual | `grep -E "check-doc-drift" CLAUDE.md README.md docs/DEVOPS-HANDOFF.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/check-doc-drift.test.cjs` — unit + integration tests for DOCDRIFT-01..05
- [ ] `tests/fixtures/doc-drift/clean/CLAUDE.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/README.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/DEVOPS-HANDOFF.md` — fixture with all-matching claims
- [ ] `tests/fixtures/doc-drift/clean/coverage/coverage-final.json` — pre-baked coverage JSON matching clean fixture claims
- [ ] `tests/fixtures/doc-drift/drift/CLAUDE.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/README.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/DEVOPS-HANDOFF.md` — fixture with intentionally wrong claims
- [ ] `tests/fixtures/doc-drift/drift/coverage/coverage-final.json` — coverage matching drift fixture's "actual" values
- [ ] `tests/fixtures/doc-drift/edge/no-coverage/CLAUDE.md` — doc fixture without coverage/ directory (tests exit-code 2)
- [ ] `scripts/check-doc-drift.cjs` — script with `require.main === module` guard so functions are exportable for tests
- [ ] `.c8rc.json` — add `"scripts/check-doc-drift.cjs"` to the `include` array (Wave 2)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-repo drift detection — known drift surfaces | DOCDRIFT-05 (exit 1 on drift) | Depends on actual repo state at run time | Run `node scripts/check-doc-drift.cjs` from repo root before docs are updated. Confirm stdout contains `command_count` (claimed 65, actual 66) and `hook_count_execution` (claimed 7, actual 6) drift records. Exit code 1. |
| Real-repo clean pass after doc updates | DOCDRIFT-05 (exit 0 on clean) | Depends on docs being updated to live values within the same plan | After Wave 3 doc edits, run `node scripts/check-doc-drift.cjs` from repo root. Exit code 0. |
| Living-doc sync (CLAUDE.md, README.md, DEVOPS-HANDOFF.md mention `check-doc-drift.cjs`) | acceptance | Documentation references have no semantic test in Phase 56 — Phase 57 wires CI | After Wave 3, grep each living doc for `check-doc-drift` and confirm a description exists. |

---

## Five Validation Dimensions (from RESEARCH.md)

| Dimension | What it proves | Tested in |
|-----------|---------------|-----------|
| 1. Functional correctness | `compareClaim` returns drift when claimed ≠ actual, null when equal | Wave 1 unit tests |
| 2. Fixture coverage | clean/ exits 0, drift/ exits 1, edge/no-coverage exits 2 | Wave 2 integration tests (spawnSync) |
| 3. Real-repo agreement | Detector against actual repo surfaces exactly the known drift (command_count 65→66, hook_count 7→6) and no spurious drift | Wave 3 acceptance |
| 4. Regression on clean repo | After Wave 3 doc updates, re-running detector exits 0; full test suite green; coverage thresholds held | Wave 3 final verification |
| 5. Exit-code contract | exit 0 = clean, exit 1 = drift, exit 2 = runtime error (missing/stale coverage) | Wave 2 spawnSync tests |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (test file, fixture tree, script, .c8rc include)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner produces plans satisfying this contract)

**Approval:** pending
