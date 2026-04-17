---
name: doc-sync
description: |
  Checks cc-ref-* reference skills against live Anthropic documentation at
  code.claude.com and reports what's stale. Use when you want to verify
  reference skills are current, after Anthropic releases updates, or before
  generating new extensions. Supports two modes: check (report only) and
  patch (apply updates with approval).
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Agent
argument-hint: "[check|patch] [skill-name]"
---

# /sync-docs — Reference Skill Synchronization

Keep cc-ref-* reference skills current against live Anthropic documentation.
Reference skills are the knowledge backbone of this plugin — every generator
and agent reads from them. When they go stale, every output degrades.

## Supporting Files

- URL registry: [url-registry.md](url-registry.md) — maps each cc-ref-* skill
  to its authoritative documentation URL(s) at code.claude.com

## Mode: CHECK (default)

When `$ARGUMENTS` is empty, starts with "check", or is just a skill name:

1. Parse arguments to determine scope:
   - `/sync-docs` or `/sync-docs check` → check ALL skills in the registry
   - `/sync-docs check cc-ref-hooks` → check ONE skill only
   - `/sync-docs cc-ref-hooks` → shorthand for single-skill check
2. Spawn the `doc-sync-checker` subagent (`agents/doc-sync-checker.md`).
3. If a specific skill was named, pass this to the subagent prompt:
   "Check ONLY [skill-name]. Skip all other skills in the registry.
   Still fetch llms.txt for new page detection."
4. If no specific skill was named, the subagent checks all skills in the registry.
5. Present the drift report to the user.
6. If drift severity is HIGH or CRITICAL, suggest running `/sync-docs patch`.

## Mode: PATCH

When `$ARGUMENTS` starts with "patch":

### Branch Setup (before any edits)

Before applying any patches:
1. Check current git branch. If on `main`, create and switch to
   `feat/sync-docs-patch-YYYY-MM-DD` (using today's date).
2. If already on a feature branch, continue on it.
3. All file changes happen on this branch — never on main.

### Patch Workflow

1. Run CHECK mode first to get the current drift report.
2. For each skill with drift (sorted by severity, CRITICAL first):
   a. Show the user exactly what will change — additions, modifications, removals.
   b. Show the specific lines/sections to be added or modified.
   c. Wait for explicit user approval before making any edit.
   d. After approval, apply changes using the Edit tool.
   e. Verify the edited SKILL.md frontmatter still parses as valid YAML.
3. After all approved patches are applied:
   a. Update "Last Synced" dates in url-registry.md for patched skills.
   b. Update "Total known pages" in url-registry.md if the index count changed.
   c. Present a summary: N skills patched, M items added, K items updated.
   d. Suggest the user review changes with `git diff` and merge when satisfied.

## Rules

- NEVER auto-patch without showing the user what will change first.
- NEVER remove content from a reference skill unless it is confirmed deprecated
  in the live documentation. When in doubt, keep it and add a deprecation note.
- NEVER modify generator skills, agents, or any non-cc-ref-* files during patching.
  Only cc-ref-* reference skills and url-registry.md are in scope.
- Preserve existing skill structure, heading hierarchy, and formatting conventions.
- When adding new sections, follow the patterns already present in the skill.
- If a WebFetch fails for any URL, skip that skill and note it in the report.
- After patching, verify:
  - Frontmatter parses as valid YAML
  - No broken internal cross-references (grep for skill names referenced)
  - Content is additive — no unintended deletions
  - Git diff shows only intended changes

## Error Handling

- If the doc-sync-checker subagent fails or times out, report the failure clearly
  to the user with whatever partial results are available.
- If fewer than 4 out of 7 skills could be checked (due to WebFetch failures,
  timeouts, or other errors), mark the run as **INCOMPLETE**.
- Suggest retrying individual skills: `/sync-docs check cc-ref-hooks`
- If code.claude.com returns 301 redirects to a new domain, note the new domain
  and suggest updating url-registry.md.
- If a URL returns 404, check llms.txt for the correct URL — the page may have
  been renamed. Report the rename.

## Verification Checklist (run after any patch)

- [ ] All cc-ref-* frontmatters parse as valid YAML
- [ ] No broken internal cross-references between skills
- [ ] New content follows existing formatting patterns in each skill
- [ ] url-registry.md "Last Synced" dates are updated for patched skills
- [ ] Git diff shows only intended files changed
- [ ] No TODO/FIXME/HACK comments left in patched files
