/**
 * E2E Fixture System — Project Scaffolding for Integration Tests
 *
 * Provides disposable .planning/ directory scaffolds in known states:
 *   - createEmptyProject()              — bare .planning/ with minimal files
 *   - createMidMilestoneProject(opts)   — mid-milestone with git, phases, config
 *   - createCompletedMilestoneProject() — fully shipped milestone
 *   - createCorruptProject(corruption)  — intentionally broken state
 *   - fixtureCleanup()                  — remove all registered temp dirs
 *
 * @module tests/e2e/fixtures
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// ---------- cleanup registry ----------

const _registeredDirs = [];

// ---------- helpers ----------

function tmpDir(prefix) {
  const hex = crypto.randomBytes(8).toString('hex');
  const dir = path.join(os.tmpdir(), `${prefix}${hex}`);
  fs.mkdirSync(dir, { recursive: true });
  _registeredDirs.push(dir);
  return dir;
}

function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function gitInit(cwd) {
  execFileSync('git', ['init'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['add', '-A'], { cwd, stdio: 'pipe' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd, stdio: 'pipe' });
}

// ---------- fixture: empty project ----------

/**
 * Create a bare project with minimal .planning/ files.
 * No git init, no phases, no config.
 * @returns {string} Temp directory path
 */
function createEmptyProject() {
  const dir = tmpDir('gsd-e2e-empty-');

  writeFile(dir, '.planning/PROJECT.md', [
    '---',
    'name: test-project',
    'created: "2026-01-01"',
    '---',
    '',
    '# Project',
    '',
    'Test project.',
    '',
  ].join('\n'));

  writeFile(dir, '.planning/STATE.md', [
    '---',
    'gsd_state_version: 1.0',
    'milestone: v0.1',
    'milestone_name: Test Milestone',
    'status: active',
    'last_updated: "2026-01-01T00:00:00.000Z"',
    'last_activity: 2026-01-01 -- project created',
    'progress:',
    '  total_phases: 0',
    '  completed_phases: 0',
    '  total_plans: 0',
    '  completed_plans: 0',
    '---',
    '',
    '# STATE',
    '',
    '## Current Position',
    'Phase: none',
    '',
  ].join('\n'));

  writeFile(dir, '.planning/ROADMAP.md', [
    '# Roadmap',
    '',
    '## Current Milestone',
    '**v0.1 Test Milestone**',
    '',
  ].join('\n'));

  writeFile(dir, '.planning/REQUIREMENTS.md', [
    '# Requirements',
    '',
    '## v0.1 Requirements',
    'None defined.',
    '',
  ].join('\n'));

  return dir;
}

// ---------- fixture: mid-milestone project ----------

/**
 * Create a project in the middle of a milestone with git history.
 * Phase 1 complete, Phase 2 in-progress, Phase 3 pending.
 *
 * @param {object} [opts]
 * @param {string} [opts.name='test-project']  - Project name
 * @param {string} [opts.milestone='v1.0']     - Milestone version
 * @param {number} [opts.phaseCount=3]         - Number of phases
 * @returns {string} Temp directory path
 */
