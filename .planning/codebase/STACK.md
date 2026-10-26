# Technology Stack

**Analysis Date:** 2026-10-26

## Languages

**Primary:**
- JavaScript (CommonJS, `'use strict'`) - All runtime code: installer entry (`bin/install.js`) and its modules (`bin/lib/*.js`, `bin/lib/runtimes/*.js`, `bin/lib/converters/*.js`), hooks (`hooks/*.js`), core CLI (`get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/*.cjs`), build/test scripts (`scripts/*.cjs`, `scripts/build-hooks.js`), tests (`tests/`)

**Secondary:**
- Bash - Governance scripts and CI security scans (`governance/scripts/*.sh`, `governance/tests/test_*.sh`, `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`, `scripts/secret-scan.sh`, `scripts/ci-coverage-report.sh`, `scripts/gsd-agent-health-check.sh`, `.release-monitor.sh`)
- Markdown - Core product content: commands (`commands/gsd/*.md`, 68 files), agents (`agents/*.md`, 17 files), workflows (`get-shit-done/workflows/`), templates (`get-shit-done/templates/`), skills (`plugins/*/skills/*/SKILL.md`)
- JSON - Pattern data (`lib/injection-patterns.json`, `lib/ci-patterns.json`), plugin manifests (`plugins/*/.claude-plugin/plugin.json`)
- Python - No `.py` files. Only inline `python3 -c "import json; ..."` assertions in governance shell scripts/tests; `actions/setup-python` provisions it for the CI `governance` job.

## Runtime

**Environment:**
- Node.js >= 20.0.0 (`engines` in `package.json`)
- CI matrix (`.github/workflows/test.yml`): ubuntu-latest Node 20 and 22 (full suite), macos-latest Node 22 (non-full suite)

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present (82 `resolved` entries, all transitive dev tooling)

## Frameworks

**Core:**
- No application framework. CLI tool / meta-prompting system published as npm package `get-shit-done-cc` version `1.30.0` (`package.json`).

**Testing:**
- Node.js built-in test runner (`node:test`), launched via `scripts/run-tests.cjs`
- Node.js built-in `assert`
- c8 ^11.0.0 - V8 coverage; config in `.c8rc.json`

**Build/Dev:**
- esbuild ^0.28.1 (devDependency)
- `scripts/build-hooks.js` - copies `hooks/*.js` to `hooks/dist/` with `vm.Script` syntax validation; run by `prepublishOnly`

## Key Dependencies

**Critical (devDependencies only; zero production dependencies):**
- `c8` ^11.0.0 - coverage
- `esbuild` ^0.28.1 - hook build tooling

**Runtime (Node.js built-ins only):**
- `fs`, `path`, `os` - installer, hooks, core libs
- `readline` - interactive installer prompts
- `crypto`, `child_process` - `get-shit-done/bin/lib/core.cjs`, `commands.cjs`, `harden-repo.cjs`, `uat-runner.cjs`; `hooks/gsd-check-update.js` (spawn + `execSync`)
- `vm` - `scripts/build-hooks.js`
- Global `fetch` (Node 20+) - Brave Search call in `get-shit-done/bin/lib/commands.cjs`
- Hand-written TOML handling for Codex config: `bin/lib/toml.js`, `bin/lib/toml-lexer.js`, `bin/lib/codex-config.js` (no TOML package)

## Configuration

