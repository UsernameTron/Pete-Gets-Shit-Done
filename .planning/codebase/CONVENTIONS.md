# Coding Conventions

**Analysis Date:** 2026-04-06

## Module System

**Format:** CommonJS (CJS) throughout. All `.cjs` and `.js` files use `require()`/`module.exports`.

**No ESM.** The project does not use `import`/`export` syntax anywhere. There is no `"type": "module"` in `package.json`.

**Directive:** Every source file begins with `'use strict';` (except `bin/install.js` and `get-shit-done/bin/gsd-tools.cjs` which use shebang lines).

## Naming Patterns

**Source Files:**
- Library modules: `kebab-case.cjs` in `get-shit-done/bin/lib/` (e.g., `model-profiles.cjs`, `profile-pipeline.cjs`)
- CLI entry point: `gsd-tools.cjs` in `get-shit-done/bin/`
- Hook scripts: `gsd-{name}.js` in `hooks/` (e.g., `gsd-workflow-guard.js`, `gsd-context-monitor.js`)
- Installer: `install.js` in `bin/`
- Build scripts: `{name}.js` or `{name}.cjs` in `scripts/`
- Command definitions: `kebab-case.md` in `commands/gsd/`

**Test Files:**
- Unit/integration: `{module-name}.test.cjs` in `tests/`
- E2E tests: `{feature-name}.test.cjs` in `tests/e2e/`
- Smoke tests: `{name}.smoke.test.cjs` in `tests/e2e/`
- Performance tests: `{name}.test.cjs` in `tests/perf/`
- Test helpers: `helpers.cjs`, `hook-helpers.cjs` in `tests/`
- E2E helpers: `assertions.cjs`, `fixtures.cjs`, `mock-layer.cjs` in `tests/e2e/`

**Functions:**
- camelCase for all functions: `cmdStateLoad()`, `extractFrontmatter()`, `validatePath()`
- Command handler functions prefixed with `cmd`: `cmdVerifySummary()`, `cmdStatePatch()`, `cmdStateLoad()`
- Helper functions use plain camelCase: `stateExtractField()`, `getStatePath()`

**Variables:**
- camelCase for local variables and parameters: `tmpDir`, `childEnv`, `stdinStr`
- UPPER_SNAKE_CASE for constants: `GSD_ERROR_CODES`, `COMPLEXITY_LEVELS`, `PHASE_TYPE_KEYWORDS`
- `Object.freeze()` on all exported constant objects

**Classes:**
- PascalCase: `GsdError`

## Code Style

**Formatting:**
- No formatter tool (no Prettier, ESLint, or Biome configured)
- 2-space indentation throughout
- Single quotes for strings
- Semicolons required (consistently used)
- Max line length is not enforced but generally stays under 120 characters

**Linting:**
- No linter configured. Code quality is enforced through test coverage and architecture tests.

## Import Organization

**Order:** Follow this pattern consistently:
1. Node.js built-ins: `require('fs')`, `require('path')`, `require('node:test')`
2. Intra-project modules: `require('./core.cjs')`, `require('./frontmatter.cjs')`
3. Destructured imports preferred for multi-export modules

**Example from `state.cjs`:**
```javascript
const fs = require('fs');
const path = require('path');
const { escapeRegex, loadConfig, getMilestoneInfo, ... } = require('./core.cjs');
const { extractFrontmatter, reconstructFrontmatter } = require('./frontmatter.cjs');
```

**Path Aliases:** None. All imports use relative paths (`./`, `../`).

**Architecture Constraint:** Imports must flow downward through the layer hierarchy:
- Layer 0 (foundation): `model-profiles.cjs`, `security.cjs`, `classify.cjs` -- zero intra-project deps
- Layer 1 (core hub): `core.cjs` -- depends only on Layer 0
- Layer 2 (domain): `frontmatter.cjs`, `config.cjs`, `state.cjs`, `history.cjs` -- depends on Layer 1 + 0
- Layer 3 (application): everything else -- depends on Layers 0-2

This is **enforced by `tests/architecture.test.cjs`** which parses `require()` calls and validates no upward dependencies exist.

## Error Handling

**Custom Error Class:**
```javascript
class GsdError extends Error {
  constructor(code, message, { context, cause } = {}) {
    super(message);
    this.name = 'GsdError';
    this.code = code;        // From GSD_ERROR_CODES enum
    this.context = context;  // Additional diagnostic data
    this.cause = cause;      // Original error
  }
}
```

