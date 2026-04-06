# Claude Code Prompt: Add `learnSkill` — Skill Discovery from agentskill.sh

## Context

We use the **Get Shit Done (GSD)** system — a spec-driven execution engine and governance framework for Claude Code. GSD has a modular plugin architecture organized by lifecycle phase. Under **Utilities (any phase)**, the system inventory includes a plugin called **`learn`** whose role is **"Skill discovery from agentskill.sh"**. This plugin does not exist yet. Your job is to build it.

## What agentskill.sh Is

agentskill.sh is a public directory and marketplace of 100,000+ AI agent skills. It provides:

- A searchable index of SKILL.md-based skills across 30+ platforms (Claude Code, Cursor, Copilot, Codex, etc.)
- A CLI published to npm as `@agentskill.sh/cli`
- A `/learn` skill that can be installed to search, install, rate, update, and remove skills mid-conversation
- Two-layer security scanning — server-side scan of every listed skill across 12 threat categories, plus client-side verification before install
- Version tracking via content SHA so you know exactly what you're running

The CLI commands are:

```
ags search <query>                    # Search 100,000+ skills
ags install <slug>                    # Install a skill
ags install @owner/skill-name         # Install from specific author
ags install <slug> --platform cursor  # Install for a specific platform
ags list                              # Show installed skills
ags update                            # Check for and apply updates
ags remove <slug>                     # Uninstall a skill
ags feedback <slug> <1-5> [msg]       # Rate a skill
```

All commands support `--json` for structured output.

## What to Build

Create a GSD plugin called **`learn`** that surfaces as a `/learnSkill` slash command (or simply integrates the agentskill.sh `/learn` capability). The plugin lives under Utilities (any phase) — meaning it's available at any point in the GSD workflow, not gated to a specific lifecycle phase.

### Requirements

1. **Install the agentskill.sh CLI and `/learn` skill into the project.** The recommended installation method for Claude Code is:

   ```
   npx @agentskill.sh/cli@latest setup
   ```

   Alternatively, for plugin-based install inside Claude Code:
   ```
   /plugin marketplace add https://agentskill.sh/marketplace.json
   /plugin install learn@agentskill-sh
   ```

   Or clone directly for filesystem-based discovery:
   ```
   git clone https://github.com/agentskill-sh/ags.git ~/.claude/skills/learn
   ```

   Choose whichever method is most reliable for our setup. If the plugin marketplace approach works, prefer that. Otherwise fall back to the `npx setup` or the git clone to `~/.claude/skills/learn` (global) or `.claude/skills/learn` (project-local).

2. **Create the GSD plugin structure.** Follow the existing GSD plugin conventions you see in the codebase. At minimum the plugin needs:
   - A `plugin.json` (or equivalent manifest) registering it under Utilities (any phase)
   - A SKILL.md that exposes the `/learnSkill` command
   - The SKILL.md frontmatter should include a clear `name` and `description` so Claude can auto-invoke it when the user asks about finding, discovering, installing, or browsing skills

3. **The `/learnSkill` command should support these operations** (delegating to the agentskill.sh CLI under the hood):
   - **Search**: `/learnSkill search <query>` — search the agentskill.sh directory for skills matching a keyword or phrase
   - **Install**: `/learnSkill install <slug>` or `/learnSkill install @owner/skill-name` — install a skill into the project
   - **List**: `/learnSkill list` — show currently installed skills from agentskill.sh
   - **Update**: `/learnSkill update` — check for and apply updates to installed skills
   - **Remove**: `/learnSkill remove <slug>` — uninstall a skill
   - **Feedback**: `/learnSkill feedback <slug> <1-5> [message]` — rate a skill after using it
   - No arguments: `/learnSkill` — show usage help and available subcommands

4. **Security awareness.** The SKILL.md instructions should remind the agent to:
   - Review the security score of any skill before installing
   - Confirm with the user before installing skills that have low security scores or are from unknown authors
   - Never auto-install skills without user confirmation

5. **Register in CLAUDE.md.** After creating the plugin, update the project's CLAUDE.md session commands table to include `/learnSkill` under Utility Commands, consistent with how `/commit`, `/commit-push-pr`, `/clean-gone`, and `/revise-claude-md` are already listed.

### File Placement

Look at how existing GSD plugins are structured in the codebase (check `plugins/` directory, or `.gsd/plugins/`, or wherever the plugin system lives). Mirror that structure exactly. The plugin should be named `learn` and should slot into the Utilities (any phase) category alongside `github`, `slack`, `plugin-dev`, `claude-code-research`, `agent-sdk-dev`, and `explanatory-output-style`.

### SKILL.md Template

The SKILL.md should follow this general shape:

```yaml
---
name: learnSkill
description: >
  Discover, install, and manage AI agent skills from agentskill.sh — a directory
  of 100,000+ skills with security scanning. Use when the user asks to find skills,
  install new capabilities, browse the skill marketplace, or manage installed skills.
  Triggers on: "find a skill", "install skill", "search skills", "browse skills",
  "skill marketplace", "agentskill", "learn skill", "what skills are available".
---
```

Then provide clear instructions for each subcommand, how to invoke the CLI, how to parse results, and how to present them to the user.

### Verification

After implementation:
1. Run `/learnSkill` with no arguments — should display help
2. Run `/learnSkill search "code review"` — should return results from agentskill.sh
3. Run `/learnSkill list` — should show installed skills (may be empty initially)
4. Confirm the plugin appears in the GSD plugin inventory under Utilities
5. Confirm CLAUDE.md has been updated with the new command

## Constraints

- Do NOT modify any existing GSD plugins or core engine files
- Do NOT change the execution engine workflow or hook system
- This is a Utilities (any phase) plugin — it must be available regardless of which lifecycle phase is active
- Follow existing GSD code conventions, naming patterns, and directory structure exactly
- If `npx` or `npm` is needed at runtime, ensure the SKILL.md instructions handle the case where the CLI isn't installed yet (auto-install on first use)
