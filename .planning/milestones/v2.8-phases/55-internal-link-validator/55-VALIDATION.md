---
phase: 55
slug: internal-link-validator
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 55 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert` |
| **Config file** | None (auto-discovered by `scripts/run-tests.cjs`) |
| **Quick run command** | `node --test tests/validate-doc-links.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds for the file alone; ~30s for full suite |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/validate-doc-links.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green; coverage held at ≥91% line / ≥83% branch
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 55-01-01 | 01 | 1 | DOCLINK-01..04 | unit (fixtures) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-01-02 | 01 | 1 | DOCLINK-02 | unit (`toGfmSlug`, `extractHeadingSlugs`) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-01-03 | 01 | 1 | DOCLINK-01, DOCLINK-02 | unit (`extractLinks`, `validateLink`) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-01-04 | 01 | 1 | DOCLINK-03 | unit (`formatTable`) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-02-01 | 02 | 2 | DOCLINK-01, DOCLINK-04 | unit (`discoverTrackedFiles`) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-02-02 | 02 | 2 | DOCLINK-04 | integration (`spawnSync`) | `node --test tests/validate-doc-links.test.cjs` | ❌ W0 | ⬜ pending |
| 55-02-03 | 02 | 2 | coverage tracking | `npm run test:coverage` | `npm run test:coverage` | ✅ | ⬜ pending |
| 55-03-01 | 03 | 3 | acceptance | manual + `npm test` | `node scripts/validate-doc-links.cjs && npm test` | ✅ | ⬜ pending |
| 55-03-02 | 03 | 3 | doc sync | manual | `grep -E "validate-doc-links" CLAUDE.md README.md docs/DEVOPS-HANDOFF.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/validate-doc-links.test.cjs` — unit + integration tests for DOCLINK-01..04
- [ ] `tests/fixtures/doc-links/clean/` — files where every link resolves
- [ ] `tests/fixtures/doc-links/broken/` — files with broken file refs and broken anchors
- [ ] `tests/fixtures/doc-links/edge/` — fenced code, traversal, URL-encoded, no-headings, duplicate-headings
- [ ] `scripts/validate-doc-links.cjs` — script with `require.main === module` guard so functions are exportable for tests
- [ ] `.c8rc.json` — add `scripts/validate-doc-links.cjs` to the `include` array

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-repo clean pass | DOCLINK-04 (clean exit) | Depends on actual repo state — Phase 57 backfills broken refs separately; in Phase 55 we just observe and document | After Wave 2 lands, run `node scripts/validate-doc-links.cjs` from repo root. Record findings in plan 55-03 review section. |
| Doc sync (CLAUDE.md, README.md, DEVOPS-HANDOFF.md mention the new script) | acceptance | Documentation updates have no automated assertion in Phase 55 — DOCDRIFT covers numeric drift in Phase 56 | After Wave 3, grep each living doc for `validate-doc-links` and confirm a description exists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (the test file, fixtures, the script itself, .c8rc include)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner produces plans satisfying this contract)

**Approval:** pending
