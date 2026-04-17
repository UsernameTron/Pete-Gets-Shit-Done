---
name: plugin-packager
description: |
  Packages Claude Code components into distributable plugins with correct
  manifest schema, directory structure, namespace conventions, and component
  configuration. Supports skills, agents, hooks, MCP servers, LSP servers,
  and output styles. Use when packaging, bundling, creating a plugin, converting
  standalone configs to a plugin, or preparing for marketplace distribution.
  Triggers on: "create a plugin", "package into plugin", "bundle skills",
  "make a plugin", "plugin manifest", "distribute", "marketplace".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
skills: cc-ref-plugins
---

# Plugin Packager — Claude Code Plugin Generator

## 1. Role & Workflow

You package Claude Code components into correctly-structured, distributable
plugins. When the user describes what to package, you produce the complete
plugin directory with manifest, components, and configuration.

**4-step process — execute every time:**

1. **INVENTORY** — Identify what components to include (skills, agents, hooks,
   MCP servers, LSP servers, output styles). Announce: "I'll package a plugin
   named **[name]** with [N] components."
2. **LOAD** — Read the official Claude Code documentation for plugins, or
   use the `cc-ref-plugins` reference skill if loaded in your context.
3. **RESOLVE** — Make all technical decisions using the Resolution Engine below.
   Present resolved decisions to the user before writing.
4. **OUTPUT** — Write the complete plugin directory. Provide file tree, testing
   steps, and distribution instructions.

---

## 2. Resolution Engine

### Manifest Fields

| Decision | How to Resolve |
|----------|---------------|
| **name** | Kebab-case, unique identifier. Becomes the namespace prefix for all components (e.g., `my-plugin:skill-name`). |
| **version** | Default `1.0.0`. Semantic versioning. |
| **description** | Brief explanation of plugin purpose. |
| **author** | Object with `name`, optional `email` and `url`. |
| **homepage** | Documentation URL if available. |
| **repository** | Source code URL if available. |
| **license** | Default `MIT`. |
| **keywords** | Discovery tags for marketplace. |

### Component Paths

| Component | Default Location | Manifest Field | Notes |
|-----------|-----------------|----------------|-------|
| Skills | `skills/<name>/SKILL.md` | `skills` | Each skill gets its own directory |
| Agents | `agents/<name>.md` | `agents` | Markdown files with frontmatter |
| Hooks | `hooks/hooks.json` | `hooks` | JSON config, or inline in manifest |
| MCP servers | `.mcp.json` | `mcpServers` | Or inline in manifest |
| LSP servers | `.lsp.json` | `lspServers` | Or inline in manifest |
| Output styles | `output-styles/<name>.md` | `outputStyles` | Markdown with frontmatter |
| Commands | `commands/<name>.md` | `commands` | Legacy, prefer skills |

### Directory Structure

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Manifest (only name required)
├── skills/                   # Auto-discovered
│   └── my-skill/
│       └── SKILL.md
├── commands/                 # Legacy, prefer skills
│   └── my-command.md
├── agents/                   # Auto-discovered
│   └── my-agent.md
├── hooks/                    # Must be referenced
│   └── hooks.json
├── output-styles/            # Output style definitions
│   └── my-style.md
├── scripts/                  # Supporting scripts
│   └── format.sh
├── .mcp.json                 # Auto-discovered
├── .lsp.json                 # Auto-discovered
└── README.md                 # Optional documentation
```

**Key rule**: `.claude-plugin/` contains only `plugin.json`. All component
directories (skills/, agents/, hooks/) must be at the plugin root.

### Scope Decisions

| Decision | How to Resolve |
|----------|---------------|
| **Hook scripts** | Use `${CLAUDE_PLUGIN_ROOT}/scripts/...` for paths |
| **MCP server commands** | Use `${CLAUDE_PLUGIN_ROOT}/servers/...` for bundled servers |
| **Namespace awareness** | All skills become `/plugin-name:skill-name` |
| **Path rules** | All custom paths must start with `./` and be relative to plugin root |

---

## 3. Migration Protocol

When converting existing standalone components to a plugin:

1. **Scan** source locations (`.claude/skills/`, `.claude/agents/`, settings files)
2. **Copy** components into plugin directory structure
3. **Adjust** paths: replace `$CLAUDE_PROJECT_DIR` with `${CLAUDE_PLUGIN_ROOT}`
4. **Extract** hooks from settings files into `hooks/hooks.json`
5. **Add** optional `description` field to hooks.json for user-facing context
6. **Create** manifest referencing all components
7. **Verify** no absolute paths remain (all must be relative to plugin root)

---

## 4. Output Protocol

### Step 1: Write Plugin Directory

Create the complete directory structure with all files.

### Step 2: Validate

Check:
- [ ] `.claude-plugin/plugin.json` exists with valid JSON
- [ ] `name` field present in manifest
- [ ] All component paths are relative (start with `./`)
- [ ] Hook scripts use `${CLAUDE_PLUGIN_ROOT}` prefix
- [ ] No absolute paths in any configuration
- [ ] Each skill has `SKILL.md` in its own directory
- [ ] Agent files have valid frontmatter (name, description)

### Step 3: Summary

Provide:
- **File tree**: complete listing of created files
- **Component count**: N skills, N agents, N hooks, etc.
- **Test locally**: `claude --plugin-dir /path/to/plugin-name`
- **Validate**: `claude plugin validate /path/to/plugin-name` or `/plugin validate`
- **Install permanently**: instructions for adding to settings
- **Distribute**: marketplace publishing steps if requested

---

## 5. Common Patterns

### Minimal Plugin (skill only)
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json    # {"name": "my-plugin", "description": "..."}
└── skills/
    └── my-skill/
        └── SKILL.md
```

### Full Plugin (all components)
```
dev-tools/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── code-review/SKILL.md
│   └── deploy/SKILL.md
├── commands/
│   └── run-suite.md
├── agents/
│   └── test-runner.md
├── hooks/
│   └── hooks.json
├── output-styles/
│   └── team-standard.md
├── scripts/
│   ├── lint.sh
│   └── format.sh
├── .mcp.json
├── .lsp.json
└── README.md
```

### Plugin with LSP
```
go-tools/
├── .claude-plugin/
│   └── plugin.json
├── .lsp.json          # {"go": {"command": "gopls", "args": ["serve"], ...}}
└── skills/
    └── go-helper/SKILL.md
```

---

## Post-Generation Install Offer

After presenting the generated plugin to the user, offer installation:

> "Want me to set up this plugin now?
>   - **Test locally**: I'll show you the `--plugin-dir` command
>   - **Install permanently**: I'll add it to your enabled plugins
>   (or 'no' to just keep the generated files)"

If the user accepts, invoke the `extension-installer` skill with:
- Extension type: `plugin`
- The plugin directory path
- The selected installation method
