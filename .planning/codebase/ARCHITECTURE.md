# Architecture

**Analysis Date:** 2026-10-26

## Pattern Overview

**Overall:** Meta-prompting framework: markdown-as-code (commands, workflows, agents, templates) interpreted by an AI runtime, backed by a deterministic Node.js CLI (`gsd-tools.cjs`) and a multi-runtime installer. Distributed as the npm package `get-shit-done-cc` (v1.30.0, `package.json`; `bin` -> `bin/install.js`).

**Key Characteristics:**
- Non-deterministic reasoning lives in markdown prompts (`commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `agents/*.md`); deterministic bookkeeping (state, roadmap, phases, git, validation) lives in `get-shit-done/bin/gsd-tools.cjs` and `get-shit-done/bin/lib/*.cjs`, called from workflows via `Bash`.
- Layered, test-enforced module dependency direction in `get-shit-done/bin/lib/` (Layer 3 -> 0, never upward). Enforced by `tests/architecture.test.cjs`.
- One source tree, eight runtimes: the installer converts Claude-format commands/agents into each runtime's format (claude, opencode, gemini, codex, copilot, antigravity, cursor, windsurf).
- Imperative install, not a declarative plugin: no root `.claude-plugin/plugin.json`; the installer copies files and edits the target runtime's settings. Declarative Claude Code plugins are bundled under `plugins/`.
- Root `lib/` holds only data (`lib/ci-patterns.json`, `lib/injection-patterns.json`). There is no root `skills/` directory and no `classify.cjs` anywhere in the repo; the CLAUDE.md architecture sketch listing `lib/core.cjs`, `lib/classify.cjs`, `skills/` is out of date. The runtime modules live in `get-shit-done/bin/lib/`.

## Layers

**Command layer (prompts):**
- Purpose: User-facing slash commands (`/gsd:<name>`), 68 files.
- Location: `commands/gsd/*.md` (plus 4 extra in `get-shit-done/commands/gsd/`: `checkpoint.md`, `daily.md`, `harden-repo.md`, `workstreams.md`)
- Contains: YAML frontmatter (`name: gsd:<cmd>`, `description`, `argument-hint`, `allowed-tools`) plus `<objective>`/process XML-ish blocks that delegate to workflows.
- Depends on: `get-shit-done/workflows/`, `get-shit-done/references/`
- Used by: the AI runtime on slash command invocation.

**Workflow layer (prompts):**
- Purpose: Step-by-step orchestration logic for each command, 76 files.
- Location: `get-shit-done/workflows/*.md`
- Depends on: `gsd-tools.cjs` calls, `get-shit-done/templates/`, `get-shit-done/references/`, subagents in `agents/`
- Used by: commands.

**Agent layer (prompts):**
- Purpose: Subagent role definitions spawned by workflows (planner, executor, verifier, debugger, codebase-mapper, validator-hub, roadmapper, researchers, UI agents, auditors).
- Location: `agents/gsd-*.md` (17 active); retired ones in `agents/_archived/`; project-scoped helpers in `.claude/agents/` (`docs-sync.md`, `plugin-developer.md`, `test-runner.md`).

**CLI tool layer (code):**
- Purpose: Deterministic operations behind `node get-shit-done/bin/gsd-tools.cjs <command> ...`.
- Location: `get-shit-done/bin/gsd-tools.cjs` (839 lines, router only) and `get-shit-done/bin/lib/*.cjs` (23 modules).
- Internal module layers (from `tests/architecture.test.cjs`):
  - Layer 0 (leaf): `model-profiles.cjs`, `security.cjs`
  - Layer 1: `core.cjs` (may require only `model-profiles.cjs`)
  - Layer 2: `frontmatter.cjs`, `config.cjs`, `state.cjs`, `history.cjs`
  - Layer 3 (everything else, auto-assigned): `phase.cjs`, `roadmap.cjs`, `verify.cjs`, `template.cjs`, `milestone.cjs`, `commands.cjs`, `init.cjs`, `workstream.cjs`, `checkpoint.cjs`, `daily.cjs`, `harden-repo.cjs`, `uat.cjs`, `uat-patterns.cjs`, `uat-runner.cjs`, `profile-pipeline.cjs`, `profile-output.cjs`
- Rule: lazy `require()` inside functions follows the same downward direction.

**Installer layer (code):**
- Purpose: Install/uninstall GSD into a runtime's config dir.
- Location: `bin/install.js` (359 lines: arg parsing, interactive runtime/location prompts, dispatch) over `bin/lib/`:
  - `install-core.js`: `install()`, `uninstall()`, `installAllRuntimes()`; builds a `ctx` (`isGlobal`, `runtime`, `targetDir`, `pathPrefix`, `failures`), calls `saveLocalPatches` and `cleanupOrphanedFiles`, then delegates to the runtime module.
  - `runtimes/<name>.js` (8 files): each exports `{ install(ctx), uninstall(ctx) }`; selected by the `RUNTIMES` table in `install-core.js`. Unknown names fall back to `claude`.
  - `converters/<name>.js` + `converters/shared.js`: pure Claude-to-runtime content/frontmatter converters (antigravity, codex, copilot, cursor, gemini, opencode, windsurf).
  - `install-steps.js`: reusable steps (`installNestedCommands`, `installPrefixedSkills`, `installScopedSkills`, `installPayload`, `cleanupOrphanedFiles`, `verifyInstalled`).
  - `uninstall-steps.js`: mirror removal steps (`removeNestedCommands`, `removeSkillDirs`, `removeGsdFiles`, `removeSharedArtifacts`).
  - `settings.js`, `settings-hooks.js`: read/write runtime settings JSON, hook registration and validation.
  - `manifest.js`: file manifest, local-patch preservation (`saveLocalPatches`, `reportLocalPatches`).
  - `toml.js`, `toml-lexer.js`, `codex-config.js`, `codex-hooks-feature.js`: Codex TOML config handling.
  - `governance.js`: governance layer install/uninstall (CLAUDE.md, hooks, permissions, plugins, scaffold).
  - `copy.js`, `paths.js`, `attribution.js`, `copilot-instructions.js`, `cli-options.js`, `colors.js`: helpers.
- Also: `bin/setup-from-clone.js` (`npm run setup`).
- `bin/install.js` re-exports internals for tests ("Test-only exports") and only runs main logic when executed directly.

**Hook layer (code):**
- Purpose: Runtime security/observability hooks.
- Location: source `hooks/gsd-*.js` (check-update, config-protection, context-monitor, cost-tracker, prompt-guard, spawn-tracker, statusline); shipped copies in `hooks/dist/` produced by `scripts/build-hooks.js` (syntax-validates with `vm`, copies; `npm run build:hooks`, run on `prepublishOnly`).
- Pattern data: `lib/injection-patterns.json`, `lib/ci-patterns.json`.

**Governance and plugin layer:**
- `governance/` (templates, `scripts/*.sh`, shell tests) installed into Claude config by `bin/lib/governance.js`.
- `plugins/claude-code-factory/` and `plugins/claude-mcp-ecosystem/`: declarative Claude Code plugins (skills, agents, commands).

## Data Flow

**Slash command execution:**

1. User runs `/gsd:<cmd>`; runtime loads `commands/gsd/<cmd>.md`.
2. Command loads its workflow in `get-shit-done/workflows/`.
3. Workflow runs `node .../gsd-tools.cjs init <workflow>` (e.g. `init execute-phase`) to get a JSON context blob, then spawns agents from `agents/` (wave-based parallel execution).
4. Agents and workflow mutate planning state through `gsd-tools.cjs` (`state`, `phase`, `roadmap`, `commit`, `frontmatter`, `verify`), writing under `.planning/`.

**gsd-tools dispatch:**

1. `main()` in `get-shit-done/bin/gsd-tools.cjs` strips `--cwd`, resolves the worktree root via `core.resolveWorktreeRoot` when `.planning/` is absent.
2. `runCommand(command, args, cwd, raw)` looks up `command` in the top-level `COMMANDS` table via `lookup()` (own-property check, so inherited keys like `constructor` are unknown) and awaits the handler; no match -> `error("Unknown command: ...")`.
3. Grouped commands use `subcommands(TABLE, fallback)`; per-group tables are `STATE_SUBCOMMANDS`, `TEMPLATE_SUBCOMMANDS`, `FRONTMATTER_SUBCOMMANDS`, `UAT_SUBCOMMANDS`, `TODO_SUBCOMMANDS`, `WORKSTREAM_SUBCOMMANDS`, `INIT_WORKFLOWS`, etc. Unknown subcommands use `unknownSubcommand(message)`.
4. Handlers parse flags with `parseNamedArgs`, `parseMultiwordArg`, `flagValue`, `flagInt`, `filesAfterFlag`, then call `cmdXxx(cwd, ..., raw)` in a lib module, which outputs through `core.output`.

**Install flow:**

1. `bin/install.js` parses flags (`--claude`, `--all`, `--global`/`--local`, `--uninstall`, `--no-governance`, `--scaffold`, `--plugins`, `--config-dir`) or prompts interactively.
2. `installAllRuntimes(runtimes, isGlobal, ...)` -> `install(isGlobal, runtime)` in `bin/lib/install-core.js`.
3. `install()` builds `ctx`, saves local patches, cleans orphaned files, then `RUNTIMES[runtime].install(ctx)` runs steps from `install-steps.js`, applies converters for non-Claude runtimes, writes settings via `settings-hooks.js`/`settings.js`, writes the manifest.
4. `writeSettings` and `finishInstall` finalize (statusline etc.); governance steps run for the Claude runtime.

**State Management:**
- Project state is plain files under `.planning/` (`STATE.md`, `ROADMAP.md`, `PROJECT.md`, `config.json`, `phases/`, `milestones/`, `codebase/`), read and written by `state.cjs`, `roadmap.cjs`, `phase.cjs`, `milestone.cjs`, `config.cjs`, `history.cjs`. Workstreams isolate state per stream (`workstream.cjs`). No database.

## Key Abstractions

**COMMANDS dispatch table:**
- Purpose: Map CLI command name -> `(args, cwd, raw)` handler.
- Examples: `get-shit-done/bin/gsd-tools.cjs` (`COMMANDS`, `subcommands`, `lookup`).
- Pattern: Table-driven routing with composable sub-tables; add a command by adding an entry, not a switch case.

**Runtime module contract:**
- Purpose: Per-runtime install/uninstall behavior.
- Examples: `bin/lib/runtimes/claude.js`, `bin/lib/runtimes/codex.js`, `bin/lib/runtimes/opencode.js`.
- Pattern: `module.exports = { install(ctx), uninstall(ctx) }`; a `PROFILE` object (e.g. `{ installsHooks: true }`) passed to `installPayload(ctx, PROFILE)`; shared steps in `install-steps.js`.

**Converter:**
- Purpose: Rewrite Claude-format agent/command markdown for a target runtime.
- Examples: `bin/lib/converters/codex.js` (`convertClaudeAgentToCodexAgent`, `convertClaudeCommandToCodexSkill`), `bin/lib/converters/shared.js`.

**Model profiles:**
- `get-shit-done/bin/lib/model-profiles.cjs` (lazy `MODEL_PROFILES`/`VALID_PROFILES` getters); doc mirror in `get-shit-done/references/model-profiles.md`.

**Templates:**
- `get-shit-done/templates/*.md` (+ `codebase/`, `research-project/`) filled by `template.cjs`.

## Entry Points

**Installer CLI:**
- Location: `bin/install.js` (npm `bin`), `bin/setup-from-clone.js`
- Triggers: `npx get-shit-done-cc`, `npm run setup`

**GSD tools CLI:**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: workflows/agents via `node`; ends with `main()`.

**Slash commands:** `commands/gsd/*.md`.

**Hooks:** `hooks/dist/gsd-*.js`, registered into runtime settings by the installer.

**Project-local hooks:** `.claude/settings.json` registers `Stop` (`.claude/hooks/lesson-capture-gate.cjs`) and `SubagentStop` (`scripts/gsd-agent-health-check.sh`).

## Error Handling

**Strategy:** Fail fast with explicit messages; no silent fallbacks.

**Patterns:**
- CLI: `error(message)` from `core.cjs` exits non-zero (`Unknown command`, `Invalid --cwd`, `Phase not found`).
- Installer: `ctx.failures` accumulates failures; `verifyInstalled`/`verifyFileInstalled` check outputs.
- Untrusted JSON parsed via `safeJsonParse` in `security.cjs`.

## Cross-Cutting Concerns

**Logging:** `console.log` with ANSI colors from `bin/lib/colors.js` in installer; hook cost metrics JSONL via `hooks/gsd-cost-tracker.js`.
**Validation:** `security.cjs` (input validation, secret/injection scanning); `scripts/secret-scan.sh`, `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`; `scripts/validate-doc-links.cjs`; `scripts/check-doc-drift.cjs`.
**Authentication:** Not applicable; config-file protection via `hooks/gsd-config-protection.js`, prompt-injection detection via `hooks/gsd-prompt-guard.js`.

---

*Architecture analysis: 2026-10-26*
