# Governance Layer Customization Guide

> How to customize the GSD governance layer: templates, hooks, permissions, and plugins.

---

## Table of Contents

- [Overview](#overview)
- [Modifying the CLAUDE.md Template](#modifying-the-claudemd-template)
- [Adding and Removing Hooks](#adding-and-removing-hooks)
- [Adjusting Permissions](#adjusting-permissions)
- [Extending with Custom Plugins](#extending-with-custom-plugins)
- [Customizing Project Scaffolding](#customizing-project-scaffolding)

---

## Overview

The governance layer lives in `governance/` within the GSD installation. It provides:

- **Templates** (`governance/templates/`) -- CLAUDE.md, hooks, permissions, context docs
- **Scripts** (`governance/scripts/`) -- Scaffolding, plugin installation, health checks
- **Tests** (`governance/tests/`) -- Validation for all governance components

Customizations can be made at two levels:

| Level | Location | Scope | Persists across updates? |
|-------|----------|-------|--------------------------|
| **Source templates** | `governance/templates/` | Affects all future installs | Only if you maintain a fork |
| **Installed files** | `~/.claude/` or `.claude/` | Current installation | Backed up to `gsd-local-patches/` on update |

For most users, edit the installed files directly. GSD's patch backup system preserves your changes across updates.

---

## Modifying the CLAUDE.md Template

### Global Template

**Source:** `governance/templates/global/CLAUDE.md`
**Installed to:** `~/.claude/CLAUDE.md`

The global CLAUDE.md defines session behavior for all projects. Key sections you might customize:

**Identity section** -- Adjust language preferences, thinking triggers, verbosity defaults:

```markdown
## Identity

- Python for data/automation, JavaScript for frontend
- Extended thinking for architectural decisions
- Concise by default; expand when asked
```

**Session Commands table** -- Add or remove commands based on your workflow.

**Development Lifecycle** -- Modify phase gates, add custom phases, or adjust the small tasks exception threshold.

**Code Standards** -- Change coverage thresholds, add project-specific conventions:

```markdown
### Coverage Standards
- Overall project coverage must be >=90%
- Security-critical modules must be >=95%
```

**Plugin Inventory** -- Update when you add or remove plugins.

### Project Template

**Source:** `governance/templates/project/CLAUDE.md`
**Installed to:** `./CLAUDE.md` (via `--scaffold`)

The project CLAUDE.md is a lighter template that extends the global one. Customize it to include project-specific architecture notes, test commands, and conventions.

---

## Adding and Removing Hooks

### Hook Definitions

**Source:** `governance/templates/global/settings-hooks.json`
**Installed to:** `~/.claude/settings.json` (merged into the `hooks` key)

### Installed Hooks

| Hook | Event | What it does |
|------|-------|--------------|
| Project scanner | `SessionStart` | Detects project state (git, CLAUDE.md, tests, agents) and routes to bootstrap or `/prime` |
| Branch protection | `PreToolUse` (Bash) | Blocks `git commit` on main/master |
| Private file guard | `PreToolUse` (Bash) | Blocks `git add` of state/, context/, .env, node_modules |
| Docs checker | `PreToolUse` (Bash) | Blocks `git commit` if CLAUDE.md, README.md, or DEVOPS-HANDOFF.md missing |
| Secrets scanner | `PreToolUse` (Bash) | Blocks `git commit` if API keys detected in staged files |
| Coverage checker | `PreToolUse` (Bash) | Warns if test coverage below threshold before commit |
| Stale docs detector | `PreToolUse` (Bash) | Warns if docs older than code changes |
| Dependency auditor | `PreToolUse` (Bash) | Warns on new dependency additions |
| Context monitor | `PostToolUse` | Injects context window usage warnings (from GSD) |
| Prompt guard | `PreToolUse` (Write/Edit) | Scans `.planning/` writes for injection patterns (from GSD) |

### Adding a Custom Hook

Edit `~/.claude/settings.json` and add to the appropriate event array:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "INPUT=$(cat); if echo \"$INPUT\" | grep -q 'npm publish'; then echo '{\"decision\":\"block\",\"reason\":\"Use CI/CD for publishing.\"}' >&2; exit 2; fi",
            "statusMessage": "Checking publish safety..."
          }
        ]
      }
    ]
  }
}
```

### Removing a Hook

Find the hook entry in `~/.claude/settings.json` under the relevant event key and delete the object from the array. Restart Claude Code for changes to take effect.

### Hook Script Pattern

For complex validation, use an external script:

```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/my-validator.sh",
  "timeout": 30
}
```

The script receives tool input as JSON on stdin. Exit code `0` = pass, exit code `2` = block (stderr shown to Claude).

---

## Adjusting Permissions

### Permission Definitions

**Source:** `governance/templates/global/settings-permissions.json`
**Installed to:** `~/.claude/settings.json` (merged into the `permissions` key)

### Default Rules

The governance layer ships with permission rules that allow common safe operations and deny access to sensitive files. Customize in `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(npm test:*)",
      "Bash(npm run lint:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(**/*.pem)",
      "Read(**/*.key)"
    ]
  }
}
```

### Adding Project-Specific Permissions

Use `.claude/settings.local.json` (not committed to git) for project-specific overrides:

```json
{
  "permissions": {
    "allow": [
      "Bash(docker compose:*)",
      "Bash(cargo test:*)"
    ],
    "deny": [
      "Read(./config/production.yml)"
    ]
  }
}
```

### Permission Precedence

1. Enterprise managed policies (highest)
2. CLI arguments
3. `.claude/settings.local.json` (project, personal)
4. `.claude/settings.json` (project, shared)
5. `~/.claude/settings.json` (global)

---

## Extending with Custom Plugins

### Registering Official Plugins

Run the plugin installer:

```bash
npx get-shit-done-cc --claude --global --plugins
```

Or manually:

```bash
governance/scripts/install-plugins.sh
```

This registers 12 official plugins including claude-code-setup, hookify, code-review, and pr-review-toolkit.

### Adding Custom Plugins

Plugins are Claude Code marketplace extensions. To add your own:

1. **Find or create** the plugin (see `claude-code-factory` for generation tools)
2. **Install** via the Claude Code CLI:
   ```bash
   claude plugin install my-plugin@my-marketplace
   ```
3. **Update** the Plugin Inventory section in your CLAUDE.md

### Plugin Engine: claude-mcp-ecosystem

Manages persistent specialist agents with memory across sessions. Provides:

- `/prime`, `/wrap` -- Session lifecycle commands
- `/agents`, `/agent-setup`, `/agent-status` -- Agent management
- 3-layer routing: project-guide (router) -> concierge/companion (orchestration) -> workers (architect, scaffolder, validator, auditor)

Customize by editing agent definitions in `.claude/agents/`.

### Plugin Engine: claude-code-factory

Generates Claude Code extensions from natural language. 35 skills organized into:

- **Core generators** -- skill-factory, hook-factory, agent-factory, plugin-packager
- **Intelligence layer** -- extension-guide, intent-engine, smart-scaffold
- **Reference skills** -- cc-ref-hooks, cc-ref-skills, cc-ref-settings, etc.
- **Quality** -- extension-auditor, extension-validator

Use these to build project-specific skills and hooks without writing them from scratch.

---

## Customizing Project Scaffolding

### Scaffold Script

**Source:** `governance/scripts/scaffold-project.sh`

Running `npx get-shit-done-cc --claude --local --scaffold` creates:

```
_project_specs/features/    # Feature specifications
tasks/                      # Task tracking (lessons.md)
context/                    # Operator identity (gitignored)
state/                      # Session audit trail (gitignored)
.claude/agents/             # Agent definitions
.claude/skills/             # Project-scoped skills
plans/                      # Implementation plans (gitignored)
outputs/                    # Work products (gitignored)
decisions/                  # Architecture decision records
docs/                       # Documentation (DEVOPS-HANDOFF.md)
.planning/                  # GSD execution state
```

### Customizing the Scaffold

Edit `governance/scripts/scaffold-project.sh` to:

- Add or remove directories
- Change which templates are copied
- Add initialization logic (git init, .gitignore generation, etc.)

### Template Files

Project templates in `governance/templates/project/` are copied during scaffolding:

| Template | Destination | Purpose |
|----------|-------------|---------|
| `CLAUDE.md` | `./CLAUDE.md` | Project governance configuration |
| `README.md` | `./README.md` | Project README skeleton |
| `DEVOPS-HANDOFF.md` | `./docs/DEVOPS-HANDOFF.md` | DevOps delivery document |
| `lessons.md` | `./tasks/lessons.md` | Lessons learned tracker |

Edit these templates to match your organization's standards before running the scaffold.
