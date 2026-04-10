=== GSD DEPENDENCY AUDIT REPORT ===
Generated: 2026-04-10T21:15:00Z
Scope: npm
Project root: /Users/cpconnor/projects/Pete-Gets-Shit-Done

--- SUMMARY ---
Overall verdict: PASS
Security: PASS — 0 critical, 0 high, 0 moderate, 0 low
Staleness: PASS — 0 packages flagged
Licenses:  PASS — 0 packages flagged

--- SECURITY FINDINGS ---
(none)

--- STALENESS FINDINGS ---
(none)

--- LICENSE FINDINGS ---
(none)

--- TOOL STATUS ---
(all tools present)

--- RECOMMENDATIONS ---
1. No action required. Continue with existing dependency strategy.
2. Optional: Consider upgrading esbuild from 0.25.12 to 0.28.0 (minor version bump, adds features and fixes). This is a non-blocking enhancement.
3. Re-audit monthly or after any dependency changes.

=== END REPORT ===

## DETAILED FINDINGS

### Project Structure
- **Language**: JavaScript (Node.js >=20.0.0)
- **Lockfile**: package-lock.json v3 present (reliable auditing possible)
- **Direct dependencies**: 2
  - Production: 1 (implicit, only devDependencies listed)
  - Development: 2 (c8@11.0.0, esbuild@0.25.12)
- **Transitive dependencies**: 80 (all dev/test support)

### Security Audit Results
npm audit reported **zero vulnerabilities** across all severity levels (critical, high, moderate, low).
- No CVEs detected in any direct or transitive dependencies
- No known security issues in c8@11.0.0 (ISC license, actively maintained)
- No known security issues in esbuild@0.25.12 (MIT license, actively maintained)

### Version Currency Analysis

**Direct Dependencies:**
- **c8@11.0.0** (coverage tool)
  - Current version: 11.0.0
  - Latest version: 11.0.0 (up to date)
  - Last release: 2026-02-25
  - Status: PASS (no upgrade available)

- **esbuild@0.25.12** (bundler)
  - Current version: 0.25.12
  - Latest version: 0.28.0
  - Wanted version: 0.25.12
  - Last release: 2026-04-02
  - Version delta: Minor (0.25 → 0.28, pre-1.0 semver)
  - Status: PASS (minor version behind, non-blocking)
  - Note: This is a minor version bump with feature additions. No breaking changes expected. Upgrade is optional and recommended only if new esbuild features are needed.

**Transitive Dependencies:**
All transitive dependencies of c8 and esbuild are either:
- Up-to-date (latest versions installed)
- Deprecated but compatible (e.g., older yargs versions)
- Native bindings with platform-specific variants (esbuild platform binaries)

No transitive dependencies exceed the version staleness threshold (major version behind OR 2+ years without release).

### License Analysis

**Direct Dependencies:**
- **c8@11.0.0**: ISC license (permissive, PASS)
- **esbuild@0.25.12**: MIT license (permissive, PASS)

**Project License:**
- **get-shit-done-cc**: MIT license (permissive, consistent with dependencies)

**License Policy:**
No LICENSE-POLICY.md or dependencies-policy.yml found. Using default permissive license policy.
All detected licenses are permissive (ISC, MIT). No copyleft, GPL, AGPL, or proprietary licenses detected.

### Notes on Transitive Dependencies

The dependency tree is shallow and well-maintained:
- Most transitive deps from c8 are test-support utilities (istanbul, yargs, glob)
- esbuild platform binaries are optional dependencies (marked UNMET for non-darwin platforms)
- No monorepo structure or workspace complexity detected

### Audit Confidence

**Reliability: HIGH**
- lockfile present (package-lock.json v3)
- npm audit tool verified all dependencies against npm security database
- No network failures during audit
- All audit tools installed and functional
