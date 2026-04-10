# Phase 35 Confirmation Audit Report

**Date:** 2026-04-09
**Auditor:** gsd-executor (automated)
**Scope:** Verify v1.4 DEBT-01 (INT-01) and DEBT-04 (INT-02) are fully resolved

---

## AUDIT-01: Agent Tier Labels vs Tool Grants

**Requirement:** Every agent .md file must have a tier label that matches its actual tools: field.

**Tier Classification Rules:**

| Tier | Tools Allowed | Characteristic |
|------|---------------|----------------|
| Explore | Read, Glob, Grep, Bash (read-only) | No write, no web |
| Research | Read, Glob, Grep, Bash, WebSearch, WebFetch | + web tools |
| Modify | Read, Write, Edit, Bash, Glob, Grep | + write tools |
| Full | All tools (write + web + MCP) | No restrictions |

### GSD Built-in Agents (15 agents in ~/.claude/agents/)

| # | Agent | Location | Declared Tier | Tools Field | Actual Tier | Match? |
|---|-------|----------|---------------|-------------|-------------|--------|
| 1 | gsd-advisor-researcher | ~/.claude/agents/ | Research | Read, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__* | Research | PASS |
| 2 | gsd-assumptions-analyzer | ~/.claude/agents/ | Explore | Read, Bash, Grep, Glob | Explore | PASS |
| 3 | gsd-codebase-mapper | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 4 | gsd-debugger | ~/.claude/agents/ | Full | Read, Write, Edit, Bash, Glob, Grep, WebSearch | Full | PASS |
| 5 | gsd-executor | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 6 | gsd-planner | ~/.claude/agents/ | Full | Read, Write, Edit, Bash, Glob, Grep, WebFetch, mcp__context7__* | Full | PASS |
| 7 | gsd-research-orchestrator | ~/.claude/agents/ | Full | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__* | Full | PASS |
| 8 | gsd-research-synthesizer | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 9 | gsd-roadmapper | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 10 | gsd-ui-auditor | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 11 | gsd-ui-checker | ~/.claude/agents/ | Explore | Read, Bash, Glob, Grep | Explore | PASS |
| 12 | gsd-ui-researcher | ~/.claude/agents/ | Full | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__* | Full | PASS |
| 13 | gsd-user-profiler | ~/.claude/agents/ | Explore | Read, Glob, Grep, Bash | Explore | PASS |
| 14 | gsd-validator-hub | ~/.claude/agents/ | Explore | Read, Bash, Glob, Grep (disallowedTools: Write, Edit) | Explore | PASS |
| 15 | gsd-verifier | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |

### Project Agents (3 agents in .claude/agents/)

| # | Agent | Location | Declared Tier | Tools Field | Actual Tier | Match? |
|---|-------|----------|---------------|-------------|-------------|--------|
| 16 | docs-sync | .claude/agents/ | (none) | Read, Write, Edit, Glob, Grep | Modify | N/A |
| 17 | plugin-developer | .claude/agents/ | (none) | Read, Write, Edit, Bash, Glob, Grep | Modify | N/A |
| 18 | test-runner | .claude/agents/ | (none) | Read, Edit, Bash, Glob, Grep | Modify | N/A |

**Note:** Project agents (docs-sync, plugin-developer, test-runner) do not have tier labels. These are project-scoped specialists, not GSD built-in agents. Tier labeling was applied to GSD agents via CREW-06 and DEBT-01; project agents were not in scope for that requirement.

### Non-GSD User Agents (14 agents in ~/.claude/agents/)

| # | Agent | Location | Declared Tier | Tools Field | Actual Tier | Match? |
|---|-------|----------|---------------|-------------|-------------|--------|
| 19 | architect | ~/.claude/agents/ | Explore | Read, Glob, Grep, Bash | Explore | PASS |
| 20 | auditor | ~/.claude/agents/ | Explore | Read, Glob, Grep, Bash (disallowedTools: Write, Edit) | Explore | PASS |
| 21 | google-media-generation | ~/.claude/agents/ | Research | Read, Bash, Glob, Grep | Explore* | MISMATCH |
| 22 | gpt-image-1-expert | ~/.claude/agents/ | Research | Read, Bash, Glob, Grep | Explore* | MISMATCH |
| 23 | hook-engineer | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 24 | mcp-performance-diagnostics | ~/.claude/agents/ | Research | Read, Bash, Glob, Grep | Explore* | MISMATCH |
| 25 | memory-seeder | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 26 | mirror-universe-pete | ~/.claude/agents/ | Research | Read, Bash, Glob, Grep | Explore* | MISMATCH |
| 27 | plugin-builder | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 28 | repo-commit-documenter | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 29 | repo-doc-architect | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 30 | scaffolder | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 31 | sdk-installer | ~/.claude/agents/ | Modify | Read, Write, Edit, Bash, Glob, Grep | Modify | PASS |
| 32 | sora-video-generator | ~/.claude/agents/ | Research | Read, Bash, Glob, Grep | Explore* | MISMATCH |

**MISMATCH Analysis (rows 21, 22, 24, 26, 32):** Five non-GSD agents declare `# Tier: Research` but their tools field contains only `Read, Bash, Glob, Grep` (no WebSearch, WebFetch). By the tier classification rules, these are Explore-tier agents labeled as Research.