**Error Codes:** Defined in `get-shit-done/bin/lib/core.cjs` as `GSD_ERROR_CODES` -- a frozen object with codes like `CONFIG_READ`, `STATE_WRITE`, `PHASE_READ`, `GIT_EXEC`, `VALIDATION`, etc.

**Patterns:**
- `output()` and `error()` helper functions from `core.cjs` for structured CLI output
- `error(message)` writes to stderr and exits non-zero
- `output(data, raw, label)` writes JSON or formatted output to stdout
- Empty `catch {}` blocks are used intentionally for optional file reads (e.g., STATE.md may not exist in new projects) and are annotated: `catch { /* intentional: STATE.md may not exist */ }`
- Return objects with `{ safe: boolean, error?: string }` pattern for validation functions (see `security.cjs`)

**Hook Error Handling:** Hooks read JSON from stdin with a timeout guard:
```javascript
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try { /* process */ } catch { process.exit(0); }
});
```

## Configuration Patterns

**Project Configuration:** `.planning/config.json` -- JSON file with GSD workflow settings. Loaded via `loadConfig(cwd)` from `core.cjs`.

**Environment Variables:**
- `GSD_TEST_MODE` -- Set to `'1'` in test files to enable test-specific behavior
- `GSD_DEBUG` -- Enables debug logging to stderr
- `NODE_V8_COVERAGE` -- Propagated for c8 coverage collection
- `HOME` -- Overridden in tests to sandbox config lookups

**Output Modes:**
- `--raw` flag: outputs JSON for machine consumption
- `--pick <field>` flag: extracts a single field from JSON output
- Default: human-readable formatted output

## Comments and Documentation Style

**Module-Level JSDoc:**
Every source module starts with a block comment describing purpose:
```javascript
/**
 * State -- STATE.md operations and progression engine
 */
```

**Architecture Documentation:**
`core.cjs` contains a detailed `MODULE ARCHITECTURE` block comment defining layers and rules.

**Audit Comments:**
Security-sensitive sections include audit blocks:
```javascript
// --- Mutation Safety Audit (CORR-06) ---
// All .push() calls in this module operate on locally-scoped arrays...
// Verified patterns:
//   cmdStatePatch  -- results.updated[], results.failed[]  (local)
```

**Section Dividers:**
Use Unicode box-drawing style with `---`:
```javascript
// --- Path Traversal Prevention ---
// --- Error Infrastructure ---
```

**Requirement Tracing:**
Test files and modules reference requirement IDs:
```javascript
// Requirements: DISP-01, DISP-02
// Requirement: INTEL-20
```

**JSDoc for Functions:**
Applied to exported and complex functions with `@param`, `@returns`:
```javascript
/**
 * Validate that a file path resolves within an allowed base directory.
 * @param {string} filePath - The user-supplied file path
 * @param {string} baseDir - The allowed base directory
 * @param {object} [opts] - Options
 * @returns {{ safe: boolean, resolved: string, error?: string }}
 */
```

## Function Design

**Size:** Functions are generally small to medium (10-60 lines). The `cmd*` handler functions in lib modules can be longer (50-100 lines) as they handle full CLI subcommand logic.

**Parameters:**
- `cwd` is the first parameter for most command functions (working directory)
- `raw` boolean parameter controls JSON vs formatted output
- Options objects with destructuring for optional parameters

**Return Values:**
- Command functions write to stdout/stderr via `output()`/`error()` helpers and do not return values
- Internal functions return plain objects or primitives
- Validation functions return `{ safe: boolean, error?: string }` pattern

## Module Design

**Exports:** Single `module.exports` at the bottom of each file, exporting an object of named functions:
```javascript
module.exports = {
  cmdVerifySummary,
  cmdVerifyConsistency,
  cmdVerifyHealth,
};
```

**Barrel Files:** None. Each module is imported directly by path.

**Constants:** Exported alongside functions, frozen with `Object.freeze()`:
```javascript
module.exports = {
  COMPLEXITY_LEVELS,
  classifyTask,
  extractSignals,
};
```

## CLI Output Contract

**JSON output format:** Commands output structured JSON when `--raw` flag is present. This is the primary interface consumed by GSD agents and commands.

**Error reporting:** Errors go to stderr. Exit code 1 for failures. Exit code 2 from hooks means "block operation."

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

*Convention analysis: 2026-04-06*
