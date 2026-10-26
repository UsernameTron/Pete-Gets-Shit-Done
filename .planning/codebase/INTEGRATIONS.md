# External Integrations

**Analysis Date:** 2026-10-26

## APIs & External Services

**npm Registry:**
- `hooks/gsd-check-update.js` runs `npm view get-shit-done-cc version` (via `execSync`, 10s timeout) inside a detached background child process at session start.
  - Cache: `$CLAUDE_CONFIG_DIR/cache/gsd-update-check.json` (defaults under `~/.claude/`)
  - Override: `GSD_UPDATE_SOURCE` points to a fork package path checked before npm
  - Wired to `SessionStart` by `bin/lib/settings-hooks.js`

**Brave Search API (optional, implemented):**
- `get-shit-done/bin/lib/commands.cjs` (`websearch` subcommand of `get-shit-done/bin/gsd-tools.cjs`) calls `https://api.search.brave.com/res/v1/web/search` with the global `fetch`.
  - Auth: `X-Subscription-Token` header from `BRAVE_API_KEY` (or `~/.gsd/brave_api_key`)
  - Unset key returns `{ available: false }`; agents fall back to the host WebSearch tool
  - Only outbound third-party HTTP call in the codebase

**Firecrawl and Exa (optional, detection-only):**
- `get-shit-done/bin/lib/config.cjs` and `get-shit-done/bin/lib/init.cjs` detect `FIRECRAWL_API_KEY` / `EXA_API_KEY` (or `~/.gsd/firecrawl_api_key`, `~/.gsd/exa_api_key`) and record availability flags. No HTTP client code; presumed consumed by separately configured MCP servers.

**agentskill.sh (not bundled):**
- `/learn` command family is documented in `CLAUDE.md` / `README.md` but implemented by a separately installed plugin, not this repo.

## Data Storage

**Databases:**
- None. All state is file-based.

**File Storage:**
- Local filesystem only
- `.planning/` - GSD state (STATE.md, PROJECT.md, ROADMAP.md, phases, codebase maps), committed
- `.claude/agent-memory/`, `state/`, `context/` - gitignored
- `~/.claude/metrics/costs.jsonl` - cost tracker output (`hooks/gsd-cost-tracker.js`)
- `~/.claude/metrics/spawns.jsonl` - subagent spawn ledger (`hooks/gsd-spawn-tracker.js`)

**Caching:**
- `$CLAUDE_CONFIG_DIR/cache/gsd-update-check.json` only

## Authentication & Identity

**Auth Provider:**
- None. Authentication belongs to the host AI runtime; optional search providers use operator-supplied API keys (`BRAVE_API_KEY`, `FIRECRAWL_API_KEY`, `EXA_API_KEY`). No accounts, sessions, or OAuth in this repo.

## Monitoring & Observability

**Error Tracking:**
- None. Hooks write to stderr; most are fail-open, `hooks/gsd-config-protection.js` and `hooks/gsd-prompt-guard.js` block on policy violation.

**Cost / Spawn Tracking:**
- `hooks/gsd-cost-tracker.js` appends JSONL (timestamp, session, model, tokens, estimated USD) per `PostToolUse`; advisory, exits 0.
- `hooks/gsd-spawn-tracker.js` appends JSONL per Task/Agent `PreToolUse`; advisory, exits 0.

**Logs:**
- Hook stdout/stderr; `GSD_DEBUG` enables diagnostics in `get-shit-done/bin/lib/core.cjs`
- `hooks/gsd-statusline.js` renders the status bar; `hooks/gsd-context-monitor.js` tracks context usage

## CI/CD & Deployment

**Hosting:**
- npm registry (`get-shit-done-cc`); GitHub repo `UsernameTron/Pete-Gets-Shit-Done`

**CI Pipeline (GitHub Actions, `.github/workflows/`):**

| Workflow | Jobs | Trigger | Purpose |
|----------|------|---------|---------|
| `test.yml` | `test` (3-way matrix), `governance`, `docs-integrity` | push/PR to main, manual | Node tests with coverage, governance shell tests, doc-link validation |
| `security-scan.yml` | `security` | PR to main | Prompt-injection, base64, secret scans; blocks committed `coverage/` |
| `auto-label-issues.yml` | `add-triage-label` | issue opened | Adds `needs-triage` label |

- `test` matrix: ubuntu/Node 20 (full), ubuntu/Node 22 (full), macos/Node 22 (non-full). Full Node 22 runs also run `scripts/check-doc-drift.cjs` and upload an lcov artifact.
- `governance`: runs `governance/tests/test_*.sh` (Python 3.x set up).
- `docs-integrity`: `node scripts/validate-doc-links.cjs` on Node 22.
- Scan scripts: `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`, `scripts/secret-scan.sh`.

