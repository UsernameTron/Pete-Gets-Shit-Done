=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-05-08T16:45:00Z
Scope: 17 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done/agents
Installed: $HOME/.claude/agents

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    PASS — 0 findings
Tool/Perms:     PASS — 0 findings
Hygiene:        PASS — 0 findings
Description:    FLAG — 3 findings
Naming:         PASS — 0 findings
Install drift:  FLAG — 8 findings

--- FRONTMATTER FINDINGS ---
(none)

--- TOOL/PERMISSION FINDINGS ---
(none)

--- HYGIENE FINDINGS ---
(none)

--- DESCRIPTION FINDINGS ---
FLAG gsd-research-orchestrator — description lacks dispatch trigger keyword
  Current: "Unified research agent for both phase-level and project-level research..."
  Issue: No explicit "Spawned by", "Triggered by", "Use when", or "Invoked by" clause
  Fix: Add trigger phrase. Example: "Unified research agent... Spawned by /gsd:plan-phase or /gsd:research-phase."

FLAG gsd-validator-hub — description lacks dispatch trigger keyword
  Current: "Unified validation agent for both Claude Code extensions and agent ecosystems..."
  Issue: No explicit "Spawned by", "Triggered by", "Use when", or "Invoked by" clause
  Fix: Add trigger phrase. Example: "Unified validation agent... Spawned by validation workflows or invoked directly."

FLAG gsd-verifier — description lacks dispatch trigger keyword
  Current: "Unified verification agent with scope-based routing..."
  Issue: References "Scopes" but does not name the invoker
  Fix: Add trigger phrase. Example: "Unified verification agent... Spawned by /gsd:verify-work orchestrator."

--- NAMING FINDINGS ---
(none)

