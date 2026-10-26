# Coding Conventions

**Analysis Date:** 2026-10-26

## Module System

- CommonJS only: `require()` / `module.exports`. No `"type": "module"` in `package.json`; no `import`/`export` anywhere.
- Source extensions: `.cjs` for `get-shit-done/bin/**`, `scripts/*.cjs`, `tests/**`; `.js` for `bin/install.js`, `bin/lib/**`, `hooks/*.js`, `scripts/build-hooks.js`. Both are CJS.
- Zero runtime dependencies. `package.json` has only `devDependencies` (`c8`, `esbuild`). Core code uses Node built-ins only (`fs`, `path`, `os`, `crypto`, `child_process`). Do not add a runtime dependency.
- `'use strict';` is not universal. It is present in `scripts/*.cjs`, `get-shit-done/bin/lib/security.cjs` and `tests/e2e/*`; most `get-shit-done/bin/lib/*.cjs` omit it. Add it to new `scripts/`, hook and test files; match the neighbouring file in `lib/`.
- Shebang `#!/usr/bin/env node` on directly executable entry points: `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, `hooks/*.js`, `scripts/run-tests.cjs`.

## Naming Patterns

**Files:**
- Lowercase kebab-case: `get-shit-done/bin/lib/profile-pipeline.cjs`, `bin/lib/install-core.js`, `hooks/gsd-prompt-guard.js`.
- Hooks are prefixed `gsd-`. Tests are `tests/<topic>.test.cjs`; shared test helpers have no `.test` suffix (`tests/helpers.cjs`, `tests/hook-helpers.cjs`).
- Per-runtime installer code mirrors runtime names: `bin/lib/runtimes/<runtime>.js` and `bin/lib/converters/<runtime>.js`.

**Functions:**
- camelCase. CLI command implementations in `get-shit-done/bin/lib/*.cjs` are `cmd<Domain><Action>` and take `(cwd, ..., raw)`: `cmdPhasesList(cwd, options, raw)` in `get-shit-done/bin/lib/phase.cjs`, `cmdStatePatch(cwd, patches, raw)` in `state.cjs`.
- Argument-parsing adapters in `get-shit-done/bin/gsd-tools.cjs` are `handle<Domain><Action>(args, cwd, raw)` (e.g. `handleStatePatch`).
- Small predicates/helpers are plain verbs: `safeReadFile`, `deepFreeze`, `flagValue`, `flagInt`.

**Variables/constants:**
- camelCase for locals; `snake_case` appears only when it mirrors a JSON/frontmatter key (e.g. `summary_file`).
- UPPER_SNAKE_CASE for module constants and frozen enums: `GSD_ERROR_CODES`, `INJECTION_PATTERNS`, `GSD_TRUNCATED_SENTINEL`.

**Types/classes:**
- PascalCase: `GsdError` (`get-shit-done/bin/lib/core.cjs`). No TypeScript; types are documented in JSDoc.

## Code Style

**Formatting:**
- No Prettier, Biome or EditorConfig. Match surrounding code: 2-space indent, single quotes, semicolons, trailing commas in multiline literals.
- Section dividers use `// ─── Title ───...` comment rules (`core.cjs`, `gsd-tools.cjs`, tests).

**Linting:**
- No ESLint config and no `lint` script. Quality gates are the test suite (`npm test`), `scripts/validate-doc-links.cjs`, `scripts/check-doc-drift.cjs`, and the CI `governance` job (`.github/workflows/test.yml`).

## Import Organization

**Order (observed):**
1. Node built-ins (`fs`, `path`, `os`, `crypto`, `child_process`)
2. Sibling project modules via relative path (`require('./core.cjs')`)
3. Destructured named imports on the same `require` line

**Rules:**
- Lib modules use explicit `.cjs` extensions in requires (`require('./model-profiles.cjs')`); `bin/lib` modules omit the extension (`require('../bin/lib/settings')`).
- No path aliases.
- Layering is enforced by `tests/architecture.test.cjs` and documented at the top of `get-shit-done/bin/lib/core.cjs`: imports flow down only (Layer 3 -> 2 -> 1 -> 0). `core.cjs` may require only `model-profiles.cjs`. Layer 0: `model-profiles.cjs`, `security.cjs`; Layer 1: `core.cjs`; Layer 2: `frontmatter.cjs`, `config.cjs`, `state.cjs`, `history.cjs`; everything else is Layer 3. No circular dependencies; lazy in-function requires obey the same rule.

## Error Handling

**Patterns:**
- Structured errors: throw `new GsdError(GSD_ERROR_CODES.X, message, { context, cause })` (`core.cjs`). Add a new code to `GSD_ERROR_CODES` rather than using free-form strings.
- CLI-level failure: call `error(message)` from `core.cjs`, which writes `Error: <message>` to fd 2 via `fs.writeSync(2, ...)` and `process.exit(1)`.
- Success output goes through `output(result, raw, rawValue)` in `core.cjs`: JSON by default, plain `rawValue` when `--raw`; payloads over 50,000 chars are written to a tmp file and printed as `@file:<path>`.
- Best-effort reads return `null` instead of throwing, with an inline justification: `safeReadFile` in `core.cjs` (`catch { /* intentional: ... */ return null; }`). Bare empty catches must carry an `intentional` comment.
- Validate at boundaries with `get-shit-done/bin/lib/security.cjs` (`validatePath`, `requireSafePath`, `validatePhaseNumber`, `validateFieldName`, `validateShellArg`, `safeJsonParse`). Validators return `{ safe, error, resolved }` objects rather than throwing.
- Hooks are fail-closed security gates: exit 0 = allow, exit 2 = block with `permissionDecision: "deny"` (see header of `hooks/gsd-prompt-guard.js`).

## Logging

- No logging framework. Diagnostics use `fs.writeSync(2, ...)` (stderr) and `fs.writeSync(1, ...)` (stdout) directly, not `console.log`, in lib code.
- `debugLog(code, message, context)` in `core.cjs` prints `[GSD:CODE] message {json}` to stderr only when `GSD_DEBUG` is set.
- Installer UI uses ANSI helpers from `bin/lib/colors.js`.
- Cost tracking is JSONL via `hooks/gsd-cost-tracker.js`.

## Comments

- File header: a `/** ... */` block stating purpose (`core.cjs`, `security.cjs`, every test file).
- JSDoc on exported helpers with `@param`/`@returns`.
- Explain why, not what; cite issue numbers where relevant ("since #1276").
- Single source of truth markers: `hooks/gsd-prompt-guard.js` has `// --- BEGIN_INJECTION_PATTERNS ---` delimiters; edit `lib/injection-patterns.json`, and `scripts/build-hooks.js` inlines it. Never hand-edit between the delimiters.
- Hooks carry `// gsd-hook-version: {{GSD_VERSION}}` as a template stamp.

