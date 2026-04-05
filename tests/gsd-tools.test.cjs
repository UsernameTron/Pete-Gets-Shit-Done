/**
 * GSD Tools Tests - History CLI Commands (Plan 32-02)
 *
 * Integration tests for `gsd-tools history list|stats|prune` commands.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// Seed fixture data directly into JSONL to avoid import coupling
function seedHistory(tmpDir, count = 5) {
  const histDir = path.join(tmpDir, '.planning', 'history');
  fs.mkdirSync(histDir, { recursive: true });
  const lines = [];
  for (let i = 0; i < count; i++) {
    lines.push(JSON.stringify({
      timestamp: `2026-04-0${Math.min(i + 1, 9)}T10:00:00Z`,
      phase: 30 + Math.floor(i / 2),
      plan: (i % 2) + 1,
      agent: i % 2 === 0 ? 'gsd-executor' : 'gsd-planner',
      model_used: i % 2 === 0 ? 'sonnet' : 'haiku',
      duration_ms: (i + 1) * 5000,
      outcome: i < 3 ? 'pass' : 'fail',
      error_code: null,
      files_changed: i + 1,
    }));
  }
  fs.writeFileSync(path.join(histDir, 'executions.jsonl'), lines.join('\n') + '\n');
}

describe('history list command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    seedHistory(tmpDir, 5);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('history list --raw returns JSON array', () => {
    const result = runGsdTools(['history', 'list', '--raw'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.ok(Array.isArray(parsed), 'Output should be a JSON array');
    assert.strictEqual(parsed.length, 5);
  });

  test('history list without --raw returns table format', () => {
    const result = runGsdTools(['history', 'list'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    assert.ok(result.output.includes('Phase'), 'Should contain table header');
    assert.ok(result.output.includes('Outcome'), 'Should contain Outcome column');
  });
});

describe('history stats command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    seedHistory(tmpDir, 6);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('history stats --raw returns JSON', () => {
    const result = runGsdTools(['history', 'stats', '--raw'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.ok(typeof parsed.records_count === 'number', 'Should have records_count');
    assert.ok(parsed.patterns, 'Should have patterns');
  });
});

describe('history prune command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    seedHistory(tmpDir, 10);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('history prune --keep N --raw returns pruned/remaining counts', () => {
    const result = runGsdTools(['history', 'prune', '--keep', '3', '--raw'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.pruned, 7);
    assert.strictEqual(parsed.remaining, 3);

    // Verify file actually has 3 records
    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'history', 'executions.jsonl'),
      'utf8'
    );
    const lines = content.trim().split('\n');
    assert.strictEqual(lines.length, 3);
  });
});
