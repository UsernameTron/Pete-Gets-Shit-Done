# DevOps Handoff — get-shit-done-cc

> Last verified: 2026-04-17 | Version: 1.30.0 | Milestone: v2.5

---

## Project Summary

**get-shit-done-cc** is a meta-prompting, context engineering, and spec-driven development system for Claude Code (and compatible with OpenCode, Gemini CLI, and Codex). It provides a complete execution engine (discuss, plan, execute, verify, ship) plus a governance framework (session management, safety guardrails, project standards) delivered as a CLI-installed plugin.

| Field | Value |
|-------|-------|
| Package | `get-shit-done-cc` |
| Version | 1.30.0 |
| Author | Pete Connor |
| License | MIT |
| Repository | [github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) |
| Distribution | npm (`npx get-shit-done-cc@latest`) |

---

## Environment Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js >= 20.0.0 |
| Platform | macOS, Windows, Linux |
| Runtime dependencies | **0** (zero) |
| Dev dependencies | 2 (`c8` ^11.0.0 for coverage, `esbuild` ^0.25.12 for hook bundling) |
| Host tool | Claude Code CLI (installed separately) |

No database, no Docker, no cloud services required. The package installs entirely into the user's Claude Code configuration directory.

---

## Installation

```bash
npx get-shit-done-cc@latest
```

The installer (`bin/install.js`) copies the following into the user's Claude Code config:

| Component | Destination | Contents |
|-----------|-------------|----------|
| Commands | `~/.claude/get-shit-done/commands/` | 63 GSD slash commands |
| Agents | `~/.claude/get-shit-done/agents/` | 17 specialized agent definitions |
| Hooks | `~/.claude/get-shit-done/hooks/` | 7 execution hooks (bundled JS) |
| Workflows | `~/.claude/get-shit-done/workflows/` | Orchestration templates |
| Governance | `~/.claude/get-shit-done/governance/` | CLAUDE.md template, 10 governance hooks |
| Plugins | Respective plugin directories | 45 skills, 10 subagents, 6 reference docs |
| Scripts | `~/.claude/get-shit-done/scripts/` | Utility scripts |

The installer is idempotent. Running it again overwrites with the latest version.

---

## Configuration Reference

| File | Purpose | Location |
|------|---------|----------|
| `plugin.json` | Package manifest (commands, agents, hooks, settings) | Package root |
| `plugins/plugin.json` | Governance plugin manifest | `plugins/` |
| `governance/templates/global/CLAUDE.md` | Session initialization template | Copied to user's project |
| `.claude/settings.json` | User's Claude Code settings (hooks, permissions) | User config |
| `.c8rc.json` | Coverage configuration | Package root |

### Key npm Scripts

| Script | Purpose |
|--------|---------|
| `npm test` | Run 2,377 unit tests via `scripts/run-tests.cjs` |
| `npm run test:e2e` | Run 133 E2E integration tests via `scripts/run-e2e-tests.cjs` |
| `npm run test:e2e:smoke` | Run E2E smoke subset (12 tests) |
| `npm run test:coverage` | Unit tests with text + JSON coverage report |
| `npm run test:coverage:full` | Unit tests with text + lcov + JSON coverage report |
| `npm run build:hooks` | Bundle hook source files via esbuild |
| `npm run prepublishOnly` | Runs `build:hooks` before npm publish |

---

## Test Suite Overview

| Metric | Count |
|--------|-------|
| Unit tests | 2,377 |
| E2E tests | 133 |
| **Total tests** | **2,510** |
| Unit test files | 74 |
| E2E test files | 11 |
| **Total test files** | **85** |
| Test framework | Node.js built-in test runner (`node:test`) |
| Assertion library | Node.js built-in (`node:assert`) |

### Running Tests

```bash
# All unit tests
npm test

# All E2E tests
npm run test:e2e

# E2E smoke tests (fast subset)
npm run test:e2e:smoke

# Unit tests with coverage
npm run test:coverage

# Unit tests with full coverage (includes lcov for CI)
npm run test:coverage:full
```

### Test Organization

