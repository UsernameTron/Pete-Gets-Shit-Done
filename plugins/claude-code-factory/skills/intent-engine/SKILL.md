---
name: intent-engine
description: |
  Behavioral classification engine for Claude Code extension generation.
  Converts natural language descriptions of desired developer workflows into
  typed, resolved extension requests. Users describe what they want — the
  engine walks a decision tree to classify the correct extension type, resolve
  event details (for hooks), detect compound needs, and hand off rich context
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

Classify user intent using the decision tree below. For every CREATE request
routed by extension-guide, determine:

1. **What type** of extension (hook, skill, agent, MCP, settings, plugin, CI/CD, output-style, CLAUDE.md)
2. **What event** (for hooks: which of the 18 events, which matcher, gate or not)
3. **What characteristics** (for skills: invocable vs reference, forked context)
4. **Whether compound** (request needs 2+ extension types working together)

Then hand off a rich classification to the concierge for generation.

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
(PreToolUse, frontmatter, plugin.json, SKILL.md, etc.), take them at their
word. Record the type and skip all classification. Pass directly to the
concierge for technical resolution.

**Expertise signals:** "hook", "PreToolUse"/"PostToolUse", "SessionStart"/"Stop",
"SKILL.md"/"frontmatter", "subagent"/"agent" (by name), "MCP server"/"MCP config",
"plugin.json"/"manifest", "settings.json", "permission rule", "CI/CD"/"GitHub Actions"

### Stage 1: Scenario Match (Fast Path)
If the scenario library (Cap 2) is available, compare the request against known
scenarios. High-confidence match (≥ 0.85) → use scenario's pre-classified type.
If Cap 2 not built yet → skip this stage entirely.

### Stage 2: Behavioral Classification (Core)
Walk the decision tree in Section 3. Extract signals from the user's message.
Determine type and confidence level.

### Stage 3: Clarification (via Smart Scaffold)

When classification confidence is MEDIUM or LOW, delegate ALL clarification
to the smart-scaffold skill. Do NOT ask your own clarifying questions.

- **HIGH confidence** → present plan, ask "Does this sound right?"
- **MEDIUM or LOW** → pass partial classification to smart-scaffold:
  1. Smart-scaffold identifies which fields are unknown
  2. It asks 1-3 developer-language questions (never Claude Code jargon)
  3. It classifies the complexity tier (Tier 1/2/3)
  4. It returns a fully-resolved spec with tier, type, and all fields
  5. Continue to Stage 4 (Resolution) with the completed spec
- **COMPOUND** → note both types, generate primary first

The smart-scaffold replaces the inline disambiguation protocol (Section 5)
for MEDIUM/LOW confidence cases. Section 5 remains as a fallback reference
if smart-scaffold is unavailable.

### Stage 4: Resolution & Handoff
Package classification results into structured context (Section 7).
Show user a plain-English plan. On confirmation → hand off to concierge.

---

## 3. The Decision Tree

Primary question: **"WHEN does this happen?"**

