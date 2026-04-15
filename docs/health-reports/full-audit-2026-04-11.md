# GSD Full Codebase Health Audit

**Date:** 2026-04-11
**Scope:** 12-dimension read-only audit of get-shit-done-cc v1.30.0
**Branch:** feat/gsd-stack-analyzer (clean after stash)
**Agents used:** 12 (8 haiku Wave 1, 4 sonnet Wave 2, opus synthesis Wave 3)
**Runtime:** ~18 minutes across 2 parallel waves
**Methodology:** Checklist-based per dimension + adversarial unknown-unknowns pass

---

## Executive Summary

| # | Dimension | Grade | Critical | High | Medium | Low |
|---|-----------|-------|----------|------|--------|-----|
| 1 | Structural Integrity | B | 0 | 2 | 2 | 4 |
| 2 | Agent Ecosystem | A- | 0 | 1 | 1 | 0 |
| 3 | Hooks | B- | 0 | 2 | 2 | 2 |
| 4 | Skills | B+ | 0 | 1 | 1 | 3 |
| 5 | Commands / Slash Commands | B | 0 | 0 | 2 | 2 |
| 6 | Tests | A- | 0 | 0 | 0 | 1 |
| 7 | Documentation | B- | 0 | 4 | 2 | 0 |
| 8 | 5-Phase Lifecycle | C+ | 0 | 4 | 4 | 4 |
| 9 | Security / Governance | B- | 0 | 2 | 2 | 2 |
| 10 | Dependencies & Build | A | 0 | 0 | 1 | 0 |
| 11 | Unknown Unknowns | C | 0 | 4 | 6 | 2 |
| 12 | Extraction Staging | B- | 0 | 2 | 3 | 1 |
| | **TOTALS** | **B-** | **0** | **22** | **26** | **21** |

**Overall Health Grade: B-**

No critical (must-block-release) findings. 22 high-severity findings concentrated in lifecycle state machine (4), documentation drift (4), and architectural unknowns (4). The codebase is structurally sound with strong test coverage (90.41%, 2388/2389 passing) and zero runtime dependencies. Primary weaknesses are in soft phase gates, documentation staleness, and the growing complexity of core.cjs and install.js.

---

## Critical Findings (Must-Fix Before Next Release)

None. No blocking defects found.

---

## High Findings (Should-Fix This Sprint)

### H-01: `@file:` Protocol in --pick Flag Enables Arbitrary File Read
**Dimension:** 11 (Unknown Unknowns)
**File:** `get-shit-done/bin/gsd-tools.cjs:303-305`
**Description:** When `--pick` intercepts output starting with `@file:`, it calls `fs.readFileSync` on the path without containment validation. A crafted STATE.md value could read arbitrary files.
**Fix:** Add `validatePath()` call before `readFileSync`. ~5 lines.
**Confidence note:** High confidence — verified by code read, not external validator.

### H-02: Phase Skip Enforcement Is Advisory, Not Hard-Gated
**Dimension:** 8 (Lifecycle)
**File:** `get-shit-done/workflows/plan-phase.md:193-233`, `execute-phase.md:68-72`
**Description:** Users can skip discuss-phase entirely (plan-phase offers "Continue without context"). Execute-phase only checks for PLAN.md existence, not CONTEXT.md. The 5-phase contract is not machine-enforced.
**Fix:** Add `CONTEXT.md exists` check in plan-phase with hard error (not menu), or document skip-discuss as a supported workflow.

### H-03: ship.md Allows Shipping Unverified Work Via Confirmation Prompt
**Dimension:** 8 (Lifecycle)
**File:** `get-shit-done/workflows/ship.md:32-37`
**Description:** Missing or failed VERIFICATION.md triggers a confirmation prompt, not a hard error. Users can ship code with `gaps_found` status by answering "yes."
**Fix:** Make `VERIFICATION.md status != passed|human_needed` a hard block. Remove confirmation bypass.

### H-04: Mid-Execute Kill Loses Sub-Wave Progress
**Dimension:** 8 (Lifecycle)
**File:** `get-shit-done/workflows/execute-phase.md:165-193`
**Description:** No pre-agent checkpoint written to STATE.md. If a session dies mid-wave, any uncommitted agent work is lost with no signal to the operator.
**Fix:** Write `agent-started: <plan-id>` to STATE.md before launching each executor agent.

