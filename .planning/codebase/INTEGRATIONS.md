# External Integrations

**Analysis Date:** 2026-04-06

## APIs & External Services

**npm Registry:**
- The `gsd-check-update.js` hook queries the npm registry at session start to check for newer versions
  - Command: `npm view get-shit-done-cc version`
  - Runs in a detached background child process (non-blocking)
  - Results cached to `~/.claude/cache/gsd-update-check.json`
  - Timeout: 10 seconds
  - File: `hooks/gsd-check-update.js`

**No other external APIs are consumed.** This is a self-contained meta-prompting system with no database, no cloud services, and no external API calls beyond the npm version check.

## Data Storage

**Databases:**
- None. All state is file-based.

**File Storage:**
- Local filesystem only
- State persisted to `.planning/` directory (STATE.md, PROJECT.md, ROADMAP.md, phase plans)
- Agent memory stored in `.claude/agent-memory/`
- Session audit trail in `state/` (gitignored)
- Operator context in `context/` (gitignored)

**Caching:**
- File-based cache at `~/.claude/cache/gsd-update-check.json` for npm version checks

## Authentication & Identity

**Auth Provider:**
- None. Authentication is handled by the host AI runtime (Claude Code, OpenCode, etc.)
- No user accounts, no tokens, no OAuth flows in this codebase

## Monitoring & Observability

**Error Tracking:**
- None. Hooks write errors to stderr which surfaces in the host runtime's verbose mode.

**Logs:**
- Hook output to stdout/stderr
- `gsd-statusline.js` renders status information in the Claude Code status bar
- `gsd-context-monitor.js` monitors context window usage

## CI/CD & Deployment

**Hosting:**
- npm registry (`get-shit-done-cc` package)
- GitHub repository: `github.com/gsd-build/get-shit-done`

**CI Pipeline (GitHub Actions):**

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Tests | `.github/workflows/test.yml` | Push to main, PRs to main | Run tests on Node 20/22/24 (Ubuntu) + Node 22 (macOS, Windows); coverage upload |
| Security Scan | `.github/workflows/security-scan.yml` | PRs to main | Prompt injection scan, base64 obfuscation scan, secret scan, planning directory check |
| Auto-label Issues | `.github/workflows/auto-label-issues.yml` | Issue opened | Adds `needs-triage` label to new issues |

**CI Security Scans:**
- `scripts/prompt-injection-scan.sh` — Scans diffs for prompt injection patterns
- `scripts/base64-scan.sh` — Detects base64-obfuscated content in diffs
- `scripts/secret-scan.sh` — Scans diffs for leaked secrets
- All scans run against `origin/$BASE_REF` diff (PR changes only)

**CI Actions Used:**
- `actions/checkout@v6.0.2` (pinned by SHA)
- `actions/setup-node@v6.3.0` (pinned by SHA)
- `actions/setup-python@v5.6.0` (pinned by SHA)
- `actions/upload-artifact@v4.6.2` (pinned by SHA)
- `actions/github-script@v8` (tag reference)

## Plugin System

**Bundled Plugins:**

| Plugin | Path | Version | Purpose |
|--------|------|---------|---------|
| claude-mcp-ecosystem | `plugins/claude-mcp-ecosystem/` | 2.0.0 | Session commands (/prime, /wrap), agent lifecycle, subagent orchestration |
| claude-code-factory | `plugins/claude-code-factory/` | 1.0.0 | Extension generation: skills, hooks, agents, plugins |

Plugin manifests live at `plugins/<name>/.claude-plugin/plugin.json`.

**Plugin Components (claude-mcp-ecosystem):**
- Commands: `/prime`, `/wrap`, `/agents`, `/agent-setup`, `/agent-status`, `/agent-diagnose`, `/agent-add`, `/agent-remove`, `/agent-reset`
- Skills: `agent-design-patterns`, `frontmatter-reference`, `mcp-catalog`, `workspace-lifecycle-ref`, `project-guide`, `subagent-companion`, `subagent-concierge`
- Subagent lifecycle agents: `architect`, `auditor`, `memory-seeder`, `repo-doc-architect`, `scaffolder`, `validator`
- Context templates: `role.example.md`, `org.example.md`, `priorities.example.md`, `metrics.example.md`