```
├── AUTOMATICALLY when Claude acts (no user action needed)
│   │
│   ├── BEFORE Claude acts (blocking/gating/checking)
│   │   │ Signals: "before", "prevent", "gate", "check before", "block [action]"
│   │   │
│   │   ├── Before using a SPECIFIC TOOL
│   │   │   "before committing" → Bash(git commit)
│   │   │   "before editing" → Write|Edit
│   │   │   "before running" → Bash
│   │   │   → PreToolUse Hook + specific matcher
│   │   │
│   │   └── Before ANY action (general gate)
│   │       "check everything", "validate all"
│   │       → PreToolUse Hook (no matcher)
│   │
│   ├── AFTER Claude acts (reacting/observing)
│   │   │ Signals: "after", "when done", "on save", "on edit", "once Claude"
│   │   │
│   │   ├── After using a SPECIFIC TOOL
│   │   │   "after editing"/"on save" → Write|Edit
│   │   │   "after committing" → Bash(git commit)
│   │   │   "after running tests" → Bash(npm test|pytest)
│   │   │   → PostToolUse Hook + specific matcher
│   │   │
│   │   └── After ANY action
│   │       "after everything", "track all changes"
│   │       → PostToolUse Hook (no matcher)
│   │
│   ├── At SESSION START
│   │   "when Claude starts", "at the beginning", "on startup", "initialize"
│   │   → SessionStart Hook
│   │
│   ├── At SESSION END
│   │   "when Claude finishes", "at the end", "on exit", "log session"
│   │   → Stop Hook
│   │
│   └── When user SUBMITS A PROMPT
│       "before Claude reads my message", "intercept my prompt", "prepend to every request"
│       → UserPromptSubmit Hook
│
├── ONLY WHEN USER ASKS (on-demand)
│   │ Signals: "when I ask", "command", "on demand", "give me a way to", "let me"
│   │
│   ├── Specific ACTION (do something)
│   │   "deploy", "review", "test", "generate", "analyze"
│   │   → Skill (user-invocable: true)
│   │
│   ├── DELEGATION to a specialist
│   │   "specialist", "expert", "delegate", "autonomous", "in parallel"
│   │   → Subagent
│   │
│   └── MULTI-STEP workflow needing isolation
│       "complex workflow", "long-running", "don't pollute context", "isolated"
│       → Skill (context: fork)
│
├── KNOWLEDGE Claude should always have
│   │ Signals: "should know", "always remember", "be aware of", "conventions"
│   │
│   ├── Project-specific context (conventions, architecture, API patterns)
│   │   → Skill (reference, user-invocable: false)
│   │
│   └── Persistent session context (load every time)
│       "always loaded", "every session", "persistent"
│       → CLAUDE.md addition (or SessionStart hook)
│
├── CONNECT to an external service
│   Signals: "connect to", "integrate with", "pull data from", "OAuth", service names
│   → MCP Configuration
│
├── RESTRICT or ALLOW what Claude can do
│   │ Signals: "block Claude from", "don't let Claude", "restrict", "allow only"
│   │
│   ├── Block access to FILES/DIRECTORIES
│   │   "don't touch .env", "protect production"
│   │   → Permission deny rule
│   │
│   ├── Block specific TOOLS/COMMANDS
│   │   "don't allow git push", "block rm -rf"
│   │   → Permission deny rule (tool pattern)
│   │
│   ├── Allow tools WITHOUT asking
│   │   "allow without asking", "auto-approve", "skip confirmation"
│   │   → Permission allow rule
│   │
│   └── Lock configuration
│       "lock model", "sandbox mode", "restrict to sonnet"
│       → Settings change
│
├── DISTRIBUTE / SHARE
│   "package", "bundle", "distribute", "marketplace", "share with team"
│   → Plugin
│
├── AUTOMATE CI/CD
│   "CI/CD", "GitHub Actions", "GitLab CI", "pipeline", "on every push"
│   → CI/CD Configuration
│
├── CHANGE OUTPUT STYLE
│   "respond like", "tone", "voice", "writing style", "format responses as"
│   → Output Style
│
└── CAN'T CLASSIFY → go to Stage 3 (Disambiguation)
    Default assumption: skill (user-invocable: true)
```

### Gate vs Permission: The "Block" Disambiguation

"Block" is the most ambiguous word. Context determines which type:

| Pattern | Example | Type |
|---------|---------|------|
| "block [action-verb]" | "Block bad commits" | Hook (PreToolUse, exit 2) |
| "block [Claude] from [verb]ing [noun]" | "Block Claude from touching .env" | Permission deny rule |
| "block [Claude] from [state]" | "Block Claude from using too many tokens" | Settings change |

Still unclear → ask Q5 from disambiguation protocol.

---

## 4. Signal Taxonomy

9 signal categories. Within the decision tree, these are what you look for at each branch.

| Category | Phrases | Implies |
|----------|---------|---------|
| **TEMPORAL** | "every time", "after [action]", "before [action]", "when Claude starts/finishes", "on save" | hook |
| **AUTONOMY-AUTO** | "automatically", "without me asking", "in the background" | hook or agent |
| **AUTONOMY-DEMAND** | "when I ask", "command", "on demand", "give me a way to", "let me" | skill |
| **AUTONOMY-KNOW** | "should know about", "always remember", "be aware of", "conventions" | reference skill |
| **DELEGATION** | "specialist", "delegate to", "autonomous", "in parallel", "hand off to" | agent |
| **PERMISSION** | "block [access]", "restrict", "allow only", "lock down", "protect [files]" | settings/permissions |
| **INTEGRATION** | "connect to [service]", "integrate with", "OAuth", "API key", service names | MCP |
| **PACKAGING** | "package", "distribute", "share with team", "marketplace", "bundle" | plugin |
| **CI/CD** | "CI/CD", "GitHub Actions", "GitLab CI", "pipeline", "PR review" (automated) | cicd |
| **STYLE** | "respond like", "tone", "voice", "format responses as" | output-style |
| **EXPERTISE** | "hook", "PreToolUse", "SKILL.md", "frontmatter", "subagent", "plugin.json" | bypass |

