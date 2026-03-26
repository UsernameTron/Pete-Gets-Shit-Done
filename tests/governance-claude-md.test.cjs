/**
 * GSD Tools Tests - Governance CLAUDE.md Template
 *
 * Validates the rewritten global CLAUDE.md template is free of legacy
 * references and properly references GSD commands.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CLAUDE_MD_PATH = path.join(__dirname, '..', 'governance', 'templates', 'global', 'CLAUDE.md');

describe('governance CLAUDE.md template', () => {
  let content;
  let lines;

  test('file exists and is readable', () => {
    assert.ok(fs.existsSync(CLAUDE_MD_PATH), 'CLAUDE.md template should exist');
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
    lines = content.split('\n');
    assert.ok(content.length > 0, 'File should not be empty');
  });

  test('zero references to legacy agent-teams concepts', () => {
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');

    const forbidden = [
      'Agent Teams',
      'superpowers:brainstorm',
      'superpowers:writing-plans',
      'superpowers:executing',
      'Feature Agent',
      'Quality Agent',
      'Merger Agent',
      '10-step',
    ];

    for (const term of forbidden) {
      assert.ok(
        !content.includes(term),
        `Should not contain legacy reference: "${term}"`
      );
    }
  });

  test('10+ references to "gsd"', () => {
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
    const matches = content.match(/gsd/gi);
    const count = matches ? matches.length : 0;
    assert.ok(
      count >= 10,
      `Should have at least 10 references to "gsd", found ${count}`
    );
  });

  test('line count under 500', () => {
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
    lines = content.split('\n');
    assert.ok(
      lines.length < 500,
      `CLAUDE.md should be under 500 lines, found ${lines.length}`
    );
  });

  test('references to GSD commands', () => {
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');

    const requiredCommands = [
      '/gsd:discuss-phase',
      '/gsd:plan-phase',
      '/gsd:execute-phase',
      '/gsd:verify-work',
      '/gsd:ship',
    ];

    for (const cmd of requiredCommands) {
      assert.ok(
        content.includes(cmd),
        `Should reference command: ${cmd}`
      );
    }
  });
});
