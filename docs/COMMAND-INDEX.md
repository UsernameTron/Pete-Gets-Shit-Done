# GSD Command &amp; Automation Index

A one-line index of every slash command, internal workflow, and runtime hook in the get-shit-done execution engine. For full syntax, flags, options, and examples, see the detailed [Command Reference](COMMANDS.md).

**Inventory:** 67 slash commands &middot; 23 internal workflows &middot; 10 hooks. Generated from the live repository.

Items marked **`NEW`** shipped in the current unreleased cycle (the autonomous-workflows suite, on-demand ecosystem mapping, per-agent spawn telemetry, and two governance safety valves).

- Slash commands live in `commands/gsd/*.md`
- Workflows live in `get-shit-done/workflows/*.md`
- Hooks live in `hooks/*.js` (execution) and are registered in `.claude/settings.json` (governance)

A styled, theme-aware HTML version of this index is at [`COMMAND-INDEX.html`](COMMAND-INDEX.html). Run `/gsd:help` in any session for the interactive guide.

---

## New this cycle

| Item | Kind | What |
|------|------|------|
| `/gsd:do` | command | One front door that routes freeform text to the right command or a named autonomous flow |
| `/gsd:ecosystem-map` | command | On-demand lifecycle-clustered ecosystem map with drift history |
| `daily-startup` (W1) | workflow | One-intent session start: boot, dashboard, context restore, next command |
| `idea-to-shipped` (W2) | workflow | Freeform idea to shipped code, unattended, with two human gates |
| `bug-to-branch` (W3) | workflow | A pasted error to a shipped fix: debug, fix, full suite, ship |
| `quick-change` (W4) | workflow | One small change with verification impossible to skip, then a single gate |
| `wrap-and-sync` (W6) | workflow | Session wrap: coverage, doc-drift, handoff, lesson, checkpoint, report |
| `smart-discuss` (W5) | workflow | Batch-table discuss variant: accept or override proposed grey-area answers |
| `adopt-codebase` (W8) | workflow | Put an existing repo under GSD: map, auto-project, health, agents, accept gate |
| `ship-and-merge` (W9) | workflow | Verified phase to merged PR: verify, tests, PR gate, CI watch, merge gate |
| `quality-sweep` (W10) | workflow | Parallel read-only audits with one consolidated report and a single repair gate; `--deep` adds ecosystem checks |
| `frontend-phase` (W11) | workflow | UI phase end-to-end: UI-SPEC contract, plan gate, execute, visual audit, accept gate |
| `hardened-plan` (W12) | workflow | High-stakes planning with cross-AI review folded back in, two gates |
| `groom-backlog` (W13) | workflow | Unified triage of notes, todos, backlog, and seeds with one batch-confirm gate |
| `gsd-spawn-tracker` | hook | Per-agent subagent spawn telemetry to `~/.claude/metrics/spawns.jsonl` |
| `review-pending sentinel` | hook | Approves a dirty tree with a logged "Deferred review" instead of force-committing |

**Enhanced existing commands:** `/gsd:finalize` gained push-consent gating (`--yes-push` / `workflow.finalize_auto_push`); `/gsd:discuss-phase` gained `--auto` grey-area folding.

---

## Slash Commands

### Discuss &amp; Plan

| Command | Description |
|---------|-------------|
| `/gsd:discuss-phase` | Gather phase context through adaptive questioning before planning; `--auto` folds groundable grey areas. |
| `/gsd:list-phase-assumptions` | Surface Claude's assumptions about a phase approach before you commit to a plan. |
| `/gsd:plan-phase` | Create a detailed phase plan (`PLAN.md`) with a built-in verification loop. |
| `/gsd:research-phase` | Research how to implement a phase standalone; usually folded into plan-phase. |
| `/gsd:plan-milestone-gaps` | Create phases to close every gap a milestone audit identified. |

### Execute &amp; Verify

| Command | Description |
|---------|-------------|
| `/gsd:execute-phase` | Execute all plans in a phase with wave-based parallelization. |
| `/gsd:quick` | Run a quick task with GSD guarantees (atomic commits, state) but no optional agents. |
| `/gsd:fast` | Run a trivial task inline — no subagents, no planning overhead. |
| `/gsd:verify-work` | Validate built features through conversational UAT. |
| `/gsd:add-tests` | Generate tests for a completed phase from its UAT criteria and implementation. |
| `/gsd:validate-phase` | Retroactively audit and fill Nyquist validation gaps for a completed phase. |
| `/gsd:debug` | Systematic debugging with state that persists across context resets. |
| `/gsd:autonomous` | Run every remaining phase unattended: discuss to plan to execute, per phase. |

### Ship &amp; Release