**Environment (read via `process.env`, verified in source):**
- `CLAUDE_CONFIG_DIR`, `CLAUDE_SESSION_ID`, `CLAUDE_MODEL`, `CLAUDE_PROJECT_DIR` - hooks (`hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`, `hooks/gsd-cost-tracker.js`, `hooks/gsd-context-monitor.js`)
- Per-runtime config dir overrides in `bin/lib/runtimes/*.js`: `GEMINI_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG`, `XDG_CONFIG_HOME`, `CODEX_HOME`, `COPILOT_CONFIG_DIR`, `CURSOR_CONFIG_DIR`, `WINDSURF_CONFIG_DIR`, `ANTIGRAVITY_CONFIG_DIR`
- `GSD_WORKSTREAM` - active workstream selector (`get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/*.cjs`)
- `GSD_DEBUG` - stderr diagnostics (`get-shit-done/bin/lib/core.cjs`)
- `GSD_TEST_MODE` - skips installer main flow so tests can import it (`bin/install.js`)
- `GSD_UPDATE_SOURCE` - overrides fork package path in `hooks/gsd-check-update.js`
- `WSL_DISTRO_NAME` - WSL detection in `bin/install.js`
- `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`, `EXA_API_KEY` - optional research providers (see `INTEGRATIONS.md`)
- `NODE_V8_COVERAGE` - propagated by `scripts/run-tests.cjs` / `scripts/run-e2e-tests.cjs` for c8
- No `.env` files in the repository
- No linter/formatter/tsconfig/`.nvmrc` config in repo by design: `hooks/gsd-config-protection.js` blocks Write/Edit to 32 protected config filenames (`PROTECTED_FILES` set).

**Build:**
- `package.json` - manifest, scripts, `files` allowlist (`bin`, `commands`, `get-shit-done`, `agents`, `hooks/dist`, `scripts`, `governance`, `plugins`)
- `.c8rc.json` - includes `get-shit-done/bin/lib/*.cjs`, `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, `bin/lib/**/*.js`, `hooks/*.js`, `scripts/build-hooks.js`, `.claude/hooks/lesson-capture-gate.cjs`, `scripts/validate-doc-links.cjs`, `scripts/check-doc-drift.cjs`; excludes `hooks/dist/**`, `tests/**`; `all: true`
- `.secretscanignore`, `.base64scanignore` - scan allowlists for CI scripts

**npm Scripts:**
```bash
npm run setup                # node bin/setup-from-clone.js
npm run build:hooks          # node scripts/build-hooks.js
npm test                     # node scripts/run-tests.cjs
npm run test:coverage        # c8 text + json
npm run test:coverage:full   # c8 text + lcov + json
npm run test:e2e             # node scripts/run-e2e-tests.cjs
npm run test:e2e:smoke       # smoke subset
```

## Platform Requirements

**Development:**
- Node.js >= 20.0.0, npm, Git
- No native compilation

**Production / Distribution:**
- Published to npm as `get-shit-done-cc`; bin `get-shit-done-cc` -> `bin/install.js`
- Installed into AI runtime config directories (see below)
- CI-tested: Linux and macOS only

## Supported AI Runtimes

Installer modules live in `bin/lib/runtimes/<runtime>.js` with format converters in `bin/lib/converters/<runtime>.js` (shared helpers in `bin/lib/converters/shared.js`):

| Runtime | Flag |
|---------|------|
| Claude Code | `--claude` |
| OpenCode | `--opencode` |
| Gemini CLI | `--gemini` |
| Codex CLI | `--codex` |
| GitHub Copilot | `--copilot` |
| Antigravity | `--antigravity` |
| Cursor | `--cursor` |
| Windsurf | `--windsurf` |
| All | `--all` |

Flag parsing: `bin/lib/cli-options.js`. Hook wiring: `bin/lib/settings-hooks.js`, `bin/lib/settings.js`. Gemini and Antigravity use `BeforeTool`/`AfterTool` instead of `PreToolUse`/`PostToolUse`.

## Core Runtime Location

Core CLI logic is at `get-shit-done/bin/lib/*.cjs` (23 modules, e.g. `core.cjs`, `security.cjs`, `history.cjs`, `model-profiles.cjs`, `state.cjs`, `phase.cjs`, `verify.cjs`, `workstream.cjs`), entered via `get-shit-done/bin/gsd-tools.cjs`. Repo-root `lib/` holds only `lib/injection-patterns.json` and `lib/ci-patterns.json`.

---

*Stack analysis: 2026-10-26*
