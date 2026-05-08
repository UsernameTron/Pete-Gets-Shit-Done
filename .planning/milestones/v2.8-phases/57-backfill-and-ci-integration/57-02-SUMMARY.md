---
phase: 57-backfill-and-ci-integration
plan: 02
subsystem: tooling
tags: [validator, cli-flag, glob, gitignore-style, tdd, hand-rolled, zero-deps]

requires:
  - phase: 55-internal-link-validator
    provides: scripts/validate-doc-links.cjs (the validator now extended with --exclude)
  - phase: 57-01
    provides: Repository at validator-clean baseline modulo exempts; the 10 remaining broken refs are exactly the targets this --exclude flag must whitelist

provides:
  - --exclude <glob> CLI flag with multi-value support (each invocation appends to array)
  - Hand-rolled gitignoreGlobToRegex(glob) helper, exported for direct testing — zero new deps
  - Gitignore-style semantics with documented limits — leading **/, trailing /**, * (single segment), ? (simplified [^/])
  - Glob algorithm correctly handles **/*.md root vs nested files (Codex HIGH closure)
  - Empty-string glob is graceful no-op /(?!)/ (Gemini LOW closure)
  - 18 new tests (78 → 96 total, all passing)
  - Real-repo clean-with-exclude evidence — validator exits 0 with the canonical 6-glob exclude list

affects: [57-03-PLAN.md (CI workflow uses these exclude globs in the docs-integrity job)]

tech-stack:
  added: []
  patterns:
    - Hand-rolled gitignore-style glob converter (lift specials before escape, then escape regex metacharacters)
    - Behavior-oriented test assertions (not test-count assertions) — addresses Codex MEDIUM
    - Exported helper as supported test API — addresses Codex MEDIUM coupling concern

key-files:
  created:
    - tests/fixtures/doc-links/exclude/clean-with-exclude/index.md
    - tests/fixtures/doc-links/exclude/clean-with-exclude/sub/page.md
    - tests/fixtures/doc-links/exclude/would-fail-without-exclude/broken.md
    - tests/fixtures/doc-links/exclude/would-fail-without-exclude/another-broken.md
    - .planning/phases/57-backfill-and-ci-integration/57-02-SUMMARY.md
  modified:
    - scripts/validate-doc-links.cjs (added gitignoreGlobToRegex + --exclude parsing + filter)
    - tests/validate-doc-links.test.cjs (18 new tests, 1 fixture-driven assertion correction)

key-decisions:
  - "Lift specials BEFORE escape (algorithmic invariant for glob-to-regex). Without this, `**/*.md` would escape to `\\*\\*\\/\\*\\.md` and `**` would lose its multi-segment semantics. The implementation transforms `**/`, `**`, and `/**` to opaque placeholders, escapes all remaining regex metachars, then substitutes the placeholders back to `(?:.*\\/)?` and `.*` patterns."
  - "Empty-string glob returns `/(?!)/` (negative lookahead at start = matches nothing). Treating empty as 'match nothing' is safer than 'match everything' or 'throw' — avoids accidental whole-repo exclusion if a config file has a stray empty value."
  - "Multi-value via array push, not last-write-wins. Each `--exclude` invocation appends; user runs `--exclude A --exclude B` to combine. Last-write-wins would surprise operators."
  - "Filter applied AFTER git ls-files, BEFORE link parsing. Excludes affect file discovery only — they do NOT change link-extraction logic. Excluded files contribute neither sources nor potential targets to the validation pass."

patterns-established:
  - "Behavior-oriented tests over count-based tests (Codex MEDIUM): assertions like 'Test K: --exclude **/*.md excludes both root and nested .md files' rather than 'has 18 describe blocks'"
  - "Test API surface: gitignoreGlobToRegex is exported via module.exports.gitignoreGlobToRegex with a header comment marking it as supported test API"

requirements-completed: [DOCCI-01, DOCCI-03]

duration: ~30min
completed: 2026-05-08
---

# Phase 57 Plan 02: Validator --exclude Flag Summary

**Hand-rolled gitignore-style --exclude <glob> with TDD: 18 new tests, 96/96 passing, scripts/validate-doc-links.cjs at 97.36% line coverage**

## Performance

- **Duration:** ~30 min (initial agent attempt + orchestrator-driven completion)
- **Tasks:** 3 (RED → GREEN → COVERAGE)
- **Files created:** 5 (4 fixtures + this SUMMARY)
- **Files modified:** 2 (scripts/validate-doc-links.cjs, tests/validate-doc-links.test.cjs)
- **Test count:** 78 → 96 (+18)
- **Test result:** All 96 tests pass

## Accomplishments

