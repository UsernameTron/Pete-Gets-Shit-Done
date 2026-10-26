/**
 * Installer CLI matrix — drives bin/install.js as a real child process so the
 * main dispatch, every runtime's uninstall, the interactive prompts, and the
 * opencode/codex config cleanup are exercised end to end. Coverage from the
 * children is collected because c8 propagates NODE_V8_COVERAGE to them.
 */

const { test, describe, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const INSTALL_PATH = path.join(__dirname, '..', 'bin', 'install.js');
const { parseJsonc } = require('../bin/lib/settings');

const tmpDirs = [];
function tmp(prefix = 'gsd-cli-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}
after(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
});

const RUNTIME_ENV_VARS = [
  'GSD_TEST_MODE', 'OPENCODE_CONFIG_DIR', 'OPENCODE_CONFIG', 'XDG_CONFIG_HOME',
  'CLAUDE_CONFIG_DIR', 'GEMINI_CONFIG_DIR', 'CODEX_HOME', 'COPILOT_CONFIG_DIR',
  'ANTIGRAVITY_CONFIG_DIR', 'CURSOR_CONFIG_DIR', 'WINDSURF_CONFIG_DIR', 'WSL_DISTRO_NAME',
];

/** Sandboxed env: fresh HOME, no runtime overrides, no test-mode exports. */
function sandboxEnv(home, extra = {}) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
  for (const key of RUNTIME_ENV_VARS) if (!(key in extra)) delete env[key];
  return env;
}

/** Run `node bin/install.js <flags>` (or `node -e script` when opts.script is set). */
function run(flags, { cwd, home = cwd, script, extraEnv } = {}) {
  const argv = script ? ['-e', script] : [INSTALL_PATH, ...flags];
  const result = spawnSync(process.execPath, argv, {
    cwd,
    env: sandboxEnv(home, extraEnv),
    encoding: 'utf8',
    input: '',
    timeout: 120000,
  });
  if (result.error) throw result.error;
  return result;
}

const ALL_RUNTIMES = ['claude', 'opencode', 'gemini', 'codex', 'copilot', 'antigravity', 'cursor', 'windsurf'];
const DIR_NAMES = {
  claude: '.claude', opencode: '.opencode', gemini: '.gemini', codex: '.codex',
  copilot: '.github', antigravity: '.agent', cursor: '.cursor', windsurf: '.windsurf',
};

function hasGsdHookEntries(settings) {
  return Object.values(settings.hooks || {}).some(entries =>
    entries.some(e => (e.hooks || []).some(h => /gsd-/.test(h.command || '')))
  );
}

function gsdEntries(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.startsWith('gsd-')) : [];
}

describe('install.js CLI error paths and help', () => {
  const cwd = tmp();

  test('--global with --local exits 1', () => {
    const r = run(['--global', '--local'], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /Cannot specify both --global and --local/);
  });

  test('--config-dir with --local exits 1', () => {
    const r = run(['--config-dir', path.join(cwd, 'cfg'), '--local'], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /Cannot use --config-dir with --local/);
  });

  test('--uninstall without a location exits 1', () => {
    const r = run(['--uninstall'], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /--uninstall requires --global or --local/);
  });

  test('--config-dir without a value exits 1', () => {
    const r = run(['--config-dir'], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /--config-dir requires a path argument/);
  });

  test('--config-dir followed by another flag exits 1', () => {
    const r = run(['--config-dir', '--global'], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /--config-dir requires a path argument/);
  });

  test('--config-dir= with empty value exits 1', () => {
    const r = run(['--config-dir='], { cwd });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /--config-dir requires a non-empty path/);
  });

  test('--help prints usage and exits 0', () => {
    const r = run(['--help'], { cwd });
    assert.strictEqual(r.status, 0);
    assert.match(r.stdout, /Usage:/);
    assert.match(r.stdout, /--force-statusline/);
  });
});

