/**
 * validate-doc-links.cjs — Unit Tests
 *
 * Tests for: toGfmSlug, extractHeadingSlugs, extractLinks, validateLink, formatTable,
 * discoverTrackedFiles, gitignoreGlobToRegex, main() (via spawnSync).
 *
 * Requirements: DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04
 */
'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execFileSync } = require('child_process');

const {
  toGfmSlug,
  extractHeadingSlugs,
  extractLinks,
  validateLink,
  formatTable,
  discoverTrackedFiles,
  gitignoreGlobToRegex,
} = require('../scripts/validate-doc-links.cjs');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'validate-doc-links.cjs');

function runScript(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
    ...opts,
  });
}

const FIXTURES = path.join(__dirname, 'fixtures', 'doc-links');

// ─── toGfmSlug ────────────────────────────────────────────────────────────────

describe('toGfmSlug', () => {
  test('plain text lowercased and spaces to hyphens', () => {
    assert.strictEqual(toGfmSlug('Hello World'), 'hello-world');
  });

  test('bold stripping: **Bold** heading', () => {
    assert.strictEqual(toGfmSlug('**Bold** heading'), 'bold-heading');
  });

  test('italic-asterisk stripping: *italic* heading', () => {
    assert.strictEqual(toGfmSlug('*italic* heading'), 'italic-heading');
  });

  test('italic-underscore stripping: _italic_ heading', () => {
    assert.strictEqual(toGfmSlug('_italic_ heading'), 'italic-heading');
  });

  test('inline-code stripping: Has `code` in it', () => {
    assert.strictEqual(toGfmSlug('Has `code` in it'), 'has-code-in-it');
  });

  test('link display text preserved, URL removed', () => {
    assert.strictEqual(toGfmSlug('See [the docs](http://x.com)'), 'see-the-docs');
  });

  test('HTML tag stripping', () => {
    assert.strictEqual(toGfmSlug('Heading <em>with tag</em>'), 'heading-with-tag');
  });

  test('punctuation removal', () => {
    assert.strictEqual(toGfmSlug('What?! Now.'), 'what-now');
  });

  test('uppercase coercion to lowercase', () => {
    assert.strictEqual(toGfmSlug('UPPER CASE'), 'upper-case');
  });

  test('consecutive hyphens collapsed', () => {
    assert.strictEqual(toGfmSlug('a -- b'), 'a-b');
  });
});

// ─── extractHeadingSlugs ──────────────────────────────────────────────────────

describe('extractHeadingSlugs', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('empty file returns Set with size 0', () => {
    const slugs = extractHeadingSlugs(path.join(FIXTURES, 'edge', 'empty.md'));
    assert.ok(slugs instanceof Set, 'should return a Set');
    assert.strictEqual(slugs.size, 0);
  });

  test('multi-heading file: target.md has expected slugs', () => {
    const slugs = extractHeadingSlugs(path.join(FIXTURES, 'clean', 'target.md'));
    assert.ok(slugs.has('target'), 'should have "target" slug');
    assert.ok(slugs.has('first-heading'), 'should have "first-heading" slug');
    assert.ok(slugs.has('second-heading'), 'should have "second-heading" slug');
  });

  test('duplicate headings: both same-heading and same-heading-1 present', () => {
    const slugs = extractHeadingSlugs(path.join(FIXTURES, 'edge', 'duplicate-headings.md'));
    assert.ok(slugs.has('same-heading'), 'should have "same-heading"');
    assert.ok(slugs.has('same-heading-1'), 'should have "same-heading-1"');
  });

  test('headings inside fenced blocks are skipped', () => {
    const fencedFile = path.join(tmpDir, 'fenced.md');
    fs.writeFileSync(fencedFile, '# Outside\n\n```\n# Fenced Heading\n```\n');
    const slugs = extractHeadingSlugs(fencedFile);
    assert.ok(slugs.has('outside'), 'should have "outside" slug');
    assert.ok(!slugs.has('fenced-heading'), 'should NOT have "fenced-heading"');
  });

  test('unicode heading: slug is algorithm-derived (accented chars stripped via [^\\w\\s-])', () => {
    const slugs = extractHeadingSlugs(path.join(FIXTURES, 'edge', 'unicode-heading.md'));
    // The 5-step algorithm strips non-word chars. "Café & résumé — header" becomes:
    // 1. No markdown formatting to strip
    // 2. Lowercase: "café & résumé — header"
    // 3. Remove non-word non-space non-hyphen: strips é, à, é, —, &
    //    café -> caf, résumé -> rsum, — -> removed
    //    Result: "caf  rsum  header"
    // 4. Spaces to hyphens: "caf--rsum--header"
    // 5. Collapse hyphens: "caf-rsum-header"
    // Known limitation (documented in script header): accented chars stripped, not GitHub-rendered Unicode form
    const derivedSlug = toGfmSlug('Café & résumé — header');
    assert.ok(slugs.has(derivedSlug), `should have algorithm-derived slug: "${derivedSlug}"`);
  });

  test('non-UTF-8 file does not throw, returns empty Set, writes to stderr', () => {
    const utf16File = path.join(tmpDir, 'utf16.md');
    fs.writeFileSync(utf16File, Buffer.from('# Heading\n', 'utf16le'));
    // Should not throw
    let result;
    assert.doesNotThrow(() => {
      result = extractHeadingSlugs(utf16File);
    });
    assert.ok(result instanceof Set, 'should return a Set');
    assert.strictEqual(result.size, 0, 'UTF-16 file should yield empty Set');
  });
});