**Scope note:** These 5 mismatches are on non-GSD user agents, not the 15 GSD built-in agents targeted by DEBT-01/INT-01. The original v1.4 DEBT-01 requirement specifically addressed "the 15 GSD built-in agents" -- all 15 GSD agents PASS.

### AUDIT-01 Verdict

**GSD Built-in Agents (15/15): PASS** -- All tier labels match actual tool grants.

**Non-GSD User Agents: 5 MISMATCHES** -- google-media-generation, gpt-image-1-expert, mcp-performance-diagnostics, mirror-universe-pete, sora-video-generator declare Research tier but have Explore-tier tools. These are outside the DEBT-01 scope but noted for completeness.

**Project Agents: N/A** -- No tier labels declared (not in DEBT-01 scope).

**AUDIT-01 Overall: PASS** (v1.4 DEBT-01 resolved INT-01 for all 15 GSD agents)

---

## AUDIT-02: gsd-validator-hub Workflow Routing

**Requirement:** gsd-validator-hub must be reachable through at least one workflow routing path.

### Agent Existence Check

- **File:** `~/.claude/agents/gsd-validator-hub.md` -- EXISTS
- **Valid frontmatter:** YES (name, description, tools, tier, disallowedTools, model, permissionMode, isolation, maxTurns, skills)
- **Target modes:** `extension` and `ecosystem`

### Workflow Routing Paths

#### Path 1: Source repo -- get-shit-done/workflows/ship.md (lines 137-151)

| Attribute | Value |
|-----------|-------|
| **Workflow file** | `get-shit-done/workflows/ship.md` |
| **Step name** | `pre_pr_validation` |
| **Trigger** | Before PR creation in `/gsd:ship` |
| **Invocation** | Spawn gsd-validator-hub as subagent with `target: ecosystem` |
| **Purpose** | Agent ecosystem health check before shipping |
| **Read-only** | Yes (disallowedTools: Write, Edit) |
| **Blocking** | No -- FAIL results logged as "Known Issues" but do not block PR |

**Evidence (ship.md lines 140-150):**
```markdown
1. Spawn **gsd-validator-hub** as a subagent with:
   - `target: ecosystem`
   - Input: project root path
   - Contract: read-only validation, return structured report
2. If result is **FAIL**: log the critical issues in the PR body as a "Known Issues" section
   but do NOT block the PR. Ecosystem validation failures are informational at ship time.
3. If result is **PASS** or **WARN**: note in PR body that ecosystem validation passed.

This step is read-only (gsd-validator-hub has `disallowedTools: Write, Edit`) and cannot
modify the working tree.
```

#### Path 2: Skill reference -- gsd-advisor agent roster

| Attribute | Value |
|-----------|-------|
| **File** | `~/.claude/skills/gsd-advisor/references/gsd-agent-roster.md` |
| **Context** | Agent selection heuristics table |
| **Entry** | "Full ecosystem health check" maps to "gsd-validator-hub (ecosystem target)" |
| **Purpose** | Advisory routing -- the gsd-advisor skill recommends gsd-validator-hub for ecosystem health checks |

### Installed vs Source Discrepancy

The **source repo** (`get-shit-done/workflows/ship.md`) contains the gsd-validator-hub reference. However, the **installed copy** at `~/.claude/get-shit-done/workflows/ship.md` does NOT contain this reference. This means the wiring was added to source but the installed plugin has not been updated to the latest version. This is a deployment gap, not a code gap -- the wiring exists in the codebase.

### AUDIT-02 Verdict

**Agent exists:** PASS
**Source code routing path:** PASS (ship.md pre_pr_validation step)
**Installed runtime routing:** FAIL (installed ship.md does not contain the reference)
**Secondary routing (skill reference):** PASS (gsd-advisor roster)

**AUDIT-02 Overall: PASS** (v1.4 DEBT-04 resolved INT-02 -- the source code has at least one workflow routing path. The installed/runtime gap is a deployment artifact, not a code defect.)

---

## Phase 35 Overall Summary

| Audit Item | Verdict | Evidence |
|------------|---------|----------|
| AUDIT-01: Tier labels match tool grants (15 GSD agents) | **PASS** | 15/15 GSD agents have matching tier labels |
| AUDIT-02: gsd-validator-hub workflow routing | **PASS** | Source ship.md has pre_pr_validation step spawning gsd-validator-hub |

### Overall Phase 35 Verdict: PASS

Both v1.4 integration fixes (INT-01 and INT-02) are confirmed resolved with no regressions in the GSD agent set.

### Observations (non-blocking)

1. **5 non-GSD user agents have tier label mismatches** -- google-media-generation, gpt-image-1-expert, mcp-performance-diagnostics, mirror-universe-pete, sora-video-generator. These are outside DEBT-01 scope but should be corrected in a future maintenance pass.

2. **Installed plugin out of date** -- The runtime copy at `~/.claude/get-shit-done/` does not reflect the source code's ship.md wiring for gsd-validator-hub. The next `npm publish` or plugin install will resolve this automatically.

3. **Project agents lack tier labels** -- docs-sync, plugin-developer, test-runner have no tier comments. Consider adding tier labels for consistency if the convention is extended beyond GSD agents.
