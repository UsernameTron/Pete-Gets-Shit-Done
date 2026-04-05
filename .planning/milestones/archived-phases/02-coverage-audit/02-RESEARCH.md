# Phase 2: Coverage Audit - Research

**Researched:** 2026-03-26
**Domain:** JavaScript/Node.js test coverage instrumentation with c8
**Confidence:** HIGH

## Summary

This phase measures existing test coverage across all JavaScript modules, inventories shell script test status, and produces a prioritized gap analysis -- all without writing any new tests. The project already has c8 v11.0.0 installed as a devDependency and a working `test:coverage` npm script that covers the 17 lib modules. The work is expanding c8's `--include` scope to additional JS files (hooks, gsd-tools.cjs, bin/install.js, scripts), documenting shell script coverage manually, and producing a gap analysis ranked by priority tier.

Current state: 1,547 tests pass, 17 lib modules report 91.32% line coverage overall, but hooks (5 files, 579 lines), gsd-tools.cjs (918 lines), and bin/install.js (5,185 lines) have 0% measured coverage. Shell scripts (6 files across governance/scripts and scripts) have no line-coverage tooling and need manual inventory only.

**Primary recommendation:** Expand c8 `--include` patterns to cover all JS/CJS source files, generate text + lcov + json reports, then write a gap analysis document that ranks uncovered code paths by security-critical > operational > utility tiers.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Expand c8 instrumentation to ALL JavaScript/CJS files in the project -- not just `get-shit-done/bin/lib/*.cjs`. Include: `hooks/*.js` (source only, exclude `hooks/dist/`), `scripts/*.cjs`, `commands/`, `plugins/` JS files.
- **D-02:** Shell scripts (`governance/scripts/*.sh`, `scripts/*.sh`) get a manual inventory with binary tested/untested status. No fake line-coverage numbers for bash -- just catalog which scripts have corresponding test files in `governance/tests/`.
- **D-03:** `hooks/dist/` is excluded from coverage. These are compiled copies of `hooks/*.js` source files -- instrumenting both would double-count.

### Claude's Discretion
- Report format and reporters (text, lcov, html) -- choose what best serves COV-01's "per-module report" requirement
- Gap analysis document structure and priority tier definitions -- align with COV-02's "security-critical > operational > utility" ranking
- Baseline document format and location -- make it diff-friendly for Phase 3 comparison per COV-03
- c8 threshold configuration -- current 70% lines threshold may be adjusted based on findings

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COV-01 | Coverage tool measures line/branch coverage across all modules and outputs per-module report | c8 `--include` expansion + multiple reporters (text, lcov, json) produces per-module line/branch/function/statement report |
| COV-02 | Gap analysis identifies untested code paths with priority ranking (security-critical > operational > utility) | Parse c8 JSON output + manual shell inventory to produce ranked gap document |
| COV-03 | Coverage baseline documented -- current state captured before any new tests written | Commit coverage-summary.json + human-readable baseline markdown file |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| c8 | 11.0.0 (installed) | V8-native code coverage | Already a devDependency. Zero-dependency constraint prohibits alternatives. Uses V8's built-in coverage, no instrumentation transform needed. |
| Node.js built-in test runner | >=20.0.0 | Test execution | Already in use via `node --test`. c8 wraps this. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Zero-dependency constraint means no new tools |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| c8 | Istanbul/nyc | Would add dependency; c8 is already installed and uses V8 native coverage (faster, more accurate) |
| c8 JSON output | Custom parser | c8's `--reporter json` produces standard Istanbul-format JSON -- parse that directly |
| ShellCheck coverage | Manual inventory | No reliable bash coverage tool exists; manual tested/untested catalog is honest and accurate |

## Architecture Patterns

### Recommended Artifact Structure
```
.planning/phases/02-coverage-audit/
├── 02-RESEARCH.md          # This file
├── 02-CONTEXT.md           # User decisions (exists)
├── 02-PLAN-*.md            # Execution plans (created by planner)
coverage/
├── coverage-summary.json   # Machine-readable c8 output (gitignored by c8 default)
docs/
├── coverage-baseline.md    # Human-readable baseline (committed, COV-03)
├── coverage-gaps.md        # Prioritized gap analysis (committed, COV-02)
```

