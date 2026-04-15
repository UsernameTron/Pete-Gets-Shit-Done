# Todo

## Current Status: v2.3 Complete — Awaiting Pete's Review Before Ship

All 4 phases (41-44) complete. All 8 requirements satisfied and audited. Living docs updated. Stopped before /gsd:ship per Pete's instruction.

- **Tests**: 2474 passing, 0 failures
- **Coverage**: 90.41% overall, no module below 80%, security 100%
- **Branch**: `feat/v2.3-phase-41-hook-ports` (clean)
- **Last commit**: `5d60336 docs(43): add missing VERIFICATION.md and SUMMARY.md`

## Open Items

- [x] **Phase 44: Milestone Audit + Docs Sync** — 8/8 REQs audited, CLAUDE.md/README.md/DEVOPS-HANDOFF.md updated
- [x] **Ship v2.3** — shipped 2026-04-15 via PR #49, tagged v2.3 at 75b29cd
- [ ] **Stop-hook sentinel for human-review gates** — add `.planning/.review-pending` sentinel to uncommitted-files Stop hook. Source: `tasks/lessons.md` 2026-04-10 [Hook Design].
- [ ] **Resume `everything-claude-code-clean` scan** — 4 areas pending (hooks, commands, agents, skills). Prior recon in `.extraction-staging/FINDINGS.md` (gitignored).

## v2.4 Backlog (inherited)

- [ ] Investigate duplicate v1.0/v1.1 tag pointers on origin — both point at `62470189` (the "Initial commit"). Local ffee68d variants were deleted and aligned to origin on 2026-04-15. Either one of the tags belongs on a different ship commit, or the repo was re-created at some point and both tags got stamped on the initial commit by the rebuild. Low priority — repo archaeology.

Items triaged from the relocated 2026-04-10 agent audit plus pre-ship gate findings. None of these are v2.3 ship blockers; each is a discrete, actionable cleanup.

- [ ] **Stop auto-committing `.planning/agent-health.log` across sessions.** Hook writes to a tracked path — either add the file to `.gitignore` or redirect the hook to a non-tracked location. Observed surfacing in stashes @{0}/@{1} and `chore/session-16-wrap` auto-creation during v2.3 ship/archival on 2026-04-15.
- [ ] docs-sync: add `Bash` tool OR rewrite workflow steps 2-3 to use Glob/Grep equivalents. Recommendation: add Bash (commands are read-only and low-risk). Source: agent audit P1 #2.
- [ ] test-runner: update description to reflect current suite count (currently says 295+, actual is 2474). Use "2400+" or specific. Source: agent audit P1 #3.
- [ ] all three project agents: add `permissionMode: default` to frontmatter. Source: agent audit P1 #4.
- [ ] all three project agents: replace hardcoded absolute path to project root with relative path or `$CLAUDE_PROJECT_DIR`. Source: agent audit P2 #5.
- [ ] worktree-safe agents: add `isolation: worktree` to agents that may run concurrently with editing agents. Tradeoff: ~2s overhead per invocation. Source: agent audit P2 #6.
- [ ] plugin-developer: add partial-failure guidance — "If hook build fails after source edit, revert the edit and report. Do not leave source in an inconsistent state." Source: agent audit P2 #7.
- [ ] docs-sync: add CLAUDE.md governance preservation constraint. Source: agent audit P2 #8.
- [ ] all three project agents: add self-referential protection — "Do not modify files in .claude/agents/." Source: agent audit P2 #9.
- [ ] Add `// gsd-hook-version: X` headers to all 7 hook source files. Closes security-review finding #1 (deferred). Source: `.planning/research/security-reviews/2026-04-13-v2.3-closure-delta.md`.
- [ ] Clean up .claude/agents/test-runner.md line 74 parenthetical to distinguish c8 `--lines 70` CLI flag from the project's 80/90/95 agent-level threshold. Cosmetic doc drift only — the thresholds themselves at lines 76-79 and completion criteria at line 112 are already correct. Source: Gate 1 misread resolution 2026-04-15.
- [x] prompt-injection-scan.sh allowlist updated for relocated hooks-review + REQUIREMENTS.md + agent-threat-model.md. Closed by v2.3 ship CI fix 2026-04-15.
- [ ] Backfill cross-refs to relocated docs in docs/health-reports/full-audit-2026-04-11.md and .planning/codebase/STRUCTURE.md once those files next touch the relocated artifacts. Source: Gate 4 no-op substitution 2026-04-15.

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
