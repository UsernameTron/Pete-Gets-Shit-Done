# Phase 5: CI Pipeline Hardening - Discussion Log

**Date:** 2026-03-26
**Mode:** Advisor (all areas discussed)

## Gray Areas Identified

### GA-1: base64-scan.sh Timeout Root Cause & Fix Strategy
**Question:** Script already has binary file exclusion. Where does timeout come from and what's the fix?
**Options considered:** Per-file size cap, per-file timeout, total scan timeout, read loop optimization
**Decision:** Size cap (1MB) + total scan timeout (3 min, exit 0 with warning). Per-file timeout rejected as overengineered. Line-by-line read loop on large text files (package-lock.json) identified as likely culprit.

### GA-2: Coverage Report Format and Upload Strategy
**Question:** Where does the coverage report go? External service or self-contained?
**Options considered:** (a) GitHub Actions job summary, (b) Codecov/Coveralls, (c) artifact upload, (d) PR comment
**Decision:** Option A — inline markdown table in job summary. Plus lcov artifact upload for manual drill-down. No external services. Self-contained.

### GA-3: Windows Shell Compatibility
**Question:** Should Windows CI run governance/security shell scripts?
**Options considered:** Full pipeline on all platforms, tests-only on non-Linux, skip shell scripts on Windows/macOS
**Decision:** Linux runs everything (tests + governance + security). macOS and Windows run Node.js tests only. Shell-based checks are Linux-only. Not worth the effort to port.

### GA-4: CI Coverage Threshold Enforcement
**Question:** Should CI enforce a minimum coverage threshold?
**Options considered:** Hard gate (fail CI), advisory (warning only), no enforcement
**Decision:** Advisory only. 80% floor — if coverage drops below, CI warns in job summary but does NOT fail. Per-module enforcement deferred. Hard gating creates perverse incentives.

## Deferred to Future Milestones
- Per-module coverage enforcement
- Coverage badges / external services
- Windows governance script compatibility