### Pattern 1: Expanded c8 Include Patterns
**What:** Multiple `--include` flags to cover all JS source directories
**When to use:** Running the expanded coverage command
**Example:**
```bash
npx c8 \
  --reporter text --reporter lcov --reporter json \
  --include 'get-shit-done/bin/lib/*.cjs' \
  --include 'get-shit-done/bin/gsd-tools.cjs' \
  --include 'bin/install.js' \
  --include 'hooks/*.js' \
  --include 'scripts/*.cjs' \
  --include 'scripts/*.js' \
  --exclude 'hooks/dist/**' \
  --exclude 'tests/**' \
  --exclude 'scripts/run-tests.cjs' \
  --all \
  node scripts/run-tests.cjs
```
**Source:** c8 v11 CLI help (`npx c8 --help`), verified locally

**Key findings from testing:**
- Multiple `--include` flags work correctly (tested with hooks)
- `--all` flag reports 0% for files not exercised by tests (verified: all 5 hook files show 0% when included)
- `--reporter json` produces `coverage-final.json` in Istanbul format -- machine-parseable
- `--reporter lcov` produces `lcov.info` for potential CI integration later (Phase 5)
- `--exclude 'hooks/dist/**'` prevents double-counting compiled hooks

### Pattern 2: Shell Script Manual Inventory
**What:** Map each `.sh` file to whether a corresponding test exists
**When to use:** For D-02 compliance -- shell scripts get binary tested/untested status
**Mapping:**
```
governance/scripts/health-check.sh     -> governance/tests/test_health_check.sh  (TESTED)
governance/scripts/install-plugins.sh  -> governance/tests/test_install_plugins.sh (TESTED)
governance/scripts/scaffold-project.sh -> governance/tests/test_scaffold.sh       (TESTED)
scripts/base64-scan.sh                 -> (no test file)                          (UNTESTED)
scripts/prompt-injection-scan.sh       -> tests/prompt-injection-scan.test.cjs    (TESTED - JS test)
scripts/secret-scan.sh                 -> tests/security-scan.test.cjs            (TESTED - JS test)
```
Also: `governance/tests/test_install.sh` and `governance/tests/test_integration.sh` exist as additional governance tests.

### Pattern 3: Priority Tier Classification
**What:** Classify modules into security-critical, operational, and utility tiers
**When to use:** Gap analysis ranking (COV-02)
**Classification:**
| Tier | Criteria | Modules |
|------|----------|---------|
| Security-Critical | Auth, secrets, input validation, scanning | security.cjs, prompt-injection-scan.sh, base64-scan.sh, secret-scan.sh, gsd-prompt-guard.js |
| Operational | Core pipeline, state management, phase execution | core.cjs, commands.cjs, state.cjs, phase.cjs, init.cjs, verify.cjs, gsd-tools.cjs, bin/install.js, gsd-workflow-guard.js |
| Utility | Formatting, templates, profiles, UI helpers | template.cjs, frontmatter.cjs, model-profiles.cjs, profile-output.cjs, profile-pipeline.cjs, roadmap.cjs, milestone.cjs, uat.cjs, workstream.cjs, gsd-statusline.js, gsd-check-update.js, gsd-context-monitor.js |

### Anti-Patterns to Avoid
- **Fabricating shell coverage numbers:** D-02 explicitly says no fake line-coverage for bash. Binary tested/untested only.
- **Including hooks/dist in coverage:** Would double-count since dist files are compiled from hooks source.
- **Modifying test files during audit:** This phase is measurement only. No new tests.
- **Including run-tests.cjs in coverage:** It's test infrastructure, not application code. Exclude it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage measurement | Custom V8 coverage parser | c8 v11 with `--all` flag | Already installed, handles V8 coverage data natively |
| Per-module report | Manual line counting | c8 `--reporter text` + `--reporter json` | Standard Istanbul-format output, machine-parseable |
| Coverage data format | Custom JSON schema | Istanbul coverage-final.json format | Industry standard, tools understand it |
| HTML report | Custom HTML template | c8 `--reporter lcov` (optional) | If visual report needed, lcov integrates with genhtml or CI tools |

**Key insight:** c8 does all the heavy lifting. The only custom work is (1) a script to parse the JSON output and produce the gap analysis markdown, and (2) the shell script manual inventory.

## Common Pitfalls

### Pitfall 1: c8 `--all` Shows Files Not in Node's Module Graph
**What goes wrong:** Files like hooks that are never `require()`'d by any test show 0% coverage. This is correct behavior, not a bug.
**Why it happens:** `--all` forces c8 to report on all files matching `--include` patterns, even unrequired ones.
**How to avoid:** Expect and document 0% for hooks, gsd-tools.cjs, and bin/install.js. These are the gaps Phase 3 will address.
**Warning signs:** If you see 0% and think the tool is broken -- it isn't.

