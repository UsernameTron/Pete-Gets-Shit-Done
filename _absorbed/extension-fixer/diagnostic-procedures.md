# Diagnostic Procedures — Systematic Checks Per Extension Type

Run diagnostics in order. Stop at the first FAIL — that's the root cause.
Each step specifies what to check, PASS/FAIL criteria, and which fix template applies.

---

## User Says → Likely Root Cause

| User Says | Likely Root Cause | Start At |
|-----------|------------------|----------|
| "My hook isn't working" | Wrong event, missing matcher, script not executable | Hook step 3 |
| "My skill doesn't trigger" | Bad description, trigger collision, user-invocable: false | Skill step 5 |
| "My hook fires but doesn't block" | Wrong exit code (1 vs 2), missing hookSpecificOutput | Hook step 8 |
| "My agent never gets invoked" | Missing description, wrong tools, not in agents/ | Agent step 1 |
| "My settings aren't applying" | Wrong scope file, conflicting scopes, invalid JSON | Permission step 1 |
| "My MCP server doesn't connect" | Binary not found, wrong transport, wrong config file | MCP step 3 |
| "I changed my skill but it still does the old thing" | Editing wrong copy, cached, wrong directory | Skill step 7 |
| "Permission rule isn't working" | Deny overrides allow, wrong pattern syntax | Permission step 3 |
| "My hook runs on everything" | Matcher missing or too broad | Hook step 4 |
| "Error when starting a session" | Invalid JSON in settings, broken SessionStart script | Hook step 1 |

---

## Skill Diagnostic Protocol (7 Steps)

**Step 1 — FILE EXISTS?**
- Check: SKILL.md exists at the expected path
- PASS: File found
- FAIL: File missing, wrong name (skill.md), wrong directory → **F07, F08**

**Step 2 — FRONTMATTER VALID?**
- Check: File starts with `---`, has closing `---`, YAML parses cleanly
- PASS: Valid YAML frontmatter
- FAIL: Parse error → **F01, F02**

**Step 3 — REQUIRED FIELDS?**
- Check: `name` present (recommended), `description` present (strongly recommended)
- PASS: Both present
- FAIL: Missing field → **F05, F06**

**Step 4 — FIELD VALUES CORRECT?**
- Check: name is lowercase/hyphens/max 64 chars; description under 1024 chars; user-invocable is boolean; allowed-tools are valid tool names; model is valid
- PASS: All values valid
- FAIL: Format violation → **F17, F18**

**Step 5 — INVOCATION WORKING?**
- Check: If user-invocable: true, does /[name] match directory name? If false, does description contain trigger phrases? Any trigger collision with other skills?
- PASS: Invocation path is clear
- FAIL: Name mismatch, vague description, collision → **F23, F24**

**Step 6 — BODY FUNCTIONAL?**
- Check: Body non-empty; referenced supporting files exist; `!`command`` dynamic injections valid
- PASS: Body and references intact
- FAIL: Broken references, invalid dynamic injection

**Step 7 — SCOPE CORRECT?**
- Check: Skill in expected scope; no duplicate at different scope causing shadowing
- PASS: Scope matches expectation
- FAIL: Wrong scope, shadowed by duplicate → **F26, F27**

---

## Hook Diagnostic Protocol (10 Steps)

**Step 1 — SETTINGS FILE VALID?**
- Check: JSON file parses without errors
- PASS: Valid JSON
- FAIL: Parse error → **F03, F04**

**Step 2 — HOOKS OBJECT EXISTS?**
- Check: `"hooks"` key present at correct nesting level
- PASS: Found
- FAIL: Missing or misspelled key

**Step 3 — EVENT NAME CORRECT?**
- Check: Event name is one of the 10 known events, exact case match
- Known events: PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, SessionEnd, UserPromptSubmit, Notification, PreCompact, PermissionRequest
- PASS: Valid event name
- FAIL: Typo or wrong case → **F09**

**Step 4 — MATCHER APPROPRIATE?**
- Check: Does the event support matchers? Is the pattern valid? Does it cover intended tools?
- Events without matcher support: SessionStart, SessionEnd, Stop, SubagentStop, PreCompact
- PASS: Matcher is valid and appropriate
- FAIL: Matcher on matcherless event, too broad, too narrow → **F10, F21, F22**

**Step 5 — HANDLER VALID?**
- Check: Handler has `type` field; type is command/http/prompt/agent; type is supported for this event; required fields present (command, url, or prompt)
- PASS: Handler correctly structured
- FAIL: Missing type, unsupported type for event, missing required field → **F11, F16**

**Step 6 — COMMAND HANDLER WORKING?**
- Check: Referenced script file exists; script is executable (chmod +x); script reads JSON from stdin; command uses `$CLAUDE_PROJECT_DIR` correctly
- PASS: Script accessible and executable
- FAIL: Script missing, not executable, wrong path → **F12, F13, F15**

