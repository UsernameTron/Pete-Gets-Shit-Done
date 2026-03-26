# Claude Code Factory

A Claude Code plugin that generates extensions **and** application development agents from natural language. Two integrated systems in one plugin:

- **Extension Factory** — generates skills, hooks, plugins, MCP configs, settings, CI/CD pipelines, and output styles
- **Dev Team Factory** — generates application development agents, framework specialists, and coordinated dev teams

## Dev Team Factory

### Features

- 72 agent archetypes across 10 development domains
- 86 pre-built recipes for instant agent creation
- 14 team combo patterns for coordinated multi-agent teams
- Automatic tech stack detection (25+ config file types)
- Factory model: generates customized agents per project, not static files

### Domains Covered

| # | Domain | Specialists | Examples |
|---|--------|-------------|---------|
| 1 | Core Team | 4 | Code review, performance, archaeology, documentation |
| 2 | Web Frameworks | 13 | Django, Rails, Laravel, React, Vue, Next.js, Nuxt |
| 3 | Mobile | 6 | iOS, Android, Flutter, React Native |
| 4 | Data Science & ML | 8 | Pipelines, PyTorch, sklearn, MLOps, Jupyter |
| 5 | Systems Programming | 6 | Rust, C++, embedded, OS-level |
| 6 | Cloud & Infrastructure | 7 | AWS, GCP, Terraform, Kubernetes |
| 7 | DevOps & Observability | 6 | CI/CD, monitoring, SRE, incident response |
| 8 | Universal Experts | 4 | Language-agnostic backend, frontend, API, DevOps |
| 9 | Domain Specialists | 16 | Security, testing, DB, accessibility, i18n, caching |
| 10 | Orchestrators | 2 | Tech lead, team configurator |

### Quick Start — Dev Teams

```bash
# Create a single agent
> I need a Django API specialist for my REST backend
> Create a Rust safety auditor for my systems project
> Set up a PyTorch specialist for model training

# Assemble a team
> Set up a dev team for my React + Django project
> I need an ML pipeline team
> Configure a mobile team for iOS and Android

# Browse recipes
> /dev-recipes
> /dev-recipes mobile
> /dev-recipes TQ10

# Auto-detect stack
> /team-configurator
> /team-configurator --detect-only
```

---

## Extension Factory

### Features

- Intent-driven routing — describe what you need, routing is automatic
- 40 pre-built extension recipes across 6 categories
- 12 coordinated multi-extension combo patterns
- Two-stage review loop (spec compliance + schema quality)
- Lifecycle tools: install, explain, fix, audit, upgrade

### Quick Start — Extensions

```bash
# Generate extensions — routing is automatic:
> I need a hook that blocks writes to .env files
> Create a skill that formats SQL queries
> Configure permissions to block curl piped to bash
> Set up GitHub Actions to review PRs with Claude
> Connect to my PostgreSQL database via MCP
> Package my skills and hooks into a plugin

# Browse pre-built recipes:
> /recipes automation
> /recipes "format on save"

# Install, explain, fix:
> /install
> /explain-my-setup
> /fix-my-extension
```

---

## Installation

### Quick Install (Recommended)

```bash
# Install as a Claude Code plugin — this gives you BOTH factories
claude plugin add /path/to/claude-code-factory
```

### Alternative: Test Locally

```bash
# Point Claude Code at the plugin directory for testing
claude --plugin-dir /path/to/claude-code-factory
```

### Alternative: Copy Individual Components

```bash
# Copy only the skills and agents you want
cp -r skills/hook-factory ~/.claude/skills/       # Just the hook generator
cp -r skills/dev-recipes ~/.claude/skills/         # Just the dev recipes
cp -r agents/team-architect.md ~/.claude/agents/   # Just one agent
```

### What You Get

One install gives you **both** factories:

| Factory | What It Does | Try It |
|---------|-------------|--------|
| **Extension Factory** | Generates Claude Code extensions (skills, hooks, plugins, MCP, settings, CI/CD) | `"I need a hook that blocks writes to .env files"` |
| **Dev Team Factory** | Generates development agents and teams across 10 domains | `"Set up a dev team for my React + Django project"` |

