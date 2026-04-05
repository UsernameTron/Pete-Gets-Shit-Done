---
phase: 2
slug: coverage-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) + c8 v11.0.0 |
| **Config file** | None — c8 configured via CLI flags in package.json |
| **Quick run command** | `npm test` |
| **Full suite command** | `npx c8 --reporter text --reporter json --all --include 'get-shit-done/bin/lib/*.cjs' --include 'get-shit-done/bin/gsd-tools.cjs' --include 'bin/install.js' --include 'hooks/*.js' --include 'scripts/build-hooks.js' --exclude 'hooks/dist/**' --exclude 'tests/**' node scripts/run-tests.cjs` |
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
| 2-01-01 | 01 | 1 | COV-01 | smoke | `npm run test:coverage` — verify output includes all expected modules | N/A (output validation) | ⬜ pending |
| 2-01-02 | 01 | 1 | COV-02 | manual | Visual inspection of `docs/coverage-gaps.md` | N/A (document artifact) | ⬜ pending |
| 2-01-03 | 01 | 1 | COV-03 | smoke | `test -f docs/coverage-baseline.md && git log --oneline docs/coverage-baseline.md` | N/A (file existence check) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. c8 v11.0.0 is installed, test runner works, no new frameworks needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gap analysis priority ranking | COV-02 | Document quality requires human judgment | Review `docs/coverage-gaps.md` — verify security-critical > operational > utility ranking is correct and complete |
| Shell script inventory accuracy | COV-02 | Binary tested/untested status needs verification against actual test files | Cross-check each shell script entry against `governance/tests/` directory |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
