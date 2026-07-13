---
assessment_date: 2026-07-13
crew_size: 20 active agents (17 GSD + 3 project-scoped); 8 archived
mode: diagnostic
status: refreshed against current state (workflow-authoring initiative)
supersedes: 2026-04-13 assessment
hygiene_verdict: FLAG (2026-07-13 ecosystem audit)
---

# GSD Crew Assessment — 2026-07-13

> **Refresh of the 2026-04-13 assessment against current state.** The `agents/` roster is byte-identical since `1a609a3` (2026-04-17 doc-sync) — quality scores carry forward, verified. What changed since April is the **command/workflow layer** (wrap-and-sync, daily-startup, smart-discuss, idea-to-shipped, `/gsd:do` routing). Coverage, overlap, and efficiency were re-run against that current layer; the 2026-07-13 ecosystem hygiene audit (verdict **FLAG**) is folded in. Diagnostic report only — findings with citations, no remediation plans, no architectural proposals. The build/don't-build recommendation lives separately in `.planning/ecosystem/AGENT-EXPANSION-RECOMMENDATION.md`.

---

## COVERAGE

**Agents discovered:** 17 active GSD (`agents/gsd-*.md`) + 3 project-scoped (`.claude/agents/`) + 8 archived (`agents/_archived/`).

### Spawning map (real agent refs, by frequency — live grep)

| Count | Agent |
|------:|-------|
| 48 | gsd-verifier (execute/quick/verify-work/ship/audit-milestone/idea-to-shipped) |
| 37 | gsd-research-orchestrator |
| 35 | gsd-planner |
| 23 | gsd-executor |
| 16 | gsd-codebase-mapper |
| 14 | gsd-debugger |
| 13 / 12 / 9 | gsd-ui-researcher / gsd-ui-checker / gsd-ui-auditor |
| 12 | gsd-roadmapper |
| 6 each | gsd-user-profiler, gsd-research-synthesizer, gsd-ecosystem-auditor, gsd-dependency-auditor, gsd-assumptions-analyzer |
| 4 | gsd-advisor-researcher (`discuss-phase.md:495`) |
| 3 | gsd-validator-hub (`ship.md:140`) |

_Non-agent noise excluded: `gsd-tools` (296) = `get-shit-done/bin/gsd-tools.cjs` CLI._

### Real phantom references (NEW — April missed these)

Five agent names passed to `gsd-tools.cjs agent-skills <name>` resolve to **no** agent file. Each silently returns empty (`2>/dev/null`), so the `AGENT_SKILLS_*` hint is unpopulated while the real `subagent_type` spawn nearby uses the correct agent. Low-severity live bug (agents spawn without their skills hint):

- `gsd-checker` — `verify-work.md:36`, `quick.md:123`, `plan-phase.md:29` (real: gsd-verifier/gsd-planner)
- `gsd-synthesizer` — `new-project.md:63`, `new-milestone.md:150` (real: gsd-research-synthesizer)
- `gsd-researcher` — `plan-phase.md:27`, `research-phase.md:45` (real: gsd-research-orchestrator)
- `gsd-advisor` — `discuss-phase.md:137` (real: gsd-advisor-researcher)
- `gsd-ui-reviewer` — `ui-review.md:21` (real: gsd-ui-auditor)

**April's phantom-ref list was grep false positives** — non-agent strings still present but never real agent spawns: `gsd-workspaces` (a `~/gsd-workspaces/` path), `gsd-review-{claude,codex,gemini,prompt}-*` (`/tmp/` filenames), `gsd-build`/`gsd-check-update`/`gsd-update-check`/`gsd-local-patches` (URL/script/cache/backup-dir names in `update.md`, `reapply-patches.md`).

### Gaps (command steps needing an agent, spawning none)

1. **`/gsd:forensics`** — `forensics.md` spawns **zero** agents (no `subagent_type`/`Task`). Regressed vs April, which claimed it spawned gsd-debugger.
2. **`/gsd:plan-milestone-gaps`** — `plan-milestone-gaps.md` spawns **zero** agents.
3. _(Resolved since April)_ **`/gsd:audit-milestone`** now routes to `gsd-verifier` (`audit-milestone.md:84`).

