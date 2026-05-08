#!/usr/bin/env node
'use strict';

/**
 * validate-doc-links.cjs — Internal Markdown Link Validator
 *
 * Scans tracked .md files for broken relative-path refs and broken anchor refs.
 * Exits 0 on clean, 1 on broken links. Use --json for machine-readable output.
 *
 * Usage:
 *   node scripts/validate-doc-links.cjs                      # validate the whole repo
 *   node scripts/validate-doc-links.cjs --json               # JSON output
 *   node scripts/validate-doc-links.cjs --root <dir>         # validate a specific tree
 *   node scripts/validate-doc-links.cjs --exclude <glob>     # exempt paths from validation
 *                                                              (multi-value, gitignore-style globs;
 *                                                               see gitignoreGlobToRegex for semantics)
 *
 * Requirements: DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04
 *
 * Known limitations:
 *   - Reference-style links [text][id] are NOT parsed
 *   - Raw HTML <a id="..."> anchor definitions are NOT recognized
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
 * --exclude unsupported gitignore features (v1):
 *   - Leading `!` negation patterns (`!path/**`) — NOT supported. Add if
 *     call-site needs surface (CONTEXT D-07).
 *   - Brace expansion `{a,b}` — treated as literal characters.
 *   - Single-char `?` wildcard — treated as literal (gitignore semantics).
 *   - POSIX character classes — NOT supported.
 *   The supported subset (`**/`, `/**`, bare `**`, `*`, exact paths) covers
 *   the v2.8 CI call-site exempt list and is intentionally minimal per
 *   CONTEXT D-09 (validator stays generic; policy lives at call site).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ─── Constants ────────────────────────────────────────────────────────────────

// LINK_RE captures only the path portion of a Markdown link, ignoring an
// optional title attribute `(path "title")`. Captures chars up to whitespace
// or `)`, then optionally consumes the quoted title without including it.
const LINK_RE = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EXTERNAL_RE = /^(https?:|mailto:|ftp:)/i;

// ─── gitignoreGlobToRegex ─────────────────────────────────────────────────────

/**
 * Convert a gitignore-style glob to a RegExp anchored at start and end.
 *
 * Supported semantics (subset sufficient for v2.8 CI call-site exempt list):
 *   - Leading "**"+"/" matches zero or more directories (incl. zero -- root files match)
 *   - Trailing "/""**" matches '' or '/anything' (the directory itself plus everything below)
 *   - Bare "**" matches any chars including '/'
 *   - "*" matches a single segment (zero or more chars EXCEPT '/')
 *   - All other regex meta-chars are escaped: . ( ) [ ] { } + $ ^ | backslash ?
 *   - Pattern is anchored: the full repo-relative path must match
 *   - Empty-string glob returns a never-match regex (graceful no-op)
 *
 * NOT SUPPORTED in v1 (planner choice; can be added if call-site needs surface):
 *   - Leading "!" negation (CONTEXT D-07)
 *   - Brace expansion "{a,b}"
 *   - "?" single-char wildcard (treated as literal)
 *   - POSIX character classes
 *
 * Order matters: lift the special-case "**"/"-leading and "/**"-trailing tokens
 * to placeholders BEFORE escaping, so the regex meta-char escape step does not
 * see them; then escape; then resolve "*" and remaining "**"; then resolve
 * placeholders to their final regex meanings.
 *
 * Exported as a public API surface for direct unit testing (see REVIEW MEDIUM
 * disposition in this plan's review_disposition section).
 *
 * @param {string} glob  Gitignore-style glob pattern
 * @returns {RegExp}     Regex matching repo-relative paths, anchored ^...$
 */
