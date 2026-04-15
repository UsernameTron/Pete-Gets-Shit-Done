'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runHook } = require('./hook-helpers.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'hooks', 'gsd-cost-tracker.js');

function makeTmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-cost-test-'));
}

function metricsFile(tmpHome) {
  return path.join(tmpHome, '.claude', 'metrics', 'costs.jsonl');
}

function cleanupTmpHome(tmpHome) {
  fs.rmSync(tmpHome, { recursive: true, force: true });
}

describe('gsd-cost-tracker hook', () => {
  describe('valid usage data', () => {
    let tmpHome;
    let result;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        session_id: 'test-session-123',
        model: 'claude-sonnet-4-5-20250929',
        usage: { input_tokens: 1000, output_tokens: 500 },
      };
      result = runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const metricsPath = metricsFile(tmpHome);
      if (fs.existsSync(metricsPath)) {
        const line = fs.readFileSync(metricsPath, 'utf8').trim();
        row = JSON.parse(line);
      }
    });

    after(() => cleanupTmpHome(tmpHome));

    it('exits 0', () => {
      assert.equal(result.exitCode, 0);
    });

    it('creates costs.jsonl with valid JSONL row', () => {
      assert.ok(row, 'costs.jsonl should exist and contain a row');
    });

    it('row contains timestamp field', () => {
      assert.ok(row.timestamp, 'row must have timestamp');
      assert.ok(!isNaN(Date.parse(row.timestamp)), 'timestamp must be ISO date');
    });

    it('row contains session_id field', () => {
      assert.ok('session_id' in row, 'row must have session_id');
    });

    it('row contains model field', () => {
      assert.ok(row.model, 'row must have model');
    });

    it('row contains input_tokens field', () => {
      assert.equal(row.input_tokens, 1000);
    });

    it('row contains output_tokens field', () => {
      assert.equal(row.output_tokens, 500);
    });

    it('row contains estimated_cost_usd field', () => {
      assert.ok('estimated_cost_usd' in row, 'row must have estimated_cost_usd');
    });

    it('estimated_cost_usd is positive for non-zero token counts', () => {
      assert.ok(row.estimated_cost_usd > 0, `expected positive cost, got ${row.estimated_cost_usd}`);
    });
  });

  describe('zero tokens', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        model: 'claude-sonnet-4-5-20250929',
        usage: { input_tokens: 0, output_tokens: 0 },
      };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const metricsPath = metricsFile(tmpHome);
      if (fs.existsSync(metricsPath)) {
        const line = fs.readFileSync(metricsPath, 'utf8').trim();
        row = JSON.parse(line);
      }
    });

    after(() => cleanupTmpHome(tmpHome));

    it('estimated_cost_usd is 0 when tokens are 0', () => {
      assert.ok(row, 'should have a row');
      assert.equal(row.estimated_cost_usd, 0);
    });
  });

  describe('metrics directory creation', () => {
    let tmpHome;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        model: 'claude-haiku-4-5-20251001',
        usage: { input_tokens: 100, output_tokens: 50 },
      };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
    });

    after(() => cleanupTmpHome(tmpHome));

    it('creates ~/.claude/metrics/ directory if missing (no error)', () => {
      const dir = path.join(tmpHome, '.claude', 'metrics');
      assert.ok(fs.existsSync(dir), 'metrics dir must be created');
    });

    it('creates costs.jsonl inside the metrics directory', () => {
      assert.ok(fs.existsSync(metricsFile(tmpHome)), 'costs.jsonl must exist');
    });
  });

  describe('empty stdin', () => {
    let result;

    before(() => {
      result = runHook(HOOK_PATH, '');
    });

    it('handles empty stdin gracefully (exit 0, no crash)', () => {
      assert.equal(result.exitCode, 0);
    });
  });

  describe('invalid JSON stdin', () => {
    let result;

    before(() => {
      result = runHook(HOOK_PATH, 'not-valid-json!!!');
    });

    it('handles invalid JSON stdin gracefully (exit 0, no crash)', () => {
      assert.equal(result.exitCode, 0);
    });
  });

  describe('missing usage fields', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      // No usage field at all
      const input = { model: 'claude-sonnet-4-5-20250929' };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const metricsPath = metricsFile(tmpHome);
      if (fs.existsSync(metricsPath)) {
        const line = fs.readFileSync(metricsPath, 'utf8').trim();
        row = JSON.parse(line);
      }
    });

    after(() => cleanupTmpHome(tmpHome));

    it('handles missing usage fields (defaults to 0 tokens)', () => {
      assert.ok(row, 'should have a row even without usage');
      assert.equal(row.input_tokens, 0);
      assert.equal(row.output_tokens, 0);
    });
  });

  describe('haiku pricing tier', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        model: 'claude-haiku-4-5-20251001',
        usage: { input_tokens: 1000000, output_tokens: 0 },
      };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const metricsPath = metricsFile(tmpHome);
      if (fs.existsSync(metricsPath)) {
        const line = fs.readFileSync(metricsPath, 'utf8').trim();
        row = JSON.parse(line);
      }
    });

    after(() => cleanupTmpHome(tmpHome));

    it('recognizes haiku model name and uses lower pricing tier', () => {
      assert.ok(row, 'should have a row');
      // Haiku: 1M input tokens at $0.8/1M = $0.8
      assert.ok(
        Math.abs(row.estimated_cost_usd - 0.8) < 0.01,
        `expected ~0.8, got ${row.estimated_cost_usd}`
      );
    });
  });

  describe('opus pricing tier', () => {
    let tmpHome;
    let row;

    before(() => {
      tmpHome = makeTmpHome();
      const input = {
        model: 'claude-opus-4-5-20251101',
        usage: { input_tokens: 1000000, output_tokens: 0 },
      };
      runHook(HOOK_PATH, input, { env: { HOME: tmpHome, USERPROFILE: tmpHome } });
      const metricsPath = metricsFile(tmpHome);
      if (fs.existsSync(metricsPath)) {
        const line = fs.readFileSync(metricsPath, 'utf8').trim();
        row = JSON.parse(line);
      }
    });

    after(() => cleanupTmpHome(tmpHome));

    it('recognizes opus model name and uses higher pricing tier', () => {
      assert.ok(row, 'should have a row');
      // Opus: 1M input tokens at $15.0/1M = $15.0
      assert.ok(
        Math.abs(row.estimated_cost_usd - 15.0) < 0.01,
        `expected ~15.0, got ${row.estimated_cost_usd}`
      );
    });
  });
});
