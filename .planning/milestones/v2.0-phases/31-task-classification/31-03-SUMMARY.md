---
phase: 31
plan: 3
title: "Init Command Wiring — classifyTask Integration"
status: complete
requirements_covered: ["INTEL-10", "INTEL-12"]
tests_added: 13
tests_total: 2005
---

# SUMMARY — Phase 31.3: Init Command Wiring — classifyTask Integration

## What Was Built

Wired `classifyTask()` into both init commands in `get-shit-done/bin/lib/init.cjs`:

1. **cmdInitExecutePhase** — After taskContext computation, before result object. Lazy `require('./classify.cjs')` inside `config.adaptive` branch. Passes phaseInfo, planInventory (plans array), and context with reqIds and null failureRate. Adds `task_classification` to result object.

2. **cmdInitPlanPhase** — Same pattern but passes `null` for planInventory (plans don't exist yet during planning). Adds `task_classification` to result object.

Both commands produce `task_classification: null` when `config.adaptive` is false (default), preserving byte-identical output to pre-Phase-31 behavior.

## Design Decisions

- **Lazy require**: classify.cjs is only loaded when adaptive is true, avoiding overhead for the default static path. Mirrors the Phase 30 pattern where model-profiles.cjs is lazy-required inside the dynamic routing branch.
- **Null planInventory for plan-phase**: Plan-phase creates plans, so no inventory exists yet. classifyTask handles this gracefully (plan_count: 0, confidence reflects missing data).

## Tests

13 new tests in `tests/init.test.cjs`:
- Execute-phase (7 tests): adaptive false/missing yields null, adaptive true returns classification with correct shape, valid complexity level, plan_count/requirement_count signals, confidence in [0,1]
- Plan-phase (6 tests): adaptive false yields null, adaptive true returns classification with correct shape, plan_count is 0, more requirements yield higher/equal complexity, confidence in [0,1]

## Requirements

- **INTEL-10**: classifyTask wired into both init commands — Complete
- **INTEL-12**: task_classification in init output JSON for workflow prompt reference — Complete
