---
phase: 22
title: Test Infrastructure
type: infrastructure
created: "2026-04-04"
---

# Phase 22 Context — Test Infrastructure

## Objective

Build the E2E test harness, mock layer, fixture system, and assertion helpers for v1.7 integration testing.

## Requirements

- **E2E-01**: Test harness with mocked LLM layer — intercepts all LLM/subagent calls, returns deterministic canned responses, captures command invocations. Must support both sync and async code paths within the zero-dependency CommonJS constraint.
- **E2E-02**: Fixture system for project scaffolding — helpers that create temporary `.planning/` directories with valid STATE.md, ROADMAP.md, REQUIREMENTS.md, and PROJECT.md files in known states (empty project, mid-milestone, completed milestone). Auto-cleanup after test.
- **E2E-03**: Assertion helpers for exit codes, file content, and state — `assertExitCode(cmd, expected)`, `assertFileContains(path, pattern)`, `assertStateField(field, value)` and similar helpers with clear failure messages.

## Technical Context

- Zero-dependency CommonJS constraint — no test frameworks allowed (no Jest, Mocha, etc.)
- Existing test infrastructure: 259 tests passing across 51 suites using custom runner in `get-shit-done/test/`
- Coverage tooling: c8 with NYC-compatible output
- Key files: `get-shit-done/lib/core.cjs`, `get-shit-done/lib/security.cjs`, `get-shit-done/gsd-tools.cjs`
- The mock layer must intercept the LLM interaction pattern used by GSD subagents

## Grey Areas (Auto-Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mock granularity | Function-level stubs on core.cjs exports | Matches existing test patterns, minimal coupling |
| Fixture storage | Temp dirs via os.tmpdir() + crypto.randomBytes | Follows SEC-01 pattern already in codebase |
| Assertion style | Node assert + custom wrappers | Zero-dependency constraint, consistent with existing tests |
| Test file location | `get-shit-done/test/e2e/` subdirectory | Separates E2E from unit tests, discoverable |
