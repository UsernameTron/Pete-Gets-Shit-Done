---
name: gsd:confidence
description: Full-confidence chained sweep — planning health, quality audits, real build/test/lint, codebase map refresh, doc sync, repo cleanliness, then one weighted confidence scorecard (SHIP-READY / FIX-FIRST / BLOCKED) with a single gate before ship
argument-hint: "[--dry-run] [--deep] [--yes-ship]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - Skill
  - AskUserQuestion
  - TodoWrite
---
<objective>
Answer one question with evidence: "Can I be confident everything works?"

Runs seven reversible legs — health, quality-sweep audits, real build/test/lint,
codebase-map refresh, doc sync, repo cleanliness, confidence scorecard — then stops
at a single gate before the only irreversible step (finalize/ship).

**`--dry-run`:** print the leg plan and plugin probes. Zero Skill() calls, zero mutation.
**`--deep`:** pass through to quality-sweep (adds crew self-assessment, agent status, ecosystem map, stats).
**`--yes-ship`:** pre-approve the ship gate when the verdict is SHIP-READY (prints a receipt; FIX-FIRST/BLOCKED never auto-ship).
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/confidence.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the confidence workflow from @~/.claude/get-shit-done/workflows/confidence.md end-to-end.
Preserve all workflow gates. Legs 1-7 are reversible and run without gates; only ship is gated.
</process>
