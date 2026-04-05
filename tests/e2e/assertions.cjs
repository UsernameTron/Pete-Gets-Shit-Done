/**
 * E2E Assertion Helpers
 *
 * Thin wrappers around node:assert/strict that produce better error messages
 * for GSD E2E tests.  Zero external dependencies — Node built-ins only.
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ─── Result Assertions ──────────────────────────────────────────────────────

/**
 * Assert a gsd-tools result succeeded (result.success === true).
 */
function assertSuccess(result, msg) {
  assert.strictEqual(
    result.success,
    true,
    `Command should have succeeded but failed. Error: ${result.error}${msg ? '. ' + msg : ''}`
  );
}

/**
 * Assert a gsd-tools result failed (result.success === false).
 */
function assertFailure(result, msg) {
  assert.strictEqual(
    result.success,
    false,
    `Command should have failed but succeeded. Output: ${result.output?.slice(0, 200)}${msg ? '. ' + msg : ''}`
  );
}

// ─── File Assertions ────────────────────────────────────────────────────────

/**
 * Assert a file exists on disk.
 */
function assertFileExists(filePath) {
  assert.ok(
    fs.existsSync(filePath),
    `Expected file to exist: ${filePath}`
  );
}

/**
 * Assert a file does NOT exist on disk.
 */
function assertFileNotExists(filePath) {
  assert.ok(
    !fs.existsSync(filePath),
    `Expected file to NOT exist: ${filePath}`
  );
}

/**
 * Assert a file's contents match a string or RegExp pattern.
 *
 * @param {string} filePath - Absolute path to the file.
 * @param {string|RegExp} pattern - Substring or regex to match.
 */
function assertFileContains(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = pattern instanceof RegExp
    ? pattern.test(content)
    : content.includes(pattern);
  assert.ok(
    matches,
    `Expected ${filePath} to contain ${pattern}. Content (first 200 chars): ${content.slice(0, 200)}`
  );
}

/**
 * Assert a file's contents do NOT match a string or RegExp pattern.
 *
 * @param {string} filePath - Absolute path to the file.
 * @param {string|RegExp} pattern - Substring or regex that must be absent.
 */
function assertFileNotContains(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = pattern instanceof RegExp
    ? pattern.test(content)
    : content.includes(pattern);
  assert.ok(
    !matches,
    `Expected ${filePath} to NOT contain ${pattern}`
  );
}

// ─── STATE.md Assertions ────────────────────────────────────────────────────

/**
 * Parse simple YAML frontmatter from a file.
 *
 * Handles the GSD STATE.md format:
 *   ---
 *   key: value
 *   nested:
 *     sub_key: sub_value
 *   ---
 *
 * Returns a flat-ish object.  Nested blocks (indented lines below a bare key)
 * become sub-objects one level deep.
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');
  let start = -1;
  let end = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) {
        start = i;
      } else {
        end = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1) return {};

  const fmLines = lines.slice(start + 1, end);
  const result = {};
  let currentParent = null;

  for (const line of fmLines) {
    // Skip blank lines
    if (line.trim() === '') {
      currentParent = null;
      continue;
    }

    const indented = /^[ \t]+/.test(line);

    if (indented && currentParent) {
      // Nested key under currentParent
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (typeof result[currentParent] !== 'object') {
        result[currentParent] = {};
      }
      result[currentParent][key] = parseScalar(val);
    } else {
      // Top-level key
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();

      if (val === '') {
        // Bare key — start of nested block
        currentParent = key;
        result[key] = {};
      } else {
        currentParent = null;
        result[key] = parseScalar(val);
      }
    }
  }

  return result;
}

/**
 * Coerce YAML scalar strings to native types.
 */
function parseScalar(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

/**
 * Assert a field in STATE.md's YAML frontmatter equals the expected value.
 *
 * @param {string} projectDir - Project root containing .planning/STATE.md.
 * @param {string} field - Top-level frontmatter key.
 * @param {*} value - Expected value.
 */
function assertStateField(projectDir, field, value) {
  const statePath = path.join(projectDir, '.planning', 'STATE.md');
  const content = fs.readFileSync(statePath, 'utf-8');
  const parsed = parseFrontmatter(content);
  const actual = parsed[field];

  assert.deepStrictEqual(
    actual,
    value,
    `Expected STATE.md field '${field}' to be ${JSON.stringify(value)} but got ${JSON.stringify(actual)}`
  );
}

// ─── JSON Output Assertions ─────────────────────────────────────────────────

/**
 * Resolve a dot-notation path against an object.
 *
 * @param {object} obj - Root object.
 * @param {string} dotPath - e.g. "progress.completed_phases".
 * @returns {*} The resolved value, or undefined.
 */
function resolvePath(obj, dotPath) {
  return dotPath.split('.').reduce((cur, key) => {
    if (cur == null) return undefined;
    return cur[key];
  }, obj);
}

/**
 * Parse result.output as JSON and assert values at dot-notation paths.
 *
 * @param {object} result - gsd-tools result with .output string.
 * @param {{ path: string, value: * }[]} assertions - Array of path/value checks.
 */
function assertJsonOutput(result, assertions) {
  let parsed;
  try {
    parsed = JSON.parse(result.output);
  } catch (err) {
    assert.fail(
      `Failed to parse result.output as JSON: ${err.message}. Output (first 200 chars): ${(result.output || '').slice(0, 200)}`
    );
  }

  for (const { path: dotPath, value } of assertions) {
    const actual = resolvePath(parsed, dotPath);
    assert.deepStrictEqual(
      actual,
      value,
      `Expected JSON path '${dotPath}' to be ${JSON.stringify(value)} but got ${JSON.stringify(actual)}`
    );
  }
}

// ─── Frontmatter Validation ─────────────────────────────────────────────────

/**
 * Assert a file has YAML frontmatter containing all required fields.
 *
 * @param {string} filePath - Absolute path to the file.
 * @param {string[]} requiredFields - Field names that must appear as keys.
 */
function assertValidFrontmatter(filePath, requiredFields) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) {
        start = i;
      } else {
        end = i;
        break;
      }
    }
  }

  assert.ok(
    start !== -1 && end !== -1,
    `Expected YAML frontmatter (--- delimiters) in ${filePath}`
  );

  const fmBlock = lines.slice(start + 1, end).join('\n');

  for (const field of requiredFields) {
    // Match field as a key at start of line (possibly indented), followed by colon
    const keyPattern = new RegExp(`^\\s*${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'm');
    assert.ok(
      keyPattern.test(fmBlock),
      `Missing required frontmatter field '${field}' in ${filePath}`
    );
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  assertSuccess,
  assertFailure,
  assertFileExists,
  assertFileNotExists,
  assertFileContains,
  assertFileNotContains,
  assertStateField,
  assertJsonOutput,
  assertValidFrontmatter,
};