function createMidMilestoneProject(opts) {
  const o = Object.assign({ name: 'test-project', milestone: 'v1.0', phaseCount: 3 }, opts);
  const dir = tmpDir('gsd-e2e-mid-');

  // -- PROJECT.md --
  writeFile(dir, '.planning/PROJECT.md', [
    '---',
    `name: ${o.name}`,
    'created: "2026-01-15"',
    '---',
    '',
    `# ${o.name}`,
    '',
    '## What This Is',
    '',
    'A test project for E2E integration testing.',
    '',
    '## Current State',
    '',
    `**Active:** ${o.milestone} Test Milestone (2026-01-15)`,
    '',
    '## Constraints',
    '',
    '- Zero dependencies',
    '- Test stability',
    '',
    '---',
    `*Last updated: 2026-01-15*`,
    '',
  ].join('\n'));

  // -- STATE.md --
  writeFile(dir, '.planning/STATE.md', [
    '---',
    'gsd_state_version: 1.0',
    `milestone: ${o.milestone}`,
    `milestone_name: ${o.name} Test Milestone`,
    'status: active',
    'last_updated: "2026-01-15T12:00:00.000Z"',
    'last_activity: 2026-01-15 -- Phase 1 completed',
    'progress:',
    `  total_phases: ${o.phaseCount}`,
    '  completed_phases: 1',
    '  total_plans: 3',
    '  completed_plans: 1',
    '---',
    '',
    `# STATE -- ${o.name}`,
    '',
    '## Project Reference',
    '',
    'See: .planning/PROJECT.md (updated 2026-01-15)',
    '',
    `**Active:** ${o.milestone} Test Milestone (2026-01-15)`,
    '',
    '## Current Position',
    '',
    'Phase: Phase 2 — Feature Implementation (in-progress)',
    `Milestone: ${o.milestone} Test Milestone — in progress`,
    'Status: Phase 1 complete. Phase 2 active.',
    'Last activity: 2026-01-15 -- Phase 1 completed',
    '',
    `Progress: [###-------] 1/${o.phaseCount} phases | 1/3 plans | 2/6 requirements`,
    '',
    '## Milestone History',
    '',
    '| Version | Name | Phases | Plans | Shipped |',
    '|---------|------|--------|-------|---------|',
    '',
    '## Session Handoff',
    '',
    '**Branch**: `feat/phase-2`',
    '**Last action**: Phase 1 completed',
    '**Stopped at**: Phase 2 in progress',
    '**Next**: Continue Phase 2 execution',
    '',
  ].join('\n'));

  // -- ROADMAP.md --
  const phases = [];
  for (let i = 1; i <= o.phaseCount; i++) {
    let status;
    let desc;
    if (i === 1) {
      status = 'complete';
      desc = 'Setup & Configuration';
    } else if (i === 2) {
      status = 'in-progress';
      desc = 'Feature Implementation';
    } else {
      status = 'pending';
      desc = `Phase ${i} Work`;
    }
    phases.push(`### Phase ${i} — ${desc}`);
    phases.push(`Status: ${status}`);
    phases.push('');
    phases.push('| Requirement | Description |');
    phases.push('|-------------|-------------|');
    phases.push(`| REQ-${String(i * 2 - 1).padStart(2, '0')} | Requirement ${i * 2 - 1} |`);
    phases.push(`| REQ-${String(i * 2).padStart(2, '0')} | Requirement ${i * 2} |`);
    phases.push('');
  }

  writeFile(dir, '.planning/ROADMAP.md', [
    `# Roadmap: ${o.name}`,
    '',
    '## Current Milestone',
    '',
    `**${o.milestone} Test Milestone** (2026-01-15)`,
    '',
    'E2E test milestone with multiple phases.',
    '',
    ...phases,
    '---',
    '*Last updated: 2026-01-15*',
    '',
  ].join('\n'));

  // -- REQUIREMENTS.md --
  writeFile(dir, '.planning/REQUIREMENTS.md', [
    `# Requirements: ${o.name}`,
    '',
    '**Defined:** 2026-01-15',
    '',
    `## ${o.milestone} Requirements`,
    '',
    '- [x] **REQ-01**: Setup task one',
    '- [x] **REQ-02**: Setup task two',
    '- [ ] **REQ-03**: Feature task one',
    '- [ ] **REQ-04**: Feature task two',
    '- [ ] **REQ-05**: Final task one',
    '- [ ] **REQ-06**: Final task two',
    '',
    '## Traceability',
    '',
    '| Requirement | Phase | Status |',
    '|-------------|-------|--------|',
    '| REQ-01 | Phase 1 | Validated |',
    '| REQ-02 | Phase 1 | Validated |',
    '| REQ-03 | Phase 2 | In Progress |',
    '| REQ-04 | Phase 2 | In Progress |',
    '| REQ-05 | Phase 3 | Pending |',
    '| REQ-06 | Phase 3 | Pending |',
    '',
    '---',
    '*Requirements defined: 2026-01-15*',
    '',
  ].join('\n'));

  // -- Phase 1 directory (complete) --
  writeFile(dir, '.planning/phases/phase-01/SUMMARY.md', [
    '# Phase 1 Summary — Setup & Configuration',
    '',
    '## Outcome',
    'All setup tasks completed successfully.',
    '',
    '## Tasks Completed',
    '- [x] REQ-01: Setup task one',
    '- [x] REQ-02: Setup task two',
    '',
    '## Artifacts',
    '- PLAN.md (archived)',
    '- CONTEXT.md (archived)',
    '',
    '---',
    '*Completed: 2026-01-15*',
    '',
  ].join('\n'));

  // -- Phase 2 directory (in-progress) --
  writeFile(dir, '.planning/phases/phase-02/CONTEXT.md', [
    '# Phase 2 Context — Feature Implementation',
    '',
    '## Scope',
    'Implement REQ-03 and REQ-04.',
    '',
    '## Dependencies',
    '- Phase 1 complete',
    '',
    '## Notes',
    'Feature implementation in progress.',
    '',
  ].join('\n'));

  // -- config.json --
  writeFile(dir, '.planning/config.json', JSON.stringify({
    config_version: 1,
    model_profile: 'balanced',
    commit_docs: false,
  }, null, 2) + '\n');

  // -- git init + commit --
  gitInit(dir);

  return dir;
}

