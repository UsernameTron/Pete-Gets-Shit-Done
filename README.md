# Pete Gets Shit Done

# GET SHIT DONE

The complete AI coding system: execution engine + governance framework + extension factory.

Meta-prompting, context engineering, spec-driven development, safety hooks, and session management — for Claude Code, OpenCode, Gemini CLI, Codex, Copilot, and Antigravity.

Technical deep-dive: see [docs/README-technical.md](docs/README-technical.md).

```
npx get-shit-done-cc@latest
```

Works on Mac, Windows, and Linux.



> "If you know clearly what you want, this WILL build it for you. No bs."

> "I've done SpecKit, OpenSpec and Taskmaster — this has produced the best results for me."

> "By far the most powerful addition to my Claude Code. Nothing over-engineered. Literally just gets shit done."

Trusted by engineers at Amazon, Google, Shopify, and Webflow.

[Why I Built This](#why-i-built-this) · [What You Get](#what-you-get) · [Getting Started](#getting-started) · [Commands](#commands) · [Governance Layer](#governance-layer) · [User Guide](docs/USER-GUIDE.md)

---

## Why I Built This

I'm a solo developer. I don't write ALL the code — my Get Shit Done agent helps.

Other spec-driven development tools exist. BMAD. Speckit. The usual lineup. They all contract the same disease: they recreate the organizational dysfunction of a 50-person engineering team and sell it as a feature. Sprint ceremonies, story points, stakeholder syncs, retrospectives, Jira workflows — the full cargo cult, miniaturized for your terminal. The rest just lack any real understanding of what you're actually building.

I'm not a software company. I'm a creative person trying to build things that work.

So I built GSD. The complexity lives inside the system, not in your workflow. Behind the curtain: context engineering, XML prompt formatting, subagent orchestration, state management. What you touch: a few commands that produce working software.

The system gives Claude everything it needs to do the work and verify the work was done correctly. I trust this workflow. It just does a good job.

That's the whole pitch. No enterprise roleplay. No process theater. Just an effective system for building real software consistently using Claude Code.

Now — vibecoding (or being anything other than an OG Full Stack Dev) has a reputation, and it earned every bit of it. You describe what you want, AI generates code, and you get inconsistent garbage that collapses the moment someone tests an edge case.

GSD fixes that. It's the context engineering layer that makes Claude Code reliable. Describe your idea, let the system extract everything it needs to know, and let Claude Code get to work.

## Who This Is For

People who want to describe what they want and have it built correctly — without cosplaying as a program manager running sprint ceremonies for an audience of one.

## What You Get

GSD is two layers in one install:

| Layer | What it does | Components |
|-------|-------------|------------|
| Execution Engine | discuss → plan → execute → verify → ship | 67 commands, 17 agents, 6 hooks, wave-based parallel execution |
| Governance Framework | Session management, safety guardrails, project standards, extension generation | CLAUDE.md template, 10 hooks, permission rules, 2 plugin engines (45 skills, 10 subagents), 7 reference docs |
| Intelligence Layer (v2.0) | Dynamic model routing, task classification, execution history, adaptive workflows | classify.cjs, model-profiles.cjs, history.cjs — all opt-in, off by default |

The execution engine handles *how* your code gets built. The governance framework handles *what rules it follows* while building it. The intelligence layer makes the engine *smarter over time* — routing tasks to the right model tier and adapting workflow gates based on complexity and history.

The full inventory:

| Metric | Count |
|--------|-------|
| GSD commands | 67 |
| Specialized agents | 17 |
| Runtime hooks | 16 (6 execution + 10 governance, 1 shared) |
| Plugin skills | 45 (38 code factory + 7 MCP ecosystem) |
| Plugin subagents | 10 |
| Session commands | 9 (`/prime`, `/wrap`, `/agents`, `/agent-setup`, etc.) |
| Test suites | 574 |
| Test assertions | 2,934 |
| Reference docs | 8 (CLI, skills, hooks, MCP, settings, subagents, threat model, necessity gate) |

## Getting Started

```
npx get-shit-done-cc@latest
```

The installer asks two questions. That's it.

**Runtime** — Claude Code, OpenCode, Gemini, Codex, Copilot, Cursor, Antigravity, or all. Interactive multi-select, so you can pick multiple runtimes in a single install session.

**Location** — Global (all projects) or local (current project only).

For Claude Code, the governance layer installs by default — CLAUDE.md, hooks, permissions, and context reference docs. Use `--no-governance` to skip it if you want the engine without the guardrails.

Verify it worked:

| Runtime | Command |
|---------|---------|
| Claude Code / Gemini | `/gsd:help` |
| OpenCode | `/gsd-help` |
| Codex | `$gsd-help` |
| Copilot | `/gsd:help` |
| Antigravity | `/gsd:help` |

> **Note:** Codex installation uses skills (`skills/gsd-*/SKILL.md`) rather than custom prompts.

## Documentation Tools

| Command | Purpose |
|---------|---------|
| `node scripts/validate-doc-links.cjs` | Validates internal Markdown links (relative refs + anchor refs) in tracked `.md` files. Exits non-zero on broken links. Use `--json` for machine output, `--exclude <glob>` to suppress intentional fixtures. Runs in CI as the `docs-integrity` job. |
| `node scripts/check-doc-drift.cjs` | Validates numeric claims in CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md against live test counts, coverage percentages, and filesystem inventory. Exits non-zero on drift. Use `--json` for machine output. Runs in CI as a step inside the `test` job (ubuntu/22 only). |

## Staying Updated

GSD moves fast. Update when you remember to:

```
npx get-shit-done-cc@latest
```

## Non-interactive Install (Docker, CI, Scripts)

<details>
<summary>Non-interactive Install (Docker, CI, Scripts)</summary>

```bash
# Claude Code
npx get-shit-done-cc --claude --global   # Install to ~/.claude/
npx get-shit-done-cc --claude --local    # Install to ./.claude/

# OpenCode (open source, free models)
npx get-shit-done-cc --opencode --global # Install to ~/.config/opencode/

# Gemini CLI
npx get-shit-done-cc --gemini --global   # Install to ~/.gemini/

# Codex (skills-first)
npx get-shit-done-cc --codex --global    # Install to ~/.codex/
npx get-shit-done-cc --codex --local     # Install to ./.codex/

# Copilot (GitHub Copilot CLI)
npx get-shit-done-cc --copilot --global  # Install to ~/.github/
npx get-shit-done-cc --copilot --local   # Install to ./.github/

# Cursor CLI
npx get-shit-done-cc --cursor --global   # Install to ~/.cursor/
npx get-shit-done-cc --cursor --local    # Install to ./.cursor/

# Antigravity (Google, skills-first, Gemini-based)
npx get-shit-done-cc --antigravity --global # Install to ~/.gemini/antigravity/
npx get-shit-done-cc --antigravity --local  # Install to ./.agent/

# All runtimes
npx get-shit-done-cc --all --global      # Install to all directories
```

Use `--global` (`-g`) or `--local` (`-l`) to skip the location prompt. Use `--claude`, `--opencode`, `--gemini`, `--codex`, `--copilot`, `--cursor`, `--antigravity`, or `--all` to skip the runtime prompt.

</details>

## Development Installation

<details>
<summary>Development Installation</summary>

Clone the repository and run the installer locally:

```bash
git clone https://github.com/UsernameTron/Petes-Get-Shit-Done-Coding-Automation.git
cd Petes-Get-Shit-Done-Coding-Automation
node bin/install.js --claude --local
```

Installs to `./.claude/` for testing modifications before contributing.

</details>

### Recommended: Skip Permissions Mode

GSD is designed for frictionless automation. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

> [!TIP]
> This is how GSD is intended to be used — stopping to approve `date` and `git commit` 50 times defeats the purpose.

<details>
<summary>Alternative: Granular Permissions</summary>

If you prefer not to use that flag, add this to your project's `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(date:*)",
      "Bash(echo:*)",
      "Bash(cat:*)",
      "Bash(ls:*)",
      "Bash(mkdir:*)",
      "Bash(wc:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(sort:*)",
      "Bash(grep:*)",
      "Bash(tr:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(git tag:*)"
    ]
  }
}
```

</details>

---

## Command Syntax

Before we get into the 67 commands that make this thing work, the syntax varies by runtime — because apparently standardization is too much to ask of the AI tooling ecosystem:

| Runtime | Pattern | Example |
|---------|---------|---------|
| Claude Code / Gemini / Copilot | `/gsd:command-name [args]` | `/gsd:plan-phase 3` |
| OpenCode | `/gsd-command-name [args]` | `/gsd-plan-phase 3` |
| Codex | `$gsd-command-name [args]` | `$gsd-plan-phase 3` |

Every command below uses the Claude Code syntax. Translate accordingly if you're running a different runtime. The commands are identical — only the prefix changes.

---

## Commands

### Core Workflow — The Assembly Line

These are the commands that move your project from "idea" to "shipped." In order. Like a process that was actually designed to produce outcomes instead of calendar invites.

#### `/gsd:new-project`

Initializes a new project with deep context gathering. This is where GSD asks the questions your team never asks before building: what are we actually making, what does done look like, and what constraints exist that nobody wants to talk about.

| Flag | What it does |
|------|-------------|
| `--auto @file.md` | Auto-extract from a document, skip interactive questions |

**Produces:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`, `research/`, `CLAUDE.md`

