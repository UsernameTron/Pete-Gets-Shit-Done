# Codebase Map: claude-code-kickstart

**Analysis Date:** 2026-03-25
**Path:** `/Users/cpconnor/projects/Pete-Gets-Shit-Done/claude-code-kickstart/`
**Status:** ARCHIVED — merged into [get-shit-done](https://github.com/gsd-build/get-shit-done) as of GSD v1.29+

> This is a distribution repo, not an application. No build step. No runtime dependencies beyond bash + python3 + git.

---

## 1. Technology Stack

### Languages

**Primary: Bash**
- All scripts use portable bash compatible with macOS and Linux
- `install.sh` (236 lines) — main entry point
- `scripts/install-plugins.sh` — plugin installer
- `scripts/scaffold-project.sh` — project scaffolder
- `scripts/health-check.sh` — installation validator
- All 5 test suites in `tests/test_*.sh`

**Secondary: Python 3**
- Used exclusively for inline JSON merge operations inside `install.sh`
- No Python source files — invoked via `python3 -c "..."` heredocs
- Two critical patterns:
  - Hooks merge: additive array extension per event key
  - Permissions merge: deduplication via `dict.fromkeys`

**Supporting: JSON, Markdown**
- JSON for hooks (`settings-hooks.json`), permissions (`settings-permissions.json`), plugin manifests (`plugin.json`, `marketplace.json`)
- Markdown for all templates (CLAUDE.md variants, SKILL.md files, agent `.md` files)

### Runtime Requirements

- **bash** (macOS or Linux)
- **python3** (for JSON merge logic only)
- **git** (for scaffold — initializes on `main` branch)
- **claude** CLI (target install environment — not required for install script itself)

### No Package Manager

No `package.json`, `requirements.txt`, `Cargo.toml`, or lockfiles. This is a shell-based distribution — zero dependencies to install before running.

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) — 6 parallel jobs:

| Job | What It Does |
|-----|-------------|
| `test-suites` | Matrix over 5 `tests/test_*.sh` scripts on ubuntu-latest |
| `validate-json` | `python3 -m json.tool` on every `.json` file |
| `validate-shell` | `bash -n` syntax check on 4 scripts |
| `sanitization` | grep scan for personal data patterns (cpconnor, sk-ant-, ghp_, etc.) |
| `validate-manifests` | Verifies `plugin.json` files have no invalid `commands`/`skills` fields |

CI triggers on push and PR to `main`.

### Sanitization System

Templates use placeholder tokens replaced at install time via `sed`:

| Placeholder | Replaced With |
|------------|---------------|
| `[YOUR NAME]` | User-entered name |
| `[YOUR GITHUB USERNAME]` | GitHub username |
| `[YOUR ORG]` | Organization |
| `[YOUR EMAIL]` | Email address |
| `[DATE]` | Current date |

macOS vs Linux `sed` difference handled: `sed -i ''` on macOS, `sed -i` on Linux.

---

## 2. What Gets Installed

Running `./install.sh` performs these operations in order:

1. **Prereq check** — verifies `python3` and `git` present
2. **Backup** — saves existing `~/.claude/CLAUDE.md` to `~/.claude/CLAUDE.md.backup`
3. **Collect user info** — interactive prompts for name, GitHub username, org, email
4. **Copy + personalize CLAUDE.md** — installs `templates/global/CLAUDE.md` → `~/.claude/CLAUDE.md` with sed placeholder replacement
5. **Merge hooks** — additive JSON merge of `templates/global/settings-hooks.json` into `~/.claude/settings.json` (extends arrays per event key, does not overwrite existing hooks)
6. **Merge permissions** — deduplicating JSON merge of `templates/global/settings-permissions.json` into `~/.claude/settings.json`
7. **Set env vars** — appends `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to shell rc
8. **Copy context files** — 6 reference docs from `templates/context/` → `~/.claude/context/`
9. **Set autocompact** — appends `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` to shell rc
10. **Register marketplace** — writes `extraKnownMarketplaces` entry into `~/.claude/settings.json` pointing to local clone path
11. **Call install-plugins.sh** — installs 13 official + optional community/integration plugins
12. **Call health-check.sh** — runs 11-check validation pass

---

## 3. Architecture

### Component Map

```
claude-code-kickstart/
├── install.sh                          # Entry point — orchestrates full install
├── scripts/
│   ├── install-plugins.sh              # Plugin installer (claude plugin install)
│   ├── scaffold-project.sh             # Per-project structure creator
│   └── health-check.sh                 # 11-check installation validator
├── templates/
│   ├── global/
│   │   ├── CLAUDE.md                   # Primary deliverable: ~620-line governance template → ~/.claude/CLAUDE.md
│   │   ├── settings-hooks.json         # 10 mergeable hooks
│   │   ├── settings-permissions.json   # 26 allow rules
│   │   └── context/                    # 6 reference docs → ~/.claude/context/
│   ├── context/
│   │   ├── cli-reference.md
│   │   ├── skill-creation-guide.md
│   │   ├── mcp-setup-guide.md
│   │   ├── subagent-guide.md
│   │   ├── hooks-guide.md
│   │   └── settings-reference.md
│   └── project/
│       ├── CLAUDE.md                   # Per-project template (minimal, with placeholders)
│       ├── tasks-template.md           # todo.md template
│       ├── lessons-template.md         # lessons.md template
│       └── devops-handoff-template.md  # docs/DEVOPS-HANDOFF.md template
├── plugins/
│   ├── claude-mcp-ecosystem/           # Plugin: session commands + agent lifecycle (v2.0.0)
│   │   ├── .claude-plugin/
│   │   │   ├── plugin.json             # Manifest
│   │   │   └── marketplace.json        # Marketplace registration
│   │   └── skills/                     # All SKILL.md files for this plugin
│   └── claude-code-factory/            # Plugin: extension generation (v1.0.0)
│       ├── .claude-plugin/
│       │   ├── plugin.json
│       │   └── marketplace.json
│       └── skills/                     # 35 skills + 10 subagents
├── tests/
│   ├── test_install.sh                 # 37 assertions: installer logic
│   ├── test_health_check.sh            # 25 assertions: 3 mock environments
│   ├── test_scaffold.sh                # 19 assertions: directories + git init
│   ├── test_install_plugins.sh         # 37 assertions: plugin install logic
│   └── test_integration.sh            # 28 assertions: end-to-end + idempotency
├── docs/
│   ├── architecture.md                 # Canonical architecture reference
│   ├── getting-started.md
│   ├── user-guide.md
│   ├── command-reference.md
│   ├── customization.md
│   ├── troubleshooting.md
│   └── DEVOPS-HANDOFF.md
└── .github/workflows/ci.yml            # 6-job CI pipeline
```

### Plugin Architecture

Claude Code plugins have a required structure:

```
plugin-name/
├── .claude-plugin/
│   ├── plugin.json         # { name, description, version, author }
│   └── marketplace.json    # { name, plugins: [...] }
└── skills/
    └── skill-name/
        └── SKILL.md        # Frontmatter: name, description, allowed-tools, model
