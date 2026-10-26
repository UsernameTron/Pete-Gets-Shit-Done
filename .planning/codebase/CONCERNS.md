# Codebase Concerns

**Analysis Date:** 2026-10-26

## Tech Debt

**P1 - CLAUDE.md Architecture section describes modules that do not exist:**
- Issue: `CLAUDE.md` (Architecture block, lines ~28-40) lists `lib/core.cjs`, `lib/security.cjs`, `lib/governance.cjs`, `lib/classify.cjs`, `lib/model-profiles.cjs`, `lib/history.cjs`. Repo-root `lib/` holds only `lib/ci-patterns.json` and `lib/injection-patterns.json`. Real modules live in `get-shit-done/bin/lib/` (`core.cjs`, `security.cjs`, `model-profiles.cjs`, `history.cjs`, ...). `classify.cjs` and `governance.cjs` do not exist under `get-shit-done/bin/lib/`; installer governance logic is `bin/lib/governance.js`, and enforcement is `governance/scripts/*.sh` plus `hooks/*.js`.
- Files: `CLAUDE.md`, `lib/`, `get-shit-done/bin/lib/`, `bin/lib/governance.js`
- Impact: CLAUDE.md is loaded as authoritative context every session and misdirects edits and explanations.
- Fix approach: Rewrite the Architecture block to match disk. Optionally extend `scripts/check-doc-drift.cjs` to assert backtick-quoted paths in CLAUDE.md resolve.

**P2 - Doc-drift checker guards few documentation claims (open ticket `tasks/doc-drift-coverage-gaps.md`):**
- Issue: Still true. The 2026-10-26 README audit found 27 stale claims; `scripts/check-doc-drift.cjs` (821 lines) guarded 2 of them, so the `docs-integrity` and drift CI gates stayed green. Unguarded: README skill-section headers vs `plugins/claude-code-factory/skills/`, plugin-inventory Skills/Subagents columns, `### GSD Commands (N)` vs `commands/gsd/*.md`, hook total (`### The N Hooks`) vs `hooks/*.js`, and skill-table rows vs files on disk.
- Files: `scripts/check-doc-drift.cjs`, `README.md`, `tasks/doc-drift-coverage-gaps.md`
- Impact: README and CLAUDE.md counts and inventories rot silently.
- Fix approach: Add the metrics listed in the ticket; add a path-existence check for skill table rows.

**P2 - `scripts/generate-gap-analysis.cjs` ignores the split installer (open ticket `tasks/install-split-followups.md` item 3):**
- Issue: Still true. `OPERATIONAL_PATTERNS` (line 21 onward) lists `.cjs` names (`core.cjs`, `commands.cjs`, `state.cjs`, ...) and matches paths by substring (`lower.includes(pat)`, line ~103). The installer now lives in `bin/install.js` (359 lines) plus `bin/lib/**`, so those files classify as `Utility`, not `Operational`, in coverage-gap priority.
- Files: `scripts/generate-gap-analysis.cjs`, `bin/lib/`
- Impact: Coverage-gap reports under-prioritise installer modules.
- Fix approach: Add `bin/lib/` (and `install.js`) to `OPERATIONAL_PATTERNS`.

