# Architecture

**Analysis Date:** 2026-07-12

## Pattern Overview

**Overall:** Meta-prompting framework with a CLI tool layer, markdown-driven workflow engine, and multi-agent orchestration system. The system is an npm package (`get-shit-done-cc`, currently v1.30.0) that installs into AI coding assistants (Claude Code, OpenCode, Codex, Copilot, Antigravity, Cursor, Windsurf, Gemini CLI — 8 runtimes) and provides a spec-driven development pipeline.

**Key Characteristics:**
- Markdown-as-code: commands, workflows, agents, and templates are all `.md` files interpreted by the AI runtime — the "program" is prose with embedded bash/JS snippets, not compiled code
- CLI tool layer (`gsd-tools.cjs`) provides deterministic operations (state management, config, git, validation) that workflows call out to via `Bash`, keeping non-deterministic reasoning (the LLM) and deterministic bookkeeping (Node.js) cleanly separated
- Layered module architecture with a strict, test-enforced dependency direction (Layer 0 → 3, never upward) — see `tests/architecture.test.cjs`
- Multi-runtime support: the same workflow files install into 8 different AI coding assistants via a single 5300-line installer (`bin/install.js`)
- GSD itself is **not** a declarative Claude Code plugin — there is no root `.claude-plugin/plugin.json`; it installs imperatively by copying files and mutating the target's `.claude/settings.json`. It bundles two sub-packages under `plugins/` that *are* declarative Claude Code plugins (`.claude-plugin/plugin.json` + manifest)

## Component Diagram

```
User Input (/gsd:command)
        |
        v
+------------------+       +-------------------+
| Command Files    |------>| Workflow Files     |
| commands/gsd/*.md|       | get-shit-done/    |
| (67 files)       |       | workflows/*.md     |
+------------------+       | (66 files)         |
        |                  +-------------------+
        | references               |
        v                          | calls via Bash
+------------------+               v
| Agent Definitions|       +-------------------+
| agents/*.md      |       | gsd-tools.cjs     |
| (17 active +     |       | (CLI entry point, |
|  8 archived)     |       |  1023 lines)      |
+------------------+       +-------------------+
        ^                          |
        | Task(subagent_type=...)  | dispatches to
        |                          v
        |            +---------------------------+
        |            | lib/ Modules (24 files,   |
        +------------| 14,076 LOC)               |
     spawned by       |---------------------------|
     workflow steps    | Layer 0: model-profiles,  |
                        |   security, classify      |
                        | Layer 1: core             |
                        | Layer 2: frontmatter,     |
                        |   config, state, history   |
                        | Layer 3: 16 remaining       |
                        |   modules, computed by      |
                        |   elimination (see below)    |
                        +-------------------------------+
                                  |
                                  v
                    +---------------------------+
                    | .planning/ Directory      |
                    | (Project State on Disk)   |
                    | STATE.md, ROADMAP.md,     |
                    | config.json, milestones/, |
                    | quick/, research/          |
                    +---------------------------+
```

**Two entry paths into `lib/`, not one:** most workflow steps call `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command>` (the CLI router above). A second, smaller path bypasses the router entirely: `get-shit-done/workflows/daily.md`, `daily-startup.md`, `checkpoint.md`, and `wrap-and-sync.md` inline `node -e "require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs')..."` (and `lib/checkpoint.cjs`) directly. Both modules are pure read/compute-and-print helpers with no CLI dispatch case of their own — `daily.cjs` is pulled in transitively by `checkpoint.cjs`'s consumer, not the other way around. See Data Flow.

## Layers

The dependency layering below is **test-enforced**, not aspirational — `tests/architecture.test.cjs` builds a layer map from an explicit `LAYERS` constant (layers 0–2) and treats every other `.cjs` file in `get-shit-done/bin/lib/` as Layer 3 by elimination. It then asserts: `core.cjs` requires nothing but `model-profiles.cjs`; no circular requires exist between any pair of modules; every file is assigned a layer; and no file requires a module in a higher-numbered layer. This is the ground truth used below — it corrects two module placements from earlier analyses (`classify.cjs` and `history.cjs`, see notes).

