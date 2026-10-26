const fs = require('fs');
const path = require('path');
const { green, reset } = require('./colors');
const { readSettings, writeSettings } = require('./settings');

// ─── Shared uninstall steps ────────────────────────────────────────────────────
// Each runtime's uninstall(ctx) composes these. ctx is built by install-core:
// { isGlobal, runtime, dirName, targetDir, locationLabel, runtimeLabel, removedCount }

/**
 * Claude Code & Gemini: remove commands/gsd/
 */
function removeNestedCommands(ctx) {
  const gsdCommandsDir = path.join(ctx.targetDir, 'commands', 'gsd');
  if (fs.existsSync(gsdCommandsDir)) {
    fs.rmSync(gsdCommandsDir, { recursive: true });
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed commands/gsd/`);
  }
}

/**
 * Skill runtimes: remove skills/gsd-*\/ skill directories
 */
function removeSkillDirs(ctx) {
  const skillsDir = path.join(ctx.targetDir, 'skills');
  if (!fs.existsSync(skillsDir)) return;
  let skillCount = 0;
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('gsd-')) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
      skillCount++;
    }
  }
  if (skillCount > 0) {
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed ${skillCount} ${ctx.runtimeLabel} skills`);
  }
}

/**
 * Remove gsd-* files with `ext` directly inside `dir`; returns how many were removed
 */
function removeGsdFiles(dir, ext) {
  let count = 0;
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith('gsd-') && file.endsWith(ext)) {
      fs.unlinkSync(path.join(dir, file));
      count++;
    }
  }
  return count;
}

/**
 * Remove get-shit-done/ directory
 */
function removeCoreSkill(ctx) {
  const gsdDir = path.join(ctx.targetDir, 'get-shit-done');
  if (fs.existsSync(gsdDir)) {
    fs.rmSync(gsdDir, { recursive: true });
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed get-shit-done/`);
  }
}

/**
 * Remove GSD agents (gsd-*.md files only)
 */
function removeAgents(ctx) {
  const agentsDir = path.join(ctx.targetDir, 'agents');
  if (!fs.existsSync(agentsDir)) return;
  const agentCount = removeGsdFiles(agentsDir, '.md');
  if (agentCount > 0) {
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed ${agentCount} GSD agents`);
  }
}

/**
 * Remove GSD hooks
 */
function removeHooks(ctx) {
  const hooksDir = path.join(ctx.targetDir, 'hooks');
  if (!fs.existsSync(hooksDir)) return;
  const gsdHooks = ['gsd-statusline.js', 'gsd-check-update.js', 'gsd-check-update.sh', 'gsd-context-monitor.js', 'gsd-cost-tracker.js', 'gsd-spawn-tracker.js', 'gsd-config-protection.js', 'gsd-prompt-guard.js'];
  let hookCount = 0;
  for (const hook of gsdHooks) {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      hookCount++;
    }
  }
  if (hookCount > 0) {
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed ${hookCount} GSD hooks`);
  }
}

/**
 * Remove GSD package.json (CommonJS mode marker)
 */
function removeCommonJsMarker(ctx) {
  const pkgJsonPath = path.join(ctx.targetDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return;
  try {
    const content = fs.readFileSync(pkgJsonPath, 'utf8').trim();
    // Only remove if it's our minimal CommonJS marker
    if (content === '{"type":"commonjs"}') {
      fs.unlinkSync(pkgJsonPath);
      ctx.removedCount++;
      console.log(`  ${green}✓${reset} Removed GSD package.json`);
    }
  } catch (e) {
    // Ignore read errors
  }
}

// GSD hook registrations to remove from settings.json, by event.
// Gemini/Antigravity use AfterTool/BeforeTool instead of PostToolUse/PreToolUse.
const GSD_HOOK_REMOVALS = [
  { events: ['SessionStart'], markers: ['gsd-check-update', 'gsd-statusline'], message: 'Removed GSD hooks from settings' },
  { events: ['PostToolUse', 'AfterTool'], markers: ['gsd-context-monitor'], message: 'Removed context monitor hook from settings' },
  { events: ['PreToolUse', 'BeforeTool'], markers: ['gsd-prompt-guard'], message: 'Removed prompt injection guard hook from settings' },
  { events: ['PostToolUse', 'AfterTool'], markers: ['gsd-cost-tracker'], message: 'Removed cost tracker hook from settings' },
  { events: ['PreToolUse', 'BeforeTool'], markers: ['gsd-config-protection'], message: 'Removed config protection hook from settings' },
  { events: ['PreToolUse', 'BeforeTool'], markers: ['gsd-spawn-tracker'], message: 'Removed spawn tracker hook from settings' },
];

/**
 * Drop entries for `eventName` whose hooks match a marker; returns true if any were dropped
 */
function removeHookEntries(settings, eventName, markers, message) {
  const before = settings.hooks[eventName].length;
  settings.hooks[eventName] = settings.hooks[eventName].filter(entry => {
    if (entry.hooks && Array.isArray(entry.hooks)) {
      const hasGsdHook = entry.hooks.some(h =>
        h.command && markers.some(marker => h.command.includes(marker))
      );
      return !hasGsdHook;
    }
    return true;
  });
  const removed = settings.hooks[eventName].length < before;
  if (removed) {
    console.log(`  ${green}✓${reset} ${message}`);
  }
  // Clean up empty array
  if (settings.hooks[eventName].length === 0) {
    delete settings.hooks[eventName];
  }
  return removed;
}

/**
 * Clean up settings.json (remove GSD hooks and statusline)
 */
function cleanSettings(ctx) {
  const settingsPath = path.join(ctx.targetDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) return;
  let settings = readSettings(settingsPath);
  let settingsModified = false;

  // Remove GSD statusline if it references our hook
  if (settings.statusLine && settings.statusLine.command &&
      settings.statusLine.command.includes('gsd-statusline')) {
    delete settings.statusLine;
    settingsModified = true;
    console.log(`  ${green}✓${reset} Removed GSD statusline from settings`);
  }

  for (const { events, markers, message } of GSD_HOOK_REMOVALS) {
    for (const eventName of events) {
      if (settings.hooks && settings.hooks[eventName] && removeHookEntries(settings, eventName, markers, message)) {
        settingsModified = true;
      }
    }
  }

  // Clean up empty hooks object
  if (settings.hooks && Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  if (settingsModified) {
    writeSettings(settingsPath, settings);
    ctx.removedCount++;
  }
}

/**
 * Everything after the runtime's commands/skills: get-shit-done/, agents, hooks,
 * the CommonJS marker, and settings.json registrations.
 */
function removeSharedArtifacts(ctx) {
  removeCoreSkill(ctx);
  removeAgents(ctx);
  removeHooks(ctx);
  removeCommonJsMarker(ctx);
  cleanSettings(ctx);
}

module.exports = {
  removeNestedCommands,
  removeSkillDirs,
  removeGsdFiles,
  removeSharedArtifacts,
};
