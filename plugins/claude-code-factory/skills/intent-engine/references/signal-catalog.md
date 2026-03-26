# Signal Catalog — Full Reference

Complete signal tables, compound patterns, disambiguation logic, and 20 worked
classification examples.

---

## Signal Tables (11 Categories)

### TEMPORAL (→ hook)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "every time" | recurring hook | strong |
| "after [action]" | PostToolUse | strong |
| "before [action]" | PreToolUse | strong |
| "when Claude starts" | SessionStart | strong |
| "when Claude finishes" | Stop | strong |
| "on save" / "on edit" | PostToolUse Write\|Edit | strong |
| "before committing" | PreToolUse Bash | strong |
| "whenever" | recurring hook | moderate |
| "at the beginning/end of" | SessionStart/Stop | moderate |
| "after installing" | PostToolUse Bash | moderate |

### AUTONOMY-AUTO (→ hook or agent)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "automatically" | hook | strong |
| "without me asking" | hook | strong |
| "in the background" | hook or agent | moderate |
| "always" (with action verb) | hook | moderate |

### AUTONOMY-DEMAND (→ skill)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "when I ask" | skill (user-invocable) | strong |
| "command" | skill (user-invocable) | strong |
| "on demand" | skill (user-invocable) | strong |
| "I want a command that" | skill (user-invocable) | strong |
| "give me a way to" | skill (user-invocable) | moderate |
| "let me" | skill (user-invocable) | moderate |

### AUTONOMY-KNOW (→ reference skill)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "should know about" | reference skill | strong |
| "always remember" | reference skill or CLAUDE.md | strong |
| "be aware of" | reference skill | moderate |
| "smarter about" | reference skill | moderate |
| "context about" | reference skill | moderate |
| "standards" / "conventions" | reference skill | moderate |

### DELEGATION (→ agent)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "specialist" | subagent | strong |
| "delegate to" | subagent | strong |
| "autonomous" | subagent | strong |
| "in parallel" | subagent | moderate |
| "expert at" / "hand off to" | subagent | moderate |
| "research first then build" | subagent | moderate |
| "dedicated agent for" | subagent | strong |

### PERMISSION (→ settings/permissions)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "block [Claude] from [access]" | deny rule | strong |
| "prevent [Claude] from [access]" | deny rule | strong |
| "restrict" | deny/settings | moderate |
| "allow only" | allow rule | strong |
| "lock down" | settings | moderate |
| "sandbox" | settings | strong |
| "don't let Claude touch" | deny rule | strong |
| "protect [files]" | deny rule | strong |

### INTEGRATION (→ MCP)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "connect to [service]" | MCP config | strong |
| "integrate with" | MCP config | strong |
| "pull data from" | MCP config | moderate |
| "push to" | MCP config | moderate |
| "OAuth" / "API key" | MCP auth | strong |
| Service names (GitHub, Slack, Jira, etc.) | MCP config | moderate |

### PACKAGING (→ plugin)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "package" | plugin | strong |
| "distribute" | plugin | strong |
| "share with team" | plugin | moderate |
| "marketplace" | plugin | strong |
| "bundle" | plugin | moderate |
| "install across projects" | plugin | moderate |

### CI/CD (→ cicd)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "CI/CD" | cicd config | strong |
| "GitHub Actions" | cicd config | strong |
| "GitLab CI" | cicd config | strong |
| "pipeline" | cicd config | moderate |
| "PR review" (automated) | cicd config | moderate |
| "on every push" | cicd config | strong |

### STYLE (→ output-style)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "respond like" | output style | strong |
| "tone" / "voice" | output style | strong |
| "writing style" | output style | strong |
| "format responses as" | output style | strong |
| "executive briefing style" | output style | strong |

### EXPERTISE (→ bypass)

| Phrase | Implies | Strength |
|--------|---------|----------|
| "hook" (as noun) | bypass → hook | definitive |
| "PreToolUse" / "PostToolUse" | bypass → hook (event known) | definitive |
| "SKILL.md" / "frontmatter" | bypass → skill | definitive |
| "subagent" / "agent" (as noun) | bypass → subagent | definitive |
| "MCP server" / "MCP config" | bypass → MCP | definitive |
| "plugin.json" / "manifest" | bypass → plugin | definitive |
| "settings.json" | bypass → settings | definitive |
| "permission rule" | bypass → permissions | definitive |

---

## Compound Pattern Definitions

### ENFORCE
**Signal combination:** knowledge ("standards", "conventions") + automation ("enforce", "every time") + gate behavior
**Produces:** skill (reference with the knowledge) + hook (PostToolUse enforcement)
**Generation order:** skill first (the knowledge), then hook (uses the knowledge)
**Examples:**
- "Enforce our team's coding standards on every edit"
- "Make sure all code follows our style guide"

### REVIEW-GATE
**Signal combination:** temporal→before + gate/block + review/check
**Produces:** hook (PreToolUse gate on Bash) + skill (review logic)
**Generation order:** skill first (review logic), then hook (invokes it)
**Examples:**
- "Review staged changes before committing and block if issues found"
- "Check code quality before every push and fail if below threshold"

