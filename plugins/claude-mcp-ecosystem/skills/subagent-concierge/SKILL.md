---
name: subagent-concierge
description: |
  Non-technical entry point for Claude Code subagent setup. Detects when a project
  would benefit from specialist subagents, infers project type from codebase analysis
  (zero-question fast path), auto-resolves all technical decisions, and executes the
  full lifecycle pipeline (architect → scaffolder → memory-seeder → validator) by
  chaining subagents from the main conversation context.

  Presents results in plain English with zero exposure to YAML, frontmatter, scoring
  rubrics, or architecture jargon. Includes template-first fast path for common
  project archetypes and progressive deployment to prevent overwhelm.

  This is a SKILL (not a subagent) because it must chain pipeline subagents in
  sequence. Subagents cannot spawn other subagents — only skills running in the
  main conversation context can invoke subagents.

  REFUSES: Expert-mode architecture design (use architect subagent directly).
  Individual pipeline execution (invoke subagents directly). Domain-specific
  analysis (use project skills). Skill creation (use skill-forge).

  TRIGGERS: "organize my project", "this is getting complicated", "set up agents",
  "help me scale this", "project is too complex", "context keeps filling up",
  "quality is dropping", "structure this project", "I'm new to agents",
  "make this project manageable", "bootstrap this project", "set up specialists",
  "I don't know how subagents work", "agent setup for beginners",
  "vibecoding getting messy", "project getting unwieldy", "too many files"
---

# Subagent Concierge — Zero-to-Specialists for Everyone

## QUICK START

1. Assess the situation: fresh start, growing project, or expansion
2. Look at the project yourself and infer what it is (zero-question fast path)
3. If confident, present your read and deploy on "yes"; otherwise ask only what you actually need (max 3 questions)
4. Auto-resolve all technical decisions with your own judgment
5. Chain pipeline subagents: architect → scaffolder + seeder (parallel) → validator
6. Self-heal any validation findings
7. Present results in plain English with a "what just happened" summary

## WHEN TO USE

Invoke when any of the following are true. The user explicitly says they are new to
agents or don't understand subagents. The user describes project complexity problems
without knowing the solution (context filling up, quality dropping, too many files).
The user asks to "organize," "structure," or "set up" their project. The user has
been vibecoding and the project has grown beyond single-thread comfort. The user asks
for "agents" or "specialists" but doesn't understand the technical details.

This skill is the DEFAULT entry point for anyone who is not an expert agent architect.

## WHEN NOT TO USE

Do not use when the user explicitly requests expert-mode control over architecture
decisions — let them invoke the architect subagent directly. Do not use for domain-specific
operational analysis. Do not use for skill creation. Do not use when the project is simple
enough that specialists would add overhead — tell the user that honestly.

---

## PROCESS

### Step 1: Assess the Situation

Before asking questions, gather what you already know. Read the project directory
structure if one exists. Check for an existing `.claude/agents/` directory.

Classify the user into one of three modes.

**Fresh start** — no project exists yet. The user is describing what they want to build.
Use compressed intake (Step 2b).

**Growing project** — project exists, no agents. Infer the project type yourself (Step 2a).

**Expansion** — agents already exist. Redirect to companion skill for targeted additions,
or invoke the auditor subagent to check ecosystem health first.

Expected output: `{situation_mode}` — fresh_start, growing_project, or expansion.

### Step 2a: Inference (Zero-Question Fast Path)

When a project directory exists, look at it yourself before asking any questions — files,
package manifests, directory structure, README, and git history — and infer with your own
judgment what the project is, what its distinct areas of work are, and which template (if
any) fits. If you are confident in your read, present it and deploy on "yes." If one thing
is genuinely ambiguous, ask that ONE question, then deploy. If you can't form a confident
read at all, fall back to compressed intake (Step 2b).

**Zero-question presentation format:**