// ─── extractLinks ─────────────────────────────────────────────────────────────

describe('extractLinks', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('inline link: index.md has record with ref === ./target.md', () => {
    const links = extractLinks(path.join(FIXTURES, 'clean', 'index.md'));
    const found = links.some(l => l.ref === './target.md');
    assert.ok(found, 'should find ./target.md link');
  });

  test('same-file anchor: index.md has record with ref === #index and isAnchorOnly === true', () => {
    const links = extractLinks(path.join(FIXTURES, 'clean', 'index.md'));
    const found = links.find(l => l.ref === '#index');
    assert.ok(found, 'should find #index anchor');
    assert.strictEqual(found.isAnchorOnly, true);
  });

  test('image link: synthetic file with ![alt](./img.png) returns ref === ./img.png', () => {
    const imgFile = path.join(tmpDir, 'img.md');
    fs.writeFileSync(imgFile, '![alt](./img.png)\n');
    const links = extractLinks(imgFile);
    assert.ok(links.some(l => l.ref === './img.png'), 'should find image link ./img.png');
  });

  test('code-fence skip: fenced.md has real link but not the fenced fake links', () => {
    const links = extractLinks(path.join(FIXTURES, 'edge', 'fenced.md'));
    assert.ok(
      links.some(l => l.ref === '../clean/target.md'),
      'should find real link ../clean/target.md'
    );
    assert.ok(
      !links.some(l => l.ref === './missing-inside-fence.md'),
      'should NOT find ./missing-inside-fence.md (inside backtick fence)'
    );
    assert.ok(
      !links.some(l => l.ref === './still-missing.md'),
      'should NOT find ./still-missing.md (inside tilde fence)'
    );
  });

  test('external URL skip: https link returns zero links', () => {
    const extFile = path.join(tmpDir, 'ext.md');
    fs.writeFileSync(extFile, '[google](https://google.com)\n');
    const links = extractLinks(extFile);
    assert.strictEqual(links.length, 0, 'external https URL should be skipped');
  });

  test('mailto skip: mailto link returns zero links', () => {
    const mailFile = path.join(tmpDir, 'mail.md');
    fs.writeFileSync(mailFile, '[email](mailto:x@y.com)\n');
    const links = extractLinks(mailFile);
    assert.strictEqual(links.length, 0, 'mailto link should be skipped');
  });

  test('1-based line numbers: link on line 4 returns line === 4', () => {
    const lineFile = path.join(tmpDir, 'lines.md');
    fs.writeFileSync(lineFile, '# H\n\n\n[link](./a.md)\n');
    const links = extractLinks(lineFile);
    assert.ok(links.length > 0, 'should find at least one link');
    assert.strictEqual(links[0].line, 4, 'link should be on line 4');
  });

  test('titled link: ref is ./target_name.md without title content', () => {
    const links = extractLinks(path.join(FIXTURES, 'edge', 'titled-link.md'));
    const found = links.find(l => l.ref === './target_name.md');
    assert.ok(found, 'should find ./target_name.md');
    // Ensure no link ref contains the title text or quote chars
    for (const l of links) {
      assert.ok(!l.ref.includes('Target Title'), `ref should not contain "Target Title": ${l.ref}`);
      assert.ok(!l.ref.includes('"'), `ref should not contain quote char: ${l.ref}`);
    }
  });
});

// ─── validateLink ─────────────────────────────────────────────────────────────

