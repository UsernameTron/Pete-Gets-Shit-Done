# Roadmap: get-shit-done-cc

## Completed Milestones

- **v1.0 Post-Merge Cleanup** (2026-03-25 -> 2026-03-26) -- 1 phase, 3 requirements. [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Testing & Hardening** (2026-03-26) -- 4 phases, 13 requirements. [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Agent Quality & Consolidation** (2026-04-03 -> 2026-04-04) -- 1 phase, 7 requirements. [Archive](milestones/v1.2-ROADMAP.md)
- **v1.3 Security Hardening & Coverage** (2026-04-04) -- 4 phases, 6 requirements. [Archive](milestones/v1.3-ROADMAP.md)

## Current Milestone: v1.4 Correctness & Robustness

**Goal:** Replace silent failures with structured error handling, freeze shared state at module boundaries, resolve carried tech debt, and add timeout guards.

**14 requirements** | **4 phases** (11-14)

### Phase 11: Error Handling & Silent Failure Elimination

**Goal:** Replace silent catch blocks with structured error handling. Create GsdError class.

**Requirements:** CORR-01, CORR-02, CORR-03

**Success Criteria:**
1. GsdError class exists in core.cjs with code, context, and cause fields
2. Every catch block across lib modules is documented as intentionally silent, logs warning, or propagates GsdError
3. loadConfig() empty catches log diagnostics via output() at debug level
4. Unit tests cover GsdError construction, error code enum, and loadConfig() failure paths

**Key Files:** core.cjs, state.cjs, phase.cjs, commands.cjs

**Plans:** 3 plans

Plans:
- [x] 11-PLAN-01 — GsdError class and error code registry (Wave 1)
- [x] 11-PLAN-02 — loadConfig() and core.cjs catch block remediation (Wave 2)
- [x] 11-PLAN-03 — Catch block audit across remaining lib modules (Wave 2)

**Status: COMPLETE** (2026-04-04)

---

### Phase 12: State Immutability & Defensive Copies

**Goal:** Freeze module-boundary return objects. Prevent downstream mutation of shared state.

**Requirements:** CORR-04, CORR-05, CORR-06

**Success Criteria:**
1. deepFreeze() utility exists in core.cjs with recursive freeze for plain objects and arrays
2. loadConfig() return value is frozen (Object.isFrozen() assertion passes)
3. State accessor returns are frozen at module boundaries
4. .push() patterns in state.cjs confirmed safe (local array building, documented)

**Key Files:** core.cjs, state.cjs, config.cjs

**Note:** Can run in parallel with Phase 13.

Plans:
- [x] 12-PLAN-01 — deepFreeze utility + module boundary freezing (Wave 1-2)

**Status: COMPLETE** (2026-04-04)

---

### Phase 13: Tech Debt Cleanup

**Goal:** Resolve carried tech debt items from v1.2 and v1.3 audits.

**Requirements:** DEBT-01, DEBT-02, DEBT-03, DEBT-04, DEBT-05

**Success Criteria:**
1. CREW-ASSESSMENT tier labels match actual tool grants (5 fixes)
2. MODEL_PROFILES contains no entries for absorbed agents
3. security.cjs branch coverage >= 95%
4. gsd-validator-hub wired into at least one workflow entry point
5. VALIDATION.md files exist for v1.3 phases 7-10

**Key Files:** model-profiles.cjs, security.cjs, agent definitions, docs

**Note:** Can run in parallel with Phase 12.

Plans:
- [x] 13-01-PLAN — Tier Labels, Dead Profiles, Coverage, Validator Wiring, Validation Gaps

**Status: COMPLETE** (2026-04-04)

---

### Phase 14: Timeout Guards & Graceful Degradation

**Goal:** Add configurable timeouts and graceful degradation to synchronous operations.

**Requirements:** CORR-07, CORR-08, CORR-09

**Success Criteria:**
1. Safe execution wrapper exists in core.cjs returning {ok, stdout, stderr, timedOut}
2. execGit() uses safe wrapper with configurable timeout
3. withPlanningLock() force-acquire logs diagnostic message with stale lock details
4. Unit tests cover success, failure, timeout, and force-acquire logging paths

**Key Files:** core.cjs, state.cjs, commands.cjs

Plans:
- [x] 14-PLAN-01 — safeExec wrapper, execGit refactor, lock diagnostics (Wave 1)

**Status: COMPLETE** (2026-04-04)

---

### Phase Dependencies

```
Phase 11 (Error Handling) -----+---> Phase 14 (Timeout Guards)
                                |
Phase 12 (Immutability) -------+
          ||                    |
          || parallel           |
          ||                    |
Phase 13 (Tech Debt) ----------+
```

Phase 11 first (GsdError class needed by later phases). Phases 12 and 13 in parallel. Phase 14 after all three.

---
*Last updated: 2026-04-04 -- v1.4 Phase 14 COMPLETE, all phases done*
