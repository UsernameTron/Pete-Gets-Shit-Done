/**
 * Branch coverage for bin/lib/install-steps.js, attribution.js and toml.js.
 * Everything runs in-process against mkdtemp sandboxes; console output and
 * process.exit/process.cwd are stubbed and restored per test.
 */

const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const cliOptions = require('../bin/lib/cli-options');
const steps = require('../bin/lib/install-steps');
const toml = require('../bin/lib/toml');
const { processAttribution } = require('../bin/lib/attribution');

const tmpDirs = [];
function tmp(prefix = 'gsd-lib-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}
function write(file, content = 'x') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const saved = {
  log: console.log, error: console.error, warn: console.warn,
  exit: process.exit, cwd: process.cwd,
  cli: { ...cliOptions },
  env: { ...process.env },
};
afterEach(() => {
  console.log = saved.log; console.error = saved.error; console.warn = saved.warn;
  process.exit = saved.exit; process.cwd = saved.cwd;
  Object.assign(cliOptions, saved.cli);
  for (const k of Object.keys(process.env)) if (!(k in saved.env)) delete process.env[k];
  Object.assign(process.env, saved.env);
  for (const dir of tmpDirs.splice(0)) {
    for (const locked of ['locked', 'secret.md']) {
      try { fs.chmodSync(path.join(dir, 'cfg', locked), 0o755); } catch { /* absent */ }
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/** Capture console output; returns { out, err } arrays of joined lines. */
function capture() {
  const cap = { out: [], err: [] };
  console.log = (...a) => cap.out.push(a.join(' '));
  console.warn = (...a) => cap.err.push(a.join(' '));
  console.error = (...a) => cap.err.push(a.join(' '));
  return cap;
}

/** Fresh attribution module (its per-runtime cache is module-level). */
function freshAttribution() {
  delete require.cache[require.resolve('../bin/lib/attribution')];
  return require('../bin/lib/attribution');
}

// ─── attribution.js ───────────────────────────────────────────────────────────

describe('attribution.getCommitAttribution', () => {
  function withSettings(runtime, settings) {
    const dir = tmp();
    if (settings !== undefined) write(path.join(dir, 'settings.json'), JSON.stringify(settings));
    cliOptions.explicitConfigDir = dir;
    return freshAttribution().getCommitAttribution(runtime);
  }

  for (const runtime of ['claude', 'gemini']) {
    describe(runtime, () => {
      test('no settings file keeps default (undefined)', () => {
        assert.strictEqual(withSettings(runtime, undefined), undefined);
      });
      test('attribution without commit key keeps default', () => {
        assert.strictEqual(withSettings(runtime, { attribution: {} }), undefined);
      });
      test('empty commit string means remove (null)', () => {
        assert.strictEqual(withSettings(runtime, { attribution: { commit: '' } }), null);
      });
      test('custom commit string is returned', () => {
        assert.strictEqual(withSettings(runtime, { attribution: { commit: 'Bot <b@x.io>' } }), 'Bot <b@x.io>');
      });
    });
  }

  test('result is cached per runtime', () => {
    const dir = tmp();
    write(path.join(dir, 'settings.json'), JSON.stringify({ attribution: { commit: 'A' } }));
    cliOptions.explicitConfigDir = dir;
    const mod = freshAttribution();
    assert.strictEqual(mod.getCommitAttribution('claude'), 'A');
    write(path.join(dir, 'settings.json'), JSON.stringify({ attribution: { commit: 'B' } }));
    assert.strictEqual(mod.getCommitAttribution('claude'), 'A');
  });

  describe('opencode', () => {
    function withOpencode(file, config) {
      const dir = tmp();
      if (config !== undefined) write(path.join(dir, file), typeof config === 'string' ? config : JSON.stringify(config));
      process.env.OPENCODE_CONFIG_DIR = dir;
      return freshAttribution().getCommitAttribution('opencode');
    }
    test('disable_ai_attribution true means remove (null)', () => {
      assert.strictEqual(withOpencode('opencode.json', { disable_ai_attribution: true }), null);
    });
    test('flag absent keeps default', () => {
      assert.strictEqual(withOpencode('opencode.json', {}), undefined);
    });
    test('prefers opencode.jsonc when present', () => {
      assert.strictEqual(withOpencode('opencode.jsonc', '{ "disable_ai_attribution": true }'), null);
    });
  });

  test('codex and copilot have no attribution setting', () => {
    const mod = freshAttribution();
    assert.strictEqual(mod.getCommitAttribution('codex'), undefined);
    assert.strictEqual(mod.getCommitAttribution('copilot'), undefined);
  });
});

describe('attribution.processAttribution', () => {
  const body = 'feat: x\n\nCo-Authored-By: Claude <c@a.com>';
  test('null removes the trailer and preceding blank line', () => {
    assert.strictEqual(processAttribution(body, null), 'feat: x');
  });
  test('undefined leaves content untouched', () => {
    assert.strictEqual(processAttribution(body, undefined), body);
  });
  test('string replaces the trailer, treating $ literally', () => {
    assert.strictEqual(processAttribution(body, 'Me $& <m@x>'), 'feat: x\n\nCo-Authored-By: Me $& <m@x>');
  });
});

// ─── toml.js ──────────────────────────────────────────────────────────────────

describe('toml.findTomlAssignmentEquals', () => {
  test('skips equals inside single and double quoted keys', () => {
    assert.strictEqual(toml.findTomlAssignmentEquals(`'a=b' = 1`), 6);
    assert.strictEqual(toml.findTomlAssignmentEquals('"a\\"=b" = 1'), 8);
  });
  test('returns -1 for comment-first, no equals, and unterminated quotes', () => {
    assert.strictEqual(toml.findTomlAssignmentEquals('# a = 1'), -1);
    assert.strictEqual(toml.findTomlAssignmentEquals('plain'), -1);
    assert.strictEqual(toml.findTomlAssignmentEquals(`'open = 1`), -1);
    assert.strictEqual(toml.findTomlAssignmentEquals('"open = 1'), -1);
  });
});

describe('toml.getTomlLineRecords / getTomlTableSections', () => {
  function keysOf(content) {
    return toml.getTomlLineRecords(content).map(r => r.keySegments && r.keySegments.join('.'));
  }
  test('parses dotted and quoted keys', () => {
    assert.deepStrictEqual(keysOf(`a.b = 1\n"x.y" . 'z' = 2\n`).slice(0, 2), ['a.b', 'x.y.z']);
  });
  test('rejects malformed keys', () => {
    assert.deepStrictEqual(keysOf(`1$ = 1\n'open' x = 1\n"bad\\" = 1\n`).slice(0, 3), [null, null, null]);
    assert.strictEqual(keysOf(`a b = 1\n`)[0], null);
    assert.strictEqual(keysOf(`= 1\n`)[0], null);
    assert.strictEqual(keysOf(`'unclosed = 1\n`)[0], null);
  });
  test('lines inside a multiline string are not parsed as headers or keys', () => {
    const recs = toml.getTomlLineRecords('k = """\n[fake]\nz = 1\n"""\n[real]\n');
    assert.strictEqual(recs[1].startsInMultilineString, true);
    assert.strictEqual(recs[1].tableHeader, null);
    assert.strictEqual(recs[2].keySegments, null);
    assert.strictEqual(recs[4].tableHeader.path, 'real');
  });
  test('table sections: arrays, quoted segments, trailing comments, last section end', () => {
    const content = `[[a.b]]\nx=1\n[ "q.r" . 's' ] # c\ny=2\n`;
    const sections = toml.getTomlTableSections(content);
    assert.deepStrictEqual(sections.map(s => [s.path, s.array]), [['a.b', true], ['q.r.s', false]]);
    assert.strictEqual(sections[0].end, sections[1].start);
    assert.strictEqual(sections[1].end, content.length);
  });
  test('invalid headers are not sections', () => {
    const bad = ['[a', '[a] junk', '[a # c]', '[]', '[a b]', '["a]'];
    for (const line of bad) {
      assert.deepStrictEqual(toml.getTomlTableSections(line + '\n'), [], line);
    }
  });
  test('quoted header segments with escapes and literal quotes', () => {
    const sections = toml.getTomlTableSections(`["a\\"]b"]\n['c]d']\n`);
    assert.deepStrictEqual(sections.map(s => s.path), ['a"]b', 'c]d']);
  });
});

describe('toml.collapseTomlBlankLines / removeContentRanges', () => {
  test('collapses 3+ blank lines using the detected EOL', () => {
    assert.strictEqual(toml.collapseTomlBlankLines('a\n\n\n\nb'), 'a\n\nb');
    assert.strictEqual(toml.collapseTomlBlankLines('a\r\n\r\n\r\n\r\nb'), 'a\r\n\r\nb');
  });
  test('removeContentRanges: empty/invalid ranges are a no-op', () => {
    assert.strictEqual(toml.removeContentRanges('abc', []), 'abc');
    assert.strictEqual(toml.removeContentRanges('abc', [null, { start: 2, end: 2 }]), 'abc');
  });
  test('merges overlapping and keeps disjoint ranges', () => {
    assert.strictEqual(
      toml.removeContentRanges('0123456789', [{ start: 6, end: 8 }, { start: 1, end: 4 }, { start: 3, end: 5 }]),
      '0589'
    );
  });
});

describe('toml.findTomlAssignmentBlockEnd', () => {
  function endOf(content, idx = 0) {
    const rec = toml.getTomlLineRecords(content).filter(r => r.keySegments)[idx];
    return toml.findTomlAssignmentBlockEnd(content, rec);
  }
  test('simple value ends after its newline', () => {
    assert.strictEqual(endOf('a = 1\nb = 2\n'), 6);
  });
  test('line without equals falls back to end of line', () => {
    const rec = { text: 'junk', start: 0, end: 4, eol: '\n' };
    assert.strictEqual(toml.findTomlAssignmentBlockEnd('junk\nz', rec), 5);
  });
  test('multi-line arrays and inline tables span lines', () => {
    const c = 'a = [\n1,\n2\n]\nb = 1\n';
    assert.strictEqual(c.slice(endOf(c)), 'b = 1\n');
    const t = 'a = {\nx = 1 }\nb = 1\n';
    assert.strictEqual(t.slice(endOf(t)), 'b = 1\n');
  });
  test('unbalanced closers do not go negative', () => {
    const c = 'a = ]}\nb = 1\n';
    assert.strictEqual(c.slice(endOf(c)), 'b = 1\n');
  });
  test('quoted strings may contain brackets, hashes and escapes; comments are skipped', () => {
    const c = `a = "x]\\"[ # " # tail [\nb = 1\n`;
    assert.strictEqual(c.slice(endOf(c)), 'b = 1\n');
    const l = `a = '[{#'\nb = 1\n`;
    assert.strictEqual(l.slice(endOf(l)), 'b = 1\n');
  });
  test('triple-quoted strings span lines; unterminated runs to EOF', () => {
    const c = `a = """\nx\n"""\nb = 1\n`;
    assert.strictEqual(c.slice(endOf(c)), 'b = 1\n');
    const lit = `a = '''\nx\n'''\nb = 1\n`;
    assert.strictEqual(lit.slice(endOf(lit)), 'b = 1\n');
    const open = `a = """\nx\n`;
    assert.strictEqual(endOf(open), open.length);
    const openLit = `a = '''\nx\n`;
    assert.strictEqual(endOf(openLit), openLit.length);
  });
  test('last line without trailing newline runs to EOF', () => {
    assert.strictEqual(endOf('a = 1'), 5);
  });
});

// ─── install-steps.js ─────────────────────────────────────────────────────────

/** Minimal package-source tree for installPayload. */
function makeSrc(root, { agents = true, hooks = true, changelog = true, injection = true } = {}) {
  const src = path.join(root, 'src');
  write(path.join(src, 'commands', 'gsd', 'help.md'), 'help');
  write(path.join(src, 'get-shit-done', 'README.md'), 'core');
  if (agents) {
    write(path.join(src, 'agents', 'gsd-a.md'), 'See ~/.claude/x and $HOME/.claude/y');
    write(path.join(src, 'agents', 'notes.txt'), 'ignored');
    fs.mkdirSync(path.join(src, 'agents', 'sub.md'));
  }
  if (hooks) {
    write(path.join(src, 'hooks', 'dist', 'h.js'), "dir='.claude' v={{GSD_VERSION}}");
    write(path.join(src, 'hooks', 'dist', 'h.sh'), 'echo');
    fs.mkdirSync(path.join(src, 'hooks', 'dist', 'nested'));
  }
  if (changelog) write(path.join(src, 'CHANGELOG.md'), '# log');
  if (injection) write(path.join(src, 'lib', 'injection-patterns.json'), '[]');
  return src;
}

function makeCtx(root, overrides = {}) {
  const targetDir = path.join(root, 'cfg');
  fs.mkdirSync(targetDir, { recursive: true });
  return {
    isGlobal: true, runtime: 'codex', dirName: '.codex', src: makeSrc(root), targetDir,
    locationLabel: 'x', pathPrefix: '/p/', runtimeLabel: 'Codex', failures: [], ...overrides,
  };
}

describe('install-steps small helpers', () => {
  test('cleanupOrphanedFiles removes known orphans and reports them', () => {
    const dir = tmp();
    write(path.join(dir, 'hooks', 'gsd-notify.sh'));
    write(path.join(dir, 'hooks', 'statusline.js'));
    write(path.join(dir, 'hooks', 'keep.js'));
    const cap = capture();
    steps.cleanupOrphanedFiles(dir);
    assert.ok(!fs.existsSync(path.join(dir, 'hooks', 'gsd-notify.sh')));
    assert.ok(!fs.existsSync(path.join(dir, 'hooks', 'statusline.js')));
    assert.ok(fs.existsSync(path.join(dir, 'hooks', 'keep.js')));
    assert.strictEqual(cap.out.filter(l => l.includes('Removed orphaned')).length, 2);
  });

  test('cleanupOrphanedFiles is silent when nothing is orphaned', () => {
    const cap = capture();
    steps.cleanupOrphanedFiles(tmp());
    assert.deepStrictEqual(cap.out, []);
  });

  test('verifyInstalled: missing, empty, populated, and unreadable', () => {
    const dir = tmp();
    const cap = capture();
    assert.strictEqual(steps.verifyInstalled(path.join(dir, 'nope'), 'a'), false);
    fs.mkdirSync(path.join(dir, 'empty'));
    assert.strictEqual(steps.verifyInstalled(path.join(dir, 'empty'), 'b'), false);
    write(path.join(dir, 'full', 'f'));
    assert.strictEqual(steps.verifyInstalled(path.join(dir, 'full'), 'c'), true);
    assert.strictEqual(steps.verifyInstalled(path.join(dir, 'full', 'f'), 'd'), false); // ENOTDIR
    assert.match(cap.err[0], /directory not created/);
    assert.match(cap.err[1], /directory is empty/);
    assert.match(cap.err[2], /Failed to install d/);
  });

  test('noSettingsResult has no settings and echoes the runtime', () => {
    assert.deepStrictEqual(steps.noSettingsResult({ runtime: 'codex' }),
      { settingsPath: null, settings: null, statuslineCommand: null, runtime: 'codex' });
  });
});

describe('install-steps command/skill installers', () => {
  test('installNestedCommands copies commands/gsd', () => {
    const ctx = makeCtx(tmp(), { runtime: 'claude' });
    capture();
    steps.installNestedCommands(ctx);
    assert.ok(fs.existsSync(path.join(ctx.targetDir, 'commands', 'gsd', 'help.md')));
    assert.deepStrictEqual(ctx.failures, []);
  });

  test('installNestedCommands records a failure when the source is empty', () => {
    const ctx = makeCtx(tmp(), { runtime: 'claude' });
    fs.rmSync(path.join(ctx.src, 'commands', 'gsd', 'help.md'));
    capture();
    steps.installNestedCommands(ctx);
    assert.deepStrictEqual(ctx.failures, ['commands/gsd']);
  });

  test('installPrefixedSkills succeeds when skills are produced, fails when none', () => {
    const ctx = makeCtx(tmp());
    capture();
    const seen = [];
    steps.installPrefixedSkills(ctx, (src, dest, prefix, pathPrefix, runtime) => {
      seen.push([prefix, pathPrefix, runtime]);
      write(path.join(dest, 'gsd-help', 'SKILL.md'));
    });
    assert.deepStrictEqual(seen, [['gsd', '/p/', 'codex']]);
    assert.deepStrictEqual(ctx.failures, []);
    const bad = makeCtx(tmp());
    steps.installPrefixedSkills(bad, () => {});
    assert.deepStrictEqual(bad.failures, ['skills/gsd-*']);
  });

  test('installScopedSkills: success, no gsd- dirs, and missing skills dir', () => {
    capture();
    const ok = makeCtx(tmp());
    steps.installScopedSkills(ok, (s, dest, prefix, isGlobal) => {
      assert.strictEqual(isGlobal, true);
      write(path.join(dest, 'gsd-a', 'SKILL.md'));
    });
    assert.deepStrictEqual(ok.failures, []);

    const noGsd = makeCtx(tmp());
    steps.installScopedSkills(noGsd, (s, dest) => write(path.join(dest, 'other', 'SKILL.md')));
    assert.deepStrictEqual(noGsd.failures, ['skills/gsd-*']);

    const none = makeCtx(tmp());
    steps.installScopedSkills(none, () => {});
    assert.deepStrictEqual(none.failures, ['skills/gsd-*']);
  });
});

describe('install-steps installPayload', () => {
  class Exit extends Error {}
  function trapExit() {
    const codes = [];
    process.exit = (code) => { codes.push(code); throw new Exit(String(code)); };
    return codes;
  }

  test('codex profile: agents rewritten, metadata + manifest written, no hooks', () => {
    const ctx = makeCtx(tmp());
    const cap = capture();
    steps.installPayload(ctx, {
      agentFileName: (n) => n.replace(/\.md$/, '.agent.md'),
      convertAgent: (c) => `CONVERTED:${c}`,
      installsHooks: false,
    });
    const agent = fs.readFileSync(path.join(ctx.targetDir, 'agents', 'gsd-a.agent.md'), 'utf8');
    assert.strictEqual(agent, 'CONVERTED:See /p/x and /p/y');
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'agents', 'notes.txt')));
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'hooks')));
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'get-shit-done', 'CHANGELOG.md'), 'utf8'), '# log');
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'lib', 'injection-patterns.json'), 'utf8'), '[]');
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'get-shit-done', 'VERSION'), 'utf8'), require('../package.json').version);
    assert.ok(cap.out.some(l => l.includes('Wrote file manifest')));
  });

  test('keepClaudePaths leaves ~/.claude references in agents untouched', () => {
    const ctx = makeCtx(tmp());
    capture();
    steps.installPayload(ctx, { keepClaudePaths: true, installsHooks: false });
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'agents', 'gsd-a.md'), 'utf8'),
      'See ~/.claude/x and $HOME/.claude/y');
  });

  test('stale gsd-*.md agents are replaced; user agents survive', () => {
    const ctx = makeCtx(tmp());
    write(path.join(ctx.targetDir, 'agents', 'gsd-old.md'));
    write(path.join(ctx.targetDir, 'agents', 'mine.md'));
    capture();
    steps.installPayload(ctx, { installsHooks: false });
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'agents', 'gsd-old.md')));
    assert.ok(fs.existsSync(path.join(ctx.targetDir, 'agents', 'mine.md')));
  });

  test('hooks profile: package.json marker, templated .js (executable), plain copy, stale cache cleared', () => {
    const root = tmp();
    const ctx = makeCtx(root, { runtime: 'gemini', dirName: '.gemini' });
    write(path.join(root, 'cache', 'gsd-update-check.json'), '{}');
    capture();
    steps.installPayload(ctx, { installsHooks: true });
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'package.json'), 'utf8'), '{"type":"commonjs"}\n');
    const js = fs.readFileSync(path.join(ctx.targetDir, 'hooks', 'h.js'), 'utf8');
    assert.strictEqual(js, `dir='.gemini' v=${require('../package.json').version}`);
    assert.ok(fs.statSync(path.join(ctx.targetDir, 'hooks', 'h.js')).mode & 0o100);
    assert.strictEqual(fs.readFileSync(path.join(ctx.targetDir, 'hooks', 'h.sh'), 'utf8'), 'echo');
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'hooks', 'nested')));
    assert.ok(!fs.existsSync(path.join(root, 'cache', 'gsd-update-check.json')));
  });

  test('absent optional sources (agents, hooks/dist, CHANGELOG, injection patterns) are skipped', () => {
    const root = tmp();
    const ctx = makeCtx(root);
    ctx.src = makeSrc(path.join(root, 'bare'), { agents: false, hooks: false, changelog: false, injection: false });
    capture();
    steps.installPayload(ctx, { installsHooks: true });
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'agents')));
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'hooks')));
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'lib')));
    assert.ok(fs.existsSync(path.join(ctx.targetDir, 'get-shit-done', 'VERSION')));
  });

  test('pre-existing failures abort with exit(1) before writing the manifest', () => {
    const ctx = makeCtx(tmp());
    ctx.failures.push('skills/gsd-*');
    const codes = trapExit();
    const cap = capture();
    assert.throws(() => steps.installPayload(ctx, { installsHooks: false }), Exit);
    assert.deepStrictEqual(codes, [1]);
    assert.ok(cap.err.some(l => l.includes('Installation incomplete') && l.includes('skills/gsd-*')));
    assert.ok(!cap.out.some(l => l.includes('Wrote file manifest')));
  });

  test('core skill with an empty source records a get-shit-done failure', () => {
    const ctx = makeCtx(tmp());
    fs.rmSync(path.join(ctx.src, 'get-shit-done', 'README.md'));
    trapExit();
    const cap = capture();
    assert.throws(() => steps.installPayload(ctx, { installsHooks: false }), Exit);
    assert.ok(cap.err.some(l => l.includes('get-shit-done')));
  });

  test('leaked ~/.claude paths in non-Claude runtimes are warned about (top 5 + overflow)', () => {
    const ctx = makeCtx(tmp());
    for (let i = 0; i < 7; i++) write(path.join(ctx.src, 'get-shit-done', `l${i}.md`), 'see ~/.claude and $HOME/.claude here');
    write(path.join(ctx.src, 'get-shit-done', 'n.toml'), 'see ~/.claude here');
    write(path.join(ctx.src, 'get-shit-done', 'ok.md'), 'clean');
    const cap = capture();
    steps.installPayload(ctx, { installsHooks: false });
    const warn = cap.err.join('\n');
    assert.match(warn, /Found 15 unreplaced \.claude path reference\(s\) in 8 file\(s\)/);
    assert.match(warn, /and 3 more file\(s\)/);
    assert.match(warn, /may not resolve correctly for Codex/);
  });

  test('few leaks: warning has no overflow line', () => {
    const ctx = makeCtx(tmp());
    write(path.join(ctx.src, 'get-shit-done', 'l.md'), 'see ~/.claude here');
    const cap = capture();
    steps.installPayload(ctx, { installsHooks: false });
    assert.match(cap.err.join('\n'), /Found 1 unreplaced/);
    assert.ok(!cap.err.join('\n').includes('more file(s)'));
  });

  test('CHANGELOG.md is exempt from leak scanning and claude runtime is never scanned', () => {
    const codex = makeCtx(tmp());
    write(path.join(codex.src, 'CHANGELOG.md'), '~/.claude/old');
    const cap = capture();
    steps.installPayload(codex, { installsHooks: false });
    assert.ok(!cap.err.join('\n').includes('unreplaced'));

    const claude = makeCtx(tmp(), { runtime: 'claude' });
    write(path.join(claude.src, 'get-shit-done', 'l.md'), '~/.claude/a');
    cliOptions.hasNoGovernance = true;
    const cap2 = capture();
    steps.installPayload(claude, { keepClaudePaths: true, installsHooks: false });
    assert.ok(!cap2.err.join('\n').includes('unreplaced'));
  });

  test('unreadable files and directories are skipped by the leak scan',
    { skip: process.getuid && process.getuid() === 0 }, () => {
      const ctx = makeCtx(tmp());
      write(path.join(ctx.targetDir, 'locked', 'a.md'), 'see ~/.claude here');
      write(path.join(ctx.targetDir, 'secret.md'), 'see ~/.claude here');
      write(path.join(ctx.targetDir, 'visible.md'), 'see ~/.claude here');
      fs.chmodSync(path.join(ctx.targetDir, 'locked'), 0o000);
      fs.chmodSync(path.join(ctx.targetDir, 'secret.md'), 0o000);
      const cap = capture();
      steps.installPayload(ctx, { installsHooks: false });
      assert.match(cap.err.join('\n'), /Found 1 unreplaced \.claude path reference\(s\) in 1 file\(s\)/);
    });
});

