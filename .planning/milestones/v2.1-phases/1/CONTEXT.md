---
phase: 1
source: docs/add-learnSkill-prompt.md
type: prd-express
created: "2026-04-06"
---

# Phase 1 Context — learnSkill Plugin Integration

## PRD Summary

Build a GSD plugin called `learn` that surfaces as a `/learnSkill` slash command for discovering, installing, and managing AI agent skills from agentskill.sh.

## Requirements (from PRD)

1. **R1: Install agentskill.sh CLI and /learn skill** — CLI + learn capability available in project
2. **R2: Create GSD plugin structure** — plugin.json manifest, SKILL.md, registered under Utilities (any phase)
3. **R3: /learnSkill subcommands** — search, install, list, update, remove, feedback, help (no-args)
4. **R4: Security awareness** — Review security scores before install, confirm with user for low scores, never auto-install
5. **R5: Register in CLAUDE.md** — Add /learnSkill to session commands table under Utility Commands

## Critical Discovery

The agentskill.sh `learn` plugin is **already installed** at:
`~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/`

It provides a fully functional `/learn` command covering:
- Search (`/learn <query>`)
- Install (`/learn @owner/slug`, `/learn <url>`, `/learn skillset:<slug>`)
- List (`/learn list`)
- Update (`/learn update`)
- Remove (`/learn remove <slug>`)
- Feedback (`/learn feedback <slug> <1-5> [comment]`)
- No-args context-aware recommendations (`/learn`)
- Trending (`/learn trending`)
- Security scanning (`/learn scan`)
- Config (`/learn config`)

This means the PRD's R1 (install CLI/learn) and R3 (subcommands) are **already satisfied** by the existing plugin. The remaining work is:
- R2: Verify GSD plugin structure matches conventions (or create a thin wrapper)
- R4: Already handled — existing SKILL.md + SECURITY.md reference enforce security scanning
- R5: Update CLAUDE.md to document the command

## Existing Plugin Structure

```
~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/
├── .claude-plugin/
│   ├── plugin.json        # Manifest: name="learn", author="agentskill-sh"
│   └── marketplace.json   # Marketplace: "agentskill-sh"
├── SKILL.md               # Full /learn command (v2.1, ~450 lines)
├── references/
│   └── SECURITY.md        # 636-line security scanning reference
├── LICENSE
└── README.md
```

## Constraints

- Do NOT modify existing GSD plugins or core engine files
- Do NOT change the execution engine workflow or hook system
- Plugin must be available in all lifecycle phases (Utilities)
- Follow existing GSD conventions exactly