### Pitfall 2: Glob Pattern Differences Between Shell and c8
**What goes wrong:** c8 uses picomatch/micromatch glob patterns, not shell globs. `*.cjs` in c8 means "files in current directory only" -- not recursive.
**Why it happens:** c8 respects standard glob semantics where `*` doesn't match path separators.
**How to avoid:** Use explicit path prefixes: `get-shit-done/bin/lib/*.cjs` not `**/*.cjs`. The existing pattern already does this correctly.
**Warning signs:** Files missing from report that should be there.

### Pitfall 3: coverage/ Directory Gitignore
**What goes wrong:** c8 outputs to `./coverage/` by default. This directory may or may not be gitignored.
**Why it happens:** Many projects gitignore coverage artifacts.
**How to avoid:** Check `.gitignore` before committing baseline. The committed baseline should be in `docs/` not `coverage/`. Use `--reports-dir` if needed.

### Pitfall 4: Branch Coverage Can Be Misleading
**What goes wrong:** Low branch coverage even with high line coverage because of ternaries, short-circuit evaluations, and default parameters.
**Why it happens:** V8 counts every conditional path, including implicit ones.
**How to avoid:** Report both line and branch coverage but prioritize line coverage for the gap analysis ranking. Branch coverage is supplementary context.

## Code Examples

### Expanded Coverage Command (for package.json)
```json
{
  "scripts": {
    "test:coverage": "c8 --reporter text --reporter json --include 'get-shit-done/bin/lib/*.cjs' --include 'get-shit-done/bin/gsd-tools.cjs' --include 'bin/install.js' --include 'hooks/*.js' --include 'scripts/build-hooks.js' --exclude 'hooks/dist/**' --exclude 'tests/**' --all node scripts/run-tests.cjs",
    "test:coverage:full": "c8 --reporter text --reporter lcov --reporter json --include 'get-shit-done/bin/lib/*.cjs' --include 'get-shit-done/bin/gsd-tools.cjs' --include 'bin/install.js' --include 'hooks/*.js' --include 'scripts/build-hooks.js' --exclude 'hooks/dist/**' --exclude 'tests/**' --all node scripts/run-tests.cjs"
  }
}
```

### Parsing c8 JSON for Gap Analysis (Node.js script)
```javascript
// scripts/generate-gap-analysis.cjs
'use strict';
const { readFileSync } = require('fs');
const summary = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'));

for (const [file, data] of Object.entries(summary)) {
  const shortPath = file.replace(process.cwd() + '/', '');
  const stmts = data.s;
  const total = Object.keys(stmts).length;
  const covered = Object.values(stmts).filter(c => c > 0).length;
  const pct = total ? ((covered / total) * 100).toFixed(1) : '0.0';
  console.log(`${shortPath}: ${pct}% (${covered}/${total} statements)`);
}
```
**Source:** Istanbul coverage-final.json format (standard c8 output)

### Baseline Document Structure (COV-03)
```markdown
# Coverage Baseline

**Captured:** [date]
**Test count:** 1,547 passing
**Tool:** c8 v11.0.0 wrapping Node.js built-in test runner

## Per-Module Coverage

| Module | Lines | Branches | Functions | Tier |
|--------|-------|----------|-----------|------|
| security.cjs | 99.47% | 92.68% | 100% | Security |
| ...          | ...    | ...     | ...   | ...  |

## Summary by Tier

| Tier | Modules | Avg Lines | Avg Branches |
|------|---------|-----------|-------------|
| Security-Critical | N | X% | Y% |
| Operational | N | X% | Y% |
| Utility | N | X% | Y% |

## Shell Script Inventory

| Script | Test File | Status |
|--------|-----------|--------|
| health-check.sh | test_health_check.sh | Tested |
| ...              | ...                  | ...    |
```

## Current Coverage Baseline (Pre-Expansion)

Captured from running `npx c8` with current `--include 'get-shit-done/bin/lib/*.cjs'`:

| Module | Lines | Branches | Functions |
|--------|-------|----------|-----------|
| commands.cjs | 86.89% | 71.58% | 93.75% |
| config.cjs | 94.34% | 81.25% | 100% |
| core.cjs | 90.97% | 87.87% | 100% |
| frontmatter.cjs | 93.75% | 81.20% | 100% |
| init.cjs | 97.29% | 85.51% | 100% |
| milestone.cjs | 94.84% | 81.81% | 100% |
| model-profiles.cjs | 100% | 100% | 100% |
| phase.cjs | 87.72% | 69.44% | 100% |
| profile-output.cjs | 90.54% | 61.67% | 94.73% |
| profile-pipeline.cjs | 83.11% | 70.00% | 84.61% |
| roadmap.cjs | 98.78% | 88.77% | 100% |
| security.cjs | 99.47% | 92.68% | 100% |
| state.cjs | 89.33% | 78.68% | 88.46% |
| template.cjs | 99.09% | 74.28% | 100% |
| uat.cjs | 88.65% | 72.00% | 100% |
| verify.cjs | 93.35% | 78.22% | 100% |
| workstream.cjs | 80.24% | 45.07% | 88.88% |
| **Overall** | **91.32%** | **78.23%** | **96.36%** |

