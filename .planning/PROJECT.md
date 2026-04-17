# get-shit-done-cc

## What This Is

A zero-dependency CommonJS plugin providing meta-prompting, context engineering, and spec-driven development for Claude Code, OpenCode, Gemini, and Codex. Distributed as `get-shit-done-cc` on npm. Built and maintained by TACHES.

## Current State

**Current milestone:** v2.6 Developer Experience (started 2026-04-17)
**Previous:** v2.5 Final Documentation Sync (shipped 2026-04-17, PR #2 merged)
**Package:** `get-shit-done-cc` v1.30.0
**Tests:** 2,490 total, all passing
**Coverage:** 90.79% statements, 83.11% branches, 97.43% functions
**Agents:** 17 active, 7 archived, 3 specialist — all tiered and quality-gated
**Remote:** `git@github.com:UsernameTron/Petes-Get-Shit-Done-Coding-Automation.git`
**Config version:** 2 (migration chain: 0 -> 1 -> 2)
**Milestones shipped:** 15 (v1.0 through v2.5)
**Total phases executed:** 48

## Core Value

GSD delivers disciplined, reproducible software delivery inside Claude Code by enforcing a 5-phase lifecycle (discuss → plan → execute → verify → ship) with wave-based parallelization, quality gates, and adaptive task routing. The core value is **predictable, high-quality execution at scale** — turning ambiguous prompts into shipped, tested, documented code without skipped steps.

## Requirements

### Active

- [ ] Install-from-clone script — one command from fresh git clone to working GSD install
- [ ] /gsd:ci-watch command — auto-poll CI after push, surface pass/fail inline
- [ ] /gsd:sync-docs command — scan codebase and update all docs to match current state

### Out of Scope

- GUI installer — CLI-only project, no graphical installer needed
- CI provider abstraction — GitHub Actions only, no Jenkins/GitLab/Circle support this milestone

## Current Milestone: v2.6 Developer Experience

**Goal:** Three high-impact DX improvements that make GSD portable, CI-aware, and self-documenting.

**Target features:**
- Install-from-clone script (npm install, symlink commands, install hooks, register plugins, copy injection-patterns.json)
- /gsd:ci-watch command (auto-poll gh run list, wait for completion, surface results inline)
- /gsd:sync-docs command (scan codebase, update README, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF, CHANGELOG, references)

**Phases:** 3 (Phases 49-51), sequential execution
**Status:** Defining requirements

<details>
<summary><strong>v2.4 Foundation Hardening (7/7 requirements shipped)</strong></summary>

**Goal:** Fix the 3 highest-risk structural findings from the 8-dimension foundation audit (D5 orphaned factory cache, D6c injection pattern divergence, D6a dead version tracking), then sweep the remaining 4 WARN items in a housekeeping pass.

**Key deliverables:**
- PLUG-01: claude-code-factory registered in marketplace.json with validated source path resolution and integration test
- SECPAT-01: Merged diverged hook (18) and library (18) injection patterns into a 23-pattern canonical superset with build-time inlining
- HOOK-04: build-hooks.js now stamps real package version (1.30.0) into all 7 dist hooks, making staleness detection operative
- DOC-01: Agent/command counts corrected (17 agents, 63 commands)
- COV-01: Branch coverage raised for workstream.cjs and build-hooks.js above 80%
- LINK-01: Command/workflow linkage drift resolved
- REF-01: crew.md hardcoded project path fixed for portability

**Shipped via:** PR #1, merged 2026-04-17. Phase 47 agent roster assessment included.

| ID | Title | Phase | Status |
|----|-------|-------|--------|
| PLUG-01 | Register claude-code-factory in marketplace.json and load from live source | Phase 45 | Shipped |
| SECPAT-01 | Create shared injection pattern file consumed by both gsd-prompt-guard.js and security.cjs | Phase 45 | Shipped |
| HOOK-04 | Implement {{GSD_VERSION}} substitution in build-hooks.js or remove placeholder from all 7 hooks | Phase 45 | Shipped |
| DOC-01 | Update README.md and CLAUDE.md agent/command counts (16→17 agents, 61→63 commands) | Phase 46 | Shipped |
| COV-01 | Raise branch coverage for workstream.cjs and build-hooks.js above 80% | Phase 46 | Shipped |
| LINK-01 | Resolve command/workflow linkage drift (11 unlinked commands, 5 orphaned workflows) | Phase 46 | Shipped |
| REF-01 | Fix crew.md hardcoded project path for portability | Phase 46 | Shipped |

</details>

<details>
<summary><strong>v2.3 Hook Ecosystem + Security Guardian + Agent Quality (8/8 requirements shipped)</strong></summary>

**Goal:** Port high-value hooks from the ECC diamond hunt, fill the security Guardian gap, and extend agent quality infrastructure.

**Key deliverables:**
- HOOK-01/02/03: Prompt injection, config protection, and cost tracker hooks (Phase 41)
- SEC3-01/02: gsd-security-guardian agent + threat model reference (Phase 42)
- QUAL-01/02/03: 4D scoring rubric, necessity gate, two-mode verification (Phase 43)

**Shipped via:** PR #49 merged 2026-04-15 at 75b29cd.

</details>

<details>
<summary><strong>v2.2 Security Hardening (4/4 requirements shipped)</strong></summary>

**Goal:** Fix 4 high-severity security findings from the full system audit (H-01, H-10, H-09, H-08).

**Key deliverables:**
- SEC2-01: `@file:` allowlist in path validation (Phase 39)
- SEC2-02: `requireSafePath` enforcement for command paths (Phase 39)
- SEC2-03: `execSync` elimination — `safeExec` everywhere (Phase 40)
- SEC2-04: `indexOf` scanner + `escapeRegex` + 1MB guard (Phase 40)

**Shipped via:** PR #47 (code) + PR #48 (audit). Canonical record: `.planning/v2.2-MILESTONE-AUDIT.md`. Deferred to v2.3: H-06, H-07 (refactors, not exposure).

</details>

<details>
<summary><strong>v2.1 System Audit & Debt Closure (10/10 requirements shipped)</strong></summary>

**Goal:** Close all remaining tech debt from v1.2, verify v1.4 fixes, and conduct comprehensive system audit.

**Key deliverables:**
- Backfilled 3 missing Phase 6 SUMMARYs, fixed stale agent references, created Nyquist VALIDATION.md
- Confirmed v1.4 DEBT-01/DEBT-04 fixes (15/15 agent tiers, validator-hub routing)
- System audit: 15 agents, 61 commands, 16 hooks all validated
- Coverage pushed to 90.41% overall, all modules >= 80%, security 100%
- Documentation accuracy sweep across CLAUDE.md, README.md, DEVOPS-HANDOFF.md

See [v2.1 Requirements Archive](milestones/v2.1-REQUIREMENTS.md) | [v2.1 Roadmap Archive](milestones/v2.1-ROADMAP.md)

</details>

<details>
<summary><strong>v2.0 Intelligence Layer (23/23 requirements shipped)</strong></summary>

**Goal:** Make the GSD engine smarter — route models by task complexity, learn from execution history, adapt workflow behavior automatically.

**Key deliverables:**
- Dynamic model routing via `dynamicSelect()` gated behind `routing_strategy` config
- Task classification engine in `classify.cjs` (trivial/standard/complex/critical)
- Execution history in `history.cjs` with JSONL storage, pattern detection, auto-rotation
- Adaptive workflow gates adjusting research depth, verification rigor, parallelization
- Config migration v1 -> v2 with safe defaults
- CLI commands: `gsd-tools history list|stats|prune`

See [v2.0 Requirements Archive](milestones/v2.0-REQUIREMENTS.md) | [v2.0 Roadmap Archive](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary><strong>v1.7 Requirements (13/13 validated)</strong></summary>

All 13 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| E2E-01: Test harness with mocked LLM layer | Phase 22 | Validated |
| E2E-02: Fixture system for project scaffolding | Phase 22 | Validated |
| E2E-03: Assertion helpers (exit codes, file content, state) | Phase 22 | Validated |
| E2E-04: new-project end-to-end flow | Phase 23 | Validated |
| E2E-05: discuss-phase through execute-phase pipeline | Phase 23 | Validated |
| E2E-06: verify-work through ship pipeline | Phase 23 | Validated |
| E2E-07: quick/fast/do command coverage | Phase 24 | Validated |
| E2E-08: progress/stats/health command coverage | Phase 24 | Validated |
| E2E-09: Milestone lifecycle (new/audit/complete/cleanup) | Phase 24 | Validated |
| E2E-10: Workstream management commands | Phase 24 | Validated |
| E2E-11: Failure mode handling and recovery | Phase 25 | Validated |
| E2E-12: Edge case coverage (empty projects, corrupt state) | Phase 25 | Validated |
| E2E-13: CI integration and regression gate | Phase 25 | Validated |

</details>

<details>
<summary><strong>v1.6 Requirements (12/12 validated)</strong></summary>

All 12 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| MAINT-01: Layered architecture refactoring | Phase 18 | Validated |
| MAINT-02: Feature flags for experimental capabilities | Phase 19 | Validated |
| MAINT-03: Skills extensibility improvements | Phase 20 | Validated |
| MAINT-04: Orphaned skills audit and cleanup | Phase 20 | Validated |
| MAINT-05: Skill versioning system | Phase 20 | Validated |
| MAINT-06: Sync-compatible cancel tokens | Phase 18 | Validated |
| MAINT-07: Wire validateShellArg to production caller | Phase 19 | Validated |
| MAINT-08: Wire __GSD_TRUNCATED__ to programmatic consumer | Phase 19 | Validated |
| MAINT-09: skill-forge consolidation | Phase 20 | Validated |
| META-01: Align plugin.json author fields with package.json | Phase 21 | Validated |
| META-02: Version bump and publish prep | Phase 21 | Validated |
| META-03: Plugin audit and marketplace prep | Phase 21 | Validated |

</details>

<details>
<summary><strong>v1.5 Requirements (6/6 validated)</strong></summary>

All 6 requirements verified complete:

| Requirement | Phase | Outcome |
|-------------|-------|---------|
| PERF-01: Streaming output helper (streamLines) | Phase 15 | Validated |
| PERF-02: Deterministic ordering utility (deterministicSort) | Phase 15 | Validated |
| PERF-03: Lazy-load MODEL_PROFILES in model-profiles.cjs | Phase 16 | Validated |
| PERF-04: Lazy-load skill registry (lazyRegistry) | Phase 16 | Validated |
| PERF-05: Token estimation utility (estimateTokens) | Phase 17 | Validated |
| PERF-06: Context budget helper (budgetContext) | Phase 17 | Validated |

</details>

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
| Optional taskContext for backward compat | New dynamic routing parameter must be optional — absent = exact v1.9 behavior | v2.0 Phase 30 |
| JSONL for execution history | Append-only, zero-dep, line-by-line parseable, trivially rotatable — no SQLite | v2.0 Phase 32 |
| Rule-based pattern detection | Zero-dependency constraint forbids ML libs — heuristic/rule-based only | v2.0 Phase 32 |
| routing_strategy defaults to static | Existing users see zero behavior change until explicit opt-in | v2.0 Phase 30 |

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
- v2.0 adds 2 new modules: classify.cjs (task classification), history.cjs (execution history)
- v2.0 extends model-profiles.cjs with dynamicSelect(), core.cjs with optional taskContext
- v2.3 added 3 execution hooks (prompt guard, config protection, cost tracker), security guardian agent, and 4D verifier rubric
- 17 active agents, 63 commands

## Tech Debt

All prior tech debt items resolved through v1.9. No outstanding debt entering v2.0.

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
*Last updated: 2026-04-17 -- v2.6 Developer Experience milestone started*
