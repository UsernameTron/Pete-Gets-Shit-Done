# Phase 4: Integration Test Suite - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end workflows and cross-component interactions are validated through integration tests that exercise real code paths (not mocks). Phase 4 proves that components tested individually in Phase 3 compose correctly with realistic data in multi-step sequences.

**Distinction from Phase 3:** Phase 3 = "does this function work?" Phase 4 = "do these functions work together in a real project?" Phase 4 tests multi-step sequences, cross-component interactions, and uses realistic `.planning/` state — not minimal stubs.

</domain>

<decisions>
## Implementation Decisions

### INTG-01: Full GSD Flow (CLI Chain + State Progression)
- **D-01:** Test BOTH the CLI command chain AND filesystem state progression. The chain test proves the pipeline works end-to-end; the state progression proves each stage produces correct artifacts.
- **D-02:** CLI chain test: exercise the `gsd-tools.cjs` command sequence that workflows call — `init resume` -> `init phase-op` -> `state update` -> `verify-summary` — in a temp project with realistic `.planning/` state. Assert each command returns valid JSON and correct status codes.
- **D-03:** State progression test: set up a temp project, simulate each phase's filesystem mutations (create ROADMAP.md, create PLAN.md, update STATE.md, create VERIFICATION.md), and assert each `gsd-tools.cjs` command produces correct output at each stage of the lifecycle.

### INTG-02: Governance Hook Enforcement (Advisory + Template Wiring)
- **D-04:** Test BOTH advisory output correctness AND template wiring validation. Hooks are advisory (always exit 0), but the governance template wiring (`settings-hooks.json`) is what makes Claude Code enforce them at runtime. Both dimensions must be verified.
- **D-05:** Advisory output tests: verify hooks produce correct `hookSpecificOutput.additionalContext` JSON for violation scenarios — wrong branch write attempts, missing docs, injection patterns in `.planning/` content.
- **D-06:** Template wiring tests: validate that `governance/templates/global/settings-hooks.json` wires the right hooks to the right events with correct matchers, covering all 5 event types and 10 configured hooks.

### INTG-03: Plugin Ecosystem Coherence
- **D-07:** Focus on ecosystem coherence, NOT cross-plugin routing (which Phase 3 already covers). The integration value is proving the entire plugin ecosystem is coherent as a system.
- **D-08:** Validate: no command name collisions across all plugins, no broken cross-references between MCP Ecosystem and Code Factory skills/agents/commands, no dangling references to removed commands (`/plan`, `/build`, `/status`).
- **D-09:** This catches regressions from the merge — the ecosystem must be validated holistically, not plugin-by-plugin.

### Test Organization
- **D-10:** Integration tests go in `tests/` alongside unit tests, using naming convention `integ-*.test.cjs`. Same test runner, no subdirectory. The `run-tests.cjs` runner picks them up automatically.

### Claude's Discretion
- Number of test files and how to split test cases across them — optimize for readability and focused test scopes
- Specific assertion granularity within each test — how many intermediate state checks vs. end-state-only checks
- Temp project fixture complexity — how much `.planning/` scaffolding to pre-populate vs. build during the test
- Whether to extract shared integration test helpers or inline setup in each test file

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test Infrastructure
- `tests/helpers.cjs` — `createTempProject()`, `createTempGitProject()`, `runGsdTools()` factory functions for CLI integration tests
- `tests/hook-helpers.cjs` — `runHook()`, `createTempWithConfig()` for hook behavior tests
- `scripts/run-tests.cjs` — Test runner that discovers and executes `tests/*.test.cjs`

### Core Code Under Test
- `get-shit-done/bin/gsd-tools.cjs` — Central CLI router; `main()` function dispatches all commands
- `get-shit-done/bin/lib/init.cjs` — `cmdInitResume`, `cmdInitPlanPhase`, `cmdInitExecutePhase`, `cmdInitVerifyWork`
- `get-shit-done/bin/lib/state.cjs` — State management (read/update `.planning/STATE.md`)
- `get-shit-done/bin/lib/verify.cjs` — `cmdVerifySummary` for verification step
- `get-shit-done/bin/lib/roadmap.cjs` — Roadmap parsing and phase discovery
- `get-shit-done/bin/lib/phase.cjs` — Phase directory management

### Hook Enforcement
- `hooks/gsd-workflow-guard.js` — PreToolUse advisory guard (Write/Edit filtering)
- `hooks/gsd-prompt-guard.js` — PreToolUse injection scanner for `.planning/` files
- `hooks/gsd-check-update.js` — SessionStart update checker
- `hooks/gsd-context-monitor.js` — Context monitoring hook
- `hooks/gsd-statusline.js` — Status line display hook
- `governance/templates/global/settings-hooks.json` — Governance hook wiring template (5 events, 10 hooks)

### Plugin Ecosystem
- `plugins/get-shit-done/plugin.json` — GSD plugin manifest
- `plugins/claude-mcp-ecosystem/plugin.json` — MCP Ecosystem manifest
- `plugins/claude-code-factory/plugin.json` — Code Factory manifest
- `plugins/*/commands/` — All command directories across plugins
- `plugins/*/skills/` — All skill directories across plugins
- `plugins/*/agents/` — All agent directories across plugins

### Requirements
- `.planning/REQUIREMENTS.md` — INTG-01, INTG-02, INTG-03 definitions
- `.planning/ROADMAP.md` section Phase 4 — Success criteria (3 items)

### Phase 3 Test Patterns (reference for style)
- `tests/workflow-guard-hook.test.cjs` — Hook integration test pattern
- `tests/plugin-loading.test.cjs` — Plugin validation test pattern
- `tests/commands.test.cjs` — CLI command test pattern using `helpers.cjs`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`helpers.cjs`** already provides `createTempProject()` and `runGsdTools()` — the primary scaffolding for CLI chain tests
- **`hook-helpers.cjs`** provides `runHook()` with JSON stdin — reusable for governance hook advisory output tests
- **`GSD_TEST_MODE` env guard** — lib modules have test-mode branches; set `process.env.GSD_TEST_MODE = '1'` before imports
- **Phase 3 test patterns** — hook tests and plugin tests establish the assertion style and setup/teardown conventions

### Established Patterns
- All tests use `node:test` (describe/it) with `node:assert/strict`
- `beforeEach`/`afterEach` for tmpdir lifecycle
- `runGsdTools(args, cwd)` returns `{ success, output, error }` — parse `output` as JSON for structured assertions
- `runHook(hookPath, stdinObj)` returns `{ exitCode, stdout, stderr }` — parse `stdout` as JSON for advisory output
- Zero-dependency constraint: no test frameworks, no assertion libraries beyond Node built-ins

### Integration Points
- CLI chain tests need realistic `.planning/` state: ROADMAP.md, STATE.md, phases/ directories with PLAN.md files
- Hook advisory tests need `.planning/config.json` with `hooks.workflow_guard: true` to activate the guard
- Plugin coherence tests need to scan all `plugins/*/` directories and cross-reference command/skill/agent names
- `findProjectRoot(cwd)` in gsd-tools.cjs resolves from cwd upward — temp projects must have `.planning/` at root

</code_context>

<specifics>
## Specific Ideas

No specific implementation requests beyond the decisions above. Key constraint: zero-dependency CommonJS, Node built-in test runner, same `tests/` directory with `integ-` prefix naming convention.

</specifics>

<deferred>
## Deferred Ideas

None — all discussion items resolved within phase scope.

</deferred>

---

*Phase: 04-integration-test-suite*
*Context gathered: 2026-03-26*
