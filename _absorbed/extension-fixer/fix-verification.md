# Fix Verification — Post-Fix Testing Per Extension Type

How to verify each extension type actually works after a fix.

---

## Hook Verification

### Pre-Test State
- Settings JSON parses without errors
- Hook entry has valid event name, handler type, and handler fields
- If command handler: script file exists and is executable

### Functional Test (Command Handlers)

Construct test JSON input matching the hook's event schema:

**PreToolUse test input:**
```json
{
  "session_id": "test",
  "hook_event_name": "PreToolUse",
  "tool_name": "THE_MATCHER_TOOL",
  "tool_input": {"command": "echo test"}
}
```

**PostToolUse test input:**
```json
{
  "session_id": "test",
  "hook_event_name": "PostToolUse",
  "tool_name": "THE_MATCHER_TOOL",
  "tool_input": {"command": "echo test"},
  "tool_output": "test output"
}
```

**SessionStart test input:**
```json
{
  "session_id": "test",
  "hook_event_name": "SessionStart",
  "cwd": "/tmp/test"
}
```

**Stop test input:**
```json
{
  "session_id": "test",
  "hook_event_name": "Stop",
  "stop_reason": "end_turn"
}
```

**Run**: Pipe test JSON to script via Bash: `echo '<test json>' | /path/to/script`

**Expected results by behavior:**
- Blocking hook → exit code 2, JSON on stdout with `decision` or `permissionDecision`
- Allowing hook → exit code 0
- Feedback hook → exit code 0, optional text on stderr for `additionalContext`
- Error → exit code other than 0 or 2 (indicates script problem)

### Post-Test Instruction
Show the user: "[trigger action] to see it work now."
- PreToolUse on Write|Edit → "Edit a file to see the hook fire."
- PreToolUse on Bash(git commit*) → "Try a git commit to test."
- PostToolUse → "Make a file change — the hook runs after."
- SessionStart → "Start a new Claude Code session to test."

---

## Skill Verification

### Pre-Test State
- SKILL.md exists at correct path
- Frontmatter parses as valid YAML
- All required fields present and valid

### Functional Test
1. **Frontmatter extraction**: Parse frontmatter, confirm all fields have valid types
2. **Name match**: Verify `name` field matches directory name
3. **Description quality**: Confirm description contains at least 2 trigger-relevant phrases
4. **File references**: If body references supporting files, confirm they exist
5. **Dynamic injection**: If body uses `` !`command` `` syntax, validate the command runs

### Post-Test Instruction
- User-invocable: "Type `/[name]` to test it."
- Reference (auto-trigger): "Ask something that should trigger it — try: '[trigger phrase from description]'"
- Model-invocable: "Start working on something related — Claude should use it automatically."

---

## Permission Verification

### Pre-Test State
- Settings JSON parses without errors
- Permission arrays contain well-formed patterns

### Functional Test
1. **Parse**: Read the settings file, extract permissions object
2. **Rule check**: Confirm target rules present in correct arrays (allow/deny/ask)
3. **Conflict check**: Scan all scopes for contradicting rules
4. **Effective permissions**: After scope resolution, show what the final effective state is

### Post-Test Instruction
- For deny rule: "Try [the denied action] — Claude should refuse."
- For allow rule: "Try [the allowed action] — Claude should proceed without asking."
- For ask rule: "Try [the action] — Claude should ask for confirmation."

---

## Agent Verification

### Pre-Test State
- `.md` file exists in `agents/` directory
- Frontmatter parses with valid fields

### Functional Test
1. **File location**: Confirm file is in `agents/` not `skills/`
2. **Frontmatter**: All required fields (name, description) present
3. **Tools**: All listed tools are valid Claude Code tool names
4. **Model**: If specified, model is one of sonnet/opus/haiku/inherit

### Post-Test Instruction
"Ask Claude to delegate something matching this agent's description — try: '[phrase from description]'"

---

## MCP Verification

### Pre-Test State
- Config file parses as JSON
- Server entry exists with valid transport config

### Functional Test
1. **Parse**: Read config file, extract server entry
2. **Binary check (stdio)**: Run `which [command]` to verify binary exists in PATH
3. **URL check (http)**: Verify URL format is valid (cannot test connection without restart)
4. **Env vars**: If `env` block references variables, check they're set

### Post-Test Instruction
- "Restart Claude Code, then check `/mcp` to see if [server] is connected."
- For stdio: "Make sure [command] is installed: `which [command]`"

---

## Plugin Verification

### Pre-Test State
- `plugin.json` manifest exists and parses
- Declared components exist in their directories

### Functional Test
1. **Manifest**: Validate required fields (name, version, description)
2. **Components**: For each declared skill/agent, verify the file exists
3. **Registration**: Check `enabledPlugins` in settings for this plugin name

### Post-Test Instruction
"Check `/help` to see if the plugin's commands appear in the list."

---

## Common Post-Fix Issues

Even after a structural fix, the extension might still not work due to:

| Issue | Cause | Resolution |
|-------|-------|------------|
| Extension still behaves the old way | Claude Code caches some configs; needs restart | "Restart Claude Code to reload extensions" |
| Hook fires but with unexpected behavior | Structural fix was correct but logic is wrong | "The structure is fixed. The script logic may need adjustment — describe what you expected." |
| Skill triggers but does the wrong thing | Description is now correct but body instructions are off | "The skill is triggering correctly now. The instructions inside may need editing." |
| Permission rule applies too broadly | Pattern syntax correct but too permissive | "The rule syntax is correct. Let's narrow the pattern to be more specific." |
