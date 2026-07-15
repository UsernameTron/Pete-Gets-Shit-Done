/**
 * GSD Finalize Tests
 *
 * Validates /gsd:finalize's structural contracts (Phase 58, FIN-01/FIN-02):
 * Gate 5.5 degrades gracefully when repo-doc-architect is unavailable, the
 * spawn contract survives for installs where it does resolve, and every
 * git push sits behind the consent protocol.
 *
 * Finalize is an LLM-executed command file: these tests assert the prose
 * contracts the executor follows — end-to-end behavior was verified in the
 * Phase 58 sandbox run (see PR evidence).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const commandPath = path.join(repoRoot, 'commands', 'gsd', 'finalize.md');
const content = fs.readFileSync(commandPath, 'utf-8');

describe('finalize command file', () => {
  test('command file exists with correct frontmatter name', () => {
    assert.ok(fs.existsSync(commandPath), 'commands/gsd/finalize.md should exist');
    assert.ok(content.includes('name: gsd:finalize'), 'should have correct command name');
  });

  test('allowed-tools includes Task and AskUserQuestion', () => {
    const frontmatter = content.split('---')[1];
    assert.ok(/^\s*- Task$/m.test(frontmatter), 'allowed-tools should include Task');
    assert.ok(/^\s*- AskUserQuestion$/m.test(frontmatter), 'allowed-tools should include AskUserQuestion');
  });
});

describe('Gate 5.5 graceful degradation (FIN-01)', () => {
  const gate55 = content.slice(
    content.indexOf('## Gate 5.5'),
    content.indexOf('## Gate 6')
  );

  test('Gate 5.5 section exists', () => {
    assert.ok(gate55.length > 0, 'Gate 5.5 section should exist before Gate 6');
  });

  test('has an availability check before the spawn', () => {
    assert.ok(/[Aa]vailability check/.test(gate55), 'should open with an availability check');
    assert.ok(gate55.includes('claude-mcp-ecosystem'), 'should name the plugin that ships the agent');
    assert.ok(
      gate55.indexOf('Availability check') < gate55.indexOf('**Contract:**'),
      'availability check should precede the spawn contract'
    );
  });

  test('unavailable path prints a [skip] notice and continues to Gate 6', () => {
    assert.ok(gate55.includes('[skip] Gate 5.5: repo-doc-architect unavailable'), 'should print the [skip] notice');
    assert.ok(/continue directly to Gate 6/.test(gate55), 'should continue to Gate 6 on skip');
    assert.ok(/non-fatal|Never error/i.test(gate55), 'skip must be non-fatal');
  });

  test('skip notice surfaces the closeout-deferred drift caveat', () => {
    assert.ok(
      gate55.includes('doc drift deferred by closeout remains unapplied'),
      'skip notice should warn that closeout-deferred drift is not applied'
    );
    assert.ok(gate55.includes('/gsd:sync-docs'), 'skip notice should point at the manual fallback');
  });

  test('spawn contract survives intact for the agent-available path', () => {
    assert.ok(gate55.includes('If it IS available, spawn `repo-doc-architect`'), 'available path should still spawn');
    for (const field of ['**Input:**', '**Task:**', '**Scope:**', '**Output:**']) {
      assert.ok(gate55.includes(field), `spawn contract should retain ${field}`);
    }
    assert.ok(gate55.includes('less than 7 days old'), 'architecture-freshness rule should survive');
    assert.ok(gate55.includes('do not block finalization'), 'critical-errors rule should survive');
  });
});

describe('push consent (FIN-02 structural)', () => {
  test('push instructions live only at Gates 1 and 7, both behind consent', () => {
    const process = content.slice(content.indexOf('<process>'), content.indexOf('</process>'));
    const gates = process.split(/^## /m).filter(Boolean);
    const pushInstruction = /git push|Push to origin/;
    for (const gate of gates) {
      const title = gate.split('\n')[0];
      const isPushGate = /^Gate [17]:/.test(title);
      if (isPushGate) {
        assert.ok(pushInstruction.test(gate), `${title} should contain a push instruction`);
        assert.ok(gate.includes('Resolve push consent'), `${title} push should resolve consent`);
      } else {
        assert.ok(!pushInstruction.test(gate), `${title} should not instruct a push`);
      }
    }
  });

  test('consent protocol is defined with flag, config, and interactive paths', () => {
    assert.ok(content.includes('--yes-push'), 'should support the --yes-push flag');
    assert.ok(content.includes('workflow.finalize_auto_push'), 'should read the auto-push config key');
    assert.ok(content.includes('[auto-push] gate='), 'pre-approved pushes should print the receipt line');
  });

  test('critical rules retain the gated-push rule', () => {
    const rules = content.slice(content.indexOf('<critical_rules>'), content.indexOf('</critical_rules>'));
    assert.ok(/Never `git push` without resolved consent/.test(rules), 'gated-push rule should survive');
  });
});
