# Full Codebase Audit — 2026-04-17

**Scope:** 7-layer granular audit across the entire GSD codebase
**Branch:** main @ 90ec9ca
**Milestone:** v2.4 complete, pre-v2.5 baseline
**Method:** 7 parallel subagents, report-only (no fixes applied)

---

## Layer Verdicts

| # | Layer | Verdict | Critical Issues | Advisories |
|---|-------|---------|-----------------|------------|
| 1 | Commands | FAIL | 3 missing `name` frontmatter, 1 naming mismatch | 14 inline-only commands (architectural inconsistency) |
| 2 | Workflows | FAIL | 2 orphaned workflows | 3 unclear-status workflows |
| 3 | Lib | PASS | — | 2 unused uat.cjs exports, 1 untested export |
| 4 | Hooks | PASS | — | Prompt-guard 5 patterns behind, triple-fire Stop hooks, 1 orphaned deployed hook |
| 5 | Tests | FAIL | 2 files below 70% branch coverage | 5 near-threshold files |
| 6 | Security | PASS | — | 2 dead imports, 1 missing path validation, hardcoded paths in committed agents |
| 7 | Plugins | CONDITIONAL PASS | claude-code-factory repo is a stub (1/37 skills) | Plugin description drift between repo and cache |

**Overall: 3 FAIL, 1 CONDITIONAL PASS, 3 PASS**

---

## Layer 1: Commands (FAIL)

**Count:** 62 command files in `~/.claude/commands/gsd/` (expected 63 per CLAUDE.md)

### Critical Findings

1. **3 commands missing `name` field in frontmatter:**
   - `dev-preferences.md` — static data file, not a traditional command
   - `reapply-patches.md` — functional command, name missing
   - `workstreams.md` — functional command, name missing

2. **1 naming mismatch:**
   - `resume-work.md` command references `resume-project.md` workflow (name inconsistency)

### Informational

- **14 commands use inline logic** (no companion workflow): `add-backlog`, `crew`, `debug`, `finalize`, `join-discord`, `portfolio`, `prime-patterns`, `reapply-patches`, `review-backlog`, `thread`, `workstreams`, `audit-agents`, `audit-deps`, `dev-preferences`. Two explicitly document this as intentional (`audit-agents`, `audit-deps`). The rest are undocumented architectural exceptions.
- **8 workflow files have no matching command** — cross-referenced with Layer 2 below.
- **`dev-preferences.md`** is a generated data file masquerading as a command. Consider relocating.

---

## Layer 2: Workflows (FAIL)

**Count:** 55 workflow files in `~/.claude/get-shit-done/workflows/`

### Critical Findings

1. **2 truly orphaned workflows** (no command, no workflow, no agent references them):
   - **`discovery-phase.md`** (289 lines) — Claims plan-phase.md calls it. Reality: plan-phase.md does not reference it. Dead code from a refactor.
   - **`verify-phase.md`** (254 lines) — Claims execute-phase.md spawns it. Reality: verification logic moved to gsd-verifier agent. Referenced only as passive "see also" in 2 templates.

2. **3 unclear-status workflows** (may be internally referenced but not confirmed):
   - `diagnose-issues.md` — possibly invoked by verify-work.md
   - `node-repair.md` — possibly invoked by execute-plan.md
   - `transition.md` — has `<internal_workflow>` tag, referenced by resume-project.md and execute-phase.md

### Properly Internal Workflows (not orphaned)

- `discuss-phase-assumptions.md` — referenced by discuss-phase.md command
- `resume-project.md` — referenced by resume-work.md command
- `execute-plan.md` — sub-workflow spawned by execute-phase.md
- `transition.md` — self-declares as internal, referenced by other workflows

---

## Layer 3: Lib (PASS)

**Count:** 19 .cjs files, 244 total exports

### Health

- Zero TODO/FIXME/HACK/XXX comments
- Zero dead code (no commented-out blocks, no unreachable statements)
- Zero unused local functions
- All 244 exports consumed by runtime code, gsd-tools.cjs, or test files

### Minor Items

- **2 truly unused exports in `uat.cjs`:** `parseCurrentTest` and `buildCheckpoint` — helper functions exported but never imported or tested externally
- **1 untested export in `core.cjs`:** `getPhaseFileStats` — used internally, exported, but no test coverage
- **~28 test-only exports** across 7 files — standard practice for testability

