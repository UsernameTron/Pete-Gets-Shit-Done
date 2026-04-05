---
phase: phase-19
plan: 02
status: complete
completed: "2026-04-04"
requirement: MAINT-07
---

# 19-02 Summary: Wire validateShellArg to Production Caller

## What Was Built

1. **`execGitValidated` wrapper** in commands.cjs:
   - Validates all non-flag, non-subcommand args through validateShellArg
   - Skips git subcommands (index 0) and flags (starting with `-`)
   - Delegates to execGit after validation
   - Exported for testing

2. **5 production call sites wired** in commands.cjs:
   - `cmdCommit`: checkout -b branchName (user-derived branch)
   - `cmdCommit`: checkout branchName (fallback)
   - `cmdCommit`: rm --cached file (user file paths)
   - `cmdCommit`: add file (user file paths)
   - `cmdCommitToSubrepo`: add relativePath (sub-repo file paths)

3. **Internal git calls left on plain execGit** (intentionally):
   - rev-parse, commit -m (message already sanitized), status queries

4. **7 new tests** in tests/commands.test.cjs:
   - Clean args passthrough, shell operator rejection (`;`, `|`, `&`), null byte rejection
   - Flag skip, subcommand skip

## Verification

- commands.test.cjs: 181/181 pass (includes 7 new)
- architecture.test.cjs: 4/4 pass
- validateShellArg callers: 0 → 5 (zero-caller debt eliminated)

## Files Changed

| File | Change |
|------|--------|
| `get-shit-done/bin/lib/commands.cjs` | +19/-5 lines (import, wrapper, 5 call sites) |
| `tests/commands.test.cjs` | +70 lines (7 tests) |
