# Todo

## Current Status: v2.2 Shipped — Between Milestones (CREW-ASSESSMENT fully closed)

v2.2 Security Hardening merged and audited (PR #47 merged 2026-04-12; audit PR #48 merged 2026-04-13, verdict: passed). All 4 findings (SEC2-01 through SEC2-04) resolved. CREW-ASSESSMENT.md findings all closed as of session 12 (2026-04-13). Main is clean; remote branches pruned to just `main`.

- **Tests**: 2408 passing (baseline post-v2.2)
- **Coverage**: 90.41% overall
- **Branch**: `main` (clean, synced with origin)
- **Last commit**: `7add3f1 docs: add full system audit 2026-04-11`

## Open Items

- [ ] **Stop-hook sentinel for human-review gates** — add `.planning/.review-pending` sentinel (or env flag) to the uncommitted-files Stop hook so prompts containing "do not commit yet" don't force a commit. Source: `tasks/lessons.md` 2026-04-10 [Hook Design].
- [ ] **Resume `everything-claude-code-clean` scan** — 4 areas pending (hooks first, then commands/agents/skills). Diamond hunt recon was interrupted by /wrap in session 9. Prior recon findings staged in `.extraction-staging/FINDINGS.md` (gitignored).
- [ ] **`/gsd:new-milestone` for v2.3** — 13 charter candidates staged from diamond hunt recon (session 9). v2.3 prompt-chain analysis in `stash@{0}` (`v2.3-prompt-chain — pending Pete's v2.3 milestone kickoff`); pop it when ready to kick off.
- [x] **Act on CREW-ASSESSMENT.md findings** (closed session 12, 2026-04-13) — all 4 findings resolved: blocker #1 (ui-checker model field) struck as stale read, 3 project agents upgraded to 10/10 (session 11), orphan `gsd-stack-analyzer` removed in `e42b9b0`, validator-hub/ecosystem-auditor dispatch boundary documented in `5d80821`.

## Session Handoff (2026-04-13 — session 12)

**Branch**: `main` (clean, synced with origin). `docs/crew-assessment-reassessment` merged and deleted.

**Session actions:**
1. Investigated commit `e42b9b0` provenance gap — confirmed legitimate (Pete + Claude co-author, 2026-04-13 13:43 CDT); session 11's handoff/todo had not logged it. Reconciled `tasks/todo.md`.
2. Closed all remaining CREW-ASSESSMENT.md findings — updated 3 project-agent scores 7/10 → 10/10 with commit citations (`dedad83`, `ac6e342`, `b7acc84`), marked orphan cleanup resolved (`e42b9b0`), documented `validator-hub` ecosystem-mode ↔ `ecosystem-auditor` dispatch boundary inline. Summary counters reconciled (active 20, archived 8, orphans 0, medium overlaps 0, gold-standard 7, open findings 0). Commit `5d80821`.
3. Fast-forwarded `docs/crew-assessment-reassessment` to main, pushed to origin, deleted local branch.
4. Remote branch cleanup — pruned stale gone-branch reference, then deleted 5 origin branches in 2 waves:
   - Wave 1 (safe, 0 unique commits): `chore/health-warnings-repair`, `chore/planning-reconcile-2026-04-13`, `feat/defense-in-depth-builders-a` (PR #43 squash-merged).
   - Wave 2 (had orphan content, no PR): cherry-picked `docs/full-audit-2026-04-11` audit doc onto main as `7add3f1`, pushed, then deleted both `docs/full-audit-2026-04-11` and `claude/ctg-technical-plan-htRqx` (CTG engagement scaffold — separate client work, not GSD repo material).
5. Stash cleanup — dropped 8 stale stashes in reverse-index order (agent-health.log hook artifacts, WIP todos, Phase 34 scratch). Reduced 11 → 3 retained: `v2.3-prompt-chain`, `extraction-staging`, `phase-34-scratch-preserve`.

**Next session:**
1. Either kick off v2.3 via `/gsd:new-milestone` (pop `stash@{0}` for charter analysis) or continue `everything-claude-code-clean` scan.
2. Stop-hook sentinel remains open (lesson 2026-04-10 [Hook Design]) — would have prevented this session's `v2.3-prompt-chain.md` push friction.

---

## Prior Handoff (2026-04-13 — session 11)

**Branch**: `docs/crew-assessment-reassessment` — 4 commits ahead of main, not yet pushed.

```
3a107a6 chore(planning): session 11 wrap — project agents hardened, assessment reconciled
e42b9b0 chore: remove orphan gsd-stack-analyzer agent
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
2. Remaining CREW-ASSESSMENT item: document `validator-hub` ecosystem-mode vs `ecosystem-auditor` dispatch boundary. (Orphan `gsd-stack-analyzer` resolved in `e42b9b0`.)
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