**Files NOT yet measured (expected 0% when included):**
- `get-shit-done/bin/gsd-tools.cjs` (918 lines)
- `bin/install.js` (5,185 lines)
- `hooks/*.js` (5 files, 579 lines total)
- `scripts/build-hooks.js` (82 lines)

**Impact of expansion:** Adding ~6,764 lines of 0%-covered code will significantly drop the overall percentage. The lib modules alone are ~10,743 lines. Expect overall to drop from 91% to roughly 55-60% after expansion.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Istanbul/nyc (transform-based) | c8 (V8-native) | c8 v8+ (2022) | No source transforms, faster, works with ESM and CJS natively |
| `--reporter text` only | Multiple reporters in single run | Always supported | text for console, json for parsing, lcov for CI integration |
| Manual line counting | `--all` flag | c8 v5+ | Reports files with 0% that aren't loaded by tests |

## Open Questions

1. **Should `scripts/run-tests.cjs` be included in coverage?**
   - What we know: It's test infrastructure (29 lines), not application code
   - Recommendation: Exclude it -- it's a test harness, not a feature module

2. **Should the expanded coverage command replace or supplement the existing one?**
   - What we know: Current `test:coverage` only covers lib modules
   - Recommendation: Replace the existing `test:coverage` with the expanded version. The old scope is a subset of the new scope.

3. **What threshold should apply to the expanded scope?**
   - What we know: Current threshold is `--lines 70`. After expansion, overall will drop to ~55-60%.
   - Recommendation: Remove `--check-coverage` from the measurement script for this phase. Re-establish thresholds in Phase 3 after tests are written. Alternatively, use `--per-file` thresholds only on lib modules.

## Project Constraints (from CLAUDE.md)

- **Zero-dependency constraint:** No new npm packages. c8 (already installed) is the only coverage tool.
- **CommonJS only:** All source files are `.cjs` or `.js` with CommonJS `require()`.
- **Coverage >= 90% overall, >= 80% per module, >= 95% security-critical:** These are CLAUDE.md targets for the full milestone, not this audit phase. This phase measures the gap.
- **No code changes without plan approval:** This phase produces reports/docs only. Any package.json script changes need to be in the plan.
- **Branch workflow:** Changes go on a feature branch, not main.
- **Documentation standards:** Three living docs must stay updated (CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node --test`) + c8 v11.0.0 |
| Config file | None (c8 configured via CLI flags in package.json) |
| Quick run command | `npm test` |
| Full suite command | `npx c8 --reporter text --reporter json --all [--include flags] node scripts/run-tests.cjs` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COV-01 | c8 produces per-module line/branch report for all modules | smoke | `npm run test:coverage` -- verify output includes all expected modules | N/A (output validation, not code test) |
| COV-02 | Gap analysis document with priority ranking | manual | Visual inspection of `docs/coverage-gaps.md` | N/A (document artifact) |
| COV-03 | Baseline captured in committed file | smoke | `test -f docs/coverage-baseline.md && git log --oneline docs/coverage-baseline.md` | N/A (file existence check) |

### Sampling Rate
- **Per task commit:** `npm test` (fast, verifies no test regressions)
- **Per wave merge:** `npm run test:coverage` (full coverage report)
- **Phase gate:** All 3 artifacts exist and coverage command runs cleanly

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. This phase produces documents, not code that needs testing.

## Sources

### Primary (HIGH confidence)
- c8 v11.0.0 CLI help (`npx c8 --help`) -- verified locally
- c8 `--all` behavior with hooks -- tested locally, confirmed 0% for unloaded files
- c8 JSON reporter -- tested locally, produces Istanbul-format `coverage-final.json`
- Current coverage baseline -- captured from live `npx c8` run on this machine

### Secondary (MEDIUM confidence)
- Istanbul coverage-final.json format -- well-known standard, verified by examining actual output
- Priority tier classification -- based on module names and CLAUDE.md security standards

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - c8 v11.0.0 verified locally, all patterns tested
- Architecture: HIGH - c8 CLI options confirmed, output formats verified
- Pitfalls: HIGH - Tested `--all` behavior with hooks, confirmed glob patterns work

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable tooling, no breaking changes expected)
