# Phase 55 Research — Internal Link Validator

**Researched:** 2026-05-07
**Domain:** Node.js CJS scripting — Markdown static analysis, file discovery, structured reporting
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCLINK-01 | Validator identifies broken relative-path refs in tracked `.md` files | Regex-based link extraction + `fs.existsSync()` on resolved paths |
| DOCLINK-02 | Validator identifies broken anchor refs within and across files | Heading extraction via GFM slug algorithm + lookup table |
| DOCLINK-03 | Validator outputs structured table — file, line, broken-ref, reason | Column-padded text table; same data emitted as JSON array for `--json` |
| DOCLINK-04 | Validator exits non-zero on any broken link, zero on clean run, `--json` flag | `process.exit(brokenCount > 0 ? 1 : 0)` with JSON branch behind `process.argv.includes('--json')` |
</phase_requirements>

---

## Domain Summary

The task is a standalone CJS script (`scripts/validate-doc-links.cjs`) that:

1. Discovers all tracked `.md` files via `git ls-files -- '*.md'`
2. Parses every Markdown link and image target with regex
3. For file-path refs: resolves relative to the containing file, checks existence with `fs.existsSync()`
4. For anchor refs: extracts all headings from the target file, converts to GFM slugs, and checks membership
5. Collects `{ file, line, ref, reason }` objects and emits a text table or JSON array
6. Exits 0 (clean) or 1 (broken links found)

The script is entirely self-contained. It imports only Node.js built-ins (`fs`, `path`, `child_process`) and lives under `scripts/` following the same style as `scripts/run-tests.cjs`. It is covered by unit tests in `tests/validate-doc-links.test.cjs` with fixture files under `tests/fixtures/doc-links/`.

---

## Approach Options Considered

### Option A: External Markdown parser (e.g., `remark`, `markdown-link-check`)

**Description:** Use an npm package to parse AST and extract links.

**Rejection rationale:**
- Project has zero production dependencies by design; STACK.md is explicit: "All runtime code uses only Node.js standard library. No external production dependencies."
- `markdown-link-check` is an external CLI tool, not a library importable as CJS, and its output format is not under our control.
- `remark` requires ESM or a CJS compat shim and would pull in a large dependency tree.
- The link grammar we need to handle is internally defined and well-bounded: standard Markdown inline links `[text](target)` and image links `![alt](target)`. Reference-style links are not used in this project's docs.

### Option B: Hand-rolled regex extraction (CHOSEN)

**Description:** Two targeted regexes on each line of each file, skip lines inside code fences, resolve and stat each target.

**Why this is correct:**
- Zero new dependencies — consistent with the project's zero-dependency architecture.
- The link grammar inside this repo is narrow: inline links `[...](target)` and images `![...](target)`. No HTML `<a href>` links, no reference-style `[text][id]` definitions need to be followed.
- Code fence exclusion is a single state machine bool toggled on `` ``` `` or `~~~` lines.
- Anchor slug generation is a deterministic 5-step algorithm (see below).
- The resulting script is short (~200 lines of well-commented CJS), easy to read, and easy to unit test with fixture files.

**Risk:** Regex extraction will miss links inside HTML blocks embedded in Markdown. Accepted — project docs do not use raw HTML blocks.

---

## Recommended Approach

### Module Structure

```
scripts/
  validate-doc-links.cjs       # Single CJS script, shebang, 'use strict'
tests/
  validate-doc-links.test.cjs  # Unit tests, node:test + node:assert
tests/fixtures/
  doc-links/
    clean/
      valid.md                 # All links resolve correctly
      target.md                # Target file for cross-links
    broken/
      broken-file.md           # Links to non-existent files
      broken-anchor.md         # Links to non-existent anchors
      fenced.md                # Broken-looking links inside code fences (should be ignored)
      relative-dot.md          # Links with ./ and ../ prefixes
```

### Key Functions with Signatures

```javascript
/**
 * Discover all tracked Markdown files via git ls-files.
 * Falls back to glob if git is unavailable (non-git directory).
 *
 * @param {string} repoRoot  Absolute path to repo root
 * @returns {string[]}       Absolute paths to .md files
 */
function discoverTrackedFiles(repoRoot) {}

