# Codebase Structure

**Analysis Date:** 2026-07-12

## Directory Layout

```
Pete-Gets-Shit-Done/
├── agents/                      # Subagent definitions (17 active + 8 archived)
│   └── _archived/               # Deprecated agent definitions (8 files)
├── assets/                      # Logo images — PNG/SVG (5 files)
├── bin/                         # npm bin entry points
│   ├── install.js               # Multi-runtime installer (5300 lines)
│   └── setup-from-clone.js      # Dev environment setup, no publish cycle (334 lines)
├── commands/                    # Slash command definitions
│   └── gsd/                     # 67 /gsd:* command files — installer's ONLY source
├── docs/                        # Documentation (19 files)
│   ├── archive/                 # Superseded docs (1 file)
│   └── health-reports/          # Point-in-time audit reports (1 file)
├── get-shit-done/               # Core framework package (npm-published payload)
│   ├── bin/
│   │   ├── gsd-tools.cjs        # CLI entry point + router (1023 lines)
│   │   └── lib/                 # 24 library modules (14,076 LOC total)
│   ├── commands/gsd/            # 4 orphan files, NOT read by bin/install.js (see below)
│   ├── references/              # Reference documentation (17 files)
│   ├── templates/                # Markdown/JSON templates (42 files)
│   │   ├── codebase/             # Codebase mapping templates (7 files)
│   │   └── research-project/     # Research project templates (5 files)
│   └── workflows/                # Workflow execution specs (66 files)
├── governance/                   # Project bootstrap/health system
│   ├── scripts/                  # health-check.sh, install-plugins.sh, scaffold-project.sh
│   ├── templates/                # context/ (6), global/ (3), project/ (4) — 13 files
│   └── tests/                    # 5 shell integration tests
├── hooks/                        # Claude Code lifecycle hooks
│   ├── dist/                     # esbuild-compiled hooks (6 files, npm-published)
│   └── *.js                      # Hook source (6 files)
├── lib/                          # Static pattern data (JSON, not modules)
│   ├── injection-patterns.json   # 23 prompt-injection regex patterns
│   └── ci-patterns.json
├── node_modules/                 # npm dependencies (c8, esbuild + transitive)
├── plugins/                      # Bundled declarative Claude Code plugins
│   ├── claude-code-factory/      # Extension generator (v1.0.0)
│   │   ├── agents/                # 1 agent
│   │   └── skills/                # 38 skill directories
│   └── claude-mcp-ecosystem/      # Session management (v2.0.0)
│       ├── commands/              # 9 commands
│       ├── skills/                # 7 skills
│       ├── subagent-lifecycle/    # agents/docs/references/scripts/templates
│       └── workspace-ops/         # hooks/scripts
├── references/                   # 3 legacy docs, predate get-shit-done/references/ (see below)
├── scripts/                      # Build, CI, and security scripts (11 files)
├── tasks/                        # Governance tracking
│   ├── todo.md                   # Active task checklist
│   └── lessons.md                # Cross-session learned rules
├── tests/                        # Test suite (141 files total)
│   ├── e2e/                      # End-to-end tests (15 files)
│   ├── perf/                     # Performance tests (1 file)
│   ├── fixtures/                 # Test fixtures (5 files)
│   ├── helpers.cjs               # Shared test utilities
│   └── hook-helpers.cjs          # Hook-specific test utilities
├── .claude/                      # This repo's own Claude Code project config
│   ├── agents/                   # Project-scoped agents (3 files)
│   ├── hooks/                    # Project-scoped hooks (1 file)
│   ├── skills/                   # Project-scoped skills (2 SKILL.md)
│   └── settings.json             # Only wires a SubagentStop health-check hook
├── .github/                      # GitHub config
│   ├── workflows/                # CI workflows (3 files)
│   ├── ISSUE_TEMPLATE/           # Issue templates (3 yml + config.yml)
│   ├── CODEOWNERS, FUNDING.yml, dependabot.yml
│   └── pull_request_template.md
├── .planning/                    # GSD execution state (this repo dogfoods itself)
│   ├── codebase/                 # Codebase mapping docs (this file's directory)
│   ├── dependencies/             # Dependency audit reports
│   ├── ecosystem/                # Ecosystem audit reports
│   ├── milestones/                # Shipped milestone archives
│   │   ├── archived-phases/       # Pre-v1.9 phase archive
│   │   └── v1.9-phases/ .. v2.8-phases/  # 9 versioned phase archives
│   ├── quick/                     # Quick task records (4 dirs)
│   ├── research/                  # Codebase maps, agent-audits/, security-reviews/
│   ├── config.json, STATE.md, ROADMAP.md, PROJECT.md, MILESTONES.md
│   └── (phases/ — created on demand during an active milestone; absent between milestones)
├── package.json                  # npm manifest (get-shit-done-cc, v1.30.0)
├── CLAUDE.md                     # Project-level AI instructions
├── README.md                     # Public documentation
├── CHANGELOG.md                  # Release history
├── CONTRIBUTING.md, SECURITY.md, LICENSE
└── .c8rc.json, .gitignore, .secretscanignore, .base64scanignore
```