No configuration needed. Just ask for what you want — routing is automatic.

> **New to Claude Code plugins?** See the [Getting Started Guide](docs/getting-started.md) for a complete walkthrough.

---

## Architecture

```
Extension Factory                        Dev Team Factory
════════════════                         ════════════════

Layer 0: extension-guide                 dev-team-guide
         (invisible router)              (invisible router)
              |                                |
Layer 1: intent-engine                   dev-team-concierge
         smart-scaffold                  (orchestrator)
         extension-concierge                   |
              |                                |
Layer 2: Generator Skills                Generator Skills
         skill-factory                   agent-factory
         hook-factory                    team-configurator
         plugin-packager                       |
         mcp-configurator               Library
         settings-architect              dev-recipes (86 recipes)
         cicd-generator                  team-combo-engine (14 patterns)
         output-style-creator                  |
              |                          Reference Skills
         Reference Skills                cc-ref-agent-archetypes (72 templates)
         cc-ref-hooks                    cc-ref-agent-workflows (7 patterns)
         cc-ref-settings                       |
         cc-ref-skills                   Specialist Agents
         cc-ref-permissions              team-architect
         cc-ref-plugins                  agent-quality-reviewer
         cc-ref-subagents                stack-analyzer
         cc-ref-multi-agent
         cc-ref-mcp
         cc-ref-cicd
         cc-ref-output-styles
```

---

## Components

### Dev Team Factory

#### Routing & Orchestration (Layer 0-1)

| Skill | Type | Description |
|-------|------|-------------|
| **dev-team-guide** | Router | Invisible intent router for dev team requests — routes to dev-team-concierge |
| **dev-team-concierge** | Orchestrator | Resolves agent specifications, dispatches to agent-factory and team-configurator |

#### Generator Skills

| Skill | Description |
|-------|-------------|
| **agent-factory** | Generates agent .md files from 72 archetypes with correct frontmatter and system prompts |
| **team-configurator** | `/team-configurator` — Detects tech stack (25+ config types) and assembles optimal agent teams |

#### Library Skills

| Skill | Description |
|-------|-------------|
| **dev-recipes** | `/dev-recipes` — Browse and execute 86 pre-built recipes across 11 categories |
| **team-combo-engine** | 14 coordinated team patterns with wiring diagrams and interaction protocols |

#### Reference Skills

| Skill | Coverage |
|-------|----------|
| **cc-ref-agent-archetypes** | 72 agent templates across 10 domain files — system prompts, tools, models, constraints |
| **cc-ref-agent-workflows** | 7 workflow pattern files — review, optimization, audit, delegation, ML, infrastructure, composable blocks |

#### Specialist Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| **team-architect** | Sonnet | Designs multi-agent teams from 14 patterns and 72 archetypes |
| **agent-quality-reviewer** | Haiku | Validates generated agent files for correctness and quality |
| **stack-analyzer** | Haiku | Detects tech stack across 25+ config types for team assembly |

### Extension Factory

#### Routing & Intelligence (Layer 0-1)

| Skill | Type | Description |
|-------|------|-------------|
| **extension-guide** | Router | Invisible intent router — detects FIX/DIAGNOSE/UPGRADE/EXPLAIN/PACKAGE/CREATE |
| **intent-engine** | Classifier | Behavioral signal classification with 4-stage pipeline |
| **smart-scaffold** | Clarifier | Jargon-free question flows + tier classification |

#### Orchestration (Layer 1)

| Skill | Type | Description |
|-------|------|-------------|
| **extension-concierge** | Orchestrator | Resolves decisions, dispatches generators, runs two-stage review |
| **extension-combo-engine** | Combinator | 12 coordinated multi-extension patterns |
| **cc-factory** | Generator | Direct-access generator with full detection/resolution/output logic |

#### Generator Skills (Layer 2)

