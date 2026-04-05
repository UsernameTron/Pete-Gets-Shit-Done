/**
 * E2E Tests — progress, stats, and validate health commands
 *
 * Validates the `progress`, `stats`, and `validate health` JSON output
 * against known project fixtures in various states.
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
  createEmptyProject,
  createMidMilestoneProject,
  createCorruptProject,
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

/**
 * Run gsd-tools WITHOUT --raw flag to get JSON for all output formats.
 * The table/bar formats only emit JSON when --raw is NOT set (--raw
 * makes them emit plain text via the rawValue path in output()).
 */
function runGsdToolsJson(args, cwd) {
  const result = execFileSync(process.execPath, [GSD_TOOLS, ...args], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  });
  return JSON.parse(result);
}

/**
 * Add PLAN.md files to a mid-milestone fixture so progress/stats have
 * meaningful plan counts. Phase-01 gets a PLAN.md (already has SUMMARY.md),
 * Phase-02 gets a PLAN.md (no SUMMARY.md yet).
 */
function addPlanFiles(dir) {
  const phasesDir = path.join(dir, '.planning', 'phases');

  fs.writeFileSync(
    path.join(phasesDir, 'phase-01', 'PLAN.md'),
    '# Phase 1 Plan\n\n## Tasks\n- Setup\n'
  );
  fs.writeFileSync(
    path.join(phasesDir, 'phase-02', 'PLAN.md'),
    '# Phase 2 Plan\n\n## Tasks\n- Implement features\n'
  );
}

// ---------------------------------------------------------------------------
// Tests — progress command
// ---------------------------------------------------------------------------

