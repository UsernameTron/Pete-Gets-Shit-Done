=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-07-15T16:15:00Z
Scope: 20 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done
  - 17 GSD agents in agents/
  - 3 project-local specialists in .claude/agents/
Installed: /Users/cpconnor/.claude/agents (17 GSD agents only; specialists are project-local)

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    PASS — 0 findings
Tool/Perms:     FLAG — 1 finding
Hygiene:        PASS — 0 findings
Description:    PASS — 0 findings
Naming:         PASS — 0 findings
Install drift:  FLAG — 8 findings

--- FRONTMATTER FINDINGS ---
(none)

--- TOOL/PERMISSION FINDINGS ---
FLAG test-runner — isolation: worktree declared without Write tool (has Edit but disallowedTools excludes Write). Worktree requires write capability to be useful; this agent can only Edit existing files.
  Fix: Either remove `isolation: worktree` if the agent is test-only, or add Write to tools if new test files should be created in isolation.

--- HYGIENE FINDINGS ---
(none — all write-capable agents have <scope_guard>, <completion_criteria>, and <anti_patterns> sections)

--- DESCRIPTION FINDINGS ---
(none — all descriptions have dispatch clarity and appropriate length)

--- NAMING FINDINGS ---
(none — all filenames match name field, no duplicates)

--- INSTALL DRIFT FINDINGS ---
FLAG gsd-debugger.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-debugger.md $HOME/.claude/agents/`
FLAG gsd-ecosystem-auditor.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-ecosystem-auditor.md $HOME/.claude/agents/`
FLAG gsd-executor.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-executor.md $HOME/.claude/agents/`
FLAG gsd-planner.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-planner.md $HOME/.claude/agents/`
FLAG gsd-research-synthesizer.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-research-synthesizer.md $HOME/.claude/agents/`
FLAG gsd-roadmapper.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-roadmapper.md $HOME/.claude/agents/`
FLAG gsd-ui-researcher.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-ui-researcher.md $HOME/.claude/agents/`
FLAG gsd-validator-hub.md — repo source differs from installed copy at $HOME/.claude/agents/
  Fix: Run plugin install/resync or `cp agents/gsd-validator-hub.md $HOME/.claude/agents/`

--- TOOL STATUS ---
(all checks completed)

--- RECOMMENDATIONS ---
1. Resync the 8 drifted agents with plugin install/resync or bulk copy: `cp agents/gsd-*.md $HOME/.claude/agents/` (run from project root). Install drift is the highest-impact issue — stale agent definitions cause silent failures downstream.
2. Clarify test-runner's isolation intent: either remove worktree (read-only test runner), or add Write tool if the agent should create test fixtures in isolation.

=== END REPORT ===

## DETAILED FINDINGS

### Agent Roster Summary

| Agent | Model | Write-Capable | Install Status |
|-------|-------|--------------|-----------------|
| gsd-advisor-researcher | sonnet | No | SYNCED |
| gsd-assumptions-analyzer | haiku | No | SYNCED |
| gsd-codebase-mapper | sonnet | Yes | SYNCED |
| gsd-debugger | opus | Yes | DRIFT |
| gsd-dependency-auditor | haiku | Yes | SYNCED |
| gsd-ecosystem-auditor | haiku | Yes | DRIFT |
| gsd-executor | sonnet | Yes | DRIFT |
| gsd-planner | opus | Yes | DRIFT |
| gsd-research-orchestrator | sonnet | Yes | SYNCED |
| gsd-research-synthesizer | sonnet | Yes | DRIFT |
| gsd-roadmapper | sonnet | Yes | DRIFT |
| gsd-ui-auditor | sonnet | Yes | SYNCED |
| gsd-ui-checker | haiku | No | SYNCED |
| gsd-ui-researcher | sonnet | Yes | DRIFT |
| gsd-user-profiler | haiku | No | SYNCED |
| gsd-validator-hub | haiku | No | DRIFT |
| gsd-verifier | opus | Yes | SYNCED |
| plugin-developer | sonnet | Yes | PROJECT-LOCAL |
| test-runner | sonnet | No (disallowedTools: Write) | PROJECT-LOCAL |
| docs-sync | sonnet | Yes | PROJECT-LOCAL |

### Hygiene Compliance

All 14 write-capable agents declare complete hygiene sections:
- All have `<scope_guard>` (path restrictions or role-based boundaries)
- All have `<completion_criteria>` (exit/success conditions)
- All have `<anti_patterns>` (documented guardrails)

Read-only agents (6 total) are exempt and properly configured with restrictive `disallowedTools`.

### Model Distribution

- **haiku**: 7 agents (read-only, validation, profiling)
- **sonnet**: 10 agents (builders, researchers, executors)
- **opus**: 3 agents (verifier, planner, debugger)

Distribution is appropriate: reasoning-heavy tasks get opus, deterministic pattern-matching gets haiku, general-purpose builders get sonnet.

### Install Status

- **Synced**: 9 GSD agents (exact byte match with $HOME/.claude/agents)
- **Drifted**: 8 GSD agents (repo ≠ installed)
- **Project-local**: 3 specialists (.claude/agents/ only, not in $HOME/.claude/agents — this is correct)

Drift indicates the plugin's install/sync mechanism has not run since the agents were last modified in the repo. No content corruption; just out-of-sync versions.
