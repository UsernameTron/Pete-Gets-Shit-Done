#!/usr/bin/env node
// Cross-platform test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.
'use strict';

const { readdirSync, mkdtempSync, rmSync } = require('fs');
const { join } = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const testDir = join(__dirname, '..', 'tests');
const files = readdirSync(testDir)
  .filter(f => f.endsWith('.test.cjs'))
  .sort()
  .map(f => join('tests', f));

if (files.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

// Hermetic sandbox: several test files exercise the real installer, which
// copies commands/agents/hooks and merges governance into the live config
// dir. Un-sandboxed, every `npm test` run reinstalled GSD into ~/.claude —
// 2026-07-16: 20 runs minted 120 CLAUDE.md.backup files; 2026-07-17: a run
// resurrected 33 retired commands and the governance hooks mid-session.
// Point HOME at a throwaway dir so suite side effects land there instead.
const sandboxHome = mkdtempSync(join(os.tmpdir(), 'gsd-test-home-'));

try {
  execFileSync(process.execPath, ['--test', ...files], {
    stdio: 'inherit',
    env: {
      ...process.env,
      HOME: sandboxHome,
      USERPROFILE: sandboxHome, // Windows: os.homedir() reads USERPROFILE
      CLAUDE_CONFIG_DIR: '', // don't let a real config dir leak through
    },
  });
} catch (err) {
  process.exit(err.status || 1);
} finally {
  try { rmSync(sandboxHome, { recursive: true, force: true }); } catch (e) {}
}
