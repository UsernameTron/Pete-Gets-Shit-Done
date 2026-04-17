#!/usr/bin/env node
'use strict';

/**
 * One-command install orchestrator for GSD.
 *
 * Usage:   node bin/setup-from-clone.js
 * npm:     npm run setup
 *
 * Flow:
 *   1. npm install (skip if node_modules is current)
 *   2. scripts/build-hooks.js (always — fast, ensures dist is current)
 *   3. bin/install.js --claude (symlinks, hooks, plugin registration)
 *   4. Copy lib/injection-patterns.json to installed location (skip if identical)
 *   5. Verification pass (commands, hooks, plugin, injection-patterns)
 *   6. Print results table and exit 0 (pass) or 1 (fail)
 *
 * Design decisions from CONTEXT.md:
 *   D-01  Entry via "setup" npm script
 *   D-03  npm install is called internally
 *   D-04  bin/install.js --claude (Claude-only, non-interactive)
 *   D-05  Zero dependencies — Node built-ins only
 *   D-06  Comprehensive health check after install
 *   D-07  Pass/fail table output (GSD UAT format)
 *   D-08  Idempotent — detect what is already done and skip it
 *   D-09  Skip if symlinks / hooks already current
 *   D-10  Update if source is newer than installed
 *   D-11  Report skipped vs updated
 *   D-12  Safe to run after every git pull
 *   D-13  Fail fast on critical steps (npm install, build-hooks, installer)
 *   D-14  Continue past non-critical failures, collect them
 *   D-15  Report collected non-critical failures at end
 *   D-16  No rollback — re-running fixes partial installs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Color constants — matches install.js palette
// ---------------------------------------------------------------------------
const cyan  = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red   = '\x1b[31m';
const dim   = '\x1b[2m';
const bold  = '\x1b[1m';
const reset = '\x1b[0m';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const PROJECT_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

const CLAUDE_DIR           = path.join(HOME, '.claude');
const CLAUDE_COMMANDS_DIR  = path.join(CLAUDE_DIR, 'commands', 'gsd');
const CLAUDE_HOOKS_DIR     = path.join(CLAUDE_DIR, 'hooks');
const CLAUDE_SETTINGS      = path.join(CLAUDE_DIR, 'settings.json');
const INSTALLED_GSD_BIN    = path.join(CLAUDE_DIR, 'get-shit-done', 'bin');
const INSTALLED_LIB_DIR    = path.join(INSTALLED_GSD_BIN, 'lib');
const INSTALLED_PATTERNS   = path.join(INSTALLED_LIB_DIR, 'injection-patterns.json');
const SOURCE_PATTERNS      = path.join(PROJECT_ROOT, 'lib', 'injection-patterns.json');
const REPO_COMMANDS_DIR    = path.join(PROJECT_ROOT, 'commands', 'gsd');

// The 6 hook files that must be present after install
const HOOK_FILES = [
  'gsd-check-update.js',
  'gsd-config-protection.js',
  'gsd-context-monitor.js',
  'gsd-cost-tracker.js',
  'gsd-prompt-guard.js',
  'gsd-statusline.js',
];

// ---------------------------------------------------------------------------
// Step result tracking
// ---------------------------------------------------------------------------

/** @type {Array<{step: string, status: 'pass'|'skip'|'fail'|'warn', detail: string}>} */
const results = [];

function record(step, status, detail) {
  results.push({ step, status, detail });
  const statusTag = formatStatus(status);
  process.stdout.write(`  ${statusTag}  ${dim}${step}${reset}  ${detail}\n`);
}

