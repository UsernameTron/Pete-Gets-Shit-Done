# Codebase Concerns

**Analysis Date:** 2026-10-26

## Tech Debt

**P3 - `get-shit-done/bin/lib/init.cjs` is 1,973 lines:**
- Issue: 30+ `cmdInit*` functions plus skill-metadata operations (`parseSkillMetadata`, `discoverSkills`, `auditSkills`, ...) in one file. `core.cjs` is 1,753 lines.
- Files: `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/core.cjs`
- Impact: Every new command touches the same file.
- Fix approach: Extract skill operations to `get-shit-done/bin/lib/skills.cjs`.

## Known Bugs

**P3 - `parseTomlKeyPath` accepts a trailing dot (`bin/lib/toml.js`):**
- Issue: `[a.]` parses as table `a` and `a. = 1` as key `a`; both are invalid TOML.
- Impact: Low — only affects how the installer reads already-invalid user `config.toml` lines; GSD never writes such keys.
- Fix approach: return null for an empty trailing segment, with a test; confirm callers leave unparseable lines untouched.

## Security Considerations

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

None. `npm audit`: 0 vulnerabilities (brace-expansion 5.0.12); `.planning/dependencies/DEPENDENCIES-REPORT.md` verdict PASS. `c8` is one major behind (dev-only).

## Test Coverage Gaps

**Branch coverage is not gated (line floors are):** overall 95.71% lines / 86.48% branches after the 2026-10-26 sweep; every module ≥ 80% lines (CI-enforced). Lowest branch coverage: `daily.cjs` 60%, runtime converters `antigravity.js` 61% / `cursor.js` and `windsurf.js` 73%, `profile-output.cjs` 72%, `commands.cjs` 74%, `phase.cjs` 75%. Priority: Low — statement coverage on all of them is ≥ 88%.

## Resolved 2026-10-26 (reliability sweep, `fix/reliability-sweep-2026-10-26`)

- CLAUDE.md Architecture block rewritten to the real tree.
- Doc-drift checker: 4 new metrics, 3 new claims, two-way README skill-table check (36 claims).
- `scripts/generate-gap-analysis.cjs` classifies `bin/lib/` as Operational; hardcoded baseline test count removed.
- Coverage floors enforced in CI (`npm run coverage:check`); `test:coverage:full` emits `json-summary` so the CI coverage summary renders.
- `.gitignore`: stale planning entries removed; `.env*`, `*.pem`, `*.key` backstop added.
- `prepublishOnly` runs `npm test` first.
- Uninstall removes cost-tracker / config-protection / spawn-tracker registrations; regression-tested across settings.json runtimes.
- `security` (security-scan.yml) is now a required status check (6 total).
- Dependency advisories cleared (brace-expansion 5.0.12).
- Branch-coverage gaps closed: `harden-repo.cjs` 71% → 89%, `profile-pipeline.cjs` 70% → 93%, `install-steps.js` 65% → 90%, `attribution.js` 65% → 100%, `toml.js` 81% → 97% (90 new tests).

---

*Concerns audit: 2026-10-26*
