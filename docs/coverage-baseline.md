# Coverage Baseline

**Captured:** 2026-03-26
**Test count:** 1,547 passing
**Tool:** c8 v11.0.0 wrapping Node.js built-in test runner
**Scope:** All JavaScript/CJS source files (expanded from lib-only)

## Per-Module Coverage

### Security-Critical Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| gsd-prompt-guard.js | 0.00% | 0.00% | 0.00% | 0.00% |
| security.cjs | 99.48% | 92.68% | 100.00% | 99.48% |

### Operational Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| commands.cjs | 86.89% | 71.59% | 93.75% | 86.89% |
| core.cjs | 90.98% | 87.81% | 100.00% | 90.98% |
| gsd-tools.cjs | 94.66% | 89.67% | 100.00% | 94.66% |
| gsd-workflow-guard.js | 0.00% | 0.00% | 0.00% | 0.00% |
| init.cjs | 97.30% | 85.51% | 100.00% | 97.30% |
| install.js | 67.56% | 70.89% | 86.55% | 67.56% |
| phase.cjs | 87.73% | 69.44% | 100.00% | 87.73% |
| state.cjs | 89.33% | 78.69% | 88.46% | 89.33% |
| verify.cjs | 93.36% | 78.23% | 100.00% | 93.36% |

### Utility Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| build-hooks.js | 0.00% | 0.00% | 0.00% | 0.00% |
| config.cjs | 94.34% | 81.25% | 100.00% | 94.34% |
| frontmatter.cjs | 93.75% | 81.20% | 100.00% | 93.75% |
| gsd-check-update.js | 0.00% | 0.00% | 0.00% | 0.00% |
| gsd-context-monitor.js | 0.00% | 0.00% | 0.00% | 0.00% |
| gsd-statusline.js | 0.00% | 0.00% | 0.00% | 0.00% |
| milestone.cjs | 94.84% | 81.82% | 100.00% | 94.84% |
| model-profiles.cjs | 100.00% | 100.00% | 100.00% | 100.00% |
| profile-output.cjs | 90.55% | 61.68% | 94.74% | 90.55% |
| profile-pipeline.cjs | 83.12% | 70.00% | 84.62% | 83.12% |
| roadmap.cjs | 98.78% | 88.78% | 100.00% | 98.78% |
| template.cjs | 99.10% | 74.29% | 100.00% | 99.10% |
| uat.cjs | 88.65% | 72.00% | 100.00% | 88.65% |
| workstream.cjs | 80.24% | 45.07% | 88.89% | 80.24% |

## Summary by Tier

| Tier | Modules | Avg Lines | Avg Branches | Avg Functions |
|------|---------|-----------|-------------|---------------|
| Security-Critical | 2 | 49.74% | 46.34% | 50.00% |
| Operational | 9 | 78.64% | 70.20% | 85.42% |
| Utility | 14 | 65.96% | 54.01% | 69.16% |
| **Overall** | **25** | **69.23%** | **59.22%** | **73.48%** |

## Shell Script Inventory

| Script | Test File | Status |
|--------|-----------|--------|
| governance/scripts/health-check.sh | governance/tests/test_health_check.sh | TESTED |
| governance/scripts/install-plugins.sh | governance/tests/test_install_plugins.sh | TESTED |
| governance/scripts/scaffold-project.sh | governance/tests/test_scaffold.sh | TESTED |
| scripts/base64-scan.sh | (none) | UNTESTED |
| scripts/prompt-injection-scan.sh | tests/prompt-injection-scan.test.cjs | TESTED |
| scripts/secret-scan.sh | tests/security-scan.test.cjs | TESTED |

## Comparison Notes

This baseline was captured BEFORE Phase 3 (Unit Test Expansion). Compare against this file after Phase 3 to measure coverage improvement.

Previous lib-only baseline: 91.32% lines, 78.23% branches, 96.36% functions (17 modules)
Expanded baseline: 69.23% lines, 59.22% branches, 73.48% functions (25 modules)
