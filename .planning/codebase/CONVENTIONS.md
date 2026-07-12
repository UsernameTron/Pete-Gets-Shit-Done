# Coding Conventions

**Analysis Date:** 2026-07-12

## Module System

**Format:** CommonJS (CJS) throughout. All `.cjs` and `.js` files use `require()`/`module.exports`. No `"type": "module"` in `package.json`, no `import`/`export` syntax anywhere in the tree.

**`'use strict';` is inconsistent, not universal.** Of the 24 files in `get-shit-done/bin/lib/`, only `security.cjs` has it (and not on line 1 — it follows a JSDoc header, at line 16). `core.cjs`, `gsd-tools.cjs`, and the other 22 lib modules have no strict-mode directive. By contrast, most of `scripts/*.cjs` (5 of 11 files, including `run-tests.cjs`, `run-e2e-tests.cjs`, `check-doc-drift.cjs`) and two of the six `hooks/*.js` files do declare it. Treat `'use strict';` as present-by-convention in newer `scripts/` and hook files, not as a repo-wide rule.

**Shebang lines** (`#!/usr/bin/env node`) mark directly-executable entry points: `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, all six `hooks/*.js` files, and `.claude/hooks/lesson-capture-gate.cjs`.

**Zero runtime dependencies.** `package.json` has no `"dependencies"` key — only `devDependencies` (`c8`, `esbuild`). `gsd-tools.cjs` and every `lib/` module use Node.js built-ins exclusively (`fs`, `path`, `crypto`, `child_process`). This is stated explicitly in `CONTRIBUTING.md`: "No external dependencies in core."

## Naming Patterns

**Source Files:**
- Library modules: `kebab-case.cjs` in `get-shit-done/bin/lib/` (24 files, e.g. `model-profiles.cjs`, `profile-pipeline.cjs`, `harden-repo.cjs`)
- CLI entry point: `gsd-tools.cjs` in `get-shit-done/bin/`
- Hook scripts: `gsd-{name}.js` in `hooks/` (e.g. `gsd-prompt-guard.js`, `gsd-config-protection.js`, `gsd-cost-tracker.js`) — a separate project-scoped hook lives at `.claude/hooks/lesson-capture-gate.cjs`
- Installer: `install.js` in `bin/`
- Build/CI scripts: `{name}.js` or `{name}.cjs` in `scripts/` (e.g. `build-hooks.js`, `check-doc-drift.cjs`, `validate-doc-links.cjs`)
- Command definitions: `kebab-case.md` in `commands/gsd/`
- Workflow definitions: `kebab-case.md` in `get-shit-done/workflows/`

**Test Files:**
- Unit/integration: `{module-name}.test.cjs` directly in `tests/` (89 files, flat — no subfolders)
- Integration: `integ-{name}.test.cjs` prefix (`integ-gsd-flow.test.cjs`, `integ-governance-hooks.test.cjs`, `integ-plugin-ecosystem.test.cjs`)
- Targeted coverage suites: `install-coverage-{topic}.test.cjs` — closes specific gaps in `bin/install.js` (`install-coverage-utils.test.cjs`, `-converters.test.cjs`, `-governance.test.cjs`)
- Hook tests: `{hook-name}-hook.test.cjs` (`prompt-guard-hook.test.cjs`, `config-protection-hook.test.cjs`, `cost-tracker-hook.test.cjs`)
- E2E: `{scenario-name}.test.cjs` in `tests/e2e/`; smoke subset uses `.smoke.test.cjs`
- Performance: `{name}.test.cjs` in `tests/perf/`
- Governance (bash, not node:test): `test_{name}.sh` in `governance/tests/`
- Test helpers: `helpers.cjs`, `hook-helpers.cjs` in `tests/`; `assertions.cjs`, `fixtures.cjs`, `mock-layer.cjs` in `tests/e2e/`

**Functions:**
- camelCase for all functions
- CLI command handlers prefixed with `cmd`: 103 distinct `cmd*` functions across `lib/` (`cmdCommit`, `cmdStateLoad`, `cmdVerifySummary`, `cmdConfigGet`, ...)
- Plain camelCase for helpers: `extractSignals()`, `validatePath()`, `safeExec()`, `execGit()`

**Variables:**
- camelCase for locals and parameters (`tmpDir`, `childEnv`, `stdinStr`)
- UPPER_SNAKE_CASE for constants (`GSD_ERROR_CODES`, `COMPLEXITY_LEVELS`, `HISTORY_DIR`, `CONFIG_VERSION`)
- `Object.freeze()` applied to every exported constant object

**Classes:**
- PascalCase. Exactly one class exists in the entire codebase: `GsdError` (`get-shit-done/bin/lib/core.cjs`). This is a function-first, class-averse codebase by convention.

## Code Style

**Formatting:**
- No formatter configured — no `.prettierrc`, `eslint.config.*`, `biome.json`, or `.editorconfig` anywhere in the repo (confirmed absent)
- 2-space indentation throughout
- Single quotes for strings
- Semicolons required and consistently present

**Linting:**
- No linter configured. Code quality is enforced through test coverage (`c8`, thresholds documented in `CLAUDE.md`) and the architecture boundary test (`tests/architecture.test.cjs`), not static analysis.

## Import Organization

**Order:**
1. Node.js built-ins: `require('fs')`, `require('path')`, `require('node:test')`
2. Intra-project modules via relative path: `require('./core.cjs')`, `require('./frontmatter.cjs')`
3. Destructured imports preferred for multi-export modules

**Example from `state.cjs`:**
```javascript
const fs = require('fs');
const path = require('path');
const { escapeRegex, loadConfig, getMilestoneInfo, ... } = require('./core.cjs');
const { extractFrontmatter, reconstructFrontmatter } = require('./frontmatter.cjs');
```

**Path Aliases:** None. No `tsconfig.json`/`jsconfig.json` exists (plain JS, not TypeScript). All imports use relative paths (`./`, `../`).

**Architecture Constraint:** Imports must flow downward through a layer hierarchy. The authoritative source is `tests/architecture.test.cjs` (not the comment block in `core.cjs`, which is a non-exhaustive summary of the same rule):
- **Layer 0** (zero intra-project deps): `model-profiles.cjs`, `security.cjs`, `classify.cjs`
- **Layer 1** (core hub — may only require `model-profiles.cjs`): `core.cjs`
- **Layer 2** (domain): `frontmatter.cjs`, `config.cjs`, `state.cjs`, `history.cjs`
- **Layer 3** (application — everything else, 17 files): `phase.cjs`, `milestone.cjs`, `roadmap.cjs`, `workstream.cjs`, `verify.cjs`, `commands.cjs`, `uat.cjs`, `uat-patterns.cjs`, `uat-runner.cjs`, `template.cjs`, `init.cjs`, `profile-output.cjs`, `profile-pipeline.cjs`, `checkpoint.cjs`, `daily.cjs`, `harden-repo.cjs`

This is enforced by two assertions in `tests/architecture.test.cjs`: `core.cjs` must require only `model-profiles.cjs` as an intra-project dependency, and no pair of modules may require each other (circular-dependency check across all files in `lib/`).

## Error Handling

**Custom Error Class:**
```javascript
class GsdError extends Error {
  constructor(code, message, { context, cause } = {}) {
    super(message);
    this.name = 'GsdError';
    this.code = code;
    this.context = context || null;
    this.cause = cause || null;
  }
}
```

**Error Codes:** `GSD_ERROR_CODES` in `core.cjs` — a frozen object with 18 codes: `CANCELLED`, `CONFIG_READ`, `CONFIG_PARSE`, `CONFIG_MIGRATE`, `CONFIG_WRITE`, `STATE_READ`, `STATE_WRITE`, `PHASE_READ`, `PHASE_WRITE`, `LOCK_ACQUIRE`, `LOCK_STALE`, `GIT_EXEC`, `FILE_READ`, `FILE_WRITE`, `PARSE_ERROR`, `COMMAND_DISPATCH`, `TEMPLATE_RENDER`, `VALIDATION`.

**Patterns:**
- `output()` and `error()` helpers from `core.cjs` for structured CLI output (see CLI Output Contract below)
- Empty `catch {}` blocks used intentionally for optional/best-effort reads and are always annotated: `catch { /* intentional: STATE.md may not exist in new projects */ }`. This is a real, checkable pattern — 121 of the 189 `catch` blocks across `lib/` carry an `intentional:` comment; the remaining ones bind a named error (`catch (err)`, `catch (writeErr)`) and use it rather than swallowing it.
- Return-object pattern for validation functions: `{ safe: boolean, resolved: string, error?: string }` (see `validatePath()` in `security.cjs`)
- Structured result objects for verification/health checks: `{ passed: boolean, checks: {...}, errors: [...] }`, e.g. `output({ passed: false, errors, warnings }, raw, 'failed')` in `verify.cjs`

**Shell Safety — the `safeExec`/`execGit` pattern:** Rather than calling `execSync`/`execFileSync` ad hoc, the codebase centralizes process execution through `safeExec(command, args, options)` in `core.cjs`, which always calls `spawnSync(command, args, {...})` with `args` as an array (never a shell string), and supports `timeout` and cooperative `cancelToken` cancellation. `execGit(cwd, args)` wraps `safeExec('git', args, { timeout: 30000 })` and is the standard way every module shells out to git — 21 call sites across 6 files. Raw `execFileSync`/`execSync` calls are rare exceptions: `isGitIgnored()` in `core.cjs` and `harden-repo.cjs`'s `gh` CLI call use `execFileSync` directly; `uat-runner.cjs` uses `execSync` deliberately to run user-authored UAT assertion commands (a sanctioned exception, not a git call). `CONTRIBUTING.md` codifies this: "use `execFileSync` (array args) over `execSync` (string interpolation)" and "use `validatePath()` from `security.cjs` for any user-provided paths."

**Hook Error Handling:** Hooks read JSON from stdin with a timeout guard so a hung parent process can't block Claude Code indefinitely:
```javascript
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try { /* process */ } catch { process.exit(0); }
});
```
Hooks document their own exit-code contract in a header comment (e.g. `gsd-prompt-guard.js`: `0 = allow`, `2 = block`). Infrastructure failures (missing files, parse errors) fail open — hooks exit 0 rather than block on their own bugs.

## Logging

**No logging framework** (no pino/winston/bunyan). Two coexisting mechanisms:

**Debug logging:** `debugLog(code, message, context)` in `core.cjs` — zero-cost when disabled (env check short-circuits before any work), writes `[GSD:{code}] {message} {context-json}` to stderr via `fs.writeSync(2, ...)` only when `GSD_DEBUG` is set. 12 call sites, all passing a `GSD_ERROR_CODES` value as `code`.

**Human-readable reports:** `history.cjs` and one branch of `gsd-tools.cjs`'s dispatcher (`prune-history`) use `console.log()` directly to print formatted tables/summaries — the one deliberate exception to the `output()`-helper convention, used because that output is meant to be read directly by a human in a terminal, not parsed by a caller.

**Error output:** `error(message)` writes `'Error: ' + message` to stderr via `fs.writeSync(2, ...)` and calls `process.exit(1)`.

## Configuration Patterns

**Project Configuration:** `.planning/config.json` — JSON file with GSD workflow settings, loaded via `loadConfig(cwd)` from `core.cjs`.

**Environment Variables observed in `lib/`, `hooks/`, and `gsd-tools.cjs`:**
- `GSD_DEBUG` — enables `debugLog()` output to stderr
- `GSD_WORKSTREAM` — active workstream name (checked when the `ws` argument is omitted)
- `HOME` / `USERPROFILE` — cross-platform home directory resolution
- `CLAUDE_CONFIG_DIR`, `CLAUDE_MODEL`, `CLAUDE_SESSION_ID` — Claude Code session context
- `BRAVE_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, `GEMINI_API_KEY` — optional external API keys for research-adjacent commands (e.g. `cmdWebsearch`); commands check for presence and report `available: false` with a reason when unset, they don't throw
- `GSD_TEST_MODE` — set to `'1'` by test setup to enable test-specific behavior (test-only)
- `NODE_V8_COVERAGE` — propagated by `scripts/run-tests.cjs`/`run-e2e-tests.cjs` so `c8` collects coverage from the spawned child process

