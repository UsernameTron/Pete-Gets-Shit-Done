# Requirements: get-shit-done-cc

**Defined:** 2026-04-04
**Core Value:** Zero-dependency spec-driven development plugin for Claude Code

## v1.6 Requirements

Requirements for v1.6 Maintainability. Addresses all deferred items and tech debt from v1.0-v1.5.

### Architecture & Module Boundaries

- [x] **MAINT-01**: Layered architecture refactoring — establish clear module boundaries between core utilities (core.cjs), security (security.cjs), agent management, skill registry, and CLI tooling. Extract cross-cutting concerns into well-defined interfaces.
- [x] **MAINT-06**: Sync-compatible cancel tokens — implement a lightweight cancellation pattern that works within the sync CommonJS architecture, allowing long-running operations to check a cancelled flag without requiring async/await or AbortController.

### Feature Management & Consumer Wiring

- [x] **MAINT-02**: Feature flags for experimental capabilities — add a feature flag system in core.cjs that gates experimental features behind named toggles, configurable via GSD config. Flags default to off, can be enabled per-project.
- [x] **MAINT-07**: Wire validateShellArg to production caller — identify or create at least one production code path that uses validateShellArg() from security.cjs, eliminating the zero-caller tech debt.
- [x] **MAINT-08**: Wire __GSD_TRUNCATED__ to programmatic consumer — add detection logic that checks for the __GSD_TRUNCATED__ sentinel in output and surfaces it as a structured warning, eliminating the no-consumer tech debt.

### Skills System

- [ ] **MAINT-03**: Skills extensibility improvements — support skill composition (skills that reference other skills), skill metadata queries, and dynamic skill discovery from plugin directories.
- [ ] **MAINT-04**: Orphaned skills audit and cleanup — scan all skill directories, identify skills with no trigger path or broken references, archive or remove dead skills.
- [ ] **MAINT-05**: Skill versioning system — add version tracking to skill metadata, support version-pinned references, and emit warnings when skill versions drift from their plugin manifest.
- [ ] **MAINT-09**: skill-forge consolidation — merge skill-forge patterns into the core skill registry, eliminating the separate skill-forge code path while preserving all production-grade engineering behaviors.

### Package & Metadata Polish

- [ ] **META-01**: Align plugin.json author fields with package.json — synchronize author, description, and version fields between root plugin.json, plugins/plugin.json, and package.json.
- [ ] **META-02**: Version bump and publish prep — bump version to v1.30.0, update changelog, verify npm publish readiness (package.json files field, .npmignore accuracy).
- [ ] **META-03**: Plugin audit and marketplace prep — audit plugin structure against marketplace requirements, verify all plugin.json fields meet schema, document plugin submission checklist.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full async/await refactor | Zero-dependency sync constraint — cancel tokens use polling, not AbortController |
| External dependency additions | Zero-dependency constraint |
| Breaking changes to GSD commands | Backward compatibility constraint |
| New skill DSL or language | Extensibility means better composition, not a new authoring format |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAINT-01 | Phase 18 | Complete |
| MAINT-06 | Phase 18 | Complete |
| MAINT-02 | Phase 19 | Complete |
| MAINT-07 | Phase 19 | Complete |
| MAINT-08 | Phase 19 | Complete |
| MAINT-03 | Phase 20 | Pending |
| MAINT-04 | Phase 20 | Pending |
| MAINT-05 | Phase 20 | Pending |
| MAINT-09 | Phase 20 | Pending |
| META-01 | Phase 21 | Pending |
| META-02 | Phase 21 | Pending |
| META-03 | Phase 21 | Pending |

**Coverage:**
- v1.6 requirements: 12 total
- Mapped to phases: 12/12
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
