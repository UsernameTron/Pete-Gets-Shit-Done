---
name: gsd:daily
description: Morning briefing dashboard showing milestone progress, phase status, plan completion, git state, warnings, and the exact next GSD command. Run at session start for instant orientation.
user-invocable: true
---

# /gsd:daily

One-command morning briefing. Shows where you are, what happened, and exactly what to do next.

## When to Use

- At session start — get oriented before diving into work
- After a `/clear` or context reset — re-establish where you are
- Returning to a project after time away — no need to re-read STATE.md manually

## Usage

```
/gsd:daily
```

No arguments. Reads `CHECKPOINT.json` first (if present), falls back to `STATE.md`.

## What It Shows

- Milestone and phase — current v2.x milestone name and phase number
- Plan progress — completed / active / pending plan counts
- Git state — current branch plus a dirty tree warning if uncommitted changes exist
- Checkpoint freshness — stale warning if checkpoint is older than 24 hours
- Next action — the exact `/gsd:` command to run next

## Instructions

Route to: `@get-shit-done/workflows/daily.md`
