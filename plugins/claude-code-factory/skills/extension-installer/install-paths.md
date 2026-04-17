# Install Paths Reference

Where each extension type goes for each scope.

---

## Lookup Table

### Skills

| Scope | Path | Settings Entry | Committed? |
|-------|------|---------------|-----------|
| All projects | `~/.claude/skills/<name>/SKILL.md` | None (auto-discovered) | N/A |
| Project shared | `.claude/skills/<name>/SKILL.md` | None (auto-discovered) | Yes |
| Project local | `.claude/skills/<name>/SKILL.md` | None (auto-discovered) | No (gitignore) |

Install: `mkdir -p <path>/skills/<name>/` → write SKILL.md + supporting files

### Hooks

| Scope | Config File | Script Path |
|-------|------------|------------|
| All projects | `~/.claude/settings.json` | `~/.claude/hooks/` |
| Project shared | `.claude/settings.json` | `.claude/hooks/` |
| Project local | `.claude/settings.local.json` | `.claude/hooks/` |

Install: read config → merge into `hooks` object → write config + write script + `chmod +x`

### Subagents

| Scope | Path |
|-------|------|
| All projects | `~/.claude/agents/<name>.md` |
| Project shared | `.claude/agents/<name>.md` |

Install: `mkdir -p <path>/agents/` → write `<name>.md`

### Permissions

| Scope | Config File | JSON Key |
|-------|------------|---------|
| All projects | `~/.claude/settings.json` | `permissions.allow[]`, `.deny[]`, `.ask[]` |
| Project shared | `.claude/settings.json` | Same |
| Project local | `.claude/settings.local.json` | Same |

Install: read config → append rules to arrays → deduplicate → write config

### Settings (Scalars)

| Scope | Config File |
|-------|------------|
| All projects | `~/.claude/settings.json` |
| Project shared | `.claude/settings.json` |
| Project local | `.claude/settings.local.json` |

Install: read config → set/update key → warn if overwriting → write config

### MCP Servers

| Scope | Config File |
|-------|------------|
| Project | `.mcp.json` |
| All projects | Via `claude mcp add` CLI |

Install: read config → add server to `mcpServers` → warn if name exists → write config

### Plugins

| Method | Command/Path |
|--------|-------------|
| Test locally | `claude --plugin-dir ./path` |
| Install permanently | Add to `enabledPlugins` in settings.json |

Install: validate plugin.json → show test command or add to enabledPlugins