### H-05: `--no-verify` in Parallel Execution — Deferred Hook Check Can Be Skipped
**Dimension:** 8 (Lifecycle)
**File:** `get-shit-done/workflows/execute-phase.md:228-242`
**Description:** Parallel executors use `git commit --no-verify`. Post-wave hook check offers "Continue anyway?" on failure, allowing hook-failing code to persist.
**Fix:** Make post-wave hook check a hard gate. If hooks fail, block next wave.

### H-06: core.cjs Is a 60-Export God Object
**Dimension:** 11 (Unknown Unknowns)
**File:** `get-shit-done/bin/lib/core.cjs` (2000+ lines, 60 exports)
**Description:** Contains output formatting, error handling, config loading + migration, git ops, markdown normalization, phase discovery, roadmap parsing, milestone management, path resolution, lock management, workstream state, model resolution, token estimation, context budgeting, and feature flags. Every module depends on it.
**Fix:** Long-term: extract `git.cjs`, `config-io.cjs`, `markdown.cjs`. Medium-term: stop adding to it.

### H-07: install.js at 5,241 Lines — Multi-Runtime Monolith
**Dimension:** 11 (Unknown Unknowns)
**File:** `bin/install.js` — 8 supported runtimes, no abstraction
**Description:** Adding a 9th runtime requires touching 6-8 places in a 5,241-line file. Shotgun surgery pattern. No RuntimeAdapter interface.
**Fix:** Extract a `RuntimeAdapter` interface. Each runtime implements its own directory resolution, config format, and tool mapping.

### H-08: Regex YAML Parser Has Silent Corruption and Potential ReDoS
**Dimension:** 11 (Unknown Unknowns)
**File:** `get-shit-done/bin/lib/frontmatter.cjs:16-70`
**Description:** Hand-rolled regex-based YAML parser handles only the subset GSD uses. Misparses valid YAML (multi-line strings, anchors, aliases). Lazy `[\s\S]+?` quantifier is potentially catastrophic on malformed files.
**Fix:** Replace with `js-yaml` (zero-dep-compatible, ~50KB) or at minimum add safeguards against unclosed frontmatter.

### H-09: init.cjs Uses Raw execSync Bypassing safeExec Wrappers
**Dimension:** 9 / 11
**File:** `get-shit-done/bin/lib/init.cjs:1336,1355,1458`
**Description:** Uses `execSync` directly with string commands instead of the project's `safeExec`/`execGit` wrappers. Inconsistent with the security pattern used elsewhere.
**Fix:** Replace with `execGitValidated()` wrapper. ~10 minutes.

### H-10: Unvalidated File Paths in cmdSummaryExtract and cmdTodoComplete
**Dimension:** 9 (Security)
**File:** `get-shit-done/bin/lib/commands.cjs:403-415` (summary), `commands.cjs:710-738` (todo)
**Description:** `summaryPath` and `filename` parameters used directly in `path.join()` without calling `validatePath()`. Path traversal risk.
**Fix:** Add `validatePath()` calls. ~4 lines each.

### H-11: Agent Count Documentation Stale (15 claimed, 18 actual)
**Dimension:** 7 (Documentation)
**Files:** `README.md:57`, `CLAUDE.md:15`, `docs/AGENTS.md:3`
**Description:** All three documents claim 15 agents. Actually 18 active built-in agents exist. Missing: gsd-stack-analyzer, gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-validator-hub.
**Fix:** Update counts and agent lists in all three docs.

### H-12: 4 New Agents Completely Undocumented
**Dimension:** 7 (Documentation)
**Files:** `agents/gsd-stack-analyzer.md`, `agents/gsd-dependency-auditor.md`, `agents/gsd-ecosystem-auditor.md`, `agents/gsd-validator-hub.md`
**Description:** These agents exist on disk but appear in zero documentation (README, CLAUDE.md, docs/AGENTS.md).
**Fix:** Add entries to docs/AGENTS.md and update CLAUDE.md agent list.

