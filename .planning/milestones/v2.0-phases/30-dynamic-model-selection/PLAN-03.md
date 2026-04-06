---
phase: 30
plan: 3
title: "Init Command Wiring — taskContext Signal Extraction"
requirements: ["INTEL-05"]
complexity: medium
created: "2026-04-05"
depends_on: [1, 2]
---

# PLAN — Phase 30.3: Init Command Wiring — taskContext Signal Extraction

**Phase goal:** Wire `taskContext` through the two primary init commands (`cmdInitExecutePhase` and `cmdInitPlanPhase`) by extracting complexity signals from phase info, plan inventory, and roadmap requirements.

**Requirements:** INTEL-05
**Complexity:** Medium — touches 2 high-traffic init functions with multiple resolveModelInternal callsites each
**Target file:** `get-shit-done/bin/lib/init.cjs`

---

## Tasks

### Task 1: Create buildTaskContext() helper function

**Files:**
- `get-shit-done/bin/lib/init.cjs` (modify)

**Actions:**
1. Add a local helper function `buildTaskContext(phaseInfo, planInventory, config)` near the top of init.cjs (after imports, before init command functions):
   ```javascript
   /**
    * Extract task complexity signals from phase and plan metadata.
    * Returns a taskContext object for resolveModelInternal().
    * @param {Object} phaseInfo - Phase metadata (name, requirements, type)
    * @param {Array|null} planInventory - PLAN.md files found in phase directory
    * @param {Object} config - Loaded config
    * @returns {Object|undefined} taskContext or undefined if routing_strategy is static
    */
   function buildTaskContext(phaseInfo, planInventory, config) {
     const strategy = config.routing_strategy || 'static';
     if (strategy === 'static') return undefined; // Early exit — no signals needed

     const planCount = Array.isArray(planInventory) ? planInventory.length : 0;
     const reqCount = Array.isArray(phaseInfo?.requirements) ? phaseInfo.requirements.length : 0;
     const phaseName = phaseInfo?.name || '';

     // Complexity heuristic (Phase 30 — simple rule-based):
     //   trivial: 0-1 plans AND 0-2 requirements
     //   standard: 2-3 plans OR 3-5 requirements
     //   complex: 4+ plans OR 6+ requirements
     //   critical: 7+ plans AND 8+ requirements
     let complexity = 'standard';
     if (planCount >= 7 && reqCount >= 8) {
       complexity = 'critical';
     } else if (planCount >= 4 || reqCount >= 6) {
       complexity = 'complex';
     } else if (planCount <= 1 && reqCount <= 2) {
       complexity = 'trivial';
     }

     return {
       complexity,
       signals: { plan_count: planCount, requirement_count: reqCount, phase_name: phaseName },
       phase_name: phaseName,
     };
   }
   ```

**Design notes:**
- Returns `undefined` when `routing_strategy: 'static'` — this causes `resolveModelInternal()` to take the v1.9 code path with zero overhead.
- Heuristic is deliberately simple for Phase 30. Phase 31 builds the full `classifyTask()` with confidence scoring — this is the bootstrap version.
- Signal extraction is read-only — it reads metadata that's already loaded by the init command, no new file I/O.
- `planInventory` can be null/undefined for init commands that don't have plan data (handled with fallback to 0).

**Acceptance criteria:**
- [ ] Returns `undefined` when `routing_strategy: 'static'`
- [ ] Returns `{ complexity: 'trivial', ... }` for 1 plan, 1 requirement
- [ ] Returns `{ complexity: 'standard', ... }` for 2 plans, 4 requirements
- [ ] Returns `{ complexity: 'complex', ... }` for 5 plans, 3 requirements
- [ ] Returns `{ complexity: 'critical', ... }` for 8 plans, 10 requirements
- [ ] Handles null/undefined phaseInfo and planInventory gracefully

### Task 2: Wire taskContext into cmdInitExecutePhase() (INTEL-05)

**Files:**
- `get-shit-done/bin/lib/init.cjs` (modify)

**Actions:**
1. Locate the two `resolveModelInternal()` calls in `cmdInitExecutePhase()` (lines ~81-82):
   ```javascript
   // Current:
   executor_model: resolveModelInternal(cwd, 'gsd-executor'),
   verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),
   ```
2. Extract phase info and plan inventory from the data already available in the function scope (phase number, plan files discovered during init).
3. Build taskContext and pass it:
   ```javascript
   const taskContext = buildTaskContext(
     { name: phaseName, requirements: phaseRequirements },
     planFiles,
     config
   );
   // ...
   executor_model: resolveModelInternal(cwd, 'gsd-executor', taskContext),
   verifier_model: resolveModelInternal(cwd, 'gsd-verifier', taskContext),
   ```
4. Identify which local variables hold phase name, requirements array, and plan file list. Map these to the `buildTaskContext()` parameters. If any aren't directly available, extract from the state/phase data that's already read.

**Design notes:**
- `cmdInitExecutePhase()` already reads phase metadata and discovers plan files — we're reusing that data, not adding new reads.
- Both the executor and verifier get the same taskContext. This is correct — they're working on the same phase, so complexity is the same. The model tier will differ because their MODEL_PROFILES entries differ.