## Function Design

- `get-shit-done/bin/gsd-tools.cjs` dispatches via lookup tables, not switch statements: `lookup(table, key)` (own-property check), `subcommands(table, fallback)`, `unknownSubcommand(message)`. Add a new subcommand by adding a table entry plus a `handle*` function.
- Flag parsing helpers: `flagValue(args, 'name', fallback)`, `flagInt`, `filesAfterFlag`, `parseNamedArgs`.
- Command functions take `cwd` first and `raw` last; paths resolve through `planningDir(cwd)`.
- Keep functions single-purpose; recent refactors extract sub-checks instead of growing one function (e.g. #86 dispatch table, #88 verify health checks, #87 installer split).

## Module Design

**Exports:** a single `module.exports = { ... }` at the file bottom, grouped with `//` comments (see `security.cjs`: "Path safety", "Prompt injection").

**Barrel files:** none. Consumers require the specific module.

**Installer layout:** `bin/install.js` is a thin entry point (test hook: `GSD_TEST_MODE` env guard near line 268). Logic lives in `bin/lib/*.js` (`install-core.js`, `install-steps.js`, `uninstall-steps.js`, `paths.js`, `settings.js`, `manifest.js`, `copy.js`, `toml.js`), with runtime specifics in `bin/lib/runtimes/` and format converters in `bin/lib/converters/`. Add a runtime by adding one file in each of those two directories and registering it in the shared tables (`getDirName` in `bin/lib/paths.js` is one such table).

## Prompt Artifacts

- Commands live in `commands/`, agents in `agents/` (Markdown with YAML frontmatter), enforced by `tests/agent-frontmatter.test.cjs`, `tests/agent-quality.test.cjs`, `tests/commands.test.cjs`. Keep frontmatter valid when adding either.

---

*Convention analysis: 2026-10-26*
