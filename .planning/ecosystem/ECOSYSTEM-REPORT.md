=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-04-10T00:00:00Z
Scope: 17 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done/agents/
Installed: /Users/cpconnor/.claude/agents/

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    FLAG — 4 findings
Tool/Perms:     FLAG — 6 findings
Hygiene:        FLAG — 2 findings
Description:    PASS — 0 findings
Naming:         PASS — 0 findings
Install drift:  PASS — 0 findings

--- FRONTMATTER FINDINGS ---
FLAG gsd-planner — missing permissionMode (write-capable agent, defense-in-depth gap)
  Fix: Add `permissionMode: acceptEdits` to frontmatter
FLAG gsd-ui-auditor — missing permissionMode (write-capable agent, defense-in-depth gap)
  Fix: Add `permissionMode: acceptEdits` to frontmatter
FLAG gsd-ui-researcher — missing permissionMode (write-capable agent, defense-in-depth gap)
  Fix: Add `permissionMode: acceptEdits` to frontmatter
FLAG [roster-wide: 11/12 write-capable agents] — missing maxTurns (defense-in-depth gap)
  Fix: Add `maxTurns:` to gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher, gsd-verifier, gsd-research-synthesizer
  Note: Only gsd-dependency-auditor and gsd-ecosystem-auditor declare maxTurns among write-capable agents

--- TOOL/PERMISSION FINDINGS ---
FLAG [roster-wide: 10/17 agents] — Bash in tools without disallowedTools declaration (defense-in-depth gap)
  Fix: Add `disallowedTools:` with at minimum Edit exclusion for agents that should not edit, or document intentional omission
  Affected: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher, gsd-verifier
FLAG [roster-wide: 4/17 agents] — wildcard MCP tools (mcp__context7__*, mcp__firecrawl__*, mcp__exa__*)
  Fix: Pin to specific MCP tool names where possible
  Affected: gsd-advisor-researcher, gsd-planner, gsd-research-orchestrator, gsd-ui-researcher
FLAG [roster-wide: 9/12 write-capable agents] — missing isolation declaration (defense-in-depth gap)
  Fix: Add `isolation: worktree` to write-capable agents
  Affected: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher
  Note: Only gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-verifier declare isolation
FLAG gsd-validator-hub — isolation: worktree declared but tools do not include Write or Edit
  Fix: Remove isolation: worktree (read-only agent gains no benefit) or document rationale

--- HYGIENE FINDINGS ---
FLAG [roster-wide: 15/17 agents] — missing <scope_guard> section
  Fix: Add <scope_guard> to all write-capable agents defining what files/directories the agent may modify
  Note: Only gsd-dependency-auditor and gsd-ecosystem-auditor have scope_guard
FLAG [roster-wide: 15/17 agents] — missing <completion_criteria> section
  Fix: Add <completion_criteria> to all write-capable agents defining explicit done conditions
  Note: Only gsd-dependency-auditor and gsd-ecosystem-auditor have completion_criteria

--- DESCRIPTION FINDINGS ---
(none)

--- NAMING FINDINGS ---
(none)

--- INSTALL DRIFT FINDINGS ---
(none)

--- TOOL STATUS ---
| Agent | Lines | Model | Write | permMode | maxTurns | isolation | disallowed | Wildcards |
|-------|-------|-------|-------|----------|----------|-----------|------------|-----------|
| gsd-advisor-researcher | 109 | sonnet | no | plan | 15 | - | yes | yes |
| gsd-assumptions-analyzer | 110 | haiku | no | plan | 15 | - | yes | - |
| gsd-codebase-mapper | 773 | sonnet | yes | acceptEdits | - | - | - | - |
| gsd-debugger | 1375 | opus | yes | acceptEdits | - | - | - | - |
| gsd-dependency-auditor | 388 | haiku | yes | acceptEdits | 20 | worktree | yes | - |
| gsd-ecosystem-auditor | 375 | haiku | yes | acceptEdits | 20 | worktree | yes | - |
| gsd-executor | 511 | sonnet | yes | acceptEdits | - | - | - | - |
| gsd-planner | 1356 | opus | yes | - | - | - | - | yes |
| gsd-research-orchestrator | 1187 | sonnet | yes | plan | - | - | - | yes |
| gsd-research-synthesizer | 278 | sonnet | yes | acceptEdits | - | - | - | - |
| gsd-roadmapper | 682 | sonnet | yes | acceptEdits | - | - | - | - |
| gsd-ui-auditor | 469 | sonnet | yes | - | - | - | - | - |
| gsd-ui-checker | 333 | haiku | no | plan | 20 | - | yes | - |
| gsd-ui-researcher | 387 | sonnet | yes | - | - | - | - | yes |
| gsd-user-profiler | 176 | haiku | no | plan | 15 | - | yes | - |
| gsd-validator-hub | 323 | haiku | no | plan | 20 | worktree | yes | - |
| gsd-verifier | 1275 | opus | yes | acceptEdits | - | worktree | - | - |

--- RECOMMENDATIONS ---
1. Add maxTurns to the 11 write-capable agents missing it. This is the single highest-impact defense-in-depth improvement.
2. Add isolation: worktree to the 9 write-capable agents missing it. Prevents accidental writes to the main worktree.
3. Add permissionMode to gsd-planner, gsd-ui-auditor, gsd-ui-researcher — the 3 write-capable agents without it.
4. Adopt <scope_guard> and <completion_criteria> sections roster-wide. The pattern from gsd-dependency-auditor and gsd-ecosystem-auditor is the template.
5. Pin wildcard MCP tool references (mcp__context7__*, etc.) to specific tool names for auditability.
6. Review gsd-validator-hub isolation: worktree — it is read-only and does not benefit from worktree isolation.

=== END REPORT ===
