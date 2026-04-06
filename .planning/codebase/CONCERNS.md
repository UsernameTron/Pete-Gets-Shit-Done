# Codebase Concerns

**Analysis Date:** 2026-04-06

## Tech Debt

**P1 — `bin/install.js` is a 5,241-line monolith:**
- Issue: Single file contains all installer logic for 6+ runtimes (Claude Code, Copilot, Cursor, Windsurf, Codex, Gemini, OpenCode, Antigravity). 26 converter functions follow near-identical patterns with per-runtime tool name mappings, content transformations, and agent/skill conversion. The `install()` function alone is 548 lines.
- Files: `bin/install.js`
- Impact: High maintenance burden when adding new runtimes or modifying cross-runtime behavior. Each runtime has its own `convert*Content`, `convert*Agent`, `convert*Skill`, and `convert*ToolName` functions with structural duplication. Bug fixes must be applied to each runtime's converter independently.
- Fix approach: Extract a runtime adapter pattern — one base converter with per-runtime configuration objects for tool mappings, frontmatter format, and content transformations. Each runtime becomes a config object (~50 lines) instead of 4-5 duplicated functions (~150 lines each). The `install()` function should be decomposed into `installHooks()`, `installAgents()`, `installCommands()`, `installGovernance()` helpers.

**P2 — `get-shit-done/bin/lib/init.cjs` is 2,085 lines:**
- Issue: Contains 30+ `cmdInit*` functions covering every GSD subcommand's initialization logic. Functions range from 50-200 lines each. The file mixes concerns: project state reading, plan inventory scanning, context assembly, and skill metadata operations.
- Files: `get-shit-done/bin/lib/init.cjs`
- Impact: Adding new commands requires touching this already-large file. Skill-related functions (`parseSkillMetadata`, `discoverSkills`, `resolveSkillComposition`, `querySkills`, `auditSkills`, `validateSkillMetadata`, `validateSkillStructure`, `checkSkillVersions`) are a distinct concern from command initialization.
- Fix approach: Extract skill operations into `get-shit-done/bin/lib/skills.cjs`. Group remaining `cmdInit*` functions into logical submodules (e.g., `init-phase.cjs`, `init-workspace.cjs`, `init-project.cjs`) or keep as-is with clear section comments if the extraction cost is too high.

**P2 — `get-shit-done/bin/lib/core.cjs` is 1,705 lines:**
- Issue: Core utilities module serving as the project's foundation. Contains filesystem operations, git helpers, markdown normalization, temp file management, config loading, planning lock, debug logging, path resolution, and workstream management. Many functions are well-scoped individually but the file itself is a grab-bag.
- Files: `get-shit-done/bin/lib/core.cjs`
- Impact: Moderate. Functions are well-named and the module has good test coverage (95.60% line, 90.84% branch). The concern is more about navigability than correctness.
- Fix approach: Optional. If touched for other reasons, consider splitting git-related functions into `git.cjs` and markdown normalization into `markdown.cjs`. The planning lock and path resolution functions form a natural `planning.cjs` module.

**P3 — CI/CD pipeline deferred:**
- Issue: No automated test/publish pipeline. Tests and npm publish are manual. The `prepublishOnly` script only runs `build:hooks`, not the test suite.
- Files: `package.json` (scripts section)
- Impact: Risk of publishing a broken version if tests are not run manually before `npm publish`. No gate prevents regression in PRs.
- Fix approach: Add a GitHub Actions workflow running `npm test && npm run test:e2e` on PR and push to main. Add `npm test` to `prepublishOnly` script as an immediate improvement.

## Known Bugs

No active bugs detected in source code. No TODO/FIXME/HACK/WORKAROUND comments found in any `.cjs` or `.js` source files. The codebase is clean of inline debt markers.

## Security Considerations

**P3 — `child_process` usage in library modules:**
- Risk: Three library modules import `child_process`: `core.cjs` (execSync, execFileSync, spawnSync), `init.cjs` (execSync), `commands.cjs` (execSync). All usage is for git operations and local commands, not user-supplied input.
- Files: `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/commands.cjs`
- Current mitigation: The `security.cjs` module (100% coverage) provides input sanitization. `core.cjs` uses `execFileSync` for git commands (avoiding shell injection). The `safeExec` function in `core.cjs` wraps command execution with error handling.
- Recommendations: Continue using `execFileSync` over `execSync` where possible. The current approach is sound for a CLI tool.

**P3 — `.gitignore` does not explicitly exclude secrets patterns:**
- Risk: No explicit `.env`, `*.key`, `*.pem`, or `credentials.*` patterns in `.gitignore`. The project has zero runtime dependencies and no secrets by design (CLI plugin), but the `.gitignore` does not guard against accidental secret file creation.
- Files: `.gitignore`
- Current mitigation: The project has no `.env` files and no secrets to manage. The `state/` and `context/` directories are gitignored.
- Recommendations: Add standard secret exclusion patterns (`.env*`, `*.key`, `*.pem`) as defensive practice, especially since users may fork or clone the repo.

## Performance Bottlenecks

**P3 — File-based planning lock uses busy-wait polling:**
- Problem: `withPlanningLock()` in `core.cjs` spins in a `while` loop calling `spawnSync('sleep', ['0.1'])` when the lock is held. The 10-second timeout with 100ms polling means up to 100 iterations.
- Files: `get-shit-done/bin/lib/core.cjs` (lines 769-821)
- Cause: Synchronous file locking in Node.js has no native wait-for-file-change primitive. The implementation spawns a sleep process for each retry.
- Improvement path: Low priority. Lock contention is rare in practice (single user, sequential command execution). The stale lock detection (30s) and force-acquire timeout (10s) are reasonable safeguards. No action needed unless concurrent subagent execution causes lock contention.

