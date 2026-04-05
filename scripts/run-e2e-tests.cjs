#!/usr/bin/env node
// Cross-platform E2E test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.
// Pass --smoke to run only *.smoke.test.cjs files.
'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

const smokeOnly = process.argv.includes('--smoke');
const testDir = join(__dirname, '..', 'tests', 'e2e');
const suffix = smokeOnly ? '.smoke.test.cjs' : '.test.cjs';

const files = readdirSync(testDir)
  .filter(f => f.endsWith(suffix))
  .sort()
  .map(f => join('tests', 'e2e', f));

if (files.length === 0) {
  console.error(
    smokeOnly
      ? 'No smoke test files found in tests/e2e/'
      : 'No test files found in tests/e2e/',
  );
  process.exit(1);
}

try {
  execFileSync(process.execPath, ['--test', ...files], {
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  process.exit(err.status || 1);
}
