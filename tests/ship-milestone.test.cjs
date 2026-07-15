/**
 * GSD Ship-Milestone Workflow Tests (Phase 59, SHIP-01..04)
 *
 * Structural contracts for the W5 milestone close-out workflow: registry
 * routability, chain order, exactly 2 gates with verbatim prompts, nothing
 * irreversible before GATE 2, and complete-milestone's internal prompts
 * kept live (never pre-answered).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'ship-milestone.md');
const COMMANDS_DIR = path.join(ROOT, 'commands', 'gsd');
const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

// Verbatim prompts from the W5 spec (GSD-AUTONOMOUS-WORKFLOWS.md item 5),
// compared whitespace-normalized so source line-wrapping is irrelevant.
const GATE_1_PROMPT =
  '"Milestone audit: {status}. {N} gaps / {M} tech-debt items: {summary}. [Continue anyway / Stop — fix first]"';
const GATE_2_PROMPT =
  '"Ready to complete {version}: tag v{X.Y} + push, squash-merge {branch}, archive {N} phases. This is the irreversible step. [Complete milestone / Hold]"';
const flatWf = wf.replace(/\s+/g, ' ');

describe('ship-milestone workflow structure', () => {
  test('workflow file exists with routable frontmatter', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'ship-milestone.md should exist');
    assert.ok(wf.startsWith('---\nname: workflow:ship-milestone\n'), 'frontmatter must carry the workflow: name');
    const desc = wf.match(/^description:\s*(.+)$/m);
    assert.ok(desc && desc[1].trim().length > 50, 'description must be a substantive routing signal');
    assert.ok(/complete-milestone/.test(desc[1]), 'description should disambiguate vs gsd:complete-milestone');
    assert.ok(/ship-and-merge/.test(desc[1]), 'description should disambiguate vs workflow:ship-and-merge');
  });

  test('required sections present', () => {
    for (const re of [/<purpose>[\s\S]+<\/purpose>/, /<process>[\s\S]+<\/process>/, /<error_handling>[\s\S]+<\/error_handling>/, /<success_criteria>[\s\S]+<\/success_criteria>/]) {
      assert.match(wf, re);
    }
  });

  test('chain order held: health → audit-agents → sync-docs → coverage+drift → audit-milestone → GATE 1 → ship/ci → GATE 2 → complete-milestone', () => {
    const markers = [
      'Skill(skill="gsd:health")',
      'Skill(skill="gsd:audit-agents", args="--no-commit")',
      'Skill(skill="gsd:sync-docs")',
      'npm run test:coverage',
      'check-doc-drift.cjs',
      'Skill(skill="gsd:audit-milestone")',
      'name="gate_1_audit_verdict"',
      'Skill(skill="gsd:ship")',
      'Skill(skill="gsd:ci-watch")',
      'name="gate_2_complete_authorization"',
      'Skill(skill="gsd:complete-milestone"',
    ];
    let prev = -1;
    for (const m of markers) {
      const idx = wf.indexOf(m);
      assert.ok(idx !== -1, `missing chain marker: ${m}`);
      assert.ok(idx > prev, `chain marker out of order: ${m}`);
      prev = idx;
    }
  });
});

describe('gates (SHIP-01)', () => {
  test('exactly 2 AskUserQuestion gates in this file', () => {
    const count = (wf.match(/AskUserQuestion:/g) || []).length;
    assert.strictEqual(count, 2, 'ship-milestone must hold exactly 2 gates — composed commands own their internal prompts');
  });

  test('GATE 1 is conditional: fires only when audit is not passed, auto-continues on passed', () => {
    const gate1 = wf.slice(wf.indexOf('name="gate_1_audit_verdict"'), wf.indexOf('name="ship_and_ci"'));
    assert.ok(/If `AUDIT_STATUS` is `passed`: skip this gate entirely/.test(gate1), 'passed audit must auto-continue');
    assert.ok(gate1.includes('[skip] GATE 1: audit passed — auto-continue'), 'skip receipt required');
    assert.ok(/Only if `AUDIT_STATUS` is not `passed`/.test(gate1), 'gate fires only on non-passed audit');
  });

  test('both verbatim gate prompts present', () => {
    assert.ok(flatWf.includes(GATE_1_PROMPT), 'GATE 1 verbatim prompt missing');
    assert.ok(flatWf.includes(GATE_2_PROMPT), 'GATE 2 verbatim prompt missing');
  });

  test('audit verdict read from the canonical single-version filename', () => {
    assert.ok(wf.includes('-MILESTONE-AUDIT.md'), 'must read the audit verdict file');
    assert.ok(!wf.includes('v{version}-v{version}'), 'must not use the doubled-filename form');
  });
});

describe('irreversibility boundary (SHIP-03)', () => {
  const gate2Idx = wf.indexOf('name="gate_2_complete_authorization"');

  test('complete-milestone is invoked only after GATE 2', () => {
    const invokeIdx = wf.indexOf('Skill(skill="gsd:complete-milestone"');
    assert.ok(gate2Idx !== -1 && invokeIdx > gate2Idx, 'complete-milestone must sit after GATE 2');
  });

  test('never pre-answers complete-milestone internal prompts', () => {
    assert.ok(flatWf.includes('passes no pre-answers and no auto-flags'), 'never-pre-answer rule required');
    for (const prompt of ['Archive phases', 'Branch handling', 'Tag push']) {
      assert.ok(wf.includes(prompt), `must name the live internal prompt: ${prompt}`);
    }
    const invocation = wf.match(/Skill\(skill="gsd:complete-milestone"[^)]*\)/)[0];
    assert.ok(!/--yes|--auto|-y\b/.test(invocation), 'complete-milestone invocation must carry no auto-approval flags');
  });

  test('never references /gsd:finalize', () => {
    assert.ok(!wf.includes('gsd:finalize'), 'ship-milestone composes the critical path directly — finalize excluded by design');
  });
});

describe('references resolve (SHIP-04)', () => {
  test('every Skill(skill="gsd:X") reference resolves to a real command file', () => {
    const refs = [...wf.matchAll(/Skill\(skill="gsd:([a-z-]+)"/g)].map(m => m[1]);
    assert.ok(refs.length >= 7, 'expected at least the 7 composed commands + pause-work');
    for (const name of new Set(refs)) {
      const p = path.join(COMMANDS_DIR, `${name}.md`);
      assert.ok(fs.existsSync(p), `referenced command gsd:${name} missing at ${p}`);
    }
  });

  test('failure paths write a pause-work handoff with a resume command', () => {
    assert.ok(wf.includes('Skill(skill="gsd:pause-work")'), 'failure handler must pause-work');
    assert.ok(wf.includes('Resume with:'), 'failure handler must print the resume command');
  });
});
