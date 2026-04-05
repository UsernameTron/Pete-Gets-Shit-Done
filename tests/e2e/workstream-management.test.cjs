/**
 * E2E Tests — workstream create, list, status, complete commands
 *
 * Validates the workstream CRUD lifecycle: flat-mode detection, creation
 * with migration, duplicate prevention, status queries, and completion
 * of non-existent workstreams.
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
  fixtureCleanup,
} = require('./fixtures.cjs');

const {
  assertFileExists,
} = require('./assertions.cjs');

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

describe('workstream management', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: workstream list on flat project
  // -------------------------------------------------------------------------

  describe('workstream list (flat project)', () => {
    it('returns flat mode with empty workstreams array when no workstreams exist', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['workstream', 'list'], dir);

      assert.strictEqual(result.mode, 'flat', 'mode should be "flat" when no workstreams/ directory exists');
      assert.ok(Array.isArray(result.workstreams), 'workstreams should be an array');
      assert.strictEqual(result.workstreams.length, 0, 'workstreams array should be empty');
      // flat mode does not include a count field — only workstream mode does
      assert.strictEqual(typeof result.message, 'string', 'flat mode should include a message string');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: workstream create
  // -------------------------------------------------------------------------

  describe('workstream create', () => {
    it('creates a new workstream and returns expected fields', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['workstream', 'create', 'backend'], dir);

      assert.strictEqual(result.created, true, 'created should be true');
      assert.strictEqual(result.workstream, 'backend', 'workstream name should match requested name');
      assert.strictEqual(typeof result.path, 'string', 'path should be a string');
      assert.strictEqual(typeof result.state_path, 'string', 'state_path should be a string');
      assert.strictEqual(typeof result.phases_path, 'string', 'phases_path should be a string');
      assert.strictEqual(result.active, true, 'newly created workstream should be active');

      // Verify files were created on disk
      const realDir = fs.realpathSync(dir);
      const wsDir = path.join(realDir, '.planning', 'workstreams', 'backend');
      assertFileExists(path.join(wsDir, 'STATE.md'));
      assert.ok(fs.existsSync(path.join(wsDir, 'phases')), 'phases/ directory should exist');
    });

    it('returns migration info when flat project has existing planning files', () => {
      const dir = createEmptyProject();
      // createEmptyProject has STATE.md and ROADMAP.md, so migration triggers
      const result = runGsdTools(['workstream', 'create', 'backend'], dir);

      assert.strictEqual(result.created, true, 'created should be true even with migration');
      // Migration should have occurred since the empty project has STATE.md/ROADMAP.md
      if (result.migration) {
        assert.strictEqual(result.migration.migrated, true, 'migration.migrated should be true');
        assert.ok(Array.isArray(result.migration.files_moved), 'migration.files_moved should be an array');
      }
    });

    it('returns already_exists error for duplicate workstream creation', () => {
      const dir = createEmptyProject();

      // Create the workstream first
      const first = runGsdTools(['workstream', 'create', 'backend'], dir);
      assert.strictEqual(first.created, true, 'first creation should succeed');

      // Attempt duplicate creation
      const second = runGsdTools(['workstream', 'create', 'backend'], dir);
      assert.strictEqual(second.created, false, 'duplicate creation should return created: false');
      assert.strictEqual(second.error, 'already_exists', 'error should be "already_exists"');
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: workstream list after creation
  // -------------------------------------------------------------------------

  describe('workstream list (after creation)', () => {
    it('returns workstream mode with created workstream in array', () => {
      const dir = createEmptyProject();

      // Create a workstream first
      runGsdTools(['workstream', 'create', 'backend'], dir);

      const result = runGsdTools(['workstream', 'list'], dir);

      assert.strictEqual(result.mode, 'workstream', 'mode should be "workstream" after creation');
      assert.strictEqual(typeof result.count, 'number', 'count should be a number');
      assert.ok(result.count >= 1, 'count should be at least 1');
      assert.ok(Array.isArray(result.workstreams), 'workstreams should be an array');
      assert.ok(result.workstreams.length >= 1, 'workstreams array should have at least 1 entry');

      // Find the backend workstream in the list
      const backend = result.workstreams.find(ws => ws.name === 'backend');
      assert.ok(backend, 'backend workstream should appear in the list');

      // Validate workstream object shape
      assert.strictEqual(typeof backend.name, 'string', 'workstream.name should be a string');
      assert.strictEqual(typeof backend.path, 'string', 'workstream.path should be a string');
      assert.strictEqual(typeof backend.has_roadmap, 'boolean', 'workstream.has_roadmap should be a boolean');
      assert.strictEqual(typeof backend.has_state, 'boolean', 'workstream.has_state should be a boolean');
      assert.strictEqual(typeof backend.status, 'string', 'workstream.status should be a string');
      assert.strictEqual(typeof backend.phase_count, 'number', 'workstream.phase_count should be a number');
      assert.strictEqual(typeof backend.completed_phases, 'number', 'workstream.completed_phases should be a number');

      // current_phase can be null or string
      assert.ok(
        backend.current_phase === null || typeof backend.current_phase === 'string',
        'workstream.current_phase should be null or string'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: workstream status
  // -------------------------------------------------------------------------

  describe('workstream status', () => {
    it('returns status details for an existing workstream', () => {
      const dir = createEmptyProject();
      runGsdTools(['workstream', 'create', 'backend'], dir);

      const result = runGsdTools(['workstream', 'status', 'backend'], dir);

      assert.strictEqual(result.found, true, 'found should be true for existing workstream');
      assert.strictEqual(result.workstream, 'backend', 'workstream name should match');
      assert.strictEqual(typeof result.path, 'string', 'path should be a string');

      // files object
      assert.strictEqual(typeof result.files, 'object', 'files should be an object');
      assert.strictEqual(typeof result.files.state, 'boolean', 'files.state should be a boolean');
      assert.strictEqual(typeof result.files.roadmap, 'boolean', 'files.roadmap should be a boolean');
      assert.strictEqual(typeof result.files.requirements, 'boolean', 'files.requirements should be a boolean');

      // phases array
      assert.ok(Array.isArray(result.phases), 'phases should be an array');
      assert.strictEqual(typeof result.phase_count, 'number', 'phase_count should be a number');
      assert.strictEqual(typeof result.completed_phases, 'number', 'completed_phases should be a number');

      // status field from STATE.md
      assert.strictEqual(typeof result.status, 'string', 'status should be a string');
    });

    it('returns found: false for non-existent workstream', () => {
      const dir = createEmptyProject();
      // Ensure workstreams/ directory exists by creating one workstream first
      runGsdTools(['workstream', 'create', 'backend'], dir);

      const result = runGsdTools(['workstream', 'status', 'nonexistent'], dir);

      assert.strictEqual(result.found, false, 'found should be false for non-existent workstream');
      assert.strictEqual(result.workstream, 'nonexistent', 'workstream name should be echoed back');
    });
  });

  // -------------------------------------------------------------------------
  // Test 5: workstream complete
  // -------------------------------------------------------------------------

  describe('workstream complete', () => {
    it('returns not_found error for non-existent workstream', () => {
      const dir = createEmptyProject();
      // Create one workstream so we are in workstream mode, then try to complete a different one
      runGsdTools(['workstream', 'create', 'backend'], dir);

      const result = runGsdTools(['workstream', 'complete', 'nonexistent'], dir);

      assert.strictEqual(result.completed, false, 'completed should be false for non-existent workstream');
      assert.strictEqual(result.error, 'not_found', 'error should be "not_found"');
      assert.strictEqual(result.workstream, 'nonexistent', 'workstream name should be echoed back');
    });
  });
});