```
I looked at your project. It's a [template name] with [N] main areas of work.

I'd set up [N] specialists:
• [Name] — [one sentence, plain English]
• [Name] — [one sentence, plain English]
• [Name] — [one sentence, plain English]

Want me to set this up?
```

One message, one "yes." Two interactions total.

Expected output: `{template_match}`, or fall through to Step 2b.

### Step 2b: Compressed Intake (Fallback)

Used when inference didn't produce a confident read, or when no project directory exists.

**For fresh starts (no project directory):** Ask ONE open-ended question:
"Describe what you're building in one or two sentences — what does it do and who uses it?"
From the answer, match a template. If confident, present and deploy. If ambiguous,
ask one clarifying question. Maximum: two questions for a fresh start.

**For existing projects you couldn't read confidently:** Ask a maximum of THREE questions,
chosen by you for whatever is actually missing — typically what the project does, what
files or data it works with, and where the results end up.

Present all selected questions at once. Non-coders disengage if interrogated sequentially.

Expected output: `{intake_synthesis}` — structured inventory for Step 3.

### Step 3: Auto-Resolve Technical Decisions

Resolve every technical decision yourself with your own judgment — the non-coder never
chooses a model, a tool profile, or a memory scope. Recommend only as many specialists
as the project's distinct concerns warrant; if it's simple, say specialists would add
overhead. Consult `frontmatter-reference` for legal field values and defaults,
`agent-design-patterns` for archetypes, and `mcp-catalog` for available servers. Add
MCP servers only for services the user actually mentioned — never speculatively. Each
agent's system prompt should include a role statement, its processing steps, memory
read/write instructions, and a return spec. Agents with no data dependency between
them can be grouped to run in parallel.

Expected output: `{auto_spec}` — complete architecture specification for the pipeline.

### Step 4: Execute the Pipeline

Chain pipeline subagents from the main conversation context. Each subagent runs in
its own isolated context window, does its work, and returns results. The concierge
passes relevant context from one to the next.

**Phase A — Design (if needed).** Invoke the `architect` subagent with the auto_spec.
For template matches, skip this phase — the template IS the spec. For custom designs,
the architect produces the full specification.

**Phase B — Scaffold + Scan (parallel).** Invoke the `scaffolder` subagent (runs as
background task with `permissionMode: acceptEdits`). Simultaneously, begin the seeder's
project scan phase. The scaffolder creates .md files in `.claude/agents/`, writes routing
configuration, configures MCP servers in settings.json, and creates memory directories.

**Phase C — Seed memory.** After the scaffolder completes, invoke the `memory-seeder`
subagent to write MEMORY.md files. It uses knowledge sources identified during the
parallel scan: README files, configuration files, documentation, code comments. Each
MEMORY.md stays under 100 lines (reserving half of the 200-line limit for organic growth).

**Phase D — Validate.** Invoke the `validator` subagent with `isolation: worktree`.
It runs in a temporary isolated copy of the repository, checking structural correctness:
valid frontmatter, parseable system prompts, referenced tools exist, referenced skills
exist, referenced MCPs configured. The worktree is automatically discarded.

**Phase E — Self-heal.** If validation finds issues, fix them in the main thread.
Common fixes: remove nonexistent skill references, remove unconfigured MCP references,
adjust tool lists. Only surface issues requiring user input.

After each phase, record results and auto-resolved issues.

Expected output: `{pipeline_results}` — files created, issues resolved, user attention items.

### Step 5: Present Results

Translate everything into language a non-coder understands. Follow the Phase 5 output
format from the improvement plan:

```
Set up [N] specialists for your project:

**[Name]** — [one sentence, plain English]
**[Name]** — [one sentence, plain English]
**[Name]** — [one sentence, plain English]

Just keep building normally. The right specialist picks up each task automatically.
You can type /agents anytime to see your specialists.
```

Do NOT include: YAML frontmatter, scoring rubrics, viability matrices, validation
reports, technical file paths, tool profiles, memory scopes, or architecture jargon.

### Step 6: Offer Next Steps

Offer exactly two options:

"Want me to show you how one of these specialists handles a real task from your project?"

"Or just keep building — the specialists activate automatically."

If the user picks the demo, execute Demo Mode (see below).

---

## DEMO MODE

### When It Activates

Path A: User asks ("show me how this works," "what do specialists actually do").
Path B: Concierge offers after setup and user accepts.

### The Sequence

**Pick the most impactful specialist.** Choose the one whose domain the user will feel
most — judge from what you observed in the project.

**Pick a small, visible task.** Must produce a visible result in under 30 seconds.
Must be ADDITIVE (create a new file), never modification of existing code. Choose a
task that fits the specialist's domain.

**Run with maxTurns: 10.** Prevents runaway behavior. If the specialist hits the limit,
catch it: "The demo hit a limit — but you get the idea."

**Show the result, then the contrast:**

```
Done. Your frontend specialist just built that footer.

Here's what happened behind the scenes:
- It read your existing components to match your style
- It created the footer using your naming conventions
- It remembered your Tailwind patterns from other components

Next time you ask for UI work, this happens automatically —
no need to explain your conventions every time.
```

**Synthetic fallback.** If the project is empty, create a minimal demo project (3 files
across 2 domains), run the demo, then offer: "This was a sample project. Want me to set
up specialists for your real project, or are you just exploring?"

After the demo, stop explaining. Say: "That's how it works. Keep building — the
specialists handle things automatically." Let the user experience value organically.

---

## TEMPLATES

Templates are externalized in the plugin's `subagent-lifecycle/templates/` directory
as YAML files. Read the appropriate template file at runtime based on your inference.
Each template specifies: agent roster, tool profiles, memory scopes, MCP mappings,
routing rules, and parallel groups.

Six templates available: web-app, data-dashboard, api-backend, content-site,
automation-pipeline, mobile-app.

When a project doesn't fit one template cleanly, use your judgment — pick the closest
fit, or combine agents from more than one template and deduplicate.

---

## PROGRESSIVE DEPLOYMENT

Do not deploy all agents at once for complex projects. Start with the agents covering
the user's stated pain points or most active work areas, and offer the rest after the
first successful use. Later, suggest removing agents that never get used.

---

## ERROR HANDLING

| Condition | Action |
|:----------|:-------|
| Project too simple for specialists | "Your project is simple enough that specialists would add overhead. Keep building in the main thread." |
| Description too vague | Ask ONE follow-up: "Can you describe the most important thing this project does?" |
| Template match ambiguous | Present top 2 matches with one-sentence descriptions. Let user pick. |
| No MCPs configured | Design agents without MCPs. Note capabilities they COULD have. |
| Scaffolding hits file conflicts | Auto-resolve by appending -v2 suffix. Note in summary. |
| Validation finds structural issues | Auto-fix in self-heal phase. Only surface issues needing user input. |
| User wants to undo | Delete `.claude/agents/`, remove agent routing, delete memory dirs. "Specialists removed. Back to single-thread mode." |
| Any unexpected failure | "Something went wrong with [plain description]. Want me to **fix it**, **start over**, or **explain what happened**?" |

---

## EXPERT MODE ESCAPE HATCH

If the user demonstrates expert knowledge of agent architecture:

"Looks like you know your way around agent architecture. Want me to keep handling the
technical decisions, or would you prefer full control? You can invoke the architect
subagent directly for expert mode."

---

## MANIFEST

```yaml
name: subagent-concierge
version: "3.0.0"
created: "2026-03-03"
author: "Pete Connor"
pattern: "context-aware-branching"
forge_gate_scores:
  specificity: 3
  trigger_clarity: 3
  scope_boundary: 3
  differentiation: 3
  total: "12/12"
deployment:
  scope: "user"
  rationale: "Non-coder setup interface applies to any Claude Code project"
chain_position: "Layer 1 — orchestration skill invoked by project-guide"
type: "SKILL (not subagent — must chain pipeline subagents)"
templates: 6
```
