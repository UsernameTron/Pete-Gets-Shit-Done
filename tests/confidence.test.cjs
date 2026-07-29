/**
 * GSD Tests - `confidence` workflow contract
 *
 * Validates the /gsd:confidence workflow stays structurally sound: leg ordering,
 * the verbatim ship-gate prompt text, the single-gate invariant (no gate before
 * the scorecard, nothing irreversible before the gate), the --dry-run and
 * --yes-ship contracts, argv-safe cleanliness bash, and every referenced repo
 * file path resolving on disk. Mirrors tests/wrap-and-sync.test.cjs.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'confidence.md');
const COMMAND_PATH = path.join(ROOT, 'commands', 'gsd', 'confidence.md');

// Generated/runtime artifacts the workflow references but does not ship as
// tracked repo files (created by the workflow's own steps at run time).
const RUNTIME_ARTIFACT_EXCEPTIONS = new Set([
  '.planning/CONFIDENCE.md',
  '.planning/QUALITY-SWEEP.md',
  '.planning/MILESTONES.md',
  'installed_plugins.json',
]);

const GATE_PROMPT = 'Confidence: {verdict} ({score}). Ship now via finalize, fix the {n} findings first, or stop?';

describe('confidence workflow contract', () => {
  test('workflow file exists at get-shit-done/workflows/confidence.md', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/confidence.md missing');
  });

  test('command file exists and references the workflow', () => {
    assert.ok(fs.existsSync(COMMAND_PATH), 'commands/gsd/confidence.md missing');
    const cmd = fs.readFileSync(COMMAND_PATH, 'utf8');
    assert.match(cmd, /^name: gsd:confidence$/m, 'command frontmatter name missing');
    assert.ok(cmd.includes('@~/.claude/get-shit-done/workflows/confidence.md'),
      'command must @-reference the confidence workflow');
  });

  const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

  test('has purpose, process, error_handling, critical_rules, and success_criteria sections', () => {
    assert.match(wf, /<purpose>[\s\S]+<\/purpose>/, 'purpose block missing');
    assert.match(wf, /<process>[\s\S]+<\/process>/, 'process block missing');
    assert.match(wf, /<error_handling>[\s\S]+<\/error_handling>/, 'error_handling block missing');
    assert.match(wf, /<critical_rules>[\s\S]+<\/critical_rules>/, 'critical_rules block missing');
    assert.match(wf, /<success_criteria>[\s\S]+<\/success_criteria>/, 'success_criteria block missing');
  });

  test('legs run in contract order: init -> health -> quality-sweep -> build-verify -> map -> docs -> cleanliness -> scorecard -> gate', () => {
    const markers = [
      ['init', wf.indexOf('name="init"')],
      ['leg 1 health', wf.indexOf('name="leg_1_health"')],
      ['leg 2 quality-sweep', wf.indexOf('name="leg_2_quality_sweep"')],
      ['leg 3 build-verify', wf.indexOf('name="leg_3_build_verify"')],
      ['leg 4 map refresh', wf.indexOf('name="leg_4_map_refresh"')],
      ['leg 5 doc sync', wf.indexOf('name="leg_5_doc_sync"')],
      ['leg 6 cleanliness', wf.indexOf('name="leg_6_repo_cleanliness"')],
      ['leg 7 scorecard', wf.indexOf('name="leg_7_scorecard"')],
      ['ship gate', wf.indexOf('name="ship_gate"')],
    ];
    for (const [label, idx] of markers) {
      assert.ok(idx !== -1, `${label} step marker not found`);
    }
    for (let i = 1; i < markers.length; i++) {
      assert.ok(markers[i - 1][1] < markers[i][1],
        `${markers[i - 1][0]} must precede ${markers[i][0]}`);
    }
  });

  test('leg 3 delegates to the shared build-verification reference', () => {
    const leg3 = wf.slice(wf.indexOf('name="leg_3_build_verify"'), wf.indexOf('name="leg_4_map_refresh"'));
    assert.ok(leg3.includes('references/build-verification.md'),
      'leg 3 must reference the shared build-verification procedure');
    assert.ok(fs.existsSync(path.join(ROOT, 'get-shit-done', 'references', 'build-verification.md')),
      'shared build-verification.md reference missing from repo');
  });

  test('carries the exact ship-gate prompt text verbatim', () => {
    assert.ok(wf.includes(GATE_PROMPT), 'verbatim ship-gate prompt text missing or altered');
  });

  test('gate offers exactly the three spec-defined options', () => {
    assert.match(wf, /\*\*Ship\*\* \/ \*\*Fix-first\*\* \/ \*\*Stop\*\*/,
      'Ship / Fix-first / Stop options missing');
  });

  test('the ship gate is the only gate, and it comes after the scorecard', () => {
    const gateMatches = [...wf.matchAll(/name="([^"]*gate[^"]*)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(gateMatches, ['ship_gate'], 'exactly one gate step allowed');
    assert.ok(wf.indexOf('name="leg_7_scorecard"') < wf.indexOf('name="ship_gate"'),
      'scorecard must be written before the gate fires');
  });

  test('nothing pushes, tags, or archives before the gate', () => {
    const gateIdx = wf.indexOf('name="ship_gate"');
    const preGate = wf.slice(0, gateIdx);
    assert.ok(!/\bgit push\b/.test(preGate), '"git push" must not appear before the ship gate');
    assert.ok(!/\bgit tag\b/.test(preGate), '"git tag" must not appear before the ship gate');
    // The dry-run leg plan *describes* the finalize step; only the invocation
    // syntax Skill(skill="gsd:finalize"...) counts as invoking it.
    assert.ok(!/Skill\(skill="gsd:finalize"/.test(preGate),
      'finalize must not be invoked before the ship gate');
  });

  test('--yes-ship never overrides FIX-FIRST or BLOCKED', () => {
    assert.match(wf, /pre-approves ONLY when verdict is SHIP-READY/,
      'SHIP-READY-only pre-approval wording missing');
    assert.match(wf, /FIX-FIRST\s+and BLOCKED always stop at the gate/,
      'FIX-FIRST/BLOCKED always-stop wording missing');
    assert.match(wf, /`--yes-ship` never overrides FIX-FIRST or BLOCKED/,
      'critical rule for --yes-ship missing');
  });

  test('--dry-run is a zero-mutation contract', () => {
    assert.match(wf, /zero Skill\(\) calls, zero mutation/i, 'dry-run zero-mutation wording missing');
    assert.match(wf, /`--dry-run` makes zero Skill\(\) calls and zero mutations\. Hard contract\./,
      'dry-run critical rule missing');
  });

  test('scorecard verdicts are the three deterministic values', () => {
    for (const verdict of ['SHIP-READY', 'FIX-FIRST', 'BLOCKED']) {
      assert.ok(wf.includes(verdict), `verdict ${verdict} missing`);
    }
    assert.match(wf, /deterministic, no judgment calls/, 'deterministic verdict-rules wording missing');
  });

  test('ship step verifies finalize post-conditions in bash', () => {
    const shipSection = wf.slice(wf.indexOf('name="ship_gate"'));
    assert.match(shipSection, /git status --porcelain/, 'git-clean post-condition missing');
    assert.match(shipSection, /unpushed/, 'unpushed-commits post-condition missing');
  });

  test('cleanliness bash is argv-safe: no filename interpolated into a shell string', () => {
    const fencedBlocks = [...wf.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]);
    const bash = fencedBlocks.join('\n');
    assert.ok(!/xargs[^|\n]*-I\s*\{\}[^|\n]*sh -c/.test(bash),
      'xargs -I{} sh -c interpolates filenames into a shell string (injection risk)');
    assert.ok(!/sh -c\s*'[^']*\{\}/.test(bash),
      'filename placeholder inside sh -c string (injection risk)');
  });

  test('plugin probe degrades gracefully instead of erroring', () => {
    assert.match(wf, /probe_plugin/, 'probe_plugin helper missing');
    assert.match(wf, /never errors|\[skipped\]/, 'graceful degradation wording missing');
  });

  test('plugin probe scopes to .plugins and cannot always-skip', () => {
    // installed_plugins.json has a top-level numeric `version` key. Walking every
    // top-level value with keys[] throws "number has no keys", aborting the filter
    // so every probe reports "skipped" and cross-plugin steps silently never run.
    // Ignore comment lines — the fix documents the broken form in prose.
    const live = wf.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    assert.ok(!/to_entries\[\]\s*\|\s*\.value\s*\|\s*keys\[\]/.test(live),
      'probe must not walk all top-level values (aborts on the numeric version key)');
    assert.match(wf, /jq [^\n]*'\.plugins \| keys/,
      'probe must scope its jq query to .plugins');
  });

  test('every repo file path referenced in inline code spans resolves on disk', () => {
    const stripped = wf.replace(/```[\s\S]*?```/g, '');
    const spans = [...stripped.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    const pathLike = [...new Set(
      spans.filter((s) => /\.(md|cjs|js|json)$/.test(s) && !s.includes('*') && !s.includes('{')),
    )];

    assert.ok(pathLike.length >= 1, `expected at least one path-like code span, found ${pathLike.length}`);

    for (const raw of pathLike) {
      const normalized = raw.replace(/^@?~\/\.claude\//, '').replace(/^\$HOME\/\.claude\//, '');
      if (RUNTIME_ARTIFACT_EXCEPTIONS.has(path.basename(normalized))) continue;
      if (RUNTIME_ARTIFACT_EXCEPTIONS.has(normalized)) continue;
      const resolved = path.join(ROOT, normalized);
      assert.ok(fs.existsSync(resolved), `referenced path does not exist: ${normalized} (from \`${raw}\`)`);
    }
  });
});
