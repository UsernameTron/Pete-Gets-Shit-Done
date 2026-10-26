#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const readline = require('readline');

const cliOptions = require('./lib/cli-options');
const { cyan, dim, reset, yellow } = require('./lib/colors');
const { CODEX_AGENT_SANDBOX, generateCodexAgentToml, generateCodexConfigBlock, installCodexConfig, mergeCodexConfig, stripGsdFromCodexConfig } = require('./lib/codex-config');
const { GSD_CODEX_MARKER } = require('./lib/codex-hooks-feature');
const { convertClaudeAgentToAntigravityAgent, convertClaudeCommandToAntigravitySkill, convertClaudeToAntigravityContent } = require('./lib/converters/antigravity');
const { convertClaudeAgentToCodexAgent, convertClaudeCommandToCodexSkill, getCodexSkillAdapterHeader } = require('./lib/converters/codex');
const { claudeToCopilotTools, convertClaudeAgentToCopilotAgent, convertClaudeCommandToCopilotSkill, convertClaudeToCopilotContent, convertCopilotToolName } = require('./lib/converters/copilot');
const { convertClaudeAgentToCursorAgent, convertClaudeCommandToCursorSkill } = require('./lib/converters/cursor');
const { convertClaudeToGeminiAgent } = require('./lib/converters/gemini');
const { convertClaudeToOpencodeFrontmatter } = require('./lib/converters/opencode');
const { neutralizeAgentReferences, yamlIdentifier } = require('./lib/converters/shared');
const { convertClaudeAgentToWindsurfAgent, convertClaudeCommandToWindsurfSkill, convertClaudeToWindsurfMarkdown } = require('./lib/converters/windsurf');
const { GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER, GSD_COPILOT_INSTRUCTIONS_MARKER, mergeCopilotInstructions, stripGsdFromCopilotInstructions } = require('./lib/copilot-instructions');
const { copyCommandsAsAntigravitySkills, copyCommandsAsCopilotSkills, copyCommandsAsWindsurfSkills } = require('./lib/copy');
const { copyDirRecursive, installGovernance, installGovernancePlugins, mergeGovernanceJson, scaffoldProject, uninstallGovernance, validateGsdPrefixAgents } = require('./lib/governance');
const { install, installAllRuntimes, uninstall } = require('./lib/install-core');
const { reportLocalPatches, writeManifest } = require('./lib/manifest');
const { getConfigDirFromHome, getDirName, getGlobalDir } = require('./lib/paths');
const { isHookRegistered, validateHookFields } = require('./lib/settings');

// Get version from package.json
const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasOpencode = args.includes('--opencode');
const hasClaude = args.includes('--claude');
const hasGemini = args.includes('--gemini');
const hasCodex = args.includes('--codex');
const hasCopilot = args.includes('--copilot');
const hasAntigravity = args.includes('--antigravity');
const hasCursor = args.includes('--cursor');
const hasWindsurf = args.includes('--windsurf');
const hasBoth = args.includes('--both'); // Legacy flag, keeps working
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const hasNoGovernance = args.includes('--no-governance');
const hasScaffold = args.includes('--scaffold');
const hasPlugins = args.includes('--plugins');

// Runtime selection - can be set by flags or interactive prompt
let selectedRuntimes = [];
if (hasAll) {
  selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex', 'copilot', 'antigravity', 'cursor', 'windsurf'];
} else if (hasBoth) {
  selectedRuntimes = ['claude', 'opencode'];
} else {
  if (hasOpencode) selectedRuntimes.push('opencode');
  if (hasClaude) selectedRuntimes.push('claude');
  if (hasGemini) selectedRuntimes.push('gemini');
  if (hasCodex) selectedRuntimes.push('codex');
  if (hasCopilot) selectedRuntimes.push('copilot');
  if (hasAntigravity) selectedRuntimes.push('antigravity');
  if (hasCursor) selectedRuntimes.push('cursor');
  if (hasWindsurf) selectedRuntimes.push('windsurf');
}

// WSL + Windows Node.js detection
// When Windows-native Node runs on WSL, os.homedir() and path.join() produce
// backslash paths that don't resolve correctly on the Linux filesystem.
if (process.platform === 'win32') {
  let isWSL = false;
  try {
    if (process.env.WSL_DISTRO_NAME) {
      isWSL = true;
    } else if (fs.existsSync('/proc/version')) {
      const procVersion = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
        isWSL = true;
      }
    }
  } catch {
    // Ignore read errors — not WSL
  }

  if (isWSL) {
    console.error(`
${yellow}⚠ Detected WSL with Windows-native Node.js.${reset}

This causes path resolution issues that prevent correct installation.
Please install a Linux-native Node.js inside WSL:

  curl -fsSL https://fnm.vercel.app/install | bash
  fnm install --lts

Then re-run: npx get-shit-done-cc@latest
`);
    process.exit(1);
  }
}

