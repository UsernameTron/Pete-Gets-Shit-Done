/**
 * Workstream Tests — CRUD, env-var routing, collision detection
 */

const { describe, test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// ─── Helper ──────────────────────────────────────────────────────────────────

function createProjectWithState(tmpDir, roadmap, state) {
  if (roadmap) {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), roadmap, 'utf-8');
  }
  if (state) {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), state, 'utf-8');
  }
}

// ─── planningDir / planningPaths env-var awareness ──────────────────────────

describe('planningDir workstream awareness via env var', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // Create workstream structure
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'alpha');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** In progress\n**Current Phase:** 1\n');
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap v1.0: Alpha\n### Phase 1: Setup\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'alpha\n');
  });

  after(() => cleanup(tmpDir));

  test('state json returns workstream-scoped state when GSD_WORKSTREAM is set', () => {
    const result = runGsdTools(['state', 'json', '--raw'], tmpDir, { GSD_WORKSTREAM: 'alpha' });
    assert.ok(result.success, `state json failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.ok(data.status || data.current_phase !== undefined, 'should return state data');
  });

  test('state json reads from flat .planning when no workstream set', () => {
    // Clear active-workstream so no auto-detection
    try { fs.unlinkSync(path.join(tmpDir, '.planning', 'active-workstream')); } catch {}
    const result = runGsdTools(['state', 'json', '--raw'], tmpDir, { GSD_WORKSTREAM: '' });
    // Should fail or return empty state since flat .planning/ has no STATE.md
    assert.ok(!result.success || result.output.includes('not found') || result.output === '{}',
      'should read from flat .planning/');
    // Restore
    fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'alpha\n');
  });

  test('--ws flag overrides GSD_WORKSTREAM env var', () => {
    // Create a second workstream
    const betaDir = path.join(tmpDir, '.planning', 'workstreams', 'beta');
    fs.mkdirSync(path.join(betaDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(betaDir, 'STATE.md'), '# State\n**Status:** Beta active\n');

    const result = runGsdTools(['state', 'json', '--raw', '--ws', 'beta'], tmpDir, { GSD_WORKSTREAM: 'alpha' });
    assert.ok(result.success, `state json --ws beta failed: ${result.error}`);
  });
});

// ─── Workstream CRUD ────────────────────────────────────────────────────────

describe('workstream create', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
  });

  after(() => cleanup(tmpDir));

  test('creates a new workstream in clean project', () => {
    const result = runGsdTools(['workstream', 'create', 'feature-x', '--raw'], tmpDir);
    assert.ok(result.success, `create failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, true);
    assert.strictEqual(data.workstream, 'feature-x');
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'feature-x', 'STATE.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'feature-x', 'phases')));
  });

  test('sets created workstream as active', () => {
    const active = fs.readFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'utf-8').trim();
    assert.strictEqual(active, 'feature-x');
  });

  test('rejects duplicate workstream', () => {
    const result = runGsdTools(['workstream', 'create', 'feature-x', '--raw'], tmpDir);
    assert.ok(result.success); // returns success with error field
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, false);
    assert.strictEqual(data.error, 'already_exists');
  });

  test('creates second workstream', () => {
    const result = runGsdTools(['workstream', 'create', 'feature-y', '--raw'], tmpDir);
    assert.ok(result.success);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, true);
    assert.strictEqual(data.workstream, 'feature-y');
  });
});

describe('workstream create with migration', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    // Existing flat-mode work
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), '## Roadmap v1.0: Existing\n### Phase 1: A\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n**Status:** In progress\n');
  });

  after(() => cleanup(tmpDir));

  test('migrates existing flat work to named workstream', () => {
    const result = runGsdTools(['workstream', 'create', 'new-feature', '--migrate-name', 'existing-work', '--raw'], tmpDir);
    assert.ok(result.success, `create with migration failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, true);
    assert.ok(data.migration, 'should include migration info');
    assert.strictEqual(data.migration.workstream, 'existing-work');
    // Old flat files moved to workstream dir
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'existing-work', 'ROADMAP.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'existing-work', 'STATE.md')));
    // Shared files stay
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'PROJECT.md')));
  });
});

describe('workstream list', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // Create two workstreams
    for (const ws of ['alpha', 'beta']) {
      const wsDir = path.join(tmpDir, '.planning', 'workstreams', ws);
      fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
      fs.writeFileSync(path.join(wsDir, 'STATE.md'), `# State\n**Status:** Working on ${ws}\n**Current Phase:** 1\n`);
    }
  });

  after(() => cleanup(tmpDir));

  test('lists all workstreams', () => {
    const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir);
    assert.ok(result.success, `list failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.mode, 'workstream');
    assert.strictEqual(data.count, 2);
    const names = data.workstreams.map(w => w.name).sort();
    assert.deepStrictEqual(names, ['alpha', 'beta']);
  });

  describe('flat mode', () => {
    let flatDir;

    beforeEach(() => {
      flatDir = createTempProject();
    });

    afterEach(() => {
      cleanup(flatDir);
    });

    test('reports flat mode when no workstreams exist', () => {
      const result = runGsdTools(['workstream', 'list', '--raw'], flatDir);
      assert.ok(result.success);
      const data = JSON.parse(result.output);
      assert.strictEqual(data.mode, 'flat');
    });
  });
});

describe('workstream status', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'alpha');
    fs.mkdirSync(path.join(wsDir, 'phases', '01-setup'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'phases', '01-setup', 'PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** In progress\n**Current Phase:** 1 — Setup\n');
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap\n');
  });

  after(() => cleanup(tmpDir));

  test('returns detailed status for workstream', () => {
    const result = runGsdTools(['workstream', 'status', 'alpha', '--raw'], tmpDir);
    assert.ok(result.success, `status failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.found, true);
    assert.strictEqual(data.workstream, 'alpha');
    assert.strictEqual(data.files.roadmap, true);
    assert.strictEqual(data.files.state, true);
    assert.strictEqual(data.phase_count, 1);
  });

  test('returns not found for missing workstream', () => {
    const result = runGsdTools(['workstream', 'status', 'nonexistent', '--raw'], tmpDir);
    assert.ok(result.success);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.found, false);
  });
});

