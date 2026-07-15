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
| _(populated by core executor, commits 1–6)_ | | |

## Deletions — Vendored skills

_(Merged from BITTER_LESSON_LOG.pkg-N.md fragments after Wave 1b.)_

## DEFERRED

_(Consolidated at Wave 2. Never guessed.)_

## Totals

_(Finalized at Wave 2 from live measurement.)_
