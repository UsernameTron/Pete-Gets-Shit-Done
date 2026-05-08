# Phase 56: Doc Drift Detector - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 56-doc-drift-detector
**Mode:** Auto (operator instructed: "work without stopping for clarifying questions")
**Areas auto-resolved:** Script architecture, Metric registry shape, Coverage measurement strategy, Test-count measurement strategy, Numeric matching strictness, Living docs scope, Hook-count canonicalization, Output format and exit codes

---

## Script Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Single CJS script in `scripts/` | Mirrors Phase 55 (`scripts/validate-doc-links.cjs`): shebang, `'use strict'`, exports + `require.main === module` guard, zero-dep | ✓ |
| ESM module | Project is CJS-only per STACK.md; would require build step | |
| Multi-file (lib + cli) | Overkill for a sub-500-line script; adds module hopping for readers | |

**Auto-selected:** Single CJS script.
**Notes:** Sibling Phase 55 is the canonical pattern. Zero-dep, `'use strict'`, exports for testability, guarded `main()`. Pete's "demand elegance" rule suggests reuse over reinvention.

---

## Metric Registry Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded array of metric-definition objects inside the script | One auditable file, no config indirection, matches Phase 55 hand-rolled style | ✓ |
| External JSON config (`config/metrics.json`) | Decouples definitions from code, but adds an indirection layer and a second file to keep in sync | |
| Separate `lib/metrics.cjs` module | Adds a `lib/` dependency to a `scripts/` script — inconsistent with Phase 55 | |

**Auto-selected:** Hardcoded array.
**Notes:** Each `METRICS` entry has `{id, label, measure(), claims: [{file, regex, captureIndex, normalize}]}`. Adding a new metric is a single registry-entry diff.

---

## Coverage Measurement Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Read `coverage/coverage-final.json` and aggregate | Already emitted by `npm run test:coverage`. Aggregation is ~10 lines. Zero re-run cost. | ✓ |
| Spawn `c8 --reporter=json-summary npm test` | Doubles test runtime per detector run (~60s); duplicates work CI already does. | |
| Parse `npm run test:coverage` text output | Brittle — c8 text format is not contract; subject to format drift across c8 minor versions. | |
| Add `json-summary` reporter to package.json scripts | Touches package.json (extra blast radius); detector still has to read a file either way. | |

**Auto-selected:** Read `coverage-final.json`, aggregate inside the script.
**Notes:** Staleness check (default 3600s, configurable via `--coverage-stale-secs`). If file missing or stale → exit 2 with remediation message. CI runs `npm run test:coverage` before this script runs.

---

## Test-Count Measurement Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Detector spawns `node --test --test-reporter=tap` itself | Self-contained, parses TAP summary line, ~30s runtime. No coordination with run-tests.cjs needed. | ✓ |
| Modify `scripts/run-tests.cjs` to write `coverage/test-stats.json` side-effect | Smaller per-detector run cost (instant read), but couples detector to run-tests.cjs and modifies an existing script. | |
| Run `npm test` via spawnSync, parse stdout summary | `npm` indirection adds 0.5-1s overhead and pollutes output with npm prefix lines; less clean than direct `node --test`. | |
| Count tests statically by grepping source for `test(` and `describe(` | Fragile — counts strings in source, not runtime test invocations. Misses parameterized tests. | |

**Auto-selected:** Self-contained TAP-spawn approach.
**Notes:** 30s wall time per detector run accepted. Phase 57's CI integration may dedupe by adding a precomputed `test-stats.json` artifact and a `--test-stats <path>` flag — deferred.

---

## Numeric Claim Extraction Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Per-claim anchored regex with surrounding context (e.g., `(\d+)\s+test suites`) | False negatives recoverable; false positives erode trust. Requires explicit registry entry per claim. | ✓ |
| Generic number scanning across living docs | Catches everything but flags spurious numbers (year refs, version segments, prose examples). | |
| Hybrid: anchored regex + suppression list | Adds suppression-list maintenance overhead before there's a known false-positive case. | |

**Auto-selected:** Per-claim anchored regex.
**Notes:** Comma-tolerant (`stripCommas`). Percentage tolerance ±0.01. Multiple claims per metric per file all checked independently.

---