### H-13: lesson-capture-gate.cjs Has Zero Test Coverage (585 Lines)
**Dimension:** 3 (Hooks)
**File:** `.claude/hooks/lesson-capture-gate.cjs`
**Description:** The only hook that **blocks** workflow (stops sessions). 585 lines of complex signal matching with ~20 exported helper functions. Runs in production every session close. Entirely untested.
**Fix:** Create `tests/lesson-capture-gate.test.cjs`. Target 90%+ coverage. Effort: 4-6 hours.

### H-14: 23 /gsd:* Commands Missing From /gsd:help Output
**Dimension:** 5 (Commands)
**File:** `get-shit-done/workflows/help.md` (external file referenced by `commands/gsd/help.md`)
**Description:** 36% of the command surface is invisible to users running `/gsd:help`. 23 commands have files but no help entry.
**Fix:** Update the help workflow to include all 63 commands.

### H-15: .env Pattern Missing From .gitignore
**Dimension:** 1 (Structural)
**File:** `.gitignore`
**Description:** No `.env`, `.env.local`, or `.env.*.local` patterns. Future development could accidentally commit environment secrets.
**Fix:** Add `.env` and `.env.*.local` patterns. 2 lines.

### H-16: CLAUDE.md Architecture Section Describes Wrong Paths
**Dimension:** 1 (Structural) / 7 (Documentation)
**File:** `CLAUDE.md:29-37`
**Description:** Claims `lib/` and `skills/` at root level. Actual paths: `get-shit-done/bin/lib/` and `commands/gsd/`. The documented three-layer architecture (`bin/`, `lib/`, `skills/`) does not match reality.
**Fix:** Update architecture section to show actual paths.

