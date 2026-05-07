# Todo

## Current Status: v2.7 Archived — Ready for v2.8

17 milestones shipped (v1.0 through v2.7). 54 phases executed. 12 phase directories archived.

- **Tests**: 2,667 passing, 0 failures (536 suites)
- **Coverage**: 91.23% lines, 83.01% branches, 97.41% functions
- **Branch**: `main`
- **Tag**: v2.7 (2026-04-18)

## Deferred Items (v2.8+ candidates)

- [ ] Stop-hook sentinel for human-review gates — source: `tasks/lessons.md` 2026-04-10 [Hook Design]
- [ ] Resume `everything-claude-code-clean` scan — prior recon in `.extraction-staging/FINDINGS.md` (gitignored)
- [ ] Investigate duplicate v1.0/v1.1 tag pointers on origin — repo archaeology, low priority
- [ ] Backfill cross-refs to relocated docs — applies to `docs/health-reports/full-audit-2026-04-11.md` and `.planning/codebase/STRUCTURE.md`
- [ ] `npm audit --audit-level=moderate` step in test.yml
- [ ] Make coverage blocking in ci-coverage-report.sh:68
- [ ] CI-time agent health check with blocking exit
- [ ] Internal doc link validator script + CI step
- [ ] esbuild 0.25 to 0.28 upgrade
- [ ] Migrate legacy `paused_at` regex extraction in `init.cjs:1274` to use `extractFrontmatter` (currently uses markdown body string-match, fragile)

## Completed

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
