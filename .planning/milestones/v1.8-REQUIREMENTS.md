# Requirements: get-shit-done-cc

**Defined:** 2026-04-05
**Core Value:** Zero-dependency spec-driven development plugin for Claude Code

## v1.8 Requirements

Requirements for v1.8 Documentation & Accuracy. Fixes 19 test failures from end-to-end analysis, syncs stale agent references, and updates all project documentation to match actual state.

### Test Failure Fixes

- [x] **DOC-01**: Fix stale agent references in MODEL_PROFILES and workflows — remove references to consolidated agents (gsd-plan-checker, gsd-integration-checker, gsd-nyquist-auditor, gsd-phase-researcher, gsd-project-researcher) and update test expectations to match current 15 active agents. Fixes 13 test failures.
- [x] **DOC-02**: Fix gsd-validator-hub.md frontmatter — add missing `color:` field, remove forbidden `skills:` block. Fixes 2 test failures.
- [x] **DOC-03**: Fix gsd-verifier.md compliance — add missing `# hooks:` comment, reduce file size below 50K threshold. Fixes 2 test failures.
- [x] **DOC-04**: Fix missing directory structures expected by tests — ensure plugin/agent directories exist where tests expect them. Fixes 2 test failures.

### Documentation Accuracy

- [x] **DOC-05**: Update CLAUDE.md with accurate metrics — correct test counts, agent counts, and coverage numbers to match current state.
- [x] **DOC-06**: Update README.md with accurate project state — test counts, agent counts, milestone history through v1.7.
- [x] **DOC-07**: Sync init new-milestone output — fix `current_milestone` and `latest_completed_milestone` values in gsd-tools.cjs to reflect actual STATE.md/ROADMAP.md state.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New functionality | Documentation-only milestone — no new features |
| Refactoring | Only changes needed to fix test failures and documentation |
| Coverage improvements | Separate concern — coverage targets met in v1.3-v1.6 |
| New test creation | Only fixing existing test expectations, not adding tests |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOC-01 | Phase 26 | Done |
| DOC-02 | Phase 26 | Done |
| DOC-03 | Phase 26 | Done |
| DOC-04 | Phase 26 | Done |
| DOC-05 | Phase 27 | Done (no stale metrics found in CLAUDE.md) |
| DOC-06 | Phase 27 | Done |
| DOC-07 | Phase 27 | Done (init.cjs has no hardcoded metrics) |

**Coverage:**
- v1.8 requirements: 7 total
- Mapped to phases: 7/7
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