describe('workstream complete', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'done-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'done-ws\n');
  });

  after(() => cleanup(tmpDir));

  test('archives workstream to milestones/', () => {
    const result = runGsdTools(['workstream', 'complete', 'done-ws', '--raw'], tmpDir);
    assert.ok(result.success, `complete failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.completed, true);
    assert.ok(data.archived_to.startsWith('.planning/milestones/ws-done-ws'));
    // Workstream dir should be gone
    assert.ok(!fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'done-ws')));
  });

  test('clears active-workstream when completing active one', () => {
    assert.ok(!fs.existsSync(path.join(tmpDir, '.planning', 'active-workstream')));
  });
});

describe('workstream set/get', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    for (const ws of ['ws-a', 'ws-b']) {
      const wsDir = path.join(tmpDir, '.planning', 'workstreams', ws);
      fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
      fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n');
    }
  });

  after(() => cleanup(tmpDir));

  test('sets active workstream', () => {
    const result = runGsdTools(['workstream', 'set', 'ws-a', '--raw'], tmpDir);
    assert.ok(result.success);
    assert.strictEqual(result.output, 'ws-a');
  });

  test('gets active workstream', () => {
    const result = runGsdTools(['workstream', 'get', '--raw'], tmpDir);
    assert.ok(result.success);
    assert.strictEqual(result.output, 'ws-a');
  });
});

// ─── workstream set edge cases ────────────────────────────────────────────────

describe('workstream set edge cases', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'real-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n');
  });

  after(() => cleanup(tmpDir));

  test('clears active workstream when name is empty', () => {
    // First set a workstream
    runGsdTools(['workstream', 'set', 'real-ws', '--raw'], tmpDir);
    // Then clear it by passing no name (empty string)
    const result = runGsdTools(['workstream', 'set', '', '--raw'], tmpDir);
    assert.ok(result.success, `set clear failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.active, null);
    assert.strictEqual(data.cleared, true);
  });

  test('returns not_found for non-existent workstream', () => {
    const result = runGsdTools(['workstream', 'set', 'does-not-exist', '--raw'], tmpDir);
    assert.ok(result.success, `set not-found failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.error, 'not_found');
    assert.strictEqual(data.workstream, 'does-not-exist');
  });
});

// ─── workstream progress flat mode ──────────────────────────────────────────

describe('workstream progress flat mode', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // No workstreams directory — flat mode
  });

  after(() => cleanup(tmpDir));

  test('returns flat mode when no workstreams dir exists', () => {
    const result = runGsdTools(['workstream', 'progress', '--raw'], tmpDir);
    assert.ok(result.success, `progress flat failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.mode, 'flat');
    assert.deepStrictEqual(data.workstreams, []);
  });
});

// ─── Collision Detection ────────────────────────────────────────────────────

describe('getOtherActiveWorkstreams via workstream complete', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // Create 3 workstreams: alpha (active), beta (active), gamma (completed)
    for (const ws of ['alpha', 'beta', 'gamma']) {
      const wsDir = path.join(tmpDir, '.planning', 'workstreams', ws);
      fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    }
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', 'alpha', 'STATE.md'),
      '# State\n**Status:** In progress\n**Current Phase:** 3\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', 'beta', 'STATE.md'),
      '# State\n**Status:** In progress\n**Current Phase:** 5\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', 'gamma', 'STATE.md'),
      '# State\n**Status:** Milestone complete\n');
  });

  after(() => cleanup(tmpDir));

  test('workstream list excludes completed workstreams from active count', () => {
    const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir);
    assert.ok(result.success);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 3); // all listed
    const activeWs = data.workstreams.filter(w =>
      !w.status.toLowerCase().includes('milestone complete'));
    assert.strictEqual(activeWs.length, 2); // alpha and beta active
  });
});

