---
name: intent-engine
description: |
  Behavioral classification engine for Claude Code extension generation.
  Converts natural language descriptions of desired developer workflows into
  typed, resolved extension requests. Users describe what they want — the
  engine decides the correct extension type from the request, resolves event
  details (for hooks), detects compound needs, and hands off rich context
  to the generator pipeline. Knowledge skill loaded by extension-concierge.
  Not directly invocable by users.
user-invocable: false
skills:
  - cc-ref-hooks
  - cc-ref-skills
  - cc-ref-settings
  - cc-ref-subagents
  - cc-ref-plugins
  - cc-ref-permissions
---

# Intent Engine — Behavioral Classification (Layer 1 Knowledge)

## 1. Your Job

For every CREATE request routed by extension-guide, determine:

1. **What type** of extension (hook, skill, agent, MCP, settings, plugin, CI/CD, output-style, CLAUDE.md)
2. **What event** (for hooks: which event, which matcher, gate or not)
3. **What characteristics** (for skills: invocable vs reference, forked context)
4. **Whether compound** (request needs 2+ extension types working together)

Then hand off a rich classification to the concierge for generation.

Decide the type from the request with your own judgment — the cc-ref-*
skills above document what each extension type can do. Prefer the simplest
type that works, and confirm with the user in plain English.

**Rules:**
- Never expose Claude Code vocabulary unprompted (don't say "hook", "PreToolUse", etc.)
- Maximum 2 disambiguation questions per request
- Always confirm the plan before generating: "Does this sound right?"
- If the user names a type explicitly, respect it (expert bypass)
- If the request isn't about Claude Code extensions, return null — don't classify

---

## 2. The Classification Pipeline

Run these stages in order. Early exits skip later stages.

### Stage 0: Expert Bypass
If the user names a specific extension type or uses Claude Code vocabulary
(event names, frontmatter fields, config file names), take them at their
word. Record the type and skip all classification. Pass directly to the
concierge for technical resolution.

### Stage 1: Scenario Match (Fast Path)
If the scenario library (Cap 2) is available and the request clearly matches
a known recipe, use the recipe's pre-classified type and pre-resolved
decisions. If Cap 2 not built yet → skip this stage entirely.

### Stage 2: Behavioral Classification (Core)
Classify the request with your own judgment: does the user want something
automatic (hook), on-demand (skill), delegated to a specialist (agent),
knowledge Claude should always have (reference skill or CLAUDE.md), a
connection to an external service (MCP), a restriction on what Claude can do
(permissions/settings), packaging for distribution (plugin), CI/CD
automation, or a response style (output-style)?

### Stage 3: Clarification (via Smart Scaffold)

When you are not confident in the classification, delegate ALL clarification
to the smart-scaffold skill. Do NOT ask your own clarifying questions.

- **Confident** → present plan, ask "Does this sound right?"
- **Not confident** → pass partial classification to smart-scaffold:
  1. Smart-scaffold identifies which fields are unknown
  2. It asks 1-3 developer-language questions (never Claude Code jargon)
  3. It judges the complexity tier (Tier 1/2/3)
  4. It returns a fully-resolved spec with tier, type, and all fields
  5. Continue to Stage 4 (Resolution) with the completed spec
- **COMPOUND** → note both types, generate primary first

If smart-scaffold is unavailable, ask up to 2 plain-English either/or
questions about the desired behavior yourself, then classify.

### Stage 4: Resolution & Handoff
Package classification results into structured context (Section 4).
Show user a plain-English plan. On confirmation → hand off to concierge.

### Hook Resolution Facts

- Hook matchers match tool names only. To gate a specific command (e.g.
  `git commit`), match `Bash` and generate a handler script that checks the
  `tool_input.command` field in the stdin JSON.
- Blocking gates exit 2; informational handlers exit 0. Full event, matcher,
  and handler-type details live in cc-ref-hooks.

---

## 3. Compound Intent Detection

Some requests genuinely need multiple extension types — e.g. a reference
skill holding team standards plus a hook that enforces them, or an MCP
connection plus a workflow that uses it. Detect these with judgment, and
order generation by dependency: connections before the workflows that use
them, knowledge before the hooks that apply it.

When compound detected:
- If Cap 5 (Extension Combos) exists → route to combo engine
- Otherwise → generate primary type, then offer secondary

---

## 4. Resolution & Handoff

After classification, package results for the concierge:

```yaml
intent-resolution:
  primary-type: hook            # hook|skill|agent|mcp|settings|plugin|cicd|output-style|claude-md
  secondary-type: null          # if compound
  confidence: high              # high|medium|low

  hook-resolution:              # only for hooks
    event: PostToolUse
    matcher: "Write|Edit"
    gate: false
    handler-hint: command

  skill-resolution:             # only for skills
    user-invocable: true
    purpose: utility            # reference|generator|validator|utility
    context-fork: false

  scope: project                # project|user|team|plugin

  classification-trace:
    tree-path: "automatic → after action → specific tool → Write|Edit"
    signals:
      - { category: temporal, phrase: "after every edit", strength: strong }
      - { category: autonomy, phrase: "automatically", strength: moderate }
    questions-asked: 0
    compound: false

  plain-english: |
    I'll create a hook that automatically runs your linter after every
    file edit. It won't block your work — just show the results.
```

### Handoff Rules

1. ALWAYS show the user the `plain-english` summary before generating.
2. ALWAYS ask "Does this sound right?" for confirmation.
3. On confirmation → hand off to concierge Section 1B-D.
4. On rejection → **reclassification protocol**: reset state, ask "What did I
   get wrong?", re-walk the request with new context. Never repeat a wrong
   classification.
5. Pass the full `intent-resolution` to the concierge as structured context.

---

## 5. Anti-Patterns & Edge Cases

- **NEVER** ask "do you want a hook or a skill?" — only behavioral questions
- **NEVER** assume the user knows what hooks, subagents, or MCP servers are
- **NEVER** override an expert who names the type explicitly
- If user rejects classification → full reset, reclassify with new context
- If request isn't about Claude Code extensions → null resolution, don't classify
- Prefer simpler type when genuinely ambiguous: skill > hook > agent > plugin
- **CLAUDE.md additions**: if the user wants persistent project context that should
  load every session, suggest CLAUDE.md instead of a skill (simpler, no file overhead)
