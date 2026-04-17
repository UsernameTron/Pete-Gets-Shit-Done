# Team Blueprint Template

Use this template when generating team configuration documents.

## Template

```
═══════════════════════════════════════════════════
  Team Blueprint: {team-name}
  Pattern: {pattern-id} — {pattern-name}
═══════════════════════════════════════════════════

  Generated: {date}
  Scope: {project|global}

  ┌─────────────────────────────┬──────────────┬─────────┐
  │ Agent                       │ Role         │ Model   │
  ├─────────────────────────────┼──────────────┼─────────┤
  │ {agent-1}                   │ {role-1}     │ {model} │
  │ {agent-2}                   │ {role-2}     │ {model} │
  │ ...                         │ ...          │ ...     │
  └─────────────────────────────┴──────────────┴─────────┘

  Wiring Diagram:
  ─────────────────────────────────────────────────
  {wiring-diagram-from-pattern}
  ─────────────────────────────────────────────────

  Interaction Protocols:
  ─────────────────────────────────────────────────
  {interaction-protocol-from-pattern}
  ─────────────────────────────────────────────────

  Installation:
  ─────────────────────────────────────────────────
  Files written:
    {scope-path}/agents/{agent-1}.md
    {scope-path}/agents/{agent-2}.md
    ...

  To verify:
    ls {scope-path}/agents/

  To test:
    > Use the {agent-1} agent to [task]
    > Use the {agent-2} agent to [task]
  ─────────────────────────────────────────────────

  Scaling Recommendations:
  ─────────────────────────────────────────────────
  {scaling-notes-from-pattern}
  ─────────────────────────────────────────────────

═══════════════════════════════════════════════════
```

## Field Resolution

| Field | Source |
|-------|--------|
| `{team-name}` | User-provided or derived from pattern |
| `{pattern-id}` | TQ01–TQ14 |
| `{pattern-name}` | From team-registry.md |
| `{date}` | Current date |
| `{scope}` | project (default) or global |
| `{scope-path}` | `.claude` (project) or `~/.claude` (global) |
| `{agent-N}` | Resolved agent names from pattern |
| `{role-N}` | Agent role in team context |
| `{model}` | From archetype defaults |
| `{wiring-diagram}` | From team-registry.md pattern |
| `{interaction-protocol}` | From team-registry.md pattern |
| `{scaling-notes}` | From team-registry.md pattern |

## Team Context Injection

When generating agents as part of a team, add this section to each agent's system prompt:

```markdown
## Team Context

You are part of the **{team-name}** team (pattern: {pattern-id}).

### Your Teammates
{for each teammate:}
- **{teammate-name}** ({teammate-role}): {one-line description}

### Your Role
{role description specific to this team pattern}

### Communication Protocol
{interaction protocol relevant to this agent's role}

### Handoff Points
- You receive from: {upstream agents}
- You send to: {downstream agents}
```