// ---------- fixture: completed milestone project ----------

/**
 * Create a project where the milestone is fully shipped.
 * Two phases, both complete. All requirements checked.
 * @returns {string} Temp directory path
 */
function createCompletedMilestoneProject() {
  const dir = tmpDir('gsd-e2e-done-');

  // -- PROJECT.md --
  writeFile(dir, '.planning/PROJECT.md', [
    '---',
    'name: completed-project',
    'created: "2026-02-01"',
    '---',
    '',
    '# completed-project',
    '',
    '## What This Is',
    '',
    'A test project that has completed its milestone.',
    '',
    '## Current State',
    '',
    '**Shipped:** v1.0 Test Milestone (2026-02-01)',
    '',
    '---',
    '*Last updated: 2026-02-01*',
    '',
  ].join('\n'));

  // -- STATE.md --
  writeFile(dir, '.planning/STATE.md', [
    '---',
    'gsd_state_version: 1.0',
    'milestone: v1.0',
    'milestone_name: Completed Test Milestone',
    'status: shipped',
    'last_updated: "2026-02-01T18:00:00.000Z"',
    'last_activity: 2026-02-01 -- milestone shipped',
    'progress:',
    '  total_phases: 2',
    '  completed_phases: 2',
    '  total_plans: 4',
    '  completed_plans: 4',
    '---',
    '',
    '# STATE -- completed-project',
    '',
    '## Project Reference',
    '',
    'See: .planning/PROJECT.md (updated 2026-02-01)',
    '',
    '**Shipped:** v1.0 Completed Test Milestone (2026-02-01)',
    '',
    '## Current Position',
    '',
    'Phase: none (milestone shipped)',
    'Milestone: v1.0 Completed Test Milestone — shipped',
    'Status: All phases complete. Milestone shipped.',
    'Last activity: 2026-02-01 -- milestone shipped',
    '',
    'Progress: [##########] 2/2 phases | 4/4 plans | 4/4 requirements',
    '',
    '## Milestone History',
    '',
    '| Version | Name | Phases | Plans | Shipped |',
    '|---------|------|--------|-------|---------|',
    '| v1.0 | Completed Test Milestone | 2 | 4 | 2026-02-01 |',
    '',
    '## Session Handoff',
    '',
    '**Branch**: `main`',
    '**Last action**: Milestone shipped',
    '**Stopped at**: Ready for next milestone',
    '**Next**: Run `/gsd:new-milestone` to start next cycle',
    '',
  ].join('\n'));

  // -- ROADMAP.md --
  writeFile(dir, '.planning/ROADMAP.md', [
    '# Roadmap: completed-project',
    '',
    '## Current Milestone',
    '',
    '**v1.0 Completed Test Milestone** (2026-02-01)',
    '',
    'All phases shipped.',
    '',
    '### Phase 1 — Setup',
    'Status: complete',
    '',
    '| Requirement | Description |',
    '|-------------|-------------|',
    '| REQ-01 | Setup task one |',
    '| REQ-02 | Setup task two |',
    '',
    '### Phase 2 — Implementation',
    'Status: complete',
    '',
    '| Requirement | Description |',
    '|-------------|-------------|',
    '| REQ-03 | Implementation task one |',
    '| REQ-04 | Implementation task two |',
    '',
    '---',
    '*Last updated: 2026-02-01 -- milestone shipped*',
    '',
  ].join('\n'));

  // -- REQUIREMENTS.md --
  writeFile(dir, '.planning/REQUIREMENTS.md', [
    '# Requirements: completed-project',
    '',
    '**Defined:** 2026-02-01',
    '',
    '## v1.0 Requirements',
    '',
    '- [x] **REQ-01**: Setup task one',
    '- [x] **REQ-02**: Setup task two',
    '- [x] **REQ-03**: Implementation task one',
    '- [x] **REQ-04**: Implementation task two',
    '',
    '## Traceability',
    '',
    '| Requirement | Phase | Status |',
    '|-------------|-------|--------|',
    '| REQ-01 | Phase 1 | Validated |',
    '| REQ-02 | Phase 1 | Validated |',
    '| REQ-03 | Phase 2 | Validated |',
    '| REQ-04 | Phase 2 | Validated |',
    '',
    '---',
    '*Requirements defined: 2026-02-01*',
    '',
  ].join('\n'));

  // -- Phase directories (both complete) --
  writeFile(dir, '.planning/phases/phase-01/SUMMARY.md', [
    '# Phase 1 Summary — Setup',
    '',
    '## Outcome',
    'Setup completed successfully.',
    '',
    '## Tasks Completed',
    '- [x] REQ-01: Setup task one',
    '- [x] REQ-02: Setup task two',
    '',
    '---',
    '*Completed: 2026-02-01*',
    '',
  ].join('\n'));

  writeFile(dir, '.planning/phases/phase-02/SUMMARY.md', [
    '# Phase 2 Summary — Implementation',
    '',
    '## Outcome',
    'Implementation completed successfully.',
    '',
    '## Tasks Completed',
    '- [x] REQ-03: Implementation task one',
    '- [x] REQ-04: Implementation task two',
    '',
    '---',
    '*Completed: 2026-02-01*',
    '',
  ].join('\n'));

  // -- git init + commit --
  gitInit(dir);

  return dir;
}

