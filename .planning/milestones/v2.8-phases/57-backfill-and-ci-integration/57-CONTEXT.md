# Phase 57: Backfill and CI Integration - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Drive `validate-doc-links.cjs` to a clean run against the live repo via a comprehensive backfill, add an `--exclude <glob>` mechanism so intentionally-broken test fixtures and template examples can be suppressed, and wire both validators (`scripts/validate-doc-links.cjs` and `scripts/check-doc-drift.cjs`) into `.github/workflows/test.yml` as blocking CI steps so doc drift cannot merge undetected. After this phase ships, the v2.8 milestone closes.

In scope:
- Comprehensive backfill: 83 archived-roadmap cross-refs, ~10 real broken refs in `docs/README-technical.md` + `docs/README.md`, 9 anchor issues, DOCREF-01/02 closure with evidence.
- New `--exclude <glob>` CLI flag on `validate-doc-links.cjs` with gitignore-style glob semantics, multi-value, list passed at the CI call site.
- `.github/workflows/test.yml` change: drift detector step inside the `test` job (ubuntu-latest/Node 22 leg only, after coverage step); new `docs-integrity` job running the link validator in parallel.
- Branch-protection update: add `docs-integrity` as a required status check (4 → 5).
- Living-docs sync: CLAUDE.md, README.md, DEVOPS-HANDOFF.md mention the new CI gates and the `--exclude` flag.
- Test additions and coverage tracking for the new `--exclude` flag (≥ 80% per-module, ≥ 90% line / ≥ 83% branch overall).

Out of scope (explicit):
- `.docslinkignore` file pattern (deferred — list lives in CI step, not in repo-local config).
- Hardcoded `DEFAULT_EXCLUDES` inside the validator (rejected — keeps validator generic, exemption is a call-site policy).
- Relocating `docs/health-reports/full-audit-2026-04-11.md` or `.planning/codebase/STRUCTURE.md` (both exist on disk; DOCREF-01/02 closes via clarification, not file moves).
- Cross-doc consistency beyond numeric drift (DOCLIVE-01 already deferred per REQUIREMENTS.md).
- Codebase-map staleness detection (DOCMAP-01 deferred).
- External link validator (DOCEXT-01 deferred).
- Auto-fix mode (`/gsd:sync-docs` covers that path).
- Refactoring `governance` job to absorb link validator (rejected — separate job keeps signals readable and concerns separated).

</domain>

<decisions>
## Implementation Decisions

### Backfill scope and repair strategy

- **D-01:** Comprehensive backfill — drive `validate-doc-links.cjs` to **zero broken refs** against the live repo (all 109 currently flagged). Rationale: locks day-1 strict-blocking CI without an asterisk; avoids carrying doc debt into v2.9.
- **D-02:** **83 archived-roadmap cross-refs** repaired via mechanical sed-sweep across `.planning/milestones/v*-ROADMAP.md`: replace `(milestones/v` → `(v` and `]: milestones/v` → `]: v` (covers both inline and reference-style links). The cross-refs were correct before archival into `.planning/milestones/`; the prefix `milestones/` no longer resolves from inside that directory. Sibling references resolve correctly after the sweep. Lowest blast radius, preserves historical milestone navigability, single-shot fix.
- **D-03:** **DOCREF-01 / DOCREF-02 closure via clarification with evidence**, not file relocation. Both named docs (`docs/health-reports/full-audit-2026-04-11.md` and `.planning/codebase/STRUCTURE.md`) exist on disk; the validator currently reports zero broken refs to either path. The remaining textual mentions are in REQUIREMENTS.md, ROADMAP.md, tasks/todo.md (describing the requirements themselves) and `get-shit-done/templates/codebase/structure.md` + `get-shit-done/workflows/map-codebase.md` (template/workflow descriptions). The 57-SUMMARY.md will record the validator output as proof and tick DOCREF-01/02 complete. No relocation phase, no descriptive-text rewrite — the requirement intent (no broken refs to those targets) is already satisfied.
- **D-04:** **~10 real broken refs in `docs/README-technical.md` + `docs/README.md`** repaired case-by-case during execution: verify each target, repair link if file moved/renamed, delete the link if target was removed. Specific items:
  - `docs/README-technical.md:18` `assets/terminal.svg`
  - `docs/README-technical.md:32` `docs/USER-GUIDE.md`
  - `docs/README-technical.md:269` `docs/workflow-discuss-mode.md`
  - `docs/README-technical.md:608` `docs/governance-customization.md`
  - `docs/README-technical.md:742` `docs/USER-GUIDE.md#configuration-reference`
  - `docs/README-technical.md:975` `LICENSE`
  - `docs/README.md:5` × 3 `pt-BR/README.md`, `ja-JP/README.md`, `zh-CN/README.md` (i18n placeholders — remove or stub during execution)
  - `.planning/milestones/archived-phases/02-coverage-audit/02-VERIFICATION.md:43` `coverage-baseline.md` (archived; remove ref)