describe('workstream progress', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'feature');
    fs.mkdirSync(path.join(wsDir, 'phases', '01-init'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'phases', '01-init', 'PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(wsDir, 'phases', '01-init', 'SUMMARY.md'), '# Summary\n');
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** In progress\n**Current Phase:** 2\n');
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap\n### Phase 1: Init\n### Phase 2: Build\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'feature\n');
  });

  after(() => cleanup(tmpDir));

  test('returns progress summary', () => {
    const result = runGsdTools(['workstream', 'progress', '--raw'], tmpDir);
    assert.ok(result.success, `progress failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.mode, 'workstream');
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.workstreams[0].name, 'feature');
    assert.strictEqual(data.workstreams[0].active, true);
    assert.strictEqual(data.workstreams[0].progress_percent, 50);
  });
});

// ─── Integration: gsd-tools --ws flag ────────────────────────────────────────

describe('gsd-tools --ws flag integration', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // Create a workstream with roadmap
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'test-ws');
    fs.mkdirSync(path.join(wsDir, 'phases', '01-setup'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'),
      '## Roadmap v1.0: Test\n### Phase 1: Setup\nDo setup things.\n');
    fs.writeFileSync(path.join(wsDir, 'STATE.md'),
      '---\nmilestone: v1.0\n---\n# State\n**Status:** In progress\n**Current Phase:** 1 — Setup\n');
    fs.writeFileSync(path.join(wsDir, 'phases', '01-setup', 'PLAN.md'), '# Plan\n');
  });

  after(() => cleanup(tmpDir));

  test('find-phase resolves to workstream-scoped phases via --ws', () => {
    const result = runGsdTools(['find-phase', '1', '--raw', '--ws', 'test-ws'], tmpDir);
    assert.ok(result.success, `find-phase failed: ${result.error}`);
    assert.ok(result.output.includes('workstreams/test-ws'), `path should be workstream-scoped: ${result.output}`);
  });

  test('find-phase returns JSON with workstream path when not raw', () => {
    const result = runGsdTools(['find-phase', '1', '--ws', 'test-ws'], tmpDir);
    assert.ok(result.success, `find-phase failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.ok(data.found, 'phase should be found');
    assert.ok(data.directory.includes('workstreams/test-ws'), `path should be workstream-scoped: ${data.directory}`);
  });
});

// ─── Path Traversal Rejection ────────────────────────────────────────────────

describe('path traversal rejection', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'legit');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n');
  });

  after(() => cleanup(tmpDir));

  const maliciousNames = [
    '../../etc',
    '../foo',
    'ws/../../../passwd',
    'a/b',
    'ws name with spaces',
    '..',
    '.',
    'ws..traversal',
  ];

  describe('--ws flag rejects traversal attempts', () => {
    for (const name of maliciousNames) {
      test(`rejects --ws=${name}`, () => {
        const result = runGsdTools(['workstream', 'list', '--raw', '--ws', name], tmpDir);
        assert.ok(!result.success, `should reject --ws=${name}`);
        assert.ok(result.error.includes('Invalid workstream name'), `error should mention invalid name for: ${name}`);
      });
    }
  });

  describe('GSD_WORKSTREAM env var rejects traversal attempts', () => {
    for (const name of maliciousNames) {
      test(`rejects GSD_WORKSTREAM=${name}`, () => {
        const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir, { GSD_WORKSTREAM: name });
        assert.ok(!result.success, `should reject GSD_WORKSTREAM=${name}`);
        assert.ok(result.error.includes('Invalid workstream name'), `error should mention invalid name for: ${name}`);
      });
    }
  });

  describe('cmdWorkstreamSet rejects traversal attempts', () => {
    for (const name of maliciousNames) {
      test(`rejects set ${name}`, () => {
        const result = runGsdTools(['workstream', 'set', name, '--raw'], tmpDir);
        // cmdWorkstreamSet validates the positional arg and returns invalid_name error
        assert.ok(result.success, `command should exit cleanly for: ${name}`);
        const data = JSON.parse(result.output);
        assert.strictEqual(data.error, 'invalid_name', `should return invalid_name error for: ${name}`);
        assert.strictEqual(data.active, null, `active should be null for: ${name}`);
      });
    }
  });

  describe('getActiveWorkstream rejects poisoned active-workstream file', () => {
    for (const name of maliciousNames) {
      test(`rejects poisoned file containing ${name}`, () => {
        // Write malicious name directly to the active-workstream file
        fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), name + '\n');
        const result = runGsdTools(['workstream', 'get'], tmpDir, { GSD_WORKSTREAM: '' });
        assert.ok(result.success, 'get should succeed');
        const data = JSON.parse(result.output);
        // getActiveWorkstream should return null for invalid names
        assert.strictEqual(data.active, null, `should return null for poisoned name: ${name}`);
      });
    }

    // Cleanup: remove poisoned file
    test('cleanup: remove active-workstream file', () => {
      try { fs.unlinkSync(path.join(tmpDir, '.planning', 'active-workstream')); } catch {}
    });
  });

  describe('setActiveWorkstream rejects invalid names directly', () => {
    const { setActiveWorkstream } = require('../get-shit-done/bin/lib/core.cjs');
    for (const name of maliciousNames) {
      test(`throws for ${name}`, () => {
        assert.throws(
          () => setActiveWorkstream(tmpDir, name),
          { message: /Invalid workstream name/ },
          `should throw for: ${name}`
        );
      });
    }
  });
});

