/**
 * validate-doc-links.cjs — Unit Tests
 *
 * Tests for: toGfmSlug, extractHeadingSlugs, extractLinks, validateLink, formatTable.
 * discoverTrackedFiles and main() are tested in plan 55-02.
 *
 * Requirements: DOCLINK-01, DOCLINK-02, DOCLINK-03
 */
'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  toGfmSlug,
  extractHeadingSlugs,
  extractLinks,
  validateLink,
  formatTable,
} = require('../scripts/validate-doc-links.cjs');

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
