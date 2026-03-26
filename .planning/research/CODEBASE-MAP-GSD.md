# Codebase Map: get-shit-done-cc

**Analysis Date:** 2026-03-25
**Package:** `get-shit-done-cc` v1.28.0
**Root:** `/Users/cpconnor/projects/Pete-Gets-Shit-Done/get-shit-done/`

---

## 1. Technology Stack

### Language & Runtime

| Aspect | Detail |
|--------|--------|
| **Language** | JavaScript (Node.js) — CommonJS exclusively |
| **Runtime** | Node.js >= 20.0.0 (uses `node:test`, `node:assert`, `node:path`, `node:fs`) |
| **Module format** | CommonJS `.cjs` for all source and test files — no ESM |
| **Package manager** | npm; `package-lock.json` present |
| **Runtime dependencies** | **Zero** — deliberate zero-dep design for npm package |

### Dev Dependencies (2 only)

| Package | Version | Purpose |
|---------|---------|---------|
| `c8` | ^11.0.0 | V8 coverage instrumentation for `node:test`; enforces 70% line threshold |
| `esbuild` | ^0.25.12 | Hook bundling — syntax-validates and copies 5 hook source files into `hooks/dist/` |

### Build System

| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `node scripts/run-tests.cjs` | Run all 52 test files via `node --test` |
| `test:coverage` | `c8 --check-coverage --lines 70 --include 'get-shit-done/bin/lib/*.cjs' node scripts/run-tests.cjs` | Coverage with 70% line threshold on lib modules |
| `build:hooks` | `node scripts/build-hooks.js` | Bundle hooks to `hooks/dist/` for npm publish |

- `scripts/build-hooks.js` (82 lines) — esbuild bundler with syntax validation before write
- `scripts/run-tests.cjs` (29 lines) — cross-platform test runner using `execFileSync`
- No TypeScript, no transpilation — plain JS throughout
- No linter (eslint/biome/prettier) configured

### CI/CD

**Platform:** GitHub Actions

**Test matrix** (`.github/workflows/test.yml`):

| OS | Node Versions |
|----|---------------|
| Ubuntu | 20, 22, 24 |
| macOS | 22 |
| Windows | 22 |

**Governance job:** Separate CI job, Ubuntu only, Python 3.x, runs `governance/tests/test_*.sh` shell suites.

**Security scanning** (`.github/workflows/security-scan.yml`, PRs only):
- Prompt injection scan (`scripts/prompt-injection-scan.sh`)
- Base64 obfuscation scan (`scripts/base64-scan.sh`)
- Secret scan (`scripts/secret-scan.sh`)
- `.planning/` directory check (should not be committed to GSD itself)

**Concurrency:** cancel-in-progress on same branch.

### Multi-Runtime Support

The installer (`bin/install.js`, 5,185 lines) supports 8 AI coding tool runtimes:

| Runtime | Config Format | Install Target |
|---------|--------------|----------------|
| Claude Code | `.claude/settings.json` | commands, agents, hooks, skills |
| OpenCode | `opencode.json` | commands, agents |
| Gemini CLI | `.gemini/settings.json` + `GEMINI.md` | commands, agents |
| Codex CLI | `codex.json` + agent sandbox mappings | commands, agents |
| GitHub Copilot | `.github/copilot-instructions.md` | tool name mappings |
| Antigravity | `antigravity.json` | commands |
| Cursor | `.cursor/rules/` | rules files |
| Windsurf | `.windsurfrules` | rules file |

---

## 2. Architecture

### Pattern: Command -> Workflow -> Agent

GSD uses a three-layer dispatch architecture. Commands are thin; workflows are heavy; agents are specialized.

