# DevOps Handoff — get-shit-done-cc

> Last verified: 2026-07-11 | Version: 1.30.0 | Milestone: Between milestones (v2.8 shipped)

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
| Dev dependencies | 2 (`c8` ^11.0.0 for coverage, `esbuild` ^0.28.1 for hook bundling) |
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
| Commands | `~/.claude/get-shit-done/commands/` | 67 GSD slash commands |
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
| `npm test` | Run 2,969 unit tests via `scripts/run-tests.cjs` |
| `npm run test:e2e` | Run 143 E2E integration tests via `scripts/run-e2e-tests.cjs` |
| `npm run test:e2e:smoke` | Run E2E smoke subset (12 tests) |
| `npm run test:coverage` | Unit tests with text + JSON coverage report |
| `npm run test:coverage:full` | Unit tests with text + lcov + JSON coverage report |
| `npm run build:hooks` | Bundle hook source files via esbuild |
| `npm run prepublishOnly` | Runs `build:hooks` before npm publish |
| `node scripts/validate-doc-links.cjs` | Internal Markdown link validator — exits 0 on clean, 1 on broken. Use `--json` for machine-readable output. Use `--exclude <glob>` (multi-value, gitignore-style) to suppress intentional fixtures or template examples. Wired into `.github/workflows/test.yml` as the `docs-integrity` job (blocking gate). |
| `node scripts/check-doc-drift.cjs` | Doc drift detector. Compares live test counts, coverage, agent/command/skill/hook inventory against numeric claims in the three living docs. Exit 0 = clean, 1 = drift, 2 = runtime/coverage error. Wired into `.github/workflows/test.yml` as a step inside the `test` job (single-leg: ubuntu-latest, Node 22, full suite; blocking gate). |

---

## Test Suite Overview

| Metric | Count |
|--------|-------|
| Unit tests | 2,969 |
| E2E tests | 143 |
| **Total tests** | **3,022** |
| Unit test files | 82 |
| E2E test files | 12 |
| **Total test files** | **94** |
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

**CI pipeline active.** GitHub Actions runs on every PR and push to main.

| Aspect | Status |
|--------|--------|
| Continuous Integration | GitHub Actions (`test.yml` — Node 20+22, Ubuntu + macOS) |
| Security Scanning | GitHub Actions (`security-scan.yml` — prompt injection, secrets, base64) |
| Issue Management | GitHub Actions (`auto-label-issues.yml`) |
| Continuous Deployment | Not configured (manual npm publish) |
| npm publish | Manual (`npm publish`) |
| Pre-publish gate | `prepublishOnly` runs `build:hooks` |
| Test gate | CI enforced (`npm test && npm run test:e2e` before merge) |

Distribution is npm-only via `npx get-shit-done-cc@latest`.

---

## GitHub Repository Security

Configured 2026-04-18 on the GitHub remote. These protections are enforced at the repository level, independent of local GSD hooks.

### Branch Protection (main)

| Rule | Setting |
|------|---------|
| Require pull request before merging | Enabled |
| Required status checks | 5 required: `test (macos-latest, 22, false)`, `test (ubuntu-latest, 20, true)`, `test (ubuntu-latest, 22, true)`, `governance`, `docs-integrity` (added v2.8 Phase 57; operator runs `gh api repos/:owner/:repo/branches/main/protection -X PATCH` at ship time — see Phase 57-03 SUMMARY for the exact command). The third matrix value is the `full_suite` flag. |
| Require branches to be up to date | Enabled |
| Block force pushes | Enabled |

No code reaches `main` without a PR and all 5 CI jobs passing.

**Audit tool:** `/gsd:harden-repo` audits branch protection against the standard policy and can apply fixes via `--fix`. Uses read-merge-PUT to avoid partial updates.

### Dependabot

| Feature | Status |
|---------|--------|
| Vulnerability alerts | Enabled |
| Security updates | Enabled (auto-PRs for CVEs) |
| Version updates | Enabled (weekly npm checks) |
| Grouped security updates | Enabled |
| Config file | `.github/dependabot.yml` |

