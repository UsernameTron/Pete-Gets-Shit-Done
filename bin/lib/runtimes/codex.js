const fs = require('fs');
const path = require('path');
const { green, reset, yellow } = require('../colors');
const { installCodexConfig, stripGsdFromCodexConfig } = require('../codex-config');
const { ensureCodexHooksFeature, hasEnabledCodexHooksFeature, setManagedCodexHooksOwnership } = require('../codex-hooks-feature');
const { convertClaudeAgentToCodexAgent } = require('../converters/codex');
const { copyCommandsAsCodexSkills } = require('../copy');
const { installPayload, installPrefixedSkills, noSettingsResult } = require('../install-steps');
const { detectLineEnding } = require('../toml-lexer');
const { removeGsdFiles, removeSharedArtifacts, removeSkillDirs } = require('../uninstall-steps');

const PROFILE = { convertAgent: content => convertClaudeAgentToCodexAgent(content) };

/**
 * Add Codex hooks (SessionStart for update checking) — requires codex_hooks feature flag
 */
function configureCodexHooks(targetDir) {
  const configPath = path.join(targetDir, 'config.toml');
  try {
    let configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '';
    const eol = detectLineEnding(configContent);
    const codexHooksFeature = ensureCodexHooksFeature(configContent);
    configContent = setManagedCodexHooksOwnership(codexHooksFeature.content, codexHooksFeature.ownership);

    // Add SessionStart hook for update checking
    const updateCheckScript = path.resolve(targetDir, 'get-shit-done', 'hooks', 'gsd-update-check.js').replace(/\\/g, '/');
    const hookBlock =
      `${eol}# GSD Hooks${eol}` +
      `[[hooks]]${eol}` +
      `event = "SessionStart"${eol}` +
      `command = "node ${updateCheckScript}"${eol}`;

    if (hasEnabledCodexHooksFeature(configContent) && !configContent.includes('gsd-update-check')) {
      configContent += hookBlock;
    }

    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log(`  ${green}✓${reset} Configured Codex hooks (SessionStart)`);
  } catch (e) {
    console.warn(`  ${yellow}⚠${reset}  Could not configure Codex hooks: ${e.message}`);
  }
}

function install(ctx) {
  installPrefixedSkills(ctx, copyCommandsAsCodexSkills);
  installPayload(ctx, PROFILE);

  // Generate Codex config.toml and per-agent .toml files
  const agentCount = installCodexConfig(ctx.targetDir, path.join(ctx.src, 'agents'));
  console.log(`  ${green}✓${reset} Generated config.toml with ${agentCount} agent roles`);
  console.log(`  ${green}✓${reset} Generated ${agentCount} agent .toml config files`);

  configureCodexHooks(ctx.targetDir);
  return noSettingsResult(ctx);
}

/**
 * Remove GSD agent .toml config files and the GSD sections of config.toml
 */
function removeCodexConfig(ctx) {
  const codexAgentsDir = path.join(ctx.targetDir, 'agents');
  if (fs.existsSync(codexAgentsDir)) {
    const tomlCount = removeGsdFiles(codexAgentsDir, '.toml');
    if (tomlCount > 0) {
      ctx.removedCount++;
      console.log(`  ${green}✓${reset} Removed ${tomlCount} agent .toml configs`);
    }
  }

  // Codex: clean GSD sections from config.toml
  const configPath = path.join(ctx.targetDir, 'config.toml');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const cleaned = stripGsdFromCodexConfig(content);
    if (cleaned === null) {
      // File is empty after stripping — delete it
      fs.unlinkSync(configPath);
      ctx.removedCount++;
      console.log(`  ${green}✓${reset} Removed config.toml (was GSD-only)`);
    } else if (cleaned !== content) {
      fs.writeFileSync(configPath, cleaned);
      ctx.removedCount++;
      console.log(`  ${green}✓${reset} Cleaned GSD sections from config.toml`);
    }
  }
}

function uninstall(ctx) {
  removeSkillDirs(ctx);
  removeCodexConfig(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