- **Unit tests**: `tests/**/*.test.cjs` — test individual modules (core, security, commands, state, init, hooks, gsd-tools, scripts)
- **E2E tests**: `tests/e2e/**/*.test.cjs` — test end-to-end flows (installation, command execution, agent spawning, hook lifecycle)

All tests use Node.js built-in test runner with no external test framework. Zero test dependencies beyond the Node.js runtime.

---

## Code Coverage

Coverage is collected via `c8` with configuration in `.c8rc.json`.

| Module | Line Coverage | Branch Coverage |
|--------|--------------|-----------------|
| `core.cjs` | 95.60% | 90.84% |
| `classify.cjs` | 98.20% | 85.43% |
| `history.cjs` | 96.13% | 90.82% |
| `model-profiles.cjs` | 100.00% | 92.30% |
| `security.cjs` | 100.00% | 100.00% |

### Coverage Standards

- Overall project: >= 90%
- Individual modules: >= 80%
- Security-critical modules: >= 95%

Current coverage exceeds all thresholds.

---

## CI/CD Status

**No CI/CD pipeline.** Distribution is npm-only via `npx get-shit-done-cc@latest`. The package is published manually to npm.

| Aspect | Status |
|--------|--------|
| Continuous Integration | Not configured |
| Continuous Deployment | Not configured |
| npm publish | Manual (`npm publish`) |
| Pre-publish gate | `prepublishOnly` runs `build:hooks` |
| Test gate | Manual (run `npm test && npm run test:e2e` before publish) |

This is appropriate for the project's current stage: a CLI plugin distributed via npm with no server component, no API surface, and no production deployment.

---

## Security Notes

### Zero Runtime Dependencies

The package has **zero runtime dependencies**. This eliminates supply chain risk entirely — there are no transitive dependencies to audit, no dependency trees to monitor, and no vulnerability surface from third-party code.

### Prompt Injection Protection

- `hooks/gsd-prompt-guard.js` — Scans tool inputs for prompt injection patterns at runtime
- `get-shit-done/bin/lib/security.cjs` — Security utilities including input sanitization and validation
- The security module has 100% line and 100% branch coverage

### Hook Safety

Five execution hooks are bundled from source via esbuild:

| Hook | Purpose |
|------|---------|
| `gsd-prompt-guard.js` | Prompt injection scanning on tool inputs |
| `gsd-workflow-guard.js` | Workflow state validation |
| `gsd-context-monitor.js` | Context window usage monitoring |
| `gsd-check-update.js` | Version update checking |
| `gsd-statusline.js` | Status line display |

Hooks run as PreToolUse/PostToolUse lifecycle events within Claude Code's sandboxed execution model.

### File Access

The installer only writes to the user's Claude Code configuration directory (`~/.claude/`). It does not modify system files, install global binaries, or require elevated permissions.

---

## Agent Inventory

15 active specialized agents:

| Agent | Role |
|-------|------|
| `gsd-advisor-researcher` | Researches gray area decisions |
| `gsd-assumptions-analyzer` | Analyzes codebase assumptions with evidence |
| `gsd-codebase-mapper` | Explores and maps codebase structure |
| `gsd-debugger` | Systematic debugging with persistent state |
| `gsd-executor` | Executes plans with atomic commits |
| `gsd-planner` | Creates phase plans with task breakdown |
| `gsd-research-orchestrator` | Unified research (scope: phase or project) |
| `gsd-research-synthesizer` | Synthesizes research outputs |
| `gsd-roadmapper` | Creates project roadmaps |
| `gsd-ui-auditor` | Retroactive UI visual audit |
| `gsd-ui-checker` | Validates UI spec contracts |
| `gsd-ui-researcher` | UI design research |
| `gsd-user-profiler` | Developer behavioral profiling |
| `gsd-validator-hub` | Unified validation (extension or ecosystem) |
| `gsd-verifier` | Unified verification (scope: general, plan, integration, nyquist) |

Agent definitions are in `agents/*.md` with YAML frontmatter specifying name, description, tools, model, and skills.

---

## Intelligence Layer (v2.0)

