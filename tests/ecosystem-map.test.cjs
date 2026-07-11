/**
 * GSD Tests - /gsd:ecosystem-map command contract
 *
 * Validates the command shell and its workflow stay structurally sound:
 * frontmatter contract, command->workflow routing, embedded cluster taxonomy,
 * output paths, drift-history semantics, and the review fallback wording.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMMAND_PATH = path.join(ROOT, 'commands', 'gsd', 'ecosystem-map.md');
const WORKFLOW_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'ecosystem-map.md');

describe('ecosystem-map command shell', () => {
  const raw = fs.readFileSync(COMMAND_PATH, 'utf8');

  test('command file exists in commands/gsd/', () => {
    assert.ok(fs.existsSync(COMMAND_PATH), 'commands/gsd/ecosystem-map.md missing');
  });

  test('frontmatter declares name, description, argument-hint, allowed-tools', () => {
    assert.match(raw, /^---[\s\S]*?^name:\s*gsd:ecosystem-map$/m, 'name frontmatter missing or wrong');
    assert.match(raw, /\ndescription:\s*\S+/, 'description frontmatter missing');
    assert.match(raw, /\nargument-hint:/, 'argument-hint frontmatter missing');
    assert.match(raw, /\nallowed-tools:/, 'allowed-tools frontmatter missing');
  });

  test('argument-hint documents all four flags', () => {
    const hint = raw.match(/argument-hint:\s*"([^"]*)"/);
    assert.ok(hint, 'argument-hint not parseable');
    for (const flag of ['--exec', '--dry-run', '--review', '--baseline']) {
      assert.ok(hint[1].includes(flag), `argument-hint missing ${flag}`);
    }
  });

  test('allowed-tools covers scan, write, and subagent needs', () => {
    const fmEnd = raw.indexOf('\n---', 3);
    const fm = raw.slice(0, fmEnd);
    for (const tool of ['Read', 'Bash', 'Glob', 'Grep', 'Write', 'Task']) {
      assert.ok(new RegExp(`-\\s+${tool}\\b`).test(fm), `allowed-tools missing ${tool}`);
    }
  });

  test('execution_context routes to the ecosystem-map workflow', () => {
    assert.match(
      raw,
      /<execution_context>\s*@~\/\.claude\/get-shit-done\/workflows\/ecosystem-map\.md\s*<\/execution_context>/,
      'execution_context does not route to workflows/ecosystem-map.md'
    );
  });

  test('routed workflow file exists in the engine', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/ecosystem-map.md missing');
  });
});

describe('ecosystem-map workflow', () => {
  const wf = fs.readFileSync(WORKFLOW_PATH, 'utf8');

  test('has purpose and process sections', () => {
    assert.match(wf, /<purpose>[\s\S]+<\/purpose>/, 'purpose block missing');
    assert.match(wf, /<process>[\s\S]+<\/process>/, 'process block missing');
  });

  test('embeds the full canonical cluster taxonomy', () => {
    for (let i = 0; i <= 10; i++) {
      assert.ok(new RegExp(`\\*\\*C${i} — `).test(wf), `cluster definition C${i} missing`);
    }
    assert.ok(wf.includes('C-UNMAPPED'), 'C-UNMAPPED bucket missing');
  });

  test('names both output paths', () => {
    assert.ok(wf.includes('.planning/GSD-ECOSYSTEM-MAP.md'), 'primary map output path missing');
    assert.ok(wf.includes('.planning/GSD-ECOSYSTEM-MAP-EXEC.md'), 'exec pager output path missing');
  });

  test('carries the exact Obsidian dark-mode init directive for the exec diagram', () => {
    assert.ok(
      wf.includes(
        "%%{init: {'theme':'base','themeVariables':{'background':'#09090b','primaryColor':'#111113','primaryBorderColor':'#27272a','primaryTextColor':'#e4e4e7','lineColor':'#34d399','secondaryColor':'#22d3ee','tertiaryColor':'#18181b','fontFamily':'Plus Jakarta Sans, JetBrains Mono, monospace'}}}%%"
      ),
      'exec init directive missing or altered'
    );
  });

  test('drift history appends exactly one row per run', () => {
    assert.match(wf, /append exactly one row/i, 'drift-history append semantics missing');
  });

  test('dry-run writes nothing', () => {
    assert.match(wf, /--dry-run[\s\S]{0,200}?write nothing/i, 'dry-run no-write contract missing');
  });

  test('review step states the codex fallback plainly and never auto-applies', () => {
    assert.ok(wf.includes('--codex not available here'), 'codex-unavailable wording missing');
    assert.match(wf, /Do NOT auto-apply/i, 'auto-apply prohibition missing');
  });

  test('discovery is filesystem-first with NOT FOUND semantics', () => {
    assert.match(wf, /NOT FOUND — <path checked>/, 'NOT FOUND recording format missing');
    assert.match(wf, /commands\/gsd\/\*\.md/, 'core command scan path missing');
    assert.match(wf, /get-shit-done\/workflows\/\*\.md/, 'workflow scan path missing');
  });
});
