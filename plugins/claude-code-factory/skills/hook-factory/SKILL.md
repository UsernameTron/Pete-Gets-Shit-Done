---
name: hook-factory
description: |
  Generates complete Claude Code hook configurations from natural language.
  Produces JSON for settings files plus any required script files. Supports
  all 4 handler types (command, http, prompt, agent) and all 18 hook events.
  Use when creating hooks, blocking commands, auto-formatting, validating
  tool use, adding session start logic, or automating any Claude Code
  lifecycle event. Triggers on: "create a hook", "block command", "auto-lint",
  "validate before", "on session start", "prevent", "after file write".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
skills: cc-ref-hooks
---

# Hook Factory — Claude Code Hook Generator

## 1. Role & Workflow

You generate complete, correct hook configurations for Claude Code. When the
user describes a behavior they want to automate, prevent, or validate, you
produce the JSON config and any supporting scripts.

**4-step process — execute every time:**

1. **DETECT** — Map the user's intent to a hook event and handler type.
   Announce: "I'll create a **[event]** hook using a **[handler type]** handler."
2. **LOAD** — Read the cc-ref-hooks reference skill (already in context as
   background knowledge). For complex cases, read the official Claude Code
   documentation for hooks, or use the `cc-ref-hooks` reference skill if
   loaded in your context.
3. **RESOLVE** — Make all technical decisions using the Resolution Engine below.
   Present resolved decisions to the user before writing.
4. **OUTPUT** — Write the JSON config and any script files. Provide merge
   instructions, file paths, and a test command.

---

## 2. Intent-to-Event Mapping

Match the user's intent to the correct hook event. First match wins:

| User Intent | Event | Matcher |
|-------------|-------|---------|
| "block/prevent/deny [command]" | `PreToolUse` | `Bash` |
| "block/prevent [file write]" | `PreToolUse` | `Write\|Edit` |
| "validate before [tool]" | `PreToolUse` | Tool name |
| "modify input before [tool]" | `PreToolUse` | Tool name |
| "auto-approve [tool]" | `PreToolUse` | Tool name |
| "lint/format after write" | `PostToolUse` | `Write\|Edit` |
| "check after [tool]" | `PostToolUse` | Tool name |
| "log [tool] usage" | `PostToolUse` | Tool name or `*` |
| "handle [tool] failure" | `PostToolUseFailure` | Tool name |
| "on session start" | `SessionStart` | `startup\|resume` or omit |
| "when session ends" | `SessionEnd` | omit |
| "before prompt is sent" | `UserPromptSubmit` | (none — no matcher) |
| "rewrite/validate user input" | `UserPromptSubmit` | (none) |
| "when Claude is done" | `Stop` | (none — no matcher) |
| "verify completion" | `Stop` | (none) |
| "when subagent finishes" | `SubagentStop` | Agent type |
| "before compaction" | `PreCompact` | `manual\|auto` |
| "when config changes" | `ConfigChange` | Source type |
| "auto-approve permission" | `PermissionRequest` | Tool name |
| "when notification fires" | `Notification` | Notification type |
| "when task completes" | `TaskCompleted` | (none) |
| "when teammate idles" | `TeammateIdle` | (none) |
| "on worktree create" | `WorktreeCreate` | (none) |
| "on worktree remove/cleanup" | `WorktreeRemove` | (none) |
| "when subagent starts" | `SubagentStart` | Agent type |
| "after instructions load" | `InstructionsLoaded` | (none) |
| "block MCP tool" | `PreToolUse` | `mcp__server__tool` pattern |

If the intent doesn't clearly map, ask ONE clarifying question with the top
two candidate events and their differences.

---

## 3. Handler Type Selection

Choose the handler type based on what the hook needs to do:

| Handler Type | When to Use | Key Fields |
|-------------|-------------|------------|
| `command` | Run a shell script or CLI tool. **Default choice.** | `command`, `async` (optional) |
| `http` | Call an external HTTP endpoint (webhook, API) | `url`, `headers`, `allowedEnvVars` |
| `prompt` | Single-turn LLM evaluation (yes/no decision) | `prompt`, `model` (default: haiku) |
| `agent` | Multi-turn subagent with tool access for verification | `prompt`, `model` (default: haiku) |

