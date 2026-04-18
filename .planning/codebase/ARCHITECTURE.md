# Architecture

**Analysis Date:** 2026-04-18

## Pattern Overview

**Overall:** Meta-prompting framework with a CLI tool layer, markdown-driven workflow engine, and multi-agent orchestration system. The system is an npm package (`get-shit-done-cc`) that installs into AI coding assistants (Claude Code, Copilot, Gemini CLI, Codex, Cursor, Windsurf, etc.) and provides a spec-driven development pipeline.

**Key Characteristics:**
- Markdown-as-code: Commands, workflows, agents, and templates are all `.md` files interpreted by the AI runtime
- CLI tool layer (`gsd-tools.cjs`) provides deterministic operations (state management, config, git, validation)
- Layered module architecture with strict dependency direction (Layer 0 -> 3, never upward)
- Multi-runtime support: same workflow files install into 8+ AI coding assistants
- Plugin system for extending commands, agents, and skills beyond the core

## Component Diagram

```
User Input (/gsd:command)
        |
        v
+------------------+       +-------------------+
| Command Files    |------>| Workflow Files     |
| commands/gsd/*.md|       | get-shit-done/    |
| (slash commands) |       | workflows/*.md     |
+------------------+       +-------------------+
        |                          |
        | references               | calls via Bash
        v                          v
+------------------+       +-------------------+
| Agent Definitions|       | gsd-tools.cjs     |
| agents/*.md      |       | (CLI entry point) |
| (subagent specs) |       +-------------------+
+------------------+              |
                                  | dispatches to
                                  v
                    +---------------------------+
                    | lib/ Modules (23 files)   |
                    |---------------------------|
                    | Layer 0: model-profiles,  |
                    |          security          |
                    | Layer 1: core             |
                    | Layer 2: frontmatter,     |
                    |          config, state     |
                    | Layer 3: phase, milestone, |
                    |   roadmap, verify, init,   |
                    |   commands, workstream,     |
                    |   history, classify, uat,   |
                    |   uat-patterns, uat-runner, |
                    |   template, profile-*,      |
                    |   checkpoint, daily         |
                    +---------------------------+
                              |
                              v
                    +---------------------------+
                    | .planning/ Directory      |
                    | (Project State on Disk)   |
                    | STATE.md, ROADMAP.md,     |
                    | config.json, phases/,     |
                    | milestones/, quick/        |
                    +---------------------------+
```

## Layers

**Layer 0 -- Foundation:**
- Purpose: Pure utilities with no intra-project dependencies
- Location: `get-shit-done/bin/lib/model-profiles.cjs`, `get-shit-done/bin/lib/security.cjs`
- Contains: Model profile definitions (balanced/speed/quality/max), shell argument validation, input sanitization
- Depends on: Node.js stdlib only
- Used by: All higher layers

**Layer 1 -- Core Hub:**
- Purpose: Shared constants, error infrastructure, path resolution, git operations, output formatting
- Location: `get-shit-done/bin/lib/core.cjs` (1705 lines)
- Contains: `GsdError` class, `GSD_ERROR_CODES`, `planningDir()`, `planningPaths()`, `loadConfig()`, `resolveModelInternal()`, `execGit()`, `findProjectRoot()`, `resolveWorktreeRoot()`, debug logging, feature flags
- Depends on: `model-profiles.cjs`
- Used by: Every Layer 2 and Layer 3 module

**Layer 2 -- Domain:**
- Purpose: Structured data operations (frontmatter parsing, config CRUD, state management)
- Location: `get-shit-done/bin/lib/frontmatter.cjs`, `config.cjs`, `state.cjs`
- Contains: YAML-like frontmatter extraction/reconstruction, config key validation with suggestions, STATE.md field extraction and mutation
- Depends on: Layer 0 + Layer 1
- Used by: Layer 3 modules

**Layer 3 -- Application:**
- Purpose: High-level operations that compose lower layers into workflow-specific logic
- Location: `get-shit-done/bin/lib/` (17 modules)
- Modules:
  - `phase.cjs` — phase add/remove/complete operations
  - `milestone.cjs` — milestone archiving
  - `roadmap.cjs` — roadmap parsing
  - `verify.cjs` — verification suite
  - `init.cjs` — compound init commands
  - `commands.cjs` — git and command helpers
  - `workstream.cjs` — workstream isolation
  - `history.cjs` — session history
  - `classify.cjs` — task classification (v2.0 Intelligence Layer)
  - `uat.cjs` — UAT orchestration
  - `uat-patterns.cjs` — UAT pattern library (added Phase 54, post-v2.7)
  - `uat-runner.cjs` — automated UAT runner (added Phase 54, post-v2.7)
  - `template.cjs` — template scaffolding
  - `profile-output.cjs` — user profiling output
  - `profile-pipeline.cjs` — profiling pipeline
  - `checkpoint.cjs` — checkpoint engine (added Phase 52, post-v2.7)
  - `daily.cjs` — daily dashboard (added Phase 53, post-v2.7)
