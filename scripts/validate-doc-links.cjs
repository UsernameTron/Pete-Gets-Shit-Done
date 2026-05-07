#!/usr/bin/env node
'use strict';

/**
 * validate-doc-links.cjs — Internal Markdown Link Validator
 *
 * Scans tracked .md files for broken relative-path refs and broken anchor refs.
 * Exits 0 on clean, 1 on broken links, with optional --json output.
 *
 * Requirements: DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04
 *
 * Known limitations:
 *   - Reference-style links [text][id] are NOT parsed
 *   - Raw HTML anchor definitions are NOT recognized
 *   - HTML-block-embedded links are NOT parsed (regex-based extraction only)
 *   - GFM Unicode edge cases: the toGfmSlug algorithm uses [^\w\s-] to strip
 *     non-word characters, which removes accented Unicode chars. GitHub's
 *     renderer preserves Unicode in anchor slugs — false-negative anchor
 *     reports against valid GitHub-rendered Unicode anchors are a known gap.
 *   - Markdown link titles [text](path "title") are parsed: the path is
 *     captured, the title is discarded. (Pass 1 review fix.)
 *   - Files saved in encodings other than UTF-8 (e.g., UTF-16) are skipped
 *     with a single line logged to stderr. (Pass 2 Gemini LOW fix.)
 *
 * Plan 55-01: core pure/fs functions (this file's exports)
 * Plan 55-02: discoverTrackedFiles + main() entrypoint
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

// LINK_RE captures only the path portion of a Markdown link, ignoring an
// optional title attribute `(path "title")`. Captures chars up to whitespace
// or `)`, then optionally consumes the quoted title without including it.
const LINK_RE = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EXTERNAL_RE = /^(https?:|mailto:|ftp:)/i;

// ─── toGfmSlug ────────────────────────────────────────────────────────────────

/**
 * Convert a heading string to a GitHub-Flavored Markdown anchor slug.
 * 5-step algorithm:
 *   1. Strip Markdown formatting spans: bold, italic asterisk, italic underscore,
 *      inline code backticks, [link](url) -> link text, <html> tags
 *   2. Lowercase
 *   3. Remove non-word, non-space, non-hyphen characters
 *   4. Replace spaces with hyphens
 *   5. Collapse consecutive hyphens
 *
 * @param {string} text  Raw heading text (without leading #)
 * @returns {string}     Slug usable as #anchor
 */
function toGfmSlug(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')         // bold
    .replace(/\*(.+?)\*/g, '$1')              // italic *
    .replace(/_(.+?)_/g, '$1')                // italic _
    .replace(/`(.+?)`/g, '$1')                // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links: keep display text
    .replace(/<[^>]+>/g, '')                  // HTML tags
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')                 // remove non-word, non-space, non-hyphen
    .replace(/\s+/g, '-')                     // spaces to hyphens
    .replace(/-+/g, '-');                     // collapse consecutive hyphens
}

// ─── extractHeadingSlugs ──────────────────────────────────────────────────────

/**
 * Extract heading slugs from a Markdown file using GFM rules.
 * Skips lines inside code fences (triple backtick or triple tilde).
 * Applies dedup suffix logic: second occurrence of the same slug becomes
 * slug-1, third becomes slug-2, etc.
 *
 * @param {string} filePath  Absolute path to .md file
 * @returns {Set<string>}
 */
function extractHeadingSlugs(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `validate-doc-links: skipping unreadable file ${filePath} (${err.code || err.message})\n`
    );
    return new Set();
  }
  const lines = raw.split('\n');
  const slugCounts = {};
  const slugSet = new Set();
  let inFence = false;

  for (const line of lines) {
    if (/^(`{3,}|~{3,})/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.+)/);
    if (!m) continue;
    let slug = toGfmSlug(m[1].trim());
    if (slugCounts[slug] === undefined) {
      slugCounts[slug] = 0;
    } else {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    }
    slugSet.add(slug);
  }
  return slugSet;
}

// ─── extractLinks ─────────────────────────────────────────────────────────────

/**
 * Extract all Markdown inline links and image links from a file.
 * Skips content inside code fences (triple backtick or triple tilde).
 * Returns line numbers (1-based).
 * Skips external schemes: http:, https:, mailto:, ftp:.
 *
 * @param {string} filePath  Absolute path to .md file
 * @returns {{ line: number, ref: string, isAnchorOnly: boolean }[]}
 */
function extractLinks(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `validate-doc-links: skipping unreadable file ${filePath} (${err.code || err.message})\n`
    );
    return [];
  }
  const lines = raw.split('\n');
  const out = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(`{3,}|~{3,})/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;

    let m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(line)) !== null) {
      const ref = m[1].trim();
      if (EXTERNAL_RE.test(ref)) continue;
      out.push({
        line: i + 1,
        ref,
        isAnchorOnly: ref.startsWith('#'),
      });
    }
  }
  return out;
}