## Fragile Areas

**P2 — Multi-runtime converter functions in `bin/install.js`:**
- Files: `bin/install.js` (lines 514-1085, 2333-2450)
- Why fragile: Adding or modifying a tool name mapping requires updating 6+ parallel converter functions. Each runtime has subtle differences in how it handles frontmatter, tool names, and content transformation. Missing a runtime during a change silently produces incorrect output for that platform.
- Safe modification: When changing tool mappings or content transformations, search for ALL `convert*ToolName` functions and update each one. Run `npm run test:e2e` which exercises installation flows.
- Test coverage: Unit tests exist for installation validation (`tests/copilot-install.test.cjs`, `tests/governance-install.test.cjs`) but converter function coverage is not individually reported.

**P2 — Planning lock with force-acquire on timeout:**
- Files: `get-shit-done/bin/lib/core.cjs` (lines 811-821)
- Why fragile: After a 10-second timeout, the lock is forcibly acquired and the function runs without the lock guarantee. If two processes time out simultaneously, both proceed without coordination. The `debugLog` call provides observability but no protection.
- Safe modification: The current behavior is intentional — availability over consistency for a single-user CLI tool. Do not change without understanding the tradeoff.
- Test coverage: Lock behavior is tested in `tests/core.test.cjs`.

## Scaling Limits

**P3 — Execution history JSONL rotation:**
- Current capacity: 1,000 records before auto-rotation to 500
- Limit: JSONL file is read fully into memory for pattern detection. Very active projects with large record payloads could cause memory pressure.
- Files: `get-shit-done/bin/lib/history.cjs`
- Scaling path: Current limits are appropriate. The 1,000-record cap and auto-pruning prevent unbounded growth. No action needed.

## Dependencies at Risk

**P3 — esbuild pinned to ^0.25.12 (latest is 0.28.0):**
- Risk: Minor version drift. esbuild follows a different semver convention where minor versions can contain breaking changes. The `^` range would auto-update to 0.25.x but not 0.28.x.
- Impact: Build hooks (`npm run build:hooks`) may miss performance improvements or bug fixes. No functional risk since the current version works.
- Files: `package.json`
- Migration plan: Update to `^0.28.0` when convenient. Test with `npm run build:hooks` to verify hook bundles are identical.

**P0 — Zero runtime dependencies (strength, not risk):**
- The project has zero runtime dependencies. This is a deliberate architectural decision that eliminates supply chain risk entirely. Maintain this.

## Missing Critical Features

No critical feature gaps identified. The project has comprehensive command coverage (61 commands), agent ecosystem (15 agents), and test suite (403 suites, 2,069 tests).

## Test Coverage Gaps

**P2 — `profile-output.cjs` (952 lines) and `profile-pipeline.cjs` (539 lines) — uncertain coverage depth:**
- What's not tested: These modules handle user profiling output formatting and the profiling pipeline. Each has only 1 matching test file. Given their combined 1,491 lines, the test-to-source ratio may be thin.
- Files: `get-shit-done/bin/lib/profile-output.cjs`, `get-shit-done/bin/lib/profile-pipeline.cjs`
- Risk: Profile formatting bugs could produce garbled or incorrect user-facing output. Low severity but affects UX.
- Priority: Medium

**P2 — `commands.cjs` (984 lines) — broad utility module:**
- What's not tested: This module handles slug generation, timestamps, todo management, scaffolding, stats, and web search. While it has 2 test files, the breadth of functionality is high.
- Files: `get-shit-done/bin/lib/commands.cjs`
- Risk: Individual command utilities may have edge cases not covered. The module is a collection of disparate helpers.
- Priority: Medium

**P3 — Governance shell tests are not in the npm test pipeline:**
- What's not tested: `governance/tests/` contains 5 bash test scripts (`test_install.sh`, `test_integration.sh`, `test_health_check.sh`, `test_scaffold.sh`, `test_install_plugins.sh`). These are not executed by `npm test` or `npm run test:e2e`.
- Files: `governance/tests/*.sh`
- Risk: Governance installation and integration tests may drift from actual behavior without being caught in the regular test cycle.
- Priority: Low — these are supplemental validation scripts, not primary test coverage.

**P3 — Archived agents still present in repo:**
- What's not tested: 7 archived agent definitions exist in `agents/_archived/`. While they are not installed, they add repo clutter and could confuse contributors.
- Files: `agents/_archived/extension-validator.md`, `agents/_archived/gsd-integration-checker.md`, `agents/_archived/gsd-nyquist-auditor.md`, `agents/_archived/gsd-phase-researcher.md`, `agents/_archived/gsd-plan-checker.md`, `agents/_archived/gsd-project-researcher.md`, `agents/_archived/validator.md`
- Risk: None functionally. No stale references to archived agents were found in active source code.
- Priority: Low — cosmetic cleanup only.

## Summary Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 0 | No critical issues |
| P1 | 1 | `install.js` monolith (5,241 lines, 26 converter functions) |
| P2 | 5 | `init.cjs` size, `core.cjs` size, converter fragility, planning lock force-acquire, test coverage depth for profiling/commands modules |
| P3 | 6 | CI/CD deferred, child_process usage, gitignore patterns, busy-wait lock, esbuild version, governance tests not in pipeline |

---

*Concerns audit: 2026-04-06*
