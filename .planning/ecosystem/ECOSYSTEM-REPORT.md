=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-04-10T12:00:00Z
Scope: 17 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done/agents/
Installed: /Users/cpconnor/.claude/agents/

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    FLAG — 5 findings
Tool/Perms:     FLAG — 10 findings
Hygiene:        FLAG — 3 findings (roster-wide)
Description:    FLAG — 3 findings
Naming:         PASS — 0 findings
Install drift:  PASS — 0 findings

--- FRONTMATTER FINDINGS ---

All 17 agents have: name (matches filename), description (non-empty), tools, model (valid value: haiku|sonnet|opus). All names are kebab-case. Color field present on all 17.

FLAG: gsd-planner — missing permissionMode. Write-capable opus agent with no explicit permission declaration.
FLAG: gsd-ui-auditor — missing permissionMode. Write-capable sonnet agent with Write+Edit tools.
FLAG: gsd-ui-researcher — missing permissionMode. Write-capable sonnet agent with Write tool.
FLAG: gsd-codebase-mapper — missing maxTurns. Write-capable sonnet agent with no turn limit.
FLAG: gsd-debugger — missing maxTurns. Write-capable opus agent with no turn limit. Highest runaway risk in roster.

Note: 10 total write-capable agents lack maxTurns (gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher, gsd-verifier). Only gsd-dependency-auditor and gsd-ecosystem-auditor declare maxTurns among write-capable agents. Reported as top 2 above; remainder captured as roster-wide pattern in RECOMMENDATIONS.

--- TOOL/PERMISSION FINDINGS ---

FLAG: gsd-research-orchestrator — tools includes Write but permissionMode is plan. Plan mode is read-only by convention; Write tool contradicts this intent.

FLAG (defense-in-depth): gsd-codebase-mapper — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-debugger — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-executor — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-planner — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-research-orchestrator — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-research-synthesizer — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-roadmapper — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-ui-auditor — Bash in tools, no disallowedTools declared.
FLAG (defense-in-depth): gsd-verifier — Bash in tools, no disallowedTools declared.

Note: 7 agents correctly declare disallowedTools: gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-dependency-auditor, gsd-ecosystem-auditor, gsd-ui-checker, gsd-user-profiler, gsd-validator-hub. These are the compliant reference pattern.

--- HYGIENE FINDINGS ---

10 write-capable agents examined: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-orchestrator, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher, gsd-verifier.

FLAG (roster-wide): <scope_guard> missing on 9/10 write-capable agents. Only gsd-research-orchestrator has a Scope section equivalent. Agents lacking: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-planner, gsd-research-synthesizer, gsd-roadmapper, gsd-ui-auditor, gsd-ui-researcher, gsd-verifier.

FLAG (roster-wide): <anti_patterns> or <what_not_to_do> missing on 4/10 write-capable agents. Agents lacking: gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-verifier.

FLAG (roster-wide): <completion_criteria> or <success_criteria> missing on 2/10 write-capable agents. Agents lacking: gsd-research-orchestrator, gsd-verifier.

--- DESCRIPTION FINDINGS ---

All descriptions are non-empty and over 20 characters. No duplicates found. No description exceeds 500 characters.

FLAG: gsd-research-orchestrator — no dispatch contract keyword. Description lacks "Spawned by"/"Use when"/"Invoked by"/"Called by"/"Triggered by". Routing logic cannot identify invoker.
FLAG: gsd-validator-hub — no dispatch contract keyword. Description lacks "Spawned by"/"Use when"/"Invoked by"/"Called by"/"Triggered by".
FLAG: gsd-verifier — no dispatch contract keyword. Description has "Scopes" phrasing that partially implies invocation context but does not name an invoker.

--- NAMING FINDINGS ---

No duplicate name: fields found.
No case-insensitive filename collisions.
No confusingly similar names detected.

PASS.

--- INSTALL DRIFT FINDINGS ---

All 17 repo agents have byte-identical counterparts in /Users/cpconnor/.claude/agents/.
No orphan gsd-*.md files found in install directory.

PASS.

--- TOOL STATUS ---

| Agent | Model | Write-Capable | permissionMode | maxTurns | isolation | disallowedTools | Hygiene Sections |
|-------|-------|---------------|----------------|----------|-----------|-----------------|------------------|
| gsd-advisor-researcher | sonnet | no | plan | 15 | - | Write, Edit | scope:N cc:N ap:Y |
| gsd-assumptions-analyzer | haiku | no | plan | 15 | - | Write, Edit | scope:N cc:N ap:Y |
| gsd-codebase-mapper | sonnet | yes | acceptEdits | - | - | - | scope:N cc:Y ap:N |
| gsd-debugger | opus | yes | acceptEdits | - | - | - | scope:N cc:Y ap:N |
| gsd-dependency-auditor | haiku | yes | acceptEdits | 20 | worktree | Edit | scope:Y cc:Y ap:Y |
| gsd-ecosystem-auditor | haiku | yes | acceptEdits | 20 | worktree | Edit | scope:Y cc:Y ap:Y |
| gsd-executor | sonnet | yes | acceptEdits | - | - | - | scope:N cc:Y ap:N |
| gsd-planner | opus | yes | (none) | - | - | - | scope:N cc:Y ap:Y |
| gsd-research-orchestrator | sonnet | yes | plan | - | - | - | scope:Y cc:N ap:Y |
| gsd-research-synthesizer | sonnet | yes | acceptEdits | - | - | - | scope:N cc:Y ap:Y |
| gsd-roadmapper | sonnet | yes | acceptEdits | - | - | - | scope:N cc:Y ap:Y |
| gsd-ui-auditor | sonnet | yes | (none) | - | - | - | scope:N cc:Y ap:Y |
| gsd-ui-checker | haiku | no | plan | 20 | - | Write, Edit | scope:N cc:N ap:N |
| gsd-ui-researcher | sonnet | yes | (none) | - | - | - | scope:N cc:Y ap:Y |
| gsd-user-profiler | haiku | no | plan | 15 | - | Write, Edit | scope:N cc:N ap:N |
| gsd-validator-hub | haiku | no | plan | 20 | worktree | Write, Edit | scope:N cc:N ap:N |
| gsd-verifier | opus | yes | acceptEdits | - | worktree | - | scope:Y cc:N ap:N |

--- RECOMMENDATIONS ---

1. Resolve gsd-research-orchestrator contradiction: tools includes Write but permissionMode is plan. Either remove Write from tools or change permissionMode to acceptEdits.
2. Add permissionMode to gsd-planner, gsd-ui-auditor, gsd-ui-researcher. These 3 write-capable agents have no permission declaration.
3. Add maxTurns to the 10 write-capable agents missing it. Highest priority: gsd-debugger (opus, no limit) and gsd-planner (opus, no limit).
4. Add <scope_guard> sections to the 9 write-capable agents missing them. Use gsd-dependency-auditor and gsd-ecosystem-auditor as templates.
5. Add <anti_patterns> or <what_not_to_do> sections to gsd-codebase-mapper, gsd-debugger, gsd-executor, gsd-verifier.
6. Add <completion_criteria> or <success_criteria> sections to gsd-research-orchestrator and gsd-verifier.
7. Add dispatch contract keywords to descriptions of gsd-research-orchestrator, gsd-validator-hub, and gsd-verifier.

=== END REPORT ===
