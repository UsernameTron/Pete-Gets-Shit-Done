# Hooks Configuration Guide

## What Are Hooks?

Hooks run custom commands before or after Claude Code tool executions. Use them for:
- Validation (lint after file writes)
- Notifications (alert on permission requests)
- Logging (track tool usage)
- Blocking (prevent dangerous operations)

---

## Configuration Location

Add hooks to any settings file:
- `~/.claude/settings.json` (user)
- `.claude/settings.json` (project, shared)
- `.claude/settings.local.json` (project, personal)

---

## Basic Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

---

## Hook Events

| Event | When It Fires |
|-------|---------------|
| `PreToolUse` | Before tool execution |
| `PostToolUse` | After tool completes |
| `PermissionRequest` | When permission dialog shown |
| `UserPromptSubmit` | When user submits prompt |
| `Stop` | When main agent finishes |
| `SubagentStop` | When subagent finishes |
| `SessionStart` | When session begins |
| `SessionEnd` | When session ends |
| `Notification` | When Claude sends notification |
| `PreCompact` | Before context compaction |

---

## Matchers

| Pattern | Matches |
|---------|---------|
| `Write` | Exact match: Write tool only |
| `Write\|Edit` | Either Write or Edit |
| `Bash` | Bash tool |
| `Notebook.*` | Any Notebook tool |
| `mcp__github__.*` | Any GitHub MCP tool |
| `*` | All tools |
| (empty/omitted) | All tools |

---

## Common Examples

### Auto-Format After File Changes
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$CLAUDE_PROJECT_DIR\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Validate Bash Commands
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

### Add Context at Session Start
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Current branch:' && git branch --show-current && echo 'Recent commits:' && git log --oneline -5"
          }
        ]
      }
    ]
  }
}
```

### Block Dangerous Commands
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous.py"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Input (stdin)

Hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/test"
  },
  "tool_use_id": "toolu_01ABC..."
}
```

---

## Hook Output

### Simple: Exit Codes

| Exit Code | Behavior |
|-----------|----------|
| `0` | Success, continue |
| `2` | Block operation, show stderr to Claude |
| Other | Non-blocking error, shown in verbose mode |

### Advanced: JSON Output

Return JSON to stdout for fine-grained control:

```json
{
  "decision": "block",
  "reason": "Command blocked for security reasons",
  "continue": true
}
```

**PreToolUse decisions:**
- `"permissionDecision": "allow"` - Bypass permission check
- `"permissionDecision": "deny"` - Block tool
- `"permissionDecision": "ask"` - Prompt user
- `"updatedInput": {...}` - Modify tool inputs

---

## Example: Bash Validator

`.claude/hooks/validate-bash.py`:
```python
#!/usr/bin/env python3
import json
import re
import sys

BLOCKED_PATTERNS = [
    (r"rm\s+-rf\s+/(?!tmp)", "Cannot rm -rf outside /tmp"),
    (r">\s*/etc/", "Cannot write to /etc"),
    (r"curl.*\|\s*bash", "Pipe to bash blocked"),
]

input_data = json.load(sys.stdin)
command = input_data.get("tool_input", {}).get("command", "")

for pattern, message in BLOCKED_PATTERNS:
    if re.search(pattern, command):
        print(message, file=sys.stderr)
        sys.exit(2)

sys.exit(0)
```

Make executable: `chmod +x .claude/hooks/validate-bash.py`

---

## Prompt-Based Hooks

Use LLM to evaluate decisions (Stop/SubagentStop only):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if all tasks are complete: $ARGUMENTS. Return JSON with 'decision': 'approve' or 'block' and 'reason'.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_PROJECT_DIR` | Project root directory |
| `CLAUDE_ENV_FILE` | (SessionStart only) File to persist env vars |
| `CLAUDE_CODE_REMOTE` | "true" if running in web environment |

### Persisting Environment Variables

In SessionStart hook:
```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
    echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
    echo 'export DEBUG=true' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

---

## Debugging Hooks

```bash
# Run with debug output
claude --debug

# Check hook registration
/hooks

# Test hook command manually
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./hook.sh
```

---

## Security Notes

1. Hooks run with your user permissions
2. Review all hook commands before adding
3. Changes to settings require session restart to take effect
4. Claude Code warns if hooks are modified externally
