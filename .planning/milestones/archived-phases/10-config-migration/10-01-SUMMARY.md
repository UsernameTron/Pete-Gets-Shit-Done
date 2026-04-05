---
phase: 10
plan: 1
title: "Config Migration System — Version Tracking + Migration Pipeline"
requirements: [SEC-06]
status: complete
---

# Summary 10-01: Config Migration System

## Results

### Production Changes (core.cjs)

Added versioned config migration system replacing ad-hoc inline migrations in `loadConfig`:

- **CONFIG_VERSION = 1** constant tracking latest config schema version
- **configMigrations** registry — array of `{ from, to, migrate }` objects executed sequentially
- **runConfigMigrations(parsed, cwd)** — runner that detects current version, applies applicable migrations, stamps `config_version`
- Existing inline migrations (depth→granularity, multiRepo→sub_repos) refactored into v0→v1 registry entry
- Config written back to disk after migration with updated version
- Unknown future versions (e.g., v99) left untouched — forward-compatible
- Migration errors caught and logged without breaking config loading

### Design Decisions

- **Registry pattern over version-keyed map**: Allows multi-step migrations and matches database migration conventions
- **sub_repos filesystem sync kept outside registry**: Runtime detection on every load is intentionally not a one-time migration
- **Idempotent migrations**: Safe to re-run; version check prevents double-application

## Tests Added

### core.test.cjs (+9 tests → 179 total)

1. Unversioned config gets migrated to v1 with `config_version: 1` stamp
2. Config already at v1 skips migration
3. depth + multiRepo both migrated in single pass
4. Migration error does not break config loading
5. Unknown future version (v99) left alone
6. `runConfigMigrations` returns false when no migration needed
7. `runConfigMigrations` returns true when migration applied
8. `CONFIG_VERSION` is exported and is a positive integer
9. `configMigrations` is an array with valid entries

## Test Results

- `core.test.cjs`: 179/179 pass (9 new)
- `security.test.cjs`: 81/81 pass
- Total: 260 tests, 0 failures

## Coverage

- core.cjs: 94.26% line / 87.11% branch
- security.cjs: 100.00% line / 91.11% branch

## Files Modified

- `get-shit-done/bin/lib/core.cjs` — migration registry, runner, refactored loadConfig
- `tests/core.test.cjs` — 9 new tests, 3 new imports

## No Behavior Change for End Users

Config files silently gain `config_version: 1` on first load after upgrade. All existing behavior preserved.
