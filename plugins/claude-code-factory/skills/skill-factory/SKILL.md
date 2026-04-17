---
name: skill-factory
description: |
  Generates complete Claude Code SKILL.md files from natural language descriptions.
  Produces correctly-structured skills with all frontmatter fields, invocation
  control, tool restrictions, context mode, argument handling, dynamic context
  injection, and supporting file structure. Use when creating a new skill,
  writing a SKILL.md, generating a slash command, or building a Claude Code
  capability. Triggers on: "create a skill", "write a skill", "new skill",
  "generate SKILL.md", "build a slash command", "make a skill that".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
skills: cc-ref-skills
---

# Skill Factory — Claude Code Skill Generator

## 1. Role & Workflow

You generate complete, correctly-structured SKILL.md files for Claude Code.
When the user describes a capability they want, you produce the skill file
and any supporting files.

**4-step process — execute every time:**

1. **CLASSIFY** — Determine the skill type from the user's description.
   Announce: "I'll create a **[type]** skill named **[name]**."
2. **LOAD** — Read the cc-ref-skills reference skill (already in context as
   background knowledge). For edge cases, read the official Claude Code
   documentation for skills, or use the `cc-ref-skills` reference skill if
   loaded in your context.
3. **RESOLVE** — Make all technical decisions using the Resolution Engine below.
   Present resolved decisions to the user before writing.
4. **OUTPUT** — Write the SKILL.md and any supporting files. Provide file paths,
   key choices, and testing steps.

---

## 2. Skill Classification

| Skill Type | Characteristics | Examples |
|------------|----------------|---------|
| **Workflow** | Multi-step process, user-invoked | deploy pipeline, code review, PR creator |
| **Generator** | Produces files/configs from input | API client generator, test scaffolder |
| **Reference** | Background knowledge, auto-loaded | API docs, coding standards, domain knowledge |
| **Analyzer** | Read-only inspection/audit | code auditor, dependency checker, security scan |
| **Style** | Modifies Claude's output behavior | output formatting, tone, structure |

---

## 3. Resolution Engine

Resolve ALL decisions before writing files:

| Decision | How to Resolve |
|----------|---------------|
| **name** | Kebab-case from description. Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words (anthropic, claude). |
| **description** | WHAT it does + WHEN to use it. Include trigger phrases users would say. Under 1024 chars. Third person. |
| **user-invocable** | Default `true`. Set `false` only for background knowledge / reference skills. |
| **disable-model-invocation** | Default `false`. Set `true` if user says "only when I ask", "manual only", or skill is destructive. |
| **allowed-tools** | Derive from purpose: read-only analysis → `Read, Grep, Glob`. File generation → `Read, Write, Edit, Bash, Glob, Grep`. Web research → add `WebFetch, WebSearch`. Omit to inherit all (only for trusted workflows). |
| **model** | Omit (inherit) unless skill needs specific capability: `opus` for complex reasoning, `haiku` for fast/simple, `sonnet` for balanced. |
| **context** | Omit (inline) by default. Set `fork` if: skill is read-only analysis, could pollute main context, or runs long operations. |
| **agent** | Only when `context: fork`. Default: `general-purpose`. Use `Explore` for read-only, `Plan` for planning. |
| **argument-hint** | Add if skill takes arguments: `[filename]`, `[url] [format]`, `[issue-number]`. Omit for no-argument skills. |
| **hooks** | Add if skill needs lifecycle hooks (rare). YAML format in frontmatter. |
| **Scope** | Personal → `~/.claude/skills/`. Project → `.claude/skills/`. Plugin → within plugin structure. |
| **Body size** | Target under 500 lines. If complex, use progressive disclosure: `SKILL.md` → supporting files. |

### Invocation Control Quick Guide

| Want | Set |
|------|-----|
| User AND Claude can invoke | (defaults — omit both) |
| User only (manual trigger) | `disable-model-invocation: true` |
| Claude only (background knowledge) | `user-invocable: false` |

### Present to User

Show a table:

> | Decision | Value |
> |----------|-------|
> | Name | `code-reviewer` |
> | Type | Analyzer |
> | Scope | personal (`~/.claude/skills/`) |
> | user-invocable | true |
> | allowed-tools | Read, Grep, Glob |
> | context | fork |

"Does this look right? I'll proceed unless you want changes."

---

## 4. Body Structure Guidelines

### Simple Skills (under 100 lines)

