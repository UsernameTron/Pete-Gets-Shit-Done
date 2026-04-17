# Scan Locations — Complete Extension Discovery Map

Every location where Claude Code extensions can exist, organized by type and scope.

---

## Skills

| Scope | Location | Glob Pattern | Extract From |
|-------|----------|-------------|--------------|
| Global (all projects) | `~/.claude/skills/*/SKILL.md` | `~/.claude/skills/*/SKILL.md` | Frontmatter: name, description, user-invocable, disable-model-invocation, allowed-tools |
| Project (shared, team) | `.claude/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` | Same |
| Plugin-provided | Plugin directories via `enabledPlugins` | Varies per plugin | Same + plugin source name |

**Scope labels**: Global → "available everywhere" | Project shared → "this project, shared" | Plugin → "from [plugin-name] plugin"

**Not found**: Skip silently. Missing directories are normal.

---

## Agents

| Scope | Location | Glob Pattern | Extract From |
|-------|----------|-------------|--------------|
| Global (all projects) | `~/.claude/agents/*.md` | `~/.claude/agents/*.md` | Frontmatter: name, description, model, tools, permissionMode |
| Project (shared, team) | `.claude/agents/*.md` | `.claude/agents/*.md` | Same |

**Scope labels**: Global → "available everywhere" | Project → "this project, shared"

---

## Hooks

Hooks are embedded in settings JSON files under the `"hooks"` key.

| Scope | Location | Extract From |
|-------|----------|--------------|
| Global (all projects) | `~/.claude/settings.json` → `hooks` | Each event → matcher → handler: event name, matcher pattern, handler type, command/prompt text (first 80 chars) |
| Project (shared, team) | `.claude/settings.json` → `hooks` | Same |
| Project (local, just me) | `.claude/settings.local.json` → `hooks` | Same |

**Scope labels**: Global → "available everywhere" | Project shared → "this project, shared" | Project local → "this project, just you"

---

## Permissions

Permissions are embedded in settings JSON files under the `"permissions"` key.

| Scope | Location | Extract From |
|-------|----------|--------------|
| Global | `~/.claude/settings.json` → `permissions` | `allow[]`, `deny[]`, `ask[]` arrays |
| Project shared | `.claude/settings.json` → `permissions` | Same |
| Project local | `.claude/settings.local.json` → `permissions` | Same |

**Scope labels**: Same as hooks.

---

## Settings (Notable Non-Defaults)

Non-default values from settings JSON files. Only extract keys that change behavior:

| Scope | Location | Keys to Check |
|-------|----------|--------------|
| Global | `~/.claude/settings.json` | `model`, `permissions.defaultMode`, `sandbox`, `additionalDirectories`, `outputStyle`, `includeCoAuthoredBy` |
| Project shared | `.claude/settings.json` | Same |
| Project local | `.claude/settings.local.json` | Same |

**Rule**: Only report values that differ from defaults. Skip if the key is absent or default.

---

## MCP Servers

| Scope | Location | Extract From |
|-------|----------|--------------|
| Project | `.mcp.json` → `mcpServers` | Server name, transport type (`type` field or infer from `command` vs `url`), command (for stdio) |
| Global | `~/.claude.json` → `mcpServers` | Same |

**Scope labels**: Project → "this project" | Global → "available everywhere"

---

## Project Configuration

| Type | Location | Extract |
|------|----------|---------|
| CLAUDE.md | `CLAUDE.md` in project root | Exists? Approximate line count. Do NOT read full contents. |
| Rules | `.claude/rules/*.md` | File count and names. Each rule file applies to paths matching its name pattern. |

**Scope**: Always project-level.

---

## Plugins

| Scope | Location | Extract |
|-------|----------|---------|
| Any settings file | `enabledPlugins` object in settings JSON | Plugin names and enabled status |
| Plugin directories | Paths registered in plugin config | Skill and agent counts per plugin |

---

## Scan Order

Execute scans in this order for consistent output:

1. Skills (global → project → plugin)
2. Agents (global → project)
3. Hooks (global → project shared → project local)
4. Permissions (global → project shared → project local)
5. Settings (global → project shared → project local)
6. MCP (global → project)
7. Project config (CLAUDE.md, rules)
8. Plugins (from settings)

For each location: if the file or directory does not exist, skip silently. Missing locations are not errors.
