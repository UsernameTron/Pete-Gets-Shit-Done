# Roadmap — get-shit-done

## Milestones

- v2.6 Developer Experience — Phases 49-51 (shipped 2026-04-18) — [archive](milestones/v2.6-ROADMAP.md)
- v2.7 Session Continuity — Phases 52-54 (shipped 2026-04-18) — [archive](milestones/v2.7-ROADMAP.md)
- v2.8 Documentation Integrity — Phases 55-57 (shipped 2026-05-08) — [archive](milestones/v2.8-ROADMAP.md)
- v2.9 Autonomous Workflows Completion — Phases 58-59 (in progress)

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

### v2.9 Autonomous Workflows Completion (Phases 58-59) — IN PROGRESS

**Milestone Goal:** Harden the last `/gsd:finalize` fragility and build the shelved `ship-milestone` workflow that depends on it, closing the autonomous-workflows suite.

- [x] **Phase 57.1: Bitter Lesson Surgery** (inserted 2026-07-15) - Strip judgment scaffolding (do.md routing table, classify.cjs, dynamicSelect tier promotion, vendored-skill classifiers) while preserving leverage scaffolding; replace router with model-readable registry (shipped PR #51, 2026-07-15)
- [x] **Phase 58: Finalize Hardening & Re-verification** - Gate 5.5 degrades gracefully without repo-doc-architect; finalize re-verified end-to-end in sandbox (operator-ratified FIN-02 vehicle, 2026-07-15)
- [ ] **Phase 59: Ship-Milestone Workflow** - Composes the finalizer critical path behind exactly 2 gates, routed via /gsd:do, unshelved

## Phase Details

(All v2.6, v2.7, and v2.8 phase details archived to milestones/v2.6-ROADMAP.md, milestones/v2.7-ROADMAP.md, milestones/v2.8-ROADMAP.md respectively.)

### Phase 57.1: Bitter Lesson Surgery (inserted 2026-07-15)
**Goal**: The GSD harness carries no judgment scaffolding — no if-then routing tables, no keyword-scoring classifiers, no tier-promotion heuristics — while every piece of leverage scaffolding (deterministic gates, verification loops, environment facts, user config) survives intact.
**Depends on**: Nothing (standalone surgery on shipped surface)
**Requirements**: Operator directive 2026-07-15 (no REQ-IDs — off-milestone insert)
**Success Criteria** (what must be TRUE):
  1. `/gsd:do` routes from a model-readable registry (frontmatter aggregation via `gsd-tools do-registry`), not an intent table; do.md contains no routing rules.
  2. `classify.cjs` does not exist; `dynamicSelect`/`MODEL_TIERS` do not exist; static `MODEL_PROFILES` and history JSONL recording still work.
  3. All 47 vendored SKILL.md files pass the judgment-vs-leverage rubric; every deletion logged in BITTER_LESSON_LOG.md with line count + defense.
  4. Full suite green, coverage floors hold (90/80/95), check-doc-drift exit 0, validate-doc-links clean.
  5. Branch `bitter-lesson-surgery` committed, never pushed.
**Plans**: Executed directly from approved plan (~/.claude/plans/58-load-the-entire-eventual-hare.md) — orchestrator + 7 executors

### Phase 58: Finalize Hardening & Re-verification
**Goal**: `/gsd:finalize` completes cleanly whether or not `repo-doc-architect` is available in the current install, and its full gate sequence — including every push consent gate — has been proven safe on a real milestone close-out.
**Depends on**: Nothing (first phase of v2.9)
**Requirements**: FIN-01, FIN-02
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:finalize` in an install where `repo-doc-architect` does not resolve completes Gate 5.5 without a failed spawn — it logs a skip notice and finalization continues to Gate 6.
  2. Running `/gsd:finalize` in an install where `repo-doc-architect` does resolve still spawns it and applies its documentation updates as designed, with no regression versus current behavior.
  3. `/gsd:finalize` has been run end-to-end on a real milestone close-out, with every `git push` confirmed to sit behind an answered consent gate (Gate 1 or Gate 7) and zero ungated remote operations observed.
  4. GSD-AUTONOMOUS-WORKFLOWS.md's `ship-milestone` entry no longer lists the Gate 5.5 spawn fragility or the end-to-end re-verification as an open unshelve precondition.
**Plans**: Executed 2026-07-15 from approved plan (~/.claude/plans/58-load-the-entire-eventual-hare.md) — 58-01 Gate 5.5 graceful skip + tests/finalize.test.cjs, 58-02 sandbox e2e (evidence: .planning/phases/58-finalize-hardening/VERIFICATION.md; criterion 3's "real close-out" satisfied by operator-ratified sandbox vehicle; criterion 2 verified structurally — first live spawn lands at v2.9 close-out), 58-03 W5 precondition retirement

### Phase 59: Ship-Milestone Workflow
**Goal**: Operators can close out a milestone through a single `ship-milestone` intent — routed via `/gsd:do` — that automates the proven finalizer critical path behind exactly 2 gates, without weakening any of `complete-milestone`'s human safeguards.
**Depends on**: Phase 58 (routes through the hardened, re-verified finalize; a safe critical path cannot be composed until FIN-01/FIN-02 land)
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04
**Success Criteria** (what must be TRUE):
  1. `get-shit-done/workflows/ship-milestone.md` exists and composes health → audit-agents → sync-docs → coverage+drift → audit-milestone → ship/ci-watch → complete-milestone behind exactly 2 gates (conditional audit-verdict gate + complete-milestone authorization gate) — no additional gates.
  2. Saying "close out the milestone" (or an equivalent intent) to `/gsd:do` routes to `workflow:ship-milestone` — its registry description makes the model prefer it over `gsd:complete-milestone` for close-out intents (blind spot-check evidence) — and the workflow's shelved status is lifted everywhere it was previously flagged. *(Re-pointed 2026-07-15: the routing table was deleted in Phase 57.1; registry routing has no row ordering.)*
  3. Running `ship-milestone` through to Gate 2 still surfaces `complete-milestone`'s 3 internal prompts (archive phases, branch handling, tag push) as live human prompts — the workflow's gates authorize starting the sequence, never auto-answer them.
  4. A structural test suite asserts the do-registry includes `workflow:ship-milestone`, every `/gsd:` command the workflow references resolves to a real command file, and the workflow holds no more than 2 gates. *(Re-pointed 2026-07-15: "routing table" → do-registry, per Phase 57.1.)*
**Plans**: TBD

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
| 59. Ship-Milestone Workflow | v2.9 | 0/TBD | Not started | - |
