# External Integrations

**Analysis Date:** 2026-07-12

## APIs & External Services

**npm Registry:**
- `hooks/gsd-check-update.js` queries the npm registry at session start to check for a newer package version.
  - Command: `npm view get-shit-done-cc version`
  - Runs in a detached background child process (non-blocking), 10-second timeout
  - Results cached to `$CLAUDE_CONFIG_DIR/cache/gsd-update-check.json` (defaults under `~/.claude/` when `CLAUDE_CONFIG_DIR` is unset)
  - Wired to the `SessionStart` hook event by `bin/install.js` (skipped for the OpenCode runtime)

**Brave Search API (optional, implemented):**
- `get-shit-done/bin/lib/commands.cjs` (`cmdWebsearch`, exposed as the `websearch` subcommand of `gsd-tools.cjs`) makes a real HTTP call:
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - Auth: `X-Subscription-Token` header, sourced from the `BRAVE_API_KEY` environment variable
  - If `BRAVE_API_KEY` is unset, the command silently returns `{ available: false }` and the calling agent falls back to its built-in WebSearch tool - this is a deliberate no-hard-dependency design, not an error path
  - Invocation: `node gsd-tools.cjs websearch <query> [--limit N] [--freshness day|week|month]` (documented in `docs/CLI-TOOLS.md`)
  - This is the only integration in the codebase that actually issues an outbound `fetch()` call to a third-party API.

**Firecrawl API and Exa Search API (optional, detection-only):**
- `get-shit-done/bin/lib/config.cjs` and `get-shit-done/bin/lib/init.cjs` both detect key availability for two more research providers during `/gsd:new-project` setup:
  - Firecrawl: `FIRECRAWL_API_KEY` env var, or a key file at `~/.gsd/firecrawl_api_key`
  - Exa: `EXA_API_KEY` env var, or a key file at `~/.gsd/exa_api_key`
  - Brave itself also supports the same key-file fallback pattern: `~/.gsd/brave_api_key`
  - Unlike Brave, no HTTP client code for Firecrawl or Exa exists anywhere in this repo (`grep` across `get-shit-done/bin/lib/*.cjs` finds only the availability-detection booleans, surfaced into project config as `firecrawl`/`exa_search` flags). These two are presumed to be consumed by external MCP servers configured separately in the operator's Claude Code setup, not by GSD's own code.

**agentskill.sh (external, not bundled in this repo):**
- README.md and CLAUDE.md document a `/learn` command family ("Skill discovery from agentskill.sh") for searching, installing, and rating skills from the agentskill.sh marketplace.
- This is **not implemented in this repository**. Planning notes (`.planning/milestones/v2.1-phases/1/PLAN.md`) confirm it is a separately-installed Claude Code plugin living at `~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/` on the operator's machine - GSD documents it but ships no code for it.

**No other outbound third-party API calls exist in the codebase.** Everything else is local filesystem state, the GitHub API surface (via CI and the `gh` CLI convention documented for contributors), and the host AI runtime's own tool surface (WebSearch/WebFetch/etc., which GSD prompts reference but does not implement).

## Data Storage

**Databases:**
- None. All state is file-based.

**File Storage:**
- Local filesystem only
- Project state persisted to `.planning/` (STATE.md, PROJECT.md, ROADMAP.md, phase plans, codebase maps - this document included)
- Agent memory stored in `.claude/agent-memory/` (gitignored)
- Session audit trail in `state/` (gitignored)
- Operator context in `context/` and `plugins/*/context/` (gitignored)
- Cost metrics appended to `~/.claude/metrics/costs.jsonl` (see Hook System below)

**Caching:**
- File-based cache at `$CLAUDE_CONFIG_DIR/cache/gsd-update-check.json` for npm version checks (see APIs above)

## Authentication & Identity

**Auth Provider:**
- None. Authentication is handled entirely by the host AI runtime (Claude Code, OpenCode, etc.) and, for optional search providers, by API keys the operator supplies (`BRAVE_API_KEY`, `FIRECRAWL_API_KEY`, `EXA_API_KEY`, or their `~/.gsd/*_api_key` file equivalents).
- No user accounts, sessions, or OAuth flows exist in this codebase.

## Monitoring & Observability