function gitignoreGlobToRegex(glob) {
  // Empty-string glob is a graceful no-op: never matches any path.
  // Friendlier than throwing for call sites that may accumulate args programmatically.
  if (glob === '') {
    return /(?!)/;
  }

  // Step 1: lift the special-case leading-`**/` and trailing-`/**` tokens
  // to placeholders so subsequent steps don't mis-handle them.
  const LEADING_DOUBLE_SLASH = 'LDSPLACEHOLDER';
  const TRAILING_SLASH_DOUBLE = 'TSDPLACEHOLDER';
  const STANDALONE_DOUBLE = 'DBLPLACEHOLDER';

  let pat = glob;
  if (pat.startsWith('**/')) {
    pat = LEADING_DOUBLE_SLASH + pat.slice(3);
  }
  if (pat.endsWith('/**')) {
    pat = pat.slice(0, -3) + TRAILING_SLASH_DOUBLE;
  }
  // Lift any remaining bare `**` (e.g., embedded mid-pattern).
  pat = pat.replace(/\*\*/g, STANDALONE_DOUBLE);

  // Step 2: escape regex metacharacters EXCEPT '*' (and our placeholders).
  // We escape '?' too — gitignore treats '?' as single-char wildcard, but the
  // v1 use case is literal paths and `**` directory globs, so treating '?'
  // as literal is safer than half-implementing it.
  pat = pat.replace(/[.+^$|()\[\]{}\\?]/g, '\\$&');

  // Step 3: substitute remaining single '*' with [^/]* (single-segment match).
  pat = pat.replace(/\*/g, '[^/]*');

  // Step 4: resolve placeholders to their regex meanings.
  pat = pat
    .replace(new RegExp(LEADING_DOUBLE_SLASH, 'g'), '(?:.*\\/)?')   // zero or more dirs at start
    .replace(new RegExp(TRAILING_SLASH_DOUBLE, 'g'), '(?:\\/.*)?')  // '' or '/anything' at end
    .replace(new RegExp(STANDALONE_DOUBLE, 'g'), '.*');             // bare ** matches anything incl '/'

  return new RegExp('^' + pat + '$');
}

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
  // Loop HTML-tag stripping until the string stabilizes — single-pass
  // /<[^>]+>/g leaves <scr<script>ipt> as <script> (incomplete
  // multi-character sanitization). Loop closes the gap.
  let stripped = text;
  let prev;
  do {
    prev = stripped;
    stripped = stripped.replace(/<[^>]+>/g, '');
  } while (stripped !== prev);

  return stripped
    .replace(/\*\*(.+?)\*\*/g, '$1')         // bold
    .replace(/\*(.+?)\*/g, '$1')              // italic *
    .replace(/_(.+?)_/g, '$1')                // italic _
    .replace(/`(.+?)`/g, '$1')                // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links: keep display text
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
 * Pass 1 consensus fix: the optional slugCache lets the main loop avoid
 * re-reading the same target file more than once per run. The base
 * validateLink signature stays backward compatible — when no cache is
 * provided, the function reads the target file directly each time.
 *
 * @param {string} sourceFile   Absolute path to file containing the link
 * @param {number} lineNum      1-based line number
 * @param {string} ref          The raw ref text (may include #anchor)
 * @param {string} repoRoot     Absolute repo root (for traversal detection)
 * @param {Map<string, Set<string>>} [slugCache]  Optional shared slug cache
 * @returns {{ file: string, line: number, ref: string, reason: string } | null}
 */
function validateLink(sourceFile, lineNum, ref, repoRoot, slugCache) {
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

    // Consult slug cache if provided; populate on first access.
    let slugs;
    if (slugCache && slugCache.has(targetFile)) {
      slugs = slugCache.get(targetFile);
    } else {
      slugs = extractHeadingSlugs(targetFile);
      if (slugCache) slugCache.set(targetFile, slugs);
    }

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

// ─── discoverTrackedFiles ─────────────────────────────────────────────────────

/**
 * Recursively glob .md files under a directory, skipping node_modules and .git.
 * Used as a fallback when git ls-files is unavailable (non-git fixture trees).
 *
 * @param {string} dir
 * @param {string[]} [results]
 * @returns {string[]}
 */
function globMdFiles(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      globMdFiles(full, results);
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Discover all tracked Markdown files via git ls-files.
 * Falls back to a recursive glob if git is unavailable (non-git directory or
 * fixture directory used in unit tests).
 *
 * If excludeRegexes is provided, files whose REPO-RELATIVE path matches any
 * regex are filtered out. Conversion abs-path -> repo-relative uses
 * `path.relative(repoRoot, abs)` and normalizes path separators to `/` on
 * Windows so glob authors don't have to think about backslashes.
 *
 * @param {string} repoRoot           Absolute path to repo root (or fixture root)
 * @param {RegExp[]} [excludeRegexes] Optional exclude regexes (each matches repo-relative paths)
 * @returns {string[]}                Absolute paths to surviving .md files
 */
function discoverTrackedFiles(repoRoot, excludeRegexes) {
  // Primary path: git ls-files (respects .gitignore, fast on large trees).
  // Uses execFileSync (NOT execSync) — arguments passed as array, no shell injection.
  let files;
  try {
    const out = execFileSync('git', ['ls-files', '--', '*.md'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const tracked = out
      .split('\n')
      .filter(Boolean)
      .map(f => path.resolve(repoRoot, f));
    if (tracked.length > 0) {
      files = tracked;
    }
    // git ran but returned no .md files — fall through to glob (could be a
    // fixture tree that happens to be inside a parent git repo).
  } catch {
    // git unavailable or repoRoot is not a git working tree — fall through.
  }
  if (!files) files = globMdFiles(repoRoot);

  if (!excludeRegexes || excludeRegexes.length === 0) return files;

  return files.filter(abs => {
    const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
    return !excludeRegexes.some(rx => rx.test(rel));
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

/**
 * Main entry point. Discovers files, validates all links, emits output, exits.
 * Guarded by require.main === module so exports remain testable.
 *
 * Flags:
 *   --json           Emit machine-readable JSON instead of a text table
 *   --root <dir>     Override repo-root discovery (used by unit tests against fixtures)
 *
 * Argument validation (Pass 2 Codex MEDIUM fix):
 *   `--root` without a following directory argument exits 2 with stderr
 *   "validate-doc-links: --root requires a directory argument".
 *
 * Exit codes:
 *   0  Clean run (zero broken links)
 *   1  At least one broken link found
 *   2  Argument validation error (e.g., `--root` with no value)
 *
 * @param {string[]} argv  process.argv.slice(2)
 */
function main(argv) {
  const wantJson = argv.includes('--json');
  let repoRoot = process.cwd();
  const excludes = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      // Pass 2 Codex MEDIUM fix: validate that `--root` has a following value.
      // Without this, `--root` followed by `--json` would silently use `--json`
      // as the directory argument.
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        process.stderr.write(
          'validate-doc-links: --root requires a directory argument\n'
        );
        process.exit(2);
      }
      repoRoot = path.resolve(next);
      i++;
    } else if (a === '--exclude') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        process.stderr.write(
          'validate-doc-links: --exclude requires a glob argument\n'
        );
        process.exit(2);
      }
      excludes.push(next);
      i++;
    }
    // --json is consumed via argv.includes; no separate branch needed here.
  }

  const excludeRegexes = excludes.map(gitignoreGlobToRegex);
  const files = discoverTrackedFiles(repoRoot, excludeRegexes);
  const broken = [];
  let checked = 0;
  // Pass 1 consensus MEDIUM-HIGH fix: shared slug cache across all
  // validateLink calls in this run. Each target file is read at most once.
  const slugCache = new Map();

  for (const file of files) {
    const links = extractLinks(file);
    for (const link of links) {
      checked++;
      const result = validateLink(file, link.line, link.ref, repoRoot, slugCache);
      if (result) broken.push(result);
    }
  }

  if (wantJson) {
    const payload = {
      status: broken.length === 0 ? 'clean' : 'broken',
      checked,
      files: files.length,
      broken,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else if (broken.length === 0) {
    process.stdout.write(
      `validate-doc-links: all links valid (${checked} checked across ${files.length} files)\n`
    );
  } else {
    process.stdout.write(
      `validate-doc-links: ${broken.length} broken link(s) found\n\n`
    );
    process.stdout.write(formatTable(broken, repoRoot) + '\n');
  }

  process.exit(broken.length === 0 ? 0 : 1);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  toGfmSlug,
  extractHeadingSlugs,
  extractLinks,
  validateLink,
  formatTable,
  discoverTrackedFiles,
  gitignoreGlobToRegex,
};

// ─── Main guard ───────────────────────────────────────────────────────────────

if (require.main === module) {
  main(process.argv.slice(2));
}