```
User types /gsd:execute-phase
        |
        v
+--------------------------------------------+
|  COMMAND LAYER (commands/gsd/)             |
|  57 thin frontmatter files (~20-50 lines)  |
|  Maps slash command to workflow via @ref    |
+-------------------+------------------------+
                    | @get-shit-done/workflows/execute-phase.md
                    v
+--------------------------------------------+
|  WORKFLOW LAYER (get-shit-done/workflows/) |
|  56 heavyweight .md files (18,913 lines)   |
|  Full orchestration: prompts, decisions,   |
|  state transitions, agent dispatch         |
|  Calls gsd-tools.cjs for state ops         |
+--------+--------------+-------------------+
         |              |
         v              v
+----------------+  +-------------------------+
| CLI BRIDGE     |  | AGENT LAYER             |
| gsd-tools.cjs  |  | agents/ (18 agents)     |
| 918 lines      |  | 9,851 total lines       |
| State, phase,  |  | Specialized subagents   |
| config ops     |  | with frontmatter config |
+----------------+  +-------------------------+
         |
         v
+--------------------------------------------+
| LIB MODULES (get-shit-done/bin/lib/)       |
| 17 CJS modules (10,743 lines)             |
| Pure functions: path, state, config, etc.  |
+--------------------------------------------+
```

Runtime hooks intercept tool calls independently:
```
HOOK LAYER (hooks/dist/) - 5 hooks, 579 lines
PostToolUse: statusline, context-monitor
PreToolUse: prompt-guard, workflow-guard
SessionStart: check-update
```

### Component Map

#### Commands (`commands/gsd/` -- 57 files)

Thin frontmatter definitions. Each file defines a slash command with metadata and references a workflow file via `@` path syntax. The command layer is intentionally lightweight -- all logic lives in workflows.

**Primary pipeline commands:**

| Command | File | Purpose |
|---------|------|---------|
| `/gsd:discuss-phase` | `discuss-phase.md` | Gather context through adaptive questioning |
| `/gsd:plan-phase` | `plan-phase.md` | Create PLAN.md with verification loop |
| `/gsd:execute-phase` | `execute-phase.md` | Wave-based parallel execution |
| `/gsd:verify-work` | `verify-work.md` | Conversational UAT against acceptance criteria |
| `/gsd:ship` | `ship.md` | Create PR, run review, prepare for merge |

**Lightweight paths:**

| Command | File | Purpose |
|---------|------|---------|
| `/gsd:quick` | `quick.md` | Quick execution with GSD guarantees |
| `/gsd:fast` | `fast.md` | Fastest path, minimal ceremony |
| `/gsd:do` | `do.md` | Freeform text router to right command |

**Analysis and research:**

| Command | File | Purpose |
|---------|------|---------|
| `/gsd:map-codebase` | `map-codebase.md` | Codebase analysis, spawns mapper agents |
| `/gsd:research-phase` | `research-phase.md` | Deep research before planning |
| `/gsd:debug` | `debug.md` | Debugging workflow |
| `/gsd:forensics` | `forensics.md` | Post-mortem analysis |

**Project management:**

| Command | File | Purpose |
|---------|------|---------|
| `/gsd:new-project` | `new-project.md` | Project initialization with profiling |
| `/gsd:new-milestone` | `new-milestone.md` | Milestone creation |
| `/gsd:milestone-summary` | `milestone-summary.md` | Milestone reporting |
| `/gsd:workstreams` | `workstreams.md` | Multi-workstream management |
| `/gsd:thread` | `thread.md` | Threaded conversation management |

**Status and diagnostics:**

| Command | File | Purpose |
|---------|------|---------|
| `/gsd:progress` | `progress.md` | Progress check, route to next action |
| `/gsd:stats` | `stats.md` | Project statistics |
| `/gsd:health` | `health.md` | .planning/ directory diagnostics |

Command frontmatter fields: `name`, `description`, `argument-hint`, `allowed-tools`, `agent` (optional).

#### Workflows (`get-shit-done/workflows/` -- 56 files, 18,913 lines)

The heavyweight implementation layer. Workflows contain full orchestration logic: prompts, decision trees, state transitions, agent dispatch instructions, and output formatting.

**Largest workflows:**