**Step 7 — PROMPT/AGENT HANDLER WORKING?**
- Check: Prompt text includes `$ARGUMENTS`; model is valid; timeout is reasonable
- PASS: Handler configured correctly
- FAIL: Missing $ARGUMENTS, invalid model

**Step 8 — BLOCKING BEHAVIOR CORRECT?**
- Check: For PreToolUse blocking: outputs hookSpecificOutput JSON correctly; for Stop blocking: outputs decision JSON; exit code 2 for blocking, 0 for allowing
- PASS: Blocking works as intended
- FAIL: Wrong exit code, missing output JSON → **F19, F20**

**Step 9 — SCOPE CORRECT?**
- Check: Hook in the right settings file for intended scope; no conflicting hook at different scope
- PASS: Scope matches intention
- FAIL: Wrong scope file → **F26, F27**

**Step 10 — FUNCTIONAL TEST**
- Check: Construct minimal test JSON for the event type, pipe to script, check exit code and stdout
- PASS: Script runs and returns expected behavior
- FAIL: Runtime error, unexpected output → **F14**

---

## Permission Diagnostic Protocol (5 Steps)

**Step 1 — SETTINGS FILE VALID?** (same as Hook step 1) → **F03, F04**

**Step 2 — PERMISSIONS OBJECT EXISTS?**
- Check: `permissions.allow`, `permissions.deny`, or `permissions.ask` arrays present
- PASS: At least one array found
- FAIL: Missing permissions object

**Step 3 — PATTERN SYNTAX CORRECT?**
- Check: Each pattern matches `Tool`, `Tool(specifier)`, or `Tool(*)` format
- PASS: All patterns valid
- FAIL: Invalid syntax → **F17**

**Step 4 — RULE CONFLICTS?**
- Check: Deny at higher scope overriding allow at lower? Contradictory rules in same scope?
- PASS: No conflicts
- FAIL: Conflict found → **F25**

**Step 5 — SCOPE CORRECT?**
- Check: Rules in the intended settings file
- PASS: Correct scope
- FAIL: Wrong scope → **F26**

---

## Agent Diagnostic Protocol (5 Steps)

**Step 1 — FILE EXISTS?**
- Check: `.md` file in `agents/` directory (not `skills/`)
- PASS: Found
- FAIL: Wrong directory, missing .md extension → **F07**

**Step 2 — FRONTMATTER VALID?** (same as Skill step 2) → **F01, F02**

**Step 3 — REQUIRED FIELDS?**
- Check: `name` and `description` present; `tools` list valid; `model` valid; `permissionMode` valid
- PASS: All present and valid
- FAIL: Missing or invalid field → **F05, F06, F17**

**Step 4 — INVOCATION WORKING?**
- Check: Description enables delegation; no trigger collision with other agents
- PASS: Clear invocation path
- FAIL: Vague description, collision → **F23, F24**

**Step 5 — TOOL ACCESS?**
- Check: Agent has the tools it needs; no conflict between `tools` and `disallowedTools`
- PASS: Tool access correct
- FAIL: Missing needed tools, conflicting lists

---

## MCP Diagnostic Protocol (5 Steps)

**Step 1 — CONFIG FILE VALID?**
- Check: `.mcp.json` or `~/.claude.json` parses as JSON
- PASS: Valid JSON
- FAIL: Parse error → **F03, F04**

**Step 2 — SERVER ENTRY EXISTS?**
- Check: `mcpServers` object contains the target server name
- PASS: Found
- FAIL: Missing entry, misspelled name

**Step 3 — TRANSPORT VALID?**
- Check: HTTP has `url` field; stdio has `command` field
- PASS: Transport configured
- FAIL: Missing required transport fields

**Step 4 — BINARY EXISTS? (stdio only)**
- Check: `which [command]` succeeds
- PASS: Binary found
- FAIL: Not installed or not in PATH → **F28**

**Step 5 — CONNECTION TEST**
- Check: For http — note URL (can't test without restart). For stdio — can the process start?
- PASS: Appears reachable
- FAIL: Unreachable, wrong URL format

---

## Plugin Diagnostic Protocol (3 Steps)

**Step 1 — MANIFEST VALID?**
- Check: `plugin.json` exists and parses as JSON
- PASS: Valid manifest
- FAIL: Missing or invalid → **F03, F04**

**Step 2 — COMPONENTS DISCOVERABLE?**
- Check: Declared skills/agents exist in their directories
- PASS: All components found
- FAIL: Missing components → **F07**

**Step 3 — REGISTRATION?**
- Check: Plugin name in `enabledPlugins` in settings
- PASS: Registered
- FAIL: Not registered → **F29**