- Depends on: Layers 0-2
- Used by: `gsd-tools.cjs` CLI router

**Markdown Command Layer:**
- Purpose: Define slash commands that AI runtimes expose to users
- Location: `commands/gsd/*.md` (65 files)
- Contains: Frontmatter (name, description, allowed-tools, agent assignment), objective, execution context references, process instructions
- Depends on: Workflow files via `@` references
- Used by: AI runtime (Claude Code, Copilot, etc.)

**Workflow Layer:**
- Purpose: Detailed step-by-step execution instructions for each command
- Location: `get-shit-done/workflows/*.md` (59 files)
- Contains: Multi-step processes with `<step>` tags, runtime compatibility notes, agent type references, bash code blocks that invoke `gsd-tools.cjs`
- Depends on: `gsd-tools.cjs` CLI, agent definitions, reference docs
- Used by: Command files and agents

**Agent Layer:**
- Purpose: Define specialized AI subagents with focused expertise
- Location: `agents/*.md` (17 active agents, 8 archived in `agents/_archived/`)
- Contains: System prompts, tool restrictions, model assignments, detailed behavioral instructions
- Depends on: Workflow files, `gsd-tools.cjs`
- Used by: Workflow orchestrators via `Task(subagent_type="gsd-executor", ...)`

## Data Flow

**Command Execution Pipeline:**

1. User types `/gsd:execute-phase 30` in AI runtime
2. Runtime matches `commands/gsd/execute-phase.md`, reads frontmatter for tool permissions and agent assignment
3. Command file references `@~/.claude/get-shit-done/workflows/execute-phase.md`
4. Workflow calls `node gsd-tools.cjs init execute-phase 30` to load all context (config, state, phase info, plan inventory)
5. `gsd-tools.cjs` routes to `init.cmdInitExecutePhase()` which composes data from `core`, `config`, `state`, `phase` modules
6. Returns JSON with executor_model, plans, phase_dir, etc.
7. Workflow groups plans into dependency waves
8. For each wave, spawns `gsd-executor` subagent(s) with plan-specific context
9. Each executor reads its PLAN.md, executes tasks, writes SUMMARY.md, commits
10. Orchestrator collects results, updates STATE.md via `gsd-tools.cjs state update-progress`

**State Management Flow:**

1. `gsd-tools.cjs state load` reads `.planning/STATE.md` + `.planning/config.json`
2. State mutations go through `gsd-tools.cjs state update <field> <value>` or `state patch`
3. Phase progression: `state begin-phase` -> `state advance-plan` -> `state update-progress`
4. Decisions and blockers appended via `state add-decision` / `state add-blocker`
5. Session continuity via `state record-session --stopped-at "..."`

**Installation Flow:**

1. `npx get-shit-done-cc@latest` runs `bin/install.js` (5241 lines)
2. Detects target runtimes (Claude, Copilot, Gemini, Codex, Cursor, Windsurf, etc.)
3. Copies workflow files, command files, agent definitions, templates, references to runtime-specific directories
4. For non-Claude runtimes: converts tool names (e.g., `Read` -> `read` for Copilot), adjusts agent config format
5. Optionally scaffolds `.planning/` directory structure
6. Optionally installs plugins and governance hooks

**Model Resolution Flow:**

1. Config holds `model_profile` (balanced/speed/quality/max) and optional `routing_strategy`
2. `resolveModelInternal(agentType, config, taskContext)` maps agent type to model
3. Static routing: direct profile lookup. Dynamic routing: `classify.cjs` analyzes task complexity signals (plan count, requirement count, phase name)
4. Returns model string (e.g., "sonnet", "opus", "haiku")

## Key Abstractions

**Planning Directory (`.planning/`):**
- Purpose: On-disk project state that persists across sessions
- Examples: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/config.json`, `.planning/phases/30-dynamic-model-selection/`
- Pattern: Markdown files with frontmatter for structured data, JSON for config

**Phase:**
- Purpose: Unit of work in a milestone, containing one or more plans
- Examples: `.planning/phases/30-dynamic-model-selection/`, `.planning/milestones/v2.0-phases/30-dynamic-model-selection/`
- Pattern: Directory named `{number}-{slug}/` containing `*-PLAN.md` and `*-SUMMARY.md` files

**Plan (PLAN.md):**
- Purpose: Executable specification for a single task within a phase
- Pattern: Frontmatter (wave, dependencies, must_haves) + structured task list with acceptance criteria

**Summary (SUMMARY.md):**
- Purpose: Outcome record for a completed plan
- Pattern: Frontmatter (status, duration, files_changed) + what was done, decisions made, verification results

**Config (`config.json`):**
- Purpose: Project-level GSD behavior settings
- Key fields: `mode` (yolo/default/interactive), `granularity`, `parallelization`, `model_profile`, `routing_strategy`, `git.branching_strategy`, `workflow.*` toggles

**Workstream:**
- Purpose: Parallel work isolation within a project
- Pattern: `GSD_WORKSTREAM` env var or `.planning/active-workstream` file redirects all `.planning/` paths to `.planning/workstreams/{name}/`

## Entry Points

**`bin/install.js` (npm postinstall):**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc@latest`, `npm install -g get-shit-done-cc`
- Responsibilities: Multi-runtime installer -- copies files, converts formats, scaffolds projects, installs plugins

