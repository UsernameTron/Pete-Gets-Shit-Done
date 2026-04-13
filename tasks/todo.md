# Todo

## Current Status: v2.2 Shipped — Between Milestones

v2.2 Security Hardening merged and audited (PR #47 merged 2026-04-12; audit PR #48 merged 2026-04-13, verdict: passed). All 4 findings (SEC2-01 through SEC2-04) resolved. Main is clean; no branches in flight.

- **Tests**: 2408 passing (baseline post-v2.2)
- **Coverage**: 90.41% overall
- **Branch**: `main` (clean)
- **Last commit**: `089f689 chore(planning): resolve health check warnings`

## Open Items

- [ ] **Stop-hook sentinel for human-review gates** — add `.planning/.review-pending` sentinel (or env flag) to the uncommitted-files Stop hook so prompts containing "do not commit yet" don't force a commit. Source: `tasks/lessons.md` 2026-04-10 [Hook Design].
- [ ] **Resume `everything-claude-code-clean` scan** — 4 areas pending (hooks first, then commands/agents/skills). Diamond hunt recon was interrupted by /wrap in session 9. Prior recon findings staged in `.extraction-staging/FINDINGS.md` (gitignored).
- [ ] **`/gsd:new-milestone` for v2.3** — 13 charter candidates staged from diamond hunt recon (session 9). Awaiting Pete's scope definition before kicking off.

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
