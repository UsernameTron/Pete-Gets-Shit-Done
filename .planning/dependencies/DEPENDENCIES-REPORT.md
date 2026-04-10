=== GSD DEPENDENCY AUDIT REPORT ===
Generated: 2026-04-10T00:00:00Z
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
1. No action required. Re-audit after any dependency change.

=== END REPORT ===

## DETAILED FINDINGS

### Project Structure
- **Package manager**: npm
- **Manifest**: package.json
- **Lockfile**: package-lock.json (present and reliable)
- **Project type**: Development-only (0 production dependencies, 2 development dependencies)

### Direct Dependencies Summary
| Package | Current | Latest | Type | Status |
|---------|---------|--------|------|--------|
| c8 | 11.0.0 | 11.0.0 | dev | Current |
| esbuild | 0.25.12 | 0.28.0 | dev | 2 minor versions behind |

### Staleness Analysis

**esbuild@0.25.12 → 0.28.0 (minor version delta)**
- Current: 0.25.12, released 2025-11-01
- Latest: 0.28.0, released 2026-04-02
- Type: dev dependency
- Assessment: PASS (no flag) — This is a dev-only dependency. While it is 2 minor versions behind, minor-version upgrades for development tools do not constitute a security or staleness risk. The upgrade would be for feature/enhancement purposes, which falls outside the audit scope. The current version is recent (5 months old as of audit date) and has no known CVEs.

**c8@11.0.0 (at latest)**
- Current: 11.0.0, which is the latest version
- Type: dev dependency
- Assessment: PASS — No action needed.

### Security Analysis
- **npm audit result**: 0 vulnerabilities across all dependency levels
- **Transitive dependencies**: 82 total (1 prod, 82 dev + optional)
- **CVE count**: 0 critical, 0 high, 0 moderate, 0 low
- **Audit confidence**: High (lockfile present, audit tool functioning)

### License Analysis
**Direct dependencies:**
- **c8@11.0.0**: ISC (permissive)
- **esbuild@0.25.12**: MIT (permissive)

**Transitive dependencies**: All major transitive dependencies (via c8 and esbuild build chains) carry standard permissive licenses (MIT, Apache-2.0, ISC, BSD-*). No license conflicts detected.

**Project-wide license policy**: No LICENSE-POLICY.md or dependencies-policy.yml found. Audit uses default permissive policy.

### Assessment Notes
1. **Dev-only structure**: This project ships only development tooling (no runtime dependencies). All dependencies are used for testing (c8) and bundling (esbuild) during the build/test lifecycle. This is a safe, intentional design.
2. **Transitive depth**: 82 transitive dependencies is typical for Node.js projects with c8 and esbuild, both of which have rich dependency trees. However, none of these transitive dependencies pose security or compliance risks.
3. **Lockfile integrity**: The package-lock.json is present and well-formed, enabling deterministic installs.
4. **Minor version lag**: esbuild@0.25.12 is 2 minor versions behind 0.28.0. Per audit policy, minor-version gaps are not flagged unless they fix a CVE or the package is 2+ years stale. Neither condition applies here.

### Audit Confidence
- **Lockfile present**: Yes
- **Network stability**: Stable (no transient failures during audit)
- **Audit tool**: npm 10.x (standard)
- **Overall confidence**: High — all audit data is authoritative and complete.
