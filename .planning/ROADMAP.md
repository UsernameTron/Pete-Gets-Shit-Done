# Roadmap — get-shit-done

## Milestones

- v2.6 Developer Experience — Phases 49-51 (shipped 2026-04-18) — [archive](milestones/v2.6-ROADMAP.md)
- v2.7 Session Continuity — Phases 52-54 (shipped 2026-04-18) — [archive](milestones/v2.7-ROADMAP.md)
- v2.8 Documentation Integrity — Phases 55-57 (active)

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

### v2.8 Documentation Integrity (ACTIVE)

**Milestone Goal:** Turn documentation accuracy from manually-maintained to CI-enforced — broken links, stale counts, and cross-doc inconsistencies must fail CI before merge.

- [ ] **Phase 55: Internal Link Validator** - A validator script scans all tracked `.md` files for broken relative-path and anchor refs, exits non-zero on failures, and is fully unit-tested
- [ ] **Phase 56: Doc Drift Detector** - A detector script measures live test counts, agent/command/skill/hook inventory, and coverage, then fails on any disagreement with numeric claims in living docs
- [ ] **Phase 57: Backfill and CI Integration** - Known broken cross-references are repaired and both validator scripts are wired as blocking CI steps in `test.yml`

## Phase Details

### Phase 52: Checkpoint Engine
**Goal**: Session state is captured deterministically before context resets so resumed sessions skip work that is already done
**Depends on**: Nothing (Phase 51 shipped)
**Requirements**: CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:checkpoint` produces a valid `.planning/CHECKPOINT.json` that can be read back by `readCheckpoint()` with no data loss
  2. `/gsd:resume-work` reads the checkpoint and skips any plan IDs already listed in `plans.completed` — the user sees a "skipping N completed plans" message, not a re-execution prompt
  3. `/prime` includes checkpoint data in its initialization summary when a checkpoint file is present
  4. A checkpoint older than 24 hours triggers a visible staleness warning but does not crash or block startup
  5. Running `/prime` or `/gsd:resume-work` in a project with no checkpoint file completes silently with no error
**Plans**: TBD

### Phase 53: Daily Dashboard
**Goal**: Developers can run one command at session start and immediately know their exact state and next action
**Depends on**: Phase 52 (consumes `readCheckpoint()` from checkpoint.cjs)
**Requirements**: DAILY-01, DAILY-02, DAILY-03, DAILY-04, DAILY-05, DAILY-06
**Success Criteria** (what must be TRUE):
  1. `/gsd:daily` completes and prints a formatted dashboard in under 2 seconds
  2. When a checkpoint is present, the dashboard reflects checkpoint data; when absent, it falls back to STATE.md without error
  3. The dashboard shows the correct next GSD command for every project state: active phase with in-progress plan, active phase with pending plans, between milestones, and maintenance mode
  4. A dirty git working tree and a stale checkpoint each produce their own visible warning in the dashboard output
**Plans**: TBD

### Phase 54: Automated UAT Runner
**Goal**: must_have assertions from plan frontmatter are executed automatically as shell commands before any conversational verification is requested
**Depends on**: Nothing (independent of Phases 52-53, though benefits from checkpoint data)
**Requirements**: UAT-01, UAT-02, UAT-03, UAT-04, UAT-05, UAT-06, UAT-07, UAT-08, UAT-09, UAT-10
**Success Criteria** (what must be TRUE):
  1. `verify-work` automatically parses must_haves from all phase PLAN.md files and executes shell assertions before prompting the user for anything
  2. The runner matches at least 8 distinct must_have pattern types (file exists, file not exists, test suite green, coverage threshold, file contains, file not contains, files identical, module export count)
  3. Failed assertions display the must_have text, the expected value, the actual value, and the exact command that was run
  4. must_haves that match no pattern are routed to manual conversational UAT — the user is only asked to verify what cannot be automated
  5. All runner commands are read-only; no file writes occur during automated verification
**Plans**: 3 plans
Plans:
- [x] 54-01-PLAN.md -- Pattern registry (TDD)
- [x] 54-02-PLAN.md -- Runner orchestrator (TDD)
- [x] 54-03-PLAN.md -- Integration + full suite green

### Phase 55: Internal Link Validator
**Goal**: Every broken relative-path and anchor ref in tracked `.md` files is detected, reported in a structured table, and fails CI on a non-zero exit
**Depends on**: Nothing (independent — no dependency on Phase 56)
**Requirements**: DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04
**Success Criteria** (what must be TRUE):
  1. Running `scripts/validate-doc-links.cjs` on the repo produces a table listing every broken ref (file, line number, broken ref text, reason) and exits non-zero when any broken link exists
  2. Running the validator on a repo with no broken links exits zero and prints a clean-pass message
  3. Running the validator with `--json` outputs a machine-readable JSON object envelope `{ status: "clean"|"broken", checked: <number>, files: <number>, broken: [<{file, line, ref, reason}>] }` suitable for programmatic consumption (resolves cross-AI review pass-1 HIGH finding — envelope chosen over raw array for diagnostic value)
  4. Broken anchor refs (e.g., `#section-name` not present in the target document) are identified and reported separately from broken file-path refs