// ─── migrateToWorkstreams direct coverage ────────────────────────────────────

describe('migrateToWorkstreams validation', () => {
  const { migrateToWorkstreams } = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n');
  });

  after(() => cleanup(tmpDir));

  test('rejects empty workstream name', () => {
    assert.throws(() => migrateToWorkstreams(tmpDir, ''), /Invalid workstream name/);
  });

  test('rejects workstream name with forward slash', () => {
    assert.throws(() => migrateToWorkstreams(tmpDir, 'a/b'), /Invalid workstream name/);
  });

  test('rejects workstream name with backslash', () => {
    assert.throws(() => migrateToWorkstreams(tmpDir, 'a\\b'), /Invalid workstream name/);
  });

  test('rejects dot as workstream name', () => {
    assert.throws(() => migrateToWorkstreams(tmpDir, '.'), /Invalid workstream name/);
  });

  test('rejects double-dot as workstream name', () => {
    assert.throws(() => migrateToWorkstreams(tmpDir, '..'), /Invalid workstream name/);
  });

  test('throws when already in workstream mode', () => {
    const wsRoot = path.join(tmpDir, '.planning', 'workstreams');
    fs.mkdirSync(wsRoot, { recursive: true });
    try {
      assert.throws(() => migrateToWorkstreams(tmpDir, 'new-ws'), /Already in workstream mode/);
    } finally {
      fs.rmdirSync(wsRoot);
    }
  });

  test('migrates flat layout to named workstream', () => {
    const result = migrateToWorkstreams(tmpDir, 'main-work');
    assert.equal(result.migrated, true);
    assert.equal(result.workstream, 'main-work');
    assert.ok(result.files_moved.includes('ROADMAP.md'), 'should move ROADMAP.md');
    assert.ok(result.files_moved.includes('STATE.md'), 'should move STATE.md');
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'main-work');
    assert.ok(fs.existsSync(path.join(wsDir, 'ROADMAP.md')));
    assert.ok(fs.existsSync(path.join(wsDir, 'STATE.md')));
  });
});

// ─── migrateToWorkstreams rollback on rename failure ─────────────────────────

describe('migrateToWorkstreams rollback on rename failure', () => {
  const { migrateToWorkstreams } = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n');
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '01-setup'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.planning', 'phases', '01-setup', 'PLAN.md'), '# Plan\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('rolls back moved files on rename failure (lines 55-61)', () => {
    const origRename = fs.renameSync;
    let forwardCallCount = 0;
    fs.renameSync = function (src, dest) {
      // Only count forward migration renames (baseDir → wsDir)
      const isForwardMigration = src.includes('.planning' + path.sep) &&
        dest.includes('workstreams' + path.sep + 'rollback-ws');
      if (isForwardMigration) {
        forwardCallCount++;
        // Let first two forward renames succeed, fail on third (phases/)
        if (forwardCallCount >= 3) {
          throw new Error('EXDEV: cross-device link not permitted');
        }
      }
      return origRename(src, dest);
    };

    try {
      assert.throws(
        () => migrateToWorkstreams(tmpDir, 'rollback-ws'),
        /EXDEV/
      );
      assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'ROADMAP.md')),
        'ROADMAP.md should be restored after rollback');
      assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'STATE.md')),
        'STATE.md should be restored after rollback');
      assert.ok(!fs.existsSync(path.join(tmpDir, '.planning', 'workstreams')),
        'workstreams/ dir should be removed after rollback');
    } finally {
      fs.renameSync = origRename;
    }
  });
});

// ─── getOtherActiveWorkstreams direct coverage ───────────────────────────────