Added in config_version 2. Three new modules provide optional intelligence features:

| Module | Layer | Purpose |
|--------|-------|---------|
| `classify.cjs` | Layer 0 (zero dependencies) | Task classification: `extractSignals()`, `classifyTask()`, `adaptWorkflowGates()` |
| `model-profiles.cjs` | Layer 0 | Dynamic model routing: `dynamicSelect()`, `MODEL_TIERS` mapping |
| `history.cjs` | Layer 2 (imports `core.cjs`) | Execution history: `recordExecution()`, `queryHistory()`, `detectPatterns()`, `pruneHistory()` |

### Execution History File Structure

History is stored as JSONL at `.planning/history/executions.jsonl`. Each line is a JSON record with fields: `timestamp`, `phase`, `plan`, `agent`, `model_used`, `duration_ms`, `outcome` (pass/fail/partial), `error_code`, `files_changed`.

Rotation policy: when the file exceeds 1,000 records, auto-rotates to keep the latest 500. Manual pruning available via `gsd-tools history prune [--keep N]`.

### Configuration

All intelligence features are opt-in. Controlled by two config keys added in the v1→v2 migration:

| Key | Default | Effect |
|-----|---------|--------|
| `routing_strategy` | `static` | `static` = v1.9 behavior. `dynamic` = classification-based routing. `auto` = dynamic + history patterns. |
| `adaptive` | `false` | When `true`, classification runs during init and workflow gates adjust per complexity. |

---

## Deployment Maturity

| Dimension | Status |
|-----------|--------|
| Package distribution | npm (production) |
| Installation | One-command CLI (`npx`) |
| Test coverage | 95%+ line, 90%+ branch on core |
| Security coverage | 100% on security module |
| Documentation | README, User Guide, Architecture, Agent catalog, CLI reference, Configuration reference |
| Versioning | Semantic versioning (currently v1.30.0) |
| Server component | None — CLI plugin only |
| Database | None |
| Cloud services | None |
| CI/CD | Not configured (manual npm publish) |

This is a **CLI plugin**, not a deployed service. There is no server to monitor, no database to back up, no infrastructure to scale. The deployment surface is: `npm publish` followed by users running `npx get-shit-done-cc@latest`.

---

## v2.3 Hook Ecosystem + Security Guardian + Agent Quality

Added in milestone v2.3 (2026-04-13):

| Component | What was added |
|-----------|---------------|
| Execution hooks (+3) | `gsd-prompt-guard.js` (18 injection patterns, PreToolUse), `gsd-config-protection.js` (32 protected files, PreToolUse), `gsd-cost-tracker.js` (JSONL metrics, PostToolUse) |
| Security agent | `gsd-security-guardian` — design-time security reviewer, 6 threat categories, read-only plan mode, worktree isolation |
| Threat model reference | `references/agent-threat-model.md` — 6 categories with attack vectors, detection patterns, mitigation strategies |
| 4D scoring rubric | `gsd-verifier` extended with security (35%), performance (25%), correctness (25%), maintainability (15%) rubric |
| Necessity gate | `references/agent-necessity-gate.md` — three-part gate (context pollution, parallelizability, specialization) for subagent creation |
| Two-mode verify | `workflows/verify-work.md` supports `--mode=compliance`, `--mode=schema`, or both (default) |

---

## Known Tech Debt

| Item | Status | Details |
|------|--------|---------|
| CLAUDE.md Phase 3 quality gates | Resolved (v2.0) | Updated to reference `gsd-verifier` with scope parameters |
| Stale agent references | Resolved (v1.9 Phase 28) | All agent files updated to use current names; 17 active agents as of v2.5 |
| CI/CD pipeline | Deferred | No automated test/publish pipeline; appropriate for current project stage |

For full tech debt tracking, see `.planning/PROJECT.md`.

---

## Quick Reference

```bash
# Install
npx get-shit-done-cc@latest

# Run all tests
npm test && npm run test:e2e

# Run with coverage
npm run test:coverage:full

# Build hooks before publish
npm run build:hooks

# Publish
npm publish
```