function formatStatus(status) {
  switch (status) {
    case 'pass': return `${green}PASS${reset}`;
    case 'skip': return `${yellow}SKIP${reset}`;
    case 'warn': return `${yellow}WARN${reset}`;
    case 'fail': return `${red}FAIL${reset}`;
    default:     return status;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countMdFiles(dir) {
  try {
    const entries = fs.readdirSync(dir);
    return entries.filter(f => f.endsWith('.md')).length;
  } catch (_) {
    return 0;
  }
}

function fileExists(p) {
  try { fs.accessSync(p); return true; } catch (_) { return false; }
}

function filesIdentical(a, b) {
  try {
    const bufA = fs.readFileSync(a);
    const bufB = fs.readFileSync(b);
    return Buffer.compare(bufA, bufB) === 0;
  } catch (_) {
    return false;
  }
}

/**
 * Returns true if node_modules appears up-to-date.
 * Checks: node_modules exists, .package-lock.json exists, and
 * package.json mtime <= .package-lock.json mtime.
 */
function nodeModulesCurrent() {
  const nmDir   = path.join(PROJECT_ROOT, 'node_modules');
  const lockMark = path.join(nmDir, '.package-lock.json');
  try {
    if (!fs.existsSync(nmDir) || !fs.existsSync(lockMark)) return false;
    const pkgMtime  = fs.statSync(path.join(PROJECT_ROOT, 'package.json')).mtimeMs;
    const lockMtime = fs.statSync(lockMark).mtimeMs;
    return pkgMtime <= lockMtime;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\n${bold}${cyan}GSD Setup — One-Command Install${reset}\n`);
console.log(`${dim}Project root: ${PROJECT_ROOT}${reset}\n`);

// ---------------------------------------------------------------------------
// Step 1: npm install
// ---------------------------------------------------------------------------
console.log(`${bold}Step 1:${reset} npm install`);

if (nodeModulesCurrent()) {
  record('npm install', 'skip', 'node_modules up to date');
} else {
  try {
    execFileSync('npm', ['install'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    record('npm install', 'pass', 'dependencies installed');
  } catch (err) {
    record('npm install', 'fail', err.message || String(err));
    process.stderr.write(`\n${red}CRITICAL: npm install failed. Aborting.${reset}\n`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Step 2: Build hooks (always — fast, ensures dist is current)
// ---------------------------------------------------------------------------
console.log(`\n${bold}Step 2:${reset} Build hooks`);

try {
  execFileSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'build-hooks.js')], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
  record('build-hooks', 'pass', 'hooks/dist built');
} catch (err) {
  record('build-hooks', 'fail', err.message || String(err));
  process.stderr.write(`\n${red}CRITICAL: build-hooks.js failed. Aborting.${reset}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 3: Run installer (bin/install.js --claude)
// ---------------------------------------------------------------------------
console.log(`\n${bold}Step 3:${reset} Install (bin/install.js --claude)`);

try {
  execFileSync(process.execPath, [path.join(PROJECT_ROOT, 'bin', 'install.js'), '--claude'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
  record('bin/install.js --claude', 'pass', 'symlinks, hooks, plugin registration complete');
} catch (err) {
  record('bin/install.js --claude', 'fail', err.message || String(err));
  process.stderr.write(`\n${red}CRITICAL: installer failed. Aborting.${reset}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 4: Copy injection-patterns.json (skip if identical)
// ---------------------------------------------------------------------------
console.log(`\n${bold}Step 4:${reset} Copy lib/injection-patterns.json`);

try {
  if (!fileExists(SOURCE_PATTERNS)) {
    record('injection-patterns.json', 'warn', `source missing: ${SOURCE_PATTERNS}`);
  } else if (fileExists(INSTALLED_PATTERNS) && filesIdentical(SOURCE_PATTERNS, INSTALLED_PATTERNS)) {
    record('injection-patterns.json', 'skip', 'already current');
  } else {
    fs.mkdirSync(INSTALLED_LIB_DIR, { recursive: true });
    fs.copyFileSync(SOURCE_PATTERNS, INSTALLED_PATTERNS);
    record('injection-patterns.json', 'pass', `copied to ${INSTALLED_PATTERNS}`);
  }
} catch (err) {
  record('injection-patterns.json', 'warn', err.message || String(err));
}

// ---------------------------------------------------------------------------
// Verification Phase
// ---------------------------------------------------------------------------
console.log(`\n${bold}Verification:${reset}`);

// V-1: Command count matches repo
const repoCommandCount      = countMdFiles(REPO_COMMANDS_DIR);
const installedCommandCount = countMdFiles(CLAUDE_COMMANDS_DIR);

if (installedCommandCount === 0 && repoCommandCount === 0) {
  record('Commands installed', 'warn', `could not count files (directories may be missing)`);
} else if (installedCommandCount >= repoCommandCount && repoCommandCount > 0) {
  record('Commands installed', 'pass', `${installedCommandCount} of ${repoCommandCount} commands present at ${CLAUDE_COMMANDS_DIR}`);
} else {
  record('Commands installed', 'fail', `expected ${repoCommandCount} commands, found ${installedCommandCount} at ${CLAUDE_COMMANDS_DIR}`);
}

// V-2: Hook files present
const missingHooks = HOOK_FILES.filter(h => !fileExists(path.join(CLAUDE_HOOKS_DIR, h)));

if (missingHooks.length === 0) {
  record('Hooks installed', 'pass', `all ${HOOK_FILES.length} hooks present at ${CLAUDE_HOOKS_DIR}`);
} else {
  record('Hooks installed', 'fail', `missing: ${missingHooks.join(', ')}`);
}

// V-3: GSD plugin installed (directory exists at ~/.claude/get-shit-done/)
const GSD_PLUGIN_DIR = path.join(CLAUDE_DIR, 'get-shit-done');
const pluginInstalled = fileExists(GSD_PLUGIN_DIR) && fs.statSync(GSD_PLUGIN_DIR).isDirectory();

if (pluginInstalled) {
  record('Plugin installed', 'pass', `get-shit-done directory present at ${GSD_PLUGIN_DIR}`);
} else {
  record('Plugin installed', 'fail', `get-shit-done directory not found at ${GSD_PLUGIN_DIR}`);
}

// V-4: injection-patterns.json at installed location
if (fileExists(INSTALLED_PATTERNS)) {
  record('injection-patterns.json installed', 'pass', INSTALLED_PATTERNS);
} else {
  record('injection-patterns.json installed', 'fail', `not found at ${INSTALLED_PATTERNS}`);
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------
const COL_STEP   = 36;
const COL_STATUS = 6;
const COL_DETAIL = 55;

function padEnd(str, len) {
  // Strip ANSI escape codes for length calculation
  const plain = str.replace(/\x1b\[[0-9;]*m/g, '');
  return str + ' '.repeat(Math.max(0, len - plain.length));
}

console.log(`\n${bold}Results${reset}`);
console.log(dim + '─'.repeat(COL_STEP + COL_STATUS + COL_DETAIL + 8) + reset);
console.log(
  bold +
  padEnd('Step', COL_STEP) + '  ' +
  padEnd('Status', COL_STATUS) + '  ' +
  'Detail' +
  reset
);
console.log(dim + '─'.repeat(COL_STEP + COL_STATUS + COL_DETAIL + 8) + reset);

for (const r of results) {
  const statusStr = formatStatus(r.status);
  const detailStr = r.detail.length > COL_DETAIL ? r.detail.slice(0, COL_DETAIL - 3) + '...' : r.detail;
  console.log(
    padEnd(r.step, COL_STEP) + '  ' +
    padEnd(statusStr, COL_STATUS + 10) + '  ' +  // +10 to account for ANSI codes in pad comparison
    dim + detailStr + reset
  );
}

console.log(dim + '─'.repeat(COL_STEP + COL_STATUS + COL_DETAIL + 8) + reset);

// Summary counts
const passed   = results.filter(r => r.status === 'pass').length;
const skipped  = results.filter(r => r.status === 'skip').length;
const failed   = results.filter(r => r.status === 'fail').length;
const warnings = results.filter(r => r.status === 'warn').length;

const summaryParts = [
  `${green}${passed} passed${reset}`,
  `${yellow}${skipped} skipped${reset}`,
  failed > 0 ? `${red}${failed} failed${reset}` : `${dim}0 failed${reset}`,
  warnings > 0 ? `${yellow}${warnings} warnings${reset}` : `${dim}0 warnings${reset}`,
];

console.log(`\n${summaryParts.join('  ')}\n`);

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (failed > 0) {
  process.stderr.write(`${red}Setup completed with failures. Run again after resolving the issues above.${reset}\n\n`);
  process.exit(1);
}

if (warnings > 0) {
  process.stdout.write(`${yellow}Setup completed with warnings. Check the table above.${reset}\n\n`);
}

process.stdout.write(`${green}${bold}GSD setup complete.${reset} Run ${cyan}npm test${reset} to verify all 2,490 assertions pass.\n\n`);
process.exit(0);
