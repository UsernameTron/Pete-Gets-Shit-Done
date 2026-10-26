=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-10-26T11:05:35Z
Scope: 17 agents in /Users/cpconnor/projects/Pete-Gets-Shit-Done/.claude/worktrees/agent-a684935acf3575a27/agents
Installed: /Users/cpconnor/.claude/agents

--- SUMMARY ---
Overall verdict: BLOCK
Frontmatter:    FLAG — 8 findings
Tool/Perms:     BLOCK — 13 findings (1 BLOCK, 12 FLAG)
Hygiene:        PASS — 0 findings
Description:    PASS — 0 findings
Naming:         PASS — 0 findings
Install drift: FLAG — 7 findings

--- FRONTMATTER FINDINGS ---
FLAG gsd-codebase-mapper — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-debugger — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-executor — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-planner — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-research-synthesizer — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-roadmapper — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-ui-auditor — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.
FLAG gsd-verifier — missing recommended field `disallowedTools`
  Fix: Add a `disallowedTools:` line that does not overlap `tools`, or record an exception.

Passed: all 17 agents have `name` (matching filename), `description`, `tools`, and a valid `model` (6 haiku, 8 sonnet, 3 opus). All 17 parse as YAML. All 12 write-capable agents declare `permissionMode`, `isolation`, and `maxTurns`.

--- TOOL/PERMISSION FINDINGS ---
BLOCK gsd-dependency-auditor — role body states "You are read-only (`disallowedTools: Write, Edit`)" (line 243), but frontmatter `tools` includes `Write` and `disallowedTools` is only `Edit`. The `Write` grant is not cancelled, and the role's cited frontmatter does not match the actual frontmatter.
  Fix: If the agent writes a report file, delete the read-only claim at line 243 and correct the cited frontmatter. If it does not write files, add `Write` to `disallowedTools`.

FLAG gsd-codebase-mapper — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: No non-contradictory fix exists while Edit stays in `tools`. Accept as a documented exception, or narrow the agent's Edit need.
FLAG gsd-debugger — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-executor — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-planner — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-research-synthesizer — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-roadmapper — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-ui-auditor — uses Bash without `disallowedTools: Edit` (Edit is in `tools`).
  Fix: Same as gsd-codebase-mapper.
FLAG gsd-verifier — uses Bash without `disallowedTools: Edit` (Edit is in `tools`). Its "implementation files are READ-ONLY" rule (line 1279) applies only to certain scopes and is enforced by prose, not by tool permissions.
  Fix: Same as gsd-codebase-mapper.

FLAG gsd-advisor-researcher — wildcard MCP grant `mcp__context7__*` in `tools`. Namespace wildcard, not bare `*`.
  Fix: Replace with explicit MCP tool names if the server exposes a fixed set, or record an exception.
FLAG gsd-planner — wildcard MCP grant `mcp__context7__*` in `tools`.
  Fix: Same as gsd-advisor-researcher.
FLAG gsd-research-orchestrator — wildcard MCP grants `mcp__context7__*`, `mcp__firecrawl__*`, `mcp__exa__*` in `tools`.
  Fix: Same as gsd-advisor-researcher.
FLAG gsd-ui-researcher — wildcard MCP grants `mcp__context7__*`, `mcp__firecrawl__*`, `mcp__exa__*` in `tools`.
  Fix: Same as gsd-advisor-researcher.

Passed: no tool appears in both `tools` and `disallowedTools`. No agent with `isolation: worktree` lacks `Write`. The ecosystem-auditor's "do not modify" text governs its own single report write and does not claim read-only status, so it is not flagged.

--- HYGIENE FINDINGS ---
ROSTER: PASS — no roster-wide gap. All 12 write-capable agents (tools include Write or Edit, not both cancelled) declare `<role>`, `<scope_guard>`, `<completion_criteria>`, and `<anti_patterns>`, and each `<anti_patterns>` section contains at least one "do not / never" rule. Read-only agents are exempt: gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-ui-checker, gsd-user-profiler, gsd-validator-hub. Note: gsd-validator-hub carries none of the canonical tags, including `<role>`. This is exempt as a read-only agent and is not a finding.

--- DESCRIPTION FINDINGS ---
Passed: all 17 descriptions are between 123 and 361 characters. All contain "Spawned by". None is duplicated.

--- NAMING FINDINGS ---
Passed: no duplicate `name:` values and no case-insensitive filename collisions. No suffix-convention confusion pairs. Not scanned: `agents/_archived/` (8 legacy files: extension-validator.md, validator.md, gsd-integration-checker.md, gsd-nyquist-auditor.md, gsd-phase-researcher.md, gsd-plan-checker.md, gsd-project-researcher.md, gsd-security-guardian.md). None of them is installed.

--- INSTALL DRIFT FINDINGS ---
Verified: all 17 repo agents are installed and there are no orphans. 10 agents are byte-identical to the repo copy after the documented `@~/.claude/` → `@$HOME/.claude/` rewrite: gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-codebase-mapper, gsd-dependency-auditor, gsd-planner, gsd-research-orchestrator, gsd-ui-auditor, gsd-ui-checker, gsd-user-profiler, gsd-verifier.