| Skill | Generates |
|-------|-----------|
| **skill-factory** | SKILL.md files with frontmatter, invocation control, tool restrictions |
| **hook-factory** | Hook JSON configs for all events and 4 handler types |
| **plugin-packager** | Complete plugins with manifest and directory structure |
| **mcp-configurator** | MCP server configs — CLI commands, .mcp.json, scope selection |
| **settings-architect** | settings.json with permissions, sandbox, model, env vars |
| **cicd-generator** | GitHub Actions and GitLab CI/CD pipelines |
| **output-style-creator** | Output style files with frontmatter and system prompt content |

#### Lifecycle Tools

| Skill | Command | Description |
|-------|---------|-------------|
| **scenario-library** | `/recipes` | Browse 40 pre-built extension recipes across 6 categories |
| **extension-installer** | `/install` | One-shot install with scope selection and merge handling |
| **setup-explainer** | `/explain-my-setup` | Discover and explain all installed extensions |
| **extension-fixer** | `/fix-my-extension` | Diagnose and repair broken extensions |
| **extension-auditor** | `/audit` | Structural validation and anti-pattern detection |
| **upgrade-scanner** | `/upgrade` | Deprecation detection against latest docs |

#### Reference Skills

| Skill | Coverage |
|-------|----------|
| **cc-ref-hooks** | Hook events, matchers, handler types, input/output schemas |
| **cc-ref-settings** | Configuration keys, scopes, merge behavior, env vars |
| **cc-ref-skills** | SKILL.md structure, frontmatter fields, best practices |
| **cc-ref-permissions** | Permission rule syntax, tool patterns, modes |
| **cc-ref-plugins** | Plugin manifest schema, directory structure, namespacing |
| **cc-ref-subagents** | Agent frontmatter, built-in agents, tool control, teams |
| **cc-ref-multi-agent** | Multi-agent orchestration patterns, token economics |
| **cc-ref-mcp** | MCP transport types, scopes, .mcp.json schema, auth patterns |
| **cc-ref-cicd** | GitHub Actions inputs, GitLab CI config, headless CLI flags |
| **cc-ref-output-styles** | Output style frontmatter, scope directories, style vs alternatives |

#### Specialist Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| **hook-engineer** | Sonnet | Designs complex multi-event hook systems |
| **plugin-builder** | Sonnet | Creates complete plugins with multiple component types |
| **extension-validator** | Haiku | Two-mode validation: spec compliance + schema quality |
| **doc-sync-checker** | Haiku | Detects documentation drift in reference skills |
| **recommendation-engine** | Sonnet | Analyzes installed extensions and recommends additions |
| **system-architect** | Sonnet | Designs complex multi-component extension systems (Tier 3) |
| **subagent-generator** | Sonnet | Generates complex subagent configurations with multi-agent patterns |

---

## Recipe Categories

### Dev Team Recipes (86)

| Category | Count | Recipe IDs |
|----------|-------|------------|
| Core Team | 4 | CT01–CT04 |
| Web Frameworks | 13 | WF01–WF13 |
| Mobile | 6 | MB01–MB06 |
| Data & ML | 8 | DM01–DM08 |
| Systems | 6 | SY01–SY06 |
| Cloud & Infra | 7 | CI01–CI07 |
| DevOps | 6 | DO01–DO06 |
| Universal Experts | 4 | UE01–UE04 |
| Domain Specialists | 16 | DS01–DS16 |
| Orchestrators | 2 | OR01–OR02 |
| Teams | 14 | TQ01–TQ14 |

### Extension Recipes (40)

| Category | Count | Examples |
|----------|-------|---------|
| Automation | 12 | Format on save, lint gate, dangerous command blocker |
| Commands | 8 | Custom slash commands, argument handling |
| Knowledge | 5 | Reference skills, domain expertise |
| Specialists | 5 | Code reviewer, test runner, debugger |
| Connections | 5 | MCP database, API integration |
| Security | 5 | Permission lockdown, secret protection |

---

## License

MIT