const banner = '\n' +
  cyan + '   ██████╗ ███████╗██████╗\n' +
  '  ██╔════╝ ██╔════╝██╔══██╗\n' +
  '  ██║  ███╗███████╗██║  ██║\n' +
  '  ██║   ██║╚════██║██║  ██║\n' +
  '  ╚██████╔╝███████║██████╔╝\n' +
  '   ╚═════╝ ╚══════╝╚═════╝' + reset + '\n' +
  '\n' +
  '  Get Shit Done ' + dim + 'v' + pkg.version + reset + '\n' +
  '  A meta-prompting, context engineering and spec-driven\n' +
  '  development system for Claude Code, OpenCode, Gemini, Codex, Copilot, Antigravity, Cursor, and Windsurf by TÂCHES.\n';

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    // Error if --config-dir is provided without a value or next arg is another flag
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  // Also handle --config-dir=value format
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    const value = configDirArg.split('=')[1];
    if (!value) {
      console.error(`  ${yellow}--config-dir requires a non-empty path${reset}`);
      process.exit(1);
    }
    return value;
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');
const forceStatusline = args.includes('--force-statusline');
Object.assign(cliOptions, { explicitConfigDir, hasNoGovernance, hasPlugins, hasScaffold, forceStatusline });

console.log(banner);

if (hasUninstall) {
  console.log('  Mode: Uninstall\n');
}

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx get-shit-done-cc [options]\n\n  ${yellow}Options:${reset}\n    ${cyan}-g, --global${reset}              Install globally (to config directory)\n    ${cyan}-l, --local${reset}               Install locally (to current directory)\n    ${cyan}--claude${reset}                  Install for Claude Code only\n    ${cyan}--opencode${reset}                Install for OpenCode only\n    ${cyan}--gemini${reset}                  Install for Gemini only\n    ${cyan}--codex${reset}                   Install for Codex only\n    ${cyan}--copilot${reset}                 Install for Copilot only\n    ${cyan}--antigravity${reset}             Install for Antigravity only\n    ${cyan}--cursor${reset}                  Install for Cursor only\n    ${cyan}--windsurf${reset}                Install for Windsurf only\n    ${cyan}--all${reset}                     Install for all runtimes\n    ${cyan}-u, --uninstall${reset}           Uninstall GSD (remove all GSD files)\n    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory\n    ${cyan}-h, --help${reset}                Show this help message\n    ${cyan}--force-statusline${reset}        Replace existing statusline config\n    ${cyan}--no-governance${reset}           Skip governance layer (CLAUDE.md, hooks, permissions)\n    ${cyan}--scaffold${reset}                Create project structure (.planning/, tasks/, context/)\n    ${cyan}--plugins${reset}                 Register governance plugins (claude-mcp-ecosystem, claude-code-factory)\n\n  ${yellow}Examples:${reset}\n    ${dim}# Interactive install (prompts for runtime and location)${reset}\n    npx get-shit-done-cc\n\n    ${dim}# Install for Claude Code globally${reset}\n    npx get-shit-done-cc --claude --global\n\n    ${dim}# Install for Gemini globally${reset}\n    npx get-shit-done-cc --gemini --global\n\n    ${dim}# Install for Codex globally${reset}\n    npx get-shit-done-cc --codex --global\n\n    ${dim}# Install for Copilot globally${reset}\n    npx get-shit-done-cc --copilot --global\n\n    ${dim}# Install for Copilot locally${reset}\n    npx get-shit-done-cc --copilot --local\n\n    ${dim}# Install for Antigravity globally${reset}\n    npx get-shit-done-cc --antigravity --global\n\n    ${dim}# Install for Antigravity locally${reset}\n    npx get-shit-done-cc --antigravity --local\n\n    ${dim}# Install for Cursor globally${reset}\n    npx get-shit-done-cc --cursor --global\n\n    ${dim}# Install for Cursor locally${reset}\n    npx get-shit-done-cc --cursor --local\n\n    ${dim}# Install for Windsurf globally${reset}\n    npx get-shit-done-cc --windsurf --global\n\n    ${dim}# Install for Windsurf locally${reset}\n    npx get-shit-done-cc --windsurf --local\n\n    ${dim}# Install for all runtimes globally${reset}\n    npx get-shit-done-cc --all --global\n\n    ${dim}# Install to custom config directory${reset}\n    npx get-shit-done-cc --codex --global --config-dir ~/.codex-work\n\n    ${dim}# Install to current project only${reset}\n    npx get-shit-done-cc --claude --local\n\n    ${dim}# Uninstall GSD from Cursor globally${reset}\n    npx get-shit-done-cc --cursor --global --uninstall\n\n  ${yellow}Notes:${reset}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over CLAUDE_CONFIG_DIR / GEMINI_CONFIG_DIR / CODEX_HOME / COPILOT_CONFIG_DIR / ANTIGRAVITY_CONFIG_DIR / CURSOR_CONFIG_DIR / WINDSURF_CONFIG_DIR environment variables.\n`);
  process.exit(0);
}

/**
 * Prompt for runtime selection
 */
