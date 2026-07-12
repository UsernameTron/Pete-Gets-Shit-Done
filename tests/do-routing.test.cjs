/**
 * GSD Tests - `/gsd:do` routing contract for named autonomous workflows
 *
 * Validates the do.md dispatcher's workflow routes (Option A of
 * .planning/GSD-AUTONOMOUS-WORKFLOWS.md): the three built flows are routed,
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

const FLOWS = ['idea-to-shipped', 'daily-startup', 'wrap-and-sync'];

describe('do.md workflow routing contract', () => {
  test('do.md exists', () => {
    assert.ok(fs.existsSync(DO_PATH), 'get-shit-done/workflows/do.md missing');
  });

  const doc = fs.readFileSync(DO_PATH, 'utf8');

  test('routes all three built autonomous flows', () => {
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
