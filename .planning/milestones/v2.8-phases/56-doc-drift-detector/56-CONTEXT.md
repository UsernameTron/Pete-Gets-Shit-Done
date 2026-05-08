# Phase 56: Doc Drift Detector - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning
**Mode:** Auto (operator opted out of clarifying questions for this discussion)

<domain>
## Phase Boundary

Ship `scripts/check-doc-drift.cjs` — a zero-dependency Node CJS detector that measures live test counts, coverage, and filesystem inventory, compares those values against numeric claims in the three living docs (CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md), and fails on disagreement with a structured drift table.

In scope:
- Live measurement of: test count, suite count, line coverage, branch coverage, function coverage, agent count, command count, skill count, hook count.
- Regex-anchored extraction of the same claims from the three living docs.
- Drift table output (file, line, claimed, actual, metric) and `--json` flag.
- Exit non-zero on any drift, zero on agreement.
- Unit tests, fixtures, c8 coverage tracking — same shape as Phase 55.

Out of scope (explicit):
- CI wiring — Phase 57 does that.
- Cross-doc consistency checks beyond numeric (DOCLIVE-01, deferred to a later milestone).
- Codebase-map drift (DOCMAP-01, separate concern).
- Auto-fix or rewriting docs — `/gsd:sync-docs` already covers that path.
- External-link validation (DOCEXT-01, deferred).
- `.planning/PROJECT.md` is **not** in scope. The requirement (DOCDRIFT-03) names CLAUDE.md, README.md, DEVOPS-HANDOFF.md only.

</domain>

<decisions>
## Implementation Decisions

### Script architecture
- **D-01:** Single CJS script at `scripts/check-doc-drift.cjs`. Mirrors Phase 55 (`scripts/validate-doc-links.cjs`): shebang, `'use strict'`, exports for testability, `if (require.main === module) main(process.argv.slice(2))` guard at end. Zero external deps — Node built-ins only (`fs`, `path`, `child_process`).
- **D-02:** Module exports the pure/composable functions (`measure*`, `extractClaims`, `compareClaim`, `formatTable`, plus the `METRICS` registry). Tests load these via `require()` without invoking `main()`.

### Metric registry shape
- **D-03:** A single hardcoded `METRICS` array of metric-definition objects inside the script — **not** an external JSON config. Each entry has the shape:

  ```js
  {
    id: 'test_count',                 // stable identifier used in drift report
    label: 'test count',              // human-readable for output
    measure(ctx) { ... },             // returns the actual value
    claims: [                         // list of (file, regex, normalize) triples
      {
        file: 'CLAUDE.md',
        // Capture group 1 = the claimed numeric value, anchored on context
        regex: /-\s+\*\*Scale\*\*:\s+(\d{1,3}(?:,\d{3})*|\d+)\s+test suites,\s+(\d{1,3}(?:,\d{3})*|\d+)\s+assertions/,
        captureIndex: 2,              // which group is the value for *this* metric
        normalize: stripCommas,
      },
      ...
    ],
  }
  ```

  Rationale: matches Phase 55's hand-rolled style (zero new dependencies, no config-file indirection), keeps every claim/measurement pair in one auditable file, and lets future metrics be added with a single registry-entry diff.

