'use strict';
// Structural contract tests for the complete-milestone workflow's branch-handling step.
// Phase 60 (MERGE-01..04): protected main routes to a PR-merge path (gh pr merge --squash),
// unprotected main keeps the existing local merge flow behaviorally unchanged.
// Pattern follows tests/ship-milestone.test.cjs — read the markdown, slice the step,
// assert ordered markers and negatives. complete-milestone.md has no frontmatter.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const WF_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'complete-milestone.md');
const SHIP_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'ship-milestone.md');
const wf = fs.readFileSync(WF_PATH, 'utf8');
const shipWf = fs.readFileSync(SHIP_PATH, 'utf8');

// Slice the handle_branches step
const stepStart = wf.indexOf('<step name="handle_branches">');
const stepEnd = wf.indexOf('</step>', stepStart);
const step = wf.slice(stepStart, stepEnd);

describe('complete-milestone handle_branches structure', () => {
  test('handle_branches step exists', () => {
    assert.ok(stepStart !== -1, 'handle_branches step should exist');
    assert.ok(stepEnd > stepStart, 'handle_branches step should be closed');
  });

  test('detects branch protection before offering merge options', () => {
    const detectIdx = step.indexOf('--jq .protected');
    assert.ok(detectIdx !== -1, 'step should detect protection via gh api ... --jq .protected');
    const firstPrompt = step.indexOf('AskUserQuestion');
    assert.ok(firstPrompt !== -1, 'step should hold an AskUserQuestion');
    assert.ok(detectIdx < firstPrompt, 'protection detection must precede the options prompt');
  });

  test('detection degrades to the local path when gh is unavailable', () => {
    assert.match(step, /\|\|\s*echo\s+"false"/, 'gh failure must default PROTECTED to false (existing behavior)');
  });
});

describe('protected-main decision (MERGE-01)', () => {
  test('protected arm exists and is gated on PROTECTED=true', () => {
    assert.ok(step.includes('If `PROTECTED` is `true`'), 'protected arm conditional missing');
  });

  test('PR-merge path markers appear in order', () => {
    const protArm = step.slice(step.indexOf('If `PROTECTED` is `true`'), step.indexOf('If `PROTECTED` is `false`'));
    const markers = [
      'git push -u origin',
      'gh pr create',
      '--base main',
      'gh pr checks',
      '--watch',
      'gh pr merge',
      '--squash',
      'git ls-remote --heads',
    ];
    let prev = -1;
    for (const m of markers) {
      const idx = protArm.indexOf(m);
      assert.ok(idx !== -1, `protected arm missing marker: ${m}`);
      assert.ok(idx > prev, `marker out of order: ${m}`);
      prev = idx;
    }
  });

  test('local main is synced after the PR merge', () => {
    const protArm = step.slice(step.indexOf('If `PROTECTED` is `true`'), step.indexOf('If `PROTECTED` is `false`'));
    assert.ok(
      protArm.includes('git fetch origin main:main') || protArm.includes('git pull --ff-only'),
      'protected arm should sync local main after merge'
    );
  });
});

describe('unprotected-main decision (MERGE-02)', () => {
  test('unprotected arm is gated on PROTECTED=false', () => {
    assert.ok(step.includes('If `PROTECTED` is `false`'), 'unprotected arm conditional missing');
  });

  test('existing local merge blocks survive unchanged', () => {
    const localArm = step.slice(step.indexOf('If `PROTECTED` is `false`'));
    const survivors = [
      'git merge --squash',
      'git merge --no-ff --no-commit',
      'git checkout main',
      'git reset HEAD .planning/',
      'git branch -d',
    ];
    for (const s of survivors) {
      assert.ok(localArm.includes(s), `unprotected arm lost existing behavior: ${s}`);
    }
  });

  test('unprotected arm keeps all four options', () => {
    const localArm = step.slice(step.indexOf('If `PROTECTED` is `false`'));
    assert.match(localArm, /Squash merge \(Recommended\), Merge with history, Delete without merging, Keep branches/,
      'unprotected option set must stay: squash/history/delete/keep');
  });
});

describe('gate parity and negatives', () => {
  test('exactly one AskUserQuestion per arm — branch handling stays a single live prompt at runtime', () => {
    const protArm = step.slice(step.indexOf('If `PROTECTED` is `true`'), step.indexOf('If `PROTECTED` is `false`'));
    const localArm = step.slice(step.indexOf('If `PROTECTED` is `false`'));
    assert.strictEqual((protArm.match(/AskUserQuestion/g) || []).length, 1, 'protected arm must hold exactly one prompt');
    assert.strictEqual((localArm.match(/AskUserQuestion/g) || []).length, 1, 'unprotected arm must hold exactly one prompt');
  });

  test('never bypasses protection or auto-answers', () => {
    assert.ok(!wf.includes('--admin'), 'workflow must never use gh --admin to bypass protection');
    assert.ok(!/gh pr merge[^\n]*(--auto|--yes)/.test(step), 'PR merge must not carry auto-approval flags');
  });
});

describe('ship-milestone inherits via delegation (MERGE-03)', () => {
  test('ship-milestone contains no merge logic of its own', () => {
    assert.ok(!shipWf.includes('git merge'), 'ship-milestone must not run git merge directly');
    assert.ok(!shipWf.includes('gh pr create'), 'ship-milestone must not create PRs directly');
    assert.ok(!/^\s*gh pr merge/m.test(shipWf), 'ship-milestone must not merge PRs directly');
  });

  test('ship-milestone still delegates with no pre-answers', () => {
    assert.ok(shipWf.includes('Skill(skill="gsd:complete-milestone"'), 'delegation Skill call missing');
    assert.ok(shipWf.includes('passes no'), 'no-pre-answers contract language missing');
  });
});
