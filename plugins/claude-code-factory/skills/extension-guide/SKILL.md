---
name: extension-guide
description: >
  Reference guide for building Claude Code extensions. Covers skill structure,
  agent frontmatter, hook configuration, plugin manifests, and MCP server setup.
  Use when creating or modifying any Claude Code extension.
---

# Extension Guide

## Skill Structure

```
skills/<name>/SKILL.md
```

Required frontmatter: `name`, `description`. Optional: `allowed-tools`, `context fork`.

## Agent Structure

```
agents/<name>.md
```

Required frontmatter: `name`, `description`. Optional: `tools`, `model`, `skills`.

## Plugin Structure

```
plugins/<name>/
  .claude-plugin/plugin.json
  commands/
  skills/
  agents/
```

`plugin.json` must contain `name`, `version`, `description`.

## Hook Configuration

Hooks are registered in `settings.json` under the `hooks` key. Events: PreToolUse, PostToolUse, SessionStart, SessionEnd, Stop.
