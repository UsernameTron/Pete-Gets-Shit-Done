# Requirements — v2.9 Autonomous Workflows Completion

**Milestone goal:** Harden the last `/gsd:finalize` fragility and build the shelved `ship-milestone` workflow (W7) that depends on it, closing the autonomous-workflows suite.

**Scoped:** 2026-07-13. Phase numbering continues from 57 (v2.9 starts at phase 58).

---

## v2.9 Requirements

### FINALIZE — harden the last fragility

- [ ] **FIN-01**: `/gsd:finalize` Gate 5.5 spawns `repo-doc-architect` only when that agent resolves in the current install; when it is unavailable (e.g. `claude-mcp-ecosystem` not enabled), the gate skips with a logged notice and finalization continues instead of dangling on a failed spawn.
- [ ] **FIN-02**: `/gsd:finalize` is exercised end-to-end on a real milestone close-out (the re-verification the autonomous-workflows design lists as an open unshelve precondition), confirming every push sits behind its consent gate and no step performs an ungated remote operation.

### SHIP-MILESTONE — build W7

- [ ] **SHIP-01**: A `ship-milestone` workflow (`get-shit-done/workflows/ship-milestone.md`) composes the proven finalizer critical path (health → audit-agents → sync-docs → coverage+drift → audit-milestone → ship/ci-watch → complete-milestone) with exactly 2 gates: a conditional audit-verdict gate (fires only when the audit is not `passed`) and a complete-milestone authorization gate before the irreversible tag/archive/branch cluster.
- [ ] **SHIP-02**: `ship-milestone` is routed via `/gsd:do` as a `workflow:ship-milestone` row (first-match-ordered above `/gsd:complete-milestone`), and its shelved status is lifted in the design doc and any status surface that names it.
- [ ] **SHIP-03**: `complete-milestone`'s three internal prompts (archive phases, branch handling, tag push) continue to fire and stay human — `ship-milestone`'s Gate 2 authorizes *starting* the completion sequence, never auto-answers branch deletion or tag push.
- [ ] **SHIP-04**: Structural test coverage for `ship-milestone` — the `/gsd:do` routing contract includes it, its referenced `/gsd:` commands all resolve, and it holds no more than 2 gates.

---

## Future Requirements (deferred)

- **HOOK-01** (deferred from v2.9): version the hook registrations (settings template + installer contract test) so a fresh clone gets the same runtime safety net — the ecosystem map's flagged top gap. Deferred to keep v2.9 tight; it is hygiene, not a workflow.
- Second-pass autonomy items already shipped (quick-change W4, bug-to-branch W3) — no longer pending.

## Out of Scope

- Re-opening the two already-fixed finalize issues (ungated pushes, `allowed-tools` mismatch) — resolved by the `finalize-push-consent` blueprint (2026-07-12); FIN-02 re-verifies them but does not re-implement.
- Automating `ship-milestone` to L3 — the tag/archive/branch-delete cluster keeps it L2 (supervised) by design; full unattended milestone completion is explicitly not a goal.
- Retroactively converting the already-shipped W1–W13 workflows into GSD phases — they shipped as standalone PRs and stay that way.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIN-01 | Phase 58 | Pending |
| FIN-02 | Phase 58 | Pending |
| SHIP-01 | Phase 59 | Pending |
| SHIP-02 | Phase 59 | Pending |
| SHIP-03 | Phase 59 | Pending |
| SHIP-04 | Phase 59 | Pending |