| File | Lines | Purpose |
|------|-------|---------|
| `new-project.md` | 1,250 | Project initialization with user profiling |
| `discuss-phase.md` | 1,049 | Adaptive questioning engine |
| `plan-phase.md` | 859 | Plan generation with complexity assessment |
| `execute-phase.md` | 846 | Wave-based parallel execution orchestration |
| `autonomous.md` | 816 | Autonomous execution mode |
| `complete-milestone.md` | 767 | Milestone completion and archival |
| `quick.md` | 757 | Quick execution path |
| `verify-work.md` | 637 | UAT verification against acceptance criteria |
| `debug.md` | 609 | Debugging with hypothesis tracking |
| `map-codebase.md` | 574 | Codebase mapping orchestration |
| `update.md` | 323 | State update operations |
| `verify-phase.md` | 254 | Phase-level verification |
| `validate-phase.md` | 174 | Phase validation |

#### Agents (`agents/` -- 18 files, 9,851 lines)

Specialized subagent definitions with frontmatter (name, description, tools, model, permissionMode, color, skills). Each `.md` file becomes a subagent system prompt when spawned.

| Agent | Lines | Role |
|-------|-------|------|
| `gsd-debugger.md` | 1,373 | Systematic debugging with hypothesis tracking |
| `gsd-planner.md` | 1,354 | Plan generation from discussion context |
| `gsd-plan-checker.md` | 773 | Plan completeness and quality validation |
| `gsd-codebase-mapper.md` | 770 | Codebase analysis and mapping |
| `gsd-verifier.md` | 700 | Goal-backward implementation verification |
| `gsd-phase-researcher.md` | 697 | Deep research for phase planning |
| `gsd-roadmapper.md` | 679 | Roadmap generation and management |
| `gsd-project-researcher.md` | 654 | Project-level research and analysis |
| `gsd-executor.md` | 509 | Plan execution (one task at a time) |
| `gsd-integration-checker.md` | 443 | Cross-component integration validation |
| `gsd-ui-auditor.md` | 439 | UI quality auditing |
| `gsd-ui-researcher.md` | 357 | UI research and pattern analysis |
| `gsd-ui-checker.md` | 300 | UI implementation checking |
| `gsd-research-synthesizer.md` | 247 | Research synthesis and summarization |
| `gsd-nyquist-auditor.md` | 176 | Audit frequency / sampling analysis |
| `gsd-user-profiler.md` | 171 | User skill profiling |
| `gsd-assumptions-analyzer.md` | 105 | Assumption detection and validation |
| `gsd-advisor-researcher.md` | 104 | Advisory research for recommendations |

**Model profile mapping** (from `get-shit-done/bin/lib/model-profiles.cjs`):

| Profile | opus agents | sonnet agents | haiku agents |
|---------|------------|---------------|--------------|
| quality | planner, debugger, executor, phase-researcher, project-researcher | plan-checker, verifier, codebase-mapper, integration-checker, roadmapper, research-synthesizer | ui-checker, ui-auditor, assumptions-analyzer, nyquist-auditor |
| balanced | planner, debugger | executor, plan-checker, verifier, codebase-mapper, integration-checker, roadmapper, phase-researcher, project-researcher, research-synthesizer | ui-checker, ui-auditor, assumptions-analyzer, nyquist-auditor |
| budget | planner | debugger, executor, plan-checker, verifier, codebase-mapper, roadmapper | everything else |

#### Hooks (`hooks/` -- 5 files, 579 lines source)

Runtime hooks that fire on Claude Code lifecycle events. All hooks are plain Node.js scripts that read JSON from stdin and emit JSON or exit codes.

| Hook | Lines | Event | Purpose |
|------|-------|-------|---------|
| `gsd-statusline.js` | 119 | Notification | Shows model, task, directory, context usage bar, update notices |
| `gsd-context-monitor.js` | 156 | PostToolUse | Reads bridge file from statusline, injects context warnings at high usage |
| `gsd-prompt-guard.js` | 96 | PreToolUse | Scans Write/Edit to `.planning/` for prompt injection patterns (advisory, non-blocking) |
| `gsd-workflow-guard.js` | 94 | PreToolUse | Warns on edits outside GSD workflow context (soft guard, opt-in via config) |
| `gsd-check-update.js` | 114 | SessionStart | Checks npm registry for newer package version |

