---
phase: 54-automated-uat-runner
plan: "02"
subsystem: lib/uat-runner
tags: [uat, runner, tdd, shell-execution, frontmatter-parsing]
dependency_graph:
  requires: [uat-patterns.cjs, frontmatter.cjs, core.cjs]
  provides: [uat-runner.cjs]
  affects: [verify-work.md (Plan 03), gsd-tools.cjs (Plan 03)]
tech_stack:
  added: []
  patterns: [tdd-red-green, structured-results, timeout-enforcement]
key_files:
  created:
    - get-shit-done/bin/lib/uat-runner.cjs
    - tests/uat-runner.test.cjs
  modified: []
decisions:
  - "execSync with 30s timeout per UAT-09 — synchronous execution matches GSD's existing command execution pattern"
  - "parseMustHavesBlock from frontmatter.cjs reused for YAML parsing — no custom parser needed"
  - "Structured results (passed/failed/manual arrays) enable routing logic in verify-work Step 0"
metrics:
  duration_minutes: 5
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_created: 2
  tests_added: 14
  tests_total: 2621
  tests_passing: 2621
requirements:
  - UAT-01
  - UAT-04
  - UAT-05
  - UAT-06
  - UAT-08
  - UAT-09
---

## Summary

Built the UAT runner orchestrator (`uat-runner.cjs`) using TDD. The module reads PLAN.md files, extracts `must_haves.truths` from YAML frontmatter via `parseMustHavesBlock`, routes each truth through the pattern registry's `matchPattern()`, executes the generated shell commands with a 30-second timeout, and returns structured `{ passed, failed, manual, total }` results.

Three exported functions:
- **compareResult(actual, expected, mode)** — 4 comparison modes (equals, contains, gt, gte)
- **runAutomatedUAT(planPaths)** — orchestrates the full assertion pipeline
- **formatUATResults(results)** — produces human-readable pass/fail/manual summary

## Self-Check: PASSED

- [x] uat-runner.cjs exists and exports 3 functions
- [x] 14 tests pass (8 compareResult, 4 runAutomatedUAT, 1 formatUATResults, 1 error handling)
- [x] 30-second timeout enforced via execSync options
- [x] Unrecognized must_haves route to manual array
- [x] Failed assertions include mustHave, expected, actual, command fields
- [x] No regression in uat-patterns tests (15 pass)
