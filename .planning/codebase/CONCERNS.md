# Codebase Concerns

**Analysis Date:** 2026-10-26

## Tech Debt

**P3 - `get-shit-done/bin/lib/init.cjs` is 1,973 lines:**
- Issue: 30+ `cmdInit*` functions plus skill-metadata operations (`parseSkillMetadata`, `discoverSkills`, `auditSkills`, ...) in one file. `core.cjs` is 1,753 lines.
- Files: `get-shit-done/bin/lib/init.cjs`, `get-shit-done/bin/lib/core.cjs`
- Impact: Every new command touches the same file.
- Fix approach: Extract skill operations to `get-shit-done/bin/lib/skills.cjs`.

## Known Bugs

None open.

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

**Branch coverage below 70-85% in several modules (measured 2026-10-26 via `npx c8 --reporter text node scripts/run-tests.cjs`; overall 94.39% statements / 84.56% branches):**
- `get-shit-done/bin/lib/harden-repo.cjs`: 83.33% stmt / 70.66% branch. Priority: High (live GitHub PUT).
- `get-shit-done/bin/lib/profile-pipeline.cjs`: 83.67% stmt / 70.13% branch. Malformed session JSONL and permission-error paths. Priority: Medium.
- `bin/lib/install-steps.js`: 83.99% stmt / 65.43% branch. Priority: Medium.
- `bin/lib/attribution.js`: 81.81% stmt / 65% branch. Priority: Low.
- `bin/lib/toml.js`: 81.02% stmt / 81.2% branch. Priority: Low.
- Risk: Statement coverage sits just above the 80% per-module floor; CI now enforces that floor (`npm run coverage:check`), so a regression in these modules fails the build. Branch coverage is not gated.

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

---

*Concerns audit: 2026-10-26*