**Layer 0 -- Foundation:**
- Purpose: Pure utilities with no intra-project dependencies
- Location: `get-shit-done/bin/lib/model-profiles.cjs`, `get-shit-done/bin/lib/security.cjs`, `get-shit-done/bin/lib/classify.cjs`
- Contains: Model profile definitions (balanced/speed/quality/max) and `dynamicSelect()`, shell/path/JSON validation + prompt-injection scanning, task-complexity classification (`classifyTask`, `extractSignals`, `adaptWorkflowGates`)
- Depends on: Node.js stdlib only — `classify.cjs` has zero `require('./...')` statements at all; `security.cjs` loads `lib/injection-patterns.json` as data, not a module
- Used by: All higher layers. Note: `classify.cjs` is grouped under the "v2.0 Intelligence Layer" feature name in project docs alongside `model-profiles.cjs` and `history.cjs` — that is a *feature* grouping, distinct from this dependency-layer grouping; `history.cjs` is actually Layer 2 (below)

**Layer 1 -- Core Hub:**
- Purpose: Shared constants, error infrastructure, path resolution, git operations, output formatting, model resolution
- Location: `get-shit-done/bin/lib/core.cjs` (1705 lines)
- Contains: `GsdError` class, `GSD_ERROR_CODES` enum (18 codes: `CANCELLED`, `CONFIG_READ/PARSE/MIGRATE/WRITE`, `STATE_READ/WRITE`, `PHASE_READ/WRITE`, `LOCK_ACQUIRE/STALE`, `GIT_EXEC`, `FILE_READ/WRITE`, `PARSE_ERROR`, `COMMAND_DISPATCH`, `TEMPLATE_RENDER`, `VALIDATION`), `planningDir()`, `planningPaths()`, `loadConfig()`, `resolveModelInternal(cwd, agentType, taskContext)`, `execGit()`, `findProjectRoot()`, `resolveWorktreeRoot()`, debug logging, `output()`/`error()`
- Depends on: `model-profiles.cjs` only (enforced by the architecture test)
- Used by: Every Layer 2 and Layer 3 module

**Layer 2 -- Domain:**
- Purpose: Structured data operations (frontmatter parsing, config CRUD, state management, session history)
- Location: `get-shit-done/bin/lib/frontmatter.cjs`, `config.cjs`, `state.cjs` (1046 LOC), `history.cjs`
- Contains: `FRONTMATTER_SCHEMAS` (required fields for `plan`/`summary`/`verification` frontmatter — e.g. plan requires `phase, plan, type, wave, depends_on, files_modified, autonomous, must_haves`), config key validation with typo suggestions, STATE.md field extraction/mutation, SUMMARY.md history aggregation (`history.cjs` requires only `core.cjs`, confirming its Layer 2 placement)
- Depends on: Layer 0 + Layer 1
- Used by: Layer 3 modules

**Layer 3 -- Application:**
- Purpose: High-level operations that compose lower layers into workflow-specific logic. Membership is computed by elimination in the architecture test, not hand-maintained — any new `.cjs` file dropped into `get-shit-done/bin/lib/` defaults to Layer 3 unless explicitly added to the `LAYERS` map for 0–2
- Location: `get-shit-done/bin/lib/` (16 modules)
- Modules:
  - `init.cjs` (2101 LOC, largest module) — compound init commands for every workflow; lazily requires `classify.cjs` when `config.adaptive` is set
  - `phase.cjs` (887 LOC) — phase add/insert/remove/complete operations
  - `milestone.cjs` — milestone archiving
  - `roadmap.cjs` — roadmap parsing
  - `verify.cjs` (888 LOC) — verification suite (plan-structure, phase-completeness, references, artifacts, key-links)
  - `commands.cjs` (986 LOC) — git helpers including `execGitValidated()`, utility commands
  - `workstream.cjs` (507 LOC) — workstream isolation
  - `uat.cjs`, `uat-patterns.cjs`, `uat-runner.cjs` — UAT orchestration; `uat-runner.cjs` requires `uat-patterns.cjs`
  - `template.cjs` — template scaffolding
  - `profile-output.cjs` (952 LOC) — user/crew profiling rendering
  - `profile-pipeline.cjs` (539 LOC) — profiling pipeline
  - `checkpoint.cjs` — checkpoint engine (writes `CHECKPOINT.json`)
  - `daily.cjs` — daily dashboard; requires `checkpoint.cjs` (`readCheckpoint`, `scanPlanStatus`)
  - `harden-repo.cjs` — branch-protection audit/fix via GitHub API read-merge-PUT
