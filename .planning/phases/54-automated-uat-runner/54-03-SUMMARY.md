---
phase: 54-automated-uat-runner
plan: "03"
subsystem: workflows/verify-work, bin/gsd-tools
tags: [uat, integration, cli, workflow-wiring]
dependency_graph:
  requires: [uat-runner.cjs, uat-patterns.cjs]
  provides: [verify-work Step 0, uat run-automated CLI]
  affects: [verify-work.md workflow]
tech_stack:
  added: []
  patterns: [cli-subcommand-dispatch, workflow-step-insertion]
key_files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/bin/lib/uat-runner.cjs
decisions:
  - "Inline phase directory lookup in gsd-tools.cjs rather than calling cmdFindPhase (avoids stdout capture)"
  - "Filter non-string items from parseMustHavesBlock output — YAML parser returns objects for nested structures"
  - "Step 0 routing: all-pass skips conversational UAT, failures block, manual falls through"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-18"
  tasks_completed: 3
  files_created: 0
  files_modified: 3
  tests_added: 0
  tests_total: 2621
  tests_passing: 2621
requirements:
  - UAT-03
  - UAT-07
  - UAT-10
---

## Summary

Wired the UAT runner into the verify-work workflow and CLI. Added `uat run-automated` subcommand to gsd-tools.cjs that finds phase plans, runs `runAutomatedUAT()`, and outputs JSON (--raw) or formatted text. Inserted Step 0 (`automated_uat`) into verify-work.md between `schema_check` and `find_summaries` — automated must_have assertions now run before any conversational UAT.

Also fixed a data-shape bug: `parseMustHavesBlock` can return objects for must_have text containing curly braces — added a filter to only process string items.

## Self-Check: PASSED

- [x] verify-work.md has Step 0 automated_uat before find_summaries
- [x] gsd-tools.cjs registers uat run-automated subcommand
- [x] CLI smoke test: `uat run-automated --phase 54 --raw` returns valid JSON
- [x] Full test suite: 2,621 pass, 0 fail
- [x] All commands are read-only (pattern registry guarantee)
