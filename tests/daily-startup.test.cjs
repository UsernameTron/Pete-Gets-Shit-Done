/**
 * GSD Tests - `daily-startup` workflow contract
 *
 * Validates the daily-startup workflow (W1, .planning/GSD-AUTONOMOUS-WORKFLOWS.md) stays
 * structurally sound: read-only end to end, zero gates, step ordering (prime -> dashboard ->
 * conditional context restore -> route), the sole write is state/pattern-context.md, the
 * conditional restore never invokes resume-project.md's interactive menu, stale checkpoints
 * (>24h) are flagged rather than deleted, and every referenced repo file path resolves.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'daily-startup.md');

// Generated/runtime artifacts the workflow references but does not ship as tracked repo
// files (created by prime-patterns or by a prior session's checkpoint/handoff, not guaranteed
// present on a fresh clone). Excluded from the path-existence sweep below.
const RUNTIME_ARTIFACT_EXCEPTIONS = new Set([
  '.planning/CHECKPOINT.json',
  '.planning/HANDOFF.json',
  'state/pattern-context.md',
]);

describe('daily-startup workflow contract', () => {
  test('workflow file exists at get-shit-done/workflows/daily-startup.md', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/daily-startup.md missing');
  });

  const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

  test('has purpose, process, error_handling, and success_criteria sections', () => {
    assert.match(wf, /<purpose>[\s\S]+<\/purpose>/, 'purpose block missing');
    assert.match(wf, /<process>[\s\S]+<\/process>/, 'process block missing');
    assert.match(wf, /<error_handling>[\s\S]+<\/error_handling>/, 'error_handling block missing');
    assert.match(wf, /<success_criteria>[\s\S]+<\/success_criteria>/, 'success_criteria block missing');
  });

  test('steps run in contract order: prime -> dashboard -> conditional restore -> route', () => {
    const primeIdx = wf.indexOf('name="prime"');
    const dashboardIdx = wf.indexOf('name="dashboard"');
    const restoreIdx = wf.indexOf('name="conditional_context_restore"');
    const routeIdx = wf.indexOf('name="route"');

    for (const [label, idx] of [
      ['prime', primeIdx], ['dashboard', dashboardIdx],
      ['conditional_context_restore', restoreIdx], ['route', routeIdx],
    ]) {
      assert.ok(idx !== -1, `${label} step marker not found in workflow`);
    }

    assert.ok(primeIdx < dashboardIdx, 'prime step must precede dashboard step');
    assert.ok(dashboardIdx < restoreIdx, 'dashboard step must precede conditional_context_restore step');
    assert.ok(restoreIdx < routeIdx, 'conditional_context_restore step must precede route step');
  });

  test('declares zero gates and read-only end to end', () => {
    assert.match(wf, /zero gates/i, 'zero-gates claim missing');
    assert.match(wf, /read-only/i, 'read-only claim missing');
  });

  test('never uses AskUserQuestion (this workflow never gates or offers a menu)', () => {
    assert.ok(!wf.includes('AskUserQuestion'), 'daily-startup must not reference AskUserQuestion');
  });

  test('never adds, commits, or pushes anything (fully read-only)', () => {
    assert.ok(!/\bgit add\b/.test(wf), 'daily-startup must not reference git add');
    assert.ok(!/\bgit commit\b/.test(wf), 'daily-startup must not reference git commit');
    assert.ok(!/\bgit push\b/.test(wf), 'daily-startup must not reference git push');
  });

  test('the only described write is state/pattern-context.md, and it is idempotent', () => {
    assert.ok(wf.includes('state/pattern-context.md'), 'state/pattern-context.md not referenced');
    assert.match(wf, /only write/i, 'explicit "only write" framing missing');
    assert.match(wf, /idempotent/i, 'idempotent-overwrite framing missing');
  });

  test('conditional restore routes to resume-project.md, not the nonexistent resume-work.md workflow file', () => {
    assert.ok(wf.includes('resume-project.md'), 'resume-project.md not referenced');
    assert.ok(!wf.includes('workflows/resume-work.md'), 'must not reference nonexistent workflows/resume-work.md');
  });

  test('conditional restore never invokes the interactive offer_options menu', () => {
    assert.match(wf, /do not run|never (invoke|run)/i, 'explicit skip-the-menu instruction missing');
    assert.ok(wf.includes('offer_options'), 'offer_options step must be named as the thing being skipped');
  });

  test('stale checkpoint (>24h) is flagged, never auto-deleted', () => {
    assert.match(wf, /24\s*h/i, 'stale->24h threshold not referenced');
    assert.match(wf, /stale/i, 'stale-checkpoint handling not referenced');
    assert.match(wf, /never auto-delete/i, 'never-auto-delete guarantee missing');
  });

  test('references the daily.cjs dashboard functions by name', () => {
    for (const fn of ['gatherDailyState', 'determineNextAction', 'formatDashboard']) {
      assert.ok(wf.includes(fn), `${fn} not referenced`);
    }
  });

  test('conditional restore only runs when CHECKPOINT.json or HANDOFF.json is present', () => {
    assert.ok(wf.includes('.planning/CHECKPOINT.json'), '.planning/CHECKPOINT.json not referenced');
    assert.ok(wf.includes('.planning/HANDOFF.json'), '.planning/HANDOFF.json not referenced');
  });

  test('every repo file path referenced in inline code spans resolves on disk', () => {
    const stripped = wf.replace(/```[\s\S]*?```/g, '');
    const spans = [...stripped.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    const pathLike = [...new Set(
      spans.filter((s) => /\.(md|cjs|js|json)$/.test(s) && !s.includes('*') && !s.includes('{')),
    )];

    assert.ok(pathLike.length >= 8, `expected several path-like code spans, found ${pathLike.length}`);

    for (const raw of pathLike) {
      const normalized = raw.replace(/^@?~\/\.claude\//, '').replace(/^\$HOME\/\.claude\//, '');
      if (RUNTIME_ARTIFACT_EXCEPTIONS.has(normalized)) continue;
      const resolved = path.join(ROOT, normalized);
      assert.ok(fs.existsSync(resolved), `referenced path does not exist: ${normalized} (from \`${raw}\`)`);
    }
  });
});
