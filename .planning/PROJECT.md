# get-shit-done-cc

## What This Is

A zero-dependency CommonJS plugin providing meta-prompting, context engineering, and spec-driven development for Claude Code, OpenCode, Gemini, and Codex. Distributed as `get-shit-done-cc` on npm. Built and maintained by TACHES.

## Current State

**Shipped:** v1.5 Performance (2026-04-04)
**Package:** `get-shit-done-cc` v1.29.0
**Tests:** 259 passing (51 suites)
**Coverage:** core.cjs 94.26% line / 87.11% branch, security.cjs 100% line / 91.11% branch
**Agents:** 15 source, 29 global, 7 archived — all tiered and quality-gated
**Remote:** `git@github.com:UsernameTron/Petes-Get-Shit-Done-Coding-Automation.git`

**Next:** v1.6 Maintainability

## Validated Requirements (v1.5)

All 6 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| PERF-01: Streaming output helper (streamLines) | Phase 15 | Validated |
| PERF-02: Deterministic ordering utility (deterministicSort) | Phase 15 | Validated |
| PERF-03: Lazy-load MODEL_PROFILES in model-profiles.cjs | Phase 16 | Validated |
| PERF-04: Lazy-load skill registry (lazyRegistry) | Phase 16 | Validated |
| PERF-05: Token estimation utility (estimateTokens) | Phase 17 | Validated |
| PERF-06: Context budget helper (budgetContext) | Phase 17 | Validated |

<details>
<summary><strong>v1.4 Requirements (14/14 validated)</strong></summary>

All 14 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| CORR-01: GsdError class with code, context, cause | Phase 11 | Validated |
| CORR-02: Silent catch block audit (~90 blocks) | Phase 11 | Validated |
| CORR-03: loadConfig() silent failure diagnostics | Phase 11 | Validated |
| CORR-04: deepFreeze() utility in core.cjs | Phase 12 | Validated |
| CORR-05: Freeze returns at module boundaries | Phase 12 | Validated |
| CORR-06: .push() mutation safety verification | Phase 12 | Validated |
| CORR-07: safeExec wrapper with timeout support | Phase 14 | Validated |
| CORR-08: execGit uses safeExec with timeout | Phase 14 | Validated |
| CORR-09: Lock force-acquire diagnostics | Phase 14 | Validated |
| DEBT-01: Agent tier label fixes | Phase 13 | Validated |
| DEBT-02: Absorbed agent profile cleanup | Phase 13 | Validated |
| DEBT-03: security.cjs branch coverage >= 95% | Phase 13 | Validated |
| DEBT-04: gsd-validator-hub workflow wiring | Phase 13 | Validated |
| DEBT-05: v1.3 VALIDATION.md gap fill | Phase 13 | Validated |

</details>

<details>
<summary><strong>v1.3 Requirements (6/6 validated)</strong></summary>

All 6 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| SEC-01: Cryptographic temp paths in output() | Phase 7 | Validated |
| SEC-02: Path containment fix (path.sep before startsWith) | Phase 7 | Validated |
| SEC-03: Shell metacharacter blocking in validateShellArg() | Phase 8 | Validated |
| SEC-04: __GSD_TRUNCATED__ sentinel in output fallback | Phase 8 | Validated |
| SEC-05: Branch coverage 82.82% to 87%+ on core.cjs | Phase 9 | Validated |
| SEC-06: Config version tracking + migration registry | Phase 10 | Validated |

</details>

<details>
<summary><strong>v1.2 Requirements (7/7 validated)</strong></summary>

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| CREW-01: Fix YAML parsing in 8 agents | Phase 6 | Validated (no changes needed) |
| CREW-02: Consolidate verification agents (4→1) | Phase 6 | Validated |
| CREW-03: Consolidate research agents (2→1) | Phase 6 | Validated |
| CREW-04: Consolidate validator agents (2→1) | Phase 6 | Validated |
| CREW-05: Wire utility agents into workflows | Phase 6 | Validated |
| CREW-06: Tool-access tiers for all agents | Phase 6 | Validated |
| CREW-07: Quality sections for low-scoring agents | Phase 6 | Validated |

</details>

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
| crypto.randomBytes for temp paths | Date.now() was predictable — race condition and symlink attack vector | v1.3 Phase 7 |
| Config migration registry pattern | Array of {from, to, migrate} objects over version-keyed map — matches DB migration conventions | v1.3 Phase 10 |
| validateShellArg as library infra | No production callers yet — design-intentional for downstream consumers | v1.3 Phase 8 |
| __GSD_TRUNCATED__ as LLM protocol marker | No programmatic consumer — protocol-level for LLM detection of truncated output | v1.3 Phase 8 |
| 4→1 verification consolidation | Overlapping scopes unified into gsd-verifier with scope param | v1.2 Phase 6 |
| 3-tier tool access | Explore (read), Research (+web), Modify (+write) applied to all agents | v1.2 Phase 6 |
| Integration tests use real code paths | Prior incident where mock/prod divergence masked failures | v1.1 Phase 4 |

## Context

- Repo flattened in PR #8, stale artifacts removed in PRs #10-#12
- v1.1 work shipped in PRs #13 (Phase 2), #14 (Phase 3), #16 (Phase 4), #18 (Phase 5)
- `get-shit-done/` is the GSD engine core (132 tracked files)
- Two plugin.json files exist (root and plugins/)
- Governance templates in `governance/` define session initialization behavior
- 3 specialist agents deployed: plugin-developer, test-runner, docs-sync
- 15 source agents + 7 archived agents after v1.2 consolidation
- 25 source files instrumented for coverage across lib, hooks, gsd-tools, bin, scripts
- v1.3 added config migration system — configs auto-gain config_version on first load

## Tech Debt (carried into v1.5)

- validateShellArg has zero production callers (library infrastructure)
- __GSD_TRUNCATED__ sentinel has no programmatic consumer (LLM protocol marker)
- GSD v1.29 publish (version bump not yet done)
- Align plugin.json author fields with package.json (META-01)

## Deferred

- Abort controller propagation (needs async refactor, v1.6 candidate)
- Plugin audit and marketplace (ecosystem-level concern, v1.6)
- skill-forge consolidation (maintainability scope, v1.6)

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
*Last updated: 2026-04-04 -- v1.5 Performance milestone complete*
