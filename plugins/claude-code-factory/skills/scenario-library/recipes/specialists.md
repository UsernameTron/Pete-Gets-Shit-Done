# Specialist Recipes (Subagent-Based)

5 recipes for dedicated specialist agents Claude can delegate to.

---

### S01: code-explorer
**Name**: Codebase research specialist
**Triggers**: "research codebase", "explore code", "find where", "codebase specialist", "code archaeologist"
**Type**: Subagent | **Generator**: cc-factory (subagent path)
**Pre-resolved**: name: code-explorer, tools: Read/Glob/Grep, model: haiku, permissionMode: plan, maxTurns: 20
**Customize**: focus areas (specific directories, file types), search depth, reporting format
**Verify**: Ask Claude to research a codebase question and confirm it delegates to the explorer

---

### S02: security-reviewer
**Name**: Security review specialist
**Triggers**: "security review", "vulnerability check", "security specialist", "audit for security"
**Type**: Subagent | **Generator**: cc-factory (subagent path)
**Pre-resolved**: name: security-reviewer, tools: Read/Glob/Grep, model: sonnet, permissionMode: plan, maxTurns: 25
**Customize**: security focus (OWASP top 10, auth, injection), language-specific checks, severity levels
**Verify**: Ask for a security review and confirm the specialist agent is invoked

---

### S03: test-writer
**Name**: Test generation specialist
**Triggers**: "write tests", "generate tests", "test writer", "need tests for"
**Type**: Subagent | **Generator**: cc-factory (subagent path)
**Pre-resolved**: name: test-writer, tools: Read/Write/Bash/Glob/Grep, model: sonnet, maxTurns: 30
**Customize**: test framework, coverage targets, test style (unit/integration/e2e), mock strategy
**Verify**: Ask Claude to write tests and confirm the specialist is invoked

---

### S04: refactoring-advisor
**Name**: Refactoring analysis specialist
**Triggers**: "refactor", "improve code quality", "code smell", "tech debt analysis", "clean up code"
**Type**: Subagent | **Generator**: cc-factory (subagent path)
**Pre-resolved**: name: refactoring-advisor, tools: Read/Glob/Grep, model: sonnet, permissionMode: plan, maxTurns: 25
**Customize**: refactoring focus (complexity, duplication, coupling), language-specific patterns
**Verify**: Ask for refactoring advice and confirm the specialist agent is invoked

---

### S05: documentation-writer
**Name**: Documentation generation specialist
**Triggers**: "write docs", "generate documentation", "API docs", "document this codebase"
**Type**: Subagent | **Generator**: cc-factory (subagent path)
**Pre-resolved**: name: documentation-writer, tools: Read/Write/Glob/Grep, model: sonnet, maxTurns: 30
**Customize**: doc format (JSDoc, Sphinx, mdBook), output location, documentation depth
**Verify**: Ask Claude to document code and confirm the specialist is invoked