describe('getOtherActiveWorkstreams edge cases', () => {
  const { getOtherActiveWorkstreams } = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  test('returns empty array when workstreams directory does not exist', () => {
    const result = getOtherActiveWorkstreams(tmpDir, 'any');
    assert.deepEqual(result, []);
  });

  test('returns empty array when workstreams directory is empty', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'workstreams'), { recursive: true });
    const result = getOtherActiveWorkstreams(tmpDir, 'any');
    assert.deepEqual(result, []);
  });

  test('excludes the named workstream from results', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'alpha');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** executing\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'alpha');
    assert.deepEqual(result, []);
  });

  test('returns other active workstreams excluding the specified one', () => {
    for (const ws of ['alpha', 'beta']) {
      const wsDir = path.join(tmpDir, '.planning', 'workstreams', ws);
      fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
      fs.writeFileSync(path.join(wsDir, 'STATE.md'), `# State\n**Status:** executing\n**Current Phase:** 1\n`);
    }
    const result = getOtherActiveWorkstreams(tmpDir, 'alpha');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'beta');
    assert.equal(result[0].status, 'executing');
  });

  test('excludes workstreams with "Milestone Complete" status', () => {
    const ws1Dir = path.join(tmpDir, '.planning', 'workstreams', 'done');
    const ws2Dir = path.join(tmpDir, '.planning', 'workstreams', 'active');
    fs.mkdirSync(path.join(ws1Dir, 'phases'), { recursive: true });
    fs.mkdirSync(path.join(ws2Dir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(ws1Dir, 'STATE.md'), '# State\n**Status:** Milestone Complete\n');
    fs.writeFileSync(path.join(ws2Dir, 'STATE.md'), '# State\n**Status:** executing\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'active');
  });

  test('excludes workstreams with "archived" status', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'old-work');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** archived\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.deepEqual(result, []);
  });

  test('includes workstreams with unknown status (no STATE.md)', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'mystery');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'mystery');
    assert.equal(result[0].status, 'unknown');
  });

  test('includes workstreams with unrecognized status', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'in-limbo');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** planning\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'in-limbo');
    assert.equal(result[0].status, 'planning');
  });

  test('counts completed phases within active workstream', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'tracker');
    const phase1Dir = path.join(wsDir, 'phases', '01-setup');
    const phase2Dir = path.join(wsDir, 'phases', '02-build');
    fs.mkdirSync(phase1Dir, { recursive: true });
    fs.mkdirSync(phase2Dir, { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** executing\n**Current Phase:** 2\n');
    fs.writeFileSync(path.join(phase1Dir, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(phase1Dir, '01-01-SUMMARY.md'), '# Summary\n');
    fs.writeFileSync(path.join(phase2Dir, '02-01-PLAN.md'), '# Plan\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.equal(result.length, 1);
    assert.equal(result[0].phases, '1/2', 'should show 1 of 2 phases complete');
  });

  test('non-directory entries in workstreams/ are ignored', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'workstreams'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', 'README.md'), '# Workstreams\n');
    const result = getOtherActiveWorkstreams(tmpDir, 'other');
    assert.deepEqual(result, []);
  });
});

// ─── cmdWorkstreamComplete error coverage ────────────────────────────────────

describe('cmdWorkstreamComplete not_found path', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'workstreams'), { recursive: true });
  });

  after(() => cleanup(tmpDir));

  test('returns not_found for non-existent workstream', () => {
    const result = runGsdTools(['workstream', 'complete', 'does-not-exist', '--raw'], tmpDir);
    assert.ok(result.success);
    const data = JSON.parse(result.output);
    assert.equal(data.completed, false);
    assert.equal(data.error, 'not_found');
  });
});

describe('cmdWorkstreamComplete archive suffix collision', () => {
  let tmpDir;
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  test('uses suffix when archive path already exists', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'target');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');
    const milestonesDir = path.join(tmpDir, '.planning', 'milestones');
    fs.mkdirSync(milestonesDir, { recursive: true });
    fs.mkdirSync(path.join(milestonesDir, `ws-target-${today}`), { recursive: true });
    const result = runGsdTools(['workstream', 'complete', 'target', '--raw'], tmpDir);
    assert.ok(result.success, `complete failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.equal(data.completed, true);
    assert.ok(data.archived_to.includes(`ws-target-${today}-1`),
      `should use suffix-1 path, got: ${data.archived_to}`);
  });

  test('increments suffix when multiple collisions exist', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'multi');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');
    const milestonesDir = path.join(tmpDir, '.planning', 'milestones');
    fs.mkdirSync(path.join(milestonesDir, `ws-multi-${today}`), { recursive: true });
    fs.mkdirSync(path.join(milestonesDir, `ws-multi-${today}-1`), { recursive: true });
    const result = runGsdTools(['workstream', 'complete', 'multi', '--raw'], tmpDir);
    assert.ok(result.success, `complete with double collision failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.equal(data.completed, true);
    assert.ok(data.archived_to.includes(`ws-multi-${today}-2`),
      `should use suffix-2 path, got: ${data.archived_to}`);
  });
});

describe('cmdWorkstreamComplete archive failure rollback', () => {
  const { cmdWorkstreamComplete } = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  test('returns archive_failed when rename fails', () => {
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'fail-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');

    const origRename = fs.renameSync;
    fs.renameSync = (src, dest) => {
      if (src.includes('STATE.md') || src.includes('phases')) {
        const err = new Error('EACCES: permission denied');
        err.code = 'EACCES';
        throw err;
      }
      return origRename(src, dest);
    };

    try {
      cmdWorkstreamComplete(tmpDir, 'fail-ws', {}, true);
    } catch {
      // cmdWorkstreamComplete catches internally
    } finally {
      fs.renameSync = origRename;
    }

    assert.ok(fs.existsSync(wsDir), 'workstream dir should still exist after failed archive');
  });
});