## Living Docs Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Three files per DOCDRIFT-03: CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md | Matches the requirement verbatim. Discipline first. | ✓ |
| Three above + `.planning/PROJECT.md` | `/gsd:sync-docs` touches PROJECT.md, but DOCDRIFT-03 didn't name it. Scope creep. | |
| All `*.md` in repo root + `docs/` | Too broad; many archive/historical files would emit false drift. | |

**Auto-selected:** Three files per requirement.
**Notes:** PROJECT.md and CHANGELOG.md added to deferred ideas — registry expansion in a future phase if Phase 57 surfaces the need.

---

## Hook-Count Canonicalization

| Option | Description | Selected |
|--------|-------------|----------|
| Single hook metric: `hook_count_execution = ls hooks/dist/*.js \| wc -l` | One narrow, unambiguous count. Other hook counts deferred. | ✓ |
| Multiple hook metrics (execution, governance, runtime, total) | Living docs disagree on canonical totals — suggests upstream definition cleanup before adding more metrics. | |
| Skip hooks entirely from v1 | DOCDRIFT-01 requires "at least six metric categories" — execution-hook-count keeps the count comfortably above six when combined with tests, suites, 3 coverage metrics, agents, commands, skills. | |

**Auto-selected:** Execution hooks only for v1.
**Notes:** Tracking note in deferred ideas: README and DEVOPS-HANDOFF disagree on what "hook" means; clean up the docs before expanding the metric.

---

## Output Format and Exit Codes

| Option | Description | Selected |
|--------|-------------|----------|
| Padded text table by default + `--json` envelope flag | Matches Phase 55 verbatim. Resolves cross-AI HIGH finding (object envelope, not raw array). | ✓ |
| JSON-only (no text mode) | Less human-friendly; fails the "report I can read" criterion. | |
| Two-exit-code contract (0 clean, 1 anything-else) | Conflates "real drift" with "couldn't run". Phase 57 CI needs to distinguish them. | |

**Auto-selected:** Text-by-default, `--json` envelope, three-tier exits (0/1/2).
**Notes:** Drift records sorted by `(canonical-file-order, line)`. Exit 2 reserved for runtime errors (missing/stale coverage data, unreadable doc, regex compile failure).

---

## Test Layout and Wave Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Three TDD waves matching Phase 55 (fixtures+pure → integration+main → real-repo) | Same shape, same discipline, same wave-merge points. Lowest cognitive cost for the planner and executor. | ✓ |
| Two waves (combined RED/GREEN + integration in one) | Loses the natural test-isolation point between pure and I/O functions. | |
| One monolithic plan | Harder to wave-merge; harder to attribute coverage gaps. | |

**Auto-selected:** Three waves.
**Notes:** Plans 56-01 (fixtures + pure functions), 56-02 (integration + main + c8 wiring), 56-03 (real-repo + suite green + living-docs).

---

## Claude's Discretion

The following choices were not material enough to warrant a registered decision; the planner/executor will choose during implementation:

- Exact column widths in `formatDriftTable` — follow Phase 55's auto-padded approach.
- Internal helper organization and section divider style — match `CONVENTIONS.md`.
- Whether to memoize repeat file reads inside a single run (likely yes for the three living docs).
- TAP summary regex tolerance for whitespace/Node-version variance — write the regex, then verify against Node 20/22/24 TAP outputs.
- Test-fixture file names and exact content — same shape as `tests/fixtures/doc-links/`.

---

## Deferred Ideas (mentioned during analysis, captured for later)

- Multiple hook metrics (governance, runtime, total) — pending upstream doc-definition cleanup.
- `.planning/PROJECT.md` and `CHANGELOG.md` drift — registry expansion in a future phase.
- `coverage/test-stats.json` artifact + `--test-stats <path>` flag — Phase 57 CI dedupe optimization.
- Standalone `--measure` mode — read-only metrics dump for human inspection.
- `.docdriftignore` — suppression list for legitimately frozen historical counts.
- Cross-doc consistency beyond numeric (DOCLIVE-01 — already deferred at the milestone level).
- External-link validator (DOCEXT-01 — already deferred).

---

## Operator Instruction Acknowledged

System reminder during this discussion explicitly stated: *"work without stopping for clarifying questions. When you'd normally pause to check, make the reasonable call and continue."*

This log records every gray area where AskUserQuestion would normally have fired, the alternatives considered, and the auto-selected choice with rationale. The operator can revise any decision by editing CONTEXT.md before `/gsd:plan-phase 56` runs.