--- INSTALL DRIFT FINDINGS ---
FLAG gsd-debugger.md — differs between repo and installed (~6 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-debugger.md $HOME/.claude/agents/

FLAG gsd-ecosystem-auditor.md — differs between repo and installed (~3 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-ecosystem-auditor.md $HOME/.claude/agents/

FLAG gsd-executor.md — differs between repo and installed (~3 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-executor.md $HOME/.claude/agents/

FLAG gsd-planner.md — differs between repo and installed (~2 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-planner.md $HOME/.claude/agents/

FLAG gsd-research-synthesizer.md — differs between repo and installed (~2 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-research-synthesizer.md $HOME/.claude/agents/

FLAG gsd-roadmapper.md — differs between repo and installed (~2 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-roadmapper.md $HOME/.claude/agents/

FLAG gsd-ui-researcher.md — differs between repo and installed (~2 diff lines)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-ui-researcher.md $HOME/.claude/agents/

FLAG gsd-validator-hub.md — differs between repo and installed (~1 diff line)
  Issue: Path variable syntax inconsistency (~/.claude/ vs $HOME/.claude/)
  Fix: Reinstall the plugin or sync: cp agents/gsd-validator-hub.md $HOME/.claude/agents/

--- TOOL STATUS ---
All checks completed. Install directory present and accessible.

--- RECOMMENDATIONS ---
1. Sync the 8 drifted agents by reinstalling the plugin or running: for f in gsd-debugger gsd-ecosystem-auditor gsd-executor gsd-planner gsd-research-synthesizer gsd-roadmapper gsd-ui-researcher gsd-validator-hub; do cp agents/$f.md $HOME/.claude/agents/; done
2. Add dispatch trigger keywords to descriptions of gsd-research-orchestrator, gsd-validator-hub, and gsd-verifier. Include explicit "Spawned by" or "Invoked by" clause naming the orchestrator or command.
3. Re-run this audit after syncing to confirm zero drift.

=== END REPORT ===

## DETAILED FINDINGS

### Agent Inventory (Current State — 2026-05-08)

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
- tools: field (all explicit) — 17/17
- model: field (all valid: haiku=5, sonnet=9, opus=3) — 17/17

Recommended fields:
- permissionMode: (17/17 present)
- color: (17/17 present)
- maxTurns: (17/17 present)
- disallowedTools: (10/17 present; correctly absent on write-capable agents)

No schema violations detected. Frontmatter = PASS

### Tool/Permission Audit

Read-only agents (5 total):
- All have permissionMode: plan
- All explicitly declare disallowedTools: Write, Edit
- All have maxTurns: 15-20

Write-capable agents (12 total):
- All have permissionMode: acceptEdits
- All have explicit tool list including Write or Edit
- All have maxTurns: 20-50 (gsd-planner highest at 50)
- All use isolation: worktree for safety

Tool contradictions:
- No agent has the same tool in both tools and disallowedTools
- No agent declares tools: * (unrestricted)
- No agent has Bash without Write/Edit (safe from circumvention)

No tool/permission issues detected. Tool/Perms = PASS

### Hygiene Audit

Write-capable agents (12 total) — ALL compliant:

Checked for: <scope_guard>, <anti_patterns> (or <what_not_to_do>), <completion_criteria> (or <success_criteria>)

All 12 write-capable agents have all three sections:
- gsd-codebase-mapper: scope, anti, completion ✓
- gsd-debugger: scope, anti, completion ✓
- gsd-dependency-auditor: scope, anti, completion ✓
- gsd-ecosystem-auditor: scope, anti, completion ✓
- gsd-executor: scope, anti, completion ✓
- gsd-planner: scope, anti, completion ✓
- gsd-research-orchestrator: scope, anti, completion ✓
- gsd-research-synthesizer: scope, anti, completion ✓
- gsd-roadmapper: scope, anti, completion ✓
- gsd-ui-auditor: scope, anti, completion ✓
- gsd-ui-researcher: scope, anti, completion ✓
- gsd-verifier: scope, anti, completion ✓

Read-only agents (5 total) — exempt (tool restrictions are the scope guard)

No hygiene gaps detected. Hygiene = PASS

### Description Audit

Quality metrics:
- Shortest: 123 chars (gsd-debugger)
- Longest: 361 chars (gsd-ecosystem-auditor — within limit)
- Mean: 172 chars
- All descriptions: 20-361 chars (valid range)
- All descriptions non-empty and under 500 chars

Dispatch contract coverage:
- 14/17 agents include explicit trigger phrase ("Spawned by", "Triggered by", etc.)
- 3/17 agents missing trigger:
  - gsd-research-orchestrator (describes scope but not invoker)
  - gsd-validator-hub (describes target but not invoker)
  - gsd-verifier (describes scopes but not invoker)

No duplicate descriptions detected.

Description verdict: FLAG (3 agents lack dispatch clarity)

### Naming Audit

Naming patterns:
- All 17 agents use gsd- prefix (100% consistency)
- All filenames match name: field value exactly
- No case-insensitive collisions
- No confusingly similar names

No naming collisions, no confusions, no orphans. Naming = PASS

### Install Drift Analysis

Install completeness: 17/17 agents present in $HOME/.claude/agents/ (100%)

Drift summary: 8/17 agents differ between repo and installed copy

Root cause identified: All 8 drifted agents differ in path variable syntax only:
- Repo source: ~/.claude/ or ~/.claude/get-shit-done/
- Installed: $HOME/.claude/ or $HOME/.claude/get-shit-done/

This appears to be environment variable normalization applied during installation (tilde expansion vs explicit $HOME).

Affected agents (all syntax drift, zero functional impact):
1. gsd-debugger.md (6 diff lines)
2. gsd-ecosystem-auditor.md (3 diff lines)
3. gsd-executor.md (3 diff lines)
4. gsd-planner.md (2 diff lines)
5. gsd-research-synthesizer.md (2 diff lines)
6. gsd-roadmapper.md (2 diff lines)
7. gsd-ui-researcher.md (2 diff lines)
8. gsd-validator-hub.md (1 diff line)

Unaffected agents (in perfect sync):
- 9 agents have byte-identical repo and installed copies

Install drift verdict: FLAG (8 agents with cosmetic path syntax drift)

### Model Distribution

| Tier | Model | Count | Role |
|------|-------|-------|------|
| Explore | haiku | 5 | Pattern matching, schema validation, read-only analysis |
| Research | sonnet | 9 | Balanced capability for builders, synthesis, planning |
| Architect | opus | 3 | Complex reasoning, hypothesis generation, cross-phase analysis |

All agents include explicit <model_rationale> sections justifying tier selection.

### Isolation and MaxTurns Policy

Isolation (write safety):
- 12/12 write-capable agents: isolation: worktree ✓
- 5/5 read-only agents: no isolation needed (no write risk)

MaxTurns (runaway prevention):
- Read-only agents: 15-20 turns (exploratory tasks)
- Write-capable builders: 20-30 turns (focused execution)
- Complex agents: 30-50 turns (multi-step reasoning)
- Maximum observed: 50 turns (gsd-planner)
- No agent exceeds reasonable limits

---

## Verdict Summary

BLOCK? No. All required frontmatter fields present, no contradictory tool/permission configurations, all write-capable agents declare hygiene sections, all agents installed.

FLAG? Yes. Three agents lack explicit dispatch trigger keywords in descriptions (routing clarity issue). Eight agents have cosmetic path variable syntax drift from installation (expected and non-functional, but should be synced for consistency).

PASS? Would require zero findings across all dimensions. We have 3 description findings + 8 drift findings.

Overall verdict: FLAG (cosmetic issues only, no blocking problems)
