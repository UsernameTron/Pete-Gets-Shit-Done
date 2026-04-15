---
phase: 42-security-guardian
plan: "01"
subsystem: agents
tags: [security, agent, threat-model, design-time-review]
dependency_graph:
  requires: []
  provides: [gsd-security-guardian agent, agent-threat-model reference]
  affects: [CLAUDE.md, README.md, agents/*, get-shit-done/references/*]
tech_stack:
  added: []
  patterns: [10/10 defense-in-depth agent shape, 6-category threat model, 4-Layer Defense Model]
key_files:
  created:
    - agents/gsd-security-guardian.md
    - get-shit-done/references/agent-threat-model.md
  modified:
    - CLAUDE.md
    - README.md
    - tests/copilot-install.test.cjs
decisions:
  - "Used placeholder path in agent project_context rather than hardcoded absolute path — matches gsd-dependency-auditor pattern, required by path-replacement.test.cjs"
  - "Added gsd-security-guardian to copilot-install.test.cjs expected agent list — test uses hardcoded array not dynamic discovery"
metrics:
  duration_minutes: 18
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_created: 2
  files_modified: 3
requirements_satisfied: [SEC3-01, SEC3-02]
---

# Phase 42 Plan 01: Security Guardian Summary

**One-liner:** `gsd-security-guardian` design-time security review agent with 6-category threat model reference doc using 10/10 defense-in-depth shape, sonnet model, and read-only plan mode.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create threat model reference doc and security guardian agent | 2fa9073 | agents/gsd-security-guardian.md, get-shit-done/references/agent-threat-model.md |
| 2 | Update CLAUDE.md and README.md agent inventories | 04bf101 | CLAUDE.md, README.md |

## Artifacts Produced

### `get-shit-done/references/agent-threat-model.md` (SEC3-02)

Pure-reference document covering 6 agent-specific threat categories, each with Attack Vectors, Detection Patterns, and Mitigation Strategies sections:

1. Prompt Injection — instruction overrides in files/tool results
2. Shell Injection — command construction with user-controlled strings
3. Path Traversal — directory escape via `../`, symlinks, absolute paths
4. Credential Leakage — `.env` reads, API key patterns, env exposure
5. Sandbox Escape — config modification, git hook exploitation
6. Resource Exhaustion — tool loops, missing `maxTurns`, unbounded writes

Ends with a 4-Layer Defense Model (Permission System, Sandbox, Path Validation, Environment Scrubbing) and a cross-threat coverage matrix.

### `agents/gsd-security-guardian.md` (SEC3-01)

Agent definition at the 10/10 defense-in-depth standard:
- `model: sonnet` — pattern matching against known threat categories
- `permissionMode: plan` — read-only at the permission level
- `disallowedTools: Write, Edit, WebFetch, WebSearch, mcp__context7__*` — read-only enforced at tool level
- `isolation: worktree` — blast radius containment
- `maxTurns: 30` — resource exhaustion prevention
- `color: red` — security agent palette convention
- 6 required body sections: `<role>`, `<model_rationale>`, `<scope_guard>`, `<project_context>`, `<anti_patterns>` (10 rules), `<completion_criteria>`
- References `@get-shit-done/references/agent-threat-model.md` as authoritative rubric
- Explicitly distinguishes from HOOK-01/02/03 runtime enforcement

Auto-discovered by `bin/install.js` via `agents/gsd-*.md` glob — no installer code changes needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Absolute path in agent file failed path-replacement test**
- **Found during:** Task 1 (test run after commit)
- **Issue:** `<project_context>` section contained `Project root: /Users/cpconnor/projects/Pete-Gets-Shit-Done` — the path-replacement.test.cjs scans all `.md` files for resolved absolute paths containing `os.homedir()` and fails if any are found
- **Fix:** Replaced with `Project root: <absolute path — resolved at install time>` matching the pattern used in `gsd-dependency-auditor.md`
- **Files modified:** `agents/gsd-security-guardian.md`
- **Commit:** 192ff9e

**2. [Rule 1 - Bug] Hardcoded agent list in copilot install test missing new agent**
- **Found during:** Task 1 (test run after commit)
- **Issue:** `tests/copilot-install.test.cjs` line 1164 has a hardcoded sorted array of expected agent files; new agent not in list caused `deepStrictEqual` failure
- **Fix:** Added `'gsd-security-guardian.agent.md'` in alphabetical position between `gsd-roadmapper` and `gsd-ui-auditor`
- **Files modified:** `tests/copilot-install.test.cjs`
- **Commit:** 192ff9e

## Test Results

- **Before fixes:** 2449 pass, 2 fail
- **After fixes:** 2451 pass, 0 fail
- **Suite count:** 469 suites
- **No regressions** introduced by new `.md` files

## Known Stubs

None. Both files are complete implementations — the threat model is a fully populated reference document and the agent definition covers all required sections with substantive content.

## Self-Check: PASSED

- `agents/gsd-security-guardian.md` — FOUND
- `get-shit-done/references/agent-threat-model.md` — FOUND
- CLAUDE.md contains "16 built-in agents" — FOUND
- README.md contains "| Specialized agents | 16 |" — FOUND
- Commit 2fa9073 — FOUND
- Commit 04bf101 — FOUND
- Commit 192ff9e — FOUND
- All 2451 tests passing — VERIFIED
