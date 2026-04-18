# Todo

## Current Status: v2.7 Complete — All milestones through Session Continuity shipped

17 milestones shipped (v1.0 through v2.7). 54 phases executed. PR #9 (docs sync) was the final merge.

- **Tests**: 2,621 passing, 0 failures (529 suites)
- **Coverage**: 91.51% overall, 83.24% branches, 98.01% functions
- **Branch**: `main` (clean)
- **Last commit**: `87a87f4 docs: sync all documentation to post-v2.7 live codebase state (#9)`
- **Tag**: v2.7 (2026-04-18)

## Session Handoff (2026-04-18 — Finalization Phase 4+5: Verify & Docs Sync)

**Branch**: `chore/finalization-phase-2a-agent-fixes` (4 commits ahead of main)
**Commits on branch**: (1) agent quality fixes, (2) backlog triage, (3) ARCHITECTURE.md + repo-map.txt resync, (4) living docs sync

**Completed this session:**
- [x] Phase 4: Full test suite — 2,621/2,621 pass, 0 fail, 529 suites
- [x] Phase 4: Coverage — 91.51% overall, all modules above thresholds, security.cjs at 100%
- [x] Phase 4: Code review of full branch diff — 0 findings at any severity
- [x] Phase 5: Docs sync — README.md (command count fix), DEVOPS-HANDOFF.md (CI/CD section, hook table), PROJECT.md (footer), CHANGELOG.md (finalization entries)
- [x] Phase 5: Verification — all 7 metrics confirmed matching across all docs

**Immediate next actions (before v2.8):**
1. Merge `chore/finalization-phase-2a-agent-fixes` to main
2. `/gsd:new-milestone` for v2.8
3. Optional: evaluate esbuild 0.25→0.28 upgrade

## Open Items

- [x] **Phase 44: Milestone Audit + Docs Sync** — 8/8 REQs audited, CLAUDE.md/README.md/DEVOPS-HANDOFF.md updated
- [x] **Ship v2.3** — shipped 2026-04-15 via PR #49, tagged v2.3 at 75b29cd
- [ ] ~~**Stop-hook sentinel for human-review gates**~~ — deferred to v2.8+, not a finalization blocker. Source: `tasks/lessons.md` 2026-04-10 [Hook Design].
- [ ] ~~**Resume `everything-claude-code-clean` scan**~~ — deferred to v2.8+, not a finalization blocker. Prior recon in `.extraction-staging/FINDINGS.md` (gitignored).

## v2.4 Backlog (inherited)

- [ ] ~~Investigate duplicate v1.0/v1.1 tag pointers on origin~~ — deferred to v2.8+, not a finalization blocker. Repo archaeology, low priority.

Items triaged from the relocated 2026-04-10 agent audit plus pre-ship gate findings. None of these are v2.3 ship blockers; each is a discrete, actionable cleanup.

- [x] **Stop auto-committing `.planning/agent-health.log` across sessions.** Added to .gitignore. Resolved by v2.4 Phase 47.
- [x] docs-sync: add `Bash` tool. Already present in frontmatter. Resolved by v2.4 Phase 47.
- [x] test-runner: update description to reflect current suite count. Updated to "2,600+" in finalization hygiene pass (2026-04-18).
- [x] all three project agents: add `permissionMode: default` to frontmatter. All three have it. Resolved by v2.4 Phase 47.
- [x] all three project agents: replace hardcoded absolute path to project root with relative path or `$CLAUDE_PROJECT_DIR`. All three use portable references. Resolved by v2.4 Phase 47.
- [x] worktree-safe agents: add `isolation: worktree` to agents that may run concurrently with editing agents. All three have it. Resolved by v2.4 Phase 47.
- [x] plugin-developer: add partial-failure guidance — "If hook build fails after source edit, revert the edit and report. Do not leave source in an inconsistent state." Resolved by finalization Phase 2A (2026-04-18).
- [x] docs-sync: add CLAUDE.md governance preservation constraint. Resolved by finalization Phase 2A (2026-04-18).
- [x] all three project agents: add self-referential protection — "Do not modify files in .claude/agents/." Resolved by finalization Phase 2A (2026-04-18).
- [x] Add `// gsd-hook-version: X` headers to all hook source files. All 6 current hooks have headers. Resolved by v2.4 Phase 47.
- [x] Clean up .claude/agents/test-runner.md line 74 parenthetical to distinguish c8 `--lines 70` CLI flag from the project's 80/90/95 agent-level threshold. Resolved by finalization Phase 2A (2026-04-18).
- [x] prompt-injection-scan.sh allowlist updated for relocated hooks-review + REQUIREMENTS.md + agent-threat-model.md. Closed by v2.3 ship CI fix 2026-04-15.
- [ ] ~~Backfill cross-refs to relocated docs~~ — deferred to v2.8+, not a finalization blocker. Applies to docs/health-reports/full-audit-2026-04-11.md and .planning/codebase/STRUCTURE.md when they next touch relocated artifacts.

