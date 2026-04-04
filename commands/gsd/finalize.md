---
name: gsd:finalize
description: End-to-end project finalization — verify, archive, report, push, confirm clean
argument-hint: "[milestone version, e.g., 'v2.2']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - Task
---

<objective>
Close out a completed project or milestone in a single pass. Runs the full verification → archive → report → push → confirm loop so nothing is left dangling.

This command is project-agnostic. It reads the project's own CLAUDE.md, .planning/STATE.md, and tasks/todo.md to understand what "done" means for this specific project, then executes the finalization sequence.

Output: Clean git state, all commits pushed, milestone archived, session report generated, todo.md updated, nothing left open.
</objective>

<context>
Milestone: $ARGUMENTS (optional — if omitted, read from .planning/STATE.md `milestone` field)

**Automatically detected from project root:**
- CLAUDE.md → project identity, build commands, test commands
- .planning/STATE.md → current milestone, status, phase count
- .planning/MILESTONES.md → shipped history
- tasks/todo.md → outstanding items
- .gitignore → what's tracked vs local-only

**This command works on ANY project.** It does not hardcode package counts, test frameworks, or file structures. It reads the project's own configuration to determine what to verify.
</context>

<process>

## Gate 0: Orientation

1. Read CLAUDE.md to understand:
   - What this project is
   - What build/test/lint commands exist
   - What conventions apply
2. Read .planning/STATE.md to get:
   - Current milestone name and version
   - Status (should be `verifying`, `complete`, or `archived`)
   - Phase/plan completion counts
3. Read tasks/todo.md to identify:
   - Any unchecked active items
   - Stale items that are actually done
4. Present a one-paragraph orientation summary:
   ```
   Project: [name] | Milestone: [version] | Status: [status]
   Phases: [X/Y complete] | Outstanding todos: [count]
   Build commands: [list from CLAUDE.md]
   ```
5. If status is already `archived` and git is clean and nothing is unpushed, say "This project is already finalized" and stop.

## Gate 1: Push Any Unpushed Work

1. Run `git log origin/$(git branch --show-current)..HEAD --oneline`
2. If commits exist:
   - Show them
   - Push: `git push origin $(git branch --show-current)`
   - Confirm push succeeded
3. If nothing to push, skip.

## Gate 2: Verify Build Health

1. Extract build/test/lint commands from CLAUDE.md (look for ```bash blocks or ## Commands section)
2. Run each command that exists in this project:
   - Scaffold/structure check (if project has one)
   - Type check (tsc, mypy, etc.)
   - Lint (biome, ruff, eslint, etc.)
   - Test suite (bun test, pytest, npm test, etc.)
3. For each command, report: PASS / FAIL / SKIPPED (not available)
4. If any FAIL: stop and report. Do not proceed past this gate with failures.
5. Present verification table:
   ```
   | Check        | Result | Detail           |
   |--------------|--------|------------------|
   | scaffold     | PASS   | 43/43            |
   | type-check   | PASS   | 39/39, 0 errors  |
   | lint         | PASS   | clean            |
   | tests        | PASS   | 567 passed       |
   ```

## Gate 3: Archive Milestone (if not already archived)

1. Check .planning/STATE.md status field
2. If status is NOT `archived`:
   - Run `/gsd:complete-milestone $ARGUMENTS` workflow inline
   - This archives phases, updates STATE.md, creates milestone record
3. If status IS `archived`:
   - Confirm archive exists in .planning/milestones/
   - Skip this gate

## Gate 4: Clean Up Phases

1. Check if .planning/phases/ has any remaining directories
2. If yes: run `/gsd:cleanup` workflow inline to archive them
3. If empty or missing: skip

## Gate 5: Update tasks/todo.md

1. Read current todo.md
2. Mark any completed items that are still showing as active:
   - Cross-reference with git log and .planning/STATE.md
   - Any "Run /gsd:complete-milestone" items → mark [x] if milestone is archived
   - Any build/verify items → mark [x] if Gate 2 passed
3. Ensure the only remaining active item is forward-looking (e.g., "Decide next milestone")
4. Add to Completed section with today's date:
   - [x] Project finalized via /gsd:finalize ([date])

## Gate 5.5: Auto-Update Project Documentation

Spawn `repo-doc-architect` as a subagent to refresh project documentation before final reports:

**Contract:**
- **Input:** Project root path, CLAUDE.md path, .planning/STATE.md path
- **Task:** Analyze codebase for documentation drift — update architecture.md and CLAUDE.md analytics/architecture sections
- **Scope:** Medium project mode (sequential Architecture + Analytics agents)
- **Output:** Structured JSON session summary (files created/modified, sections updated, validation errors/warnings)

**Rules:**
- If architecture.md exists and is less than 7 days old, skip architecture regeneration (analytics only)
- If validation report contains critical errors, log them but do not block finalization
- All generated files must be staged for the Gate 7 finalization commit

## Gate 6: Generate Reports

1. Run `/gsd:stats` workflow inline — capture output
2. Run `/gsd:session-report` workflow inline — generates SESSION_REPORT.md

## Gate 7: Final Commit and Push

1. Check `git status` for any uncommitted changes from Gates 3-6
2. If changes exist:
   - Stage all modified .planning/ files, tasks/todo.md, and any generated reports
   - Do NOT stage .gitignored files
   - Commit: `chore: finalize [milestone] — archive, report, clean state`
   - Push to origin
3. If no changes: skip

## Gate 8: Confirm Clean State

1. Run `git status` — should be clean (nothing modified, nothing untracked that matters)
2. Run `git log origin/$(git branch --show-current)..HEAD --oneline` — should be empty
3. Run `git log --oneline -5` — show recent history
4. Present final confirmation:
   ```
   ✓ Project: [name]
   ✓ Milestone: [version] — archived
   ✓ Build: all checks passed
   ✓ Git: clean, pushed, nothing outstanding
   ✓ Todo: only forward-looking items remain
   ✓ Reports: stats and session report generated

   This project is finalized. Next: /gsd:new-milestone or move to another project.
   ```

</process>

<critical_rules>

- **Project-agnostic:** Never hardcode package counts, test counts, framework names, or file paths. Read them from CLAUDE.md and .planning/ every time.
- **Gate-based:** Do not skip gates. Do not proceed past a failed gate. Report the failure and stop.
- **Idempotent:** Running this command twice should be safe. If everything is already done, it confirms and exits at Gate 0.
- **No destructive operations:** Never force-push, reset, or delete unarchived work. Archive first, always.
- **Read before assuming:** Check what build commands actually exist before trying to run them. Not every project has make, bun, pytest, etc.
- **Respect .gitignore:** Some artifacts (like knowledge base files) may be gitignored. Note them but don't try to commit them.
- **One commit:** Gates 3-6 may each produce changes. Batch them into one finalization commit at Gate 7, not one per gate.

</critical_rules>

<success_criteria>
- [ ] All build/test/lint checks passed (Gate 2)
- [ ] Milestone archived in .planning/milestones/ (Gate 3)
- [ ] No stale phase directories in .planning/phases/ (Gate 4)
- [ ] tasks/todo.md has no stale active items (Gate 5)
- [ ] Stats and session report generated (Gate 6)
- [ ] All changes committed and pushed (Gate 7)
- [ ] git status clean, nothing unpushed (Gate 8)
</success_criteria>
