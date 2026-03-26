# Getting Started with Claude Code Factory

A plain-English guide for first-time users. No prior plugin experience required.

---

## What Is This?

Claude Code Factory is a plugin for Claude Code (the AI coding assistant you use in your terminal). It teaches Claude two new superpowers:

1. **Extension Factory** — Claude can build its own tools
   - Skills (new capabilities), hooks (automated actions), plugins, MCP server connections, settings configurations, CI/CD pipelines

2. **Dev Team Factory** — Claude can create specialist developer agents
   - 72 types of developer agents across 10 domains
   - Pre-built teams that work together on your codebase

Think of it like this: **Extension Factory** customizes Claude's toolbox. **Dev Team Factory** gives Claude expert teammates.

---

## Prerequisites

- Claude Code installed and working (`claude` command runs in your terminal)
- That's it. No npm, no Python, no dependencies.

---

## Install in 30 Seconds

```bash
# Clone the repo (or download it)
git clone https://github.com/UsernameTron/claude-code-factory.git

# Tell Claude Code about it
claude plugin add /path/to/claude-code-factory

# Start Claude Code
claude
```

You now have both factories. No setup, no config files.

### Verify It Worked

Inside Claude Code, type:

```
> What skills are available?
```

You should see skills from both the Extension Factory (like `hook-factory`, `skill-factory`) and the Dev Team Factory (like `dev-recipes`, `team-configurator`).

---

## Your First 5 Minutes

### Try the Extension Factory

Open Claude Code in any project and type:

```
> I need a hook that runs prettier after I save files
```

Claude will:
1. Understand you want a hook (an automated action)
2. Ask a few clarifying questions
3. Generate a complete hook configuration
4. Offer to install it

**Other things to try:**

```
> Create a skill that validates JSON schemas
> Set up permissions to block dangerous bash commands
> Connect to my PostgreSQL database via MCP
> /recipes                    <- browse 40 pre-built extensions
> /recipes automation         <- see automation-specific recipes
```

### Try the Dev Team Factory

Open Claude Code in an existing project and type:

```
> /team-configurator
```

Claude will:
1. Scan your project files (package.json, requirements.txt, Cargo.toml, etc.)
2. Detect your tech stack
3. Recommend specialist agents for your project
4. Offer to generate them

**Other things to try:**

```
> I need a Django API specialist
> Set up a dev team for my project
> /dev-recipes                <- browse 86 agent recipes
> /dev-recipes mobile         <- see mobile-specific agents
> /dev-recipes TQ10           <- see the ML Pipeline Team pattern
```

---

## Using It With an Existing Codebase

This is where the plugin really shines. Navigate to any existing project:

```bash
cd ~/my-existing-project
claude
```

### Step 1: Auto-Detect Your Stack

```
> /team-configurator --detect-only
```

This scans 25+ config file types and tells you what it found:

- Languages and frameworks
- Mobile platforms (iOS, Android, Flutter)
- Data/ML libraries (PyTorch, sklearn, pandas)
- Cloud providers (AWS, GCP)
- Infrastructure tools (Terraform, Kubernetes)
- CI/CD pipelines (GitHub Actions, GitLab CI)
- Testing frameworks and monitoring tools

### Step 2: Get Agent Recommendations

```
> What agents should I have for this project?
```

Claude analyzes your codebase and recommends agents based on:

- **Your tech stack** (detected automatically)
- **Project size** (small projects get 2-3 agents, large ones get 5-8)
- **What you're working on** (API work? mobile? ML pipeline?)

### Step 3: Generate Agents For Your Stack

```
> Set up a dev team for this project
```

Claude creates agent files customized to YOUR codebase — not generic templates. A Django project gets Django-specific conventions. A Rust project gets ownership/borrowing patterns. A Kubernetes project gets pod security standards.

### Step 4: Add Extensions Too

While you're at it, set up some Claude Code extensions:

```
> I need a hook that lints my code before every commit
> Create a skill for our team's coding standards
> /recipes security           <- see security-focused extensions
```

---

## Using It For a New Project

Starting fresh? The factory helps from day one:

```bash
mkdir my-new-project && cd my-new-project
git init
claude
```

```
> I'm building a React + FastAPI app with PostgreSQL.
> Set up a dev team for this stack.
```

Claude generates agents pre-configured for your chosen stack, even before you write any code.

---

## Browsing What's Available

### Extension Recipes (40 pre-built)

```
> /recipes                    <- see all 6 categories
> /recipes automation         <- format-on-save, lint gates, command blockers
> /recipes commands           <- custom slash commands
> /recipes knowledge          <- reference skills, domain expertise
> /recipes specialists        <- code reviewer, test runner, debugger
> /recipes connections        <- MCP database, API integrations
> /recipes security           <- permission lockdown, secret protection
```

### Dev Team Recipes (86 pre-built)

