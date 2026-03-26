---
name: extension-installer
description: |
  Installs generated Claude Code extensions in the correct location based on
  user-selected scope. Handles skills, hooks, agents, permissions, settings,
  MCP configs, and plugins. Merges into existing configurations without
  overwriting. Verifies installation and shows how to test. Called by generators
  after extension creation, or invoked directly with /install to install
  previously generated files.
  Triggers on: "install this", "put this in place", "set this up", "activate",
  "where does this go", "how do I use this".
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: "[path-to-generated-file]"
---

# /install — Extension Installer

Install any generated Claude Code extension in the right place. Works with
skills, hooks, agents, permissions, settings, MCP configs, and plugins.

## Supporting Files
- [install-paths.md](install-paths.md) — where each type goes per scope
- [merge-strategies.md](merge-strategies.md) — how to merge into existing configs
- [verification-tests.md](verification-tests.md) — how to verify each type

---

## Usage

### Called by a generator (typical flow):
The generator passes you the extension type, generated content/path, and
optionally a pre-resolved scope (from scaffolding or recipe).

### Called directly by user:
`/install path/to/generated-file`
- Read the file, detect type from content, proceed with installation

---

## Workflow

### Step 1: Detect Extension Type

| Content Pattern | Type |
|----------------|------|
| YAML frontmatter with `name` + `description` + `tools:` field | Agent |
| YAML frontmatter with `name` + `description` + markdown body | Skill |
| JSON with `hooks` key containing event arrays | Hook configuration |
| JSON with `permissions` key | Permission rules |
| JSON with `mcpServers` key | MCP configuration |
| JSON with scalar settings (model, defaultMode, sandbox) | Settings change |
| Directory with `.claude-plugin/plugin.json` | Plugin |

### Step 2: Ask Scope (if not already known)

If scope was not pre-resolved by scaffolding or recipe:

> "Want me to install this? Quick question about where:
>   1. **All my projects** — available everywhere you use Claude
>   2. **Just this project, for the team** — teammates get it too
>   3. **Just this project, just me** — personal, won't affect others
>
>   Pick 1, 2, or 3 (or 'no' to skip installation)."

### Step 3: Resolve Target Path

Read install-paths.md. Look up the target path for this extension type + scope.

### Step 4: Pre-flight Check

Before writing anything:
- Check if target directory exists → create with `mkdir -p` if not
- Check if a file with the same name already exists at target
  → If yes: warn "A [type] named [name] already exists at [path]. Overwrite?"
- For hooks/permissions: check if target settings file is valid JSON
  → If not: create with minimal valid structure
- For MCP: check if command binary exists (stdio transport)

### Step 5: Install

Read merge-strategies.md for the correct strategy, then execute:

| Type | Strategy |
|------|----------|
| Skills | mkdir + write SKILL.md + copy supporting files |
| Agents | mkdir + write name.md |
| Hooks | read settings JSON → append hook to event array → write back + write script + chmod +x |
| Permissions | read settings JSON → append to allow/deny/ask arrays → deduplicate → write back |
| Settings | read settings JSON → set/update key (warn if overwriting) → write back |
| MCP | read .mcp.json → add server entry (warn if exists) → write back |
| Plugins | validate manifest → show --plugin-dir command or add to enabledPlugins |

### Step 6: Verify

Read verification-tests.md. Run the appropriate check and tell the user
how to confirm it works.

### Step 7: Summary

> "Installed! Here's what happened:
>   - **What**: [plain-English description]
>   - **Where**: [scope in plain language]
>   - **Test**: [how to verify it works]
>   - **Undo**: [specific removal instructions]"

---

## Undo Instructions (per type)

Every install MUST include undo instructions:

| Type | Undo |
|------|------|
| Skills | Delete the folder at [path] |
| Agents | Delete the file at [path] |
| Hooks | Remove the hook entry from [settings file] under the [event] array |
| Permissions | Remove the rule '[rule]' from [settings file] |
| Settings | Change [key] back to [previous value] in [settings file] |
| MCP | Remove the '[server]' entry from [config file] |
| Plugins | Remove from enabledPlugins in [settings file] |

---

## Rules

- NEVER install without explicit user approval (scope question = approval)
- NEVER overwrite existing files without warning + confirmation
- NEVER corrupt existing settings files — always read-merge-write
- ALWAYS verify after install — don't just write and hope
- ALWAYS include undo instructions — the user should never feel trapped
- For hooks: APPEND to event arrays, never replace the whole array
- For permissions: DEDUPLICATE after appending
- For settings scalars: WARN before overwriting an existing value
- File paths in user messages: use `~` for home, `./` for project — never absolute paths
