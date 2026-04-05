# Roadmap: get-shit-done-cc

## Completed Milestones

- **v1.0 Post-Merge Cleanup** (2026-03-25 -> 2026-03-26) -- 1 phase, 3 requirements. [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Testing & Hardening** (2026-03-26) -- 4 phases, 13 requirements. [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Agent Quality & Consolidation** (2026-04-03 -> 2026-04-04) -- 1 phase, 7 requirements. [Archive](milestones/v1.2-ROADMAP.md)
- **v1.3 Security Hardening & Coverage** (2026-04-04) -- 4 phases, 6 requirements. [Archive](milestones/v1.3-ROADMAP.md)
- **v1.4 Correctness & Robustness** (2026-04-04) -- 4 phases, 14 requirements. [Archive](milestones/v1.4-ROADMAP.md)
- **v1.5 Performance** (2026-04-04) -- 3 phases, 6 requirements. [Archive](milestones/v1.5-ROADMAP.md)
- **v1.6 Maintainability** (2026-04-04) -- 4 phases, 12 requirements. [Archive](milestones/v1.6-ROADMAP.md)
- **v1.7 End-to-End Integration Testing** (2026-04-04) -- 4 phases, 13 requirements. [Archive](milestones/v1.7-ROADMAP.md)
- **v1.8 Documentation & Accuracy** (2026-04-05) -- 2 phases, 7 requirements. [Archive](milestones/v1.8-ROADMAP.md)
- **v1.9 Ship Readiness & Hygiene** (2026-04-05) -- 2 phases, 5 requirements. [Archive](milestones/v1.9-ROADMAP.md)

## Current Milestone: v2.0 Intelligence Layer

**Goal:** Make the GSD engine smarter — route models by task complexity, learn from execution history, adapt workflow behavior automatically.

**Constraints:** Zero-dependency CommonJS. File-based storage only. All new parameters optional. All new config keys have safe defaults.

### Phase 30 — Dynamic Model Selection

**Requirements:** INTEL-01 through INTEL-06
**Risk:** Low. Extends existing function with optional parameter. All tests pass unchanged.
**Approach:** Add `dynamicSelect()` as a pure function, gate behind `routing_strategy` config. Wire through init commands. Ship with `static` default.

**Files:** model-profiles.cjs, core.cjs, init.cjs, config.cjs

### Phase 31 — Task Classification & Adaptive Workflows

**Requirements:** INTEL-07 through INTEL-12
**Risk:** Medium. New module, new classification logic, workflow gate adaptation.
**Approach:** Build `classify.cjs` as standalone module with no external deps. Classification is deterministic (rule-based from plan/phase metadata). Wire into init output. Gate behind `workflow.adaptive`.

**Files:** classify.cjs (NEW), init.cjs, config.cjs, core.cjs

### Phase 32 — Execution History & Pattern Learning

**Requirements:** INTEL-13 through INTEL-18
**Risk:** Medium. File I/O for JSONL, rotation logic, pattern detection heuristics.
**Approach:** Build `history.cjs` as standalone module. JSONL is append-only. Pattern detection is read-only aggregation. Wire into execute-phase completion. Add CLI commands.

**Files:** history.cjs (NEW), model-profiles.cjs, gsd-tools.cjs, init.cjs

### Phase 33 — Integration, Testing & Documentation

**Requirements:** INTEL-19 through INTEL-23
**Risk:** Low. No new features — testing, coverage, docs, migration.
**Approach:** E2E test using existing harness. Config migration v1->v2. Doc updates across all living documents.

**Files:** test/ (new test files), core.cjs (migration), docs/, references/, README.md
**Plans:** 3 plans

Plans:
- [ ] 33-01-PLAN.md — E2E intelligence pipeline test + performance benchmark + coverage gate
- [ ] 33-02-PLAN.md — Config migration v1 -> v2 (routing_strategy, adaptive defaults)
- [ ] 33-03-PLAN.md — Documentation updates (model-profiles, config, user guide, devops, README)

---
*Last updated: 2026-04-05 -- Phase 33 planned, 3 plans in wave 1*
