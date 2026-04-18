---
name: gsd:checkpoint
description: Write a checkpoint capturing current session state to .planning/CHECKPOINT.json. Use before /clear, at session end, or when context is getting long. Captures git state, milestone/phase progress, completed plans, and next action.
user-invocable: true
---

# /gsd:checkpoint

Write a deterministic session checkpoint to `.planning/CHECKPOINT.json`.

## When to Use

- Before running `/clear` (preserves context across the reset)
- At session end (so next session resumes without re-reading everything)
- When context window approaches 75%
- After completing a plan, before starting the next one

## Usage

```
/gsd:checkpoint
/gsd:checkpoint Completed plan 52-01, starting 52-02 next
/gsd:checkpoint --next-action "/gsd:execute-phase 52"
```

Any free text after `/gsd:checkpoint` is captured as the `context_note`.

## What It Captures

- Current git branch and commit SHA
- Milestone, phase, and phase name from STATE.md
- Which plans are completed, which is active, which are pending
- Optional: next action command, context note, files modified this session

## What Happens Next

The checkpoint is written to `.planning/CHECKPOINT.json`. The next session's `/gsd:resume-work` reads this file first — before STATE.md — and skips any plans already listed as completed. `/prime` also surfaces checkpoint data in the initialization summary.

## Instructions

Route to: `@get-shit-done/workflows/checkpoint.md`

Pass any free text after the command as the `context_note` override.
Pass `--next-action` value as the `next_action` override if provided.
