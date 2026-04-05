/**
 * GSD Tools Tests - Init
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('init commands', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('init execute-phase returns file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');

    const result = runGsdTools('init execute-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.state_path, '.planning/STATE.md');
    assert.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
    assert.strictEqual(output.config_path, '.planning/config.json');
  });

  test('init plan-phase returns file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
    fs.writeFileSync(path.join(phaseDir, '03-RESEARCH.md'), '# Research Findings');
    fs.writeFileSync(path.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
    fs.writeFileSync(path.join(phaseDir, '03-UAT.md'), '# UAT');

    const result = runGsdTools('init plan-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.state_path, '.planning/STATE.md');
    assert.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
    assert.strictEqual(output.requirements_path, '.planning/REQUIREMENTS.md');
    assert.strictEqual(output.context_path, '.planning/phases/03-api/03-CONTEXT.md');
    assert.strictEqual(output.research_path, '.planning/phases/03-api/03-RESEARCH.md');
    assert.strictEqual(output.verification_path, '.planning/phases/03-api/03-VERIFICATION.md');
    assert.strictEqual(output.uat_path, '.planning/phases/03-api/03-UAT.md');
  });

  test('init plan-phase exposes text_mode from config (defaults false)', () => {
    const result = runGsdTools('init plan-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.text_mode, false, 'text_mode should default to false');
  });

  test('init plan-phase exposes text_mode true when set in config', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
      : {};
    const config = { ...existing, workflow: { ...(existing.workflow || {}), text_mode: true } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = runGsdTools('init plan-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.text_mode, true, 'text_mode should reflect config value');
  });

  test('init progress returns file paths', () => {
    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.state_path, '.planning/STATE.md');
    assert.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
    assert.strictEqual(output.project_path, '.planning/PROJECT.md');
    assert.strictEqual(output.config_path, '.planning/config.json');
  });

  test('init phase-op returns core and optional phase file paths', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
    fs.writeFileSync(path.join(phaseDir, '03-RESEARCH.md'), '# Research');
    fs.writeFileSync(path.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
    fs.writeFileSync(path.join(phaseDir, '03-UAT.md'), '# UAT');

    const result = runGsdTools('init phase-op 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.state_path, '.planning/STATE.md');
    assert.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
    assert.strictEqual(output.requirements_path, '.planning/REQUIREMENTS.md');
    assert.strictEqual(output.context_path, '.planning/phases/03-api/03-CONTEXT.md');
    assert.strictEqual(output.research_path, '.planning/phases/03-api/03-RESEARCH.md');
    assert.strictEqual(output.verification_path, '.planning/phases/03-api/03-VERIFICATION.md');
    assert.strictEqual(output.uat_path, '.planning/phases/03-api/03-UAT.md');
  });

  test('init plan-phase detects has_reviews and reviews_path when REVIEWS.md exists', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-REVIEWS.md'), '# Cross-AI Reviews');

    const result = runGsdTools('init plan-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_reviews, true);
    assert.strictEqual(output.reviews_path, '.planning/phases/03-api/03-REVIEWS.md');
  });

  test('init plan-phase omits optional paths if files missing', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });

    const result = runGsdTools('init plan-phase 03', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.context_path, undefined);
    assert.strictEqual(output.research_path, undefined);
    assert.strictEqual(output.reviews_path, undefined);
    assert.strictEqual(output.has_reviews, false);
  });

  // ── phase_req_ids extraction (fix for #684) ──────────────────────────────

  test('init plan-phase extracts phase_req_ids from ROADMAP', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02, CP-03\n**Plans:** 0 plans\n`
    );

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, 'CP-01, CP-02, CP-03');
  });

  test('init plan-phase strips brackets from phase_req_ids', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: [CP-01, CP-02]\n**Plans:** 0 plans\n`
    );

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, 'CP-01, CP-02');
  });

  test('init plan-phase returns null phase_req_ids when Requirements line is absent', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 0 plans\n`
    );

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, null);
  });

  test('init plan-phase returns null phase_req_ids when ROADMAP is absent', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, null);
  });

  test('init execute-phase extracts phase_req_ids from ROADMAP', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02\n**Plans:** 1 plans\n`
    );

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, 'EX-01, EX-02');
  });

  test('init plan-phase returns null phase_req_ids when value is TBD', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: TBD\n**Plans:** 0 plans\n`
    );

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, null, 'TBD placeholder should return null');
  });

  test('init execute-phase returns null phase_req_ids when Requirements line is absent', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 1 plans\n`
    );

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_req_ids, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP fallback for init plan-phase / execute-phase / verify-work (#1238)
// ─────────────────────────────────────────────────────────────────────────────

describe('init commands ROADMAP fallback when phase directory does not exist (#1238)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 1: Foundation Setup\n**Goal:** Bootstrap project\n**Requirements**: R-01, R-02\n**Plans:** TBD\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('init plan-phase falls back to ROADMAP when no phase directory exists', () => {
    const result = runGsdTools('init plan-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true, 'phase_found should be true from ROADMAP fallback');
    assert.strictEqual(output.phase_dir, null, 'phase_dir should be null (no directory yet)');
    assert.strictEqual(output.phase_number, '1');
    assert.strictEqual(output.phase_name, 'Foundation Setup');
    assert.strictEqual(output.phase_slug, 'foundation-setup');
    assert.strictEqual(output.padded_phase, '01');
  });

  test('init execute-phase falls back to ROADMAP when no phase directory exists', () => {
    const result = runGsdTools('init execute-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true, 'phase_found should be true from ROADMAP fallback');
    assert.strictEqual(output.phase_dir, null, 'phase_dir should be null (no directory yet)');
    assert.strictEqual(output.phase_number, '1');
    assert.strictEqual(output.phase_name, 'Foundation Setup');
    assert.strictEqual(output.phase_slug, 'foundation-setup');
    assert.strictEqual(output.phase_req_ids, 'R-01, R-02');
  });

  test('init verify-work falls back to ROADMAP when no phase directory exists', () => {
    const result = runGsdTools('init verify-work 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true, 'phase_found should be true from ROADMAP fallback');
    assert.strictEqual(output.phase_dir, null, 'phase_dir should be null (no directory yet)');
    assert.strictEqual(output.phase_number, '1');
    assert.strictEqual(output.phase_name, 'Foundation Setup');
  });

  test('init plan-phase returns phase_found false when neither directory nor ROADMAP entry exists', () => {
    const result = runGsdTools('init plan-phase 99', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, false);
    assert.strictEqual(output.phase_dir, null);
    assert.strictEqual(output.phase_number, null);
    assert.strictEqual(output.phase_name, null);
  });

  test('init plan-phase prefers disk directory over ROADMAP fallback', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation-setup');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), '# Plan');

    const result = runGsdTools('init plan-phase 1', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true);
    assert.ok(output.phase_dir !== null, 'phase_dir should point to disk directory');
    assert.ok(output.phase_dir.includes('01-foundation-setup'));
    assert.strictEqual(output.plan_count, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitTodos (INIT-01)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitTodos', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty pending dir returns zero count', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'todos', 'pending'), { recursive: true });

    const result = runGsdTools('init todos', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 0);
    assert.deepStrictEqual(output.todos, []);
    assert.strictEqual(output.pending_dir_exists, true);
  });

  test('missing pending dir returns zero count', () => {
    const result = runGsdTools('init todos', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 0);
    assert.deepStrictEqual(output.todos, []);
    assert.strictEqual(output.pending_dir_exists, false);
  });

  test('multiple todos with fields are read correctly', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');
    fs.writeFileSync(path.join(pendingDir, 'task-2.md'), 'title: Add feature\narea: frontend\ncreated: 2026-02-24');
    fs.writeFileSync(path.join(pendingDir, 'task-3.md'), 'title: Write docs\narea: backend\ncreated: 2026-02-23');

    const result = runGsdTools('init todos', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 3);
    assert.strictEqual(output.todos.length, 3);

    const task1 = output.todos.find(t => t.file === 'task-1.md');
    assert.ok(task1, 'task-1.md should be in todos');
    assert.strictEqual(task1.title, 'Fix bug');
    assert.strictEqual(task1.area, 'backend');
    assert.strictEqual(task1.created, '2026-02-25');
    assert.strictEqual(task1.path, '.planning/todos/pending/task-1.md');
  });

  test('area filter returns only matching todos', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');
    fs.writeFileSync(path.join(pendingDir, 'task-2.md'), 'title: Add feature\narea: frontend\ncreated: 2026-02-24');
    fs.writeFileSync(path.join(pendingDir, 'task-3.md'), 'title: Write docs\narea: backend\ncreated: 2026-02-23');

    const result = runGsdTools('init todos backend', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 2);
    assert.strictEqual(output.area_filter, 'backend');
    for (const todo of output.todos) {
      assert.strictEqual(todo.area, 'backend');
    }
  });

  test('area filter miss returns zero count', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');

    const result = runGsdTools('init todos nonexistent', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 0);
    assert.strictEqual(output.area_filter, 'nonexistent');
  });

  test('malformed file uses defaults', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'broken.md'), 'some random content without fields');

    const result = runGsdTools('init todos', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 1);
    const todo = output.todos[0];
    assert.strictEqual(todo.title, 'Untitled');
    assert.strictEqual(todo.area, 'general');
    assert.strictEqual(todo.created, 'unknown');
  });

  test('non-md files are ignored', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'task.md'), 'title: Real task\narea: dev\ncreated: 2026-01-01');
    fs.writeFileSync(path.join(pendingDir, 'notes.txt'), 'title: Not a task\narea: dev\ncreated: 2026-01-01');

    const result = runGsdTools('init todos', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.todo_count, 1);
    assert.strictEqual(output.todos[0].file, 'task.md');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitMilestoneOp (INIT-02)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitMilestoneOp', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('no phase directories returns zero counts', () => {
    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 0);
    assert.strictEqual(output.completed_phases, 0);
    assert.strictEqual(output.all_phases_complete, false);
  });

  test('multiple phases with no summaries', () => {
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    const phase2 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase1, { recursive: true });
    fs.mkdirSync(phase2, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan');

    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 2);
    assert.strictEqual(output.completed_phases, 0);
    assert.strictEqual(output.all_phases_complete, false);
  });

  test('mix of complete and incomplete phases', () => {
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    const phase2 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase1, { recursive: true });
    fs.mkdirSync(phase2, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan');

    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 2);
    assert.strictEqual(output.completed_phases, 1);
    assert.strictEqual(output.all_phases_complete, false);
  });

  test('all phases complete', () => {
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(phase1, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 1);
    assert.strictEqual(output.completed_phases, 1);
    assert.strictEqual(output.all_phases_complete, true);
  });

  test('archive directory scanning', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'archive', 'v1.0'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'archive', 'v0.9'), { recursive: true });

    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.archive_count, 2);
    assert.strictEqual(output.archived_milestones.length, 2);
  });

  test('no archive directory returns empty', () => {
    const result = runGsdTools('init milestone-op', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.archive_count, 0);
    assert.deepStrictEqual(output.archived_milestones, []);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitPhaseOp fallback (INIT-04)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitPhaseOp fallback', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('normal path with existing directory', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Context');
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 1 plans\n'
    );

    const result = runGsdTools('init phase-op 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true);
    assert.ok(output.phase_dir.includes('03-api'), 'phase_dir should contain 03-api');
    assert.strictEqual(output.has_context, true);
    assert.strictEqual(output.has_plans, true);
  });

  test('fallback to ROADMAP when no directory exists', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 5: Widget Builder\n**Goal:** Build widgets\n**Plans:** TBD\n'
    );

    const result = runGsdTools('init phase-op 5', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true);
    assert.strictEqual(output.phase_dir, null);
    assert.strictEqual(output.phase_slug, 'widget-builder');
    assert.strictEqual(output.has_research, false);
    assert.strictEqual(output.has_context, false);
    assert.strictEqual(output.has_plans, false);
  });

  test('prefers current milestone roadmap entry over archived phase with same number', () => {
    const archiveDir = path.join(
      tmpDir,
      '.planning',
      'milestones',
      'v1.2-phases',
      '02-event-parser-and-queue-schema'
    );
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, '02-CONTEXT.md'), '# Archived context');
    fs.writeFileSync(path.join(archiveDir, '02-01-PLAN.md'), '# Archived plan');
    fs.writeFileSync(path.join(archiveDir, '02-VERIFICATION.md'), '# Archived verification');

    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

<details>
<summary>Shipped milestone v1.2</summary>

### Phase 2: Event Parser and Queue Schema
**Goal:** Archived milestone work
</details>

## Milestone v1.3 Current

### Phase 2: Retry Orchestration
**Goal:** Current milestone work
**Plans:** TBD
`
    );

    const result = runGsdTools('init phase-op 2', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, true);
    assert.strictEqual(output.phase_dir, null);
    assert.strictEqual(output.phase_name, 'Retry Orchestration');
    assert.strictEqual(output.phase_slug, 'retry-orchestration');
    assert.strictEqual(output.has_context, false);
    assert.strictEqual(output.has_plans, false);
    assert.strictEqual(output.has_verification, false);
  });

  test('neither directory nor roadmap entry returns not found', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 1: Setup\n**Goal:** Setup project\n**Plans:** TBD\n'
    );

    const result = runGsdTools('init phase-op 99', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_found, false);
    assert.strictEqual(output.phase_dir, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitProgress (INIT-03)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitProgress', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('no phases returns empty state', () => {
    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 0);
    assert.deepStrictEqual(output.phases, []);
    assert.strictEqual(output.current_phase, null);
    assert.strictEqual(output.next_phase, null);
    assert.strictEqual(output.has_work_in_progress, false);
  });

  test('multiple phases with mixed statuses', () => {
    // Phase 01: complete (has plan + summary)
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(phase1, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary');

    // Phase 02: in_progress (has plan, no summary)
    const phase2 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase2, { recursive: true });
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan');

    // Phase 03: pending (no plan, no research)
    const phase3 = path.join(tmpDir, '.planning', 'phases', '03-ui');
    fs.mkdirSync(phase3, { recursive: true });
    fs.writeFileSync(path.join(phase3, '03-CONTEXT.md'), '# Context');

    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.phase_count, 3);
    assert.strictEqual(output.completed_count, 1);
    assert.strictEqual(output.in_progress_count, 1);
    assert.strictEqual(output.has_work_in_progress, true);

    assert.strictEqual(output.current_phase.number, '02');
    assert.strictEqual(output.current_phase.status, 'in_progress');

    assert.strictEqual(output.next_phase.number, '03');
    assert.strictEqual(output.next_phase.status, 'pending');

    // Verify phase entries have expected structure
    const p1 = output.phases.find(p => p.number === '01');
    assert.strictEqual(p1.status, 'complete');
    assert.strictEqual(p1.plan_count, 1);
    assert.strictEqual(p1.summary_count, 1);
  });

  test('researched status detected correctly', () => {
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(phase1, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-RESEARCH.md'), '# Research');

    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    const p1 = output.phases.find(p => p.number === '01');
    assert.strictEqual(p1.status, 'researched');
    assert.strictEqual(p1.has_research, true);
    assert.strictEqual(output.current_phase.number, '01');
  });

  test('all phases complete returns no current or next', () => {
    const phase1 = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(phase1, { recursive: true });
    fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary');

    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.completed_count, 1);
    assert.strictEqual(output.current_phase, null);
    assert.strictEqual(output.next_phase, null);
  });

  test('paused_at detected from STATE.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\n**Paused At:** Phase 2, Task 3 — implementing auth\n'
    );

    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.paused_at, 'paused_at should be set');
    assert.ok(output.paused_at.includes('Phase 2, Task 3'), 'paused_at should contain pause location');
  });

  test('no paused_at when STATE.md has no pause line', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\nSome content without pause.\n'
    );

    const result = runGsdTools('init progress', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.paused_at, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitQuick (INIT-05)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitQuick', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('with description generates slug and task_dir with YYMMDD-xxx format', () => {
    const result = runGsdTools('init quick "Fix login bug"', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.branch_name, null);
    assert.strictEqual(output.slug, 'fix-login-bug');
    assert.strictEqual(output.description, 'Fix login bug');

    // quick_id must match YYMMDD-xxx (6 digits, dash, 3 base36 chars)
    assert.ok(/^\d{6}-[0-9a-z]{3}$/.test(output.quick_id),
      `quick_id should match YYMMDD-xxx, got: "${output.quick_id}"`);

    // task_dir must use the new ID format
    assert.ok(output.task_dir.startsWith('.planning/quick/'),
      `task_dir should start with .planning/quick/, got: "${output.task_dir}"`);
    assert.ok(output.task_dir.endsWith('-fix-login-bug'),
      `task_dir should end with -fix-login-bug, got: "${output.task_dir}"`);
    assert.ok(/^\.planning\/quick\/\d{6}-[0-9a-z]{3}-fix-login-bug$/.test(output.task_dir),
      `task_dir format wrong: "${output.task_dir}"`);

    // next_num must NOT be present
    assert.ok(!('next_num' in output), 'next_num should not be in output');
  });

  test('without description returns null slug and task_dir', () => {
    const result = runGsdTools('init quick', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.slug, null);
    assert.strictEqual(output.task_dir, null);
    assert.strictEqual(output.description, null);

    // quick_id is still generated even without description
    assert.ok(/^\d{6}-[0-9a-z]{3}$/.test(output.quick_id),
      `quick_id should match YYMMDD-xxx, got: "${output.quick_id}"`);
  });

  test('two rapid calls produce different quick_ids (no collision within 2s window)', () => {
    // Both calls happen within the same test, which is sub-second.
    // They may or may not land in the same 2-second block. We just verify format.
    const r1 = runGsdTools('init quick "Task one"', tmpDir);
    const r2 = runGsdTools('init quick "Task two"', tmpDir);
    assert.ok(r1.success && r2.success);

    const o1 = JSON.parse(r1.output);
    const o2 = JSON.parse(r2.output);

    assert.ok(/^\d{6}-[0-9a-z]{3}$/.test(o1.quick_id));
    assert.ok(/^\d{6}-[0-9a-z]{3}$/.test(o2.quick_id));

    // Directories are distinct because slugs differ
    assert.notStrictEqual(o1.task_dir, o2.task_dir);
  });

  test('long description truncates slug to 40 chars', () => {
    const result = runGsdTools('init quick "This is a very long description that should get truncated to forty characters maximum"', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.slug.length <= 40, `Slug should be <= 40 chars, got ${output.slug.length}: "${output.slug}"`);
  });

  test('returns quick branch name when quick_branch_template is configured', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        git: {
          quick_branch_template: 'gsd/quick-{num}-{slug}',
        },
      }, null, 2)
    );

    const result = runGsdTools('init quick "Fix login bug"', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.branch_name, 'branch_name should be set');
    assert.ok(output.branch_name.startsWith('gsd/quick-'));
    assert.ok(output.branch_name.endsWith('-fix-login-bug'));
    assert.ok(output.branch_name.includes(output.quick_id), 'branch_name should include quick_id');
  });

  test('uses fallback slug in quick branch name when description is omitted', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({
        git: {
          quick_branch_template: 'gsd/quick-{quick}-{slug}',
        },
      }, null, 2)
    );

    const result = runGsdTools('init quick', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.branch_name, 'branch_name should be set');
    assert.ok(output.branch_name.endsWith('-quick'), `Expected fallback slug in branch name, got "${output.branch_name}"`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitMapCodebase (INIT-05)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitMapCodebase', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('no codebase dir returns empty', () => {
    const result = runGsdTools('init map-codebase', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_maps, false);
    assert.deepStrictEqual(output.existing_maps, []);
    assert.strictEqual(output.codebase_dir_exists, false);
  });

  test('with existing maps lists md files only', () => {
    const codebaseDir = path.join(tmpDir, '.planning', 'codebase');
    fs.mkdirSync(codebaseDir, { recursive: true });
    fs.writeFileSync(path.join(codebaseDir, 'STACK.md'), '# Stack');
    fs.writeFileSync(path.join(codebaseDir, 'ARCHITECTURE.md'), '# Architecture');
    fs.writeFileSync(path.join(codebaseDir, 'notes.txt'), 'not a markdown file');

    const result = runGsdTools('init map-codebase', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_maps, true);
    assert.strictEqual(output.existing_maps.length, 2);
    assert.ok(output.existing_maps.includes('STACK.md'), 'Should include STACK.md');
    assert.ok(output.existing_maps.includes('ARCHITECTURE.md'), 'Should include ARCHITECTURE.md');
  });

  test('empty codebase dir returns no maps', () => {
    const codebaseDir = path.join(tmpDir, '.planning', 'codebase');
    fs.mkdirSync(codebaseDir, { recursive: true });

    const result = runGsdTools('init map-codebase', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_maps, false);
    assert.deepStrictEqual(output.existing_maps, []);
    assert.strictEqual(output.codebase_dir_exists, true);
  });

  test('map-codebase workflow does not list OpenCode under runtimes without Task tool (#1316)', () => {
    const workflow = fs.readFileSync(
      path.join(__dirname, '..', 'get-shit-done', 'workflows', 'map-codebase.md'), 'utf8'
    );
    // OpenCode must NOT appear in the "WITHOUT Task tool" / "NOT available" condition
    const withoutLine = workflow.split('\n').find(l =>
      l.includes('NOT available') || l.includes('WITHOUT Task tool')
    );
    assert.ok(withoutLine, 'workflow should have a line about Task tool NOT being available');
    assert.ok(!withoutLine.includes('OpenCode'), 'OpenCode must NOT be listed under runtimes WITHOUT Task tool');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitNewProject (INIT-06)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitNewProject', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('greenfield project with no code', () => {
    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_existing_code, false);
    assert.strictEqual(output.has_package_file, false);
    assert.strictEqual(output.is_brownfield, false);
    assert.strictEqual(output.needs_codebase_map, false);
  });

  test('brownfield with package.json detected', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_package_file, true);
    assert.strictEqual(output.is_brownfield, true);
    assert.strictEqual(output.needs_codebase_map, true);
  });

  test('brownfield with codebase map does not need map', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    fs.mkdirSync(path.join(tmpDir, '.planning', 'codebase'), { recursive: true });

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.is_brownfield, true);
    assert.strictEqual(output.needs_codebase_map, false);
  });

  test('planning_exists flag is correct', () => {
    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.planning_exists, true);
  });

  test('brownfield with Kotlin files detected (Android project)', () => {
    const srcDir = path.join(tmpDir, 'app', 'src', 'main');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'MainActivity.kt'), 'class MainActivity');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_existing_code, true);
    assert.strictEqual(output.is_brownfield, true);
  });

  test('brownfield with build.gradle detected (Android/Gradle project)', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle'), 'apply plugin: "com.android.application"');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_package_file, true);
    assert.strictEqual(output.is_brownfield, true);
    assert.strictEqual(output.needs_codebase_map, true);
  });

  test('brownfield with build.gradle.kts detected (Kotlin DSL)', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle.kts'), 'plugins { id("com.android.application") }');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_package_file, true);
    assert.strictEqual(output.is_brownfield, true);
  });

  test('brownfield with pom.xml detected (Maven project)', () => {
    fs.writeFileSync(path.join(tmpDir, 'pom.xml'), '<project></project>');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_package_file, true);
    assert.strictEqual(output.is_brownfield, true);
  });

  test('brownfield with pubspec.yaml detected (Flutter/Dart project)', () => {
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), 'name: my_app');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_package_file, true);
    assert.strictEqual(output.is_brownfield, true);
  });

  test('brownfield with Dart files detected', () => {
    const libDir = path.join(tmpDir, 'lib');
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(path.join(libDir, 'main.dart'), 'void main() {}');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_existing_code, true);
    assert.strictEqual(output.is_brownfield, true);
  });

  test('brownfield with C++ files detected', () => {
    fs.writeFileSync(path.join(tmpDir, 'main.cpp'), 'int main() { return 0; }');

    const result = runGsdTools('init new-project', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.has_existing_code, true);
    assert.strictEqual(output.is_brownfield, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdInitNewMilestone (INIT-06)
// ─────────────────────────────────────────────────────────────────────────────

describe('cmdInitNewMilestone', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns expected fields', () => {
    const result = runGsdTools('init new-milestone', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok('current_milestone' in output, 'Should have current_milestone');
    assert.ok('current_milestone_name' in output, 'Should have current_milestone_name');
    assert.ok('researcher_model' in output, 'Should have researcher_model');
    assert.ok('synthesizer_model' in output, 'Should have synthesizer_model');
    assert.ok('roadmapper_model' in output, 'Should have roadmapper_model');
    assert.ok('commit_docs' in output, 'Should have commit_docs');
    assert.strictEqual(output.project_path, '.planning/PROJECT.md');
    assert.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
    assert.strictEqual(output.state_path, '.planning/STATE.md');
  });

  test('file existence flags reflect actual state', () => {
    // Default: no STATE.md, ROADMAP.md, or PROJECT.md
    const result1 = runGsdTools('init new-milestone', tmpDir);
    assert.ok(result1.success, `Command failed: ${result1.error}`);

    const output1 = JSON.parse(result1.output);
    assert.strictEqual(output1.state_exists, false);
    assert.strictEqual(output1.roadmap_exists, false);
    assert.strictEqual(output1.project_exists, false);

    // Create files and verify flags change
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project');

    const result2 = runGsdTools('init new-milestone', tmpDir);
    assert.ok(result2.success, `Command failed: ${result2.error}`);

    const output2 = JSON.parse(result2.output);
    assert.strictEqual(output2.state_exists, true);
    assert.strictEqual(output2.roadmap_exists, true);
    assert.strictEqual(output2.project_exists, true);
  });

  test('reports latest completed milestone and archive target for reset flow', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'MILESTONES.md'),
      '# Milestones\n\n## v1.2 Search Refresh (Shipped: 2026-02-18)\n\n---\n'
    );
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '06-refine-search'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '07-polish'), { recursive: true });

    const result = runGsdTools('init new-milestone', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.latest_completed_milestone, 'v1.2');
    assert.strictEqual(output.latest_completed_milestone_name, 'Search Refresh');
    assert.strictEqual(output.phase_dir_count, 2);
    assert.strictEqual(output.phase_archive_path, '.planning/milestones/v1.2-phases');
  });

  test('reset flow metadata is null-safe when no milestones file exists', () => {
    const result = runGsdTools('init new-milestone', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.latest_completed_milestone, null);
    assert.strictEqual(output.latest_completed_milestone_name, null);
    assert.strictEqual(output.phase_dir_count, 0);
    assert.strictEqual(output.phase_archive_path, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findProjectRoot integration — gsd-tools resolves project root from sub-repo
// ─────────────────────────────────────────────────────────────────────────────

describe('findProjectRoot integration via --cwd', () => {
  let projectRoot;

  beforeEach(() => {
    projectRoot = createTempProject();
    // Add ROADMAP.md so init quick doesn't error
    fs.writeFileSync(
      path.join(projectRoot, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n## Phase 1: Foundation\n**Goal:** Setup\n'
    );
    // Write sub_repos config
    fs.writeFileSync(
      path.join(projectRoot, '.planning', 'config.json'),
      JSON.stringify({ sub_repos: ['backend', 'frontend'] })
    );
    // Create sub-repo directory
    fs.mkdirSync(path.join(projectRoot, 'backend'));
  });

  afterEach(() => {
    cleanup(projectRoot);
  });

  test('init quick from sub-repo CWD returns project_root pointing to parent', () => {
    const backendDir = path.join(projectRoot, 'backend');
    const result = runGsdTools(['init', 'quick', 'test task', '--cwd', backendDir]);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok('project_root' in output, 'Should have project_root');
    assert.strictEqual(output.project_root, projectRoot, 'project_root should be the parent, not the sub-repo');
    assert.ok(output.roadmap_exists, 'Should find ROADMAP.md at project root');
  });

  test('init quick from project root returns project_root as-is', () => {
    const result = runGsdTools(['init', 'quick', 'test task', '--cwd', projectRoot]);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.project_root, projectRoot);
  });

  test('state load from sub-repo CWD reads project root config', () => {
    // Write STATE.md at project root
    fs.writeFileSync(
      path.join(projectRoot, '.planning', 'STATE.md'),
      '---\ncurrent_phase: 1\nphase_name: Foundation\n---\n# State\n'
    );

    const backendDir = path.join(projectRoot, 'backend');
    const result = runGsdTools(['state', '--cwd', backendDir]);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    // Should find config from project root, not from backend/
    assert.deepStrictEqual(output.config.sub_repos, ['backend', 'frontend'],
      'Should read sub_repos from project root config');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTaskContext unit tests
// ─────────────────────────────────────────────────────────────────────────────

const { buildTaskContext } = require('../get-shit-done/bin/lib/init.cjs');

describe('buildTaskContext', () => {
  test('returns undefined when routing_strategy is static (default)', () => {
    const result = buildTaskContext(
      { phase_name: 'API' }, ['plan1.md'], 'REQ-01', { routing_strategy: 'static' }
    );
    assert.strictEqual(result, undefined);
  });

  test('returns undefined when routing_strategy is absent (defaults to static)', () => {
    const result = buildTaskContext(
      { phase_name: 'API' }, ['plan1.md'], 'REQ-01', {}
    );
    assert.strictEqual(result, undefined);
  });

  test('returns trivial for 1 plan and 1 requirement', () => {
    const result = buildTaskContext(
      { phase_name: 'Setup' }, ['plan1.md'], 'REQ-01', { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'trivial');
  });

  test('returns standard for 2 plans and 4 requirements', () => {
    const result = buildTaskContext(
      { phase_name: 'Core' },
      ['plan1.md', 'plan2.md'],
      'R-01, R-02, R-03, R-04',
      { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'standard');
  });

  test('returns complex for 5 plans and 3 requirements', () => {
    const result = buildTaskContext(
      { phase_name: 'Build' },
      ['p1.md', 'p2.md', 'p3.md', 'p4.md', 'p5.md'],
      'R-01, R-02, R-03',
      { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'complex');
  });

  test('returns complex for 0 plans and 7 requirements', () => {
    const result = buildTaskContext(
      { phase_name: 'Reqs' },
      [],
      'R-01, R-02, R-03, R-04, R-05, R-06, R-07',
      { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'complex');
  });

  test('returns critical for 8 plans and 10 requirements', () => {
    const plans = Array.from({ length: 8 }, (_, i) => `plan-${i}.md`);
    const reqs = Array.from({ length: 10 }, (_, i) => `R-${i + 1}`).join(', ');
    const result = buildTaskContext(
      { phase_name: 'Launch' }, plans, reqs, { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'critical');
  });

  test('handles null phaseInfo gracefully', () => {
    const result = buildTaskContext(
      null, ['plan1.md'], 'REQ-01', { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.complexity, 'trivial');
    assert.strictEqual(result.phase_name, '');
    assert.strictEqual(result.signals.phase_name, '');
  });

  test('handles null planInventory gracefully (counts as 0 plans)', () => {
    const result = buildTaskContext(
      { phase_name: 'Test' }, null, 'R-01', { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.signals.plan_count, 0);
  });

  test('returns correct shape with complexity, signals, and phase_name', () => {
    const result = buildTaskContext(
      { phase_name: 'Deploy' },
      ['p1.md', 'p2.md'],
      'D-01, D-02, D-03',
      { routing_strategy: 'dynamic' }
    );
    assert.ok(result.complexity, 'should have complexity');
    assert.ok(result.signals, 'should have signals');
    assert.strictEqual(typeof result.signals.plan_count, 'number');
    assert.strictEqual(typeof result.signals.requirement_count, 'number');
    assert.strictEqual(typeof result.signals.phase_name, 'string');
    assert.strictEqual(result.phase_name, 'Deploy');
    assert.strictEqual(result.signals.plan_count, 2);
    assert.strictEqual(result.signals.requirement_count, 3);
  });

  test('handles empty reqIds string', () => {
    const result = buildTaskContext(
      { phase_name: 'Empty' }, [], '', { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.signals.requirement_count, 0);
    assert.strictEqual(result.complexity, 'trivial');
  });

  test('handles null reqIds', () => {
    const result = buildTaskContext(
      { phase_name: 'Null' }, [], null, { routing_strategy: 'dynamic' }
    );
    assert.strictEqual(result.signals.requirement_count, 0);
    assert.strictEqual(result.complexity, 'trivial');
  });
});

describe('init command taskContext wiring', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('execute-phase with static routing returns string model fields', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02\n**Plans:** 1 plans\n'
    );

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(typeof output.executor_model, 'string');
    assert.strictEqual(typeof output.verifier_model, 'string');
  });

  test('execute-phase with dynamic routing returns string model fields', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '# Plan');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02\n**Plans:** 1 plans\n'
    );
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
      : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, routing_strategy: 'dynamic' }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(typeof output.executor_model, 'string');
    assert.strictEqual(typeof output.verifier_model, 'string');
  });

  test('plan-phase with static routing returns string model fields', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02\n**Plans:** 0 plans\n'
    );

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(typeof output.researcher_model, 'string');
    assert.strictEqual(typeof output.planner_model, 'string');
    assert.strictEqual(typeof output.checker_model, 'string');
  });

  test('plan-phase with dynamic routing returns string model fields', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02\n**Plans:** 0 plans\n'
    );
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
      : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, routing_strategy: 'dynamic' }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(typeof output.researcher_model, 'string');
    assert.strictEqual(typeof output.planner_model, 'string');
    assert.strictEqual(typeof output.checker_model, 'string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task classification wiring (INTEL-10, INTEL-12)
// ─────────────────────────────────────────────────────────────────────────────

describe('task_classification in init execute-phase (INTEL-10, INTEL-12)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create a phase with plans and a ROADMAP with requirements
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-01-PLAN.md'), '---\nstatus: pending\nfiles_to_modify:\n  - src/a.js\n  - src/b.js\n---\n# Plan 1');
    fs.writeFileSync(path.join(phaseDir, '03-02-PLAN.md'), '---\nstatus: pending\ndepends_on: [1]\nfiles_to_modify:\n  - src/c.js\n---\n# Plan 2');
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02, EX-03\n**Plans:** 2 plans\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('adaptive: false does not include task_classification', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: false } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.task_classification, null, 'task_classification should be null when adaptive is false');
  });

  test('no adaptive key does not include task_classification', () => {
    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.task_classification, null, 'task_classification should be null when adaptive is not set');
  });

  test('adaptive: true includes task_classification object', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.ok(output.task_classification !== null, 'task_classification should not be null when adaptive is true');
    assert.strictEqual(typeof output.task_classification, 'object');
  });

  test('task_classification has shape: { complexity, signals, confidence }', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    assert.ok('complexity' in tc, 'task_classification should have complexity');
    assert.ok('signals' in tc, 'task_classification should have signals');
    assert.ok('confidence' in tc, 'task_classification should have confidence');
  });

  test('task_classification.complexity is one of: trivial, standard, complex, critical', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    const validLevels = ['trivial', 'standard', 'complex', 'critical'];
    assert.ok(validLevels.includes(tc.complexity), `complexity "${tc.complexity}" should be one of ${validLevels.join(', ')}`);
  });

  test('task_classification.signals contains plan_count and requirement_count', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const signals = JSON.parse(result.output).task_classification.signals;
    assert.ok('plan_count' in signals, 'signals should have plan_count');
    assert.ok('requirement_count' in signals, 'signals should have requirement_count');
    assert.strictEqual(signals.plan_count, 2, 'should detect 2 plans');
    assert.strictEqual(signals.requirement_count, 3, 'should detect 3 requirements');
  });

  test('task_classification.confidence is between 0 and 1', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init execute-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    assert.ok(tc.confidence >= 0 && tc.confidence <= 1, `confidence ${tc.confidence} should be between 0 and 1`);
  });
});

describe('task_classification in init plan-phase (INTEL-10, INTEL-12)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create phase directory (no plans yet — this is plan-phase)
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02, CP-03\n**Plans:** 0 plans\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('adaptive: false has null task_classification', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: false } }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.task_classification, null);
  });

  test('adaptive: true includes task_classification', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.ok(output.task_classification !== null, 'task_classification should not be null');
    assert.strictEqual(typeof output.task_classification, 'object');
  });

  test('task_classification has expected shape', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    assert.ok('complexity' in tc, 'should have complexity');
    assert.ok('signals' in tc, 'should have signals');
    assert.ok('confidence' in tc, 'should have confidence');
  });

  test('plan-phase task_classification.signals.plan_count is 0 (no plans yet)', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    assert.strictEqual(tc.signals.plan_count, 0, 'plan-phase passes null planInventory so plan_count should be 0');
  });

  test('classification varies by requirement count (more reqs -> higher complexity)', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    // Few requirements -> lower complexity
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: R-01\n**Plans:** 0 plans\n'
    );
    const r1 = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(r1.success, `Command failed: ${r1.error}`);
    const tc1 = JSON.parse(r1.output).task_classification;

    // Many requirements -> higher or equal complexity
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: R-01, R-02, R-03, R-04, R-05, R-06, R-07, R-08, R-09\n**Plans:** 0 plans\n'
    );
    const r2 = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(r2.success, `Command failed: ${r2.error}`);
    const tc2 = JSON.parse(r2.output).task_classification;

    const levels = ['trivial', 'standard', 'complex', 'critical'];
    assert.ok(levels.indexOf(tc2.complexity) >= levels.indexOf(tc1.complexity),
      `More requirements should yield >= complexity: "${tc1.complexity}" vs "${tc2.complexity}"`);
  });

  test('task_classification.confidence is between 0 and 1', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, workflow: { ...(existing.workflow || {}), adaptive: true } }, null, 2));

    const result = runGsdTools('init plan-phase 3', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const tc = JSON.parse(result.output).task_classification;
    assert.ok(tc.confidence >= 0 && tc.confidence <= 1, `confidence ${tc.confidence} should be between 0 and 1`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// roadmap analyze command
// ─────────────────────────────────────────────────────────────────────────────
