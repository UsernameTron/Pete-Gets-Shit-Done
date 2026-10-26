const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const cliOptions = require('./cli-options');
const { cyan, dim, green, reset, yellow } = require('./colors');
const { cleanupOrphanedFiles } = require('./install-steps');
const { saveLocalPatches } = require('./manifest');
const { getDirName, getGlobalDir } = require('./paths');
const { configureOpencodePermissions } = require('./runtimes/opencode');
const { writeSettings } = require('./settings');

const RUNTIMES = {
  claude: require('./runtimes/claude'),
  opencode: require('./runtimes/opencode'),
  gemini: require('./runtimes/gemini'),
  codex: require('./runtimes/codex'),
  copilot: require('./runtimes/copilot'),
  antigravity: require('./runtimes/antigravity'),
  cursor: require('./runtimes/cursor'),
  windsurf: require('./runtimes/windsurf'),
};

const RUNTIME_LABELS = {
  opencode: 'OpenCode',
  gemini: 'Gemini',
  codex: 'Codex',
  copilot: 'Copilot',
  antigravity: 'Antigravity',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
};

// Unrecognised runtime names have always fallen through to the Claude Code layout.
function runtimeModule(runtime) {
  return Object.hasOwn(RUNTIMES, runtime) ? RUNTIMES[runtime] : RUNTIMES.claude;
}

/**
 * Resolve where a runtime lives and how to label it
 */
function buildContext(isGlobal, runtime) {
  const dirName = getDirName(runtime);
  // Get the target directory based on runtime and install type
  const targetDir = isGlobal
    ? getGlobalDir(runtime, cliOptions.explicitConfigDir)
    : path.join(process.cwd(), dirName);
  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');
  const runtimeLabel = Object.hasOwn(RUNTIME_LABELS, runtime) ? RUNTIME_LABELS[runtime] : 'Claude Code';
  return { isGlobal, runtime, dirName, targetDir, locationLabel, runtimeLabel };
}

/**
 * Path prefix for file references in markdown content (e.g. gsd-tools.cjs).
 * Replaces $HOME/.claude/ or ~/.claude/ so the result is <pathPrefix>get-shit-done/bin/...
 * For global installs: use $HOME/ so paths expand correctly inside double-quoted
 * shell commands (~ does NOT expand inside double quotes, causing MODULE_NOT_FOUND).
 * For local installs: use resolved absolute path (may be outside $HOME).
 */
function resolvePathPrefix(targetDir, isGlobal) {
  const resolvedTarget = path.resolve(targetDir).replace(/\\/g, '/');
  const homeDir = os.homedir().replace(/\\/g, '/');
  return isGlobal && resolvedTarget.startsWith(homeDir)
    ? '$HOME' + resolvedTarget.slice(homeDir.length) + '/'
    : `${resolvedTarget}/`;
}

/**
 * Install to the specified directory for a specific runtime
 * @param {boolean} isGlobal - Whether to install globally or locally
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini', 'codex')
 */
function install(isGlobal, runtime = 'claude') {
  const ctx = buildContext(isGlobal, runtime);
  ctx.src = path.join(__dirname, '..', '..');
  ctx.pathPrefix = resolvePathPrefix(ctx.targetDir, isGlobal);
  // Track installation failures
  ctx.failures = [];

  console.log(`  Installing for ${cyan}${ctx.runtimeLabel}${reset} to ${cyan}${ctx.locationLabel}${reset}\n`);

  // Save any locally modified GSD files before they get wiped
  saveLocalPatches(ctx.targetDir);

  // Clean up orphaned files from previous versions
  cleanupOrphanedFiles(ctx.targetDir);

  return runtimeModule(runtime).install(ctx);
}

/**
 * Uninstall GSD from the specified directory for a specific runtime
 * Removes only GSD-specific files/directories, preserves user content
 * @param {boolean} isGlobal - Whether to uninstall from global or local
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini', 'codex', 'copilot')
 */
function uninstall(isGlobal, runtime = 'claude') {
  const ctx = buildContext(isGlobal, runtime);

  console.log(`  Uninstalling GSD from ${cyan}${ctx.runtimeLabel}${reset} at ${cyan}${ctx.locationLabel}${reset}\n`);

  // Check if target directory exists
  if (!fs.existsSync(ctx.targetDir)) {
    console.log(`  ${yellow}⚠${reset} Directory does not exist: ${ctx.locationLabel}`);
    console.log(`  Nothing to uninstall.\n`);
    return;
  }

  ctx.removedCount = 0;
  runtimeModule(runtime).uninstall(ctx);

  if (ctx.removedCount === 0) {
    console.log(`  ${yellow}⚠${reset} No GSD files found to remove.`);
  }

  console.log(`
  ${green}Done!${reset} GSD has been uninstalled from ${ctx.runtimeLabel}.
  Your other files and settings have been preserved.
`);
}


