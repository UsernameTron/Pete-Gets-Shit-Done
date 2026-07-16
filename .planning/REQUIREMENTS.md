# Requirements — v3.0 Milestone-Close Hardening

**Milestone goal:** Close the two runtime-safety gaps the v2.9 close-out surfaced — milestone close-out that works on a protected `main`, and hook enforcement reproducible from a fresh clone.

**Scoped:** 2026-07-15. Phase numbering continues from 59 (v3.0 starts at phase 60).

---

## v3.0 Requirements

### MERGE — protected-main close-out path (v2.9 audit item 6)

- [x] **MERGE-01**: When `main` is branch-protected (PR-only), `complete-milestone`'s branch-handling step merges the close-out branch via `gh pr merge` (CI-gated squash) instead of the local `git checkout main; git merge --squash; git push` path that protection rejects.
- [x] **MERGE-02**: When `main` is unprotected, the existing local squash/merge-with-history/delete/keep options are preserved unchanged — zero behavior change for repos without protection.
- [x] **MERGE-03**: `ship-milestone` inherits the protected-main path through its `complete-milestone` delegation — no divergent merge logic in the workflow file.
- [x] **MERGE-04**: Tests assert the branch decision: protected `main` routes to PR-merge, unprotected routes to the local path.

### HOOKREG — versioned hook registration (the v2.9-deferred "HOOK-01")

- [ ] **HOOKREG-01**: A versioned settings template registers the full runtime hook set — every hook source the repo ships (7 `hooks/` sources + `lesson-capture-gate.cjs`; repo-shipped scope, not the workstation-wide 17) — so a fresh clone gets the same enforcement as the maintainer's workstation without depending on installer side effects.
- [ ] **HOOKREG-02**: `lesson-capture-gate.cjs` is registered — no shipped hook source is left unwired.
- [ ] **HOOKREG-03**: An installer contract test fails if any shipped hook source is missing from the registrations — locking reproducibility against future drift.

*(ID note: the deferred item was logged as "HOOK-01"; renamed HOOKREG here because HOOK-01..03 shipped in v2.3 and HOOK-04 in v2.4 — REQ-IDs continue numbering, never reuse.)*

---

## Future Requirements (deferred)

- **BITTER_LESSON_LOG DEFERRED items** (15 logged, Phase 57.1) — lightweight follow-on pass, not milestone scope (operator decision 2026-07-15).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automating `complete-milestone`'s 3 internal prompts | They stay live-human by design (SHIP-03, v2.9) — the protected-main fix changes *how* the merge happens, never *whether* to ask |
| CI-provider abstraction for the PR-merge path | GitHub (`gh`) only, consistent with the project-wide GitHub-Actions-only stance |
| Auto-detecting/modifying branch-protection settings | Read-only detection is fine; GSD never edits repo protection rules |
| BITTER_LESSON_LOG cleanups + env-gotcha fixes | Hygiene follow-on, deliberately excluded to keep v3.0 tight |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MERGE-01 | Phase 60 | Complete (2026-07-15) |
| MERGE-02 | Phase 60 | Complete (2026-07-15) |
| MERGE-03 | Phase 60 | Complete (2026-07-15) |
| MERGE-04 | Phase 60 | Complete (2026-07-15) |
| HOOKREG-01 | Phase 61 | Pending |
| HOOKREG-02 | Phase 61 | Pending |
| HOOKREG-03 | Phase 61 | Pending |

**Coverage:**
- v3.0 requirements: 7 total
- Mapped to phases: 7/7
- Unmapped: 0

---
*Requirements defined: 2026-07-15*
*Last updated: 2026-07-15 — Phase 60 complete (MERGE-01..04); HOOKREG-01..03 remain (Phase 61).*
