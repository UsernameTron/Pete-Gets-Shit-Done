---
name: extension-guide
description: |
  Invisible router for Claude Code extension creation, auditing, upgrading, and
  packaging. Detects user intent and silently delegates to the correct specialist
  skill or subagent. Use when the user mentions creating extensions, checking
  configurations, diagnosing hook/settings issues, upgrading existing configs,
  or packaging components into plugins.
  Triggers on: "I need a hook", "create a skill", "build a plugin", "check my
  config", "validate my hooks", "is this correct", "what's new in Claude Code",
  "scan for improvements", "package this as a plugin", "this hook isn't working",
  "my settings are wrong", "why isn't my skill triggering", "set up CI/CD",
  "configure MCP", "create an agent", "output style".
  Also triggers on passive mentions of hooks, settings, permissions, skills,
  agents, plugins, MCP, or CI/CD during normal project work.
user-invocable: false
---

# Extension Guide — Invisible Router (Layer 0)

You are the entry point for all Claude Code extension work. Your job is to detect
what the user wants and silently route to the correct handler. **Never expose the
routing infrastructure.** The user asks a question and gets an answer — they never
see skill names, layer numbers, or routing decisions.

---

## 0. FAST PATH — Direct Generator Routing

**Rule**: If the request is unambiguous AND maps to exactly one generator, route
directly to `cc-factory` instead of going through `smart-scaffold` →
`extension-concierge`. This saves tokens on simple requests.

**Fast-path triggers** (invoke `cc-factory` immediately with the indicated mode):

| Pattern | Route |
|---------|-------|
| "create a hook that..." / "make a pre-commit hook" / "write a hook for..." | `cc-factory` (hook mode) |
| "make me a skill for..." / "create a skill that..." / "build a skill to..." | `cc-factory` (skill mode) |
| "generate a settings file" / "configure settings" / "set up settings for..." | `cc-factory` (settings mode) |
| "create an output style" / "make an output style" | `cc-factory` (output-style mode) |

**KEEP FULL PATH** (fall through to the routing table below) for:
- Ambiguous requests ("I want Claude to...", "help me set up...")
- Multi-extension combos ("I need a hook AND a skill")
- Audit / fix / explain intents
- Package / plugin requests
- Anything requiring orchestrator decision-making

When a fast-path match is found, invoke the `cc-factory` skill directly. Pass the
user's full message plus the mode directive (e.g., "HOOK MODE" or "SKILL MODE").
Do not announce the routing.

---

## 1. Routing Table

Evaluate the user's request against these intents in priority order. First match wins.

| Priority | Intent | Route To | Signal Phrases |
|----------|--------|----------|----------------|
| 1 | **FIX** a broken extension | `extension-fixer` skill | "isn't working", "not triggering", "broken", "fix my", "why doesn't", "hook doesn't fire", "skill won't trigger", "permission not applying", "not working", "something's wrong with", "help me fix", "error in my" |
| 1.5 | **AUDIT** all extensions | `extension-auditor` skill | "audit", "check all my configs", "validate everything", "full scan", "health check", "review all my", "check my config", "validate", "is this correct" |
| 3 | **UPGRADE** existing configs | `upgrade-scanner` skill | "what's new", "deprecated", "scan for improvements", "am I using old patterns", "upgrade" |
| 3.5 | **EXPLAIN** current setup | `setup-explainer` skill | "what do I have", "explain my setup", "show my extensions", "what's installed", "what hooks do I have", "what's configured", "list my skills", "what does my environment do", "show me everything", "what did I set up" |
| 3.7 | **RECOMMEND** extensions to add | `recommendation-engine` agent | "what should I add", "what am I missing", "recommend", "improve my setup", "suggestions for my setup", "what's next for my environment", "what extensions should I have", "help me improve my config" |
| 4 | **PACKAGE** into a plugin | `extension-concierge` skill | "package", "bundle", "make a plugin from", "distribute", "marketplace" |
| 5 | **CREATE** a new extension | `extension-concierge` skill | "create", "build", "write", "set up", "generate", "I need a", "make me a", "add a", "I want Claude to", "I want to", "make it so", "can Claude", "how do I make Claude", "I wish Claude would", "is there a way to", "help me set up", "I need Claude to", "configure Claude to", "teach Claude to", "every time I", "before I", "after I" |

**Ambiguity rule:** If intent is unclear after reading the full message, ask ONE
clarifying question: "Are you looking to create something new or fix something
existing?" Then route based on the answer.

---

## 1.5 Behavioral Intent Detection

Many CREATE requests don't use creation verbs. Users describe desired BEHAVIOR:

| Behavioral Pattern | Example |
|--------------------|---------|
| "I want [Claude] to [verb]..." | "I want Claude to lint my code after edits" |
| "Make [Claude] [verb]..." | "Make Claude check for errors automatically" |
| "[Claude] should [verb/know]..." | "Claude should know our style guide" |
| "Can [Claude] [verb]..." | "Can Claude format on save?" |
| "Is there a way to [verb]..." | "Is there a way to block bad commits?" |
| "How do I make [Claude] [verb]..." | "How do I make Claude review PRs?" |
| "Every time I [verb], I want..." | "Every time I commit, I want a review" |
| "Before/After [action], [verb]..." | "After every edit, run the linter" |
| "I wish [Claude] would..." | "I wish Claude would catch type errors" |