describe('install.js --all --local install and uninstall', () => {
  const cwd = tmp();

  test('--all --local installs every runtime', () => {
    const r = run(['--all', '--local'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    for (const rt of ALL_RUNTIMES) {
      assert.ok(fs.existsSync(path.join(cwd, DIR_NAMES[rt])), `${DIR_NAMES[rt]} missing`);
    }
    const settings = JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'settings.json'), 'utf8'));
    assert.ok(hasGsdHookEntries(settings), 'claude settings.json should register gsd hooks');
    assert.ok(settings.statusLine && /gsd-statusline/.test(settings.statusLine.command));
    assert.ok(fs.existsSync(path.join(cwd, '.codex', 'config.toml')));
    const oc = JSON.parse(fs.readFileSync(path.join(cwd, '.opencode', 'opencode.json'), 'utf8'));
    assert.ok(Object.keys(oc.permission.read).some(k => k.includes('get-shit-done')));
  });

  test('--all --local --uninstall removes GSD artifacts from every runtime', () => {
    const r = run(['--all', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Removed commands\/gsd\//);
    assert.match(r.stdout, /Removed GSD commands from command\//);
    assert.match(r.stdout, /Removed \d+ GSD hooks/);
    assert.match(r.stdout, /Removed GSD statusline from settings/);
    assert.match(r.stdout, /Removed GSD hooks from settings/);
    assert.match(r.stdout, /agent \.toml configs/);
    assert.match(r.stdout, /config\.toml/);
    assert.match(r.stdout, /Removed GSD permissions from opencode\.json/);

    for (const rt of ALL_RUNTIMES) {
      const dir = path.join(cwd, DIR_NAMES[rt]);
      assert.ok(!fs.existsSync(path.join(dir, 'get-shit-done')), `${rt}: get-shit-done/ remains`);
      assert.ok(!fs.existsSync(path.join(dir, 'commands', 'gsd')), `${rt}: commands/gsd remains`);
      assert.deepStrictEqual(gsdEntries(path.join(dir, 'skills')), [], `${rt}: gsd skills remain`);
      assert.deepStrictEqual(gsdEntries(path.join(dir, 'agents')).filter(f => f.endsWith('.md')), [], `${rt}: gsd agents remain`);
      assert.deepStrictEqual(gsdEntries(path.join(dir, 'command')), [], `${rt}: flat gsd commands remain`);
    }
    const hooksDir = path.join(cwd, '.claude', 'hooks');
    const remainingHooks = gsdEntries(hooksDir);
    assert.deepStrictEqual(remainingHooks, [], 'gsd hook files remain');

    const settingsPath = path.join(cwd, '.claude', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      assert.ok(!settings.statusLine, 'statusline should be removed');
    }
    // Every settings.json-based runtime must lose every gsd-* hook registration,
    // including cost-tracker, config-protection, and spawn-tracker.
    for (const rt of ['claude', 'gemini', 'antigravity']) {
      const sp = path.join(cwd, DIR_NAMES[rt], 'settings.json');
      if (!fs.existsSync(sp)) continue;
      const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
      assert.ok(!hasGsdHookEntries(s), `${rt}: settings.json still registers gsd hooks: ${JSON.stringify(s.hooks)}`);
    }
    const ocPath = path.join(cwd, '.opencode', 'opencode.json');
    if (fs.existsSync(ocPath)) {
      const oc = JSON.parse(fs.readFileSync(ocPath, 'utf8'));
      assert.ok(!oc.permission, 'opencode permission block should be gone');
    }
  });

  test('second uninstall reports nothing to remove', () => {
    const r = run(['--all', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /No GSD files found to remove/);
  });

  test('uninstall of a missing directory reports nothing to uninstall', () => {
    const r = run(['--cursor', '--local', '--uninstall'], { cwd: tmp() });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Directory does not exist/);
    assert.match(r.stdout, /Nothing to uninstall/);
  });
});

describe('install.js --both and opencode config handling', () => {
  test('--both --local installs claude + opencode and uninstalls cleanly', () => {
    const cwd = tmp();
    let r = run(['--both', '--local'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(cwd, '.claude', 'get-shit-done')));
    assert.ok(fs.existsSync(path.join(cwd, '.opencode', 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(cwd, '.gemini')));

    r = run(['--both', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(!fs.existsSync(path.join(cwd, '.claude', 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(cwd, '.opencode', 'get-shit-done')));
  });

  test('opencode.jsonc with comments and trailing commas is parsed and extended', () => {
    const cwd = tmp();
    const ocDir = path.join(cwd, '.opencode');
    fs.mkdirSync(ocDir, { recursive: true });
    const jsoncPath = path.join(ocDir, 'opencode.jsonc');
    fs.writeFileSync(jsoncPath, `{
  // user comment
  "model": "anthropic/claude", /* inline */
  "permission": { "read": { "~/docs/*": "allow", }, },
}
`);
    const r = run(['--opencode', '--local'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Configured read permission for GSD docs/);
    const oc = JSON.parse(fs.readFileSync(jsoncPath, 'utf8'));
    assert.strictEqual(oc.model, 'anthropic/claude');
    assert.strictEqual(oc.permission.read['~/docs/*'], 'allow');
    assert.ok(Object.keys(oc.permission.external_directory).some(k => k.includes('get-shit-done')));

    // Re-install: permissions already present → no rewrite message
    const r2 = run(['--opencode', '--local'], { cwd });
    assert.strictEqual(r2.status, 0, r2.stderr);
    assert.doesNotMatch(r2.stdout, /Configured read permission for GSD docs/);

    // Uninstall leaves the user's own permission in place
    const r3 = run(['--opencode', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r3.status, 0, r3.stderr);
    const after = JSON.parse(fs.readFileSync(jsoncPath, 'utf8'));
    assert.strictEqual(after.permission.read['~/docs/*'], 'allow');
    assert.ok(!after.permission.external_directory);
  });

  test('malformed opencode.json is left untouched with a warning', () => {
    const cwd = tmp();
    const ocDir = path.join(cwd, '.opencode');
    fs.mkdirSync(ocDir, { recursive: true });
    const cfgPath = path.join(ocDir, 'opencode.json');
    fs.writeFileSync(cfgPath, '{ not json');
    const r = run(['--opencode', '--local'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Could not parse opencode\.json/);
    assert.strictEqual(fs.readFileSync(cfgPath, 'utf8'), '{ not json');

    const r2 = run(['--opencode', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r2.status, 0, r2.stderr);
    assert.strictEqual(fs.readFileSync(cfgPath, 'utf8'), '{ not json');
  });

  test('codex config.toml with user sections is cleaned, not deleted', () => {
    const cwd = tmp();
    const codexDir = path.join(cwd, '.codex');
    fs.mkdirSync(codexDir, { recursive: true });
    const cfgPath = path.join(codexDir, 'config.toml');
    fs.writeFileSync(cfgPath, 'model = "o3"\n\n[features]\ncodex_hooks = true\n');
    let r = run(['--codex', '--local'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(fs.readFileSync(cfgPath, 'utf8'), /model = "o3"/);
    r = run(['--codex', '--local', '--uninstall'], { cwd });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(cfgPath), 'user config.toml should survive');
    const content = fs.readFileSync(cfgPath, 'utf8');
    assert.match(content, /model = "o3"/);
    assert.doesNotMatch(content, /gsd-/);
  });
});

describe('install.js non-interactive defaults and global sandboxed HOME', () => {
  test('no flags with piped stdin defaults to Claude Code global install', () => {
    const cwd = tmp();
    const home = tmp('gsd-home-');
    const r = run([], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Non-interactive terminal detected, defaulting to Claude Code global install/);
    assert.ok(fs.existsSync(path.join(home, '.claude', 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(cwd, '.claude')));
  });

  test('runtime flag without location defaults to global install', () => {
    const cwd = tmp();
    const home = tmp('gsd-home-');
    const r = run(['--cursor'], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Non-interactive terminal detected, defaulting to global install/);
    assert.ok(fs.existsSync(path.join(home, '.cursor', 'get-shit-done')));
  });

  test('--global alone installs claude, and --global --uninstall removes governance', () => {
    const cwd = tmp();
    const home = tmp('gsd-home-');
    let r = run(['--global'], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    const claudeDir = path.join(home, '.claude');
    assert.ok(fs.existsSync(path.join(claudeDir, 'get-shit-done')));
    assert.ok(fs.existsSync(path.join(claudeDir, 'commands', 'gsd')));

    r = run(['--claude', '--global', '--uninstall'], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(!fs.existsSync(path.join(claudeDir, 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(claudeDir, 'commands', 'gsd')));
    assert.match(r.stdout, /GSD has been uninstalled from Claude Code/);
  });

  test('--config-dir routes a global install to the given directory', () => {
    const cwd = tmp();
    const home = tmp('gsd-home-');
    const cfg = path.join(home, 'codex-work');
    let r = run(['--codex', '--global', `--config-dir=${cfg}`], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(cfg, 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(home, '.codex')));
    r = run(['--codex', '--global', '--config-dir', cfg, '--uninstall'], { cwd, home });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(!fs.existsSync(path.join(cfg, 'get-shit-done')));
  });
});

describe('install.js interactive prompts (stubbed readline)', () => {
  /**
   * Child script: fake a TTY, replace readline.createInterface with a scripted
   * responder, then load install.js so promptRuntime/promptLocation run for real.
   */
  function promptScript(answers) {
    return `
      const readline = require('readline');
      const answers = ${JSON.stringify(answers)};
      readline.createInterface = () => ({
        on() {},
        close() {},
        question(_prompt, cb) { setImmediate(() => cb(answers.shift())); },
      });
      process.stdin.isTTY = true;
      process.argv = [process.argv[0], ${JSON.stringify(INSTALL_PATH)}];
      require(${JSON.stringify(INSTALL_PATH)});
    `;
  }

  test('"9" then "2" installs all runtimes locally', () => {
    const cwd = tmp();
    const r = run([], { cwd, script: promptScript(['9', '2']) });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Which runtime\(s\) would you like to install for\?/);
    assert.match(r.stdout, /Where would you like to install\?/);
    for (const rt of ALL_RUNTIMES) {
      assert.ok(fs.existsSync(path.join(cwd, DIR_NAMES[rt], 'get-shit-done')), `${rt} not installed locally`);
    }
  });

  test('"1 7" then empty answer installs claude + cursor globally', () => {
    const cwd = tmp();
    const home = tmp('gsd-home-');
    const r = run([], { cwd, home, script: promptScript(['1 7', '']) });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(home, '.claude', 'get-shit-done')));
    assert.ok(fs.existsSync(path.join(home, '.cursor', 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(home, '.gemini')));
    assert.ok(!fs.existsSync(path.join(cwd, '.claude')));
  });

  test('invalid runtime choice falls back to claude', () => {
    const cwd = tmp();
    const r = run([], { cwd, script: promptScript(['bogus', '2']) });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(cwd, '.claude', 'get-shit-done')));
    assert.ok(!fs.existsSync(path.join(cwd, '.opencode')));
  });

  test('runtime flag + TTY prompts for location only', () => {
    const cwd = tmp();
    const script = promptScript(['2']).replace(
      'process.argv = [process.argv[0], ' + JSON.stringify(INSTALL_PATH) + '];',
      'process.argv = [process.argv[0], ' + JSON.stringify(INSTALL_PATH) + ', "--windsurf"];'
    );
    const r = run([], { cwd, script });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Which runtime\(s\)/);
    assert.match(r.stdout, /Where would you like to install\?/);
    assert.ok(fs.existsSync(path.join(cwd, '.windsurf', 'get-shit-done')));
  });

  test('closing the prompt without answering cancels with exit 0', () => {
    const cwd = tmp();
    const script = `
      const readline = require('readline');
      readline.createInterface = () => {
        const handlers = {};
        return {
          on(ev, fn) { handlers[ev] = fn; },
          close() {},
          question() { setImmediate(() => handlers.close()); },
        };
      };
      process.stdin.isTTY = true;
      process.argv = [process.argv[0], ${JSON.stringify(INSTALL_PATH)}];
      require(${JSON.stringify(INSTALL_PATH)});
    `;
    const r = run([], { cwd, script });
    assert.strictEqual(r.status, 0, r.stderr);
    assert.match(r.stdout, /Installation cancelled/);
    assert.ok(!fs.existsSync(path.join(cwd, '.claude')));
  });
});

describe('install.js WSL guard', () => {
  test('Windows-native Node under WSL exits 1 with guidance', () => {
    const cwd = tmp();
    const script = `
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.argv = [process.argv[0], ${JSON.stringify(INSTALL_PATH)}, '--help'];
      require(${JSON.stringify(INSTALL_PATH)});
    `;
    const r = run([], { cwd, script, extraEnv: { WSL_DISTRO_NAME: 'Ubuntu' } });
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /Detected WSL with Windows-native Node\.js/);
  });
});

describe('settings.parseJsonc', () => {
  test('strips a BOM', () => {
    assert.deepStrictEqual(parseJsonc('﻿{"a":1}'), { a: 1 });
  });

  test('removes line and block comments', () => {
    const src = `{
      // line comment
      "a": 1, /* block
      comment */ "b": 2
    }`;
    assert.deepStrictEqual(parseJsonc(src), { a: 1, b: 2 });
  });

  test('keeps comment-like sequences inside strings', () => {
    assert.deepStrictEqual(parseJsonc('{"url": "http://x/*y*/z", "s": "a // b"}'),
      { url: 'http://x/*y*/z', s: 'a // b' });
  });

  test('handles escaped quotes inside strings', () => {
    assert.deepStrictEqual(parseJsonc('{"q": "say \\"hi\\" // not a comment"}'),
      { q: 'say "hi" // not a comment' });
  });

  test('removes trailing commas before } and ]', () => {
    assert.deepStrictEqual(parseJsonc('{"a": [1, 2,], "b": {"c": 3,},}'), { a: [1, 2], b: { c: 3 } });
  });

  test('throws on invalid JSON', () => {
    assert.throws(() => parseJsonc('{ not json'), SyntaxError);
  });
});
