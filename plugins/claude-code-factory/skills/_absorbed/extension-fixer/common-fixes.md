# Common Fixes — Top 30 Fix Templates

Pre-written fix patterns for the most frequent extension issues. Each fix includes
detection, procedure, plain-English explanation, verification, and rollback.

---

## Structural Fixes (F01–F08)

### F01: Invalid YAML — Missing Colon
- **Detection**: YAML parse error referencing a specific line; field name without `:`
- **Procedure**: Edit the line to add `: ` after the field name
- **Explanation**: "A field in your skill's header is missing a colon. YAML needs `name: value` format."
- **Verification**: Re-parse frontmatter — should succeed
- **Rollback**: Undo the edit (remove the added colon)

### F02: Invalid YAML — Bad Indentation
- **Detection**: YAML parse error about indentation or mapping
- **Procedure**: Normalize the frontmatter to consistent 2-space indentation
- **Explanation**: "The indentation in your skill's header is inconsistent. YAML is sensitive to spacing."
- **Verification**: Re-parse frontmatter
- **Rollback**: Restore original indentation

### F03: Invalid JSON — Trailing Comma
- **Detection**: JSON parse error, comma before `}` or `]`
- **Procedure**: Edit to remove the trailing comma
- **Explanation**: "There's an extra comma at the end of a list in your settings file. JSON doesn't allow trailing commas."
- **Verification**: Re-parse JSON file
- **Rollback**: Re-add the comma

### F04: Invalid JSON — Missing Bracket
- **Detection**: JSON parse error, unexpected end of input
- **Procedure**: Add the missing closing `}` or `]` at the appropriate nesting level
- **Explanation**: "Your settings file is missing a closing bracket. This usually happens after editing by hand."
- **Verification**: Re-parse JSON file
- **Rollback**: Remove the added bracket

### F05: Missing Name Field
- **Detection**: Frontmatter has no `name` field
- **Procedure**: Derive name from directory name (kebab-case), add to frontmatter
- **Explanation**: "Your extension is missing a name. I'll use the directory name."
- **Verification**: Confirm name is valid format
- **Rollback**: Remove the added field

### F06: Missing Description Field
- **Detection**: No `description` in frontmatter
- **Procedure**: Generate description from body content (first heading + first paragraph, simplified)
- **Explanation**: "Your extension has no description — Claude uses this to decide when to invoke it. Without one, it may never trigger."
- **Verification**: Confirm description is under 1024 chars and contains action words
- **Rollback**: Remove the added field

### F07: Wrong File Location
- **Detection**: File not at expected path (SKILL.md not in `skills/[name]/`, agent not in `agents/`)
- **Procedure**: Show the correct location. Offer to move with `mv` via Bash.
- **Explanation**: "Your extension file is in the wrong directory. Claude looks for [type] files in [correct path]."
- **Verification**: File exists at new location, absent from old
- **Rollback**: Move back to original location

### F08: Wrong File Name (Case)
- **Detection**: `skill.md` instead of `SKILL.md`, or agent missing `.md`
- **Procedure**: Rename with `mv` via Bash
- **Explanation**: "The file name needs to be exactly `SKILL.md` (uppercase). Claude won't find it otherwise."
- **Verification**: Correct filename exists
- **Rollback**: Rename back

---

## Configuration Fixes (F09–F18)

### F09: Wrong Event Name (Case)
- **Detection**: Event name not in the known 10-event list, but a case-insensitive match exists
- **Procedure**: Edit the JSON to use the correct case (e.g., `PreTooluse` → `PreToolUse`)
- **Explanation**: "Event names are case-sensitive. '[wrong]' should be '[correct]'."
- **Verification**: Re-parse JSON, confirm event name matches known list
- **Rollback**: Restore original event name

