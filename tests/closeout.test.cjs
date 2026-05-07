/**
 * GSD Closeout Tests
 *
 * Validates the closeout command and workflow files exist, follow the
 * thin-shell + workflow pattern (matches autonomous.md), declare the
 * documented flag surface, and orchestrate sub-commands as designed.
 *
 * Closeout is a meta-orchestrator: full integration testing requires fixture
 * milestones. These tests cover structural correctness and contract claims —
 * conversational behavior is validated at human review.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools } = require('./helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const commandPath = path.join(repoRoot, 'commands', 'gsd', 'closeout.md');
const workflowPath = path.join(repoRoot, 'get-shit-done', 'workflows', 'closeout.md');

describe('closeout command file', () => {
  test('command file exists', () => {
    assert.ok(fs.existsSync(commandPath), 'commands/gsd/closeout.md should exist');
  });

  test('command has correct frontmatter name', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(content.includes('name: gsd:closeout'), 'should have correct command name');
  });

  test('command has description with closeout-specific terms', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    const m = content.match(/^description:\s*(.+)$/m);
    assert.ok(m, 'should have description field');
    const desc = m[1];
    assert.ok(/audit/i.test(desc), 'description should mention audit');
    assert.ok(/finalize/i.test(desc), 'description should mention finalize');
    assert.ok(/closeout/i.test(desc), 'description should mention closeout');
  });

  test('command argument-hint advertises the flag surface', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    const m = content.match(/^argument-hint:\s*"(.+)"$/m);
    assert.ok(m, 'should have argument-hint field');
    const hint = m[1];
    const flags = ['--mode ship|freeze', '--no-audits', '--no-verify', '--no-ship', '--wrap', '--profile', '--dry-run'];
    for (const flag of flags) {
      assert.ok(hint.includes(flag), `argument-hint should advertise ${flag}`);
    }
  });

  test('command allows tools required by the workflow', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    const required = ['Read', 'Write', 'Bash', 'AskUserQuestion'];
    for (const tool of required) {
      assert.ok(
        new RegExp(`^\\s+-\\s+${tool}\\s*$`, 'm').test(content),
        `allowed-tools should include ${tool}`
      );
    }
  });

  test('command references workflow via execution_context', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(
      content.includes('workflows/closeout.md'),
      'should reference get-shit-done/workflows/closeout.md'
    );
    assert.ok(
      content.includes('<execution_context>'),
      'should declare execution_context block'
    );
  });
});

describe('closeout workflow file', () => {
  test('workflow file exists', () => {
    assert.ok(fs.existsSync(workflowPath), 'get-shit-done/workflows/closeout.md should exist');
  });

  test('workflow declares all 9 gates plus blocker handlers', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const requiredSteps = [
      'name="initialize"',
      'name="orient"',
      'name="audit"',
      'name="verify"',
      'name="mode_branch"',
      'name="capture_ship"',
      'name="capture_freeze"',
      'name="ship"',
      'name="clean"',
      'name="finalize"',
      'name="polish"',
      'name="handle_audit_verdict"',
      'name="handle_blocker"',
    ];
    for (const step of requiredSteps) {
      assert.ok(content.includes(`<step ${step}`), `workflow should declare step ${step}`);
    }
  });

  test('workflow invokes all required sub-commands via Skill()', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const requiredSkills = [
      'gsd:prime-patterns',
      'gsd:progress',
      'gsd:stats',
      'gsd:health',
      'gsd:audit-agents',
      'gsd:audit-uat',
      'gsd:audit-deps',
      'gsd:audit-milestone',
      'gsd:sync-docs',
      'gsd:verify-work',
      'gsd:milestone-summary',
      'gsd:pause-work',
      'gsd:session-report',
      'gsd:ship',
      'gsd:finalize',
      'gsd:profile-user',
    ];
    for (const skill of requiredSkills) {
      assert.ok(
        content.includes(`Skill(skill="${skill}"`),
        `workflow should invoke ${skill} via Skill()`
      );
    }
  });

  test('workflow probes external plugins via installed_plugins.json', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('installed_plugins.json'),
      'plugin probes must read $HOME/.claude/plugins/installed_plugins.json'
    );
    assert.ok(
      content.includes('jq'),
      'plugin probes must use jq for stable JSON parsing'
    );
    const externalPlugins = ['pr-review-toolkit', 'commit-commands', 'claude-mcp-ecosystem'];
    for (const plugin of externalPlugins) {
      assert.ok(content.includes(plugin), `should probe ${plugin}`);
    }
  });

  test('workflow defers to gsd:finalize at Gate 7 rather than duplicating its gates', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('Skill(skill="gsd:finalize"'),
      'workflow must invoke gsd:finalize directly'
    );
    assert.ok(
      /Defer to finalize|defer to finalize/.test(content),
      'critical_rules should document that finalize owns the back half'
    );
  });

  test('workflow encodes BLOCK vs FLAG verdict semantics', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('BLOCK'), 'verdict resolver must handle BLOCK');
    assert.ok(content.includes('FLAG'), 'verdict resolver must handle FLAG');
    assert.ok(content.includes('PASS'), 'verdict resolver must handle PASS');
    assert.ok(
      /No "?Acknowledge and continue"? option for BLOCK/.test(content),
      'BLOCK verdicts must not offer Acknowledge and continue'
    );
  });

  test('workflow has upstream-tracking preflight', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('@{u}'),
      'should preflight against upstream-tracking via git rev-parse'
    );
    assert.ok(
      /No upstream branch tracked|requires a tracked remote/.test(content),
      'should fail loudly when no upstream is set'
    );
  });

  test('workflow honors --dry-run as zero-mutation contract', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('DRY_RUN'), 'should parse --dry-run flag');
    assert.ok(
      /Zero state mutation/.test(content) || /Dry-run short-circuit/.test(content),
      'dry-run must short-circuit before any sub-skill call'
    );
  });

  test('workflow auto-detects ship vs freeze mode from STATE.md', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('paused_at'), 'mode detection must read paused_at');
    assert.ok(content.includes('roadmap_complete'), 'mode detection must read roadmap_complete');
    assert.ok(content.includes('MODE_OVERRIDE'), 'should respect --mode override');
  });

  test('workflow freeze mode skips ship/finalize/cleanup gates', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const freezeStep = content.split('<step name="capture_freeze">')[1] || '';
    const freezeBody = freezeStep.split('</step>')[0];
    assert.ok(
      /Exit closeout cleanly|does not run ship, finalize/.test(freezeBody),
      'freeze mode must exit before ship/finalize/cleanup'
    );
  });

  test('workflow declares success criteria covering all gates', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('<success_criteria>'), 'must declare success_criteria');
    const criteriaBlock = content.split('<success_criteria>')[1].split('</success_criteria>')[0];
    const checkboxCount = (criteriaBlock.match(/^\s*-\s+\[\s*\]/gm) || []).length;
    assert.ok(
      checkboxCount >= 10,
      `success_criteria should have at least 10 checkboxes (got ${checkboxCount})`
    );
  });

  test('workflow uses GSD CLOSEOUT banner style consistent with autonomous.md', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('CLOSEOUT'),
      'banners should follow the GSD CLOSEOUT prefix convention'
    );
    assert.ok(
      content.includes('━━━━'),
      'banners should use the standard GSD banner rule character'
    );
  });
});

describe('closeout command frontmatter validity', () => {
  test('frontmatter parses via gsd-tools frontmatter get', () => {
    const result = runGsdTools(['frontmatter', 'get', commandPath]);
    assert.ok(result.success, `frontmatter get failed: ${result.error}`);
    const fm = JSON.parse(result.output);
    assert.strictEqual(fm.name, 'gsd:closeout', 'name must be gsd:closeout');
    assert.ok(Array.isArray(fm['allowed-tools']), 'allowed-tools must be a list');
    assert.ok(fm['allowed-tools'].includes('AskUserQuestion'), 'must allow AskUserQuestion');
    assert.ok(fm['allowed-tools'].includes('Bash'), 'must allow Bash');
  });
});