**Build pipeline:** `scripts/build-hooks.js` copies source files from `hooks/` to `hooks/dist/` with `esbuild.transform()` syntax validation. The `hooks/dist/` directory is what ships in the npm package.

#### Core Library (`get-shit-done/bin/lib/` -- 17 modules, 10,743 lines)

The programmatic backbone. All state operations, path resolution, config management, and verification logic. Called by `gsd-tools.cjs` which acts as the CLI dispatcher.

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `init.cjs` | 1,442 | Compound init commands for workflow bootstrapping (cmdInitExecutePhase, cmdInitPlanPhase, etc.) |
| `core.cjs` | 1,230 | Shared utilities: path helpers (toPosixPath, findProjectRoot, planningDir, planningPaths), git operations, config loading, model resolution, output formatting |
| `state.cjs` | 1,031 | STATE.md CRUD: load, get, update, patch, begin-phase, signal-waiting/resume |
| `commands.cjs` | 969 | Standalone utility commands: generate-slug, timestamp, list-todos, verify-path, etc. |
| `profile-output.cjs` | 952 | User profiling output generation |
| `verify.cjs` | 888 | Verification and health check logic |
| `phase.cjs` | 888 | Phase CRUD: add, insert, remove, complete, next-decimal calculation |
| `profile-pipeline.cjs` | 539 | User profiling pipeline orchestration |
| `workstream.cjs` | 491 | Workstream namespacing and multi-workstream management |
| `config.cjs` | 442 | Config CRUD with validated key set (28+ valid config keys) |
| `security.cjs` | 382 | Path traversal prevention, prompt injection detection (13 patterns), shell argument validation, safe JSON parsing, regex DoS protection |
| `frontmatter.cjs` | 336 | YAML-like frontmatter extraction and reconstruction |
| `roadmap.cjs` | 329 | ROADMAP.md parsing, phase lookups, updates |
| `uat.cjs` | 282 | UAT audit rendering and checkpoint logic |
| `milestone.cjs` | 252 | Milestone completion, archival, and summary |
| `template.cjs` | 222 | Template resolution and variable substitution |
| `model-profiles.cjs` | 68 | 15 agents x 3 profiles (quality/balanced/budget) mapped to opus/sonnet/haiku |

#### CLI Dispatcher (`get-shit-done/bin/gsd-tools.cjs` -- 918 lines)

Routes CLI invocations to lib modules. Called by workflows via `node gsd-tools.cjs <command> [args]`.

**Command groups:**
- `state load|json|update|get|patch|begin-phase|signal-waiting` -- STATE.md operations
- `resolve-model <agent>` -- Model profile resolution
- `find-phase <N>` -- Phase directory lookup
- `commit` -- Structured git commits
- `verify-summary` -- Summary verification
- `phase add|insert|remove|complete` -- Phase lifecycle
- `roadmap get-phase|analyze` -- Roadmap operations
- `milestone complete` -- Milestone archival
- `validate consistency|health|agents` -- Health checks
- `progress` -- Progress reporting
- `todo` -- Todo extraction
- `uat` -- UAT operations
- `scaffold` -- Project scaffolding
- `frontmatter get|set|remove|list` -- Frontmatter CRUD
- `websearch` -- Web search integration

#### Templates (`get-shit-done/templates/` -- 32 files)

Markdown templates for generated artifacts:

- **Root templates (20):** `project.md`, `config.json`, `context.md`, `DEBUG.md`, `claude-md.md`, `copilot-instructions.md`, `dev-preferences.md`, `discovery.md`, `discussion-log.md`, `milestone.md`, `milestone-archive.md`, `phase-prompt.md`, `planner-subagent-prompt.md`, `debug-subagent-prompt.md`, `requirements.md`, `research.md`, `retrospective.md`, `continue-here.md`
- **`codebase/` (7):** Templates for codebase mapping output -- `architecture.md`, `concerns.md`, `conventions.md`, `integrations.md`, `stack.md`, `structure.md`, `testing.md`
- **`research-project/` (5):** Templates for research projects -- `ARCHITECTURE.md`, `FEATURES.md`, `PITFALLS.md`, `STACK.md`, `SUMMARY.md`

