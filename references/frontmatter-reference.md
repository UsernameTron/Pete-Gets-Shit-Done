# Subagent Frontmatter Reference

Complete YAML frontmatter schema for Claude Code subagent .md files.

Source: ported from Subagent Lifecycle Suite v3.0.0 with GSD additions at the bottom.

## Required Fields

`name` — kebab-case identifier. Must match filename (strip .md). Example: `frontend-dev`

`description` — one or more sentences describing the agent's purpose, trigger conditions,
and refusal boundaries. This is what Claude uses for routing decisions.

## Optional Fields

`tools` — comma-separated list of allowed tools. If omitted, inherits all tools from the
main conversation. Valid tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch,
Fetch, TodoRead, TodoWrite. Format: `tools: Read, Write, Glob` (NOT array format).

`disallowedTools` — comma-separated list of tools to deny. Removes these from inherited
or specified tools. Useful for "everything except X" constraints.
Format: `disallowedTools: Write, Edit`

`model` — which Claude model to use. Values: `sonnet`, `haiku`, `opus`, `inherit`.
Use `haiku` for pattern-matching tasks (validation, auditing). Use `sonnet` for most
creation tasks. Use `opus` for adversarial reasoning, goal-backward inference, or
high-stakes commitment points. Use `inherit` only when the agent should match the
caller's model.

`memory` — enables persistent memory. Values: `user` (cross-project), `project`
(per-project), `local` (git-ignored). When enabled, the first 200 lines of MEMORY.md
are included in the agent's system prompt. Read, Write, and Edit tools are
automatically enabled.

`permissionMode` — controls file operation permissions. Values:
- `default` — normal permission prompts
- `acceptEdits` — auto-accepts file edits (use when user has pre-approved the work)
- `plan` — read-only exploration mode
- `bypassPermissions` — skips all permission checks (use with extreme caution)

`maxTurns` — positive integer. Maximum agentic turns before the subagent stops.
Prevents runaway behavior.

`skills` — list of skill names to inject. Full skill content is loaded into the
subagent's context window.

`mcpServers` — list of MCP server names the agent can access. Must be configured in
the project's settings.json.

`background` — boolean. If `true`, the subagent runs concurrently while the main
conversation continues.

`isolation` — string. If set to `worktree`, the subagent runs in a temporary git
worktree (isolated copy of the repository). Only meaningful in git repositories.

`hooks` — lifecycle hooks for the agent. Supports `PreToolUse` and `PostToolUse` with
matchers and command execution.

## Frontmatter Format

```yaml
---
name: example-agent
description: >
  Multi-line description with trigger conditions and refusal boundaries.
tools: Read, Write, Glob, Grep
model: sonnet
memory: project
maxTurns: 20
permissionMode: acceptEdits
skills:
  - skill-name-one
mcpServers:
  - mcp-server-name
---

System prompt content goes here, below the closing ---.
```

## GSD Additions

The following rules override or extend the base reference for GSD plugin agents.

### Explicit model declaration

GSD house rule: every agent MUST declare `model` explicitly. `inherit` is not
permitted. This prevents silent capability drift when the caller's model changes.

### Defense-in-depth hygiene for write-capable agents

Write-capable agents running on opus MUST include:

- `permissionMode: acceptEdits`
- `isolation: worktree`
- `maxTurns` sized to the workload (verifier ~30, debugger ~40, planner ~50)
- Body sections: `<model_rationale>`, `<scope_guard>`, `<anti_patterns>`,
  `<completion_criteria>`

### HOOK convention

When an agent is associated with a hook, declare it in frontmatter with the
`# hooks:` comment convention. This is how GSD's test suite discovers hook-coupled
agents:

```yaml
---
name: example-agent
# hooks: SubagentStop
---
```

### HDOC anti-heredoc rule

File-writing agents MUST NOT use literal `Bash(cat << 'EOF')` heredoc strings in
their system prompts. The pattern encourages agents to emit shell commands instead
of using the Write tool, and the scanner will flag it. Use the Write tool directly.
