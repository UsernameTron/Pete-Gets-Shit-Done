#!/usr/bin/env node
// gsd-hook-version: 1.30.0
// GSD Config Protection — PreToolUse hook
// Blocks Write/Edit operations targeting linter/formatter config files.
// Agents frequently modify these to make checks pass instead of fixing code.
// This hook steers the agent back to fixing the source.
//
// Triggers on: Write and Edit tool calls to protected config filenames
// Action: Fail-closed blocking — exits 2 with BLOCKED message to stderr
//
// Exit codes:
//   0 = allow (not a protected config file, or non-Write/Edit tool)
//   2 = block (protected config file modification attempted)

'use strict';

const path = require('path');

const PROTECTED_FILES = new Set([
  // ESLint (legacy + v9 flat config, JS/TS/MJS/CJS)
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
  // Prettier (all config variants including ESM)
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  // Biome
  'biome.json',
  'biome.jsonc',
  // Ruff (Python)
  '.ruff.toml',
  'ruff.toml',
  // Note: pyproject.toml is intentionally NOT included here because it
  // contains project metadata alongside linter config. Blocking all edits
  // to pyproject.toml would prevent legitimate dependency changes.
  // Shell / Style / Markdown
  '.shellcheckrc',
  '.stylelintrc',
  '.stylelintrc.json',
  '.stylelintrc.yml',
  '.markdownlint.json',
  '.markdownlint.yaml',
  '.markdownlintrc',
]);

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;

    // Only check Write and Edit operations
    if (toolName !== 'Write' && toolName !== 'Edit') {
      process.exit(0);
    }

    const filePath = data.tool_input?.file_path || data.tool_input?.file || '';
    if (!filePath) {
      process.exit(0);
    }

    const basename = path.basename(filePath);
    if (PROTECTED_FILES.has(basename)) {
      process.stderr.write(
        `BLOCKED: Modifying ${basename} is not allowed. ` +
        'Fix the source code to satisfy linter/formatter rules instead of ' +
        'weakening the config. If this is a legitimate config change, ' +
        'disable the config-protection hook temporarily.\n'
      );
      process.exit(2);
    }

    process.exit(0);
  } catch {
    // Silent fail — never block tool execution on error
    process.exit(0);
  }
});
