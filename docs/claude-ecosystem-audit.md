# Claude Ecosystem Audit Report
**Generated:** 2026-04-03 | **Author:** Automated Scan | **Scope:** Claude Desktop + Claude Code

---

## 1. Executive Summary

| Component | Count |
|-----------|-------|
| GSD Project Skills (Cowork-visible) | 38 |
| Plugin Skills (claude-mcp-ecosystem) | 7 |
| Plugin Commands (/prime, /wrap, etc.) | 9 |
| GSD Commands (/gsd:*) | 62 |
| Agents (GSD project) | 3 |
| Agents (claude-mcp-ecosystem plugin) | 10 || Global Hooks (SessionStart/PreToolUse/PostToolUse/Stop/PreCompact) | 12 |
| Enabled Plugins (marketplace) | 19 |
| MCP Servers (Claude Desktop) | 2 |
| Extra Known Marketplaces | 4 |

**Overall Health Grade: B-**

**Top 3 Issues:**
1. **Broken local-plugin-marketplace** — was missing entirely (FIXED this session), but the `claude-code-factory` plugin reference was orphaned and removed
2. **19 enabled plugins with no verification** — several marketplace plugins may be stale or unused
3. **Trigger collision risk** — 38 skills in Cowork + 62 GSD commands creates routing ambiguity potential (especially CSV-triggered skills)

---

## 2. Claude Code Skills Catalog (Cowork-Visible)

These are the 38 skills visible in this Cowork session via the skills system:

| # | Skill Name | Suite/Group | Status |
|---|-----------|-------------|--------|
| 1 | ispn-skill-orchestrator | ISPN Suite | Active — master router |
| 2 | ispn-constants-registry | ISPN Suite | Active — shared constants |
| 3 | ispn-dpr-analysis | ISPN Suite | Referenced but not in Cowork skill list |
| 4 | ispn-wcs-historical-trends | ISPN Suite | Active |
| 5 | ispn-scorecard-analysis | ISPN Suite | Active |
| 6 | ispn-agent-coaching | ISPN Suite | Active — requires ispn-dpr-analysis |
| 7 | ispn-cost-analytics | ISPN Suite | Active |
| 8 | ispn-capacity-planning | ISPN Suite | Active |
| 9 | ispn-partner-sla | ISPN Suite | Active (v2.0.0) |
| 10 | ispn-training-gap | ISPN Suite | Active (v2.0.0) |
| 11 | ispn-board-reporting | ISPN Suite | Active |
| 12 | ispn-wfm-schedule-reconciliation | ISPN Suite | Active — standalone |
| 13 | ispn-visual-dashboard | ISPN Suite | Active |
| 14 | ispn-weekly-scorecard-builder | ISPN Suite | Active (v1.0.0) |
| 15 | ispn-wcs-workbook-builder | ISPN Suite | Active |
| 16 | ispn-aht-driver-framework | ISPN Suite | Active |
| 17 | zcorum-wcs-builder | ISPN Suite | Active |
| 18 | genesys-cloud-cx-reporting | Genesys Platform | Referenced in orchestrator |
| 19 | genesys-qa-analytics | Genesys Platform | Active |
| 20 | genesys-queue-performance-analysis | Genesys Platform | Active |
| 21 | genesys-skills-routing | Genesys Platform | Active |
| 22 | helpdesk-ticket-analysis | HelpDesk | Active |
| 23 | helpdesk-csv-analysis | HelpDesk | Active |
| 24 | cc-ref-hooks | CC Reference | Active — auto-loads |
| 25 | cc-ref-settings | CC Reference | Active — auto-loads |
| 26 | cc-ref-skills | CC Reference | Active — auto-loads |
| 27 | skill-forge | Dev Tools | Active |
| 28 | skill-creator | Dev Tools | Active |
| 29 | obsidian-executive-poc-system | Career/Executive | Active |
| 30 | resume-builder | Career | Active |
| 31 | human-writing | Writing | Active |
| 32 | mirror-universe-pete | Writing | Active |
| 33 | mirror-vision-prompt-crafter | Creative | Active |
| 34 | hallucination-guard | Quality | Active |
| 35 | ultrathink | Orchestration | Active |
| 36 | monorepo-pattern-extractor | Dev Tools | Active |
| 37 | agent-architecture-review | Dev Tools | Active |

---

## 3. Claude Code Infrastructure

### 3.1 Global Hooks (~/.claude/settings.json)

| # | Lifecycle Event | Matcher | Purpose |
|---|----------------|---------|---------|
| 1 | SessionStart | (none) | Project state scanner — checks git, CLAUDE.md, agents, tests |
| 2 | SessionStart | (none) | GSD update checker (gsd-check-update.js) |
| 3 | PreToolUse | Bash | Block direct commits to main/master |
| 4 | PreToolUse | Bash | Block staging private/generated files |
| 5 | PreToolUse | Bash | Require CLAUDE.md, README.md, DEVOPS-HANDOFF.md before commit |
| 6 | PreToolUse | Bash | Secret/API key detection in staged files |
| 7 | PreToolUse | Bash | Nested .git directory detection |
| 8 | PreToolUse | Bash | Pre-push dirty check |
| 9 | PreToolUse | Write\|Edit | Prompt guard (gsd-prompt-guard.js) |
| 10 | PostToolUse | Write\|Edit | File type checker (test, skill, python) |
| 11 | PostToolUse | Bash\|Edit\|Write\|MultiEdit\|Agent\|Task | Context monitor (gsd-context-monitor.js) |
| 12 | Stop | (none) | Pre-stop dirty check + test/todo status |
| 13 | PreCompact | (none) | Task state preservation notice |

