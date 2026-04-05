---
phase: 13
plan: 1
title: "Tech Debt Cleanup — Tier Labels, Dead Profiles, Coverage, Validator Wiring, Validation Gaps"
status: complete
---

# SUMMARY — Phase 13-01: Tech Debt Cleanup

## Results

All 5 tasks completed. Requirements DEBT-01 through DEBT-05 satisfied.

### Task 1: Fix CREW-ASSESSMENT Tier Label Mismatches (DEBT-01)

Updated `.planning/CREW-ASSESSMENT.md` tier assignment table:
- Moved gsd-codebase-mapper: Explore → Modify (has Write, Edit tools)
- Moved gsd-ui-auditor: Explore → Modify (has Write, Edit tools)
- Moved gsd-research-synthesizer: Research → Modify (has Write, Edit — no WebSearch)
- Moved gsd-ui-checker: Modify → Explore (Read, Bash, Glob, Grep only)
- Moved gsd-validator-hub: Modify → Explore (Read, Bash, Glob, Grep only)

All 15 agents appear exactly once in correct tier.

### Task 2: Remove Absorbed Agent Entries (DEBT-02)

Deleted 5 dead entries from `get-shit-done/bin/lib/model-profiles.cjs`:
- gsd-phase-researcher (absorbed into gsd-research-orchestrator)
- gsd-project-researcher (absorbed into gsd-research-orchestrator)
- gsd-plan-checker (absorbed into gsd-verifier)
- gsd-integration-checker (absorbed into gsd-verifier)
- gsd-nyquist-auditor (absorbed into gsd-verifier)

MODEL_PROFILES now has exactly 10 entries.

### Task 3: Raise security.cjs Branch Coverage (DEBT-03)

Added 12 new tests to `tests/security.test.cjs`:
- requireSafePath label fallback (2 tests)
- sanitizeForDisplay null/undefined/empty (3 tests)
- validateShellArg non-string truthy (1 test)
- validateShellArg label fallback across error paths (6 tests)

**Result: security.cjs 92.68% → 100% branch coverage** (exceeds 95% target).

### Task 4: Wire gsd-validator-hub into /gsd:ship (DEBT-04)

Added `<step name="pre_pr_validation">` to `get-shit-done/workflows/ship.md`:
- Spawns gsd-validator-hub with target: ecosystem
- Read-only, advisory mode (does not block PR creation)
- Runs between PR body generation and PR creation steps
- FAIL results logged as "Known Issues" section; PASS/WARN noted in body

### Task 5: Add VALIDATION.md for Phases 7-10 (DEBT-05)

Created 4 retroactive validation records:
- `.planning/phases/07-security-critical-fixes/VALIDATION.md` (4 criteria)
- `.planning/phases/08-shell-output-hardening/VALIDATION.md` (5 criteria)
- `.planning/phases/09-test-coverage-expansion/VALIDATION.md` (4 criteria)
- `.planning/phases/10-config-migration/VALIDATION.md` (5 criteria)

All reconstructed from PLAN.md + SUMMARY.md artifacts.

## Acceptance Criteria

- [x] CREW-ASSESSMENT.md tier table matches all 15 agent files
- [x] MODEL_PROFILES has exactly 10 entries, no absorbed agent names
- [x] `node scripts/run-tests.cjs` passes (1756/1772, 16 pre-existing)
- [x] security.cjs branch coverage >= 95% (achieved 100%)
- [x] gsd-validator-hub referenced in `commands/gsd/ship.md` workflow
- [x] VALIDATION.md exists in phases 07, 08, 09, and 10

## Test Results

- 1772 total tests, 1756 pass, 16 pre-existing failures
- 12 new security tests added, all pass
- No regressions introduced

## Files Modified

| File | Change |
|------|--------|
| `.planning/CREW-ASSESSMENT.md` | 5 tier corrections |
| `get-shit-done/bin/lib/model-profiles.cjs` | Removed 5 dead entries |
| `tests/security.test.cjs` | 12 new tests |
| `get-shit-done/workflows/ship.md` | Pre-PR validation step |
| `.planning/phases/07-*/VALIDATION.md` | New retroactive validation |
| `.planning/phases/08-*/VALIDATION.md` | New retroactive validation |
| `.planning/phases/09-*/VALIDATION.md` | New retroactive validation |
| `.planning/phases/10-*/VALIDATION.md` | New retroactive validation |

## Commit

`81f33d5` — committed alongside Phase 12 changes
