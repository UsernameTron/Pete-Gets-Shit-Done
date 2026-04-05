# Requirements: get-shit-done-cc

**Defined:** 2026-04-05
**Core Value:** Zero-dependency spec-driven development plugin for Claude Code
**Milestone:** v2.0 Intelligence Layer

## v2.0 Requirements

Make the GSD engine smarter — route models by task complexity, learn from execution history, adapt workflow behavior automatically. All work must remain zero-dependency CommonJS. File-based storage only.

### Phase 30 — Dynamic Model Selection

- [ ] **INTEL-01**: Add `taskContext` optional parameter to `resolveModelInternal()` — when present, enables dynamic routing; when absent, preserves exact v1.9 behavior.
- [ ] **INTEL-02**: Create `dynamicSelect(agentType, taskContext, config)` function in model-profiles.cjs that maps task signals (file count, plan complexity, phase type) to model tier selection.
- [ ] **INTEL-03**: Define complexity-to-tier mapping rules: `trivial` → budget tier, `standard` → balanced tier, `complex` → quality tier, `critical` → quality tier with override logging.
- [ ] **INTEL-04**: Add `routing_strategy` config key (values: `static`, `dynamic`, `auto`) defaulting to `static` so existing users see zero behavior change.
- [ ] **INTEL-05**: Wire `taskContext` through `cmdInitExecutePhase()` and `cmdInitPlanPhase()` — extract signals from phase info, plan inventory, and roadmap requirements.
- [ ] **INTEL-06**: Add cost-awareness: when `routing_strategy: 'dynamic'`, log model selection rationale to debug output via `debugLog()` so users can see why a model was chosen.

### Phase 31 — Task Classification & Adaptive Workflows

- [ ] **INTEL-07**: Create `classifyTask(phaseInfo, planInventory, context)` function returning `{ complexity, signals, confidence }` with complexity levels: trivial, standard, complex, critical.
- [ ] **INTEL-08**: Signal extraction: file count from plan, requirement count, phase type (research/execute/verify), dependency depth, historical failure rate (when history available).
- [ ] **INTEL-09**: Create `adaptWorkflowGates(taskContext, config)` that returns adjusted config overrides: skip research for trivial tasks, increase verification rigor for complex/critical, adjust parallelization wave size.
- [ ] **INTEL-10**: Wire `classifyTask()` into execute-phase and plan-phase init commands — classification result included in init output JSON.
- [ ] **INTEL-11**: Add `workflow.adaptive` config key (boolean, default: false) gating all adaptive behavior behind a feature flag.
- [ ] **INTEL-12**: Classification transparency: include `task_classification` object in init output so workflow prompts can reference it.

### Phase 32 — Execution History & Pattern Learning

- [ ] **INTEL-13**: Create `recordExecution(cwd, phaseNum, planNum, outcome)` that appends JSONL records to `.planning/history/executions.jsonl` — fields: timestamp, phase, plan, agent, model_used, duration_ms, outcome, error_code, files_changed.
- [ ] **INTEL-14**: Create `queryHistory(cwd, filters)` that reads executions.jsonl and returns filtered/aggregated results — supports filtering by agent, phase range, outcome, date range.
- [ ] **INTEL-15**: Create `detectPatterns(cwd)` that analyzes history for: frequently-failing phases, agents that consistently need quality tier, average execution times by complexity, cost distribution across tiers.
- [ ] **INTEL-16**: Integrate history into `dynamicSelect()` — when history exists and `routing_strategy: 'auto'`, use past agent performance to influence tier selection.
- [ ] **INTEL-17**: History hygiene: auto-rotate executions.jsonl when >1000 records (keep latest 500), add `gsd-tools history` CLI commands (list, stats, prune).
- [ ] **INTEL-18**: Wire `recordExecution()` into post-execution workflow — call from execute-phase completion, plan completion summaries, and verification outcomes.

### Phase 33 — Integration, Testing & Documentation

- [ ] **INTEL-19**: End-to-end integration test: full classify → route → execute → record → learn cycle using E2E harness with mocked LLM layer.
- [ ] **INTEL-20**: Performance verification: dynamic routing adds <5ms overhead to init commands (measured via benchmark test).
- [ ] **INTEL-21**: Update all documentation: model-profiles.md reference table, USER-GUIDE.md routing section, CONFIGURATION.md new keys, DEVOPS-HANDOFF.md updated metrics, README.md.
- [ ] **INTEL-22**: Migration path: add config migration (from: 1, to: 2) that preserves existing behavior — no existing user's config.json breaks.
- [ ] **INTEL-23**: Coverage gate: all new modules (classify.cjs, history.cjs) must achieve >=90% line coverage, model-profiles.cjs updated coverage >=90%.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Machine learning / statistical models | Zero-dependency constraint — no numpy, no ML libs. Pattern detection is rule-based |
| Persistent database (SQLite, etc.) | File-based JSONL only — matches existing .planning/ conventions |
| Breaking the existing API | All new parameters are optional, all new config keys have safe defaults |
| Real-time model benchmarking | Out of scope — model performance is inferred from execution outcomes |
| Auto-migration of model_profile to routing_strategy | Users opt in explicitly — `routing_strategy: 'static'` is the default |
| Agent skills or workflow template changes | Intelligence layer lives in lib/ infrastructure — .md workflow files are consumers |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTEL-01 | Phase 30 | Pending |
| INTEL-02 | Phase 30 | Pending |
| INTEL-03 | Phase 30 | Pending |
| INTEL-04 | Phase 30 | Pending |
| INTEL-05 | Phase 30 | Pending |
| INTEL-06 | Phase 30 | Pending |
| INTEL-07 | Phase 31 | Pending |
| INTEL-08 | Phase 31 | Pending |
| INTEL-09 | Phase 31 | Pending |
| INTEL-10 | Phase 31 | Pending |
| INTEL-11 | Phase 31 | Pending |
| INTEL-12 | Phase 31 | Pending |
| INTEL-13 | Phase 32 | Pending |
| INTEL-14 | Phase 32 | Pending |
| INTEL-15 | Phase 32 | Pending |
| INTEL-16 | Phase 32 | Pending |
| INTEL-17 | Phase 32 | Pending |
| INTEL-18 | Phase 32 | Pending |
| INTEL-19 | Phase 33 | Pending |
| INTEL-20 | Phase 33 | Pending |
| INTEL-21 | Phase 33 | Pending |
| INTEL-22 | Phase 33 | Pending |
| INTEL-23 | Phase 33 | Pending |

**Coverage:**
- v2.0 requirements: 23 total
- Mapped to phases: 23/23
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
