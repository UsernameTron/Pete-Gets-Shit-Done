# Settings & Configuration Reference

## Settings File Locations

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 (highest) | Enterprise managed policies | IT-controlled, cannot override |
| 2 | CLI arguments | Session overrides |
| 3 | `.claude/settings.local.json` | Personal project settings (not committed) |
| 4 | `.claude/settings.json` | Team project settings (committed) |
| 5 (lowest) | `~/.claude/settings.json` | Personal global settings |

---

## Example settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test:*)",
      "Read(~/.zshrc)"
    ],
    "deny": [
      "Bash(curl:*)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ],
    "ask": [
      "Bash(git push:*)"
    ],
    "additionalDirectories": ["../shared/"],
    "defaultMode": "default"
  },
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "true"
  },
  "model": "claude-sonnet-4-5-20250929",
  "includeCoAuthoredBy": true,
  "hooks": {},
  "companyAnnouncements": ["Remember to run tests before committing!"]
}
```

---

## Permission Settings

### Permission Rules

| Key | Description | Example |
|-----|-------------|---------|
| `allow` | Auto-approve tool use | `["Bash(git diff:*)"]` |
| `ask` | Prompt for confirmation | `["Bash(git push:*)"]` |
| `deny` | Block tool use | `["Read(./.env)"]` |

### Pattern Syntax

```
Tool(pattern)
```

- **Exact match**: `Bash(npm test)` - Only "npm test"
- **Prefix match**: `Bash(npm run:*)` - Anything starting with "npm run"
- **All uses**: `Bash` or `Bash(*)` - Any bash command
- **File paths**: `Read(./.env)`, `Read(./secrets/**)`

### Default Mode

```json
{
  "permissions": {
    "defaultMode": "default"
  }
}
```

Options:
- `"default"` - Normal permission prompts
- `"acceptEdits"` - Auto-accept file edits
- `"plan"` - Read-only mode
- `"bypassPermissions"` - Skip all prompts (dangerous)

---

## Key Settings

| Setting | Type | Description |
|---------|------|-------------|
| `model` | string | Default model for sessions |
| `env` | object | Environment variables for all sessions |
| `includeCoAuthoredBy` | boolean | Add Claude byline to commits (default: true) |
| `cleanupPeriodDays` | number | Days to retain transcripts (default: 30) |
| `hooks` | object | Hook configurations |
| `companyAnnouncements` | array | Messages shown at startup |
| `outputStyle` | string | Response style preset |

---

## Environment Variables

### API & Authentication

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | API key for Claude |
| `ANTHROPIC_MODEL` | Override model |
| `CLAUDE_CODE_USE_BEDROCK` | Use AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | Use Google Vertex AI |

### Behavior

| Variable | Purpose |
|----------|---------|
| `MAX_THINKING_TOKENS` | Extended thinking budget |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash command timeout |
| `BASH_MAX_OUTPUT_LENGTH` | Max bash output chars |
| `MCP_TIMEOUT` | MCP server startup timeout |
| `MCP_TOOL_TIMEOUT` | MCP tool execution timeout |
| `MAX_MCP_OUTPUT_TOKENS` | Max MCP response tokens (default: 25000) |

### Disable Features

| Variable | Purpose |
|----------|---------|
| `DISABLE_TELEMETRY` | Opt out of telemetry |
| `DISABLE_AUTOUPDATER` | Disable auto-updates |
| `DISABLE_COST_WARNINGS` | Hide cost warnings |

---

## Sandbox Settings

Enable isolated execution:

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker"],
    "network": {
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowLocalBinding": true
    }
  }
}
```

---

## Excluding Sensitive Files

Prevent Claude from accessing sensitive files:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)"
    ]
  }
}
```

---

## Model Configuration

### Override Default Models

```json
{
  "model": "claude-sonnet-4-5-20250929"
}
```

### Environment Variables

```bash
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-5-20251101
ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5-20251001
```

---

## Settings via CLI

```bash
# View settings
/config

# Check permissions
/permissions

# Modify model for session
/model

# Check status
/status
```

---

## MCP Server Settings

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["github", "notion"],
  "disabledMcpjsonServers": ["filesystem"]
}
```

---

## Plugin Settings

```json
{
  "enabledPlugins": {
    "formatter@company-tools": true,
    "linter@company-tools": true
  },
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": "github",
      "repo": "company/claude-plugins"
    }
  }
}
```

---

## Available Tools Reference

| Tool | Permission | Description |
|------|------------|-------------|
| `Read` | No | Read file contents |
| `Write` | Yes | Create/overwrite files |
| `Edit` | Yes | Targeted file edits |
| `Bash` | Yes | Execute shell commands |
| `Glob` | No | Find files by pattern |
| `Grep` | No | Search file contents |
| `WebFetch` | Yes | Fetch URL content |
| `WebSearch` | Yes | Web search |
| `Task` | No | Run subagent |
| `Skill` | Yes | Execute skill |

---

## Quick Commands

```bash
# Edit user settings
code ~/.claude/settings.json

# Edit project settings
code .claude/settings.json

# View in Claude Code
/config
/permissions
```
