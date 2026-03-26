# Claude Code CLI Quick Reference

## Core Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `claude` | Start interactive session | `claude` |
| `claude "query"` | Start with initial prompt | `claude "explain this project"` |
| `claude -p "query"` | One-shot query, then exit | `claude -p "what does main.ts do"` |
| `claude -c` | Continue most recent conversation | `claude -c` |
| `claude --resume` | Show conversation picker | `claude --resume` |
| `claude commit` | Create git commit | `claude commit` |
| `claude mcp` | Manage MCP servers | `claude mcp list` |

## Essential Flags

| Flag | Purpose |
|------|---------|
| `--model` | Set model: `claude --model claude-sonnet-4-5-20250929` |
| `--permission-mode plan` | Read-only analysis mode |
| `--append-system-prompt` | Add custom instructions |
| `--output-format json` | JSON output for scripting |
| `--max-turns N` | Limit agentic turns |
| `--verbose` | Show detailed execution |

## Keyboard Shortcuts (Interactive Mode)

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+L` | Clear screen (keeps history) |
| `Ctrl+O` | Toggle verbose output |
| `Ctrl+R` | Search command history |
| `Tab` | Toggle extended thinking |
| `Shift+Tab` | Cycle permission modes (Normal → Auto-Accept → Plan) |
| `Esc+Esc` | Rewind conversation/code |

## Quick Input Prefixes

| Prefix | Action |
|--------|--------|
| `#` | Add to CLAUDE.md memory |
| `!` | Run bash command directly |
| `/` | Execute slash command |
| `@` | Reference file path |

## Common Slash Commands

```bash
/help              # Show all commands
/clear             # Clear conversation
/init              # Create CLAUDE.md for project
/memory            # Edit memory files
/context           # Show token usage visualization
/cost              # Show session token costs
/agents            # Manage subagents
/mcp               # MCP server status & auth
/permissions       # View/modify permissions
/config            # Open settings
/doctor            # Health check
/compact           # Compress conversation context
```

## Piping & Scripting

```bash
# Pipe file content
cat error.log | claude -p "explain this error"

# Chain with other tools
git diff | claude -p "review these changes"

# JSON output for parsing
claude -p "list todos" --output-format json > todos.json

# Use in shell scripts
if claude -p "does this code have bugs?" --output-format json | jq -e '.has_bugs'; then
  echo "Bugs found!"
fi
```

## File References with @

```bash
> Explain @src/utils/auth.ts
> Compare @old.js with @new.js
> What's in @src/components/?
```

## Extended Thinking

Enable with `Tab` key or trigger words:
- "think" → Basic extended thinking
- "think hard", "think deeply" → Deeper analysis
- "analyze thoroughly" → Comprehensive reasoning

## Resume & Continue

```bash
# Continue last conversation in current directory
claude --continue

# Continue with new prompt
claude --continue --print "now add tests"

# Pick from recent conversations
claude --resume
```

## Git Worktrees for Parallel Sessions

```bash
# Create isolated worktree
git worktree add ../feature-branch -b feature-branch
cd ../feature-branch
claude  # Independent session

# List worktrees
git worktree list

# Clean up
git worktree remove ../feature-branch
```
