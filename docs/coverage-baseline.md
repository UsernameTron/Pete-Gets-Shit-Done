# Coverage Baseline

**Captured:** 2026-10-26
**Test count:** run `npm test` (never inlined — see CLAUDE.md)
**Tool:** c8 v11.0.0 wrapping Node.js built-in test runner
**Scope:** All JavaScript/CJS source files (expanded from lib-only)

## Per-Module Coverage

### Security-Critical Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| gsd-prompt-guard.js | 100.00% | 96.30% | 0.00% | 100.00% |
| security.cjs | 100.00% | 100.00% | 100.00% | 100.00% |

### Operational Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| antigravity.js | 100.00% | 61.11% | 100.00% | 100.00% |
| antigravity.js | 100.00% | 100.00% | 100.00% | 100.00% |
| attribution.js | 81.82% | 65.00% | 100.00% | 81.82% |
| claude.js | 100.00% | 100.00% | 100.00% | 100.00% |
| cli-options.js | 100.00% | 100.00% | 0.00% | 100.00% |
| codex-config.js | 98.51% | 91.38% | 100.00% | 98.51% |
| codex-hooks-feature.js | 94.12% | 85.00% | 100.00% | 94.12% |
| codex.js | 100.00% | 78.57% | 100.00% | 100.00% |
| codex.js | 97.87% | 85.71% | 100.00% | 97.87% |
| colors.js | 100.00% | 100.00% | 0.00% | 100.00% |
| commands.cjs | 93.49% | 73.57% | 100.00% | 93.49% |
| copilot-instructions.js | 100.00% | 100.00% | 100.00% | 100.00% |
| copilot.js | 100.00% | 91.18% | 100.00% | 100.00% |
| copilot.js | 92.98% | 88.89% | 100.00% | 92.98% |
| copy.js | 90.43% | 79.57% | 100.00% | 90.43% |
| core.cjs | 95.72% | 91.37% | 100.00% | 95.72% |
| cursor.js | 90.98% | 72.73% | 83.33% | 90.98% |
| cursor.js | 100.00% | 100.00% | 100.00% | 100.00% |
| gemini.js | 88.54% | 80.00% | 100.00% | 88.54% |
| gemini.js | 100.00% | 100.00% | 100.00% | 100.00% |
| governance.js | 95.07% | 88.71% | 100.00% | 95.07% |
| gsd-cost-tracker.js | 100.00% | 81.48% | 100.00% | 100.00% |
| gsd-tools.cjs | 93.33% | 88.44% | 99.17% | 93.33% |
| init.cjs | 96.55% | 85.38% | 100.00% | 96.55% |
| install-core.js | 96.84% | 91.67% | 100.00% | 96.84% |
| install-steps.js | 83.99% | 65.43% | 100.00% | 83.99% |
| install.js | 96.66% | 92.68% | 100.00% | 96.66% |
| manifest.js | 100.00% | 93.44% | 100.00% | 100.00% |
| opencode.js | 91.15% | 96.55% | 85.71% | 91.15% |
| opencode.js | 98.90% | 86.84% | 100.00% | 98.90% |
| paths.js | 100.00% | 99.12% | 100.00% | 100.00% |
| phase.cjs | 92.56% | 74.74% | 100.00% | 92.56% |
| settings-hooks.js | 91.84% | 89.29% | 100.00% | 91.84% |
| settings.js | 100.00% | 98.77% | 100.00% | 100.00% |
| shared.js | 97.70% | 94.12% | 100.00% | 97.70% |
| state.cjs | 92.93% | 80.22% | 96.15% | 92.93% |
| toml-lexer.js | 86.11% | 89.04% | 100.00% | 86.11% |
| toml.js | 81.02% | 81.20% | 100.00% | 81.02% |
| uninstall-steps.js | 98.57% | 93.33% | 100.00% | 98.57% |
| verify.cjs | 93.68% | 80.67% | 100.00% | 93.68% |
| windsurf.js | 91.20% | 72.73% | 83.33% | 91.20% |
| windsurf.js | 100.00% | 100.00% | 100.00% | 100.00% |

### Utility Modules

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| build-hooks.js | 98.26% | 93.75% | 100.00% | 98.26% |
| check-doc-drift.cjs | 98.66% | 91.71% | 89.74% | 98.66% |
| checkpoint.cjs | 97.19% | 77.27% | 100.00% | 97.19% |
| config.cjs | 94.87% | 80.00% | 100.00% | 94.87% |
| daily.cjs | 95.22% | 60.34% | 100.00% | 95.22% |
| frontmatter.cjs | 93.96% | 84.24% | 100.00% | 93.96% |
| gsd-check-update.js | 100.00% | 100.00% | 100.00% | 100.00% |
| gsd-config-protection.js | 100.00% | 100.00% | 0.00% | 100.00% |
| gsd-context-monitor.js | 97.22% | 92.11% | 0.00% | 97.22% |
| gsd-spawn-tracker.js | 100.00% | 85.00% | 100.00% | 100.00% |
| gsd-statusline.js | 95.80% | 73.53% | 0.00% | 95.80% |
| harden-repo.cjs | 83.33% | 70.67% | 90.91% | 83.33% |
| history.cjs | 96.14% | 90.74% | 100.00% | 96.14% |
| lesson-capture-gate.cjs | 95.04% | 90.06% | 100.00% | 95.04% |
| milestone.cjs | 93.63% | 80.70% | 100.00% | 93.63% |
| model-profiles.cjs | 100.00% | 100.00% | 100.00% | 100.00% |
| profile-output.cjs | 92.33% | 71.66% | 94.74% | 92.33% |
| profile-pipeline.cjs | 83.67% | 70.14% | 84.62% | 83.67% |
| roadmap.cjs | 98.78% | 88.66% | 100.00% | 98.78% |
| template.cjs | 99.10% | 74.29% | 100.00% | 99.10% |
| uat-patterns.cjs | 100.00% | 100.00% | 100.00% | 100.00% |
| uat-runner.cjs | 88.48% | 75.00% | 100.00% | 88.48% |
| uat.cjs | 92.20% | 78.21% | 100.00% | 92.20% |
| validate-doc-links.cjs | 97.36% | 95.73% | 100.00% | 97.36% |
| workstream.cjs | 99.01% | 86.71% | 100.00% | 99.01% |

## Summary by Tier

| Tier | Modules | Avg Lines | Avg Branches | Avg Functions |
|------|---------|-----------|-------------|---------------|
| Security-Critical | 2 | 100.00% | 98.15% | 50.00% |
| Operational | 42 | 95.30% | 87.33% | 93.99% |
| Utility | 25 | 95.61% | 84.42% | 86.40% |
| **Overall** | **69** | **95.55%** | **86.59%** | **89.97%** |

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
Expanded baseline: 95.55% lines, 86.59% branches, 89.97% functions (69 modules)
