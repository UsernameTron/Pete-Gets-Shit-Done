# Codebase Structure

**Analysis Date:** 2026-04-06

## Directory Layout

```
Pete-Gets-Shit-Done/
├── agents/                  # Subagent definitions (15 active + archived)
│   └── _archived/           # Deprecated agent definitions
├── assets/                  # Logo images (PNG, SVG)
├── bin/                     # npm bin entry point
│   └── install.js           # Multi-runtime installer (5241 lines)
├── commands/                # Slash command definitions
│   └── gsd/                 # 61 /gsd:* command files
├── coverage/                # Test coverage reports (generated)
├── docs/                    # Documentation (16 files)
├── get-shit-done/           # Core framework package
│   ├── bin/                 # CLI tools
│   │   ├── gsd-tools.cjs   # CLI entry point + router
│   │   └── lib/             # 19 library modules (12,693 LOC)
│   ├── commands/            # Internal command routing
│   │   └── gsd/             # Symlinked/mirrored commands
│   ├── references/          # Reference documentation (15 files)
│   ├── templates/           # Markdown templates (32 files)
│   │   ├── codebase/        # Codebase mapping templates
│   │   └── research-project/# Research project templates
│   └── workflows/           # Workflow execution specs (57 files)
├── governance/              # Project governance system
│   ├── scripts/             # Bootstrap and health scripts
│   ├── templates/           # Config templates
│   └── tests/               # Governance integration tests
├── hooks/                   # Claude Code lifecycle hooks
│   ├── dist/                # Compiled hooks (5 JS files)
│   └── *.js                 # Hook source files (5 files)
├── plugins/                 # Plugin extensions
│   ├── claude-code-factory/ # Extension generator plugin
│   │   ├── agents/          # 1 agent
│   │   └── skills/          # 1 skill
│   └── claude-mcp-ecosystem/# Session management plugin
│       ├── commands/         # 9 commands
│       ├── skills/           # 7 skills
│       └── ...
├── scripts/                 # Build and CI scripts (8 files)
├── tests/                   # Test suite (70 files)
│   ├── e2e/                 # End-to-end tests
│   ├── perf/                # Performance tests
│   ├── helpers.cjs          # Shared test utilities
│   └── hook-helpers.cjs     # Hook-specific test utilities
├── .claude/                 # Claude Code project config
│   ├── agents/              # Project-scoped agents (3 files)
│   ├── agent-memory/        # Agent memory persistence
│   └── worktrees/           # Worktree tracking
├── .github/                 # GitHub config
│   ├── workflows/           # CI workflows (3)
│   └── ISSUE_TEMPLATE/      # Issue templates (4)
├── .planning/               # GSD execution state
│   ├── codebase/            # Codebase mapping docs
│   ├── milestones/          # Milestone archives
│   ├── phases/              # Active phase directories
│   ├── quick/               # Quick task records
│   ├── research/            # Research artifacts
│   ├── config.json          # Project GSD config
│   ├── MILESTONES.md        # Shipped milestone log
│   ├── PROJECT.md           # Project context
│   ├── ROADMAP.md           # Phase roadmap
│   └── STATE.md             # Current execution state
├── state/                   # Session audit trail (gitignored)
├── tasks/                   # Governance tracking
│   └── lessons.md           # Cross-session learned rules
├── package.json             # npm manifest (v1.30.0)
├── CLAUDE.md                # Project-level AI instructions
├── README.md                # Public documentation
├── docs/README-technical.md # GSD technical deep-dive (architecture, security, troubleshooting)
└── CHANGELOG.md             # Release history
```

## Directory Purposes

**`agents/`:**
- Purpose: Subagent system prompts that define specialized AI workers
- Contains: 15 active `.md` files, each with frontmatter (name, description, tools, model)
- Key files: `gsd-executor.md` (plan execution), `gsd-planner.md` (plan creation), `gsd-verifier.md` (quality validation), `gsd-debugger.md` (bug investigation), `gsd-research-orchestrator.md` (technical research)

**`bin/`:**
- Purpose: npm package entry point
- Contains: Single file `install.js` (5241 lines) -- the multi-runtime installer
- Key files: `bin/install.js` handles installation for Claude Code, Copilot, Gemini CLI, Codex, Antigravity, Cursor, Windsurf

**`commands/gsd/`:**
- Purpose: User-facing slash command definitions
- Contains: 61 `.md` files, each defining one `/gsd:*` command
- Key files: `execute-phase.md`, `plan-phase.md`, `quick.md`, `discuss-phase.md`, `verify-work.md`, `ship.md`, `debug.md`, `autonomous.md`

**`get-shit-done/bin/lib/`:**
- Purpose: Core library modules providing all deterministic operations
- Contains: 19 `.cjs` files totaling 12,693 lines
- Key files by size: `init.cjs` (2085 LOC, compound init commands), `core.cjs` (1705 LOC, shared utilities), `state.cjs` (1046 LOC, STATE.md ops), `commands.cjs` (984 LOC, utility commands), `profile-output.cjs` (952 LOC, crew assessment rendering)