**P2 - `scripts/ci-coverage-report.sh` cannot render its report:**
- Issue: Requires `coverage/coverage-summary.json` (produced only by c8's `json-summary` reporter). `package.json` scripts `test:coverage` and `test:coverage:full` pass `--reporter text|lcov|json` only; no `json-summary` anywhere in `scripts/`, `package.json`, or `.github/`. The script hits `[[ ! -f ... ]]`, prints a warning, and exits 0.
- Files: `scripts/ci-coverage-report.sh`, `package.json`, `.github/workflows/test.yml` (step "Generate coverage report")
- Impact: The Actions job-summary coverage table never renders; green CI hides a dead step.
- Fix approach: Add `--reporter json-summary` to both coverage scripts.

**P2 - Documented coverage thresholds are not enforced:**
- Issue: `CLAUDE.md` states 90% overall / 80% per module / 95% security-critical. `.c8rc.json` has `include`, `exclude`, `all` only; no `check-coverage`, `lines`, or `branches`. `ci-coverage-report.sh` is advisory and uses a hardcoded 80%.
- Files: `.c8rc.json`, `package.json`, `scripts/ci-coverage-report.sh`
- Impact: A regression passes CI as long as CLAUDE.md's stated number is updated to match.
- Fix approach: Add `check-coverage: true` with `lines`/`branches` thresholds to `.c8rc.json`, or `--check-coverage` in `test:coverage:full`.

**P3 - `get-shit-done/bin/lib/init.cjs` is 1,973 lines:**
- Issue: 30+ `cmdInit*` functions plus skill-metadata operations (`parseSkillMetadata`, `discoverSkills`, `auditSkills`, ...) in one file. `core.cjs` is 1,753 lines.
- Files: `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/core.cjs`
- Impact: Every new command touches the same file.
- Fix approach: Extract skill operations to `get-shit-done/bin/lib/skills.cjs`.

**P3 - `.gitignore` misstates tracking of planning files and has no secret-file patterns:**
- Issue: Lines 42 and 44 list `.planning/PROJECT.md` and `.planning/research/` as local, but `.planning/PROJECT.md` is tracked (`git ls-files .planning`). `.gitignore` has no `.env*`, `*.pem`, or `*.key` patterns.
- Files: `.gitignore`
- Impact: Misleading rule; no defensive backstop for accidental secret files (CI `scripts/secret-scan.sh` is content-based only).
- Fix approach: Remove or annotate the stale entries; add `.env*`, `*.pem`, `*.key`.

**P3 - `prepublishOnly` does not run tests:**
- Issue: `"prepublishOnly": "npm run build:hooks"` (`package.json` line 50).
- Files: `package.json`
- Impact: Local `npm publish` can ship with failing tests (CI gates `main`, not publish).
- Fix approach: Prefix with `npm test`.

## Known Bugs

**Uninstall leaves three orphaned hook registrations in settings.json (open ticket `tasks/uninstall-orphaned-hook-registrations.md`):**
- Symptoms: After `--uninstall`, `settings.json` still registers `gsd-cost-tracker`, `gsd-config-protection`, and `gsd-spawn-tracker` pointing at deleted files; every matching tool call runs a missing-file hook.
- Files: `bin/lib/uninstall-steps.js`, `bin/lib/settings-hooks.js`
- Trigger: Still true. `removeHooks()` (line 87) deletes all eight hook files including the three above, but `GSD_HOOK_REMOVALS` (lines 123-127) only has marker entries for `gsd-check-update`, `gsd-statusline`, `gsd-context-monitor`, and `gsd-prompt-guard`. `bin/lib/settings-hooks.js` lines 15-18 register the three missing ones (PostToolUse cost tracker; PreToolUse config protection with matcher `Write|Edit`; PreToolUse spawn tracker with matcher `Task|Agent`).
- Workaround: Hand-edit `settings.json`.
- Fix approach: Add `{ events: ['PostToolUse','AfterTool'], markers: ['gsd-cost-tracker'] }` and `{ events: ['PreToolUse','BeforeTool'], markers: ['gsd-config-protection','gsd-spawn-tracker'] }` to `GSD_HOOK_REMOVALS`; add an uninstall test asserting no `gsd-*` command remains in `settings.json`. Coverage of `bin/lib/uninstall-steps.js` is the reason this went unnoticed.

## Security Considerations

**`security-scan.yml` job is not in the documented required-checks list:**
- Risk: `.github/workflows/security-scan.yml` job `security` runs injection, base64, and secret scans on PRs, but `CLAUDE.md` lists only five required checks (`test` x3, `governance`, `docs-integrity`). No in-repo source of truth for branch protection; `get-shit-done/bin/lib/harden-repo.cjs` preserves existing contexts.
- Files: `.github/workflows/security-scan.yml`, `CLAUDE.md`, `get-shit-done/bin/lib/harden-repo.cjs`
- Current mitigation: Failures are visible on the PR.
- Recommendations: Either require it or document it as advisory.

**UAT shell injection is mitigated (no longer a concern):**
- `get-shit-done/bin/lib/uat-patterns.cjs` now emits argv assertions run through `safeExec` (no shell); only the two static pipeline patterns are `shell: true` and run via `execSync` in `get-shit-done/bin/lib/uat-runner.cjs`. Keep the invariant test that those are the only `shell: true` patterns.

## Performance Bottlenecks

**Planning lock busy-wait:**
- Problem: `withPlanningLock()` polls with `spawnSync('sleep', ['0.1'])` (`get-shit-done/bin/lib/core.cjs` line 792).
- Files: `get-shit-done/bin/lib/core.cjs`
- Cause: No synchronous file-watch primitive in CommonJS.
- Improvement path: Low priority; revisit only if parallel workstreams show contention.

## Fragile Areas

**Per-runtime installer modules and converters:**
- Files: `bin/lib/runtimes/*.js` (8 runtimes), `bin/lib/converters/`, `bin/lib/install-steps.js`, `bin/lib/uninstall-steps.js`, `bin/lib/settings-hooks.js`
- Why fragile: Install and uninstall registration tables are separate lists (`settings-hooks.js` vs `GSD_HOOK_REMOVALS`) and drifted (see Known Bugs). Tool-name and content conversions are per-runtime.
- Safe modification: When adding a hook, update the install table in `bin/lib/settings-hooks.js`, the delete list in `removeHooks()`, and `GSD_HOOK_REMOVALS` together; run `npm run test:e2e`.
- Test coverage: See Test Coverage Gaps.

**`harden-repo.cjs` mutates live GitHub branch protection:**
- Files: `get-shit-done/bin/lib/harden-repo.cjs`
- Why fragile: Read-merge-PUT through `gh` against a real repo; absent-field API responses are poorly covered (83.33% statements, 70.66% branches).
- Safe modification: Add fixtures with each protection field individually absent before changing `check()` or `mergePolicy()`.

## Scaling Limits

**Execution history JSONL:**
- Current capacity: 1,000 records, rotated to the newest 500 (`ROTATION_THRESHOLD` / `ROTATION_KEEP`).
- Files: `get-shit-done/bin/lib/history.cjs`
- Scaling path: Adequate for single-user CLI use.

## Dependencies at Risk

**Dependency audit report is stale:**
- Risk: `.planning/dependencies/DEPENDENCIES-REPORT.md` was generated 2026-05-08.
- Files: `.planning/dependencies/DEPENDENCIES-REPORT.md`
- Migration plan: Re-run `/gsd:audit-deps`. Surface is small: no runtime `dependencies`; dev deps `c8` and `esbuild` only.

## Test Coverage Gaps

**Branch coverage below 70-85% in several modules (measured 2026-10-26 via `npx c8 --reporter text node scripts/run-tests.cjs`; overall 94.39% statements / 84.56% branches):**
- `get-shit-done/bin/lib/harden-repo.cjs`: 83.33% stmt / 70.66% branch. Priority: High (live GitHub PUT).
- `get-shit-done/bin/lib/profile-pipeline.cjs`: 83.67% stmt / 70.13% branch. Malformed session JSONL and permission-error paths. Priority: Medium.
- `bin/lib/install-steps.js`: 83.99% stmt / 65.43% branch. Priority: Medium.
- `bin/lib/attribution.js`: 81.81% stmt / 65% branch. Priority: Low.
- `bin/lib/toml.js`: 81.02% stmt / 81.2% branch. Priority: Low.
- Risk: Statement coverage sits just above the 80% per-module floor, which nothing enforces (see Tech Debt).

**`bin/lib/uninstall-steps.js` hook-registration cleanup:**
- What's not tested: Absence of `gsd-*` commands in `settings.json` after uninstall.
- Files: `bin/lib/uninstall-steps.js`
- Risk: The orphaned-registration bug above.
- Priority: High

---

*Concerns audit: 2026-10-26*
