---
phase: phase-19
plan: 03
status: complete
completed: "2026-04-04"
requirement: MAINT-08
---

# 19-03 Summary: Wire __GSD_TRUNCATED__ to Programmatic Consumer

## What Was Built

1. **GSD_TRUNCATED_SENTINEL constant** in core.cjs:
   - Replaces string literal `'__GSD_TRUNCATED__'` with named constant
   - Single source of truth for both emission and detection

2. **detectTruncation(str) utility** in core.cjs:
   - Returns `{ truncated, cleanOutput, warning }` structure
   - Handles null/undefined/empty gracefully
   - Strips sentinel from cleanOutput when truncated

3. **Structured stderr warning** in output() function:
   - When truncation occurs, emits JSON to stderr:
     `{"type":"gsd_warning","code":"OUTPUT_TRUNCATED","message":"..."}`
   - This is the programmatic consumer — makes truncation observable

4. **8 new tests** in tests/core.test.cjs:
   - Normal string, truncated string, sentinel stripping, warning message
   - Null/undefined/empty input handling
   - Sentinel constant matches output() usage

## Verification

- core.test.cjs: 286/286 pass (includes 8 new)
- architecture.test.cjs: 4/4 pass
- No regressions

## Files Changed

| File | Change |
|------|--------|
| `get-shit-done/bin/lib/core.cjs` | +18 lines (constant, detectTruncation, stderr warning, exports) |
| `tests/core.test.cjs` | +60 lines (8 tests) |
