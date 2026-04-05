/**
 * E2E Tests — Milestone Lifecycle Commands (E2E-09)
 *
 * Validates `init new-milestone`, `init milestone-op`, and `init progress`
 * JSON output structures, field types, and semantic correctness across
 * different project states (mid-milestone, completed milestone).
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  createMidMilestoneProject,
  createCompletedMilestoneProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GSD_TOOLS = path.resolve(__dirname, '..', '..', 'get-shit-done', 'bin', 'gsd-tools.cjs');

/**
 * Run gsd-tools with --raw flag, parse and return JSON output.
 */
function runGsdTools(args, cwd) {
  const result = execFileSync(process.execPath, [GSD_TOOLS, ...args, '--raw'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  });
  return JSON.parse(result);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('init new-milestone', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: JSON structure
  // -------------------------------------------------------------------------

  describe('JSON structure', () => {
    it('returns all required fields with correct types on mid-milestone project', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'new-milestone'], dir);

      // String fields — models
      assert.strictEqual(typeof result.researcher_model, 'string', 'researcher_model should be a string');
      assert.strictEqual(typeof result.synthesizer_model, 'string', 'synthesizer_model should be a string');
      assert.strictEqual(typeof result.roadmapper_model, 'string', 'roadmapper_model should be a string');

      // Boolean fields
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be a boolean');
      assert.strictEqual(typeof result.research_enabled, 'boolean', 'research_enabled should be a boolean');
      assert.strictEqual(typeof result.project_exists, 'boolean', 'project_exists should be a boolean');
      assert.strictEqual(typeof result.roadmap_exists, 'boolean', 'roadmap_exists should be a boolean');
      assert.strictEqual(typeof result.state_exists, 'boolean', 'state_exists should be a boolean');

      // String fields — milestone
      assert.strictEqual(typeof result.current_milestone, 'string', 'current_milestone should be a string');
      assert.strictEqual(typeof result.current_milestone_name, 'string', 'current_milestone_name should be a string');

      // Nullable fields — latest completed milestone
      // These may be null (no prior shipped milestones) or strings
      const lcmType = result.latest_completed_milestone;
      assert.ok(
        lcmType === null || typeof lcmType === 'string',
        'latest_completed_milestone should be null or string'
      );
      const lcmnType = result.latest_completed_milestone_name;
      assert.ok(
        lcmnType === null || typeof lcmnType === 'string',
        'latest_completed_milestone_name should be null or string'
      );

      // Number field
      assert.strictEqual(typeof result.phase_dir_count, 'number', 'phase_dir_count should be a number');

      // Path fields — strings
      assert.strictEqual(typeof result.project_path, 'string', 'project_path should be a string');
      assert.strictEqual(typeof result.roadmap_path, 'string', 'roadmap_path should be a string');
      assert.strictEqual(typeof result.state_path, 'string', 'state_path should be a string');

      // project_root injected by withProjectRoot
      assert.strictEqual(typeof result.project_root, 'string', 'project_root should be a string');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: current_milestone matches STATE.md frontmatter
  // -------------------------------------------------------------------------

  describe('milestone version consistency', () => {
    it('current_milestone matches the milestone in STATE.md frontmatter', () => {
      const dir = createMidMilestoneProject({ milestone: 'v1.0' });
      const result = runGsdTools(['init', 'new-milestone'], dir);

      // The mid-milestone fixture sets milestone: v1.0 in STATE.md
      // getMilestoneInfo reads from ROADMAP.md — fixture ROADMAP contains v1.0
      assert.strictEqual(result.current_milestone, 'v1.0', 'current_milestone should be v1.0');
    });

    it('file existence flags are true for mid-milestone project', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'new-milestone'], dir);

      assert.strictEqual(result.project_exists, true, 'project_exists should be true');
      assert.strictEqual(result.roadmap_exists, true, 'roadmap_exists should be true');
      assert.strictEqual(result.state_exists, true, 'state_exists should be true');
    });

    it('latest_completed_milestone is null when no milestones have shipped', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'new-milestone'], dir);

      // No MILESTONES.md exists in mid-milestone fixture
      assert.strictEqual(result.latest_completed_milestone, null, 'latest_completed_milestone should be null');
      assert.strictEqual(result.latest_completed_milestone_name, null, 'latest_completed_milestone_name should be null');
    });

    it('phase_dir_count reflects actual phase directories on disk', () => {
      const dir = createMidMilestoneProject({ phaseCount: 3 });
      const result = runGsdTools(['init', 'new-milestone'], dir);

      // Mid-milestone fixture creates phase-01 (SUMMARY.md) and phase-02 (CONTEXT.md)
      // Phase 3 is in ROADMAP but has no directory on disk
      assert.strictEqual(result.phase_dir_count, 2, 'phase_dir_count should be 2 (phase-01 and phase-02)');
    });
  });
});

