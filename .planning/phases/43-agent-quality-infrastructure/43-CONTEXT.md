---
phase: 43-agent-quality-infrastructure
created: "2026-04-13"
source: autonomous
---

# Phase 43 Context: Agent Quality Infrastructure

## Scope

Three quality enhancements to GSD's agent ecosystem:

1. **QUAL-01**: 4D scoring rubric in gsd-verifier (security 35%, perf 25%, correctness 25%, maint 15%)
2. **QUAL-02**: Three-part necessity gate for subagent creation (context pollution, parallelizability, specialization)
3. **QUAL-03**: Two-mode verification in verify-work (compliance + schema)

## Key Files

- `agents/gsd-verifier.md` — existing agent to extend with rubric (QUAL-01)
- `get-shit-done/references/agent-necessity-gate.md` — new reference doc (QUAL-02)
- `get-shit-done/workflows/verify-work.md` — existing workflow to extend (QUAL-03)
- `tests/agent-quality.test.cjs` — new test file for all 3 requirements

## Constraints

- Zero-dependency (markdown-only changes for QUAL-01/02, workflow changes for QUAL-03)
- No breaking changes to existing verification behavior
- Existing tests must continue passing