**Plugin Components (claude-code-factory):**
- Skills and agents for generating new Claude Code extensions

## Hook System

**Distributed Hooks (installed to user's AI runtime config):**

| Hook | File | Event | Purpose |
|------|------|-------|---------|
| Check Update | `hooks/gsd-check-update.js` | SessionStart | Background npm version check |
| Context Monitor | `hooks/gsd-context-monitor.js` | PostToolUse | Monitors context window usage |
| Prompt Guard | `hooks/gsd-prompt-guard.js` | PreToolUse | Security guard for prompt injection |
| Statusline | `hooks/gsd-statusline.js` | PostToolUse | Renders status bar information |
| Workflow Guard | `hooks/gsd-workflow-guard.js` | PreToolUse | Enforces workflow rules |

All hooks are pure Node.js (CommonJS) using only built-in modules. They are syntax-validated during build (`scripts/build-hooks.js`) and distributed via `hooks/dist/`.

## Agent System

**Distributed Agents (15 total):**

| Agent | File | Sandbox |
|-------|------|---------|
| gsd-executor | `agents/gsd-executor.md` | workspace-write |
| gsd-planner | `agents/gsd-planner.md` | workspace-write |
| gsd-research-orchestrator | `agents/gsd-research-orchestrator.md` | workspace-write |
| gsd-research-synthesizer | `agents/gsd-research-synthesizer.md` | workspace-write |
| gsd-verifier | `agents/gsd-verifier.md` | workspace-write |
| gsd-codebase-mapper | `agents/gsd-codebase-mapper.md` | workspace-write |
| gsd-roadmapper | `agents/gsd-roadmapper.md` | workspace-write |
| gsd-debugger | `agents/gsd-debugger.md` | workspace-write |
| gsd-ui-auditor | `agents/gsd-ui-auditor.md` | workspace-write |
| gsd-ui-researcher | `agents/gsd-ui-researcher.md` | workspace-write |
| gsd-advisor-researcher | `agents/gsd-advisor-researcher.md` | read-only |
| gsd-assumptions-analyzer | `agents/gsd-assumptions-analyzer.md` | read-only |
| gsd-ui-checker | `agents/gsd-ui-checker.md` | read-only |
| gsd-user-profiler | `agents/gsd-user-profiler.md` | read-only |
| gsd-validator-hub | `agents/gsd-validator-hub.md` | read-only |

Sandbox modes are defined in `bin/install.js` (Codex config) and agent frontmatter.

## Command System

**GSD Slash Commands (60+ total):**
- Defined as Markdown files in `commands/gsd/*.md` (60 commands)
- Additional commands in `get-shit-done/commands/gsd/` and plugin command directories
- Commands are meta-prompts that guide AI runtime behavior through structured Markdown

## Governance Layer

**Scripts:**
- `governance/scripts/health-check.sh` — Validates Claude Code installation (Claude, Python, Git, settings, hooks, permissions)
- `governance/scripts/install-plugins.sh` — Plugin installation automation
- `governance/scripts/scaffold-project.sh` — New project scaffolding

**Templates:**
- `governance/templates/global/` — Global CLAUDE.md templates
- `governance/templates/project/` — Project CLAUDE.md templates
- `governance/templates/context/` — Operator context file templates

**Tests:**
- Shell-based governance tests in `governance/tests/test_*.sh`
- Run in CI under the `governance` job with Python available

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Environment Configuration

**Required env vars:**
- None required for core functionality
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — Required in Claude Code settings for agent teams feature

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` — Override config directory location
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` — Context compaction threshold
- `NODE_V8_COVERAGE` — Propagated by test runner for c8 coverage collection

---

*Integration audit: 2026-04-06*
