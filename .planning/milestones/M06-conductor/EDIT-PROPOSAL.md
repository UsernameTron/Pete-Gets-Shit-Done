# EDIT-PROPOSAL — Factory `.planning/` Integration for M06-conductor (v2)

The factory repo has live `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `tasks/todo.md`. Apply these edits on drop-in — never replace live files. One project, one state, new milestone.

## 1. Drop-in
```bash
cp -R conductor/milestones/M06-conductor ~/projects/Pete-Gets-Shit-Done/.planning/milestones/
```
If index 06 is taken, renumber the directory; content is index-agnostic.

## 2. ROADMAP.md — append
```markdown
## M06 — CONDUCTOR (Extension Factory Phase 6)
Multi-harness orchestration: Claude Code as sole writer and approved processor of record;
Grok Build (local) and Gemini as structurally read-only delegates; Codex lane in phase-02.
Governance: Option A — approved-cloud; "air-gapped" applies to the Grok-local lane only.
Architecture of record: conductor-phase6-proposal.md as amended by its supersession notice;
on conflict, phase-01-PLAN v2 wins.
Phases: 01 Contracts & Local Lane · 02 Frontier Review Lane · 03 Autonomy & Integration · 04 Repo Migration · 05 Visual Intelligence Lane
Status: phase-01 PHASE_PLANNED
```

## 3. STATE.md
```markdown
Active milestone: M06-conductor
Active phase: phase-01 (Contracts & Local Lane, v2) — PHASE_PLANNED
Next action: execute phase-01-PLAN.md Session 1; advance to PHASE_EXECUTING on first commit
```

## 4. tasks/todo.md — prepend
```markdown
- [ ] M06/phase-01 — execute Session 1 per phase-01-PLAN v2 (probe, contracts, lib, both adapters, first logged delegation)
- [ ] M06/phase-01 — Session 2: router, fixtures, all eight gates
- [ ] M06/phase-01 — deliver benchmark smoke report (10 seeded + 5 clean); threshold decision deferred to phase-02 stratified set
```

## 5. PROJECT.md — one line
`Phase 6 — CONDUCTOR multi-harness orchestration (M06; accepted 2026-07-17; plan v2).`

## 6. Commit
```bash
cd ~/projects/Pete-Gets-Shit-Done && git add .planning tasks && git commit -m "M06-conductor: phase-01 v2 PHASE_PLANNED"
```
