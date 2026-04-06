---
phase: 30-dynamic-model-selection
plan: 01
subsystem: model-routing
tags: [model-selection, complexity-tiers, dynamic-routing, model-profiles]

requires:
  - phase: none
    provides: model-profiles.cjs existing lazy-init architecture
provides:
  - MODEL_TIERS constant mapping complexity levels to profile tiers
  - dynamicSelect() pure function for complexity-based model selection
  - 17 unit tests covering all selection behaviors
affects: [phase-30-plan-02, phase-30-plan-03, phase-31, phase-32]

tech-stack:
  added: []
  patterns: [profile-bounded-selection, complexity-to-tier-mapping]

key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/model-profiles.cjs
    - tests/model-profiles.test.cjs

key-decisions:
  - "Use _modelProfiles (internal) not MODEL_PROFILES (getter) inside dynamicSelect() to avoid going through the lazy-init getter after calling _initialize() directly"
  - "Profile-bounded adjustment: quality profile never downgrades, budget profile caps at balanced — respects user intent on cost vs quality"
  - "MODEL_TIERS frozen with Object.freeze to match existing immutability conventions"
  - "Unknown agents fall back to sonnet/balanced — matches existing resolveModelInternal behavior"

patterns-established:
  - "Complexity-to-tier mapping: trivial->budget, standard->balanced, complex->quality, critical->quality"
  - "Profile-bounded selection: user profile acts as floor (quality) or ceiling (budget) on dynamic tier selection"

requirements-completed: [INTEL-02, INTEL-03]

duration: 2min
completed: 2026-04-05
---

# Phase 30 Plan 1: Dynamic Model Selection Core Summary

**MODEL_TIERS constant and dynamicSelect() pure function for complexity-based model routing with profile-bounded tier selection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T21:23:35Z
- **Completed:** 2026-04-05T21:26:02Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Added MODEL_TIERS frozen constant mapping 4 complexity levels (trivial, standard, complex, critical) to profile tiers (budget, balanced, quality)
- Implemented dynamicSelect() pure function with profile-bounded tier adjustment logic
- Added 17 unit tests covering all complexity levels, profile bounds, unknown agents, null/undefined inputs, and return shape validation
- All 1930 tests pass with zero failures

## Task Commits

All three tasks committed atomically as a single logical unit (constant + function + tests are interdependent):

1. **Tasks 1-3: MODEL_TIERS, dynamicSelect(), and unit tests** - `294570d` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/model-profiles.cjs` - Added MODEL_TIERS constant, dynamicSelect() function, and updated exports
- `tests/model-profiles.test.cjs` - Added 17 new test cases in two describe blocks (MODEL_TIERS, dynamicSelect)

## Decisions Made
- **Internal variable access:** dynamicSelect() calls _initialize() then uses _modelProfiles directly instead of going through the MODEL_PROFILES getter. This avoids redundant getter overhead since we already triggered lazy init.
- **Profile bounding logic:** Quality profile users never get downgraded (they paid for quality). Budget profile users cap at balanced (prevent surprise quality-tier costs). Balanced profile users get full dynamic range. This respects user intent while allowing complexity-based routing.
- **Single commit for all 3 tasks:** MODEL_TIERS, dynamicSelect(), and tests form a single logical unit — the constant is meaningless without the function, and the function is unverifiable without tests.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functionality is fully wired and tested.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- dynamicSelect() is ready to be consumed by PLAN-02 (config wiring, routing_strategy, init command integration)
- MODEL_TIERS provides the complexity vocabulary for PLAN-03 (debug logging, cost awareness)
- No blockers for subsequent plans

## Self-Check: PASSED

- [x] model-profiles.cjs exists and exports MODEL_TIERS + dynamicSelect
- [x] model-profiles.test.cjs exists with 17 new tests
- [x] 30-01-SUMMARY.md created
- [x] Commit 294570d verified in git log
- [x] All 1930 tests pass

---
*Phase: 30-dynamic-model-selection*
*Completed: 2026-04-05*
