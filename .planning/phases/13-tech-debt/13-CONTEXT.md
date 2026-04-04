# Phase 13 Context — Tech Debt Cleanup

## DEBT-01: Fix 5 Agent Tier Label Mismatches

The CREW-ASSESSMENT.md table (Priority 6 section, lines 86-89) lists tier assignments that
do not match the actual `# Tier:` comments in the agent frontmatter. The agent files are
authoritative (they reflect the actual tool grants); the CREW-ASSESSMENT table is stale.

| Agent | CREW-ASSESSMENT Says | Agent File Says | Actual Tools | Correct Tier |
|-------|---------------------|-----------------|-------------|-------------|
| gsd-codebase-mapper | Explore | Modify | Read, Write, Edit, Bash, Glob, Grep | **Modify** |
| gsd-ui-auditor | Explore | Modify | Read, Write, Edit, Bash, Glob, Grep | **Modify** |
| gsd-research-synthesizer | Research | Modify | Read, Write, Edit, Bash, Glob, Grep | **Modify** |
| gsd-ui-checker | Modify | Explore | Read, Bash, Glob, Grep | **Explore** |
| gsd-validator-hub | Modify | Explore | Read, Bash, Glob, Grep (disallowed: Write, Edit) | **Explore** |

**Fix:** Update the tier assignment table in CREW-ASSESSMENT.md lines 86-89 to match the
agent files. The table should read:

- **Explore**: gsd-assumptions-analyzer, gsd-user-profiler, gsd-ui-checker, gsd-validator-hub
- **Research**: gsd-advisor-researcher, gsd-research-orchestrator, gsd-ui-researcher
- **Modify**: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-verifier

## DEBT-02: Remove 5 Absorbed Agent Entries from MODEL_PROFILES

File: `get-shit-done/bin/lib/model-profiles.cjs`, lines 9-25.

These 5 agents were absorbed during Phase 6 consolidation and no longer exist as standalone
agents. Their entries in MODEL_PROFILES are dead references:

| Line | Entry | Absorbed Into |
|------|-------|--------------|
| 13 | `'gsd-phase-researcher'` | gsd-research-orchestrator |
| 14 | `'gsd-project-researcher'` | gsd-research-orchestrator |
| 19 | `'gsd-plan-checker'` | gsd-verifier |
| 20 | `'gsd-integration-checker'` | gsd-verifier |
| 21 | `'gsd-nyquist-auditor'` | gsd-verifier |

**Fix:** Delete these 5 lines. Optionally add entries for the replacement agents
(gsd-research-orchestrator, gsd-validator-hub) and any other active agents not currently
in the map (gsd-ui-researcher, gsd-ui-checker, gsd-ui-auditor, gsd-assumptions-analyzer,
gsd-user-profiler, gsd-advisor-researcher, gsd-research-synthesizer). The primary
requirement is removing dead entries; adding missing ones is bonus.

## DEBT-03: Raise security.cjs Branch Coverage to 95%+

File: `get-shit-done/bin/lib/security.cjs`
Test file: `tests/security.test.cjs`

Current: 92.68% branch coverage (6 uncovered branches), 99.49% statement coverage.
Target: >= 95% branch coverage.

The 6 uncovered branches (from lcov BRDA data):

| Line | Function | Uncovered Branch | Test Needed |
|------|----------|-----------------|-------------|
| 38 | `validatePath` | `typeof baseDir !== 'string'` (non-string but truthy baseDir) | Pass `baseDir = 123` (non-string truthy value) — note: existing tests cover `''`, `null`, but not numeric |
| 101 | `requireSafePath` | `label` is falsy (uses `'Path'` default) | Call `requireSafePath('../../x', base)` without label arg or with `undefined` label |
| 230 | `sanitizeForDisplay` | Falsy/non-string input guard | Call `sanitizeForDisplay(null)`, `sanitizeForDisplay(undefined)`, `sanitizeForDisplay('')` |
| 259 | `validateShellArg` | `typeof value !== 'string'` branch (non-string truthy) | Pass `value = 42` (number — truthy but not string) |
| 264 | `validateShellArg` | null byte in value | Call `validateShellArg('test\0bad', 'arg')` |
| 269 | `validateShellArg` | `$` present but no `$(` or backtick pattern (second regex test) | This is the false branch of the `&&` — value has `$` or backtick but NOT in substitution context. Already covered by "allows dollar signs not in substitution context" test, so this may be a v8 coverage quirk. Add explicit test for backtick-without-substitution: `validateShellArg('file`name', 'test')` |

Writing 4-5 new test cases should cover all 6 branches and push branch coverage above 95%.

## DEBT-04: Wire gsd-validator-hub into a Workflow Entry Point

The `gsd-validator-hub` agent exists and is fully defined but is not invoked by any GSD
workflow command. It was created during Phase 6 consolidation but the wiring step was missed.

**Best candidate entry point:** `/gsd:validate-phase` command (`commands/gsd/validate-phase.md`).

This command already handles phase validation (Nyquist audits). Adding a gsd-validator-hub
invocation with `target: ecosystem` as an optional post-validation step would give the
validator hub a natural home in the workflow. The validator hub runs read-only, so it cannot
break anything.

**Alternative:** Wire into `/gsd:finalize` as a Gate 2.5 (agent ecosystem health check)
between build verification and milestone archival. This is appropriate because finalization
is the last quality gate before a milestone ships.

**Recommended approach:** Wire into `/gsd:ship` as a pre-PR validation step. The ship
command creates PRs, making it the natural place to run a final quality gate. Add a step
that spawns gsd-validator-hub with `target: ecosystem` before creating the PR.

## DEBT-05: Add VALIDATION.md Files for v1.3 Phases 7-10

None of the v1.3 phases have VALIDATION.md files. The Nyquist validation process was
introduced during v1.3 but the process gap means earlier v1.3 phases shipped without
retroactive validation records.

Phases requiring VALIDATION.md:

| Phase | Directory | Plan File | Summary |
|-------|-----------|-----------|---------|
| 7 | `07-security-critical-fixes/` | 07-01-PLAN.md | Crypto temp paths + path containment (SEC-01, SEC-02) |
| 8 | `08-shell-output-hardening/` | 08-01-PLAN.md | Shell metachar rejection + truncation sentinel (SEC-03, SEC-04) |
| 9 | `09-test-coverage-expansion/` | 09-01-PLAN.md | Branch coverage 77% to 85%+ (SEC-05) |
| 10 | `10-config-migration/` | 10-01-PLAN.md | Config version tracking + migration pipeline (SEC-06) |

Each VALIDATION.md should be reconstructed from the existing PLAN.md and SUMMARY.md
artifacts in the phase directory. The validate-phase workflow (State B) handles this:
read the plan's acceptance criteria, read the summary's execution results, and produce
a validation record confirming the criteria were met.
