---
milestone: v2.0-intelligence-layer
verified: 2026-04-05T12:00:00Z
status: passed
score: 6/6 integration points verified
---

# v2.0 Intelligence Layer — Integration Verification Report

**Milestone:** v2.0 Intelligence Layer (Phases 30-33)
**Verified:** 2026-04-05
**Status:** PASSED
**Verifier:** Claude (gsd-verifier scope:integration)

## Integration Point Results

| # | Integration Point | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | classify.cjs -> init.cjs | PASS | Lines 150, 290 in init.cjs |
| 2 | model-profiles.cjs -> core.cjs | PASS | Lines 1307-1311 in core.cjs |
| 3 | history.cjs -> init.cjs | PASS | Lines 115-144, 255-284 in init.cjs |
| 4 | history.cjs -> model-profiles.cjs | PASS | Lines 108-129 in model-profiles.cjs |
| 5 | Config migration chain (v0->v1->v2) | PASS | Lines 364-403 in core.cjs |
| 6 | gsd-tools.cjs history CLI | PASS | Lines 589-617 in gsd-tools.cjs |

## Detailed Findings

### 1. classify.cjs -> init.cjs Wiring

**Status:** CONNECTED

Both `cmdInitExecutePhase()` and `cmdInitPlanPhase()` in init.cjs call `classifyTask()` when `config.adaptive` is truthy:

- **Execute path (line 150):** `const { classifyTask } = require('./classify.cjs')` followed by `classifyTask(phaseInfo, phaseInfo?.plans, classContext)` at line 155. Gated by `if (config.adaptive)` at line 149.
- **Plan path (line 290):** Same pattern. `classifyTask(phaseInfo, null, classContext)` at line 295. Gated by `if (config.adaptive)` at line 289.
- Both paths pass `failureRate` from history into `classContext`, connecting the classification to historical data.

### 2. model-profiles.cjs -> core.cjs Wiring

**Status:** CONNECTED

`resolveModelInternal()` in core.cjs (line 1290) calls `dynamicSelect()` when conditions are met:

- **Line 1308:** `const strategy = config.routing_strategy || 'static'`
- **Line 1309:** `if (taskContext && strategy !== 'static')` -- gates on both taskContext presence AND non-static routing
- **Line 1310:** `const { dynamicSelect } = require('./model-profiles.cjs')`
- **Line 1311:** `const result = dynamicSelect(agentType, taskContext, config)`
- **Line 1314:** Debug logging of routing rationale via `debugLog()`
- **Line 1316:** Additional critical-complexity override logging

This means dynamic routing activates for both `routing_strategy: 'dynamic'` and `routing_strategy: 'auto'` -- any value that is not `'static'`.

### 3. history.cjs -> init.cjs Wiring

**Status:** CONNECTED

Both init commands wire history data into the task context:

- **Execute path (lines 113-144):** When `config.adaptive || config.routing_strategy === 'auto'`, init.cjs requires `history.cjs`, calls `queryHistory()` for the current phase (line 121), computes `failureRate`, and when `routing_strategy === 'auto'`, calls `detectPatterns()` (line 131) to build `historyHints` with `{ failureRate, patterns, summary }`. This is attached to `taskContext.historyHints` at line 144.
- **Plan path (lines 253-284):** Identical pattern. Same gating, same queryHistory/detectPatterns calls, same historyHints attachment.
- Graceful degradation: both paths wrap history calls in try/catch (lines 138, 278) so missing history files do not break init.

### 4. history.cjs -> model-profiles.cjs Wiring

**Status:** CONNECTED

`dynamicSelect()` in model-profiles.cjs (line 87) accepts and uses `taskContext.historyHints`:

- **Line 111:** `if (taskContext?.historyHints)` checks for history hints presence
- **Lines 113-119:** Searches for `agent_tier_mismatch` patterns matching the current agent. If found and current tier is not already quality, promotes to quality tier with rationale logging.
- **Lines 122-128:** Searches for `failing_phase` patterns. If failure rate > 0.3 and current tier is budget, promotes to balanced.
- The data contract matches: init.cjs builds `historyHints = { failureRate, patterns: [...], summary }` and model-profiles.cjs reads `hints.patterns` and `hints.failureRate`.

### 5. Config Migration Chain

**Status:** CONNECTED

core.cjs has a complete migration chain from v0 to v2:

- **Line 364:** `const CONFIG_VERSION = 2`
- **Lines 366-403:** `configMigrations` array with two entries:
  - `{ from: 0, to: 1 }` (lines 367-386): Migrates `depth` -> `granularity`, `multiRepo` -> `sub_repos`
  - `{ from: 1, to: 2 }` (lines 388-402): Adds `routing_strategy: 'static'` and `adaptive: false` as defaults for existing v1 configs
- **Lines 405-419:** `runConfigMigrations()` loops through migrations sequentially, handling errors per migration
- **Line 433:** Default config includes `routing_strategy: 'static'`
- **Lines 1689-1690:** Both `CONFIG_VERSION` and `configMigrations` are exported

### 6. gsd-tools.cjs History CLI

**Status:** CONNECTED

The `history` case in gsd-tools.cjs (lines 589-617) implements all three subcommands:

- **`history list` (lines 592-599):** Parses `--agent`, `--outcome`, `--limit` flags, calls `history.queryHistory()`, formats via `history.formatHistoryList()`
- **`history stats` (lines 600-603):** Calls both `history.queryHistory()` and `history.detectPatterns()`, formats via `history.formatHistoryStats()`
- **`history prune` (lines 604-612):** Parses `--keep` flag (default 500), calls `history.pruneHistory()`, outputs JSON or human-readable result
- **Line 614:** Unknown subcommand error with available options listed

## Wiring Summary

**Connected:** 6/6 integration points fully wired
**Orphaned:** 0
**Missing:** 0

## Data Flow Trace

```
                        history.cjs
                       /           \
queryHistory()    detectPatterns()
       |                |
       v                v
  failureRate      historyHints = { failureRate, patterns, summary }
       |                |
       v                v
  classifyTask()    taskContext.historyHints
  (classify.cjs)        |
       |                v
       v           dynamicSelect() in model-profiles.cjs
  task_classification    |
       |                v
       v           tier promotion based on history patterns
  workflow gates        |
                        v
                   resolveModelInternal() in core.cjs
                   returns model alias for agent
```

All data flows are complete. No hollow props, no disconnected sources, no static fallbacks masquerading as real data.

## Cross-Phase Data Contracts

| Producer | Consumer | Data Shape | Compatible |
|----------|----------|-----------|------------|
| history.cjs `detectPatterns()` | model-profiles.cjs `dynamicSelect()` | `{ patterns: [{ type, agent, ... }], failureRate }` | Yes |
| history.cjs `queryHistory()` | init.cjs | `{ records: [...], total: number }` | Yes |
| classify.cjs `classifyTask()` | init.cjs | `{ complexity, signals, confidence }` | Yes |
| init.cjs `buildTaskContext()` | core.cjs `resolveModelInternal()` | `{ complexity, signals, historyHints? }` | Yes |
| core.cjs `configMigrations` | core.cjs `loadConfig()` | v0->v1->v2 sequential | Yes |

No conflicting transforms detected on shared data entities.

---

_Verified: 2026-04-05_
_Verifier: Claude (gsd-verifier scope:integration)_
