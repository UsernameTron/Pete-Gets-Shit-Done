---
phase: 23
plan: 1
title: "Core Pipeline E2E Tests"
requirements: ["E2E-04", "E2E-05", "E2E-06"]
complexity: medium
created: "2026-04-04"
---

# PLAN — Phase 23: Core Pipeline E2E Tests

**Phase goal:** Write E2E tests covering the three core GSD pipelines: new-project, discuss→plan→execute, and verify-work→ship.

**Requirements:** E2E-04, E2E-05, E2E-06
**Complexity:** Medium
**Target directory:** `tests/e2e/`

---

## Tasks

### Task 1: E2E test for new-project flow (E2E-04)

**Files:**
- `tests/e2e/new-project.test.cjs` (new)

**Actions:**
1. Test that `gsd-tools init new-project` returns correct JSON structure:
   - `project_exists`, `planning_exists`, `is_brownfield`, `has_git` flags
   - `project_path` equals `'.planning/PROJECT.md'`
   - Model assignments present (`researcher_model`, `synthesizer_model`, `roadmapper_model`)
   - `commit_docs` flag present
   - `project_root` present
2. Test brownfield detection:
   - Create fixture with `.js` files → `is_brownfield: true`, `has_existing_code: true`
   - Create empty fixture → `is_brownfield: false`
3. Test package file detection:
   - Create fixture with `package.json` → `has_package_file: true`
   - Create fixture with `requirements.txt` → `has_package_file: true`
4. Test that `gsd-tools state begin-phase` creates valid state transitions by invoking it on fixtures created by `createEmptyProject()`.
5. Test that after a simulated new-project flow, all `.planning/` files exist and have valid frontmatter using `assertValidFrontmatter` and `assertFileExists`.

**Testable surface:**
- `gsd-tools.cjs init new-project` — invokes `cmdInitNewProject(cwd, raw)` (init.cjs:242-345)
- `gsd-tools.cjs state begin-phase --phase N --name "X"` — invokes `cmdStateBeginPhase`
- Fixtures: `createEmptyProject()`, `createMidMilestoneProject()`
- Assertions: `assertSuccess`, `assertJsonOutput`, `assertFileExists`, `assertValidFrontmatter`

**Acceptance criteria:**
- [ ] init new-project returns all expected fields
- [ ] Brownfield detection correctly identifies code files
- [ ] Package file detection covers package.json, requirements.txt
- [ ] Empty project fixture produces valid `.planning/` files
- [ ] All tests use `execFileSync` to call `gsd-tools.cjs` directly

### Task 2: E2E test for discuss→plan→execute pipeline (E2E-05)

**Files:**
- `tests/e2e/pipeline-plan-execute.test.cjs` (new)

**Actions:**
1. Test `gsd-tools init plan-phase <N>` returns correct JSON:
   - `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`
   - `has_context`, `has_plans`, `plans` array, `incomplete_plans` array
   - `has_research`, `has_review`
   - Model assignments (`planner_model`, `checker_model`)
   - Flag booleans (`has_prd`, `has_gap_closure`, `has_reviews`)
2. Test `gsd-tools init execute-phase <N>` returns correct JSON:
   - `phase_found`, `phase_dir`, `phase_number`
   - `plans` array with plan metadata (frontmatter parsed)
   - `summaries` array
   - `incomplete_plans` tracking
   - `requirement_ids` extracted from plan frontmatter
   - Model assignment (`executor_model`)
3. Test state transitions through the pipeline:
   - Create `createMidMilestoneProject()` fixture
   - Call `state begin-phase` → verify STATE.md updated
   - Write a mock PLAN.md to the phase directory
   - Call `init execute-phase` → verify it discovers the plan
   - Write a mock SUMMARY.md
   - Call `state update-progress` → verify progress increments
4. Test plan discovery:
   - Create fixture with PLAN-01.md and PLAN-02.md
   - Verify `init execute-phase` finds both plans
   - Verify `incomplete_plans` tracks plans without SUMMARY files
5. Test `gsd-tools init plan-phase` with `--skip-research` and `--gaps` flags via fixture state.

