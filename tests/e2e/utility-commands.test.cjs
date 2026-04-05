/**
 * E2E Tests — init quick (utility command)
 *
 * Validates the `init quick <description>` JSON output, slug generation,
 * quick_id format, and file-existence fields.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  createEmptyProject,
  createMidMilestoneProject,
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

describe('init quick', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: JSON structure
  // -------------------------------------------------------------------------

  describe('JSON structure', () => {
    it('returns all required fields with correct types', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Fix login bug'], dir);

      // Model fields (strings)
      assert.strictEqual(typeof result.planner_model, 'string', 'planner_model should be a string');
      assert.strictEqual(typeof result.executor_model, 'string', 'executor_model should be a string');
      assert.strictEqual(typeof result.checker_model, 'string', 'checker_model should be a string');
      assert.strictEqual(typeof result.verifier_model, 'string', 'verifier_model should be a string');

      // Config fields
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be a boolean');

      // branch_name is null when quick_branch_template is not configured
      assert.ok(
        result.branch_name === null || typeof result.branch_name === 'string',
        'branch_name should be null or a string'
      );

      // Quick task identity
      assert.strictEqual(typeof result.quick_id, 'string', 'quick_id should be a string');
      assert.strictEqual(typeof result.slug, 'string', 'slug should be a string');
      assert.strictEqual(result.description, 'Fix login bug', 'description should echo back the input');

      // Timestamps
      assert.strictEqual(typeof result.date, 'string', 'date should be a string');
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(result.date), 'date should be ISO date format YYYY-MM-DD');
      assert.strictEqual(typeof result.timestamp, 'string', 'timestamp should be a string');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(result.timestamp), 'timestamp should be ISO datetime');

      // Paths
      assert.strictEqual(typeof result.quick_dir, 'string', 'quick_dir should be a string');
      assert.strictEqual(result.quick_dir, '.planning/quick', 'quick_dir should be .planning/quick');
      assert.strictEqual(typeof result.task_dir, 'string', 'task_dir should be a string');
      assert.ok(result.task_dir.startsWith('.planning/quick/'), 'task_dir should be under .planning/quick/');

      // File existence
      assert.strictEqual(typeof result.roadmap_exists, 'boolean', 'roadmap_exists should be a boolean');
      assert.strictEqual(typeof result.planning_exists, 'boolean', 'planning_exists should be a boolean');

      // project_root injected by withProjectRoot
      assert.strictEqual(typeof result.project_root, 'string', 'project_root should be a string');
      assert.strictEqual(
        result.project_root,
        fs.realpathSync(dir),
        'project_root should equal the working directory (resolving symlinks)'
      );

      // agents_installed injected by withProjectRoot
      assert.strictEqual(typeof result.agents_installed, 'boolean', 'agents_installed should be a boolean');
      assert.ok(Array.isArray(result.missing_agents), 'missing_agents should be an array');
    });

    it('returns null slug and null task_dir when description is empty', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick'], dir);

      assert.strictEqual(result.slug, null, 'slug should be null when no description provided');
      assert.strictEqual(result.description, null, 'description should be null when empty');
      assert.strictEqual(result.task_dir, null, 'task_dir should be null when no slug');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Slug generation
  // -------------------------------------------------------------------------

  describe('slug generation', () => {
    it('generates correct slug from simple description', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Fix login bug'], dir);

      assert.strictEqual(result.slug, 'fix-login-bug', 'slug should be lowercased and hyphenated');
    });

    it('sanitizes special characters in description', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Fix: login & auth (v2)'], dir);

      // generateSlugInternal: lowercase, replace non-alphanumeric with hyphens, trim leading/trailing hyphens
      assert.ok(!(/[^a-z0-9-]/).test(result.slug), 'slug should contain only lowercase alphanumeric and hyphens');
      assert.ok(!result.slug.startsWith('-'), 'slug should not start with a hyphen');
      assert.ok(!result.slug.endsWith('-'), 'slug should not end with a hyphen');
      assert.ok(result.slug.includes('fix'), 'slug should contain "fix"');
      assert.ok(result.slug.includes('login'), 'slug should contain "login"');
      assert.ok(result.slug.includes('auth'), 'slug should contain "auth"');
    });

    it('truncates slug to 40 characters maximum', () => {
      const dir = createEmptyProject();
      const longDesc = 'This is a very long description that should be truncated to forty characters maximum for the slug';
      const result = runGsdTools(['init', 'quick', longDesc], dir);

      assert.ok(result.slug.length <= 40, `slug should be at most 40 chars, got ${result.slug.length}`);
    });

    it('includes slug in task_dir path', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Fix login bug'], dir);

      assert.ok(
        result.task_dir.endsWith('-fix-login-bug'),
        `task_dir should end with slug, got: ${result.task_dir}`
      );
      assert.ok(
        result.task_dir.includes(result.quick_id),
        'task_dir should contain the quick_id'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: quick_id format
  // -------------------------------------------------------------------------

  describe('quick_id format', () => {
    it('matches YYMMDD-xxx pattern (6 digits, hyphen, 3+ base36 chars)', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Test task'], dir);

      // Format: YYMMDD-xxx where xxx is 3-char base36 (lowercase)
      assert.ok(
        /^\d{6}-[0-9a-z]{3}$/.test(result.quick_id),
        `quick_id should match YYMMDD-xxx format, got: ${result.quick_id}`
      );
    });

    it('date portion matches current date', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Date check'], dir);

      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const expectedDatePrefix = yy + mm + dd;

      assert.ok(
        result.quick_id.startsWith(expectedDatePrefix),
        `quick_id should start with ${expectedDatePrefix}, got: ${result.quick_id}`
      );
    });

    it('time portion is valid base36 within daily range', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Range check'], dir);

      const timePart = result.quick_id.split('-')[1];
      const decoded = parseInt(timePart, 36);

      // Max seconds in a day = 86400, max 2-second blocks = 43200
      // Base36 max for 3 chars = 36^3 - 1 = 46655, so decoded should be < 43200
      assert.ok(decoded >= 0, 'decoded time block should be non-negative');
      assert.ok(decoded < 43200, `decoded time block should be < 43200 (half-day in 2s blocks), got: ${decoded}`);
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: Empty project fixture state
  // -------------------------------------------------------------------------

  describe('empty project fixture state', () => {
    it('reports planning_exists true for createEmptyProject', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Check planning'], dir);

      assert.strictEqual(
        result.planning_exists,
        true,
        'planning_exists should be true — createEmptyProject creates .planning/'
      );
    });

    it('reports roadmap_exists true for createEmptyProject', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'quick', 'Check roadmap'], dir);

      assert.strictEqual(
        result.roadmap_exists,
        true,
        'roadmap_exists should be true — createEmptyProject creates ROADMAP.md'
      );
    });

    it('reports planning_exists true for mid-milestone project', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'quick', 'Mid-milestone check'], dir);

      assert.strictEqual(result.planning_exists, true, 'planning_exists should be true for mid-milestone project');
      assert.strictEqual(result.roadmap_exists, true, 'roadmap_exists should be true for mid-milestone project');
    });
  });
});