// ─── cmdWorkstreamCreate branch coverage ──────────────────────────────────

describe('cmdWorkstreamCreate auto-migration without migrateName', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n**Status:** In progress\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('auto-migrates existing work using getMilestoneInfo fallback name', () => {
    const result = runGsdTools(['workstream', 'create', 'new-feature', '--raw'], tmpDir);
    assert.ok(result.success, `create failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, true);
    assert.ok(data.migration, 'should include migration info');
    // getMilestoneInfo returns { name: 'milestone' } when no ROADMAP.md exists
    assert.strictEqual(data.migration.workstream, 'milestone');
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'milestone', 'STATE.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'new-feature', 'STATE.md')));
  });
});

describe('cmdWorkstreamCreate flat mode no existing work', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    fs.rmdirSync(path.join(tmpDir, '.planning', 'phases'));
  });

  afterEach(() => cleanup(tmpDir));

  test('creates wsRoot without migration when no existing work', () => {
    const result = runGsdTools(['workstream', 'create', 'fresh-start', '--raw'], tmpDir);
    assert.ok(result.success, `create failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.created, true);
    assert.strictEqual(data.migration, null);
    assert.ok(fs.existsSync(path.join(tmpDir, '.planning', 'workstreams', 'fresh-start', 'STATE.md')));
  });
});

// ─── cmdWorkstreamList phase counting ───────────────────────────────────────

describe('cmdWorkstreamList with phase plan/summary counting', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'counted');
    const phase1 = path.join(wsDir, 'phases', '01-setup');
    const phase2 = path.join(wsDir, 'phases', '02-build');
    fs.mkdirSync(phase1, { recursive: true });
    fs.mkdirSync(phase2, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary\n');
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** executing\n**Current Phase:** 2\n');
  });

  after(() => cleanup(tmpDir));

  test('counts completed phases correctly in list output', () => {
    const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir);
    assert.ok(result.success, `list failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.mode, 'workstream');
    assert.strictEqual(data.count, 1);
    const ws = data.workstreams[0];
    assert.strictEqual(ws.name, 'counted');
    assert.strictEqual(ws.phase_count, 2);
    assert.strictEqual(ws.completed_phases, 1);
  });
});

// ─── cmdWorkstreamCreate validation branches ─────────────────────────────────

describe('cmdWorkstreamCreate validation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('errors when no name provided', () => {
    // Line 70-72: !name branch
    const result = runGsdTools(['workstream', 'create', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail without name');
  });

  test('errors when name produces empty slug', () => {
    // Line 75-77: !slug branch — name with only special chars
    const result = runGsdTools(['workstream', 'create', '!!!', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail with invalid name');
  });
});

describe('cmdWorkstreamCreate without .planning directory', () => {
  const { createTempDir } = require('./helpers.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    // No .planning/ directory — triggers line 80-82
  });

  afterEach(() => cleanup(tmpDir));

  test('errors when .planning/ does not exist', () => {
    const result = runGsdTools(['workstream', 'create', 'test-ws', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail without .planning/');
  });
});

// ─── cmdWorkstreamStatus validation branches ─────────────────────────────────

describe('cmdWorkstreamStatus validation', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
  });

  after(() => cleanup(tmpDir));

  test('errors when no name provided', () => {
    // Line 223: !name branch
    const result = runGsdTools(['workstream', 'status', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail without name');
  });

  test('errors with traversal name', () => {
    // Line 224: invalid name branch
    const result = runGsdTools(['workstream', 'status', '../evil', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail with traversal name');
  });
});

// ─── cmdWorkstreamComplete validation branches ───────────────────────────────

describe('cmdWorkstreamComplete validation', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
  });

  after(() => cleanup(tmpDir));

  test('errors when no name provided', () => {
    // Line 280: !name branch
    const result = runGsdTools(['workstream', 'complete', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail without name');
  });

  test('errors with traversal name', () => {
    // Line 281: invalid name branch
    const result = runGsdTools(['workstream', 'complete', '../evil', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail with traversal name');
  });
});

// ─── cmdWorkstreamList non-directory entry branch ────────────────────────────

describe('cmdWorkstreamList ignores non-directory entries', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'workstreams'), { recursive: true });
    // Put a file (not directory) in the workstreams dir — line 183 branch
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', 'README.md'), '# Info\n');
    // Also a real workstream so the loop runs
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'real');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** active\n');
  });

  after(() => cleanup(tmpDir));

  test('skips file entries and lists only directory entries', () => {
    const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir);
    assert.ok(result.success, `list failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.workstreams[0].name, 'real');
  });
});