**Decision rules:**
- If the hook runs a script, linter, or CLI command → `command`
- If the hook calls a webhook or external service → `http`
- If the hook needs LLM judgment on a simple yes/no question → `prompt`
- If the hook needs LLM judgment PLUS file reading/exploration → `agent`
- If unsure → default to `command`

**Handler availability by event:**
- All 4 types: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `UserPromptSubmit`, `Stop`, `SubagentStop`
- `command` only: `SessionStart`, `SessionEnd`, `SubagentStart`, `Notification`, `PreCompact`, `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`, `TeammateIdle`, `TaskCompleted`

---

## 4. Resolution Engine

Resolve ALL decisions before writing files:

| Decision | How to Resolve |
|----------|---------------|
| **Event** | Use Intent-to-Event Mapping (Section 2) |
| **Matcher** | Derive from target: file ops → `Write\|Edit`, bash → `Bash`, specific tool → exact name, MCP → `mcp__server__.*`, all tools → omit or `*`. Events without matcher support: omit. |
| **Handler type** | Use Handler Type Selection (Section 3) |
| **Handler config** | command: write the `command` string or script path. http: determine `url`, `headers`, `allowedEnvVars`. prompt/agent: write the `prompt` text with `$ARGUMENTS` placeholder. |
| **Blocking behavior** | For `PreToolUse`: use `hookSpecificOutput.permissionDecision` (`"allow"`, `"deny"`, `"ask"`). For other blocking events: use `decision: "block"` or exit code 2. For non-blocking: exit 0 or `decision: "approve"`. |
| **Input modification** | If hook should modify tool input: use `hookSpecificOutput.updatedInput` (PreToolUse only). |
| **Context injection** | If hook should add context: use `hookSpecificOutput.additionalContext` (PreToolUse only). |
| **Timeout** | command: 600s default (lower for fast scripts). prompt: 30s default. agent: 60s default. Set explicitly if non-default. |
| **Async** | Set `"async": true` only for fire-and-forget logging/notification hooks. command type only. |
| **Scope** | Personal project → `.claude/settings.local.json`. Team shared → `.claude/settings.json`. All projects → `~/.claude/settings.json`. Plugin → `hooks/hooks.json`. |
| **Script location** | If handler needs a script: `.claude/hooks/<script-name>.sh` (or `.py`). Use `"$CLAUDE_PROJECT_DIR"/.claude/hooks/...` in the command. |
| **Status message** | Set `statusMessage` for hooks with visible user wait (>2s). |

### Present to User

Show a table like:

> | Decision | Value |
> |----------|-------|
> | Event | PreToolUse |
> | Matcher | `Bash` |
> | Handler | command |
> | Behavior | Block on match (exit 2) |
> | Scope | `.claude/settings.local.json` |
> | Script | `.claude/hooks/block-rm.sh` |

"Does this look right? I'll proceed unless you want changes."

---

## 5. Output Protocol

### Step 1: Write Script Files (if needed)

For `command` handlers that need logic beyond a one-liner, create a script:

**Script conventions:**
- Location: `.claude/hooks/<descriptive-name>.sh` (or `.py`)
- Read JSON input from stdin: `INPUT=$(cat)` then parse with `jq`
- For Python: `input_data = json.load(sys.stdin)`
- Make executable: `chmod +x`
- Use `"$CLAUDE_PROJECT_DIR"/.claude/hooks/...` in the command field

**Exit code patterns:**
- Allow/continue: `exit 0`
- Block (for blocking events): `exit 2` with reason on stderr
- Non-blocking error: `exit 1` (logged in verbose mode only)

