# Todo

## Current Status: v2.7 Archived — Ready for v2.8

17 milestones shipped (v1.0 through v2.7). 54 phases executed. 12 phase directories archived.

- **Tests**: 2,644 passing, 0 failures (533 suites)
- **Coverage**: 91.23% lines, 83.02% branches, 97.41% functions
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

- [x] /gsd:closeout meta-orchestrator command shipped (2026-05-07, PR #17)
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

## Session Handoff (2026-05-07 — Closeout Command Shipped)

**Branch**: `main` (clean after commit)

**Session actions:**
1. Designed `/gsd:closeout` — comprehensive project closeout meta-orchestrator (orient → audit → verify → capture → ship-or-freeze → finalize → polish)
2. Built thin-shell command + 9-gate workflow + 19 structural tests
3. Defers to `/gsd:finalize` at Gate 7; finalize unchanged
4. PR #17 created, all 9 CI checks passed, squash-merged as `a824914`
5. Stash list reviewed — dropped 3 obsolete stashes (v2.4-era audit, Phase 54 STATE update, redundant v27 plan), popped 1 legitimate todo.md handoff refresh

**Files added (PR #17):**
- `commands/gsd/closeout.md` — 50-line thin-shell
- `get-shit-done/workflows/closeout.md` — 645-line orchestration body
- `tests/closeout.test.cjs` — 244 lines, 19 assertions

**Tests:** 2,663 passing, 536 suites, 0 failures (added 19 new).

**Next:**
1. `/gsd:new-milestone` for v2.8
2. Triage Deferred Items as v2.8 phase candidates (3 natural clusters: CI hardening, doc link integrity, dependency maintenance)
3. `/gsd:closeout` should get a real integration run once v2.8 has a milestone to close out

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