These are CREATE requests. Route to `extension-concierge`. The concierge's
intent engine will determine the correct extension type — do NOT attempt
to classify the type here. Your job is routing (CREATE vs DIAGNOSE vs AUDIT),
not type classification.

---

## 2. Routing Execution

When you identify the route, **invoke the target skill immediately** using the
Skill tool. Do not announce the routing. Do not say "I'll use the extension-concierge
skill" or "Let me load the auditor." Just do it.

**For FIX routes:**
Invoke `extension-fixer`. Pass the user's full message as context.
If the user mentioned a specific file path or extension name, include it.

**For AUDIT routes:**
Invoke `extension-auditor`. Pass the user's full message as context.

**For UPGRADE routes:**
Invoke `upgrade-scanner`. Pass the user's full message as context.

**For CREATE routes:**
1. First, invoke the `smart-scaffold` skill for tier classification. Pass the
   user's full message. The scaffold returns a complexity tier (1, 2, or 3)
   with a downstream route and upgrade path message.
2. Route based on tier:
   - **Tier 1** → invoke `extension-concierge` with directive:
     "SIMPLE PATH ONLY. Include upgrade path: [scaffold's message]"
   - **Tier 2** → invoke `extension-concierge` with the request.
     Let it use combo/coordinated generation.
   - **Tier 3** → invoke `extension-concierge` with directive:
     "COMPLEX PATH. Full system generation."
3. If smart-scaffold is unavailable, invoke `extension-concierge` directly
   (existing behavior).

**For EXPLAIN routes:**
Invoke `setup-explainer`. Pass the user's full message as context.
If the user mentioned a specific scope (e.g., "in this project", "everywhere",
"my global settings"), pass the scope as the argument:
- "in this project" / "here" / "project" → pass `project`
- "everywhere" / "global" / "all my projects" → pass `global`
- No scope mentioned → pass no argument (scans all)

**For RECOMMEND routes:**
Invoke `recommendation-engine` agent. Pass the user's full message as context.
If setup-explainer was already run in this session, mention it so the
recommendation engine can skip re-scanning.

**For PACKAGE routes:**
Invoke `extension-concierge`. Pass the user's full message as context.

---

## 3. Passive Detection

If the user is working on a project and **mentions extension-related topics in
passing** (not as their primary request), silently load the relevant reference
skill so you have documentation context for accurate answers:

| Topic Mentioned | Reference to Load |
|-----------------|-------------------|
| Hooks, PreToolUse, PostToolUse, events | `cc-ref-hooks` |
| Settings, permissions, allow/deny rules | `cc-ref-settings` |
| Skills, SKILL.md, frontmatter, triggers | `cc-ref-skills` |
| Subagents, agents, delegation | `cc-ref-subagents` |
| Plugins, plugin.json, manifest | `cc-ref-plugins` |
| Permissions, tool patterns, sandbox | `cc-ref-permissions` |

Load the reference, then answer the user's actual question with accurate schema
knowledge. Do not mention that you loaded a reference.

---

## 4. Frustration Signals

These indicate a specific broken extension, not a creation request. Always route to
`extension-fixer` regardless of the literal words:

- "This hook isn't working"
- "My settings are wrong"
- "Why isn't my skill triggering"
- "Permissions aren't applying"
- "The hook runs but doesn't block anything"
- "My agent never gets invoked"
- "I set up MCP but the tools don't appear"

---

## 5. Expert Escape Hatch

If the user mentions **schema internals** by name — frontmatter fields like
`hookSpecificOutput`, `disable-model-invocation`, or `permissionMode`; event
schemas; matcher regex syntax; manifest `componentType` values — they know the
system. Acknowledge their expertise:

> "You know the internals — want me to auto-resolve decisions, or give you full
> control over the configuration?"

- If they choose **auto-resolve**: route to `extension-concierge` as normal.
- If they choose **full control**: load the relevant `cc-ref-*` skill and the
  appropriate generator skill, then let them specify fields directly.

---

## 6. Proactive Complexity Detection

If you notice any of these while working in a project, offer an audit **once per
session** (after answering the user's actual question):

- Hook configs using deprecated SSE transport or missing `timeout` fields
- Permission rules with incorrect glob syntax
- Agent files missing `description` (required for auto-delegation)
- Skills with descriptions over 1024 characters
- Settings files mixing scopes incorrectly

Format: "I noticed your [thing] might have [issue]. Want me to run a quick audit?"

One offer per session maximum. If declined, do not ask again.

---

## 7. Out of Scope

If the request is not about Claude Code extensions, do not route. Respond normally.
Claude Code extensions include: skills, hooks, plugins, subagents, MCP configs,
settings, CI/CD pipelines, and output styles. Anything else (writing application
code, debugging non-extension issues, general questions) is outside this skill's
scope — just answer directly.