- Depends on: Layers 0-2
- Used by: `gsd-tools.cjs` CLI router (14 modules required eagerly at top of file: `core`, `state`, `phase`, `roadmap`, `verify`, `config`, `template`, `milestone`, `commands`, `init`, `frontmatter`, `profile-pipeline`, `profile-output`, `workstream`; 5 more required lazily inside specific dispatch cases: `security.cjs`, `harden-repo.cjs`, `history.cjs`, `uat.cjs`, `uat-runner.cjs`); `classify.cjs`, `checkpoint.cjs`, `uat-patterns.cjs`, `model-profiles.cjs` are never required directly by `gsd-tools.cjs` — only transitively through other lib modules

**Markdown Command Layer:**
- Purpose: Define slash commands that AI runtimes expose to users
- Location: `commands/gsd/*.md` (67 files)
- Contains: Frontmatter (`name`, `description`, `allowed-tools`, optional `argument-hint`), an `<objective>`, an `<execution_context>` block with hardcoded `@~/.claude/get-shit-done/...` references, and a `<context>`/instructions body
- Depends on: Workflow files via `@` references — every command routes to a matching file under `get-shit-done/workflows/`
- Used by: AI runtime (Claude Code, Copilot, etc.). `bin/install.js` sources its command payload exclusively from this top-level directory (`path.join(src, 'commands', 'gsd')`) — never from `get-shit-done/commands/gsd/` (see Structure notes on that directory)

**Workflow Layer:**
- Purpose: Detailed step-by-step execution instructions for each command
- Location: `get-shit-done/workflows/*.md` (66 files)
- Contains: Multi-step processes with `<step>` tags, runtime-compatibility notes (e.g. "Task tool unavailable → sequential fallback"), agent-type references, bash code blocks that invoke `gsd-tools.cjs`
- Depends on: `gsd-tools.cjs` CLI, agent definitions, reference docs under `get-shit-done/references/`
- Used by: Command files and orchestrating agents

**Agent Layer:**
- Purpose: Define specialized AI subagents with focused expertise and bounded write scope
- Location: `agents/*.md` (17 active, 8 archived in `agents/_archived/`)
- Contains: Frontmatter (`name`, `description`, `tools`, `model`, `permissionMode: acceptEdits`, `isolation: worktree`, `maxTurns`, `color`, a `# Tier:` comment), then role/scope-guard/anti-pattern/process instructions. Every active agent frontmatter observed uses `isolation: worktree` — subagents execute in an isolated git worktree, not the orchestrator's working tree
- Model distribution across the 17 active agents: opus × 3 (`gsd-debugger`, `gsd-planner`, `gsd-verifier` — the highest-stakes roles), sonnet × 9, haiku × 5
- Tier distribution (`# Tier:` comment): Explore × 4, Inspect × 1, Modify × 9, Research × 3
- Depends on: Workflow files, `gsd-tools.cjs`
- Used by: Workflow orchestrators via `Task(subagent_type="gsd-executor", ...)`

## Data Flow

**Command Execution Pipeline:**