## Completed (v2.3)

- [x] **Phase 41: Hook Ports** (HOOK-01/02/03) — prompt-injection-guard (18 patterns), config-protection, cost-tracker. 3 hooks, all registered in installer, all tested.
- [x] **Phase 42: Security Guardian** (SEC3-01/02) — gsd-security-guardian agent (10/10 DiD, 6 threat categories) + agent-threat-model reference doc. 2451 tests after.
- [x] **Phase 43: Agent Quality Infrastructure** (QUAL-01/02/03) — 4D scoring rubric (14 criteria, 4 weighted dimensions), three-part necessity gate, two-mode verify (compliance + schema). 2474 tests after.
- [x] Phase 43 artifact gap fixed — 43-VERIFICATION.md and 43-01-SUMMARY.md generated from on-disk deliverables.
- [x] v2.3 milestone setup — PROJECT.md, MILESTONES.md, REQUIREMENTS.md, ROADMAP.md, STATE.md
- [x] lesson-capture-gate.cjs wired into settings.json Stop hooks

## Session Handoff (2026-04-14 — session 15)

**Branch**: `feat/v2.3-phase-41-hook-ports` (clean)

**Session actions:**
1. Cross-project dependency audit of all 15 dirs under `/Users/cpconnor/projects/`
2. Produced `/Users/cpconnor/projects/_audit/dependency-map.md` (28 edges, 22 hard, 10 stale targets)
3. Produced `/Users/cpconnor/projects/_audit/dependency-graph.json` (machine-readable graph)
4. Decoupled `~/.claude/settings.json:198` from GSD repo — copied `lesson-capture-gate.cjs` to `~/.claude/hooks/`, updated path (verified: exit 0, diff clean)
5. Added drift-prevention rule to `~/.claude/CLAUDE.md`
6. Documented `local-plugin-marketplace` symlink — created README.md explaining source-of-truth relationship

**Next:**
1. Pete reviews diff: `git diff main...HEAD` — v2.3 PR still pending
2. `/gsd:ship` to create PR for v2.3
3. After merge: `/gsd:complete-milestone` for v2.3 archival
4. Remaining audit items (future session): Risk #1 (pete-content-factory archived MindMeld1.2 deps), Risk #3 (connor-innovate-platform marketplace.json absolute paths), Risk #5 (dead launcher scripts), 2 stale permission rules in `~/.claude/settings.local.json`

---

## Completed (prior milestones — reference)

- [x] v2.2 Security Hardening — PR #47 (code) + PR #48 (audit), shipped 2026-04-13
- [x] v2.1 System Audit & Debt Closure — 5 phases, shipped 2026-04-10
- [x] v2.0 Intelligence Layer — 4 phases, shipped 2026-04-05
- [x] v1.0-v1.9 — 13 milestones shipped across 40 phases

## Notes

- `.planning/v2.2-MILESTONE-AUDIT.md` notes that v2.2 bypassed standard discuss → plan → execute (no PLAN.md/VERIFICATION.md). Audit verified against REQUIREMENTS.md directly.
- HANDOFF.json is stale (from session 13 pause) — todo.md is authoritative for session 14.