| Command | Description |
|---------|-------------|
| `/gsd:ship` | Open a PR, run review, and prepare for merge once verification passes. |
| `/gsd:pr-branch` | Create a clean PR branch with the `.planning/` commits filtered out. |
| `/gsd:ci-watch` | Poll GitHub Actions for the branch, stream status, and diagnose failures. |
| `/gsd:review` | Request cross-AI peer review of phase plans from external AI CLIs. |
| `/gsd:finalize` | End-to-end finalization: verify, archive, report, push — now consent-gated on every push. |
| `/gsd:closeout` | Full project closeout: orient, audit, verify, capture, ship, finalize, polish. |

### Milestone Management

| Command | Description |
|---------|-------------|
| `/gsd:new-milestone` | Start a new milestone cycle and route into requirements. |
| `/gsd:complete-milestone` | Archive a completed milestone and prepare the next version. |
| `/gsd:audit-milestone` | Audit milestone completion against original intent before archiving. |
| `/gsd:milestone-summary` | Generate an onboarding-grade project summary from milestone artifacts. |
| `/gsd:add-phase` | Append a phase to the end of the current milestone's roadmap. |
| `/gsd:insert-phase` | Insert urgent work as a decimal phase (e.g. 72.1) between existing phases. |
| `/gsd:remove-phase` | Remove a future phase and renumber the phases after it. |
| `/gsd:cleanup` | Archive accumulated phase directories from completed milestones. |

### Workspaces &amp; Parallelism

| Command | Description |
|---------|-------------|
| `/gsd:new-workspace` | Create an isolated workspace with repo copies and its own `.planning/`. |
| `/gsd:list-workspaces` | List active GSD workspaces and their status. |
| `/gsd:remove-workspace` | Remove a workspace and clean up its git worktrees. |
| `/gsd:workstreams` | Manage parallel workstreams: create, switch, status, resume, complete. |
| `/gsd:manager` | Interactive command center for driving multiple phases from one terminal. |

### Research, Audit &amp; UI

| Command | Description |
|---------|-------------|
| `/gsd:map-codebase` | Map the codebase with parallel agents into `.planning/codebase/` documents. |
| `/gsd:crew` | Show the agent roster and capability map, and self-assess for coverage gaps. |
| `/gsd:audit-agents` | Audit the agent ecosystem for schema, tool, hygiene, naming, and install-drift issues. |
| `/gsd:audit-deps` | Audit package dependencies for CVEs, staleness, and license compatibility. |
| `/gsd:audit-uat` | Cross-phase audit of every outstanding UAT and verification item. |
| `/gsd:ecosystem-map` **`NEW`** | Regenerate the lifecycle-clustered ecosystem map with append-only drift history. |
| `/gsd:forensics` | Post-mortem a failed workflow from git history, artifacts, and planning state. |
| `/gsd:ui-phase` | Produce a UI design contract (`UI-SPEC.md`) for a frontend phase. |
| `/gsd:ui-review` | Retroactive six-pillar visual audit of implemented frontend code. |

### Session &amp; Navigation

| Command | Description |
|---------|-------------|
| `/gsd:prime-patterns` | Boot a session with full context plus the KB pattern library injected. |
| `/gsd:resume-work` | Resume from a previous session with full context restored. |
| `/gsd:pause-work` | Write a context handoff when pausing mid-phase. |
| `/gsd:progress` | Check progress, show context, and route to the next action. |
| `/gsd:next` | Advance automatically to the next logical step in the workflow. |
| `/gsd:do` **`NEW`** | Route freeform text to the right command — or a named autonomous flow. |
| `/gsd:session-report` | Generate a session report with token estimates, work summary, and outcomes. |
| `/gsd:stats` | Show project statistics: phases, plans, requirements, git metrics, timeline. |
| `/gsd:portfolio` | Cross-project dashboard that recommends what to work on next. |
| `/gsd:thread` | Manage persistent context threads for cross-session work. |
| `/gsd:profile-user` | Generate a developer behavioral profile as Claude-discoverable artifacts. |

### Capture &amp; Backlog

| Command | Description |
|---------|-------------|
| `/gsd:note` | Zero-friction idea capture: append, list, or promote a note to a todo. |
| `/gsd:add-todo` | Capture an idea or task as a todo from the current conversation. |
| `/gsd:check-todos` | List pending todos and pick one to work on. |
| `/gsd:add-backlog` | Park an idea in the backlog parking lot (999.x numbering). |
| `/gsd:review-backlog` | Review backlog items and promote them into the active milestone. |
| `/gsd:plant-seed` | Capture a forward-looking idea that surfaces at the right milestone. |

### Project &amp; Config

