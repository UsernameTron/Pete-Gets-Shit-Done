# Todo

## Current Status: v2.0 Intelligence Layer -- Shipped

v2.0 milestone shipped and archived (2026-04-05). Tag: v2.0.
2069 tests passing across 403 suites. 15 active agents, 7 archived.

## Open Items

- [ ] Define next milestone (`/gsd:new-milestone`)

## Completed

- [x] v1.0 Post-Merge Cleanup (2026-03-26)
- [x] v1.1 Testing & Hardening (2026-03-26)
- [x] v1.2 Agent Quality & Consolidation (2026-04-04)
- [x] v1.3 Security Hardening & Coverage (2026-04-04)
- [x] v1.4 Correctness & Robustness (2026-04-04)
- [x] v1.5 Performance (2026-04-04)
- [x] v1.6 Maintainability (2026-04-04)
- [x] v1.7 End-to-End Integration Testing (2026-04-04)
- [x] v1.8 Documentation & Accuracy (2026-04-05)
- [x] v1.9 Ship Readiness & Hygiene (2026-04-05)
- [x] v2.0 Intelligence Layer (2026-04-05)
- [x] Codebase mapping refresh (2026-04-06)
- [x] README.md and CLAUDE.md refresh (2026-04-06)
- [x] Merged PR #31 to main (2026-04-06)

## Session Handoff

**State tracking**: `.planning/STATE.md` is canonical.
**Branch**: `feat/lesson-capture-enforcement` (clean, 2 commits ahead of main)
**Last session (2026-04-09)**: Layer 1 of lesson-capture Stop gate
- Built `.claude/hooks/lesson-capture-gate.cjs` (364 lines, 5 exported pure helpers)
- Wired project-scoped Stop hook in `.claude/settings.json` (additive to user-global `gsd-lessons-check.sh`)
- 25 tests in `tests/lesson-capture-gate.test.cjs`, all green; full suite 2094/2094 across 403 suites
- Caught and fixed `deriveSlug` spec-vs-reality bug (spec said `'-' + cwd.replaceAll('/', '-')` which double-dashes; actual Claude Code slug uses single leading dash)
- Captured 2 lessons: spec-vs-reality discipline, signal-detection false-positive findings
- Commits: `d0ae43c` (feat: hook + tests), `5a0de6f` (docs: lessons)
**Layer 2 deferred**: Phrase-set tightening — bare keyword matching on `don't`/`stop`/`no,` inflates false positives on instructional text. Gate fired on its own build session with 6 false signals. Refine before long-term enablement.
**Next**: Layer 2 of lesson-capture-enforcement (phrase-set refinement + lesson-capture subagent), OR resume `/gsd:discuss-phase 34` on `feat/v2.1-write-once-perimeters`. Pete's call.
