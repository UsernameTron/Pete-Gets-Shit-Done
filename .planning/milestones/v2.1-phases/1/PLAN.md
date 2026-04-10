---
phase: 1
title: "learnSkill Plugin Integration"
status: approved
complexity: low
created: "2026-04-06"
source_prd: docs/add-learnSkill-prompt.md
requirements:
  - R1_install_cli_learn
  - R2_gsd_plugin_structure
  - R3_learnSkill_subcommands
  - R4_security_awareness
  - R5_register_claude_md
---

# Phase 1 Plan — learnSkill Plugin Integration

## Executive Summary

The agentskill.sh `learn` plugin is **already installed and fully functional** at `~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/`. It provides `/learn` with all subcommands the PRD requires (search, install, list, update, remove, feedback) plus extras (trending, scan, owner install, skillset install, context-aware recommendations).

The remaining work is minimal:
1. Verify the existing plugin satisfies all PRD requirements (audit)
2. Decide on command naming: `/learn` (already works) vs `/learnSkill` (PRD's original name)
3. Update CLAUDE.md to document the `/learn` command in the session commands table
4. Run verification tests from the PRD

## Requirement Coverage Analysis

| Req | PRD Requirement | Status | Action Needed |
|-----|----------------|--------|---------------|
| R1 | Install agentskill.sh CLI and /learn skill | DONE | Already installed at ~/.claude/plugins/cache/ |
| R2 | Create GSD plugin structure (plugin.json + SKILL.md) | DONE | Plugin has .claude-plugin/plugin.json, SKILL.md, references/SECURITY.md |
| R3 | /learnSkill subcommands (search, install, list, update, remove, feedback, help) | DONE | All 7 subcommands + extras already in SKILL.md |
| R4 | Security awareness (review scores, confirm, no auto-install) | DONE | SECURITY.md reference (636 lines), scoring system, user confirmation via AskUserQuestion |
| R5 | Register in CLAUDE.md session commands table | PENDING | Need to add /learn to project CLAUDE.md |

## Tasks

### Task 1: Audit Existing Plugin Against PRD

<read_first>
- ~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/.claude-plugin/plugin.json
- ~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/SKILL.md
- ~/.claude/plugins/cache/agentskill-sh/learn/1.0.0/references/SECURITY.md
- docs/add-learnSkill-prompt.md
</read_first>

<acceptance_criteria>
- Confirm plugin.json registers the plugin correctly (name, description, author)
- Confirm SKILL.md frontmatter has name and description matching GSD conventions
- Confirm all 7 PRD subcommands are present: search, install, list, update, remove, feedback, no-args help
- Confirm security scanning is integrated (score thresholds, user confirmation for low scores, no auto-install)
- Confirm the plugin is accessible as a Utilities (any phase) tool — not gated to a lifecycle phase
- Document the command name: /learn (not /learnSkill — the installed plugin uses /learn)
</acceptance_criteria>

<action>
Read the existing plugin files and produce a checklist confirming each PRD requirement is met. No code changes needed. This is a documentation audit producing a VERIFICATION.md artifact.
</action>

**Depends on:** nothing
**Estimated effort:** 5 minutes

---

### Task 2: Update Project CLAUDE.md With /learn Command

<read_first>
- /Users/cpconnor/projects/Pete-Gets-Shit-Done/CLAUDE.md
- ~/.claude/CLAUDE.md (global — for reference on how /learn is listed in plugin inventory)
</read_first>

<acceptance_criteria>
- Project CLAUDE.md has /learn listed in a visible location (session commands table or dedicated utility section)
- Description matches: "Discover, install, and manage AI agent skills from agentskill.sh"
- Consistent with how other utility commands are documented
- No modifications to existing GSD plugins or core engine files (PRD constraint)
</acceptance_criteria>

<action>
Add a "Utility Commands" section to the project CLAUDE.md (or extend the existing Session Commands equivalent) with an entry for `/learn`. The entry should describe the command, its subcommands, and link to the installed plugin's SKILL.md for reference.

Edit `/Users/cpconnor/projects/Pete-Gets-Shit-Done/CLAUDE.md` to add after the "Advanced Capabilities" section:

```markdown
## Utility Commands

| Command | What it does |
|---------|--------------|
| `/learn <query>` | Search agentskill.sh for skills matching a keyword |
| `/learn @owner/slug` | Install a specific skill by author and name |
| `/learn list` | Show installed skills from agentskill.sh |
| `/learn update` | Check for and apply updates to installed skills |
| `/learn remove <slug>` | Uninstall a skill |
| `/learn feedback <slug> <1-5> [msg]` | Rate a skill after using it |
| `/learn` | Context-aware skill recommendations for current project |
| `/learn trending` | Show trending skills |
| `/learn scan [path]` | Security scan a skill before installing |
```
</action>

**Depends on:** Task 1 (audit confirms no gaps)
**Estimated effort:** 5 minutes

---

### Task 3: Update Global CLAUDE.md Plugin Inventory Description

<read_first>
- ~/.claude/CLAUDE.md (Utilities section around line 390)
</read_first>

<acceptance_criteria>
- The learn plugin entry in the global CLAUDE.md Utilities table accurately describes the /learn command
- Description matches what the plugin actually does (not just "Skill discovery from agentskill.sh" but includes the command name)
</acceptance_criteria>

<action>
The global CLAUDE.md at `~/.claude/CLAUDE.md` line 396 already lists:
```
| learn | Skill discovery from agentskill.sh |
```

This is accurate and sufficient. No change needed unless the audit in Task 1 reveals a mismatch. Mark as no-op if description is adequate.
</action>

**Depends on:** Task 1
**Estimated effort:** 2 minutes (verify only)

---

### Task 4: Verification — Run PRD Acceptance Tests

<read_first>
- docs/add-learnSkill-prompt.md (Verification section, lines 100-107)
</read_first>

<acceptance_criteria>
All 5 PRD verification criteria pass:
1. `/learn` with no arguments displays context-aware recommendations (or help)
2. `/learn search "code review"` returns results from agentskill.sh (via WebFetch API call)
3. `/learn list` shows installed skills (may be empty initially)
4. The plugin appears in the GSD plugin inventory under Utilities
5. CLAUDE.md has been updated with the command documentation
</acceptance_criteria>

<action>
Run each verification step:
1. Invoke `/learn` — confirm output shows recommendations or help
2. Invoke `/learn code review` — confirm search results appear
3. Invoke `/learn list` — confirm installed skills listing works
4. Check ~/.claude/CLAUDE.md Utilities table — confirm learn plugin is listed
5. Check project CLAUDE.md — confirm /learn utility commands section exists (from Task 2)

Note: The PRD says `/learnSkill` but the installed plugin uses `/learn`. This is acceptable — the PRD offered `/learnSkill` as a suggestion ("or simply integrates the agentskill.sh /learn capability"). The existing `/learn` command is the native agentskill.sh implementation and is the correct command to use.
</action>

**Depends on:** Tasks 1, 2, 3
**Estimated effort:** 5 minutes

---

## Execution Order

```
Task 1 (audit) ──┬── Task 2 (project CLAUDE.md)
                  ├── Task 3 (global CLAUDE.md verify)
                  └── Task 4 (verification) ← depends on 2 and 3
```

**Wave 1:** Task 1 (audit)
**Wave 2:** Tasks 2 + 3 (parallel — independent file edits)
**Wave 3:** Task 4 (verification — depends on wave 2)

## Design Decisions

### /learn vs /learnSkill

The PRD suggests `/learnSkill` as the command name. The installed agentskill.sh plugin uses `/learn`. Creating a wrapper `/learnSkill` command that delegates to `/learn` would add complexity for no benefit — same functionality, extra indirection.

**Decision:** Use `/learn` as-is. The PRD explicitly allows this: "or simply integrates the agentskill.sh /learn capability."

### No GSD-native plugin needed

The PRD assumes no learn plugin exists and asks to build one from scratch. Since the agentskill.sh plugin is already installed with the correct structure (.claude-plugin/plugin.json, SKILL.md, references/), building a separate GSD-native wrapper would be redundant.

**Decision:** Use the existing agentskill.sh plugin. Document it in CLAUDE.md. No new plugin files needed.

### Scope of CLAUDE.md changes

The project CLAUDE.md at `Pete-Gets-Shit-Done/CLAUDE.md` doesn't have a session commands table or utility commands section. The global `~/.claude/CLAUDE.md` has the plugin inventory listing.

**Decision:** Add a "Utility Commands" section to the project CLAUDE.md documenting `/learn` subcommands. This makes the command discoverable from the project context without duplicating the global inventory.

## Risk Assessment

**Low risk.** No code changes to GSD core. No new plugin files. Only documentation updates and verification. The existing plugin handles all functional requirements.

| Risk | Mitigation |
|------|------------|
| /learn command not working | Task 4 verification will catch this immediately |
| Plugin version drift | Plugin is at v1.0.0/SKILL v2.1; /learn update handles future updates |
| Security scanning gaps | Existing SECURITY.md is comprehensive (636 lines, 12 threat categories) |