---

## Layer 4: Hooks (PASS with advisories)

**Count:** 19 registered hooks (18 event + 1 statusLine) across 2 settings files

### All Hook Files Exist and Are Executable

No missing files. All Node.js hooks have stdin timeouts. All follow fail-open patterns.

### Medium-Severity Advisories

1. **Prompt-guard pattern drift:** Deployed `~/.claude/hooks/gsd-prompt-guard.js` has 18 injection patterns. Repo source has 23 patterns (5 newer patterns covering tool invocation injection, exfiltration, `act as` bypass). Deployed copy is behind.

2. **Triple-firing lesson-capture on Stop (in GSD project):**
   - Global: `lesson-capture-gate.cjs` (sophisticated tiered matcher)
   - Global: `gsd-lessons-check.sh` (simpler predecessor, same purpose)
   - Project: `lesson-capture-gate.cjs` (duplicate of global)
   - Result: 3 overlapping hooks fire on every Stop, adding latency and potential confusing double-blocks.

### Low-Severity Advisories

3. **Orphaned deployed hook:** `gsd-workflow-guard.js` deployed to `~/.claude/hooks/` but not registered in any settings.json. Self-disabling (checks config flag), so functionally inert.

4. **Missing stdin timeout:** `gsd-lessons-check.sh` reads stdin via bare `cat` without a timeout (all Node.js hooks have timeouts).

5. **9 hardcoded paths in `~/.claude/settings.json`** command strings — expected for user-level config, not a portability issue.

---

## Layer 5: Tests (FAIL)

**Count:** 2,530 tests, 497 suites, 0 failures, 0 skips

### Test Suite: Healthy

All 2,530 tests pass. Zero failures, zero skips, ~8.5s duration.

### Coverage: Meets Overall Threshold

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Statements | 90.97% | 90% | PASS |
| Branches | 82.94% | — | OK |
| Functions | 97.43% | — | OK |
| Lines | 90.97% | 90% | PASS |

### Files Below 70% Branch Coverage (FAIL threshold)

| File | Line% | Branch% | Gap |
|------|-------|---------|-----|
| `phase.cjs` | 90.41% | **69.44%** | Uncovered: lines 543, 656-661, 664-667, 787-791 |
| `profile-output.cjs` | 90.54% | **61.67%** | Uncovered: lines 713-714, 717-718, 775, 779-780 |

### Near-Threshold Files (Watch List)

| File | Branch% | Risk |
|------|---------|------|
| `profile-pipeline.cjs` | 70.13% | Borderline — one removed test drops it below |
| `template.cjs` | 74.28% | Moderate gap |
| `commands.cjs` | 73.42% | Moderate gap |
| `gsd-statusline.js` | 75.67% | Hook — moderate gap |
| `uat.cjs` | 78.20% | Moderate gap |
| `verify.cjs` | 78.31% | Moderate gap |

### Security Module: Clean

`security.cjs` at 100% line and branch coverage. Exceeds the 95% requirement.

---

## Layer 6: Security (PASS with advisories)

### No Secrets Found

Zero hardcoded API keys, tokens, or credentials in source code. All test tokens are explicitly fake. `BRAVE_API_KEY` read from env at runtime.

### Zero Dependencies, Zero Vulnerabilities

`npm audit` reports 0 vulnerabilities. Only devDependencies: `c8` and `esbuild`.

### Advisories

| # | Severity | Finding |
|---|----------|---------|
| A1 | Low | `CLAUDE.md` + 3 `.claude/agents/*.md` committed with `/Users/cpconnor/` paths — leaks macOS username |
| A2 | Low | `commands.cjs:6` and `core.cjs:35` import `execSync` but never call it — dead imports |
| A3 | Low | `milestone.cjs:cmdMilestoneComplete()` uses user-supplied `version` in `path.join()` without `requireSafePath()` validation |
| A4 | Info | `tests/helpers.cjs:33` uses template literal interpolation in shell call — test-only |
| A5 | Info | `hooks/gsd-check-update.js:96` uses raw shell call instead of array-based invocation |

---

## Layer 7: Plugins (CONDITIONAL PASS)

### Plugin Inventory

