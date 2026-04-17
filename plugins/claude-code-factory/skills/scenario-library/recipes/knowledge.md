# Knowledge Recipes (Reference Skill-Based)

5 recipes for persistent knowledge Claude applies automatically.

---

### K01: coding-standards
**Name**: Team coding standards
**Triggers**: "coding standards", "style guide", "code conventions", "our standards", "team rules"
**Type**: Reference Skill (user-invocable: false) | **Generator**: skill-factory
**Pre-resolved**: name: coding-standards, user-invocable: false, scope: .claude/skills/ (project, shared)
**Customize**: language-specific rules, naming conventions, formatting preferences, architectural patterns
**Verify**: Ask Claude to write code and confirm it follows the documented standards

---

### K02: api-conventions
**Name**: API design conventions
**Triggers**: "API conventions", "REST patterns", "endpoint standards", "API style guide"
**Type**: Reference Skill (user-invocable: false) | **Generator**: skill-factory
**Pre-resolved**: name: api-conventions, user-invocable: false, scope: .claude/skills/ (project, shared)
**Customize**: REST vs GraphQL patterns, naming schemes, error response format, versioning strategy
**Verify**: Ask Claude to create an endpoint and confirm it follows conventions

---

### K03: architecture-context
**Name**: Project architecture context
**Triggers**: "project architecture", "how our system works", "codebase context", "system design docs"
**Type**: Reference Skill (user-invocable: false) | **Generator**: skill-factory
**Pre-resolved**: name: architecture-context, user-invocable: false, scope: .claude/skills/ (project, shared)
**Customize**: system components, data flow, deployment topology, key design decisions
**Verify**: Ask Claude about system architecture and confirm it references documented context

---

### K04: domain-knowledge
**Name**: Business domain knowledge
**Triggers**: "domain knowledge", "business rules", "industry terms", "domain context"
**Type**: Reference Skill (user-invocable: false) | **Generator**: skill-factory
**Pre-resolved**: name: domain-knowledge, user-invocable: false, scope: .claude/skills/ (project, shared)
**Customize**: domain terminology, business rules, regulatory requirements, industry context
**Verify**: Ask Claude about domain concepts and confirm accurate terminology

---

### K05: testing-patterns
**Name**: Project testing patterns and conventions
**Triggers**: "testing patterns", "how we test", "test conventions", "testing standards"
**Type**: Reference Skill (user-invocable: false) | **Generator**: skill-factory
**Pre-resolved**: name: testing-patterns, user-invocable: false, scope: .claude/skills/ (project, shared)
**Customize**: test framework, file naming, mock strategy, coverage requirements, fixture patterns
**Verify**: Ask Claude to write tests and confirm it follows project testing patterns
