/**
 * E2E Infrastructure Smoke Tests
 *
 * Validates that all E2E test infrastructure (fixtures, assertions, mock layer)
 * works correctly before any pipeline-level E2E tests depend on them.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 */

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  createEmptyProject,
  createMidMilestoneProject,
  createCompletedMilestoneProject,
  createCorruptProject,
  fixtureCleanup,
} = require('./fixtures.cjs');

const {
  assertFileExists,
  assertFileNotExists,
  assertFileContains,
  assertFileNotContains,
  assertStateField,
  assertValidFrontmatter,
} = require('./assertions.cjs');

const {
  mockSubagent,
  createMockContext,
  interceptCoreExports,
  createDeterministicResponses,
} = require('./mock-layer.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal YAML frontmatter parser — mirrors the one in assertions.cjs.
 * Used here to verify fixture output independently of the assertion helpers.
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');
  let start = -1;
  let end = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) {
        start = i;
      } else {
        end = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1) return null;

  const fmLines = lines.slice(start + 1, end);
  const result = {};
  let currentParent = null;

  for (const line of fmLines) {
    if (line.trim() === '') {
      currentParent = null;
      continue;
    }

    const indented = /^[ \t]+/.test(line);

    if (indented && currentParent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
      if (typeof result[currentParent] !== 'object') result[currentParent] = {};
      result[currentParent][key] = val;
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if (val === '') {
        currentParent = key;
        result[key] = {};
      } else {
        currentParent = null;
        if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
        result[key] = val;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('E2E Infrastructure Smoke Tests', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  // -----------------------------------------------------------------------
  // Fixture System
  // -----------------------------------------------------------------------

  describe('Fixture System', () => {
    it('createEmptyProject creates valid .planning/ directory', () => {
      const dir = createEmptyProject();

      // All four planning files must exist
      const planningFiles = ['STATE.md', 'ROADMAP.md', 'REQUIREMENTS.md', 'PROJECT.md'];
      for (const file of planningFiles) {
        assertFileExists(path.join(dir, '.planning', file));
      }

      // STATE.md must have parseable frontmatter
      const stateContent = fs.readFileSync(path.join(dir, '.planning', 'STATE.md'), 'utf-8');
      const fm = parseFrontmatter(stateContent);
      assert.notStrictEqual(fm, null, 'STATE.md frontmatter should be parseable');
      assert.ok(fm.gsd_state_version !== undefined, 'STATE.md should have gsd_state_version');
      assert.ok(fm.milestone !== undefined, 'STATE.md should have milestone');
      assert.ok(fm.status !== undefined, 'STATE.md should have status');

      // PROJECT.md must have parseable frontmatter
      const projectContent = fs.readFileSync(path.join(dir, '.planning', 'PROJECT.md'), 'utf-8');
      const projectFm = parseFrontmatter(projectContent);
      assert.notStrictEqual(projectFm, null, 'PROJECT.md frontmatter should be parseable');
      assert.ok(projectFm.name !== undefined, 'PROJECT.md should have name field');
    });

    it('createMidMilestoneProject creates parseable state', () => {
      const dir = createMidMilestoneProject();

      const stateContent = fs.readFileSync(path.join(dir, '.planning', 'STATE.md'), 'utf-8');
      const fm = parseFrontmatter(stateContent);
      assert.notStrictEqual(fm, null, 'Frontmatter should be parseable');

      // Required fields from the plan spec
      assert.ok(fm.gsd_state_version !== undefined, 'Should have gsd_state_version');
      assert.ok(fm.milestone !== undefined, 'Should have milestone');
      assert.ok(fm.status !== undefined, 'Should have status');
      assert.ok(fm.progress !== undefined, 'Should have progress');
      assert.strictEqual(fm.status, 'active', 'Mid-milestone status should be active');

      // Progress sub-fields
      assert.ok(typeof fm.progress === 'object', 'progress should be an object');
      assert.ok(fm.progress.total_phases !== undefined, 'progress should have total_phases');
      assert.ok(fm.progress.completed_phases !== undefined, 'progress should have completed_phases');
    });

    it('createCompletedMilestoneProject shows shipped status', () => {
      const dir = createCompletedMilestoneProject();

      const stateContent = fs.readFileSync(path.join(dir, '.planning', 'STATE.md'), 'utf-8');
      const fm = parseFrontmatter(stateContent);
      assert.notStrictEqual(fm, null, 'Frontmatter should be parseable');

      assert.strictEqual(fm.status, 'shipped', 'Completed milestone should have status: shipped');

      // All phases complete
      assert.ok(typeof fm.progress === 'object', 'progress should be an object');
      assert.strictEqual(
        fm.progress.total_phases,
        fm.progress.completed_phases,
        'All phases should be completed'
      );
      assert.strictEqual(
        fm.progress.total_plans,
        fm.progress.completed_plans,
        'All plans should be completed'
      );
    });

    it('createCorruptProject produces intentionally broken state', () => {
      // Mode 1: invalid-yaml — STATE.md that fails YAML parse
      const dirInvalid = createCorruptProject('invalid-yaml');
      const invalidContent = fs.readFileSync(
        path.join(dirInvalid, '.planning', 'STATE.md'),
        'utf-8'
      );
      const invalidFm = parseFrontmatter(invalidContent);
      // The frontmatter should either be null or have no valid gsd_state_version
      const hasValidVersion = invalidFm && invalidFm.gsd_state_version !== undefined;
      assert.ok(!hasValidVersion, 'invalid-yaml should not produce valid gsd_state_version');

      // Mode 2: missing-roadmap — ROADMAP.md should not exist
      const dirMissing = createCorruptProject('missing-roadmap');
      assertFileExists(path.join(dirMissing, '.planning', 'STATE.md'));
      assertFileNotExists(path.join(dirMissing, '.planning', 'ROADMAP.md'));
    });

    it('fixtureCleanup removes all temp directories', () => {
      // Create multiple fixtures
      const dir1 = createEmptyProject();
      const dir2 = createMidMilestoneProject();
      const dir3 = createCorruptProject('invalid-yaml');

      // Verify they exist before cleanup
      assert.ok(fs.existsSync(dir1), 'dir1 should exist before cleanup');
      assert.ok(fs.existsSync(dir2), 'dir2 should exist before cleanup');
      assert.ok(fs.existsSync(dir3), 'dir3 should exist before cleanup');

      // Run cleanup
      fixtureCleanup();

      // All should be gone
      assert.ok(!fs.existsSync(dir1), 'dir1 should not exist after cleanup');
      assert.ok(!fs.existsSync(dir2), 'dir2 should not exist after cleanup');
      assert.ok(!fs.existsSync(dir3), 'dir3 should not exist after cleanup');
    });
  });

  // -----------------------------------------------------------------------
  // Assertion Helpers
  // -----------------------------------------------------------------------

  describe('Assertion Helpers', () => {
    it('assertFileContains passes and fails correctly', () => {
      const dir = createEmptyProject();
      const statePath = path.join(dir, '.planning', 'STATE.md');

      // String pattern — should pass
      assertFileContains(statePath, 'gsd_state_version');

      // Regex pattern — should pass
      assertFileContains(statePath, /milestone:\s+v0\.1/);

      // Non-matching string — should throw
      assert.throws(
        () => assertFileContains(statePath, 'THIS_STRING_DOES_NOT_EXIST_ANYWHERE'),
        { name: 'AssertionError' },
      );

      // Non-matching regex — should throw
      assert.throws(
        () => assertFileContains(statePath, /ZZZZZ_NO_MATCH/),
      );
    });

    it('assertStateField reads STATE.md frontmatter', () => {
      const dir = createEmptyProject();

      // Validate known fields from the empty project fixture
      assertStateField(dir, 'milestone', 'v0.1');
      assertStateField(dir, 'status', 'active');
      assertStateField(dir, 'milestone_name', 'Test Milestone');

      // Non-matching value should throw
      assert.throws(
        () => assertStateField(dir, 'status', 'shipped'),
      );
    });

    it('assertValidFrontmatter detects missing fields', () => {
      const dir = createEmptyProject();
      const statePath = path.join(dir, '.planning', 'STATE.md');

      // Should pass with fields that exist
      assertValidFrontmatter(statePath, ['gsd_state_version', 'milestone', 'status']);

      // Should throw when a required field is missing
      assert.throws(
        () => assertValidFrontmatter(statePath, ['gsd_state_version', 'nonexistent_field_xyz']),
      );

      // File without frontmatter should throw
      const noFmPath = path.join(dir, '.planning', 'ROADMAP.md');
      assert.throws(
        () => assertValidFrontmatter(noFmPath, ['anything']),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Mock Layer
  // -----------------------------------------------------------------------

  describe('Mock Layer', () => {
    it('mockSubagent returns canned responses and records calls', () => {
      const cannedResult = { status: 'pass', score: 100 };
      const agent = mockSubagent('gsd-verifier', cannedResult);

      // Initially no calls
      assert.strictEqual(agent.calls.length, 0, 'Should start with no calls');

      // Invoke returns canned response
      const result1 = agent.invoke({ phase: 1 });
      assert.deepStrictEqual(result1, cannedResult, 'Should return canned response');
      assert.strictEqual(agent.calls.length, 1, 'Should record one call');
      assert.strictEqual(agent.calls[0].name, 'gsd-verifier', 'Should record agent name');
      assert.deepStrictEqual(agent.calls[0].args, { phase: 1 }, 'Should record args');
      assert.ok(typeof agent.calls[0].timestamp === 'number', 'Should record timestamp');

      // Multiple invocations accumulate
      agent.invoke('second call');
      agent.invoke();
      assert.strictEqual(agent.calls.length, 3, 'Should accumulate calls');
      assert.strictEqual(agent.calls[2].args, null, 'No-arg call should record null');
    });

    it('createMockContext returns defaults and accepts overrides', () => {
      // Default context has expected keys
      const ctx = createMockContext();
      assert.ok(ctx.projectRoot !== undefined, 'Should have projectRoot');
      assert.ok(ctx.statePath !== undefined, 'Should have statePath');
      assert.ok(ctx.roadmapPath !== undefined, 'Should have roadmapPath');
      assert.ok(ctx.configPath !== undefined, 'Should have configPath');
      assert.ok(ctx.config !== undefined, 'Should have config');
      assert.ok(typeof ctx.config === 'object', 'config should be an object');

      // Overrides are applied
      const custom = createMockContext({ projectRoot: '/custom/path', config: { commit_docs: true } });
      assert.strictEqual(custom.projectRoot, '/custom/path', 'Should override projectRoot');
      assert.strictEqual(custom.config.commit_docs, true, 'Should override config.commit_docs');
      // Default config keys preserved through deep merge
      assert.strictEqual(custom.config.model_profile, 'balanced', 'Should preserve default config keys');

      // Each call returns a fresh object
      const ctx1 = createMockContext();
      const ctx2 = createMockContext();
      assert.notStrictEqual(ctx1, ctx2, 'Should return distinct objects');
    });

    it('interceptCoreExports stubs and restores', () => {
      // Create a stub function
      let stubCalled = false;
      const stubFn = () => { stubCalled = true; return 'stubbed'; };

      const { restore } = interceptCoreExports({ debugLog: stubFn });

      try {
        // After interception, require('core.cjs').debugLog should be the stub
        const corePath = require.resolve(
          path.join(__dirname, '..', '..', 'get-shit-done', 'bin', 'lib', 'core.cjs')
        );
        const core = require.cache[corePath].exports;
        assert.strictEqual(core.debugLog, stubFn, 'Export should be stubbed');

        // Call it to verify
        const result = core.debugLog();
        assert.ok(stubCalled, 'Stub should have been called');
        assert.strictEqual(result, 'stubbed', 'Stub should return its value');
      } finally {
        // Restore originals
        restore();
      }

      // After restore, debugLog should be the original function
      const corePath = require.resolve(
        path.join(__dirname, '..', '..', 'get-shit-done', 'bin', 'lib', 'core.cjs')
      );
      const core = require.cache[corePath].exports;
      assert.notStrictEqual(core.debugLog, stubFn, 'Export should be restored to original');
      assert.strictEqual(typeof core.debugLog, 'function', 'Original should be a function');
    });

    it('createDeterministicResponses returns expected structures', () => {
      // plan-phase scenario
      const planResp = createDeterministicResponses('plan-phase');
      assert.ok(planResp.planContent !== undefined, 'plan-phase should have planContent');
      assert.ok(planResp.contextContent !== undefined, 'plan-phase should have contextContent');
      assert.ok(planResp.frontmatter !== undefined, 'plan-phase should have frontmatter');
      assert.strictEqual(typeof planResp.planContent, 'string', 'planContent should be a string');
      assert.strictEqual(typeof planResp.contextContent, 'string', 'contextContent should be a string');
      assert.strictEqual(typeof planResp.frontmatter, 'object', 'frontmatter should be an object');

      // execute-phase scenario returns different structure
      const execResp = createDeterministicResponses('execute-phase');
      assert.ok(execResp.summaryContent !== undefined, 'execute-phase should have summaryContent');
      assert.ok(execResp.taskResults !== undefined, 'execute-phase should have taskResults');
      assert.ok(Array.isArray(execResp.taskResults), 'taskResults should be an array');

      // verify-work scenario
      const verifyResp = createDeterministicResponses('verify-work');
      assert.ok(verifyResp.verificationContent !== undefined, 'verify-work should have verificationContent');
      assert.ok(verifyResp.passed !== undefined, 'verify-work should have passed');
      assert.ok(verifyResp.criteria !== undefined, 'verify-work should have criteria');

      // Unknown scenario throws
      assert.throws(
        () => createDeterministicResponses('nonexistent-scenario'),
        /unknown scenario/i,
        'Unknown scenario should throw with descriptive message'
      );
    });
  });
});