### H-17: RESUME-HERE.md Claims "Nothing Is Ported" — False
**Dimension:** 12 (Extraction Staging)
**File:** `.extraction-staging/RESUME-HERE.md:10`
**Description:** One-liner says "Nothing is ported" but gsd-stack-analyzer port is complete (PR #46 open).
**Fix:** Update to reflect actual port status.

### H-18: FINDINGS.md Marks Stack-Analyzer "shipped" Prematurely, Wrong PR Number
**Dimension:** 12 (Extraction Staging)
**File:** `.extraction-staging/FINDINGS.md:63`
**Description:** Labels stack-analyzer as `shipped` (PR #45) but actual PR is #46 and is OPEN, not merged.
**Fix:** Change status to `in-review`, fix PR# to #46.

### H-19: Bundled Hooks Not Active — Explanation
**Dimension:** 3 (Hooks)
**Description:** 5 bundled hooks (gsd-check-update, gsd-context-monitor, gsd-prompt-guard, gsd-statusline, gsd-workflow-guard) are OPT-IN features that require explicit installation via `bin/install.js` or `/gsd:update`. The project's `.claude/settings.json` has only 2 active hooks because the bundled hooks were never installed to this project. They are not dead code — they are shipped capabilities requiring activation. Recommend activating gsd-context-monitor and gsd-statusline for session visibility.

### H-20: Agent Count Discrepancy — "17" vs Actual 18+7+3
**Dimension:** 2 (Agent Ecosystem)
**Description:** The audit prompt referenced "17 gsd-* agents" which was already outdated. Actual ecosystem: 18 active built-in + 7 archived + 3 project-scoped = 28 total. The 7 archived agents are fully decommissioned — zero active references found via grep. All consolidations (v2.0-v2.1) are clean.

### H-21: gsd-executor Missing maxTurns in Frontmatter
**Dimension:** 2 (Agent Ecosystem)
**File:** `agents/gsd-executor.md:6`
**Description:** Write-capable sonnet agent with acceptEdits and isolation:worktree but no maxTurns limit. Could run indefinitely.
**Fix:** Add `maxTurns: 25` to frontmatter.

### H-22: `loadConfig()` Silently Writes to Disk on Every Read
**Dimension:** 11 (Unknown Unknowns)
**File:** `get-shit-done/bin/lib/core.cjs:461-499`
**Description:** Runs config migrations and auto-syncs `sub_repos` on every call. A function named `loadConfig` that mutates the filesystem. Read-only operations like `validate`, `verify`, `progress` can silently alter config.json.
**Fix:** Split into `loadConfig()` (pure read) and `persistConfig()` (explicit write).

---

## Medium Findings (Backlog)

| ID | Dimension | Finding | File |
|----|-----------|---------|------|
| M-01 | 1 | bin/ documentation misleading (thin wrapper vs actual location) | CLAUDE.md:29 |
| M-02 | 1 | README-gsd.md orphaned (41KB stale alternate README) | README-gsd.md |
| M-03 | 2 | gsd-assumptions-analyzer model tier (haiku may be suboptimal for inference) | agents/gsd-assumptions-analyzer.md |
| M-04 | 3 | gsd-agent-health-check.sh has zero test coverage | scripts/gsd-agent-health-check.sh |
| M-05 | 3 | {{GSD_VERSION}} placeholders unresolved in hook source files | hooks/gsd-*.js |
| M-06 | 4 | Trigger overlap risk between subagent-concierge and project-guide | plugins/claude-mcp-ecosystem/ |
| M-07 | 5 | reapply-patches.md and workstreams.md missing `name:` frontmatter field | commands/gsd/ |
| M-08 | 7 | Command count discrepancy (README says 61, actual 63 files, help shows 40) | README.md |
| M-09 | 7 | Test count stale (README says 2377, actual 2389) | README.md |
| M-10 | 8 | Dual plan-count schema (legacy vs compound) inconsistently written | state.cjs:291-336 |
| M-11 | 8 | HANDOFF.json deletion relies on LLM instruction, no consumed flag | workflows/resume-project.md |
| M-12 | 8 | `Paused At` field consumed by next.md but never written by pause-work | workflows/pause-work.md |
| M-13 | 8 | No active milestone falls back silently — progress inflates | core.cjs:1377-1412 |
| M-14 | 8 | execute-phase offers STATE.md reconstruction with no inline procedure | workflows/execute-phase.md |
| M-15 | 9 | plugin-developer agent has unrestricted Write+Bash with only prose constraints | .claude/agents/plugin-developer.md |
| M-16 | 9 | Incomplete injection pattern coverage (Unicode RLO, newline injection) | security.cjs:117-149 |
| M-17 | 10 | Unused dependency: esbuild@^0.25.12 | package.json |
| M-18 | 11 | gsd-tools.cjs switch statement scaling toward unmaintainability | gsd-tools.cjs |
| M-19 | 11 | fs.writeSync monkey-patching for --pick output interception | gsd-tools.cjs:292-323 |
| M-20 | 11 | Configuration truth distributed across 5+ sources with no sync check | Multiple |
| M-21 | 11 | O(n^2) behavior in isInsideFencedBlock/isClosingFence | core.cjs:666-681 |
| M-22 | 11 | Templates (45), workflows (62), references (16) completely unvalidated | get-shit-done/ |
| M-23 | 12 | RESUME-HERE.md recommended order obsolete (Stream A needs merge) | .extraction-staging/ |
| M-24 | 12 | Staging file vs port status conflict between docs | .extraction-staging/ |
| M-25 | 4 | Missing gsd-debug-guide skill for /gsd:debug user education | — |
| M-26 | 5 | /gsd:help delegates to external file with no drift detection | commands/gsd/help.md |

---

## Low / Informational Findings

| ID | Dimension | Finding |
|----|-----------|---------|
| L-01 | 1 | GSD-Framework-Analysis.md orphaned analysis artifact (35KB) |
| L-02 | 1 | PROJECT-AGENT-AUDIT-20260410.md dated audit clutter — relocated to .planning/research/agent-audits/2026-04-10-project-scoped-agents.md |
| L-03 | 1 | state/ directory naming generic (could confuse with app state) |
| L-04 | 1 | context/ not documented in project CLAUDE.md structure section |
| L-05 | 2 | 4 agents with Bash+Edit ambiguity (mitigated by scope guards) |
| L-06 | 3 | No profile-based hook gating (hooks don't adapt to quality/balanced/budget) |
| L-07 | 3 | gsd-check-update background spawn may add perceptible startup latency |
| L-08 | 4 | Hidden skills lack explicit `[BACKGROUND KNOWLEDGE]` prefix convention |
| L-09 | 4 | No trigger description on GSD command frontmatter (routing via name only) |
| L-10 | 4 | Missing gsd-workstreams-guide skill |
| L-11 | 5 | `init` nested switch mirrors user-facing command names (readability) |
| L-12 | 5 | `progress` slug exists at two nesting levels (readability) |
| L-13 | 6 | Copilot install test expects 17 agents, disk has 18 (test needs gsd-stack-analyzer) |
| L-14 | 7 | CLAUDE.md broken link to .planning/codebase/ARCHITECTURE.md (relative path) |
| L-15 | 8 | `Last Activity Description` written 3 places, never read by resume |
| L-16 | 8 | gsd_state_version 1.0 hardcoded, no schema migration infrastructure |
| L-17 | 8 | CONTEXT.md format unvalidated across handoff chain |
| L-18 | 8 | Progress body field and frontmatter plan counts can diverge |
| L-19 | 9 | Hook timeout not specified in .claude/settings.json |
| L-20 | 11 | normalizeMd not tested for idempotency |
| L-21 | 12 | Charter candidate #5 struck-through prematurely, wrong PR# |

---

## Test Suite Results

| Metric | Value |
|--------|-------|
| Total suites | 542 |
| Total tests | 2,389 |
| Passed | 2,388 |
| Failed | 1 |
| Flaky | 0 |
| Duration | 16.7s |

**Failing test:** `tests/copilot-install.test.cjs` — "installs all expected agent files" expects 17 agents, disk has 18 (gsd-stack-analyzer added in current branch). Not a real failure — test fixture needs updating.

### Coverage

| Module | Statements | Branches | Functions |
|--------|-----------|----------|-----------|
| **Overall** | **90.41%** | **82.12%** | **97.17%** |
| security.cjs | 100% | 100% | 100% |
| model-profiles.cjs | 100% | 92.3% | 100% |
| roadmap.cjs | 98.78% | 88.65% | 100% |
| classify.cjs | 98.2% | 85.43% | 100% |
| core.cjs | 95.6% | 90.84% | 100% |
| init.cjs | 95.82% | 86.32% | 100% |
| workstream.cjs (lowest) | 82.28% | 50.68% | 88.88% |

All modules meet 80% per-module minimum. Security modules at 100%.

---

## Coverage Matrix

| Dimension | Audited | Depth | Agents Used |
|-----------|---------|-------|-------------|
| 1. Structural Integrity | Full | File-level scan + doc comparison | W1-A (haiku) |
| 2. Agent Ecosystem | Full | All 28 agents parsed, frontmatter validated | W1-B (haiku) |
| 3. Hooks | Full | All 7 hook files read, parsed, perf estimated | W1-C (haiku) |
| 4. Skills | Full | All 8 SKILL.md + 63 commands validated | W1-D (haiku) |
| 5. Commands | Full | 63 commands + 65 slugs cross-referenced | W2-A (sonnet) |
| 6. Tests | Full | npm test run, coverage collected, gaps mapped | W1-E (haiku) |
| 7. Documentation | Full | README, CLAUDE.md, docs/AGENTS.md vs reality | W1-H (haiku) |
| 8. Lifecycle State Machine | Full | 5-phase chain traced, state schema analyzed | W2-B (sonnet) |
| 9. Security | Full | Secrets scan, agent perms, hook bypass, validation | W1-G (haiku) |
| 10. Dependencies | Full | npm audit, lockfile, unused deps, Node compat | W1-F (haiku) |
| 11. Unknown Unknowns | Partial | Adversarial code review of core modules | W2-D (sonnet) |
| 12. Extraction Staging | Full | All staging files vs actual repo state | W2-C (sonnet) |

### Not Audited (Flagged by W2-D)

| Area | File Count | Why Skipped |
|------|-----------|-------------|
| `get-shit-done/templates/` | 45 | Content validation requires prompt-level testing |
| `get-shit-done/workflows/` | 62 | Cross-reference checking is O(n^2) on skill inventory |
| `references/` | 16 | Reference doc accuracy requires domain expertise |
| `governance/` | 3 | Governance hook correctness needs integration testing |
| Cross-plugin interactions | N/A | Requires running claude-code-factory + GSD simultaneously |
| `profile-pipeline.cjs` + `profile-output.cjs` | 1,491 LOC | Intelligence layer v2.0 internals |

---

## Recommended Action Queue

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 1 | H-01: Add validatePath to `@file:` handler | 15 min | Closes arbitrary file read |
| 2 | H-10: Add validatePath to cmdSummaryExtract/cmdTodoComplete | 15 min | Closes path traversal |
| 3 | H-09: Replace raw execSync in init.cjs | 30 min | Consistent security pattern |
| 4 | H-21: Add maxTurns:25 to gsd-executor | 5 min | Prevent runaway agent |
| 5 | H-15: Add .env to .gitignore | 5 min | Prevent future secret leak |
| 6 | H-13: Write tests for lesson-capture-gate.cjs | 4-6 hrs | Cover critical blocking hook |
| 7 | H-11/12/16: Update agent counts + paths in docs | 1 hr | Documentation accuracy |
| 8 | H-14: Update /gsd:help to list all 63 commands | 1 hr | Discoverability |
| 9 | H-02/03/05: Harden phase gates to hard errors | 2-3 hrs | Lifecycle integrity |
| 10 | M-05: Resolve {{GSD_VERSION}} in hook build | 30 min | Hook version detection |
| 11 | M-17: Remove unused esbuild from devDeps | 5 min | Clean dependency tree |
| 12 | H-08: Replace regex YAML with js-yaml | 2-3 hrs | Eliminate silent corruption |
| 13 | H-06: Begin core.cjs decomposition | 1-2 days | Architectural health |
| 14 | H-07: Extract RuntimeAdapter for install.js | 2-3 days | Maintainability |
| 15 | L-13: Add gsd-stack-analyzer to copilot test | 5 min | Fix failing test |

---

## Confidence Notes

The following conclusions would benefit from `agent-architecture-review` (Guardian gate) or `hallucination-guard` verification that was not available in this session. The Cowork validator should treat these as softer confidence:

| Finding | Why Confidence Is Softer |
|---------|------------------------|
| H-01 (file read side channel) | Path traversal exploitability depends on whether crafted STATE.md values survive earlier parsing — not tested end-to-end |
| H-02/03/05 (soft phase gates) | Whether "advisory" vs "hard" is intentional design choice or oversight requires Pete's architectural intent |
| H-08 (regex YAML ReDoS) | Catastrophic backtracking is theoretical — no proof-of-concept string was tested against the regex |
| H-22 (loadConfig writes) | Side effects may be intentional for migration ergonomics — need architect confirmation |
| M-16 (injection pattern gaps) | Modern injection variants evolve faster than static patterns — no benchmark against current red-team corpus |
| M-22 (unvalidated templates) | 107 files not read — findings about templates are structural inference, not content verification |

---

## 63 Commands vs 65 Slugs — Explained

The "65 slugs vs 63 command files" gap is **architectural, not a bug.** The two systems are separate:

- **`commands/gsd/*.md`** (63 files) — Claude Code skills invoked by users via `/gsd:*`
- **`get-shit-done/bin/gsd-tools.cjs`** (66 case statements) — Internal CLI utility called by skills via `Bash`

They have nearly zero overlap by design. The skill body instructs Claude what to do, optionally calling `node gsd-tools.cjs <subcommand>` for operations that need filesystem access. The slugs are internal plumbing; the commands are user-facing skills.

**Actual overlap:** ~14 slugs correspond to user-facing commands. 51 slugs are internal-only utilities. 49 commands are pure-Claude skills with no gsd-tools counterpart.

---

## Sign-Off: Agent Contributions

| Section | Agent | Model | Dimension |
|---------|-------|-------|-----------|
| Structural Integrity | W1-A | haiku | 1 |
| Agent Ecosystem | W1-B | haiku | 2 |
| Hooks | W1-C | haiku | 3 |
| Skills | W1-D | haiku | 4 |
| Test Suite Results | W1-E | haiku | 6 |
| Dependencies & Build | W1-F | haiku | 10 |
| Security / Governance | W1-G | haiku | 9 |
| Documentation | W1-H | haiku | 7 |
| Commands / Slug Gap | W2-A | sonnet | 5 |
| Lifecycle State Machine | W2-B | sonnet | 8 |
| Extraction Staging | W2-C | sonnet | 12 |
| Unknown Unknowns | W2-D | sonnet | 11 |
| Synthesis & Report | Wave 3 | opus | All |
