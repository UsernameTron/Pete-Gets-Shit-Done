---
phase: 31
plan: 2
title: "Config Keys — workflow.adaptive Feature Flag"
status: complete
requirements_covered: ["INTEL-11"]
tests_added: 5
tests_total: 1992
---

# SUMMARY — Phase 31.2: Config Keys — workflow.adaptive Feature Flag

## What Was Built

Added `workflow.adaptive` config key across three locations:

1. **config.cjs** — Added `'workflow.adaptive'` to `VALID_CONFIG_KEYS` Set
2. **core.cjs** — Added `adaptive: false` to `loadConfig()` defaults and return object
3. **config.cjs** — Added `adaptive: false` to `buildNewProjectConfig()` workflow block

Default is `false`, gating all Phase 31 adaptive behavior behind a feature flag. Existing users see zero behavior change.

## Tests

5 new tests across two files:
- `tests/config.test.cjs` (2 tests): workflow.adaptive in VALID_CONFIG_KEYS, buildNewProjectConfig includes workflow.adaptive: false
- `tests/core.test.cjs` (3 tests): loadConfig returns adaptive false by default, returns true when set, config with workflow.adaptive passes validation

## Requirements

- **INTEL-11**: workflow.adaptive config key with false default — Complete