```
/gsd:new-project                    # Interactive mode — the system interviews you
/gsd:new-project --auto @prd.md     # Auto-extract from an existing PRD
```

---

#### `/gsd:new-workspace`

Creates an isolated workspace with repo copies and its own `.planning/` directory. For when you're working across multiple repos and need a clean room that doesn't contaminate your main project state.

| Flag | What it does |
|------|-------------|
| `--name <n>` | Workspace name (required) |
| `--repos repo1,repo2` | Comma-separated repo paths or names |
| `--path /target` | Target directory (default: `~/gsd-workspaces/<n>`) |
| `--strategy worktree\|clone` | Copy strategy (default: `worktree`) |
| `--branch <n>` | Branch to checkout (default: `workspace/<n>`) |
| `--auto` | Skip interactive questions |

**Produces:** `WORKSPACE.md`, `.planning/`, repo copies (worktrees or clones)

```
/gsd:new-workspace --name feature-b --repos hr-ui,ZeymoAPI
/gsd:new-workspace --name feature-b --repos . --strategy worktree  # Same-repo isolation
/gsd:new-workspace --name spike --repos api,web --strategy clone   # Full clones
```

---

#### `/gsd:list-workspaces`

Lists active GSD workspaces and their status. Scans `~/gsd-workspaces/` for `WORKSPACE.md` manifests and shows name, repo count, strategy, and project status.

```
/gsd:list-workspaces
```

---

#### `/gsd:remove-workspace`

Removes a workspace and cleans up git worktrees. Refuses to destroy anything with uncommitted changes — which is more safety awareness than most deployment pipelines demonstrate.

| Argument | Required | What it does |
|----------|----------|-------------|
| `<name>` | Yes | Workspace name to remove |

```
/gsd:remove-workspace feature-b
```

---

#### `/gsd:discuss-phase`

Captures implementation decisions *before* planning. This is the conversation your team should have had before someone opened a Jira ticket and assigned story points to a mystery. The system interviews you about approach, constraints, and tradeoffs so the plan that follows isn't a guess.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to current phase) |

| Flag | What it does |
|------|-------------|
| `--auto` | Auto-select recommended defaults for all questions |
| `--batch` | Group questions for batch intake instead of one-by-one |
| `--analyze` | Add trade-off analysis during discussion |

**Produces:** `{phase}-CONTEXT.md`, `{phase}-DISCUSSION-LOG.md` (audit trail)

```
/gsd:discuss-phase 1                # Interactive discussion for phase 1
/gsd:discuss-phase 3 --auto         # Auto-select defaults for phase 3
/gsd:discuss-phase --batch          # Batch mode for current phase
/gsd:discuss-phase 2 --analyze      # Discussion with trade-off analysis
```

---

#### `/gsd:ui-phase`

Generates a UI design contract for frontend phases. Produces a `UI-SPEC.md` before anyone writes a pixel, so the frontend work has a target instead of a vibes-based aesthetic consensus.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to current phase) |

**Produces:** `{phase}-UI-SPEC.md`

```
/gsd:ui-phase 2                     # Design contract for phase 2
```

---

#### `/gsd:plan-phase`

The planning engine. Researches the domain, generates implementation plans, then verifies the plans make sense before anyone writes code. Three steps that eliminate the "we planned for 20 minutes and coded for 3 weeks in the wrong direction" problem.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to next unplanned phase) |

