const fs = require('fs');
const path = require('path');
const pkg = require('../../package.json');
const cliOptions = require('./cli-options');
const { dim, green, reset, yellow } = require('./colors');
const { getCommitAttribution, processAttribution } = require('./attribution');
const { copyWithPathReplacement, listCodexSkillNames } = require('./copy');
const { installGovernance, installGovernancePlugins, scaffoldProject, validateGsdPrefixAgents } = require('./governance');
const { MANIFEST_NAME, reportLocalPatches, writeManifest } = require('./manifest');
const { getConfigDirFromHome } = require('./paths');

/**
 * Clean up orphaned files from previous GSD versions
 */
function cleanupOrphanedFiles(configDir) {
  const orphanedFiles = [
    'hooks/gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
  ];

  for (const relPath of orphanedFiles) {
    const fullPath = path.join(configDir, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`  ${green}✓${reset} Removed orphaned ${relPath}`);
    }
  }
}

/**
 * Verify a directory exists and contains files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory not created`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory is empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Verify a file exists
 */
function verifyFileInstalled(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: file not created`);
    return false;
  }
  return true;
}

// ─── Shared install steps ──────────────────────────────────────────────────────
// Each runtime's install(ctx) composes these. ctx is built by install-core:
// { isGlobal, runtime, dirName, src, targetDir, locationLabel, pathPrefix, runtimeLabel, failures }

/**
 * Claude Code & Gemini: nested structure in commands/ directory
 */
function installNestedCommands(ctx) {
  const commandsDir = path.join(ctx.targetDir, 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  const gsdSrc = path.join(ctx.src, 'commands', 'gsd');
  const gsdDest = path.join(commandsDir, 'gsd');
  copyWithPathReplacement(gsdSrc, gsdDest, ctx.pathPrefix, ctx.runtime, true, ctx.isGlobal);
  if (verifyInstalled(gsdDest, 'commands/gsd')) {
    console.log(`  ${green}✓${reset} Installed commands/gsd`);
  } else {
    ctx.failures.push('commands/gsd');
  }
}

/**
 * Codex/Cursor/Windsurf: skills/gsd-*\/SKILL.md copied with path-prefix rewriting
 */
function installPrefixedSkills(ctx, copySkills) {
  const skillsDir = path.join(ctx.targetDir, 'skills');
  const gsdSrc = path.join(ctx.src, 'commands', 'gsd');
  copySkills(gsdSrc, skillsDir, 'gsd', ctx.pathPrefix, ctx.runtime);
  const installedSkillNames = listCodexSkillNames(skillsDir); // reuse — same dir structure
  if (installedSkillNames.length > 0) {
    console.log(`  ${green}✓${reset} Installed ${installedSkillNames.length} skills to skills/`);
  } else {
    ctx.failures.push('skills/gsd-*');
  }
}

/**
 * Copilot/Antigravity: skills/gsd-*\/ converted per install scope (global vs local)
 */
function installScopedSkills(ctx, copySkills) {
  const skillsDir = path.join(ctx.targetDir, 'skills');
  const gsdSrc = path.join(ctx.src, 'commands', 'gsd');
  copySkills(gsdSrc, skillsDir, 'gsd', ctx.isGlobal);
  if (fs.existsSync(skillsDir)) {
    const count = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('gsd-')).length;
    if (count > 0) {
      console.log(`  ${green}✓${reset} Installed ${count} skills to skills/`);
    } else {
      ctx.failures.push('skills/gsd-*');
    }
  } else {
    ctx.failures.push('skills/gsd-*');
  }
}

/**
 * Copy get-shit-done skill with path replacement
 */
function installCoreSkill(ctx) {
  const skillSrc = path.join(ctx.src, 'get-shit-done');
  const skillDest = path.join(ctx.targetDir, 'get-shit-done');
  copyWithPathReplacement(skillSrc, skillDest, ctx.pathPrefix, ctx.runtime, false, ctx.isGlobal);
  if (verifyInstalled(skillDest, 'get-shit-done')) {
    console.log(`  ${green}✓${reset} Installed get-shit-done`);
  } else {
    ctx.failures.push('get-shit-done');
  }
}

/**
 * Render one agent file for the runtime: path prefix, attribution, frontmatter conversion
 */
function renderAgent(ctx, profile, content) {
  // Replace ~/.claude/ and $HOME/.claude/ as they are the source of truth in the repo
  if (!profile.keepClaudePaths) {
    content = content.replace(/~\/\.claude\//g, ctx.pathPrefix);
    content = content.replace(/\$HOME\/\.claude\//g, ctx.pathPrefix);
  }
  content = processAttribution(content, getCommitAttribution(ctx.runtime));
  // Convert frontmatter for runtime compatibility (agents need different handling)
  return profile.convertAgent ? profile.convertAgent(content, ctx.isGlobal) : content;
}

/**
 * Copy agents to agents directory, replacing old gsd-*.md agents
 */
function installAgents(ctx, profile) {
  const agentsSrc = path.join(ctx.src, 'agents');
  if (!fs.existsSync(agentsSrc)) return;
  const agentsDest = path.join(ctx.targetDir, 'agents');
  fs.mkdirSync(agentsDest, { recursive: true });

  // Remove old GSD agents (gsd-*.md) before copying new ones
  for (const file of fs.readdirSync(agentsDest)) {
    if (file.startsWith('gsd-') && file.endsWith('.md')) {
      fs.unlinkSync(path.join(agentsDest, file));
    }
  }

  // Copy new agents
  const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
  for (const entry of agentEntries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = renderAgent(ctx, profile, fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8'));
      const destName = profile.agentFileName ? profile.agentFileName(entry.name) : entry.name;
      fs.writeFileSync(path.join(agentsDest, destName), content);
    }
  }
  if (verifyInstalled(agentsDest, 'agents')) {
    console.log(`  ${green}✓${reset} Installed agents`);
  } else {
    ctx.failures.push('agents');
  }

  // Validate gsd- prefix collisions (type-name governance)
  validateGsdPrefixAgents(agentsDest, agentsSrc);
}

/**
 * Copy CHANGELOG.md and lib/injection-patterns.json; write VERSION
 */
function installMetadataFiles(ctx) {
  // Copy CHANGELOG.md
  const changelogSrc = path.join(ctx.src, 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    const changelogDest = path.join(ctx.targetDir, 'get-shit-done', 'CHANGELOG.md');
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      console.log(`  ${green}✓${reset} Installed CHANGELOG.md`);
    } else {
      ctx.failures.push('CHANGELOG.md');
    }
  }

  // Copy lib/injection-patterns.json (required by security.cjs at runtime)
  const injectionSrc = path.join(ctx.src, 'lib', 'injection-patterns.json');
  if (fs.existsSync(injectionSrc)) {
    const libDest = path.join(ctx.targetDir, 'lib');
    fs.mkdirSync(libDest, { recursive: true });
    const injectionDest = path.join(libDest, 'injection-patterns.json');
    fs.copyFileSync(injectionSrc, injectionDest);
    if (verifyFileInstalled(injectionDest, 'lib/injection-patterns.json')) {
      console.log(`  ${green}✓${reset} Installed lib/injection-patterns.json`);
    } else {
      ctx.failures.push('lib/injection-patterns.json');
    }
  }

  // Write VERSION file
  const versionDest = path.join(ctx.targetDir, 'get-shit-done', 'VERSION');
  fs.writeFileSync(versionDest, pkg.version);
  if (verifyFileInstalled(versionDest, 'VERSION')) {
    console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);
  } else {
    ctx.failures.push('VERSION');
  }
}

/**
 * Copy one hook file; .js hooks get the runtime config dir and GSD version templated in
 */
function installHookFile(srcFile, destFile, configDirReplacement) {
  if (!destFile.endsWith('.js')) {
    fs.copyFileSync(srcFile, destFile);
    return;
  }
  let content = fs.readFileSync(srcFile, 'utf8');
  content = content.replace(/'\.claude'/g, configDirReplacement);
  content = content.replace(/\{\{GSD_VERSION\}\}/g, pkg.version);
  fs.writeFileSync(destFile, content);
  // Ensure hook files are executable (fixes #1162 — missing +x permission)
  try { fs.chmodSync(destFile, 0o755); } catch (e) { /* Windows doesn't support chmod */ }
}

/**
 * Write the CommonJS package.json marker and copy bundled hooks (settings.json runtimes)
 */
function installHooks(ctx) {
  // Write package.json to force CommonJS mode for GSD scripts
  // Prevents "require is not defined" errors when project has "type": "module"
  // Node.js walks up looking for package.json - this stops inheritance from project
  const pkgJsonDest = path.join(ctx.targetDir, 'package.json');
  fs.writeFileSync(pkgJsonDest, '{"type":"commonjs"}\n');
  console.log(`  ${green}✓${reset} Wrote package.json (CommonJS mode)`);

  // Copy hooks from dist/ (bundled with dependencies)
  // Template paths for the target runtime (replaces '.claude' with correct config dir)
  const hooksSrc = path.join(ctx.src, 'hooks', 'dist');
  if (!fs.existsSync(hooksSrc)) return;
  const hooksDest = path.join(ctx.targetDir, 'hooks');
  fs.mkdirSync(hooksDest, { recursive: true });
  const configDirReplacement = getConfigDirFromHome(ctx.runtime, ctx.isGlobal);
  for (const entry of fs.readdirSync(hooksSrc)) {
    const srcFile = path.join(hooksSrc, entry);
    if (fs.statSync(srcFile).isFile()) {
      installHookFile(srcFile, path.join(hooksDest, entry), configDirReplacement);
    }
  }
  if (verifyInstalled(hooksDest, 'hooks')) {
    console.log(`  ${green}✓${reset} Installed hooks (bundled)`);
  } else {
    ctx.failures.push('hooks');
  }
}

/**
 * Install governance layer (Claude runtime only, default on, --no-governance to skip)
 */
function installGovernanceLayer(ctx) {
  if (ctx.runtime !== 'claude') return;
  if (!cliOptions.hasNoGovernance) {
    const govMissing = installGovernance(ctx.targetDir, ctx.src, ctx.isGlobal);
    // Fail loud, not open: a partial governance install must not report overall
    // success — surface each missing piece in the installer's failures summary.
    for (const m of (govMissing || [])) {
      ctx.failures.push('governance: ' + m);
    }
    if (cliOptions.hasPlugins) {
      installGovernancePlugins(ctx.targetDir, ctx.src);
    }
    return;
  }
  // Feature flag security perimeter: document exactly what's exposed
  console.log(`\n  ${yellow}⚠  --no-governance: Governance layer SKIPPED${reset}`);
  console.log(`  ${yellow}   The following protections are NOT installed:${reset}`);
  console.log(`  ${yellow}   - CLAUDE.md governance template (session rules, workflow gates)${reset}`);
  console.log(`  ${yellow}   - Context reference docs (role.md, org.md, priorities.md, metrics.md)${reset}`);
  console.log(`  ${yellow}   - Hook-based guardrails (workflow guard, prompt guard, context monitor)${reset}`);
  console.log(`  ${yellow}   - Permission rule enforcement (settings-permissions.json)${reset}`);
  console.log(`  ${yellow}   - Plugin governance integration${reset}`);
  console.log(`  ${yellow}   Run without --no-governance to install full protection.${reset}`);
}

/**
 * Collect markdown/toml files under `dir` that still reference ~/.claude or $HOME/.claude
 */
function scanForLeakedPaths(dir, targetDir, leakedPaths) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      return; // skip inaccessible directories
    }
    throw err;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForLeakedPaths(fullPath, targetDir, leakedPaths);
    } else if ((entry.name.endsWith('.md') || entry.name.endsWith('.toml')) && entry.name !== 'CHANGELOG.md') {
      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (err) {
        if (err.code === 'EPERM' || err.code === 'EACCES') {
          continue; // skip inaccessible files
        }
        throw err;
      }
      const matches = content.match(/(?:~|\$HOME)\/\.claude\b/g);
      if (matches) {
        leakedPaths.push({ file: fullPath.replace(targetDir + '/', ''), count: matches.length });
      }
    }
  }
}

/**
 * Verify no leaked .claude paths in non-Claude runtimes
 */
function warnLeakedClaudePaths(ctx) {
  if (ctx.runtime === 'claude') return;
  const leakedPaths = [];
  scanForLeakedPaths(ctx.targetDir, ctx.targetDir, leakedPaths);
  if (leakedPaths.length === 0) return;
  const totalLeaks = leakedPaths.reduce((sum, l) => sum + l.count, 0);
  console.warn(`\n  ${yellow}⚠${reset}  Found ${totalLeaks} unreplaced .claude path reference(s) in ${leakedPaths.length} file(s):`);
  for (const leak of leakedPaths.slice(0, 5)) {
    console.warn(`     ${dim}${leak.file}${reset} (${leak.count})`);
  }
  if (leakedPaths.length > 5) {
    console.warn(`     ${dim}... and ${leakedPaths.length - 5} more file(s)${reset}`);
  }
  console.warn(`  ${dim}These paths may not resolve correctly for ${ctx.runtimeLabel}.${reset}`);
}

/**
 * Everything after the runtime's commands/skills: core skill, agents, metadata,
 * hooks, manifest, governance, scaffold, leak check. Exits on any copy failure.
 * @param {object} profile - { convertAgent, keepClaudePaths, agentFileName, installsHooks }
 */
function installPayload(ctx, profile) {
  installCoreSkill(ctx);
  installAgents(ctx, profile);
  installMetadataFiles(ctx);
  if (profile.installsHooks) {
    installHooks(ctx);
  }

  // Clear stale update cache so next session re-evaluates hook versions
  // targetDir is e.g. ~/.claude/get-shit-done/, parent is the config dir
  const updateCacheFile = path.join(path.dirname(ctx.targetDir), 'cache', 'gsd-update-check.json');
  try { fs.unlinkSync(updateCacheFile); } catch (e) { /* cache may not exist yet */ }

  if (ctx.failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${ctx.failures.join(', ')}`);
    process.exit(1);
  }

  // Write file manifest for future modification detection
  writeManifest(ctx.targetDir, ctx.runtime);
  console.log(`  ${green}✓${reset} Wrote file manifest (${MANIFEST_NAME})`);

  // Report any backed-up local patches
  reportLocalPatches(ctx.targetDir, ctx.runtime);

  installGovernanceLayer(ctx);

  // Scaffold project structure if requested
  if (cliOptions.hasScaffold) {
    scaffoldProject(process.cwd());
  }

  warnLeakedClaudePaths(ctx);
}

/**
 * Result for runtimes with no settings.json (nothing for finishInstall to write)
 */
function noSettingsResult(ctx) {
  return { settingsPath: null, settings: null, statuslineCommand: null, runtime: ctx.runtime };
}

module.exports = {
  cleanupOrphanedFiles,
  verifyInstalled,
  installNestedCommands,
  installPrefixedSkills,
  installScopedSkills,
  installPayload,
  noSettingsResult,
};