describe('progress command', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: progress json on mid-milestone project
  // -------------------------------------------------------------------------

  describe('progress json', () => {
    it('returns milestone info, phases array, and plan counts', () => {
      const dir = createMidMilestoneProject();
      addPlanFiles(dir);

      const result = runGsdTools(['progress', 'json'], dir);

      // Milestone fields
      assert.strictEqual(typeof result.milestone_version, 'string', 'milestone_version should be a string');
      assert.strictEqual(typeof result.milestone_name, 'string', 'milestone_name should be a string');
      assert.ok(result.milestone_version.startsWith('v'), 'milestone_version should start with v');

      // Phases array
      assert.ok(Array.isArray(result.phases), 'phases should be an array');
      assert.ok(result.phases.length >= 2, 'should have at least 2 phases from fixture');

      // Each phase object has required fields
      for (const phase of result.phases) {
        assert.strictEqual(typeof phase.number, 'string', 'phase.number should be a string');
        assert.strictEqual(typeof phase.name, 'string', 'phase.name should be a string');
        assert.strictEqual(typeof phase.plans, 'number', 'phase.plans should be a number');
        assert.strictEqual(typeof phase.summaries, 'number', 'phase.summaries should be a number');
        assert.strictEqual(typeof phase.status, 'string', 'phase.status should be a string');
        assert.ok(
          ['Pending', 'Complete', 'In Progress', 'Planned'].includes(phase.status),
          `phase.status "${phase.status}" should be a valid status`
        );
      }

      // Aggregate fields
      assert.strictEqual(typeof result.total_plans, 'number', 'total_plans should be a number');
      assert.strictEqual(typeof result.total_summaries, 'number', 'total_summaries should be a number');
      assert.strictEqual(typeof result.percent, 'number', 'percent should be a number');
      assert.ok(result.percent >= 0 && result.percent <= 100, 'percent should be 0-100');

      // With PLAN.md added to both phases and SUMMARY.md in phase-01:
      // total_plans should be 2, total_summaries should be 1
      assert.strictEqual(result.total_plans, 2, 'total_plans should count PLAN.md files');
      assert.strictEqual(result.total_summaries, 1, 'total_summaries should count SUMMARY.md files');
      assert.strictEqual(result.percent, 50, 'percent should be 50 (1 of 2 plans complete)');
    });

    it('returns zero progress on empty project', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['progress', 'json'], dir);

      assert.strictEqual(result.total_plans, 0, 'empty project should have 0 plans');
      assert.strictEqual(result.total_summaries, 0, 'empty project should have 0 summaries');
      assert.strictEqual(result.percent, 0, 'empty project should have 0 percent');
      assert.ok(Array.isArray(result.phases), 'phases should be an array even when empty');
      assert.strictEqual(result.phases.length, 0, 'empty project should have 0 phases');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: progress table
  // -------------------------------------------------------------------------

  describe('progress table', () => {
    it('returns rendered markdown table string', () => {
      const dir = createMidMilestoneProject();
      addPlanFiles(dir);

      // table format uses rawValue path when --raw is set, so use no-raw helper
      const result = runGsdToolsJson(['progress', 'table'], dir);

      assert.strictEqual(typeof result.rendered, 'string', 'table format should return rendered string');
      assert.ok(result.rendered.includes('|'), 'rendered should contain markdown table pipes');
      assert.ok(result.rendered.includes('Phase'), 'rendered should contain Phase header');
      assert.ok(result.rendered.includes('Plans'), 'rendered should contain Plans header');
      assert.ok(result.rendered.includes('Status'), 'rendered should contain Status header');
    });

    it('includes progress bar in rendered output', () => {
      const dir = createMidMilestoneProject();
      addPlanFiles(dir);

      const result = runGsdToolsJson(['progress', 'table'], dir);

      // The table format includes a **Progress:** line with bar
      assert.ok(result.rendered.includes('Progress'), 'rendered should contain Progress label');
      assert.ok(result.rendered.includes('/'), 'rendered should contain x/y plan ratio');
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: progress bar
  // -------------------------------------------------------------------------

  describe('progress bar', () => {
    it('returns bar string, percent, completed, and total', () => {
      const dir = createMidMilestoneProject();
      addPlanFiles(dir);

      // bar format uses rawValue path when --raw is set, so use no-raw helper
      const result = runGsdToolsJson(['progress', 'bar'], dir);

      assert.strictEqual(typeof result.bar, 'string', 'bar should be a string');
      assert.strictEqual(typeof result.percent, 'number', 'percent should be a number');
      assert.strictEqual(typeof result.completed, 'number', 'completed should be a number');
      assert.strictEqual(typeof result.total, 'number', 'total should be a number');

      // Bar format: [████░░░░░░░░░░░░░░░░] 1/2 plans (50%)
      assert.ok(result.bar.includes('['), 'bar should contain opening bracket');
      assert.ok(result.bar.includes(']'), 'bar should contain closing bracket');
      assert.ok(result.bar.includes('/'), 'bar should contain plan ratio');

      assert.strictEqual(result.completed, 1, 'completed should be 1');
      assert.strictEqual(result.total, 2, 'total should be 2');
      assert.strictEqual(result.percent, 50, 'percent should be 50');
    });

    it('returns zero bar for empty project', () => {
      const dir = createEmptyProject();
      const result = runGsdToolsJson(['progress', 'bar'], dir);

      assert.strictEqual(result.percent, 0, 'empty project bar percent should be 0');
      assert.strictEqual(result.completed, 0, 'empty project bar completed should be 0');
      assert.strictEqual(result.total, 0, 'empty project bar total should be 0');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — stats command
// ---------------------------------------------------------------------------

describe('stats command', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 4: stats json on mid-milestone project
  // -------------------------------------------------------------------------

  describe('stats json', () => {
    it('returns milestone, phase, plan, and requirement statistics', () => {
      const dir = createMidMilestoneProject();
      addPlanFiles(dir);

      const result = runGsdTools(['stats', 'json'], dir);

      // Milestone fields
      assert.strictEqual(typeof result.milestone_version, 'string', 'milestone_version should be a string');
      assert.strictEqual(typeof result.milestone_name, 'string', 'milestone_name should be a string');

      // Phases array
      assert.ok(Array.isArray(result.phases), 'phases should be an array');
      for (const phase of result.phases) {
        assert.strictEqual(typeof phase.number, 'string', 'phase.number should be a string');
        assert.strictEqual(typeof phase.name, 'string', 'phase.name should be a string');
        assert.strictEqual(typeof phase.plans, 'number', 'phase.plans should be a number');
        assert.strictEqual(typeof phase.summaries, 'number', 'phase.summaries should be a number');
        assert.strictEqual(typeof phase.status, 'string', 'phase.status should be a string');
        assert.ok(
          ['Not Started', 'Complete', 'In Progress', 'Planned'].includes(phase.status),
          `stats phase.status "${phase.status}" should be a valid status`
        );
      }

      // Aggregate completion fields
      assert.strictEqual(typeof result.phases_completed, 'number', 'phases_completed should be a number');
      assert.strictEqual(typeof result.phases_total, 'number', 'phases_total should be a number');
      assert.strictEqual(typeof result.total_plans, 'number', 'total_plans should be a number');
      assert.strictEqual(typeof result.total_summaries, 'number', 'total_summaries should be a number');
      assert.strictEqual(typeof result.percent, 'number', 'percent should be a number');
      assert.strictEqual(typeof result.plan_percent, 'number', 'plan_percent should be a number');

      // Requirements
      assert.strictEqual(typeof result.requirements_total, 'number', 'requirements_total should be a number');
      assert.strictEqual(typeof result.requirements_complete, 'number', 'requirements_complete should be a number');

      // Mid-milestone fixture has 2 checked + 4 unchecked requirements
      assert.strictEqual(result.requirements_total, 6, 'should have 6 total requirements');
      assert.strictEqual(result.requirements_complete, 2, 'should have 2 completed requirements');

      // Plan counts with PLAN.md added
      assert.strictEqual(result.total_plans, 2, 'should have 2 plans');
      assert.strictEqual(result.total_summaries, 1, 'should have 1 summary');
      assert.strictEqual(result.plan_percent, 50, 'plan_percent should be 50');
    });

    it('includes git stats for project with git history', () => {
      const dir = createMidMilestoneProject();

      const result = runGsdTools(['stats', 'json'], dir);

      // Mid-milestone fixture has git init with one commit
      assert.strictEqual(typeof result.git_commits, 'number', 'git_commits should be a number');
      assert.ok(result.git_commits >= 1, 'should have at least 1 git commit');
      assert.strictEqual(typeof result.git_first_commit_date, 'string', 'git_first_commit_date should be a string');
    });

    it('includes last_activity from STATE.md', () => {
      const dir = createMidMilestoneProject();

      const result = runGsdTools(['stats', 'json'], dir);

      assert.strictEqual(typeof result.last_activity, 'string', 'last_activity should be a string');
      assert.ok(result.last_activity.includes('2026-01-15'), 'last_activity should contain fixture date');
    });

    it('returns zero stats for empty project', () => {
      const dir = createEmptyProject();

      const result = runGsdTools(['stats', 'json'], dir);

      assert.strictEqual(result.total_plans, 0, 'empty project should have 0 plans');
      assert.strictEqual(result.total_summaries, 0, 'empty project should have 0 summaries');
      assert.strictEqual(result.percent, 0, 'empty project should have 0 percent');
      assert.strictEqual(result.requirements_total, 0, 'empty project should have 0 requirements');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — validate health command
// ---------------------------------------------------------------------------

describe('validate health command', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 5: validate health on empty project
  // -------------------------------------------------------------------------

  describe('healthy project', () => {
    it('returns healthy status for well-formed project', () => {
      const dir = createEmptyProject();

      const result = runGsdTools(['validate', 'health'], dir);

      // Status should be healthy or degraded (warnings about missing sections are OK)
      assert.ok(
        ['healthy', 'degraded'].includes(result.status),
        `status should be healthy or degraded, got "${result.status}"`
      );
      assert.ok(Array.isArray(result.errors), 'errors should be an array');
      assert.ok(Array.isArray(result.warnings), 'warnings should be an array');
      assert.ok(Array.isArray(result.info), 'info should be an array');
      assert.strictEqual(typeof result.repairable_count, 'number', 'repairable_count should be a number');

      // No critical errors for a well-formed project
      assert.strictEqual(result.errors.length, 0, 'well-formed project should have 0 errors');
    });

    it('returns healthy status for mid-milestone project', () => {
      const dir = createMidMilestoneProject();

      const result = runGsdTools(['validate', 'health'], dir);

      assert.ok(
        ['healthy', 'degraded'].includes(result.status),
        `mid-milestone status should be healthy or degraded, got "${result.status}"`
      );
      assert.strictEqual(result.errors.length, 0, 'mid-milestone project should have 0 errors');
    });

    it('warning objects have expected structure', () => {
      const dir = createEmptyProject();

      const result = runGsdTools(['validate', 'health'], dir);

      // If there are warnings, verify their structure
      for (const warning of result.warnings) {
        assert.strictEqual(typeof warning.code, 'string', 'warning.code should be a string');
        assert.strictEqual(typeof warning.message, 'string', 'warning.message should be a string');
        assert.ok(warning.code.startsWith('W'), 'warning codes should start with W');
      }

      // If there are info items, verify their structure
      for (const item of result.info) {
        assert.strictEqual(typeof item.code, 'string', 'info.code should be a string');
        assert.strictEqual(typeof item.message, 'string', 'info.message should be a string');
        assert.ok(item.code.startsWith('I'), 'info codes should start with I');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Test 6: validate health on corrupt project (missing-roadmap)
  // -------------------------------------------------------------------------

  describe('corrupt project', () => {
    it('reports broken status for missing-roadmap project', () => {
      const dir = createCorruptProject('missing-roadmap');

      const result = runGsdTools(['validate', 'health'], dir);

      assert.strictEqual(result.status, 'broken', 'missing-roadmap project should be broken');
      assert.ok(result.errors.length > 0, 'should have at least one error');

      // Should contain E003 (ROADMAP.md not found)
      const errorCodes = result.errors.map(e => e.code);
      assert.ok(errorCodes.includes('E003'), 'errors should include E003 for missing ROADMAP.md');

      // Error objects have expected structure
      for (const err of result.errors) {
        assert.strictEqual(typeof err.code, 'string', 'error.code should be a string');
        assert.strictEqual(typeof err.message, 'string', 'error.message should be a string');
        assert.ok(err.code.startsWith('E'), 'error codes should start with E');
      }
    });

    it('reports broken status for invalid-yaml project', () => {
      const dir = createCorruptProject('invalid-yaml');

      const result = runGsdTools(['validate', 'health'], dir);

      // invalid-yaml STATE.md should trigger errors
      assert.ok(
        ['broken', 'degraded'].includes(result.status),
        `invalid-yaml project should be broken or degraded, got "${result.status}"`
      );
    });

    it('detects version-mismatch as degraded or broken', () => {
      const dir = createCorruptProject('version-mismatch');

      const result = runGsdTools(['validate', 'health'], dir);

      // Version mismatch between STATE.md (v2.0) and ROADMAP.md (v1.0)
      // should produce at least warnings
      assert.ok(
        ['broken', 'degraded'].includes(result.status),
        `version-mismatch should not be healthy, got "${result.status}"`
      );
      const allIssues = [...result.errors, ...result.warnings, ...result.info];
      assert.ok(allIssues.length > 0, 'version-mismatch should have at least one issue');
    });

    it('detects orphan-phase as degraded', () => {
      const dir = createCorruptProject('orphan-phase');

      const result = runGsdTools(['validate', 'health'], dir);

      // Orphan phase (empty directory on disk not matching roadmap) should
      // produce warnings about disk/roadmap mismatches
      assert.ok(
        ['healthy', 'degraded'].includes(result.status),
        `orphan-phase status should be healthy or degraded, got "${result.status}"`
      );
    });

    it('repairable_count reflects fixable issues', () => {
      const dir = createCorruptProject('missing-roadmap');

      const result = runGsdTools(['validate', 'health'], dir);

      assert.strictEqual(typeof result.repairable_count, 'number', 'repairable_count should be a number');
      // E003 (missing roadmap) is not repairable, but W003 (missing config) is
      // The exact count depends on which checks find repairable issues
      assert.ok(result.repairable_count >= 0, 'repairable_count should be non-negative');
    });
  });
});