FLAG gsd-debugger — differs by 6 lines. All are bare `~/.claude/` → `$HOME/.claude/` rewrites (hook paths and targetDir), which go beyond the documented `@`-only transform. The content otherwise matches the repo.
  Fix: Confirm the intended installer transform. If it is `@`-only, re-run the install. If the full rewrite is intended, update the documented transform.
FLAG gsd-ecosystem-auditor — differs by 26 lines. Same bare `~/.claude/` rewrite class (prose path references).
  Fix: Same as gsd-debugger.
FLAG gsd-executor — differs by 2 lines. Same class (`gsd-tools.cjs` path in commit example).
  Fix: Same as gsd-debugger.
FLAG gsd-research-synthesizer — differs by 6 lines. Same class (template paths).
  Fix: Same as gsd-debugger.
FLAG gsd-roadmapper — differs by 4 lines. Same class (template paths).
  Fix: Same as gsd-debugger.
FLAG gsd-ui-researcher — differs by 4 lines. Same class (template paths).
  Fix: Same as gsd-debugger.
FLAG gsd-validator-hub — differs by 2 lines. Same class (agent-memory path).
  Fix: Same as gsd-debugger.

--- TOOL STATUS ---
Repo scope: audited the worktree copy at /Users/cpconnor/projects/Pete-Gets-Shit-Done/.claude/worktrees/agent-a684935acf3575a27/agents/, not the main checkout's agents/ directory.
Install check: /Users/cpconnor/.claude/agents/ present. Check 6 ran in full.
Parsing: PyYAML parsed all 17 frontmatter blocks. No line-based fallback was needed.
Prior report: an existing ECOSYSTEM-REPORT.md (dated 2026-08-24, PASS) was overwritten.
Sandbox: one Bash loop was refused because of a computed `sed` argument. The same checks were rerun from scratchpad Python scripts, and their results are reflected above.

--- RECOMMENDATIONS ---
1. Resolve the BLOCK on gsd-dependency-auditor. Its role says read-only while its tools grant Write. Check whether it writes a report file, then either remove the read-only claim or add `Write` to `disallowedTools`.
2. Confirm the install transform. Seven installed agents carry bare `~/.claude/` → `$HOME/.claude/` rewrites beyond the documented `@`-only transform. Re-run the install if `@`-only is intended, or update the documented transform.
3. Treat the eight Bash-plus-Edit FLAGs as a rule-definition gap, not agent defects. These agents need Edit, so the prescribed `disallowedTools: Edit` would contradict their `tools`. Record them as accepted exceptions, or change the check to exempt agents that legitimately need Edit.
4. Narrow the four wildcard MCP grants to explicit tool names if the servers expose a fixed set, starting with gsd-research-orchestrator and gsd-ui-researcher, which use three namespace wildcards each.
5. Add non-overlapping `disallowedTools` lines to the eight agents that lack them, or record exceptions.
6. Re-run `/gsd:audit-agents` after items 1 and 2 are resolved.

=== END REPORT ===

## DETAILED FINDINGS

| Agent | Model | Tools | Hygiene | Install |
|---|---|---|---|---|
| gsd-advisor-researcher | sonnet | 7 | read-only (exempt) | match |
| gsd-assumptions-analyzer | haiku | 4 | read-only (exempt) | match |
| gsd-codebase-mapper | sonnet | 6 | write (4/4) | match |
| gsd-debugger | opus | 7 | write (4/4) | drift (bare-tilde) |
| gsd-dependency-auditor | haiku | 7 | write (4/4) | match |
| gsd-ecosystem-auditor | haiku | 5 | write (4/4) | drift (bare-tilde) |
| gsd-executor | sonnet | 6 | write (4/4) | drift (bare-tilde) |
| gsd-planner | opus | 8 | write (4/4) | match |
| gsd-research-orchestrator | sonnet | 10 | write (4/4) | match |
| gsd-research-synthesizer | sonnet | 6 | write (4/4) | drift (bare-tilde) |
| gsd-roadmapper | sonnet | 6 | write (4/4) | drift (bare-tilde) |
| gsd-ui-auditor | sonnet | 6 | write (4/4) | match |
| gsd-ui-checker | haiku | 4 | read-only (exempt) | match |
| gsd-ui-researcher | sonnet | 10 | write (4/4) | drift (bare-tilde) |
| gsd-user-profiler | haiku | 4 | read-only (exempt) | match |
| gsd-validator-hub | haiku | 4 | read-only (exempt) | drift (bare-tilde) |
| gsd-verifier | opus | 6 | write (4/4) | match |

Model distribution: haiku 6, sonnet 8, opus 3.
Line counts: largest gsd-debugger (1425), gsd-planner (1423), gsd-verifier (1394). Smallest gsd-user-profiler (176).