### F10: Matcher on Matcherless Event
- **Detection**: `matcher` field on Stop, SessionStart, SessionEnd, SubagentStop, or PreCompact
- **Procedure**: Remove the matcher field (it's ignored anyway)
- **Explanation**: "This event doesn't support matchers — it fires on the event itself, not on specific tools. The matcher field is being ignored."
- **Verification**: Hook config valid without matcher
- **Rollback**: Re-add the matcher field

### F11: Handler Type Unsupported for Event
- **Detection**: `prompt` handler on SessionStart (only `command` supported), or similar mismatch
- **Procedure**: Switch to `command` handler, convert prompt text to a script or inline command
- **Explanation**: "This event only supports [supported types] handlers, not [current type]."
- **Verification**: Handler type matches event requirements
- **Rollback**: Restore original handler type

### F12: Missing Script File
- **Detection**: Command handler references a file path that doesn't exist
- **Procedure**: Create a skeleton script at the expected path with correct shebang and stdin parsing
- **Explanation**: "Your hook points to a script that doesn't exist yet. I'll create a starter script."
- **Verification**: File exists, is executable, runs without error on test input
- **Rollback**: Delete the created script

### F13: Script Not Executable
- **Detection**: Script file exists but `test -x` fails
- **Procedure**: `chmod +x [script path]`
- **Explanation**: "Your script exists but isn't marked as executable. The OS won't run it."
- **Verification**: `test -x` passes
- **Rollback**: `chmod -x [script path]`

### F14: Script Wrong Stdin Format
- **Detection**: Script tries to read stdin line-by-line or as plain text instead of JSON
- **Procedure**: Rewrite the stdin parsing section to use JSON (python `json.load(sys.stdin)` or bash `jq`)
- **Explanation**: "Your script reads input as plain text, but hooks receive JSON on stdin."
- **Verification**: Run script with test JSON input, confirm it processes correctly
- **Rollback**: Restore original stdin parsing

### F15: Command Path Missing $CLAUDE_PROJECT_DIR
- **Detection**: Hardcoded absolute path in command field that should be relative to project
- **Procedure**: Replace the hardcoded path prefix with `$CLAUDE_PROJECT_DIR`
- **Explanation**: "Your hook uses a hardcoded path. Using $CLAUDE_PROJECT_DIR makes it work in any project location."
- **Verification**: Path resolves correctly with variable
- **Rollback**: Restore hardcoded path

### F16: Missing Type Field in Handler
- **Detection**: Handler object has no `type` key
- **Procedure**: Infer type from other fields (`command` field → `"type": "command"`, `prompt` → `"type": "prompt"`)
- **Explanation**: "Your hook handler is missing the type field. I can tell from the other fields that it should be '[type]'."
- **Verification**: Handler has valid type, all required fields present
- **Rollback**: Remove the added type field

### F17: Invalid Tool Name in allowed-tools
- **Detection**: Unknown tool name in frontmatter
- **Procedure**: Suggest the closest valid tool name (Levenshtein match)
- **Explanation**: "'[wrong]' isn't a valid tool name. Did you mean '[closest]'?"
- **Verification**: All tool names in allowed-tools are valid
- **Rollback**: Restore original tool name

### F18: Name Format Violation
- **Detection**: Name has spaces, uppercase letters, or special characters
- **Procedure**: Convert to kebab-case (lowercase, hyphens replace spaces/underscores)
- **Explanation**: "Extension names must be lowercase with hyphens only. '[wrong]' becomes '[fixed]'."
- **Verification**: Name matches `^[a-z0-9-]+$` pattern
- **Rollback**: Restore original name

---

## Behavioral Fixes (F19–F25)

### F19: Wrong Exit Code for Blocking
- **Detection**: Script uses `exit 1` where `exit 2` is needed to block
- **Procedure**: Edit script to change `exit 1` to `exit 2` on blocking paths
- **Explanation**: "In Claude Code hooks, exit code 1 means 'error' (logged but ignored). To actually BLOCK the action, use exit code 2."
- **Verification**: Run script with test input, confirm exit code 2 on blocking path
- **Rollback**: Change back to exit 1

### F20: Missing hookSpecificOutput
- **Detection**: PreToolUse blocking hook exits 2 but doesn't write JSON to stdout
- **Procedure**: Add JSON output (`{"decision":"block","reason":"..."}`) before the exit
- **Explanation**: "Your hook blocks correctly (exit 2) but doesn't tell Claude why. Adding a reason helps Claude understand and explain to you."
- **Verification**: Script outputs valid JSON before exit 2
- **Rollback**: Remove the added JSON output

### F21: Matcher Too Broad
- **Detection**: Matcher is `*` or missing when user intended specific tools; hook fires on everything
- **Procedure**: Narrow matcher to the intended tool pattern (e.g., `Write|Edit` for file changes)
- **Explanation**: "Your hook fires on every tool Claude uses. To target only [intended], change the matcher."
- **Verification**: Matcher only matches intended tools
- **Rollback**: Restore original matcher

### F22: Matcher Too Narrow
- **Detection**: Hook never fires; matcher pattern doesn't match any tools or uses wrong syntax
- **Procedure**: Broaden or correct the pattern
- **Explanation**: "Your hook's matcher '[pattern]' doesn't match any tools. [Specific correction]."
- **Verification**: Matcher matches at least the intended tool
- **Rollback**: Restore original matcher

### F23: Description Too Vague
- **Detection**: Skill/agent description is too generic to trigger ("A helpful skill", "Does stuff")
- **Procedure**: Suggest improved description with specific trigger phrases from the body content
- **Explanation**: "Claude matches skills by description. '[current]' is too vague — Claude won't know when to use it."
- **Verification**: New description contains at least 3 trigger phrases
- **Rollback**: Restore original description

### F24: Trigger Collision
- **Detection**: Two skills/agents have overlapping description phrases; both fight for the same requests
- **Procedure**: Show both descriptions, suggest differentiation (add unique trigger phrases, remove shared ones)
- **Explanation**: "These two extensions both trigger on similar phrases. Claude has to guess which one to use."
- **Verification**: Descriptions have distinct trigger phrases
- **Rollback**: Restore original descriptions

### F25: Permission Deny Overrides Allow
- **Detection**: Allow rule at lower scope contradicted by deny rule at higher scope
- **Procedure**: Offer two options: make the deny rule more specific (exclude the intended allow), or remove the deny and add targeted denies
- **Explanation**: "Deny always wins over allow in Claude Code, regardless of scope. Your [scope] deny on '[pattern]' overrides your [scope] allow."
- **Verification**: No deny rule matches the intended allow pattern
- **Rollback**: Restore original permission rules

---

## Environmental Fixes (F26–F30)

### F26: Settings in Wrong Scope File
- **Detection**: Extension in global settings when it should be project-local (or vice versa)
- **Procedure**: Move the configuration from current file to correct file
- **Explanation**: "Your [extension] is in [current scope]. For [intended behavior], it should be in [correct scope]."
- **Verification**: Configuration present in correct file, absent from old
- **Rollback**: Move back to original file

### F27: Duplicate at Different Scope
- **Detection**: Same extension name/config at two different scopes
- **Procedure**: Show both, explain precedence (local > project shared > global), offer to remove the duplicate
- **Explanation**: "You have '[name]' in two places. The [higher priority] one wins. The other is being ignored."
- **Verification**: Only one copy remains at the intended scope
- **Rollback**: Restore the removed copy

### F28: MCP Binary Not Found
- **Detection**: `which [command]` fails for stdio MCP server
- **Procedure**: Show install command for the binary (npm/pip/brew based on the command)
- **Explanation**: "The program your MCP server needs ([command]) isn't installed or isn't in your PATH."
- **Verification**: `which [command]` succeeds after install
- **Rollback**: N/A (user installs manually)

### F29: Plugin Not Registered
- **Detection**: Plugin directory exists but not in `enabledPlugins` in settings
- **Procedure**: Add plugin to `enabledPlugins` in the appropriate settings file
- **Explanation**: "Your plugin files exist but the plugin isn't registered. Claude doesn't know about it yet."
- **Verification**: Plugin appears in `enabledPlugins`
- **Rollback**: Remove from `enabledPlugins`

### F30: Skill Directory Naming
- **Detection**: Directory has spaces, uppercase, or special characters
- **Procedure**: Rename directory to kebab-case with `mv`
- **Explanation**: "Skill directories must be lowercase with hyphens. '[wrong]' becomes '[fixed]'."
- **Verification**: Directory name matches `^[a-z0-9-]+$`
- **Rollback**: Rename back to original