**Plans**: 3 plans
Plans:
- [ ] 55-01-PLAN.md — TDD core: fixtures + toGfmSlug + extractHeadingSlugs + extractLinks + validateLink + formatTable (Wave 1)
- [ ] 55-02-PLAN.md — Discovery + main() + integration tests + .c8rc.json coverage tracking (Wave 2)
- [ ] 55-03-PLAN.md — Real-repo run + suite green + living-docs updates (Wave 3)

### Phase 56: Doc Drift Detector
**Goal**: Numeric claims in the three living docs are automatically compared against measured live values, and any disagreement fails the run with a structured drift report
**Depends on**: Nothing (independent — no dependency on Phase 55)
**Requirements**: DOCDRIFT-01, DOCDRIFT-02, DOCDRIFT-03, DOCDRIFT-04, DOCDRIFT-05
**Success Criteria** (what must be TRUE):
  1. Running `scripts/check-doc-drift.cjs` on a clean repo where all numeric claims match live values exits zero
  2. Running the detector after manually editing a claimed test count in CLAUDE.md to an incorrect value produces a drift table row identifying the file, line, claimed value, actual value, and metric name, then exits non-zero
  3. The detector measures at least six metric categories: test count, suite count, line coverage, branch coverage, function coverage, and filesystem-derived counts (agent, command, skill, or hook count)
  4. Running the detector with `--json` outputs machine-readable JSON suitable for programmatic consumption
**Plans**: TBD

### Phase 57: Backfill and CI Integration
**Goal**: Known broken cross-references are repaired and both validator scripts run as blocking CI steps on every PR so documentation drift cannot merge undetected
**Depends on**: Phase 55, Phase 56 (both scripts must exist before CI wiring)
**Requirements**: DOCREF-01, DOCREF-02, DOCCI-01, DOCCI-02, DOCCI-03
**Success Criteria** (what must be TRUE):
  1. A grep across the entire repo finds zero references to `docs/health-reports/full-audit-2026-04-11.md` or `.planning/codebase/STRUCTURE.md` — all have been repaired or removed
  2. The `.github/workflows/test.yml` file contains a dedicated step that runs `scripts/validate-doc-links.cjs` and a dedicated step that runs `scripts/check-doc-drift.cjs`, each as distinct named steps
  3. Opening a PR with a deliberately introduced broken link causes the CI link-validator step to fail and block merge
  4. Opening a PR with a deliberately introduced doc drift causes the CI drift-detector step to fail and block merge
**Plans**: TBD

## Progress

**Execution Order (v2.8):** Phases 55 and 56 are independent and can run in parallel or in either order. Phase 57 depends on both Phases 55 and 56.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 49. One-Command Install | v2.6 | 1/1 | Complete | 2026-04-17 |
| 50. CI Watch | v2.6 | 2/2 | Complete | 2026-04-17 |
| 51. Sync Docs | v2.6 | 1/1 | Complete | 2026-04-18 |
| 52. Checkpoint Engine | v2.7 | 2/2 | Complete    | 2026-04-18 |
| 53. Daily Dashboard | v2.7 | 2/2 | Complete    | 2026-04-18 |
| 54. Automated UAT Runner | v2.7 | 3/3 | Complete   | 2026-04-18 |
| 55. Internal Link Validator | v2.8 | 0/3 | Planned | - |
| 56. Doc Drift Detector | v2.8 | 0/TBD | Not started | - |
| 57. Backfill and CI Integration | v2.8 | 0/TBD | Not started | - |

## Backlog

### Phase 999.1: Documentation Refresh (BACKLOG)

**Goal:** Update CLAUDE.md and README.md to reflect current state — agent counts, test counts, milestone history, and any architectural changes since last doc pass.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
