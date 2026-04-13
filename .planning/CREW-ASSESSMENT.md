---
assessment_date: 2026-04-13
crew_size: 21 active agents (18 GSD + 3 project-scoped); 7 archived
mode: diagnostic
---

# GSD Crew Assessment — 2026-04-13

Diagnostic report only. No remediation plans, no architectural proposals, no gray-area questions. Findings with citations.

---

## COVERAGE

**Agents discovered:** 18 active GSD + 3 project-scoped + 7 archived (`agents/_archived/`).

### Workflow → Agent Map (verified via grep)

| Command | Agents spawned |
|---------|----------------|
| `/gsd:discuss-phase` | advisor-researcher, planner, research-orchestrator |
| `/gsd:discuss-phase-assumptions` | assumptions-analyzer, planner, research-orchestrator |
| `/gsd:plan-phase` | planner, research-orchestrator, verifier |
| `/gsd:execute-phase` | codebase-mapper, debugger, executor, planner, research-orchestrator, ui-auditor, ui-checker, ui-researcher, verifier |
| `/gsd:verify-work` | planner, verifier |
| `/gsd:validate-phase` | verifier |
| `/gsd:ship` | validator-hub |
| `/gsd:ui-phase` | ui-researcher, ui-checker |
| `/gsd:ui-review` | ui-auditor |
| `/gsd:debug` | debugger |
| `/gsd:map-codebase` | codebase-mapper |
| `/gsd:audit-deps` | dependency-auditor |
| `/gsd:audit-agents` | ecosystem-auditor |
| `/gsd:new-project`, `/gsd:new-milestone` | research-orchestrator, research-synthesizer, roadmapper |
| `/gsd:research-phase` | research-orchestrator |
| `/gsd:profile-user` | user-profiler |
| `/gsd:quick` | planner, executor, verifier |
| `/gsd:fast` | (none — inline) |

### Gaps (workflow stages lacking a dedicated agent)

