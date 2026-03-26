---
name: cc-ref-skills
description: |
  Claude Code skills reference — SKILL.md structure, frontmatter fields,
  allowed-tools, context fork, disable-model-invocation, user-invocable,
  $ARGUMENTS substitution, !command dynamic context injection, agent field,
  skill locations, supporting files pattern, skill creation, skill best practices.
  Background knowledge only — provides authoritative Claude Code documentation
  for skills. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: Skills

## Quick Reference

### Frontmatter Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | No | directory name | Display name / slash command. Lowercase, numbers, hyphens only (max 64 chars) |
| `description` | Recommended | first paragraph | What skill does + when to use it. Claude uses this for auto-loading |
| `argument-hint` | No | (none) | Autocomplete hint: `[issue-number]`, `[filename] [format]` |
| `disable-model-invocation` | No | `false` | `true` = only user can invoke (prevents Claude auto-trigger) |
| `user-invocable` | No | `true` | `false` = hidden from `/` menu (background knowledge only) |
| `allowed-tools` | No | (all) | Tools Claude can use without permission when skill active |
| `model` | No | (inherit) | Model to use when skill active |
| `context` | No | (inline) | `fork` = run in isolated subagent context |
| `agent` | No | `general-purpose` | Subagent type when `context: fork` (`Explore`, `Plan`, custom) |
| `hooks` | No | (none) | Hooks scoped to this skill's lifecycle (YAML format) |

### Invocation Control Matrix

| Frontmatter | User Can Invoke | Claude Can Invoke | Description in Context |
|-------------|----------------|-------------------|----------------------|
| (defaults) | Yes | Yes | Always loaded |
| `disable-model-invocation: true` | Yes | No | Not in context |
| `user-invocable: false` | No | Yes | Always loaded |

### String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking. If absent, appended as `ARGUMENTS: <value>` |
| `$ARGUMENTS[N]` / `$N` | Access argument by 0-based index (`$0` = first) |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `${CLAUDE_SKILL_DIR}` | Directory containing this skill's SKILL.md |

### Dynamic Context Injection

Use `` !`command` `` syntax to run shell commands before skill content is sent to Claude. Output replaces the placeholder:

```markdown
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

Commands execute as preprocessing — Claude only sees the final rendered output.

### Skill Locations (Highest to Lowest Priority)

| Location | Path | Applies To |
|----------|------|-----------|
| Enterprise | Managed settings | All org users |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |

Same-name conflicts: enterprise > personal > project. Plugin skills use `plugin-name:skill-name` namespace (no conflicts).

### Context Fork + Subagent Interaction

| Approach | System Prompt | Task | Also Loads |
|----------|--------------|------|-----------|
| Skill with `context: fork` | From agent type | SKILL.md content | CLAUDE.md |
| Subagent with `skills` field | Subagent's body | Claude's delegation | Preloaded skills + CLAUDE.md |

### Best Practices

- Keep SKILL.md under 500 lines — move details to supporting files
- Use progressive disclosure: `SKILL.md` → `REFERENCE.md` → `EXAMPLES.md`
- Description must include WHAT it does + WHEN to use it (trigger phrases)
- Don't explain concepts Claude already knows — teach new capabilities
- Use `allowed-tools` to restrict permissions for safety
- `.claude/commands/*.md` still works — skills take precedence on name conflicts

## CLAUDE.md Behavior

### Loading Hierarchy (Broadest to Most Specific)

| Scope | Location | Notes |
|-------|----------|-------|
| Managed | Enterprise, MDM-deployed | Cannot be excluded by individuals |
| User | `~/.claude/CLAUDE.md` | Personal, all projects |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Shared via version control |
| Ancestor directories | Walking up from cwd | Loaded automatically |
| Subdirectory | On demand when Claude reads files there | Loaded contextually |

### Key Behaviors

- **@import syntax**: `@path/to/import` includes additional files, recursive to 5 hops
- **Rules directory**: `.claude/rules/` enables topic-specific rule files with optional YAML frontmatter containing `paths` globs for conditional loading
- **Loaded as user message**: CLAUDE.md is injected as a user message, NOT as a system prompt
- **Survives compaction**: Re-read from disk after context compaction
- **No routing**: CLAUDE.md CANNOT define routing rules — routing is driven by agent `description` fields in `.claude/agents/` files
- **Subagent isolation**: Subagents do NOT inherit CLAUDE.md content — they operate with only their markdown body as context
- **SDK loading**: Only loaded when `settingSources: ["project"]` is explicitly configured in the Agent SDK

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for skills. Key pages to consult:

- Skills documentation — frontmatter reference, invocation control, arguments, dynamic context, subagent execution, supporting files, visual output, permission restrictions
- Skills best practices — writing effective descriptions, conciseness rules, token cost awareness, progressive disclosure, common anti-patterns, validation checklists

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for frontmatter field names, invocation behavior, substitution syntax, or context fork semantics.
