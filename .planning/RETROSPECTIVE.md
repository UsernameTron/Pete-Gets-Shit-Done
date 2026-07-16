# Retrospective

## v3.0 Milestone-Close Hardening (2026-07-16)

**Shipped:** 2026-07-16 | **Phases:** 2 (60-61) | **Plans:** 2 | **PRs:** #60, #61 | **Window:** ~7h wall (2026-07-15 18:01 → 2026-07-16 00:44)

### What Was Built
- Protected-main merge path: complete-milestone detects `main` branch protection and closes out via CI-gated PR (push → PR → checks --watch → squash-merge → branch cleanup → main sync); local squash path preserved verbatim; ship-milestone inherits by delegation. 13 contract tests.
- Versioned hook registration: declarative registry of all 8 shipped hook sources (version === package.json) + filesystem-derived contract test (4 groups, 7 tests) — a hook shipping unregistered now fails CI instead of silently losing the runtime safety net on fresh clones.

### What Worked
- Tight operator-set scope ("the two items with teeth only") made both phases single-plan and fully autonomous — no checkpoints fired.
- TDD RED→GREEN on Phase 61: the contract test written first caught the exact template shape needed; verifier empirically proved drift detection by renaming a source.
- The Phase 60 deliverable was exercised for real within hours — this very close-out merged through PRs against protected main.

### What Was Inefficient
- Executor agent stalled twice at turn boundaries on Phase 61 (after writing the test; after doc-sync); orchestrator resumed once, then finished SUMMARY/state bookkeeping inline. Cost: ~2 extra resume round-trips.
- `gsd-tools` state rewrites (begin-phase, state update, phase complete, milestone complete) stamped stale v2.9 milestone frontmatter into STATE.md four times — hand-corrected each time. Root cause: milestone derivation reads a stale source instead of live ROADMAP/STATE. Needs a fix.
- Verifier's report was written inside its auto-cleaned worktree and lost (gitignored path → worktree looked unchanged); orchestrator re-persisted it from the agent's return message. Worktree isolation + gitignored artifacts is a sharp edge.

### Patterns Established
- Declarative registries under `governance/templates/` carry a version marker pinned to package.json — stamped literal, not build placeholder — so every version bump forces a registry review.
- Contract tests derive expected sets from the filesystem (`readdirSync`), never hardcoded counts: new artifacts fail the gate by default.
- Installer behavior tested by running the real `install()` in an isolated child process (GSD_TEST_MODE, JSON-on-stdout) because it calls `process.exit(1)` on failure.

### Key Lessons
- Milestone-close automation must assume protected main from the start; the v2.9 manual workaround is now codified and test-locked.
- Adjacent work rides the window: PR #62 (data-loss/injection remediation, parallel session) landed between Phase-61 merge and close-out — record it, don't fold it into milestone scope.
- No formal `/gsd:audit-milestone` was run (2-phase scope, both individually verified, operator-directed close) — acceptable here, but the skipped-audit note belongs in MILESTONES.md, and it is there.



**Shipped:** 2026-05-08
**Phases:** 3 (55-57) | **Plans:** 9 | **Requirements:** 14/14 satisfied

### What Was Built

- **Internal Link Validator** (`scripts/validate-doc-links.cjs`, 97.36% line coverage): TDD-built scanner of tracked .md files for broken relative-path and anchor refs; gitignore-style `--exclude <glob>` flag (multi-value); structured table output; `--json` flag.
- **Doc Drift Detector** (`scripts/check-doc-drift.cjs`, 98.28% line coverage): Compares 23 numeric claims (test count, suite count, line/branch/function coverage, agent/command/skill/hook counts) across CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md against c8/filesystem-derived live measurements; 0.1% epsilon for percentage comparisons (cross-OS-tolerant).
- **CI integration**: `docs-integrity` job (parallel with `test` and `governance`) runs link validator with 5-path canonical exempt list; `Check documentation drift` step inside test job runs detector single-leg (ubuntu/22, `full_suite=true`). Both gates strict-block on non-zero exit.
- **Cross-reference backfill**: 109 → 10 broken doc cross-refs (99 fixes); DOCREF-01/02 closed via validator-evidence clarification.

### What Worked

