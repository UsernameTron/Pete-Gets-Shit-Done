---
phase: 17
name: Token Budget System
slug: token-budget-system
status: planning
requirements:
  - PERF-05
  - PERF-06
depends_on: [15]
---

# Phase 17 Context: Token Budget System

## Goal

Enable token-aware content selection so callers can estimate token counts and pack the highest-priority content within a budget.

## Requirements

### PERF-05: Token Estimation Utility

Approximate token count for strings using character/word ratio heuristics (no external tokenizer), with configurable model profiles for different token-per-word ratios.

### PERF-06: Context Budget Helper

Given a token limit and a list of content sections with priorities, select the highest-priority sections that fit within the budget.

## Success Criteria

1. Token estimation utility returns an approximate count for a given string using char/word heuristics
2. Token estimation accepts a model profile parameter to adjust the tokens-per-word ratio
3. Context budget helper accepts a token limit and a priority-ordered list of content sections, returning the subset that fits
4. When total content exceeds budget, lower-priority sections are dropped while higher-priority sections are retained
5. Unit tests cover estimation accuracy within reasonable bounds, model profile switching, budget selection with mixed priorities, and edge cases (empty input, single section, all sections fit, no sections fit)

## Key Files

- `get-shit-done/bin/lib/core.cjs` — Target for both utilities
- `tests/core.test.cjs` — Target for all tests

## Existing Patterns

### core.cjs utility pattern (from Phase 15/16)

- Pure functions, zero dependencies, synchronous, CommonJS
- JSDoc with @param/@returns
- Section headers: `// --- Section name ---...`
- Exported via `module.exports` object at end of file
- Tests use `node:test`, `node:assert`, describe/test blocks

### Current exports pattern (end of core.cjs)

```javascript
module.exports = {
  // ... 40+ exports
  streamLines,
  deterministicSort,
  lazyRegistry,
};
```

### Test file pattern (tests/core.test.cjs)

```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
// ... imports from core.cjs ...
```

## Constraints

- Zero npm dependencies (project-wide constraint)
- No external tokenizer (tiktoken, etc.) — heuristic estimation only
- Synchronous — no async/await
- CommonJS — no ES modules
- Must not break existing 238 tests

## Domain Knowledge: Token Estimation Heuristics

Common heuristics for LLM token estimation without a tokenizer:
- **English text**: ~1.3 tokens per word (GPT-style), ~0.75 words per token
- **Code**: Higher ratio, ~1.5-2.0 tokens per word due to punctuation/special chars
- **Character-based**: ~4 chars per token for English text
- Model profiles can adjust the ratio (Claude vs GPT vs others)

## Plan Structure

Two plans in sequence (Wave 1 → Wave 2):
- **17-PLAN-01**: Token estimation utility (PERF-05) — Wave 1, TDD
- **17-PLAN-02**: Context budget helper (PERF-06) — Wave 2, TDD, depends on 17-PLAN-01 for `estimateTokens` function