1. User types `/gsd:execute-phase 30` in AI runtime
2. Runtime matches `commands/gsd/execute-phase.md`, reads frontmatter for tool permissions (`Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, AskUserQuestion`)
3. Command file's `<execution_context>` references `@~/.claude/get-shit-done/workflows/execute-phase.md` and `@~/.claude/get-shit-done/references/ui-brand.md`
4. Workflow calls `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE_ARG}"` to load all context (config, state, phase info, plan inventory) in one shot
5. `gsd-tools.cjs` routes to `init.cmdInitExecutePhase()` (in `init.cjs`, Layer 3) which composes data from `core`, `config`, `state`, `phase`, and — if `config.adaptive` is set — `classify.cjs`
6. Returns JSON with `executor_model`, `plans`, `phase_dir`, etc., via `output()` — payloads over 50KB are spilled to a tempfile and returned as `@file:/tmp/gsd-xxxx.json`; every workflow that calls `gsd-tools.cjs init ...` checks for that prefix and `cat`s the file instead of parsing the inline string (this exact check appears at the top of `map-codebase.md`: `if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi`)
7. Workflow groups plans into dependency waves
8. For each wave, spawns `gsd-executor` subagent(s) (`isolation: worktree`) with plan-specific context
9. Each executor reads its PLAN.md, executes tasks, writes SUMMARY.md, commits
10. Orchestrator collects results, updates STATE.md via `gsd-tools.cjs state update-progress`

**Direct-Require Flow (bypasses the CLI router):**

1. `get-shit-done/workflows/daily.md` and `checkpoint.md` do not call `gsd-tools.cjs` — they inline `node -e "const { gatherDailyState } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs'); ..."` directly against the compiled lib file
2. `daily.cjs` exports `gatherDailyState()`, `determineNextAction()`, `formatDashboard()` — reads `CHECKPOINT.json` first, falls back to `STATE.md`
3. `checkpoint.cjs` exports `writeCheckpoint()`, called from `wrap-and-sync.md` and `checkpoint.md` the same way
4. This is a deliberate second control-flow path for read-mostly, low-latency dashboard/checkpoint operations — it skips the router's arg-parsing and `--cwd`/`--ws` resolution, so callers pass `.planning` (or an equivalent path) directly as a function argument instead

**State Management Flow:**

1. `gsd-tools.cjs state load` reads `.planning/STATE.md` + `.planning/config.json`
2. State mutations go through `gsd-tools.cjs state update <field> <value>` or `state patch`
3. Phase progression: `state begin-phase` → `state advance-plan` → `state update-progress`
4. Decisions and blockers appended via `state add-decision` / `state add-blocker`
5. Session continuity via `state record-session --stopped-at "..."`

**Installation Flow:**

1. `npx get-shit-done-cc@latest` runs `bin/install.js` (5300 lines)
2. Detects target runtime from CLI flag/map: `claude` (default), `opencode`, `codex`, `copilot`, `antigravity`, `cursor`, `windsurf`, `gemini` — 8 supported runtimes
3. Copies workflow files, command files (`commands/gsd/`, never `get-shit-done/commands/gsd/`), agent definitions, templates, references, and `hooks/dist/*.js` to runtime-specific directories
4. For non-Claude runtimes: converts tool names (e.g., `Read` → `read` for Copilot), flattens `commands/gsd/*.md` into `command/gsd-*.md` for OpenCode, adjusts agent config format
5. Writes hook wiring into the target's `.claude/settings.json` (sourced from `governance/templates/global/settings-hooks.json`)
6. Optionally scaffolds `.planning/` directory structure and installs the bundled plugins

**Model Resolution Flow:**

`resolveModelInternal(cwd, agentType, taskContext)` in `core.cjs` resolves in strict precedence order:

1. `config.model_overrides[agentType]` — an explicit user override always wins, regardless of routing strategy
2. `config.resolve_model_ids === 'omit'` → returns `''` so the runtime falls back to its own configured default (set automatically during install for non-Claude runtimes that don't recognize Claude model aliases)
3. Dynamic routing — only when `taskContext` is supplied AND `config.routing_strategy !== 'static'`: lazily requires `model-profiles.cjs`'s `dynamicSelect(agentType, taskContext, config)`; `taskContext.complexity === 'critical'` forces the quality tier regardless of the computed tier; routing rationale is written via `debugLog('MODEL_ROUTE', ...)`
4. Static profile lookup (default/fallback) — `MODEL_PROFILES[agentType][config.model_profile || 'balanced']`, itself falling back to `'balanced'` then the literal string `'sonnet'`

If `config.resolve_model_ids` is truthy, the resolved alias is mapped through `MODEL_ALIAS_MAP` (`opus → claude-opus-4-0`, `sonnet → claude-sonnet-4-5`, `haiku → claude-haiku-3-5`) before being returned, to prevent 404s when the alias is passed directly to the Task tool.

`taskContext` itself, when present, is produced by `classify.cjs`'s `classifyTask(phaseInfo, planInventory, context)` — called from `init.cjs` only when `config.adaptive` is set, feeding signals like phase/plan counts and prior failure rate into `extractSignals()` and `_scoreSignal()`.

## Key Abstractions

**Planning Directory (`.planning/`):**
- Purpose: On-disk project state that persists across sessions
- Examples: `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/config.json`, `.planning/milestones/v2.8-phases/57-backfill-and-ci-integration/`
- Pattern: Markdown files with YAML frontmatter for structured data, JSON for config

**Phase:**
- Purpose: Unit of work in a milestone, containing one or more plans
- Examples: `.planning/milestones/v2.8-phases/55-internal-link-validator/`, `.planning/milestones/v2.8-phases/56-doc-drift-detector/`
- Pattern: Directory named `{number}-{slug}/` containing `*-PLAN.md` and `*-SUMMARY.md` files. Active (unshipped) phases live under `.planning/phases/`; once a milestone ships, `gsd-tools.cjs milestone complete --archive-phases` moves the phase directories into `.planning/milestones/v{X.Y}-phases/`. As of this analysis no milestone is in flight, so `.planning/phases/` does not currently exist on disk — it is created on demand

**Plan (PLAN.md):**
- Purpose: Executable specification for a single task within a phase
- Pattern: Frontmatter validated against `FRONTMATTER_SCHEMAS.plan` (`phase, plan, type, wave, depends_on, files_modified, autonomous, must_haves`) + structured task list with acceptance criteria

**Summary (SUMMARY.md):**
- Purpose: Outcome record for a completed plan
- Pattern: Frontmatter validated against `FRONTMATTER_SCHEMAS.summary` (`phase, plan, subsystem, tags, duration, completed`) + what was done, decisions made, verification results

**Config (`config.json`):**
- Purpose: Project-level GSD behavior settings, read by `loadConfig(cwd)` in `core.cjs`
- Key fields: `mode` (yolo/default/interactive), `granularity`, `parallelization`, `model_profile`, `model_overrides`, `routing_strategy`, `resolve_model_ids`, `adaptive`, `git.branching_strategy`, `workflow.*` toggles
- Migration: `CONFIG_VERSION = 2`; `configMigrations` array applies versioned transforms (e.g. deprecated `depth` key → `granularity`) on load

**Workstream:**
- Purpose: Parallel work isolation within a project
- Pattern: Resolution precedence in `gsd-tools.cjs` is `--ws` CLI flag → `GSD_WORKSTREAM` env var → `.planning/active-workstream` file → `null` (flat mode). When active, all `.planning/` paths in `core.cjs`'s `planningDir()`/`planningPaths()` redirect to `.planning/workstreams/{name}/`

## Entry Points

**`bin/install.js` (npm postinstall):**
- Location: `bin/install.js` (5300 lines)
- Triggers: `npx get-shit-done-cc@latest`, `npm install -g get-shit-done-cc`
- Responsibilities: Multi-runtime installer — copies files, converts formats, scaffolds projects, writes hook wiring, installs bundled plugins

**`bin/setup-from-clone.js` (dev setup):**
- Location: `bin/setup-from-clone.js` (334 lines)
- Triggers: `npm run setup`, manual invocation by contributors cloning the repo
- Responsibilities: Developer environment setup without the npm publish cycle

**`get-shit-done/bin/gsd-tools.cjs` (CLI tool):**
- Location: `get-shit-done/bin/gsd-tools.cjs` (1023 lines)
- Triggers: Called by workflow markdown files via `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" <command> [args]`
- Responsibilities: CLI router that dispatches to `lib/` modules. Handles `--raw`, `--pick`, `--cwd`, `--ws` flags globally before dispatch. All structured operations except the daily/checkpoint direct-require path (above) go through here

**`commands/gsd/*.md` (slash commands):**
- Location: `commands/gsd/` (67 command files)
- Triggers: User typing `/gsd:command-name` in AI runtime
- Responsibilities: Define the user-facing command interface, tool permissions, and reference the workflow to execute

**`hooks/dist/*.js` (lifecycle hooks):**
- Location: `hooks/dist/` (6 esbuild-compiled hooks, built from `hooks/*.js` source via `npm run build:hooks` / `scripts/build-hooks.js`; shipped to npm per `package.json`'s `files` list)
- Triggers: Claude Code hook events (PreToolUse, PostToolUse, SessionStart, etc.), wired into a consumer's `.claude/settings.json` during install
- Responsibilities:
  - `gsd-check-update.js` — version check
  - `gsd-context-monitor.js` — token tracking
  - `gsd-prompt-guard.js` — input validation against 23 regex patterns in `lib/injection-patterns.json`
  - `gsd-statusline.js` — status display
  - `gsd-config-protection.js` — blocks edits to 32 named lint/format config files (`PROTECTED_FILES` set in `hooks/gsd-config-protection.js`, verified by direct count)
  - `gsd-cost-tracker.js` — JSONL cost metrics

**CI workflows (`.github/workflows/*.yml`):**
- Location: `.github/workflows/test.yml`, `security-scan.yml`, `auto-label-issues.yml`
- Triggers: `test.yml` on push/PR to `main` + `workflow_dispatch` (3 jobs: `test` matrix of `{ubuntu-latest/20/full}`, `{ubuntu-latest/22/full}`, `{macos-latest/22/partial}`; `governance`; `docs-integrity`); `security-scan.yml` on PR to `main`; `auto-label-issues.yml` on issue opened
- Responsibilities: `test` job runs the suite with coverage and `scripts/check-doc-drift.cjs`; `governance` runs the shell-script governance tests; `docs-integrity` runs `scripts/validate-doc-links.cjs`. All three plus `governance` and `docs-integrity` are required status checks on `main` per branch protection

## Error Handling

**Strategy:** Typed error codes via a structured `GsdError` class for internal error handling, backed by a minimal plain-text CLI failure path for top-level dispatch failures.

**Patterns:**
- Internal errors use `new GsdError(code, message, { context, cause })` with `code` drawn from `GSD_ERROR_CODES` (18 values, see Layer 1)
- The CLI-level `error(message)` function in `core.cjs` writes a **plain string** `'Error: ' + message + '\n'` to stderr (fd 2, via `fs.writeSync`) and calls `process.exit(1)` — it is not JSON-structured
- The success-path counterpart, `output(result, raw, rawValue)`, JSON-serializes to stdout via `fs.writeSync(1, ...)` (chosen over `process.stdout.write()` because the latter is async on a pipe and can be torn down by `process.exit()` before the reader drains it); payloads exceeding 50,000 characters are written to a tempfile and the path is returned prefixed `@file:` for the caller to `cat`
- Debug logging via `debugLog(code, message, context)` gated on the `GSD_DEBUG` env var, writes to stderr (fd 2)

## Cross-Cutting Concerns

**Logging:** Debug diagnostics via `debugLog()` to stderr when `GSD_DEBUG` is set. Production output is JSON to stdout via `fs.writeSync(1, ...)`.

**Validation:** `security.cjs` (Layer 0) exports `validatePath()`, `requireSafePath()`, `scanForInjection()`, `sanitizeForPrompt()`, `sanitizeForDisplay()`, `validateShellArg()`, `safeJsonParse()`, `validatePhaseNumber()`, `validateFieldName()`. Config keys validated against a known-key set with typo suggestions. Frontmatter validated against `FRONTMATTER_SCHEMAS` (plan/summary/verification — see Key Abstractions). Module dependency direction enforced by `tests/architecture.test.cjs` (see Layers). Prompt-injection detection driven by 23 patterns in `lib/injection-patterns.json` (top-level `lib/`, not `get-shit-done/bin/lib/`).

**Authentication:** Not applicable — GSD is a local development tool with no network auth. Optional Brave Search API key for the `gsd-tools.cjs websearch` feature.

**Multi-Runtime Compatibility:** Workflow files include runtime-compatibility notes (e.g., "if `Task` tool unavailable, fall back to sequential in-context mapping" — see `get-shit-done/workflows/map-codebase.md`). `bin/install.js` converts Claude-specific tool names to runtime equivalents and reshapes command/agent layout per target (OpenCode flattens to `command/gsd-*.md`; Codex uses `skills/`).

**Git Integration:** `execGit()` in `core.cjs` (Layer 1) for simple operations; `execGitValidated()` in `commands.cjs` (Layer 3) for branch-create/checkout/stage operations needing extra validation. Branching strategies configurable via `config.git.branching_strategy`. Commit operations for planning docs (`gsd-tools.cjs commit "msg" --files ...`) are separate from code commits made by executor agents.

## Plugin System

**Structure:**
- GSD core is installed imperatively by `bin/install.js`, not as a declarative plugin — there is no `.claude-plugin/plugin.json` at the repo root, and `bin/install.js` never references one
- Two genuine, declarative Claude Code plugins live under `plugins/`, each with its own `.claude-plugin/plugin.json`: `claude-mcp-ecosystem` also ships a `.claude-plugin/marketplace.json`

**Plugin: claude-mcp-ecosystem (v2.0.0):**
- Location: `plugins/claude-mcp-ecosystem/`
- Contains: 9 commands (`commands/`), 7 skills (`skills/agent-design-patterns`, `frontmatter-reference`, `mcp-catalog`, `project-guide`, `subagent-companion`, `subagent-concierge`, `workspace-lifecycle-ref`), a `subagent-lifecycle/` subsystem (its own `agents/`, `docs/`, `references/`, `scripts/`, `templates/`), `workspace-ops/` (`hooks/`, `scripts/`)
- Purpose: Session initialization (`/prime`, `/wrap`), agent lifecycle CRUD, workspace isolation

**Plugin: claude-code-factory (v1.0.0):**
- Location: `plugins/claude-code-factory/`
- Contains: 1 agent (`extension-builder.md`), 38 skill directories (extension generation, hook/skill/agent factories, CI/CD generation, reference skills prefixed `cc-ref-*`)
- Purpose: Generate new GSD extensions (skills, agents, commands, hooks, MCP configs)

**Governance System:**
- Location: `governance/`
- Contains: `scripts/` (`health-check.sh`, `install-plugins.sh`, `scaffold-project.sh`), `templates/context/` (6 on-demand reference docs like `cli-reference.md`, `subagent-guide.md`), `templates/global/` (bootstrap `CLAUDE.md` + `settings-hooks.json` + `settings-permissions.json` — the hook set written into a *consumer* project's global Claude config, distinct from GSD's own `hooks/dist/*.js`), `templates/project/` (project-level `CLAUDE.md`, `DEVOPS-HANDOFF.md`, `README.md`, `lessons.md` scaffolds), `tests/` (5 shell integration test files)
- Purpose: Project bootstrapping, health validation, plugin installation

## Static Data

**`lib/` (top-level, distinct from `get-shit-done/bin/lib/`):**
- Location: `lib/injection-patterns.json` (23 prompt-injection regex patterns, each `{source, flags, category}`), `lib/ci-patterns.json`
- Purpose: Pattern data loaded by hooks and security modules at runtime — pure JSON, not CJS modules

**`references/` (top-level, distinct from `get-shit-done/references/`):**
- Location: `references/agent-design-patterns.md`, `agent-governance-framework.md`, `frontmatter-reference.md` (3 files)
- Purpose: Predates the current `get-shit-done/references/` reference set; content partially overlaps but has diverged from `plugins/claude-mcp-ecosystem/subagent-lifecycle/references/`. No command, workflow, or agent file under `commands/`, `get-shit-done/workflows/`, or `agents/` references this directory — it is not part of the active command/workflow control flow documented above

---

*Architecture analysis: 2026-07-12*
