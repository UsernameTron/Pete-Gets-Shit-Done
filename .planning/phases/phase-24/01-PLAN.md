---
phase: 24
plan: 1
title: "Utility & Lifecycle Tests"
requirements: ["E2E-07", "E2E-08", "E2E-09", "E2E-10"]
complexity: medium
created: "2026-04-04"
---

# PLAN — Phase 24: Utility & Lifecycle Tests

**Phase goal:** Write E2E tests covering utility commands, progress/stats/health, milestone lifecycle, and workstream management.

**Requirements:** E2E-07, E2E-08, E2E-09, E2E-10
**Complexity:** Medium
**Target directory:** `tests/e2e/`

---

## Tasks

### Task 1: E2E test for quick task utility (E2E-07)

**Files:**
- `tests/e2e/utility-commands.test.cjs` (new)

**Actions:**
1. Test `gsd-tools init quick <description>` returns correct JSON structure:
   - `planner_model`, `executor_model`, `checker_model`, `verifier_model` strings
   - `commit_docs` boolean
   - `branch_name` string
   - `quick_id` matches `YYMMDD-xxx` format (base36 2-second precision)
   - `slug` derived from description
   - `description` echoed back
   - `date`, `timestamp` present
   - `quick_dir`, `task_dir` paths present
   - `roadmap_exists`, `planning_exists` booleans
2. Test slug generation:
   - Description "Fix login bug" → slug contains "fix-login-bug"
   - Description with special characters → sanitized slug
3. Test quick_id format:
   - Matches `/^\d{6}-[0-9a-z]+$/` pattern
4. Test with empty project fixture → `planning_exists: true`, `roadmap_exists: true`

**Testable surface:**
- `gsd-tools.cjs init quick <description>` → `cmdInitQuick(cwd, description, raw)` (init.cjs:394-450)
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`
- Assertions: `assertSuccess`, `assertJsonOutput`

**Acceptance criteria:**
- [ ] init quick returns all expected fields with correct types
- [ ] quick_id matches YYMMDD-xxx format
- [ ] slug is properly sanitized from description
- [ ] planning_exists and roadmap_exists reflect fixture state

### Task 2: E2E test for progress, stats, and health (E2E-08)

**Files:**
- `tests/e2e/progress-stats-health.test.cjs` (new)

**Actions:**
1. Test `gsd-tools progress json` returns correct JSON:
   - `milestone_version`, `milestone_name` strings
   - `phases` array with `{number, name, plans, summaries, status}` objects
   - `total_plans`, `total_summaries` numbers
   - `percent` number (0-100)
   - Status values: 'Pending', 'Complete', 'In Progress', 'Planned'
2. Test `gsd-tools progress table` returns `{rendered}` with markdown table string
3. Test `gsd-tools progress bar` returns `{bar, percent, completed, total}`
4. Test `gsd-tools stats json` returns correct JSON:
   - `milestone_version`, `milestone_name` strings
   - `phases` array, `completedPhases`, `totalPlans`, `totalSummaries`
   - `planPercent`, `percent` numbers
   - `requirementsTotal`, `requirementsComplete` numbers
5. Test `gsd-tools validate health` returns correct JSON:
   - `status` values: 'healthy', 'broken', 'error'
   - `errors[]`, `warnings[]`, `info[]` arrays
   - `repairable_count` number
6. Test health on empty project → `status: 'healthy'`
7. Test health on corrupt project (missing-roadmap) → `status` contains errors, E003 code present

**Testable surface:**
- `gsd-tools.cjs progress [json|table|bar]` → `cmdProgressRender` (commands.cjs:521-587)
- `gsd-tools.cjs stats json` → `cmdStats` (commands.cjs:808-887)
- `gsd-tools.cjs validate health` → `cmdValidateHealth` (verify.cjs:522-621)
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`, `createCorruptProject('missing-roadmap')`

**Acceptance criteria:**
- [ ] progress json returns all expected fields
- [ ] progress table returns rendered markdown
- [ ] progress bar returns bar string with percent
- [ ] stats returns milestone, phase, and requirement counts
- [ ] validate health detects healthy and broken states
- [ ] Error codes (E003) present for missing files

### Task 3: E2E test for milestone lifecycle (E2E-09)

**Files:**
- `tests/e2e/milestone-lifecycle.test.cjs` (new)

**Actions:**
1. Test `gsd-tools init new-milestone` returns correct JSON:
   - `researcher_model`, `synthesizer_model`, `roadmapper_model` strings
   - `commit_docs` boolean
   - `research_enabled` boolean
   - `current_milestone`, `current_milestone_name` from STATE.md
   - `latest_completed_milestone`, `latest_completed_milestone_name` (null if none)
   - `phase_dir_count` number
   - `project_exists`, `roadmap_exists`, `state_exists` booleans
   - `project_path`, `roadmap_path`, `state_path` strings
