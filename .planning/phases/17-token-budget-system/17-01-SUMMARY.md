---
phase: 17-token-budget-system
plan: 01
status: complete
requirement: PERF-05
started: "2026-04-04"
completed: "2026-04-04"
---

# Plan 17-01 Summary: estimateTokens Utility

## What Was Built

Added `estimateTokens(text, opts)` utility to `core.cjs` that approximates token count for a string using word-count heuristics with configurable model profiles. No external tokenizer dependency required.

## Key Changes

- **core.cjs**: `TOKEN_RATIOS` constant with default (1.3), claude (1.35), gpt (1.3), code (2.0) profiles; `estimateTokens` function using `trim().split(/\s+/)` word counting with `Math.ceil` rounding; added to `module.exports`
- **tests/core.test.cjs**: 12 new tests in `describe('estimateTokens')` block covering empty/null/undefined, whitespace, single word, multi-word, all model profiles, unknown profile fallback, code-like strings, and linear scaling

## Design Decisions

- `Math.ceil` rounding so estimates are never lower than actual (conservative for budget calculations)
- `TOKEN_RATIOS` is internal constant, not exported -- implementation detail only
- Falls back to `TOKEN_RATIOS.default` for unknown model profiles rather than throwing (fail-safe)
- `trim().split(/\s+/)` handles multiple spaces, tabs, newlines between words
- Guard `words.length === 1 && words[0] === ''` catches whitespace-only input after trim produces `['']`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect word count in code-like string test**
- **Found during:** GREEN phase, test 11
- **Issue:** Plan specified `"function foo() { return bar; }"` as 5 words, but whitespace split produces 6 tokens (`function`, `foo()`, `{`, `return`, `bar;`, `}`)
- **Fix:** Changed expected value from 10 to 12 (6 words * 2.0 ratio)
- **Files modified:** tests/core.test.cjs

## Verification

- `node --test tests/core.test.cjs` -- 250 tests, 0 failures (12 new estimateTokens + 238 existing)
- Smoke test: `estimateTokens('') => 0`, `estimateTokens(null) => 0`, `estimateTokens('hello world') => 3`, `estimateTokens('hello world', {model:'code'}) => 4`
- All verification greps confirm function, constant, export, and test describe block present
