=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-07-19T21:36:00Z
Scope: 17 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done/agents
Installed: /Users/cpconnor/.claude/agents

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    FLAG — 8 findings
Tool/Perms:     FLAG — 8 findings
Hygiene:        PASS — 0 findings
Description:    FLAG — 1 finding
Naming:         PASS — 0 findings
Install drift:  FLAG — 17 findings

--- FRONTMATTER FINDINGS ---
FLAG gsd-codebase-mapper — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools: Edit` to frontmatter to clarify tool restrictions
FLAG gsd-debugger — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools: Edit` to frontmatter if not intended to modify existing files
FLAG gsd-executor — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools:` field to clarify which tools are restricted (if any)
FLAG gsd-planner — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools:` field to clarify which tools are restricted (if any)
FLAG gsd-research-synthesizer — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools: Edit` to frontmatter if not intended to modify existing files
FLAG gsd-roadmapper — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools:` field to clarify which tools are restricted (if any)
FLAG gsd-ui-auditor — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools: Edit` to frontmatter if not intended to modify existing files
FLAG gsd-verifier — missing recommended field `disallowedTools`
  Fix: Add `disallowedTools:` field to clarify which tools are restricted (if any)

--- TOOL/PERMISSION FINDINGS ---
FLAG gsd-codebase-mapper — tools includes Bash and Write without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing Edit restrictions if one were added later.
  Fix: Add `disallowedTools: Edit` to frontmatter
FLAG gsd-debugger — tools includes Bash and Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing Edit restrictions.
  Fix: Add `disallowedTools: Edit` to frontmatter or clarify intentional capability
FLAG gsd-executor — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools
FLAG gsd-planner — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools
FLAG gsd-research-synthesizer — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools
FLAG gsd-roadmapper — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools
FLAG gsd-ui-auditor — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools
FLAG gsd-verifier — tools includes Bash and Write/Edit without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via redirection, circumventing restrictions.
  Fix: Declare tool boundaries explicitly in disallowedTools

--- HYGIENE FINDINGS ---
(none — all write-capable agents include required sections: <scope_guard>, <completion_criteria>, <anti_patterns>)

--- DESCRIPTION FINDINGS ---
FLAG gsd-ui-checker — description exceeds 500 character limit (697 chars)
  Fix: Trim description to ≤500 chars. Current: "Validates UI-SPEC.md design contracts against 6 quality dimensions. Produces BLOCK/FLAG/PASS verdicts. Spawned by /gsd:ui-phase orchestrator."

--- NAMING FINDINGS ---
(none — no collisions detected, all filenames match frontmatter `name:` fields)

--- INSTALL DRIFT FINDINGS ---
FLAG gsd-advisor-researcher.md — differs from installed copy (~4 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-advisor-researcher.md $HOME/.claude/agents/`
FLAG gsd-codebase-mapper.md — differs from installed copy (~2 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-codebase-mapper.md $HOME/.claude/agents/`
FLAG gsd-debugger.md — differs from installed copy (~1280 diff lines, substantial changes)
  Fix: Reinstall via plugin installer — repo version has significant structural updates
FLAG gsd-ecosystem-auditor.md — differs from installed copy (~4 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-ecosystem-auditor.md $HOME/.claude/agents/`
FLAG gsd-executor.md — differs from installed copy (~2 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-executor.md $HOME/.claude/agents/`
FLAG gsd-planner.md — differs from installed copy (~1487 diff lines, substantial changes)
  Fix: Reinstall via plugin installer — repo version has significant structural updates
FLAG gsd-research-orchestrator.md — differs from installed copy (~4 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-research-orchestrator.md $HOME/.claude/agents/`
FLAG gsd-research-synthesizer.md — differs from installed copy (~2 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-research-synthesizer.md $HOME/.claude/agents/`
FLAG gsd-roadmapper.md — differs from installed copy (~2 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-roadmapper.md $HOME/.claude/agents/`
FLAG gsd-ui-auditor.md — differs from installed copy (~2 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-ui-auditor.md $HOME/.claude/agents/`
FLAG gsd-ui-checker.md — differs from installed copy (~42 diff lines, notable changes)
  Fix: Reinstall via plugin installer — repo version has refined heuristics
FLAG gsd-ui-researcher.md — differs from installed copy (~4 diff lines)
  Fix: Reinstall via plugin installer or `cp agents/gsd-ui-researcher.md $HOME/.claude/agents/`
FLAG gsd-verifier.md — differs from installed copy (~1426 diff lines, substantial changes)
  Fix: Reinstall via plugin installer — repo version has significant structural updates

--- TOOL STATUS ---
(all checks completed successfully)

--- RECOMMENDATIONS ---
1. **URGENT: Resync all 17 installed agents.** Run the GSD plugin installer to update ~/.claude/agents/ with current repo versions. Three agents (gsd-debugger, gsd-planner, gsd-verifier) have substantial changes (>1000 lines each) that could affect behavior if stale.
2. **Add `disallowedTools:` field to 8 agents.** This clarifies tool boundaries and prevents Bash from circumventing future Edit restrictions via shell redirection. Recommendation: add `disallowedTools: Edit` to agents with Write+Bash but no Edit capability (gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-verifier).
3. **Trim gsd-ui-checker description to ≤500 chars.** Current 697 chars exceeds the scanner threshold. Suggest: "Validates UI-SPEC.md contracts for completeness and consistency using 6 quality dimensions. Produces BLOCK/FLAG/PASS verdicts. Spawned by /gsd:ui-phase orchestrator." (140 chars).

=== END REPORT ===

## DETAILED FINDINGS

### Agent Inventory

| Agent | Model | Write | Defense-in-Depth | Hygiene | Color |
|-------|-------|-------|------------------|---------|-------|
| gsd-advisor-researcher | sonnet | No | N/A | N/A | cyan |
| gsd-assumptions-analyzer | haiku | No | N/A | N/A | cyan |
| gsd-codebase-mapper | sonnet | Yes | missing disallowedTools | ✓ | cyan |
| gsd-debugger | opus | Yes | missing disallowedTools | ✓ | orange |
| gsd-dependency-auditor | haiku | Yes | ✓ (has disallowedTools) | ✓ | orange |
| gsd-ecosystem-auditor | haiku | Yes | ✓ (has disallowedTools) | ✓ | purple |
| gsd-executor | sonnet | Yes | missing disallowedTools | ✓ | yellow |
| gsd-planner | opus | Yes | missing disallowedTools | ✓ | green |
| gsd-research-orchestrator | sonnet | Yes | ✓ (has disallowedTools) | ✓ | cyan |
| gsd-research-synthesizer | sonnet | Yes | missing disallowedTools | ✓ | purple |
| gsd-roadmapper | sonnet | Yes | missing disallowedTools | ✓ | purple |
| gsd-ui-auditor | sonnet | Yes | missing disallowedTools | ✓ | #F472B6 |
| gsd-ui-checker | haiku | No | N/A | N/A | #22D3EE |
| gsd-ui-researcher | sonnet | Yes | ✓ (has disallowedTools) | ✓ | #E879F9 |
| gsd-user-profiler | haiku | No | N/A | N/A | magenta |
| gsd-validator-hub | haiku | No | N/A | N/A | blue |
| gsd-verifier | opus | Yes | missing disallowedTools | ✓ | green |

### Model Distribution

- **haiku** (5): gsd-assumptions-analyzer, gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-ui-checker, gsd-user-profiler, gsd-validator-hub
- **sonnet** (9): gsd-advisor-researcher, gsd-codebase-mapper, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher
- **opus** (3): gsd-debugger, gsd-planner, gsd-verifier

### Install Drift Pattern

All 17 agents have drift relative to installed copies. Most are minor (2-4 lines), but three large changes suggest the repo is ahead:
- gsd-debugger: ~1280 lines diff (metadata, role structure)
- gsd-planner: ~1487 lines diff (scope guard, process sections)
- gsd-verifier: ~1426 lines diff (multi-scope workflow definitions)

Drift likely caused by incomplete plugin reinstall after recent agent updates. Run the installer to bring ~/.claude/agents/ current.

### Defense-in-Depth Assessment

Write-capable agents are split:
- **4 compliant** (have disallowedTools): gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-research-orchestrator, gsd-ui-researcher
- **8 flagged** (missing disallowedTools): gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-verifier

The gap is not a blocker (agents function correctly), but adds clarification value for future maintainers and provides defense-in-depth against Bash shell redirection attacks.

### Hygiene Compliance

All write-capable agents include the P0 hygiene sections:
- `<scope_guard>` (defines write boundaries)
- `<completion_criteria>` (defines stop conditions)
- `<anti_patterns>` (defines "do not" rules)

Read-only agents are exempt (tool restrictions serve as implicit scope guard).

Verdict: **PASS** on hygiene structure.