| Command | Description |
|---------|-------------|
| `/gsd:new-project` | Initialize a project with deep context gathering and a `PROJECT.md`. |
| `/gsd:settings` | Configure GSD workflow toggles and the model profile. |
| `/gsd:set-profile` | Switch the model profile for agents: quality, balanced, budget, or inherit. |
| `/gsd:health` | Diagnose `.planning/` integrity and optionally repair it. |
| `/gsd:update` | Update GSD to the latest version with a changelog display. |
| `/gsd:reapply-patches` | Reapply your local modifications after a GSD update. |
| `/gsd:sync-docs` | Rewrite all project docs from the live codebase, then report what changed. |
| `/gsd:help` | Show the available commands and a usage guide. |
| `/gsd:join-discord` | Join the GSD Discord community. |

---

## Internal Workflows

Engines invoked by commands or the `/gsd:do` router — no direct slash command of their own.

| Workflow | Description |
|----------|-------------|
| `daily-startup` **`NEW`** (W1) | One-intent session start: project boot, dashboard, context restore, and next command. |
| `idea-to-shipped` **`NEW`** (W2) | A freeform idea to shipped code, unattended, with exactly two human gates. |
| `bug-to-branch` **`NEW`** (W3) | A pasted error to a shipped fix: debug, fix, full suite, ship. |
| `quick-change` **`NEW`** (W4) | One small change with verification impossible to skip, then a single gate. |
| `wrap-and-sync` **`NEW`** (W6) | Session wrap: coverage, doc-drift, handoff, lesson capture, checkpoint, report. |
| `smart-discuss` **`NEW`** (W5) | Batch-table discuss variant: accept or override proposed grey-area answers. |
| `adopt-codebase` **`NEW`** (W8) | Put an existing repo under GSD: map, auto-project, health check, agent setup, accept gate. |
| `ship-and-merge` **`NEW`** (W9) | A verified phase to a merged PR: verify, tests, PR gate, CI watch, merge gate. |
| `quality-sweep` **`NEW`** (W10) | Parallel read-only audits, one consolidated report, single repair gate; `--deep` adds ecosystem checks. |
| `frontend-phase` **`NEW`** (W11) | A UI phase end-to-end: UI-SPEC contract, plan gate, execute, visual audit, accept gate. |
| `hardened-plan` **`NEW`** (W12) | High-stakes planning with cross-AI review folded back in, two gates. |
| `groom-backlog` **`NEW`** (W13) | Unified triage of notes, todos, backlog, and seeds with one batch-confirm gate. |
| `daily` | Formatted dashboard: milestone, phase, plan, branch, tests, next action. |
| `diagnose-issues` | Orchestrate parallel debug agents to find root causes — the `/gsd:debug` engine. |
| `discovery-phase` | Run early project discovery at the appropriate depth level. |
| `discuss-phase-assumptions` | Extract downstream decisions via codebase-first analysis; a discuss sub-flow. |
| `execute-plan` | Execute a single `PLAN.md` and write its `SUMMARY.md` — the unit execute-phase runs. |
| `verify-phase` | Verify phase-goal achievement through goal-backward analysis. |
| `transition` | Mark the current phase complete and advance, evolving `PROJECT.md`. |
| `checkpoint` | Write a deterministic session checkpoint to `.planning/CHECKPOINT.json`. |
| `resume-project` | Restore full project context instantly after time away. |
| `node-repair` | Autonomous repair operator for a failed task's done-criteria; called by execute-plan. |
| `harden-repo` | Audit and enforce GitHub branch-protection rules. |

---

## Hooks &amp; Automations

Runtime hooks that fire on Claude Code lifecycle events. Execution hooks ship bundled in `hooks/dist/`; governance hooks are registered per-project.

| Hook | Trigger | Description |
|------|---------|-------------|
| `gsd-spawn-tracker` **`NEW`** | PreToolUse | Logs every subagent spawn to `~/.claude/metrics/spawns.jsonl` for per-agent attribution. |
| `gsd-cost-tracker` | PostToolUse | Logs token usage and estimated USD cost per tool call. |
| `gsd-prompt-guard` | PreToolUse | Scans Write/Edit content for 23 prompt-injection patterns. |
| `gsd-config-protection` | PreToolUse | Blocks edits to 32 linter/formatter config files, steering back to the source. |
| `gsd-context-monitor` | PostToolUse | Warns as the context window fills toward its budget. |
| `gsd-check-update` | SessionStart | Checks for a newer GSD release on session start. |
| `gsd-statusline` | statusLine | Renders the terminal status line for the session. |
| `review-pending sentinel` **`NEW`** | Stop template | Approves a dirty tree with a logged "Deferred review" note when `.planning/.review-pending` exists, instead of force-committing. |
| `lesson-capture-gate` | Stop | Blocks stop until a lesson is captured or explicitly exempted. |
| `gsd-agent-health-check` | SubagentStop | Logs agent install drift on each subagent completion. |