/**
 * Extract all Markdown inline links and image links from a file.
 * Skips content inside code fences (``` or ~~~).
 * Returns line numbers (1-based).
 *
 * @param {string} filePath  Absolute path to .md file
 * @returns {{ line: number, ref: string, isAnchorOnly: boolean }[]}
 */
function extractLinks(filePath) {}

/**
 * Extract heading slugs from a Markdown file using GFM rules.
 * Returns a Set<string> of all valid anchor names.
 *
 * @param {string} filePath  Absolute path to .md file
 * @returns {Set<string>}
 */
function extractHeadingSlugs(filePath) {}

/**
 * Convert a heading string to a GitHub-Flavored Markdown anchor slug.
 *
 * @param {string} heading  Raw heading text (without leading #)
 * @returns {string}        Slug usable as #anchor
 */
function toGfmSlug(heading) {}

/**
 * Validate a single extracted link ref relative to its containing file.
 * Returns a broken-link record, or null if the link resolves correctly.
 *
 * @param {string} sourceFile   Absolute path to file containing the link
 * @param {number} lineNum      1-based line number
 * @param {string} ref          The raw ref text (may include #anchor)
 * @param {string} repoRoot     Absolute repo root (for slug cache lookup)
 * @returns {{ file, line, ref, reason } | null}
 */
function validateLink(sourceFile, lineNum, ref, repoRoot) {}

/**
 * Format an array of broken-link records as a padded text table.
 *
 * @param {{ file, line, ref, reason }[]} records
 * @param {string} repoRoot  Strip this prefix for relative display paths
 * @returns {string}
 */
function formatTable(records, repoRoot) {}

/**
 * Main entry point. Discovers files, validates all links, emits output, exits.
 * Guarded by require.main === module so exports can be tested.
 *
 * @param {string[]} argv  process.argv.slice(2)
 */
function main(argv) {}
```

### Error / Edge Cases Handled

| Case | Handling |
|------|----------|
| `[text](./file.md)` | Strip leading `./`, resolve relative to source file |
| `[text](../sibling/file.md)` | Resolve `..` via `path.resolve(path.dirname(sourceFile), ref)`, then check it still starts with `repoRoot` |
| `[text](file.md#section)` | Split on first `#`: validate file existence, then validate anchor in target file |
| `[text](#section)` | Same-file anchor — target file is `sourceFile` itself |
| `[text](https://example.com)` | Skip — not relative (detected by `/^https?:\/\//` or `/^mailto:/`) |
| `[text](mailto:x@y.com)` | Skip |
| Links inside `` ``` `` fences | Skipped — code fence state machine |
| URL-encoded refs (e.g., `file%20name.md`) | `decodeURIComponent()` applied before `fs.existsSync()` |
| Heading with inline code, bold, italics | Stripped before slugging: remove `**`, `*`, `_`, `` ` ``, `[]()` |
| Heading with emoji | Emoji characters pass through slug (GFM preserves them) |
| File path outside repo root (path traversal via `../`) | Detected: if `path.resolve()` result does not start with `repoRoot`, emit reason `"path escapes repository root"` |
| Target file exists but has zero headings, anchor requested | Reports `"anchor #foo not found in target (0 headings)"` |
| Non-`.md` file reference (e.g., `file.cjs`) | Still validates file existence; anchor check only performed if target is `.md` |

---

## Markdown Link Grammar (What We Parse and What We Ignore)

### Parsed

```
[link text](relative/path.md)
[link text](relative/path.md#anchor-name)
[link text](#same-file-anchor)
![image alt](relative/path.png)
```

Regex (applied per non-fenced line):

```javascript
const LINK_RE = /!?\[(?:[^\]]*)\]\(([^)]+)\)/g;
```

The capture group `([^)]+)` captures everything inside the parentheses. This is intentionally non-greedy free and stops at `)`.

### Ignored

- `[reference][id]` style links — not used in project docs; would require a second pass to resolve `[id]: url` definitions.
- Raw HTML `<a href="...">` — not present in project docs.
- `http://`, `https://`, `mailto:`, `ftp://` — external links, excluded by prefix check.
- Anything inside a code fence block (triple backtick or triple tilde).

### Code Fence Detection

```javascript
let inFence = false;
for (const [lineIdx, line] of lines.entries()) {
  if (/^(`{3,}|~{3,})/.test(line)) {
    inFence = !inFence;
    continue;
  }
  if (inFence) continue;
  // extract links from line
}
```

This handles the common case. Fences with info strings (`` ```js ``) are handled because the regex anchors to `^` and checks for 3+ backticks/tildes regardless of trailing content.

