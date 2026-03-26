# Phase 2: Coverage Audit - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Measure current test coverage across all modules, identify untested code paths with priority ranking, and document a baseline before any new tests are written. This phase produces reports and analysis only — no new tests are written here.

</domain>

<decisions>
## Implementation Decisions

### Coverage Scope
- **D-01:** Expand c8 instrumentation to ALL JavaScript/CJS files in the project — not just `get-shit-done/bin/lib/*.cjs`. Include: `hooks/*.js` (source only, exclude `hooks/dist/`), `scripts/*.cjs`, `commands/`, `plugins/` JS files.
- **D-02:** Shell scripts (`governance/scripts/*.sh`, `scripts/*.sh`) get a manual inventory with binary tested/untested status. No fake line-coverage numbers for bash — just catalog which scripts have corresponding test files in `governance/tests/`.
- **D-03:** `hooks/dist/` is excluded from coverage. These are compiled copies of `hooks/*.js` source files — instrumenting both would double-count.

### Claude's Discretion
- Report format and reporters (text, lcov, html) — choose what best serves COV-01's "per-module report" requirement
- Gap analysis document structure and priority tier definitions — align with COV-02's "security-critical > operational > utility" ranking
- Baseline document format and location — make it diff-friendly for Phase 3 comparison per COV-03
- c8 threshold configuration — current 70% lines threshold may be adjusted based on findings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Configuration
- `package.json` — Contains existing `test:coverage` script and c8 devDependency configuration
- `scripts/run-tests.cjs` — Test runner that c8 wraps; uses Node built-in `--test`

### Requirements
- `.planning/REQUIREMENTS.md` — COV-01, COV-02, COV-03 definitions
- `.planning/ROADMAP.md` §Phase 2 — Success criteria (3 items)

### Existing Test Infrastructure
- `tests/*.test.cjs` — 50 test files covering lib modules
- `governance/tests/*.sh` — 5 shell test scripts for governance

### CI Pipeline
- `.github/workflows/test.yml` — CI test workflow
- `.github/workflows/security-scan.yml` — Security scanning (references base64-scan.sh)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **c8** already installed as devDependency — no new tooling needed
- `test:coverage` script provides working baseline to expand from
- `scripts/run-tests.cjs` cross-platform runner can serve as c8 entry point

### Established Patterns
- All tests use Node built-in `node --test` (no Jest/Mocha)
- Tests are flat in `tests/` directory, 1:1 naming with source modules
- Governance tests are separate shell scripts in `governance/tests/`
- Zero-dependency constraint means no adding Istanbul, Jest, or other coverage tools beyond c8

### Integration Points
- c8 `--include` flag needs expansion to cover new directories
- CI workflow (`test.yml`) will need coverage reporting added (Phase 5, not this phase)
- Gap analysis feeds directly into Phase 3 (Unit Test Expansion) priorities

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint: the project is zero-dependency CommonJS, so c8 (already a devDependency) is the right tool. No new coverage tools.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-coverage-audit*
*Context gathered: 2026-03-26*