function promptRuntime(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const runtimeMap = {
    '1': 'claude',
    '2': 'opencode',
    '3': 'gemini',
    '4': 'codex',
    '5': 'copilot',
    '6': 'antigravity',
    '7': 'cursor',
    '8': 'windsurf'
  };
  const allRuntimes = ['claude', 'opencode', 'gemini', 'codex', 'copilot', 'antigravity', 'cursor', 'windsurf'];

  console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}\n\n  ${cyan}1${reset}) Claude Code  ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) OpenCode     ${dim}(~/.config/opencode)${reset} - open source, free models
  ${cyan}3${reset}) Gemini       ${dim}(~/.gemini)${reset}
  ${cyan}4${reset}) Codex        ${dim}(~/.codex)${reset}
  ${cyan}5${reset}) Copilot      ${dim}(~/.copilot)${reset}
  ${cyan}6${reset}) Antigravity  ${dim}(~/.gemini/antigravity)${reset}
  ${cyan}7${reset}) Cursor       ${dim}(~/.cursor)${reset}
  ${cyan}8${reset}) Windsurf     ${dim}(~/.windsurf)${reset}
  ${cyan}9${reset}) All

  ${dim}Select multiple: 1,4,6 or 1 4 6${reset}
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const input = answer.trim() || '1';

    // "All" shortcut
    if (input === '9') {
      callback(allRuntimes);
      return;
    }

    // Parse comma-separated, space-separated, or single choice
    const choices = input.split(/[\s,]+/).filter(Boolean);
    const selected = [];
    for (const c of choices) {
      const runtime = runtimeMap[c];
      if (runtime && !selected.includes(runtime)) {
        selected.push(runtime);
      }
    }

    callback(selected.length > 0 ? selected : ['claude']);
  });
}

/**
 * Prompt for install location
 */
function promptLocation(runtimes) {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to global install${reset}\n`);
    installAllRuntimes(runtimes, true, false);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  const pathExamples = runtimes.map(r => {
    const globalPath = getGlobalDir(r, explicitConfigDir);
    return globalPath.replace(os.homedir(), '~');
  }).join(', ');

  const localExamples = runtimes.map(r => `./${getDirName(r)}`).join(', ');

  console.log(`  ${yellow}Where would you like to install?${reset}\n\n  ${cyan}1${reset}) Global ${dim}(${pathExamples})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(${localExamples})${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    installAllRuntimes(runtimes, isGlobal, true);
  });
}

// Test-only exports — skip main logic when loaded as a module for testing
if (process.env.GSD_TEST_MODE) {
  module.exports = {
    yamlIdentifier,
    getCodexSkillAdapterHeader,
    convertClaudeCommandToCursorSkill,
    convertClaudeAgentToCursorAgent,
    convertClaudeToGeminiAgent,
    convertClaudeAgentToCodexAgent,
    generateCodexAgentToml,
    generateCodexConfigBlock,
    stripGsdFromCodexConfig,
    mergeCodexConfig,
    installCodexConfig,
    install,
    convertClaudeCommandToCodexSkill,
    convertClaudeToOpencodeFrontmatter,
    neutralizeAgentReferences,
    GSD_CODEX_MARKER,
    CODEX_AGENT_SANDBOX,
    getDirName,
    getGlobalDir,
    getConfigDirFromHome,
    claudeToCopilotTools,
    convertCopilotToolName,
    convertClaudeToCopilotContent,
    convertClaudeCommandToCopilotSkill,
    convertClaudeAgentToCopilotAgent,
    copyCommandsAsCopilotSkills,
    GSD_COPILOT_INSTRUCTIONS_MARKER,
    GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER,
    mergeCopilotInstructions,
    stripGsdFromCopilotInstructions,
    convertClaudeToAntigravityContent,
    convertClaudeCommandToAntigravitySkill,
    convertClaudeAgentToAntigravityAgent,
    copyCommandsAsAntigravitySkills,
    convertClaudeToWindsurfMarkdown,
    convertClaudeCommandToWindsurfSkill,
    convertClaudeAgentToWindsurfAgent,
    copyCommandsAsWindsurfSkills,
    writeManifest,
    reportLocalPatches,
    validateHookFields,
    isHookRegistered,
    validateGsdPrefixAgents,
    mergeGovernanceJson,
    installGovernance,
    installGovernancePlugins,
    scaffoldProject,
    uninstallGovernance,
    copyDirRecursive,
  };
} else {

// Main logic
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    process.exit(1);
  }
  const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
  for (const runtime of runtimes) {
    uninstall(hasGlobal, runtime);
  }
} else if (selectedRuntimes.length > 0) {
  if (!hasGlobal && !hasLocal) {
    promptLocation(selectedRuntimes);
  } else {
    installAllRuntimes(selectedRuntimes, hasGlobal, false);
  }
} else if (hasGlobal || hasLocal) {
  // Default to Claude if no runtime specified but location is
  installAllRuntimes(['claude'], hasGlobal, false);
} else {
  // Interactive
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal detected, defaulting to Claude Code global install${reset}\n`);
    installAllRuntimes(['claude'], true, false);
  } else {
    promptRuntime((runtimes) => {
      promptLocation(runtimes);
    });
  }
}

} // end of else block for GSD_TEST_MODE
