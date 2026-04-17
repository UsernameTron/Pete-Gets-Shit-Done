---
name: cc-ref-plugins
description: |
  Claude Code plugins reference — plugin.json manifest schema, plugin
  directory structure, component types (skills, agents, hooks, MCP servers,
  LSP servers), namespacing, ${CLAUDE_PLUGIN_ROOT}, installation scopes,
  marketplace distribution, plugin CLI commands, auto-discovery.
  Background knowledge only — provides authoritative Claude Code documentation
  for plugins. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: Plugins

## Quick Reference

### Plugin Directory Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Manifest (name required, rest optional)
├── skills/                   # Auto-discovered
│   └── my-skill/
│       └── SKILL.md
├── commands/                 # Auto-discovered (simple .md files)
│   └── deploy.md
├── agents/                   # Auto-discovered
│   └── reviewer.md
├── hooks/
│   └── hooks.json           # Or inline in plugin.json
├── .mcp.json                # Or inline in plugin.json
├── .lsp.json                # Or inline in plugin.json
└── output-styles/            # Auto-discovered
    └── concise.md
```

### plugin.json Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique identifier (kebab-case). Used as namespace prefix for all components |

### plugin.json Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Semver (e.g., `"1.2.0"`) |
| `description` | string | Brief explanation |
| `author` | object | `{name, email, url}` |
| `homepage` | string | Documentation URL |
| `repository` | string | Source code URL |
| `license` | string | License identifier (e.g., `"MIT"`) |
| `keywords` | array | Discovery tags |

### Component Path Fields

| Field | Type | Description |
|-------|------|-------------|
| `commands` | string\|array | Additional command files/dirs |
| `agents` | string\|array | Additional agent files |
| `skills` | string\|array | Additional skill dirs |
| `hooks` | string\|array\|object | Hook config paths or inline |
| `mcpServers` | string\|array\|object | MCP config paths or inline |
| `outputStyles` | string\|array | Output style files/dirs |
| `lspServers` | string\|array\|object | LSP server configs |

Custom paths **supplement** default directories — they don't replace them.
All paths must be relative to plugin root and start with `./`.

### Namespacing

All plugin components are namespaced: `/{plugin-name}:{skill-name}`
- Prevents conflicts between plugins
- Plugin name from `plugin.json` `name` field
- Example: plugin `my-tools` with skill `deploy` → `/my-tools:deploy`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to plugin directory. Use in hooks, MCP servers, scripts |

### Installation Scopes

| Scope | Settings File | Use Case |
|-------|---------------|----------|
| `user` (default) | `~/.claude/settings.json` | Personal, all projects |
| `project` | `.claude/settings.json` | Team-shared via git |
| `local` | `.claude/settings.local.json` | Project-specific, gitignored |
| `managed` | Managed settings | IT-controlled (read-only) |

### Plugin Component Types

| Component | Location | Format |
|-----------|----------|--------|
| Skills | `skills/{name}/SKILL.md` | Directory with SKILL.md + optional supporting files |
| Commands | `commands/{name}.md` | Simple markdown files |
| Agents | `agents/{name}.md` | Markdown with YAML frontmatter |
| Hooks | `hooks/hooks.json` | JSON config or inline in plugin.json |
| MCP Servers | `.mcp.json` | Standard MCP config or inline in plugin.json |
| LSP Servers | `.lsp.json` | LSP config with command + extensionToLanguage |
| Output Styles | `output-styles/{name}.md` | Markdown with frontmatter |

### Standalone vs Plugin

| Feature | Standalone (`.claude/`) | Plugin |
|---------|------------------------|--------|
| Skill names | `/hello` | `/plugin-name:hello` |
| Best for | Personal, project-specific | Sharing, distribution |
| Discovery | Auto from `.claude/` | Auto from plugin dirs |

### CLI Commands

```bash
claude --plugin-dir ./my-plugin   # Test locally
/plugin                            # Plugin manager UI
/help                              # See plugin skills listed
```

## Marketplace CLI Commands

| Command | Purpose |
|---------|---------|
| `/plugin marketplace add` | Add a marketplace source |
| `/plugin install` | Install a plugin from a marketplace |
| `/plugin uninstall` | Remove an installed plugin |
| `/plugin` | Open the plugin manager UI |

The official marketplace repository lives at `github.com/anthropics/claude-plugins-official`.

## Reference Plugins

The official Claude Code repository includes several reference plugins:

| Plugin | Description |
|--------|-------------|
| Code review | Runs 5 parallel Sonnet agents for different review dimensions |
| Feature development | Includes explorer, architect, and reviewer agents |
| Agent SDK development | Provides `/new-sdk-app` scaffolding and verification agents |
| Plugin development toolkit | 8-phase guided workflow for plugin creation |

## Plugin Enablement Configuration

Control per-plugin enablement and custom marketplaces in settings.json:

```json
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    }
  }
}
```

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for plugins. Key pages to consult:

- Plugin creation guide — quickstart, component types, development workflow, testing, conversion from standalone
- Plugin technical reference — manifest schema, all component specs, path behavior rules, environment variables, LSP servers
- Plugin marketplaces documentation — publishing, versioning, update mechanisms, marketplace configuration
- Plugin discovery and installation — install commands, scope flags, browsing, enabling/disabling

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for manifest fields, component paths, namespacing rules, or installation behavior.
