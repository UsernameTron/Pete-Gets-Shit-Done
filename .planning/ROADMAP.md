# Roadmap — get-shit-done

## Milestones

- v2.6 Developer Experience — Phases 49-51 (shipped 2026-04-18) — [archive](milestones/v2.6-ROADMAP.md)
- v2.7 Session Continuity — Phases 52-54 (shipped 2026-04-18) — [archive](milestones/v2.7-ROADMAP.md)
- v2.8 Documentation Integrity — Phases 55-57 (shipped 2026-05-08) — [archive](milestones/v2.8-ROADMAP.md)

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

## Phase Details

(All v2.6, v2.7, and v2.8 phase details archived to milestones/v2.6-ROADMAP.md, milestones/v2.7-ROADMAP.md, milestones/v2.8-ROADMAP.md respectively. Run `/gsd:new-milestone` to start the next milestone with fresh phases.)

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

## Backlog

### Phase 999.1: Documentation Refresh (BACKLOG)

**Goal:** Update CLAUDE.md and README.md to reflect current state — agent counts, test counts, milestone history, and any architectural changes since last doc pass.
**Requirements:** TBD
**Plans:** 3/3 plans complete

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
