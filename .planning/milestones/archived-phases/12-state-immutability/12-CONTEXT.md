# Phase 12 Context — State Immutability & Defensive Copies

## Scope

Requirements CORR-04, CORR-05, CORR-06 from `.planning/REQUIREMENTS.md`.

## Key Functions Returning Mutable Objects at Module Boundaries

### core.cjs (lines 298-422)

- **`loadConfig(cwd)`** — Returns a freshly-built config object (line 383-414) or the `defaults` object (line 420). Both are plain objects with nested sub-objects (`agent_skills`, `model_overrides`). Callers in state.cjs, phase.cjs, config.cjs, init.cjs, and commands.cjs receive this and could mutate it. The `defaults` fallback (line 300-321) is a local `const` rebuilt on each call, so it is safe per-call, but the returned reference is still mutable by consumers.
- **`getMilestoneInfo(cwd)`** — Returns `{ version, name }` (lines 1172-1207). Small object, low mutation risk but should be frozen for consistency.
- **`getRoadmapPhaseInternal(cwd, phaseNum)`** — Returns `{ found, phase_number, phase_name, goal, section }` (lines 1005-1037). Read-only accessor.
- **`checkAgentsInstalled()`** — Returns `{ agents_installed, missing_agents, installed_agents, agents_dir }` with arrays (lines 1060-1090).
- **`planningPaths(cwd, ws)`** — Returns object of path strings (lines 671-682). Strings are immutable, but the container object is not.
- **`getPhaseFileStats(phaseDir)`** — Returns `{ plans, summaries, other, total }` (line 1266+).
- **`findPhaseInternal(cwd, phase)`** — Returns `{ dir, full_path }` or null (line 818+).

### state.cjs (lines 1-1031)

- **`cmdStateLoad(cwd, raw)`** — Returns `{ config, state_raw, state_exists, roadmap_exists, config_exists }` via `output()`. The `config` sub-object is the loadConfig return — if loadConfig freezes its return, this is transitively frozen.
- **`cmdStateSnapshot(cwd, raw)`** — Builds a large structured object with `decisions[]`, `blockers[]`, `session{}` (lines 541-640+). Returns via `output()`.
- **`cmdStateJson(cwd, raw)`** — Returns frontmatter object via `output()`.
- **`stateExtractField(content, fieldName)`** — Returns a string or null. Strings are immutable. No freeze needed.
- **`stateReplaceField`, `stateReplaceFieldWithFallback`** — Return modified content strings. No freeze needed.

### phase.cjs (lines 1-886)

- **`cmdPhasesList(cwd, options, raw)`** — Returns `{ directories[], count }` or `{ files[], count }` via `output()`.
- **`cmdFindPhase(cwd, phase, raw)`** — Returns phase info object via `output()`.
- **`cmdPhasePlanIndex(cwd, phase, raw)`** — Returns `{ plans[], plan_count, phase_dir }` via `output()`.

### config.cjs (lines 1-440)

- **`buildNewProjectConfig(userChoices)`** — Returns merged config object (line 137-161). Internal to config.cjs but called by cmdConfigNewProject and ensureConfigFile.

## .push() Patterns in state.cjs

All `.push()` calls in state.cjs operate on **locally-scoped arrays**, not shared state:

| Line | Variable | Context | Safe? |
|------|----------|---------|-------|
| 155 | `results.updated` | Local array in `cmdStatePatch` | Yes — built for that invocation's response |
| 158 | `results.updated` | Same | Yes |
| 160 | `results.failed` | Local array in `cmdStatePatch` | Yes — built for that invocation's response |
| 516 | `updated` | Local array in `cmdStateRecordSession` | Yes — tracks which fields were updated |
| 518 | `updated` | Same | Yes |
| 524 | `updated` | Same | Yes |
| 531 | `updated` | Same | Yes |
| 577 | `decisions` | Local array in `cmdStateSnapshot` | Yes — built fresh per call |
| 593 | `blockers` | Local array in `cmdStateSnapshot` | Yes — built fresh per call |
| 876 | `updated` | Local array in `cmdStateBeginPhase` | Yes — tracks which fields were updated |
| 880 | `updated` | Same | Yes |
| 885 | `updated` | Same | Yes |
| 889 | `updated` | Same | Yes |
| 894 | `updated` | Same | Yes |
| 899 | `updated` | Same | Yes |
| 904 | `updated` | Same | Yes |
| 912 | `updated` | Same | Yes |
| 953 | `updated` | Same | Yes |

**Verdict:** All `.push()` patterns are safe — each operates on a locally-constructed array within a single command invocation. None mutate shared module-level state.

## Test Infrastructure

- Test framework: `node:test` (built-in Node.js test runner)
- Tests live in `/tests/*.test.cjs`
- Existing core tests: `/tests/core.test.cjs` (imports from `../get-shit-done/bin/lib/core.cjs`)
- Helper: `/tests/helpers.cjs` provides `createTempProject()`, `cleanup()`, `runGsdTools()`
- Run: `npm test` or `node scripts/run-tests.cjs`
