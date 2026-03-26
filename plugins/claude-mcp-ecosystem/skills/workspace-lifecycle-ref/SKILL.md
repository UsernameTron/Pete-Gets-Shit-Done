---
name: workspace-lifecycle-ref
description: |
  Workspace command lifecycle reference — /prime, /wrap session bookends,
  GSD execution commands (/gsd:discuss-phase, /gsd:plan-phase, /gsd:execute-phase,
  /gsd:verify-work, /gsd:ship), git branching conventions (feat/, fix/, chore/),
  and session state persistence patterns.
  Background knowledge only — provides authoritative workspace lifecycle documentation.
  NOT a user-invoked command.
user-invocable: false
---

# Workspace Command Lifecycle Reference

## Session Loop

Every session follows the same core loop:

```
/prime  -->  work  -->  /wrap
              |
         /gsd:discuss-phase --> /gsd:plan-phase --> /gsd:execute-phase --> /gsd:verify-work
```

- `/prime` opens every session. It loads operator context, detects continuity
  from the last session, finds in-progress work, and reports workspace health.
- Work happens — direct tasks, conversations, or the GSD discuss→plan→execute→verify pipeline.
- `/wrap` closes every session. It logs what was done, records decisions, and
  notes next steps so the next `/prime` can pick up cleanly.

## Commands

### Session Bookends (MCP Ecosystem)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prime` | Boot session — load context, check continuity, report readiness | Start of every session |
| `/wrap` | Close session — log work, note next steps, persist state | End of every session |

### Agent Lifecycle (MCP Ecosystem)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/agents` | List deployed specialist agents | Any time |
| `/agent-setup` | Initial agent deployment | Phase 0 bootstrap |
| `/agent-status` | Agent health check | Any time |
| `/agent-diagnose` | Diagnose agent issues | When something is broken |
| `/agent-add` | Add a specialist agent | When expanding the team |
| `/agent-remove` | Remove a specialist agent | When cleaning up |
| `/agent-reset` | Reset agent memory | When an agent is confused |

### Execution Engine (GSD)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd:discuss-phase` | Gather context before planning | Before structural or multi-file changes |
| `/gsd:plan-phase` | Create detailed execution plan | After discussion, before building |
| `/gsd:execute-phase` | Execute plan with wave-based parallelization | After plan is approved |
| `/gsd:verify-work` | Validate built features through UAT | After execution completes |
| `/gsd:ship` | Create PR and prepare for merge | After verification passes |
| `/gsd:status` | Project progress dashboard | Any time, for situational awareness |
| `/gsd:quick` | Execute a quick task with GSD guarantees | Simple tasks needing atomic commits |

## Git Branching Conventions

| Prefix | Use Case | Created By |
|--------|----------|------------|
| `feat/` | New features or capabilities | Manual or GSD execution |
| `fix/` | Bug fixes | Manual or GSD execution |
| `chore/` | Maintenance, cleanup, non-functional | Manual or GSD execution |

### Rules
- Never commit directly to `main`. Always branch first for multi-file changes.
- One logical change per commit, imperative mood: "Add validation" not "added stuff".
- Trivial single-file changes may execute on the current branch.
- Multi-file changes always create a feature branch.
- Merge back to `main` after verification passes.

## Session State Persistence

| File | Purpose | Written By |
|------|---------|------------|
| `.planning/STATE.md` | Current phase state and progress | GSD execution engine |
| `state/session-log.md` | Chronological record of all sessions | `/wrap` |
| `state/decisions.md` | Design decision records with rationale | `/wrap` |
| `.planning/phases/` | Phase plans, research, and verification | GSD plan/execute/verify |

## Workspace Health Indicators

`/prime` and `/gsd:status` check these:

| Check | Healthy | Unhealthy |
|-------|---------|-----------|
| Git state | Clean, on expected branch | Dirty working tree, detached HEAD |
| Context files | All 4 populated | Missing role.md, org.md, etc. |
| Stashed changes | None | Stash entries present |
| In-progress phases | None or acknowledged | Orphaned in-progress phases |
| Directory structure | All dirs exist | Missing .planning/, state/, context/ |
