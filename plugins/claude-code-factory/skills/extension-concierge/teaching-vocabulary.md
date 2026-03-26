# Teaching Vocabulary — Plain-English Concept Glossary

Use these definitions when writing teaching annotations. Match the concept
to what the user just received — don't explain concepts they didn't encounter.

---

## Core Concepts

### Hook
**Plain English**: A rule that tells Claude "do this automatically when X happens."
**You'll see this as**: An entry in `settings.json` under `"hooks"`.
**Analogy**: Like a trigger in a database — fires on an event, runs your code.

### Skill
**Plain English**: A set of instructions that teaches Claude a new capability.
**You'll see this as**: A `SKILL.md` file in a `skills/` directory.
**Analogy**: Like a recipe card — Claude follows the steps when the skill applies.

### Reference Skill
**Plain English**: Background knowledge that Claude always has access to, but never runs as a command.
**You'll see this as**: A `SKILL.md` with `user-invocable: false` in the header.
**Analogy**: Like a style guide on your desk — always available, never "executed."

### Subagent
**Plain English**: A specialist assistant that Claude delegates specific work to.
**You'll see this as**: A `.md` file in an `agents/` directory.
**Analogy**: Like handing a task to a colleague with specific expertise.

### MCP Server
**Plain English**: A connection between Claude and an external service (GitHub, database, etc.).
**You'll see this as**: An entry in `.mcp.json` or via `claude mcp add`.
**Analogy**: Like a USB cable — plugs Claude into an external tool.

### Plugin
**Plain English**: A package that bundles multiple extensions (skills, hooks, agents) for distribution.
**You'll see this as**: A directory with `plugin.json` manifest.
**Analogy**: Like a browser extension pack — multiple features, one install.

---

## Frontmatter Fields

### name
**Plain English**: The extension's identifier. Used in commands and file paths.
**Format rule**: Lowercase, hyphens only. `my-skill` not `My Skill`.

### description
**Plain English**: Tells Claude when to use this extension. The more specific, the better Claude is at knowing when to invoke it.
**What matters**: Include trigger phrases — words users would actually say.

### user-invocable
**Plain English**: Can you type `/name` to run it? `true` = yes, `false` = Claude uses it automatically.
**Default**: `true`. Set to `false` for background knowledge.

### disable-model-invocation
**Plain English**: Prevents Claude from using this skill on its own — only runs when you explicitly type the command.
**When to use**: For destructive operations (deploy, delete) or personal preference.

### allowed-tools
**Plain English**: Which tools the extension can use. Restricts what it's allowed to do.
**Common sets**: `Read, Grep, Glob` (read-only), `Read, Write, Edit, Bash, Glob, Grep` (full access).

### model
**Plain English**: Which Claude model runs this extension. Omit to use whatever model is active.
**Options**: `opus` (smartest), `sonnet` (balanced), `haiku` (fastest).

### context
**Plain English**: Whether the extension runs in the main conversation or a separate window.
**Options**: Omit (runs inline) or `fork` (runs in isolation, doesn't clutter your chat).

---

## Hook-Specific Fields

### event
**Plain English**: When does this hook fire?
**Common events**: `PreToolUse` (before Claude does something), `PostToolUse` (after), `SessionStart` (when Claude starts), `Stop` (when Claude finishes).

### matcher
**Plain English**: Which tool triggers this hook. Like a filter.
**Examples**: `Write|Edit` (file changes), `Bash` (any command), `Bash(git commit*)` (only commits).

### command (handler)
**Plain English**: The shell command that runs when the hook fires.
**You'll see this as**: A string in the `"command"` field, like `"prettier --write $CLAUDE_FILE_PATH"`.

### timeout
**Plain English**: How long the hook waits before giving up (in seconds).
**Default**: Varies. Increase for slow operations like test suites.

---

## Settings Fields

### permissions.allow
**Plain English**: Things Claude can do without asking you first.
**Pattern**: `"Tool(specifier)"` — e.g., `"Bash(npm test)"`.

### permissions.deny
**Plain English**: Things Claude is never allowed to do. Cannot be overridden.
**Pattern**: Same as allow. Deny always wins over allow.

### sandbox
**Plain English**: Runs Claude's commands in an isolated environment so they can't affect your system.
**When to use**: When running untrusted code or wanting extra safety.

---

## Customization Pointers by Extension Type

### Hooks — Common Modifications
- **Change what triggers it**: Edit the `matcher` field
- **Change when it triggers**: Switch the `event` (e.g., PreToolUse → PostToolUse)
- **Change what it does**: Edit the `command` string
- **Make it non-blocking**: Return exit code 0 instead of 2
- **Add file type filter**: Add grep/filter logic in the command script

### Skills — Common Modifications
- **Change who can invoke it**: Toggle `user-invocable` and `disable-model-invocation`
- **Restrict what it can do**: Edit `allowed-tools`
- **Add arguments**: Add `argument-hint` field, use `$ARGUMENTS` in body
- **Add live data**: Use `` !`command` `` syntax for dynamic context injection
- **Make it isolated**: Add `context: fork` and `agent: general-purpose`

### Settings — Common Modifications
- **Add more allowed commands**: Append to the `allow` array
- **Tighten restrictions**: Move rules from `allow` to `ask` or `deny`
- **Change scope**: Move config between `~/.claude/settings.json` (global) and `.claude/settings.json` (project)

### Subagents — Common Modifications
- **Change capability level**: Adjust `tools` list
- **Change intelligence level**: Switch `model` field
- **Make read-only**: Set `permissionMode: plan`
- **Add domain knowledge**: Add skill names to `skills` field