- **Cross-AI review caught real issues pre-execution.** Phase 57 review (Gemini + Codex) produced REVIEWS.md with 4 must-fix + 5 should-fix edits; replanning via `--reviews` flag landed before any code touched the workflow file.
- **Independent-validators decomposition was the right call.** Two scripts with separate concerns (path resolution vs numeric measurement) and separate test suites composed cleanly. Single-leg gating for drift, multi-leg for links — different decisions per validator, no awkward shared abstraction.
- **Trust-reality-over-spec saved the milestone.** Two pre-merge corrections caught at ship time: (1) the documented PATCH command had wrong matrix-tuple check names (would have eternally pended every PR); (2) drift epsilon at 0.01% would have failed every PR due to cross-OS c8 variance. Lesson 2026-04-09 [Spec vs Reality] applied twice in one session.
- **PR-first flow with branch protection caught a near-miss.** 15 commits had landed on local main directly; the closeout flow detected this, rerouted them onto a feature branch, and the standard PR mechanism + new docs-integrity gate caught both issues above. Worth the 30s overhead per commit batch.

### What Was Inefficient

- **Phase 57 lacks separate VERIFICATION.md.** Verification evidence lives inline in 57-03-SUMMARY.md (validator outputs, CI green status, branch-protection read-back). Functionally fine; bookkeeping debt that audit-milestone flagged.
- **The originally-documented operator PATCH command was wrong.** The spec was authored from memory rather than from a live `gh api` read-back. Lesson now in `tasks/lessons.md` (2026-05-08 [Spec vs Reality / Status Checks]) — verify branch-protection check names via API before authoring PATCHes.
- **REQUIREMENTS.md traceability table fell behind shipped work.** DOCREF-01/02 + DOCCI-01..03 stayed marked `[ ]` and "Pending" until the milestone audit caught them.

### Patterns Established

- **Drift gates need OS-tolerant epsilon by default.** Cross-platform c8 variance is real (~0.06% on ~23k statements). Default percentage-comparison epsilon is now 0.1% with per-claim override available. Documented in `compareClaim` JSDoc.
- **Branch protection PATCH uses subresource POST, not parent PATCH.** Surgical add via `POST /required_status_checks/contexts` preserves all other settings. The parent endpoint only accepts PUT (full replace).
- **Pre-merge correction commits land on the feature branch, not on the merged squash.** Caught issues this milestone landed in commits 5588c2f and fff42db on `feat/phase-57-backfill-and-ci-integration` BEFORE merge.

### Key Lessons

- **Verify operator-facing commands against live state before shipping the spec.** A 30-second `gh api repos/.../branches/main/protection -q '.required_status_checks.contexts'` would have caught the wrong PATCH command at planning time.
- **Cross-OS test variance is a first-class design constraint for drift gates, not a flake.** Widen epsilon to absorb it, with per-claim overrides where strictness matters.
- **Track audit FLAGs as "acked + reason" not just "acked".** `.planning/state/closeout-acks.md` captures why each FLAG was non-blocking.

### Cost Observations