| Flag | What it does |
|------|-------------|
| `--auto` | Skip interactive confirmations |
| `--research` | Force re-research even if RESEARCH.md exists |
| `--skip-research` | Skip domain research step (familiar territory) |
| `--gaps` | Gap closure mode — reads VERIFICATION.md, skips research |
| `--skip-verify` | Skip plan checker verification loop |
| `--prd <file>` | Use a PRD file instead of discuss-phase for context |
| `--reviews` | Replan with cross-AI review feedback from REVIEWS.md |

**Produces:** `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`, `{phase}-VALIDATION.md`

```
/gsd:plan-phase 1                   # Research + plan + verify phase 1
/gsd:plan-phase 3 --skip-research   # Plan without research (familiar domain)
/gsd:plan-phase --auto              # Non-interactive planning
```

---

#### `/gsd:execute-phase`

Executes all plans in a phase with wave-based parallelization. Plans are grouped into waves by dependency order and executed in parallel within each wave. This is where the actual code gets written — by agents that have read the plan, the research, and the discussion context.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | **Yes** | Phase number to execute |
| `--wave N` | No | Execute only a specific wave |

**Produces:** per-plan `{phase}-{N}-SUMMARY.md`, git commits, `{phase}-VERIFICATION.md` when the phase completes

```
/gsd:execute-phase 1                # Execute phase 1
/gsd:execute-phase 1 --wave 2       # Execute only Wave 2
```

---

#### `/gsd:verify-work`

User acceptance testing with auto-diagnosis. Checks that what was built matches what was planned, catches regressions, and generates fix plans if something's off. The verification step that most dev workflows describe in their documentation and skip in practice.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to last executed phase) |

**Produces:** `{phase}-UAT.md`, fix plans if issues found

```
/gsd:verify-work 1                  # UAT for phase 1
```

---

#### `/gsd:next`

Reads project state and runs whatever command should logically come next. No project? Suggests `/gsd:new-project`. Phase needs discussion? Runs `/gsd:discuss-phase`. Planning? Execution? Verification? It figures it out. For when you want to stop being a workflow manager and start being a person who ships things.

```
/gsd:next                           # Auto-detect and run next step
```

---

#### `/gsd:session-report`

Generates a post-session report covering work performed, commits, outcomes, blockers, estimated token/cost usage, and next steps. The debrief you'd write if you had the discipline to write debriefs.

**Produces:** `.planning/reports/SESSION_REPORT.md`

```
/gsd:session-report                 # Generate post-session summary
```

---

#### `/gsd:ship`

Creates a GitHub PR from completed phase work with an auto-generated body that includes the phase goal, changes summary, requirements addressed, verification status, and key decisions. Requires `gh` CLI installed and authenticated.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number or milestone version (e.g., `4` or `v1.0`) |
| `--draft` | No | Create as draft PR |

**Produces:** GitHub PR with rich body from planning artifacts, STATE.md updated

```
/gsd:ship 4                         # Ship phase 4
/gsd:ship 4 --draft                 # Ship as draft PR
```

---

#### `/gsd:ui-review`

Retroactive 6-pillar visual audit of implemented frontend. Works standalone — doesn't need a GSD project. Just point it at code that has a frontend and let it tell you what the design review would have caught if you'd had one.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to last executed phase) |

**Produces:** `{phase}-UI-REVIEW.md`, screenshots in `.planning/ui-reviews/`

```
/gsd:ui-review                      # Audit current phase
/gsd:ui-review 3                    # Audit phase 3
```

---

#### `/gsd:audit-uat`

Cross-phase audit of every outstanding UAT and verification item. Produces a categorized audit report with a human test plan — the comprehensive "what still needs a human eyeball" checklist.

```
/gsd:audit-uat
```

---

### Milestone Commands — The Arc of a Version

These manage the lifecycle of a milestone: audit it, complete it, summarize it, start the next one. The version management that most projects handle with a git tag and a prayer.

#### `/gsd:audit-milestone`

Verifies the milestone met its definition of done. Produces an audit report with gap analysis — the honest accounting of what was promised versus what was delivered.

```
/gsd:audit-milestone
```

---

#### `/gsd:complete-milestone`

Archives the milestone, tags the release. Produces a `MILESTONES.md` entry and a git tag. The ceremonial close that actually closes things instead of leaving them in a "mostly done" limbo.

```
/gsd:complete-milestone
```

---

#### `/gsd:milestone-summary`

Generates a comprehensive project summary from milestone artifacts. Architecture decisions, phase-by-phase breakdown, requirements coverage, tech debt, deferred items, and a getting-started guide for anyone joining the project after the fact. The institutional memory that walks out the door when the senior dev quits — except this one's a markdown file, so it stays.

| Argument | Required | What it does |
|----------|----------|-------------|
| `version` | No | Milestone version (defaults to current/latest) |

**Produces:** `.planning/reports/MILESTONE_SUMMARY-v{version}.md`

```
/gsd:milestone-summary                # Summarize current milestone
/gsd:milestone-summary v1.0           # Summarize specific milestone
```

---

#### `/gsd:new-milestone`

Starts the next version cycle. Updated `PROJECT.md`, new `REQUIREMENTS.md`, new `ROADMAP.md`. If you use `--reset-phase-numbers`, it restarts numbering at Phase 1 and archives the old phase directories.

| Argument | Required | What it does |
|----------|----------|-------------|
| `name` | No | Milestone name |
| `--reset-phase-numbers` | No | Restart at Phase 1, archive old phase dirs |

```
/gsd:new-milestone                  # Interactive
/gsd:new-milestone "v2.0 Mobile"    # Named milestone
/gsd:new-milestone --reset-phase-numbers "v2.0 Mobile"
```

---

#### `/gsd:plan-milestone-gaps`

Creates phases to close gaps identified by the milestone audit. The audit finds the holes; this command fills them with actual work plans instead of action items that age in a spreadsheet.

```
/gsd:plan-milestone-gaps
```

---

### Phase Management — Surgery on the Roadmap

For when the roadmap needs to change mid-flight. Which is always. Because roadmaps are fiction that becomes less fictional one phase at a time.

#### `/gsd:add-phase`

Appends a new phase to the roadmap. Interactive — describe the phase and it gets added to the sequence.

```
/gsd:add-phase
```

---

#### `/gsd:insert-phase`

Inserts urgent work between existing phases using decimal numbering. Insert after phase 3 and you get phase 3.1 — no renumbering, no cascading chaos in your artifact filenames.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Insert after this phase number |

```
/gsd:insert-phase 3                 # Creates phase 3.1 between 3 and 4
```

---

#### `/gsd:remove-phase`

Removes a future phase and renumbers everything after it. Phase 7 disappears, 8 becomes 7, 9 becomes 8.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number to remove |