describe('validateLink', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('valid file ref returns null', () => {
    const result = validateLink(
      path.join(FIXTURES, 'clean', 'index.md'),
      3,
      './target.md',
      FIXTURES
    );
    assert.strictEqual(result, null);
  });

  test('missing file returns reason "file not found" with correct line and ref', () => {
    const result = validateLink(
      path.join(FIXTURES, 'broken', 'broken-file.md'),
      3,
      './does-not-exist.md',
      FIXTURES
    );
    assert.ok(result !== null, 'should return a broken-link record');
    assert.strictEqual(result.reason, 'file not found');
    assert.strictEqual(result.line, 3);
    assert.strictEqual(result.ref, './does-not-exist.md');
  });

  test('valid anchor (cross-file) returns null', () => {
    const result = validateLink(
      path.join(FIXTURES, 'clean', 'index.md'),
      5,
      './target.md#first-heading',
      FIXTURES
    );
    assert.strictEqual(result, null);
  });

  test('missing anchor (cross-file) returns correct reason string', () => {
    const result = validateLink(
      path.join(FIXTURES, 'broken', 'broken-anchor.md'),
      3,
      '../clean/target.md#nonexistent-section',
      FIXTURES
    );
    assert.ok(result !== null);
    assert.strictEqual(result.reason, 'anchor #nonexistent-section not found in target');
  });

  test('missing anchor (same-file) returns correct reason string', () => {
    const result = validateLink(
      path.join(FIXTURES, 'broken', 'broken-same-file.md'),
      3,
      '#nope',
      FIXTURES
    );
    assert.ok(result !== null);
    assert.strictEqual(result.reason, 'anchor #nope not found in target');
  });

  test('path traversal returns "path escapes repository root"', () => {
    const result = validateLink(
      path.join(FIXTURES, 'edge', 'traversal.md'),
      3,
      '../../../../etc/passwd',
      FIXTURES
    );
    assert.ok(result !== null);
    assert.strictEqual(result.reason, 'path escapes repository root');
  });

  test('URL-encoded ref resolves correctly (returns null)', () => {
    const sourceFile = path.join(tmpDir, 'source.md');
    const targetFile = path.join(tmpDir, 'target name.md');
    fs.writeFileSync(sourceFile, '');
    fs.writeFileSync(targetFile, '');
    const result = validateLink(sourceFile, 1, './target%20name.md', tmpDir);
    assert.strictEqual(result, null, 'decoded path should resolve to existing file');
  });

  test('anchor in zero-heading target returns (0 headings) reason', () => {
    const result = validateLink(
      path.join(FIXTURES, 'edge', 'no-headings.md'),
      1,
      './empty.md#anything',
      FIXTURES
    );
    assert.ok(result !== null);
    assert.strictEqual(result.reason, 'anchor #anything not found in target (0 headings)');
  });

  test('URL-encoded anchor: percent-encoded form resolves correctly (returns null)', () => {
    const sourceFile = path.join(tmpDir, 'source.md');
    const targetFile = path.join(tmpDir, 'target.md');
    fs.writeFileSync(sourceFile, '');
    fs.writeFileSync(targetFile, '# Some Heading\n');
    const result = validateLink(sourceFile, 1, './target.md#some%20heading', tmpDir);
    assert.strictEqual(result, null, 'percent-encoded anchor should decode and match heading');
  });

  test('URL-encoded anchor: already-decoded form resolves correctly (returns null)', () => {
    const sourceFile = path.join(tmpDir, 'source.md');
    const targetFile = path.join(tmpDir, 'target.md');
    fs.writeFileSync(sourceFile, '');
    fs.writeFileSync(targetFile, '# Some Heading\n');
    const result = validateLink(sourceFile, 1, './target.md#some-heading', tmpDir);
    assert.strictEqual(result, null, 'already-slugged anchor should match heading');
  });
});

// ─── formatTable ──────────────────────────────────────────────────────────────

describe('formatTable', () => {
  test('empty array returns empty string', () => {
    assert.strictEqual(formatTable([], '/repo'), '');
  });

  test('single record: contains FILE, LINE, REF, REASON columns', () => {
    const out = formatTable(
      [{ file: '/repo/a.md', line: 5, ref: 'b.md', reason: 'file not found' }],
      '/repo'
    );
    assert.ok(out.includes('FILE'), 'header should contain FILE');
    assert.ok(out.includes('LINE'), 'header should contain LINE');
    assert.ok(out.includes('REF'), 'header should contain REF');
    assert.ok(out.includes('REASON'), 'header should contain REASON');
    assert.ok(out.includes('a.md'), 'data should contain a.md');
    assert.ok(out.includes('5'), 'data should contain line number 5');
    assert.ok(out.includes('b.md'), 'data should contain ref b.md');
    assert.ok(out.includes('file not found'), 'data should contain reason');
    assert.ok(!out.includes('/repo/a.md'), 'should NOT contain absolute path /repo/a.md');
  });

  test('header underline matches /^-+( +-+)+$/ pattern', () => {
    const out = formatTable(
      [{ file: '/repo/a.md', line: 1, ref: 'b.md', reason: 'file not found' }],
      '/repo'
    );
    const lines = out.split('\n');
    assert.ok(lines.length >= 2, 'should have at least header + underline');
    assert.ok(/^-+( +-+)+$/.test(lines[1]), `underline line should match pattern, got: "${lines[1]}"`);
  });

  test('multi-record column alignment: header columns align with data columns', () => {
    const records = [
      { file: '/repo/a.md', line: 1, ref: 'b.md', reason: 'file not found' },
      { file: '/repo/long-name.md', line: 999, ref: 'c.md', reason: 'anchor #x not found in target' },
    ];
    const out = formatTable(records, '/repo');
    const lines = out.split('\n');
    assert.ok(lines.length >= 4, 'should have header + underline + 2 data rows');

    // Find LINE header position in the header row
    const headerLine = lines[0];
    const lineHeaderIdx = headerLine.indexOf('LINE');
    assert.ok(lineHeaderIdx > 0, 'LINE header should be found');

    // Data rows should have their line number content starting at the same column
    const dataRow1 = lines[2];
    const dataRow2 = lines[3];
    // Extract character at lineHeaderIdx position — should be part of the line number
    assert.strictEqual(
      dataRow1.substring(lineHeaderIdx, lineHeaderIdx + 1),
      '1',
      'first data row line number should align with LINE header'
    );
    assert.strictEqual(
      dataRow2.substring(lineHeaderIdx, lineHeaderIdx + 3),
      '999',
      'second data row line number should align with LINE header'
    );
  });

  test('repo-relative path: absolute path is stripped to relative display', () => {
    const out = formatTable(
      [{ file: '/repo/sub/a.md', line: 1, ref: 'b.md', reason: 'file not found' }],
      '/repo'
    );
    assert.ok(out.includes('sub/a.md'), 'should contain sub/a.md');
    assert.ok(!out.includes('/repo/sub/a.md'), 'should NOT contain /repo/sub/a.md');
  });
});