### KNOW-AND-ACT
**Signal combination:** knowledge reference + temporal→recurring
**Produces:** skill (reference) + hook (PostToolUse, uses the skill)
**Generation order:** skill first, then hook
**Examples:**
- "Claude should know our API patterns and enforce them on every edit"
- "Teach Claude our naming conventions and check them automatically"

### CONNECT-AND-USE
**Signal combination:** integration + temporal or autonomy
**Produces:** MCP config + hook or skill (workflow using the integration)
**Generation order:** MCP first (establishes connection), then hook/skill
**Examples:**
- "Connect to Jira and create tickets when Claude finds TODOs"
- "Integrate with Slack and notify the team after every deployment"

### FULL-PIPELINE
**Signal combination:** CI/CD + temporal→before + permission
**Produces:** cicd config + hook (pre-commit gate) + settings (permissions)
**Generation order:** cicd first, then hook, then settings
**Examples:**
- "Set up a full CI pipeline with PR review and production protection"
- "GitHub Actions for auto-review plus block force pushes to main"

---

## Disambiguation Question Decision Tree

| Competing Branches | Question | Answer Mapping |
|-------------------|----------|----------------|
| hook vs skill | Q1 (automatic vs on-demand) | auto→hook, demand→skill |
| hook vs skill (enforcement) | Q2 (enforce vs knowledge) | enforce→hook, knowledge→skill |
| anything vs MCP | Q3 (external vs internal) | external→MCP, internal→other |
| type resolved, scope unknown | Q4 (scope) | this project→project, all→user, team→plugin |
| permission vs hook gate | Q5 (stop vs check) | stop→permission, check→hook |

---

## 20 Worked Examples

### Clear Classifications (HIGH confidence)

**Example 1:** "I want Claude to automatically format my code after every edit"
- Expert bypass: no (no CC vocabulary)
- Tree walk: automatic → after action → specific tool ("edit") → Write|Edit
- Signals: temporal→"after every edit" (PostToolUse, strong) + autonomy→"automatically" (hook, strong)
- Confidence: HIGH
- Resolution: PostToolUse Hook, matcher: Write|Edit, gate: false
- Plain English: "I'll create something that auto-formats your code after every file edit."

**Example 2:** "I want a deploy command"
- Tree walk: on-demand → specific action → "deploy"
- Signals: autonomy-demand→"command" (skill, strong)
- Confidence: HIGH
- Resolution: Skill (user-invocable: true)
- Plain English: "I'll create a command you can run to deploy."

**Example 3:** "Claude should know our API conventions"
- Tree walk: knowledge → project-specific context
- Signals: autonomy-know→"should know" (reference skill, strong) + "conventions" (reference, moderate)
- Confidence: HIGH
- Resolution: Skill (reference, user-invocable: false)
- Plain English: "I'll create project knowledge about your API conventions that Claude loads automatically."

**Example 4:** "Block Claude from pushing to main"
- Tree walk: restrict/allow → block specific tool
- Block disambiguation: "block [Claude] from [verb]ing" → permission
- Signals: permission→"block Claude from" (deny rule, strong)
- Confidence: HIGH
- Resolution: Permission deny rule, Bash(git push*)
- Plain English: "I'll add a rule that prevents Claude from pushing to main."

**Example 5:** "Connect Claude to our Postgres database"
- Tree walk: connect → external service
- Signals: integration→"connect to" (MCP, strong) + "Postgres" (service name, moderate)
- Confidence: HIGH
- Resolution: MCP configuration (stdio transport, database)
- Plain English: "I'll set up a database connection so Claude can query your Postgres."

**Example 6:** "Set up GitHub Actions to review PRs with Claude"
- Tree walk: automate CI/CD → GitHub Actions
- Signals: CI/CD→"GitHub Actions" (cicd, strong) + "PR review" (cicd, moderate)
- Confidence: HIGH
- Resolution: CI/CD configuration (GitHub Actions, PR trigger)
- Plain English: "I'll create a GitHub Actions workflow that reviews PRs using Claude."

**Example 7:** "I want Claude to respond like an executive consultant"
- Tree walk: change output style
- Signals: style→"respond like" (output-style, strong)
- Confidence: HIGH
- Resolution: Output Style
- Plain English: "I'll create a response style that makes Claude communicate like an executive consultant."

**Example 8:** "I need a specialist agent that handles database migrations"
- Expert bypass: user said "agent" → definitive
- Signals: expertise→"agent" (bypass, definitive) + delegation→"specialist" (agent, strong)
- Confidence: HIGH (expert bypass)
- Resolution: Subagent
- Plain English: "I'll create a specialist agent for database migrations."

**Example 9:** "Package our team's hooks and skills into something installable"
- Tree walk: distribute/share → plugin
- Signals: packaging→"package" (plugin, strong) + "installable" (plugin, moderate)
- Confidence: HIGH
- Resolution: Plugin
- Plain English: "I'll package your hooks and skills into a distributable plugin."

