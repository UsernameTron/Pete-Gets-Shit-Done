---
name: cc-ref-permissions
description: |
  Claude Code permissions reference — permission rule syntax, allow/ask/deny
  rules, tool-specific specifiers, wildcard patterns, Bash(), Read(), Edit(),
  WebFetch(), MCP tool naming, Agent() rules, permission modes, working
  directories, gitignore-style path patterns.
  Background knowledge only — provides authoritative Claude Code documentation
  for permissions. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: Permissions

## Quick Reference

### Rule Evaluation Order

Rules evaluate: **deny → ask → allow**. First match wins. Deny always takes precedence.

### Permission Rule Syntax

Format: `Tool` or `Tool(specifier)`

| Pattern | Effect |
|---------|--------|
| `Bash` or `Bash(*)` | Match all Bash commands |
| `Bash(npm run build)` | Exact command match |
| `Bash(npm run *)` | Glob wildcard — any command starting with `npm run ` |
| `Bash(* --version)` | Wildcard at start — any command ending with `--version` |
| `Bash(git * main)` | Wildcard in middle — e.g., `git checkout main` |

**Space before `*` matters:** `Bash(ls *)` enforces word boundary (matches `ls -la`, not `lsof`). `Bash(ls*)` matches both.

### Read/Edit Path Patterns (gitignore spec)

| Pattern | Meaning | Example |
|---------|---------|---------|
| `//path` | Absolute filesystem path | `Read(//Users/alice/secrets/**)` |
| `~/path` | Home directory relative | `Read(~/.zshrc)` |
| `/path` | Project root relative | `Edit(/src/**/*.ts)` |
| `path` or `./path` | Current directory relative | `Read(*.env)` |

`*` matches single directory; `**` matches recursively.

### Tool-Specific Rules

| Tool | Specifier | Example |
|------|-----------|---------|
| `Bash` | Command with glob wildcards | `Bash(npm run *)` |
| `Read` | gitignore-style path pattern | `Read(./.env)` |
| `Edit` | gitignore-style path pattern (applies to all edit tools) | `Edit(/docs/**)` |
| `WebFetch` | `domain:hostname` | `WebFetch(domain:example.com)` |
| `mcp__server` | Server name prefix | `mcp__puppeteer` |
| `mcp__server__tool` | Specific MCP tool | `mcp__puppeteer__puppeteer_navigate` |
| `Agent(name)` | Subagent by name | `Agent(Explore)` |

### Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Prompts for permission on first use |
| `acceptEdits` | Auto-accepts file edit permissions |
| `plan` | Read-only — no modifications or commands |
| `dontAsk` | Auto-denies unless pre-approved via allow rules |
| `bypassPermissions` | Skips all prompts (isolated environments only) |

### Settings Structure

```jsonc
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Read(~/.zshrc)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "Bash(curl *)"],
    "additionalDirectories": ["../shared/"],
    "defaultMode": "default"
  }
}
```

### Working Directories

- Default: directory where Claude was launched
- Extend with: `--add-dir <path>` (CLI), `/add-dir` (session), `additionalDirectories` (settings)

### Security Notes

- Bash prefix patterns are fragile for URL filtering — use `WebFetch(domain:...)` + deny `curl`/`wget` instead
- Shell operators (`&&`) are detected — `Bash(safe-cmd *)` won't match `safe-cmd && other-cmd`
- `Read` rules apply best-effort to Grep and Glob tools
- PreToolUse hooks can extend permissions with runtime validation

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for permissions. Key pages to consult:

- Permissions documentation — rule syntax, tool-specific rules, wildcard patterns, path patterns, permission modes, hooks integration
- Pre-extracted schema tables — cross-validated rule patterns, mode descriptions, tool specifier formats
- Settings documentation — settings file locations and merge behavior, where permission rules are defined, scope precedence

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for rule syntax, pattern matching behavior, path resolution, or mode semantics.