**`get-shit-done/workflows/`:**
- Purpose: Detailed step-by-step execution instructions referenced by commands
- Contains: 57 `.md` files with `<step>` tags and bash code blocks
- Key files: `execute-phase.md`, `execute-plan.md`, `plan-phase.md`, `quick.md`, `discuss-phase.md`, `verify-work.md`

**`get-shit-done/references/`:**
- Purpose: Reference documentation loaded by workflows on demand
- Contains: 15 `.md` files covering git integration, model profiles, UI branding, verification patterns, etc.
- Key files: `git-integration.md`, `model-profiles.md`, `verification-patterns.md`, `ui-brand.md`

**`get-shit-done/templates/`:**
- Purpose: Markdown templates for generating planning documents
- Contains: 32 `.md` files + 1 JSON config + 2 subdirectories
- Key files: `state.md`, `roadmap.md`, `phase-prompt.md`, `project.md`, `milestone.md`, `UAT.md`, `VALIDATION.md`

**`hooks/`:**
- Purpose: Claude Code lifecycle hooks (source + compiled)
- Contains: 5 source `.js` files in root, 5 compiled `.js` files in `dist/`
- Key files: `gsd-workflow-guard.js` (enforces workflow gates), `gsd-context-monitor.js` (token tracking), `gsd-prompt-guard.js` (input validation)

**`plugins/`:**
- Purpose: Optional plugin extensions that add commands, agents, and skills
- Contains: 2 bundled plugins
- Key files: `claude-mcp-ecosystem/commands/prime.md`, `claude-mcp-ecosystem/commands/wrap.md`

**`governance/`:**
- Purpose: Project bootstrapping and health validation
- Contains: Scripts for health check, plugin install, project scaffolding; templates for config; integration tests
- Key files: `governance/scripts/health-check.sh`, `governance/scripts/scaffold-project.sh`

**`scripts/`:**
- Purpose: Build tooling, CI helpers, and security scanning
- Contains: 8 files (JS build scripts, shell security scanners, test runners)
- Key files: `scripts/run-tests.cjs` (test runner), `scripts/build-hooks.js` (hook compilation via esbuild), `scripts/secret-scan.sh`, `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`

**`tests/`:**
- Purpose: Test suite covering all lib modules, hooks, installation, and integration
- Contains: 70 files (67 test files + 2 helper files + subdirectories)
- Key files: `tests/architecture.test.cjs` (enforces layer dependency rules), `tests/core.test.cjs`, `tests/state.test.cjs`, `tests/init.test.cjs`

## Key File Locations

**Entry Points:**
- `bin/install.js`: npm package entry point, multi-runtime installer
- `get-shit-done/bin/gsd-tools.cjs`: CLI tool entry point, dispatches all commands

**Configuration:**
- `package.json`: npm manifest, scripts, devDependencies
- `.c8rc.json`: Coverage configuration
- `.planning/config.json`: GSD project behavior settings
- `.claude/settings.json` / `.claude/settings.local.json`: Claude Code permissions and hooks
- `.github/workflows/test.yml`: CI test pipeline
- `.github/workflows/security-scan.yml`: CI security scanning
- `.github/workflows/auto-label-issues.yml`: Issue labeling automation

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: Foundation -- errors, paths, config loading, git ops, model resolution
- `get-shit-done/bin/lib/init.cjs`: Compound init commands for all workflows
- `get-shit-done/bin/lib/state.cjs`: STATE.md read/write/progression engine
- `get-shit-done/bin/lib/phase.cjs`: Phase CRUD (add, insert, remove, complete)
- `get-shit-done/bin/lib/verify.cjs`: Plan structure, phase completeness, reference, artifact verification
- `get-shit-done/bin/lib/config.cjs`: Config CRUD with key validation and migration
- `get-shit-done/bin/lib/classify.cjs`: Task complexity classification for dynamic model routing
- `get-shit-done/bin/lib/security.cjs`: Shell argument validation, input sanitization

**Testing:**
- `scripts/run-tests.cjs`: Test runner (custom, not Jest/Vitest)
- `scripts/run-e2e-tests.cjs`: E2E test runner
- `tests/helpers.cjs`: Shared test utilities and fixtures
- `tests/architecture.test.cjs`: Layer dependency enforcement

## Naming Conventions

**Files:**
- Library modules: `kebab-case.cjs` (e.g., `model-profiles.cjs`, `profile-output.cjs`)
- Test files: `kebab-case.test.cjs` (mirrors source file name)
- Command/workflow/agent files: `kebab-case.md`
- Hook files: `gsd-kebab-case.js` (prefixed with `gsd-`)
- Shell scripts: `kebab-case.sh`

**Directories:**
- Phase directories: `{number}-{kebab-case-slug}/` (e.g., `30-dynamic-model-selection/`)
- Quick task directories: `{YYMMDD}-{3char}-{slug}/`
- Plugin directories: `kebab-case/`
- Milestone archive directories: `v{X.Y}-phases/`

