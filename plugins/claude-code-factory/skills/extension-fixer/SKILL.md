---
name: extension-fixer
description: |
  Diagnoses and repairs broken Claude Code extensions. When a skill doesn't trigger,
  a hook doesn't fire, permissions don't apply, or an agent won't invoke, this skill
  reads the extension files, identifies the root cause, explains what's wrong in plain
  English, and offers to fix it with your approval. Handles skills, hooks, agents,
  permissions, settings, MCP configs, and plugins. The "fix" companion to the
  generate-install-verify lifecycle.
  Triggers on: "isn't working", "not triggering", "broken", "fix my", "why doesn't",
  "hook doesn't fire", "skill won't trigger", "permission not applying",
  "agent not invoked", "help me fix", "something's wrong with my".
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
skills: cc-ref-hooks, cc-ref-skills, cc-ref-settings, cc-ref-permissions, cc-ref-subagents
argument-hint: "[path to broken extension or describe the problem]"
---

# /fix-my-extension — Extension Diagnostic & Repair

Diagnose and fix broken Claude Code extensions. Read the extension files,
identify the root cause, explain it in plain English, and fix it with approval.

## Supporting Files
- [diagnostic-procedures.md](diagnostic-procedures.md) — ordered diagnostic steps per type
- [common-fixes.md](common-fixes.md) — fix templates for the top 30 issues
- [fix-verification.md](fix-verification.md) — how to test each extension type after fixing

## Usage

### Targeted (user provides path):
```
/fix-my-extension .claude/settings.local.json
/fix-my-extension ~/.claude/skills/my-skill/SKILL.md
```

### Descriptive (user describes problem):
```
"My auto-format hook isn't firing"
"Why doesn't my coding-standards skill trigger?"
"The commit gate blocks everything, even when tests pass"
```

### Routed (from extension-guide):
Extension-guide routes frustration signals ("isn't working", "broken") here
automatically.

---

## Workflow

### Step 1: Identify the Target

Determine WHICH extension is broken:

**If user provided a path** → read that file directly.

**If user described the problem** → identify the extension:
- "my hook" + behavior → search hooks in settings files (all 3 scopes)
- "my skill" + name/behavior → search `skills/` directories (global + project)
- "my agent" + name → search `agents/` directories
- "permissions" / "settings" → identify which settings file
- "MCP" / "[server name]" → check `.mcp.json` and `~/.claude.json`

**If multiple candidates match**, list them:
```
I found [N] extensions that could be the one. Which is it?
  1. [name] in [scope] — [brief description]
  2. [name] in [scope] — [brief description]
```

### Step 2: Read and Parse

Read the extension files completely:
- **Skills**: SKILL.md frontmatter + body + referenced supporting files
- **Hooks**: settings JSON file + any referenced script files
- **Agents**: the `.md` file frontmatter + body
- **Permissions**: settings JSON `permissions` section
- **MCP**: `.mcp.json` or `~/.claude.json` server entry
- **Plugins**: `plugin.json` manifest + scan skill/agent directories

### Step 3: Run Structural Diagnostics

Read `diagnostic-procedures.md` for the extension type's protocol.
Run each diagnostic step IN ORDER. Stop at the first failure.

Use the `cc-ref-*` reference skills loaded in context for authoritative
field names, event lists, handler types, and schema rules.

For each check:
- **PASS**: Note it passed (confirms what's working)
- **FAIL**: Capture the specific issue, the wrong value, and the line number

### Step 4: Run Behavioral Diagnostics

If all structural checks pass but the extension "isn't working," the issue
is behavioral. Check:

**For hooks:**
- Is the event right for what the user wants to happen?
- Is the matcher filtering correctly (not too broad/narrow)?
- Is the exit code achieving the intended behavior (0 vs 2)?
- Run the functional test from `fix-verification.md`

**For skills:**
- Is the description specific enough to trigger?
- Is there a trigger collision with another skill?
- Is the scope correct for the user's expectation?

**For permissions:**
- Is a deny rule at a higher scope overriding an allow?
- Is the pattern matching the intended tool?

**For agents:**
- Is the description enabling delegation?
- Does the agent have the tools it needs?

### Step 5: Explain in Plain English

Present findings using this format:

```
━━ DIAGNOSIS ━━

I found the problem: [one-sentence plain-English explanation].

[Detailed explanation — 2-4 sentences, no jargon.]

Specifically: [what's wrong, with the exact value]
Should be: [what it should be]
File: [path] (line [N] if applicable)

━━ WHAT'S WORKING ━━
[Brief list of checks that passed — reassures user not everything is broken]

━━ THE FIX ━━
[Exact description of what will change]

Want me to fix this?
```

### Step 6: Apply Fix (with approval)

**Wait for user approval before modifying ANY file.**

When approved:
1. Read `common-fixes.md` for the matching fix template
2. Apply the fix using Edit (prefer Edit over Write for minimal changes)
3. If fix requires creating a file (F12: missing script), use Write
4. If fix requires moving a file (F07, F26), use Bash (`mv`) with confirmation
5. If fix requires chmod, use Bash

Show the user exactly what changed:
```
Fixed! Here's what I changed:
  - [file]: [what changed] (line [N])
```

### Step 7: Verify the Fix

Read `fix-verification.md` for the extension type.
Run the appropriate verification:

- **Hooks**: Parse updated JSON, verify script exists/executable, run test input
- **Skills**: Confirm file at correct path, frontmatter parses, description adequate
- **Permissions**: Parse updated settings, confirm rules in correct arrays
- **Agents**: Confirm file exists, frontmatter valid, description adequate
- **MCP**: Parse config, check binary (stdio) or URL format (http)

Show verification trigger: "[action] to see it work now."

### Step 8: Post-Fix Summary

```
━━ FIXED ━━

Problem: [one sentence — what was wrong]
Fix: [one sentence — what was changed]
Verify: [one sentence — how to confirm it works]

Other things to check:
  - Run /explain-my-setup to see your full environment
  - Run /extension-auditor for a comprehensive health check
```

---

## Multi-Issue Handling

If diagnostics find multiple issues in the same extension:
1. List ALL issues found, ranked by severity (structural → behavioral)
2. Offer to fix them all: "I found [N] issues. Want me to fix all of them?"
3. If user says yes: fix in order (structural first, then behavioral)
4. If user says "just the first one": fix only that, note remaining issues

Note: Diagnostic protocol says stop at first FAIL. For multi-issue detection,
after fixing the first issue, re-run diagnostics to discover the next one.

---

## Escalation

If the fixer can't identify the issue after running all diagnostics:

```
I checked [N] things and everything looks structurally correct.
The issue might be environmental or a Claude Code behavior. Try:
  1. Restart Claude Code to reload extensions
  2. Run /extension-auditor for a deeper cross-extension scan
  3. Check if there's a conflicting extension at another scope
```

Do NOT make up a problem. Do NOT apply an unnecessary fix.

---

## Rules

- **NEVER modify a file without explicit user approval**
- ALWAYS show the exact change before applying it
- ALWAYS verify after fixing (don't just fix and hope)
- ALWAYS explain in plain English — no jargon in the diagnosis
- If user provides a path, trust it — don't re-scan everything
- If user describes a problem, search narrowly — don't audit the whole environment
- Prefer Edit over Write (minimal changes, not full file rewrites)
- For JSON files: read → parse → modify → serialize → write (never string-replace JSON)
- Run diagnostics IN ORDER — stop at first failure
- After fixing, always suggest verification and `/explain-my-setup`
- NEVER guess — if root cause is unclear, show findings and ask