#### References (`get-shit-done/references/` -- 15 files)

Reference documentation loaded on-demand by workflows:
`checkpoints.md`, `continuation-format.md`, `decimal-phase-calculation.md`, `git-integration.md`, `git-planning-commit.md`, `model-profile-resolution.md`, `model-profiles.md`, `phase-argument-parsing.md`, `planning-config.md`, `questioning.md`, `tdd.md`, `ui-brand.md`, `user-profiling.md`, `verification-patterns.md`, `workstream-flag.md`

---

## 3. Entry Points

### npm Install Entry (`bin/install.js`)

- **Path:** `get-shit-done/bin/install.js`
- **Lines:** 5,185
- **Invocation:** `npx get-shit-done-cc` or `npx get-shit-done-cc --help`
- **Defined in:** `package.json` -> `"bin": { "get-shit-done-cc": "bin/install.js" }`
- **Behavior:** Interactive multi-runtime installer. Detects current AI tool, copies commands/agents/hooks to config locations, updates settings files.
- **Flags:** `--global`, `--local`, `--uninstall`, `--scaffold`, `--plugins`, `--governance`, `--yes`, `--dry-run`, `--runtime <name>`, `--help`

### CLI Tool Entry (`get-shit-done/bin/gsd-tools.cjs`)

- **Path:** `get-shit-done/get-shit-done/bin/gsd-tools.cjs`
- **Lines:** 918
- **Invocation:** `node gsd-tools.cjs <command> [args]` (called by workflows, not users directly)
- **Behavior:** Routes to lib modules. Parses commands, resolves `.planning/` directory paths, dispatches operations, returns structured output (JSON or formatted text).

### Test Entry (`scripts/run-tests.cjs`)

- **Path:** `get-shit-done/scripts/run-tests.cjs`
- **Lines:** 29
- **Invocation:** `npm test` or `npm run test:coverage`
- **Behavior:** Cross-platform test runner. Reads `tests/` directory, filters `*.test.cjs` files, invokes `node --test` on each.

### Hook Build Entry (`scripts/build-hooks.js`)

- **Path:** `get-shit-done/scripts/build-hooks.js`
- **Lines:** 82
- **Invocation:** `npm run build:hooks`
- **Behavior:** Copies hook source from `hooks/` to `hooks/dist/` with esbuild syntax validation. The dist directory ships in the npm package.

---

## 4. Plugin Structure

### npm Package Contents

The `package.json` `"files"` array controls what ships:

```json
["bin", "commands", "get-shit-done", "agents", "hooks/dist", "scripts", "governance", "plugins"]
```

**Package stats:** 409 files, 1.0 MB packed, 3.4 MB unpacked.

### How GSD Registers as a Plugin

The installer writes to the target runtime's config:
- **Commands directory** -> `commands/gsd/` (57 slash commands become `/gsd:*`)
- **Agents directory** -> `agents/` (18 agents become spawnable subagents)
- **Hooks** -> Individual hook entries in settings `"hooks"` object
- **Skill** -> `get-shit-done/` directory (contains SKILL.md, workflows, templates, references, bin)

### Bundled Plugins

GSD ships two additional plugins as subdirectories:

**`plugins/claude-mcp-ecosystem/`** -- Session commands (`/prime`, `/wrap`), agent lifecycle management (3-layer routing: project-guide -> concierge/companion -> pipeline workers), workspace governance. Contains its own skills directory.

**`plugins/claude-code-factory/`** -- Extension generation system with 35+ skills, 10 subagents, and a reference library. Covers skill-factory, hook-factory, agent-factory, plugin-packager, settings-architect, mcp-configurator, and more.

### State Management (`.planning/` directory)

