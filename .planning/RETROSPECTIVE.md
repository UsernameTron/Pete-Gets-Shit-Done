# Retrospective

## v1.1 Testing & Hardening (2026-03-26)

### What Was Built

- **Coverage infrastructure**: c8 instrumentation expanded from 17 lib modules to 25 source files across lib, hooks, gsd-tools, bin/install.js, and scripts. Gap analysis with 3-tier priority ranking (security > operational > utility).
- **76 new unit tests**: Governance scripts (scaffold, health-check, install-plugins), plugin integration (loading, routing, skill resolution), hook behavior (lifecycle events, matchers, exit codes), and uncovered command handlers (cmdCommitToSubrepo).
- **39 integration tests**: End-to-end CLI flow (command chain + state progression), governance hook enforcement (advisory output + template wiring), plugin ecosystem coherence (cross-plugin uniqueness + reference integrity).
- **CI hardening**: base64-scan.sh timeout fix with size cap, coverage reporting via ci-coverage-report.sh (advisory 80% threshold), cross-platform matrix (Linux/macOS/Windows, Node 18+20+22).

### What Worked Well

- **Wave-based parallel execution**: Plans within each phase executed in parallel waves, keeping total execution time short despite 11 plans.
- **Worktree isolation**: Each subagent worked in its own git worktree, preventing conflicts during parallel execution.
- **UAT-first verification**: `/gsd:verify-work` caught issues (like REQUIREMENTS.md checkbox inconsistencies) before shipping.
- **Single-day delivery**: All 4 phases planned and executed in a single session day (2026-03-26), demonstrating the GSD pipeline's throughput.
- **CI-first debugging**: When CI failed (prompt-injection-scan flagging test fixtures), the fix was surgical -- allowlist the test file, not disable the scanner.

### What Was Inefficient

- **REQUIREMENTS.md checkbox drift**: Worktree-based execution updated tests but didn't update REQUIREMENTS.md checkboxes. Had to fix 7 checkboxes manually before archival. Fix: ensure verify-work updates requirement status as part of its pass.
- **SUMMARY.md files created in worktrees**: Phase 3 and 5 SUMMARY.md files were created in worktrees that got cleaned up. Not blocking but left documentation gaps.
- **Context window pressure**: Milestone completion workflow spans many steps; had to continue across context windows. The workflow could benefit from more CLI automation (gsd-tools handled archival well).

### Patterns Established

- **Security scan allowlist pattern**: Test files containing literal injection/secret patterns are allowlisted by filename in the scanner scripts, not by disabling scans.
- **Windows compatibility pattern**: Tests that override `HOME` must also set `USERPROFILE` for Node.js `os.homedir()` on Windows.
- **Advisory coverage thresholds**: 80% coverage threshold warns but never fails the build -- enforcement deferred until coverage is consistently above threshold.
- **Coverage report single-runner**: Coverage reports run on one matrix combination (Linux Node 22) to avoid duplicate uploads.

### Key Metrics

| Metric | Before v1.1 | After v1.1 |
|--------|-------------|------------|
| Total tests | 1,547 | 1,662 |
| New tests added | -- | 115 (76 unit + 39 integration) |
| Source files instrumented | 17 | 25 |
| Line coverage | ~65% | 85%+ |
| Branch coverage | ~55% | 77%+ |
| CI platforms | Linux only | Linux + macOS + Windows |
| Plans executed | 3 (v1.0) | 11 (v1.1) |

---
*Last updated: 2026-03-26*