```

**`claude-mcp-ecosystem`** (v2.0.0): Three-layer agent routing system
- Layer 0: `project-guide` — invisible router (detects ecosystem state, routes to L1)
- Layer 1: `subagent-concierge` (setup), `subagent-companion` (day-to-day management)
- Layer 2: `architect`, `scaffolder`, `memory-seeder`, `validator`, `auditor` — pipeline workers invoked by L1 only

**`claude-code-factory`** (v1.0.0): Extension generation system
- 35 skills organized by category: generators (skill-factory, hook-factory, agent-factory), intelligence layer (extension-guide, intent-engine), reference skills (cc-ref-hooks, cc-ref-skills, etc.), quality (extension-auditor, extension-validator), dev team factory
- 10 specialist subagents for structured generation workflows

### Hooks Architecture

`templates/global/settings-hooks.json` defines 10 governance hooks:

| Event | Hook | Purpose |
|-------|------|---------|
| `SessionStart` | project-state-scanner | Scans project for STATE.md/todo.md, outputs systemMessage JSON |
| `PreToolUse/Bash` | branch-safety | Blocks commits to `main`/`master` branches |
| `PreToolUse/Bash` | staged-file-validation | Blocks staging `state/`, `context/`, `.env`, credential files |
| `PreToolUse/Bash` | required-docs-check | Verifies CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md exist |
| `PreToolUse/Bash` | secrets-scanner | Scans for `sk-ant-`, `sk-proj-`, `ghp_`, etc. |
| `PreToolUse/Bash` | nested-repo-detection | Blocks git operations inside nested `.git` dirs |
| `PreToolUse/Bash` | pre-push-uncommitted-check | Blocks push with uncommitted changes |
| `PostToolUse/Write\|Edit` | file-type-detector | Detects test files, SKILL.md, Python files for context |
| `Stop` | clean-tree-verifier | Blocks session end if working tree is dirty |
| `PreCompact` | task-state-preservation | Reminder to preserve task state before compaction |

Merge strategy: arrays are extended per event key. Existing hooks for an event are preserved; new hooks are appended. No overwrite.

### Permissions Architecture

`templates/global/settings-permissions.json` defines 26 `allow` rules covering:
- All `git *` operations
- `python *`, `pip *`, `npm *`
- Core filesystem ops: `cd`, `ls`, `cat`, `head`, `tail`, `grep`, `find`, `mkdir`, `rm`, `cp`, `mv`, `echo`, `wc`, `sort`, `sed`
- Dev tools: `ruff`, `mypy`, `pytest`, `make`
- Blanket `Read(*)`, `Write(*)`, `Edit(*)` tool allows

Merge strategy: deduplicating via `dict.fromkeys` — same rule cannot appear twice.

---

## 4. Data Flow

### Install Flow

```
User runs ./install.sh
  │
  ├─→ collect_user_info() — interactive prompts
  │
  ├─→ install_global_claude_md()
  │     copy templates/global/CLAUDE.md → ~/.claude/CLAUDE.md
  │     sed replace 5 placeholder tokens
  │
  ├─→ install_hooks()
  │     python3 inline: read ~/.claude/settings.json
  │                      read templates/global/settings-hooks.json
  │                      merge: extend arrays per event key
  │                      write ~/.claude/settings.json
  │
  ├─→ install_permissions()
  │     python3 inline: same structure, dedup via dict.fromkeys
  │
  ├─→ set_env_vars()
  │     append CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 to ~/.zshrc / ~/.bashrc
  │     append CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50
  │
  ├─→ install_context_files()
  │     cp templates/context/*.md → ~/.claude/context/
  │
  ├─→ register_marketplace()
  │     python3 inline: write extraKnownMarketplaces entry into ~/.claude/settings.json
  │                      preserves existing marketplace entries
  │
  ├─→ bash scripts/install-plugins.sh
  │     claude plugin install ${p}@claude-plugins-official (×13 official)
  │     optional: community plugins from agentskill-sh marketplace
  │     optional: github, slack integrations
  │
  └─→ bash scripts/health-check.sh
        11 checks: binaries, files, hooks, permissions, env, autocompact, context count
        exit 0 on pass / exit 1 on fail
```

### Scaffold Flow

```
User runs bash scripts/scaffold-project.sh
  │
  ├─→ create directories:
  │     _project_specs/features, tasks, context, state
  │     .claude/agents, .claude/skills
  │     plans, outputs, decisions, docs
  │
  ├─→ copy project templates:
  │     templates/project/CLAUDE.md → ./CLAUDE.md
  │     templates/project/tasks-template.md → tasks/todo.md
  │     templates/project/lessons-template.md → tasks/lessons.md
  │     templates/project/devops-handoff-template.md → docs/DEVOPS-HANDOFF.md
  │
  └─→ git init (if no .git exists)
        git checkout -b main
```

---

## 5. Test Architecture

**Framework:** Pure bash, no external test library
**Runner:** `for f in tests/test_*.sh; do bash "$f"; done`
**Assertions:** Inline `assert_equals`, `assert_contains`, `assert_file_exists` functions defined per test file

| Test File | Assertions | Scope |
|-----------|-----------|-------|
| `tests/test_install.sh` | 37 | File existence, sanitization, JSON hooks merge, JSON permissions merge, sed replacement, edge cases |
| `tests/test_health_check.sh` | 25 | Health check against 3 mock environments (empty, full, partial) |
| `tests/test_scaffold.sh` | 19 | Directories created, templates copied, git initialization |
| `tests/test_install_plugins.sh` | 37 | Plugin names, community refs, local engine installation, error handling |
| `tests/test_integration.sh` | 28 | End-to-end: scaffold → verify structure → content → sanitization → idempotency |

**Total:** 146 assertions across 5 suites

Tests create temp directories via `mktemp -d` and clean up with `trap "rm -rf $TMPDIR" EXIT`. No persistent state between test runs.

---

## 6. Key Files Reference

| File | Role | Lines |
|------|------|-------|
| `install.sh` | Main entry point — complete install orchestrator | 236 |
| `templates/global/CLAUDE.md` | Primary deliverable — governance framework template | ~620 |
| `templates/global/settings-hooks.json` | 10 governance hooks (mergeable) | ~200 |
| `templates/global/settings-permissions.json` | 26 allow rules (mergeable) | ~40 |
| `scripts/install-plugins.sh` | Plugin installer — 13 official + optional community | ~80 |
| `scripts/scaffold-project.sh` | Project structure creator | ~60 |
| `scripts/health-check.sh` | 11-check installation validator | ~90 |
| `docs/architecture.md` | Canonical architecture reference document | ~300 |
| `.github/workflows/ci.yml` | 6-job CI pipeline | 115 |

---

## 7. Current State

**Version:** 1.0.0
**Status:** ARCHIVED — superseded by GSD v1.29+ (`npx get-shit-done-cc`)
**Files:** 210 total
**Tests:** 5 suites, 146 assertions
**Plugins:** 2 bundled (claude-mcp-ecosystem v2.0.0, claude-code-factory v1.0.0)
**CI:** Passing (6 jobs: test-suites, validate-json, validate-shell, sanitization, validate-manifests)

### What Was Merged Into GSD

The governance layer from this repo — hooks, permissions, CLAUDE.md template, and plugin engines — is now the built-in governance layer in GSD v1.29+. The `--no-governance` flag opts out.

---

*Combined tech + arch analysis for claude-code-kickstart. Written 2026-03-25.*