### Orphan agents (never spawned by the command graph)

- **GSD agents:** none — all 17 have ≥1 real spawn.
- **Meta-agents:** all 3 (`docs-sync`, `test-runner`, `plugin-developer`) are unreferenced by `subagent_type`; they rely on Claude Code's description-based auto-invocation, not GSD routing (`sync-docs.md:18` explicitly states it "runs inline — no agent delegation"). This is by design, not drift.

### New workflows

wrap-and-sync, daily-startup, smart-discuss, idea-to-shipped, `/gsd:do` introduce **no** new phantom refs — idea-to-shipped correctly spawns gsd-verifier/gsd-executor.

---

## OVERLAPS

### The one known pair — `gsd-validator-hub` (target=ecosystem) ↔ `gsd-ecosystem-auditor`

**Severity: LOW** (down from MEDIUM in April). Both audit agent-ecosystem structural correctness, but they are operationally disjoint on three axes, and the boundary is now *more* strongly encoded than in April:

| Axis | validator-hub (ecosystem) | ecosystem-auditor |
|------|---------------------------|-------------------|
| Invoker | `/gsd:ship` pre-PR gate (`ship.md:140`) | `/gsd:audit-agents` on-demand (`audit-agents.md:16,61`) |
| Scan target | `.claude/agents/` project helpers (`gsd-validator-hub.md:214`) | `./agents/gsd-*.md` roster; **explicitly ignores `.claude/agents/`** (`gsd-ecosystem-auditor.md:52-54`) |
| Depth / output | Fast read-only structural gate, no write | Deep 6-dimension diagnostic incl. hygiene + drift; writes ECOSYSTEM-REPORT.md |

Dispatch rule (still holds): **structural breakage blocks ship → validator-hub; diagnostic sweep → ecosystem-auditor.** The disjoint scan-target split means they no longer inspect the same directory.

### New overlaps since April: NONE
Roster composition, descriptions, and unification notes unchanged. No pair crosses 60%. Sub-threshold pairs checked and cleared: ui-checker↔ui-auditor (~35%, spec-time/build-time pair), planner↔roadmapper (~30%, phase/project altitude), research-orchestrator↔advisor-researcher (~30%, sweep/single-decision).

### Identical tool sets (benign — distinct domains)

- `{Read,Write,Edit,Bash,Glob,Grep}` — 8 agents (standard builder set): codebase-mapper, executor, research-synthesizer, roadmapper, ui-auditor, verifier, docs-sync, plugin-developer.
- `{Read,Bash,Glob,Grep}` — 4 agents (read-only gate set): assumptions-analyzer, ui-checker, user-profiler, validator-hub.
- `{Read,Write,Bash,Grep,Glob,WebSearch,WebFetch,mcp__context7__*,mcp__firecrawl__*,mcp__exa__*}` — 2 agents (web-research set): research-orchestrator, ui-researcher.

_Correction: April's "low-severity identical tools" line (old `:83`) named verifier/dependency-auditor/ui-checker — factually stale; those carry three different tool sets._

---

## QUALITY SCORES

Rubric (0–10): frontmatter completeness (2) + role clarity (2) + model_rationale + scope_guard (2) + anti_patterns ≥6 rules (2) + completion_criteria (2). **Scores carry forward from the 2026-04-13 assessment** — verified: only one commit (`1a609a3`, 2026-04-17 doc-sync) touched `agents/` since, no structural change.

| Tier | Agents |
|------|--------|
| **10/10** (7) | gsd-planner, gsd-verifier, gsd-executor, gsd-debugger, plugin-developer, test-runner, docs-sync |
| **9/10** (12) | advisor-researcher, assumptions-analyzer, codebase-mapper, dependency-auditor, ecosystem-auditor, research-orchestrator, research-synthesizer, roadmapper, ui-auditor, ui-checker, ui-researcher, user-profiler |
| **8/10** (1) | validator-hub (missing `isolation`/`maxTurns`; weak scope-selection handler) |

