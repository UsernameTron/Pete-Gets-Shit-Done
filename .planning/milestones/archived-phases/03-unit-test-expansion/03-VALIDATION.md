---
phase: 3
slug: unit-test-expansion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node --test) + c8 11.0.0 |
| **Config file** | scripts/run-tests.cjs (custom runner) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | UNIT-01 | unit | `npm test 2>&1 \| grep -A2 'governance'` | Partial | ⬜ pending |
| 03-02-01 | 02 | 1 | UNIT-02 | unit | `npm test 2>&1 \| grep -A2 'plugin\|dispatch\|skill'` | Partial | ⬜ pending |
| 03-03-01 | 03 | 1 | UNIT-03 | unit | `npm test 2>&1 \| grep -A2 'hook'` | Partial | ⬜ pending |
| 03-04-01 | 04 | 2 | UNIT-04 | unit | `npm test 2>&1 \| grep -A2 'command'` | Partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/prompt-guard-hook.test.cjs` — stubs for UNIT-03 (gsd-prompt-guard.js)
- [ ] `tests/workflow-guard-hook.test.cjs` — stubs for UNIT-03 (gsd-workflow-guard.js)
- [ ] `tests/context-monitor-hook.test.cjs` — stubs for UNIT-03 (gsd-context-monitor.js)
- [ ] `tests/statusline-hook.test.cjs` — stubs for UNIT-03 (gsd-statusline.js)
- [ ] `tests/check-update-hook.test.cjs` — stubs for UNIT-03 (gsd-check-update.js)
- [ ] `tests/build-hooks.test.cjs` — stubs for UNIT-03 (build-hooks.js)
- [ ] Hook test helper function (runHook) in tests/hook-helpers.cjs

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