```
/gsd:remove-phase 7
```

---

#### `/gsd:list-phase-assumptions`

Previews Claude's intended approach before planning begins. The "let me tell you what I'm thinking so you can correct me before I spend 20 minutes planning in the wrong direction" command.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number |

```
/gsd:list-phase-assumptions 2
```

---

#### `/gsd:research-phase`

Deep ecosystem research as a standalone operation. Usually you'd just use `/gsd:plan-phase` which includes research, but this exists for when you want the research without the plan — pure domain exploration.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number |

```
/gsd:research-phase 4
```

---

#### `/gsd:validate-phase`

Retroactively audits test coverage and fills validation gaps. For phases that shipped with less verification than they deserved — which, statistically, is most of them.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number |

```
/gsd:validate-phase 2
```

---

### Navigation — Where Am I and What Happened

#### `/gsd:progress`

Shows current status and recommended next steps. The "Where am I? What's next?" command for when you open a terminal after three days away and need the situation report.

```
/gsd:progress
```

---

#### `/gsd:resume-work`

Restores full context from your last session. Use after a context reset or when starting a new session on an existing project. Reads `continue-here.md` and rehydrates the state.

```
/gsd:resume-work
```

---

#### `/gsd:pause-work`

Saves a context handoff when you're stopping mid-phase. Creates `continue-here.md` — a structured note that tells your future self (or your next session's Claude) exactly where things stand and what comes next.

```
/gsd:pause-work
```

---

#### `/gsd:manager`

Interactive command center for managing multiple phases from one terminal. Dashboard with visual status indicators, optimal next-action recommendations, and the ability to dispatch work — discuss runs inline, plan and execute spawn as background agents. For power users parallelizing work across phases who got tired of running `/gsd:progress` every 30 seconds.

```
/gsd:manager
```

---

#### `/gsd:help`

Shows all commands and usage. The thing you're reading right now, but in your terminal.

```
/gsd:help
```

---

### Utility Commands — The Swiss Army Drawer

#### `/gsd:quick`

Executes an ad-hoc task with GSD's planning and verification guarantees. Not a full phase — more like a single task that still benefits from structure. Flags are composable: stack `--discuss`, `--research`, and `--full` for maximum rigor on a standalone task.

| Flag | What it does |
|------|-------------|
| `--full` | Enable plan checking (2 iterations) + post-execution verification |
| `--discuss` | Lightweight pre-planning discussion |
| `--research` | Spawn focused researcher before planning |

```
/gsd:quick                          # Basic quick task
/gsd:quick --discuss --research     # Discussion + research + planning
/gsd:quick --full                   # With plan checking and verification
/gsd:quick --discuss --research --full  # Everything — the full ceremony for a single task
```

---

#### `/gsd:autonomous`

Runs all remaining phases autonomously. Discuss → plan → execute → verify, on repeat, until the roadmap is done or something breaks. The "I trust the system, go build while I get coffee" command.

| Flag | What it does |
|------|-------------|
| `--from N` | Start from a specific phase number |

```
/gsd:autonomous                     # Run all remaining phases
/gsd:autonomous --from 3            # Start from phase 3
```

---

#### `/gsd:do`

Routes freeform text to the right GSD command. Describe what you want in natural language and the system figures out which command you meant. For people who remember what they want to do but not the exact command name.

```
/gsd:do                             # Then describe what you want
```

---

#### `/gsd:note`

Zero-friction idea capture. Append a note, list all notes across project and global scopes, or promote a note to a structured todo. The scratchpad that doesn't disappear when your terminal closes.

| Argument | What it does |
|----------|-------------|
| `text` | Append a note (default mode) |
| `list` | List all notes from project and global scopes |
| `promote N` | Convert note N into a structured todo |

| Flag | What it does |
|------|-------------|
| `--global` | Use global scope for note operations |

```
/gsd:note "Consider caching strategy for API responses"
/gsd:note list
/gsd:note promote 3
```

---

#### `/gsd:debug`

Systematic debugging with persistent state. Describe the bug, and the system tracks hypotheses, attempted fixes, and outcomes across the debugging session. State persists — so when the fix for Bug A reveals Bug B, the context doesn't evaporate.

| Argument | Required | What it does |
|----------|----------|-------------|
| `description` | No | Description of the bug |

```
/gsd:debug "Login button not responding on mobile Safari"
```

---

#### `/gsd:add-todo`

Captures an idea or task for later. The "I don't want to lose this thought but I'm not stopping what I'm doing" command.

```
/gsd:add-todo "Consider adding dark mode support"
```

---

#### `/gsd:check-todos`

Lists pending todos and lets you select one to work on. The todo list you'll actually check because it's in your terminal instead of a project management tool nobody opens.

```
/gsd:check-todos
```

---

#### `/gsd:add-tests`

Generates tests for a completed phase. Retroactive test generation for the code that shipped without it — which, again, statistically is most of it.

| Argument | Required | What it does |
|----------|----------|-------------|
| `N` | No | Phase number |

```
/gsd:add-tests 2
```

---

#### `/gsd:stats`

Displays project statistics. The metrics dashboard for your codebase that nobody asked for but everyone finds useful the moment it exists.

```
/gsd:stats
```

---

#### `/gsd:profile-user`

Generates a developer behavioral profile from Claude Code session analysis across 8 dimensions: communication style, decision patterns, debugging approach, UX preferences, vendor choices, frustration triggers, learning style, and explanation depth. Produces artifacts that personalize Claude's responses to the way you actually work — not the way a generic prompt assumes you work.

| Flag | What it does |
|------|-------------|
| `--questionnaire` | Use interactive questionnaire instead of session analysis |
| `--refresh` | Re-analyze sessions and regenerate profile |

**Produces:** `USER-PROFILE.md`, `/gsd:dev-preferences` command, `CLAUDE.md` profile section

```
/gsd:profile-user                   # Analyze sessions and build profile
/gsd:profile-user --questionnaire   # Interactive questionnaire fallback
/gsd:profile-user --refresh         # Re-generate from fresh analysis
```

---

#### `/gsd:health`

Validates `.planning/` directory integrity. Checks for missing files, broken references, and state inconsistencies. The infrastructure health check that catches corruption before it manifests as a confusing error three commands from now.

| Flag | What it does |
|------|-------------|
| `--repair` | Auto-fix recoverable issues |

```
/gsd:health                         # Check integrity
/gsd:health --repair                # Check and fix
```

---

#### `/gsd:cleanup`