### Hygiene audit overlay (2026-07-13 ecosystem audit — verdict FLAG)

The dedicated hygiene sweep surfaced live nits not in the April quality rubric:
- **Tool/perms (FLAG ×2):** `gsd-research-orchestrator`, `gsd-ui-researcher` have Bash+Write without `disallowedTools: Edit` (defense-in-depth gap).
- **Description (FLAG ×3):** `gsd-research-orchestrator`, `gsd-validator-hub`, `gsd-verifier` lack an explicit dispatch keyword (parametrized agents; dispatch implicit in scope/target param).
- **Frontmatter / Hygiene / Naming:** all PASS.

---

## BOTTLENECKS & EFFICIENCY

### Data-source caveat
`.planning/agent-health.log` is **262 DRIFT events, 0 SPAWN records** — it measures ~33 SubagentStop hook firings + a standing drift set, **not** per-agent spawn counts. No per-agent spawn ledger exists anywhere in the repo (the v2.3 cost-tracker hook's JSONL is not persisted). Spawn frequency is inferred from the coverage grep, milestone SUMMARYs, and design docs.

### Utilization
- **Most-used (every window):** gsd-verifier, then gsd-planner and gsd-research-orchestrator.
- **Dormant in current context** (no trigger surface between milestones / CLI plugin has no frontend): the UI trio (ui-auditor/ui-checker/ui-researcher), roadmapper, research-synthesizer, codebase-mapper, user-profiler, advisor-researcher, assumptions-analyzer, dependency-auditor.
- **Execution-vs-verification imbalance persists and intensifies** — the gate-authoring initiative is verifier-dominant (blueprints skew verifier:executor ~40:5). Not a defect given the work type; the roster simply leans toward verification while build/discovery agents idle.

### Only real bottleneck: config drift
From 2026-07-12 20:35 → 2026-07-13 04:51 (~9h, 32 consecutive SubagentStop firings), the **same 8 installed agent copies drift** with identical diff-line counts, never reconciled — led by `gsd-ecosystem-auditor` (~48 lines), down to `gsd-validator-hub` (~4). Cause: the July initiative **edits** agent definitions faster than they are reinstalled. **Zero FAIL/ERROR events** — version mismatch only; no GSD agent causes rework. (The one recent revision cycle — Phase 57 replan — was driven by external cross-AI review, not a GSD agent.)

### Observability gap
For a governance-focused product, the absence of a first-class spawn/attribution ledger is the obvious missing instrument — frequency questions currently require archaeological inference.

---

## SUMMARY

| Dimension | Finding |
|-----------|---------|
| Active agents | 20 (17 GSD + 3 project-scoped) |
| Archived | 8 |
| Orphan GSD agents | 0 |
| Real phantom refs | 5 (`agent-skills` lookups: checker/synthesizer/researcher/advisor/ui-reviewer) — NEW |
| Coverage gaps | 2 (`/gsd:forensics`, `/gsd:plan-milestone-gaps` spawn zero); audit-milestone resolved |
| Overlaps | 1 LOW (validator-hub ↔ ecosystem-auditor, boundary strengthened); 0 new |
| Gold-standard agents (10/10) | 7 |
| Hygiene verdict (2026-07-13) | FLAG — 2 tool/perm + 3 description + 7 install-drift; no BLOCK |
| Bottlenecks | 1 (unreconciled config drift, 8 agents; hygiene/propagation, not runtime failure) |
| Runtime failures | 0 |
| Observability | No per-agent spawn ledger (instrument gap) |

---

Assessment complete. The build/don't-build recommendation — **no net-new agents** — is in `.planning/ecosystem/AGENT-EXPANSION-RECOMMENDATION.md`, derived by running each gap candidate through `get-shit-done/references/agent-necessity-gate.md`.