- **D-05:** **9 anchor issues** repaired by retargeting to existing headings (rename anchor reference, not the heading) where intent is clear; drop the `#anchor` portion when no close match exists. The 6 anchor issues that originate inside `tests/fixtures/doc-links/` and validator self-tests are exempted via the `--exclude` mechanism (D-08), not repaired (they're intentional test fixtures).
- **D-06:** Backfill runs **before** the CI workflow change in execution order. The CI step must observe a clean repo on first invocation; otherwise day-1 strict-blocking trips on the very first PR.

### Exemption mechanism for intentional broken refs

- **D-07:** Add `--exclude <glob>` CLI flag to `validate-doc-links.cjs`, **multi-value** (`--exclude a --exclude b --exclude c`), gitignore-style glob semantics (`**` matches any number of path segments, `*` matches a single segment, leading `!` not supported in v1). Implementation: hand-rolled gitignore-glob → regex converter (zero-dep, mirrors validator's existing hand-rolled style). Excluded paths are filtered out of the file-discovery step (after `git ls-files`, before parse).
- **D-08:** Exempt the following paths in CI invocation:
  - `tests/fixtures/doc-links/**` — intentional broken-fixture trees for validator self-tests
  - `.claude/skills/SKILL.md` — contains `[Title](file.md)` as a documented format example
  - `.claude/skills/dream-memory-consolidation/SKILL.md` — same example pattern
  - `.planning/REQUIREMENTS.md` line 14 falls under DOCLINK-01's regex example `[text](path/to/file.md)` — choose between adding REQUIREMENTS.md to `--exclude` (sledgehammer; loses validation on the rest of the file) or wrapping the example in inline backticks `` `[text](path/to/file.md)` `` so the link parser doesn't see it as a link. Plan default: **wrap inline-backtick** the example in REQUIREMENTS.md (single-line edit; validator skips inline code spans implicitly via its existing parser; alternatively, the planner may decide --exclude is simpler). Decision deferred to planner judgment with explicit guidance.
  - `.planning/milestones/v2.7-phases/54-automated-uat-runner/54-03-PLAN.md` — contains a regex example `?!\\s*\\/dev\\/null` that the validator misparses as a link path. Wrap in inline backticks during execution.
- **D-09:** Exclude list lives in **the `test.yml` step command line**, not in a `.docslinkignore` file and not in a hardcoded `DEFAULT_EXCLUDES` constant inside the validator. Rationale: keeps the validator generic and policy-free; the CI step is the single source of truth for "what's exempt"; future repo-local config (`.docslinkignore`) can be added later if multiple call sites need DRY (deferred).

### CI step structure

- **D-10:** **Drift detector** runs as a step inside the existing `test` job, gated to **ubuntu-latest / Node 22 / full_suite=true** only (the matrix combo that already runs `npm run test:coverage:full`). Drift step runs after coverage step, before the upload-artifact step. Single-leg gating because drift output is platform-independent — running on three combos wastes CI minutes for no signal gain. Step uses `if: matrix.full_suite && matrix.os == 'ubuntu-latest' && matrix.node-version == 22`.
- **D-11:** **Link validator** runs as a new top-level job `docs-integrity`, parallel to `test` and `governance`. Single runner: ubuntu-latest, Node 22, no matrix. Job steps: checkout → setup-node@v4 with Node 22 → `npm ci` → run validator with `--exclude` list. Lightweight — no coverage, no test execution. Fails fast in parallel with `test` job; signals stay readable separately.
- **D-12:** **Triggers** for the new `docs-integrity` job: same as existing jobs (`push` to `main`, `pull_request` to `main`, `workflow_dispatch`). The drift step inherits the test job's triggers. Captures drift introduced by direct main pushes (admin merges, hotfixes), consistent with current CI culture.
- **D-13:** **Branch protection update**: `docs-integrity` is added as a required status check via `gh api repos/:owner/:repo/branches/main/protection` PATCH. Required check count goes from 4 to 5 (adding `docs-integrity` alongside `test macos-latest/22`, `test ubuntu-latest/20`, `test ubuntu-latest/22`, `governance`). The drift step does **not** appear separately in branch protection — its status rolls up into the `test ubuntu-latest/22` check via the test job's overall result. The branch-protection PATCH is captured as a documented operator step in `57-SUMMARY.md` so it executes at ship time, not during the workflow PR. Out of band but blocking before claiming the milestone done.
- **D-14:** **Concurrency**: existing `concurrency: { group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}, cancel-in-progress: true }` covers the new job (it's at workflow level, applies to all jobs). No change.
- **D-15:** **fail-fast: true** on the test matrix is preserved. If the drift step fails, the matrix legs cancel — same behavior as a test failure. Acceptable: drift output is the same regardless of OS/Node, so cancelling other legs costs nothing.

### Failure mode (blocking semantics)

- **D-16:** **Strict-block from day 1.** Both validators ship as blocking gates immediately; no `continue-on-error: true` step flag, no ratchet phase. The comprehensive backfill (D-01..D-06) brings the repo to validator-clean before the workflow change merges, so first PR after merge sees a green gate. Justification: warnings get ignored; ratcheting requires a follow-up commit and risks being forgotten.
- **D-17:** **Exit code 2 (runtime error)** is treated identically to exit code 1 (drift / broken links) — both fail the CI step and block merge. Rationale: matches DOCCI-03 ("non-zero exit blocks merge") verbatim; distinguishing exit-2 in CI requires `if: steps.drift.outcome == '...'` plumbing for marginal gain (real drift could mask if logic gets the gate wrong). Operator investigates by reading the step output — the validator's error messages are explicit (`coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs`).

### Living-docs updates (Wave 3 / final-phase doc sync)

- **D-18:** Update `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` to:
  - Reference the new CI gates (under "Tests and Coverage" or equivalent section).
  - Mention `--exclude` flag in the validator usage line.
  - Update branch-protection list from 4 to 5 required checks.
  - Update v2.8 milestone status to complete in PROJECT.md milestone history.
- **D-19:** Run `check-doc-drift.cjs` after the doc updates to confirm no new drift was introduced (numeric claims like test count, coverage stay accurate).

### Test plan (TDD, three waves — same shape as Phases 55 and 56)

- **D-20:** Test layout `tests/validate-doc-links-exclude.test.cjs` (or extend existing `tests/validate-doc-links.test.cjs`) for the new `--exclude` flag. Cases:
  - Exclude single glob, single match — file is omitted from validation.
  - Exclude multiple globs — all matching files omitted.
  - Glob `**` semantics — recursive directory match.
  - Glob `*` semantics — single-segment match.
  - Exclude flag absent — no behavior change vs current.
  - Exclude flag with no value — error exit (or graceful no-op, planner choice).
  - Excluded file would otherwise have broken links — they don't appear in output.
  - Excluded file has working links — also doesn't appear.
- **D-21:** Three execution waves:
  - **Plan 57-01 (Wave 1) — Backfill:** Sed-sweep archived ROADMAP cross-refs (D-02), repair real broken refs case-by-case (D-04), repair anchors (D-05), wrap inline-backtick the regex example in 54-03-PLAN.md (D-08). Run validator after each batch to confirm progress. End state: validator reports remaining broken refs only inside paths that will be excluded in Wave 2.
  - **Plan 57-02 (Wave 2) — Validator `--exclude` flag:** Add CLI parsing for `--exclude <glob>` (multi-value), implement gitignore-style glob → regex converter, filter file-discovery output, add `tests/fixtures/doc-links/exclude/` fixture tree, write test cases (D-20). Add the validator change to `.c8rc.json` coverage tracking (already included). End state: validator clean against full repo when invoked with the planned exclude list.
  - **Plan 57-03 (Wave 3) — CI integration + branch protection + living docs:** Edit `.github/workflows/test.yml` (drift step into test job + new `docs-integrity` job), update branch protection via `gh api` PATCH (or document for ship-time), update CLAUDE.md/README.md/DEVOPS-HANDOFF.md, run `check-doc-drift.cjs` post-update for cleanliness, update PROJECT.md and STATE.md, prepare PR.
- **D-22:** Coverage gates: `scripts/validate-doc-links.cjs` already in `.c8rc.json`. Per-module ≥ 80%, overall project ≥ 90% line / ≥ 83% branch — same as Phases 55 and 56. The new `--exclude` flag must come with new tests bringing the file's coverage up before Wave 2 closes.

### Claude's Discretion

- Whether to wrap REQUIREMENTS.md line 14 example in inline backticks vs add to `--exclude` (D-08 leaves to planner judgment; both achieve clean validator output).
- Exact regex used for the gitignore-glob converter — Phase 55's hand-rolled style applies.
- Whether the drift step uses `working-directory: .` or relies on default — convention check at execution.
- Step naming in `test.yml` (e.g., `Run drift detector` vs `Validate documentation drift`) — match existing step naming style.
- Branch-protection update timing: in-PR (riskier, gh CLI from CI) vs post-merge operator step (recommended; documented in SUMMARY).
- Whether to also stub-create `pt-BR/`, `ja-JP/`, `zh-CN/` README.md placeholders or remove the i18n links from `docs/README.md` — case-by-case judgment during D-04 (probably remove since they don't exist).

### Folded Todos

`tasks/todo.md` line 17 (`Backfill cross-refs to relocated docs`) maps directly to DOCREF-01/02 work. No new folded items beyond the requirements already in scope. The pending todo can be checked off as part of Wave 1 of execution.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements (authoritative scope)
- `.planning/ROADMAP.md` §"Phase 57: Backfill and CI Integration" — Goal, depends-on, requirements (DOCREF-01/02, DOCCI-01/02/03), four success criteria.
- `.planning/REQUIREMENTS.md` §"Cross-Reference Backfill" + §"CI Integration" — DOCREF-01/02 and DOCCI-01/02/03 verbatim.
- `.planning/PROJECT.md` — Vision, zero-dep constraint, current milestone (v2.8 Documentation Integrity), historical context for relocated docs.
- `.planning/STATE.md` — Current execution state (Phases 55-56 merged, Phase 57 only remaining v2.8 work).

### Sibling phases (validator scripts, test pattern, plan shape)
- `.planning/phases/55-internal-link-validator/55-RESEARCH.md` — Original sibling-phase research.
- `.planning/phases/55-internal-link-validator/55-{01,02,03}-PLAN.md` — Three-wave TDD structure exemplar.
- `.planning/phases/55-internal-link-validator/55-{01,02,03}-SUMMARY.md` — Wave summaries; mirror format.
- `.planning/phases/55-internal-link-validator/55-VERIFICATION.md` + `55-VALIDATION.md` — Verification rigor and Nyquist gap-fill conventions.
- `.planning/phases/56-doc-drift-detector/56-CONTEXT.md` — Sibling-phase decisions; the drift-detector design choices feed directly into how Phase 57 wires the script in CI.
- `.planning/phases/56-doc-drift-detector/56-{01,02,03}-PLAN.md` + `SUMMARY.md` — Same three-wave shape Phase 57 follows.
- `.planning/phases/56-doc-drift-detector/56-VERIFICATION.md` — Drift detector verification approach reference.

### Validator scripts (concrete patterns)
- `scripts/validate-doc-links.cjs` — The script being extended with `--exclude`. Reuse the `parseArgs` pattern, the file-discovery split (`git ls-files` primary / `walkDir` fallback), the `LINK_RE` regex, the table format. Read in full before adding `--exclude`.
- `scripts/check-doc-drift.cjs` — Sibling validator wired into CI in this phase. Read for understanding exit codes (0/1/2), the `--coverage-stale-secs` handling, and how it spawns its own `node --test` invocation.
- `tests/validate-doc-links.test.cjs` — Existing test file; new `--exclude` tests extend this or live in a sibling file.
- `tests/fixtures/doc-links/{clean,broken,edge}/` — Existing fixture trees. New `tests/fixtures/doc-links/exclude/` for `--exclude` flag tests.
- `tests/check-doc-drift.test.cjs` + `tests/fixtures/doc-drift/` — Reference for the drift detector's CI behavior; do not modify in Phase 57.

### CI infrastructure
- `.github/workflows/test.yml` — The file being modified. Read in full before editing. Existing structure: `test` job (matrix: ubuntu/22, ubuntu/20, macos/22), `governance` job, workflow-level `concurrency`, `fail-fast: true`.
- `.c8rc.json` — Coverage config; already includes `scripts/validate-doc-links.cjs`. No new entries needed in Phase 57.
- `package.json` §scripts — `npm run test:coverage:full` is the step that emits `coverage/coverage-final.json` (the file the drift detector consumes).

### Codebase patterns (background)
- `.planning/codebase/STACK.md` — Zero-dep CJS, Node ≥ 20, c8 ^11.0.0 in devDependencies only.
- `.planning/codebase/CONVENTIONS.md` — CJS module structure, `'use strict'`, JSDoc, section dividers; the new `--exclude` glob converter follows these conventions.
- `.planning/codebase/TESTING.md` — Test patterns, fixture conventions, c8 config.

### Living docs (targets of Wave 3 sync)
- `CLAUDE.md` — Tests and Coverage section, deployed agents table, advanced capabilities; mention new CI gates and `--exclude` flag.
- `README.md` — Public-facing project description; update CI status section, command/agent counts (run `check-doc-drift.cjs` after to verify).
- `docs/DEVOPS-HANDOFF.md` — DevOps delivery doc; update environment requirements, CI configuration reference, branch-protection check list.

### GitHub remote security (informational, not modified)
- Branch protection requires PR + 4 passing checks; Phase 57 raises this to 5 by adding `docs-integrity`. Operator action documented in `57-SUMMARY.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`scripts/validate-doc-links.cjs`** — The script being extended. The existing `parseArgs(argv)` function handles `--root`, `--json`, `--help`. Adding `--exclude` mirrors this pattern: collect into an array (multi-value), pass into the file-discovery step, filter after `git ls-files` returns. `discoverMarkdownFiles(repoRoot)` is the natural integration point — wrap or extend it to accept an exclude-globs argument.
- **`scripts/check-doc-drift.cjs`** — Sibling validator. Already produces clean output (23/23 numeric claims match). Wave 3 wires it into CI without modification. Its `--coverage-stale-secs` flag already exists; CI invocation can pass `--coverage-stale-secs 0` if needed (default 3600 should be fine because drift runs immediately after coverage step).
- **`tests/validate-doc-links.test.cjs`** — Existing test file with describe-block structure: pure functions, integration via `spawnSync`, JSON shape. New `--exclude` cases follow the same blocks.
- **`.github/workflows/test.yml`** — Existing workflow structure to extend, not rewrite. The new `docs-integrity` job is a small block; the drift step is a small addition inside the `test` job.

### Established Patterns
- **Hand-rolled gitignore globs**: Phase 57 implements its own `gitignoreGlobToRegex(pattern)` rather than pulling in a dependency. Zero-dep constraint enforces this.
- **Multi-value CLI flags**: Phase 55's existing `parseArgs` uses single-value flags. The new `--exclude` is the first multi-value flag; the pattern is `if (a === '--exclude') { excludes.push(argv[++i]); }`.
- **Step-level conditional matrix gating in GitHub Actions**: existing pattern at lines 54-66 (Generate coverage report, Upload coverage artifact) uses `if: matrix.full_suite && matrix.node-version == 22`. Drift step reuses this exact form.
- **Job-level parallel execution**: `governance` job runs in parallel with `test`; `docs-integrity` follows the same pattern (no `needs:` dependency, separate `runs-on:`).
- **Exit code semantics**: 0=clean, 1=issues, 2=runtime error. Both validators follow this. CI step `if: failure()` would catch all non-zero exits; we use the default behavior (any non-zero fails the step).
- **Branch protection updated via `gh api ... -X PATCH`**: Project convention from prior milestones. Operator-invoked, not workflow-invoked.

### Integration Points
- **`scripts/validate-doc-links.cjs`** ← extended with `--exclude` flag in Wave 2.
- **`.github/workflows/test.yml`** ← extended in Wave 3: drift step inside `test` job, new `docs-integrity` job.
- **`.c8rc.json`** — already includes `scripts/validate-doc-links.cjs`; the `--exclude` flag changes don't require config updates.
- **`tests/validate-doc-links.test.cjs`** ← extended in Wave 2 with `--exclude` test cases.
- **`tests/fixtures/doc-links/exclude/`** ← new fixture tree in Wave 2.
- **GitHub branch protection** ← extended at ship time via `gh api` PATCH; documented in `57-SUMMARY.md` (not workflow-driven).
- **`CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md`** ← updated in Wave 3; Wave 3 closes by running `check-doc-drift.cjs` to confirm zero new drift.
- **`.planning/PROJECT.md`** ← v2.8 milestone marked complete after PR merges.
- **`.planning/STATE.md`** ← updated to v2.9 (or whatever's next) at milestone close.
- **`tasks/todo.md`** line 17 — the existing pending todo about backfill cross-refs is checked off in Wave 1.

</code_context>

<specifics>
## Specific Ideas

- **Comprehensive backfill is a one-time investment** — the alternative (ratchet warnings, defer cleanup) carries doc debt into v2.9 and erodes the value of the gate. Pete chose strict-block from day 1; that decision pulls the comprehensive backfill choice with it. The two are paired commitments.

- **The 83 archived ROADMAP cross-refs are a pure mechanical fix** — `sed -i '' 's|(milestones/v|(v|g; s|]: milestones/v|]: v|g' .planning/milestones/v*-ROADMAP.md` (macOS BSD sed). Reviewer should confirm the diff is purely path-prefix removal across the listed files, no semantic content changes.

- **DOCREF-01/02 closure pattern**: rather than relocating files or rewriting descriptive text, mark complete with validator output as evidence. The 57-SUMMARY.md should embed `node scripts/validate-doc-links.cjs --json | jq '.broken[] | select(.ref | contains("full-audit") or contains("STRUCTURE.md"))'` returning empty as proof. This pattern (close requirements via measurement, not busy-work) generalizes to future "no broken X" requirements.

- **`--exclude` glob-conversion hand-roll** is simple: `**` → `.*`, `*` → `[^/]*`, escape literal `.` and other regex meta-chars, anchor with `^` and `$`. Phase 55's hand-rolled style applies. Test cases in D-20 cover the semantics.

- **Drift step single-leg gating saves CI minutes** — running drift in 3 matrix combos × every PR is wasteful. Single-leg (ubuntu/22, full_suite=true) is sufficient because drift output is platform-independent and the per-leg test job already varies on the actually-platform-dependent dimensions (Node version, OS).

- **Branch-protection PATCH timing**: doing it at ship time (operator-invoked, post-merge) is safer than baking it into the workflow. Reasons: workflow-invoked PATCH requires a PAT with admin scope in CI secrets (security exposure); operator-invoked PATCH is auditable in the operator's terminal history; the workflow PR can pass without the PATCH (it just won't be enforced) which is fine because the strict-blocking semantics kick in on the *next* PR after the PATCH lands.

- **i18n README placeholders in `docs/README.md`** — the three i18n links (pt-BR, ja-JP, zh-CN README.md) point to translations that don't exist. Removing them is the lowest-risk fix; if translations are planned, they belong in a separate i18n phase, not Phase 57.

- **The test fixtures (`tests/fixtures/doc-links/{broken,edge}/`) MUST stay broken** — they're the test surface for the validator's broken-detection logic. Excluding them in CI is correct. A future enhancement could move them to a path the validator never scans by default (e.g., `tests/fixtures/doc-links-fixtures/` outside the standard `tests/fixtures/doc-links/`), but that's churn for marginal gain.

</specifics>

<deferred>
## Deferred Ideas

Captured here so they're not lost, but explicitly out of scope for Phase 57.

- **`.docslinkignore` repo-local config** — list of exclude globs at repo root. Out of v2.8 scope; the CI-step exclude list is the single source of truth for now. Add if multiple call sites need DRY (operator local runs, sync-docs, etc.).
- **Hardcoded `DEFAULT_EXCLUDES`** inside the validator — adds policy to a generic tool. Rejected. If repo-local needs emerge, `.docslinkignore` is the better path.
- **Negation patterns (`!path/**`) in `--exclude`** — gitignore supports re-inclusion via `!`. Not needed for the current 4-pattern use case. Add if future needs surface.
- **Markdown style linting / spell check / grammar** — already deferred in REQUIREMENTS.md; restated here for completeness.
- **Cross-doc consistency beyond numeric (DOCLIVE-01)** — already deferred in REQUIREMENTS.md.
- **Codebase-map staleness (DOCMAP-01)** — already deferred.
- **External link validator (DOCEXT-01)** — already deferred.
- **Ratchet mode (continue-on-error first, blocking after)** — explicitly rejected in D-16. Comprehensive backfill makes ratchet unnecessary.
- **Drift detector running on full matrix** — explicitly rejected in D-10 (single-leg gating).
- **Workflow-invoked branch-protection PATCH** — rejected in D-13 / specifics. Operator-invoked is safer.
- **Test fixtures moved to non-default-scanned path** — minor cleanup; not blocking. Future ergonomic improvement.
- **Stub-create pt-BR/, ja-JP/, zh-CN/ README.md** — out of scope; if translations are planned, separate phase.
- **Auto-PR for drift fixes** — already deferred (`/gsd:sync-docs` covers the operator path).
- **README badge for docs-integrity status** — nice-to-have; can add post-ship if desired.

</deferred>

---

*Phase: 57-backfill-and-ci-integration*
*Context gathered: 2026-05-08*