Archives accumulated phase directories from completed milestones. The housekeeping that keeps your `.planning/` directory from becoming an archaeological dig site.

```
/gsd:cleanup
```

---

#### `/gsd:fast`

Executes a trivial task inline — no subagents, no planning overhead. For typo fixes, config changes, small refactors, forgotten commits. The tasks that don't deserve a planning ceremony.

Not a replacement for `/gsd:quick` — use `/gsd:quick` for anything that needs research, multi-step planning, or verification. `/gsd:fast` is for the stuff that takes less time to do than to describe.

| Argument | Required | What it does |
|----------|----------|-------------|
| `task description` | No | What to do (prompted if omitted) |

```
/gsd:fast "fix typo in README"
/gsd:fast "add .env to gitignore"
```

---

### Diagnostics — The Post-Mortem Department

#### `/gsd:forensics`

Post-mortem investigation of failed or stuck workflows. Analyzes git history for stuck patterns and time gaps, checks artifact integrity for completed phases, scans STATE.md for anomalies, identifies uncommitted work and abandoned changes, and checks at least 4 anomaly types (stuck loops, missing artifacts, abandoned work, crash/interruption). Offers to create a GitHub issue if actionable findings exist.

The debugging tool for when the *system itself* is the bug.

| Argument | Required | What it does |
|----------|----------|-------------|
| `description` | No | Problem description (prompted if omitted) |

**Produces:** `.planning/forensics/report-{timestamp}.md`

```
/gsd:forensics                              # Interactive — prompted for problem
/gsd:forensics "Phase 3 execution stalled"  # With problem description
```

---

### Workstream Management — Parallel Universes

#### `/gsd:workstreams`

Manages parallel workstreams for concurrent work on different areas of a milestone. Seven subcommands for the full lifecycle:

| Subcommand | What it does |
|------------|-------------|
| `list` | List all workstreams with status (default if no subcommand) |
| `create <name>` | Create a new workstream |
| `status <name>` | Detailed status for one workstream |
| `switch <name>` | Set active workstream |
| `progress` | Progress summary across all workstreams |
| `complete <name>` | Archive a completed workstream |
| `resume <name>` | Resume work in a workstream |

**Produces:** Workstream directories under `.planning/`, state tracking per workstream

```
/gsd:workstreams                    # List all workstreams
/gsd:workstreams create backend-api # Create new workstream
/gsd:workstreams switch backend-api # Set active workstream
/gsd:workstreams status backend-api # Detailed status
/gsd:workstreams progress           # Cross-workstream progress overview
/gsd:workstreams complete backend-api
/gsd:workstreams resume backend-api
```

---

### Configuration — The Settings Nobody Reads Until Something Breaks

#### `/gsd:settings`

Interactive configuration of workflow toggles and model profile. The settings panel.

```
/gsd:settings
```

---

#### `/gsd:set-profile`

Quick model profile switch between quality, balanced, budget, and inherit tiers. For when the task complexity changes and your token budget should change with it.

| Argument | Required | What it does |
|----------|----------|-------------|
| `profile` | **Yes** | `quality`, `balanced`, `budget`, or `inherit` |

```
/gsd:set-profile budget             # Switch to budget profile
/gsd:set-profile quality            # Switch to quality profile
```

---

### Brownfield — Mapping the Wreckage

#### `/gsd:map-codebase`

Analyzes an existing codebase with parallel mapper agents. For when you're adding GSD to a project that already exists and Claude needs to understand what it's working with before it starts changing things.

| Argument | Required | What it does |
|----------|----------|-------------|
| `area` | No | Scope mapping to a specific area |

```
/gsd:map-codebase                   # Full codebase analysis
/gsd:map-codebase auth              # Focus on auth area
```

---

### Code Quality — The Peer Review That Actually Reviews

#### `/gsd:review`

Cross-AI peer review of phase plans. Sends your plans to external AI CLIs (Gemini, Claude in a separate session, Codex) for independent review. Produces `REVIEWS.md` that `/gsd:plan-phase --reviews` can consume to replan with outside feedback.

The architectural review board, except the board members are fast, thorough, and don't have scheduling conflicts.

| Argument | Required | What it does |
|----------|----------|-------------|
| `--phase N` | **Yes** | Phase number to review |

| Flag | What it does |
|------|-------------|
| `--gemini` | Include Gemini CLI review |
| `--claude` | Include Claude CLI review (separate session) |
| `--codex` | Include Codex CLI review |
| `--all` | Include all available CLIs |

```
/gsd:review --phase 3 --all
/gsd:review --phase 2 --gemini
```

---

#### `/gsd:pr-branch`

Creates a clean PR branch by filtering out `.planning/` commits. Reviewers see only code changes — not the 47 planning artifacts that got you there.

| Argument | Required | What it does |
|----------|----------|-------------|
| `target branch` | No | Base branch (default: `main`) |

```
/gsd:pr-branch                     # Filter against main
/gsd:pr-branch develop             # Filter against develop
```

---

### Backlog & Threads — Ideas That Aren't Ready Yet

#### `/gsd:add-backlog`

Adds an idea to the backlog parking lot using 999.x numbering — outside the active phase sequence, so it doesn't mess with your roadmap. Phase directories are created immediately so `/gsd:discuss-phase` and `/gsd:plan-phase` work on them when you're ready.

| Argument | Required | What it does |
|----------|----------|-------------|
| `description` | **Yes** | Backlog item description |

```
/gsd:add-backlog "GraphQL API layer"
/gsd:add-backlog "Mobile responsive redesign"
```

---

#### `/gsd:review-backlog`

Reviews backlog items and lets you promote, keep, or remove each one. The periodic backlog grooming that most Agile teams schedule, skip, and then complain about in retrospectives.

```
/gsd:review-backlog
```

---

#### `/gsd:plant-seed`

Captures a forward-looking idea with trigger conditions that surface automatically at the right milestone. Seeds solve context rot — instead of a one-liner in "Deferred" that nobody reads, a seed preserves the full *why*, *when* to surface, and breadcrumbs to the details.

| Argument | Required | What it does |
|----------|----------|-------------|
| `idea summary` | No | Seed description (prompted if omitted) |

**Produces:** `.planning/seeds/SEED-NNN-slug.md`
**Consumed by:** `/gsd:new-milestone` (scans seeds and presents matches)

```
/gsd:plant-seed "Add real-time collaboration when WebSocket infra is in place"
```

---

#### `/gsd:thread`

