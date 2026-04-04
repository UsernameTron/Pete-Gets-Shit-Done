# get-shit-done-cc

## What This Is

A zero-dependency CommonJS plugin providing meta-prompting, context engineering, and spec-driven development for Claude Code, OpenCode, Gemini, and Codex. Distributed as `get-shit-done-cc` on npm. Built and maintained by TACHES.

## Current State

**Shipped:** v1.2 Agent Quality & Consolidation (2026-04-04)
**Package:** `get-shit-done-cc` v1.29.0
**Tests:** 1,662 passing (76 unit + 39 integration added in v1.1)
**Coverage:** 85%+ lines, 77%+ branches across 25 instrumented source files
**Agents:** 15 source, 29 global, 7 archived — all tiered and quality-gated
**Remote:** `git@github.com:UsernameTron/Petes-Get-Shit-Done-Coding-Automation.git`

## Validated Requirements (v1.2)

All 7 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| CREW-01: Fix YAML parsing in 8 agents | Phase 6 | Validated (no changes needed) |
| CREW-02: Consolidate verification agents (4→1) | Phase 6 | Validated |
| CREW-03: Consolidate research agents (2→1) | Phase 6 | Validated |
| CREW-04: Consolidate validator agents (2→1) | Phase 6 | Validated |
| CREW-05: Wire utility agents into workflows | Phase 6 | Validated |
| CREW-06: Tool-access tiers for all agents | Phase 6 | Validated |
| CREW-07: Quality sections for low-scoring agents | Phase 6 | Validated |

<details>
<summary><strong>v1.1 Requirements (13/13 validated)</strong></summary>

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

</details>

## Constraints

- **Zero dependencies**: Package must remain zero-dependency CommonJS
- **Test stability**: All existing tests must continue passing
- **Backward compatibility**: No breaking changes to existing GSD commands

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 4→1 verification consolidation | Overlapping scopes unified into gsd-verifier with scope param | v1.2 Phase 6 |
| 2→1 research consolidation | Phase/project researchers differ only in scope | v1.2 Phase 6 |
| 2→1 validator consolidation | extension-validator + validator merged into gsd-validator-hub | v1.2 Phase 6 |
| 3-tier tool access | Explore (read), Research (+web), Modify (+write) applied to all agents | v1.2 Phase 6 |
| Quality threshold: 2+ missing sections | Agents missing 1 section skipped to minimize churn | v1.2 Phase 6 |
| Integration tests use real code paths | Prior incident where mock/prod divergence masked failures | v1.1 Phase 4 |
| Advisory 80% threshold warns, never fails | Build stability over enforcement during ramp-up | v1.1 Phase 5 |

## Context

- Repo flattened in PR #8, stale artifacts removed in PRs #10-#12
- v1.1 work shipped in PRs #13 (Phase 2), #14 (Phase 3), #16 (Phase 4), #18 (Phase 5)
- `get-shit-done/` is the GSD engine core (132 tracked files)
- Two plugin.json files exist (root and plugins/)
- Governance templates in `governance/` define session initialization behavior
- 3 specialist agents deployed: plugin-developer, test-runner, docs-sync
- 15 source agents + 7 archived agents after v1.2 consolidation
- 25 source files instrumented for coverage across lib, hooks, gsd-tools, bin, scripts

## Tech Debt (from v1.2 audit)

- 5 agent tier labels mismatch actual tool grants (documentation-only, no runtime effect)
- gsd-validator-hub has no workflow entry point
- Global CLAUDE.md files reference absorbed agents as standalone
- Missing SUMMARY.md files for plans 02-04 (context compaction)

## Deferred

- GSD v1.29 publish (version bump not yet done)
- Align plugin.json author fields with package.json (META-01)

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
*Last updated: 2026-04-04 -- v1.2 milestone shipped*
