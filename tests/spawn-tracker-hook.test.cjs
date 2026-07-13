'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runHook } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-spawn-tracker.js');

function makeTmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-spawn-test-'));
}

function ledgerFile(tmpHome) {
  return path.join(tmpHome, '.claude', 'metrics', 'spawns.jsonl');
}

function cleanupTmpHome(tmpHome) {
  fs.rmSync(tmpHome, { recursive: true, force: true });
}

describe('gsd-spawn-tracker hook', () => {
  describe('Task spawn', () => {
    let tmpHome;
    let result;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        tool_name: 'Task',
        tool_input: { subagent_type: 'gsd-verifier', description: 'verify phase 3' },
      };
      result = runHook(HOOK_PATH, input, {
        env: { HOME: tmpHome, USERPROFILE: tmpHome, CLAUDE_SESSION_ID: 'sess-1' },
      });
      const p = ledgerFile(tmpHome);
      if (fs.existsSync(p)) row = JSON.parse(fs.readFileSync(p, 'utf8').trim());
    });

    after(() => cleanupTmpHome(tmpHome));

    it('exits 0', () => assert.equal(result.exitCode, 0));
    it('creates spawns.jsonl with a valid row', () => assert.ok(row, 'spawns.jsonl should contain a row'));
    it('row has ISO timestamp', () => {
      assert.ok(row.timestamp, 'row must have timestamp');
      assert.ok(!isNaN(Date.parse(row.timestamp)), 'timestamp must be ISO date');
    });
    it('records the subagent_type', () => assert.equal(row.subagent_type, 'gsd-verifier'));
    it('records the session_id from env', () => assert.equal(row.session_id, 'sess-1'));
    it('records the tool name', () => assert.equal(row.tool, 'Task'));
    it('records the (truncated) description', () => assert.equal(row.description, 'verify phase 3'));
  });

  describe('Agent tool alias', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = { tool_name: 'Agent', tool_input: { subagent_type: 'gsd-planner' } };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const p = ledgerFile(tmpHome);
      if (fs.existsSync(p)) row = JSON.parse(fs.readFileSync(p, 'utf8').trim());
    });

    after(() => cleanupTmpHome(tmpHome));

    it('also tracks the Agent tool name', () => {
      assert.ok(row, 'should have a row');
      assert.equal(row.subagent_type, 'gsd-planner');
      assert.equal(row.tool, 'Agent');
    });

    it('defaults session_id to "default" when env unset', () => assert.equal(row.session_id, 'default'));
  });

  describe('missing subagent_type', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = { tool_name: 'Task', tool_input: {} };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const p = ledgerFile(tmpHome);
      if (fs.existsSync(p)) row = JSON.parse(fs.readFileSync(p, 'utf8').trim());
    });

    after(() => cleanupTmpHome(tmpHome));

    it('defaults subagent_type to "unknown"', () => {
      assert.ok(row, 'should have a row even without subagent_type');
      assert.equal(row.subagent_type, 'unknown');
      assert.equal(row.description, '');
    });
  });

  describe('non-spawn tool', () => {
    let tmpHome;
    let result;

    before(() => {
      tmpHome = makeTmpHome();
      const input = { tool_name: 'Bash', tool_input: { command: 'ls' } };
      result = runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
    });

    after(() => cleanupTmpHome(tmpHome));

    it('is a no-op for non-spawn tools (exit 0, no ledger written)', () => {
      assert.equal(result.exitCode, 0);
      assert.ok(!fs.existsSync(ledgerFile(tmpHome)), 'no ledger should be written for Bash');
    });
  });

  describe('metrics directory creation', () => {
    let tmpHome;

    before(() => {
      tmpHome = makeTmpHome();
      runHook(HOOK_PATH, { tool_name: 'Task', tool_input: { subagent_type: 'gsd-executor' } },
        { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
    });

    after(() => cleanupTmpHome(tmpHome));

    it('creates ~/.claude/metrics/ if missing', () => {
      assert.ok(fs.existsSync(path.join(tmpHome, '.claude', 'metrics')), 'metrics dir must be created');
    });
  });

  describe('append semantics', () => {
    let tmpHome;
    let lines;

    before(() => {
      tmpHome = makeTmpHome();
      const opts = { env: { HOME: tmpHome, USERPROFILE: tmpHome } };
      runHook(HOOK_PATH, { tool_name: 'Task', tool_input: { subagent_type: 'gsd-planner' } }, opts);
      runHook(HOOK_PATH, { tool_name: 'Task', tool_input: { subagent_type: 'gsd-verifier' } }, opts);
      lines = fs.readFileSync(ledgerFile(tmpHome), 'utf8').trim().split('\n');
    });

    after(() => cleanupTmpHome(tmpHome));

    it('appends one JSONL row per spawn', () => {
      assert.equal(lines.length, 2);
      assert.equal(JSON.parse(lines[0]).subagent_type, 'gsd-planner');
      assert.equal(JSON.parse(lines[1]).subagent_type, 'gsd-verifier');
    });
  });

  describe('long description truncation', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = { tool_name: 'Task', tool_input: { subagent_type: 'gsd-executor', description: 'x'.repeat(500) } };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const p = ledgerFile(tmpHome);
      if (fs.existsSync(p)) row = JSON.parse(fs.readFileSync(p, 'utf8').trim());
    });

    after(() => cleanupTmpHome(tmpHome));

    it('truncates description to 200 chars', () => {
      assert.ok(row);
      assert.equal(row.description.length, 200);
    });
  });

  describe('empty stdin', () => {
    let result;
    before(() => { result = runHook(HOOK_PATH, ''); });
    it('handles empty stdin gracefully (exit 0, no crash)', () => assert.equal(result.exitCode, 0));
  });

  describe('invalid JSON stdin', () => {
    let result;
    before(() => { result = runHook(HOOK_PATH, 'not-valid-json!!!'); });
    it('handles invalid JSON stdin gracefully (exit 0, no crash)', () => assert.equal(result.exitCode, 0));
  });
});