Manages persistent context threads for cross-session work. Threads are lightweight knowledge stores for work that spans multiple sessions but doesn't belong to any specific phase. Lighter weight than `/gsd:pause-work` — think running notes for an ongoing investigation.

| Usage | What it does |
|-------|-------------|
| `(no args)` | List all threads |
| `name` | Resume existing thread by name |
| `description` | Create new thread |

```
/gsd:thread                         # List all threads
/gsd:thread fix-deploy-key-auth     # Resume thread
/gsd:thread "Investigate TCP timeout in pasta service"  # Create new
```

---

### Update Commands

#### `/gsd:update`

Checks for updates and installs them with a changelog preview. So you know what changed before it changes.

```
/gsd:update
```

---

#### `/gsd:reapply-patches`

Restores your local modifications after a GSD update. For when you've customized workflows and don't want an update to erase the customization.

```
/gsd:reapply-patches
```

---

### Community

#### `/gsd:join-discord`

Opens the Discord community invite. For when you want to talk to other people who use this instead of talking to the AI that runs it.

```
/gsd:join-discord
```

---

## Governance Layer

The governance framework is what separates "AI wrote some code" from "AI wrote code that follows your standards." It installs alongside the execution engine and enforces rules automatically — no manual discipline required.

### What It Does

Three things, in order of importance:

1. **Session lifecycle** — Every session starts with `/prime` (load context, check state, detect continuity) and ends with `/wrap` (log work, record decisions, note next steps). This prevents the "who am I and what was I doing" problem across sessions.

2. **Safety hooks** — 15 hooks fire automatically during Claude Code's lifecycle events. They block dangerous operations before they happen and enforce documentation standards on every commit.

3. **CLAUDE.md template** — A comprehensive project governance file that defines identity, workflow rules, code standards, phase gates, and plugin inventory. It is the operating system for every session.

### Session Initialization Sequence

Every session executes this sequence before any work begins (automated by `/prime`):

1. Read `CLAUDE.md` in full
2. Read `tasks/lessons.md` — persistent cross-session rules from corrections
3. Read `.planning/STATE.md` (or `tasks/todo.md`) — current execution state
4. Load operator context files: `context/role.md`, `context/org.md`, `context/priorities.md`, `context/metrics.md`
5. Check `.claude/agents/` for deployed specialists
6. Check git state (branch, uncommitted changes, last commit)
7. Check `state/session-log.md` for last session's handoff notes
8. Report initialization summary
9. Resume or await instructions

### The 15 Hooks

Hooks are shell commands that fire automatically at lifecycle events. They enforce rules without requiring the AI (or the developer) to remember them.

#### Governance Hooks (10)

Installed via `governance/templates/global/settings-hooks.json`:

| Event | Hook | What It Does |
|-------|------|-------------|
| SessionStart | Project state scanner | Scans for git, CLAUDE.md, README, gitignore, tests, agents, tasks, handoff, code, and empty project status |
| PreToolUse (Bash) | Branch protection | Blocks `git commit` and `git merge` directly to `main` or `master` |
| PreToolUse (Bash) | Private file staging blocker | Blocks `git add` on `state/`, `context/`, `.DS_Store`, `.env` files |
| PreToolUse (Bash) | Required docs check | Blocks commits unless `CLAUDE.md`, `README.md`, and `docs/DEVOPS-HANDOFF.md` exist |
| PreToolUse (Bash) | Secrets scanner | Detects API keys, tokens, and credentials in staged files |
| PreToolUse (Bash) | Nested repo detector | Blocks `git add` when nested `.git` directories are present |
| PreToolUse (Bash) | Pre-push dirty check | Blocks `git push` when uncommitted files exist in the working tree |
| PostToolUse (Write\|Edit) | File type context advisor | Detects test files, skill files, and Python files — provides contextual advice |
| Stop | Uncommitted files blocker | Blocks session stop when dirty working tree detected |
| PreCompact | Task state preservation | Reminds about preserving task state files before context compaction |

#### GSD Runtime Hooks (5)

Built into the execution engine itself:

| Hook | What It Does |
|------|-------------|
| Plan validation gate | Blocks execution until plan is approved |
| Wave dependency checker | Ensures parallel tasks respect dependency ordering |
| State checkpoint writer | Auto-saves progress to `.planning/STATE.md` after each step |
| Test suite runner | Runs tests before marking phases complete |
| Handoff note generator | Creates session handoff on context window boundaries |

#### MCP Ecosystem Hook (1)

Installed via `plugins/claude-mcp-ecosystem/workspace-ops/hooks/hooks.json`:

| Event | Hook | What It Does |
|-------|------|-------------|
| SessionStart | MCP server health check | Verifies MCP server connectivity at session start |

### Phase Gate Enforcement

The governance layer enforces sequential gates on every feature:

| Gate | Rule | Enforced By |
|------|------|-------------|
| Phase 0 → 1 | No planning until bootstrap complete (CLAUDE.md scored, hooks installed, GSD initialized) | Session init check |
| Phase 1 → 2 | No code until plan approved | Plan validation hook |
| Phase 2 → 3 | No ship until verification passes | `/gsd:verify-work` |
| Phase 3 → 4 | No merge without passing quality gates | Required docs check + test runner |
| Phase 4 → 5 | No session close without `/wrap` | Uncommitted files blocker |

### CLAUDE.md Template

The governance template (`governance/templates/global/CLAUDE.md`) defines:

- **Identity and communication protocol** — how the AI should interact
- **Session commands table** — 30 commands across GSD, MCP ecosystem, and utilities
- **Development lifecycle** — 5-phase pipeline from bootstrap to session close
- **Workflow rules** — autonomy decision tree, rollback protocol, context management
- **Code standards** — simplicity, coverage thresholds (90% overall, 80% per module, 95% security-critical), documentation requirements
- **Git workflow** — branching conventions, commit rules, review requirements
- **Plugin inventory** — all installed plugins organized by lifecycle phase
- **Do-not-touch list** — files that require explicit approval to modify

---

## Session Commands

All slash commands available across the three plugin systems.

### GSD Commands (63)