**Error Tracking:**
- None. Hooks write errors to stderr, which surfaces in the host runtime's verbose/debug output. Most hooks are explicitly fail-open (never block the host tool call on an internal error) except the two security-gate hooks noted below, which fail closed on a genuine policy violation.

**Cost Tracking:**
- `hooks/gsd-cost-tracker.js` appends one JSON line per `PostToolUse` event to `~/.claude/metrics/costs.jsonl`: timestamp, session id, model, input/output token counts, and an estimated USD cost (blended per-1M-token rates hardcoded for haiku/sonnet/opus tiers). Always exits 0 - advisory only, never blocks.

**Logs:**
- Hook output to stdout/stderr
- `hooks/gsd-statusline.js` renders live status information in the Claude Code status bar
- `hooks/gsd-context-monitor.js` monitors context window usage on `Bash|Edit|Write|MultiEdit|Agent|Task` tool calls

## CI/CD & Deployment

**Hosting:**
- npm registry (package `get-shit-done-cc`)
- GitHub repository: `github.com/UsernameTron/Pete-Gets-Shit-Done` (from `package.json` `repository`/`homepage`/`bugs` fields and `git remote -v`; `CHANGELOG.md` notes this was corrected from a stale prior origin in "Package metadata - repository/homepage/bugs now point at the actual origin")

**CI Pipeline (GitHub Actions, `.github/workflows/`):**

| Workflow file | Jobs | Trigger | Purpose |
|----------------|------|---------|---------|
| `test.yml` | `test` (3-way matrix), `governance`, `docs-integrity` | push to main, PR to main, manual dispatch | Runs the Node test suite with coverage, governance shell tests, and internal doc-link validation as three independently-reported status checks |
| `security-scan.yml` | `security` | PR to main | Prompt injection scan, base64-obfuscation scan, secret scan, and a check that no `coverage/` runtime artifacts are committed |
| `auto-label-issues.yml` | `add-triage-label` | issue opened | Adds a `needs-triage` label to new issues via `actions/github-script` |