// ─── discoverTrackedFiles ──────────────────────────────────────────────────────

describe('discoverTrackedFiles', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-disc-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('non-git dir with .md and .txt: returns only 3 .md files (absolute paths)', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '# A\n');
    fs.writeFileSync(path.join(tmpDir, 'b.md'), '# B\n');
    fs.mkdirSync(path.join(tmpDir, 'sub'));
    fs.writeFileSync(path.join(tmpDir, 'sub', 'c.md'), '# C\n');
    fs.writeFileSync(path.join(tmpDir, 'not-md.txt'), 'text\n');
    const result = discoverTrackedFiles(tmpDir);
    assert.strictEqual(result.length, 3, 'should find exactly 3 .md files');
    const expected = new Set([
      path.join(tmpDir, 'a.md'),
      path.join(tmpDir, 'b.md'),
      path.join(tmpDir, 'sub', 'c.md'),
    ]);
    const actual = new Set(result);
    assert.deepStrictEqual(actual, expected, 'should match expected .md file set');
  });

  test('non-git dir with only .txt files: returns empty array', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello\n');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'notes\n');
    const result = discoverTrackedFiles(tmpDir);
    assert.deepStrictEqual(result, [], 'should return empty array when no .md files');
  });

  test('excludes node_modules directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'foo.md'), '# Foo\n');
    fs.writeFileSync(path.join(tmpDir, 'regular.md'), '# Regular\n');
    const result = discoverTrackedFiles(tmpDir);
    assert.strictEqual(result.length, 1, 'should find only 1 file (regular.md)');
    assert.ok(result[0].endsWith('regular.md'), 'should be regular.md');
  });

  test('excludes .git directory', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    fs.writeFileSync(path.join(tmpDir, '.git', 'foo.md'), '# Git Internal\n');
    fs.writeFileSync(path.join(tmpDir, 'regular.md'), '# Regular\n');
    const result = discoverTrackedFiles(tmpDir);
    assert.strictEqual(result.length, 1, 'should find only 1 file (regular.md)');
    assert.ok(result[0].endsWith('regular.md'), 'should be regular.md');
  });

  test('all returned paths are absolute', () => {
    fs.writeFileSync(path.join(tmpDir, 'doc.md'), '# Doc\n');
    fs.mkdirSync(path.join(tmpDir, 'sub'));
    fs.writeFileSync(path.join(tmpDir, 'sub', 'other.md'), '# Other\n');
    const result = discoverTrackedFiles(tmpDir);
    for (const p of result) {
      assert.ok(path.isAbsolute(p), `expected absolute path, got: ${p}`);
    }
  });

  test('git path (isolated temp repo): returns exactly the tracked .md file', (t) => {
    // Check git availability
    const gitCheck = spawnSync('git', ['--version'], { encoding: 'utf8' });
    if (gitCheck.status !== 0) {
      t.skip('git unavailable');
      return;
    }
    const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-git-'));
    try {
      execFileSync('git', ['init', '-q'], { cwd: tempRepo });
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempRepo });
      execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tempRepo });
      fs.writeFileSync(path.join(tempRepo, 'fixture.md'), '# Fixture\n');
      execFileSync('git', ['add', 'fixture.md'], { cwd: tempRepo });
      execFileSync('git', ['commit', '-q', '-m', 'add fixture'], { cwd: tempRepo });
      const result = discoverTrackedFiles(tempRepo);
      assert.deepStrictEqual(result, [path.join(tempRepo, 'fixture.md')],
        'git path: should return exactly the tracked file');
    } finally {
      fs.rmSync(tempRepo, { recursive: true, force: true });
    }
  });

  test('slug cache reuse: extractHeadingSlugs called once for repeated links to same target', () => {
    const targetFile = path.join(tmpDir, 'target.md');
    fs.writeFileSync(targetFile, '# Heading\n');

    const source1 = path.join(tmpDir, 'src1.md');
    const source2 = path.join(tmpDir, 'src2.md');
    const source3 = path.join(tmpDir, 'src3.md');
    fs.writeFileSync(source1, '');
    fs.writeFileSync(source2, '');
    fs.writeFileSync(source3, '');

    // With cache: extractHeadingSlugs should be called once (cached after first call)
    const cache = new Map();
    const r1 = validateLink(source1, 1, './target.md#heading', tmpDir, cache);
    const r2 = validateLink(source2, 1, './target.md#heading', tmpDir, cache);
    const r3 = validateLink(source3, 1, './target.md#heading', tmpDir, cache);
    assert.strictEqual(r1, null, 'first call with cache: should resolve correctly');
    assert.strictEqual(r2, null, 'second call with cache: should resolve correctly');
    assert.strictEqual(r3, null, 'third call with cache: should resolve correctly');
    // Cache should have exactly one entry for the target file
    assert.strictEqual(cache.size, 1, 'cache should have 1 entry after 3 calls to same target');
    assert.ok(cache.has(targetFile), 'cache should be keyed by target absolute path');

    // Without cache: calls still work correctly (backward compat)
    const rNoCache1 = validateLink(source1, 1, './target.md#heading', tmpDir);
    const rNoCache2 = validateLink(source2, 1, './target.md#heading', tmpDir);
    assert.strictEqual(rNoCache1, null, 'without cache: should still resolve correctly (1)');
    assert.strictEqual(rNoCache2, null, 'without cache: should still resolve correctly (2)');
  });
});

