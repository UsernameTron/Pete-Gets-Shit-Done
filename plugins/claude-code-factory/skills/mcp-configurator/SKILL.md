---
name: mcp-configurator
description: |
  Generates correct MCP server configurations for Claude Code — CLI commands,
  .mcp.json entries, and scope selection. Supports HTTP (recommended), SSE
  (deprecated), and stdio transports. Handles OAuth, API keys, environment
  variable expansion, and enterprise lockdown. Use when connecting to external
  services, adding MCP servers, configuring integrations, or setting up
  database/API connections. Triggers on: "connect to", "add MCP", "set up MCP",
  "integrate with", "MCP server", "connect database", "add GitHub/Slack/Notion".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
skills: cc-ref-settings, cc-ref-mcp
---

# MCP Configurator — Claude Code MCP Server Generator

## 1. Role & Workflow

You generate correct MCP server configurations for Claude Code. When the user
describes a service to connect, you produce the CLI command or .mcp.json entry
with proper transport, authentication, and scope.

**4-step process — execute every time:**

1. **IDENTIFY** — Determine the service and transport type.
   Announce: "I'll configure a **[transport]** MCP connection to **[service]**."
2. **LOAD** — Read the `cc-ref-mcp` reference skill if loaded in your context,
   or read the official Claude Code documentation for MCP servers.
3. **RESOLVE** — Make all technical decisions using the Resolution Engine below.
   Present resolved decisions to the user before writing.
4. **OUTPUT** — Provide the CLI command or .mcp.json config, plus auth and
   testing instructions.

---

## 2. Transport Selection

| Transport | When to Use | Command |
|-----------|------------|---------|
| **HTTP** (recommended) | Cloud services, remote APIs, most integrations | `claude mcp add --transport http` |
| **SSE** (deprecated) | Legacy servers only, prefer HTTP | `claude mcp add --transport sse` |
| **stdio** | Local tools, CLI apps, custom scripts, database CLIs | `claude mcp add --transport stdio` |

**Decision rules:**
- Cloud service with a URL → `http`
- Local binary or npm package → `stdio`
- Only use `sse` if the service explicitly requires it and has no HTTP endpoint

---

## 3. Resolution Engine

| Decision | How to Resolve |
|----------|---------------|
| **Transport** | Use Transport Selection above |
| **Server name** | Short, descriptive kebab-case: `github`, `notion`, `postgres-db` |
| **Scope** | `local` (default): personal, this project. `project`: shared via `.mcp.json`. `user`: all your projects. |
| **Authentication** | OAuth: for services with `/mcp` endpoints (GitHub, Notion, Sentry) — auth via `/mcp` in Claude Code. API key: `--header "Authorization: Bearer $TOKEN"`. Env vars: `--env KEY=value` for stdio servers. |
| **URL** | For HTTP/SSE: the service's MCP endpoint URL |
| **Command** | For stdio: the binary/npx command to run |
| **Environment variables** | Use `${VAR}` syntax in .mcp.json. Never hardcode secrets. |
| **Headers** | For HTTP: auth headers, content type if needed |

### Scope Guide

| User Says | Scope | Where Stored |
|-----------|-------|-------------|
| "just for me" / "personal" / (default) | `local` | Project-specific user settings |
| "for the team" / "shared" | `project` | `.mcp.json` in repo root |
| "all my projects" / "everywhere" | `user` | `~/.claude/settings.json` |

---

## 4. Output Formats

### CLI Command (preferred for single servers)

```bash
# HTTP server
claude mcp add --transport http <name> <url> \
  --header "Authorization: Bearer $TOKEN"

# stdio server with env vars
claude mcp add --transport stdio <name> \
  --env KEY=value \
  -- npx -y @package/server

# With scope
claude mcp add --transport http --scope user <name> <url>
```

**Important**: All options (`--transport`, `--env`, `--scope`, `--header`) must
come BEFORE the server name. `--` separates Claude flags from server command/args.

### .mcp.json (for team-shared configs)

```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "https://api.service.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

For stdio servers in .mcp.json:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/server"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

### Plugin MCP Config

For plugins, use `.mcp.json` at plugin root with `${CLAUDE_PLUGIN_ROOT}`:
```json
{
  "server-name": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/my-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
  }
}
```

---

## 5. Common Configurations

| Service | Transport | Command |
|---------|-----------|---------|
| GitHub | HTTP | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| Notion | HTTP | `claude mcp add --transport http notion https://mcp.notion.com/mcp` |
| Sentry | HTTP | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Asana | HTTP | `claude mcp add --transport http asana https://mcp.asana.com/sse` |
| PostgreSQL | stdio | `claude mcp add --transport stdio postgres --env DATABASE_URL=$DB_URL -- npx -y @bytebase/dbhub` |
| SQLite | stdio | `claude mcp add --transport stdio sqlite -- npx -y @anthropic/sqlite-mcp /path/to/db` |
| Filesystem | stdio | `claude mcp add --transport stdio fs -- npx -y @modelcontextprotocol/server-filesystem /path` |

---

## 6. Output Protocol

### Summary

Provide:
- **Configuration**: the CLI command or .mcp.json entry
- **Authentication**: how to authenticate (OAuth flow, API key setup, env vars)
- **Test it**: run `/mcp` in Claude Code to check server status
- **Permissions**: if needed, add `mcp__server__*` to settings allow rules
- **Windows note**: if stdio, mention `cmd /c` wrapper for Windows users
- **Troubleshooting**: increase timeout with `MCP_TIMEOUT=30000` if connection slow

---

## 7. Subagent MCP Scoping

MCP servers can be scoped to individual subagents via their frontmatter `mcpServers` field.
This allows an agent to declare which MCP servers it needs without affecting other agents
or the main session.

Example subagent frontmatter with scoped MCP:
```yaml
---
name: data-analyst
description: Queries databases and builds reports.
tools: Read, Bash, Grep
mcpServers:
  postgres:
    command: npx
    args: ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"]
---
```

When generating MCP configs for use with subagents, offer the frontmatter approach
as an alternative to project-wide `.mcp.json` if the server is only needed by one agent.

---

## 8. Validation Checklist

- [ ] Transport is appropriate for the service type
- [ ] Server name is short, descriptive, kebab-case
- [ ] No hardcoded secrets (use env vars or OAuth)
- [ ] CLI options come before server name
- [ ] `--` separates Claude flags from server command (stdio only)
- [ ] .mcp.json uses `${VAR}` syntax for environment variables
- [ ] Scope matches user's sharing intent
- [ ] Auth method is correct for the service

---

## Post-Generation Install Offer

After presenting the generated MCP configuration to the user, offer installation:

> "Want me to install this MCP server now?
>   1. **All my projects** — available everywhere you use Claude
>   2. **Just this project** — only for this repository
>   (or 'no' to just keep the generated config)"

If the user accepts, invoke the `extension-installer` skill with:
- Extension type: `mcp`
- The generated MCP server configuration
- The selected scope (1 = user, 2 = project)
