---
phase: 33
plan: 2
title: "Config Migration v1 to v2 -- routing_strategy and adaptive defaults"
status: complete
requirements_covered: ["INTEL-22"]
tests_added: 8
commit: 6b3f18f
---

# SUMMARY -- Phase 33.2: Config Migration v1 -> v2

## What Was Built

### Migration Entry (core.cjs)
- Added `{ from: 1, to: 2 }` migration to `configMigrations` array
- Migration adds `routing_strategy: 'static'` and `adaptive: false` if not present
- Existing user values are never overwritten (idempotent `in` check)
- `CONFIG_VERSION` bumped from 1 to 2

### Migration Chain
- v0 configs chain through both migrations (0->1->2) correctly
- v1 configs get intelligence layer defaults added
- v2 configs pass through untouched (no rewrite)

### Unit Tests (tests/core.test.cjs)
- 8 new tests covering all migration scenarios
- v1 -> v2 basic migration
- Preservation of existing routing_strategy and adaptive values
- v0 -> v2 chained migration
- v2 config no-op verification
- Missing config.json defaults
- Idempotency verification
- CONFIG_VERSION constant assertion

## Verification

- All 8 migration tests pass
- Existing v0->v1 tests unaffected
- CONFIG_VERSION = 2 verified in source
- Full test suite green