describe('init milestone-op', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 3: JSON structure on mid-milestone project
  // -------------------------------------------------------------------------

  describe('JSON structure', () => {
    it('returns all required fields with correct types', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'milestone-op'], dir);

      // Boolean fields
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be a boolean');
      assert.strictEqual(typeof result.all_phases_complete, 'boolean', 'all_phases_complete should be a boolean');
      assert.strictEqual(typeof result.project_exists, 'boolean', 'project_exists should be a boolean');
      assert.strictEqual(typeof result.roadmap_exists, 'boolean', 'roadmap_exists should be a boolean');
      assert.strictEqual(typeof result.state_exists, 'boolean', 'state_exists should be a boolean');
      assert.strictEqual(typeof result.archive_exists, 'boolean', 'archive_exists should be a boolean');
      assert.strictEqual(typeof result.phases_dir_exists, 'boolean', 'phases_dir_exists should be a boolean');

      // String fields
      assert.strictEqual(typeof result.milestone_version, 'string', 'milestone_version should be a string');
      assert.strictEqual(typeof result.milestone_name, 'string', 'milestone_name should be a string');
      assert.strictEqual(typeof result.milestone_slug, 'string', 'milestone_slug should be a string');

      // Number fields
      assert.strictEqual(typeof result.phase_count, 'number', 'phase_count should be a number');
      assert.strictEqual(typeof result.completed_phases, 'number', 'completed_phases should be a number');
      assert.strictEqual(typeof result.archive_count, 'number', 'archive_count should be a number');

      // Array field
      assert.ok(Array.isArray(result.archived_milestones), 'archived_milestones should be an array');

      // project_root injected by withProjectRoot
      assert.strictEqual(typeof result.project_root, 'string', 'project_root should be a string');
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: all_phases_complete is false for mid-milestone project
  // -------------------------------------------------------------------------

  describe('phase completion detection', () => {
    it('all_phases_complete is false for mid-milestone project', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'milestone-op'], dir);

      // Mid-milestone: phase-01 has SUMMARY.md (complete), phase-02 has only CONTEXT.md (incomplete)
      assert.strictEqual(result.all_phases_complete, false, 'all_phases_complete should be false for mid-milestone');
      assert.strictEqual(result.phase_count, 2, 'phase_count should be 2 (two phase directories on disk)');
      assert.strictEqual(result.completed_phases, 1, 'completed_phases should be 1 (only phase-01 has SUMMARY.md)');
    });

    // -------------------------------------------------------------------------
    // Test 5: all_phases_complete is true for completed milestone project
    // -------------------------------------------------------------------------

    it('all_phases_complete is true for completed milestone project', () => {
      const dir = createCompletedMilestoneProject();
      const result = runGsdTools(['init', 'milestone-op'], dir);

      // Completed milestone: both phase-01 and phase-02 have SUMMARY.md
      assert.strictEqual(result.all_phases_complete, true, 'all_phases_complete should be true for completed milestone');
      assert.strictEqual(result.phase_count, 2, 'phase_count should be 2');
      assert.strictEqual(result.completed_phases, 2, 'completed_phases should be 2');
    });

    it('archive is empty when no milestones have been archived', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'milestone-op'], dir);

      assert.deepStrictEqual(result.archived_milestones, [], 'archived_milestones should be empty');
      assert.strictEqual(result.archive_count, 0, 'archive_count should be 0');
      assert.strictEqual(result.archive_exists, false, 'archive_exists should be false');
    });

    it('phases_dir_exists is true when phases directory exists', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'milestone-op'], dir);

      assert.strictEqual(result.phases_dir_exists, true, 'phases_dir_exists should be true');
    });
  });
});