- **TDD discipline preserved:** RED (3bb4771) → GREEN (8fcba59) → COVERAGE/integration (this commit). Reviewers (Gemini and Codex) called the TDD structure "exemplary" and that's preserved.
- **Codex HIGH closed:** `gitignoreGlobToRegex('**/*.md')` correctly matches both `index.md` (root) and `sub/page.md` (nested). Verified at unit level (Test K: `**/*.md`) AND integration level (real-repo --exclude run).
- **Gemini LOW closed:** `gitignoreGlobToRegex('')` returns `/(?!)/` (matches nothing). Verified at unit level.
- **Multi-value parsing:** Test D confirms `--exclude **/broken.md --exclude **/another-broken.md` exits 0 (both fixtures excluded).
- **Missing-value handling:** Tests H and I confirm `--exclude` with no value (or with another flag like `--root` as next arg) exits 2 with stderr error message.
- **Exclude-affects-discovery-only:** Excluded files do not contribute as link sources OR as link targets; the parser never sees them.

## Task Commits

1. **Task 1 (RED):** Add 18+ failing tests + fixtures — `3bb4771` (`test(57-02): add failing tests for --exclude flag (RED)`)
2. **Task 2 (GREEN):** Implement gitignoreGlobToRegex + --exclude flag + fixture rename — `8fcba59` (`feat(57-02): implement --exclude flag with gitignore-style glob converter (GREEN)`)
3. **Task 3 (COVERAGE + integration):** _this commit_ — coverage evidence + real-repo clean-with-exclude evidence + ROADMAP update + SUMMARY

## Coverage Evidence (Task 3)

`npm run test:coverage` output for `scripts/validate-doc-links.cjs`:

```
File                       | % Stmts | % Branch | % Funcs | % Lines
validate-doc-links.cjs     |   97.36 |    95.72 |     100 |   97.36
```

**97.36% line coverage** — well above the 80% per-module threshold (CLAUDE.md). Overall project coverage: **90.7%** (above the 90% threshold).

Uncovered lines: `185-186, 225-229, 315-317, 399-400` — error paths in directory traversal and stdin-pipe handling, low-priority for this feature.

## Real-Repo Clean-with-Exclude Evidence (Task 3)

The 10 currently-broken refs in the live repo are all intentional whitelist candidates. With Plan 57-02's --exclude flag and the canonical exclude list, the validator now exits 0:

```bash
node scripts/validate-doc-links.cjs \
  --exclude '.claude/skills/**' \
  --exclude '.planning/REQUIREMENTS.md' \
  --exclude '.planning/milestones/v2.7-phases/**' \
  --exclude 'tests/fixtures/doc-links/broken/**' \
  --exclude 'tests/fixtures/doc-links/edge/**' \
  --exclude 'tests/fixtures/doc-links/exclude/would-fail-without-exclude/**'

# stdout: validate-doc-links: all links valid (302 checked across 707 files)
# exit:   0
```

JSON form:
```json
{
  "status": "clean",
  "checked": 302,
  "files": 707,
  "broken": []
}
```

This 6-glob exclude list is exactly what Plan 57-03 will wire into `.github/workflows/test.yml`.

## Decisions Made

See `key-decisions` in frontmatter — 4 decisions recorded.

## Deviations from Plan

The plan was executed in mostly the order specified, with one tactical deviation:

1. **Fixture rename to break substring overlap.** Test C asserts that broken.md (excluded) does NOT appear in stdout, while another-broken.md (not excluded) DOES. Both fixtures originally referenced `./does-not-exist.md`-like targets, causing Test C's `!stdout.includes(...)` assertion to fail because another-broken.md's `./still-does-not-exist.md` ref contains the substring. Fixed by renaming broken.md's target to `./missing-target.md`. No semantic change to the test — just lexical disambiguation. Committed in the GREEN commit.

## Issues Encountered

- **First agent attempt got distracted by a phantom syntax error.** The agent claimed `node --check` passed but runtime failed at line 76 with a backtick-template-literal interpretation error. The actual file passes both `node --check` AND runtime — the agent was confused. Orchestrator took over, ran tests directly, identified one real failing assertion (Test C substring overlap), fixed the fixture, and committed.

## User Setup Required

None — pure tooling change.

## Next Phase Readiness

- **CI integration unblocked.** Plan 57-03 has the exact exclude list it needs (6 globs, captured above) to wire as a `docs-integrity` job in `.github/workflows/test.yml`.
- **Drift detector evidence ready.** Drift detector (Plan 56) is unaffected by --exclude (it watches CLAUDE.md/README.md/DEVOPS-HANDOFF.md numeric claims, not link refs).
- **No blockers.**

---
*Phase: 57-backfill-and-ci-integration*
*Plan: 02*
*Completed: 2026-05-08*