// ─── cmdWorkstreamList workstream without STATE.md ───────────────────────────

describe('cmdWorkstreamList workstream without STATE.md', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'no-state');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    // No STATE.md — triggers catch on lines 203-205
  });

  after(() => cleanup(tmpDir));

  test('shows unknown status for workstream without STATE.md', () => {
    const result = runGsdTools(['workstream', 'list', '--raw'], tmpDir);
    assert.ok(result.success, `list failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.workstreams[0].status, 'unknown');
    assert.strictEqual(data.workstreams[0].current_phase, null);
  });
});

// ─── cmdWorkstreamStatus with phase detail edge cases ────────────────────────

describe('cmdWorkstreamStatus phase detail edge cases', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'detailed');
    const phase1 = path.join(wsDir, 'phases', '01-setup');
    const phase2 = path.join(wsDir, 'phases', '02-build');
    const phase3 = path.join(wsDir, 'phases', '03-test');
    fs.mkdirSync(phase1, { recursive: true });
    fs.mkdirSync(phase2, { recursive: true });
    fs.mkdirSync(phase3, { recursive: true });
    // Phase 1: complete (plan + summary)
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary\n');
    // Phase 2: in progress (plan only)
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan\n');
    // Phase 3: pending (no plan, no summary)
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap\n');
    // No STATE.md — triggers catch on line 265
  });

  after(() => cleanup(tmpDir));

  test('returns phase details with correct status per phase', () => {
    const result = runGsdTools(['workstream', 'status', 'detailed', '--raw'], tmpDir);
    assert.ok(result.success, `status failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.found, true);
    assert.strictEqual(data.phase_count, 3);
    assert.strictEqual(data.completed_phases, 1);
    // Phase statuses
    const phase1 = data.phases.find(p => p.directory === '01-setup');
    const phase2 = data.phases.find(p => p.directory === '02-build');
    const phase3 = data.phases.find(p => p.directory === '03-test');
    assert.strictEqual(phase1.status, 'complete');
    assert.strictEqual(phase2.status, 'in_progress');
    assert.strictEqual(phase3.status, 'pending');
    // No STATE.md → stateInfo defaults
    assert.strictEqual(data.status, undefined);
  });
});

// ─── cmdWorkstreamComplete last workstream cleanup ───────────────────────────

describe('cmdWorkstreamComplete reverts to flat when last workstream completed', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'only-one');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('removes workstreams/ dir when no workstreams remain', () => {
    const result = runGsdTools(['workstream', 'complete', 'only-one', '--raw'], tmpDir);
    assert.ok(result.success, `complete failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.completed, true);
    assert.strictEqual(data.reverted_to_flat, true);
    assert.strictEqual(data.remaining_workstreams, 0);
    // workstreams/ dir should be gone — line 327
    assert.ok(!fs.existsSync(path.join(tmpDir, '.planning', 'workstreams')));
  });
});

// ─── cmdWorkstreamProgress non-directory entries ─────────────────────────────

describe('cmdWorkstreamProgress skips non-directory entries', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    fs.mkdirSync(path.join(tmpDir, '.planning', 'workstreams'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.planning', 'workstreams', '.gitkeep'), '');
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'active-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** executing\n**Current Phase:** 1\n');
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap\n### Phase 1: Setup\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'active-workstream'), 'active-ws\n');
  });

  after(() => cleanup(tmpDir));

  test('ignores files and reports only directories', () => {
    const result = runGsdTools(['workstream', 'progress', '--raw'], tmpDir);
    assert.ok(result.success, `progress failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.workstreams[0].name, 'active-ws');
  });
});

// ─── cmdWorkstreamProgress workstream without ROADMAP.md ─────────────────────

