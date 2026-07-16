/**
 * Workflow destructive-git contract tests (fixes 4 & 5).
 *
 * Autonomous workflows must never destroy uncommitted or unmerged work without
 * an explicit gate. These greps assert the two fixed workflows keep destructive
 * git behind a print-or-confirm gate rather than running it automatically.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const WORKFLOWS = path.join(__dirname, '..', 'get-shit-done', 'workflows');

describe('bug-to-branch.md — no automatic reset --hard on suite failure (fix 4)', () => {
  const md = fs.readFileSync(path.join(WORKFLOWS, 'bug-to-branch.md'), 'utf8');

  test('does not instruct an automatic revert', () => {
    assert.ok(!/auto-revert with `git reset --hard/.test(md), 'must not auto-revert on suite failure');
  });

  test('prints the rollback command without executing it', () => {
    assert.ok(/without executing it/.test(md), 'suite-failure path must print the rollback command, not run it');
  });
});

describe('complete-milestone.md — no silent -d→-D force escalation (fix 5)', () => {
  const md = fs.readFileSync(path.join(WORKFLOWS, 'complete-milestone.md'), 'utf8');

  test('does not silently escalate a failed safe-delete to force-delete', () => {
    // The `git branch -d ... || git branch -D ...` one-liner discarded unmerged
    // commits with no distinct consent.
    assert.ok(
      !/branch -d "[^"]+"\s*2>\/dev\/null\s*\|\|\s*git branch -D/.test(md),
      'must not chain -d || -D to force-delete unmerged branches automatically'
    );
  });

  test('requires explicit confirmation before any force-delete', () => {
    assert.ok(/force-delete/i.test(md), 'must surface force-delete as an explicit, gated choice');
  });
});
