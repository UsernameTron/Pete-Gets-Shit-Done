# Phase 5: CI Pipeline Hardening - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

CI pipeline is reliable across platforms with coverage reporting and no timeout failures. This phase modifies CI configuration files (`.github/workflows/`) and shell scripts (`scripts/base64-scan.sh`) only — no application code changes.

**Distinction from prior phases:** Phases 2–4 expanded test coverage and validated component integration. Phase 5 ensures the CI pipeline reliably runs those tests, reports coverage, and works cross-platform without failures.

</domain>

<decisions>
## Implementation Decisions

### CI-01: base64-scan.sh Timeout Fix (Size Cap + Total Timeout)
- **D-01:** Add a per-file size cap: skip files larger than 1MB. `package-lock.json` and similar large text files are the likely timeout cause via the line-by-line `while IFS= read -r line` processing loop.
- **D-02:** Add a total scan timeout: 3 minutes max, then exit 0 with a warning message. This prevents CI hangs regardless of the root cause.
- **D-03:** Do NOT add per-file timeout — that's overengineered. Size cap + total timeout is sufficient.
- **D-04:** The existing `should_skip_file()` binary extension filtering and `collect_files()` grep-based filtering remain unchanged — they already work correctly.

### CI-02: Coverage Reporting (Job Summary + Artifact)
- **D-05:** Use GitHub Actions job summary with an inline markdown table showing per-module line/branch coverage. No external services (Codecov, Coveralls, badges). Self-contained.
- **D-06:** Upload the lcov report as a workflow artifact for manual drill-down when needed.
- **D-07:** Use the existing `test:coverage:full` script (c8 with text+lcov+json reporters, created in Phase 2) as the CI coverage command.

### CI-03: Cross-Platform CI Scope
- **D-08:** Linux runs everything: Node.js tests + governance shell tests + security scans.
- **D-09:** macOS runs Node.js tests only. No governance or security shell scripts.
- **D-10:** Windows runs Node.js tests only. No governance or security shell scripts.
- **D-11:** Do NOT attempt to make governance shell scripts or `base64-scan.sh` work on Windows. Shell-based checks are Linux-only.

### CI-04: Coverage Threshold (Advisory Only)
- **D-12:** Advisory, not a hard gate. If overall coverage drops below 80%, CI reports a warning in the job summary but does NOT fail the build. Current coverage is 85.12%, so 80% gives 5 points of buffer.
- **D-13:** No per-module enforcement — deferred to a future milestone. Hard gating on coverage creates perverse incentives.

### Claude's Discretion
- How to implement the 3-minute total timeout in `base64-scan.sh` (SIGALRM, background timer, `timeout` wrapper, etc.)
- Coverage table formatting in the GitHub Actions job summary (which columns, how to parse c8 JSON output)
- Whether to create a dedicated coverage reporting script or inline it in the workflow YAML
- How to structure the workflow matrix to cleanly separate "tests only" from "tests + governance + security" runs

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CI Workflows
- `.github/workflows/test.yml` — Current CI test workflow with cross-platform matrix (ubuntu node 20/22/24, macOS node 22, Windows node 22)
- `.github/workflows/security-scan.yml` — Security scanning on PRs (prompt-injection-scan, base64-scan, secret-scan, planning directory check)

### Scripts Under Modification
- `scripts/base64-scan.sh` (283 lines) — Base64 obfuscation scanner. Key functions: `should_skip_file()`, `collect_files()`, `scan_file()`, `scan_files()`. Line-by-line processing via `while IFS= read -r line`.

### Coverage Infrastructure
- `package.json` — `test:coverage:full` script: c8 with text+lcov+json reporters, includes all source paths
- `package.json` — `test:coverage` script: c8 with text+json reporters (development use)

### Requirements
- `.planning/REQUIREMENTS.md` — CI-01, CI-02, CI-03 definitions
- `.planning/ROADMAP.md` §Phase 5 — Success criteria (3 items)

### Prior Phase Context
- `.planning/phases/02-coverage-audit/02-CONTEXT.md` — D-01 expanded c8 scope, `test:coverage:full` with lcov created for CI use
- `.planning/phases/04-integration-test-suite/04-CONTEXT.md` — Integration test patterns, zero-dependency constraint

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`test:coverage:full`** already outputs lcov — ready for CI artifact upload with no changes
- **`should_skip_file()`** in base64-scan.sh already handles 20+ binary extensions — the size cap adds a new dimension without replacing existing logic
- **GitHub Actions `$GITHUB_STEP_SUMMARY`** — native mechanism for job summary markdown output
- **`actions/upload-artifact`** — standard action for lcov artifact upload

### Established Patterns
- CI matrix uses `shell: bash` across all platforms (Git Bash on Windows)
- Security scan workflow runs on `pull_request` events only
- Governance tests run in a separate job on ubuntu-only
- c8 JSON reporter outputs structured coverage data parseable for summary generation

### Integration Points
- `test.yml` matrix needs restructuring: Linux runs full suite, macOS/Windows run tests only
- `security-scan.yml` already ubuntu-only — no changes needed for cross-platform
- Coverage summary generation needs c8 JSON output parsed into markdown table
- base64-scan.sh modifications must preserve exit 0 (advisory) behavior and `--diff` mode

</code_context>

<specifics>
## Specific Ideas

No specific implementation requests beyond the decisions above. Key constraints: zero-dependency CommonJS, no external CI services, advisory-only coverage threshold, shell-based checks Linux-only.

</specifics>

<deferred>
## Deferred Ideas

- Per-module coverage enforcement (hard gates per module) — deferred to future milestone
- Coverage badges or external reporting services — not needed for this repo
- Windows compatibility for governance shell scripts — zero value, rabbit hole

</deferred>

---

*Phase: 05-ci-pipeline-hardening*
*Context gathered: 2026-03-26*
