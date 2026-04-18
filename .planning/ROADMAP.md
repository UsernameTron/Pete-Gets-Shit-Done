# Roadmap — v2.6 Developer Experience

**Milestone:** v2.6 Developer Experience
**Phases:** 3 (Phase 49 – Phase 51)
**Coverage:** 18/18 requirements mapped
**Previous milestone:** v2.5 Final Documentation Sync (Phase 48, shipped 2026-04-17)

---

## Phases

- [ ] **Phase 49: One-Command Install** - A single script takes a fresh git clone to a fully working, health-verified GSD install
- [x] **Phase 50: CI Watch** - /gsd:ci-watch polls GitHub Actions in real time, surfaces results, fetches logs on failure, and suggests fixes (completed 2026-04-17)
- [x] **Phase 51: Sync Docs** - /gsd:sync-docs audits and rewrites all project documentation from live codebase state, then reports what changed (completed 2026-04-18)

---

## Phase Details

### Phase 49: One-Command Install
**Goal**: A developer can go from fresh git clone to verified working GSD install by running one command
**Depends on**: Nothing (first phase of milestone)
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07
**Success Criteria** (what must be TRUE):
  1. Running the install command on a fresh clone completes without manual intervention and exits 0
  2. After the script runs, all GSD slash commands are reachable from a Claude Code session (symlinks exist in ~/.claude/commands/gsd/)
  3. After the script runs, built hooks are present in ~/.claude/hooks/ and the plugin is registered in Claude Code config
  4. The script's final output clearly states pass or fail with specifics on what was verified
  5. lib/injection-patterns.json is present at every location that consumes it after install
**Plans**: TBD

### Phase 50: CI Watch
**Goal**: Users can monitor GitHub Actions results for the current branch without leaving the Claude Code session
**Depends on**: Phase 49
**Requirements**: CIWATCH-01, CIWATCH-02, CIWATCH-03, CIWATCH-04, CIWATCH-05
**Success Criteria** (what must be TRUE):
  1. Running /gsd:ci-watch begins polling and prints live run status (name, status, URL) for the current branch
  2. The command continues polling at a configurable interval until all runs reach a terminal state (success, failure, or cancelled)
  3. On success, the command exits with a clear all-green summary
  4. On failure, the command fetches and displays the relevant workflow log section that caused the failure
  5. On failure, the command outputs at least one concrete, actionable fix suggestion derived from the log content
**Plans**: TBD

### Phase 51: Sync Docs
**Goal**: Users can synchronize all project documentation to match live codebase reality with one command
**Depends on**: Phase 50
**Requirements**: SDOCS-01, SDOCS-02, SDOCS-03, SDOCS-04, SDOCS-05, SDOCS-06
**Success Criteria** (what must be TRUE):
  1. Running /gsd:sync-docs completes without error and updates all four target files (README.md, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF.md)
  2. After the command runs, numeric counts in documentation (tests, agents, commands, coverage) match values measured directly from the codebase
  3. After the command runs, milestone status and phase history in documentation match the current .planning/ state
  4. CHANGELOG.md is updated with entries derived from git history since the last recorded entry
  5. The command prints a concise diff-style summary listing every document changed and what was updated in each
**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 49. One-Command Install | 0/? | Not started | - |
| 50. CI Watch | 2/2 | Complete    | 2026-04-17 |
| 51. Sync Docs | 0/? | Complete    | 2026-04-18 |

---

## Coverage Validation

| Requirement | Phase |
|-------------|-------|
| INST-01 | Phase 49 |
| INST-02 | Phase 49 |
| INST-03 | Phase 49 |
| INST-04 | Phase 49 |
| INST-05 | Phase 49 |
| INST-06 | Phase 49 |
| INST-07 | Phase 49 |
| CIWATCH-01 | Phase 50 |
| CIWATCH-02 | Phase 50 |
| CIWATCH-03 | Phase 50 |
| CIWATCH-04 | Phase 50 |
| CIWATCH-05 | Phase 50 |
| SDOCS-01 | Phase 51 |
| SDOCS-02 | Phase 51 |
| SDOCS-03 | Phase 51 |
| SDOCS-04 | Phase 51 |
| SDOCS-05 | Phase 51 |
| SDOCS-06 | Phase 51 |

**Mapped: 18/18. No orphans.**