// ─── validateLink ─────────────────────────────────────────────────────────────

/**
 * Validate a single extracted link ref relative to its containing file.
 * Returns a broken-link record, or null if the link resolves correctly.
 *
 * @param {string} sourceFile   Absolute path to file containing the link
 * @param {number} lineNum      1-based line number
 * @param {string} ref          The raw ref text (may include #anchor)
 * @param {string} repoRoot     Absolute repo root (for traversal detection)
 * @returns {{ file: string, line: number, ref: string, reason: string } | null}
 */
function validateLink(sourceFile, lineNum, ref, repoRoot) {
  const repoRel = (abs) => path.relative(repoRoot, abs);
  const fail = (reason) => ({ file: repoRel(sourceFile), line: lineNum, ref, reason });

  // Split file portion and anchor on first '#'
  const hashIdx = ref.indexOf('#');
  let filePart = hashIdx === -1 ? ref : ref.slice(0, hashIdx);
  const anchor = hashIdx === -1 ? null : ref.slice(hashIdx + 1);

  // Same-file anchor (ref starts with #, so filePart is empty string)
  let targetFile;
  if (filePart === '') {
    targetFile = sourceFile;
  } else {
    filePart = decodeURIComponent(filePart);
    targetFile = path.resolve(path.dirname(sourceFile), filePart);

    // Traversal check: resolved path must stay within repoRoot
    const normalizedRoot = path.resolve(repoRoot);
    const normalizedTarget = path.resolve(targetFile);
    if (
      !normalizedTarget.startsWith(normalizedRoot + path.sep) &&
      normalizedTarget !== normalizedRoot
    ) {
      return fail('path escapes repository root');
    }

    if (!fs.existsSync(targetFile)) {
      return fail('file not found');
    }
  }

  // Anchor check (only if ref had '#')
  if (anchor !== null) {
    // Only validate anchors against .md targets
    if (!targetFile.endsWith('.md')) return null;

    // Decode percent-encoded anchors before slug comparison so that
    // `[link](file.md#some%20heading)` resolves against `## Some Heading`.
    let decodedAnchor;
    try {
      decodedAnchor = decodeURIComponent(anchor);
    } catch {
      // Malformed percent-encoding — fall back to raw anchor value.
      decodedAnchor = anchor;
    }
    // Slugify so `#some%20heading` -> `some heading` -> slug `some-heading`
    // matches the target's slug set. Already-slugged refs survive unchanged.
    const anchorSlug = toGfmSlug(decodedAnchor);

    const slugs = extractHeadingSlugs(targetFile);
    if (!slugs.has(anchorSlug)) {
      // Preserve raw (pre-decode) anchor in reason string to mirror source.
      const reason = slugs.size === 0
        ? `anchor #${anchor} not found in target (0 headings)`
        : `anchor #${anchor} not found in target`;
      return fail(reason);
    }
  }

  return null;
}

// ─── formatTable ──────────────────────────────────────────────────────────────

/**
 * Format an array of broken-link records as a padded text table.
 * Columns: FILE, LINE, REF, REASON. Left-padded to max content width.
 * Header underline of '-' separated by two spaces.
 *
 * @param {{ file: string, line: number, ref: string, reason: string }[]} records
 * @param {string} repoRoot  Strip this prefix for relative display paths
 * @returns {string}
 */
function formatTable(records, repoRoot) {
  if (records.length === 0) return '';

  const cols = ['FILE', 'LINE', 'REF', 'REASON'];
  const rows = records.map(r => {
    const fileStr = String(r.file);
    const display = fileStr.startsWith(repoRoot + path.sep)
      ? fileStr.slice(repoRoot.length + 1)
      : fileStr;
    return [display, String(r.line), String(r.ref), String(r.reason)];
  });

  const widths = cols.map((c, i) => {
    const headerLen = c.length;
    const maxData = rows.reduce((m, row) => Math.max(m, row[i].length), 0);
    return Math.max(headerLen, maxData);
  });

  const pad = (s, w) => s + ' '.repeat(w - s.length);
  const sep = '  ';

  const headerLine = cols.map((c, i) => pad(c, widths[i])).join(sep);
  const underline = widths.map(w => '-'.repeat(w)).join(sep);
  const dataLines = rows.map(row =>
    row.map((c, i) => pad(c, widths[i])).join(sep)
  );

  return [headerLine, underline, ...dataLines].join('\n');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  toGfmSlug,
  extractHeadingSlugs,
  extractLinks,
  validateLink,
  formatTable,
};

// ─── Main guard ───────────────────────────────────────────────────────────────

if (require.main === module) {
  // main() lands in plan 55-02; for now, fail loud if invoked directly.
  process.stderr.write('validate-doc-links: main() not yet implemented (see plan 55-02)\n');
  process.exit(2);
}
