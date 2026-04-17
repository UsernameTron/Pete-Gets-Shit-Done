# Combo Registry — Pre-Defined Extension Patterns

12 coordinated multi-extension patterns. Each combo specifies components,
wiring between them, and install order.

---

## CQ01: Enforce Coding Standards

**Trigger**: "enforce standards", "coding standards", "style enforcement", "code quality rules"
**Components**:
1. Reference skill — `coding-standards` (stores rules)
2. PostToolUse hook — fires on `Write|Edit`, reads standards skill, validates
3. PreToolUse hook (optional) — blocks `Write|Edit` if standards check fails

**Wiring**:
- Hook reads standards from the reference skill's SKILL.md
- PostToolUse provides feedback via `additionalContext`
- PreToolUse gate references the same standards (shared source of truth)

**Install order**: reference skill → PostToolUse hook → PreToolUse hook (optional)

---

## CQ02: Auto-Format + Lint Pipeline

**Trigger**: "auto-format and lint", "format then lint", "clean up code automatically"
**Components**:
1. PostToolUse hook — fires on `Write|Edit`, runs formatter (prettier/black/gofmt)
2. PostToolUse hook — fires on `Write|Edit`, runs linter after formatter
3. Permission rules — allow formatter and linter commands

**Wiring**:
- Formatter hook runs first (lower array index)
- Linter hook runs second on already-formatted code
- Both share `Write|Edit` matcher

**Install order**: permission rules → formatter hook → linter hook

---

## CQ03: Test-On-Change with Gate

**Trigger**: "run tests after changes and block if failing", "test gate", "test enforcement"
**Components**:
1. PostToolUse hook — fires on `Write|Edit`, runs test suite
2. PreToolUse hook — fires on `Bash(git commit*)`, blocks if tests fail
3. Permission rules — allow test runner command

**Wiring**:
- PostToolUse runs tests after every edit (feedback loop)
- PreToolUse commit gate checks last test result before allowing commit
- Gate script reads test exit code from a temp file written by PostToolUse

**Install order**: permission rules → PostToolUse test runner → PreToolUse commit gate

---

## CQ04: Deploy Pipeline

**Trigger**: "deploy command", "deployment pipeline", "deploy skill with checks"
**Components**:
1. Skill — `/deploy` command with environment selection and confirmation
2. PreToolUse hook — fires on `Bash(deploy*)`, validates branch and test status
3. Permission rules — allow deploy commands, deny on non-main branches

**Wiring**:
- Skill orchestrates the deploy workflow (environment, confirmation, command)
- PreToolUse hook provides safety gate independent of the skill
- Permission rules establish baseline allowed/denied deploy commands

**Install order**: permission rules → PreToolUse safety gate → deploy skill

---

## CQ05: PR Review System

**Trigger**: "PR review", "pull request review", "code review pipeline"
**Components**:
1. Skill — `/review-pr` command that runs review workflow
2. Subagent — `code-reviewer` specialist with read-only tools
3. PostToolUse hook (optional) — auto-trigger review on `Bash(git push*)`

**Wiring**:
- Skill invokes the subagent for deep analysis
- Subagent returns structured findings to the skill
- Optional hook auto-triggers the skill on push

**Install order**: subagent → skill → PostToolUse hook (optional)

---

## CQ06: Session Bootstrap

**Trigger**: "session setup", "initialize context", "load project context at start"
**Components**:
1. SessionStart hook — loads project context, checks environment
2. Reference skill — project context and conventions
3. Settings — environment variables for the session

**Wiring**:
- SessionStart hook reads reference skill and injects key context
- Hook sets environment variables via `CLAUDE_ENV_FILE`
- Reference skill provides the authoritative project knowledge

**Install order**: reference skill → settings (env vars) → SessionStart hook

---

## CQ07: Security Hardening

**Trigger**: "security lockdown", "harden permissions", "restrict access", "secure Claude"
**Components**:
1. Permission rules — deny dangerous commands, protect sensitive files
2. Sandbox config — enable sandboxing with exclusions
3. PreToolUse hook — additional runtime validation beyond static rules

**Wiring**:
- Permission rules provide static allow/deny baseline
- Sandbox adds OS-level isolation
- PreToolUse hook provides dynamic checks (e.g., context-aware blocking)

**Install order**: permission rules → sandbox config → PreToolUse hook

---

## CQ08: Documentation Auto-Update

**Trigger**: "auto-update docs", "keep docs in sync", "documentation pipeline"
**Components**:
1. PostToolUse hook — fires on `Write|Edit`, detects code changes
2. Subagent — `doc-writer` specialist that updates related docs
3. Reference skill (optional) — documentation conventions and templates

**Wiring**:
- PostToolUse detects which files changed
- Hook invokes doc-writer subagent with the changed file paths
- Subagent reads doc conventions from reference skill

**Install order**: reference skill (optional) → subagent → PostToolUse hook

---

## CQ09: Commit Convention Enforcement

**Trigger**: "enforce commit messages", "conventional commits", "commit standards"
**Components**:
1. Reference skill — commit message format and conventions
2. PreToolUse hook — fires on `Bash(git commit*)`, validates message format
3. UserPromptSubmit hook (optional) — suggests format when user mentions "commit"

**Wiring**:
- PreToolUse reads conventions from reference skill
- Hook validates commit message against format regex
- UserPromptSubmit provides proactive guidance

**Install order**: reference skill → PreToolUse hook → UserPromptSubmit hook (optional)

---

## CQ10: Environment-Aware Routing

**Trigger**: "different behavior per environment", "dev vs prod", "environment config"
**Components**:
1. SessionStart hook — detects current environment (branch, env vars)
2. Settings — environment-specific configurations
3. Permission rules — tighter restrictions in production context

**Wiring**:
- SessionStart reads branch/env to determine context
- Hook sets env vars that other hooks/skills can reference
- Permission rules activate based on environment detection

**Install order**: settings → SessionStart hook → permission rules

---

## CQ11: API Integration Pipeline

**Trigger**: "connect to API", "API integration", "external service with MCP"
**Components**:
1. MCP server config — connects to external API
2. Permission rules — allow MCP tool access patterns
3. Reference skill (optional) — API conventions and usage patterns

**Wiring**:
- MCP provides the API tools
- Permission rules whitelist specific MCP tool patterns
- Reference skill documents how to use the API effectively

**Install order**: MCP config → permission rules → reference skill (optional)

---

## CQ12: Coaching System

**Trigger**: "coaching", "teach Claude conventions", "guided behavior", "enforce patterns"
**Components**:
1. Reference skill — team conventions, patterns, and anti-patterns
2. PostToolUse hook — fires on `Write|Edit`, checks output against conventions
3. Stop hook (prompt-based) — reviews completed work against conventions
4. PreToolUse hook (optional) — proactive guidance before actions

**Wiring**:
- All hooks reference the same conventions skill (single source of truth)
- PostToolUse provides real-time feedback during work
- Stop hook provides end-of-task review
- PreToolUse provides proactive guidance (most aggressive)

**Install order**: reference skill → PostToolUse hook → Stop hook → PreToolUse hook (optional)
