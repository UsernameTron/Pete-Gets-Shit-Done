# Coverage Gap Analysis

**Generated:** 2026-03-26
**Source:** coverage/coverage-final.json from `npm run test:coverage`
**Total modules measured:** 25

## Priority Ranking

Modules ranked by coverage gap severity within each tier.
Priority: Security-Critical > Operational > Utility.

### Security-Critical

| Module | Lines | Branches | Functions | Gap Priority |
|--------|-------|----------|-----------|-------------|
| gsd-prompt-guard.js | 0.00% | 0.00% | 0.00% | HIGH |
| security.cjs | 99.48% | 92.68% | 100.00% | LOW |

### Operational

| Module | Lines | Branches | Functions | Gap Priority |
|--------|-------|----------|-----------|-------------|
| gsd-workflow-guard.js | 0.00% | 0.00% | 0.00% | HIGH |
| install.js | 67.56% | 70.89% | 86.55% | MEDIUM |
| commands.cjs | 86.89% | 71.59% | 93.75% | LOW |
| phase.cjs | 87.73% | 69.44% | 100.00% | LOW |
| state.cjs | 89.33% | 78.69% | 88.46% | LOW |
| core.cjs | 90.98% | 87.81% | 100.00% | LOW |
| verify.cjs | 93.36% | 78.23% | 100.00% | LOW |
| gsd-tools.cjs | 94.66% | 89.67% | 100.00% | LOW |
| init.cjs | 97.30% | 85.51% | 100.00% | LOW |

### Utility

| Module | Lines | Branches | Functions | Gap Priority |
|--------|-------|----------|-----------|-------------|
| gsd-check-update.js | 0.00% | 0.00% | 0.00% | HIGH |
| gsd-context-monitor.js | 0.00% | 0.00% | 0.00% | HIGH |
| gsd-statusline.js | 0.00% | 0.00% | 0.00% | HIGH |
| build-hooks.js | 0.00% | 0.00% | 0.00% | HIGH |
| workstream.cjs | 80.24% | 45.07% | 88.89% | LOW |
| profile-pipeline.cjs | 83.12% | 70.00% | 84.62% | LOW |
| uat.cjs | 88.65% | 72.00% | 100.00% | LOW |
| profile-output.cjs | 90.55% | 61.68% | 94.74% | LOW |
| frontmatter.cjs | 93.75% | 81.20% | 100.00% | LOW |
| config.cjs | 94.34% | 81.25% | 100.00% | LOW |
| milestone.cjs | 94.84% | 81.82% | 100.00% | LOW |
| roadmap.cjs | 98.78% | 88.78% | 100.00% | LOW |
| template.cjs | 99.10% | 74.29% | 100.00% | LOW |
| model-profiles.cjs | 100.00% | 100.00% | 100.00% | LOW |

## Shell Script Inventory

Per D-02: binary tested/untested status only. No line-coverage numbers for bash.

| Script | Test File | Status |
|--------|-----------|--------|
| governance/scripts/health-check.sh | governance/tests/test_health_check.sh | TESTED |
| governance/scripts/install-plugins.sh | governance/tests/test_install_plugins.sh | TESTED |
| governance/scripts/scaffold-project.sh | governance/tests/test_scaffold.sh | TESTED |
| scripts/base64-scan.sh | (none) | UNTESTED |
| scripts/prompt-injection-scan.sh | tests/prompt-injection-scan.test.cjs | TESTED |
| scripts/secret-scan.sh | tests/security-scan.test.cjs | TESTED |

## Summary

- **Modules with 0% line coverage:** gsd-check-update.js, gsd-context-monitor.js, gsd-prompt-guard.js, gsd-statusline.js, gsd-workflow-guard.js, build-hooks.js
- **Modules below 80% line coverage:** install.js
- **Security-critical gaps:** 1 module(s) below 95% target (gsd-prompt-guard.js at 0.00%)
- **Recommended Phase 3 priority order:**
  1. gsd-prompt-guard.js (Security-Critical, 0.00% lines)
  2. gsd-workflow-guard.js (Operational, 0.00% lines)
  3. install.js (Operational, 67.56% lines)
  4. commands.cjs (Operational, 86.89% lines)
  5. phase.cjs (Operational, 87.73% lines)
  6. state.cjs (Operational, 89.33% lines)
  7. core.cjs (Operational, 90.98% lines)
  8. verify.cjs (Operational, 93.36% lines)
  9. gsd-tools.cjs (Operational, 94.66% lines)
  10. gsd-check-update.js (Utility, 0.00% lines)
  11. gsd-context-monitor.js (Utility, 0.00% lines)
  12. gsd-statusline.js (Utility, 0.00% lines)
  13. build-hooks.js (Utility, 0.00% lines)
  14. workstream.cjs (Utility, 80.24% lines)
  15. profile-pipeline.cjs (Utility, 83.12% lines)
  16. uat.cjs (Utility, 88.65% lines)
  17. profile-output.cjs (Utility, 90.55% lines)
  18. frontmatter.cjs (Utility, 93.75% lines)
  19. config.cjs (Utility, 94.34% lines)
  20. milestone.cjs (Utility, 94.84% lines)

## Baseline Reference

See [coverage-baseline.md](coverage-baseline.md) for the full per-module coverage snapshot.
