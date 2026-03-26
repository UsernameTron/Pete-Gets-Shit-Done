# Timing Flow — "When should this happen?"

Resolves: Extension TYPE (hook vs skill vs subagent) and hook EVENT.

---

## Decision Tree

```
Q1: "Should this happen automatically, or only when you ask for it?"

├── "Automatically" → It's a hook. Continue:
│
│   Q2: "Should it happen BEFORE Claude does something (to check or block),
│        or AFTER (to react to what just happened)?"
│
│   ├── "Before" → PreToolUse hook
│   │   Q3: "If something's wrong, should Claude stop completely,
│   │        or continue with a warning?"
│   │   ├── "Stop" → blocking: true, exit code 2
│   │   └── "Continue" → exit code 0 + additionalContext warning
│   │
│   ├── "After" → PostToolUse hook
│   │   Q3: "Should Claude wait for this to finish, or keep going
│   │        while it runs in the background?"
│   │   ├── "Wait" → async: false (default)
│   │   └── "Keep going" → async: true
│   │
│   └── "At startup/shutdown" → SessionStart or Stop hook
│
└── "Only when I ask" → Skill or subagent. Continue:

    Q2: "Should Claude handle this itself, or delegate to a specialist
         that works independently?"

    ├── "Handle itself" → Skill
    │   Q3: "Should this be a command you type (like /deploy),
    │        or knowledge Claude always has?"
    │   ├── "Command" → user-invocable: true, disable-model-invocation: true
    │   └── "Knowledge" → user-invocable: false (reference skill)
    │
    └── "Delegate" → Subagent
        Q3: "Should the specialist just read and analyze,
             or also make changes?"
        ├── "Read only" → permissionMode: plan, tools: Read,Glob,Grep
        └── "Make changes" → tools: Read,Write,Edit,Bash,Glob,Grep
```

---

## Answer-to-Field Mapping

| Answer Path | Extension Type | Key Fields |
|-------------|---------------|------------|
| Auto → Before → Stop | PreToolUse Hook | event: PreToolUse, blocking: true, exit: 2 |
| Auto → Before → Continue | PreToolUse Hook | event: PreToolUse, exit: 0, additionalContext |
| Auto → After → Wait | PostToolUse Hook | event: PostToolUse, async: false |
| Auto → After → Keep going | PostToolUse Hook | event: PostToolUse, async: true |
| Auto → Startup/shutdown | SessionStart/Stop Hook | event: SessionStart or Stop |
| On-demand → Self → Command | Skill | user-invocable: true, disable-model-invocation: true |
| On-demand → Self → Knowledge | Reference Skill | user-invocable: false |
| On-demand → Delegate → Read only | Subagent | permissionMode: plan |
| On-demand → Delegate → Changes | Subagent | tools: Read,Write,Edit,Bash,Glob,Grep |

---

## Skip Conditions

Do NOT ask a question if the user's words already answered it:

| User said... | Skip | Already resolved |
|---|---|---|
| "every time", "automatically", "always", "whenever" | Q1 | automatic → hook |
| "when I ask", "command", "I want to run", "/something" | Q1 | on-demand → skill |
| "before", "prevent", "block", "gate", "check first" | Q2 | before → PreToolUse |
| "after", "once done", "when finished", "on save" | Q2 | after → PostToolUse |
| "at startup", "when Claude starts", "initialize" | Q1+Q2 | SessionStart hook |
| "specialist", "delegate", "autonomous", "in parallel" | Q1+Q2 | subagent |
| "stop", "deny", "refuse", "don't let" | Q3 | blocking: true |
| "warn", "notify", "just let me know" | Q3 | non-blocking |

---

## Worked Examples

**"Auto-format my code after every edit"**
- "automatically" → skip Q1 (hook)
- "after every edit" → skip Q2 (PostToolUse, matcher: Write|Edit)
- Only ask Q3 if blocking behavior unclear → likely fire-and-forget
- Resolved: PostToolUse hook, Write|Edit matcher, async: true

**"I want a command to deploy"**
- "I want a command" → skip Q1 (on-demand), skip Q2 (self, not delegate)
- "command" → skip Q3 (user-invocable: true, disable-model-invocation: true)
- Resolved: Skill, user-invocable, disable-model-invocation

**"Help me with formatting"**
- No timing signal → ask Q1
- If "automatically" → ask Q2 (before or after?)
- Resolved after 2 questions max
