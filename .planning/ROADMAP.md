# Roadmap: get-shit-done-cc

## Current Milestone: v2.4 Foundation Hardening

**Goal:** Close 7 structural drift items identified by the 2026-04-16 foundation health audit — no new features, only hardening.
**Started:** 2026-04-16
**Phases:** 2 (45-46)
**Requirements:** 7 (PLUG-01, SECPAT-01, HOOK-04, DOC-01, COV-01, LINK-01, REF-01)

## Phases

- [ ] **Phase 45: Critical Fixes** — Resolve the 3 highest-risk structural issues: orphaned plugin cache, diverged injection patterns, dead version tracking
- [ ] **Phase 46: Housekeeping** — Close the 4 remaining WARN items: documentation counts, branch coverage gaps, command/workflow convention drift, hardcoded portability issue

## Phase Details

### Phase 45: Critical Fixes
**Goal**: The three highest-risk structural gaps from the foundation audit are closed and the codebase is structurally sound
**Depends on**: Nothing (first phase of milestone)
**Requirements**: PLUG-01, SECPAT-01, HOOK-04
**Success Criteria** (what must be TRUE):
  1. `local-plugin-marketplace/marketplace.json` registers claude-code-factory and install resolves to the live source rather than the frozen orphaned cache
  2. A single canonical injection pattern source exists; gsd-prompt-guard.js and lib/security.cjs each draw from it (or a build-time copy of it), and the combined pattern set is a strict superset of both prior sets
  3. `{{GSD_VERSION}}` either resolves to the actual package version string in every built hook file, or is entirely absent from all 7 hook files and the dead-code branch in gsd-check-update.js is removed
  4. All existing tests continue to pass after the changes
**Plans**: TBD

### Phase 46: Housekeeping
**Goal**: All four remaining WARN items from the foundation audit are resolved and the codebase matches its documentation
**Depends on**: Phase 45
**Requirements**: DOC-01, COV-01, LINK-01, REF-01
**Success Criteria** (what must be TRUE):
  1. README.md and CLAUDE.md correctly state 18 agents and 63 commands; gsd-dependency-auditor, gsd-ecosystem-auditor, audit-agents, and audit-deps are each present in the relevant documentation sections
  2. workstream.cjs branch coverage is >=80% and build-hooks.js branch coverage is >=80% as reported by `npm run test:coverage`
  3. Every command file either has a corresponding workflow file or carries an inline exemption comment; every workflow file is referenced by at least one command; the convention is documented
  4. crew.md resolves the agents directory via a relative or dynamically constructed path that does not contain `Pete-Gets-Shit-Done`
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 45. Critical Fixes | 1/3 | In Progress|  |
| 46. Housekeeping | 0/? | Not started | - |

---

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
- **v2.1 System Audit & Debt Closure** (2026-04-09 -> 2026-04-10) -- 5 phases, 10 requirements. [Archive](milestones/v2.1-ROADMAP.md)
- **v2.2 Security Hardening** (2026-04-12 -> 2026-04-13) -- 2 phases, 4 requirements. Shipped via PR #47 (code) + PR #48 (audit). Canonical record: `.planning/v2.2-MILESTONE-AUDIT.md`.
- **v2.3 Hook Ecosystem + Security Guardian + Agent Quality** (2026-04-13 -> 2026-04-15) -- 4 phases (41-44), 5 plans, 8 requirements. Shipped via PR #49. [Archive](milestones/v2.3-ROADMAP.md)

---
*Last updated: 2026-04-16 -- v2.4 Foundation Hardening roadmap initialized*
