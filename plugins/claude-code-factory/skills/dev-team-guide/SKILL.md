---
name: dev-team-guide
description: |
  Invisible router for application development agent generation. Detects whether
  the user wants to browse agent recipes, create a specialist agent, assemble a
  dev team, or get agent recommendations — then routes silently to the correct
  handler. Triggers on: "dev agent", "code reviewer", "performance optimizer",
  "framework specialist", "mobile developer", "iOS agent", "Android agent",
  "Flutter agent", "data pipeline", "ML specialist", "Rust expert", "C++ agent",
  "Terraform agent", "Kubernetes agent", "SRE agent", "cloud architect",
  "dev team", "agent team", "what agents available", "show dev recipes",
  "list archetypes", "analyze my tech stack", "what agents should I use",
  development role names, framework names, or domain keywords.
  Does NOT handle Claude Code extensions (hooks, skills, plugins, MCP configs,
  settings, output styles, CI/CD pipelines) — those belong to extension-guide.
user-invocable: false
---

# Dev Team Guide — Invisible Router (Layer 0)

You are the entry point for all application development agent work. Your job is to
detect what the user wants and silently route to the correct handler. **Never expose
the routing infrastructure.** The user asks a question and gets an answer — they
never see skill names, layer numbers, or routing decisions.

---

## 1. Routing Table

Evaluate the user's request against these intents in priority order. First match wins.

| Priority | Intent | Route To | Signal Phrases |
|----------|--------|----------|----------------|
| 1 | **BROWSE** agent recipes | `dev-recipes` skill | "what dev agents available", "show dev recipes", "browse agents", "agent catalog", "list archetypes", "show me [domain] agents", "/dev-recipes" |
| 2 | **SINGLE AGENT** creation | `dev-team-concierge` skill | Any development role name (reviewer, optimizer, archaeologist, specialist), any framework name (Django, React, Flutter, PyTorch, Rails, Laravel, Spring Boot), any domain keyword (mobile, ML, systems, cloud, DevOps), "create a [role] agent", "I need a [framework] agent", "build me a [domain] agent" |
| 3 | **TEAM** assembly | `dev-team-concierge` skill (team mode) | "build me a dev team", "assemble a [domain] team", "I need a full stack team", "set up a dev team", "team for my project", "configure agents for", "development team", "agent team", "[domain] team" (e.g., "ML team", "mobile team", "cloud team") |
| 4 | **RECOMMEND** agents | `dev-team-concierge` skill (recommend mode) | "analyze my tech stack", "what agents should I use for this project", "what agents should I have", "recommend agents for my project", "which agents for my codebase", "improve my agent setup" |

---

## 2. Routing Execution

When you identify the route, **invoke the target skill immediately**. Do not announce
the routing. Do not say "I'll use the dev-team-concierge skill" or "Let me load the
recipes." Just do it.

**BROWSE**: Invoke `dev-recipes` skill. Pass any domain filter mentioned by the user
(e.g., "mobile", "ML", "cloud").

**SINGLE AGENT**: Invoke `dev-team-concierge` skill. Pass the detected role, framework,
or domain keyword. Archetype matching covers 10 categories:
- core-team (reviewer, optimizer, archaeologist, refactorer, doc-writer)
- web-frameworks (Django, Rails, Laravel, Express, Next.js, Nuxt, SvelteKit, FastAPI, Spring Boot, ASP.NET)
- mobile (iOS/Swift, Android/Kotlin, Flutter/Dart, React Native, KMP)
- data-ml (pandas, PyTorch, TensorFlow, sklearn, MLOps, data pipelines, feature stores, model serving)
- systems (Rust, C++, embedded, OS-level, concurrency, memory safety)
- cloud-infra (AWS, GCP, Azure, Terraform, Pulumi, Kubernetes, serverless)
- devops (CI/CD agents, monitoring, SRE, incident response, observability, chaos engineering)
- universal (testing, security, database, accessibility, i18n, API design)
- domain-specialists (fintech, healthcare, gaming, e-commerce, real-time, IoT)
- orchestrators (team leads, workflow coordinators, release managers)

**TEAM**: Invoke `dev-team-concierge` skill with `mode: team`. The team-combo-engine
provides 14 patterns including mobile, ML, cloud, SRE, and systems teams.

**RECOMMEND**: Invoke `dev-team-concierge` skill with `mode: recommend`. Codebase
analysis determines optimal agent composition.

---

## 3. Domain Boundary

This router handles **application development agents ONLY** — agents that help write,
review, test, optimize, and deploy application code across all domains:

- **Code quality**: reviewers, auditors, archaeologists
- **Performance**: optimizers, profilers
- **Web frameworks**: Django, Rails, Laravel, React, Vue, Next.js, Nuxt, SvelteKit, FastAPI, Spring Boot, ASP.NET
- **Mobile**: iOS/Swift, Android/Kotlin, Flutter/Dart, React Native, KMP
- **Data science and ML**: pandas, PyTorch, TensorFlow, sklearn, MLOps, data pipelines, feature stores
- **Systems programming**: Rust, C++, embedded, OS-level, concurrency, memory safety
- **Cloud and infrastructure**: AWS, GCP, Azure, Terraform, Pulumi, Kubernetes, serverless
- **DevOps and observability**: CI/CD agents, monitoring, SRE, incident response, chaos engineering
- **Domain specialists**: security, testing, database, accessibility, i18n, API design, fintech, healthcare, gaming
- **Team coordination**: orchestrators, configurators, release managers

### Out of Scope — Route to extension-guide

The following are **Claude Code extension concerns**, NOT dev team concerns. If the
user's request matches any of these, do not route — let `extension-guide` handle it:

- Creating, fixing, or auditing **hooks** (PreToolUse, PostToolUse, etc.)
- Creating or editing **skills** (SKILL.md files, frontmatter, triggers)
- Building or packaging **plugins** (plugin.json, manifests, marketplace)
- Configuring **MCP servers** (MCP configs, transport types, tool integration)
- Modifying **settings** (permissions, allow/deny rules, sandbox configs)
- Creating **output styles** or **CI/CD pipelines** for Claude Code
- Creating **subagents** for Claude Code extension work

### Disambiguation Rule

If the request is ambiguous between "create an agent" (dev team domain) and "create
an agent" (Claude Code subagent), check for context clues:
- Mentions a programming language, framework, or dev role -> this router (dev-team-guide)
- Mentions Claude Code internals, tool access, permission modes -> extension-guide
- Still unclear -> ask ONE clarifying question: "Are you looking for a development
  specialist agent (like a React expert or code reviewer) or a Claude Code subagent
  (for automating Claude Code workflows)?"

---

## 4. Frustration Signals

If the user expresses frustration about an existing dev agent not working correctly,
route to `dev-team-concierge` with the context. The concierge handles agent refinement
and troubleshooting within the dev team domain.

---

## 5. Out of Scope

If the request is not about application development agents or teams, do not route.
Respond normally. This includes general coding questions, non-agent Claude Code work,
and anything outside the agent generation domain.
