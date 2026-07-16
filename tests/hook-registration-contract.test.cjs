/**
 * Hook Registration Contract Test
 *
 * Locks the shipped hook sources (hooks/*.js + .claude/hooks/*.cjs) to their
 * declarative registrations in governance/templates/global/settings-gsd-hooks.json,
 * to the repo's own .claude/settings.json wiring, and to the live installer
 * wiring in bin/install.js. Fails the moment a shipped hook source ships
 * without a matching template entry (HOOKREG-01, HOOKREG-02, HOOKREG-03).
 *
 * Source list is derived from the filesystem at runtime — never hardcoded —
 * so adding or removing a hook source changes what this test checks without
 * editing the test itself.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(REPO_ROOT, 'governance', 'templates', 'global', 'settings-gsd-hooks.json');
const SETTINGS_PATH = path.join(REPO_ROOT, '.claude', 'settings.json');
const INSTALL_JS = path.join(REPO_ROOT, 'bin', 'install.js');
const PKG_JSON = path.join(REPO_ROOT, 'package.json');

const { isHookRegistered } = require(INSTALL_JS);

/**
 * Derive the shipped hook source list from disk (repo-relative posix paths).
 * NEVER hardcode the count — this must reflect whatever ships today.
 */
function derivedSources() {
  const jsHooks = fs.readdirSync(path.join(REPO_ROOT, 'hooks'))
    .filter(f => f.endsWith('.js'))
    .map(f => `hooks/${f}`);

  const cjsHooks = fs.readdirSync(path.join(REPO_ROOT, '.claude', 'hooks'))
    .filter(f => f.endsWith('.cjs'))
    .map(f => `.claude/hooks/${f}`);

  return [...jsHooks, ...cjsHooks].sort();
}

function loadTemplate() {
  return JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
}

// ─── Group A: filesystem-derived coverage (HOOKREG-01, HOOKREG-03) ─────────

describe('Group A: filesystem-derived template coverage', () => {
  test('derived source list is non-empty and includes the known sources', () => {
    const sources = derivedSources();
    assert.ok(sources.length > 0, 'derived source list should not be empty');

    const known = [
      'hooks/gsd-check-update.js',
      'hooks/gsd-context-monitor.js',
      'hooks/gsd-cost-tracker.js',
      'hooks/gsd-prompt-guard.js',
      'hooks/gsd-config-protection.js',
      'hooks/gsd-spawn-tracker.js',
      'hooks/gsd-statusline.js',
      '.claude/hooks/lesson-capture-gate.cjs',
    ];
    for (const k of known) {
      assert.ok(sources.includes(k), `sanity floor: expected known source ${k} on disk`);
    }
  });

  test('every derived source has exactly one matching template entry', () => {
    const sources = derivedSources();
    const template = loadTemplate();
    const templateSources = template.hooks.map(h => h.source);

    for (const source of sources) {
      const matches = templateSources.filter(s => s === source);
      assert.equal(
        matches.length, 1,
        `${source} should have exactly one entry in settings-gsd-hooks.json (found ${matches.length}) — ` +
        `a shipped hook source is missing its template registration`
      );
    }
  });

  test('no template entry references a source missing from disk', () => {
    const sources = new Set(derivedSources());
    const template = loadTemplate();
    for (const entry of template.hooks) {
      assert.ok(sources.has(entry.source), `stale template entry: ${entry.source} does not exist on disk`);
    }
  });
});

// ─── Group B: repo-local wiring (HOOKREG-02) ───────────────────────────────

describe('Group B: repo-local wiring (lesson-capture-gate.cjs)', () => {
  test('template marks lesson-capture-gate.cjs as repo-local on Stop', () => {
    const template = loadTemplate();
    const entry = template.hooks.find(h => h.source === '.claude/hooks/lesson-capture-gate.cjs');
    assert.ok(entry, 'template should have an entry for .claude/hooks/lesson-capture-gate.cjs');
    assert.equal(entry.distribution, 'repo-local');
    assert.equal(entry.event, 'Stop');
  });

  test('.claude/settings.json registers lesson-capture-gate.cjs on Stop', () => {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const exactMatch = isHookRegistered(settings, 'Stop', 'node .claude/hooks/lesson-capture-gate.cjs');
    const substringMatch = (settings.hooks?.Stop || []).some(entry =>
      (entry.hooks || []).some(h => h.command && h.command.includes('lesson-capture-gate'))
    );
    assert.ok(exactMatch || substringMatch, 'lesson-capture-gate.cjs should be wired on Stop in .claude/settings.json');
  });
});

// ─── Group C: installer agreement (HOOKREG-01) ─────────────────────────────

describe('Group C: installer agreement', () => {
  let installResult;
  let tmpDir;
  const MARKER = '__HOOKREG_RESULT__';

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hookreg-install-'));

    // Run the real installer registration path in an isolated child process.
    // install() calls process.exit(1) on any copy failure (bin/install.js:4629) —
    // isolation keeps that from taking down this test file's process.
    const script =
      `const r = require(${JSON.stringify(INSTALL_JS)}).install(false, 'claude');` +
      `process.stdout.write(${JSON.stringify(MARKER)} + JSON.stringify({ settings: r.settings, statuslineCommand: r.statuslineCommand }));`;

    let stdout;
    try {
      stdout = execFileSync(process.execPath, ['-e', script], {
        cwd: tmpDir,
        env: { ...process.env, GSD_TEST_MODE: '1' },
        encoding: 'utf8',
        timeout: 60000,
      });
    } catch (err) {
      throw new Error(`local install child process failed: ${err.stderr || err.message}`);
    }

    const idx = stdout.lastIndexOf(MARKER);
    assert.ok(idx !== -1, 'install child process should print the result marker');
    installResult = JSON.parse(stdout.slice(idx + MARKER.length).trim());
  });

  after(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('every installer-distributed template entry is wired with its declared event and matcher', () => {
    const template = loadTemplate();
    const installerEntries = template.hooks.filter(h => h.distribution === 'installer');
    assert.ok(installerEntries.length > 0, 'expected at least one installer-distributed template entry');

    for (const entry of installerEntries) {
      const basename = path.basename(entry.source);

      if (entry.event === 'statusLine') {
        assert.ok(
          installResult.statuslineCommand && installResult.statuslineCommand.includes(basename),
          `statusline command should include ${basename}`
        );
        continue;
      }

      const eventEntries = installResult.settings.hooks?.[entry.event] || [];
      const hasCommand = eventEntries.some(e =>
        (e.hooks || []).some(h => h.command && h.command.includes(basename))
      );
      assert.ok(hasCommand, `settings.hooks.${entry.event} should include a command referencing ${basename}`);

      if (entry.matcher) {
        const hasMatcher = eventEntries.some(e =>
          e.matcher === entry.matcher && (e.hooks || []).some(h => h.command && h.command.includes(basename))
        );
        assert.ok(hasMatcher, `settings.hooks.${entry.event} should include matcher "${entry.matcher}" for ${basename}`);
      }
    }
  });
});

// ─── Group D: version marker (HOOKREG-01) ──────────────────────────────────

describe('Group D: version marker', () => {
  test('template.version is a non-empty string equal to package.json version', () => {
    const template = loadTemplate();
    const pkg = JSON.parse(fs.readFileSync(PKG_JSON, 'utf8'));
    assert.equal(typeof template.version, 'string');
    assert.ok(template.version.length > 0, 'version should be non-empty');
    assert.equal(template.version, pkg.version, 'template version should equal package.json version');
  });
});