GSD creates and manages a `.planning/` directory in each project:

```
.planning/
+-- config.json           # GSD configuration (28+ validated keys)
+-- STATE.md              # Current execution state (phase, status, waiting flags)
+-- ROADMAP.md            # Milestones and phase sequence
+-- PROJECT.md            # Project context document
+-- codebase/             # Codebase analysis output
+-- research/             # Research output
+-- phases/
    +-- 1/
    |   +-- PLAN.md       # Phase plan with tasks and acceptance criteria
    |   +-- SUMMARY.md    # Post-execution summary
    +-- 2/
    |   +-- PLAN.md
    |   +-- SUMMARY.md
    +-- ...
```

### Data Flow: Plan -> Execute -> Verify

```
discuss-phase        plan-phase          execute-phase        verify-work
     |                    |                    |                    |
     v                    v                    v                    v
 discussion.md     phases/N/PLAN.md      STATE.md updates    VERIFICATION.md
                   (tasks + deps +       (wave progress,
                    acceptance criteria)  task status)
```

Wave-based execution groups tasks by dependencies:
```
PLAN.md tasks with dependency declarations:
  Task A: (no deps)     -> Wave 1
  Task B: (no deps)     -> Wave 1
  Task C: depends on A  -> Wave 2
  Task D: depends on B  -> Wave 2
  Task E: depends on C,D -> Wave 3

Execution:
  Wave 1: [A, B] -> Task tool spawns 2 subagents simultaneously
  Wave 2: [C, D] -> Task tool spawns 2 subagents simultaneously
  Wave 3: [E]    -> Task tool spawns 1 subagent
```

---

## 5. Governance Layer

The governance layer (`governance/`) was merged from the standalone `claude-code-kickstart` project. It provides project scaffolding, health checks, and plugin management.

### Scripts

| Script | Path | Purpose |
|--------|------|---------|
| `scaffold-project.sh` | `governance/scripts/scaffold-project.sh` | Creates standard project structure: `tasks/`, `context/`, `state/`, `.claude/agents/`, `.claude/skills/`, `plans/`, `outputs/`, `decisions/`, `docs/`, `.planning/`. Copies template files. Initializes git. |
| `install-plugins.sh` | `governance/scripts/install-plugins.sh` | Installs 12 official Claude Code plugins + optional community plugins + optional GitHub/Slack integrations. |
| `health-check.sh` | `governance/scripts/health-check.sh` | 12 validation checks: Claude Code installed, Python3, Git, global CLAUDE.md, settings.json, hooks configured, permissions configured, agent teams env var, GSD installed, autocompact configured, context files exist (6 required). |

### Templates

**`governance/templates/project/`** -- Project-level:
- `CLAUDE.md` -- Project governance template
- `README.md` -- Public-facing README template
- `lessons.md` -- Lessons learned template
- `DEVOPS-HANDOFF.md` -- DevOps delivery document template

**`governance/templates/global/`** -- User-level:
- `CLAUDE.md` -- Global CLAUDE.md (14,669 lines -- the comprehensive governance document)
- `settings-hooks.json` -- Hook configuration template
- `settings-permissions.json` -- Permission configuration template

**`governance/templates/context/`** -- Reference documentation (6 files):
- `cli-reference.md`, `hooks-guide.md`, `mcp-setup-guide.md`, `settings-reference.md`, `skill-creation-guide.md`, `subagent-guide.md`

### Governance Tests

5 shell test suites in `governance/tests/`:
- `test_health_check.sh` -- Validates health check script
- `test_install_plugins.sh` -- Validates plugin installation script
- `test_install.sh` -- Validates installer
- `test_integration.sh` -- Integration tests
- `test_scaffold.sh` -- Validates scaffolding script

Run in CI under a separate `governance` job using Python + Bash (no Node.js required).

---

## 6. Test Architecture

### Framework

- **Runner:** Node.js built-in test runner (`node:test`)
- **Assertions:** Node.js built-in `node:assert` (strict mode)
- **Coverage:** `c8` with `--check-coverage --lines 70` on `get-shit-done/bin/lib/*.cjs`
- **Mocking:** No mocking libraries; tests use filesystem-based isolation (temp directories via `fs.mkdtempSync`)

