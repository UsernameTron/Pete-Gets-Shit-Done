---
name: team-combo-engine
description: |
  Assembles coordinated teams of application development agents from 14 proven
  team patterns. Matches user intent to team combos, resolves parameterized
  slots, generates team blueprints with agent wiring and interaction protocols.
user-invocable: false
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Team Combo Engine — Coordinated Team Assembly

Assembles multi-agent teams from 14 proven patterns with full wiring and interaction protocols.

## How It Works

### 1. Pattern Matching

Match user intent to a team pattern using trigger phrases in the [team registry](team-registry.md).

If no pattern matches, fall back to TQ08 (Custom Team) and let the user select agents manually.

### 2. Slot Resolution

Many patterns contain parameterized slots (e.g., `{framework}-specialist`, `{cloud}-architect`). Resolve these by:

1. Checking stack detection results from `team-configurator` or `stack-analyzer`
2. If stack is ambiguous, ask the user to choose
3. Map the choice to the specific archetype from `cc-ref-agent-archetypes`

### 3. Blueprint Generation

For the resolved team, generate a blueprint using the [blueprint template](team-blueprint-template.md):

1. List all agents with roles and models
2. Generate wiring diagram showing data flow between agents
3. Define interaction protocols (how agents communicate)
4. Add installation instructions
5. Add quick-start guide

### 4. Agent Generation

For each agent in the team:

1. Look up the archetype in `cc-ref-agent-archetypes`
2. Apply any team-specific customizations
3. Invoke `agent-factory` to generate the agent .md file
4. Add team context to each agent's system prompt (awareness of other team members)

### 5. Team Wiring

Add cross-references to each agent's system prompt so they know about teammates:

```
## Team Context
You are part of the {team-name} team.
Your teammates: {list of agents with roles}
Your role in the team: {specific role description}
Communication protocol: {how to interact with teammates}
```

## Pattern Reference

See [team-registry.md](team-registry.md) for all 14 patterns with:
- Trigger phrases
- Component agents
- Wiring diagrams
- Interaction protocols
- Scaling notes

## Blueprint Template

See [team-blueprint-template.md](team-blueprint-template.md) for the output format.