**Example 10:** "Before every commit, run the tests and block if they fail"
- Tree walk: automatic → before action → specific tool → Bash(git commit)
- Block disambiguation: "block [action]" → gate hook
- Signals: temporal→"before every commit" (PreToolUse, strong) + gate→"block if" (exit 2, strong)
- Confidence: HIGH
- Resolution: PreToolUse Hook, matcher: Bash(git commit*), gate: true
- Plain English: "I'll add a check that runs tests before every commit and blocks if they fail."

### Disambiguation Cases (MEDIUM/LOW confidence)

**Example 11:** "I want Claude to help with code reviews"
- Tree walk: ambiguous — automatic review hook? on-demand review skill? reference knowledge?
- Signals: weak autonomy (no temporal, no explicit demand)
- Confidence: MEDIUM
- Ask Q1: "Should this happen automatically every time, or only when you ask?"
  - "Automatically" → PostToolUse hook on Write|Edit
  - "When I ask" → Skill (user-invocable)
  - "Both" → compound (skill + hook)

**Example 12:** "Make Claude better at testing"
- Tree walk: ambiguous — knowledge? auto-test hook? test command?
- Signals: autonomy-know→"better at" (weak), could be any of 3 branches
- Confidence: LOW
- Ask Q1: "Should this happen automatically every time, or only when you ask?"
  - "Automatically" → PostToolUse hook on Write|Edit (run tests after edits)
  - "When I ask" → Skill (user-invocable /test command)
- If neither clear, ask Q2: "Should this give Claude knowledge about testing, or actually run tests?"
  - "Knowledge" → reference skill
  - "Run tests" → hook or skill per Q1 answer

**Example 13:** "I want to control what Claude can do in this project"
- Tree walk: restrict/allow — but could be permission restrict, settings, or behavioral guidance
- Signals: permission→"control what Claude can do" (moderate)
- Confidence: MEDIUM
- Ask Q5: "Should this STOP Claude from doing something, or ADD a check on specific actions?"
  - "Stop entirely" → permission/settings rules
  - "Check/gate" → hook gate pattern

### Compound Cases

**Example 14:** "Enforce our team's coding standards on every edit"
- Tree walk: COMPOUND — knowledge ("standards") + automatic ("every edit") + enforce
- Pattern match: ENFORCE
- Signals: autonomy-know→"standards" (skill) + temporal→"every edit" (PostToolUse) + autonomy-auto→"enforce" (hook)
- Resolution: skill (reference, coding standards) + hook (PostToolUse enforcement)
- Plain English: "I'll create two things: project knowledge about your coding standards, and an automatic check that enforces them after every edit."

**Example 15:** "Review staged changes before committing and block if issues found"
- Tree walk: COMPOUND — before action + gate/block + review logic
- Pattern match: REVIEW-GATE
- Signals: temporal→"before committing" (PreToolUse) + gate→"block if" (exit 2) + action→"review" (skill)
- Resolution: hook (PreToolUse gate on Bash) + skill (review logic)
- Plain English: "I'll create a review process and a pre-commit check that blocks if issues are found."

**Example 16:** "Connect to Jira and create tickets when Claude finds TODOs"
- Tree walk: COMPOUND — integration + temporal
- Pattern match: CONNECT-AND-USE
- Signals: integration→"connect to Jira" (MCP) + temporal→"when Claude finds" (PostToolUse)
- Resolution: MCP config + hook (PostToolUse, TODO detection → Jira)
- Plain English: "I'll connect Claude to Jira and add an automatic check that creates tickets for TODOs."

**Example 17:** "Set up full quality — lint, format, type-check, block bad commits"
- Tree walk: COMPOUND — multiple automatic hooks + gate
- Signals: temporal→"after" (implicit, multiple PostToolUse) + gate→"block bad commits" (PreToolUse, exit 2)
- Resolution: 3 hooks (PostToolUse lint, PostToolUse format, PreToolUse gate on commit)
- Plain English: "I'll set up automatic linting, formatting, and type-checking after edits, plus a pre-commit gate that blocks bad code."

### Edge Cases

**Example 18:** "Hook" (single word)
- Expert bypass: user said "hook" → definitive type = hook
- BUT: no event/purpose context
- Resolution: type=hook confirmed, but need more context for event
- Action: "You want a hook — what should it do? Should it check something before Claude acts, or react after?"

**Example 19:** "Make Claude not suck at my project"
- Tree walk: vague. No clear signals. Weak autonomy-know.
- Confidence: LOW
- Ask Q1: "Should this happen automatically every time, or only when you ask?"
- Ask Q2 (if needed): "Should this give Claude knowledge about your project, or check/enforce something?"
- Default: skill (reference) with project knowledge

**Example 20:** "I want to build a React component"
- Tree walk: NOT about Claude Code extensions
- Signals: none from any extension category
- Resolution: null — out of scope
- Action: don't classify, respond normally to the coding request
