# Command Recipes (Skill-Based)

8 recipes for on-demand actions invoked with `/command-name`.

---

### C01: deploy
**Name**: Deploy with pre-flight checks
**Triggers**: "deploy command", "deployment pipeline", "push to staging", "deploy to production"
**Type**: Skill (user-invocable, disable-model-invocation) | **Generator**: skill-factory
**Pre-resolved**: name: deploy, user-invocable: true, disable-model-invocation: true, allowed-tools: Read/Bash/Glob/Grep, argument-hint: "[staging|production]", context: fork
**Customize**: test/lint/build/deploy commands, health check URL, environments
**Verify**: Run `/deploy staging` and confirm pre-flight checks execute

---

### C02: changelog
**Name**: Generate changelog from commits
**Triggers**: "changelog", "release notes", "what changed", "generate changelog"
**Type**: Skill (user-invocable) | **Generator**: skill-factory
**Pre-resolved**: name: changelog, user-invocable: true, disable-model-invocation: true, allowed-tools: Read/Bash/Glob/Grep, argument-hint: "[since-tag-or-date]"
**Customize**: changelog format (keep-a-changelog, conventional), grouping categories
**Verify**: Run `/changelog v1.0.0` and confirm commit summary appears

---

### C03: pr-summary
**Name**: Summarize a pull request
**Triggers**: "summarize PR", "PR summary", "review this PR", "what's in this PR"
**Type**: Skill (user-invocable, context: fork) | **Generator**: skill-factory
**Pre-resolved**: name: pr-summary, user-invocable: true, context: fork, agent: Explore, allowed-tools: Bash(gh *)
**Customize**: review depth, focus areas (security, performance, style)
**Verify**: Run `/pr-summary` on an open PR and confirm summary appears

---

### C04: fix-issue
**Name**: Fix a GitHub issue by number
**Triggers**: "fix issue", "work on issue", "close issue", "fix bug #"
**Type**: Skill (user-invocable) | **Generator**: skill-factory
**Pre-resolved**: name: fix-issue, user-invocable: true, disable-model-invocation: true, allowed-tools: Read/Write/Edit/Bash/Glob/Grep, argument-hint: "[issue-number]"
**Customize**: issue tracker (GitHub, Linear, Jira), branch naming, auto-PR creation
**Verify**: Run `/fix-issue 42` and confirm it reads the issue and starts work

---

### C05: scaffold
**Name**: Scaffold a new component/module
**Triggers**: "scaffold", "create component", "new module", "boilerplate", "starter template"
**Type**: Skill (user-invocable) | **Generator**: skill-factory
**Pre-resolved**: name: scaffold, user-invocable: true, disable-model-invocation: true, allowed-tools: Read/Write/Bash/Glob/Grep, argument-hint: "[component-type] [name]"
**Customize**: component templates, file structure conventions, framework-specific patterns
**Verify**: Run `/scaffold component UserProfile` and confirm files are created

---

### C06: db-migrate
**Name**: Run database migrations safely
**Triggers**: "database migration", "run migrations", "migrate database", "schema change"
**Type**: Skill (user-invocable, disable-model-invocation) | **Generator**: skill-factory
**Pre-resolved**: name: db-migrate, user-invocable: true, disable-model-invocation: true, allowed-tools: Bash/Read, argument-hint: "[up|down|status]"
**Customize**: migration tool (prisma, knex, alembic, goose), safety checks, backup commands
**Verify**: Run `/db-migrate status` and confirm migration status appears

---

### C07: dependency-audit
**Name**: Audit project dependencies
**Triggers**: "audit dependencies", "outdated packages", "security audit", "npm audit", "check vulnerabilities"
**Type**: Skill (user-invocable, context: fork) | **Generator**: skill-factory
**Pre-resolved**: name: dependency-audit, user-invocable: true, context: fork, agent: Explore, allowed-tools: Bash/Read/Glob/Grep
**Customize**: package manager (npm, pip, cargo), severity threshold, auto-update behavior
**Verify**: Run `/dependency-audit` and confirm vulnerability report appears

---

### C08: commit-with-convention
**Name**: Commit with conventional commit messages
**Triggers**: "conventional commit", "good commit message", "commit properly", "structured commit"
**Type**: Skill (user-invocable) | **Generator**: skill-factory
**Pre-resolved**: name: commit, user-invocable: true, disable-model-invocation: true, allowed-tools: Bash/Read/Glob/Grep
**Customize**: commit types (feat/fix/docs/chore), scope conventions, breaking change format
**Verify**: Stage changes and run `/commit` — confirm structured message is generated
