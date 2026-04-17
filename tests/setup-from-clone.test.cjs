'use strict';

/**
 * Tests for bin/setup-from-clone.js — One-Command Install Orchestrator
 *
 * Validates:
 *   1. File structure (exists, syntax, shebang, no external deps)
 *   2. Integration: script runs without error, exits 0, produces expected output
 *   3. package.json has scripts.setup entry pointing to this script
 *   4. Idempotency: second run produces SKIP results (nothing re-installed)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'bin', 'setup-from-clone.js');

// ---------------------------------------------------------------------------
// 1. File structure
// ---------------------------------------------------------------------------

describe('setup-from-clone.js file structure', () => {
  it('exists at bin/setup-from-clone.js', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), `Expected ${SCRIPT_PATH} to exist`);
  });

  it('has valid JavaScript syntax', () => {
    // node -c performs a syntax-only check; throws if invalid
    assert.doesNotThrow(() => {
      execFileSync(process.execPath, ['-c', SCRIPT_PATH], { timeout: 10000 });
    }, 'bin/setup-from-clone.js must have valid JavaScript syntax');
  });

  it('starts with shebang line', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    const firstLine = content.split('\n')[0];
    assert.ok(
      firstLine.startsWith('#!/usr/bin/env node'),
      `First line should be shebang, got: ${firstLine}`
    );
  });

  it('uses strict mode', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(
      content.includes("'use strict'"),
      "Script must contain 'use strict'"
    );
  });

  it('has no external dependencies — only Node.js built-ins', () => {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf8');
    // Extract all require() calls
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    const ALLOWED_BUILTINS = new Set(['fs', 'path', 'os', 'child_process']);
    while ((match = requirePattern.exec(content)) !== null) {
      const dep = match[1];
      // Skip node: prefixed built-ins too (e.g. node:fs)
      const depName = dep.startsWith('node:') ? dep.slice(5) : dep;
      assert.ok(
        ALLOWED_BUILTINS.has(depName),
        `External dependency detected: require('${dep}'). Only fs, path, os, child_process are allowed.`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Integration — run the script
// ---------------------------------------------------------------------------

describe('setup-from-clone.js integration', () => {
  it('runs without error and exits 0', () => {
    let stdout = '';
    assert.doesNotThrow(() => {
      stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
        cwd: PROJECT_ROOT,
        timeout: 120000,
        encoding: 'utf8',
      });
    }, 'Script must exit 0 on a properly installed developer machine');
    assert.ok(stdout.length > 0, 'Script should produce stdout output');
  });

  it('produces verification output with PASS or SKIP markers', () => {
    const stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });
    // At least one verification line must be PASS or SKIP
    assert.ok(
      stdout.includes('PASS') || stdout.includes('SKIP'),
      'Expected at least one PASS or SKIP in verification output'
    );
  });

  it('reports command count in verification output', () => {
    const stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });
    assert.ok(
      stdout.includes('command') || stdout.includes('Commands'),
      'Expected "command" or "Commands" in verification output (command count check)'
    );
  });

  it('reports hook count in verification output', () => {
    const stdout = execFileSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });
    assert.ok(
      stdout.includes('hook') || stdout.includes('Hook'),
      'Expected "hook" or "Hook" in verification output (hook count check)'
    );
  });
});

// ---------------------------------------------------------------------------
// 3. package.json setup script entry
// ---------------------------------------------------------------------------

describe('package.json setup script', () => {
  it('has setup script defined pointing to the orchestrator', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts, 'package.json must have a scripts field');
    assert.equal(
      pkg.scripts.setup,
      'node bin/setup-from-clone.js',
      'scripts.setup must be "node bin/setup-from-clone.js"'
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Idempotency — second run produces SKIP results
// ---------------------------------------------------------------------------

describe('idempotency', () => {
  it('second run produces SKIP results for already-installed items', () => {
    // Run once (first run may have already run above — that is fine)
    execFileSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });

    // Second run — everything should already be installed
    const secondRunOutput = execFileSync(process.execPath, [SCRIPT_PATH], {
      cwd: PROJECT_ROOT,
      timeout: 120000,
      encoding: 'utf8',
    });

    // On a properly installed machine, second run should skip npm install
    // (node_modules already current) and skip injection-patterns.json (content identical)
    assert.ok(
      secondRunOutput.includes('SKIP'),
      'Second run must produce at least one SKIP (idempotency check: D-08)'
    );
  });
});
