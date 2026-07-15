/**
 * GSD Tests - `/gsd:do` routing contract: registry + dispatcher
 *
 * The dispatcher no longer carries an intent→command routing table. Routing
 * signal lives in each target's own frontmatter description, aggregated by
 * `gsd-tools.cjs do-registry`. These tests pin that contract: the registry is
 * complete, deterministic, and grounded in real files; do.md consumes the
 * registry and retains its deterministic gates (project check, dispatch
 * semantics, .planning/ exemptions) without any keyword rules.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'get-shit-done', 'bin', 'gsd-tools.cjs');
const DO_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'do.md');
const COMMANDS_DIR = path.join(ROOT, 'commands', 'gsd');
const WORKFLOWS_DIR = path.join(ROOT, 'get-shit-done', 'workflows');

const WORKFLOW_FLOWS = [
  'idea-to-shipped',
  'daily-startup',
  'wrap-and-sync',
  'bug-to-branch',
  'quick-change',
  'smart-discuss',
  'adopt-codebase',
  'ship-and-merge',
  'quality-sweep',
  'frontend-phase',
  'hardened-plan',
  'groom-backlog',
];

function runRegistry() {
  return execFileSync('node', [TOOLS, 'do-registry'], { encoding: 'utf8' });
}

describe('do-registry aggregation contract', () => {
  const rawOutput = runRegistry();
  let registry;

  test('output parses as JSON array', () => {
    registry = JSON.parse(rawOutput);
    assert.ok(Array.isArray(registry), 'do-registry must emit a JSON array');
    assert.ok(registry.length > 0, 'registry must not be empty');
  });

  registry = JSON.parse(rawOutput);

  test('every commands/gsd/*.md is present except gsd:do', () => {
    const names = new Set(registry.map(e => e.name));
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const expected = `gsd:${file.replace(/\.md$/, '')}`;
      if (file === 'do.md') {
        assert.ok(!names.has(expected), 'gsd:do must not route to itself');
      } else {
        assert.ok(names.has(expected), `registry missing command ${expected}`);
      }
    }
  });

  test('all named workflows are present as workflow:* entries', () => {
    const workflowNames = new Set(
      registry.filter(e => e.type === 'workflow').map(e => e.name),
    );
    for (const flow of WORKFLOW_FLOWS) {
      assert.ok(
        workflowNames.has(`workflow:${flow}`),
        `registry missing workflow:${flow}`,
      );
    }
  });

  test('every entry has a valid type', () => {
    for (const entry of registry) {
      assert.ok(
        entry.type === 'command' || entry.type === 'workflow',
        `${entry.name}: unexpected type ${entry.type}`,
      );
    }
  });

  test('every entry resolves to a source file on disk', () => {
    for (const entry of registry) {
      const p = entry.type === 'command'
        ? path.join(COMMANDS_DIR, `${entry.name.replace(/^gsd:/, '')}.md`)
        : path.join(WORKFLOWS_DIR, `${entry.name.replace(/^workflow:/, '')}.md`);
      assert.ok(fs.existsSync(p), `${entry.name}: source file missing at ${p}`);
    }
  });

  test('every description is non-empty', () => {
    for (const entry of registry) {
      assert.ok(
        typeof entry.description === 'string' && entry.description.trim().length > 0,
        `${entry.name}: empty description — the model has no routing signal`,
      );
    }
  });

  test('entries are sorted by name', () => {
    const names = registry.map(e => e.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(names, sorted, 'registry must be name-sorted');
  });

  test('aggregation is deterministic: two runs are byte-identical', () => {
    assert.strictEqual(runRegistry(), rawOutput, 'repeated runs must produce identical output');
  });

  test('shelved milestone workflow is not routed', () => {
    const names = registry.map(e => e.name);
    assert.ok(
      !names.includes('workflow:ship-milestone') && !names.includes('workflow:milestone-rollover'),
      'ship-milestone/milestone-rollover is shelved (operator, 2026-07-12) and must not appear',
    );
  });
});

describe('do.md dispatcher contract', () => {
  const doc = fs.readFileSync(DO_PATH, 'utf8');

  test('do.md exists and is non-trivial', () => {
    assert.ok(doc.length > 0, 'get-shit-done/workflows/do.md missing or empty');
  });

  test('contains no routing table', () => {
    assert.ok(
      !doc.includes('If the text describes'),
      'the intent→command routing table must stay deleted — descriptions are the routing signal',
    );
  });

  test('references the do-registry', () => {
    assert.ok(doc.includes('do-registry'), 'route step must load the registry via do-registry');
  });

  test('retains workflow-dispatch semantics', () => {
    assert.match(
      doc,
      /Workflow routes:[\s\S]*workflow:<name>[\s\S]*get-shit-done\/workflows\/<name>\.md/,
      'dispatch step must explain how workflow: targets are executed',
    );
  });

  test('retains the .planning/ requirement exemption list', () => {
    assert.match(
      doc,
      /Requires `\.planning\/` directory:[^\n]*workflow:daily-startup/,
      'daily-startup must be listed as not requiring .planning/',
    );
    assert.match(
      doc,
      /Requires `\.planning\/` directory:[^\n]*workflow:adopt-codebase/,
      'adopt-codebase must be listed as not requiring .planning/',
    );
    for (const exempt of ['/gsd:new-project', '/gsd:map-codebase', '/gsd:help', '/gsd:join-discord']) {
      assert.ok(
        doc.includes(exempt),
        `${exempt} must remain in the .planning/ exemption list`,
      );
    }
    assert.ok(
      doc.includes('If the project doesn\'t exist and the route requires it, suggest `/gsd:new-project` first.'),
      'the missing-project fallback sentence must be retained',
    );
  });

  test('do.md remains a pure dispatcher', () => {
    assert.match(doc, /dispatcher — it never does the work itself/i, 'dispatcher statement missing');
    assert.ok(!doc.includes('git push'), 'do.md must not perform git operations');
  });
});