**Action pins:**

| Action | Pin | Used in |
|--------|-----|---------|
| `actions/checkout` | SHA `34e114876b0b11c390a56381ad16ebd13914f8d5` (v4) | `test.yml`, `security-scan.yml` |
| `actions/setup-node` | SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` (v4) | `test.yml` |
| `actions/setup-python` | `v5` tag | `test.yml` |
| `actions/upload-artifact` | `v4` tag | `test.yml` |
| `actions/github-script` | `v8` tag | `auto-label-issues.yml` |

**Other GitHub config:** `.github/dependabot.yml` (npm, weekly), `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`. Branch protection requires 5 checks (per `CLAUDE.md`).

## Plugin System

Two bundled plugins under `plugins/`, each with `.claude-plugin/plugin.json`:

| Plugin | Path | Version | Skills (SKILL.md count) |
|--------|------|---------|-------------------------|
| claude-mcp-ecosystem | `plugins/claude-mcp-ecosystem/` | 2.0.0 | 7 |
| claude-code-factory | `plugins/claude-code-factory/` | 1.0.0 | 26 |

Total 33 skills, matching `CLAUDE.md`.

## Hook System

Distributed hooks (`hooks/*.js`, built to `hooks/dist/`, wired by `bin/lib/settings-hooks.js`):

| Hook | File | Event / matcher | Purpose |
|------|------|-----------------|---------|
| Check Update | `hooks/gsd-check-update.js` | `SessionStart` | Background npm version check |
| Context Monitor | `hooks/gsd-context-monitor.js` | `PostToolUse`, `Bash\|Edit\|Write\|MultiEdit\|Agent\|Task`, 10s | Context window usage |
| Cost Tracker | `hooks/gsd-cost-tracker.js` | `PostToolUse`, 10s | `costs.jsonl` metrics |
| Prompt Guard | `hooks/gsd-prompt-guard.js` | `PreToolUse`, `Write\|Edit`, 5s | Blocks injection patterns from `lib/injection-patterns.json` (23 patterns) |
| Config Protection | `hooks/gsd-config-protection.js` | `PreToolUse`, `Write\|Edit`, 5s | Exit 2 on 32 protected linter/formatter config filenames |
| Spawn Tracker | `hooks/gsd-spawn-tracker.js` | `PreToolUse`, `Task\|Agent`, 5s | `spawns.jsonl` ledger |
| Statusline | `hooks/gsd-statusline.js` | `statusLine` settings key | Status bar |

Project-local hooks (`.claude/settings.json`, not distributed):
- `Stop` -> `node .claude/hooks/lesson-capture-gate.cjs` - blocks session close if corrections were made without updating `tasks/lessons.md`
- `SubagentStop` -> `bash scripts/gsd-agent-health-check.sh`

## Agent and Command System

- `agents/*.md` - 17 distributed agents; `agents/_archived/` holds 8 retired definitions (not installed)
- `.claude/agents/*.md` - 3 project-scoped agents: `plugin-developer`, `test-runner`, `docs-sync`
- `commands/gsd/*.md` - 68 slash commands; `get-shit-done/commands/gsd/` adds `checkpoint.md`, `daily.md`, `harden-repo.md`, `workstreams.md`. Commands are Markdown meta-prompts with YAML frontmatter.

## Governance Layer

- `governance/scripts/` - `health-check.sh`, `install-plugins.sh`, `scaffold-project.sh`
- `governance/templates/` - global, project, context templates
- `governance/tests/` - `test_health_check.sh`, `test_install.sh`, `test_install_plugins.sh`, `test_integration.sh`, `test_scaffold.sh`
- Doc tooling: `scripts/validate-doc-links.cjs`, `scripts/check-doc-drift.cjs`

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None (Brave call is synchronous request/response)

## Environment Configuration

**Required env vars:**
- None for core functionality. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is written into installed Claude Code settings for agent teams (checked by `governance/scripts/health-check.sh`).

**Optional env vars:**
- `CLAUDE_CONFIG_DIR`, per-runtime `*_CONFIG_DIR` overrides, `GSD_WORKSTREAM`, `GSD_DEBUG`, `GSD_UPDATE_SOURCE`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`, `EXA_API_KEY` (full list in `STACK.md`)

**Secrets location:**
- Operator shell environment or `~/.gsd/*_api_key` files; none in repo. CI scans via `scripts/secret-scan.sh`.

---

*Integration audit: 2026-10-26*