| Command | Description |
|---------|-------------|
| `/gsd:add-backlog` | Add an idea to the backlog parking lot (999.x numbering) |
| `/gsd:add-phase` | Add phase to end of current milestone in roadmap |
| `/gsd:add-tests` | Generate tests for a completed phase based on UAT criteria and implementation |
| `/gsd:add-todo` | Capture idea or task as todo from current conversation context |
| `/gsd:audit-agents` | Audit the GSD agent ecosystem for frontmatter integrity, tool/permission mismatches, and hygiene gaps |
| `/gsd:audit-deps` | Audit package dependencies for CVEs, staleness, and license issues |
| `/gsd:audit-milestone` | Audit milestone completion against original intent before archiving |
| `/gsd:audit-uat` | Cross-phase audit of all outstanding UAT and verification items |
| `/gsd:autonomous` | Run all remaining phases autonomously — discuss, plan, execute per phase |
| `/gsd:check-todos` | List pending todos and select one to work on |
| `/gsd:cleanup` | Archive accumulated phase directories from completed milestones |
| `/gsd:complete-milestone` | Archive completed milestone and prepare for next version |
| `/gsd:crew` | Agent roster, capability map, and self-assessment with improvement plans |
| `/gsd:debug` | Systematic debugging with persistent state across context resets |
| `/gsd:discuss-phase` | Gather phase context through adaptive questioning before planning |
| `/gsd:do` | Route freeform text to the right GSD command automatically |
| `/gsd:execute-phase` | Execute all plans in a phase with wave-based parallelization |
| `/gsd:fast` | Execute a trivial task inline — no subagents, no planning overhead |
| `/gsd:finalize` | End-to-end project finalization — verify, archive, report, push, confirm clean |
| `/gsd:forensics` | Post-mortem investigation for failed GSD workflows |
| `/gsd:harden-repo` | Audit and enforce GitHub branch protection against standard policy |
| `/gsd:health` | Diagnose planning directory health and optionally repair issues |
| `/gsd:help` | Show available GSD commands and usage guide |
| `/gsd:insert-phase` | Insert urgent work as decimal phase (e.g., 72.1) between existing phases |
| `/gsd:join-discord` | Join the GSD Discord community |
| `/gsd:list-phase-assumptions` | Surface Claude's assumptions about a phase approach before planning |
| `/gsd:list-workspaces` | List active GSD workspaces and their status |
| `/gsd:manager` | Interactive command center for managing multiple phases from one terminal |
| `/gsd:map-codebase` | Analyze codebase with parallel mapper agents to produce architecture documents |
| `/gsd:milestone-summary` | Generate a comprehensive project summary from milestone artifacts |
| `/gsd:new-milestone` | Start a new milestone cycle — update PROJECT.md and route to requirements |
| `/gsd:new-project` | Initialize a new project with deep context gathering and PROJECT.md |
| `/gsd:new-workspace` | Create an isolated workspace with repo copies and independent .planning/ |
| `/gsd:next` | Automatically advance to the next logical step in the GSD workflow |
| `/gsd:note` | Zero-friction idea capture — append, list, or promote notes to todos |
| `/gsd:pause-work` | Create context handoff when pausing work mid-phase |
| `/gsd:plan-milestone-gaps` | Create phases to close all gaps identified by milestone audit |
| `/gsd:plan-phase` | Create detailed phase plan (PLAN.md) with verification loop |
| `/gsd:plant-seed` | Capture a forward-looking idea with trigger conditions for future milestones |
| `/gsd:portfolio` | Cross-project dashboard — scan all projects, show status, git health, next recommendation |
| `/gsd:pr-branch` | Create a clean PR branch by filtering out .planning/ commits |
| `/gsd:prime-patterns` | Boot session with full context and inject matched KB v2.1 design patterns |
| `/gsd:profile-user` | Generate developer behavioral profile and create Claude-discoverable artifacts |
| `/gsd:progress` | Check project progress, show context, and route to next action |
| `/gsd:quick` | Execute a quick task with GSD guarantees (atomic commits, state tracking) |
| `/gsd:reapply-patches` | Reapply local modifications after a GSD update |
| `/gsd:remove-phase` | Remove a future phase from roadmap and renumber subsequent phases |
| `/gsd:remove-workspace` | Remove a GSD workspace and clean up worktrees |
| `/gsd:research-phase` | Research how to implement a phase before planning |
| `/gsd:resume-work` | Resume work from previous session with full context restoration |
| `/gsd:review-backlog` | Review and promote backlog items to active milestone |
| `/gsd:review` | Request cross-AI peer review of phase plans from external AI CLIs |
| `/gsd:session-report` | Generate a session report with token usage estimates and outcomes |
| `/gsd:set-profile` | Switch model profile for GSD agents (quality/balanced/budget/inherit) |
| `/gsd:settings` | Configure GSD workflow toggles and model profile |
| `/gsd:ship` | Create PR, run review, and prepare for merge after verification passes |
| `/gsd:stats` | Display project statistics — phases, plans, requirements, git metrics |
| `/gsd:thread` | Manage persistent context threads for cross-session work |
| `/gsd:ui-phase` | Generate UI design contract (UI-SPEC.md) for frontend phases |
| `/gsd:ui-review` | Retroactive 6-pillar visual audit of implemented frontend code |
| `/gsd:update` | Update GSD to latest version with changelog display |
| `/gsd:validate-phase` | Retroactively audit and fill Nyquist validation gaps for a completed phase |
| `/gsd:verify-work` | Validate built features through conversational UAT |
| `/gsd:workstreams` | Manage parallel workstreams — list, create, switch, status, and more |