**JSON output patterns for PreToolUse:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Reason shown to Claude"
  }
}
```

**JSON output patterns for Stop/SubagentStop:**
```json
{
  "decision": "block",
  "reason": "Not all tasks complete"
}
```

### Step 2: Write or Merge JSON Config

**If the target settings file does NOT exist**, write a new file:
```json
{
  "hooks": {
    "<Event>": [
      {
        "matcher": "<pattern>",
        "hooks": [
          {
            "type": "<handler-type>",
            ...handler-specific fields
          }
        ]
      }
    ]
  }
}
```

**If the target settings file EXISTS**, read it first, then merge:
- If the event key exists: append the new matcher group to the array
- If a matcher group for the same pattern exists: append the handler
- Never overwrite existing hooks — always merge additively
- Show the user the diff before writing

### Step 3: Summary

Provide:
- **Files created/modified**: absolute paths for every file
- **Key choices**: non-obvious decisions made
- **Test it**: specific steps to verify:
  1. Restart Claude Code (or start new session) to load the hook
  2. Trigger the event (e.g., "try running `rm -rf /tmp/test`")
  3. Expected behavior (e.g., "should see: Destructive command blocked")
- **What's next**: any follow-up (e.g., "add more patterns to the script")

---

## 6. Common Patterns

### Block Dangerous Commands (PreToolUse + command)
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous.sh"
      }]
    }]
  }
}
```

### Auto-Lint After File Changes (PostToolUse + command)
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null; exit 0"
      }]
    }]
  }
}
```

### LLM-Evaluated Completion Check (Stop + prompt)
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "prompt",
        "prompt": "Review the conversation. Has the user's original request been fully completed? If not, respond with {\"decision\": \"block\", \"reason\": \"[what's missing]\"}. If yes, respond with {\"decision\": \"approve\"}.",
        "model": "haiku",
        "timeout": 30
      }]
    }]
  }
}
```

### Webhook Notification (PostToolUse + http)
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "http",
        "url": "https://hooks.example.com/claude-events",
        "headers": {"Authorization": "Bearer $WEBHOOK_TOKEN"},
        "allowedEnvVars": ["WEBHOOK_TOKEN"],
        "async": false
      }]
    }]
  }
}
```

### Session Environment Setup (SessionStart + command)
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "echo \"export NODE_ENV=development\" >> \"$CLAUDE_ENV_FILE\""
      }]
    }]
  }
}
```

---

## 7. Guardrails Triad

Hooks are one leg of the Claude Code safety architecture. When designing hooks,
consider how they interact with the other two mechanisms:

| Mechanism | Purpose | Scope |
|-----------|---------|-------|
| **Hooks** | Custom logic at lifecycle events — validate, block, transform, notify | Behavioral automation |
| **Permission modes** | `default`, `acceptEdits`, `plan`, `bypassPermissions` — controls what Claude can do without asking | Session-level access control |
| **Tool allow/deny lists** | `permissions.allow`, `permissions.deny`, `permissions.ask` in settings — whitelist/blacklist specific tool patterns | Granular tool gating |

These three work together. For example, a `PreToolUse` hook that blocks `rm -rf`
complements a `permissions.deny` rule for `Bash(rm -rf:*)` — the deny list
prevents execution entirely, while the hook can provide a nuanced response or
log the attempt. Choose the simplest mechanism that achieves the goal; combine
when defense-in-depth is needed.

---

## 8. Validation Checklist

Before presenting the final output, verify:

- [ ] Event name is one of the 18 documented events
- [ ] Matcher is appropriate for the event (omit for events without matcher support)
- [ ] Handler type is available for the chosen event
- [ ] For command handlers: script exists or inline command is self-contained
- [ ] For http handlers: `allowedEnvVars` includes all env vars used in `headers`
- [ ] For prompt/agent handlers: prompt text includes `$ARGUMENTS` if it needs event context
- [ ] Blocking behavior uses the correct mechanism for the event
- [ ] JSON structure matches the 3-level nesting: event → matcher group → handler
- [ ] Script files use `"$CLAUDE_PROJECT_DIR"` path prefix
- [ ] Script files are marked executable

---

## Post-Generation Install Offer

After presenting the generated hook configuration to the user, offer installation:

> "Want me to install this hook now?
>   1. **All my projects** — available everywhere you use Claude
>   2. **Just this project, for the team** — teammates get it too
>   3. **Just this project, just me** — personal, won't affect others
>   (or 'no' to just keep the generated config)"

If the user accepts, invoke the `extension-installer` skill with:
- Extension type: `hook`
- The generated hook JSON and any script files
- The selected scope (1 = user, 2 = project-shared, 3 = project-local)
