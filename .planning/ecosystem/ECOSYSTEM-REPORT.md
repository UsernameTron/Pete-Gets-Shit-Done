=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-07-12T16:38:54Z
Scope: 17 agents in /home/user/Pete-Gets-Shit-Done/agents (+8 archived in agents/_archived)
Installed: $HOME/.claude/agents

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    PASS — 0 findings
Tool/Perms:     FLAG — 2 findings
Hygiene:        PASS — 0 findings
Description:    FLAG — 3 findings
Naming:         PASS — 0 findings
Install drift:  FLAG — 8 findings
Model profiles: FLAG — 1 finding
References:     FLAG — 5 findings

--- FRONTMATTER FINDINGS ---
(none)

All 17 agents parse cleanly. Required fields (name, description, tools, model) present on 17/17; every name: matches its filename; every model value is haiku/sonnet/opus. Recommended and defense-in-depth fields: color 17/17, permissionMode 17/17, maxTurns 17/17, isolation 12/12 on write-capable agents.

--- TOOL/PERMISSION FINDINGS ---
FLAG gsd-research-orchestrator — tools includes Write and Bash but not Edit, and no `disallowedTools: Edit` is declared. Defense-in-depth gap: Bash can modify existing files via `cat >`/`sed -i`, bypassing the implicit no-Edit intent.
  Fix: Add `disallowedTools: Edit` to frontmatter (same pattern as gsd-dependency-auditor and gsd-ecosystem-auditor).

FLAG gsd-ui-researcher — tools includes Write and Bash but not Edit, and no `disallowedTools: Edit` is declared. Same defense-in-depth gap as above.
  Fix: Add `disallowedTools: Edit` to frontmatter.

No contradictions (no tool appears in both tools and disallowedTools), no wildcard grants, no read-only agent with un-cancelled Write/Edit, and every `isolation: worktree` agent has Write.

--- HYGIENE FINDINGS ---
(none)

All 12 write-capable agents declare `<scope_guard>`, `<completion_criteria>`, and `<anti_patterns>`. The 5 read-only agents (gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-ui-checker, gsd-user-profiler, gsd-validator-hub) are exempt — their `disallowedTools: Write, Edit` restriction is the scope guard.

--- DESCRIPTION FINDINGS ---
FLAG gsd-research-orchestrator — description lacks dispatch trigger keyword
  Current: "Unified research agent for both phase-level and project-level research..."
  Issue: No explicit "Spawned by", "Triggered by", "Use when", or "Invoked by" clause
  Fix: Add trigger phrase. Example: "Unified research agent... Spawned by /gsd:plan-phase, /gsd:research-phase, or /gsd:new-project."

FLAG gsd-validator-hub — description lacks dispatch trigger keyword
  Current: "Unified validation agent for both Claude Code extensions and agent ecosystems..."
  Issue: No explicit "Spawned by", "Triggered by", "Use when", or "Invoked by" clause
  Fix: Add trigger phrase. Example: "Unified validation agent... Spawned by /gsd:ship validation gate or invoked directly."

FLAG gsd-verifier — description lacks dispatch trigger keyword
  Current: "Unified verification agent with scope-based routing..."
  Issue: References "Scopes" but does not name the invoker
  Fix: Add trigger phrase. Example: "Unified verification agent... Spawned by /gsd:verify-work and execute-phase orchestrators."

All descriptions are 123–361 chars (valid 20–500 range); no duplicates. These are the same 3 agents flagged in the 2026-05-08 audit — the finding has not been remediated.

--- NAMING FINDINGS ---
(none)

All 17 agents use the gsd- prefix; all frontmatter name: values match filenames; no case-insensitive collisions; no duplicate name: declarations. gsd-ui-checker / gsd-ui-auditor / gsd-ui-researcher share a stem but have clearly distinct, documented lifecycle roles (spec check vs retroactive audit vs spec creation) — not a collision.

