# Subagent Creation Guide

## What Are Subagents?

Subagents are specialized AI assistants that Claude Code can delegate tasks to. Each has:
- Its own context window (doesn't pollute main conversation)
- Custom system prompt and expertise
- Configurable tool access
- Optional model selection

---

## Locations

| Type | Location | Scope |
|------|----------|-------|
| Project | `.claude/agents/` | Current project (shared via git) |
| User | `~/.claude/agents/` | All your projects |

Project agents take precedence over user agents with same name.

---

## File Format

```markdown
---
name: agent-name
description: When this agent should be used
tools: Read, Write, Bash  # Optional - inherits all if omitted
model: sonnet             # Optional - sonnet, opus, haiku, or 'inherit'
permissionMode: default   # Optional
skills: skill1, skill2    # Optional - auto-load these skills
---

Your agent's system prompt goes here.

Include:
- Role definition
- Step-by-step approach
- Specific instructions
- Best practices
- Constraints
```

---

## Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase letters and hyphens |
| `description` | Yes | When to invoke (triggers automatic delegation) |
| `tools` | No | Comma-separated list (omit to inherit all) |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` |
| `permissionMode` | No | `default`, `acceptEdits`, `bypassPermissions`, `plan` |
| `skills` | No | Skills to auto-load when agent starts |

---

## Model Selection

- **`sonnet`** (default): Best balance of capability and speed
- **`opus`**: Maximum capability for complex reasoning
- **`haiku`**: Fastest, best for simple/repetitive tasks
- **`inherit`**: Match main conversation's model

---

## Tool Access

**Common configurations:**

```yaml
# Read-only (exploration, code review)
tools: Read, Grep, Glob

# Read + limited execution
tools: Read, Grep, Glob, Bash

# Full editing
tools: Read, Write, Edit, Bash, Glob, Grep

# Include MCP tools
tools: Read, Bash, mcp__github
```

**Best practice**: Only grant tools the agent actually needs.

---

## Quick Creation

### Via /agents (Recommended)
```bash
/agents
# → Create New Agent
# → Choose project or user level
# → Describe agent (Claude generates it)
# → Customize and save
```

### Via File
```bash
# Project agent
mkdir -p .claude/agents
cat > .claude/agents/code-reviewer.md << 'EOF'
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer.

When invoked:
1. Run `git diff` to see changes
2. Review modified files
3. Check for issues

Focus on:
- Code clarity and readability
- Potential bugs and edge cases
- Security vulnerabilities
- Performance concerns

Provide feedback as:
- Critical (must fix)
- Warnings (should fix)
- Suggestions (consider)
EOF
```

---

## Using Subagents

### Automatic Delegation
Claude automatically delegates based on description match:
```
> Review my recent changes
# → May invoke code-reviewer if description matches
```

**Tip**: Add "use PROACTIVELY" or "MUST BE USED" in description for more aggressive matching.

### Explicit Invocation
```
> Use the code-reviewer agent to check my changes
> Have the debugger agent investigate this error
> Ask the test-runner agent to fix failing tests
```

---

## Built-in Agents

### Explore Agent
- **Model**: Haiku (fast)
- **Mode**: Read-only
- **Tools**: Glob, Grep, Read, Bash (read-only commands)
- **Use**: Quick codebase exploration

### Plan Agent
- **Model**: Sonnet
- **Tools**: Read, Glob, Grep, Bash
- **Use**: Research in plan mode before coding

### General-Purpose Agent
- **Model**: Sonnet
- **Tools**: All tools
- **Use**: Complex multi-step tasks

---

## Example Agents

### Debugger
```markdown
---
name: debugger
description: Debugging specialist for errors and test failures. Use proactively when encountering issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate failure location
4. Implement minimal fix
5. Verify solution

Process:
- Analyze error messages
- Check recent code changes
- Form and test hypotheses
- Add strategic debug logging

For each issue, provide:
- Root cause explanation
- Evidence supporting diagnosis
- Specific code fix
- Testing approach
```

### Test Runner
```markdown
---
name: test-runner
description: Runs tests and fixes failures. Use proactively after code changes.
tools: Read, Edit, Bash, Grep, Glob
model: sonnet
---

You are a test automation expert.

When code changes are made:
1. Identify affected test files
2. Run relevant tests
3. If failures occur:
   - Analyze failure messages
   - Determine if test or code is wrong
   - Fix appropriately
   - Re-run to verify

Commands:
- npm test / pytest / go test (detect from project)
- Run with verbose output for failures
```

### Documentation Writer
```markdown
---
name: doc-writer
description: Writes and updates documentation. Use when creating READMEs, API docs, or code comments.
tools: Read, Write, Glob, Grep
model: sonnet
---

You are a technical writer.

Principles:
- Clear and concise
- Examples for every concept
- Consistent formatting
- Keep up-to-date with code

For READMEs:
- Quick start section first
- Prerequisites clearly stated
- Examples that work out of the box

For API docs:
- Every public function documented
- Parameters and return values typed
- Error cases explained
```

---

## Advanced: Resumable Agents

Agents can continue from previous conversations:

```
> Use the code-analyzer agent to review auth module
[Agent completes, returns agentId: "abc123"]

> Resume agent abc123 and now check the database module
[Continues with full previous context]
```

Track agent IDs for long-running analysis tasks.

---

## Best Practices

1. **Generate first, customize second**: Let Claude create initial agent, then refine
2. **Single responsibility**: One agent, one clear purpose
3. **Detailed prompts**: More guidance = better results
4. **Minimal tools**: Only grant what's needed
5. **Version control**: Commit project agents to git

---

## Managing Agents

```bash
# View/edit/delete agents
/agents

# List agent files
ls ~/.claude/agents/
ls .claude/agents/

# Edit directly
code ~/.claude/agents/my-agent.md
```
