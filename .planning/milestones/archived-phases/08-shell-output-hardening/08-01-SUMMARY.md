---
phase: 8
plan: 1
title: "Shell & Output Hardening — Metacharacter Rejection + Truncation Sentinel"
requirements: [SEC-03, SEC-04]
status: complete
---

# Summary 08-01: Shell & Output Hardening

## Completed

### SEC-03: Shell metacharacter rejection
- Added 3 new validation blocks to `validateShellArg()` in `security.cjs` (after line 275):
  - Shell operators: rejects `;`, `|`, `&`, `>`, `<`
  - Newlines: rejects `\n`, `\r` (command chaining via line breaks)
  - Tilde expansion: rejects `~username` patterns (e.g., `~root/.ssh/id_rsa`)
- Allows bare `~/` (home directory shorthand) and tilde in mid-string (`file~backup`)
- Added 10 new tests in `security.test.cjs`

### SEC-04: Output truncation sentinel
- Wrapped temp file creation in `output()` (core.cjs) with try/catch
- On failure (disk full, permissions), falls back to truncated JSON (50KB) + `\n__GSD_TRUNCATED__` sentinel
- Consumers can detect truncation by checking for the sentinel marker
- Added 1 new test in `core.test.cjs` (stubs `fs.writeFileSync` to simulate ENOSPC)

## Test Results
- `security.test.cjs`: 78/78 pass (10 new tests added)
- `core.test.cjs`: 129/129 pass (1 new test added)

## Files Modified
- `get-shit-done/bin/lib/security.cjs` — metacharacter rejection in `validateShellArg()`
- `get-shit-done/bin/lib/core.cjs` — truncation sentinel in `output()`
- `tests/security.test.cjs` — SEC-03 metacharacter tests
- `tests/core.test.cjs` — SEC-04 truncation sentinel test
