---
name: gsd:ci-watch
description: Poll GitHub Actions for the current branch, stream live status, diagnose failures, and suggest fixes
argument-hint: "[--interval <seconds>]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---
<objective>
Monitor GitHub Actions CI runs for the current branch in real time. Polls until all runs reach a terminal state (success, failure, cancelled). On failure, fetches logs, diagnoses the root cause using a pattern library, and suggests concrete fixes.

Use when you want to watch CI without leaving Claude Code. Runs continuously until complete or interrupted with Ctrl+C.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ci-watch.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the ci-watch workflow from @~/.claude/get-shit-done/workflows/ci-watch.md end-to-end.

Parse $ARGUMENTS for:
- `--interval <N>` flag: override default 15-second polling interval with N seconds

Pass any parsed configuration to the workflow steps.
</process>