**`bin/setup-from-clone.js` (dev setup):**
- Location: `bin/setup-from-clone.js`
- Triggers: Manual invocation by contributors cloning the repo
- Responsibilities: Developer environment setup without npm publish cycle

**`get-shit-done/bin/gsd-tools.cjs` (CLI tool):**
- Location: `get-shit-done/bin/gsd-tools.cjs` (1052 lines)
- Triggers: Called by workflow markdown files via `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command> [args]`
- Responsibilities: CLI router that dispatches to lib/ modules. Handles `--raw`, `--pick`, `--cwd`, `--ws` flags. All structured operations go through here.

**`commands/gsd/*.md` (slash commands):**
- Location: `commands/gsd/` (65 command files)
- Triggers: User typing `/gsd:command-name` in AI runtime
- Responsibilities: Define the user-facing command interface, tool permissions, agent delegation, and reference the workflow to execute

**`hooks/dist/*.js` (lifecycle hooks):**
- Location: `hooks/dist/` (6 compiled hooks — 1 more than documented pre-v2.7)
- Triggers: Claude Code hook events (PreToolUse, PostToolUse, SessionStart, etc.)
- Responsibilities:
  - `gsd-check-update.js` — version check
  - `gsd-context-monitor.js` — token tracking
  - `gsd-prompt-guard.js` — input validation (18 injection patterns)
  - `gsd-statusline.js` — status display
  - `gsd-config-protection.js` — config file protection (32 protected files, added v2.3)
  - `gsd-cost-tracker.js` — JSONL cost metrics (added v2.3)

## Error Handling

**Strategy:** Typed error codes with structured GsdError class

**Patterns:**
- All errors use `GsdError(code, message, { context, cause })` with codes from `GSD_ERROR_CODES` enum
- `error()` function in `core.cjs` writes JSON to stderr and exits with code 1
- `output()` function writes JSON to stdout (fd 1) via `fs.writeSync` for reliable capture
- Debug logging via `debugLog(code, details)` gated on `GSD_DEBUG` env var, writes to stderr (fd 2)
- Mutation safety audits documented inline (e.g., CORR-06 in `state.cjs`) verifying no shared state mutation

## Cross-Cutting Concerns

**Logging:** Debug diagnostics via `debugLog()` to stderr when `GSD_DEBUG` is set. Production output is JSON to stdout via `fs.writeSync(1, ...)`.

**Validation:** `security.cjs` provides `validateShellArg()` for shell injection prevention. Config keys validated against `VALID_CONFIG_KEYS` set with typo suggestions. Frontmatter validated against schemas (plan/summary/verification). Architecture layering enforced by `tests/architecture.test.cjs`. Prompt injection detection uses patterns from `lib/injection-patterns.json`.

**Authentication:** Not applicable -- GSD is a local development tool. No network auth. Optional Brave Search API key for web search feature.

**Multi-Runtime Compatibility:** Workflow files include `<runtime_compatibility>` sections. Install converts Claude-specific tool names to runtime equivalents. Copilot uses `@agent` invocation instead of `Task()`. Sequential fallback when subagent completion signals are unreliable.

**Git Integration:** `execGit()` and `execGitValidated()` in core/commands modules. Branching strategies configurable (phase-branch, milestone-branch, quick-branch templates). Commit operations for planning docs separate from code commits.

## Plugin System

**Structure:**
- Plugins live in `plugins/` directory, each with its own commands, skills, and agents
- Two bundled plugins: `claude-mcp-ecosystem` (session management, agent routing) and `claude-code-factory` (extension generation)

**Plugin: claude-mcp-ecosystem:**
- Location: `plugins/claude-mcp-ecosystem/`
- Contains: Commands, skills, workspace-ops, subagent-lifecycle, context docs
- Purpose: Session initialization, agent CRUD, workspace isolation

**Plugin: claude-code-factory:**
- Location: `plugins/claude-code-factory/`
- Contains: 1 agent (`extension-builder.md`), 1 skill directory (`extension-guide`)
- Purpose: Generate new GSD extensions (skills, agents, commands)

**Governance System:**
- Location: `governance/`
- Contains: `scripts/` (health-check, plugin install, project scaffold), `templates/` (project/global config), `tests/` (integration tests for governance)
- Purpose: Project bootstrapping, health validation, plugin installation

## Static Data

**`lib/` (top-level):**
- Location: `lib/injection-patterns.json`, `lib/ci-patterns.json`
- Purpose: Pattern data loaded by hooks and security modules at runtime — not CJS modules, pure JSON

---

*Architecture analysis: 2026-04-18*