describe('install-steps governance layer + scaffold', () => {
  test('--no-governance prints the exposure warning and skips governance files (claude)', () => {
    const ctx = makeCtx(tmp(), { runtime: 'claude' });
    cliOptions.hasNoGovernance = true;
    const cap = capture();
    steps.installPayload(ctx, { keepClaudePaths: true, installsHooks: false });
    const out = cap.out.join('\n');
    assert.match(out, /--no-governance: Governance layer SKIPPED/);
    assert.match(out, /Plugin governance integration/);
    assert.ok(!fs.existsSync(path.join(ctx.targetDir, 'CLAUDE.md')));
  });

  test('governance on with missing package governance/ pushes a failure entry (fail loud)', () => {
    const ctx = makeCtx(tmp(), { runtime: 'claude' });
    cliOptions.hasPlugins = true;
    capture();
    steps.installPayload(ctx, { keepClaudePaths: true, installsHooks: false });
    assert.deepStrictEqual(ctx.failures, ['governance: governance/ (package source missing)']);
  });

  test('--scaffold creates project structure in cwd (stubbed to a sandbox)', () => {
    const root = tmp();
    const proj = path.join(root, 'proj');
    fs.mkdirSync(proj);
    const ctx = makeCtx(root);
    cliOptions.hasScaffold = true;
    process.cwd = () => proj;
    capture();
    steps.installPayload(ctx, { installsHooks: false });
    assert.ok(fs.existsSync(path.join(proj, '.planning', 'phases')));
    assert.ok(fs.existsSync(path.join(proj, 'tasks', 'lessons.md')));
  });
});