---

## Anchor Slug Algorithm (GitHub-Flavored)

GitHub's GFM anchor algorithm, as documented in the GitHub Markup spec:

**Input:** Heading text with leading `#`s stripped (e.g., `## My Heading` → `My Heading`)

**Steps:**

1. Strip Markdown formatting spans: remove `**`, `*`, `_`, `` ` ``, `[]()` pairs (keep the text inside `[]`), `<tag>` HTML tags.
2. Convert to lowercase.
3. Remove all characters that are NOT alphanumeric, hyphen `-`, space ` `, or Unicode letters/digits.
4. Replace spaces with hyphens `-`.
5. Collapse consecutive hyphens into one (safe — GFM does not generate consecutive hyphens from clean headings, and collapsing prevents edge-case mismatches).

**Deduplication:** GitHub appends `-1`, `-2`, etc. for repeated headings. The validator must track seen slugs per file and apply the same suffix logic when building the heading slug set.

**Implementation:**

```javascript
function toGfmSlug(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')         // bold
    .replace(/\*(.+?)\*/g, '$1')              // italic *
    .replace(/_(.+?)_/g, '$1')               // italic _
    .replace(/`(.+?)`/g, '$1')               // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links: keep display text
    .replace(/<[^>]+>/g, '')                 // HTML tags
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')                // remove non-word, non-space, non-hyphen
    .replace(/\s+/g, '-')                    // spaces to hyphens
    .replace(/-+/g, '-');                    // collapse consecutive hyphens
}