**`test.yml` job detail (matches CLAUDE.md's documented 5 required branch-protection checks):**
- `test` matrix: `ubuntu-latest`/Node 20/full_suite=true, `ubuntu-latest`/Node 22/full_suite=true, `macos-latest`/Node 22/full_suite=false -> produces the 3 `test (os, node, full_suite)` status checks
- `governance`: runs every `governance/tests/test_*.sh` shell test under Python 3 (Ubuntu only)
- `docs-integrity`: runs `node scripts/validate-doc-links.cjs` with a set of `--exclude` globs for intentional fixtures/templates
- Full-suite runs (Node 22 on Ubuntu) additionally run `node scripts/check-doc-drift.cjs` (verifies numeric claims in CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md against live-measured test/coverage counts) and upload an lcov coverage artifact via `actions/upload-artifact`

**CI Security Scans (`security-scan.yml`, all diffed against `origin/$BASE_REF`):**
- `scripts/prompt-injection-scan.sh` - scans the PR diff for prompt-injection patterns
- `scripts/base64-scan.sh` - detects base64-obfuscated content in the diff
- `scripts/secret-scan.sh` - scans the diff for leaked secrets
- Inline planning-directory check - fails the job if any `coverage/` path appears in the diff (runtime coverage data must stay gitignored; `.planning/` itself is intentionally committed GSD state and is not flagged)

**GitHub Actions used (exact pins, read directly from workflow YAML):**

| Action | Pin | Used in |
|--------|-----|---------|
| `actions/checkout` | SHA `34e114876b0b11c390a56381ad16ebd13914f8d5` (tagged v4) | `test.yml` (3x), `security-scan.yml` |
| `actions/setup-node` | SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` (tagged v4) | `test.yml` (2x) |
| `actions/setup-python` | `v5` (tag, not SHA-pinned) | `test.yml` (`governance` job) |
| `actions/upload-artifact` | `v4` (tag, not SHA-pinned) | `test.yml` |
| `actions/github-script` | `v8` (tag, not SHA-pinned) | `auto-label-issues.yml` |

Note: `actions/checkout` and `actions/setup-node` are SHA-pinned; `setup-python`, `upload-artifact`, and `github-script` are not. This is a live discrepancy in the repo's own supply-chain pinning practice, not a documentation gap.

## Plugin System

**Bundled Plugins (both under `plugins/`, each with its own `.claude-plugin/plugin.json` manifest - no root-level marketplace manifest exists):**

| Plugin | Path | Version | Purpose |
|--------|------|---------|---------|
| claude-mcp-ecosystem | `plugins/claude-mcp-ecosystem/` | 2.0.0 | Session commands (`/prime`, `/wrap`), agent lifecycle (`/agents`, `/agent-setup`, `/agent-status`, `/agent-diagnose`, `/agent-add`, `/agent-remove`, `/agent-reset`), subagent orchestration |
| claude-code-factory | `plugins/claude-code-factory/` | 1.0.0 | Extension generation: skills, hooks, agents, plugins, MCP configs, CI/CD pipelines, dev-team recipes |

**Skill counts (counted directly from `SKILL.md` files on disk):**
- `plugins/claude-code-factory/skills/` - 38 skills (e.g. `agent-factory`, `cc-factory`, `skill-factory`, `hook-factory`, `extension-guide`, `extension-concierge`, `mcp-configurator`, `plugin-packager`)
- `plugins/claude-mcp-ecosystem/skills/` - 7 skills (`agent-design-patterns`, `frontmatter-reference`, `mcp-catalog`, `project-guide`, `subagent-companion`, `subagent-concierge`, `workspace-lifecycle-ref`)
- Total: 45 skills, matching the "45 skills" figure `CHANGELOG.md`'s "[Unreleased]" section reports as a verified count. No top-level `skills/` directory exists in the repo - all 45 live inside these two plugins, plus 2 project-scoped skills directly under `.claude/skills/` (`session-start-hook`, `dream-memory-consolidation`) that are not part of either plugin count.

**Subagent lifecycle agents (claude-mcp-ecosystem):** `architect`, `auditor`, `memory-seeder`, `repo-doc-architect`, `scaffolder`, `validator`

**Context templates (claude-mcp-ecosystem):** `role.example.md`, `org.example.md`, `priorities.example.md`, `metrics.example.md`

## Hook System

**Distributed hooks (`hooks/*.js`, installed into the operator's AI runtime config by `bin/install.js`; 6 files, all pure Node.js CommonJS using only built-in modules, syntax-validated at build time and shipped via `hooks/dist/`):**

| Hook | File | Event (as wired in `bin/install.js`) | Purpose |
|------|------|-----|---------|
| Check Update | `hooks/gsd-check-update.js` | `SessionStart` | Background npm version check (see APIs above) |
| Context Monitor | `hooks/gsd-context-monitor.js` | `PostToolUse` (matcher: `Bash\|Edit\|Write\|MultiEdit\|Agent\|Task`, timeout 10s) | Monitors context window usage |
| Cost Tracker | `hooks/gsd-cost-tracker.js` | `PostToolUse` (timeout 10s) | Appends per-call token/cost metrics to `~/.claude/metrics/costs.jsonl` |
| Prompt Guard | `hooks/gsd-prompt-guard.js` | `PreToolUse` (matcher: `Write\|Edit`, timeout 5s) | Blocks writes containing prompt-injection patterns; reads `lib/injection-patterns.json` (23 regex patterns across 9 categories - override, impersonation, extraction, delimiter, encoded, instruction_delimiter, markdown_role, multilingual, exfiltration/tool_manipulation - counted directly from the pattern file) |
| Config Protection | `hooks/gsd-config-protection.js` | `PreToolUse` (matcher: `Write\|Edit`, timeout 5s) | Fail-closed block (exit 2) on Write/Edit to 32 protected linter/formatter config filenames (see STACK.md) |
| Statusline | `hooks/gsd-statusline.js` | `statusLine` (separate settings key, not the `hooks` block) | Renders status bar information |

For Gemini and Antigravity runtimes, `bin/install.js` substitutes `BeforeTool`/`AfterTool` for `PreToolUse`/`PostToolUse` when wiring these same hooks.

**Project-local hook (not part of the distributed set above):**
- `.claude/hooks/lesson-capture-gate.cjs` - a Stop-event hook (585 lines) that scans the session transcript for correction-signal phrases and blocks session close (exit 2) if `tasks/lessons.md` was not updated in the same session, with a `## Session Exemptions` escape hatch. It is included in this repo's own `.c8rc.json` coverage scope.
- **This hook is registered nowhere in `.claude/settings.json` and never fires.** `.claude/settings.json` wires only one hook (`SubagentStop` -> `bash scripts/gsd-agent-health-check.sh`). This is a documented, known gap: `tasks/lessons.md` (2026-04-13 entry) records it was "shipped in PR #34 with code + tests but was never registered in settings.json Stop hooks... inert for 3 days and all of v2.2." `get-shit-done/workflows/wrap-and-sync.md` now performs the equivalent check by hand as an explicit workflow step specifically because this hook does not fire.

**Governance hook:**
- `scripts/gsd-agent-health-check.sh` - wired to `SubagentStop` in `.claude/settings.json`, the only currently-active project-level hook in this repo's own `.claude/` config.

## Agent System

**Distributed agents (`agents/*.md`, 17 total - counted directly from the directory, matching `CHANGELOG.md`'s verified count):**

`gsd-executor`, `gsd-planner`, `gsd-research-orchestrator`, `gsd-research-synthesizer`, `gsd-verifier`, `gsd-codebase-mapper`, `gsd-roadmapper`, `gsd-debugger`, `gsd-ui-auditor`, `gsd-ui-researcher`, `gsd-advisor-researcher`, `gsd-assumptions-analyzer`, `gsd-ui-checker`, `gsd-user-profiler`, `gsd-validator-hub`, `gsd-dependency-auditor`, `gsd-ecosystem-auditor`

An `agents/_archived/` subdirectory holds 8 retired agent definitions (including a former `gsd-security-guardian`, removed from the active roster) kept for reference, not installed.

**Project-scoped agents (`.claude/agents/*.md`, 3 total):** `plugin-developer`, `test-runner`, `docs-sync` (documented in root `CLAUDE.md`).

## Command System

**GSD slash commands:**
- `commands/gsd/*.md` - 67 command files (counted directly; matches the "67 slash commands" figure in root `CLAUDE.md` and `CHANGELOG.md`)
- `get-shit-done/commands/gsd/*.md` - a second, smaller directory with 4 files (`checkpoint.md`, `daily.md`, `harden-repo.md`, `workstreams.md`); 3 of these 4 (`checkpoint.md`, `daily.md`, `harden-repo.md`) have no counterpart in `commands/gsd/`, and `workstreams.md` exists in both locations. Both directories are packaged for npm publish (`package.json` `files` array lists both `commands` and `get-shit-done`).
- Commands are meta-prompts: Markdown files with YAML frontmatter (`name`, `description`, `user-invocable`) that guide the host AI runtime's behavior through structured instructions, not executable code.

## Governance Layer

**Scripts:**
- `governance/scripts/health-check.sh` - validates a Claude Code installation (Claude CLI, Python 3, Git, settings.json structure, hooks, permissions, required env vars)
- `governance/scripts/install-plugins.sh` - plugin installation automation
- `governance/scripts/scaffold-project.sh` - new project scaffolding

**Templates:**
- `governance/templates/global/` - global CLAUDE.md templates
- `governance/templates/project/` - project CLAUDE.md templates
- `governance/templates/context/` - operator context file templates

**Tests:**
- Shell-based governance tests in `governance/tests/test_*.sh`, run in CI under the `governance` job (Python 3 available, used for JSON assertions)

**Doc integrity tooling (also CI-enforced, see CI Pipeline above):**
- `scripts/validate-doc-links.cjs` - internal Markdown link/anchor validator across tracked `.md` files
- `scripts/check-doc-drift.cjs` - compares numeric claims in CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md against live-measured test counts, coverage, and filesystem inventory; requires a coverage run within the last hour

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (the Brave Search call above is a synchronous request/response API call, not a webhook)

## Environment Configuration

**Required env vars:**
- None required for core functionality
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` - required in the installed Claude Code settings for the agent-teams feature

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` - override config directory location
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` - context compaction threshold
- `NODE_V8_COVERAGE` - propagated by the test runner for c8 coverage collection
- `BRAVE_API_KEY` / `FIRECRAWL_API_KEY` / `EXA_API_KEY` - optional research-provider keys (see APIs above); each also supports a `~/.gsd/<provider>_api_key` file fallback

---

*Integration audit: 2026-07-12*