See the [Commands](#commands) section above for full documentation organized by category.

### MCP Ecosystem Commands (9)

| Command | Description |
|---------|-------------|
| `/prime` | Boot your session — load context, check state, detect continuity |
| `/wrap` | Close your session — log what was done, record decisions, note next steps |
| `/agents` | Quick overview of all your specialist agents |
| `/agent-setup` | Set up specialist agents for your project |
| `/agent-status` | Check the health and status of your deployed specialist agents |
| `/agent-diagnose` | Diagnose issues with your specialist agents |
| `/agent-add` | Add a new specialist agent to your project |
| `/agent-remove` | Remove a specialist agent from your project |
| `/agent-reset` | Reset a specialist agent's memory |

### Utility Commands (4)

| Command | Source Plugin | Description |
|---------|-------------|-------------|
| `/commit` | commit-commands | Create a git commit with conventional message |
| `/commit-push-pr` | commit-commands | Branch + commit + push + open PR in one shot |
| `/clean-gone` | commit-commands | Remove local branches deleted on remote |
| `/revise-claude-md` | claude-md-management | Capture session learnings into project CLAUDE.md |

---

## Plugin Inventory

GSD ships with a modular plugin architecture. Three core plugins provide the primary capabilities, with additional plugins for bootstrap, language support, review, shipping, and utilities.

### Core Infrastructure (always active)

| Plugin | Skills | Subagents | Role |
|--------|--------|-----------|------|
| **get-shit-done** | — | 18 | Execution engine: discuss → plan → execute → verify → ship pipeline with wave-based parallelization |
| **claude-mcp-ecosystem** v2.0.0 | 7 | — | Session commands (`/prime`, `/wrap`), agent 3-layer routing, workspace governance |
| **claude-code-factory** v1.0.0 | 38 | 10 | Extension generation: skills, hooks, agents, plugins, MCP configs, CI/CD pipelines, dev team recipes |

### Bootstrap and Configuration (Phase 0)

| Plugin | Role |
|--------|------|
| claude-code-setup | Codebase analysis → automation recommendations |
| claude-md-management | CLAUDE.md audit, scoring, session learning capture |
| hookify | Project-specific hook rule authoring |
| security-guidance | Passive security warnings on file edits |

### Language and Stack (Phase 2, passive)

| Plugin | Role |
|--------|------|
| pyright-lsp | Python type checking |
| frontend-design | Frontend UI/UX guidance |

### Supplemental Review (Phase 3, optional)

| Plugin | Role |
|--------|------|
| code-review | Multi-agent PR review with confidence scoring |
| pr-review-toolkit | 6 specialized review agents: comment-analyzer, pr-test-analyzer, silent-failure-hunter, type-design-analyzer, code-simplifier, code-reviewer |

### Ship (Phase 4)

| Plugin | Role |
|--------|------|
| commit-commands | `/commit`, `/commit-push-pr`, `/clean-gone` |

### Utilities (any phase)

| Plugin | Role |
|--------|------|
| github | GitHub MCP integration |
| slack | Slack workspace integration |
| learn | Skill discovery from agentskill.sh |
| plugin-dev | Plugin structure toolkit |
| claude-code-research | Claude Code reference documentation |
| agent-sdk-dev | Claude Agent SDK reference documentation |
| explanatory-output-style | Educational insights on implementation choices |

---

## Code Factory Skills (38)

The Claude Code Factory plugin provides extension generation and dev team management across three tiers: reference skills (background knowledge), generator skills (artifact creation), and routing skills (traffic direction).

### Reference Library (13 skills)

| Skill | Description |
|-------|-------------|
| cc-ref-agent-archetypes | 72 application development agent archetypes across 10 domains |
| cc-ref-agent-workflows | Workflow patterns and reusable system prompt fragments for agent design |
| cc-ref-cicd | Claude Code CI/CD reference — GitHub Actions, GitLab CI, Docker patterns |
| cc-ref-hooks | Claude Code hooks reference — lifecycle events, matchers, exit codes |
| cc-ref-mcp | Claude Code MCP reference — transport types, auth, configuration |
| cc-ref-multi-agent | Multi-agent system design reference — orchestration, routing, memory |
| cc-ref-output-styles | Claude Code output styles reference — frontmatter, formatting, tone |
| cc-ref-permissions | Claude Code permissions reference — permission rules, scoping, patterns |
| cc-ref-plugins | Claude Code plugins reference — plugin.json schema, packaging, marketplace |
| cc-ref-settings | Claude Code settings.json reference — configuration keys, scopes, defaults |
| cc-ref-skills | Claude Code skills reference — SKILL.md structure, triggers, tool restrictions |
| cc-ref-subagents | Claude Code subagents reference — agent frontmatter, models, tool access |
| scenario-library | Browseable cookbook of 40 pre-built Claude Code extension scenarios |

### Generator Skills (14 skills)

| Skill | Description |
|-------|-------------|
| agent-factory | Generates Claude Code agent .md files for application development specialists |
| cc-factory | Direct-access generator for Claude Code extensions from natural language |
| cicd-generator | Generates CI/CD pipeline configurations for Claude Code projects |
| hook-factory | Generates complete Claude Code hook configurations from descriptions |
| mcp-configurator | Generates correct MCP server configurations for common services |
| output-style-creator | Creates custom Claude Code output style files from descriptions |
| plugin-packager | Packages Claude Code components into distributable plugins |
| settings-architect | Generates complete Claude Code settings.json configurations |
| skill-factory | Generates complete Claude Code SKILL.md files from descriptions |
| dev-recipes | Browse and execute 86 pre-built recipes for application development agents |
| dev-team-concierge | Orchestrates application development agent team setup from project analysis |
| team-combo-engine | Assembles coordinated teams of application development agents |
| team-configurator | Auto-detects project tech stack and recommends optimal agent team composition |
| upgrade-scanner | Scans installed extensions for available upgrades and improvements |

### Routing and Diagnostic Skills (11 skills)

| Skill | Description |
|-------|-------------|
| dev-team-guide | Invisible router for application development agent requests |
| doc-sync | Fetches live documentation and checks for drift against reference skills |
| extension-auditor | Audits installed Claude Code extensions for quality and compliance |
| extension-combo-engine | Detects when a request requires multiple components and coordinates generation |
| extension-concierge | Orchestrator that turns natural language requests into complete extensions |
| extension-fixer | Diagnoses and repairs broken Claude Code extensions |
| extension-guide | Invisible router for Claude Code extension requests |
| extension-installer | Installs generated extensions into the correct project locations |
| intent-engine | Behavioral classification engine for Claude Code extension requests |
| setup-explainer | Explains your current Claude Code setup in plain language |
| smart-scaffold | Merged conversational scaffolding and progressive disclosure for extension creation |

---

## MCP Ecosystem Skills (7)

The MCP Ecosystem plugin provides agent lifecycle management and workspace governance.

| Skill | Description |
|-------|-------------|
| agent-design-patterns | Seven proven archetypes for subagent design — specialist, router, auditor, seeder, scaffolder, concierge, companion |
| frontmatter-reference | Complete YAML frontmatter schema for Claude Code agent .md files |
| mcp-catalog | Catalog of available MCP servers mapped to use cases and integration patterns |
| project-guide | Invisible router for project organization and specialist management — detects complexity, routes to setup or management workflows |
| subagent-companion | Day-to-day management interface for deployed subagent ecosystems — status, diagnosis, additions, removals |
| subagent-concierge | Non-technical entry point for Claude Code subagent setup — zero-question inference, template matching, progressive deployment |
| workspace-lifecycle-ref | Workspace command lifecycle reference — `/prime` and `/wrap` session bookends, state tracking conventions |

---

## Author

Built by [Pete Connor](https://www.linkedin.com/in/peteconnor/) — AI transformation leader, MS in AI.

## License

MIT