**Output Modes:**
- `--raw` flag: outputs the raw value/JSON for machine consumption
- `--pick <field>` flag: extracts a single field from JSON output
- Default: pretty-printed JSON (`JSON.stringify(result, null, 2)`)

## Comments and Documentation Style

**Module-Level JSDoc:** Every one of the 24 `get-shit-done/bin/lib/*.cjs` files opens with a block comment naming the module and its purpose — confirmed on all 24, no exceptions:
```javascript
/**
 * State — STATE.md operations and progression engine
 */
```
Style varies slightly: some repeat the filename (`checkpoint.cjs — Session Checkpoint Module`), others just the logical name (`Core — Shared utilities...`).

**Architecture Documentation:** `core.cjs` opens with a `MODULE ARCHITECTURE` block comment describing the layer rules (see Import Organization). Treat `tests/architecture.test.cjs` as the source of truth if the two ever disagree.

**Section Dividers:** Predominantly Unicode box-drawing characters (`─`, U+2500) — 97 occurrences across `lib/`:
```javascript
// ─── Error Infrastructure ────────────────────────────────────────────────────
// ─── Debug logging ──────────────────────────────────────────────────────────
```
A small number of newer sections in `core.cjs` (5 of them, all late in the file) use plain ASCII instead: `// --- Streaming output -----`. Prefer the Unicode style for new dividers; it is the dominant pattern by a wide margin.