describe('init progress', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 6: JSON structure on mid-milestone project
  // -------------------------------------------------------------------------

  describe('JSON structure', () => {
    it('returns all required fields with correct types', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'progress'], dir);

      // Array field — phases
      assert.ok(Array.isArray(result.phases), 'phases should be an array');
      assert.ok(result.phases.length > 0, 'phases should have at least one entry');

      // Number fields
      assert.strictEqual(typeof result.phase_count, 'number', 'phase_count should be a number');
      assert.strictEqual(typeof result.completed_count, 'number', 'completed_count should be a number');
      assert.strictEqual(typeof result.in_progress_count, 'number', 'in_progress_count should be a number');

      // Validate individual phase structure
      for (const phase of result.phases) {
        assert.strictEqual(typeof phase.number, 'string', 'phase.number should be a string');
        // phase.name can be a string or null
        assert.ok(
          phase.name === null || typeof phase.name === 'string',
          'phase.name should be null or string'
        );
        // phase.directory can be a string or null (ROADMAP-only phases have null directory)
        assert.ok(
          phase.directory === null || typeof phase.directory === 'string',
          'phase.directory should be null or string'
        );
        assert.strictEqual(typeof phase.status, 'string', 'phase.status should be a string');
        assert.strictEqual(typeof phase.plan_count, 'number', 'phase.plan_count should be a number');
        assert.strictEqual(typeof phase.summary_count, 'number', 'phase.summary_count should be a number');
        assert.strictEqual(typeof phase.has_research, 'boolean', 'phase.has_research should be a boolean');

        // Status must be one of the valid values
        const validStatuses = ['complete', 'in_progress', 'researched', 'pending', 'not_started'];
        assert.ok(
          validStatuses.includes(phase.status),
          `phase.status '${phase.status}' should be one of: ${validStatuses.join(', ')}`
        );
      }

      // Nullable object fields
      assert.ok(
        result.current_phase === null || typeof result.current_phase === 'object',
        'current_phase should be null or an object'
      );
      assert.ok(
        result.next_phase === null || typeof result.next_phase === 'object',
        'next_phase should be null or an object'
      );

      // project_root injected by withProjectRoot
      assert.strictEqual(typeof result.project_root, 'string', 'project_root should be a string');
    });

    it('phase_count matches the length of phases array', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'progress'], dir);

      assert.strictEqual(result.phase_count, result.phases.length, 'phase_count should match phases array length');
    });
  });

  // -------------------------------------------------------------------------
  // Test 7: current_phase and next_phase detection
  // -------------------------------------------------------------------------

  describe('current and next phase detection', () => {
    it('identifies current and next phases for mid-milestone project', () => {
      const dir = createMidMilestoneProject();

      // cmdInitProgress requires plan_count > 0 for a phase to be 'complete' or 'in_progress'.
      // The fixture's phase-01 has only SUMMARY.md — add PLAN.md so it counts as complete.
      const phase01Dir = path.join(dir, '.planning', 'phases', 'phase-01');
      fs.writeFileSync(path.join(phase01Dir, 'PLAN.md'), [
        '# Phase 1 Plan — Setup & Configuration',
        '',
        '## Tasks',
        '- [x] REQ-01: Setup task one',
        '- [x] REQ-02: Setup task two',
        '',
      ].join('\n'));

      // Add a PLAN.md to phase-02 so it registers as in_progress (has plan, no summary)
      const phase02Dir = path.join(dir, '.planning', 'phases', 'phase-02');
      fs.writeFileSync(path.join(phase02Dir, 'PLAN.md'), [
        '# Phase 2 Plan — Feature Implementation',
        '',
        '## Tasks',
        '- [ ] Implement REQ-03',
        '- [ ] Implement REQ-04',
        '',
      ].join('\n'));

      const result = runGsdTools(['init', 'progress'], dir);

      // phase-01 has SUMMARY.md + PLAN.md → complete (summaries >= plans && plans > 0)
      // phase-02 has PLAN.md but no SUMMARY.md → in_progress
      // current_phase should be the first in_progress phase
      assert.ok(result.current_phase !== null, 'current_phase should be non-null for mid-milestone');
      assert.strictEqual(result.current_phase.status, 'in_progress', 'current_phase status should be in_progress');

      // completed_count should be 1 (phase-01)
      assert.strictEqual(result.completed_count, 1, 'completed_count should be 1');
      assert.strictEqual(result.in_progress_count, 1, 'in_progress_count should be 1');
    });

    it('next_phase identifies the first pending phase', () => {
      const dir = createMidMilestoneProject();

      // Add PLAN.md to phase-02 to make it in_progress
      const phase02Dir = path.join(dir, '.planning', 'phases', 'phase-02');
      fs.writeFileSync(path.join(phase02Dir, 'PLAN.md'), [
        '# Phase 2 Plan',
        '',
        '## Tasks',
        '- [ ] Task one',
        '',
      ].join('\n'));

      // Create phase-03 directory as pending (no plans, no research)
      const phase03Dir = path.join(dir, '.planning', 'phases', 'phase-03');
      fs.mkdirSync(phase03Dir, { recursive: true });
      fs.writeFileSync(path.join(phase03Dir, 'CONTEXT.md'), '# Phase 3 Context\n');

      // Commit the new files so git state is clean
      execFileSync('git', ['add', '-A'], { cwd: dir, stdio: 'pipe' });
      execFileSync('git', ['commit', '-m', 'add phase 2 plan and phase 3'], { cwd: dir, stdio: 'pipe' });

      const result = runGsdTools(['init', 'progress'], dir);

      // next_phase should be phase-03 (pending)
      assert.ok(result.next_phase !== null, 'next_phase should be non-null');
      assert.strictEqual(result.next_phase.status, 'pending', 'next_phase status should be pending');
    });

    it('completed milestone project has no current or next phase', () => {
      const dir = createCompletedMilestoneProject();

      // cmdInitProgress requires plan_count > 0 for 'complete' status.
      // The completed fixture has SUMMARY.md in each phase but no PLAN.md.
      // Add PLAN.md to both phases so they count as complete.
      for (const phaseDir of ['phase-01', 'phase-02']) {
        fs.writeFileSync(
          path.join(dir, '.planning', 'phases', phaseDir, 'PLAN.md'),
          '# Plan\n\n## Tasks\n- [x] Done\n'
        );
      }

      const result = runGsdTools(['init', 'progress'], dir);

      // All phases are complete — no in_progress or pending
      assert.strictEqual(result.current_phase, null, 'current_phase should be null for completed milestone');
      assert.strictEqual(result.next_phase, null, 'next_phase should be null for completed milestone');
      assert.strictEqual(result.completed_count, result.phase_count, 'all phases should be complete');
    });

    it('phase statuses reflect file contents accurately', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'progress'], dir);

      // phase-01 has SUMMARY.md and no PLAN.md
      // cmdInitProgress: summaries.length >= plans.length && plans.length > 0 → 'complete'
      // But wait — phase-01 has SUMMARY.md but no PLAN.md, so plans.length === 0.
      // That means the first condition fails. It falls to: plans.length > 0 (false),
      // then hasResearch (false), then 'pending'.
      // Actually, let's check: the fixture creates phase-01/SUMMARY.md only.
      // plans = files ending in -PLAN.md or PLAN.md → 0
      // summaries = files ending in -SUMMARY.md or SUMMARY.md → 1
      // condition: summaries.length >= plans.length && plans.length > 0 → 1 >= 0 && 0 > 0 → false
      // next: plans.length > 0 → false
      // next: hasResearch → false
      // result: 'pending'

      // phase-02 has CONTEXT.md only → pending as well

      // Find phase entries by directory name
      const p1 = result.phases.find(p => p.directory && p.directory.includes('phase-01'));
      const p2 = result.phases.find(p => p.directory && p.directory.includes('phase-02'));

      assert.ok(p1, 'phase-01 should exist in phases array');
      assert.ok(p2, 'phase-02 should exist in phases array');

      // phase-01: SUMMARY.md only, no PLAN.md → pending (not 'complete' since plan_count is 0)
      assert.strictEqual(p1.status, 'pending', 'phase-01 with only SUMMARY.md and no PLAN.md should be pending');
      assert.strictEqual(p1.summary_count, 1, 'phase-01 should have 1 summary');
      assert.strictEqual(p1.plan_count, 0, 'phase-01 should have 0 plans');

      // phase-02: CONTEXT.md only → pending
      assert.strictEqual(p2.status, 'pending', 'phase-02 with only CONTEXT.md should be pending');
      assert.strictEqual(p2.plan_count, 0, 'phase-02 should have 0 plans');
      assert.strictEqual(p2.has_research, false, 'phase-02 should have no research');
    });
  });
});
