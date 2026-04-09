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
- **v2.0 Intelligence Layer** (2026-04-05) -- 4 phases, 23 requirements. [Archive](milestones/v2.0-ROADMAP.md)

## v2.1 System Audit & Debt Closure

**Milestone Goal:** Close all remaining tech debt from v1.2, verify v1.4 fixes landed correctly, and conduct a comprehensive system-level audit of the full v1.0-v2.0 feature surface.

## Phases

- [ ] **Phase 34: Debt Closure** - Backfill missing SUMMARYs, update stale agent references, create missing VALIDATION.md
- [ ] **Phase 35: Confirmation Audit** - Verify v1.4 DEBT-01/DEBT-04 fixes resolved INT-01/INT-02
- [ ] **Phase 36: System Component Audit** - Validate all agents, commands, and hooks are correctly configured
- [ ] **Phase 37: Test & Coverage Verification** - Full test suite passes with all coverage thresholds met
- [ ] **Phase 38: Documentation Accuracy** - CLAUDE.md, README.md, DEVOPS-HANDOFF.md reflect current state

## Phase Details

### Phase 34: Debt Closure
**Goal**: All known v1.2 tech debt items are resolved with proper documentation artifacts in place
**Depends on**: Nothing (first phase)
**Requirements**: DEBT-06, DEBT-07, DEBT-08
**Success Criteria** (what must be TRUE):
  1. Phase 6 plans 02, 03, 04 each have a SUMMARY.md capturing what was built and verified
  2. Global CLAUDE.md files (project and user) reference gsd-verifier instead of deprecated gsd-plan-checker and gsd-integration-checker
  3. A Nyquist VALIDATION.md exists for Phase 6 (v1.2 milestone) documenting gap analysis results
**Plans**: TBD

### Phase 35: Confirmation Audit
**Goal**: Prior fixes from v1.4 are confirmed as fully resolved with no regressions
**Depends on**: Phase 34
**Requirements**: AUDIT-01, AUDIT-02
**Success Criteria** (what must be TRUE):
  1. Every one of the 15 source agents has a tier label that matches its actual tool grants (no mismatches)
  2. gsd-validator-hub is reachable through at least one workflow routing path and responds correctly when invoked
  3. An audit report documents the verification of both INT-01 and INT-02 with pass/fail evidence
**Plans**: TBD

### Phase 36: System Component Audit
**Goal**: All system components (agents, commands, hooks) are verified as correctly configured and functional
**Depends on**: Phase 35
**Requirements**: AUDIT-03, AUDIT-04, AUDIT-05
**Success Criteria** (what must be TRUE):
  1. All 15 source agents pass YAML validation, have correct tool grants for their tier, and include quality sections
  2. All 61 GSD commands are reachable via skill routing with no orphaned or dead-end commands
  3. All configured hooks fire on their intended events with correct matchers (verified by trigger test)
  4. Zero agents reference absorbed/archived agents that no longer exist
**Plans**: TBD

### Phase 37: Test & Coverage Verification
**Goal**: The full test suite is green and all coverage thresholds are met
**Depends on**: Phase 36
**Requirements**: AUDIT-06
**Success Criteria** (what must be TRUE):
  1. Full test suite (2069+ tests) passes with zero failures
  2. Overall coverage is at or above 90%
  3. No individual module falls below 80% coverage
  4. Security-critical modules (security.cjs, input validation paths) are at or above 95% coverage
**Plans**: TBD

### Phase 38: Documentation Accuracy
**Goal**: All project documentation accurately reflects the current v2.0 state of the system
**Depends on**: Phase 37
**Requirements**: AUDIT-07
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md (project) accurately lists current agent count, command count, test count, and coverage numbers
  2. README.md reflects current features, installation instructions, and project status
  3. DEVOPS-HANDOFF.md has correct environment requirements, configuration reference, and deployment notes
  4. No documentation references deprecated agents, removed commands, or stale version numbers
**Plans**: TBD

## Progress

**Execution Order:** 34 -> 35 -> 36 -> 37 -> 38

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 34. Debt Closure | v2.1 | 0/0 | Not started | - |
| 35. Confirmation Audit | v2.1 | 0/0 | Not started | - |
| 36. System Component Audit | v2.1 | 0/0 | Not started | - |
| 37. Test & Coverage Verification | v2.1 | 0/0 | Not started | - |
| 38. Documentation Accuracy | v2.1 | 0/0 | Not started | - |

---
*Last updated: 2026-04-09 -- v2.1 roadmap created*
