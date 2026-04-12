# Requirements: v2.2 Security Hardening

## Source

Full system audit (2026-04-11): `docs/health-reports/full-audit-2026-04-11.md` on branch `docs/full-audit-2026-04-11`.

## Requirements

### SEC2-01: @file: Protocol Path Containment (H-01)

**Priority:** High
**Source finding:** H-01 — `@file:` protocol in `--pick` flag enables arbitrary file read
**File:** `get-shit-done/bin/gsd-tools.cjs:303-305`
**Acceptance criteria:**
- `@file:` protocol validates path against allowlist before `readFileSync`
- Allowlist: project directory OR `gsd-*.json` files in `os.tmpdir()`
- Path traversal attempts (e.g., `../../etc/passwd`) are rejected with clear error
- Tests verify rejection of paths outside allowlist

### SEC2-02: Command Path Validation (H-10)

**Priority:** High
**Source finding:** H-10 — Unvalidated file paths in `cmdSummaryExtract` and `cmdTodoComplete`
**File:** `get-shit-done/bin/lib/commands.cjs:403-415,710-738`
**Acceptance criteria:**
- `summaryPath` in `cmdSummaryExtract` validated via `requireSafePath` before use
- `filename` in `cmdTodoComplete` validated via `requireSafePath` before use
- Reuses existing `requireSafePath` from `security.cjs:99`
- Tests verify path traversal rejection for both commands

### SEC2-03: execSync Replacement (H-09)

**Priority:** High
**Source finding:** H-09 — `init.cjs` uses raw `execSync` bypassing `safeExec` wrappers
**File:** `get-shit-done/bin/lib/init.cjs:1336,1355,1458`
**Acceptance criteria:**
- All 3 `execSync` calls replaced with `safeExec` or `execGitValidated` wrapper
- No raw `execSync` remains in `init.cjs`
- Existing tests continue to pass (no behavioral change)

### SEC2-04: Frontmatter Parser Hardening (H-08)

**Priority:** High
**Source finding:** H-08 — Regex YAML parser has silent corruption and potential ReDoS
**File:** `get-shit-done/bin/lib/frontmatter.cjs:16,156,166,178`
**Acceptance criteria:**
- Regex-based frontmatter parser replaced with `indexOf` scanner (O(n), zero backtracking)
- `escapeRegex` applied to `blockName` parameter at `frontmatter.cjs:178` to prevent injection
- 1MB input size guard on all frontmatter parsing functions
- ReDoS timing tests confirm no catastrophic backtracking
- All existing frontmatter tests continue to pass
- No new dependencies added (indexOf scanner is pure JS)

---
*Created: 2026-04-12*
