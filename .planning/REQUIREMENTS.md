# Requirements: get-shit-done-cc

**Defined:** 2026-04-04
**Core Value:** Zero-dependency spec-driven development plugin for Claude Code

## v1.7 Requirements

Requirements for v1.7 End-to-End Integration Testing. Covers the full 57+ command surface with fully mocked LLM calls, exit code validation, and file assertion pass criteria.

### Test Infrastructure

- [ ] **E2E-01**: Test harness with mocked LLM layer — create a test runner that intercepts all LLM/subagent calls, returns deterministic canned responses, and captures command invocations. Must support both sync and async code paths within the zero-dependency CommonJS constraint.
- [ ] **E2E-02**: Fixture system for project scaffolding — provide helpers that create temporary `.planning/` directories with valid STATE.md, ROADMAP.md, REQUIREMENTS.md, and PROJECT.md files in known states (empty project, mid-milestone, completed milestone). Fixtures must be disposable (auto-cleanup after test).
- [ ] **E2E-03**: Assertion helpers for exit codes, file content, and state — provide `assertExitCode(cmd, expected)`, `assertFileContains(path, pattern)`, `assertStateField(field, value)` and similar helpers that produce clear failure messages.

### Core Pipeline Tests

- [ ] **E2E-04**: new-project end-to-end flow — test that `gsd:new-project` creates all required `.planning/` files (PROJECT.md, STATE.md, ROADMAP.md, REQUIREMENTS.md) with valid frontmatter and expected sections.
- [ ] **E2E-05**: discuss-phase through execute-phase pipeline — test the full discuss → plan → execute pipeline for a single phase. Verify CONTEXT.md creation, PLAN.md generation with valid frontmatter, plan execution producing SUMMARY.md, and STATE.md progress updates.
- [ ] **E2E-06**: verify-work through ship pipeline — test that verify-work reads PLAN.md acceptance criteria and produces VERIFICATION.md, and that ship creates a properly formatted PR description from phase artifacts.

### Utility & Lifecycle Tests

- [ ] **E2E-07**: quick/fast/do command coverage — test that `/gsd:quick` produces atomic commits, `/gsd:fast` executes inline without subagents, and `/gsd:do` routes freeform text to the correct GSD command.
- [ ] **E2E-08**: progress/stats/health command coverage — test that `/gsd:progress` shows current state and routes correctly, `/gsd:stats` produces accurate phase/plan/requirement counts, and `/gsd:health` detects and reports `.planning/` directory issues.
- [ ] **E2E-09**: Milestone lifecycle (new/audit/complete/cleanup) — test the full lifecycle: `new-milestone` creates fresh state, `audit-milestone` verifies requirements coverage, `complete-milestone` archives correctly, `cleanup` removes phase directories.
- [ ] **E2E-10**: Workstream management commands — test that `workstreams` can list/create/switch/status workstreams, verify workspace isolation, and confirm state files are independent per workstream.

### Error Path & Edge Case Tests

- [ ] **E2E-11**: Failure mode handling and recovery — test behavior when: plan execution fails mid-task (verify partial state preserved), state files are locked (verify lock diagnostics), and subagent returns error (verify graceful degradation).
- [ ] **E2E-12**: Edge case coverage — test behavior with: empty project (no `.planning/`), corrupt STATE.md (invalid YAML frontmatter), missing ROADMAP.md, phase directory without PLAN.md, and version mismatch between STATE.md and ROADMAP.md.
- [ ] **E2E-13**: CI integration and regression gate — create a test runner entry point (`npm run test:e2e`) that runs all E2E tests, produces exit code 0/1, and can be wired into CI. Include a smoke test subset (`npm run test:e2e:smoke`) for fast feedback.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real LLM calls in tests | Fully mocked — deterministic, fast, no API costs |
| UI/visual testing | CLI-only — no rendering to test |
| Performance benchmarking | Separate concern — v1.7 is correctness, not speed |
| Cross-platform CI matrix | Single-platform (macOS) sufficient for integration tests |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| E2E-01 | Phase 22 | Pending |
| E2E-02 | Phase 22 | Pending |
| E2E-03 | Phase 22 | Pending |
| E2E-04 | Phase 23 | Pending |
| E2E-05 | Phase 23 | Pending |
| E2E-06 | Phase 23 | Pending |
| E2E-07 | Phase 24 | Pending |
| E2E-08 | Phase 24 | Pending |
| E2E-09 | Phase 24 | Pending |
| E2E-10 | Phase 24 | Pending |
| E2E-11 | Phase 25 | Pending |
| E2E-12 | Phase 25 | Pending |
| E2E-13 | Phase 25 | Pending |

**Coverage:**
- v1.7 requirements: 13 total
- Mapped to phases: 13/13
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