### Test Organization

- **Location:** `tests/` directory at package root (NOT co-located with source)
- **Naming:** `{module}.test.cjs` matching lib module name
- **Count:** 52 test files, 24,688 total lines

### Current Results

```
301 test suites
1,547 assertions
0 failures
~15 seconds runtime
```

### Test Files (top 15 by size)

| File | Lines | Module Tested |
|------|-------|---------------|
| `phase.test.cjs` | 1,776 | Phase CRUD operations |
| `state.test.cjs` | 1,611 | STATE.md operations |
| `commands.test.cjs` | 1,583 | Standalone utility commands |
| `core.test.cjs` | 1,567 | Core utilities and path helpers |
| `codex-config.test.cjs` | 1,485 | Codex CLI configuration |
| `copilot-install.test.cjs` | 1,340 | Copilot installation |
| `init.test.cjs` | 1,259 | Init command operations |
| `security.test.cjs` | 1,064 | Security module (path traversal, injection) |
| `install.test.cjs` | 1,000+ | Main installer |
| `config.test.cjs` | 950+ | Config CRUD |
| `verify.test.cjs` | 900+ | Verification logic |
| `roadmap.test.cjs` | 800+ | Roadmap operations |
| `frontmatter.test.cjs` | 700+ | Frontmatter parsing |
| `milestone.test.cjs` | 600+ | Milestone operations |
| `workstream.test.cjs` | 458 | Workstream namespacing |

### Test Pattern

Tests use `describe`/`it` from `node:test` with filesystem-based isolation:

```javascript
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('os');

describe('ModuleName', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
    // Set up .planning/ directory structure in tmpDir
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should do the thing', () => {
    // Arrange: write files to tmpDir
    // Act: call module function
    // Assert: check results
    assert.strictEqual(result.field, expectedValue);
  });
});
```

### Coverage Enforcement

```bash
c8 --check-coverage --lines 70 \
   --include 'get-shit-done/bin/lib/*.cjs' \
   node scripts/run-tests.cjs
```

Coverage scope is limited to `get-shit-done/bin/lib/*.cjs` (the CJS library layer). Commands, agents, hooks, and workflows are prompt content -- not measurable by V8 coverage.

---

## 7. Current State

### Version & Release

| Metric | Value |
|--------|-------|
| **Version** | 1.28.0 (released 2026-03-22) |
| **Package name** | `get-shit-done-cc` |
| **npm registry** | Published |
| **Node requirement** | >= 20.0.0 |

### v1.28.0 Features (latest)

- Workstream namespacing (multi-workstream support)
- Multi-project workspace management
- Forensics command (post-mortem analysis)
- Milestone summary command
- UI-phase recommendation engine

### v1.27.0 Features (previous)

- Advisor mode
- Cursor runtime support
- Multi-repo workspace
- `/gsd:fast` command
- Security hardening module (`security.cjs`)

### Health

| Metric | Value |
|--------|-------|
| Test suites | 301 |
| Assertions | 1,547 passing, 0 failing |
| Governance tests | 5 shell suites |
| Coverage threshold | 70% lines (lib layer) |
| CI status | Green on all matrix entries |
| Package size | 409 files, 1.0 MB packed, 3.4 MB unpacked |
| Runtime deps | 0 |
| Supported runtimes | 8 |
| Slash commands | 57 |
| Agents | 18 |
| Hooks | 5 |

---

## 8. Key Files

### Critical Path (execution pipeline)

