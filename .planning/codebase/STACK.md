# Technology Stack

**Analysis Date:** 2026-04-06

## Languages

**Primary:**
- JavaScript (CommonJS) — All runtime code, installer, hooks, tests, and build scripts

**Secondary:**
- Bash — Governance scripts, CI security scans (`governance/scripts/*.sh`, `scripts/*.sh`)
- Markdown — Commands, workflows, agents, skills, templates (the core product content)
- Python — Used only in CI governance job (`actions/setup-python`) for JSON validation in health checks

## Runtime

**Environment:**
- Node.js >= 20.0.0 (declared in `package.json` `engines` field)
- CI tests against Node 20, 22, and 24 on Ubuntu; Node 22 on macOS and Windows

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- No application framework. This is a CLI tool / meta-prompting system distributed as an npm package (`get-shit-done-cc`).

**Testing:**
- Node.js built-in test runner (`node --test`) — used via `scripts/run-tests.cjs`
- Node.js built-in `assert` module — assertion library
- c8 ^11.0.0 — V8-native code coverage (`devDependencies`)

**Build/Dev:**
- esbuild ^0.25.12 — Listed in `devDependencies`, used for hook bundling via `scripts/build-hooks.js`
- Custom build script (`scripts/build-hooks.js`) — Copies hooks to `hooks/dist/` with syntax validation using `vm.Script`

## Key Dependencies

**Critical (devDependencies only -- zero production dependencies):**
- `c8` ^11.0.0 — Code coverage via V8's built-in profiler
- `esbuild` ^0.25.12 — JavaScript bundler for hook distribution

**Runtime (Node.js built-ins only):**
- `fs`, `path`, `os`, `readline`, `crypto`, `child_process`, `vm` — All runtime code uses only Node.js standard library. No external production dependencies.

## Configuration

**Environment:**
- `CLAUDE_CONFIG_DIR` — Optional override for config directory location (checked in hooks)
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` — Governance health check verifies this is set in shell profile
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — Must be set to `1` in Claude Code settings
- No `.env` files in the repository

**Build:**
- `package.json` — Package manifest, scripts, engine constraints
- `package-lock.json` — Dependency lock (lockfileVersion 3)
- No `tsconfig.json`, no Prettier/ESLint config, no Biome config

**npm Scripts:**
```bash
npm run build:hooks          # Copy hooks to dist/ with syntax validation
npm test                     # Run all unit tests via node --test
npm run test:coverage        # Unit tests with text+JSON coverage
npm run test:coverage:full   # Unit tests with text+lcov+JSON coverage
npm run test:e2e             # End-to-end tests
npm run test:e2e:smoke       # Smoke subset of e2e tests
```

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- Git (for version control and CI workflows)
- npm (for dependency management)
- No native compilation required (pure JavaScript)

**Production / Distribution:**
- Published to npm as `get-shit-done-cc` package
- Binary entry point: `bin/install.js` (registered as `get-shit-done-cc` CLI command)
- Installed into user's Claude Code / OpenCode / Gemini / Codex / Copilot / Antigravity / Cursor / Windsurf config directories
- Cross-platform: Linux, macOS, Windows (including WSL detection)

## Supported AI Runtimes

The installer (`bin/install.js`) supports deployment to multiple AI coding tool runtimes:

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

## Zero-Dependency Architecture

This project has **zero production dependencies**. All runtime code (`bin/install.js`, `hooks/*.js`, `get-shit-done/bin/lib/*.cjs`) uses only Node.js built-in modules. The two `devDependencies` (`c8`, `esbuild`) are build/test-time only and never shipped to end users.

---

*Stack analysis: 2026-04-06*
