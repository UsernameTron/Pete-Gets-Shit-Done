---
phase: 28-stale-reference-cleanup
plan: 01
status: complete
---

## Summary: Plan 28-01

### Changes Made
- **commands/gsd/research-phase.md** — Replaced 4 instances of `gsd-phase-researcher` with `gsd-research-orchestrator` (scope: phase) in objective description, resolve-model call, section heading, and success criteria. Left existing `gsd-research-orchestrator` references on lines 28 and 145 untouched as instructed.
- **commands/gsd/plan-phase.md** — Replaced 1 instance of `gsd-plan-checker` with `gsd-verifier (scope: plan)` in the orchestrator role description.
- **commands/gsd/crew.md** — Replaced 11 stale references across ASCII roster (PLANNING, RESEARCH, VALIDATION groups), spawning map (5 lines updated), detail example (Works with section), and recommend example (2 agent entries). Collapsed checker entries to gsd-verifier with scope parameters. Collapsed researcher entries to gsd-research-orchestrator with scope parameters.
- **governance/templates/global/CLAUDE.md** — Replaced Phase 3 Quality Gates section: removed gsd-plan-checker, gsd-integration-checker, and generic gsd-verifier entries; replaced with gsd-verifier (scope: plan), gsd-verifier (scope: integration), and gsd-verifier (scope: nyquist).

### Verification
- Task 1 verify: `grep` for all 5 stale names across 3 command files returned EXIT:1 (zero hits)
- Task 2 verify: `grep` for 3 stale checker names in governance template returned EXIT:1 (zero hits)
- Final sweep: `grep -rn` across all 4 files for all 5 stale agent names returned EXIT:1 (zero hits)
- Positive check: confirmed gsd-verifier and gsd-research-orchestrator appear in all expected locations with correct scope parameters

### Issues
- None