**StatusLine:** gsd-statusline.js (custom node script)

### 3.2 Enabled Plugins (~/.claude/settings.json → enabledPlugins)

| # | Plugin | Marketplace | Status |
|---|--------|------------|--------|
| 1 | frontend-design | claude-plugins-official | Enabled |
| 2 | github | claude-plugins-official | Enabled |
| 3 | plugin-dev | claude-plugins-official | Enabled |
| 4 | claude-md-management | claude-plugins-official | Enabled |
| 5 | claude-code-setup | claude-plugins-official | Enabled |
| 6 | pyright-lsp | claude-plugins-official | Enabled |
| 7 | code-review | claude-plugins-official | Enabled |
| 8 | hookify | claude-plugins-official | Enabled |
| 9 | slack | claude-plugins-official | Enabled |
| 10 | learn | agentskill-sh | Enabled |
| 11 | claude-code-research | claude-code-research-marketplace | Enabled |
| 12 | superpowers | claude-plugins-official | Enabled |
| 13 | claude-mcp-ecosystem | local-plugin-marketplace | Enabled (FIXED this session) |
| 14 | commit-commands | claude-plugins-official | Enabled |
| 15 | pr-review-toolkit | claude-plugins-official | Enabled |
| 16 | security-guidance | claude-plugins-official | Enabled |
| 17 | agent-sdk-dev | claude-plugins-official | Enabled |
| 18 | explanatory-output-style | claude-plugins-official | Enabled |
| 19 | ralph-loop | claude-plugins-official | Enabled |

### 3.3 Extra Known Marketplaces

| # | Name | Source Type | URL/Path |
|---|------|-----------|----------|
| 1 | superpowers-dev | git | https://github.com/obra/superpowers.git |
| 2 | agentskill-sh | url | https://agentskill.sh/marketplace.json |
| 3 | claude-code-research-marketplace | github | UsernameTron/Claude-Project-Structure-Assistant |
| 4 | local-plugin-marketplace | directory | /Users/cpconnor/projects/local-plugin-marketplace |

### 3.4 GSD Project Agents

| # | Agent Name | Location |
|---|-----------|----------|
| 1 | docs-sync | .claude/agents/docs-sync.md |
| 2 | plugin-developer | .claude/agents/plugin-developer.md |
| 3 | test-runner | .claude/agents/test-runner.md |

### 3.5 Plugin Agents (claude-mcp-ecosystem)

| # | Agent Name | Location |
|---|-----------|----------|
| 1 | agent-quality-reviewer | plugins/claude-mcp-ecosystem/agents/ |
| 2 | doc-sync-checker | plugins/claude-mcp-ecosystem/agents/ |
| 3 | extension-validator | plugins/claude-mcp-ecosystem/agents/ |
| 4 | hook-engineer | plugins/claude-mcp-ecosystem/agents/ |
| 5 | plugin-builder | plugins/claude-mcp-ecosystem/agents/ |
| 6 | recommendation-engine | plugins/claude-mcp-ecosystem/agents/ |
| 7 | stack-analyzer | plugins/claude-mcp-ecosystem/agents/ |
| 8 | subagent-generator | plugins/claude-mcp-ecosystem/agents/ |
| 9 | system-architect | plugins/claude-mcp-ecosystem/agents/ |
| 10 | team-architect | plugins/claude-mcp-ecosystem/agents/ |

### 3.6 Plugin Commands (claude-mcp-ecosystem)

| # | Command | File |
|---|---------|------|
| 1 | /prime | commands/prime.md |
| 2 | /wrap | commands/wrap.md |
| 3 | /agents | commands/agents.md |
| 4 | /agent-setup | commands/agent-setup.md |
| 5 | /agent-status | commands/agent-status.md |
| 6 | /agent-diagnose | commands/agent-diagnose.md |
| 7 | /agent-add | commands/agent-add.md |
| 8 | /agent-remove | commands/agent-remove.md |
| 9 | /agent-reset | commands/agent-reset.md |

### 3.7 GSD Commands (62 total, /gsd: namespace)

Top commands: add-backlog, add-phase, add-tests, add-todo, audit-milestone, audit-uat, autonomous, check-todos, cleanup, complete-milestone, crew, debug, discuss-phase, do, execute-phase, fast, finalize, forensics, health, help, insert-phase, list-workspaces, manager, map-codebase, milestone-summary, new-milestone, new-project, new-workspace, next, note, pause-work, plan-milestone-gaps, plan-phase, plant-seed, portfolio, pr-branch, prime-patterns, profile-user, progress, quick, reapply-patches, remove-phase, remove-workspace, research-phase, resume-work, review-backlog, review, session-report, set-profile, settings, ship, stats, thread, ui-phase, ui-review, update, validate-phase, verify-work, workstreams

