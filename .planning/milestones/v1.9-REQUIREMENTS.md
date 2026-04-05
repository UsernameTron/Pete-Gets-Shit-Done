# Requirements: get-shit-done-cc

**Defined:** 2026-04-05
**Core Value:** Zero-dependency spec-driven development plugin for Claude Code

## v1.9 Requirements

Requirements for v1.9 Ship Readiness & Hygiene. Cleans stale agent references from active files, updates PROJECT.md tech debt accuracy, and rewrites DEVOPS-HANDOFF.md from placeholder to comprehensive handoff document.

### Phase 28 — Stale Reference Cleanup

- [ ] **HYG-01**: Remove stale agent references from 13 active files — replace consolidated agent names (gsd-plan-checker, gsd-integration-checker, gsd-nyquist-auditor, gsd-phase-researcher, gsd-project-researcher) with current names (gsd-verifier with scope parameter, gsd-research-orchestrator) or remove entirely where no longer relevant.
- [ ] **HYG-02**: Update PROJECT.md Tech Debt section — ensure it reflects only actual remaining debt, not issues already fixed by v1.8.
- [ ] **HYG-03**: Audit and fix CLAUDE.md quality agent references — the project CLAUDE.md Phase 3 section lists gsd-plan-checker, gsd-integration-checker which no longer exist; update to reference gsd-verifier with scope parameter.

### Phase 29 — DEVOPS-HANDOFF.md Rewrite

- [ ] **HYG-04**: Rewrite docs/DEVOPS-HANDOFF.md as a comprehensive DevOps handoff document covering: project summary, environment requirements, installation, configuration reference, test suite overview, CI/CD status, security notes, deployment maturity, known tech debt.
- [ ] **HYG-05**: Ensure DEVOPS-HANDOFF.md metrics match current state — 1913 unit tests + 133 E2E across 74 test files, 15 active agents, core.cjs 94.26% line / 87.11% branch coverage, security.cjs 100% line / 91.11% branch, zero dependencies.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Modifying archived/historical files | Historical accuracy — archived phases, milestones, CHANGELOG reflect what existed at that time |
| New features or architecture changes | Hygiene-only milestone |
| Coverage improvements | Coverage targets met in v1.3-v1.6 |
| New test creation | No new code — only documentation and reference updates |
| Version hardcoding in gsd-tools.cjs | Lower priority; init output is informational, not blocking |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HYG-01 | Phase 28 | Pending |
| HYG-02 | Phase 28 | Pending |
| HYG-03 | Phase 28 | Pending |
| HYG-04 | Phase 29 | Pending |
| HYG-05 | Phase 29 | Pending |

**Coverage:**
- v1.9 requirements: 5 total
- Mapped to phases: 5/5
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
