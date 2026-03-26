# DevOps Handoff — Claude Code Factory

## Project Summary

Claude Code Factory is a **distributable Claude Code plugin** that generates extensions and application development agents from natural language. It contains two integrated systems:

- **Extension Factory** — generates skills, hooks, plugins, MCP configs, settings, CI/CD pipelines, and output styles
- **Dev Team Factory** — generates application development agents, framework specialists, and coordinated dev teams

This is a pure Markdown/YAML project. No build step, no runtime, no dependencies.

## Environment Requirements

| Requirement | Details |
|-------------|---------|
| Claude Code | Latest version with plugin support |
| Git | For version control and branch management |
| Shell | Bash or Zsh (macOS/Linux) |
| Node.js | Not required — no build step |
| Python | Not required — no runtime dependencies |

## How to Install

### As a Plugin (Recommended)

```bash
claude plugin add /path/to/claude-code-factory
```

### For Local Testing

```bash
claude --plugin-dir /path/to/claude-code-factory
```

### Individual Components

Copy specific skills or agents to your Claude Code config:

```bash
cp -r skills/hook-factory ~/.claude/skills/
cp agents/team-architect.md ~/.claude/agents/
```

## Project Structure

```
claude-code-factory/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, version, author)
├── skills/                  # 35 skills (auto-discovered by plugin system)
│   ├── cc-ref-*/            # 10 reference skills (embedded documentation)
│   ├── *-factory/           # Generator skills (skill, hook, agent, output-style)
│   ├── extension-*/         # Extension lifecycle tools
│   └── dev-*/               # Dev team routing and orchestration
├── agents/                  # 10 specialist subagents
├── docs/                    # Documentation
│   ├── getting-started.md   # User-facing guide
│   └── DEVOPS-HANDOFF.md    # This file
├── desktop-skills/          # Optional condensed skills for Claude Desktop
├── CLAUDE.md                # Project governance and conventions
├── README.md                # Public-facing documentation
└── .gitignore
```

## Configuration Reference

### Plugin Manifest

Located at `.claude-plugin/plugin.json`. Contains name, description, version, and author. The plugin system auto-discovers `skills/` and `agents/` directories — no explicit registration needed.

### Skills

Each skill is a directory containing `SKILL.md` with YAML frontmatter (`name`, `description`, optional `allowed-tools`). Skills are portable and contain no local file paths.

### Agents

Each agent is a single `.md` file with YAML frontmatter (`name`, `description`, optional `tools`, `model`, `permissionMode`).

## Security Notes

- No secrets or API keys are stored in this repository.
- No network calls are made by any skill or agent — they generate static configurations.
- The `context/` and `state/` directories are gitignored and contain private operator data.
- The `local-marketplace/` directory is gitignored — it holds local-only plugin marketplace config.

## Deployment Maturity

| Aspect | Status |
|--------|--------|
| Installation | Stable — single `claude plugin add` command |
| Testing | Behavioral verification only — no automated test framework |
| Versioning | Semantic versioning via `plugin.json` |
| CI/CD | Not applicable — no build, no deploy pipeline |
| Rollback | Git-based — revert to any prior commit |

## Known Tech Debt

- No automated test suite — verification is manual/behavioral.
- `desktop-skills/` is a separate maintenance surface for Claude Desktop compatibility.
- Version in `plugin.json` should be bumped on each release.

## Verification Steps

After installation, verify the plugin works:

```bash
# Check plugin is loaded
claude --plugin-dir /path/to/claude-code-factory

# Test Extension Factory
> I need a hook that blocks writes to .env files

# Test Dev Team Factory
> Set up a dev team for my React + Django project

# Test reference skills
> What hook events are available in Claude Code?
```
