# Root Workspace Map

**Analysis Date:** 2026-03-25
**Workspace Root:** `/Users/cpconnor/projects/Pete-Gets-Shit-Done`

---

## Overview

This workspace is a coordination layer housing two independent git sub-repos plus root-level planning and governance files. It is not itself a deployable product — it is the staging ground for a multi-phase merge operation that combines `claude-code-kickstart/` (governance framework) into `get-shit-done/` (execution engine) to produce a unified npm package.

The workspace root has its own git repo (`git init` was run, no commits yet) that is `.gitignore`d to exclude both sub-repos.

---

## Root-Level Files

| File | Purpose | Status |
|------|---------|--------|
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/CLAUDE.md` | Project behavioral rules for Claude sessions — workflow orchestration, communication protocol, code standards, advanced capabilities | Active — loaded by Claude on session start |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/GLOBALCLAUDE.md` | Legacy 622-line global CLAUDE.md (agent-teams pipeline era). Source material for the ongoing CLAUDE.md rewrite task. | Legacy reference — do not deploy. Being superseded. |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/Final Plan: Merge claude-code-kickstart into get-shit-done.md` | 9-phase merge plan (v2.0) defining the complete strategy for absorbing kickstart into GSD. Contains dependency graph, risk assessment, phase-by-phase verification steps. | Active planning document — authoritative merge spec |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/claude-code-merge-prompt.md` | The prompt used to kick off the CLAUDE.md rewrite task (Phase 3 of the merge). Describes the 3-phase analysis → plan → execute flow for producing a merged global CLAUDE.md. | Historical prompt — informational |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/.gitignore` | Ignores both sub-repos (`get-shit-done/`, `claude-code-kickstart/`) and `.DS_Store`. The root git repo tracks only planning and governance files, not sub-repo contents. | Active |

**Root directories:**

| Directory | Purpose |
|-----------|---------|
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/tasks/` | Task tracking: `todo.md` (current execution state) and `lessons.md` (session rules) |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/state/` | Session audit trail: `session-log.md` |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/get-shit-done/` | Sub-repo: GSD execution engine (npm package `get-shit-done-cc`) |
| `/Users/cpconnor/projects/Pete-Gets-Shit-Done/claude-code-kickstart/` | Sub-repo: Governance framework (being merged into GSD, archived post-merge) |

---

## Sub-Repo Relationship

### get-shit-done/ — Execution Engine

- **Role:** Layer 2. The "HOW/WHEN" system. Provides 55+ `/gsd:*` commands, wave-based parallel execution, `.planning/` state management, milestone tracking, workstreams.
- **npm package:** `get-shit-done-cc` v1.28.0
- **Git:** Active repo on `main`. Has 295+ test suites. CI/CD pipeline active.
- **Key structure:**
  - `bin/install.js` (5,185 lines) — multi-runtime installer, now extended with governance logic
  - `commands/` — 55+ command definitions
  - `agents/` — 18 agent definitions
  - `governance/` — absorbs kickstart's governance layer (see below)
  - `plugins/` — absorbs kickstart's plugin engines
  - `hooks/dist/` — GSD's 5 runtime hooks

### claude-code-kickstart/ — Governance Framework

