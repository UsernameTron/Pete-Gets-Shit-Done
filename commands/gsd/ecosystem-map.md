---
name: gsd:ecosystem-map
description: Regenerate the GSD ecosystem map — live scan, baseline reconciliation, lifecycle clustering, drift history
argument-hint: "[--exec] [--dry-run] [--review] [--baseline <path>]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Produce an authoritative, lifecycle-organized map of every GSD component — commands, workflows, agents, skills, hooks, plugins — discovered from the live filesystem, never from memory.

Each run reconciles discovered counts against the previous run's baseline, assigns every component to exactly one of the 11 canonical lifecycle clusters (C0–C10, plus C-UNMAPPED for genuine misfits), and overwrites the map deterministically while appending to a drift-history table so counts are tracked over time.

Output: `.planning/GSD-ECOSYSTEM-MAP.md` (full map), plus `.planning/GSD-ECOSYSTEM-MAP-EXEC.md` (one-screen executive pager) when `--exec` is passed.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ecosystem-map.md
</execution_context>

<context>
Flags: $ARGUMENTS

- `--exec` — also regenerate the executive one-pager with the Obsidian dark-mode diagram
- `--dry-run` — full scan + drift report to terminal; write nothing
- `--review` — after writing, run a second-model review of the cluster assignments (codex via /gsd:review when available; otherwise a cold-context subagent, plainly labeled)
- `--baseline <path>` — override the reconciliation baseline (default: the latest row of the map's own Drift History table)
</context>

<when_to_use>
**Use ecosystem-map for:**
- After adding, removing, or renaming commands, workflows, agents, skills, or hooks
- Before milestone audits or closeout (fresh component inventory)
- When doc counts and the filesystem disagree and you need the measured truth
- Onboarding — one file that shows the whole system by lifecycle stage

**Skip ecosystem-map for:**
- Mid-phase execution (nothing structural changed)
- Repos that are not GSD itself or a GSD-shaped plugin workspace
</when_to_use>

<success_criteria>
- [ ] Every component discovered from the live filesystem with its source path cited
- [ ] Every component in exactly one primary cluster; anchors honored verbatim
- [ ] Drift report covers every baseline row; every non-zero delta has a reason
- [ ] Map counts, exec-pager counts, and master-matrix row count all agree
- [ ] Drift History gained exactly one dated row (unless --dry-run)
</success_criteria>
