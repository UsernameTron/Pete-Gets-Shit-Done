# Explanation Patterns — Plain-English Translation Templates

How to describe each extension type in behavioral, jargon-free language.

---

## Skill Pattern

```
- [/name or Name] — [simplified first sentence of description]
  ([scope] · [invocation mode])
```

**Name display**:
- `user-invocable: true` → show as `/name`
- `user-invocable: false` → show as `Name` (title case from kebab-case)

**Scope mapping**:
- `~/.claude/skills/` → "available everywhere"
- `.claude/skills/` → "this project, shared"
- Plugin-provided → "from [plugin-name] plugin"

**Invocation mode**:
- `user-invocable: true`, `disable-model-invocation: false` (or absent) → "you or Claude can use it"
- `user-invocable: true`, `disable-model-invocation: true` → "you invoke it manually"
- `user-invocable: false` → "loads automatically when relevant"

**Description simplification**: Take the first sentence of the description field. Remove Claude Code jargon. Rewrite from the user's perspective — what behavior do they experience?

---

## Hook Pattern

```
- [Descriptive name] — [plain-English behavior]
  ([scope] · [event plain English] → [matcher plain English])
```

**Name derivation**: Create a descriptive name from the hook's behavior, not its event name.
- A prettier command → "Auto-formatter"
- An eslint command → "Linter"
- A test runner → "Test runner"
- A blocking script → "Commit gate" / "[Action] blocker"
- A logging/webhook command → "Activity logger" / "Notifier"
- Generic or unclear → "[Event] hook"

**Event plain English**:
- `PreToolUse` → "runs before Claude [uses matcher tool / does anything]"
- `PostToolUse` → "runs after Claude [uses matcher tool / does anything]"
- `SessionStart` → "runs when you start a session"
- `SessionEnd` → "runs when your session ends"
- `Stop` → "runs when Claude finishes a response"
- `SubagentStop` → "runs when a specialist finishes"
- `UserPromptSubmit` → "runs before your message is sent"
- `PreCompact` → "runs before context is compressed"
- `Notification` → "runs when Claude sends a notification"

**Matcher plain English**:
- `Write|Edit` → "file changes"
- `Write` → "file creation"
- `Edit` → "file edits"
- `Bash` → "shell commands"
- `Bash(git commit*)` → "git commits"
- `Bash(git push*)` → "git pushes"
- `Read` → "file reads"
- `*` or omitted → "any action"
- `mcp__[server]__*` → "[server] tools"

**Behavior detection** (from command or script content):
- `exit 2` or `permissionDecision: deny` in script → "blocks [action]"
- `prettier`, `black`, `gofmt` in command → "auto-formats code"
- `eslint`, `pylint`, `clippy` in command → "lints code"
- `curl`, `webhook`, `notify` in command → "sends notifications"
- `echo`, `log`, `tee` patterns → "logs activity"

---

## Permission Pattern

```
ACCESS CONTROL ([N] rules)
  - Blocked: Claude can't [deny rules in plain English]
  - Allowed: Claude can [allow rules in plain English] without asking
  - Asks first: Claude will ask before [ask rules in plain English]
```

**Rule translation examples**:
- `Bash(rm -rf:*)` → "run destructive delete commands"
- `Bash(npm test)` → "run npm test"
- `Bash(npm run:*)` → "run npm scripts"
- `Read(.env*)` → "read .env files"
- `Read(./secrets/**)` → "read files in the secrets directory"
- `Write(*)` → "write any file"
- `Edit(*)` → "edit any file"
- `mcp__github__*` → "use GitHub tools"
- `WebFetch(*)` → "fetch web content"

**Grouping**: Show deny first (most important), then allow, then ask. Omit empty groups.

---

## MCP Pattern

```
- [Server name] — Connected via [transport], provides [tool description]
  ([scope])
```

**Transport plain English**:
- `http` type → "web connection (OAuth or API key)"
- `stdio` (has `command` field) → "local program ([command name])"

**Tool description**: If tool names are discoverable, list the count. Otherwise use the server name to infer purpose (e.g., "github" → "PR and issue tools").

---

## Settings Pattern

Only show non-default values. Each gets a single line:

```
SETTINGS
  - Model: locked to [model name] (Claude always uses this model)
  - Mode: [defaultMode in plain English]
  - Sandbox: enabled (commands run in isolation)
  - Additional directories: Claude can also see [list]
```

**Mode translation**:
- `default` → omit (it's the default)
- `acceptEdits` → "auto-accepts file changes"
- `plan` → "read-only mode"
- `bypassPermissions` → "all permissions bypassed"

---

## Project Config Pattern

```
PROJECT CONFIG
  - CLAUDE.md — Project instructions Claude reads every session ([N] lines)
  - Rules — [N] rule files for path-specific conventions
```

For CLAUDE.md: report existence and line count. Do not summarize contents.
For rules: count files and list their names (without the .claude/rules/ prefix).

---

## Observation Rules

After cataloging all extensions, check these conditions. Report the top 3 most impactful. Each observation includes the pattern detected and an action offer.

| # | Condition | Observation Text | Action Offer |
|---|-----------|-----------------|--------------|
| O1 | Reference skill exists but no enforcement hook | "Your [name] skill has rules, but nothing enforces them automatically." | "Want a hook that checks code against your [name] rules after every edit?" |
| O2 | PostToolUse hook exists but no PreToolUse gate | "You have [hook] that reacts after the fact, but nothing prevents issues upfront." | "Want to add a gate that blocks [action] before it happens?" |
| O3 | User-invocable skill could be automated | "You manually run /[name]. This could run automatically." | "Want a hook to trigger [name] after [relevant event]?" |
| O4 | Multiple hooks on same event, different scopes | "You have [N] hooks on [event] across scopes — they all run. Just so you know." | (Informational — no action needed) |
| O5 | Permissions deny + no hook logging | "Your permissions block [action]. A hook could also log attempts." | "Want to add logging when blocked actions are attempted?" |
| O6 | No SessionStart hooks | "Nothing runs when you start a session." | "Want Claude to load project context automatically at startup?" |
| O7 | No MCP servers connected | "No external services connected." | "You could add GitHub, Slack, or database integrations." |
| O8 | CLAUDE.md exists but is short (<10 lines) | "Your CLAUDE.md is light — adding project context here helps Claude every session." | "Want help expanding your CLAUDE.md?" |
| O9 | Skills exist but no CLAUDE.md | "You have skills but no CLAUDE.md." | "Adding one gives Claude project-level instructions." |
| O10 | Hooks across 3+ scopes | "Your hooks span multiple scopes." | "Here's the precedence: local > project shared > global." |
| O11 | Overlapping allow/deny on similar patterns | "You have overlapping allow/deny rules. Deny always wins." | "Want me to check for conflicts? [specific overlap]" |
| O12 | No hooks at all | "Your environment has no automation." | "Want Claude to auto-format, lint, or run tests after edits?" |
| O13 | Agent exists but description is vague | "Your [name] agent has a vague description — Claude may not know when to use it." | "Want me to suggest a better description?" |
| O14 | Skill allowed-tools is unrestricted | "Your [name] skill has full tool access." | "Want to restrict it to read-only for safety?" |
| O15 | MCP server configured but no permission rules for it | "Your [server] MCP is connected but has no permission rules." | "Want to add allow/deny rules for [server] tools?" |

**Rules**: Maximum 3 observations. Pick the most impactful (O1-O3 are highest value). If nothing notable, omit the observations section entirely.
