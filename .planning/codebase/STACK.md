# Technology Stack

**Analysis Date:** 2026-07-12

## Languages

**Primary:**
- JavaScript (CommonJS) - All runtime code: installer (`bin/install.js`), hooks (`hooks/*.js`), core CLI (`get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/*.cjs`), build/test scripts (`scripts/*.cjs`), tests (`tests/*.test.cjs`)

**Secondary:**
- Bash - Governance scripts and CI security scans (`governance/scripts/*.sh`, `governance/tests/test_*.sh`, `scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`, `scripts/secret-scan.sh`, `scripts/ci-coverage-report.sh`)
- Markdown - Commands, workflows, agents, skills, templates; this is the core product content (`commands/gsd/*.md`, `get-shit-done/workflows/*.md`, `agents/*.md`)
- Python - No production role. Used only for ad-hoc JSON assertions inside governance shell tests (inline `python3 -c "import json; ..."` calls in `governance/scripts/health-check.sh` and `governance/tests/test_install.sh`) and provisioned in CI via `actions/setup-python` for the `governance` job. No `.py` files exist anywhere in the repo.

## Runtime

**Environment:**
- Node.js >= 20.0.0 (declared in `package.json` `engines` field)
- CI runs a 3-combination matrix defined in the test workflow: ubuntu-latest with Node 20 (full suite), ubuntu-latest with Node 22 (full suite), and macos-latest with Node 22 (non-full-suite). Node 24 and Windows were both dropped as CI targets; `CHANGELOG.md` records the reason directly: "Dropped Node 24 (not LTS) and Windows (not target platform)."

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present, 82 resolved packages total (all transitive dev tooling - see Key Dependencies)

## Frameworks

**Core:**
- No application framework. This is a CLI tool / meta-prompting system distributed as an npm package (`get-shit-done-cc`, currently version `1.30.0` per `package.json`).

**Testing:**
- Node.js built-in test runner (`node --test`) - invoked via `scripts/run-tests.cjs`
- Node.js built-in `assert` module - assertion library
- c8 ^11.0.0 (installed: 11.0.0) - V8-native code coverage (`devDependencies`)

**Build/Dev:**
- esbuild ^0.28.1 (installed: 0.28.1) - listed in `devDependencies`, used for hook bundling via `scripts/build-hooks.js`. Recently bumped from ^0.25.12; `CHANGELOG.md` logs it as "esbuild 0.25 to 0.28".
- Custom build script (`scripts/build-hooks.js`) - copies `hooks/*.js` to `hooks/dist/` with syntax validation using `vm.Script`

## Key Dependencies

**Critical (devDependencies only - zero production dependencies):**
- `c8` ^11.0.0 - code coverage via V8's built-in profiler
- `esbuild` ^0.28.1 - JavaScript bundler for hook distribution

**Runtime (Node.js built-ins only):**
- `fs`, `path`, `os` - used throughout `bin/install.js`, hooks, and `get-shit-done/bin/lib/*.cjs`
- `readline` - interactive installer prompts (`bin/install.js`, `get-shit-done/bin/lib/profile-pipeline.cjs`)
- `crypto` - `bin/install.js`, `get-shit-done/bin/lib/core.cjs`
- `child_process` (execSync/execFileSync/spawnSync) - `get-shit-done/bin/lib/core.cjs`, `commands.cjs`, `harden-repo.cjs`, `uat-runner.cjs`
- `vm` - `scripts/build-hooks.js` (syntax-validates bundled hooks before writing `hooks/dist/`)
- Global `fetch` (Node 20+ built-in, no dependency) - used by the optional Brave Search integration in `get-shit-done/bin/lib/commands.cjs` (see INTEGRATIONS.md)

## Configuration