describe('cmdWorkstreamProgress without ROADMAP.md', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'no-roadmap');
    fs.mkdirSync(path.join(wsDir, 'phases', '01-setup'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'phases', '01-setup', '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(wsDir, 'phases', '01-setup', '01-01-SUMMARY.md'), '# Summary\n');
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** executing\n**Current Phase:** 1\n');
    // No ROADMAP.md — triggers catch on lines 407
  });

  after(() => cleanup(tmpDir));

  test('falls back to phase dir count when no ROADMAP.md', () => {
    const result = runGsdTools(['workstream', 'progress', '--raw'], tmpDir);
    assert.ok(result.success, `progress failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1);
    const ws = data.workstreams[0];
    assert.strictEqual(ws.phases, '1/1');
    assert.strictEqual(ws.progress_percent, 100);
  });
});

// ─── cmdWorkstreamProgress workstream without STATE.md ───────────────────────

describe('cmdWorkstreamProgress without STATE.md', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'no-state-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'ROADMAP.md'), '## Roadmap\n### Phase 1: Setup\n');
    // No STATE.md — triggers catch on lines 412-414
  });

  after(() => cleanup(tmpDir));

  test('shows unknown status when no STATE.md', () => {
    const result = runGsdTools(['workstream', 'progress', '--raw'], tmpDir);
    assert.ok(result.success, `progress failed: ${result.error}`);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.workstreams[0].status, 'unknown');
    assert.strictEqual(data.workstreams[0].current_phase, null);
  });
});

// ─── cmdWorkstreamGet mode detection ─────────────────────────────────────────

// ─── cmdWorkstreamCreate migration_failed branch (lines 116-118) ────────────

describe('cmdWorkstreamCreate migration failure via fs stub', () => {
  const workstreamMod = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    // Existing flat-mode work that triggers migration
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('returns migration_failed when migrateToWorkstreams throws during create', () => {
    // Stub renameSync to always fail — this makes migrateToWorkstreams throw
    // which triggers the catch on lines 116-118 inside cmdWorkstreamCreate
    const origRename = fs.renameSync;
    fs.renameSync = () => { throw new Error('EPERM: operation not permitted'); };

    // output() uses fs.writeSync(1, data) — capture fd 1 writes
    let capturedOutput = null;
    const origWriteSync = fs.writeSync;
    fs.writeSync = function (fd, data) {
      if (fd === 1) { capturedOutput = data; return data.length; }
      return origWriteSync.apply(fs, arguments);
    };

    try {
      workstreamMod.cmdWorkstreamCreate(tmpDir, 'new-ws', { migrateName: 'existing' }, false);
      assert.ok(capturedOutput, 'should have captured output');
      const data = JSON.parse(capturedOutput);
      assert.strictEqual(data.created, false);
      assert.strictEqual(data.error, 'migration_failed');
      assert.ok(data.message.includes('EPERM'));
    } finally {
      fs.renameSync = origRename;
      fs.writeSync = origWriteSync;
    }
  });
});

// ─── cmdWorkstreamComplete archive rollback inner catch (lines 314-315) ─────

describe('cmdWorkstreamComplete rollback with inner catch', () => {
  const workstreamMod = require('../get-shit-done/bin/lib/workstream.cjs');
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    const wsDir = path.join(tmpDir, '.planning', 'workstreams', 'rollback-ws');
    fs.mkdirSync(path.join(wsDir, 'phases'), { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'STATE.md'), '# State\n**Status:** Complete\n');
    fs.writeFileSync(path.join(wsDir, 'extra.md'), '# Extra file\n');
  });

  afterEach(() => cleanup(tmpDir));

  test('handles rollback renameSync failure gracefully (lines 314-315)', () => {
    const origRename = fs.renameSync;
    let forwardCount = 0;

    // Stub renameSync: allow first archive move, fail on second with EACCES
    fs.renameSync = function (src, dest) {
      if (src.includes('workstreams') && dest.includes('milestones')) {
        forwardCount++;
        if (forwardCount >= 2) {
          const err = new Error('EACCES: permission denied');
          err.code = 'EACCES';
          throw err;
        }
        return origRename(src, dest);
      }
      // Rollback direction: make the inner rollback also fail
      if (src.includes('milestones') && dest.includes('workstreams')) {
        throw new Error('EPERM: rollback failed');
      }
      return origRename(src, dest);
    };

    // output() uses fs.writeSync(1, data) — capture fd 1 writes
    let capturedOutput = null;
    const origWriteSync = fs.writeSync;
    fs.writeSync = function (fd, data) {
      if (fd === 1) { capturedOutput = data; return data.length; }
      return origWriteSync.apply(fs, arguments);
    };

    try {
      workstreamMod.cmdWorkstreamComplete(tmpDir, 'rollback-ws', {}, false);
      assert.ok(capturedOutput, 'should have captured output');
      const data = JSON.parse(capturedOutput);
      assert.strictEqual(data.completed, false);
      assert.strictEqual(data.error, 'archive_failed');
    } finally {
      fs.renameSync = origRename;
      fs.writeSync = origWriteSync;
    }
  });
});

// ─── cmdWorkstreamGet mode detection ─────────────────────────────────────────

describe('cmdWorkstreamGet reports flat mode', () => {
  let tmpDir;

  before(() => {
    tmpDir = createTempProject();
    // No workstreams/ dir — line 366 flat mode branch
  });

  after(() => cleanup(tmpDir));

  test('reports flat mode when no workstreams dir exists', () => {
    // --raw returns plain string (active workstream name or "none")
    const rawResult = runGsdTools(['workstream', 'get', '--raw'], tmpDir);
    assert.ok(rawResult.success, `get --raw failed: ${rawResult.error}`);
    assert.strictEqual(rawResult.output, 'none');

    // Without --raw returns JSON with mode
    const jsonResult = runGsdTools(['workstream', 'get'], tmpDir);
    assert.ok(jsonResult.success, `get failed: ${jsonResult.error}`);
    const data = JSON.parse(jsonResult.output);
    assert.strictEqual(data.mode, 'flat');
    assert.strictEqual(data.active, null);
  });
});
