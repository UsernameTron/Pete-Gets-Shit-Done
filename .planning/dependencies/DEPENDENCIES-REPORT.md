=== GSD DEPENDENCY AUDIT REPORT ===
Generated: 2026-10-26T12:01:24Z
Scope: npm (package.json + package-lock.json, lockfileVersion 3)
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
1. No action required. Re-audit after any dependency change, or before the next release.

=== END REPORT ===

## DETAILED FINDINGS

Project structure
- Manifest type: npm. package.json declares only `devDependencies` (c8@^11.0.0, esbuild@^0.28.1) and no `dependencies`, `peerDependencies`, or `optionalDependencies`. Production: 0 (dev-only project). The published package get-shit-done-cc@1.30.0 ships no runtime npm dependencies (`files` excludes node_modules).
- Lockfile: package-lock.json, lockfileVersion 3, 82 locked packages (plus root). 26 are esbuild platform binaries, of which only the darwin-arm64 binary is installed on this host.
- No other supported manifests at the checkout root (no pyproject.toml, requirements*.txt, Cargo.toml, go.mod, Gemfile, composer.json, or pnpm/yarn lockfiles).

Security
- `npm audit --json` (and `npm audit --package-lock-only --json`) ran against the checkout lockfile and returned 0 vulnerabilities across all severities. brace-expansion resolves to 5.0.12 in the checkout lockfile, above the patched version for each advisory previously reported against 5.0.8.
- Superseded report: an earlier report at the checkout path (generated 2026-10-26T11:04:53Z) listed four brace-expansion advisories at 5.0.8. That report was generated from a different worktree's lockfile, not this checkout's. This report replaces it. Re-run the audit if a lockfile at 5.0.8 is ever merged to main.
- No CVE IDs are listed because none were reported.

Version currency (direct dependencies)
- c8: installed 11.0.0. Latest 12.0.0 is a major version behind. Dev dependency: noted here only, not flagged, per policy.
- esbuild: installed 0.28.1. Latest 0.28.2 is patch-level with no associated CVE in the audit output: silent per policy.
- Last-release dates were not checked against the registry, since no staleness finding was triggered.

Licenses (from installed package.json `license` fields)
- Installed licenses: MIT, ISC, BSD-3-Clause, and BlueOak-1.0.0 (glob, minimatch, minipass, path-scurry, lru-cache; all dev-only transitive deps of c8). BlueOak-1.0.0 is a short permissive license with no copyleft terms. It is not on the enumerated default allowlist but is a standard SPDX identifier, not custom or unclear, so it is classified PASS. Add it to an explicit allowlist in a LICENSE-POLICY.md if you want it recorded.
- The project has no license policy file (no LICENSE-POLICY.md or dependencies-policy.yml), so default rules apply. The root project is MIT.
- The npm lockfile does not store license fields. License data came from installed node_modules package.json files.
- Optional peer note: c8 declares optional peer `monocart-coverage-reports`. It is not installed and not in the lockfile. Not a finding.

Audit confidence
- Security: high. npm audit ran against the checkout lockfile and returned structured JSON.
- Staleness: high for the two direct dependencies, checked via `npm outdated --json` against installed node_modules.
- Licenses: high for installed packages. Uninstalled esbuild platform binaries have no license data locally; they are esbuild platform packages under the same upstream MIT license and are not shipped.

=== END DETAILED FINDINGS ===