---

## 4. Claude Desktop Environment

### 4.1 MCP Servers (Claude Desktop)

| # | Server Name | Also in Claude Code? |
|---|------------|---------------------|
| 1 | MCP_DOCKER | Yes (Cowork session) |
| 2 | skills-filesystem | Yes (Cowork session) |

### 4.2 Environment Comparison

| Capability | Claude Desktop | Claude Code | Cowork |
|-----------|---------------|-------------|--------|
| Skills (user) | Via Cowork skills | Via .claude/skills/ | 38 visible |
| Plugins | Via enabledPlugins | Via enabledPlugins | Plugin skills visible |
| Hooks | Global settings.json | Global settings.json | N/A |
| MCP Servers | 2 configured | Per-project .mcp.json | Inherits Desktop |
| Agents | N/A | .claude/agents/ | N/A |
| Commands | N/A | commands/ | N/A |

---

## 5. Health & Deprecation Report

### 5.1 Critical Issues

| # | Item | Type | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| 1 | claude-code-factory@local-plugin-marketplace | Plugin ref | Orphaned — plugin doesn't exist, was enabled in settings | FIXED: removed this session |
| 2 | local-plugin-marketplace directory | Infrastructure | Was missing entirely | FIXED: created with symlink this session |
| 3 | marketplace.json (inside plugin) | Config | Was stale — referenced "claude-code-research" instead of "claude-mcp-ecosystem" | FIXED: corrected this session |

### 5.2 Warnings

| # | Item | Type | Issue | Recommended Action |
|---|------|------|-------|-------------------|
| 1 | ispn-dpr-analysis | Skill | Referenced by ispn-agent-coaching and ispn-skill-orchestrator but NOT visible in Cowork skill list | Verify skill exists and is properly registered |
| 2 | genesys-cloud-cx-reporting | Skill | Referenced by ispn-skill-orchestrator but NOT in Cowork skill list | Verify skill exists |
| 3 | workforce-optimization-persona | Persona | Listed in orchestrator suite but not visible | May be intentionally unlisted |
| 4 | operations-performance-persona | Persona | Listed in orchestrator suite but not visible | May be intentionally unlisted |
| 5 | GITHUB_PERSONAL_ACCESS_TOKEN | Setting | Set to "PASTE_YOUR_NEW_PAT_HERE" in global settings | Replace with actual PAT or remove |
| 6 | 19 marketplace plugins enabled | Plugin load | Large plugin surface area impacts startup/context | Audit which are actually used |

### 5.3 Trigger Collision Risks

| # | Collision Area | Skills Involved | Risk |
|---|---------------|----------------|------|
| 1 | CSV file triggers | helpdesk-csv-analysis, ispn-scorecard-analysis, ispn-wcs-historical-trends, ispn-wfm-schedule-reconciliation | Multiple skills trigger on *.csv — orchestrator should disambiguate |
| 2 | "scorecard" keyword | ispn-scorecard-analysis, ispn-weekly-scorecard-builder | Monthly vs Weekly scorecard — different skills, similar triggers |
| 3 | "capacity" keyword | ispn-capacity-planning, operations:capacity-plan | ISPN-specific vs generic operations skill overlap |
| 4 | "cost" keywords | ispn-cost-analytics, ispn-board-reporting | Both handle cost metrics but at different granularity |
| 5 | Skill creation | skill-forge, skill-creator | Both handle skill building — forge is engineering protocol, creator is broader |

### 5.4 Staleness Indicators

| # | Item | Concern |
|---|------|---------|
| 1 | ispn-partner-sla | v2.0.0 listed as "functional" — unclear if actively maintained |
| 2 | claude-code-research plugin | Points to UsernameTron/Claude-Project-Structure-Assistant — verify repo exists |
| 3 | superpowers-dev marketplace | External git dependency — may drift |

---

## 6. Recommendations (DO NOT EXECUTE)

1. **Verify orphaned skill references** — Check if ispn-dpr-analysis, genesys-cloud-cx-reporting, and the two persona skills exist in the GSD skills/ directory and are properly registered
2. **Audit the 19 enabled plugins** — Determine which are actively used. Candidates for removal: ralph-loop, explanatory-output-style, frontend-design (if not doing frontend work)
3. **Fix the PAT placeholder** — The GITHUB_PERSONAL_ACCESS_TOKEN in settings.json is still set to "PASTE_YOUR_NEW_PAT_HERE"
4. **Consider consolidating skill-forge vs skill-creator** — Their trigger phrases overlap significantly
5. **Add version numbers** — Many skills lack version numbers, making change tracking difficult
6. **Document the GSD command set** — 62 commands is a large surface area with no visible index

---

*Report generated from live scan of ~/.claude/settings.json, plugin directories, and Cowork skill registry. Some skill directories were access-denied from Desktop Commander — full skill content analysis requires Claude Code terminal access.*