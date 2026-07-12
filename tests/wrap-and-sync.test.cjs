/**
 * GSD Tests - `wrap-and-sync` workflow contract
 *
 * Validates the wrap-and-sync workflow (W6, .planning/GSD-AUTONOMOUS-WORKFLOWS.md)
 * stays structurally sound: step ordering, the verbatim GATE 1 prompt text, the
 * review-pending sentinel check firing before the gate, no push before the gate,
 * every referenced repo file path resolving, and no reference to the excluded
 * `/gsd:finalize` primitive.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'wrap-and-sync.md');

// Generated/runtime artifacts the workflow references but does not ship as
// tracked repo files (created by the workflow's own steps, or ad hoc by an
// operator/other workflow). Excluded from the path-existence sweep below.
const RUNTIME_ARTIFACT_EXCEPTIONS = new Set([
  '.planning/CHECKPOINT.json',
  '.planning/reports/SESSION_REPORT.md',
]);

const GATE_PROMPT = 'Wrap ready: {files} ({drift summary}; lessons: {captured/exempt}). '
  + 'Commit and push? [Commit + push / Commit local only / Discard]';

describe('wrap-and-sync workflow contract', () => {
  test('workflow file exists at get-shit-done/workflows/wrap-and-sync.md', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/wrap-and-sync.md missing');
  });

  const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

  test('has purpose, process, and success_criteria sections', () => {
    assert.match(wf, /<purpose>[\s\S]+<\/purpose>/, 'purpose block missing');
    assert.match(wf, /<process>[\s\S]+<\/process>/, 'process block missing');
    assert.match(wf, /<success_criteria>[\s\S]+<\/success_criteria>/, 'success_criteria block missing');
  });

  test('steps run in contract order: coverage -> drift-check -> doc-update -> handoff -> lessons -> checkpoint -> gate', () => {
    const coverageIdx = wf.indexOf('npm run test:coverage');
    const driftIdx = wf.indexOf('check-doc-drift.cjs');
    const docUpdateIdx = wf.indexOf('every flagged numeric claim');
    const handoffIdx = wf.indexOf('Session Handoff');
    const lessonsIdx = wf.indexOf('tasks/lessons.md');
    const checkpointIdx = wf.indexOf('writeCheckpoint');
    const gateIdx = wf.indexOf('name="gate_approve_wrap"');

    for (const [label, idx] of [
      ['coverage', coverageIdx], ['drift', driftIdx], ['doc-update', docUpdateIdx],
      ['handoff', handoffIdx], ['lessons', lessonsIdx], ['checkpoint', checkpointIdx],
      ['gate', gateIdx],
    ]) {
      assert.ok(idx !== -1, `${label} marker not found in workflow`);
    }

    assert.ok(coverageIdx < driftIdx, 'coverage step must precede drift-check step');
    assert.ok(driftIdx < docUpdateIdx, 'drift-check must precede doc-update instructions');
    assert.ok(docUpdateIdx < handoffIdx, 'doc-update must precede STATE/todo handoff refresh');
    assert.ok(handoffIdx < lessonsIdx, 'handoff refresh must precede lessons check');
    assert.ok(lessonsIdx < checkpointIdx, 'lessons check must precede checkpoint write');
    assert.ok(checkpointIdx < gateIdx, 'checkpoint write must precede the gate');
  });

  test('session-report step is present and precedes the gate', () => {
    const reportIdx = wf.indexOf('get-shit-done/workflows/session-report.md');
    const gateIdx = wf.indexOf('name="gate_approve_wrap"');
    assert.ok(reportIdx !== -1, 'session-report workflow reference missing');
    assert.ok(reportIdx < gateIdx, 'session-report step must run before the gate');
  });

  test('carries the exact GATE 1 prompt text verbatim', () => {
    assert.ok(wf.includes(GATE_PROMPT), 'verbatim wrap-and-sync gate prompt text missing or altered');
  });

  test('gate offers exactly the three spec-defined options', () => {
    assert.match(wf, /label:\s*"Commit \+ push"/, '"Commit + push" option missing');
    assert.match(wf, /label:\s*"Commit local only"/, '"Commit local only" option missing');
    assert.match(wf, /label:\s*"Discard"/, '"Discard" option missing');
  });

  test('review-pending sentinel is checked before the gate and caps it at commit-local-only', () => {
    const sentinelIdx = wf.indexOf('.planning/.review-pending');
    const gateIdx = wf.indexOf('name="gate_approve_wrap"');
    assert.ok(sentinelIdx !== -1, 'sentinel path .planning/.review-pending not referenced');
    assert.ok(sentinelIdx < gateIdx, 'sentinel check must run before the gate step');
    assert.match(wf, /forced to \*\*Commit local only\*\*/, 'sentinel-forces-local-only ceiling wording missing');
  });

  test('nothing is added, committed, or pushed before the gate', () => {
    const gateIdx = wf.indexOf('name="gate_approve_wrap"');
    const gitPushIdx = wf.indexOf('git push');
    const gitCommitIdx = wf.indexOf('git commit');
    const gitAddIdx = wf.indexOf('git add');
    assert.ok(gitPushIdx > gateIdx, '"git push" must not appear before the gate');
    assert.ok(gitCommitIdx > gateIdx, '"git commit" must not appear before the gate');
    assert.ok(gitAddIdx > gateIdx, '"git add" must not appear before the gate');
  });

  test('a push, when it happens, never targets main directly', () => {
    assert.match(wf, /never `main`/, 'explicit never-push-to-main statement missing');
    const fencedBlocks = [...wf.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
    const inlineSpans = [...wf.matchAll(/`([^`\n]*git push[^`\n]*)`/g)].map((m) => m[1]);
    const pushLines = [...fencedBlocks.join('\n').split('\n'), ...inlineSpans]
      .filter((l) => /\bgit push\b/.test(l));
    assert.ok(pushLines.length > 0, 'no git push command found');
    for (const line of pushLines) {
      assert.ok(!/\bmain\b/.test(line), `git push command must not target main: ${line}`);
    }
  });

  test('replicates the unwired lesson-capture-gate.cjs contract explicitly', () => {
    assert.ok(wf.includes('.claude/hooks/lesson-capture-gate.cjs'), 'lesson-capture-gate.cjs reference missing');
    assert.match(wf, /never fires/, 'explanation that the hook never fires is missing');
  });

  test('does not reference the excluded /gsd:finalize primitive', () => {
    assert.ok(!wf.includes('/gsd:finalize'), 'wrap-and-sync must not reference /gsd:finalize');
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

  test('an error_handling section covers the coverage-failure and sentinel edge cases', () => {
    assert.match(wf, /<error_handling>[\s\S]+<\/error_handling>/, 'error_handling block missing');
  });
});