**Testable surface:**
- `gsd-tools.cjs init plan-phase <N>` — invokes `cmdInitPlanPhase(cwd, phase, raw)` (init.cjs:138-240)
- `gsd-tools.cjs init execute-phase <N>` — invokes `cmdInitExecutePhase(cwd, phase, raw)` (init.cjs:44-136)
- `gsd-tools.cjs state begin-phase`, `state update-progress`
- Fixtures: `createMidMilestoneProject()`, file writes for mock plans
- Assertions: `assertSuccess`, `assertJsonOutput`, `assertStateField`, `assertFileContains`

**Acceptance criteria:**
- [ ] plan-phase init returns all expected fields with correct types
- [ ] execute-phase init discovers plans and tracks completion
- [ ] State transitions (begin → progress) produce correct STATE.md updates
- [ ] Plan discovery handles multiple plans per phase
- [ ] Flag detection (skip-research, gaps) reflected in init output

### Task 3: E2E test for verify-work and ship pipeline (E2E-06)

**Files:**
- `tests/e2e/pipeline-verify-ship.test.cjs` (new)

**Actions:**
1. Test `gsd-tools init verify-work <N>` returns correct JSON:
   - `phase_found`, `phase_dir`, `phase_number`, `phase_name`
   - `has_verification` boolean
   - Model assignments (`planner_model`, `checker_model`)
   - `commit_docs` config flag
2. Test verify-work with existing verification:
   - Create fixture with VERIFICATION.md in phase directory
   - Verify `has_verification: true`
3. Test verify-work fallback to ROADMAP.md:
   - Create fixture with ROADMAP.md phase entry but no phase directory
   - Verify init still returns `phase_found: true` with `directory: null`
4. Test ship artifact assembly:
   - Create fixture with complete phase artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md)
   - Verify all files exist and contain expected content using `assertFileContains`
   - Verify VERIFICATION.md structure matches expected format using `assertValidFrontmatter`
5. Test `gsd-tools init phase-op <N>` as a proxy for ship's phase lookup:
   - Verify it returns phase directory, plan count, summary count
   - This is the closest gsd-tools surface to ship's artifact discovery

**Testable surface:**
- `gsd-tools.cjs init verify-work <N>` — invokes `cmdInitVerifyWork(cwd, phase, raw)` (init.cjs:484-532)
- `gsd-tools.cjs init phase-op <N>` — invokes `cmdInitPhaseOp` (ship artifact lookup proxy)
- File assertions on VERIFICATION.md, SUMMARY.md structure
- Fixtures: `createMidMilestoneProject()`, `createCompletedMilestoneProject()`
- Assertions: `assertSuccess`, `assertJsonOutput`, `assertFileExists`, `assertFileContains`, `assertValidFrontmatter`

**Acceptance criteria:**
- [ ] verify-work init returns all expected fields
- [ ] has_verification correctly detects VERIFICATION.md presence
- [ ] ROADMAP.md fallback works when phase directory missing
- [ ] Phase artifacts (PLAN, SUMMARY, VERIFICATION) validated end-to-end
- [ ] phase-op returns correct plan/summary counts

---

## Execution Order

| Wave | Tasks | Dependencies |
|------|-------|-------------|
| 1 | Task 1 (new-project), Task 2 (plan/execute), Task 3 (verify/ship) | Phase 22 infrastructure |

All three tasks are independent — they test different pipelines and can execute in parallel.

---

## Read First

Before implementing, read these files for patterns and conventions:
- `tests/e2e/e2e-infrastructure.smoke.test.cjs` — E2E test patterns established in Phase 22
- `tests/e2e/fixtures.cjs` — fixture factories available
- `tests/e2e/assertions.cjs` — assertion helpers available
- `tests/e2e/mock-layer.cjs` — mock layer available
- `get-shit-done/bin/lib/init.cjs` — init functions being tested (lines 44-532)
- `get-shit-done/bin/gsd-tools.cjs` — CLI entry point (line 739+ for init dispatch)

## Design Notes

- All tests call `gsd-tools.cjs` via `execFileSync` with `--raw` flag for JSON output
- Tests create temp fixtures, run commands against them, and assert results
- No real LLM calls — tests only exercise the init/state/roadmap layer
- Ship workflow is tested indirectly via artifact presence + verify-work init + phase-op
- Each test file is self-contained with its own `describe()` and `afterEach(fixtureCleanup)`