// ---------- fixture: corrupt project ----------

/**
 * Create a project with intentionally broken state for error-path testing.
 *
 * @param {'invalid-yaml'|'missing-roadmap'|'orphan-phase'|'version-mismatch'} corruption
 * @returns {string} Temp directory path
 */
function createCorruptProject(corruption) {
  const dir = tmpDir('gsd-e2e-corrupt-');

  switch (corruption) {
    case 'invalid-yaml':
      // STATE.md with unparseable YAML frontmatter
      writeFile(dir, '.planning/STATE.md', [
        '---',
        '{{{invalid yaml',
        '---',
        '',
        '# STATE',
        '',
        '## Current Position',
        'Phase: unknown',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/ROADMAP.md', [
        '# Roadmap',
        '',
        '## Current Milestone',
        '**v1.0 Test**',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/PROJECT.md', [
        '# Project',
        '',
        'Test project with corrupt state.',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/REQUIREMENTS.md', [
        '# Requirements',
        '',
        'None defined.',
        '',
      ].join('\n'));
      break;

    case 'missing-roadmap':
      // Valid STATE.md but ROADMAP.md is absent
      writeFile(dir, '.planning/STATE.md', [
        '---',
        'gsd_state_version: 1.0',
        'milestone: v1.0',
        'milestone_name: Missing Roadmap Test',
        'status: active',
        'last_updated: "2026-01-01T00:00:00.000Z"',
        'last_activity: 2026-01-01 -- created',
        'progress:',
        '  total_phases: 1',
        '  completed_phases: 0',
        '  total_plans: 0',
        '  completed_plans: 0',
        '---',
        '',
        '# STATE',
        '',
        '## Current Position',
        'Phase: Phase 1 (pending)',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/PROJECT.md', [
        '# Project',
        '',
        'Test project with missing roadmap.',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/REQUIREMENTS.md', [
        '# Requirements',
        '',
        'None defined.',
        '',
      ].join('\n'));
      // No ROADMAP.md created intentionally
      break;

    case 'orphan-phase':
      // Phase directory exists but is empty — no PLAN.md, no CONTEXT.md
      writeFile(dir, '.planning/STATE.md', [
        '---',
        'gsd_state_version: 1.0',
        'milestone: v1.0',
        'milestone_name: Orphan Phase Test',
        'status: active',
        'last_updated: "2026-01-01T00:00:00.000Z"',
        'last_activity: 2026-01-01 -- created',
        'progress:',
        '  total_phases: 1',
        '  completed_phases: 0',
        '  total_plans: 0',
        '  completed_plans: 0',
        '---',
        '',
        '# STATE',
        '',
        '## Current Position',
        'Phase: Phase 1 (pending)',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/ROADMAP.md', [
        '# Roadmap',
        '',
        '## Current Milestone',
        '**v1.0 Orphan Phase Test**',
        '',
        '### Phase 1 — Work',
        'Status: pending',
        '',
        '| Requirement | Description |',
        '|-------------|-------------|',
        '| REQ-01 | Some task |',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/PROJECT.md', [
        '# Project',
        '',
        'Test project with orphan phase directory.',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/REQUIREMENTS.md', [
        '# Requirements',
        '',
        '- [ ] **REQ-01**: Some task',
        '',
      ].join('\n'));
      // Create empty phase directory
      fs.mkdirSync(path.join(dir, '.planning', 'phases', 'phase-01'), { recursive: true });
      break;

    case 'version-mismatch':
      // STATE.md says v2.0, ROADMAP.md says v1.0
      writeFile(dir, '.planning/STATE.md', [
        '---',
        'gsd_state_version: 1.0',
        'milestone: v2.0',
        'milestone_name: Version Mismatch Test',
        'status: active',
        'last_updated: "2026-01-01T00:00:00.000Z"',
        'last_activity: 2026-01-01 -- created',
        'progress:',
        '  total_phases: 1',
        '  completed_phases: 0',
        '  total_plans: 0',
        '  completed_plans: 0',
        '---',
        '',
        '# STATE',
        '',
        '## Current Position',
        'Phase: Phase 1 (pending)',
        'Milestone: v2.0 Version Mismatch Test — in progress',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/ROADMAP.md', [
        '# Roadmap',
        '',
        '## Current Milestone',
        '**v1.0 Old Milestone**',
        '',
        '### Phase 1 — Work',
        'Status: pending',
        '',
        '| Requirement | Description |',
        '|-------------|-------------|',
        '| REQ-01 | Some task |',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/PROJECT.md', [
        '# Project',
        '',
        'Test project with version mismatch.',
        '',
      ].join('\n'));
      writeFile(dir, '.planning/REQUIREMENTS.md', [
        '# Requirements',
        '',
        '- [ ] **REQ-01**: Some task',
        '',
      ].join('\n'));
      break;

    default:
      throw new Error(`Unknown corruption type: ${corruption}`);
  }

  return dir;
}

// ---------- cleanup ----------

/**
 * Remove all registered temp directories. Call in afterAll / afterEach.
 */
function fixtureCleanup() {
  for (const dir of _registeredDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  _registeredDirs.length = 0;
}

// ---------- exports ----------

module.exports = {
  createEmptyProject,
  createMidMilestoneProject,
  createCompletedMilestoneProject,
  createCorruptProject,
  fixtureCleanup,
};
