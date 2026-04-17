# Decision Tree Reference — Full Expansion

This file expands on the inline decision tree in SKILL.md with event resolution
sub-trees, matcher tables, and gate behavior resolution.

---

## Full Decision Tree (Visual)

```
"WHEN does this happen?" — the fundamental question
│
├── AUTOMATICALLY when Claude acts
│   │
│   ├── BEFORE Claude acts ──────────────────────────────────── [Hook: PreToolUse]
│   │   ├── Before specific tool ──── resolve matcher ────────→ PreToolUse + matcher
│   │   └── Before any action ────────────────────────────────→ PreToolUse (no matcher)
│   │
│   ├── AFTER Claude acts ───────────────────────────────────── [Hook: PostToolUse]
│   │   ├── After specific tool ──── resolve matcher ─────────→ PostToolUse + matcher
│   │   └── After any action ─────────────────────────────────→ PostToolUse (no matcher)
│   │
│   ├── At SESSION START ────────────────────────────────────── [Hook: SessionStart]
│   │
│   ├── At SESSION END ──────────────────────────────────────── [Hook: Stop]
│   │
│   ├── When user SUBMITS PROMPT ────────────────────────────── [Hook: UserPromptSubmit]
│   │
│   ├── When SUBAGENT completes ─────────────────────────────── [Hook: SubagentStop]
│   │
│   └── On PERMISSION REQUEST ───────────────────────────────── [Hook: PermissionRequest]
│
├── ONLY WHEN USER ASKS ─────────────────────────────────────── [Skill or Agent]
│   ├── Specific action (do something) ──────────────────────→ Skill (user-invocable)
│   ├── Delegation to specialist ────────────────────────────→ Subagent
│   └── Multi-step isolated workflow ────────────────────────→ Skill (context: fork)
│
├── KNOWLEDGE Claude should always have ─────────────────────── [Skill or CLAUDE.md]
│   ├── Project-specific context ────────────────────────────→ Skill (reference)
│   └── Persistent session context ──────────────────────────→ CLAUDE.md addition
│
├── CONNECT to external service ─────────────────────────────── [MCP Configuration]
│
├── RESTRICT or ALLOW ───────────────────────────────────────── [Permissions/Settings]
│   ├── Block file/directory access ─────────────────────────→ Permission deny rule
│   ├── Block specific tool/command ─────────────────────────→ Permission deny rule
│   ├── Allow tool without asking ───────────────────────────→ Permission allow rule
│   └── Lock configuration ──────────────────────────────────→ Settings change
│
├── DISTRIBUTE / SHARE ──────────────────────────────────────── [Plugin]
│
├── AUTOMATE CI/CD ──────────────────────────────────────────── [CI/CD Configuration]
│
├── CHANGE OUTPUT STYLE ─────────────────────────────────────── [Output Style]
│
└── CAN'T CLASSIFY ─────────────────────────────────────────── [Disambiguation → default: Skill]
```

---

## Hook Event Resolution Sub-Tree

When the tree determines the type is "hook", resolve which event:

```
Hook detected → which event?
│
├── Timing: BEFORE an action
│   │
│   ├── Before a tool executes ──────────────→ PreToolUse
│   │   Signals: "before", "prevent", "gate", "check before", "block [verb]"
│   │
│   └── Before user prompt is processed ─────→ UserPromptSubmit
│       Signals: "intercept prompt", "modify input", "prepend to request"
│
├── Timing: AFTER an action
│   │
│   ├── After a tool executes ───────────────→ PostToolUse
│   │   Signals: "after", "on save", "once done", "when finished [verb]ing"
│   │
│   ├── After main agent finishes ───────────→ Stop
│   │   Signals: "when Claude finishes", "at the end", "on exit"
│   │
│   └── After subagent finishes ─────────────→ SubagentStop
│       Signals: "when the agent finishes", "after delegation completes"
│
├── Timing: AT A LIFECYCLE POINT
│   │
│   ├── Session start ──────────────────────→ SessionStart
│   │   Signals: "when Claude starts", "at the beginning", "initialize"
│   │
│   ├── Session end ────────────────────────→ SessionEnd
│   │   Signals: "when session closes", "on disconnect"
│   │
│   ├── Permission requested ───────────────→ PermissionRequest
│   │   Signals: "when asked for permission", "on permission dialog"
│   │
│   ├── Before compaction ──────────────────→ PreCompact
│   │   Signals: "before context compresses", "save before compact"
│   │
│   └── Notification sent ──────────────────→ Notification
│       Signals: "when Claude notifies", "on notification"
│
└── Timing: UNCLEAR → ask "When should this fire — when Claude does something,
    when you start a session, or at some other point?"
```

---

## Matcher Resolution Table

When a hook targets a specific tool, resolve the matcher pattern:

| User Says | Matcher Pattern | Event |
|-----------|----------------|-------|
| "editing", "saving", "writing files" | `Write\|Edit` | Pre/PostToolUse |
| "committing", "making commits" | `Bash` (command contains `git commit`) | Pre/PostToolUse |
| "pushing", "pushing code" | `Bash` (command contains `git push`) | Pre/PostToolUse |
| "running commands", "executing" | `Bash` | Pre/PostToolUse |
| "running tests" | `Bash` (command contains `test\|pytest\|jest`) | Pre/PostToolUse |
| "installing packages" | `Bash` (command contains `npm install\|pip install`) | Pre/PostToolUse |
| "reading files" | `Read` | Pre/PostToolUse |
| "searching", "grepping" | `Grep\|Glob` | Pre/PostToolUse |
| "using any tool" / "everything" | *(no matcher — fires on all tools)* | Pre/PostToolUse |
| "fetching URLs", "web requests" | `WebFetch` | Pre/PostToolUse |
| "creating files" | `Write` | Pre/PostToolUse |

**Note:** For Bash matchers on specific commands, the handler script must check
the `tool_input.command` field in the stdin JSON, because the matcher only matches
the tool name. For common patterns, generate a script that checks the command.

---

## Gate Behavior Resolution

When the user implies blocking or gating behavior:

| Signal | Gate Behavior | Exit Code |
|--------|--------------|-----------|
| "block", "prevent", "stop if", "fail if" | **Blocking gate** — prevent tool execution | Exit 2 |
| "warn", "notify", "log", "report" | **Informational** — run tool, report after | Exit 0 |
| "check", "validate" | **Context-dependent** — ask Q5 if unclear | Exit 2 or 0 |
| "require", "ensure", "must have" | **Blocking gate** — enforce a condition | Exit 2 |
| "suggest", "recommend" | **Informational** — non-blocking feedback | Exit 0 |

---

## Handler Type Resolution

After determining event and matcher, choose the handler type:

| Scenario | Handler Type | Reason |
|----------|-------------|--------|
| Pattern matching on command text | `command` | Deterministic, fast |
| File existence or content check | `command` | Script reads file, returns exit code |
| Code quality / style evaluation | `prompt` | Needs LLM judgment |
| Multi-file verification | `agent` | Needs tool access to read/check files |
| External service notification | `http` | Webhook to external system |
| Simple pass/fail check | `command` | Shell script with exit codes |
| Nuanced evaluation of output | `prompt` | Single-turn LLM assessment |
| Complex workflow verification | `agent` | Multi-turn with tool access |

**Default:** `command` unless the evaluation requires LLM judgment.