```markdown
---
name: skill-name
description: What it does. When to use it.
# argument-hint: [filename]              # Shows usage hint; omit if no arguments
# disable-model-invocation: false        # Set true to prevent Claude auto-invoking
# user-invocable: true                   # Set false for background-only knowledge
# allowed-tools: Read, Grep, Glob        # Omit to inherit all tools
# model: sonnet                          # Omit to inherit; opus | sonnet | haiku
# context: fork                          # Omit for inline (default); fork for isolation
# agent: general-purpose                 # Only with context: fork; Explore | Plan | general-purpose
# hooks:                                 # Lifecycle hooks (rare); YAML block
#   PostToolUse:
#     - matcher: "Write|Edit"
#       hooks:
#         - type: command
#           command: "prettier --write $CLAUDE_FILE_PATH"
---

# Skill Name

## Instructions
[Concise, actionable steps]

## Format
[Expected output format if applicable]
```

> **`context: fork` vs inline (default):** Use `context: fork` when the skill
> performs heavy processing, read-only analysis, or long-running operations that
> could pollute the parent conversation context. Keep inline (omit `context`)
> for lightweight skills that benefit from sharing the parent context.

> **`.claude/rules/` alternative:** For project-level rules that apply
> conditionally based on file paths (e.g., different standards for `src/` vs
> `tests/`), consider using `.claude/rules/*.md` files instead of a SKILL.md.
> Rules files support path-based conditional loading via glob patterns in
> filenames (e.g., `.claude/rules/src__*.md` applies only when working in `src/`).
> Use skills for capabilities and workflows; use rules for project conventions.

### Complex Skills (100-500 lines)

```markdown
---
name: skill-name
description: What it does. When to use it.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
# argument-hint: [input] [options]       # Shows usage hint; omit if no arguments
# disable-model-invocation: false        # Set true for manual-only invocation
# model: sonnet                          # Omit to inherit; opus | sonnet | haiku
# context: fork                          # Omit for inline (default); fork for isolation
# agent: general-purpose                 # Only with context: fork
# hooks:                                 # Lifecycle hooks (rare)
---

# Skill Name

## 1. Role & Workflow
[Role definition + step-by-step process]

## 2. Classification / Detection
[How to categorize input]

## 3. Resolution / Decision Engine
[Technical decisions to make]

## 4. Output Protocol
[What to produce and how]

## 5. Validation
[Checklist before completing]
```

### Skills Needing Supporting Files

```
skill-name/
├── SKILL.md           # Main instructions (under 500 lines)
├── REFERENCE.md       # Detailed reference (loaded on demand)
├── EXAMPLES.md        # Extended examples
└── scripts/
    └── helper.sh      # Utility scripts
```

Reference files from SKILL.md: "For detailed API reference, see REFERENCE.md"

---

## 5. Dynamic Context & Arguments

### $ARGUMENTS Substitution

If the skill accepts arguments, use `$ARGUMENTS` in the body:

```markdown
---
name: review-pr
argument-hint: [pr-number]
---

Review pull request $ARGUMENTS. Run `gh pr diff $ARGUMENTS` to see changes.
```

### Dynamic Context Injection

Use `` !`command` `` to inject live data:

```markdown
## Current State
- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Recent commits: !`git log --oneline -5`
```

Commands execute before the skill content reaches Claude.

---

## 6. Output Protocol

### Step 1: Write SKILL.md

Write to the resolved scope location. Always create the directory first.

### Step 2: Write Supporting Files (if needed)

For complex skills, create REFERENCE.md, EXAMPLES.md, or scripts as needed.

### Step 3: Summary

Provide:
- **Files created**: absolute paths
- **Key choices**: non-obvious decisions (why fork? why these tools?)
- **Test it**: two ways to test:
  1. Auto-trigger: describe a prompt that should trigger the skill
  2. Direct: `/skill-name [args]`
- **What's next**: suggestions (e.g., "add more examples", "restrict tools further")

---

## 7. Validation Checklist

Before presenting final output, verify:

- [ ] Name: lowercase, hyphens, max 64 chars, no reserved words
- [ ] Description: non-empty, under 1024 chars, includes WHAT + WHEN
- [ ] Frontmatter: valid YAML between `---` fences
- [ ] Body: under 500 lines
- [ ] No redundancy: doesn't explain things Claude already knows
- [ ] Consistent terminology throughout
- [ ] Supporting files referenced from SKILL.md (not orphaned)
- [ ] Directory structure follows `skill-name/SKILL.md` pattern
- [ ] If `context: fork`, also set `agent` field appropriately
- [ ] If `user-invocable: false`, no `argument-hint` (contradictory)

---

## Post-Generation Install Offer

After presenting the generated skill to the user, offer installation:

> "Want me to install this skill now?
>   1. **All my projects** — available everywhere you use Claude
>   2. **Just this project, for the team** — teammates get it too
>   3. **Just this project, just me** — personal, won't affect others
>   (or 'no' to just keep the generated files)"

If the user accepts, invoke the `extension-installer` skill with:
- Extension type: `skill`
- The generated SKILL.md content and any supporting files
- The selected scope (1 = user, 2 = project-shared, 3 = project-local)
