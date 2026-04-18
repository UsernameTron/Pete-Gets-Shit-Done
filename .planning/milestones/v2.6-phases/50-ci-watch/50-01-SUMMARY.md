---
phase: 50-ci-watch
plan: "01"
subsystem: ci-watch-engine
tags: [ci, github-actions, workflow, pattern-library]
dependency_graph:
  requires: []
  provides:
    - lib/ci-patterns.json
    - get-shit-done/workflows/ci-watch.md
  affects:
    - get-shit-done/commands/gsd/ci-watch.md  # Plan 02 consumes the workflow
tech_stack:
  added:
    - lib/ci-patterns.json  # JSON pattern library for CI failure matching
  patterns:
    - GSD workflow file format (purpose/process/step XML tags)
    - injection-patterns.json structural convention for pattern objects
key_files:
  created:
    - lib/ci-patterns.json
    - get-shit-done/workflows/ci-watch.md
  modified: []
decisions:
  - "First-match wins for pattern matching — simpler and predictable, avoids overlapping pattern ambiguity"
  - "30 error-line cap with first-15/last-15 split — balances context preservation vs log noise"
  - "LLM fallback as Tier 2 — zero-dependency constraint means no ML; LLM analysis only when no pattern matches"
  - "Sleep $INTERVAL expressed as prose in workflow — workflow is a prompt for Claude, not executable bash"
metrics:
  duration_seconds: 139
  completed_date: "2026-04-17"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 50 Plan 01: CI Watch Engine Summary

**One-liner:** Extensible CI failure pattern library (6 seeded patterns) plus a 7-step polling workflow that fetches GitHub Actions results, extracts error lines, and provides fix suggestions via pattern match then LLM fallback.

## What Was Built

### lib/ci-patterns.json

JSON array of 6 failure pattern objects following the `injection-patterns.json` structural convention. Each object has `source` (regex string), `flags`, `category`, `description`, and `fix` fields.

Seeded categories:
- `cross-device` — EXDEV cross-device rename (the project's established fallback pattern)
- `missing-module` — Cannot find module / MODULE_NOT_FOUND
- `sha-pin` — GitHub Actions SHA pin mismatch
- `node-version` — Node.js version incompatibility (targets current CI matrix: Node 20, 22)
- `test-failure` — Test assertion failures (generic)
- `exit-code` — Non-zero process exit codes (catch-all)

### get-shit-done/workflows/ci-watch.md

402-line workflow file following GSD conventions (purpose/process/step tags). Implements the full polling-diagnosis-suggestion loop across 7 steps:

1. **detect_branch** — `git branch --show-current`, errors on detached HEAD
2. **parse_args** — Optional `--interval N` (default 15s, range 5–300)
3. **initial_poll** — `gh run list --branch --json`, handles auth/install errors
4. **polling_loop** — Polls until all runs terminal; streaming progress line; Ctrl+C shows partial results
5. **format_results** — GSD table (Job, Status, Duration, URL); exits on all-pass
6. **fetch_failed_logs** — `gh run view --log-failed`; extracts up to 30 error lines per run
7. **diagnose_and_suggest** — Tier 1: `ci-patterns.json` match; Tier 2: LLM fallback
8. **format_failure_report** — Structured section per failure with Error / Diagnosis / Category / Suggested Fix

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| First-match wins for patterns | Simpler, predictable; avoids ambiguity when multiple patterns could match |
| 30 error-line cap (first-15/last-15) | Preserves both the root error and final state without dumping thousands of log lines |
| LLM as Tier 2 fallback | Zero-dependency constraint rules out ML libraries; Claude is already the runtime |
| Workflow as markdown prose | Workflow files are prompts Claude executes — `Sleep $INTERVAL` means "wait N seconds" in natural language |

## Tasks Completed

| Task | File | Commit |
|------|------|--------|
| Task 1: Create CI failure pattern library | lib/ci-patterns.json | 090f830 |
| Task 2: Create ci-watch workflow file | get-shit-done/workflows/ci-watch.md | 8f459fb |

## Verification Results

All acceptance criteria passed:
- `lib/ci-patterns.json` loads as valid JSON with 6 patterns (all regexes compile)
- All 6 categories present: cross-device, missing-module, sha-pin, node-version, test-failure, exit-code
- `get-shit-done/workflows/ci-watch.md` exists (402 lines, exceeds 100-line minimum)
- Workflow references `gh run list`, `gh run view --log-failed`, and `ci-patterns.json`
- Polling loop with configurable interval implemented
- Results table with Job/Status/Duration/URL columns present
- Ctrl+C / SIGINT handling documented
- No overlap with Plan 02 files (command file lives at `commands/gsd/ci-watch.md`)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all patterns have complete fix text and all workflow steps are fully specified.

## Self-Check: PASSED

- `lib/ci-patterns.json` FOUND: /Users/cpconnor/projects/Pete-Gets-Shit-Done/lib/ci-patterns.json
- `get-shit-done/workflows/ci-watch.md` FOUND: /Users/cpconnor/projects/Pete-Gets-Shit-Done/get-shit-done/workflows/ci-watch.md
- Commit 090f830 FOUND in git log
- Commit 8f459fb FOUND in git log
- Stub scan: 0 stubs found in created files