2. Test `gsd-tools init milestone-op` returns correct JSON:
   - `commit_docs` boolean
   - `milestone_version`, `milestone_name`, `milestone_slug` strings
   - `phase_count`, `completed_phases` numbers
   - `all_phases_complete` boolean
   - `archived_milestones` array, `archive_count` number
   - `project_exists`, `roadmap_exists`, `state_exists`, `archive_exists`, `phases_dir_exists` booleans
3. Test milestone-op on completed project → `all_phases_complete: true`
4. Test milestone-op on mid-milestone project → `all_phases_complete: false`
5. Test `gsd-tools init progress` returns correct JSON:
   - `phases[]` array with `{number, name, directory, status, plan_count, summary_count, has_research}`
   - Phase status values: 'complete', 'in_progress', 'researched', 'pending', 'not_started'
   - `phase_count`, `completed_count`, `in_progress_count` numbers
   - `current_phase`, `next_phase` (nullable)

**Testable surface:**
- `gsd-tools.cjs init new-milestone` → `cmdInitNewMilestone` (init.cjs:347-392)
- `gsd-tools.cjs init milestone-op` → `cmdInitMilestoneOp` (init.cjs:704-763)
- `gsd-tools.cjs init progress` → `cmdInitProgress` (init.cjs:1046-1191)
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`, `createCompletedMilestoneProject()`

**Acceptance criteria:**
- [ ] init new-milestone returns all expected fields
- [ ] init milestone-op phase counting matches fixture state
- [ ] all_phases_complete is true for completed fixtures, false for mid-milestone
- [ ] init progress returns phase array with correct status values
- [ ] current_phase and next_phase correctly identified

### Task 4: E2E test for workstream management (E2E-10)

**Files:**
- `tests/e2e/workstream-management.test.cjs` (new)

**Actions:**
1. Test `gsd-tools workstream list` on flat project returns:
   - `mode: 'flat'`, `workstreams: []`, `count: 0`
2. Test `gsd-tools workstream create <name>` returns:
   - `created: true`, `workstream` name, `path`, `state_path`, `phases_path`
   - `active` boolean
3. Test workstream create on already-existing name returns:
   - `created: false`, `error: 'already_exists'`
4. Test `gsd-tools workstream list` after creation returns:
   - `mode: 'workstream'`, `count: 1`, workstream in array
   - Workstream object: `{name, path, has_roadmap, has_state, status, current_phase, phase_count, completed_phases}`
5. Test `gsd-tools workstream status <name>` returns:
   - `found: true`, `workstream`, `path`, `files`, `phases[]`, `phase_count`, `status`
6. Test workstream status for non-existent name → `found: false`
7. Test `gsd-tools workstream complete <name>` returns:
   - `completed: true` or `{completed: false, error: 'not_found'}` for missing

**Testable surface:**
- `gsd-tools.cjs workstream create|list|status|complete` (workstream.cjs:69-290)
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`

**Acceptance criteria:**
- [ ] Flat project correctly detected as mode: 'flat'
- [ ] Workstream creation returns all expected fields
- [ ] Duplicate creation returns already_exists error
- [ ] List reflects created workstreams with correct metadata
- [ ] Status returns found: true/false correctly
- [ ] Complete handles existing and non-existent workstreams

---

## Execution Order

| Wave | Tasks | Dependencies |
|------|-------|-------------|
| 1 | Task 1 (utility), Task 2 (progress/stats/health), Task 3 (milestone), Task 4 (workstream) | Phase 22 infrastructure |

All four tasks are independent — they test different command surfaces and can execute in parallel.

---

## Read First

Before implementing, read these files for patterns and conventions:
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` — E2E test patterns
- `tests/e2e/fixtures.cjs` — fixture factories available
- `tests/e2e/assertions.cjs` — assertion helpers available
- `tests/e2e/new-project.test.cjs` — Phase 23 patterns (execFileSync, --raw flag, JSON parsing)
- `get-shit-done/bin/lib/init.cjs` — init functions being tested
- `get-shit-done/bin/lib/commands.cjs` — progress/stats commands
- `get-shit-done/bin/lib/verify.cjs` — health validation
- `get-shit-done/bin/lib/workstream.cjs` — workstream commands
- `get-shit-done/bin/gsd-tools.cjs` — CLI dispatch (command routing)

## Design Notes

- All tests call `gsd-tools.cjs` via `execFileSync` with `--raw` flag for JSON output
- Tests create temp fixtures, run commands against them, and assert results
- No real LLM calls — tests only exercise the init/state/command layer
- Each test file is self-contained with its own `describe()` and `afterEach(fixtureCleanup)`
- Use `fs.realpathSync(os.tmpdir())` for macOS symlink handling
- Use `crypto.randomBytes` for temp directory names (SEC-01)