**Audit Comments:** Security- or correctness-sensitive sections carry review trails tied to an internal tracking ID:
```javascript
// --- Mutation Safety Audit (CORR-06) ---
// All .push() calls in this module operate on locally-scoped arrays...
```

**Requirement Tracing:** Source and test files reference requirement IDs directly, e.g. `classify.cjs`: `// Requirements: INTEL-07 (classifyTask), INTEL-08 (extractSignals), INTEL-09 (adaptWorkflowGates)`. Tests cite the same IDs (see TESTING.md).

**JSDoc for Functions:** Applied to exported and non-trivial functions with `@param`/`@returns` — 139 JSDoc blocks across `lib/`:
```javascript
/**
 * Validate that a file path resolves within an allowed base directory.
 * @param {string} filePath - The user-supplied file path
 * @param {string} baseDir - The allowed base directory
 * @returns {{ safe: boolean, resolved: string, error?: string }}
 */
```

**TODO Comments:** Not used. `grep`-verified: zero `TODO`, `FIXME`, `HACK`, or `XXX` comments anywhere in `get-shit-done/bin/lib/`, `hooks/`, or `scripts/`. Known gaps and future work are tracked in `.planning/codebase/CONCERNS.md`, not inline.

**Hook Versioning Comment:** Every file in `hooks/` carries `// gsd-hook-version: {{GSD_VERSION}}` as its second line (right after the shebang). `scripts/build-hooks.js` substitutes the literal placeholder with the real `package.json` version at build time before bundling to `hooks/dist/`.

