/**
 * GSD Tests - `/gsd:do` routing contract for named autonomous workflows
 *
 * Validates the do.md dispatcher's workflow routes (Option A of
 * .planning/GSD-AUTONOMOUS-WORKFLOWS.md): every built flow is routed,
 * each target workflow file exists, the dispatch step documents workflow:
 * semantics, and first-match ordering keeps the new rows from being shadowed
 * by (or shadowing) existing routes.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DO_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'do.md');

const FLOWS = [
  'idea-to-shipped',
  'daily-startup',
  'wrap-and-sync',
  'bug-to-branch',
  'quick-change',
  'smart-discuss',
  'adopt-codebase',
  'ship-and-merge',
  'quality-sweep',
  'frontend-phase',
  'hardened-plan',
  'groom-backlog',
];

describe('do.md workflow routing contract', () => {
  test('do.md exists', () => {
    assert.ok(fs.existsSync(DO_PATH), 'get-shit-done/workflows/do.md missing');
  });

  const doc = fs.readFileSync(DO_PATH, 'utf8');

  test('routes all built autonomous flows', () => {
    for (const flow of FLOWS) {
      assert.ok(
        doc.includes(`\`workflow:${flow}\``),
        `routing table missing workflow:${flow} target`,
      );
    }
  });

  test('every routed workflow file exists on disk', () => {
    for (const flow of FLOWS) {
      const p = path.join(ROOT, 'get-shit-done', 'workflows', `${flow}.md`);
      assert.ok(fs.existsSync(p), `routed workflow file missing: ${p}`);
    }
  });

  test('dispatch step documents workflow: route semantics', () => {
    assert.match(
      doc,
      /Workflow routes:[\s\S]*workflow:<name>[\s\S]*get-shit-done\/workflows\/<name>\.md/,
      'dispatch step must explain how workflow: targets are executed',
    );
  });

  test('first-match ordering: idea-to-shipped wins over the complex-task route', () => {
    const ideaIdx = doc.indexOf('`workflow:idea-to-shipped`');
    const complexIdx = doc.indexOf('A complex task: refactoring');
    assert.ok(ideaIdx !== -1 && complexIdx !== -1, 'expected rows not found');
    assert.ok(
      ideaIdx < complexIdx,
      'idea-to-shipped row must precede the complex-task /gsd:add-phase row (first match wins)',
    );
  });

  test('first-match ordering: daily-startup wins over the generic status route', () => {
    const dailyIdx = doc.indexOf('`workflow:daily-startup`');
    const progressIdx = doc.indexOf('Checking progress, status');
    assert.ok(dailyIdx !== -1 && progressIdx !== -1, 'expected rows not found');
    assert.ok(
      dailyIdx < progressIdx,
      'daily-startup row must precede the /gsd:progress row (first match wins)',
    );
  });

  test('existing routes are not displaced: debug still owns bugs, quick still last-resort', () => {
    assert.ok(doc.includes('| `/gsd:debug` |'), 'debug route missing');
    const quickIdx = doc.indexOf('| `/gsd:quick` |');
    assert.ok(quickIdx !== -1, 'quick route missing');
    for (const flow of FLOWS) {
      assert.ok(
        doc.indexOf(`\`workflow:${flow}\``) < quickIdx,
        `${flow} row must appear before the catch-all /gsd:quick row`,
      );
    }
  });

  test('first-match ordering: bug-to-branch wins over ship-and-merge', () => {
    const bugIdx = doc.indexOf('`workflow:bug-to-branch`');
    const shipIdx = doc.indexOf('`workflow:ship-and-merge`');
    assert.ok(bugIdx !== -1 && shipIdx !== -1, 'expected rows not found');
    assert.ok(
      bugIdx < shipIdx,
      'bug-to-branch row must precede ship-and-merge ("ship it" + pasted error hits the bug flow first)',
    );
  });

  test('first-match ordering: adopt-codebase wins over the map-codebase route', () => {
    const adoptIdx = doc.indexOf('`workflow:adopt-codebase`');
    const mapIdx = doc.indexOf('Mapping or analyzing an existing codebase');
    assert.ok(adoptIdx !== -1 && mapIdx !== -1, 'expected rows not found');
    assert.ok(adoptIdx < mapIdx, 'adopt-codebase row must precede the /gsd:map-codebase row');
  });

  test('first-match ordering: frontend-phase and hardened-plan win over plan-phase', () => {
    const planIdx = doc.indexOf('Planning a specific phase or "plan phase N"');
    assert.ok(planIdx !== -1, 'plan-phase row not found');
    for (const flow of ['frontend-phase', 'hardened-plan']) {
      const idx = doc.indexOf(`\`workflow:${flow}\``);
      assert.ok(idx !== -1 && idx < planIdx, `${flow} row must precede the /gsd:plan-phase row`);
    }
  });

  test('first-match ordering: quality-sweep wins over the generic verify route', () => {
    const sweepIdx = doc.indexOf('`workflow:quality-sweep`');
    const verifyIdx = doc.indexOf('A review or quality concern about existing work');
    assert.ok(sweepIdx !== -1 && verifyIdx !== -1, 'expected rows not found');
    assert.ok(sweepIdx < verifyIdx, 'quality-sweep row must precede the /gsd:verify-work row');
  });

  test('first-match ordering: groom-backlog wins over the add-todo capture route', () => {
    const groomIdx = doc.indexOf('`workflow:groom-backlog`');
    const todoIdx = doc.indexOf('A note, idea, or "remember to..."');
    assert.ok(groomIdx !== -1 && todoIdx !== -1, 'expected rows not found');
    assert.ok(groomIdx < todoIdx, 'groom-backlog row must precede the /gsd:add-todo row');
  });

  test('first-match ordering: smart-discuss wins over the generic discuss route', () => {
    const smartIdx = doc.indexOf('`workflow:smart-discuss`');
    const discussIdx = doc.indexOf('Discussing vision, "how should X look"');
    assert.ok(smartIdx !== -1 && discussIdx !== -1, 'expected rows not found');
    assert.ok(smartIdx < discussIdx, 'smart-discuss row must precede the /gsd:discuss-phase row');
  });

  test('adopt-codebase is exempted from the .planning/ requirement', () => {
    assert.match(
      doc,
      /Requires `\.planning\/` directory:[^\n]*workflow:adopt-codebase/,
      'adopt-codebase must be listed as not requiring .planning/',
    );
  });

  test('shelved milestone workflow is not routed', () => {
    assert.ok(
      !doc.includes('workflow:milestone-rollover') && !doc.includes('workflow:ship-milestone'),
      'ship-milestone/milestone-rollover is shelved (operator, 2026-07-12) and must not be routed',
    );
  });

  test('daily-startup is exempted from the .planning/ requirement', () => {
    assert.match(
      doc,
      /Requires `\.planning\/` directory:[^\n]*workflow:daily-startup/,
      'daily-startup must be listed as not requiring .planning/',
    );
  });

  test('do.md remains a pure dispatcher', () => {
    assert.match(doc, /dispatcher — it never does the work itself/i, 'dispatcher statement missing');
    assert.ok(!doc.includes('git push'), 'do.md must not perform git operations');
  });
});
