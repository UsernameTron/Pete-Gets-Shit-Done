---
phase: 55-internal-link-validator
plan: "02"
subsystem: scripts/validate-doc-links
tags: [wiring, cli-entrypoint, integration-tests, coverage-config]
dependency_graph:
  requires: [validate-doc-links-core-functions]
  provides: [validate-doc-links-cli, validate-doc-links-discovery]
  affects: [55-03-real-repo-run]
tech_stack:
  added: []
  patterns: [child-process-integration-tests, git-ls-files-with-glob-fallback, json-envelope, exit-code-contract]
key_files:
  created: []
  modified:
    - scripts/validate-doc-links.cjs
    - tests/validate-doc-links.test.cjs
    - .c8rc.json
duration: 1 session
completed: 2026-05-07
status: complete
---

# Phase 55 Plan 02 Summary — CLI Wiring + Integration Tests

## What Was Built

`discoverTrackedFiles(repoRoot)` — Discovers tracked Markdown files via `git ls-files --` (primary) with a recursive glob fallback for non-git roots (used by fixture-based unit tests). Internal `main(argv)` orchestrates discovery → per-file link extraction → validation → formatting → exit. Plus integration tests that spawn the script as a child process.

## Files Modified

- `scripts/validate-doc-links.cjs` — added `discoverTrackedFiles` (exported) and `main(argv)` (internal, guarded by `require.main === module`). Total now ~441 lines.
- `tests/validate-doc-links.test.cjs` — added 4 describe blocks (file discovery via temp git repo, exit codes via `spawnSync`, JSON envelope schema, --root argument validation). Test count grew from 39 → ~95 (56 new).
- `.c8rc.json` — added `scripts/validate-doc-links.cjs` to `include` array so coverage now tracks the validator.

## Test Result

Full suite: **2,723 assertions, 545 suites, 0 failures**. Coverage of `validate-doc-links.cjs`: **96.59% lines, 94.73% branches, 100% functions** — exceeds the 95% threshold for security-critical scripts. Per-module thresholds preserved across the rest of the codebase.

## Smoke Checks (all pass)

| Check | Result |
|-------|--------|
| `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/clean` | exits 0, prints "all links valid (3 checked across 2 files)" |
| `node scripts/validate-doc-links.cjs --root tests/fixtures/doc-links/broken` | exits 1, prints broken-ref table |
| `--json` on clean root | `{ status: "clean", checked: 3, files: 2, broken: [] }` |
| `--json` on broken root | `{ status: "broken", ..., broken: [<{file,line,ref,reason}>] }` |
| `node scripts/validate-doc-links.cjs --root` (missing arg) | exits 2, stderr: "validate-doc-links: --root requires a directory argument" |
| `typeof discoverTrackedFiles === 'function'` (require + typeof) | `function` |

## Key Decisions

- **`main` is internal, not exported.** Plan 55-02 must_haves require only `discoverTrackedFiles` to be exported. Integration tests spawn the script as a child process (`spawnSync(process.execPath, [SCRIPT, ...])`), so they exercise `main` end-to-end without needing it on the module exports surface. Exporting it would invite test coupling without test value.
- **Glob fallback for non-git roots.** Unit tests use fixture directories that are not git repositories; the fallback path (recursive `fs.readdirSync` filtering for `.md`) keeps tests hermetic. Production paths still go through `git ls-files`.
- **JSON envelope shape locked at planning time.** `{ status, checked, files, broken[] }` per the cross-AI review pass-1 finding — gives downstream consumers a stable diagnostic contract instead of a raw array.

## Self-Check: PASSED

- ✓ All exported functions present (6: toGfmSlug, extractHeadingSlugs, extractLinks, validateLink, formatTable, discoverTrackedFiles)
- ✓ Exit-code contract proven via `spawnSync` (0 clean, 1 broken, 2 misuse)
- ✓ JSON envelope schema asserted in tests
- ✓ Coverage above 95% threshold
- ✓ Full suite green, no regressions
- ✓ `.c8rc.json` tracks new script
- ✓ Plan key_links satisfied (execFileSync('git', spawnSync(process.execPath, .c8rc include)

## Outputs Available to Wave 3

The validator is fully runnable. Plan 55-03 can now invoke `node scripts/validate-doc-links.cjs` against the real repository, capture findings (without auto-fixing — that is Phase 57's responsibility), and update CLAUDE.md / README.md / DEVOPS-HANDOFF.md to reference the new script.
