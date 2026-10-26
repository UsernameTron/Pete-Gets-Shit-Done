const path = require('path');
const { green, reset } = require('./colors');
const { buildHookCommand } = require('./paths');
const { cleanupOrphanedHooks, readSettings, validateHookFields } = require('./settings');

// ─── settings.json hooks (Claude, Gemini, Antigravity, OpenCode) ───────────────

const CONTEXT_MONITOR_MARKER = 'gsd-context-monitor';

// GSD hooks registered in settings.json, in registration order.
// event 'post'/'pre' resolve to the runtime's post-/pre-tool event name.
const GSD_SETTINGS_HOOKS = [
  { event: 'SessionStart', file: 'gsd-check-update.js', marker: 'gsd-check-update', label: 'update check hook' },
  { event: 'post', file: 'gsd-context-monitor.js', marker: CONTEXT_MONITOR_MARKER, matcher: 'Bash|Edit|Write|MultiEdit|Agent|Task', timeout: 10, label: 'context window monitor hook' },
  { event: 'post', file: 'gsd-cost-tracker.js', marker: 'gsd-cost-tracker', timeout: 10, label: 'cost tracker hook' },
  { event: 'pre', file: 'gsd-prompt-guard.js', marker: 'gsd-prompt-guard', matcher: 'Write|Edit', timeout: 5, label: 'prompt injection guard hook' },
  { event: 'pre', file: 'gsd-config-protection.js', marker: 'gsd-config-protection', matcher: 'Write|Edit', timeout: 5, label: 'config protection hook' },
  { event: 'pre', file: 'gsd-spawn-tracker.js', marker: 'gsd-spawn-tracker', matcher: 'Task|Agent', timeout: 5, label: 'spawn tracker hook' },
];

/**
 * Command that runs a GSD hook: absolute for global installs, config-dir relative for local
 */
function hookCommand(ctx, hookFile) {
  return ctx.isGlobal
    ? buildHookCommand(ctx.targetDir, hookFile)
    : 'node ' + ctx.dirName + '/hooks/' + hookFile;
}

/**
 * Read settings.json, dropping orphaned and invalid hook entries
 */
function loadRuntimeSettings(ctx) {
  const settingsPath = path.join(ctx.targetDir, 'settings.json');
  const settings = validateHookFields(cleanupOrphanedHooks(readSettings(settingsPath)));
  const statuslineCommand = hookCommand(ctx, 'gsd-statusline.js');
  return { settingsPath, settings, statuslineCommand, runtime: ctx.runtime };
}

function hasHookWithMarker(entries, marker) {
  return entries.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes(marker))
  );
}

/**
 * Migrate existing context monitor hooks: add matcher and timeout if missing
 */
function migrateContextMonitorHooks(entries, matcher) {
  for (const entry of entries) {
    if (entry.hooks && entry.hooks.some(h => h.command && h.command.includes(CONTEXT_MONITOR_MARKER))) {
      let migrated = false;
      if (!entry.matcher) {
        entry.matcher = matcher;
        migrated = true;
      }
      for (const h of entry.hooks) {
        if (h.command && h.command.includes(CONTEXT_MONITOR_MARKER) && !h.timeout) {
          h.timeout = 10;
          migrated = true;
        }
      }
      if (migrated) {
        console.log(`  ${green}✓${reset} Updated context monitor hook (added matcher + timeout)`);
      }
    }
  }
}

/**
 * Register GSD hooks in settings (skipping any already present)
 * @param {object} events - { pre, post } tool event names for the runtime
 */
function registerSettingsHooks(ctx, settings, events) {
  if (!settings.hooks) {
    settings.hooks = {};
  }
  for (const hook of GSD_SETTINGS_HOOKS) {
    const eventName = events[hook.event] || hook.event;
    if (!settings.hooks[eventName]) {
      settings.hooks[eventName] = [];
    }
    const entries = settings.hooks[eventName];
    if (hasHookWithMarker(entries, hook.marker)) {
      if (hook.marker === CONTEXT_MONITOR_MARKER) migrateContextMonitorHooks(entries, hook.matcher);
      continue;
    }
    const command = { type: 'command', command: hookCommand(ctx, hook.file) };
    if (hook.timeout) command.timeout = hook.timeout;
    entries.push(hook.matcher ? { matcher: hook.matcher, hooks: [command] } : { hooks: [command] });
    console.log(`  ${green}✓${reset} Configured ${hook.label}`);
  }
}

module.exports = {
  loadRuntimeSettings,
  registerSettingsHooks,
};