**Acceptance criteria:**
- [ ] `cmdInitExecutePhase()` passes taskContext to both resolveModelInternal calls
- [ ] When `routing_strategy: 'static'`, taskContext is `undefined` and behavior is unchanged
- [ ] When `routing_strategy: 'dynamic'`, output JSON contains dynamically-selected model aliases
- [ ] No new file reads or I/O added — reuses existing function-scoped data

### Task 3: Wire taskContext into cmdInitPlanPhase() (INTEL-05)

**Files:**
- `get-shit-done/bin/lib/init.cjs` (modify)

**Actions:**
1. Locate the three `resolveModelInternal()` calls in `cmdInitPlanPhase()` (lines ~174-176):
   ```javascript
   // Current:
   researcher_model: resolveModelInternal(cwd, 'gsd-research-orchestrator'),
   planner_model: resolveModelInternal(cwd, 'gsd-planner'),
   checker_model: resolveModelInternal(cwd, 'gsd-verifier'),
   ```
2. Build taskContext from available phase metadata:
   ```javascript
   const taskContext = buildTaskContext(
     { name: phaseName, requirements: phaseRequirements },
     null, // plan-phase is creating plans, so no planInventory yet
     config
   );
   // ...
   researcher_model: resolveModelInternal(cwd, 'gsd-research-orchestrator', taskContext),
   planner_model: resolveModelInternal(cwd, 'gsd-planner', taskContext),
   checker_model: resolveModelInternal(cwd, 'gsd-verifier', taskContext),
   ```
3. `planInventory` is `null` because plan-phase is creating plans — they don't exist yet. The heuristic will classify based on requirement count only.

**Design notes:**
- Planning phase has no plans yet (it's creating them), so complexity is driven by requirement count and phase name only. This naturally biases toward higher-quality models for planning — which is the correct behavior.
- All three agents get the same taskContext.

**Acceptance criteria:**
- [ ] `cmdInitPlanPhase()` passes taskContext to all 3 resolveModelInternal calls
- [ ] planInventory is null, complexity based on requirement count only
- [ ] When `routing_strategy: 'static'`, behavior unchanged
- [ ] When `routing_strategy: 'dynamic'`, output JSON contains dynamically-selected model aliases

### Task 4: Unit tests for buildTaskContext() and init wiring

**Files:**
- `tests/init.test.cjs` (modify)

**Actions:**
1. Add test group `'buildTaskContext()'`:
   - Returns undefined when routing_strategy is 'static'
   - Returns trivial for 1 plan, 1 requirement
   - Returns standard for 2 plans, 4 requirements
   - Returns complex for 5 plans, 3 requirements
   - Returns critical for 8 plans, 10 requirements
   - Handles null phaseInfo gracefully
   - Handles null planInventory gracefully
   - Returns object with correct shape: `{ complexity, signals, phase_name }`
2. Add test group `'cmdInitExecutePhase — dynamic routing'`:
   - With routing_strategy 'static': output contains standard model aliases (v1.9 behavior)
   - With routing_strategy 'dynamic': output contains dynamically-selected aliases
3. Add test group `'cmdInitPlanPhase — dynamic routing'`:
   - With routing_strategy 'static': output contains standard model aliases
   - With routing_strategy 'dynamic': output contains dynamically-selected aliases
   - planInventory is null — complexity driven by requirement count

**Design notes:**
- Init command tests may need mock config setup — follow existing patterns in init.test.cjs for mocking loadConfig responses.
- Focus on verifying the wiring (taskContext flows through), not re-testing dynamicSelect behavior (covered in PLAN-01 tests).

**Acceptance criteria:**
- [ ] >= 8 new test cases for buildTaskContext
- [ ] >= 4 new test cases for init command wiring
- [ ] All existing init.test.cjs tests pass unchanged
- [ ] `npm test` full suite passes

---

## Verification

After implementation:
1. `npm test` — full suite passes (2046+ tests, plus all new Phase 30 tests)
2. Integration verification:
   ```bash
   node -e "
     const { cmdInitExecutePhase } = require('./get-shit-done/bin/lib/init.cjs');
     // Would need a .planning/ structure with config routing_strategy: 'dynamic'
     // Verify output JSON contains model aliases consistent with dynamic routing
   "
   ```
3. Backward compatibility: run existing E2E tests — all pass unchanged (they don't set routing_strategy, so they get 'static' default).
4. No new file I/O: init commands reuse existing data, no additional reads added.

---

## Phase 30 Summary

| Plan | Requirements | Dependency | Wave |
|------|-------------|------------|------|
| PLAN-01 | INTEL-02, INTEL-03 | None | 1 |
| PLAN-02 | INTEL-01, INTEL-04, INTEL-06 | PLAN-01 | 2 |
| PLAN-03 | INTEL-05 | PLAN-01, PLAN-02 | 3 |

**Total requirements covered:** INTEL-01 through INTEL-06 (all Phase 30 requirements)
**Execution strategy:** Sequential waves — each plan builds on the prior
**Risk:** Low. All changes are gated behind `routing_strategy: 'static'` default. Existing behavior is preserved byte-for-byte when the feature flag is not enabled.
