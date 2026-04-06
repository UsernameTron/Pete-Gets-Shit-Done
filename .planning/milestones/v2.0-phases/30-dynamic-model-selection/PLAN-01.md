---
phase: 30
plan: 1
title: "Dynamic Model Selection Core — dynamicSelect() and MODEL_TIERS"
requirements: ["INTEL-02", "INTEL-03"]
complexity: low
created: "2026-04-05"
depends_on: []
---

# PLAN — Phase 30.1: Dynamic Model Selection Core

**Phase goal:** Create the `dynamicSelect()` pure function and `MODEL_TIERS` constant in model-profiles.cjs — the foundation all other Phase 30 work builds on.

**Requirements:** INTEL-02, INTEL-03
**Complexity:** Low — pure function, no side effects, no callers yet
**Target file:** `get-shit-done/bin/lib/model-profiles.cjs`

---

## Tasks

### Task 1: Define MODEL_TIERS constant

**Files:**
- `get-shit-done/bin/lib/model-profiles.cjs` (modify)

**Actions:**
1. Add a `MODEL_TIERS` frozen object mapping complexity levels to tier names:
   ```javascript
   const MODEL_TIERS = Object.freeze({
     trivial: 'budget',
     standard: 'balanced',
     complex: 'quality',
     critical: 'quality',
   });
   ```
2. Place it above the lazy `MODEL_PROFILES` initialization (near top of file, after `'use strict'` and existing constants).
3. Export `MODEL_TIERS` alongside existing exports.

**Design notes:**
- `critical` maps to `quality` same as `complex` — the difference is logging behavior handled in PLAN-02 (INTEL-06).
- Frozen to match the existing immutability convention (core.cjs deepFreeze pattern from CORR-04/CORR-05).
- Tier names (`budget`, `balanced`, `quality`) match existing MODEL_PROFILES keys exactly.

**Acceptance criteria:**
- [ ] `MODEL_TIERS` is exported and frozen
- [ ] All 4 complexity levels (trivial, standard, complex, critical) map to valid profile keys
- [ ] Existing exports and lazy init are unchanged

### Task 2: Create dynamicSelect() function (INTEL-02, INTEL-03)

**Files:**
- `get-shit-done/bin/lib/model-profiles.cjs` (modify)

**Actions:**
1. Add `dynamicSelect(agentType, taskContext, config)` function:
   ```javascript
   /**
    * Select model tier based on task complexity signals.
    * @param {string} agentType - Agent name (e.g., 'gsd-executor')
    * @param {Object} taskContext - { complexity, signals, phase_name }
    * @param {Object} config - Loaded config object
    * @returns {{ alias: string, tier: string, rationale: string }}
    */
   function dynamicSelect(agentType, taskContext, config) {
     // 1. Determine target tier from complexity
     const complexity = taskContext?.complexity || 'standard';
     const targetTier = MODEL_TIERS[complexity] || 'balanced';

     // 2. Look up agent in profiles
     const agentModels = MODEL_PROFILES[agentType];
     if (!agentModels) {
       return { alias: 'sonnet', tier: 'balanced', rationale: 'unknown agent — default sonnet' };
     }

     // 3. Profile-bounded adjustment:
     //    - quality profile: never downgrade (always use quality tier alias)
     //    - budget profile: cap at balanced (never promote to quality)
     //    - balanced profile: free to move within full range
     const currentProfile = String(config.model_profile || 'balanced').toLowerCase();
     let effectiveTier = targetTier;

     if (currentProfile === 'quality') {
       effectiveTier = 'quality'; // quality users never get downgraded
     } else if (currentProfile === 'budget' && targetTier === 'quality') {
       effectiveTier = 'balanced'; // budget users cap at balanced
     }

     const alias = agentModels[effectiveTier] || agentModels['balanced'] || 'sonnet';

     const rationale = `complexity=${complexity} targetTier=${targetTier} effectiveTier=${effectiveTier} profile=${currentProfile}`;
     return { alias, tier: effectiveTier, rationale };
   }
   ```
2. Export `dynamicSelect` in the `module.exports` block.

**Design notes:**
- Pure function: no I/O, no side effects, no config loading — caller provides everything.
- Profile-bounded: respects user's `model_profile` as a floor/ceiling. A `quality` user paid for quality and should never be silently downgraded. A `budget` user set budget intentionally and shouldn't get surprise quality-tier bills.
- Returns `rationale` string for debug logging (consumed in PLAN-02, INTEL-06).
- Falls back to `'sonnet'` for unknown agents, matching existing `resolveModelInternal` behavior.
- `taskContext.complexity` is the only required signal for Phase 30. Phase 31 (classify.cjs) will generate richer taskContext objects.

**Acceptance criteria:**
- [ ] `dynamicSelect('gsd-executor', { complexity: 'trivial' }, { model_profile: 'balanced' })` returns `{ alias: 'sonnet', tier: 'budget', rationale: '...' }`
- [ ] `dynamicSelect('gsd-planner', { complexity: 'complex' }, { model_profile: 'balanced' })` returns `{ alias: 'opus', tier: 'quality', rationale: '...' }`
- [ ] `dynamicSelect('gsd-executor', { complexity: 'complex' }, { model_profile: 'budget' })` caps at balanced tier
- [ ] `dynamicSelect('gsd-executor', { complexity: 'trivial' }, { model_profile: 'quality' })` stays at quality tier
- [ ] `dynamicSelect('unknown-agent', ...)` returns `{ alias: 'sonnet', tier: 'balanced', ... }`
- [ ] Null/undefined taskContext falls back to `'standard'` complexity
- [ ] Function is exported and callable from core.cjs

### Task 3: Unit tests for MODEL_TIERS and dynamicSelect()

**Files:**
- `tests/model-profiles.test.cjs` (modify)

**Actions:**
1. Add test group `'MODEL_TIERS'`:
   - Verify all 4 keys present (trivial, standard, complex, critical)
   - Verify values are valid profile names (budget, balanced, quality)
   - Verify object is frozen
2. Add test group `'dynamicSelect()'`:
   - Test all 4 complexity levels with balanced profile
   - Test profile-bounded behavior: quality profile never downgrades
   - Test profile-bounded behavior: budget profile caps at balanced
   - Test unknown agent fallback returns sonnet
   - Test null/undefined taskContext defaults to standard
   - Test missing complexity field defaults to standard
   - Test return shape: `{ alias, tier, rationale }` with correct types
   - Test critical complexity maps to quality tier (same as complex)
3. Verify all existing model-profiles tests still pass.

**Acceptance criteria:**
- [ ] >= 12 new test cases covering dynamicSelect behavior
- [ ] MODEL_TIERS freeze verification test
- [ ] All existing model-profiles tests pass unchanged
- [ ] `npm test` full suite passes

---

## Verification

After implementation:
1. `npm test` — full suite passes (2046+ tests)
2. `node -e "const mp = require('./get-shit-done/bin/lib/model-profiles.cjs'); console.log(mp.MODEL_TIERS); console.log(mp.dynamicSelect('gsd-executor', { complexity: 'complex' }, { model_profile: 'balanced' }))"` — returns expected output
3. No existing imports or consumers break (dynamicSelect is additive, not wired yet)
