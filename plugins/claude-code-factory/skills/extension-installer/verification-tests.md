# Verification Tests

How to verify each extension type after installation.

---

## Skills

**Check**: Confirm `SKILL.md` exists at the target path
**Tell user**:
- User-invocable: "Type `/[name]` to test it."
- Reference: "Ask Claude a question that matches the skill's description to see it auto-trigger."
**Common failures**: Wrong directory name (must match skill name), missing SKILL.md frontmatter

## Hooks

**Check**: Confirm hook entry exists in the target settings JSON under the correct event
**Tell user**: "[Do the trigger action] to see it fire."
- PostToolUse on Write|Edit: "Edit any file to trigger it."
- PreToolUse on Bash: "Run a shell command to trigger it."
- SessionStart: "Start a new Claude session."
- Stop: "Let Claude finish a task."
**Common failures**: Script not executable (fix: `chmod +x`), settings JSON syntax error, wrong event name

## Subagents

**Check**: Confirm `.md` file exists at the target path
**Tell user**: "Type `/agents` to see it listed, or ask Claude to delegate a task matching its description."
**Common failures**: Missing `description` field (required for auto-delegation), file not in agents/ directory

## Permissions

**Check**: Confirm rules appear in the target settings JSON under `permissions.allow/deny/ask`
**Tell user**:
- Allow: "Claude will now auto-approve [action] without asking."
- Deny: "Claude will now refuse to [action]."
- Ask: "Claude will prompt you before [action]."
**Common failures**: Pattern syntax wrong (use glob, not regex), conflicting allow/deny rules

## Settings

**Check**: Confirm the key-value pair is set in the target settings JSON
**Tell user**: Depends on setting:
- Model lock: "Claude will now use [model] for all sessions."
- Permission mode: "Claude is now in [mode] mode."
- Sandbox: "Claude's network access is now restricted."
**Common failures**: Typo in setting name, wrong scope (user vs project)

## MCP Servers

**Check**: Confirm server entry exists in `.mcp.json` or user config
**Tell user**: "Restart Claude Code for the server to connect. Then run `/mcp` to verify, and try using one of its tools."
**Common failures**: Binary not found (stdio), auth not completed (http/OAuth), wrong URL

## Plugins

**Check**: Confirm plugin.json is valid and directory structure is correct
**Tell user**:
- Testing: "Run `claude --plugin-dir ./[path]` to test locally."
- Installed: "Run `/help` to see plugin skills listed."
**Common failures**: Invalid plugin.json, missing required manifest fields
