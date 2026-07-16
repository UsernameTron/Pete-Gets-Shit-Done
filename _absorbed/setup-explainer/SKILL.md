---
name: setup-explainer
description: |
  Scans all installed Claude Code extensions and produces a plain-English summary
  of what your environment does. Discovers skills, hooks, agents, permissions,
  settings, MCP servers, CLAUDE.md, rules, and plugins across all scopes.
  Categorizes each extension, explains what it does without jargon, detects gaps
  and opportunities, and offers action suggestions. The "what do I have?" companion
  to the intent engine's "what do I want?"
  Triggers on: "explain my setup", "what do I have", "what's installed",
  "show my extensions", "list my skills", "what hooks do I have",
  "what does my environment do", "what's configured", "show me everything".
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash
argument-hint: "[scope: all | project | global]"
---

# /explain-my-setup — Environment Discovery & Explanation

Scan all installed Claude Code extensions and explain what your environment does
in plain English.

## Supporting Files
- [scan-locations.md](scan-locations.md) — complete path list per type and scope
- [explanation-patterns.md](explanation-patterns.md) — how to describe each type plainly

## Usage

```
/explain-my-setup           — scan everything (all scopes)
/explain-my-setup project   — scan only this project's extensions
/explain-my-setup global    — scan only your global (~/) extensions
```

---

## Workflow

### Step 1: Discover Extensions

Read `scan-locations.md` for the complete list of paths to check.

For the selected scope (default: all), scan each location:

1. **Skills**: Glob for `*/SKILL.md` in each skill directory
2. **Agents**: Glob for `*.md` in each agent directory
3. **Hooks**: Read settings JSON files, parse the `hooks` object
4. **Permissions**: Read settings JSON files, parse the `permissions` object
5. **Settings**: Read settings JSON files, extract notable non-default values
6. **MCP**: Read `.mcp.json` and `~/.claude.json`, parse `mcpServers`
7. **CLAUDE.md**: Check if it exists in project root
8. **Rules**: Glob for `.claude/rules/*.md`
9. **Plugins**: Check `enabledPlugins` in settings

For each discovered item, extract ONLY the metadata needed for a summary.
Do NOT read full file bodies — read frontmatter only for skills and agents.
Parse each settings file once and extract hooks, permissions, and settings
in a single pass.

### Step 2: Categorize

Group discoveries into these display categories:

1. **SKILLS** — all skills (user-invocable and reference)
2. **AUTOMATION** — all hooks (organized by behavior, not event name)
3. **ACCESS CONTROL** — all permission rules (deny, allow, ask)
4. **CONNECTIONS** — all MCP servers
5. **SETTINGS** — notable non-default settings
6. **PROJECT CONFIG** — CLAUDE.md, rules files

Empty categories are OMITTED from the output. Do not show "CONNECTIONS (0)".

### Step 3: Explain Each Extension

Read `explanation-patterns.md` for the translation rules.

For EACH discovered extension, compose a 2-line entry:
```
Line 1: - [Name/command] — [plain-English behavior description]
Line 2:   ([scope in plain English] · [invocation/trigger mode])
```

Rules for composing descriptions:
- Use the description field's first sentence as a starting point
- Simplify: remove Claude Code jargon, rewrite in user terms
- Focus on BEHAVIOR — what does the user experience?
  - NOT: "PostToolUse hook with command handler and matcher Write|Edit"
  - YES: "Runs prettier after every file edit"
- Scope descriptions use human terms:
  "available everywhere" / "this project, shared" / "this project, just you"

### Step 4: Detect Observations

After cataloging everything, look for patterns using the observation rules
in `explanation-patterns.md`.

Check for:
- Reference skills without enforcement hooks
- Hooks without corresponding gates
- Manual skills that could be automated
- Overlapping or conflicting permission rules
- Missing basics (no CLAUDE.md, no SessionStart hook, no MCP)
- Scope complexity (extensions spread across many scopes)

Pick the top 3 most impactful observations. Each observation includes:
- What the pattern is (plain English)
- What the user could do about it (with a trigger phrase for the factory)

If nothing notable, omit the observations section entirely.

### Step 5: Compose Output

Present the full summary using this format:

```
━━ YOUR CLAUDE CODE ENVIRONMENT ━━

You have [N] extensions across [M] scopes:

[CATEGORY 1] ([count])
  - [entry 1]
  - [entry 2]

[CATEGORY 2] ([count])
  - [entry 1]

[If observations exist:]
━━ OBSERVATIONS ━━
  - [observation 1]
    [action offer]

Want to add anything? Change how something works?
```

### Step 6: Handle Follow-Ups

After presenting the summary, the user might:

- **"Tell me more about [extension]"** → Read the full file and explain in
  detail using teaching vocabulary from the concierge
- **"Remove [extension]"** → Provide undo instructions (file path to delete
  or JSON key to remove). Do NOT remove without confirmation.
- **"Add [capability]"** → Hand off to the intent engine or directly to the
  appropriate generator
- **"What should I add?" / "What am I missing?" / "Any recommendations?"** →
  Hand off to the `recommendation-engine` agent for comprehensive analysis.
  Pass the current environment inventory as context so it doesn't need to
  re-scan. The recommendation engine cross-references your setup against all
  40 recipes, upgrade opportunities, and gap analysis to produce ranked
  suggestions.
- **"Run a health check"** → Suggest running `/extension-auditor` for
  validation

---

## Scope Filter Behavior

| Argument | What's Scanned |
|----------|---------------|
| (none) / `all` | Everything: `~/.claude/`, `.claude/`, `.mcp.json`, `~/.claude.json`, `CLAUDE.md` |
| `project` | Only: `.claude/`, `.mcp.json`, `CLAUDE.md` (project-level only) |
| `global` | Only: `~/.claude/`, `~/.claude.json` (user-level only) |

When scanning `all`, label each extension's scope clearly so the user can see
what's project-specific vs. global.

---

## Output Rules

- NEVER show raw file paths unless the user asks "where is [extension]?"
- NEVER show frontmatter YAML or JSON config in the summary
- NEVER show validation findings (that's extension-auditor's job)
- ALWAYS use plain English for every description
- ALWAYS include scope in human-readable terms
- ALWAYS include invocation mode (manual / automatic / reference)
- If nothing is installed: "Your Claude Code environment is clean — no
  extensions installed yet. Want to create your first one?"
- Maximum 3 observations (don't overwhelm)
- End with the action offer: "Want to add anything? Change how something works?"

---

## Error Handling

| Condition | Action |
|-----------|--------|
| `~/.claude/` not accessible | Note: "Global extensions couldn't be scanned — running in a restricted environment." Continue with project scan. |
| Settings JSON malformed | Note: "Couldn't read [scope] settings — file may be malformed. Run /fix-my-extension to repair." Skip that file. |
| Plugin directories not accessible | Note: "Plus [N] plugin(s) installed — run /help to see their commands." |
| No extensions found anywhere | Show empty state message. Do not show empty category headers. |
