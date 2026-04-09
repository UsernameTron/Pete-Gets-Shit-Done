# Requirements: get-shit-done-cc

**Defined:** 2026-04-09
**Core Value:** Close accumulated tech debt and verify the full v1.0-v2.0 feature surface through systematic audit

## v2.1 Requirements

Requirements for System Audit & Debt Closure milestone. Each maps to roadmap phases.

### Debt Closure

- [ ] **DEBT-06**: Backfill missing SUMMARY.md files for Phase 6 plans 02, 03, 04 from CREW-ASSESSMENT.md records
- [ ] **DEBT-07**: Update global CLAUDE.md files to replace references to deprecated gsd-plan-checker and gsd-integration-checker with gsd-verifier
- [ ] **DEBT-08**: Create Nyquist VALIDATION.md for Phase 6 (v1.2 milestone)

### System Audit

- [ ] **AUDIT-01**: Verify v1.4 DEBT-01 resolved INT-01 — all 15 agents have consistent tier labels matching tool grants
- [ ] **AUDIT-02**: Verify v1.4 DEBT-04 resolved INT-02 — gsd-validator-hub reachable through workflow routing
- [ ] **AUDIT-03**: All 15 source agents have valid YAML frontmatter, correct tool grants, and quality sections
- [ ] **AUDIT-04**: All 61 GSD commands reachable via skill routing with no orphaned or dead commands
- [ ] **AUDIT-05**: All hooks functional — matchers fire correctly for configured events
- [ ] **AUDIT-06**: Full test suite passes with coverage thresholds met (90% overall, 80%/module, 95% security)
- [ ] **AUDIT-07**: Documentation accuracy — CLAUDE.md, README.md, DEVOPS-HANDOFF.md reflect current state

## Future Requirements

None — this is a maintenance/audit milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New GSD commands | Audit-only milestone, no new features |
| Performance optimization | Covered in v1.5, no regressions reported |
| New agent capabilities | Agents are being audited, not extended |
| lesson-capture-enforcement work | Separate branch/effort, tracked independently |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEBT-06 | Phase 34 | Pending |
| DEBT-07 | Phase 34 | Pending |
| DEBT-08 | Phase 34 | Pending |
| AUDIT-01 | Phase 35 | Pending |
| AUDIT-02 | Phase 35 | Pending |
| AUDIT-03 | Phase 36 | Pending |
| AUDIT-04 | Phase 36 | Pending |
| AUDIT-05 | Phase 36 | Pending |
| AUDIT-06 | Phase 37 | Pending |
| AUDIT-07 | Phase 38 | Pending |

**Coverage:**
- v2.1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after initial definition*
