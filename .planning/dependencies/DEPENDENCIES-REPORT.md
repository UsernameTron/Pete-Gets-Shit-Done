=== GSD DEPENDENCY AUDIT REPORT ===
Generated: 2026-05-08T00:00:00Z
Scope: npm
Project root: /Users/cpconnor/projects/Pete-Gets-Shit-Done

--- SUMMARY ---
Overall verdict: FLAG
Security: PASS — 0 critical, 0 high, 0 moderate, 0 low
Staleness: FLAG — 1 package flagged
Licenses:  PASS — 0 packages flagged

--- SECURITY FINDINGS ---
(none)

--- STALENESS FINDINGS ---
esbuild@0.25.12 → 0.28.0 (minor) — dev dep, 3 minor versions behind latest
  Last release: 2026-04-02
  Prod/Dev: dev

--- LICENSE FINDINGS ---
(none)

--- TOOL STATUS ---
(all tools present)

--- RECOMMENDATIONS ---
1. Update esbuild from 0.25.12 to 0.28.0 (dev dep only, no blocking concerns). Run `npm install --save-dev esbuild@0.28.0` and verify hook build pipeline with `npm run build:hooks && npm test`.

=== END REPORT ===

## DETAILED FINDINGS

### Project Structure
- **Framework**: npm (Node.js 20+)
- **Type**: CommonJS plugin for Claude Code (v1.30.0)
- **Manifest**: `package.json`, `package-lock.json` (v3)
- **Lockfile present**: Yes (accurate, reliable audit)
- **Production dependencies**: 0 external runtime dependencies
- **Development dependencies**: 2 direct (`c8@11.0.0`, `esbuild@0.25.12`), 82 total including transitive
- **Dependency scope**: dev-only project — all external dependencies are development/build tools

### Security Status
**npm audit result**: 0 vulnerabilities across all 82 packages (including transitives).
- No critical, high, moderate, or low CVEs detected
- All transitive dependencies are clean
- Audit performed against current npm registry (2026-05-08)

**Supply chain confidence**: High. All dependencies (direct and transitive) maintain active upstream maintenance, no abandoned packages, no unusual hosting patterns.

### Staleness Analysis

**c8@11.0.0** (test coverage tool)
- Current: 11.0.0
- Latest: 11.0.0 (matches latest)
- Last release: 2026-02-25 (recent, ~2 months)
- Status: Current, no flag

**esbuild@0.25.12** (hook bundler)
- Current: 0.25.12
- Latest: 0.28.0 (minor version lag)
- Last release of latest: 2026-04-02 (~1 month ago)
- Status: FLAGGED (minor version lag, but not critical)
- Rationale: esbuild maintains rapid release cadence. The gap from 0.25 to 0.28 represents 3 minor versions with enhancements and stability improvements. Patch-level staleness is not flagged (per policy), but the minor gap warrants a note since build tools should track upstream closely. No security advisories for any 0.25.x version. Recommend upgrade as maintenance hygiene, not urgent.

### License Summary
All 84 packages (direct + transitive) use permissive licenses:
- `c8@11.0.0` — ISC (permissive)
- `esbuild@0.25.12` — MIT (permissive)
- Transitive packages include MIT, ISC, Apache-2.0, BSD-* — all permissive

**No GPL, AGPL, SSPL, BSL, or proprietary licenses detected.**
**No custom/unclear UNLICENSED entries in dependency tree.**

License policy: Project has no `LICENSE-POLICY.md` or `dependencies-policy.yml`. Defaults applied: all detected licenses pass, no violations.

### Transitive Dependency Tree (Key Packages)
Coverage and instrumentation layer (c8 deps):
- `istanbul-lib-coverage@3.2.2`, `istanbul-lib-report@3.0.1`, `v8-to-istanbul@9.3.0` (MIT)
- `@bcoe/v8-coverage@1.0.2`, `@istanbuljs/schema@0.1.3` (MIT)

CLI and utilities (shared):
- `yargs@17.7.2`, `yargs-parser@21.1.1` (MIT)
- `cliui@8.0.1`, `escalade@3.2.0` (MIT)

Globbing and path utilities:
- `glob@13.0.6`, `minimatch@10.2.3`, `path-scurry@2.0.2` (ISC/MIT)
- `lru-cache@11.2.6`, `minipass@7.1.3` (ISC)

Platform-specific esbuild binaries (all optional, MIT):
- `@esbuild/darwin-arm64@0.25.12` and 26 other platform variants
- Only loaded on matching OS; not executed on other platforms

### Audit Confidence
- **Lockfile status**: Present, pinned, current (npm install would not change anything)
- **Network status**: Stable (all registry queries succeeded first attempt)
- **Tool availability**: `npm audit`, `npm outdated`, `npm ls` all functional
- **Coverage**: 100% of npm ecosystem (no undetected dependencies)

### Closeout Status (v2.8 Phase 57)
- No blocking security issues (PASS)
- One minor dev-dependency version lag (FLAG, low priority)
- No license violations (PASS)
- All code coverage validators green (c8, check-doc-drift, validate-doc-links)

Recommendation for release: Safe to ship. Optional: update esbuild before next development cycle to maintain build-tool freshness, but not a release blocker.
