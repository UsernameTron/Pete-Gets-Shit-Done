---
name: scenario-library
description: |
  Browseable cookbook of 40 pre-built Claude Code extension recipes. Each recipe
  is a known-good pattern with pre-resolved decisions that skip the inference step
  and go straight to generation. Use when you want to see what's possible, pick a
  common workflow, or skip the design step. Invoked with /recipes or matched
  automatically by the intent engine when a user describes a known pattern.
  Triggers on: "recipes", "cookbook", "what can I build", "show me examples",
  "common patterns", "browse extensions".
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent
argument-hint: "[category|recipe-id|search-terms]"
---

# /recipes — Extension Recipe Library

40 pre-built patterns for common developer workflows. Each recipe includes
pre-resolved decisions, customization points, and a verification step.

## Supporting Files
- [automation.md](recipes/automation.md) — 12 hook-based automation recipes (A01-A12)
- [commands.md](recipes/commands.md) — 8 skill-based command recipes (C01-C08)
- [knowledge.md](recipes/knowledge.md) — 5 reference skill recipes (K01-K05)
- [specialists.md](recipes/specialists.md) — 5 subagent recipes (S01-S05)
- [connections.md](recipes/connections.md) — 5 MCP connection recipes (X01-X05)
- [security.md](recipes/security.md) — 5 permission/settings recipes (P01-P05)

---

## Usage Modes

### Browse All: `/recipes`

List all 6 categories with recipe counts and one-line descriptions:

| Category | Count | What They Do |
|----------|-------|-------------|
| Automation | 12 | Things that happen automatically (hooks) |
| Commands | 8 | On-demand actions you invoke with /name |
| Knowledge | 5 | Persistent context Claude always has |
| Specialists | 5 | Dedicated agents for specific tasks |
| Connections | 5 | Links to external services (MCP) |
| Security | 5 | Controls on what Claude can/can't do |

### Browse Category: `/recipes automation`

Read the matching recipe file and list all recipes in that category with:
- Recipe ID and name
- Trigger phrases (what users say)
- Extension type produced

### Execute Recipe: `/recipes auto-lint`

1. Read the recipe from the matching category file
2. Present: "Here's what I'll build: [plain-English explanation]"
3. Ask: "Want to customize anything, or should I build it as-is?"
4. If customizing: ask about the listed customization points only
5. Hand pre-resolved decisions to the appropriate generator skill
6. After generation, show the verification step

### Search: `/recipes search format code`

Fuzzy-match $ARGUMENTS against all recipe names and trigger phrases.
Return the top 3 matches with relevance reasoning.

To search:
1. Read ALL 6 recipe files
2. Compare search terms against recipe names, trigger phrases, and types
3. Score by number of matching words/phrases
4. Return top 3 with: recipe ID, name, match reason, category

---

## Intent Engine Integration

When the intent engine calls this skill for recipe matching:

1. Read ALL recipe files
2. Compare user's behavioral description against trigger phrases
3. Score confidence:
   - **HIGH** (≥ 3 trigger phrase words match): return the recipe directly
   - **MEDIUM** (1-2 matches): return top 3 candidates for user to pick
   - **LOW** (no matches): return null — let intent engine fall back to general generation
4. On HIGH match, pass pre-resolved decisions to the generator — skipping inference

---

## Rules

- Always show the plain-English explanation BEFORE generating
- Always mention customization points so the user knows what's adjustable
- Never skip the verification step — include it in the output
- If a recipe is a COMBO (like A03), generate all pieces and explain how they connect
- When adapting a recipe, change only the customization points — keep the core pattern intact
- Recipes are starting points, not rigid templates — encourage users to customize
