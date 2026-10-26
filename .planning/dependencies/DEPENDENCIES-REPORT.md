=== GSD DEPENDENCY AUDIT REPORT ===
Generated: 2026-10-26T11:04:53Z
Scope: npm (package.json + package-lock.json, lockfileVersion 3)
Project root: /Users/cpconnor/projects/Pete-Gets-Shit-Done/.claude/worktrees/agent-a2250bd29e1d639b6

--- SUMMARY ---
Overall verdict: FLAG
Security: FLAG — 0 critical, 3 high, 1 moderate, 0 low (4 advisories, all on brace-expansion@5.0.8, dev-only path)
Staleness: FLAG — 1 packages flagged
Licenses:  PASS — 0 packages flagged

--- SECURITY FINDINGS ---
HIGH brace-expansion@5.0.8 → 5.0.12
  CVE: not provided by audit output (GHSA only)
  Advisory: https://github.com/advisories/GHSA-rgw5-rvv9-x895 (DoS, unbounded intermediate arrays; vulnerable <5.0.9)
  Path: via minimatch@10.2.3 (dev-only: c8@11.0.0 → test-exclude@8.0.0 → minimatch@10.2.3)
  Fix: upgrade brace-expansion to >=5.0.12 (transitive, see RECOMMENDATIONS 1)

HIGH brace-expansion@5.0.8 → 5.0.12
  CVE: not provided by audit output (GHSA only)
  Advisory: https://github.com/advisories/GHSA-qhr7-859c-m2p7 (stack exhaustion, nested brace groups; vulnerable <5.0.11)
  Path: via minimatch@10.2.3 (dev-only: c8@11.0.0 → test-exclude@8.0.0 → minimatch@10.2.3)
  Fix: upgrade brace-expansion to >=5.0.12 (transitive, see RECOMMENDATIONS 1)

HIGH brace-expansion@5.0.8 → 5.0.12
  CVE: not provided by audit output (GHSA only)
  Advisory: https://github.com/advisories/GHSA-6j4f-fj2g-mc7p (stack exhaustion, parseCommaParts; vulnerable <5.0.10)
  Path: via minimatch@10.2.3 (dev-only: c8@11.0.0 → test-exclude@8.0.0 → minimatch@10.2.3)
  Fix: upgrade brace-expansion to >=5.0.12 (transitive, see RECOMMENDATIONS 1)

MODERATE brace-expansion@5.0.8 → 5.0.12
  CVE: not provided by audit output (GHSA only)
  Advisory: https://github.com/advisories/GHSA-q2hr-2g5m-vwhr (quadratic-time expansion, CPU DoS; vulnerable <5.0.12)
  Path: via minimatch@10.2.3 (dev-only: c8@11.0.0 → test-exclude@8.0.0 → minimatch@10.2.3)
  Fix: upgrade brace-expansion to >=5.0.12 (transitive, see RECOMMENDATIONS 1)

--- STALENESS FINDINGS ---
brace-expansion@5.0.8 → 5.0.12 (patch) — patch release fixes the four CVE-bearing advisories listed above
  Last release: 2026-09-14
  Prod/Dev: dev

--- LICENSE FINDINGS ---
(none)

--- TOOL STATUS ---
npm: audit ran cleanly against the lockfile (npm audit exits 1 when vulnerabilities exist; output parsed as JSON)
npm: outdated returned an empty result in --package-lock-only mode (no node_modules present, so "current" versions are unknown). Staleness was checked instead by querying the registry (npm view) for each direct dependency.
Network: registry reachable; no retries needed.
Lockfile: present (package-lock.json, lockfileVersion 3). No node_modules installed; nothing was installed or modified.

--- RECOMMENDATIONS ---
1. Raise brace-expansion to >=5.0.12 (all four advisories are cleared at 5.0.12). It is a transitive dev dependency, so the published CLI is unaffected at runtime. Options, both of which change the lockfile and need your approval first: (a) add `"overrides": { "brace-expansion": "^5.0.12" }` to package.json and run `npm install --package-lock-only`; or (b) run `npm update brace-expansion --package-lock-only`. Do not run `npm audit fix --force`.
2. After the change, re-run `npm audit --json --package-lock-only` and confirm 0 vulnerabilities. Staleness and license verdicts need no action.

=== END REPORT ===

## DETAILED FINDINGS

Project structure
- Manifest type: npm. package.json declares only `devDependencies` (c8@^11.0.0, esbuild@^0.28.1) and no `dependencies`, `peerDependencies`, or `optionalDependencies`. Production: 0 (dev-only project). The published package (get-shit-done-cc@1.30.0) has no runtime npm dependencies.
- Lockfile: 82 installed packages (dev: 82, prod: 0, optional: 26 esbuild platform binaries). Node engine requirement: >=20.0.0.
- No other supported manifests at the project root (no pyproject.toml, Cargo.toml, go.mod, Gemfile, composer.json, or pnpm/yarn lockfiles).

Version currency (direct dependencies, registry lookup 2026-10-26)
- c8: installed 11.0.0 (released 2026-02-22). Latest 12.0.0 (released 2026-07-14). Major version behind, dev dependency: noted here only, not flagged, per policy. Upgrade is a separate initiative and is not part of the security fix.
- esbuild: installed 0.28.1 (released 2026-06-11). Latest 0.28.2 (released 2026-08-08). Patch-level, no CVE: silent per policy.
- Neither direct dependency has gone 2+ years without a release.

Transitive note on the advisory
- The audit's bundled range for brace-expansion is 4.0.0 through 5.0.11. Installed 5.0.8 is inside all four advisory ranges.
- npm audit reports one package-level record (high: 1). Counted per advisory, the figure is 3 high and 1 moderate, which is the basis of the SUMMARY count.
- Verdict note: the staleness criteria say a patch that fixes a CVE is a BLOCK. The verdict rules say BLOCK requires a high or critical CVE in the production path. This package is dev-only, so the verdict rules were applied: the security dimension is FLAG, and the staleness dimension is FLAG rather than BLOCK. The overall verdict is FLAG either way.

Licenses (from package-lock.json `license` fields, 82 packages)
- MIT: 62. ISC: 12. BlueOak-1.0.0: 5. BSD-3-Clause: 3. No missing or UNLICENSED entries.
- BlueOak-1.0.0 is an OSI-approved permissive license. It is not on the enumerated default list, but it is not unclear or custom, so it is classified PASS.
- The project has no license policy file (no LICENSE-POLICY.md or dependencies-policy.yml), so default rules apply. The root project is MIT, and LICENSE is present.

Optional peer note
- npm ls reports c8 with an optional peer `monocart-coverage-reports` that is not installed and not in the lockfile. Optional, dev-only, and not a finding.

Audit confidence
- Security: high. The audit ran against the lockfile and returned structured JSON with advisory URLs. CVE IDs were not included, so none are listed.
- Staleness: medium. npm outdated could not run meaningfully without node_modules, so direct-dependency currency was checked against the registry.
- Licenses: high for all 82 locked packages, read directly from the lockfile.

=== END DETAILED FINDINGS ===