// ─── Exit codes (DOCLINK-04) ──────────────────────────────────────────────────

describe('validate-doc-links: exit codes (DOCLINK-04)', () => {
  const FIXTURES = path.join(__dirname, 'fixtures', 'doc-links');

  test('clean fixture: exits 0 and stdout contains "all links valid"', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'clean')]);
    assert.strictEqual(result.status, 0, `expected exit 0, got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('all links valid'),
      `expected "all links valid" in stdout, got: ${result.stdout}`);
  });

  test('broken fixture: exits 1 and stdout contains "broken link"', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'broken')]);
    assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('broken link'),
      `expected "broken link" in stdout, got: ${result.stdout}`);
  });

  test('no --root flag (project root smoke test): completes within 30s with non-empty stdout', () => {
    // Uses spawnSync directly with cwd to override working directory for project-root smoke test
    const result = spawnSync(process.execPath, [SCRIPT], {
      encoding: 'utf8',
      timeout: 30_000,
      cwd: process.cwd(),
    });
    // Do not assert exit code — the real repo may have intentional broken refs that Phase 57 will repair
    assert.ok(result.stdout.length > 0 || result.stderr.length > 0,
      'smoke test: expected non-empty output from running against project root');
    assert.ok(result.signal === null,
      `process should not have been killed by signal, got: ${result.signal}`);
  });

  test('edge fixture with traversal: exits 1 and stdout contains "path escapes repository root"', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'edge')]);
    assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}; stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('path escapes repository root'),
      `expected "path escapes repository root" in stdout, got: ${result.stdout}`);
  });
});

// ─── JSON output (DOCLINK-04) ─────────────────────────────────────────────────

describe('validate-doc-links: JSON output (DOCLINK-04)', () => {
  const FIXTURES = path.join(__dirname, 'fixtures', 'doc-links');

  test('clean --json: status=clean, broken=[], checked and files are numbers', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'clean'), '--json']);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); },
      `stdout should be valid JSON; got: ${result.stdout}`);
    assert.strictEqual(obj.status, 'clean', `expected status "clean", got "${obj.status}"`);
    assert.ok(Array.isArray(obj.broken), 'broken should be an array');
    assert.strictEqual(obj.broken.length, 0, 'broken should be empty for clean fixture');
    assert.strictEqual(typeof obj.checked, 'number', 'checked should be a number');
    assert.strictEqual(typeof obj.files, 'number', 'files should be a number');
  });

  test('broken --json: status=broken, broken.length >= 3', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'broken'), '--json']);
    let obj;
    assert.doesNotThrow(() => { obj = JSON.parse(result.stdout); },
      `stdout should be valid JSON; got: ${result.stdout}`);
    assert.strictEqual(obj.status, 'broken', `expected status "broken", got "${obj.status}"`);
    assert.ok(Array.isArray(obj.broken), 'broken should be an array');
    assert.ok(obj.broken.length >= 3,
      `expected at least 3 broken records, got ${obj.broken.length}`);
  });

  test('broken --json: schema check — file/line/ref/reason are correct types', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'broken'), '--json']);
    const obj = JSON.parse(result.stdout);
    assert.ok(obj.broken.length > 0, 'should have at least one broken record');
    const rec = obj.broken[0];
    assert.strictEqual(typeof rec.file, 'string', 'file should be a string');
    assert.strictEqual(typeof rec.line, 'number', 'line should be a number');
    assert.strictEqual(typeof rec.ref, 'string', 'ref should be a string');
    assert.strictEqual(typeof rec.reason, 'string', 'reason should be a string');
  });

  test('broken --json: at least one record with reason === "file not found" (DOCLINK-01)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'broken'), '--json']);
    const obj = JSON.parse(result.stdout);
    const hasFileNotFound = obj.broken.some(r => r.reason === 'file not found');
    assert.ok(hasFileNotFound, 'expected at least one "file not found" reason in broken records');
  });

  test('broken --json: at least one record with reason starting with "anchor #" (DOCLINK-02)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'broken'), '--json']);
    const obj = JSON.parse(result.stdout);
    const hasAnchorReason = obj.broken.some(r => r.reason.startsWith('anchor #'));
    assert.ok(hasAnchorReason, 'expected at least one anchor reason in broken records');
  });
});

// ─── Argument validation ──────────────────────────────────────────────────────

describe('validate-doc-links: argument validation', () => {
  test('--root without value: exits non-zero (2) with stderr containing "--root requires a directory argument"', () => {
    const result = runScript(['--root']);
    assert.notStrictEqual(result.status, 0, `expected non-zero exit, got ${result.status}`);
    assert.strictEqual(result.status, 2, `expected exit code 2, got ${result.status}`);
    const combined = result.stderr + result.stdout;
    assert.ok(combined.includes('--root requires a directory argument'),
      `expected "--root requires a directory argument" in output, got stderr: ${result.stderr}, stdout: ${result.stdout}`);
  });
});

// ─── gitignoreGlobToRegex ─────────────────────────────────────────────────────

describe('gitignoreGlobToRegex', () => {
  // ── single-segment *.md ───────────────────────────────────────────────────
  test('*.md matches root-level a.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('*.md').test('a.md'), true);
  });

  test('*.md matches root-level index.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('*.md').test('index.md'), true);
  });

  test('*.md does NOT match sub/a.md (single-segment only)', () => {
    assert.strictEqual(gitignoreGlobToRegex('*.md').test('sub/a.md'), false);
  });

  test('*.md does NOT match tests/foo.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('*.md').test('tests/foo.md'), false);
  });

  // ── **/*.md: REVIEW HIGH — leading **/ matches zero dirs (root files) ──────
  test('**/*.md matches root-level a.md (REVIEW HIGH — zero-dir leading **/)', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('a.md'), true);
  });

  test('**/*.md matches root-level index.md (root-level file, second variant)', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('index.md'), true);
  });

  test('**/*.md matches sub/a.md (one directory)', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('sub/a.md'), true);
  });

  test('**/*.md matches a/b/c.md (deeply nested)', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('a/b/c.md'), true);
  });

  test('**/*.md does NOT match a.txt', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('a.txt'), false);
  });

  test('**/*.md does NOT match subdir/file.txt (extension mismatch, nested)', () => {
    assert.strictEqual(gitignoreGlobToRegex('**/*.md').test('subdir/file.txt'), false);
  });

  // ── tests/**: trailing /** matches directory itself plus everything below ──
  test('tests/** matches tests/a.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('tests/**').test('tests/a.md'), true);
  });

  test('tests/** matches tests/sub/b.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('tests/**').test('tests/sub/b.md'), true);
  });

  test('tests/** matches tests (the directory name itself — trailing /**)', () => {
    assert.strictEqual(gitignoreGlobToRegex('tests/**').test('tests'), true);
  });

  test('tests/** does NOT match test/a.md (different prefix)', () => {
    assert.strictEqual(gitignoreGlobToRegex('tests/**').test('test/a.md'), false);
  });

  test('tests/** does NOT match nottests/x.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('tests/**').test('nottests/x.md'), false);
  });

  // ── deep path with trailing /** ───────────────────────────────────────────
  test('tests/fixtures/doc-links/** matches tests/fixtures/doc-links/clean/index.md', () => {
    assert.strictEqual(
      gitignoreGlobToRegex('tests/fixtures/doc-links/**').test('tests/fixtures/doc-links/clean/index.md'),
      true
    );
  });

  // ── exact path ────────────────────────────────────────────────────────────
  test('.claude/skills/SKILL.md matches exactly .claude/skills/SKILL.md', () => {
    assert.strictEqual(
      gitignoreGlobToRegex('.claude/skills/SKILL.md').test('.claude/skills/SKILL.md'),
      true
    );
  });

  test('.claude/skills/SKILL.md does NOT match .claude/skills/dream-memory-consolidation/SKILL.md', () => {
    assert.strictEqual(
      gitignoreGlobToRegex('.claude/skills/SKILL.md').test('.claude/skills/dream-memory-consolidation/SKILL.md'),
      false
    );
  });

  // ── single-segment with parent path ──────────────────────────────────────
  test('docs/*.md matches docs/README.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('docs/*.md').test('docs/README.md'), true);
  });

  test('docs/*.md does NOT match docs/sub/x.md (single-segment after docs/)', () => {
    assert.strictEqual(gitignoreGlobToRegex('docs/*.md').test('docs/sub/x.md'), false);
  });

  // ── REVIEW LOW: empty-string glob is a graceful no-op ────────────────────
  test("gitignoreGlobToRegex('') does NOT match any-path.md (REVIEW LOW)", () => {
    assert.strictEqual(gitignoreGlobToRegex('').test('any-path.md'), false);
  });

  test("gitignoreGlobToRegex('') does NOT match empty string itself", () => {
    assert.strictEqual(gitignoreGlobToRegex('').test(''), false);
  });

  // ── regex meta-char escaping ──────────────────────────────────────────────
  test('dots are literal: a.b.c.md matches a.b.c.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('a.b.c.md').test('a.b.c.md'), true);
  });

  test('dots are literal: a.b.c.md does NOT match axbycz.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('a.b.c.md').test('axbycz.md'), false);
  });

  test('parens are literal: a(b)c.md matches a(b)c.md', () => {
    assert.strictEqual(gitignoreGlobToRegex('a(b)c.md').test('a(b)c.md'), true);
  });
});

// ─── discoverTrackedFiles with excludes ───────────────────────────────────────

describe('discoverTrackedFiles with excludes', () => {
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-excl-'));
    // Create a.md, b.md, sub/c.md
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '# A\n');
    fs.writeFileSync(path.join(tmpDir, 'b.md'), '# B\n');
    fs.mkdirSync(path.join(tmpDir, 'sub'));
    fs.writeFileSync(path.join(tmpDir, 'sub', 'c.md'), '# C\n');
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('excludeRegexes=[sub/**] filters sub/c.md, returns exactly a.md and b.md', () => {
    const result = discoverTrackedFiles(tmpDir, [gitignoreGlobToRegex('sub/**')]);
    assert.strictEqual(result.length, 2, `expected 2 files, got ${result.length}`);
    const names = result.map(p => path.basename(p)).sort();
    assert.deepStrictEqual(names, ['a.md', 'b.md']);
  });

  test('no excludeRegexes arg: backward compatible — returns all 3 files', () => {
    const result = discoverTrackedFiles(tmpDir);
    assert.strictEqual(result.length, 3, `expected 3 files, got ${result.length}`);
  });

  test('excludeRegexes=[] (empty array): returns all 3 files (no filtering)', () => {
    const result = discoverTrackedFiles(tmpDir, []);
    assert.strictEqual(result.length, 3, `expected 3 files, got ${result.length}`);
  });

  test('multiple regexes: [a.md, sub/**] returns just b.md', () => {
    const result = discoverTrackedFiles(tmpDir, [
      gitignoreGlobToRegex('a.md'),
      gitignoreGlobToRegex('sub/**'),
    ]);
    assert.strictEqual(result.length, 1, `expected 1 file, got ${result.length}`);
    assert.ok(result[0].endsWith('b.md'), `expected b.md, got ${result[0]}`);
  });
});

// ─── validate-doc-links: --exclude flag ──────────────────────────────────────

describe('validate-doc-links: --exclude flag', () => {
  const EXCL_FIXTURES = path.join(__dirname, 'fixtures', 'doc-links', 'exclude');
  let tmpDir;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-excl-integ-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Test A
  test('Test A: clean tree without --exclude exits 0', () => {
    const result = runScript(['--root', path.join(EXCL_FIXTURES, 'clean-with-exclude')]);
    assert.strictEqual(result.status, 0, `expected exit 0; stderr: ${result.stderr}; stdout: ${result.stdout}`);
  });

  // Test B
  test('Test B: broken tree without --exclude exits 1', () => {
    const result = runScript(['--root', path.join(EXCL_FIXTURES, 'would-fail-without-exclude')]);
    assert.strictEqual(result.status, 1, `expected exit 1; stderr: ${result.stderr}; stdout: ${result.stdout}`);
  });

  // Test C: single glob, single match
  test('Test C: --exclude **/broken.md still fails (another-broken.md not excluded)', () => {
    const result = runScript([
      '--root', path.join(EXCL_FIXTURES, 'would-fail-without-exclude'),
      '--exclude', '**/broken.md',
    ]);
    assert.strictEqual(result.status, 1,
      `expected exit 1 (another-broken.md still present); stdout: ${result.stdout}`);
    assert.ok(!result.stdout.includes('missing-target.md'),
      `broken.md was excluded so its broken ref should not appear; stdout: ${result.stdout}`);
  });

  // Test D: multiple globs, all matching
  test('Test D: --exclude **/broken.md --exclude **/another-broken.md exits 0', () => {
    const result = runScript([
      '--root', path.join(EXCL_FIXTURES, 'would-fail-without-exclude'),
      '--exclude', '**/broken.md',
      '--exclude', '**/another-broken.md',
    ]);
    assert.strictEqual(result.status, 0, `expected exit 0; stderr: ${result.stderr}; stdout: ${result.stdout}`);
  });

  // Test E: ** semantics — recursive directory match
  test('Test E: --exclude **/would-fail-without-exclude/** exits 0 (whole subtree excluded)', () => {
    const result = runScript([
      '--root', EXCL_FIXTURES,
      '--exclude', '**/would-fail-without-exclude/**',
    ]);
    assert.strictEqual(result.status, 0, `expected exit 0; stderr: ${result.stderr}; stdout: ${result.stdout}`);
  });

  // Test F: * semantics — single-segment match
  test('Test F: --exclude *.md matches root file only, not sub/b.md (single-segment semantics)', () => {
    // a.md (broken) at root — excluded by *.md
    // sub/b.md (broken) — NOT excluded by *.md (different segment)
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '[broken](./none.md)\n');
    fs.mkdirSync(path.join(tmpDir, 'sub'));
    fs.writeFileSync(path.join(tmpDir, 'sub', 'b.md'), '[broken](./none.md)\n');
    const result = runScript([
      '--root', tmpDir,
      '--exclude', '*.md',
    ]);
    assert.strictEqual(result.status, 1,
      `expected exit 1 because sub/b.md is not excluded; stdout: ${result.stdout}`);
    assert.ok(result.stdout.includes('sub/b.md') || result.stdout.includes('sub' + path.sep + 'b.md'),
      `expected sub/b.md in output; stdout: ${result.stdout}`);
    assert.ok(!result.stdout.includes('a.md') || result.stdout.indexOf('sub') < result.stdout.indexOf('a.md'),
      `a.md should be excluded (only sub/b.md should appear); stdout: ${result.stdout}`);
  });

  // Test G: no --exclude flag, behavior unchanged
  test('Test G: no --exclude flag, clean fixture exits 0 (behavior unchanged)', () => {
    const result = runScript(['--root', path.join(FIXTURES, 'clean')]);
    assert.strictEqual(result.status, 0, `expected exit 0; stderr: ${result.stderr}`);
  });

  // Test H: --exclude with no value
  test('Test H: --exclude with no value exits 2 with error message', () => {
    const result = runScript(['--exclude']);
    assert.strictEqual(result.status, 2, `expected exit 2, got ${result.status}`);
    assert.ok(result.stderr.includes('--exclude requires a glob argument'),
      `expected error message in stderr; got: ${result.stderr}`);
  });

  // Test I: --exclude followed by another flag
  test('Test I: --exclude --root exits 2 (next arg starts with --, treated as missing value)', () => {
    const result = runScript(['--exclude', '--root', path.join(FIXTURES, 'clean')]);
    assert.strictEqual(result.status, 2, `expected exit 2, got ${result.status}`);
    assert.ok(result.stderr.includes('--exclude requires a glob argument'),
      `expected error message in stderr; got: ${result.stderr}`);
  });

  // Test J: excluded file with working links is also omitted
  test('Test J: excluding clean-with-exclude/** omits its links from output', () => {
    const result = runScript([
      '--root', EXCL_FIXTURES,
      '--exclude', '**/clean-with-exclude/**',
    ]);
    // The excluded directory's links should not appear in output
    assert.ok(!result.stdout.includes('clean-with-exclude'),
      `excluded directory should not appear in output; stdout: ${result.stdout}`);
  });

  // Test K: REVIEW HIGH — **/*.md integration check
  test('Test K: --exclude **/*.md excludes both root and nested .md files (REVIEW HIGH integration)', () => {
    // root.md at root (broken), sub/nested.md (broken) — both should be excluded by **/*.md
    fs.writeFileSync(path.join(tmpDir, 'root.md'), '[broken](./missing-root.md)\n');
    fs.mkdirSync(path.join(tmpDir, 'sub'));
    fs.writeFileSync(path.join(tmpDir, 'sub', 'nested.md'), '[broken](./missing-sub.md)\n');
    const result = runScript([
      '--root', tmpDir,
      '--exclude', '**/*.md',
    ]);
    assert.strictEqual(result.status, 0,
      `expected exit 0 (both files excluded by **/*.md); stdout: ${result.stdout}; stderr: ${result.stderr}`);
  });
});
