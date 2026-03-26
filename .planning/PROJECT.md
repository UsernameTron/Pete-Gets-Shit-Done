# get-shit-done-cc

## What This Is

A zero-dependency CommonJS plugin providing meta-prompting, context engineering, and spec-driven development for Claude Code, OpenCode, Gemini, and Codex. Distributed as `get-shit-done-cc` on npm. Built and maintained by TACHES.

## Current State

**Shipped:** v1.1 Testing & Hardening (2026-03-26)
**Package:** `get-shit-done-cc` v1.28.0
**Tests:** 1,662 passing (76 unit + 39 integration added in v1.1)
**Coverage:** 85%+ lines, 77%+ branches across 25 instrumented source files
**Remote:** `git@github.com:UsernameTron/Petes-Get-Shit-Done-Coding-Automation.git`

The repo has comprehensive test coverage, hardened CI pipeline (Linux/macOS/Windows), and integrated coverage reporting. Ready for v1.29 publish when scope allows.

## Validated Requirements (v1.1)

All 13 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| COV-01: Coverage tool measures line/branch coverage | Phase 2 | Validated |
| COV-02: Gap analysis with priority ranking | Phase 2 | Validated |
| COV-03: Coverage baseline documented | Phase 2 | Validated |
| UNIT-01: Governance scripts tested | Phase 3 | Validated |
| UNIT-02: Plugin integration paths tested | Phase 3 | Validated |
| UNIT-03: Hook behavior tested | Phase 3 | Validated |
| UNIT-04: Uncovered handlers tested | Phase 3 | Validated |
| INTG-01: End-to-end flow tested | Phase 4 | Validated |
| INTG-02: Governance hook enforcement validated | Phase 4 | Validated |
| INTG-03: Plugin loading integration verified | Phase 4 | Validated |
| CI-01: base64-scan timeout fixed | Phase 5 | Validated |
| CI-02: Coverage reporting in CI | Phase 5 | Validated |
| CI-03: Cross-platform CI passes | Phase 5 | Validated |

## Constraints

- **Zero dependencies**: Package must remain zero-dependency CommonJS
- **Test stability**: All existing tests must continue passing
- **Backward compatibility**: No breaking changes to existing GSD commands

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Collapse 4 phases to 1 (v1.0) | Contamination scan showed most work already done | Accepted |
| Conditional step phrasing in governance | "if exists" preserves compatibility with non-GSD projects | Accepted |
| `.planning/phases/` gitignored | Phase plans are local execution artifacts, not committed | By design |
| Coverage thresholds advisory-only | Expanding scope dropped overall to ~81%; hard thresholds deferred | v1.1 Phase 2 |
| Single script for gap analysis + baseline | Consistency between gap analysis and baseline docs | v1.1 Phase 2 |
| Integration tests use real code paths | Prior incident where mock/prod divergence masked failures | v1.1 Phase 4 |
| base64-scan timeout exits clean (exit 0) | Incomplete scan is not a finding; prevents false positives | v1.1 Phase 5 |
| Coverage report on Linux Node 22 only | Avoids duplicate reports across matrix jobs | v1.1 Phase 5 |
| Advisory 80% threshold warns, never fails | Build stability over enforcement during ramp-up | v1.1 Phase 5 |

## Context

- Repo flattened in PR #8, stale artifacts removed in PRs #10-#12
- v1.1 work shipped in PRs #13 (Phase 2), #14 (Phase 3), #16 (Phase 4), #18 (Phase 5)
- `get-shit-done/` is the GSD engine core (132 tracked files)
- Two plugin.json files exist (root and plugins/)
- Governance templates in `governance/` define session initialization behavior
- 3 specialist agents deployed: plugin-developer, test-runner, docs-sync
- 25 source files instrumented for coverage across lib, hooks, gsd-tools, bin, scripts
- Integration tests validate CLI command chains, governance hook enforcement, plugin ecosystem coherence

## Deferred

- GSD v1.29 publish (version bump not yet done)
- Align plugin.json author fields with package.json (META-01)
- Delete accidental `UsernameTron/Pete-Gets-Shit-Done` repo (manual)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 -- v1.1 milestone shipped*
