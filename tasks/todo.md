# Todo

## Current Status: v2.8 Archived — Ready for v2.9

18 milestones shipped (v1.0 through v2.8). 57 phases executed. 15 phase directories archived (12 prior + 3 from v2.8). Branch protection on main now enforces 5 required status checks (3 test matrix + governance + docs-integrity).

- **Tests**: 2,845 passing, 0 failures (563 suites)
- **Coverage**: 91.63% lines (local) / 91.69% (CI ubuntu-22), 83.47% branches, 97.22% functions
- **Branch**: `main` clean, healthy (`/gsd:health` returns `healthy`)
- **Tag**: v2.8 (2026-05-08)

## Deferred Items (v2.9+ candidates)

- [ ] Stop-hook sentinel for human-review gates — source: `tasks/lessons.md` 2026-04-10 [Hook Design]
- [ ] Resume `everything-claude-code-clean` scan — prior recon in `.extraction-staging/FINDINGS.md` (gitignored)
- [ ] Investigate duplicate v1.0/v1.1 tag pointers on origin — repo archaeology, low priority
- [ ] `npm audit --audit-level=moderate` step in test.yml
- [ ] Make coverage blocking in ci-coverage-report.sh:68
- [ ] CI-time agent health check with blocking exit
- [ ] esbuild 0.25 → 0.28 upgrade (audit-deps FLAG — non-blocking, no CVEs)
- [ ] Migrate legacy `paused_at` regex extraction in `init.cjs:1274` to use `extractFrontmatter`
- [ ] PR-required protection gap closure — direct pushes to main currently bypass CI gates entirely. Plan at `~/.claude/plans/explain-what-this-is-pure-gadget.md`. Single API call to add `required_pull_request_reviews` with `required_approving_review_count: 0`.
- [ ] Backfill Nyquist VALIDATION.md for v2.8 phases (55, 56, 57 currently `nyquist_compliant: false` or missing). Optional `/gsd:validate-phase {N}`.
- [ ] Address audit-agents description-trigger gaps on 3 unified agents (gsd-research-orchestrator, gsd-validator-hub, gsd-verifier — descriptions don't name their invokers, impacts routing clarity).
- [ ] Investigate stashed README.md mutation (`stash@{0}` — 1,432 → 12-line "Tracks (cloned snapshot)" stub from a different project, looks like cross-project working-tree bleed-through).
- [ ] Standardize Phase verification: ensure every shipped phase has both `*-VERIFICATION.md` and `*-VALIDATION.md` (Phase 57 lacks separate VERIFICATION.md — verification was embedded in 57-03-SUMMARY.md).

## Completed

- [x] v2.8 Documentation Integrity shipped + archived + tagged (2026-05-08) — PRs #22, #23, #24, #25
- [x] Backfill cross-refs to relocated docs (`docs/health-reports/full-audit-2026-04-11.md`, `.planning/codebase/STRUCTURE.md`) — Phase 57-01 closure-via-clarification per D-03 (2026-05-08)
- [x] Internal doc link validator script + CI step — Phase 55 + Phase 57-03 (2026-05-08)
- [x] Doc drift detector script + CI step — Phase 56 + Phase 57-03 (2026-05-08)
- [x] Branch protection grew 4 → 5 required status checks (`docs-integrity` added via contexts-subresource POST) (2026-05-08)
- [x] Drift detector epsilon widened 0.01 → 0.1 to absorb cross-OS c8 variance (2026-05-08)
- [x] Workflow exclude list switched to globs (`v*-phases/**`, `v*-REQUIREMENTS.md`) — auto-handles future archives (2026-05-08)
- [x] Stale Phase 999.1 backlog cruft removed — fixes W006 health warning (PR #26, 2026-05-08)
- [x] superpowers plugin uninstalled — GSD primacy codified in ~/.claude/CLAUDE.md (2026-05-07)
- [x] Karpathy attribution + collision-resolution added to ~/projects/CLAUDE.md (2026-05-07)
- [x] Test counts refreshed across 3 living docs (2,644→2,667, 533→536) — PR #20 (2026-05-07)
- [x] state_status + paused_at added to gsd-tools.cjs init milestone-op — PR #19 (2026-05-07)
- [x] /gsd:closeout meta-orchestrator command shipped — PR #17 (2026-05-07)
- [x] Stash list cleared — 3 obsolete stashes dropped, 1 valid handoff update popped (2026-05-07)
- [x] Project finalized via /gsd:finalize (2026-04-24)
- [x] Phase directories archived (12 dirs + 1 file to milestone archives, 2026-04-24)
- [x] GitHub repository security hardened (2026-04-18)
- [x] v2.7 Session Continuity shipped (2026-04-18)
- [x] v2.6 Developer Experience shipped (2026-04-18)
- [x] v2.5 Final Documentation Sync shipped (2026-04-17)
- [x] v2.4 Foundation Hardening shipped (2026-04-17)
- [x] v2.3 Hook Ecosystem + Security Guardian + Agent Quality shipped (2026-04-15)
- [x] v2.2 Security Hardening shipped (2026-04-13)
- [x] v2.1 System Audit & Debt Closure shipped (2026-04-10)
- [x] v2.0 Intelligence Layer shipped (2026-04-05)
- [x] v1.0-v1.9 — 13 milestones shipped across 40 phases

## Session Handoff (2026-05-07 — Closeout shipped, GSD primacy codified, superpowers uninstalled)

**Branch**: `main` (clean) — 4 PRs merged this session

**Shipped:**
- **PR #17 (a824914)** — feat: `/gsd:closeout` meta-orchestrator. 9-gate command (orient → audit → verify → capture → ship-or-freeze → finalize → polish). Defers to `/gsd:finalize` at Gate 7. 3 files / +941 lines / 19 new tests.
- **PR #18 (b3dbd84)** — docs: refresh todo.md handoff text + capture stash-cleanup notes
- **PR #19 (bf10008)** — chore: add `state_status` + `paused_at` fields to `gsd-tools.cjs init milestone-op` (sourced from STATE.md frontmatter via `extractFrontmatter`). +12 lib lines, +49 test lines, 4 new assertions. Caught during /gsd:closeout's first integration UAT.
- **PR #20 (b590634)** — chore: refresh stale test counts (2,644→2,667, 533→536) across CLAUDE.md, README.md, DEVOPS-HANDOFF.md

**User-config changes (not git-tracked):**
- `~/.claude/CLAUDE.md` — added "Workflow Authority" section codifying GSD primacy with 12-row routing table mapping each overlapping superpowers skill to its GSD or skill-forge equivalent
- `~/projects/CLAUDE.md` — added Karpathy attribution + 3-tension collision-resolution section (surgical edit, content already correct)
- Plugin: `claude plugin uninstall superpowers@claude-plugins-official` (full uninstall, Path B)

**Stash list maintenance:** 4 stashes inspected, 3 dropped as obsolete (Phase 54 STATE update, redundant v27 plan, v2.4-era audit), 1 popped as legitimate handoff refresh.

**Tests:** 2,667 passing / 536 suites / 0 failures. Coverage holds at 91.23% line / 83.01% branch / 97.41% function.

**Loaded skills:** ~150 → ~136 (14 superpowers skills removed).

**Next:**
1. `/gsd:new-milestone v2.8` — earlier invocation paused this session waiting for "what to build" answer
2. Triage 10 Deferred Items as v2.8 phase candidates — 3 natural clusters:
   - CI hardening (Stop-hook sentinel, npm audit, blocking coverage, agent health check)
   - Docs integrity (link validator, cross-ref backfill)
   - Maintenance (esbuild upgrade, ECC scan, tag archaeology, legacy paused_at regex migration)
3. `/gsd:closeout` should get a full integration run (not just Gate 0 fast-exit) once v2.8 has a real milestone to close out

---

## Session Handoff (2026-04-24 — CI Fix + PR Merge)

**Branch**: `main` (clean, up to date)

**Session actions:**
1. Committed allowlist fix for `scripts/prompt-injection-scan.sh` (milestone archive dirs)
2. Pushed to `chore/dream-consolidation-wrap` — triggered CI rerun
3. All 9 status checks passed (Tests, Security Scan, CodeQL, governance, GitGuardian)
4. Merged PR #16, branch deleted, main updated to d8235ba

**Next:**
1. `/gsd:new-milestone` for v2.8
2. Triage deferred items list above as v2.8 phase candidates

---

## Session Handoff (2026-05-11 — harden-repo coverage shipped)

**Branch**: `main` (clean, includes PR #28 squash merge `be46ae2`)

**Session actions:**
1. /gsd:prime-patterns boot — 5 KB v2.1 patterns loaded (6, 7, 10, 11, 12)
2. /subagent-companion status check — 3 deployed specialists healthy
3. Started chore/test-runner-description-drift; abandoned after operator-intent revert on main
4. Full validation flagged harden-repo.cjs below 80% per-module floor (77.17%)
5. Added 16 pure-function tests + exposed `applyFix`/`formatGapTable` exports — coverage 77.17% → 83.33%
6. /gsd:ship created PR #28
7. /gsd:ci-watch caught docs-integrity drift on first run; fixed inline in commit 1e868fc
8. CI all-green on retry (10/10); Pete merged PR #28 + deleted remote branch
9. Captured 2026-05-11 [Pre-Push Validation / Drift] lesson

**Tests:** 2,861 passing / 566 suites / 0 failures. Coverage 91.82% line / 83.54% branch / 97.61% function (CI ubuntu/22).

**Loose ends:**
- 4 uncovered ranges in harden-repo.cjs (readProtection, extractEnabled non-object, applyFix non-dry-run, cmdHardenRepo fix path) all require gh stub or live API — deferred as v2.9 candidate work.

**Next:**
1. Either `/gsd:new-milestone` to start v2.9, or pick one deferred backlog item as a standalone chore
2. v2.9 phase candidates (from prior wrap notes still applicable):
   - **CI hardening** — Stop-hook sentinel for review-pending state, blocking coverage gate, agent health check, npm audit step
   - **Maintenance** — esbuild upgrade, ECC scan, tag archaeology, legacy paused_at regex migration to extractFrontmatter
   - **Test infrastructure** — `execGh` injection + gh-mocked tests for the 4 deferred harden-repo ranges