- Model mix: ~95% Opus 4.7 1M context (heavy lifting in closeout), small Haiku usage for measurement helpers
- Sessions: 3 (PR #22 ship, PR #23 ship + closeout, PR #24 state cleanup)
- Notable: real-time CI watching via `gh pr checks --watch` substantially faster than polling `gh run list` manually

---

## v2.6 Developer Experience (2026-04-18)

### What Was Built

- **One-command install** (`bin/setup-from-clone.js`, 342 lines): Orchestrates npm install, hook build, Claude installer, injection-patterns copy with mtime-based idempotency and a UAT-style verification table.
- **CI Watch** (`commands/gsd/ci-watch.md`, 402 lines): Real-time GitHub Actions polling with configurable interval, failure log fetching, and fix suggestions from a 6-pattern diagnostic library (`lib/ci-patterns.json`).
- **Sync Docs** (`commands/gsd/sync-docs.md`, 421 lines): Automated documentation sync across README.md, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF.md, and CHANGELOG.md from live codebase state.

### What Worked Well

- **Three-PR shipping model**: Phase 49 shipped independently (PR #3), then Phases 50-51 shipped together (PR #4). This kept PRs reviewable and allowed independent CI validation.
- **Combined UAT**: Running UAT across all 3 phases at once (9/9 tests) was more efficient than per-phase UAT for this milestone size.
- **Inline workflow pattern**: ci-watch and sync-docs both use the inline workflow pattern (skill file contains the full workflow) rather than separate lib modules. This kept the codebase simple for DX commands that orchestrate existing tools.

### What Was Inefficient

- **REQUIREMENTS.md checkbox drift (again)**: All 18 requirements remained "Pending" in the traceability table despite all work being complete. This is the third milestone (v1.1, v2.1, v2.6) with the same issue. The execute-phase workflow does not update REQUIREMENTS.md as tasks complete.
- **Phase 49 roadmap status stale**: ROADMAP.md showed Phase 49 as "Not started" and "0/?" plans even after PR #3 merged. The roadmap analyze tool reported Phase 49 as "partial" because it has 2 plan files but only 1 summary (Plan 02 was folded into Plan 01 during execution).

### Patterns Established

- **Inline workflow for DX commands**: Commands that orchestrate existing tools (gh, git, npm) work well as inline skill workflows rather than requiring new lib modules.
- **Pattern library for diagnostics**: `lib/ci-patterns.json` provides a declarative, extensible approach to failure diagnosis — add new patterns without changing code.

### Key Metrics

| Metric | Before v2.6 | After v2.6 |
|--------|-------------|------------|
| Test suites | 479 | 479 (no regression) |
| Assertions | 2,490 | 2,561 |
| Coverage | 90.79% | 90.79% (maintained) |
| GSD commands | 63 | 65 (+ci-watch, +sync-docs) |
| Milestones shipped | 15 | 16 |
| Total phases | 48 | 51 |
| Requirements shipped (cumulative) | ~130 | 148 (18 new) |

---

## v2.5 Final Documentation Sync (2026-04-17)

### What Was Built

- **Agent hygiene**: 10 agents upgraded with explicit frontmatter (model, permissionMode, maxTurns, isolation) following validator-hub gold standard pattern.
- **New capability**: `gsd-dependency-auditor` agent and `/gsd:audit-deps` command for package security auditing across 6 ecosystems.
- **CI/CD pipeline**: GitHub Actions workflow for Node 20+22 on Ubuntu and macOS, with 5 rounds of CI fixes (SHA pins, EXDEV fallbacks, matrix trimming).
- **Documentation alignment**: All 5 living documents (README, CLAUDE.md, DEVOPS-HANDOFF, PROJECT.md, CHANGELOG) aligned to verified counts. Project enters maintenance mode.

### What Worked Well

- **UAT caught real issues**: 4 of 6 tests found stale counts that automated verification missed. The conversational UAT format made it easy to spot-check documents against reality.
- **Inline fix during UAT**: Fixing issues as they were found (rather than batching into gap closure plans) was efficient for docs-only work.

### What Was Inefficient

- **Phase 48-01 executor checked wrong README**: The executor verified the inner repo's README (Petes-Get-Shit-Done-Coding-Automation/) but missed the outer repo's README.md which had stale counts. Root cause: two-repo structure created ambiguity about which files to check.
- **CHANGELOG.md assumed new file**: Plan 48-03 assumed CHANGELOG.md needed creation, but it already existed with extensive history. Executor adapted correctly but the plan was inaccurate.

### Patterns Established

- **Inner repo archival**: Petes-Get-Shit-Done-Coding-Automation is archived and being removed. Future work should reference only the outer Pete-Gets-Shit-Done repo.
- **Maintenance mode closure**: When all requirements are satisfied, replace active requirements with a maintenance mode notice rather than leaving an empty section.

### Key Metrics

| Metric | Before v2.5 | After v2.5 |
|--------|-------------|------------|
| Agents | 18 (incorrect) | 17 (verified) |
| Test suites | 479 | 479 (no regression) |
| Coverage | 90.79% | 90.79% (maintained) |
| Milestones shipped | 14 | 15 |
| Total phases | 47 | 48 |

---

## v2.1 System Audit & Debt Closure (2026-04-10)

### What Was Built

- **Debt closure**: Backfilled 3 missing SUMMARY.md files for Phase 6, replaced deprecated agent references in global CLAUDE.md files, created Nyquist VALIDATION.md for v1.2 milestone.
- **Confirmation audit**: Verified all 15 GSD agents have tier labels matching tool grants (DEBT-01/INT-01) and gsd-validator-hub is reachable via ship workflow (DEBT-04/INT-02).
- **System component audit**: 4-dimension validation of 15 agents (YAML, tiers, quality sections, stale refs), 61 command routing reachability check, 16 hook configuration validation.
- **Coverage verification**: Closed gaps in 6 library modules and install.js, achieving 90.41% overall with all modules >= 80% and security at 100%.
- **Documentation accuracy**: Updated CLAUDE.md, README.md, DEVOPS-HANDOFF.md with current metrics and removed all stale references.

### What Worked Well

- **Rapid execution**: All 5 phases planned and executed in a single day (2026-04-09), with 8 plans across 10 requirements.
- **Audit-as-verification**: The audit phases double as both verification and documentation — the audit reports themselves become the evidence trail.
- **GSD pipeline maturity**: discuss -> plan -> execute -> verify cycle is now reliable enough for an entire audit milestone to run smoothly.

### What Was Inefficient

- **Phase 37/38 artifact gaps**: Phase 37 was missing a phase-level VERIFICATION.md (only had PLAN-VERIFICATION) and Phase 38 had no phase directory at all. Both were backfilled during milestone audit. Root cause: fast execution in later phases skipped artifact creation. Fix: verify-work should enforce VERIFICATION.md creation as a gate.
- **REQUIREMENTS.md drift**: AUDIT-06 and AUDIT-07 remained unchecked/Pending despite work being complete. Similar to v1.1 checkbox drift. Fix: execute-phase should update REQUIREMENTS.md traceability table as tasks complete.

### Patterns Established

- **Audit milestone pattern**: A milestone dedicated to validating prior work is a legitimate and valuable milestone class. It catches tracking gaps, confirms cross-phase integration, and produces an evidence trail.
- **3-source cross-reference**: Checking VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability together catches gaps that any single source would miss.
- **Nyquist exemption pattern**: Audit/docs milestones with no research phases can legitimately skip Nyquist VALIDATION.md without penalty.

### Key Metrics

| Metric | Before v2.1 | After v2.1 |
|--------|-------------|------------|
| Total tests | 2377 | 2377 (no regression) |
| Overall coverage | ~90% | 90.41% (verified) |
| Agents validated | 0 (assumed correct) | 15/15 confirmed |
| Commands verified reachable | 0 (assumed correct) | 61/61 confirmed |
| Hooks validated | 0 (assumed correct) | 16/16 confirmed |
| Requirements shipped (cumulative) | 109 (v1.0-v2.0) | 119 (v1.0-v2.1) |

---

## v1.1 Testing & Hardening (2026-03-26)

### What Was Built

- **Coverage infrastructure**: c8 instrumentation expanded from 17 lib modules to 25 source files across lib, hooks, gsd-tools, bin/install.js, and scripts. Gap analysis with 3-tier priority ranking (security > operational > utility).
- **76 new unit tests**: Governance scripts (scaffold, health-check, install-plugins), plugin integration (loading, routing, skill resolution), hook behavior (lifecycle events, matchers, exit codes), and uncovered command handlers (cmdCommitToSubrepo).
- **39 integration tests**: End-to-end CLI flow (command chain + state progression), governance hook enforcement (advisory output + template wiring), plugin ecosystem coherence (cross-plugin uniqueness + reference integrity).
- **CI hardening**: base64-scan.sh timeout fix with size cap, coverage reporting via ci-coverage-report.sh (advisory 80% threshold), cross-platform matrix (Linux/macOS/Windows, Node 18+20+22).

### What Worked Well

- **Wave-based parallel execution**: Plans within each phase executed in parallel waves, keeping total execution time short despite 11 plans.
- **Worktree isolation**: Each subagent worked in its own git worktree, preventing conflicts during parallel execution.
- **UAT-first verification**: `/gsd:verify-work` caught issues (like REQUIREMENTS.md checkbox inconsistencies) before shipping.
- **Single-day delivery**: All 4 phases planned and executed in a single session day (2026-03-26), demonstrating the GSD pipeline's throughput.
- **CI-first debugging**: When CI failed (prompt-injection-scan flagging test fixtures), the fix was surgical -- allowlist the test file, not disable the scanner.

### What Was Inefficient

- **REQUIREMENTS.md checkbox drift**: Worktree-based execution updated tests but didn't update REQUIREMENTS.md checkboxes. Had to fix 7 checkboxes manually before archival. Fix: ensure verify-work updates requirement status as part of its pass.
- **SUMMARY.md files created in worktrees**: Phase 3 and 5 SUMMARY.md files were created in worktrees that got cleaned up. Not blocking but left documentation gaps.
- **Context window pressure**: Milestone completion workflow spans many steps; had to continue across context windows. The workflow could benefit from more CLI automation (gsd-tools handled archival well).

### Patterns Established

- **Security scan allowlist pattern**: Test files containing literal injection/secret patterns are allowlisted by filename in the scanner scripts, not by disabling scans.
- **Windows compatibility pattern**: Tests that override `HOME` must also set `USERPROFILE` for Node.js `os.homedir()` on Windows.
- **Advisory coverage thresholds**: 80% coverage threshold warns but never fails the build -- enforcement deferred until coverage is consistently above threshold.
- **Coverage report single-runner**: Coverage reports run on one matrix combination (Linux Node 22) to avoid duplicate uploads.

### Key Metrics

| Metric | Before v1.1 | After v1.1 |
|--------|-------------|------------|
| Total tests | 1,547 | 1,662 |
| New tests added | -- | 115 (76 unit + 39 integration) |
| Source files instrumented | 17 | 25 |
| Line coverage | ~65% | 85%+ |
| Branch coverage | ~55% | 77%+ |
| CI platforms | Linux only | Linux + macOS + Windows |
| Plans executed | 3 (v1.0) | 11 (v1.1) |

---
*Last updated: 2026-04-18*
