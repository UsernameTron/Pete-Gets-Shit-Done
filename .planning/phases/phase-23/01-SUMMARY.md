---
phase: 23
plan: 1
title: "Core Pipeline E2E Tests"
status: complete
requirements_covered: ["E2E-04", "E2E-05", "E2E-06"]
tests_added: 29
total_e2e_tests: 41
---

# SUMMARY — Phase 23, Plan 01: Core Pipeline E2E Tests

## What Was Built

Three E2E test files covering the core GSD pipelines:

### Task 1: `tests/e2e/new-project.test.cjs` (18 tests)
- JSON structure validation for `init new-project`
- Brownfield detection: code files at root, nested (depth 3), skipped dirs (node_modules, .git)
- Package file detection: package.json, requirements.txt, Cargo.toml, go.mod, Makefile, negative case
- State begin-phase transitions with STATE.md updates
- Planning files validity: frontmatter parsing, git presence detection

### Task 2: `tests/e2e/pipeline-plan-execute.test.cjs` (5 tests)
- plan-phase init JSON structure validation (phase_found, plans, models, flags)
- execute-phase init JSON structure (plans array, summaries, incomplete_plans)
- State transitions: begin-phase → execute-phase discovers plans
- Multi-plan discovery with incomplete_plans tracking
- ROADMAP.md fallback when phase directory doesn't exist

### Task 3: `tests/e2e/pipeline-verify-ship.test.cjs` (6 tests)
- verify-work init JSON shape for completed phases
- VERIFICATION.md presence detection (has_verification flag)
- Non-existent phase returns phase_found: false
- Ship artifact assembly: complete phase artifacts validated end-to-end
- phase-op returns correct plan/summary counts for mid-milestone and completed projects

## Files Created

| File | Tests | Lines |
|------|-------|-------|
| `tests/e2e/new-project.test.cjs` | 18 | ~350 |
| `tests/e2e/pipeline-plan-execute.test.cjs` | 5 | ~230 |
| `tests/e2e/pipeline-verify-ship.test.cjs` | 6 | ~220 |

## Key Technical Decisions

1. **`execFileSync` over `execSync`**: Shell injection safety per SEC-01
2. **File naming `NN-PLAN.md`**: Matches `filterPlanFiles` convention (`endsWith('-PLAN.md')`)
3. **`fs.realpathSync(os.tmpdir())`**: macOS `/var/folders` symlink handling
4. **Phase 99 for "not found"**: Avoids ROADMAP parser format dependency
5. **Ship tested indirectly**: verify-work + phase-op + artifact assertions (ship is a workflow, not a gsd-tools command)

## Acceptance Criteria

- [x] init new-project returns all expected fields
- [x] Brownfield detection correctly identifies code files
- [x] Package file detection covers package.json, requirements.txt, and more
- [x] Empty project fixture produces valid .planning/ files
- [x] All tests use execFileSync to call gsd-tools.cjs directly
- [x] plan-phase init returns all expected fields with correct types
- [x] execute-phase init discovers plans and tracks completion
- [x] State transitions (begin → progress) produce correct STATE.md updates
- [x] Plan discovery handles multiple plans per phase
- [x] verify-work init returns all expected fields
- [x] has_verification correctly detects VERIFICATION.md presence
- [x] Phase artifacts (PLAN, SUMMARY, VERIFICATION) validated end-to-end
- [x] phase-op returns correct plan/summary counts

## Test Results

```
# tests 41
# suites 15
# pass 41
# fail 0
# duration_ms 725ms
```
