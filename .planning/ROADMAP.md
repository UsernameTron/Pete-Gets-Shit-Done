# Roadmap: get-shit-done-cc

## Completed Milestones

- **v1.0 Post-Merge Cleanup** (2026-03-25 -> 2026-03-26) -- 1 phase, 3 requirements. [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Testing & Hardening** (2026-03-26) -- 4 phases, 13 requirements. [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Agent Quality & Consolidation** (2026-04-03 -> 2026-04-04) -- 1 phase, 7 requirements. [Archive](milestones/v1.2-ROADMAP.md)
- **v1.3 Security Hardening & Coverage** (2026-04-04) -- 4 phases, 6 requirements. [Archive](milestones/v1.3-ROADMAP.md)
- **v1.4 Correctness & Robustness** (2026-04-04) -- 4 phases, 14 requirements. [Archive](milestones/v1.4-ROADMAP.md)
- **v1.5 Performance** (2026-04-04) -- 3 phases, 6 requirements. [Archive](milestones/v1.5-ROADMAP.md)
- **v1.6 Maintainability** (2026-04-04) -- 4 phases, 12 requirements. [Archive](milestones/v1.6-ROADMAP.md)

## Current Milestone

**v1.7 End-to-End Integration Testing** (2026-04-04)

Full command surface integration tests with mocked LLM layer, exit code validation, and file assertions.

### Phase 22 — Test Infrastructure
Build the E2E test harness, mock layer, fixture system, and assertion helpers.

| Requirement | Description |
|-------------|-------------|
| E2E-01 | Test harness with mocked LLM layer |
| E2E-02 | Fixture system for project scaffolding |
| E2E-03 | Assertion helpers (exit codes, file content, state) |

### Phase 23 — Core Pipeline Tests
Test the primary GSD workflow: new-project → discuss → plan → execute → verify → ship.

| Requirement | Description |
|-------------|-------------|
| E2E-04 | new-project end-to-end flow |
| E2E-05 | discuss-phase through execute-phase pipeline |
| E2E-06 | verify-work through ship pipeline |

### Phase 24 — Utility & Lifecycle Tests
Test utility commands (quick/fast/do, progress/stats/health) and full milestone lifecycle.

| Requirement | Description |
|-------------|-------------|
| E2E-07 | quick/fast/do command coverage |
| E2E-08 | progress/stats/health command coverage |
| E2E-09 | Milestone lifecycle (new/audit/complete/cleanup) |
| E2E-10 | Workstream management commands |

### Phase 25 — Error Path & Edge Case Tests
Test failure modes, recovery, corrupt state handling, and CI integration.

| Requirement | Description |
|-------------|-------------|
| E2E-11 | Failure mode handling and recovery |
| E2E-12 | Edge case coverage (empty projects, corrupt state) |
| E2E-13 | CI integration and regression gate |

---
*Last updated: 2026-04-04 -- v1.7 End-to-End Integration Testing started*