### Signal Extraction Rules

1. Extract ALL signals from the message, not just the first match.
2. Context disambiguates ambiguous words — look at what FOLLOWS the ambiguous word.
3. Absence of signals IS a signal. No temporal + no autonomy → likely skill.
4. Specific beats general within a category.
5. Expertise signals override everything.

---

## 5. Disambiguation Protocol

When Stage 2 can't classify confidently, ask ONE question. Max 2 total. Never expose
Claude Code vocabulary.

| Question | Use When | Answers → Type |
|----------|----------|----------------|
| Q1: "Should this happen automatically every time, or only when you ask?" | Can't determine hook vs skill | "Automatically" → hook, "When I ask" → skill, "Both" → compound |
| Q2: "Should this check/enforce something, or give Claude knowledge?" | Both hook and skill seem relevant | "Check/enforce" → hook, "Knowledge" → reference skill |
| Q3: "Does this need an external service, or work within Claude?" | Unclear if external integration | "External" → MCP, "Within Claude" → not MCP |
| Q4: "Should this work in all projects, just this one, or shared with team?" | Type resolved, scope unclear | "This project" → project, "All" → user, "Team" → plugin |
| Q5: "Should this STOP Claude from doing something, or ADD a check on actions?" | "Block/prevent" could mean permission or hook | "Stop entirely" → permission, "Check/gate" → hook |

**Selection logic:** Identify which two branches compete, pick the question that
separates them. After the answer, reclassify. If still ambiguous after 2 questions,
go with best guess + "Does this sound right?"

---

## 6. Compound Intent Detection

Some requests need multiple extension types. Detect when the tree suggests more
than one branch simultaneously.

| Pattern | Signal Combination | Produces | Order |
|---------|-------------------|----------|-------|
| **ENFORCE** | knowledge + automation + enforcement | skill (reference) + hook (PostToolUse) | skill first |
| **REVIEW-GATE** | temporal→before + gate/block + review | hook (PreToolUse gate) + skill (review logic) | skill first |
| **KNOW-AND-ACT** | knowledge reference + temporal→recurring | skill (reference) + hook (uses the skill) | skill first |
| **CONNECT-AND-USE** | integration + temporal/autonomy | MCP config + hook/skill (workflow) | MCP first |
| **FULL-PIPELINE** | CI/CD + temporal→before + permission | cicd + hook (pre-commit) + settings | cicd first |

When compound detected:
- If Cap 5 (Extension Combos) exists → route to combo engine
- Otherwise → generate primary type, then offer secondary

---

## 7. Resolution & Handoff

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
   get wrong?", re-walk tree with new context. Never repeat a wrong classification.
5. Pass the full `intent-resolution` to the concierge as structured context.

---

## 8. Anti-Patterns & Edge Cases

- **NEVER** ask "do you want a hook or a skill?" — only behavioral questions
- **NEVER** assume the user knows what hooks, subagents, or MCP servers are
- **NEVER** override an expert who names the type explicitly
- If ZERO signals → default to skill (user-invocable), ask Q1
- If user contradicts ("automatic command") → ask Q1 to resolve
- If user rejects classification → full reset, reclassify with new context
- If request isn't about Claude Code extensions → null resolution, don't classify
- Prefer simpler type when genuinely ambiguous: skill > hook > agent > plugin
- "Make Claude better at X" → default to reference skill unless user clarifies
- **CLAUDE.md additions**: if the user wants persistent project context that should
  load every session, suggest CLAUDE.md instead of a skill (simpler, no file overhead)

For expanded signal tables, compound pattern details, and 20 worked examples,
see [references/decision-tree.md](references/decision-tree.md) and
[references/signal-catalog.md](references/signal-catalog.md).
