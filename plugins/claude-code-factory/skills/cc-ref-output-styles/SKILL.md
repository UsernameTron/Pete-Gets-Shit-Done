---
name: cc-ref-output-styles
description: |
  Claude Code output styles reference — frontmatter fields (name, description,
  keep-coding-instructions), built-in styles (Default, Explanatory, Learning),
  custom style file structure, scope directories, system prompt behavior,
  style vs CLAUDE.md vs --append-system-prompt vs skills vs agents distinctions.
  Background knowledge only — provides authoritative Claude Code documentation
  for output styles. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: Output Styles

## Quick Reference

### How Output Styles Work

- Output styles modify Claude Code's **system prompt** directly
- All styles **exclude** default efficient-output instructions (conciseness rules)
- Custom styles also **exclude** default coding instructions unless `keep-coding-instructions: true`
- Custom style content is **appended** to the end of the system prompt
- Style reminders are injected during conversation to maintain consistency
- Changes take effect at **next session start** (not mid-session)

### Built-in Styles

| Style | Behavior |
|-------|----------|
| **Default** | Standard software engineering — efficient, concise output |
| **Explanatory** | Adds educational "Insights" between coding tasks — explains implementation choices and codebase patterns |
| **Learning** | Collaborative learn-by-doing mode — shares Insights plus adds `TODO(human)` markers for user to implement |

### Custom Style File Structure
```markdown
---
name: Style Name Here
description: Brief description shown in /config picker
keep-coding-instructions: false
---

# Style Instructions

You are [role]. Your responses should be [characteristics].

## Response Format
[Define structure of every response]

## Tone
[Define communication style]

## Constraints
[Define limits and avoidances]
```

### Frontmatter Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | No | filename | Display name in UI. Can use spaces and mixed case. |
| `description` | No | none | Shown in `/config` style picker |
| `keep-coding-instructions` | No | `false` | Keep coding-specific system prompt (test running, code verification) |

### Scope Directories

| Scope | Directory | Applies To |
|-------|-----------|-----------|
| User | `~/.claude/output-styles/` | All your projects |
| Project | `.claude/output-styles/` | Current project only |

Filename: kebab-case `.md` (e.g., `executive-briefing.md`).

### Activating a Style

- **Menu**: `/config` → Output style → select from list
- **Settings**: `"outputStyle": "Style Name"` in any settings file
- **Revert**: Select "Default" in `/config`

Setting is saved to `.claude/settings.local.json` (local project level).

### Output Styles vs Alternatives

| Approach | Modifies System Prompt | Persistence | Best For |
|----------|----------------------|-------------|----------|
| **Output style** | Replaces default sections | Saved in settings | Persistent tone/format |
| **CLAUDE.md** | No — added as user message after system prompt | Per project | Project rules |
| **--append-system-prompt** | Appends to system prompt | Session only | One-off instructions |
| **Skill** | No — loaded on demand | When triggered | Task-specific workflows |
| **Agent** | Has own system prompt | Per invocation | Delegated tasks with tool/model constraints |

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for output styles. Key pages to consult:

- Output styles documentation — built-in styles, custom creation, frontmatter fields, scope, activation
- Settings documentation — where outputStyle is configured, settings file precedence

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for frontmatter fields, system prompt behavior, or style-vs-alternatives distinctions.