1. **Discover / stack-analysis** — `gsd-stack-analyzer` exists but no `/gsd:` command references it. (`agents/gsd-stack-analyzer.md` — orphaned since PR #46 merge 2026-04-10)
2. **Forensics** — `/gsd:forensics` spawns only `gsd-debugger`; no issue-classification agent for non-bug cases.
3. **Workstream coordination** — `/gsd:workstreams` references agent name `gsd-workspaces`, which does not resolve to a .md file.
4. **Review coordination** — `/gsd:review` references prefix patterns (`gsd-review-claude-*`, `gsd-review-codex-*`, `gsd-review-gemini-*`, `gsd-review-prompt-*`) that do not resolve to any agent file.
5. **Update/patch management** — `/gsd:update`, `/gsd:reapply-patches` reference `gsd-build`, `gsd-check-update`, `gsd-update-check`, `gsd-local-patches` — none exist.
6. **Plan-milestone-gaps** — `/gsd:plan-milestone-gaps` spawns no agents.
7. **Milestone completion audit** — `/gsd:audit-milestone` routes to no dedicated milestone auditor agent. (Archived `gsd-nyquist-auditor` was consolidated into `gsd-verifier` scope=nyquist, but no command routes there.)

### Orphan agents (never referenced)

- **`gsd-stack-analyzer`** — 0 references in `commands/` or `workflows/`. Frontmatter description claims spawn by `/gsd:discuss-phase` or `/gsd:map-codebase`; neither references it. (`agents/gsd-stack-analyzer.md:description`)

### Description/reality mismatches

- **`gsd-stack-analyzer`** — claims spawn sites that don't exist (see above).
- **`gsd-user-profiler`** — description says "profile orchestration workflows" (plural); only `/gsd:profile-user` spawns it.
- **`gsd-assumptions-analyzer`** — description says "discuss-phase assumptions mode"; actual spawn is `/gsd:discuss-phase-assumptions` (conditional on `DISCUSS_MODE` config).
- **`gsd-research-synthesizer`** — description says "after 4 researcher agents complete"; only `gsd-research-orchestrator` exists, so the "4" count is phantom.

---

## OVERLAPS

### High severity (>80%)
None.

### Medium severity (60–80%)

**`gsd-validator-hub` (target=ecosystem) ↔ `gsd-ecosystem-auditor`**
Both inspect agent ecosystems: frontmatter schema, tool/permission consistency, hygiene compliance, structural correctness.
- `gsd-validator-hub.md:191-310` (ecosystem mode)
- `gsd-ecosystem-auditor.md:61-219`

Boundary is undocumented — dispatch is inferable only from routing code (`/gsd:ship` → validator-hub; `/gsd:audit-agents` → ecosystem-auditor). Substantial check overlap.

### Low severity (identical tools, distinct roles)

Read-only BLOCK/FLAG/PASS quality gates sharing `Read, Bash, Glob, Grep`: `gsd-verifier`, `gsd-dependency-auditor`, `gsd-ui-checker`. Domains are distinct (code goals / dependencies / UI design) — overlap is tool surface, not responsibility.

### Clean unifications (flagged for completeness)

- `gsd-verifier` — scopes: general | plan | integration | nyquist. Archived peers: `gsd-nyquist-auditor`, `gsd-plan-checker`, `gsd-integration-checker`.
- `gsd-research-orchestrator` — scope: phase | project. Archived peers: `gsd-phase-researcher`, `gsd-project-researcher`.
- `gsd-validator-hub` — target: extension | ecosystem. Archived peer: `extension-validator`, `validator`. (Ecosystem mode still overlaps with `gsd-ecosystem-auditor` — see Medium above.)

---

## QUALITY SCORES

Rubric (0–10): frontmatter completeness (2) + role clarity (2) + model_rationale + scope_guard (2) + anti_patterns ≥6 rules (2) + completion_criteria (2).

| Agent | Score | Key deficiency |
|-------|-------|----------------|
| gsd-planner | 10/10 | — (reference standard, PR #41) |
| gsd-verifier | 10/10 | — (reference standard, PR #39) |
| gsd-executor | 10/10 | — (full defense-in-depth, PR #45) |
| gsd-debugger | 10/10 | — (full defense-in-depth, PR #40) |
| gsd-advisor-researcher | 9/10 | Missing `model_rationale` body; weak `anti_patterns` |
| gsd-assumptions-analyzer | 9/10 | Missing `model_rationale`; embedded anti-patterns not numbered |
| gsd-codebase-mapper | 9/10 | Missing `<project_context>` section |
| gsd-dependency-auditor | 9/10 | No explicit `anti_patterns` section |
| gsd-ecosystem-auditor | 9/10 | No explicit `anti_patterns` section |
| gsd-research-orchestrator | 9/10 | Scope detection in docstring, not body handler |
| gsd-research-synthesizer | 9/10 | Weak `anti_patterns` (not numbered) |
| gsd-roadmapper | 9/10 | Missing `<project_context>` section |
| gsd-ui-auditor | 9/10 | Hex color literal (`#F472B6`) — convention uses CSS names |
| gsd-ui-researcher | 9/10 | Hex color literal (`#E879F9`) — convention uses CSS names |
| gsd-user-profiler | 9/10 | No explicit "mandatory read" instruction for reference doc |
| gsd-stack-analyzer | 9/10 | `Bash` in tools list but scope_guard forbids modification — misleading |
| gsd-validator-hub | 8/10 | Missing `isolation`, `maxTurns`; weak scope-selection handler |
| gsd-ui-checker | 8/10 | **BLOCKER: no explicit `model:` field in frontmatter** |
| plugin-developer | 7/10 | No `permissionMode`, `maxTurns`, `isolation`, explicit `model`, `<anti_patterns>` |
| test-runner | 7/10 | Same as plugin-developer |
| docs-sync | 7/10 | Same as plugin-developer |

### Defense-in-depth hygiene status

| Status | Agents |
|--------|--------|
| **Complete** (all 4 hygiene sections + frontmatter) | gsd-planner, gsd-verifier, gsd-executor, gsd-debugger |
| **Partial** (1–2 gaps) | gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-codebase-mapper, gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-stack-analyzer, gsd-ui-auditor, gsd-ui-checker, gsd-ui-researcher, gsd-user-profiler, gsd-validator-hub |
| **Not started** (minimal frontmatter, no body sections) | plugin-developer, test-runner, docs-sync |

### Blockers

1. **`gsd-ui-checker` — missing `model:` field** (`agents/gsd-ui-checker.md:1-20`). Violates GSD "every agent must declare model explicitly" rule.
2. **Three project agents missing defense-in-depth frontmatter** (`.claude/agents/plugin-developer.md`, `test-runner.md`, `docs-sync.md` — each has only `name`, `description`, `tools`).

---

## BOTTLENECKS & EFFICIENCY

### Spawn frequency (v2.0–v2.2)

| Agent | Spawns | Context |
|-------|--------|---------|
| gsd-verifier | 7 | Most frequent — multi-scope verification |
| gsd-validator-hub | 6 | Core for audit phases (35, 36) |
| gsd-planner | 3 | Model-routing, classification |
| gsd-debugger | 3 | Hygiene backfill activity |
| gsd-research-orchestrator | 2 | Phase 30-03 only |
| gsd-executor | 1 | v2.2 shipped without subagent delegation |
| gsd-research-synthesizer | 0 | No explicit spawn in milestone records |
| gsd-codebase-mapper | 0 | No materialized use in v2.0–v2.2 |

### Ceremony bypass

- **v2.2 Phases 39, 40** — No PLAN.md, SUMMARY.md, or VERIFICATION.md. Shipped directly from REQUIREMENTS.md. Audited `PASS` in `v2.2-MILESTONE-AUDIT.md:21`.
- **v2.0 Phase 32** — PLAN.md present, SUMMARY.md absent.
- **v2.1 Phase 38** — SUMMARY.md present, phase-level PLAN.md absent; backfilled during v2.1 audit.

### Agent-health drift

`.planning/agent-health.log:2-15` (2026-04-10T22:37:18Z): 12 agents had stale installed copies post-hygiene-backfill.
- Largest drift: `gsd-planner` (~88 lines), `gsd-debugger` (~63), `gsd-research-orchestrator` (~54).
- Minimal drift: `gsd-validator-hub` (~2 lines).
- No execution failures observed — version mismatch only.

### Recurring artifact-creation issues

- v2.1 retrospective: "fast execution in later phases skipped artifact creation. Fix: verify-work should enforce VERIFICATION.md creation as a gate."
- v1.1 and v2.1 retrospectives both report REQUIREMENTS.md checkbox drift — `execute-phase` does not sync requirement status with task completion.

### Execution-vs-verification imbalance

Verifier + validator: 13 spawns. Executor: 1 spawn. v2.1–v2.2 were audit-heavy milestones; imbalance reflects milestone mix, not necessarily a structural bottleneck.

---

## SUMMARY

| Dimension | Finding |
|-----------|---------|
| Active agents | 21 (18 GSD + 3 project-scoped) |
| Archived | 7 |
| Orphan agents | 1 (`gsd-stack-analyzer`) |
| Coverage gaps | 7 lifecycle areas (incl. 3 with phantom agent references) |
| Medium-severity overlaps | 1 (`validator-hub` ↔ `ecosystem-auditor`) |
| Gold-standard agents (10/10) | 4 |
| Blocking quality issues | 2 (`gsd-ui-checker` model field; 3 project agents hygiene) |
| Ceremony-bypass phases | 3 (v2.0-P32, v2.1-P38, v2.2-P39+P40) |
| Drift events | 1 (2026-04-10, 12 agents stale) |

---

Assessment complete. Run `/gsd:plan-phase` on a specific finding if you want to act on it.
