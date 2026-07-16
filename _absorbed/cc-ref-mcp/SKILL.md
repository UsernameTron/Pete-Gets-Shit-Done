---
name: cc-ref-mcp
description: |
  Claude Code MCP reference — transport types (HTTP, SSE, stdio), installation
  scopes (local, project, user), .mcp.json schema, CLI commands, authentication
  (OAuth, API keys, env vars), environment variable expansion, plugin-provided
  MCP servers, subagent MCP scoping, managed enterprise configuration.
  Background knowledge only — provides authoritative Claude Code documentation
  for MCP servers. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: MCP Servers

## Quick Reference

### Transport Types

| Transport | When to Use | CLI Flag |
|-----------|------------|----------|
| **HTTP** (recommended) | Cloud services, remote APIs | `--transport http` |
| **SSE** (deprecated) | Legacy servers only — prefer HTTP | `--transport sse` |
| **stdio** | Local tools, CLI apps, npm packages | `--transport stdio` (default) |

### CLI Command Syntax
```bash
# HTTP/SSE
claude mcp add --transport http <name> <url>
claude mcp add --transport http <name> <url> --header "Authorization: Bearer $TOKEN"

# stdio
claude mcp add --transport stdio <name> -- <command> [args...]
claude mcp add --transport stdio --env KEY=value <name> -- npx -y @package/server
```

**Option ordering**: All flags (`--transport`, `--env`, `--scope`, `--header`) must come BEFORE the server name. `--` separates Claude flags from server command/args.

### Installation Scopes

| Scope | Flag | Storage | Use Case |
|-------|------|---------|----------|
| `local` (default) | `--scope local` | `~/.claude.json` under project path | Personal, this project |
| `project` | `--scope project` | `.mcp.json` in repo root (committed) | Team-shared |
| `user` | `--scope user` | User-wide settings | All your projects |

### .mcp.json Schema
```jsonc
{
  "mcpServers": {
    "server-name": {
      // HTTP/SSE server
      "type": "http",                    // "http" | "sse"
      "url": "https://api.service.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"  // env var expansion
      }
    },
    "local-server": {
      // stdio server
      "command": "npx",
      "args": ["-y", "@package/server"],
      "env": {
        "DB_URL": "${DATABASE_URL}"      // env var expansion
      }
    }
  }
}
```

Environment variable syntax: `${VAR}` expands from process environment. `${VAR:-default}` uses default if unset.

### Authentication Patterns

| Method | Transport | Example |
|--------|-----------|---------|
| **OAuth** | HTTP | Add server, then `/mcp` → Select → Authenticate → Browser flow |
| **API key** | HTTP | `--header "Authorization: Bearer $TOKEN"` or `--header "X-API-Key: $KEY"` |
| **Env vars** | stdio | `--env API_KEY=value` or `"env": {"KEY": "${VAR}"}` in .mcp.json |

### Management Commands

| Command | Purpose |
|---------|---------|
| `claude mcp list` | List all configured servers |
| `claude mcp get <name>` | Show server details |
| `claude mcp remove <name>` | Remove a server |
| `/mcp` | Check status, authenticate OAuth servers |

### Plugin MCP Servers

Plugins bundle MCP servers via `.mcp.json` at plugin root or inline in `plugin.json`:
```jsonc
{
  "server-name": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/my-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": { "DB_URL": "${DB_URL}" }
  }
}
```

`${CLAUDE_PLUGIN_ROOT}` resolves to the plugin's absolute directory path.

### Subagent MCP Scoping

Subagents can declare their own MCP servers in frontmatter:
```yaml
---
name: data-analyst
tools: Read, Bash
mcpServers:
  postgres:
    command: npx
    args: ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"]
---
```

### Environment & Limits

| Variable | Purpose |
|----------|---------|
| `MCP_TIMEOUT` | Server startup timeout in ms (default: 10000) |
| `MCP_TOOL_TIMEOUT` | Tool execution timeout |
| `MAX_MCP_OUTPUT_TOKENS` | Max response tokens (default: 25000, warning at 10000) |

### Enterprise Managed MCP

System-wide servers in managed config files:
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux: `/etc/claude-code/managed-mcp.json`

Restrict via `allowedMcpServers` / `deniedMcpServers` in managed settings.

### Windows Note

stdio servers using `npx` require `cmd /c` wrapper:
```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for MCP servers. Key pages to consult:

- MCP documentation — transport types, installation scopes, authentication, plugin MCP servers, managed configuration
- MCP setup guide — practical installation, OAuth flows, troubleshooting
- Plugin MCP reference — bundling MCP servers with plugins, `${CLAUDE_PLUGIN_ROOT}`

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for transport types, scope behavior, .mcp.json schema, authentication patterns, or CLI option ordering.