```
> /dev-recipes                <- see all 11 categories
> /dev-recipes core-team      <- code reviewer, performance optimizer
> /dev-recipes web-frameworks <- Django, Rails, Laravel, React, Vue
> /dev-recipes mobile         <- iOS, Android, Flutter, React Native
> /dev-recipes data-ml        <- PyTorch, sklearn, MLOps, pipelines
> /dev-recipes systems        <- Rust, C++, embedded, concurrency
> /dev-recipes cloud-infra    <- AWS, GCP, Terraform, Kubernetes
> /dev-recipes devops         <- CI/CD, monitoring, SRE, logging
> /dev-recipes domain-specialists <- security, testing, DB, accessibility
> /dev-recipes teams          <- 14 pre-built team configurations
```

### Team Patterns (14 coordinated teams)

These are pre-designed groups of agents that work together:

| Pattern | What It Is | Try It |
|---------|-----------|--------|
| TQ01 | Full-Stack Web Team | `> /dev-recipes TQ01` |
| TQ02 | Review Pipeline | `> /dev-recipes TQ02` |
| TQ05 | Legacy Modernization | `> /dev-recipes TQ05` |
| TQ09 | Mobile App Team | `> /dev-recipes TQ09` |
| TQ10 | ML Pipeline Team | `> /dev-recipes TQ10` |
| TQ11 | Cloud Migration Team | `> /dev-recipes TQ11` |
| TQ12 | SRE/Reliability Team | `> /dev-recipes TQ12` |
| TQ13 | Systems Development Team | `> /dev-recipes TQ13` |
| TQ14 | Full Platform Team | `> /dev-recipes TQ14` |

---

## The 10 Development Domains

| Domain | Agents | What They Do |
|--------|--------|-------------|
| Core Team | 4 | Code review, performance optimization, codebase archaeology, documentation |
| Web Frameworks | 13 | Django, Rails, Laravel, React, Vue, Next.js, Nuxt specialists |
| Mobile | 6 | iOS, Android, Flutter, React Native, mobile testing, mobile CI/CD |
| Data & ML | 8 | Data pipelines, PyTorch, sklearn, MLOps, Jupyter, visualization |
| Systems | 6 | Rust, C++, embedded systems, OS-level, memory safety, concurrency |
| Cloud & Infra | 7 | AWS, GCP, Terraform, Kubernetes, serverless, cost optimization |
| DevOps | 6 | CI/CD, monitoring, SRE, incident response, logging, containers |
| Universal | 4 | Language-agnostic backend, frontend, API, DevOps generalists |
| Domain Specialists | 16 | Security, testing, database, accessibility, i18n, caching, and more |
| Orchestrators | 2 | Tech lead coordination, automatic team configuration |

---

## Key Concepts (Jargon-Free)

| Term | What It Actually Means |
|------|----------------------|
| **Plugin** | A folder of files that teaches Claude new abilities. You install it once. |
| **Skill** | A specific capability Claude gains. Like "generate hooks" or "browse recipes." |
| **Agent** | A specialist version of Claude focused on one job. Like "Django API expert." |
| **Hook** | An automated action that runs before or after Claude does something. Like "lint after every file save." |
| **MCP Server** | A connection to an external tool (database, API, service). |
| **Recipe** | A pre-built template you can use as-is or customize. |
| **Team Pattern** | A group of agents designed to work together on a specific type of project. |

---

## How It Works (Simple Version)

You type what you need in plain English. Behind the scenes:

1. **Router** detects your intent (extension? agent? team? browse?)
2. **Orchestrator** figures out the details (which type? what tools? what model?)
3. **Generator** creates the files (customized to your project)
4. **Validator** checks the output (correct format? good quality?)

You don't need to know any of this. Just ask for what you want.

---

## Common Questions

**Q: Do I need to use both factories?**
No. You get both automatically with one install. Use whichever you need. They don't interfere with each other.

**Q: Will this modify my source code?**
No. The Extension Factory generates configuration files. The Dev Team Factory generates agent Markdown files. Neither touches your application code.

**Q: Where do generated agents go?**
By default, to your project's `.claude/agents/` directory (project-specific). You can also install them globally at `~/.claude/agents/` (available in all projects).

**Q: Can I customize generated agents?**
Yes. They're plain Markdown files. Open them in any editor and tweak the system prompt, tools, or model.

**Q: How do I remove an agent I don't want?**
Delete the `.md` file from `.claude/agents/` or `~/.claude/agents/`.

**Q: Does this work with any programming language?**
Yes. The 72 agent archetypes cover Python, JavaScript/TypeScript, Ruby, PHP, Go, Rust, C/C++, Java, Kotlin, Swift, Dart, and more. The stack detector scans 25+ config file types.

**Q: What if my project uses a framework not listed?**
The "Universal Experts" category includes language-agnostic agents (backend, frontend, API, DevOps) that work with any stack. You can also request a custom agent.

**Q: Is there a cost to using this?**
The plugin itself is free and open source. It uses your existing Claude Code subscription — no additional API costs beyond normal Claude usage.

---

## Next Steps

- Browse the full [README](../README.md) for architecture details and component lists
- Try `/recipes` and `/dev-recipes` to explore what's available
- Run `/team-configurator` on your main project to see what agents it recommends