| Plugin | Version | Skills (repo) | Skills (installed) | Status |
|--------|---------|---------------|-------------------|--------|
| claude-mcp-ecosystem | 2.0.0 | 7 | 7 | MATCH |
| claude-code-factory | 1.0.0 | 1 | 37 | **36 MISSING FROM REPO** |

### Critical Finding

**claude-code-factory is a repo stub.** Only `extension-guide/SKILL.md` exists in the repo source. The remaining 36 skills (agent-factory, cc-factory, hook-factory, skill-factory, etc.) exist only in the installed plugin cache at `~/.claude/plugins/cache/`. If the cache is cleared, those skills are lost.

### Other Findings

- **2 GSD command skills missing `name` frontmatter:** `reapply-patches.md`, `workstreams.md` (same as Layer 1)
- **Plugin description drift:** Both plugins have different descriptions in repo vs installed cache. Repo versions appear more current.
- **All 7 claude-mcp-ecosystem skills:** Valid SKILL.md, proper frontmatter, good descriptions
- **All 37 installed claude-code-factory skills:** Valid SKILL.md, no placeholder descriptions

---

## Prioritized Fix List

### P0 — Must Fix (structural risk)

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 1 | Plugin | claude-code-factory repo stub — 36 skills only in cache | Skills lost on cache clear; no version control |
| 2 | Hooks | Prompt-guard deployed copy 5 patterns behind source | 5 security patterns (tool injection, exfiltration, act-as bypass) not active |

### P1 — Should Fix (quality/correctness)

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 3 | Tests | `phase.cjs` branch coverage 69.44% (threshold: 70%) | Below project standard |
| 4 | Tests | `profile-output.cjs` branch coverage 61.67% | Well below project standard |
| 5 | Workflows | 2 orphaned workflows: `discovery-phase.md`, `verify-phase.md` | Dead code, confusion during maintenance |
| 6 | Commands | 3 commands missing `name` frontmatter | Inconsistent skill routing |
| 7 | Hooks | Triple-firing lesson-capture on Stop | Latency, potential double-block |
| 8 | Security | `milestone.cjs` missing `requireSafePath()` on version param | Path traversal inconsistency |

### P2 — Nice to Fix (hygiene)

| # | Layer | Issue | Impact |
|---|-------|-------|--------|
| 9 | Security | 2 dead imports in commands.cjs and core.cjs | Misleading imports |
| 10 | Commands | `resume-work` / `resume-project` naming mismatch | Maintenance confusion |
| 11 | Hooks | `gsd-workflow-guard.js` deployed but not registered | Orphaned file |
| 12 | Hooks | `gsd-lessons-check.sh` missing stdin timeout | Resilience gap |
| 13 | Lib | 2 unused exports in uat.cjs, 1 untested export in core.cjs | Minor hygiene |
| 14 | Security | Hardcoded `/Users/cpconnor/` in committed agent .md files | PII leakage in public repo |
| 15 | Plugins | Plugin description drift (repo vs installed cache) | Stale metadata |

### Deferred / Informational

| # | Layer | Note |
|---|-------|------|
| D1 | Commands | 14 inline-only commands — architectural inconsistency, not a defect |
| D2 | Commands | `dev-preferences.md` is a data file, not a command — relocation candidate |
| D3 | Tests | 5 near-threshold files (70-78% branch) — monitor, don't fix yet |
| D4 | Hooks | 9 hardcoded paths in `~/.claude/settings.json` — expected for user-level config |

---

## Counts Summary

| Metric | Value | Source |
|--------|-------|--------|
| Command files | 62 | `~/.claude/commands/gsd/` |
| Workflow files | 55 | `~/.claude/get-shit-done/workflows/` |
| Lib modules | 19 (.cjs) | `get-shit-done/bin/lib/` |
| Total exports | 244 | Across all lib modules |
| Hook registrations | 19 | Across all settings files |
| Hook source files | 8 | `hooks/` repo directory |
| Tests | 2,530 | 497 suites, 0 failures |
| Line coverage | 90.97% | c8 |
| Branch coverage | 82.94% | c8 |
| Plugins | 2 | claude-mcp-ecosystem, claude-code-factory |
| Plugin skills (repo) | 8 | 7 + 1 |
| Plugin skills (installed) | 44 | 7 + 37 |
| Security vulnerabilities | 0 | npm audit |
| Runtime dependencies | 0 | package.json |

---

*Generated by 7-layer parallel audit. No fixes applied — report only.*
