# Phase 49: One-Command Install - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 49-one-command-install
**Areas discussed:** Entry point design, Health verification scope, Idempotency and update behavior, Error recovery

---

## Entry Point Design

| Option | Description | Selected |
|--------|-------------|----------|
| Shell script (`./install.sh`) | Traditional Unix approach, needs chmod | |
| npm script (`npm run setup`) | Stays in Node ecosystem, cross-platform | ✓ |
| Makefile target | Common for C/Go projects, less natural for Node | |
| Node direct (`node bin/setup-from-clone.js`) | Works but no npm lifecycle integration | |

**User's choice:** npm script — `"setup": "node bin/setup-from-clone.js"` in package.json
**Notes:** The one-command flow is `git clone && cd Pete-Gets-Shit-Done && npm run setup`. Script calls npm install internally, then runs `bin/install.js --claude` (Claude-only, no runtime prompt — personal tool). No shell scripts or Makefiles.

---

## Health Verification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (files exist) | Check symlinks and hooks exist at expected paths | |
| Moderate (files + config) | Files exist + plugins registered + patterns copied | |
| Comprehensive (files + config + tests) | All of the above + run full test suite | ✓ |

**User's choice:** Comprehensive — verify commands count matches, hooks exist and executable, plugins registered in enabledPlugins, injection-patterns.json copied, npm test passes with 0 failures
**Notes:** Report results in pass/fail table matching GSD's UAT format

---

## Idempotency and Update Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Clean reinstall | Remove and redo everything each time | |
| Incremental (detect and skip) | Skip what's already done, update what's outdated | ✓ |
| Force flag | Default to skip, `--force` for clean reinstall | |

**User's choice:** Incremental — detect what's done, skip matching, update outdated (source newer than installed). Report skipped vs updated. Safe to run after every git pull.
**Notes:** No force flag needed. Idempotency makes re-running the natural fix for any issues.

---

## Error Recovery

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast on everything | Stop at first error | |
| Fail fast critical, continue non-critical | Critical steps halt; non-critical collected and reported | ✓ |
| Continue everything, report at end | Never halt, always try all steps | |
| Rollback on failure | Undo completed steps when something fails | |

**User's choice:** Fail fast with diagnostics on critical steps (npm install, hook installation). Continue past non-critical failures (individual symlink permission issues) but collect and report at end. No rollback.
**Notes:** Partial installs are better than no install. Re-running fixes them since the script is idempotent.

---

## Claude's Discretion

- Internal function decomposition of setup-from-clone.js
- Source-vs-installed freshness detection method (mtime vs content hash)
- How to invoke install.js (child_process vs require)
- Pass/fail table formatting details

## Deferred Ideas

None — discussion stayed within phase scope
