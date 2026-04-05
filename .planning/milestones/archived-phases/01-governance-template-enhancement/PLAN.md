# PLAN — Phase 1: Governance Template Enhancement

**Phase goal:** Update governance session initialization to reference `.planning/PROJECT.md` and `.planning/ROADMAP.md`, giving every new session awareness of the project's goals, constraints, and current milestone phase structure.

**Requirements:** GOV-01, GOV-02, GOV-03
**Complexity:** Low
**Target file:** `governance/templates/global/CLAUDE.md` — Session Initialization section (lines 76–88)

---

## Tasks

### Task 1: Update Session Initialization Template

**File:** `governance/templates/global/CLAUDE.md`
**Section:** Session Initialization (Every Session), lines 76–88

**Current ordered list (steps 1–7):**
1. Read this file in full
2. Read `tasks/lessons.md` — if missing, create from template
3. Read `.planning/STATE.md` if it exists, else `tasks/todo.md` — summarize current state
4. Load operator context files if they exist
5. Check `.claude/agents/` for deployed specialists
6. Check git state
7. Report

**Change:** Insert two new conditional steps after step 3, renumbering steps 4–7 → 6–9:

4. If `.planning/PROJECT.md` exists, read it for project goals, constraints, and current milestone context
5. If `.planning/ROADMAP.md` exists, read it for milestone phase structure and current phase awareness

**Rationale:** Groups all `.planning/` reads together (STATE.md → PROJECT.md → ROADMAP.md) before moving to operator context and agent checks. Conditional phrasing ("if exists") prevents breakage in projects without a `.planning/` directory.

**Acceptance criteria:**
- [ ] Steps 4 and 5 reference `.planning/PROJECT.md` and `.planning/ROADMAP.md` respectively
- [ ] Both steps use conditional language ("if it exists" / "if exists")
- [ ] Remaining steps renumbered correctly (4→6, 5→7, 6→8, 7→9)
- [ ] Report step still last, number updated to 9

### Task 2: Verify No Breakage

**Actions:**
1. Run full test suite (`npm test`) — all 1,547 tests must pass
2. Verify template lints clean (no syntax errors, valid Markdown)
3. Confirm no other files reference the old step numbers by grep

**Acceptance criteria:**
- [ ] All existing tests pass (0 failures)
- [ ] No GSD commands reference hardcoded step numbers from the old template
- [ ] Template renders as valid Markdown

---

## Execution Order

| Wave | Tasks | Dependencies |
|------|-------|-------------|
| 1 | Task 1 (template edit) | None |
| 2 | Task 2 (verification) | Task 1 |

**Estimated time:** < 5 minutes

---

## Success Criteria (from ROADMAP.md)

- [x] Session initialization template includes step to read `.planning/PROJECT.md` when it exists
- [x] Session initialization template includes step to read `.planning/ROADMAP.md` when it exists
- [x] Steps are conditional ("if it exists") to avoid breaking projects without `.planning/`
- [ ] All 1,547 existing tests continue passing
- [ ] No breaking changes to existing GSD commands
- [ ] Governance template lints clean

---
*Plan created: 2026-03-25*