**Environment:**
- `CLAUDE_CONFIG_DIR` - optional override for config directory location, respected by `hooks/gsd-check-update.js` and `hooks/gsd-statusline.js`
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` - governance health check (`governance/scripts/health-check.sh`) verifies this is set in the operator's shell profile
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` - must be set to `1` in the installed Claude Code `settings.json` (checked by `governance/scripts/health-check.sh`; written by `bin/install.js`)
- `NODE_V8_COVERAGE` - propagated by `scripts/run-tests.cjs` and `scripts/run-e2e-tests.cjs` so c8 can collect coverage from spawned child processes
- No `.env` files exist in the repository
- No linter or formatter config exists in the repo (no `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `biome.json`, `tsconfig.json`, `.nvmrc`, or `.python-version`). This is enforced by design: `hooks/gsd-config-protection.js` blocks Write/Edit operations against 32 known linter/formatter config filenames (ESLint, Prettier, Biome, Ruff, Stylelint, markdownlint, shellcheck - counted directly from the `PROTECTED_FILES` set in source) so agents cannot weaken checks instead of fixing source.

**Build:**
- `package.json` - package manifest, scripts, engine constraints
- `package-lock.json` - dependency lock (lockfileVersion 3)
- `.c8rc.json` - coverage scope config; explicitly includes `get-shit-done/bin/lib/*.cjs`, `get-shit-done/bin/gsd-tools.cjs`, `bin/install.js`, `hooks/*.js`, `scripts/build-hooks.js`, `.claude/hooks/lesson-capture-gate.cjs`, `scripts/validate-doc-links.cjs`, `scripts/check-doc-drift.cjs`; excludes `hooks/dist/**` and `tests/**`

**npm Scripts:**
```bash
npm run setup                # node bin/setup-from-clone.js - post-clone project setup
npm run build:hooks          # Copy hooks to dist/ with syntax validation
npm test                     # Run all unit tests via node --test
npm run test:coverage        # Unit tests with text+JSON coverage
npm run test:coverage:full   # Unit tests with text+lcov+JSON coverage
npm run test:e2e             # End-to-end tests
npm run test:e2e:smoke       # Smoke subset of e2e tests
# prepublishOnly runs build:hooks automatically before npm publish
```

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- Git (for version control and CI workflows)
- npm (for dependency management)
- No native compilation required (pure JavaScript)

**Production / Distribution:**
- Published to npm as `get-shit-done-cc`
- Binary entry point: `bin/install.js` (registered as the `get-shit-done-cc` CLI command)
- Installed into the user's Claude Code / OpenCode / Gemini / Codex / Copilot / Antigravity / Cursor / Windsurf config directories
- CI-tested platforms: Linux (Ubuntu) and macOS only. Windows was explicitly dropped as a CI target per `CHANGELOG.md`, though `bin/install.js` still contains WSL-vs-Windows-native-Node detection logic (warns and exits if Windows-native Node is detected running inside WSL) - that code path is no longer exercised by CI.

## Supported AI Runtimes

The installer (`bin/install.js`) supports deployment to multiple AI coding tool runtimes, each gated by a CLI flag (verified directly against the arg-parsing block in `bin/install.js`):

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
| All runtimes | `--all` |

Runtime-specific quirks handled in `bin/install.js`: Gemini and Antigravity use `BeforeTool`/`AfterTool` hook event names instead of `PreToolUse`/`PostToolUse`; Cursor and Windsurf use skills only (no `settings.json` hooks, no `config.toml`); Gemini additionally requires `experimental.enableAgents: true` for custom subagents.

## Zero-Dependency Architecture

This project has **zero production dependencies** - `package.json` declares no `dependencies` key at all, only `devDependencies` (`c8`, `esbuild`). All runtime code (`bin/install.js`, `hooks/*.js`, `get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/bin/lib/*.cjs`) uses only Node.js built-in modules plus the built-in global `fetch`. The two devDependencies are build/test-time only and never ship to end users as runtime deps (though the esbuild output at `hooks/dist/` is exactly what ships).

**Note on core runtime location:** the CLI's core logic (`core.cjs`, `security.cjs`, `classify.cjs`, `model-profiles.cjs`, `history.cjs`, and 17 other `.cjs` modules) lives at `get-shit-done/bin/lib/*.cjs`, not at a repo-root `lib/` directory. The repo-root `lib/` directory contains only two static JSON pattern files (`lib/ci-patterns.json`, `lib/injection-patterns.json`) consumed by the security hooks - it is not a module directory.

---

*Stack analysis: 2026-07-12*
