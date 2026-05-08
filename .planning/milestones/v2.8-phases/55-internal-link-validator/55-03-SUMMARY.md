---
phase: 55-internal-link-validator
plan: 03
status: complete
created: 2026-05-07
---

# Phase 55 Plan 03 Summary — Real-Repo Acceptance + Doc Updates

## Validator Run Against Real Repo

**Command:** `node scripts/validate-doc-links.cjs`
**Exit code:** 1
**Files scanned:** 735
**Links checked:** 320
**Broken links:** 109

### Broken Link Findings (recorded for Phase 57)

The validator found 109 broken internal links across the repo. These are NOT repaired in Phase 55. Phase 57 (DOCREF-01, DOCREF-02) will repair or remove these references.

#### Broken Links by Reason

| Reason | Count |
|--------|-------|
| file not found | 100 |
| anchor not found in target | 8 |
| anchor not found in target (0 headings) | 1 |

#### Key Patterns Observed

**Fixture files (expected, intentional):** 5 broken refs in `tests/fixtures/doc-links/broken/` and `tests/fixtures/doc-links/edge/` — these are the intentional test fixtures for the validator itself. The validator correctly identifies them as broken. These should be included in a `.doclinkignore` (future work — see below).

**`.planning/milestones/` cross-reference chain (87 refs):** Each milestone ROADMAP file contains relative links to previous milestone ROADMAP files using the path pattern `milestones/vX.Y-ROADMAP.md`. These files all live in the same `milestones/` directory, so the self-referential link (`v1.7-ROADMAP.md` → `milestones/v1.7-ROADMAP.md`) and all predecessor links resolve incorrectly when followed from within the file. This is a systematic pattern across all archived milestone ROADMAPs.

**`docs/` missing files:** `docs/README-technical.md` references `assets/terminal.svg`, `docs/USER-GUIDE.md`, `docs/workflow-discuss-mode.md`, `docs/governance-customization.md`, and `LICENSE` — files that were planned but not created or have since been moved.

**`docs/README.md` localization stubs:** References to `pt-BR/README.md`, `ja-JP/README.md`, `zh-CN/README.md` — localization files that do not exist.

**README.md missing anchors:** `#how-it-works` and `#user-guide` are referenced in the README navigation bar but no corresponding heading section exists with those exact slugs.

**`docs/AGENTS.md` anchor refs:** `#gsd-research-orchestrator` referenced twice but the anchor is missing.

**`docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md`:** One broken anchor each.

**`.planning/REQUIREMENTS.md`:** Contains a placeholder `path/to/file.md` example ref.

**`.claude/skills/SKILL.md` (2 files):** Contain an example link `file.md` — a documentation template placeholder.

**`.planning/milestones/archived-phases/02-coverage-audit/02-VERIFICATION.md`:** References `coverage-baseline.md` which no longer exists.

**`.planning/phases/55-internal-link-validator/55-03-PLAN.md`:** The plan file itself contains a regex-like string (`?!\s*/dev/null`) which the validator incorrectly identifies as a relative link. This is a false-positive edge case — the plan's code block content is being parsed. (Tracked as known limitation for Phase 57 / `.doclinkignore`.)

These broken refs are NOT repaired in Phase 55. Phase 57 (DOCREF-01, DOCREF-02) will repair or remove these references.

## Suite + Coverage Evidence

- `npm test`: PASS, 2723 assertions across 545 suites
- Project-wide line coverage: 91.34% (threshold: >=91%)
- Project-wide branch coverage: 83.21% (threshold: >=83%)
- `scripts/validate-doc-links.cjs` per-module coverage: 96.59% lines, 94.73% branches (threshold: >=80%)

## Doc Updates Applied

Three living docs each received one concise reference to `scripts/validate-doc-links.cjs`. Each addition is insertion-only — no pre-existing content was modified.

| File | Line added |
|------|-----------|
| `CLAUDE.md` | `- \`node scripts/validate-doc-links.cjs\` — validate internal Markdown links across tracked \`.md\` files; exits non-zero on broken refs. Use \`--json\` for machine-readable output. (Wired into CI in Phase 57.)` |
| `README.md` | `\| \`node scripts/validate-doc-links.cjs\` \| Validates internal Markdown links (relative refs + anchor refs) in tracked \`.md\` files. Exits non-zero on broken links. Use \`--json\` for machine output. CI integration deferred to Phase 57. \|` |
| `docs/DEVOPS-HANDOFF.md` | `\| \`npm run validate:links\` / \`node scripts/validate-doc-links.cjs\` \| Internal Markdown link validator — exits 0 on clean, 1 on broken. Phase 57 wires this as a blocking step in \`.github/workflows/test.yml\`. \|` |

- Doc-updates commit hash: (recorded in self-check section below)

## Decisions

- All four DOCLINK requirement IDs (DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04) are exercised by the test suite. Acceptance criteria from ROADMAP Phase 55 are satisfied.
- Verify blocks across all three plans use POSIX shell idioms (`grep`, `test`, `mktemp`). Cross-platform support for plan verification on Windows is an explicit non-goal of Phase 55 (Pass 2 consensus MEDIUM finding, deferred). The script itself (`scripts/validate-doc-links.cjs`) is pure Node and works on any platform; only the per-task acceptance shell snippets are POSIX-tied.
- The 109 broken links discovered in the real-repo run are NOT auto-fixed in Phase 55. This is consistent with the ROADMAP assignment of DOCREF-01 / DOCREF-02 to Phase 57.

## Future Work Recommendations

- `.doclinkignore` (suppression list for intentional broken refs): NOT in scope for Phase 55. Pass 1 + Pass 2 reviews flagged this as scope creep against DOCLINK-01..04 — none of which mention an ignore mechanism. If the real-repo run surfaces cases that ARE intentional and should never trigger the validator, capture them here as candidates for a future phase. Do NOT implement an ignore file inline in Phase 55.
  - Candidates from this run:
    - `tests/fixtures/doc-links/broken/*.md` and `tests/fixtures/doc-links/edge/*.md` — intentional broken fixtures for the validator test suite
    - `.planning/phases/55-internal-link-validator/55-03-PLAN.md` line 278 — false positive on regex syntax in a code block
    - `.claude/skills/SKILL.md` and `.claude/skills/dream-memory-consolidation/SKILL.md` — documentation template placeholders
    - `.planning/REQUIREMENTS.md` — `path/to/file.md` placeholder example
- Cross-platform verification for plan acceptance blocks (Windows compatibility): see Decisions above.

## Acceptance Mapping (ROADMAP Phase 55 Success Criteria)

| Success Criterion | Evidence |
|-------------------|----------|
| Running script produces a table on broken refs and exits non-zero | Real-repo run confirms: 109 broken links found, exit code 1, text table emitted with FILE/LINE/REF/REASON columns |
| Running script on a clean repo exits zero | Fixture clean run confirms: `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/clean` exits 0, "all links valid (3 checked across 2 files)" |
| `--json` outputs machine-readable JSON | Real-repo JSON run: `{"status":"broken","checked":320,"files":735,"broken":[...]}` — parses cleanly via `JSON.parse` |
| Broken anchor refs reported separately from broken file-path refs | Reason strings differ: "file not found" (100 occurrences) vs "anchor #X not found in target" (8 occurrences) vs "anchor #X not found in target (0 headings)" (1 occurrence) |