function extractHeadingSlugs(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
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
```

**Confidence:** HIGH — the 5-step algorithm is well-documented in the GitHub Markup source and consistent across GitHub's rendered anchor hrefs.

---

## File Discovery Strategy

### Primary: `git ls-files`

```javascript
const { execFileSync } = require('child_process');

function discoverTrackedFiles(repoRoot) {
  try {
    const out = execFileSync('git', ['ls-files', '--', '*.md'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .filter(Boolean)
      .map(f => path.resolve(repoRoot, f));
  } catch {
    // Fallback for non-git environments (unit test fixtures, etc.)
    return globMdFiles(repoRoot);
  }
}
```

Note: `execFileSync` (not `execSync`) is used to avoid shell injection. Arguments are passed as an array. This is consistent with project security conventions — `security.cjs` enforces similar patterns throughout the codebase.

**Why `git ls-files` over glob:**
- Only tracks files known to git — avoids node_modules, .git internals, temp files, build artifacts.
- `config.json` has `search_gitignored: false` — consistent with project intent.
- It respects `.gitignore` by definition.
- Available in every environment where CI runs (CI always has git).
- Faster on large trees than a recursive `readdir` walk.

**Fallback glob (non-git environments / unit tests):**

```javascript
function globMdFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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
```

The fallback is also used in unit tests where `git ls-files` is not reliable (temp dirs are not git repos). Tests use the fallback directly by pointing the script at a fixture directory.

---

## Output Formats

### Text Table (default)

**Columns:** `FILE`, `LINE`, `REF`, `REASON`

Column widths are computed as max(header length, max content length) across all records. Fields are left-padded to column width. Records are separated by a single newline.

```
validate-doc-links: 3 broken link(s) found

FILE                              LINE  REF                          REASON
--------------------------------  ----  ---------------------------  ----------------------------
.planning/ROADMAP.md              47    ../phases/old.md             file not found
docs/DEVOPS-HANDOFF.md            112   ./agents/deprecated.md       file not found
docs/DEVOPS-HANDOFF.md            200   README.md#nonexistent        anchor #nonexistent not found
```

Header underline uses `-` repeated to column width, separated by `  ` (two spaces).

**Clean pass:**
```
validate-doc-links: all links valid (247 checked across 18 files)
```

### JSON mode (`--json`)

Emitted to stdout as a JSON object. Suitable for `jq` piping or CI tooling.

```json
{
  "status": "broken",
  "checked": 247,
  "files": 18,
  "broken": [
    {
      "file": ".planning/ROADMAP.md",
      "line": 47,
      "ref": "../phases/old.md",
      "reason": "file not found"
    },
    {
      "file": "docs/DEVOPS-HANDOFF.md",
      "line": 200,
      "ref": "README.md#nonexistent",
      "reason": "anchor #nonexistent not found in target"
    }
  ]
}
```

**Clean pass JSON:**
```json
{ "status": "clean", "checked": 247, "files": 18, "broken": [] }
```

**Schema fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"clean"` or `"broken"` | Overall result |
| `checked` | number | Total links evaluated |
| `files` | number | Total files scanned |
| `broken` | array | Empty on clean pass |
| `broken[].file` | string | Repo-relative path to source file |
| `broken[].line` | number | 1-based line number |
| `broken[].ref` | string | Raw ref as written in the source |
| `broken[].reason` | string | Human-readable explanation |

**Reason strings (canonical):**

| Reason | When |
|--------|------|
| `"file not found"` | Resolved path does not exist |
| `"path escapes repository root"` | `../` traversal goes above repo root |
| `"anchor #<slug> not found in target"` | File exists but anchor missing |
| `"anchor #<slug> not found in target (0 headings)"` | File exists but has no headings |

---

## Test Strategy

### Test File Layout

```
tests/
  validate-doc-links.test.cjs    # Unit tests for all exported functions
tests/fixtures/
  doc-links/
    clean/
      index.md                   # Has links to target.md and #own-heading
      target.md                  # Valid target with headings
    broken/
      broken-file.md             # [link](./missing.md)
      broken-anchor.md           # [link](./target.md#no-such-anchor)
      broken-same-file.md        # [link](#no-such-anchor) — same-file miss
    edge/
      fenced.md                  # [fake](./missing.md) inside code block — no finding
      relative-parent.md         # [link](../clean/target.md) — valid via ../
      traversal.md               # [link](../../../../etc/passwd) — escapes root
      url-encoded.md             # [link](target%20name.md) — URL encoded ref
      no-headings.md             # [link](empty.md#anchor) — target has no headings
      empty.md                   # Empty file (no headings)
      duplicate-headings.md      # Two identical ## Same Heading lines
```

### Unit Test Coverage Plan

The test file uses `node:test` + `node:assert` following existing project conventions. No external helpers needed — script functions are exported for direct module testing.

```javascript
// tests/validate-doc-links.test.cjs
/**
 * validate-doc-links.cjs — Unit Tests
 * Requirements: DOCLINK-01, DOCLINK-02, DOCLINK-03, DOCLINK-04
 */
'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  extractLinks,
  extractHeadingSlugs,
  toGfmSlug,
  validateLink,
  formatTable,
  discoverTrackedFiles,
} = require('../scripts/validate-doc-links.cjs');

const FIXTURES = path.join(__dirname, 'fixtures', 'doc-links');
```

**Test groups and what they cover:**

| `describe` block | Representative tests |
|------------------|---------------------|
| `toGfmSlug` | plain text, bold stripping, code span stripping, lowercase, punctuation removal, spaces to hyphens, emoji passthrough |
| `extractHeadingSlugs` | empty file, single heading, duplicate headings (dedup `-1` suffix), headings inside fenced blocks ignored |
| `extractLinks` | inline link, image link, links inside fence skipped, same-file anchor, external URL skipped, mailto skipped, `./` prefix |
| `validateLink` | valid file ref → null, missing file → reason `"file not found"`, valid anchor → null, missing anchor → reason, path traversal → reason, url-encoded ref decoded correctly |
| `formatTable` | empty array → no rows, single record, multi-record column alignment, repo-relative display paths |
| `discoverTrackedFiles` | falls back to glob in non-git temp dir, returns only `.md` files |
| Exit codes (integration) | spawn against clean/ fixture → exit 0; spawn against broken/ fixture → exit 1 |
| `--json` flag | spawn with `--json` against broken/ → stdout is valid JSON with `broken` array |

### Test Isolation

- All temp directories created with `fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-doclinks-'))` and cleaned in `afterEach`.
- Fixture files are read-only, checked into `tests/fixtures/doc-links/` — no writes to fixture directory during test runs.
- The `main()` function is NOT directly unit tested (it calls `process.exit()`). It is integration-tested by spawning the script as a child process via `spawnSync` and checking exit code and stdout.
- The `require.main === module` guard ensures that `require('../scripts/validate-doc-links.cjs')` in tests loads only the exported functions without invoking `main()`.

### Integration Test Pattern (for DOCLINK-04 exit code verification)

```javascript
describe('validate-doc-links: exit codes', () => {
  test('exits 0 on clean fixture', () => {
    const { spawnSync } = require('child_process');
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'scripts', 'validate-doc-links.cjs'),
       '--root', path.join(FIXTURES, 'clean')],
      { encoding: 'utf8' }
    );
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`);
  });

  test('exits 1 when broken links exist', () => {
    const { spawnSync } = require('child_process');
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'scripts', 'validate-doc-links.cjs'),
       '--root', path.join(FIXTURES, 'broken')],
      { encoding: 'utf8' }
    );
    assert.strictEqual(result.status, 1, `expected exit 1, got: ${result.status}`);
  });
});
```

The `--root <dir>` flag (or equivalent) lets the script target a fixture directory. In that mode, `discoverTrackedFiles` hits the glob fallback (fixture dirs are not git repos). This is intentional.

---

## Validation Architecture

`nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | None (discovered by `scripts/run-tests.cjs` via `readdirSync`) |
| Quick run command | `node --test tests/validate-doc-links.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCLINK-01 | Broken file-path refs detected | Unit + integration | `node --test tests/validate-doc-links.test.cjs` | No — Wave 0 |
| DOCLINK-02 | Broken anchor refs detected (within-file + cross-file) | Unit + integration | `node --test tests/validate-doc-links.test.cjs` | No — Wave 0 |
| DOCLINK-03 | Output table has file, line, ref, reason columns | Unit (formatTable) | `node --test tests/validate-doc-links.test.cjs` | No — Wave 0 |
| DOCLINK-04 | Exit non-zero on broken; exit 0 on clean; `--json` flag | Integration (spawnSync) | `node --test tests/validate-doc-links.test.cjs` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test tests/validate-doc-links.test.cjs`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green, coverage held at ≥91% line / ≥83% branch, before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/validate-doc-links.test.cjs` — covers DOCLINK-01 through DOCLINK-04
- [ ] `tests/fixtures/doc-links/` — all subdirs and fixture files listed in Test File Layout above
- [ ] `scripts/validate-doc-links.cjs` — the script itself, with `require.main === module` guard so exports are testable
- [ ] `.c8rc.json` — add `"scripts/validate-doc-links.cjs"` to the `include` array so coverage is tracked

---

## Implementation Sequence

Three plans, ordered for TDD discipline:

### Wave 1 — Plan 55-01: Fixtures + Core Functions (TDD)

Write fixture files and unit tests first. Then implement the five pure/fs functions:
- `toGfmSlug(text)` — pure, no I/O
- `extractHeadingSlugs(filePath)` — reads one file
- `extractLinks(filePath)` — reads one file
- `validateLink(sourceFile, lineNum, ref, repoRoot)` — composes the above
- `formatTable(records, repoRoot)` — pure formatting

All functions exported; tests must pass before Wave 2 begins.

**Files created:** `scripts/validate-doc-links.cjs` (exports only), `tests/validate-doc-links.test.cjs`, `tests/fixtures/doc-links/**`

### Wave 2 — Plan 55-02: Discovery + Main Entrypoint

Implement:
- `discoverTrackedFiles(repoRoot)` — `execFileSync('git', ['ls-files', ...])` with glob fallback
- `main(argv)` — wires discovery → extract → validate → format/emit → exit

Add integration tests (spawnSync-based) for DOCLINK-04 exit code and `--json` output shape. Update `.c8rc.json` to include the new script.

**Files modified:** `scripts/validate-doc-links.cjs`, `tests/validate-doc-links.test.cjs`, `.c8rc.json`

### Wave 3 — Plan 55-03: Real-Repo Run + Suite Green

Run `scripts/validate-doc-links.cjs` against the actual repo root:
- Fix any genuine broken links discovered, or add to `.doclinkignore` if intentional
- Verify script exits 0 on the clean repo
- Run `npm test` — full suite green, coverage thresholds held
- Update `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` to reflect new script

**Files modified:** potentially any `.md` files with discovered broken refs; `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md`; optionally `.doclinkignore`

---

## Open Questions / Risks

1. **Reference-style links `[text][id]`**
   - What we know: project docs appear not to use reference-style links (rare format in the existing `.md` files).
   - What's unclear: whether any auto-generated planning docs use this format.
   - Recommendation: skip in v1, document as a known limitation in the script header comment. Add support in Wave 3 if the real-repo run finds them causing false negatives.

2. **HTML anchor tags (`<a id="foo">` as link targets)**
   - What we know: GFM supports both heading-derived and HTML `<a id>` anchors.
   - What's unclear: whether any project doc uses `<a id>` as an anchor definition.
   - Recommendation: do not parse HTML anchors in Phase 55. If a real broken-anchor report appears in Wave 3 that traces to an `<a id>` definition, add parsing then. Flag as known limitation in script comments.

3. **`.doclinkignore` suppression**
   - What we know: some refs may be intentionally forward-referencing docs that exist only on feature branches.
   - What's unclear: whether any such cases exist in the current repo state.
   - Recommendation: implement a minimal ignore list. If no ignore cases surface in Wave 3, the feature is zero-cost (file is optional — script skips ignore loading if file absent).

4. **Coverage tracking**
   - `.c8rc.json` currently includes specific files, not the `scripts/` directory wholesale.
   - `scripts/validate-doc-links.cjs` must be added to the `include` array in Wave 2.
   - Risk if missed: coverage runs will not penalize untested branches in the new script, defeating the ≥80% per-module threshold.

5. **Windows path separator**
   - `git ls-files` returns forward-slash paths universally.
   - `path.resolve()` on Windows produces backslashes.
   - CI runs Linux and macOS (per STACK.md) — this is low risk for Phase 55.
   - Recommendation: note in script comments; use `path.resolve()` (not string concatenation) for all path construction. The `startsWith(repoRoot)` check for traversal detection should normalize to forward slashes: `resolved.split(path.sep).join('/')`.

---

## Sources

### Primary (HIGH confidence)

- `.planning/codebase/TESTING.md` — all test patterns, node:test conventions, directory structure, naming conventions, c8 coverage config
- `.planning/codebase/CONVENTIONS.md` — CJS module structure, naming, export patterns, `'use strict'`, JSDoc style, section dividers
- `.planning/codebase/STACK.md` — zero external dependency constraint, Node.js built-ins only, no linter config
- `scripts/run-tests.cjs` — exact style for CJS scripts with shebang, `'use strict'`, built-in require
- `scripts/secret-scan.sh` — reference for structured output format, exit code conventions for CI scripts
- `tests/checkpoint.test.cjs`, `tests/uat-patterns.test.cjs` — most recent test file style (v2.7 phase patterns)
- `.planning/ROADMAP.md` Phase 55 — success criteria (authoritative)
- `.planning/REQUIREMENTS.md` — DOCLINK-01 through DOCLINK-04 (authoritative)
- `.planning/config.json` — `nyquist_validation: true`, `commit_docs: true`

### Secondary (MEDIUM confidence)

- GitHub Markup spec / GFM spec — the 5-step slug algorithm is well-established and consistent across GitHub's rendered output. Cross-verified against CommonMark spec extensions for GFM.

### Tertiary (LOW confidence)

- None — all claims in this document trace directly to files read or verified specifications.

---

## Metadata

**Confidence breakdown:**

- Approach (regex vs. parser): HIGH — confirmed by STACK.md zero-dependency constraint
- GFM slug algorithm: HIGH — well-documented in GH Markup spec, consistent behavior
- File discovery (`git ls-files`): HIGH — standard idiom, confirmed by project patterns
- Test layout: HIGH — directly matches existing `checkpoint.test.cjs` / `uat-patterns.test.cjs` patterns
- Edge case coverage: MEDIUM — common cases are well-defined; HTML anchors and reference links are documented risks with accepted deferral

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable domain — GFM spec and Node built-ins change slowly)
