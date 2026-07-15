---
name: team-configurator
description: |
  Detects the technology stack of the current project across all domains and
  assembles an optimal team of development agents. Detects web, mobile, data/ML,
  systems, cloud, and DevOps stacks from project config files. Writes team
  configuration to CLAUDE.md.
user-invocable: true
argument-hint: "[scope: project|global] [--detect-only]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Team Configurator — Stack Detection + Team Assembly

Detects your project's technology stack and assembles an optimal team of development agents tailored to it.

**Usage**: Invoke with optional arguments:
- `project` or `global` — scope for generated agent files (default: project)
- `--detect-only` — print detection results without generating agents

If `$ARGUMENTS` contains `--detect-only`, execute only §1-2 and print results. Otherwise execute §1-5.

---

## 1. Stack Detection

Scan the project root for config files (dependency manifests, lockfiles, IaC, CI
configs) and determine the stack with your own judgment: languages, backend and
frontend frameworks, mobile platforms, data/ML libraries, systems languages, cloud
providers, infrastructure, databases, testing, CI/CD, and monitoring. Read
dependency manifests (`package.json`, `pyproject.toml`, `Gemfile`, `build.gradle`,
etc.) rather than relying on filenames alone — the dependencies identify the
frameworks, not just the language.

Then record codebase size:

1. Count total files with `find . -type f | wc -l` (exclude node_modules, .git, vendor, __pycache__)
2. Estimate LOC with `find . -type f -name '*.{detected-extensions}' | xargs wc -l` (sample if >1000 files)

---

## 2. Detection Output Format

After scanning, present results in this format:

```
═══════════════════════════════════════
  Stack Detection Results
═══════════════════════════════════════

  Language(s):          {detected languages, comma-separated}
  Backend framework:    {detected or "none"}
  Frontend framework:   {detected or "none"}
  Mobile platform:      {detected or "none"}
  Data/ML stack:        {detected or "none"}
  Systems language:     {detected or "none"}
  Cloud provider:       {detected or "none"}
  Infrastructure:       {detected or "none"}
  Database:             {detected or "unknown"}
  Testing:              {detected or "unknown"}
  CI/CD:                {detected or "none"}
  Monitoring:           {detected or "none"}

  Codebase size:        {file count} files (~{LOC estimate} LOC)

═══════════════════════════════════════
```

If `--detect-only` was specified, STOP HERE. Print the results and exit.

---

## 3. Agent Selection

Select agents from the archetype library (`cc-ref-agent-archetypes` — 72 archetypes
across 10 domains) that match the detected stack, with your own judgment. Prefer the
smallest team that covers the project's real needs, and scale team size to codebase
size. Hard cap: **8 agents** — beyond that, an orchestrator delegates dynamically.
Add an orchestrator archetype (e.g., `tech-lead-orchestrator`) when the team is
large enough to need coordination.

---

## 4. Team Assembly

### Step 1 — Check Team Combo Patterns

The `team-combo-engine` skill defines 14 predefined team patterns (TQ01-TQ14)
spanning full-stack web, mobile, ML, data science, cloud-native, serverless,
systems, DevOps, API, microservices, and monolith teams. Compare the detected
stack against those patterns with your own judgment; if one fits, use it as the
starting point.

### Step 2 — Build Custom Team (if no combo matches)

Compose a custom team from individual archetypes using Section 3.

### Step 3 — Generate Agent Wiring

Define how agents interact:

```
Agent Workflow:
  code-reviewer ← receives diffs from all other agents
  tech-lead-orchestrator → delegates tasks to all specialists
  {backend-agent} → feeds API changes to {frontend-agent}
  {test-writer} ← receives implementation from all builders
  {security-reviewer} ← receives final output for audit
```

### Step 4 — Write Team Configuration

Determine scope from `$ARGUMENTS`:
- `project` (default): Write to `.claude/agents/`
- `global`: Write to `~/.claude/agents/`

For each selected agent:
1. Invoke `agent-factory` with the archetype specification and project context
2. Or if agent-factory is not available, write agent files directly using archetype templates from `cc-ref-agent-archetypes`

### Step 5 — Generate Team Blueprint

Write a summary document with:
- Team composition table (agent name, role, model)
- Workflow diagram (text-based, showing agent interactions)
- Estimated context cost per agent
- Scaling recommendations (what to add as project grows)

---

## 5. Output

Present the assembled team to the user:

```
═══════════════════════════════════════
  Development Team Configuration
═══════════════════════════════════════

  Stack: {summary}
  Team size: {N} agents
  Scope: {project|global}

  ┌─────────────────────────────┬──────────┬─────────┐
  │ Agent                       │ Role     │ Model   │
  ├─────────────────────────────┼──────────┼─────────┤
  │ code-reviewer               │ Core     │ inherit │
  │ {framework-specialist}      │ Primary  │ sonnet  │
  │ {other agents...}           │ ...      │ ...     │
  └─────────────────────────────┴──────────┴─────────┘

  Workflow:
    {tech-lead-orchestrator} → delegates to specialists
    {specialist-1} ↔ {specialist-2} (shared context)
    All agents → code-reviewer (review gate)

  Files written:
    .claude/agents/{agent-1}.md
    .claude/agents/{agent-2}.md
    ...

═══════════════════════════════════════
```

If `--detect-only`, only the §2 detection output is shown.

---

## 6. Error Handling

| Condition | Action |
|-----------|--------|
| No config files detected | Report "No recognized project files found" and suggest manual configuration |
| Conflicting detections | Report both and ask user to confirm primary stack |
| Agent factory unavailable | Fall back to direct file generation from archetype templates |
| Target directory not writable | Report error and suggest alternative scope |
| Existing agents in target | List existing agents, ask before overwriting |
