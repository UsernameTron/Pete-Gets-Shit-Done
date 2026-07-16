# Roadmap — get-shit-done

## Milestones

- v2.6 Developer Experience — Phases 49-51 (shipped 2026-04-18) — [archive](milestones/v2.6-ROADMAP.md)
- v2.7 Session Continuity — Phases 52-54 (shipped 2026-04-18) — [archive](milestones/v2.7-ROADMAP.md)
- v2.8 Documentation Integrity — Phases 55-57 (shipped 2026-05-08) — [archive](milestones/v2.8-ROADMAP.md)
- v2.9 Autonomous Workflows Completion — Phases 57.1, 58-59 (shipped 2026-07-15)
- v3.0 Milestone-Close Hardening — Phases 60-61 (active, started 2026-07-15)

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

### v3.0 Milestone-Close Hardening (Phases 60-61) — ACTIVE (started 2026-07-15)

**Milestone Goal:** Close the two runtime-safety gaps the v2.9 close-out surfaced — milestone close-out that works on a protected `main`, and hook enforcement reproducible from a fresh clone.

- [x] **Phase 60: Protected-Main Merge Path** - complete-milestone (and ship-milestone via delegation) route through `gh pr merge` when main is branch-protected, preserving the local squash path unchanged when it isn't
- [ ] **Phase 61: Versioned Hook Registration** - A versioned settings template + installer contract test guarantee a fresh clone registers every hook source the repo ships (7 `hooks/` sources + `lesson-capture-gate.cjs`), with none left unwired

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
**Plans**: Executed 2026-07-15 from approved plan (~/.claude/plans/58-load-the-entire-eventual-hare.md, Phase 59 version) — 59-01 ship-milestone.md + audit-milestone filename fix, 59-02 tests (ship-milestone.test.cjs, do-routing flip, golden id 26, blind spot-check 3/3), 59-03 registry re-pointing + shelved-flag lift

### Phase 60: Protected-Main Merge Path
**Goal**: `complete-milestone`'s branch-handling step (and `ship-milestone` through its delegation) closes out a milestone correctly whether `main` is branch-protected or not — never attempting a local push that protection will reject.
**Depends on**: Nothing (first phase of v3.0)
**Requirements**: MERGE-01, MERGE-02, MERGE-03, MERGE-04
**Success Criteria** (what must be TRUE):
  1. Running `complete-milestone`'s branch-handling step against a branch-protected `main` detects the protection and merges the close-out branch via `gh pr merge` (CI-gated squash) instead of attempting `git checkout main; git merge --squash; git push`.
  2. Running the same step against an unprotected `main` still performs the existing local squash/merge-with-history/delete/keep flow, behaviorally unchanged from today (same options, same commands, same outcomes).
  3. Running `ship-milestone` through its `complete-milestone` delegation on a protected repo exercises the same PR-merge path — `ship-milestone.md` contains no separate or divergent merge logic of its own.
  4. A test suite asserts both branch decisions (protected main → PR-merge path, unprotected main → local path) and fails if either regresses.
**Plans**: Executed 2026-07-15 from approved plan (~/.claude/plans/60-jolly-marble.md) — detection + PR-merge arm in complete-milestone.md handle_branches, tests/complete-milestone.test.cjs (13 tests), ship-milestone enumeration touch-up

### Phase 61: Versioned Hook Registration
**Goal**: A fresh clone of the repo registers the full runtime hook set out of the box — matching the maintainer's workstation — with no shipped hook left silently unwired.
**Depends on**: Nothing (independent of Phase 60 — runtime-safety fix on a different subsystem)
**Requirements**: HOOKREG-01, HOOKREG-02, HOOKREG-03
**Success Criteria** (what must be TRUE):
  1. Installing from a fresh clone results in every hook source the repo ships (7 `hooks/` sources + `lesson-capture-gate.cjs` — 8 today; the contract test derives the list from the filesystem, not a hardcoded count) present in the versioned settings template's registrations. *(The ecosystem map's "17 baseline hooks" counts workstation-wide hooks including other plugins — out of this repo's control; the repo-shipped set is the fixable scope.)*
  2. `lesson-capture-gate.cjs` appears in the versioned registrations and fires when its event occurs in a live session, confirming it is wired rather than orphaned.
  3. Deleting or omitting any shipped hook source from the registration causes the installer contract test to fail — drift is caught before it reaches a user's clone.
  4. The settings template carries a version marker so future hook additions can be diffed against what's registered, preventing this gap from recurring silently.
**Plans**: 1 plan
- [ ] 61-01-PLAN.md — Versioned hook-registration template (settings-gsd-hooks.json) + filesystem-derived contract test (tests/hook-registration-contract.test.cjs) locking all 8 shipped sources to the registry, with installer agreement and version marker

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
| 61. Versioned Hook Registration | v3.0 | 0/? | Not started | - |
