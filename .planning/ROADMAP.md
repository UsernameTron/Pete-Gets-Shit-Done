# Roadmap: get-shit-done-cc

## Completed Milestones

- **v1.0 Post-Merge Cleanup** (2026-03-25 -> 2026-03-26) -- 1 phase, 3 requirements. [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Testing & Hardening** (2026-03-26) -- 4 phases, 13 requirements. [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Agent Quality & Consolidation** (2026-04-03 -> 2026-04-04) -- 1 phase, 7 requirements. [Archive](milestones/v1.2-ROADMAP.md)
- **v1.3 Security Hardening & Coverage** (2026-04-04) -- 4 phases, 6 requirements. [Archive](milestones/v1.3-ROADMAP.md)
- **v1.4 Correctness & Robustness** (2026-04-04) -- 4 phases, 14 requirements. [Archive](milestones/v1.4-ROADMAP.md)
- **v1.5 Performance** (2026-04-04) -- 3 phases, 6 requirements. [Archive](milestones/v1.5-ROADMAP.md)

## Current Milestone: v1.6 Maintainability

**Goal:** Address all deferred items and tech debt from v1.0-v1.5. Improve architecture, wire orphaned utilities to consumers, overhaul the skills system, and polish package metadata for marketplace readiness.

**Phases:** 4 (Phases 18-21) | **Requirements:** 12

### Phase 18: Architecture & Module Boundaries

Establish clear layered architecture and sync-compatible cancellation.

| Plan | Requirement | Description |
|------|-------------|-------------|
| 18-01 | MAINT-01 | Layered architecture refactoring — define module boundary interfaces, extract cross-cutting concerns, establish import direction rules |
| 18-02 | MAINT-06 | Sync-compatible cancel tokens — lightweight cancellation pattern for long-running sync operations |

**Dependencies:** None (foundational phase)
**Effort:** Medium — architecture analysis + targeted refactoring

### Phase 19: Feature Management & Consumer Wiring

Add feature flags and wire orphaned utilities to production consumers.

| Plan | Requirement | Description |
|------|-------------|-------------|
| 19-01 | MAINT-02 | Feature flag system in core.cjs — named toggles, config-driven, default-off |
| 19-02 | MAINT-07 | Wire validateShellArg() to production caller — eliminate zero-caller debt |
| 19-03 | MAINT-08 | Wire __GSD_TRUNCATED__ sentinel to programmatic consumer — structured warning detection |

**Dependencies:** Phase 18 (module boundaries inform where flags and wiring live)
**Effort:** Medium — new feature flag infra + consumer wiring

### Phase 20: Skills System Overhaul

Extensibility, cleanup, versioning, and consolidation of the skills system.

| Plan | Requirement | Description |
|------|-------------|-------------|
| 20-01 | MAINT-03 | Skills extensibility — composition, metadata queries, dynamic discovery |
| 20-02 | MAINT-04 | Orphaned skills audit — scan, identify dead skills, archive/remove |
| 20-03 | MAINT-05 | Skill versioning — version metadata, pinned references, drift warnings |
| 20-04 | MAINT-09 | skill-forge consolidation — merge into core registry, preserve behaviors |

**Dependencies:** Phase 19 (feature flags may gate experimental skill features)
**Effort:** Large — 4 plans touching skill registry, file scanning, metadata

### Phase 21: Package & Metadata Polish

Synchronize metadata, bump version, prepare for marketplace.

| Plan | Requirement | Description |
|------|-------------|-------------|
| 21-01 | META-01 | Align plugin.json author/version/description fields across all manifests |
| 21-02 | META-02 | Version bump to v1.30.0, changelog update, npm publish verification |
| 21-03 | META-03 | Plugin audit against marketplace schema, submission checklist |

**Dependencies:** Phases 18-20 (all code changes landed before metadata finalization)
**Effort:** Small — metadata sync and documentation

---

## Phase Summary

| Phase | Name | Plans | Requirements | Effort | Dependencies |
|-------|------|-------|--------------|--------|--------------|
| 18 | Architecture & Module Boundaries | 2 | MAINT-01, MAINT-06 | Medium | None |
| 19 | Feature Management & Consumer Wiring | 3 | MAINT-02, MAINT-07, MAINT-08 | Medium | Phase 18 |
| 20 | Skills System Overhaul | 4 | MAINT-03, MAINT-04, MAINT-05, MAINT-09 | Large | Phase 19 |
| 21 | Package & Metadata Polish | 3 | META-01, META-02, META-03 | Small | Phases 18-20 |

**Total:** 4 phases, 12 plans, 12 requirements

---
*Last updated: 2026-04-04 -- v1.6 Maintainability roadmap created*
