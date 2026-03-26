# MCP Server Setup Guide

## Overview

MCP (Model Context Protocol) connects Claude Code to external tools and data sources.

---

## Transport Types

| Type | Use Case | Example |
|------|----------|---------|
| **HTTP** (recommended) | Cloud services, APIs | GitHub, Notion, Sentry |
| **SSE** (deprecated) | Legacy servers | Older integrations |
| **stdio** | Local tools, CLI apps | Database CLI, custom scripts |

---

## Installation Scopes

| Scope | Location | Use Case |
|-------|----------|----------|
| `local` (default) | Project-specific user settings | Personal dev servers, sensitive creds |
| `project` | `.mcp.json` in repo | Team-shared servers (committed to git) |
| `user` | User-wide settings | Personal utilities across all projects |

---

## Adding Servers

### HTTP Server (Recommended for Cloud Services)
```bash
# Basic
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# With authentication header
claude mcp add --transport http notion https://mcp.notion.com/mcp \
  --header "Authorization: Bearer your-token"

# Specify scope
claude mcp add --transport http sentry --scope user https://mcp.sentry.dev/mcp
```

### stdio Server (Local Tools)
```bash
# Basic
claude mcp add --transport stdio airtable -- npx -y airtable-mcp-server

# With environment variables
claude mcp add --transport stdio db \
  --env DATABASE_URL=postgres://user:pass@host:5432/db \
  -- npx -y @bytebase/dbhub

# Windows: Use cmd wrapper
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

**Note**: The `--` separates Claude's flags from the server command.

---

## Managing Servers

```bash
# List all servers
claude mcp list

# Get details for one server
claude mcp get github

# Remove a server
claude mcp remove github

# Import from Claude Desktop
claude mcp add-from-claude-desktop

# Check status in Claude Code
/mcp
```

---

## Project .mcp.json Format

Create `.mcp.json` in project root for team-shared servers:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"],
      "env": {}
    }
  }
}
```

### Environment Variable Expansion

```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

- `${VAR}` - Uses environment variable
- `${VAR:-default}` - Uses default if not set

---

## Authentication

### OAuth (Most Cloud Services)
```bash
# Add server
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Authenticate in Claude Code
/mcp
# Select server → Authenticate → Follow browser prompts
```

### API Key (Manual)
```bash
claude mcp add --transport http service https://api.service.com/mcp \
  --header "X-API-Key: your-key"
```

---

## Using MCP Resources

Reference resources with `@`:
```
> Analyze @github:issue://123
> Query @postgres:schema://users
> Show @docs:file://api/authentication
```

## Using MCP Prompts

MCP prompts become slash commands:
```
> /mcp__github__list_prs
> /mcp__jira__create_issue "Bug title" high
```

---

## Common Servers

| Server | Purpose | Command |
|--------|---------|---------|
| GitHub | Issues, PRs, repos | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| Notion | Pages, databases | `claude mcp add --transport http notion https://mcp.notion.com/mcp` |
| Sentry | Error monitoring | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Filesystem | Local file access | `claude mcp add --transport stdio fs -- npx -y @modelcontextprotocol/server-filesystem /path` |

---

## Troubleshooting

### Server Won't Connect
1. Check server status: `/mcp`
2. Verify URL is correct
3. Check authentication: Re-auth via `/mcp`
4. Increase timeout: `MCP_TIMEOUT=30000 claude`

### Tools Not Appearing
1. Restart Claude Code after adding server
2. Check server logs with `--verbose`
3. Verify server exposes tools (not all do)

### Permission Denied
Check permissions in settings:
```json
{
  "permissions": {
    "allow": ["mcp__github"]
  }
}
```

### Output Truncated
Increase limit: `MAX_MCP_OUTPUT_TOKENS=50000`

---

## Using Claude Code as MCP Server

Expose Claude Code's tools to other apps:

```bash
claude mcp serve
```

Configure in Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "/full/path/to/claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

---

## Enterprise MCP Configuration

System-wide servers (managed by IT):
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux: `/etc/claude-code/managed-mcp.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-mcp.json`

Restrict allowed servers in `managed-settings.json`:
```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverName": "company-internal" }
  ],
  "deniedMcpServers": [
    { "serverName": "filesystem" }
  ]
}
```
