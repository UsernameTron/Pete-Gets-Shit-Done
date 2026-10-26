const fs = require('fs');
const path = require('path');
const os = require('os');
const { dim, green, reset, yellow } = require('../colors');
const { convertClaudeToOpencodeFrontmatter } = require('../converters/opencode');
const { copyFlattenedCommands } = require('../copy');
const { installPayload, verifyInstalled } = require('../install-steps');
const { getOpencodeGlobalDir, resolveOpencodeConfigPath } = require('../paths');
const { parseJsonc } = require('../settings');
const { loadRuntimeSettings } = require('../settings-hooks');
const { removeSharedArtifacts } = require('../uninstall-steps');

const PROFILE = {
  convertAgent: content => convertClaudeToOpencodeFrontmatter(content, { isAgent: true }),
  installsHooks: true,
};

/**
 * Configure OpenCode permissions to allow reading GSD reference docs
 * This prevents permission prompts when GSD accesses the get-shit-done directory
 * @param {boolean} isGlobal - Whether this is a global or local install
 */
function configureOpencodePermissions(isGlobal = true) {
  // For local installs, use ./.opencode/
  // For global installs, use ~/.config/opencode/
  const opencodeConfigDir = isGlobal
    ? getOpencodeGlobalDir()
    : path.join(process.cwd(), '.opencode');
  // Ensure config directory exists
  fs.mkdirSync(opencodeConfigDir, { recursive: true });

  const configPath = resolveOpencodeConfigPath(opencodeConfigDir);

  // Read existing config or create empty object
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      config = parseJsonc(content);
    } catch (e) {
      // Cannot parse - DO NOT overwrite user's config
      const configFile = path.basename(configPath);
      console.log(`  ${yellow}⚠${reset} Could not parse ${configFile} - skipping permission config`);
      console.log(`    ${dim}Reason: ${e.message}${reset}`);
      console.log(`    ${dim}Your config was NOT modified. Fix the syntax manually if needed.${reset}`);
      return;
    }
  }

  // Ensure permission structure exists
  if (!config.permission) {
    config.permission = {};
  }

  // Build the GSD path using the actual config directory
  // Use ~ shorthand if it's in the default location, otherwise use full path
  const defaultConfigDir = path.join(os.homedir(), '.config', 'opencode');
  const gsdPath = opencodeConfigDir === defaultConfigDir
    ? '~/.config/opencode/get-shit-done/*'
    : `${opencodeConfigDir.replace(/\\/g, '/')}/get-shit-done/*`;
  
  let modified = false;

  // Configure read permission
  if (!config.permission.read || typeof config.permission.read !== 'object') {
    config.permission.read = {};
  }
  if (config.permission.read[gsdPath] !== 'allow') {
    config.permission.read[gsdPath] = 'allow';
    modified = true;
  }

  // Configure external_directory permission (the safety guard for paths outside project)
  if (!config.permission.external_directory || typeof config.permission.external_directory !== 'object') {
    config.permission.external_directory = {};
  }
  if (config.permission.external_directory[gsdPath] !== 'allow') {
    config.permission.external_directory[gsdPath] = 'allow';
    modified = true;
  }

  if (!modified) {
    return; // Already configured
  }

  // Write config back
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`  ${green}✓${reset} Configured read permission for GSD docs`);
}

/**
 * OpenCode: flat structure in command/ directory (commands/gsd/*.md -> command/gsd-*.md)
 */
function installFlatCommands(ctx) {
  const commandDir = path.join(ctx.targetDir, 'command');
  fs.mkdirSync(commandDir, { recursive: true });

  const gsdSrc = path.join(ctx.src, 'commands', 'gsd');
  copyFlattenedCommands(gsdSrc, commandDir, 'gsd', ctx.pathPrefix, ctx.runtime);
  if (verifyInstalled(commandDir, 'command/gsd-*')) {
    const count = fs.readdirSync(commandDir).filter(f => f.startsWith('gsd-')).length;
    console.log(`  ${green}✓${reset} Installed ${count} commands to command/`);
  } else {
    ctx.failures.push('command/gsd-*');
  }
}

function install(ctx) {
  installFlatCommands(ctx);
  installPayload(ctx, PROFILE);
  // OpenCode keeps settings.json but registers no hooks (permissions are set in finishInstall)
  return loadRuntimeSettings(ctx);
}

/**
 * Remove GSD read/external_directory permissions from opencode.json or opencode.jsonc
 */
function removeOpencodePermissions(ctx) {
  const opencodeConfigDir = ctx.isGlobal
    ? getOpencodeGlobalDir()
    : path.join(process.cwd(), '.opencode');
  const configPath = resolveOpencodeConfigPath(opencodeConfigDir);
  if (!fs.existsSync(configPath)) return;
  try {
    const config = parseJsonc(fs.readFileSync(configPath, 'utf8'));
    let modified = false;

    // Remove GSD permission entries
    if (config.permission) {
      for (const permType of ['read', 'external_directory']) {
        if (config.permission[permType]) {
          const keys = Object.keys(config.permission[permType]);
          for (const key of keys) {
            if (key.includes('get-shit-done')) {
              delete config.permission[permType][key];
              modified = true;
            }
          }
          // Clean up empty objects
          if (Object.keys(config.permission[permType]).length === 0) {
            delete config.permission[permType];
          }
        }
      }
      if (Object.keys(config.permission).length === 0) {
        delete config.permission;
      }
    }

    if (modified) {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      ctx.removedCount++;
      console.log(`  ${green}✓${reset} Removed GSD permissions from ${path.basename(configPath)}`);
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
}

function uninstall(ctx) {
  // OpenCode: remove command/gsd-*.md files
  const commandDir = path.join(ctx.targetDir, 'command');
  if (fs.existsSync(commandDir)) {
    const files = fs.readdirSync(commandDir);
    for (const file of files) {
      if (file.startsWith('gsd-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(commandDir, file));
        ctx.removedCount++;
      }
    }
    console.log(`  ${green}✓${reset} Removed GSD commands from command/`);
  }
  removeSharedArtifacts(ctx);
  removeOpencodePermissions(ctx);
}

module.exports = {
  install,
  uninstall,
  configureOpencodePermissions,
};
