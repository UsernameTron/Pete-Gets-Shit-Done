---
phase: quick
plan: 260326-kym
type: execute
wave: 1
depends_on: []
files_modified:
  - plugins/claude-code-factory/downloads/agent-teams/ (DELETE)
  - docs/superpowers/ (DELETE)
  - plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json
  - docs/governance-customization.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "agent-teams downloads directory no longer exists"
    - "superpowers docs directory no longer exists"
    - "No references to 'superpowers' remain in .md or .json files (except 'superpowers' used as plain English in factory docs)"
    - "MCP ecosystem plugin description lists all 9 current commands"
    - "npm test passes (1,662+ tests)"
  artifacts: []
  key_links: []
---

<objective>
Delete obsolete agent-teams downloads and superpowers docs directories, update MCP ecosystem plugin description to list all current commands, and clean any stale 'superpowers' plugin references from docs.

Purpose: Remove dead content and ensure plugin metadata reflects current command surface.
Output: Clean repo with no orphaned directories or stale references.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json
@docs/governance-customization.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete obsolete directories and clean superpowers references</name>
  <files>
    plugins/claude-code-factory/downloads/agent-teams/ (DELETE entire directory)
    docs/superpowers/ (DELETE entire directory tree)
    docs/governance-customization.md (line 220)
  </files>
  <action>
    1. Delete directory: `rm -rf plugins/claude-code-factory/downloads/agent-teams/`
    2. Delete directory: `rm -rf docs/superpowers/`
    3. In `docs/governance-customization.md` line 220, the text reads:
       "This registers 13 official plugins including claude-code-setup, hookify, superpowers, code-review, and pr-review-toolkit."
       Remove "superpowers, " from that list. The plugin count may also need adjusting (12 instead of 13) — check actual plugin count in `governance/scripts/install-plugins.sh` if it exists, otherwise just remove the reference.
    4. Do NOT modify `plugins/claude-code-factory/docs/getting-started.md` — its use of "superpowers" is plain English describing capabilities, not a reference to the deleted feature.
    5. Do NOT modify `.planning/milestones/v1.0-REQUIREMENTS.md` — it is an archived milestone record.
  </action>
  <verify>
    Run: `grep -ri 'superpowers' . --include='*.md' --include='*.json' | grep -v node_modules | grep -v .git | grep -v '.planning/milestones/' | grep -v 'claude-code-factory/docs/getting-started.md'`
    Must return zero hits. The two excluded files use "superpowers" as plain English or archived history, not as a plugin/feature reference.
  </verify>
  <done>Both directories deleted. No stale superpowers plugin references remain in active docs.</done>
</task>

<task type="auto">
  <name>Task 2: Update MCP ecosystem plugin description with all current commands</name>
  <files>plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json</files>
  <action>
    Update `plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json` description field to:
    "Project agent ecosystem — set up, manage, and diagnose specialist agents, plus session commands (/prime, /wrap) and agent lifecycle (/agents, /agent-setup, /agent-status, /agent-diagnose, /agent-add, /agent-remove, /agent-reset)"

    Current value: "Project agent ecosystem — set up, manage, and diagnose specialist agents, plus session commands (/prime, /wrap) and agent lifecycle (/agents, /agent-setup, /agent-status, /agent-diagnose)"

    Change: Add /agent-add, /agent-remove, /agent-reset to the parenthetical list.
    Keep version, name, and author unchanged.
  </action>
  <verify>
    Run: `cat plugins/claude-mcp-ecosystem/.claude-plugin/plugin.json | python3 -c "import json,sys; d=json.load(sys.stdin); assert '/agent-add' in d['description'] and '/agent-remove' in d['description'] and '/agent-reset' in d['description']; print('OK')"` — must print OK.
  </verify>
  <done>plugin.json description lists all 9 commands: /prime, /wrap, /agents, /agent-setup, /agent-status, /agent-diagnose, /agent-add, /agent-remove, /agent-reset.</done>
</task>

</tasks>

<verification>
1. `test ! -d plugins/claude-code-factory/downloads/agent-teams/ && echo PASS` — PASS
2. `test ! -d docs/superpowers/ && echo PASS` — PASS
3. `grep -ri 'superpowers' . --include='*.md' --include='*.json' | grep -v node_modules | grep -v .git` — only hits in milestones archive and factory getting-started.md (plain English)
4. `npm test` — 1,662+ tests pass
</verification>

<success_criteria>
- Both obsolete directories deleted from repo
- MCP ecosystem plugin.json lists all 9 current commands
- No stale superpowers references in active documentation
- Test suite passes
</success_criteria>

<output>
After completion, create `.planning/quick/260326-kym-delete-agent-teams-downloads-superpowers/260326-kym-SUMMARY.md`
</output>
