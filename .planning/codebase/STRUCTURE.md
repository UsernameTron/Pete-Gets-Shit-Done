# Codebase Structure

**Analysis Date:** 2026-10-26

## Directory Layout

```
Pete-Gets-Shit-Done/
├── bin/                      # Installer
│   ├── install.js            # ~360-line CLI entry (npm "bin")
│   ├── setup-from-clone.js   # `npm run setup`
│   └── lib/                  # Installer modules (CommonJS .js)
│       ├── install-core.js, install-steps.js, uninstall-steps.js
│       ├── runtimes/         # claude, opencode, gemini, codex, copilot, antigravity, cursor, windsurf
│       ├── converters/       # per-runtime converters + shared.js
│       └── manifest.js, settings.js, settings-hooks.js, toml.js, toml-lexer.js,
│           codex-config.js, codex-hooks-feature.js, governance.js, copy.js,
│           paths.js, attribution.js, copilot-instructions.js, cli-options.js, colors.js
├── get-shit-done/            # Core payload installed into runtimes
│   ├── bin/gsd-tools.cjs     # CLI router (dispatch tables)
│   ├── bin/lib/*.cjs         # 23 CLI modules (layered)
│   ├── commands/gsd/         # 4 extra command prompts
│   ├── workflows/            # 76 workflow prompts
│   ├── references/           # shared reference docs (19)
│   └── templates/            # file templates (+ codebase/, research-project/)
├── commands/gsd/             # 68 slash-command prompts
├── agents/                   # 17 gsd-*.md agents; _archived/ retired
├── hooks/                    # hook sources; dist/ = shipped copies
├── lib/                      # data only: injection-patterns.json, ci-patterns.json
├── governance/               # templates/, scripts/*.sh, tests/*.sh
├── plugins/                  # claude-code-factory, claude-mcp-ecosystem
├── scripts/                  # build/CI/scan tooling
├── references/               # repo-level design docs (3)
├── tests/                    # node:test suites (*.test.cjs), e2e/, fixtures/, routing/
├── docs/                     # user + technical docs
├── tasks/                    # todo.md, lessons.md, session reports
├── _absorbed/                # retired/merged skills kept for reference
├── .claude/                  # project agents (agents/), settings.json, worktrees
├── .planning/                # GSD project state (STATE, ROADMAP, codebase/ ...)
└── package.json, CLAUDE.md, README.md, CHANGELOG.md, CONTRIBUTING.md, SECURITY.md
```

## Directory Purposes

**`bin/lib/`:**
- Purpose: Installer implementation, split from the former monolithic `install.js`.
- Key files: `bin/lib/install-core.js` (RUNTIMES table, `install`/`uninstall`), `bin/lib/install-steps.js`, `bin/lib/runtimes/claude.js`.

**`get-shit-done/bin/lib/`:**
- Purpose: Runtime CLI logic. Layer map in `tests/architecture.test.cjs`.
- Key files: `core.cjs` (1753 lines, shared utils/git/output), `init.cjs` (1973, workflow init contexts), `state.cjs`, `phase.cjs`, `verify.cjs`, `commands.cjs`.

**`commands/gsd/`:** one `.md` per slash command (e.g. `add-phase.md`, `autonomous.md`, `checkpoint.md`).

**`get-shit-done/workflows/`:** workflow prompts matching commands; also hold pipeline logic (execute, plan, verify, ship).

**`hooks/`:** `gsd-*.js` sources. Edit here, then `npm run build:hooks` to refresh `hooks/dist/`.

**`tests/`:**
- `*.test.cjs` per module/feature, `helpers.cjs`, `hook-helpers.cjs`, `e2e/` (own `fixtures.cjs`, `mock-layer.cjs`, `assertions.cjs`), `fixtures/`, `routing/` (golden intents).

## Key File Locations

**Entry Points:**
- `bin/install.js`: installer CLI
- `get-shit-done/bin/gsd-tools.cjs`: tools CLI (`COMMANDS` table at the bottom, `runCommand`, `main()`)

**Configuration:**
- `package.json`: scripts, `files` allowlist (bin, commands, get-shit-done, agents, hooks/dist, scripts, governance, plugins)
- `.claude/settings.json`: project hooks
- `get-shit-done/templates/config.json`: default planning config

**Core Logic:**
- `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/state.cjs`, `get-shit-done/bin/lib/model-profiles.cjs`
- `bin/lib/install-core.js`, `bin/lib/runtimes/*.js`

**Testing:**
- `tests/architecture.test.cjs` (layer rules), `tests/gsd-tools.test.cjs`, `tests/dispatcher.test.cjs`, `tests/install-coverage-*.test.cjs`, `tests/install-cli-matrix.test.cjs`
- Run: `npm test`, `npm run test:coverage`

## Naming Conventions

**Files:**
- Installer modules: `kebab-case.js` (CommonJS) in `bin/lib/`.
- CLI modules and tests: `kebab-case.cjs`; tests `<topic>.test.cjs`.
- Agents: `gsd-<role>.md`. Hooks: `gsd-<name>.js`.
- Commands/workflows: `kebab-case.md`; command frontmatter `name: gsd:<kebab>`.
- Planning artifacts: `UPPERCASE.md` (`STATE.md`, `ROADMAP.md`), `*-PLAN.md`, `*-SUMMARY.md`.

**Directories:** lowercase kebab-case; phase dirs `NN-slug` under `.planning/phases/`.

## Where to Add New Code

**New CLI command:** add handler + entry in `COMMANDS` (or a `*_SUBCOMMANDS` table) in `get-shit-done/bin/gsd-tools.cjs`; implement `cmdXxx` in the matching `get-shit-done/bin/lib/*.cjs`; test in `tests/<topic>.test.cjs`. A new lib file is Layer 3 automatically; it may require any lower layer, never the reverse.

**New slash command:** `commands/gsd/<name>.md` plus `get-shit-done/workflows/<name>.md`; update command counts/docs (`node scripts/check-doc-drift.cjs`).

**New agent:** `agents/gsd-<role>.md` (see `tests/agent-frontmatter.test.cjs`, `references/agent-design-patterns.md`).

**New runtime:** `bin/lib/runtimes/<name>.js` exporting `{ install, uninstall }`, `bin/lib/converters/<name>.js`, register in `RUNTIMES`/`RUNTIME_LABELS` in `bin/lib/install-core.js`, add path handling in `bin/lib/paths.js` and flag in `bin/install.js` and `bin/lib/cli-options.js`.

**New hook:** `hooks/gsd-<name>.js`, add to `HOOKS_TO_COPY` in `scripts/build-hooks.js`, register in `bin/lib/settings-hooks.js` flow, test via `tests/hook-helpers.cjs`.

**Shared helpers:** `get-shit-done/bin/lib/core.cjs` (CLI); `bin/lib/` (installer).

## Special Directories

**`hooks/dist/`:** built copies shipped in the package; Generated: Yes (`scripts/build-hooks.js`); Committed: Yes.
**`agents/_archived/`, `_absorbed/`:** retired material; Generated: No; Committed: Yes.
**`.planning/`:** GSD project state and these codebase maps; Committed: Yes.
**`.claude/worktrees/`:** agent worktrees; Generated: Yes; not part of the package.

---

*Structure analysis: 2026-10-26*