**Functions:**
- CLI command handlers: `cmd{PascalCase}` (e.g., `cmdStateLoad`, `cmdInitExecutePhase`)
- Internal helpers: `camelCase` (e.g., `resolveModelInternal`, `findPhaseInternal`)
- Exported functions: `camelCase` in `module.exports`

**Agent Names:**
- Pattern: `gsd-{kebab-case-role}` (e.g., `gsd-executor`, `gsd-planner`, `gsd-verifier`)

**Command Names:**
- Pattern: `gsd:{kebab-case-verb}` (e.g., `gsd:execute-phase`, `gsd:plan-phase`, `gsd:quick`)

## Where to Add New Code

**New GSD Command:**
1. Create command spec: `commands/gsd/{command-name}.md` with frontmatter (name, description, allowed-tools)
2. Create workflow: `get-shit-done/workflows/{command-name}.md` with `<step>` tags
3. If command needs init data: add `cmdInit{CommandName}()` to `get-shit-done/bin/lib/init.cjs`
4. Add CLI router case in `get-shit-done/bin/gsd-tools.cjs` if new tool subcommand needed
5. Add tests: `tests/{command-name}.test.cjs`
6. Update `bin/install.js` file copy lists if the command should ship to users

**New Library Module:**
1. Create: `get-shit-done/bin/lib/{module-name}.cjs`
2. Place in correct architecture layer (0-3) per dependency rules in `core.cjs` header
3. Import in `get-shit-done/bin/gsd-tools.cjs` and add router cases
4. Add tests: `tests/{module-name}.test.cjs`
5. Verify architecture: `tests/architecture.test.cjs` will catch layer violations

**New Agent:**
1. Create: `agents/gsd-{agent-name}.md` with frontmatter (name, description, tools, model)
2. Add to `CODEX_AGENT_SANDBOX` map in `bin/install.js` for Codex support
3. Reference in relevant workflow files
4. Add installation validation in `tests/agent-install-validation.test.cjs`

**New Hook:**
1. Create source: `hooks/gsd-{hook-name}.js`
2. Add to `scripts/build-hooks.js` build list
3. Build: `npm run build:hooks` (compiles to `hooks/dist/`)
4. Add tests: `tests/{hook-name}-hook.test.cjs`
5. Register in `.claude/settings.json` under appropriate event

**New Plugin:**
1. Create directory: `plugins/{plugin-name}/`
2. Add `commands/`, `skills/`, and/or `agents/` subdirectories as needed
3. Register in `governance/scripts/install-plugins.sh`
4. Add to `bin/install.js` `--plugins` installation logic

**New Test:**
- Unit test: `tests/{module-name}.test.cjs` (mirrors source file)
- Integration test: `tests/integ-{feature}.test.cjs`
- E2E test: `tests/e2e/{scenario}.test.cjs`
- Performance test: `tests/perf/{benchmark}.test.cjs`

**Utility/Helper:**
- Shared test helpers: `tests/helpers.cjs` or `tests/hook-helpers.cjs`
- Build/CI scripts: `scripts/{script-name}.cjs` or `scripts/{script-name}.sh`

## Special Directories

**`.planning/`:**
- Purpose: GSD project execution state (roadmap, phases, state, config)
- Generated: Created by `gsd:new-project` or installer `--scaffold`
- Committed: Yes (tracked in git)

**`.planning/milestones/archived-phases/`:**
- Purpose: Archive of completed phase directories from shipped milestones
- Generated: Created by `gsd-tools milestone complete`
- Committed: Yes

**`coverage/`:**
- Purpose: Test coverage reports (text, lcov, JSON)
- Generated: Yes, by `npm run test:coverage`
- Committed: Yes (for CI reporting)

**`state/`:**
- Purpose: Session audit trail (session logs, decision records)
- Generated: Yes, by `/wrap` command
- Committed: No (gitignored)

**`node_modules/`:**
- Purpose: npm dependencies (c8, esbuild only)
- Generated: Yes, by `npm install`
- Committed: No (gitignored)

**`hooks/dist/`:**
- Purpose: Compiled/bundled hook files for distribution
- Generated: Yes, by `npm run build:hooks` (esbuild)
- Committed: Yes (ships to users)

## File Counts by Directory

| Directory | Files | Type |
|-----------|-------|------|
| `get-shit-done/bin/lib/` | 19 | `.cjs` modules |
| `commands/gsd/` | 61 | `.md` commands |
| `get-shit-done/workflows/` | 57 | `.md` workflows |
| `get-shit-done/templates/` | 32 | `.md` templates |
| `agents/` | 15 active | `.md` agent specs |
| `get-shit-done/references/` | 15 | `.md` reference docs |
| `tests/` | 70 | `.test.cjs` + helpers |
| `scripts/` | 8 | `.cjs` + `.sh` |
| `hooks/` | 10 | `.js` (5 source + 5 dist) |
| `docs/` | 16 | `.md` documentation |
| **Total project** | **~1643** | all files |

---

*Structure analysis: 2026-04-06*