--- INSTALL DRIFT FINDINGS ---
FLAG gsd-debugger.md — differs between repo and installed (6 diff lines)
  Issue: Path variable syntax only (repo `~/.claude/...` vs installed `$HOME/.claude/...`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-debugger.md $HOME/.claude/agents/

FLAG gsd-ecosystem-auditor.md — differs between repo and installed (24 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`, 12 lines changed). Note: the drift-checking agent is itself the most-drifted file.
  Fix: Reinstall the plugin or sync: cp agents/gsd-ecosystem-auditor.md $HOME/.claude/agents/

FLAG gsd-executor.md — differs between repo and installed (6 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-executor.md $HOME/.claude/agents/

FLAG gsd-planner.md — differs between repo and installed (4 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-planner.md $HOME/.claude/agents/

FLAG gsd-research-synthesizer.md — differs between repo and installed (6 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-research-synthesizer.md $HOME/.claude/agents/

FLAG gsd-roadmapper.md — differs between repo and installed (4 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-roadmapper.md $HOME/.claude/agents/

FLAG gsd-ui-researcher.md — differs between repo and installed (4 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-ui-researcher.md $HOME/.claude/agents/

FLAG gsd-validator-hub.md — differs between repo and installed (2 diff lines)
  Issue: Path variable syntax only (`~/.claude/` vs `$HOME/.claude/`)
  Fix: Reinstall the plugin or sync: cp agents/gsd-validator-hub.md $HOME/.claude/agents/

Install completeness: 17/17 repo agents present in $HOME/.claude/agents/; 0 orphan files in the install directory. Root cause is the installer's tilde→$HOME normalization — cosmetic, zero functional impact, but it means byte-diff drift detection will re-FLAG these 8 forever until the installer and repo agree on one syntax. Same root cause as the 2026-05-08 audit.

--- MODEL PROFILE FINDINGS ---
FLAG gsd-verifier — static frontmatter model (`opus`) matches NO column of its profile mapping in get-shit-done/bin/lib/model-profiles.cjs (quality=sonnet, balanced=sonnet, budget=haiku).
  Issue: The intelligence layer will never select opus for gsd-verifier under any profile, but a static/unprofiled spawn uses opus. Either the frontmatter is over-provisioned or the profile table under-provisions the quality tier — the two sources disagree.
  Fix: Align one source: set frontmatter `model: sonnet` to match the balanced profile, or raise the cjs quality column to opus if opus verification is intended.

Consistency checks that passed:
- model-profiles.cjs covers exactly the 17 active roster agents — no missing keys, no stale keys for archived agents.
- get-shit-done/references/model-profiles.md table is in sync with model-profiles.cjs for all 17 agents and all 3 profile columns.
- 13/17 agents' static frontmatter model equals their `balanced` (default) profile value.
- 3 intentional-looking static divergences (documented in DETAILED FINDINGS, not flagged): gsd-codebase-mapper and gsd-debugger pin their quality-tier model; gsd-ui-checker pins its budget-tier model. Each matches at least one defined profile column, unlike gsd-verifier.
- Observation: the .md reference table documents an `inherit` profile column that has no representation in the cjs MODEL_PROFILES map (VALID_PROFILES = quality/balanced/budget). Resolution of `inherit` happens outside this table; keep the two sources' column sets aligned if the cjs is to become the single source of truth (see the TODO in the cjs header).

--- REFERENCE / ORPHAN FINDINGS ---
FLAG gsd-researcher — referenced by workflows but no such agent exists (roster or archive)
  Sites: get-shit-done/workflows/research-phase.md:45, get-shit-done/workflows/plan-phase.md:27 (`gsd-tools.cjs agent-skills gsd-researcher`)
  Issue: agent-skills is a plain config-key lookup (init.cjs buildAgentSkillsBlock) — unknown keys return empty, and every call site suppresses stderr with 2>/dev/null. Skills configured under the real agent name (gsd-research-orchestrator, which OTHER workflows correctly pass) silently never attach in these two workflows. One agent's skills are split across two lookup keys.
  Fix: Change both call sites to `agent-skills gsd-research-orchestrator`.

FLAG gsd-checker — referenced by workflows but no such agent exists
  Sites: get-shit-done/workflows/plan-phase.md:29, get-shit-done/workflows/quick.md:123, get-shit-done/workflows/verify-work.md:36
  Issue: Plan-check work is dispatched to gsd-verifier (scope: plan) since gsd-plan-checker was archived, and 5 other call sites correctly use `agent-skills gsd-verifier`. Same split-key hazard.
  Fix: Change the three call sites to `agent-skills gsd-verifier` (or document gsd-checker as a supported alias in docs/CONFIGURATION.md and resolve aliases in buildAgentSkillsBlock).

FLAG gsd-synthesizer — referenced by workflows but no such agent exists
  Sites: get-shit-done/workflows/new-milestone.md:150, get-shit-done/workflows/new-project.md:63
  Issue: Real agent is gsd-research-synthesizer. docs/CONFIGURATION.md does list `gsd-synthesizer` as a supported type, so docs and workflows agree with each other but both disagree with the roster name used for dispatch (subagent_type="gsd-research-synthesizer").
  Fix: Standardize on the roster name in both workflows and docs/CONFIGURATION.md.

FLAG gsd-advisor — referenced by a workflow but no such agent exists
  Sites: get-shit-done/workflows/discuss-phase.md:137
  Issue: Real agent is gsd-advisor-researcher. docs/CONFIGURATION.md lists `gsd-advisor` as a supported type — same docs/roster disagreement as gsd-synthesizer.
  Fix: Standardize on gsd-advisor-researcher in workflow and docs.

FLAG gsd-ui-reviewer — referenced by a workflow but no such agent exists
  Sites: get-shit-done/workflows/ui-review.md:21
  Issue: Real agent is gsd-ui-auditor (ui-review.md itself spawns subagent_type gsd-ui-auditor 6 lines of references elsewhere in the same file). Appears in no documentation list.
  Fix: Change to `agent-skills gsd-ui-auditor`.

Orphan checks that passed:
- Active-but-never-referenced: 0 of 17 — every active agent is referenced by at least one workflow or command outside agents/.
- Archived-but-still-referenced: 0 of 8 — no workflow, command, template, script, or lib file references extension-validator, gsd-integration-checker, gsd-nyquist-auditor, gsd-phase-researcher, gsd-plan-checker, gsd-project-researcher, gsd-security-guardian, or validator.
- Task dispatch integrity: every `subagent_type` value found in workflows/commands/templates is a valid roster agent (plus the Claude Code built-in `general-purpose`). The 5 findings above are all agent-skills config-key references, not dispatch references — impact is silently missing skill injection, not failed spawns.

--- TOOL STATUS ---
All checks completed. Install directory present and accessible ($HOME/.claude/agents/, 17 files). Model profile sources read from repo: get-shit-done/bin/lib/model-profiles.cjs and get-shit-done/references/model-profiles.md.

--- RECOMMENDATIONS ---
1. Fix the 9 agent-skills call sites that use non-roster identifiers (gsd-researcher x2, gsd-checker x3, gsd-synthesizer x2, gsd-advisor x1, gsd-ui-reviewer x1) — or add alias resolution to buildAgentSkillsBlock. Today, skills configured under roster names silently fail to load in those workflows, and 2>/dev/null hides the warning.
2. Resolve the gsd-verifier model contradiction: frontmatter opus vs profile table max sonnet. Pick one source of truth and align the other.
3. Add dispatch trigger keywords to descriptions of gsd-research-orchestrator, gsd-validator-hub, and gsd-verifier (carried over unremediated from the 2026-05-08 audit).
4. Add `disallowedTools: Edit` to gsd-research-orchestrator and gsd-ui-researcher (Write-without-Edit agents), matching the gsd-dependency-auditor pattern.
5. Sync the 8 drifted installed agents (or normalize path syntax at the source so the installer stops rewriting `~/` to `$HOME/`): for f in gsd-debugger gsd-ecosystem-auditor gsd-executor gsd-planner gsd-research-synthesizer gsd-roadmapper gsd-ui-researcher gsd-validator-hub; do cp agents/$f.md $HOME/.claude/agents/; done
6. Update docs/CONFIGURATION.md "Supported Agent Types" to use roster names only, and re-run this audit after fixes.

=== END REPORT ===

## DETAILED FINDINGS

### Agent Inventory (Current State — 2026-07-12)

| Agent | Model | Write | Permission | MaxTurns | Frontmatter | Hygiene | Install |
|-------|-------|-------|------------|----------|-------------|---------|---------|
| gsd-advisor-researcher | sonnet | no | plan | 15 | PASS | exempt | PASS |
| gsd-assumptions-analyzer | haiku | no | plan | 15 | PASS | exempt | PASS |
| gsd-codebase-mapper | sonnet | yes | acceptEdits | 20 | PASS | PASS | PASS |
| gsd-debugger | opus | yes | acceptEdits | 40 | PASS | PASS | DRIFT |
| gsd-dependency-auditor | haiku | yes | acceptEdits | 20 | PASS | PASS | PASS |
| gsd-ecosystem-auditor | haiku | yes | acceptEdits | 20 | PASS | PASS | DRIFT |
| gsd-executor | sonnet | yes | acceptEdits | 30 | PASS | PASS | DRIFT |
| gsd-planner | opus | yes | acceptEdits | 50 | PASS | PASS | DRIFT |
| gsd-research-orchestrator | sonnet | yes | acceptEdits | 25 | PASS | PASS | PASS |
| gsd-research-synthesizer | sonnet | yes | acceptEdits | 20 | PASS | PASS | DRIFT |
| gsd-roadmapper | sonnet | yes | acceptEdits | 20 | PASS | PASS | DRIFT |
| gsd-ui-auditor | sonnet | yes | acceptEdits | 20 | PASS | PASS | PASS |
| gsd-ui-checker | haiku | no | plan | 20 | PASS | exempt | PASS |
| gsd-ui-researcher | sonnet | yes | acceptEdits | 20 | PASS | PASS | DRIFT |
| gsd-user-profiler | haiku | no | plan | 15 | PASS | exempt | PASS |
| gsd-validator-hub | haiku | no | plan | 20 | PASS | exempt | DRIFT |
| gsd-verifier | opus | yes | acceptEdits | 30 | PASS | PASS | PASS |

### Frontmatter Audit

Required fields present in all 17 agents:
- name: field (all match filename without .md) — 17/17
- description: field (all non-empty) — 17/17
- tools: field (all explicit, no wildcards) — 17/17
- model: field (all valid: haiku=6, sonnet=8, opus=3) — 17/17

Recommended / defense-in-depth fields:
- color: 17/17 present
- permissionMode: 17/17 present (plan on all 5 read-only, acceptEdits on all 12 write-capable)
- maxTurns: 17/17 present (range 15–50; max gsd-planner at 50)
- isolation: worktree on 12/12 write-capable agents; absent (correctly) on read-only agents
- disallowedTools: 7/17 present — all 5 read-only agents declare `Write, Edit`; gsd-dependency-auditor and gsd-ecosystem-auditor declare `Edit` (Write-only pattern). The 8 agents with Edit in tools cannot meaningfully declare it. The 2 remaining Write-without-Edit agents are the Tool/Perms FLAGs above.

No schema violations. Frontmatter = PASS

### Model Assignment vs Intelligence Layer (get-shit-done/bin/lib/model-profiles.cjs)

| Agent | Frontmatter | quality | balanced | budget | Static matches |
|-------|-------------|---------|----------|--------|----------------|
| gsd-advisor-researcher | sonnet | opus | sonnet | haiku | balanced |
| gsd-assumptions-analyzer | haiku | sonnet | haiku | haiku | balanced, budget |
| gsd-codebase-mapper | sonnet | sonnet | haiku | haiku | quality |
| gsd-debugger | opus | opus | sonnet | sonnet | quality |
| gsd-dependency-auditor | haiku | sonnet | haiku | haiku | balanced, budget |
| gsd-ecosystem-auditor | haiku | sonnet | haiku | haiku | balanced, budget |
| gsd-executor | sonnet | opus | sonnet | sonnet | balanced, budget |
| gsd-planner | opus | opus | opus | sonnet | quality, balanced |
| gsd-research-orchestrator | sonnet | opus | sonnet | haiku | balanced |
| gsd-research-synthesizer | sonnet | sonnet | sonnet | haiku | quality, balanced |
| gsd-roadmapper | sonnet | opus | sonnet | sonnet | balanced, budget |
| gsd-ui-auditor | sonnet | sonnet | sonnet | haiku | quality, balanced |
| gsd-ui-checker | haiku | sonnet | sonnet | haiku | budget |
| gsd-ui-researcher | sonnet | opus | sonnet | haiku | balanced |
| gsd-user-profiler | haiku | sonnet | haiku | haiku | balanced, budget |
| gsd-validator-hub | haiku | sonnet | haiku | haiku | balanced, budget |
| gsd-verifier | opus | sonnet | sonnet | haiku | NONE — FLAG |

- Roster/profile coverage: exact bijection (17 profile keys = 17 active agents; no keys for the 8 archived agents).
- cjs vs references/model-profiles.md: identical for all 17 rows. The md's extra `inherit` column is not modeled in the cjs.
- dynamicSelect() defaults unknown agents to sonnet/balanced — not exercised, since no dispatch site names an unknown agent.

### Description Audit

- Length range: 123 (gsd-debugger) to 361 (gsd-ecosystem-auditor); mean 179. All within 20–500.
- Dispatch trigger coverage: 14/17. Missing: gsd-research-orchestrator, gsd-validator-hub, gsd-verifier (FLAGged; unchanged since 2026-05-08).
- No duplicate descriptions.
- Consolidation lineage is encoded in descriptions: gsd-research-orchestrator "Replaces gsd-phase-researcher and gsd-project-researcher"; gsd-validator-hub "Replaces extension-validator and validator" — both replacement targets verified archived and unreferenced.

### Archived Roster and Absorption Map (agents/_archived/, 8 files)

| Archived agent | Absorbed by | Still referenced anywhere? |
|----------------|-------------|----------------------------|
| gsd-phase-researcher | gsd-research-orchestrator (scope: phase) | no |
| gsd-project-researcher | gsd-research-orchestrator (scope: project) | no |
| gsd-plan-checker | gsd-verifier (scope: plan) | no |
| gsd-integration-checker | gsd-verifier (scope: integration) | no |
| gsd-nyquist-auditor | gsd-verifier (scope: nyquist) | no |
| extension-validator | gsd-validator-hub (target: extension) | no |
| validator | gsd-validator-hub (target: ecosystem) | no |
| gsd-security-guardian | runtime security hooks (v2.3+: prompt-injection detection, config protection) | no |

Archive hygiene is clean: zero live references to any archived agent.

### Overlap Analysis (factual — no roster-composition recommendations)

- gsd-validator-hub (target: ecosystem) and gsd-ecosystem-auditor both inspect agent frontmatter/structure. Differentiation as documented: validator-hub is a read-only structural gate invoked from /gsd:ship and concierge pipelines; ecosystem-auditor is the deeper six-dimension audit (hygiene grep, install drift, description quality) spawned by /gsd:audit-agents and writes this report. Overlap exists at the frontmatter-validation layer only; invokers are disjoint.
- gsd-ui-checker vs gsd-ui-auditor: complementary lifecycle stages (pre-implementation UI-SPEC validation vs retroactive 6-pillar audit of implemented code). Not duplicative.
- gsd-advisor-researcher vs gsd-research-orchestrator: single gray-area decision comparison vs full phase/project research. Not duplicative.
- gsd-verifier vs gsd-validator-hub: verification of work output vs validation of extension/agent structure. Distinct subject matter.

### Structural Observations (non-blocking)

- gsd-validator-hub is the only agent with no XML section tags at all (pure Markdown headings, no `<role>`). As a read-only agent it is hygiene-exempt, but it is a grep-tooling outlier relative to the other 16.
- Frontmatter comment lines (`# Tier: ...`, commented-out hooks blocks in gsd-ecosystem-auditor) are valid YAML but require comment-aware parsing — naive line parsers must skip `#` lines.
- The stale-report gap: the 2026-05-08 report's inventory (haiku=5/sonnet=9, disallowedTools 10/17) no longer matched the roster two months later. This audit supersedes it; there is no freshness gate tying the report to agent-file mtimes.

### Model Distribution

| Tier | Model | Count | Roles |
|------|-------|-------|-------|
| Explore | haiku | 6 | Pattern matching, schema validation, spec checking |
| Research | sonnet | 8 | Builders, researchers, synthesis, mapping |
| Architect | opus | 3 | gsd-planner, gsd-debugger, gsd-verifier |

11/12 write-capable agents carry a `<model_rationale>` section; the 5 read-only agents embed rationale inline (e.g., validator-hub's "Shared Principles").

### Audit Provenance

- Executed via /gsd:audit-agents emulation (report-only; default auto-commit intentionally not taken).
- Audit logic: agents/gsd-ecosystem-auditor.md steps 1–9, plus charter extensions (model-profile cross-check, reference/orphan/overlap analysis).
- Evidence basis: 17 active agent files, 8 archived agent files, 17 installed copies, get-shit-done/bin/lib/model-profiles.cjs, get-shit-done/references/model-profiles.md, get-shit-done/bin/lib/init.cjs (buildAgentSkillsBlock), docs/CONFIGURATION.md, and a full-repo reference scan across get-shit-done/{workflows,commands,references,templates,bin}, commands/, skills/, hooks/, scripts/, bin/, lib/, governance/.

## Verdict Summary

BLOCK? No. All required frontmatter present, no contradictory tool grants, no duplicate names, no missing installed files, no dispatch-level references to nonexistent agents.

FLAG? Yes, on five dimensions: 2 defense-in-depth tool gaps, 3 descriptions without dispatch triggers (unremediated since May), 8 cosmetic install drifts, 1 model-profile contradiction (gsd-verifier), and 5 non-roster agent-skills identifiers across 9 silently-failing call sites.

PASS? Not until the above are remediated; highest-value fixes are Recommendations 1 and 2.

Overall verdict: FLAG (no blocking problems; silent-failure and drift issues to remediate)