/**
 * Apply statusline config, then print completion message
 */
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, runtime = 'claude', isGlobal = true) {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const isCopilot = runtime === 'copilot';
  const isCursor = runtime === 'cursor';
  const isWindsurf = runtime === 'windsurf';

  if (shouldInstallStatusline && !isOpencode && !isCodex && !isCopilot && !isCursor && !isWindsurf) {
    settings.statusLine = {
      type: 'command',
      command: statuslineCommand
    };
    console.log(`  ${green}✓${reset} Configured statusline`);
  }

  // Write settings when runtime supports settings.json
  if (!isCodex && !isCopilot && !isCursor && !isWindsurf) {
    writeSettings(settingsPath, settings);
  }

  // Configure OpenCode permissions
  if (isOpencode) {
    configureOpencodePermissions(isGlobal);
  }

  // For non-Claude runtimes, set resolve_model_ids: "omit" in ~/.gsd/defaults.json
  // so resolveModelInternal() returns '' instead of Claude aliases (opus/sonnet/haiku)
  // that the runtime can't resolve. Users can still use model_overrides for explicit IDs.
  // See #1156.
  if (runtime !== 'claude') {
    const gsdDir = path.join(os.homedir(), '.gsd');
    const defaultsPath = path.join(gsdDir, 'defaults.json');
    try {
      fs.mkdirSync(gsdDir, { recursive: true });
      let defaults = {};
      try { defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8')); } catch { /* new file */ }
      if (defaults.resolve_model_ids !== 'omit') {
        defaults.resolve_model_ids = 'omit';
        fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2) + '\n');
        console.log(`  ${green}✓${reset} Set resolve_model_ids: "omit" in ~/.gsd/defaults.json`);
      }
    } catch (e) {
      console.log(`  ${yellow}⚠${reset} Could not write ~/.gsd/defaults.json: ${e.message}`);
    }
  }

  let program = 'Claude Code';
  if (runtime === 'opencode') program = 'OpenCode';
  if (runtime === 'gemini') program = 'Gemini';
  if (runtime === 'codex') program = 'Codex';
  if (runtime === 'copilot') program = 'Copilot';
  if (runtime === 'antigravity') program = 'Antigravity';
  if (runtime === 'cursor') program = 'Cursor';

  let command = '/gsd:new-project';
  if (runtime === 'opencode') command = '/gsd-new-project';
  if (runtime === 'codex') command = '$gsd-new-project';
  if (runtime === 'copilot') command = '/gsd-new-project';
  if (runtime === 'antigravity') command = '/gsd-new-project';
  if (runtime === 'cursor') command = 'gsd-new-project (mention the skill name)';
  console.log(`
  ${green}Done!${reset} Open a blank directory in ${program} and run ${cyan}${command}${reset}.

  ${cyan}Join the community:${reset} https://discord.gg/gsd
`);
}

/**
 * Handle statusline configuration with optional prompt
 */
function handleStatusline(settings, isInteractive, callback) {
  const hasExisting = settings.statusLine != null;

  if (!hasExisting) {
    callback(true);
    return;
  }

  if (cliOptions.forceStatusline) {
    callback(true);
    return;
  }

  if (!isInteractive) {
    console.log(`  ${yellow}⚠${reset} Skipping statusline (already configured)`);
    console.log(`    Use ${cyan}--force-statusline${reset} to replace\n`);
    callback(false);
    return;
  }

  const existingCmd = settings.statusLine.command || settings.statusLine.url || '(custom)';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`
  ${yellow}⚠${reset} Existing statusline detected\n
  Your current statusline:
    ${dim}command: ${existingCmd}${reset}

  GSD includes a statusline showing:
    • Model name
    • Current task (from todo list)
    • Context window usage (color-coded)

  ${cyan}1${reset}) Keep existing
  ${cyan}2${reset}) Replace with GSD statusline
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2');
  });
}

/**
 * Install GSD for all selected runtimes
 */
function installAllRuntimes(runtimes, isGlobal, isInteractive) {
  const results = [];

  for (const runtime of runtimes) {
    const result = install(isGlobal, runtime);
    results.push(result);
  }

  const statuslineRuntimes = ['claude', 'gemini'];
  const primaryStatuslineResult = results.find(r => statuslineRuntimes.includes(r.runtime));

  const finalize = (shouldInstallStatusline) => {
    for (const result of results) {
      const useStatusline = statuslineRuntimes.includes(result.runtime) && shouldInstallStatusline;
      finishInstall(
        result.settingsPath,
        result.settings,
        result.statuslineCommand,
        useStatusline,
        result.runtime,
        isGlobal
      );
    }
  };

  if (primaryStatuslineResult) {
    handleStatusline(primaryStatuslineResult.settings, isInteractive, finalize);
  } else {
    finalize(false);
  }
}

module.exports = {
  install,
  uninstall,
  installAllRuntimes,
};
