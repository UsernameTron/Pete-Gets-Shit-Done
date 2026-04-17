# Retrospective

## v2.5 Final Documentation Sync (2026-04-17)

### What Was Built

- **Agent hygiene**: 10 agents upgraded with explicit frontmatter (model, permissionMode, maxTurns, isolation) following validator-hub gold standard pattern.
- **New capability**: `gsd-dependency-auditor` agent and `/gsd:audit-deps` command for package security auditing across 6 ecosystems.
- **CI/CD pipeline**: GitHub Actions workflow for Node 20+22 on Ubuntu and macOS, with 5 rounds of CI fixes (SHA pins, EXDEV fallbacks, matrix trimming).
- **Documentation alignment**: All 5 living documents (README, CLAUDE.md, DEVOPS-HANDOFF, PROJECT.md, CHANGELOG) aligned to verified counts. Project enters maintenance mode.

### What Worked Well

- **UAT caught real issues**: 4 of 6 tests found stale counts that automated verification missed. The conversational UAT format made it easy to spot-check documents against reality.
- **Inline fix during UAT**: Fixing issues as they were found (rather than batching into gap closure plans) was efficient for docs-only work.

### What Was Inefficient

- **Phase 48-01 executor checked wrong README**: The executor verified the inner repo's README (Petes-Get-Shit-Done-Coding-Automation/) but missed the outer repo's README.md which had stale counts. Root cause: two-repo structure created ambiguity about which files to check.
- **CHANGELOG.md assumed new file**: Plan 48-03 assumed CHANGELOG.md needed creation, but it already existed with extensive history. Executor adapted correctly but the plan was inaccurate.

### Patterns Established

- **Inner repo archival**: Petes-Get-Shit-Done-Coding-Automation is archived and being removed. Future work should reference only the outer Pete-Gets-Shit-Done repo.
- **Maintenance mode closure**: When all requirements are satisfied, replace active requirements with a maintenance mode notice rather than leaving an empty section.

### Key Metrics

| Metric | Before v2.5 | After v2.5 |
|--------|-------------|------------|
| Agents | 18 (incorrect) | 17 (verified) |
| Test suites | 479 | 479 (no regression) |
| Coverage | 90.79% | 90.79% (maintained) |
| Milestones shipped | 14 | 15 |
| Total phases | 47 | 48 |

---

## v2.1 System Audit & Debt Closure (2026-04-10)

### What Was Built

- **Debt closure**: Backfilled 3 missing SUMMARY.md files for Phase 6, replaced deprecated agent references in global CLAUDE.md files, created Nyquist VALIDATION.md for v1.2 milestone.
- **Confirmation audit**: Verified all 15 GSD agents have tier labels matching tool grants (DEBT-01/INT-01) and gsd-validator-hub is reachable via ship workflow (DEBT-04/INT-02).
- **System component audit**: 4-dimension validation of 15 agents (YAML, tiers, quality sections, stale refs), 61 command routing reachability check, 16 hook configuration validation.
- **Coverage verification**: Closed gaps in 6 library modules and install.js, achieving 90.41% overall with all modules >= 80% and security at 100%.
- **Documentation accuracy**: Updated CLAUDE.md, README.md, DEVOPS-HANDOFF.md with current metrics and removed all stale references.

### What Worked Well

- **Rapid execution**: All 5 phases planned and executed in a single day (2026-04-09), with 8 plans across 10 requirements.
- **Audit-as-verification**: The audit phases double as both verification and documentation — the audit reports themselves become the evidence trail.
- **GSD pipeline maturity**: discuss -> plan -> execute -> verify cycle is now reliable enough for an entire audit milestone to run smoothly.

### What Was Inefficient

- **Phase 37/38 artifact gaps**: Phase 37 was missing a phase-level VERIFICATION.md (only had PLAN-VERIFICATION) and Phase 38 had no phase directory at all. Both were backfilled during milestone audit. Root cause: fast execution in later phases skipped artifact creation. Fix: verify-work should enforce VERIFICATION.md creation as a gate.
- **REQUIREMENTS.md drift**: AUDIT-06 and AUDIT-07 remained unchecked/Pending despite work being complete. Similar to v1.1 checkbox drift. Fix: execute-phase should update REQUIREMENTS.md traceability table as tasks complete.

### Patterns Established

- **Audit milestone pattern**: A milestone dedicated to validating prior work is a legitimate and valuable milestone class. It catches tracking gaps, confirms cross-phase integration, and produces an evidence trail.
- **3-source cross-reference**: Checking VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability together catches gaps that any single source would miss.
- **Nyquist exemption pattern**: Audit/docs milestones with no research phases can legitimately skip Nyquist VALIDATION.md without penalty.

### Key Metrics

| Metric | Before v2.1 | After v2.1 |
|--------|-------------|------------|
| Total tests | 2377 | 2377 (no regression) |
| Overall coverage | ~90% | 90.41% (verified) |
| Agents validated | 0 (assumed correct) | 15/15 confirmed |
| Commands verified reachable | 0 (assumed correct) | 61/61 confirmed |
| Hooks validated | 0 (assumed correct) | 16/16 confirmed |
| Requirements shipped (cumulative) | 109 (v1.0-v2.0) | 119 (v1.0-v2.1) |

---

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
