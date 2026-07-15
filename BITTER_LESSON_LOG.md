# BITTER_LESSON_LOG

Running memory file for the Bitter Lesson surgery on the GSD harness.
Branch: `bitter-lesson-surgery` (never pushed). Started 2026-07-15.

**Principle (Sutton):** scaffolding that encodes human judgment (routers, classifiers, keyword scoring, tier heuristics) loses to model capability — delete it. Scaffolding that provides leverage (deterministic gates, verification loops, environment facts, user config) compounds — keep it.

**Rubric tiebreak:** if it encodes WHAT exists (facts, paths, schemas, wiring) → LEVERAGE, keep. If it encodes WHICH to pick or HOW MUCH to think (keyword→choice mappings, scores, tiers, confidence thresholds) → JUDGMENT, delete.

## The Eight Steps (derived from operator directive 2026-07-15 — no external plan doc exists; verified against repo, git history, branches, PRs, sibling projects)

1. Load the harness surface into context (core inventory + 47 SKILL.md census).
2. Create branch `bitter-lesson-surgery` + Phase 57.1 planning artifacts + this log scaffold.
3. Replace the `/gsd:do` router's judgment table with a model-readable registry.
4. Delete the complexity classifier (`classify.cjs`) and rewire its sole consumer (`init.cjs`).
5. Split-cut model-profiles/history: delete dynamic tier judgment, keep static config + telemetry.
6. Sweep the 47 vendored skills in parallel work packages: strip judgment per rubric, preserve leverage.
7. Reconcile: tests green, coverage floors hold, living docs synced, log merged, DEFERRED consolidated.
8. Final report: totals, skills touched, 5 least-confident decisions.

## Pre-registered finding

- **Word-replacement tables: nothing to delete.** The directive named them as a judgment-scaffolding category; exhaustive search (skills, workflows, commands) found none. All near-misses are deterministic placeholder substitution (sync-docs live-value injection — leverage) or prose.

## Deletions — GSD core

| File | Lines deleted | Defense (why judgment, not leverage) |
|------|---------------|--------------------------------------|
| get-shit-done/workflows/do.md | ~35 (net −33, 118→85) | 30-row intent→command if-then table + worked ambiguity example encoding human routing judgment; replaced by per-target self-descriptions (do-registry) + model judgment. Kept: validate/check_project/display/dispatch gates, .planning/ exemption facts, dispatcher-never-works rule — all leverage. |
| get-shit-done/bin/lib/init.cjs | 133 (net −128) | buildTaskContext() plan/req-count→complexity thresholds are keyword-adjacent tier judgment; historyHints/failureRate feeding and classifyTask() wiring exist only to bias model choice by encoded heuristics. resolveModelInternal keeps user config (leverage); the taskContext arg that steered it was judgment. |
| tests/init.test.cjs | 507 | Tests pinning the deleted judgment (buildTaskContext thresholds, taskContext wiring, task_classification shape, INTEL-16/18 history wiring) — scaffolding-of-scaffolding; deleted with the behavior they froze. |
| tests/e2e/intelligence-pipeline.test.cjs | 357 (file) | End-to-end pin of the classify→route pipeline being excised; nothing left to exercise. |
| get-shit-done/bin/lib/core.cjs | 23 (net −20) | dynamicSelect step-3 branch in resolveModelInternal picked model tiers from complexity heuristics — HOW MUCH compute judgment. Kept steps 1/2/static: user overrides, resolve_model_ids runtime facts, user-set profile — all config/leverage. |
| tests/core.test.cjs | 202 | Dynamic-routing + MODEL_ROUTE debug-logging describes pinned the deleted judgment branch; static-profile describes (user config) kept. |
| get-shit-done/bin/lib/model-profiles.cjs | 64 (net −64) | MODEL_TIERS + dynamicSelect() encode "trivial tasks deserve cheap models" — a user-set profile is config, auto tier selection is judgment. Kept: _modelProfiles data, lazy init, MODEL_PROFILES/VALID_PROFILES getters, map/table helpers — facts about what exists. |
| tests/model-profiles.test.cjs | 212 | MODEL_TIERS + dynamicSelect describes pinned the deleted tier judgment; data-integrity describes kept. |
| tests/perf/routing-benchmark.test.cjs | 301 (file) | Perf pin ("dynamicSelect < 2ms") for a deleted judgment function; benchmarking judgment scaffolding is still judgment scaffolding. (Deletion landed via concurrent commit b730f8d — shared index.) |
| get-shit-done/bin/lib/classify.cjs | 278 (file) | Keyword scoring and score→tier thresholds are pure encoded judgment; adaptWorkflowGates had zero production consumers. Sole consumer (init.cjs) already rewired in commit 2. |
| tests/classify.test.cjs | 223 (file) | Pinned the deleted classifier's keyword scores and thresholds. |
| get-shit-done/bin/lib/config.cjs + core.cjs | 19 (net −16) | routing_strategy + workflow.adaptive keys validated, defaulted, migrated, and read — but wired to nothing after commits 2–5. A knob wired to nothing is deception, not config. 1→2 migration kept as no-op version bump (CONFIG_VERSION stays 2); migration never strips user keys. |
| tests/{config,core}.test.cjs (commit 6) | 131 (net −113) | Describes pinning the retired keys' validation/defaults/injection; migration tests rewritten to pin the no-op bump + user-key preservation instead. |
| docs + references (commit 6) | 154 (net −149) | CONFIGURATION.md / USER-GUIDE.md / DEVOPS-HANDOFF.md / references/model-profiles.md sections documenting the deleted routing machinery (classifyTask signals/scores, dynamicSelect tiers, routing_strategy/adaptive knobs). Stale docs describing deleted judgment are the paper trail of the deception. Execution-history telemetry docs kept. |

## Deletions — Vendored skills

_(Merged from BITTER_LESSON_LOG.pkg-N.md fragments after Wave 1b.)_

## DEFERRED

_(Consolidated at Wave 2. Never guessed.)_

## Totals

_(Finalized at Wave 2 from live measurement.)_
