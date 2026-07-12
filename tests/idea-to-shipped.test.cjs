/**
 * GSD Tests - `idea-to-shipped` workflow contract, plus the `smart-discuss` extraction
 * it depends on.
 *
 * Validates:
 *  - the idea-to-shipped workflow (W2, .planning/GSD-AUTONOMOUS-WORKFLOWS.md) stays
 *    structurally sound: step ordering, both verbatim gate prompts, verify-work invoked
 *    without --mode=schema, a clean-context quality review before GATE 2, nothing
 *    leaving the machine before GATE 2 resolves, the human-owned merge boundary, the
 *    1-retry gap-closure cap, the pause-work failure handoff, and the PLAN_ONLY early
 *    exit ("research + plan a new thing" variant)
 *  - the `smart_discuss` extraction: get-shit-done/workflows/smart-discuss.md exists,
 *    carries the CONTEXT.md template and batch-table protocol, and
 *    get-shit-done/workflows/autonomous.md now delegates to it instead of inlining the
 *    sub-step bodies
 *  - every referenced repo file path resolves
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'idea-to-shipped.md');
const SMART_DISCUSS_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'smart-discuss.md');
const AUTONOMOUS_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'autonomous.md');

// Generated/runtime artifacts referenced but not shipped as tracked repo files.
const RUNTIME_ARTIFACT_EXCEPTIONS = new Set([
  '.planning/HANDOFF.json',
]);

const GATE_1_PROMPT = 'Plan verified (N tasks, M waves, files: …). Execute now? '
  + '[Execute / Adjust scope / Stop here — keep the plan]';

const GATE_2_PROMPT = 'Verification passed (X/Y must-haves; review: PASS). Push branch and open '
  + 'draft PR? [Ship it / Fix issues first / Stop — keep local]';

describe('idea-to-shipped workflow contract', () => {
  test('workflow file exists at get-shit-done/workflows/idea-to-shipped.md', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/idea-to-shipped.md missing');
  });

  const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

  test('has purpose, process, error_handling, and success_criteria sections', () => {
    assert.match(wf, /<purpose>[\s\S]+<\/purpose>/, 'purpose block missing');
    assert.match(wf, /<process>[\s\S]+<\/process>/, 'process block missing');
    assert.match(wf, /<error_handling>[\s\S]+<\/error_handling>/, 'error_handling block missing');
    assert.match(wf, /<success_criteria>[\s\S]+<\/success_criteria>/, 'success_criteria block missing');
  });

  test('steps run in contract order: intake -> discuss -> plan -> gate1 -> execute -> verify -> quality_review -> gate2 -> ship -> ci_watch', () => {
    const idx = {
      intake: wf.indexOf('name="intake"'),
      discuss: wf.indexOf('name="discuss"'),
      plan: wf.indexOf('name="plan"'),
      gate1: wf.indexOf('name="gate_1_approve_plan"'),
      execute: wf.indexOf('name="execute"'),
      verify: wf.indexOf('name="verify"'),
      quality: wf.indexOf('name="quality_review"'),
      gate2: wf.indexOf('name="gate_2_approve_ship"'),
      ship: wf.indexOf('name="ship"'),
      ci: wf.indexOf('name="ci_watch"'),
    };
    for (const [label, i] of Object.entries(idx)) {
      assert.ok(i !== -1, `${label} step marker not found in workflow`);
    }
    const order = ['intake', 'discuss', 'plan', 'gate1', 'execute', 'verify', 'quality', 'gate2', 'ship', 'ci'];
    for (let k = 0; k < order.length - 1; k++) {
      assert.ok(idx[order[k]] < idx[order[k + 1]], `${order[k]} must precede ${order[k + 1]}`);
    }
  });

  test('carries the exact GATE 1 prompt text verbatim', () => {
    assert.ok(wf.includes(GATE_1_PROMPT), 'verbatim GATE 1 prompt text missing or altered');
  });

  test('carries the exact GATE 2 prompt text verbatim', () => {
    assert.ok(wf.includes(GATE_2_PROMPT), 'verbatim GATE 2 prompt text missing or altered');
  });

  test('verify-work is invoked without --mode=schema, with an explanatory note', () => {
    const invocationMatch = wf.match(/Skill\(skill="gsd:verify-work"[^)]*\)/);
    assert.ok(invocationMatch, 'verify-work Skill() invocation not found');
    assert.ok(
      !invocationMatch[0].includes('--mode=schema'),
      `verify-work invocation must not pass --mode=schema: ${invocationMatch[0]}`,
    );
    // --mode=schema may still appear in prose explaining why it must NOT be passed --
    // that explanatory note is required, not forbidden.
    assert.match(
      wf,
      /schema-only mode|schema-only would|skip(s)? the (automated )?(must-have )?UAT|skip UAT flow/i,
      'explanatory note that schema-only mode skips the must-have UAT is missing',
    );
  });

  test('a clean-context gsd-verifier quality review runs before GATE 2', () => {
    const qualityIdx = wf.indexOf('name="quality_review"');
    const gate2Idx = wf.indexOf('name="gate_2_approve_ship"');
    assert.ok(qualityIdx !== -1 && qualityIdx < gate2Idx, 'quality_review must precede GATE 2');
    const qualityBlock = wf.slice(qualityIdx, gate2Idx);
    assert.match(qualityBlock, /clean-context/i, 'clean-context framing missing from quality review');
    assert.match(qualityBlock, /subagent_type="gsd-verifier"/, 'gsd-verifier Task spawn missing');
    assert.match(qualityBlock, /zero context|shares no context/i, 'zero-shared-context statement missing');
  });

  test('no git push, gh pr, or gsd:ship reference appears before GATE 2', () => {
    const gate2Idx = wf.indexOf('name="gate_2_approve_ship"');
    assert.ok(gate2Idx > 0, 'gate_2_approve_ship step not found');
    for (const token of ['git push', 'gh pr', 'gsd:ship']) {
      let from = 0;
      let i;
      // eslint-disable-next-line no-cond-assign
      while ((i = wf.indexOf(token, from)) !== -1) {
        assert.ok(i > gate2Idx, `"${token}" found before GATE 2 at index ${i}`);
        from = i + 1;
      }
    }
  });

  test('states explicitly that merge stays human, on GitHub, forever', () => {
    assert.match(wf, /merge stays human/i, 'merge-stays-human statement missing');
    assert.match(wf, /never merges/i, '"ship never merges" statement missing');
  });

  test('gap closure is capped at exactly one automatic retry, mirroring autonomous.md', () => {
    assert.match(wf, /ONE|one\b.*(automatic )?gap-closure cycle/i, 'one-retry cap wording missing');
    assert.match(wf, /autonomous\.md.{0,40}1-retry cap|1-retry cap/i, 'reference to autonomous.md 1-retry cap missing');
    assert.match(wf, /do not attempt a second/i, 'explicit no-second-attempt statement missing');
  });

  test('executor failure path hands off via gsd:pause-work, never auto-debug', () => {
    assert.match(wf, /gsd:pause-work/, 'pause-work handoff missing from failure path');
    assert.match(wf, /never auto-.*debug|never auto-debug/i, 'never-auto-debug guarantee missing');
  });

  test('PLAN_ONLY early-exit is present and ends the workflow after GATE 1', () => {
    assert.match(wf, /PLAN_ONLY/, 'PLAN_ONLY flag not referenced');
    assert.match(wf, /stop(ping)? here per request|stopping here per request/i, 'PLAN_ONLY stop message missing');
    assert.match(wf, /research \+ plan a new thing|research\/plan.only|research and plan only/i, 'link to the "research + plan a new thing" variant missing');
  });

  test('every repo file path referenced in inline code spans (containing a "/") resolves on disk', () => {
    const stripped = wf.replace(/```[\s\S]*?```/g, '');
    const spans = [...stripped.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    // Only sweep spans that look like an actual path (contain a directory separator) --
    // this workflow also uses bare `file.md` mentions as informal shorthand for a known
    // workflow file in prose (e.g. `ship.md`'s own question), which are not path claims.
    const pathLike = [...new Set(
      spans.filter((s) => /\.(md|cjs|js|json)$/.test(s) && s.includes('/') && !s.includes('*') && !s.includes('{')),
    )];

    assert.ok(pathLike.length >= 3, `expected several path-like code spans, found ${pathLike.length}`);

    for (const raw of pathLike) {
      const normalized = raw.replace(/^@?\$HOME\/\.claude\//, '').replace(/^@?~\/\.claude\//, '');
      if (RUNTIME_ARTIFACT_EXCEPTIONS.has(normalized)) continue;
      const resolved = path.join(ROOT, normalized);
      assert.ok(fs.existsSync(resolved), `referenced path does not exist: ${normalized} (from \`${raw}\`)`);
    }
  });
});

describe('smart-discuss extraction contract', () => {
  test('get-shit-done/workflows/smart-discuss.md exists', () => {
    assert.ok(fs.existsSync(SMART_DISCUSS_PATH), 'get-shit-done/workflows/smart-discuss.md missing');
  });

  const sd = fs.readFileSync(SMART_DISCUSS_PATH, 'utf8');

  test('smart-discuss.md carries the CONTEXT.md template markers', () => {
    for (const marker of ['<domain>', '<decisions>', 'Ready for planning']) {
      assert.ok(sd.includes(marker), `CONTEXT.md template marker missing: ${marker}`);
    }
  });

  test('smart-discuss.md carries the batch-table proposal protocol', () => {
    assert.ok(sd.includes('Accept all'), '"Accept all" batch-table option missing');
    assert.match(sd, /Grey Area \{M\}\/\{N\}/, 'grey-area batch table header missing');
  });

  test('smart-discuss.md documents the CTRL-03 extraction lineage', () => {
    assert.match(sd, /CTRL-03/, 'CTRL-03 note missing from smart-discuss.md');
  });

  test('autonomous.md now delegates to workflows/smart-discuss.md instead of inlining sub-steps', () => {
    assert.ok(fs.existsSync(AUTONOMOUS_PATH), 'get-shit-done/workflows/autonomous.md missing');
    const auto = fs.readFileSync(AUTONOMOUS_PATH, 'utf8');

    assert.ok(
      auto.includes('workflows/smart-discuss.md'),
      'autonomous.md must reference get-shit-done/workflows/smart-discuss.md',
    );
    assert.ok(
      !auto.includes('Sub-step 4: Present Proposals Per Area'),
      'autonomous.md must no longer inline the smart_discuss sub-step bodies',
    );
    assert.ok(
      sd.includes('Sub-step 4: Present Proposals Per Area'),
      'smart-discuss.md must carry the sub-step bodies extracted out of autonomous.md',
    );

    // The calling contract from execute_phase must still resolve to a real step.
    assert.match(auto, /<step name="smart_discuss">/, 'smart_discuss step no longer exists in autonomous.md');
    assert.match(
      auto,
      /Execute the smart_discuss step for this phase/,
      'execute_phase\'s call into smart_discuss no longer resolves',
    );
  });
});