### Secret Scanning

| Feature | Status |
|---------|--------|
| Secret scanning | Enabled |
| Push protection | Active (blocks commits containing detected secrets) |

### CodeQL Analysis

| Setting | Value |
|---------|-------|
| Setup | Default |
| Languages | JavaScript/TypeScript, GitHub Actions |
| Triggers | Push to `main`, pull requests to `main` |

### Required Status Checks Summary

All 5 CI jobs must pass before any PR can merge to `main`:
1. `test (macos-latest, 22, false)` — macOS Node 22 (smoke suite)
2. `test (ubuntu-latest, 20, true)` — Ubuntu Node 20 (full suite)
3. `test (ubuntu-latest, 22, true)` — Ubuntu Node 22 (full suite)
4. `governance` — GSD governance checks
5. `docs-integrity` — Internal Markdown link validation (v2.8 Phase 57)

The third element of the `test` matrix is the `full_suite` boolean flag (defined in `.github/workflows/test.yml`).

---

## Security Notes

### Zero Runtime Dependencies

The package has **zero runtime dependencies**. This eliminates supply chain risk entirely — there are no transitive dependencies to audit, no dependency trees to monitor, and no vulnerability surface from third-party code.

### Prompt Injection Protection

- `hooks/gsd-prompt-guard.js` — Scans tool inputs for prompt injection patterns at runtime
- `get-shit-done/bin/lib/security.cjs` — Security utilities including input sanitization and validation
- The security module has 100% line and 100% branch coverage

### Hook Safety

Six execution hooks are bundled from source via esbuild:

| Hook | Purpose |
|------|---------|
| `gsd-prompt-guard.js` | Prompt injection scanning on tool inputs (23 patterns) |
| `gsd-config-protection.js` | Config file protection (32 protected files) |
| `gsd-cost-tracker.js` | JSONL cost metrics per session |
| `gsd-context-monitor.js` | Context window usage monitoring |
| `gsd-check-update.js` | Version update checking |
| `gsd-statusline.js` | Status line display |

Hooks run as PreToolUse/PostToolUse lifecycle events within Claude Code's sandboxed execution model.

### File Access

The installer only writes to the user's Claude Code configuration directory (`~/.claude/`). It does not modify system files, install global binaries, or require elevated permissions.

---

## Agent Inventory

17 active specialized agents:

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
| `gsd-dependency-auditor` | Audits package dependencies for CVEs, staleness, license compatibility |
| `gsd-ecosystem-auditor` | Audits agent ecosystem for frontmatter integrity and hygiene |

Agent definitions are in `agents/*.md` with YAML frontmatter specifying name, description, tools, model, and skills.

---

## Execution History (telemetry)

| Module | Layer | Purpose |
|--------|-------|---------|
| `model-profiles.cjs` | Layer 0 | Static agent→model profile data and helpers |
| `history.cjs` | Layer 2 (imports `core.cjs`) | Execution history: `recordExecution()`, `queryHistory()`, `detectPatterns()`, `pruneHistory()` |

History is stored as JSONL at `.planning/history/executions.jsonl`. Each line is a JSON record with fields: `timestamp`, `phase`, `plan`, `agent`, `model_used`, `duration_ms`, `outcome` (pass/fail/partial), `error_code`, `files_changed`.

Rotation policy: when the file exceeds 1,000 records, auto-rotates to keep the latest 500. Manual pruning available via `gsd-tools history prune [--keep N]`.

The v2.0 dynamic-routing layer (`classify.cjs`, `dynamicSelect()`, and the `routing_strategy`/`adaptive` config keys) was removed in v2.9's Bitter Lesson surgery — model selection is user config (`model_profile`, `model_overrides`) only.

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
| Execution hooks (+3) | `gsd-prompt-guard.js` (23 injection patterns, PreToolUse), `gsd-config-protection.js` (32 protected files, PreToolUse), `gsd-cost-tracker.js` (JSONL metrics, PostToolUse) |
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
| Stale agent references | Resolved (v1.9 Phase 28) | All agent files updated to use current names; 17 active agents as of v2.7 |
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
