# CONDUCTOR — Phase 02 (stub)
# Frontier Review Lane

**GSD lifecycle state:** stub — flesh out at PHASE_DISCUSSING. Premature detail rots before execution.

## What you're building
`codex-delegate`; the review pipeline with never-self-review enforced structurally; blind judging (provenance stripped before any model judges candidates); the frontier consensus gate for irreversible operations (Codex + Gemini must concur; Grok red-teams advisory; dissent surfaces to Connor by name); tournament mode behind an explicit off-by-default flag, judged by executable tests wherever a test harness exists.

## Gates (summary)
Unique-defect yield vs single-model baseline on the phase-02 stratified benchmark; blind-vs-labeled judging agreement check; consensus gate refuses when either frontier reviewer dissents; `/gsd:verify-work` green.

## Rollback
Disable codex-delegate; phase-01 stands alone.

## Flywheel scope added in v2.1 (from adjudication data phase-01 begins collecting)
Per-model capability profiles mined from adjudication records, calibrating routing weights from ground truth; adjudicated true positives snapshotted into the stratified benchmark as a self-growing golden set; a pre-mortem prompt variant for plan critique ("this plan failed in production 30 days ago — write the incident report"); a counterfactual replay harness that re-runs provenance-pinned past delegations against new model releases and diffs outcomes, making every local-model upgrade evidence-based.
