/**
 * E2E Tests — init new-project and related state commands
 *
 * Validates the `init new-project` JSON output, brownfield detection,
 * package file detection, state transitions, and planning file validity.
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
  fixtureCleanup,
} = require('./fixtures.cjs');

const {
  assertFileExists,
  assertFileContains,
  assertValidFrontmatter,
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

describe('init new-project', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -------------------------------------------------------------------------
  // Test 1: JSON structure
  // -------------------------------------------------------------------------

  describe('JSON structure', () => {
    it('returns all required fields with correct types', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'new-project'], dir);

      // Boolean fields
      assert.strictEqual(typeof result.project_exists, 'boolean', 'project_exists should be boolean');
      assert.strictEqual(typeof result.planning_exists, 'boolean', 'planning_exists should be boolean');
      assert.strictEqual(typeof result.is_brownfield, 'boolean', 'is_brownfield should be boolean');
      assert.strictEqual(typeof result.has_git, 'boolean', 'has_git should be boolean');
      assert.strictEqual(typeof result.has_existing_code, 'boolean', 'has_existing_code should be boolean');
      assert.strictEqual(typeof result.has_package_file, 'boolean', 'has_package_file should be boolean');
      assert.strictEqual(typeof result.has_codebase_map, 'boolean', 'has_codebase_map should be boolean');
      assert.strictEqual(typeof result.needs_codebase_map, 'boolean', 'needs_codebase_map should be boolean');
      assert.strictEqual(typeof result.commit_docs, 'boolean', 'commit_docs should be boolean');
      assert.strictEqual(typeof result.brave_search_available, 'boolean', 'brave_search_available should be boolean');
      assert.strictEqual(typeof result.firecrawl_available, 'boolean', 'firecrawl_available should be boolean');
      assert.strictEqual(typeof result.exa_search_available, 'boolean', 'exa_search_available should be boolean');

      // String fields
      assert.strictEqual(result.project_path, '.planning/PROJECT.md', 'project_path should be .planning/PROJECT.md');
      assert.strictEqual(typeof result.project_root, 'string', 'project_root should be a string');
      assert.strictEqual(typeof result.researcher_model, 'string', 'researcher_model should be a string');
      assert.strictEqual(typeof result.synthesizer_model, 'string', 'synthesizer_model should be a string');
      assert.strictEqual(typeof result.roadmapper_model, 'string', 'roadmapper_model should be a string');

      // project_root should match the fixture directory (resolve symlinks for macOS /var -> /private/var)
      assert.strictEqual(result.project_root, fs.realpathSync(dir), 'project_root should equal the working directory');
    });

    it('detects existing .planning/ directory and PROJECT.md', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.project_exists, true, 'project_exists should be true when PROJECT.md exists');
      assert.strictEqual(result.planning_exists, true, 'planning_exists should be true when .planning/ exists');
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Brownfield detection
  // -------------------------------------------------------------------------

  describe('brownfield detection', () => {
    it('detects brownfield when code files exist', () => {
      const dir = createEmptyProject();

      // Write a .js file into the project root
      fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hello");\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_existing_code, true, 'has_existing_code should be true with .js file present');
      assert.strictEqual(result.is_brownfield, true, 'is_brownfield should be true with code files');
    });

    it('detects brownfield with nested code files up to depth 3', () => {
      const dir = createEmptyProject();

      // Write a .py file nested 2 levels deep
      const nestedDir = path.join(dir, 'src', 'lib');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(nestedDir, 'utils.py'), 'def hello(): pass\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_existing_code, true, 'has_existing_code should detect nested code files');
      assert.strictEqual(result.is_brownfield, true, 'is_brownfield should be true with nested code');
    });

    it('reports greenfield when no code or package files exist', () => {
      const dir = createEmptyProject();
      // createEmptyProject only creates .planning/ files — no code, no package files

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_existing_code, false, 'has_existing_code should be false in empty project');
      assert.strictEqual(result.has_package_file, false, 'has_package_file should be false in empty project');
      assert.strictEqual(result.is_brownfield, false, 'is_brownfield should be false in empty project');
    });

    it('ignores code files inside skipped directories', () => {
      const dir = createEmptyProject();

      // Write code inside node_modules — should be skipped
      const nmDir = path.join(dir, 'node_modules', 'some-pkg');
      fs.mkdirSync(nmDir, { recursive: true });
      fs.writeFileSync(path.join(nmDir, 'index.js'), 'module.exports = {};\n');

      // Write code inside .git — should be skipped
      const gitDir = path.join(dir, '.git', 'hooks');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(path.join(gitDir, 'pre-commit.py'), '#!/usr/bin/env python\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_existing_code, false, 'has_existing_code should skip node_modules and .git');
      assert.strictEqual(result.is_brownfield, false, 'is_brownfield should be false when only skipped dirs have code');
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: Package file detection
  // -------------------------------------------------------------------------

  describe('package file detection', () => {
    it('detects package.json', () => {
      const dir = createEmptyProject();
      fs.writeFileSync(path.join(dir, 'package.json'), '{"name": "test"}\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, true, 'has_package_file should be true with package.json');
      assert.strictEqual(result.is_brownfield, true, 'is_brownfield should be true with package.json');
    });

    it('detects requirements.txt', () => {
      const dir = createEmptyProject();
      fs.writeFileSync(path.join(dir, 'requirements.txt'), 'flask>=2.0\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, true, 'has_package_file should be true with requirements.txt');
      assert.strictEqual(result.is_brownfield, true, 'is_brownfield should be true with requirements.txt');
    });

    it('detects Cargo.toml', () => {
      const dir = createEmptyProject();
      fs.writeFileSync(path.join(dir, 'Cargo.toml'), '[package]\nname = "test"\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, true, 'has_package_file should be true with Cargo.toml');
    });

    it('detects go.mod', () => {
      const dir = createEmptyProject();
      fs.writeFileSync(path.join(dir, 'go.mod'), 'module example.com/test\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, true, 'has_package_file should be true with go.mod');
    });

    it('detects Makefile', () => {
      const dir = createEmptyProject();
      fs.writeFileSync(path.join(dir, 'Makefile'), 'all:\n\techo hello\n');

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, true, 'has_package_file should be true with Makefile');
    });

    it('returns false when no package files exist', () => {
      const dir = createEmptyProject();

      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_package_file, false, 'has_package_file should be false without package files');
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: State begin-phase transitions
  // -------------------------------------------------------------------------

  describe('state begin-phase', () => {
    it('updates STATE.md with phase information', () => {
      // Use mid-milestone project which has a complete STATE.md with
      // Current Position section and all required fields
      const dir = createMidMilestoneProject();
      const statePath = path.join(dir, '.planning', 'STATE.md');

      // state begin-phase with --raw returns a raw boolean string ('true'/'false'),
      // not JSON. Call without --raw to get JSON output.
      const rawOutput = execFileSync(process.execPath, [
        GSD_TOOLS, 'state', 'begin-phase',
        '--phase', '2', '--name', 'Feature Implementation', '--plans', '3',
      ], {
        cwd: dir,
        encoding: 'utf-8',
        timeout: 15000,
      });
      const result = JSON.parse(rawOutput);

      // The command returns { updated, phase, phase_name, plan_count }
      assert.ok(Array.isArray(result.updated), 'updated should be an array of field names');
      assert.ok(result.updated.length > 0, 'begin-phase should have updated at least one field');
      assert.strictEqual(result.phase, '2', 'phase should echo back the phase number');
      assert.strictEqual(result.phase_name, 'Feature Implementation', 'phase_name should echo back');

      // Verify STATE.md was modified with phase reference
      assertFileContains(statePath, 'Phase');
      assertFileContains(statePath, '2');
    });

    it('writes phase execution status into STATE.md', () => {
      const dir = createMidMilestoneProject();
      const statePath = path.join(dir, '.planning', 'STATE.md');

      runGsdTools(
        ['state', 'begin-phase', '--phase', '3', '--name', 'Final Phase', '--plans', '2'],
        dir
      );

      // STATE.md should contain execution status markers
      assertFileContains(statePath, 'EXECUTING');
    });
  });

  // -------------------------------------------------------------------------
  // Test 5: Planning files validity
  // -------------------------------------------------------------------------

  describe('planning files validity', () => {
    it('empty project has valid .planning/ files with frontmatter', () => {
      const dir = createEmptyProject();

      assertFileExists(path.join(dir, '.planning', 'STATE.md'));
      assertFileExists(path.join(dir, '.planning', 'PROJECT.md'));
      assertFileExists(path.join(dir, '.planning', 'ROADMAP.md'));
      assertFileExists(path.join(dir, '.planning', 'REQUIREMENTS.md'));

      // STATE.md frontmatter must have required fields
      assertValidFrontmatter(path.join(dir, '.planning', 'STATE.md'), [
        'gsd_state_version',
        'milestone',
        'status',
      ]);

      // PROJECT.md frontmatter must have name field
      assertValidFrontmatter(path.join(dir, '.planning', 'PROJECT.md'), [
        'name',
      ]);
    });

    it('mid-milestone project has valid frontmatter with progress', () => {
      const dir = createMidMilestoneProject();

      assertFileExists(path.join(dir, '.planning', 'STATE.md'));
      assertFileExists(path.join(dir, '.planning', 'PROJECT.md'));

      assertValidFrontmatter(path.join(dir, '.planning', 'STATE.md'), [
        'gsd_state_version',
        'milestone',
        'status',
        'progress',
      ]);
    });

    it('mid-milestone project has git repository', () => {
      const dir = createMidMilestoneProject();
      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_git, true, 'has_git should be true for mid-milestone project');
    });

    it('empty project has no git repository', () => {
      const dir = createEmptyProject();
      const result = runGsdTools(['init', 'new-project'], dir);

      assert.strictEqual(result.has_git, false, 'has_git should be false for empty project (no git init)');
    });
  });
});
