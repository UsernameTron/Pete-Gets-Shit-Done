/**
 * GSD Tools Tests - Governance Hooks JSON
 *
 * Validates the governance hooks template is well-formed and contains
 * the expected hook structure.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const HOOKS_PATH = path.join(__dirname, '..', 'governance', 'templates', 'global', 'settings-hooks.json');

describe('governance settings-hooks.json', () => {
  let content;
  let parsed;

  test('file exists and is valid JSON', () => {
    assert.ok(fs.existsSync(HOOKS_PATH), 'settings-hooks.json should exist');
    content = fs.readFileSync(HOOKS_PATH, 'utf8');
    parsed = JSON.parse(content); // throws if invalid
    assert.ok(parsed.hooks, 'Should have a top-level hooks key');
  });

  test('has 10 hooks across 5 event types', () => {
    content = fs.readFileSync(HOOKS_PATH, 'utf8');
    parsed = JSON.parse(content);

    const expectedEvents = ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop', 'PreCompact'];
    for (const event of expectedEvents) {
      assert.ok(parsed.hooks[event], `Should have ${event} hooks`);
    }

    // Count total hooks (each entry in the array counts as one hook)
    let totalHooks = 0;
    for (const [, entries] of Object.entries(parsed.hooks)) {
      totalHooks += entries.length;
    }
    assert.strictEqual(totalHooks, 10, `Should have 10 hooks total, found ${totalHooks}`);
  });

  test('.planning/ references exist in SessionStart and Stop hooks', () => {
    content = fs.readFileSync(HOOKS_PATH, 'utf8');
    parsed = JSON.parse(content);

    // SessionStart should reference .planning
    const sessionStartCmds = parsed.hooks.SessionStart
      .flatMap(e => (e.hooks || []).map(h => h.command || ''));
    const hasSessionStartPlanning = sessionStartCmds.some(cmd => cmd.includes('.planning'));
    assert.ok(hasSessionStartPlanning, 'SessionStart hooks should reference .planning/');

    // Stop should reference .planning
    const stopCmds = parsed.hooks.Stop
      .flatMap(e => (e.hooks || []).map(h => h.command || ''));
    const hasStopPlanning = stopCmds.some(cmd => cmd.includes('.planning'));
    assert.ok(hasStopPlanning, 'Stop hooks should reference .planning/');
  });

  test('Stop hook adds the review-pending sentinel branch without dropping the dirty-tree block', () => {
    content = fs.readFileSync(HOOKS_PATH, 'utf8');
    parsed = JSON.parse(content);
    const stopCmd = parsed.hooks.Stop
      .flatMap(e => (e.hooks || []).map(h => h.command || ''))
      .join('\n');
    // Sentinel branch added: dirty tree + sentinel present -> approve with a Deferred-review note.
    assert.ok(stopCmd.includes('.planning/.review-pending'), 'Stop hook must check the review-pending sentinel');
    assert.ok(stopCmd.includes('Deferred review'), 'Stop hook must approve deferred review with a logged note');
    // Block branch retained: dirty tree without sentinel still blocks with exit 2.
    assert.ok(stopCmd.includes('exit 2'), 'Stop hook must retain the dirty-tree block (exit 2) branch');
  });

  test('no Apex content anywhere in the file', () => {
    content = fs.readFileSync(HOOKS_PATH, 'utf8');
    const apexPatterns = [
      'Apex',
      'apex',
      'IntelliSense Provider Network',
    ];
    for (const pattern of apexPatterns) {
      assert.ok(
        !content.includes(pattern),
        `Should not contain Apex reference: "${pattern}"`
      );
    }
  });
});
