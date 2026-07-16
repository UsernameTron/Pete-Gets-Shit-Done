# Roadmap — get-shit-done

## Milestones

- v2.6 Developer Experience — Phases 49-51 (shipped 2026-04-18) — [archive](milestones/v2.6-ROADMAP.md)
- v2.7 Session Continuity — Phases 52-54 (shipped 2026-04-18) — [archive](milestones/v2.7-ROADMAP.md)
- v2.8 Documentation Integrity — Phases 55-57 (shipped 2026-05-08) — [archive](milestones/v2.8-ROADMAP.md)
- v2.9 Autonomous Workflows Completion — Phases 57.1, 58-59 (shipped 2026-07-15)
- v3.0 Milestone-Close Hardening — Phases 60-61 (shipped 2026-07-16) — [archive](milestones/v3.0-ROADMAP.md)

## Phases

<details>
<summary>v2.6 Developer Experience (Phases 49-51) — SHIPPED 2026-04-18</summary>

- [x] Phase 49: One-Command Install (1/1 plan) — completed 2026-04-17
- [x] Phase 50: CI Watch (2/2 plans) — completed 2026-04-17
- [x] Phase 51: Sync Docs (1/1 plan) — completed 2026-04-18

</details>

<details>
<summary>v2.7 Session Continuity (Phases 52-54) — SHIPPED 2026-04-18</summary>

**Milestone Goal:** Eliminate the three primary session friction points — context-reset amnesia, manual verification overhead, and slow session-start orientation.

- [x] **Phase 52: Checkpoint Engine** - Deterministic session state written before every context reset, consumed by /prime and resume-work to skip completed work (completed 2026-04-18)
- [x] **Phase 53: Daily Dashboard** - One-command morning briefing showing milestone, phase, plan progress, branch state, and exact next action (completed 2026-04-18)
- [x] **Phase 54: Automated UAT Runner** - Pattern-based must_have assertions executed automatically before conversational UAT, with pass/fail/manual triage (completed 2026-04-18)
  Plans:
  - [x] 54-01-PLAN.md -- Pattern registry (uat-patterns.cjs) with 8+ pattern types via TDD
  - [x] 54-02-PLAN.md -- Runner orchestrator (uat-runner.cjs) with frontmatter parsing and command execution via TDD
  - [x] 54-03-PLAN.md -- Integration: wire into verify-work.md + CLI subcommand + full suite green

</details>

<details>
<summary>v2.8 Documentation Integrity (Phases 55-57) — SHIPPED 2026-05-08</summary>

**Milestone Goal:** Turn documentation accuracy from manually-maintained to CI-enforced — broken links, stale counts, and cross-doc inconsistencies must fail CI before merge.

- [x] **Phase 55: Internal Link Validator** (3/3 plans) — completed 2026-05-07
- [x] **Phase 56: Doc Drift Detector** (3/3 plans) — completed 2026-05-08
- [x] **Phase 57: Backfill and CI Integration** (3/3 plans) — completed 2026-05-08

</details>

### v2.9 Autonomous Workflows Completion (Phases 57.1, 58-59) — SHIPPED 2026-07-15

**Milestone Goal:** Harden the last `/gsd:finalize` fragility and build the previously-shelved `ship-milestone` workflow that depends on it (built Phase 59, 2026-07-15), closing the autonomous-workflows suite.

- [x] **Phase 57.1: Bitter Lesson Surgery** (inserted 2026-07-15) - Strip judgment scaffolding (do.md routing table, classify.cjs, dynamicSelect tier promotion, vendored-skill classifiers) while preserving leverage scaffolding; replace router with model-readable registry (shipped PR #51, 2026-07-15)
- [x] **Phase 58: Finalize Hardening & Re-verification** - Gate 5.5 degrades gracefully without repo-doc-architect; finalize re-verified end-to-end in sandbox (operator-ratified FIN-02 vehicle, 2026-07-15)
- [x] **Phase 59: Ship-Milestone Workflow** - Composes the finalizer critical path behind exactly 2 gates, routed via /gsd:do, unshelved (shipped 2026-07-15)

<details>
<summary>v3.0 Milestone-Close Hardening (Phases 60-61) — SHIPPED 2026-07-16</summary>

**Milestone Goal:** Close the two runtime-safety gaps the v2.9 close-out surfaced — milestone close-out that works on a protected `main`, and hook enforcement reproducible from a fresh clone.

- [x] **Phase 60: Protected-Main Merge Path** - complete-milestone (and ship-milestone via delegation) route through `gh pr merge` when main is branch-protected, preserving the local squash path unchanged when it isn't (completed 2026-07-15, PR #60)
- [x] **Phase 61: Versioned Hook Registration** - A versioned settings template + installer contract test guarantee a fresh clone registers every hook source the repo ships (7 `hooks/` sources + `lesson-capture-gate.cjs`), with none left unwired (completed 2026-07-16, PR #61)

</details>

## Phase Details

(All v2.6, v2.7, v2.8, and v3.0 phase details archived to milestones/v2.6-ROADMAP.md, milestones/v2.7-ROADMAP.md, milestones/v2.8-ROADMAP.md, milestones/v3.0-ROADMAP.md respectively. v2.9 phase directories are archived under milestones/v2.9-phases/; its milestone summary is retained above.)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 49. One-Command Install | v2.6 | 1/1 | Complete | 2026-04-17 |
| 50. CI Watch | v2.6 | 2/2 | Complete | 2026-04-17 |
| 51. Sync Docs | v2.6 | 1/1 | Complete | 2026-04-18 |
| 52. Checkpoint Engine | v2.7 | 2/2 | Complete | 2026-04-18 |
| 53. Daily Dashboard | v2.7 | 2/2 | Complete | 2026-04-18 |
| 54. Automated UAT Runner | v2.7 | 3/3 | Complete | 2026-04-18 |
| 55. Internal Link Validator | v2.8 | 3/3 | Complete | 2026-05-07 |
| 56. Doc Drift Detector | v2.8 | 3/3 | Complete | 2026-05-08 |
| 57. Backfill and CI Integration | v2.8 | 3/3 | Complete | 2026-05-08 |
| 57.1. Bitter Lesson Surgery | v2.9 (insert) | 1/1 | Complete | 2026-07-15 |
| 58. Finalize Hardening & Re-verification | v2.9 | 3/3 | Complete | 2026-07-15 |
| 59. Ship-Milestone Workflow | v2.9 | 3/3 | Complete | 2026-07-15 |
| 60. Protected-Main Merge Path | v3.0 | 1/1 | Complete | 2026-07-15 |
| 61. Versioned Hook Registration | v3.0 | 1/1 | Complete    | 2026-07-16 |