- **Role:** Layer 1. The "WHAT/RULES" system. Provides hooks, permissions, CLAUDE.md template, install scripts, 2 plugin engines (claude-mcp-ecosystem + claude-code-factory with 100+ skills).
- **Git:** Active repo. Last commits are maintenance (CI fixes, README archival notice).
- **Current state:** Archived — README now contains redirect notice pointing users to GSD v1.29+.
- **Key structure:**
  - `plugins/claude-mcp-ecosystem/` — 9 session management commands + agent lifecycle
  - `plugins/claude-code-factory/` — 35 skills, 10 subagents
  - `templates/global/CLAUDE.md` — Original template (superseded by `get-shit-done/governance/templates/global/CLAUDE.md`)
  - `install.sh` — Original install script (superseded by GSD's `bin/install.js`)

---

## Merge Plan: Strategy and Phase Status

The merge plan document at `/Users/cpconnor/projects/Pete-Gets-Shit-Done/Final Plan: Merge claude-code-kickstart into get-shit-done.md` defines a 9-phase strategy. Core thesis: GSD = execution engine, Kickstart = governance brain. The merged system is a single npm package that installs both.

### Phase Status Assessment

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 0** | Pre-flight baseline measurements | Complete (implied — work proceeded) |
| **Phase 1** | Apex stripping from kickstart plugins | **Complete** — `grep -ri 'apex'` returns 0 results in `get-shit-done/plugins/` |
| **Phase 2** | Copy kickstart assets into GSD repo | **Complete** — `get-shit-done/governance/` and `get-shit-done/plugins/` both exist with correct structure |
| **Phase 3** | Global CLAUDE.md template rewrite (manual) | **Complete** — `get-shit-done/governance/templates/global/CLAUDE.md` is 359 lines, 0 "Agent Teams" references, 24 `gsd` references. Meets all Phase 3 verification criteria. |
| **Phase 4** | Hook merging | **Complete** — `settings-hooks.json` is 111 lines with 10 hooks |
| **Phase 5** | MCP Ecosystem plugin command reconciliation | **Complete** — `get-shit-done/plugins/claude-mcp-ecosystem/commands/` contains only: `agents.md`, `agent-add.md`, `agent-diagnose.md`, `agent-remove.md`, `agent-reset.md`, `agent-setup.md`, `agent-status.md`, `prime.md`, `wrap.md`. The three conflicting commands (`plan.md`, `build.md`, `status.md`) are absent — deleted as planned. |
| **Phase 6** | Unified install flow (file copy + JSON merge) | **Complete** — `bin/install.js` contains 39 references to `governance`/`--no-governance`/`--scaffold`. `package.json` files array includes `"governance"` and `"plugins"`. |
| **Phase 7** | Testing | **Complete** — 5 new integration test files present: `governance-claude-md.test.cjs`, `governance-hooks.test.cjs`, `governance-install.test.cjs`, `json-merge-idempotent.test.cjs`, `plugin-integration.test.cjs` |
| **Phase 8** | Documentation | **Complete** — README contains 24 `governance` references. `docs/` contains `governance-customization.md` and `ARCHITECTURE.md`. |
| **Phase 9** | Kickstart repo archival | **Complete** — `claude-code-kickstart/README.md` contains redirect notice to GSD v1.29+. |

**Overall merge status: All 9 phases appear complete.**

### Remaining Open Work (not merge phases)

The only confirmed incomplete task is a **separate CLAUDE.md rewrite** for Pete's personal global `~/.claude/CLAUDE.md`. This is distinct from the governance template rewrite (Phase 3). The task involves:

1. Writing a merged ~430-line file that combines the governance template skeleton with Pete's behavioral rules from `/Users/cpconnor/projects/Pete-Gets-Shit-Done/CLAUDE.md` and GSD command coverage
2. Deploying it to `~/.claude/CLAUDE.md`
3. Updating the governance template source (Pete-agnostic version)

State: Plan approved and written to `/Users/cpconnor/.claude/plans/reactive-discovering-book.md`. Backup of current `~/.claude/CLAUDE.md` at `~/.claude/CLAUDE.md.bak`. Execution deferred to next session.

See `/Users/cpconnor/projects/Pete-Gets-Shit-Done/tasks/todo.md` for the checklist.

---

## Root Git State

The workspace root has been initialized as a git repo (`git init` was run) but has **zero commits**. All substantive files are untracked:

```
Untracked files:
  .gitignore
  CLAUDE.md
  Final Plan: Merge claude-code-kickstart into get-shit-done.md
  GLOBALCLAUDE.md
  claude-code-merge-prompt.md
  state/
  tasks/
```

The `.gitignore` correctly excludes both sub-repos. This means the root repo is intended to track only planning/governance files (CLAUDE.md, merge plans, tasks, state) — not the sub-repo contents.

**No feat/kickstart-merge branch exists at root** (there are no branches at all, since there are no commits). The merge work was executed directly inside the `get-shit-done/` sub-repo on its `main` branch.

---

## Architecture: Two-Layer System

The merged system implements a two-layer architecture:

```
Layer 1 — Governance (from claude-code-kickstart, now in get-shit-done/governance/ and get-shit-done/plugins/)
  Provides: hooks, permissions, CLAUDE.md template, context docs, plugin engines
  Install: default (opt out with --no-governance)

Layer 2 — Execution Engine (get-shit-done core)
  Provides: /gsd:* commands, wave-based parallelization, .planning/ state, milestone tracking
  Install: always included
```

**The root workspace exists to coordinate the merge itself.** Once the merge is shipped as GSD v1.29+, the root workspace's purpose is complete. The ongoing work (personal CLAUDE.md rewrite) is a separate, post-merge task.

---

## Key File Cross-References

| Reference | From → To |
|-----------|-----------|
| Merge strategy | `Final Plan: Merge claude-code-kickstart into get-shit-done.md` → implemented in `get-shit-done/` |
| CLAUDE.md rewrite prompt | `claude-code-merge-prompt.md` → task in `tasks/todo.md` |
| Governance template | `claude-code-kickstart/templates/global/CLAUDE.md` (original) → `get-shit-done/governance/templates/global/CLAUDE.md` (rewritten, Phase 3) |
| Plugin engines | `claude-code-kickstart/plugins/` → `get-shit-done/plugins/` (Apex-stripped copies) |
| Install logic | `claude-code-kickstart/install.sh` → extended into `get-shit-done/bin/install.js` |
| Session commands | `claude-code-kickstart/plugins/claude-mcp-ecosystem/commands/` → deduplicated set in `get-shit-done/plugins/claude-mcp-ecosystem/commands/` |

---

## Gaps and Observations

1. **Root git repo has no commits.** The root `.gitignore`, `CLAUDE.md`, `tasks/`, and `state/` are all untracked. An initial commit would make session state recoverable.

2. **GLOBALCLAUDE.md is a legacy artifact.** It is 622 lines and should be kept as reference until the personal CLAUDE.md rewrite is complete, then deleted or archived.

3. **No `.planning/` at root.** The root uses the older `tasks/todo.md` + `state/session-log.md` pattern rather than GSD's `.planning/STATE.md` pattern. Since this workspace uses GSD locally, migrating to `.planning/STATE.md` would align with the tool's own conventions.

4. **GSD version is 1.28.0.** The merge work targets v1.29+. The package has not been published at the merged version yet — the governance/plugins inclusion in `package.json` is present but the version bump and publish are pending.

5. **No integration test run verified.** The test files for Phase 7 exist, but there is no recorded evidence of `npm test` passing in the session logs. This is the last gate before the v1.29 publish.
