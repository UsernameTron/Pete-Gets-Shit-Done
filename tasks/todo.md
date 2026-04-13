# Todo

## Current Status: v2.2 Shipped — Between Milestones

v2.2 Security Hardening merged and audited (PR #47 merged 2026-04-12; audit PR #48 merged 2026-04-13, verdict: passed). All 4 findings (SEC2-01 through SEC2-04) resolved. Main is clean; no branches in flight.

- **Tests**: 2408 passing (baseline post-v2.2)
- **Coverage**: 90.41% overall
- **Branch**: `main` (clean)
- **Last commit**: `fc55c96 chore(planning): reconcile todo.md and refresh crew assessment`

## Open Items

- [ ] **Stop-hook sentinel for human-review gates** — add `.planning/.review-pending` sentinel (or env flag) to the uncommitted-files Stop hook so prompts containing "do not commit yet" don't force a commit. Source: `tasks/lessons.md` 2026-04-10 [Hook Design].
- [ ] **Resume `everything-claude-code-clean` scan** — 4 areas pending (hooks first, then commands/agents/skills). Diamond hunt recon was interrupted by /wrap in session 9. Prior recon findings staged in `.extraction-staging/FINDINGS.md` (gitignored).
- [ ] **`/gsd:new-milestone` for v2.3** — 13 charter candidates staged from diamond hunt recon (session 9). Awaiting Pete's scope definition before kicking off.
- [ ] **Act on CREW-ASSESSMENT.md findings** (2026-04-13) — **partially done (session 11, 2026-04-13)**: blocker #1 verified already fixed (struck from assessment), blocker #2 resolved (3 project agents upgraded to 10/10 standard). **Remaining**: orphan agent `gsd-stack-analyzer` (not spawned by any command); medium overlap `validator-hub` ecosystem-mode vs `ecosystem-auditor` (dispatch boundary undocumented).

## Session Handoff (2026-04-13 — session 11)

**Branch**: `docs/crew-assessment-reassessment` — 4 commits ahead of main, not yet pushed.

```
b7acc84 hardening(docs-sync): add defense-in-depth frontmatter and body sections
ac6e342 hardening(test-runner): add defense-in-depth frontmatter and body sections
dedad83 hardening(plugin-developer): add defense-in-depth frontmatter and body sections
eaf7676 docs: update CREW-ASSESSMENT with post-PR39-45 reassessment
```

**Session actions:**
1. Verified CREW-ASSESSMENT blocker #1 (gsd-ui-checker missing `model:`) was stale — confirmed `model: haiku` present at source and installed copy. Struck from assessment with note preserving audit trail.
2. Reclassified blocker #2 from blocker to active work item (quality gap, not hard blocker).
3. Upgraded all 3 project agents (plugin-developer, test-runner, docs-sync) from 7/10 to 10/10 defense-in-depth standard. Added `maxTurns`, `isolation: worktree`, `disallowedTools` + `<role>`, `<model_rationale>`, `<scope_guard>`, `<project_context>`, `<anti_patterns>` (10 rules each), `<completion_criteria>`. Scope-tailored per agent — no verbatim copying.
4. Scope guards enforce agent triangulation: plugin-developer delegates tests to test-runner and docs to docs-sync; test-runner never edits source; docs-sync never edits code.

**Next session:**
1. Push `docs/crew-assessment-reassessment` and open PR, or fast-forward merge locally.
2. Remaining CREW-ASSESSMENT items: orphan `gsd-stack-analyzer` (decide: wire up or archive); document `validator-hub` ecosystem-mode vs `ecosystem-auditor` dispatch boundary.
3. Otherwise kick off v2.3 via `/gsd:new-milestone` or resume open items above.

## Completed (reference)

- [x] v2.2 milestone setup — REQUIREMENTS.md, ROADMAP.md, STATE.md, PROJECT.md
- [x] Phase 39: Path Validation (SEC2-01 @file: allowlist, SEC2-02 requireSafePath for commands)
- [x] Phase 40: Exec & Parser Hardening (SEC2-03 execSync elimination + indexOf scanner, SEC2-04 escapeRegex + 1MB guard)
- [x] v2.2 PR #47 merged (2026-04-12)
- [x] v2.2 milestone audit PR #48 merged (2026-04-13) — passed verdict
- [x] `feat/defense-in-depth-executor` → PR #45 merged (2026-04-10)
- [x] `feat/gsd-stack-analyzer` → PR #46 merged (2026-04-10)
- [x] Lesson-capture enforcement (Layer 2) → PR #34 merged (2026-04-10)

## Notes

- `.planning/STATE.md` is stale — still says `v2.2 in_progress` / `0% (0/2 phases)`. Needs refresh next time a milestone transition runs (either `/gsd:new-milestone` or manual update).
- `.planning/v2.2-MILESTONE-AUDIT.md` notes that v2.2 bypassed the standard discuss → plan → execute ceremony (no PLAN.md/VERIFICATION.md in phase-39 or phase-40 dirs). Audit verified against REQUIREMENTS.md directly. Deemed acceptable given narrow scope and well-specified findings.