### Metrics measured (>= 6 categories per DOCDRIFT-01/02)
- **D-04:** Comprehensive set — all of the following are measured and checked against claims that exist in the three living docs:
  | Metric ID | What it measures | How |
  |-----------|------------------|-----|
  | `test_count` | Total assertions/tests | `node --test tests/*.test.cjs --test-reporter=tap`, parse `# tests N` summary line |
  | `suite_count` | Total describe-suite count | Same TAP run, parse `# suites N` (or fall through to a re-derived count if the runtime doesn't emit it) |
  | `line_coverage` | Aggregate line/statement coverage % | Read `coverage/coverage-final.json`, aggregate per-file `s` totals |
  | `branch_coverage` | Aggregate branch coverage % | Read `coverage/coverage-final.json`, aggregate per-file `b` totals |
  | `function_coverage` | Aggregate function coverage % | Read `coverage/coverage-final.json`, aggregate per-file `f` totals |
  | `agent_count` | GSD agents | `ls agents/gsd-*.md \| wc -l` (built-in tracking only — excludes archived) |
  | `command_count` | GSD slash commands | `ls commands/gsd/*.md \| wc -l` |
  | `skill_count` | Plugin skills | `ls -d plugins/*/skills/*/ \| wc -l` |
  | `hook_count_execution` | Bundled execution hooks | `ls hooks/dist/*.js \| wc -l` (bundled is the deployed surface) |

  The hook-count metric is intentionally a **single, narrow** definition: bundled execution hooks (`hooks/dist/`). Living docs include several different "hook" claims ("15 hooks fire automatically", "10 governance hooks", "16 runtime hooks", "7 execution hooks"). The detector targets the most common, unambiguous one (execution hooks) for v1. Other hook counts are deferred — see Deferred Ideas.

### Test-count measurement (the heart of D-04)
- **D-05:** The detector spawns `node --test --test-reporter=tap tests/*.test.cjs` itself via `execFileSync` and parses the TAP summary. It does **not** require a precomputed stats file. Rationale: TAP output is a stable, native Node feature, parses cleanly with two short regexes, and avoids touching `scripts/run-tests.cjs`. Run-time on this codebase is the same ~30s as `npm test` — acceptable for a check that runs once per PR in CI.

  Trade-off explicitly accepted: 30s wall time per detector run. The CI integration in Phase 57 can decide whether to dedupe with the existing `npm test` step (e.g., write a `coverage/test-stats.json` artifact in the test step and read it here). For Phase 56, we ship the self-contained version.

### Coverage measurement
- **D-06:** Read `coverage/coverage-final.json` (already emitted by `npm run test:coverage` and `npm run test:coverage:full` per `package.json:52-53`). Aggregate the per-file `s` (statements/lines), `b` (branches), `f` (functions) maps:
  - `lineCoverage = sum(covered_s) / sum(total_s) * 100`
  - `branchCoverage = sum(covered_b) / sum(total_b) * 100`
  - `functionCoverage = sum(covered_f) / sum(total_f) * 100`

  Implemented inside the script — no external aggregator. If `coverage/coverage-final.json` is absent or older than 1 hour (configurable via `--coverage-stale-secs`, default 3600), the detector exits non-zero with the exact remediation message: `coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs`.

### Numeric claim extraction
- **D-07:** Per-claim anchored regexes — **not** generic number scanning. Each claim entry in the `METRICS` registry names the file, supplies a regex that captures the numeric value with surrounding context (e.g., `(\d+)\s+test suites`), and a normalize function. False negatives (a stale doc claim the regex misses) are recoverable; false positives (random numbers flagged as drift) erode trust and are not.
- **D-08:** Comma-tolerant integer comparison: `stripCommas("2,667") === stripCommas("2667")` — both normalize to `2667`. Implemented as a one-liner: `s => s.replace(/,/g, '')`.
- **D-09:** Percentage tolerance: compare with absolute epsilon `0.01` (i.e., "91.23%" matches anything in `[91.22%, 91.24%]`). The doc author chose the precision; the detector honors it within ±0.01. Implemented as `Math.abs(actual - claimed) <= 0.01`.
- **D-10:** Multiple claims per metric per file are supported. If `README.md` claims `command_count` in three different sections, all three are checked independently and reported independently if any drifts.

### Living docs scope
- **D-11:** Exactly three files, in this exact order in the report:
  1. `CLAUDE.md`
  2. `README.md`
  3. `docs/DEVOPS-HANDOFF.md`

  Per DOCDRIFT-03. `.planning/PROJECT.md` and `CHANGELOG.md` are NOT in scope despite being touched by `/gsd:sync-docs`. Phase 57 may surface a need; for v1 we hold the line.

### Output format
- **D-12:** Default mode prints a padded text table — same column-pad helper as Phase 55's `formatTable`:

  ```
  check-doc-drift: 2 drift(s) found

  FILE                    LINE  METRIC          CLAIMED  ACTUAL
  ----------------------  ----  --------------  -------  -------
  README.md               59    command_count   65       66
  docs/DEVOPS-HANDOFF.md  46    command_count   65       66
  ```

  Header underline is `-` repeated to column width, separated by `  ` (two spaces). Same style as Phase 55.

  Clean pass: `check-doc-drift: all 18 numeric claims match live values (3 files, 9 metrics)`.

- **D-13:** `--json` flag emits the structured object envelope (matches Phase 55's pattern and resolves the same cross-AI review HIGH finding):

  ```json
  {
    "status": "drift" | "clean",
    "checked": 18,
    "files": 3,
    "metrics": 9,
    "drift": [
      { "file": "README.md", "line": 59, "metric": "command_count", "claimed": "65", "actual": "66" }
    ]
  }
  ```

  Empty `drift` array on clean pass. `claimed` and `actual` are stringified to preserve the source representation (so `"2,667"` round-trips through JSON output the same way it appears in CLAUDE.md).

### Sort order in the report
- **D-14:** Drift records are sorted by `(file, line)`, file order matching the canonical `[CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md]` ordering — not alphabetical, not insertion order. Human readers scan the report in stable document order.

### Exit codes
- **D-15:** Mirror Phase 55's contract:
  - `process.exit(0)` — all claims match (clean).
  - `process.exit(1)` — any drift found (broken).
  - `process.exit(2)` — runtime error (missing/stale `coverage-final.json`, unreadable doc, regex compile failure). Reserved exit for Phase 57's CI integration to distinguish "real drift" from "couldn't run check".

### Test layout (TDD, three waves — same shape as Phase 55)
- **D-16:** `tests/check-doc-drift.test.cjs` + `tests/fixtures/doc-drift/{clean,drift,edge}/`. `node:test` + `node:assert`, no external test helpers. Wave structure:
  - **Plan 56-01 (Wave 1):** Fixtures + unit tests + pure functions (`stripCommas`, `aggregateCoverage`, `parseTapSummary`, `extractClaims`, `compareClaim`, `formatTable`). RED → GREEN per function.
  - **Plan 56-02 (Wave 2):** Integration — measurement runners (`measureCoverageFromJson`, `measureTestCounts`, filesystem `measure*`) + `main(argv)` + spawnSync-based exit-code tests + `--json` output shape tests. Add `scripts/check-doc-drift.cjs` to `.c8rc.json` `include` array.
  - **Plan 56-03 (Wave 3):** Real-repo run — point detector at the live repo, fix any genuine drift discovered (likely command_count: README.md says 65, actual is 66), confirm clean exit, run full suite green, update CLAUDE.md/README.md/DEVOPS-HANDOFF.md to mention the new script.

### Coverage tracking
- **D-17:** Add `"scripts/check-doc-drift.cjs"` to the `include` array in `.c8rc.json` (Wave 2). Per-module threshold ≥ 80%. Phase-gate threshold ≥ 90% line / ≥ 83% branch on the overall project — same as Phase 55.

### CLI flags
- **D-18:** Minimal, mirrors Phase 55 + adds two operational flags:
  - `--json` — JSON output instead of table.
  - `--root <dir>` — override repo root (used by integration tests targeting fixture trees).
  - `--coverage-stale-secs <N>` — override the 1-hour coverage staleness threshold (default 3600). Set to `0` to disable the check.
  - `--help` — usage and exit 0.

### Claude's Discretion
- Exact column widths and table header style — follow Phase 55's `formatTable` shape.
- TAP summary regex tolerance for whitespace and node version variance.
- Whether to memoize repeat file reads inside a single run (likely yes — at most three living docs and one coverage file, doesn't matter).
- Internal helper organization — section dividers and ordering inside the script, matching CONVENTIONS.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements (authoritative scope)
- `.planning/ROADMAP.md` §"Phase 56: Doc Drift Detector" — Goal, depends-on, requirements list, four success criteria.
- `.planning/REQUIREMENTS.md` — DOCDRIFT-01 through DOCDRIFT-05 verbatim.
- `.planning/PROJECT.md` — Project vision, zero-dep constraint, current milestone (v2.8 Documentation Integrity).
- `.planning/STATE.md` — Current execution state and milestone position.

### Sibling phase (template — read in full)
- `.planning/phases/55-internal-link-validator/55-RESEARCH.md` — Sibling-phase research; reuse the same architectural pattern (zero-dep CJS, regex-based extraction, `git ls-files`, spawnSync integration tests, exports + `require.main === module` guard).
- `.planning/phases/55-internal-link-validator/55-01-PLAN.md`, `55-02-PLAN.md`, `55-03-PLAN.md` — Three-wave TDD structure exemplar; Phase 56 should mirror plan headers, must_haves shape, and wave dependencies.
- `.planning/phases/55-internal-link-validator/55-VERIFICATION.md`, `55-VALIDATION.md` — Verification rigor reference.

### Sibling implementation (concrete code patterns)
- `scripts/validate-doc-links.cjs` — Sibling validator. Reuse: `formatTable` column-padding helper pattern, code-fence skip state machine (irrelevant here but same style), spawnSync test harness, `require.main === module` guard, `--json` envelope shape.
- `tests/validate-doc-links.test.cjs` — Sibling test file. Reuse: `node:test` + `node:assert` style, fixture-tree pattern, integration test pattern using `spawnSync(process.execPath, [...])`.
- `tests/fixtures/doc-links/` — Sibling fixture tree. Phase 56's `tests/fixtures/doc-drift/` follows the same `clean/`, `drift/` (instead of `broken/`), `edge/` layout.

### Codebase patterns (background)
- `.planning/codebase/STACK.md` — Zero-dep constraint, Node ≥ 20, c8 ^11.0.0, esbuild ^0.25.12 in devDependencies only, no production deps.
- `.planning/codebase/CONVENTIONS.md` — CJS module structure, naming, export patterns, `'use strict'`, JSDoc style, section dividers.
- `.planning/codebase/TESTING.md` — Test patterns, fixture conventions, c8 config, `tests/<name>.test.cjs` naming.
- `scripts/run-tests.cjs` — Project test runner reference; do **not** modify in Phase 56 (D-05 keeps the detector self-contained).
- `.c8rc.json` — Coverage config; Wave 2 adds `scripts/check-doc-drift.cjs` to the `include` array.

### Measurement primitives (already-solved subproblems)
- `commands/gsd/sync-docs.md` — Authoritative reference for **how** each metric is measured (command count, agent count, skill count, version, test stats, coverage). Phase 56's `measure*()` functions implement the same primitives but as Node functions instead of shell commands. Differences from sync-docs:
  - sync-docs **rewrites** docs; Phase 56 **detects** disagreement.
  - sync-docs counts skills via `ls -d plugins/*/skills/*/`; Phase 56 mirrors.
  - sync-docs runs `npm test` and parses stdout; Phase 56 spawns `node --test --test-reporter=tap` directly (no `npm` indirection).
- `coverage/coverage-final.json` — c8 output schema. Per-file map containing `s`, `b`, `f` (statement/branch/function hit-counts). Aggregate over all files for project totals.

### Living docs (the targets of comparison)
- `CLAUDE.md` — `**Scale**: 536 test suites, 2,667 assertions, 91.23% line coverage` and analogous claims.
- `README.md` — `65 commands, 17 agents, 7 hooks` table cell, `45 skills, 10 subagents, 7 reference docs`, `2,667` test assertions, version refs, multiple hook claims (only `7 execution hooks` checked in v1).
- `docs/DEVOPS-HANDOFF.md` — Header version line, command/agent/hook table rows, skill counts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`scripts/validate-doc-links.cjs`** — Sibling validator. Reuse the `formatTable(records, repoRoot)` column-padding pattern verbatim (rename to `formatDriftTable` or generalize the existing one — let the planner choose). Reuse the `--json` envelope shape, the `--root <dir>` flag pattern, the `require.main === module` guard, the spawnSync-based integration test harness.
- **`tests/validate-doc-links.test.cjs`** — Sibling test file. Mirror the describe-block structure: one block per pure function, one block for integration/exit-code, one block for `--json` shape.
- **`scripts/run-tests.cjs`** — Project test runner. Phase 56 does NOT modify it (per D-05 the detector spawns its own `node --test` invocation).
- **`coverage/coverage-final.json`** — c8 output already emitted by `npm run test:coverage`. Read directly, aggregate per-file `s/b/f` totals — no new measurement infra needed.

### Established Patterns
- **Zero-dependency CJS** (`STACK.md`): All runtime code uses Node built-ins only. Phase 56 follows.
- **Regex-based parsing** (Phase 55 precedent): Hand-rolled regexes per concern, not external parsers. Phase 56 follows for both TAP summary parsing and doc-claim extraction.
- **TDD with `node:test`**: RED test → GREEN implementation per function. Same per-wave structure as Phase 55.
- **Integration tests via `spawnSync`**: Spawn the script as a child process, assert on `result.status` (exit code) and `result.stdout` (output shape). Phase 55 uses `spawnSync(process.execPath, [scriptPath, '--root', fixtureDir])` — Phase 56 reuses verbatim.
- **`if (require.main === module) main(...)` guard**: Lets tests import functions without invoking `main()`. Phase 55 enforces; Phase 56 enforces.
- **Padded text-table output**: Column widths computed from `max(header.length, ...records.map(r => r[col].length))`. Phase 55's `formatTable` is the reference implementation.
- **Output envelope for `--json`**: Object with `status`, counts, and a record array — not a raw array. This was the cross-AI review pass-1 HIGH finding for Phase 55; Phase 56 ships envelope-by-default.
- **Reason/category strings as canonical enums** (Phase 55): Reasons live in a small set of well-known strings. Phase 56's `metric` field on drift records is a stable enum (`test_count`, `suite_count`, `line_coverage`, etc.) — never a free-text label.
- **`scripts/run-tests.cjs` cross-platform glob resolution**: Phase 56's `node --test` spawn does the same — pass file globs resolved by Node's `readdirSync`, not shell expansion.

### Integration Points
- **`.c8rc.json`** — Wave 2 plan adds `"scripts/check-doc-drift.cjs"` to the `include` array. Without this, c8 doesn't track coverage for the new script and per-module ≥ 80% threshold isn't enforced.
- **CI (`.github/workflows/test.yml`)** — Phase 56 does NOT wire CI. Phase 57 does.
- **Living docs** — Wave 3 plan updates CLAUDE.md/README.md/DEVOPS-HANDOFF.md to mention the new script (same as Phase 55's Wave 3 added `validate-doc-links.cjs`).
- **`/gsd:sync-docs`** — Same target docs as Phase 56, but operates write-side. The detector and sync-docs are designed to coexist: sync-docs fixes, detector verifies. Phase 57 will run them in opposite CI roles (sync-docs is operator-invoked; detector is PR-blocking).

</code_context>

<specifics>
## Specific Ideas

- **"Compound metric" for hooks** — The living docs claim hook counts in at least four different ways ("15 hooks fire automatically", "10 governance hooks", "16 runtime hooks", "7 execution hooks", and a "+10 governance hooks" delta in DEVOPS-HANDOFF). Rather than try to reconcile all of them in v1, the detector targets the most concrete and stable one: **execution hooks** counted by `ls hooks/dist/*.js | wc -l`. The other hook counts are flagged as deferred ideas (see Deferred Ideas). This is a deliberate scope-discipline choice: better to ship one hook metric that works than five that are flaky.

- **Drift table is sorted by document order, not insertion order** (D-14). Pete will read the report file-by-file the way humans read a multi-file PR; the report respects that.

- **Exit code 2 reserved for runtime errors** (D-15) — Phase 57's CI step needs to distinguish "real drift" from "couldn't run check". Single exit-code-1 conflates both. Three-tier exits (0 clean / 1 drift / 2 error) match the conventions of `eslint`, `pytest`, `make`.

- **Live test count IS reported on drift, not silently skipped** — if a doc claims `2,667` and the live count is `2,723`, that's drift. The detector should NOT decide that "doc is just out of date". That's the operator's call, post-hoc, after seeing the report.

- **`--json` envelope mirrors Phase 55** — `{ status, checked, files, metrics, drift: [...] }`. Same shape, same `status: "clean" | "drift"` enum (Phase 55 uses `"clean" | "broken"`; Phase 56 uses `"clean" | "drift"` to be domain-accurate).

</specifics>

<deferred>
## Deferred Ideas

Captured here so they're not lost, but explicitly out of scope for Phase 56.

- **Cross-doc consistency beyond numeric** (DOCLIVE-01 — already deferred in REQUIREMENTS.md) — Same fact stated differently across CLAUDE.md / README.md / DEVOPS-HANDOFF.md beyond numeric counts. Requires a structured fact registry; bigger than v2.8.
- **Codebase-map staleness** (DOCMAP-01 — already deferred) — `.planning/codebase/CODEBASE-MAP-*.md` drift vs. live structure. Distinct measurement strategy from doc drift.
- **External link validator** (DOCEXT-01 — already deferred) — HTTP refs are flaky in CI; out of integrity-focused milestone scope.
- **Auto-fix mode** (REQUIREMENTS.md "Out of Scope") — `/gsd:sync-docs` already provides guided fix flow.
- **Additional hook counts** ("governance hooks", "runtime hooks", "safety hooks", "+15 hooks fire automatically") — v1 covers execution hooks only. Future enhancement: expand `METRICS` registry with `hook_count_governance`, `hook_count_total`, etc., once the canonical definitions stabilize. Tracking note: README.md and DEVOPS-HANDOFF.md currently disagree on the canonical "hook" count, suggesting upstream definition cleanup before adding more metrics.
- **`.planning/PROJECT.md` and `CHANGELOG.md` drift** — `/gsd:sync-docs` touches both, but DOCDRIFT-03 names only the three living docs. Adding them is a one-line registry expansion in a future phase.
- **Performance: deduplicate `npm test` between detector and CI test step** — Phase 57 may add a `coverage/test-stats.json` artifact emitted by the test step and consumed by the detector via `--test-stats <path>`. Phase 56 ships the self-contained version.
- **Standalone `--measure` mode** — A read-only metrics dump (no comparison) for human inspection. `/gsd:sync-docs` partially covers this. Worth considering if the detector's measurement code becomes a reusable library.
- **`.docdriftignore`** — A way to suppress specific (file, line, metric) tuples from drift detection (e.g., archived milestone counts that legitimately freeze in time). No known use case in the current repo; add if Wave 3 surfaces one.

</deferred>

---

*Phase: 56-doc-drift-detector*
*Context gathered: 2026-05-07*