## Function Design

**Size:** No enforced limit. Helper functions in `core.cjs` skew small (median ~22 lines across a 55-function sample; most run 10–80 lines). `cmd*` CLI handler functions run larger since they own full subcommand logic — commonly 50–120 lines, with the largest observed (`cmdStats` in `commands.cjs`) at 176 lines.

**Parameters:**
- `cwd` is the first parameter for most command functions (working directory)
- `raw` boolean parameter controls JSON vs. formatted output
- Options objects with destructuring for optional parameters (`function safeExec(command, args, options = {})`)

**Return Values:**
- Command (`cmd*`) functions write to stdout/stderr via `output()`/`error()` and do not return values
- Internal functions return plain objects or primitives
- Validation functions return the `{ safe, error? }` pattern

## Module Design

**Exports:** A single `module.exports = { ... }` object at the bottom of the file, listing named functions and constants, frequently grouped with inline comments:
```javascript
module.exports = {
  // Shell safety
  validateShellArg,
  // JSON safety
  safeJsonParse,
  // Input validation
  validatePhaseNumber,
  validateFieldName,
};
```

**Exception:** `.claude/hooks/lesson-capture-gate.cjs` uses individual `exports.name = name` assignments instead of one object literal, paired with `if (require.main === module) { main(); }`. This lets the same file run directly as a Claude Code Stop-hook *and* be `require()`-d by its test file to unit-test the pure functions inside it — a deliberate structural exception, not drift.

**Barrel Files:** None. No `index.cjs`/`index.js` re-export layer anywhere in `lib/`. Every module is imported directly by its filename.

**Constants:** Exported alongside functions and frozen with `Object.freeze()`:
```javascript
module.exports = {
  COMPLEXITY_LEVELS,
  classifyTask,
  extractSignals,
};
```

## CLI Output Contract

**JSON output format:** Commands emit structured JSON when `--raw` is present. This is the primary interface consumed by GSD agents and commands — workflow files themselves detect and unwrap the `@file:` overflow prefix described below (e.g. `get-shit-done/workflows/map-codebase.md`'s `init_context` step).

**Large-payload overflow protocol:** `output(result, raw, rawValue)` in `core.cjs` guards against Claude Code's ~50KB Bash tool buffer. If the serialized JSON exceeds 50,000 characters, it is written to a temp file and stdout instead carries `@file:{tmpPath}` so the caller can detect the prefix and read the real file. If even the temp-file write fails, the payload is truncated to 50,000 characters with a `__GSD_TRUNCATED__` sentinel appended, plus a `gsd_warning` JSON line on stderr — callers can detect truncation via `detectTruncation()`.

**Why `fs.writeSync`, not `console.log`:** All structured output goes through `fs.writeSync(1, data)` rather than `process.stdout.write()`/`console.log()`, because stdout writes are asynchronous when stdout is piped — `process.exit()` can tear the process down before an async write flushes. `fs.writeSync` blocks until the kernel accepts the bytes, and the code intentionally skips `process.exit()` afterward so the event loop drains naturally.

**Error reporting:** `error(message)` writes `'Error: ' + message` to stderr via `fs.writeSync(2, ...)` and exits 1. Hooks use exit code 2 specifically to mean "block operation" (`permissionDecision: "deny"`); exit 0 means allow/no-op.

**Structured results pattern:**
```javascript
const result = {
  passed: boolean,
  checks: { ... },
  errors: string[],
};
output(result, raw, 'failed');
```

---

*Convention analysis: 2026-07-12*