## Directory Purposes

**`agents/`:**
- Purpose: Subagent system prompts that define specialized AI workers
- Contains: 17 active `.md` files, each with frontmatter (`name`, `description`, `tools`, `model`, `permissionMode: acceptEdits`, `isolation: worktree`, `maxTurns`, `color`, `# Tier:` comment) plus 8 archived files in `_archived/`
- Key files: `gsd-executor.md` (plan execution, sonnet), `gsd-planner.md` (plan creation, opus), `gsd-verifier.md` (scope-routed verification, opus), `gsd-debugger.md` (bug investigation, opus), `gsd-codebase-mapper.md` (this document's own producer)

**`bin/`:**
- Purpose: npm package entry points
- Contains: `install.js` (5300 lines, the multi-runtime installer) and `setup-from-clone.js` (334 lines, dev-only setup)
- Key files: `bin/install.js` handles installation for Claude Code, OpenCode, Codex, Copilot, Antigravity, Cursor, Windsurf, Gemini CLI (8 runtimes)

**`commands/gsd/`:**
- Purpose: User-facing slash command definitions — the canonical, installer-sourced set
- Contains: 67 `.md` files, each defining one `/gsd:*` command
- Key files: `execute-phase.md`, `plan-phase.md`, `quick.md`, `discuss-phase.md`, `verify-work.md`, `ship.md`, `debug.md`, `map-codebase.md`
- Note: `bin/install.js` builds its command payload from `path.join(src, 'commands', 'gsd')` — this directory only. A separate, much smaller `get-shit-done/commands/gsd/` directory exists (see below) and is never read by the installer

**`get-shit-done/commands/gsd/`:**
- Purpose: Historically unclear — contains 4 command files, each added directly here instead of the canonical `commands/gsd/` location, per `git log`: `workstreams.md` (v2.5 Final Documentation Sync), `checkpoint.md` (Phase 52, Checkpoint Engine), `daily.md` (Phase 53, Daily Dashboard), `harden-repo.md` (the `harden-repo` feature)
- Contains: 4 `.md` files. `workstreams.md` also exists in `commands/gsd/` and differs by one line (an inline `<!-- workflow-exemption -->` comment); the other 3 have no counterpart in `commands/gsd/` at all
- Key risk: `bin/install.js` never reads from this path — a command placed only here will never ship to end users. New commands belong in `commands/gsd/`

**`get-shit-done/bin/lib/`:**
- Purpose: Core library modules providing all deterministic operations
- Contains: 24 `.cjs` files totaling 14,076 lines
- Key files by size: `init.cjs` (2101 LOC, compound init commands), `core.cjs` (1705 LOC, shared utilities + model resolution), `state.cjs` (1046 LOC, STATE.md ops), `commands.cjs` (986 LOC, git + utility commands), `profile-output.cjs` (952 LOC, crew assessment rendering), `verify.cjs` (888 LOC), `phase.cjs` (887 LOC)
- Layering: enforced by `tests/architecture.test.cjs` — see `.planning/codebase/ARCHITECTURE.md` for the full Layer 0-3 breakdown

**`get-shit-done/workflows/`:**
- Purpose: Detailed step-by-step execution instructions referenced by commands
- Contains: 66 `.md` files with `<step>` tags and bash code blocks
- Key files: `execute-phase.md`, `execute-plan.md`, `plan-phase.md`, `quick.md`, `discuss-phase.md`, `verify-work.md`, `map-codebase.md`, `daily.md`, `checkpoint.md`

**`get-shit-done/references/`:**
- Purpose: Reference documentation loaded by workflows on demand via `@` references
- Contains: 17 `.md` files covering git integration, model profiles, UI branding, verification patterns, checkpoints, user profiling, etc.
- Key files: `git-integration.md`, `model-profiles.md`, `verification-patterns.md`, `ui-brand.md`, `checkpoints.md` (30KB, largest reference doc)

**`get-shit-done/templates/`:**
- Purpose: Markdown/JSON templates for generating planning documents
- Contains: 42 files (41 `.md` + `config.json`) across 2 subdirectories (`codebase/`, `research-project/`)
- Key files: `state.md`, `roadmap.md`, `phase-prompt.md`, `project.md`, `milestone.md`, `UAT.md`, `VALIDATION.md`, `codebase/architecture.md` (the template this document itself follows)

**`hooks/`:**
- Purpose: Claude Code lifecycle hooks (source + compiled)
- Contains: 6 source `.js` files in root, 6 compiled `.js` files in `dist/` (1:1 mapping, built via `scripts/build-hooks.js`)
- Key files: `gsd-prompt-guard.js` (23 injection patterns), `gsd-config-protection.js` (32 protected filenames), `gsd-context-monitor.js`, `gsd-cost-tracker.js`, `gsd-check-update.js`, `gsd-statusline.js`

**`plugins/`:**
- Purpose: Bundled, declarative Claude Code plugins (each has its own `.claude-plugin/plugin.json`) — distinct from GSD core, which installs imperatively and has no plugin manifest of its own
- Contains: 2 plugins — `claude-code-factory` (v1.0.0, 1 agent + 38 skills) and `claude-mcp-ecosystem` (v2.0.0, 9 commands + 7 skills + `subagent-lifecycle/` + `workspace-ops/`)
- Key files: `claude-mcp-ecosystem/commands/prime.md`, `claude-mcp-ecosystem/commands/wrap.md`, `claude-mcp-ecosystem/.claude-plugin/marketplace.json`

**`governance/`:**
- Purpose: Project bootstrapping and health validation for *consumer* projects (the templates written into a new project's `.claude/`, not GSD's own config)
- Contains: `scripts/` (3 files), `templates/context|global|project/` (13 files), `tests/` (5 shell test files) — 21 files total
- Key files: `governance/scripts/health-check.sh`, `governance/scripts/scaffold-project.sh`, `governance/templates/global/settings-hooks.json` (the SessionStart/PreToolUse/PostToolUse/Stop/PreCompact hook set bootstrapped into new projects)

**`scripts/`:**
- Purpose: Build tooling, CI helpers, and security scanning
- Contains: 11 files (JS build/CI scripts, shell security scanners)
- Key files: `scripts/run-tests.cjs` (test runner), `scripts/run-e2e-tests.cjs`, `scripts/build-hooks.js` (hook compilation via esbuild), `scripts/secret-scan.sh`, `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`, `scripts/check-doc-drift.cjs`, `scripts/validate-doc-links.cjs`, `scripts/generate-gap-analysis.cjs`, `scripts/gsd-agent-health-check.sh`, `scripts/ci-coverage-report.sh`

**`tests/`:**
- Purpose: Test suite covering all lib modules, hooks, installation, and integration
- Contains: 141 files total — 102 `*.test.cjs` files, 2 shared helper files (`helpers.cjs`, `hook-helpers.cjs`), plus `e2e/` (15), `perf/` (1), `fixtures/` (5) subdirectories
- Key files: `tests/architecture.test.cjs` (enforces layer dependency rules — see ARCHITECTURE.md), `tests/core.test.cjs`, `tests/state.test.cjs`, `tests/init.test.cjs`, `tests/harden-repo.test.cjs`

**`.claude/`:**
- Purpose: This repo's own Claude Code project configuration — the 3 project-scoped agents named in `CLAUDE.md` (`plugin-developer`, `test-runner`, `docs-sync`), 2 project-scoped skills, and 1 hook
- Contains: `agents/` (3 files), `hooks/lesson-capture-gate.cjs` (Stop-event hook enforcing the lessons.md self-improvement loop — present on disk but not referenced anywhere in the committed `.claude/settings.json`), `skills/` (2 `SKILL.md` files including `dream-memory-consolidation`), `settings.json` (wires only a `SubagentStop` health-check hook)

**`.planning/`:**
- Purpose: GSD's own execution state for developing GSD itself (dogfooding)
- Contains: `codebase/` (this directory), `dependencies/DEPENDENCIES-REPORT.md`, `ecosystem/ECOSYSTEM-REPORT.md`, `milestones/` (10 versioned archive directories, v1.9 through v2.8, plus `archived-phases/`), `quick/` (4 quick-task directories), `research/` (codebase maps, `agent-audits/`, `security-reviews/`), plus root-level `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `MILESTONES.md`, `config.json`, `CHECKPOINT.json`, `HANDOFF.json`
- Note: `phases/` (active, unshipped phase directories) does not currently exist — GSD is between milestones as of this analysis (v2.8 shipped and archived); the directory is created on demand by `/gsd:plan-phase` or `phase add`

## Key File Locations

**Entry Points:**
- `bin/install.js`: npm package entry point, multi-runtime installer
- `get-shit-done/bin/gsd-tools.cjs`: CLI tool entry point, dispatches all commands
- `.github/workflows/test.yml`: CI entry point (push/PR/workflow_dispatch to `main`)

**Configuration:**
- `package.json`: npm manifest, scripts, devDependencies (`c8`, `esbuild`)
- `.c8rc.json`: Coverage configuration
- `.planning/config.json`: GSD project behavior settings (model routing, mode, granularity)
- `.claude/settings.json`: Claude Code permissions and hooks for this repo
- `.github/workflows/test.yml`: CI test pipeline (3 jobs: test matrix, governance, docs-integrity)
- `.github/workflows/security-scan.yml`: CI security scanning (PR-triggered)
- `.github/workflows/auto-label-issues.yml`: Issue labeling automation

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`: Foundation — errors, paths, config loading, git ops, model resolution
- `get-shit-done/bin/lib/init.cjs`: Compound init commands for all workflows (largest module, 2101 LOC)
- `get-shit-done/bin/lib/state.cjs`: STATE.md read/write/progression engine
- `get-shit-done/bin/lib/phase.cjs`: Phase CRUD (add, insert, remove, complete)
- `get-shit-done/bin/lib/verify.cjs`: Plan structure, phase completeness, reference, artifact verification
- `get-shit-done/bin/lib/config.cjs`: Config CRUD with key validation and migration
- `get-shit-done/bin/lib/classify.cjs`: Task complexity classification for dynamic model routing (zero intra-project dependencies)
- `get-shit-done/bin/lib/security.cjs`: Shell/path/JSON validation, prompt-injection scanning
- `get-shit-done/bin/lib/harden-repo.cjs`: Branch-protection audit/fix (GitHub API read-merge-PUT)

**Testing:**
- `scripts/run-tests.cjs`: Test runner (custom, wraps `node:test`, not Jest/Vitest)
- `scripts/run-e2e-tests.cjs`: E2E test runner
- `tests/helpers.cjs`: Shared test utilities and fixtures
- `tests/architecture.test.cjs`: Layer dependency enforcement (see ARCHITECTURE.md)

## Naming Conventions

**Files:**
- Library modules: `kebab-case.cjs` (e.g., `model-profiles.cjs`, `profile-output.cjs`, `harden-repo.cjs`)
- Test files: `kebab-case.test.cjs` (mirrors source file name)
- Command/workflow/agent files: `kebab-case.md`
- Hook files: `gsd-kebab-case.js` (prefixed with `gsd-`)
- Shell scripts: `kebab-case.sh`

**Directories:**
- Phase directories: `{number}-{kebab-case-slug}/` (e.g., `57-backfill-and-ci-integration/`)
- Quick task directories: `{YYMMDD}-{3char}-{slug}/` (e.g., `260326-j9x-fix-plugin-json-placeholders-and-bump-ve`)
- Plugin directories: `kebab-case/`
- Milestone archive directories: `v{X.Y}-phases/`

**Functions:**
- CLI command handlers: `cmd{PascalCase}` (e.g., `cmdInitExecutePhase`, `cmdInitMapCodebase`)
- Internal helpers: `camelCase` (e.g., `resolveModelInternal`, `findProjectRoot`, `parseNamedArgs`)
- Exported functions: `camelCase` in `module.exports`

**Agent Names:**
- Pattern: `gsd-{kebab-case-role}` (e.g., `gsd-executor`, `gsd-planner`, `gsd-verifier`, `gsd-codebase-mapper`)

**Command Names:**
- Pattern: `gsd:{kebab-case-verb}` (e.g., `gsd:execute-phase`, `gsd:plan-phase`, `gsd:quick`)

## Where to Add New Code

**New GSD Command:**
1. Create command spec: `commands/gsd/{command-name}.md` with frontmatter (name, description, allowed-tools) — **not** `get-shit-done/commands/gsd/`, which the installer never reads
2. Create workflow: `get-shit-done/workflows/{command-name}.md` with `<step>` tags
3. If command needs init data: add `cmdInit{CommandName}()` to `get-shit-done/bin/lib/init.cjs`
4. Add CLI router case in `get-shit-done/bin/gsd-tools.cjs` if a new tool subcommand is needed (add it to the top-level `require()` block if used broadly, or a lazy `require()` inside the dispatch case if narrow)
5. Add tests: `tests/{command-name}.test.cjs`
6. Update `bin/install.js` file copy lists if the command should ship to users

**New Library Module:**
1. Create: `get-shit-done/bin/lib/{module-name}.cjs`
2. Decide its layer by dependency need — if it must sit in Layer 0-2, add its filename to the `LAYERS` map in `tests/architecture.test.cjs`; otherwise it is automatically Layer 3 by elimination
3. Import in `get-shit-done/bin/gsd-tools.cjs` (eager top-level require if used across many commands, lazy in-case require if narrow — see the daily/checkpoint/harden-repo/history/security/uat pattern)
4. Add tests: `tests/{module-name}.test.cjs`
5. Run `tests/architecture.test.cjs` — it will fail on circular deps or upward imports

**New Agent:**
1. Create: `agents/gsd-{agent-name}.md` with frontmatter (`name`, `description`, `tools`, `model`, `permissionMode: acceptEdits`, `isolation: worktree`, `maxTurns`, `color`, `# Tier:` comment)
2. Reference in relevant workflow files via `Task(subagent_type="gsd-{agent-name}", ...)`
3. Add installation validation in `tests/agent-install-validation.test.cjs`

**New Hook:**
1. Create source: `hooks/gsd-{hook-name}.js`
2. Add to `scripts/build-hooks.js` build list
3. Build: `npm run build:hooks` (compiles to `hooks/dist/`)
4. Add tests: `tests/{hook-name}-hook.test.cjs`
5. Register wiring in `governance/templates/global/settings-hooks.json` (for consumer projects) and, if needed, `bin/install.js`'s hook-writing logic

**New Plugin:**
1. Create directory: `plugins/{plugin-name}/`
2. Add a `.claude-plugin/plugin.json` manifest (and `marketplace.json` if it should be independently discoverable, following `claude-mcp-ecosystem`'s pattern)
3. Add `commands/`, `skills/`, and/or `agents/` subdirectories as needed
4. Register in `governance/scripts/install-plugins.sh`

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

**`.planning/phases/`:**
- Purpose: Active, unshipped phase directories for the milestone currently in progress
- Generated: Created on demand by `gsd-tools.cjs phase add`
- Committed: Yes when present — **not currently present** on disk (GSD is between milestones as of this analysis)

**`.planning/milestones/{vX.Y}-phases/` and `archived-phases/`:**
- Purpose: Archive of completed phase directories from shipped milestones
- Generated: Created by `gsd-tools.cjs milestone complete --archive-phases`
- Committed: Yes

**`coverage/`:**
- Purpose: Test coverage reports (text, lcov, JSON)
- Generated: Yes, by `npm run test:coverage` / `test:coverage:full`
- Committed: No — listed in `.gitignore` (line 16); not present in this checkout

**`node_modules/`:**
- Purpose: npm dependencies (`c8`, `esbuild` direct; 56 top-level packages including transitive)
- Generated: Yes, by `npm install`
- Committed: No (gitignored)

**`hooks/dist/`:**
- Purpose: Compiled/bundled hook files for distribution
- Generated: Yes, by `npm run build:hooks` (esbuild)
- Committed: Yes (ships to users — listed in `package.json`'s `files` array)

**`state/`:**
- Purpose: Session audit trail (per `governance/templates/global/CLAUDE.md`'s file-structure convention, for *consumer* projects)
- Generated: Yes, by session-close workflows in projects that adopt the governance template
- Committed: No — listed in `.gitignore` (line 8); not present in this repo's own checkout

## File Counts by Directory

| Directory | Files | Type |
|-----------|-------|------|
| `get-shit-done/bin/lib/` | 24 | `.cjs` modules (14,076 LOC) |
| `commands/gsd/` | 67 | `.md` commands (installer source) |
| `get-shit-done/commands/gsd/` | 4 | `.md` commands (orphaned, not installed) |
| `get-shit-done/workflows/` | 66 | `.md` workflows |
| `get-shit-done/templates/` | 42 | `.md` + `.json` templates |
| `get-shit-done/references/` | 17 | `.md` reference docs |
| `references/` (top-level) | 3 | `.md`, legacy/unwired |
| `agents/` | 17 active + 8 archived | `.md` agent specs |
| `tests/` | 141 | 102 `.test.cjs` + helpers + e2e/perf/fixtures |
| `scripts/` | 11 | `.cjs` + `.sh` |
| `hooks/` | 12 | `.js` (6 source + 6 dist) |
| `docs/` | 19 | `.md` documentation |
| `governance/` | 21 | scripts + templates + tests |
| `plugins/claude-code-factory/` | 94 | `.md` (38 skills + agent + refs) |
| `plugins/claude-mcp-ecosystem/` | 31 | `.md` (9 commands + 7 skills + subagent-lifecycle) |
| **Total (git-tracked)** | **1015** | `git ls-files \| wc -l` |

---

*Structure analysis: 2026-07-12*