| File | Lines | Role |
|------|-------|------|
| `bin/install.js` | 5,185 | Multi-runtime installer -- user's first contact with GSD |
| `get-shit-done/bin/gsd-tools.cjs` | 918 | CLI dispatcher -- every workflow calls this for state ops |
| `get-shit-done/bin/lib/core.cjs` | 1,230 | Foundation -- path helpers, git ops, config loading, model resolution |
| `get-shit-done/bin/lib/state.cjs` | 1,031 | STATE.md CRUD -- the central coordination point |
| `get-shit-done/bin/lib/init.cjs` | 1,442 | Workflow bootstrapping -- sets up execution context for each command |
| `get-shit-done/bin/lib/phase.cjs` | 888 | Phase lifecycle -- add, insert, remove, complete |
| `get-shit-done/bin/lib/security.cjs` | 382 | Security gates -- path traversal, injection detection, argument validation |
| `get-shit-done/bin/lib/config.cjs` | 442 | Config CRUD -- 28+ validated keys, default values |
| `get-shit-done/bin/lib/verify.cjs` | 888 | Verification and health check logic |
| `get-shit-done/bin/lib/commands.cjs` | 969 | Utility command implementations |

### Largest Workflows (orchestration logic)

| File | Lines | Role |
|------|-------|------|
| `get-shit-done/workflows/new-project.md` | 1,250 | Project initialization with profiling |
| `get-shit-done/workflows/discuss-phase.md` | 1,049 | Adaptive questioning engine |
| `get-shit-done/workflows/plan-phase.md` | 859 | Plan generation with complexity assessment |
| `get-shit-done/workflows/execute-phase.md` | 846 | Wave-based parallel execution |
| `get-shit-done/workflows/autonomous.md` | 816 | Autonomous execution mode |
| `get-shit-done/workflows/complete-milestone.md` | 767 | Milestone completion and archival |
| `get-shit-done/workflows/quick.md` | 757 | Quick execution path |
| `get-shit-done/workflows/verify-work.md` | 637 | UAT verification against acceptance criteria |
| `get-shit-done/workflows/debug.md` | 609 | Debugging with hypothesis tracking |
| `get-shit-done/workflows/map-codebase.md` | 574 | Codebase mapping orchestration |

### Largest Agents (subagent prompts)

| File | Lines | Role |
|------|-------|------|
| `agents/gsd-debugger.md` | 1,373 | Systematic debugging |
| `agents/gsd-planner.md` | 1,354 | Plan generation |
| `agents/gsd-plan-checker.md` | 773 | Plan quality validation |
| `agents/gsd-codebase-mapper.md` | 770 | Codebase analysis |
| `agents/gsd-verifier.md` | 700 | Goal-backward verification |
| `agents/gsd-phase-researcher.md` | 697 | Phase research |
| `agents/gsd-roadmapper.md` | 679 | Roadmap management |
| `agents/gsd-project-researcher.md` | 654 | Project research |
| `agents/gsd-executor.md` | 509 | Task execution |

### Configuration & Metadata

| File | Lines | Role |
|------|-------|------|
| `package.json` | ~45 | Package manifest, scripts, file list, zero runtime deps |
| `CLAUDE.md` | ~45 | Project-level instructions for Claude Code |
| `CHANGELOG.md` | 500+ | Release history |
| `get-shit-done/SKILL.md` | ~30 | Skill registration (name, description, triggers) |
| `get-shit-done/bin/lib/model-profiles.cjs` | 68 | 15 agent names x 3 profiles -> model tier mapping |

### Build & CI

| File | Lines | Role |
|------|-------|------|
| `scripts/run-tests.cjs` | 29 | Cross-platform test runner |
| `scripts/build-hooks.js` | 82 | Hook bundling with syntax validation |
| `.github/workflows/test.yml` | 68 | CI test matrix (5 OS/Node combos + governance) |
| `.github/workflows/security-scan.yml` | ~50 | PR security scanning (injection, base64, secrets) |

### Security Scripts

| File | Role |
|------|------|
| `scripts/prompt-injection-scan.sh` | Scans for prompt injection patterns in source |
| `scripts/base64-scan.sh` | Detects base64-encoded obfuscation |
| `scripts/secret-scan.sh` | Scans for leaked secrets |

---

*Codebase map generated 2026-03-25. Source: `/Users/cpconnor/projects/Pete-Gets-Shit-Done/get-shit-done/`*
