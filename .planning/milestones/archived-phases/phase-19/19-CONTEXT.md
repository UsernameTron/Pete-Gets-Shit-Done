---
phase: phase-19
status: planned
requirements:
  - MAINT-02
  - MAINT-07
  - MAINT-08
---

# Phase 19 Context: Feature Management & Consumer Wiring

## Scope

Three requirements addressing production wiring gaps and a new feature flag system.

## MAINT-02: Feature Flags for Experimental Capabilities

**Goal:** Add a feature flag system in core.cjs that gates experimental features behind named toggles, configurable via GSD config.

**Current state:** No feature flag mechanism exists. The config system (config.cjs) uses a three-level deep merge: hardcoded defaults ← ~/.gsd/defaults.json ← user choices. A new `features` key slots naturally into this pattern.

**Design:**
- `createFeatureFlags(configObj)` factory in core.cjs returns a reader with `isEnabled(flagName)` and `listFlags()`
- Config.cjs adds `features: {}` to hardcoded defaults, merged like other config keys
- Flags default to `false` (off) — enabled per-project via config.json `features: { "flag-name": true }`
- No new module required — fits in core.cjs as a lightweight utility

**Architecture constraint:** core.cjs cannot import config.cjs (upward import). The feature flag reader is created in core.cjs; config.cjs passes the config object in when constructing flags.

## MAINT-07: Wire validateShellArg to Production Caller

**Goal:** Identify or create at least one production code path that uses `validateShellArg()` from security.cjs, eliminating the zero-caller tech debt.

**Current state:** `validateShellArg` (security.cjs:258-289) validates 6 threat vectors: null bytes, command substitution, shell operators, newlines, tilde expansion. Exported but zero production callers.

**Architecture constraint:** core.cjs CANNOT import security.cjs (Layer 0 → Layer 1 would be an upward import, violating the Module Architecture in core.cjs lines 5-31). The wiring must happen in a Layer 3 module.

**Wiring target:** `commands.cjs` — the primary consumer of `execGit()` and `safeExec()`. Several functions pass user-derived strings (branch names, commit messages, file paths) to git commands. These are the natural validation points:
- `execGit` callers that pass branch names (createBranch, switchBranch)
- `safeExec` callers that pass file paths or user input

**Approach:** Create a thin wrapper `safeExecValidated()` in commands.cjs that validates args via `validateShellArg` before delegating to `safeExec`. Wire at least 2-3 call sites.

## MAINT-08: Wire __GSD_TRUNCATED__ to Programmatic Consumer

**Goal:** Add detection logic that checks for the `__GSD_TRUNCATED__` sentinel in output and surfaces it as a structured warning.

**Current state:** The sentinel is emitted at core.cjs:302 when temp file write fails and JSON exceeds 50KB — output gets truncated with `__GSD_TRUNCATED__` appended. No code checks for this sentinel.

**Approach:** Add a `detectTruncation(outputStr)` utility in core.cjs that:
1. Checks if string ends with `__GSD_TRUNCATED__`
2. Returns `{ truncated: boolean, cleanOutput: string, warning: string | null }`
3. Wire into `output()` consumers — the natural consumer is any code that reads GSD output and parses it.

Additionally, add detection in the `output()` function itself to emit a structured warning object when truncation occurs.

## Dependencies

- 19-01 (feature flags) is independent
- 19-02 (validateShellArg) is independent
- 19-03 (__GSD_TRUNCATED__) is independent
- All three can execute in parallel (Wave 1)

## Test Strategy

- 19-01: Unit tests for createFeatureFlags (enabled/disabled/default/unknown flags)
- 19-02: Unit tests for safeExecValidated wrapper, integration test showing rejection of malicious input
- 19-03: Unit tests for detectTruncation utility
