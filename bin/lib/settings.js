const fs = require('fs');
const path = require('path');
const { dim, green, reset, yellow } = require('./colors');

/**
 * Read and parse settings.json, returning empty object if it doesn't exist
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      // Corrupt (unparseable) settings must NOT be treated as empty — a later
      // writeSettings would silently clobber the user's real file and destroy
      // their permissions/env/hooks. Preserve it in a timestamped backup and
      // warn loudly before returning {} (mirrors configureOpencodePermissions'
      // refuse-to-clobber stance).
      try {
        const backupPath = settingsPath + '.corrupt.' + Date.now();
        fs.copyFileSync(settingsPath, backupPath);
        console.log(`  ${yellow}⚠${reset} Could not parse ${path.basename(settingsPath)} — backed up to ${path.basename(backupPath)}`);
        console.log(`    ${dim}Reason: ${e.message}${reset}`);
        console.log(`    ${dim}Your original settings were preserved in the backup; fix its JSON syntax to recover them.${reset}`);
      } catch { /* best-effort backup; still fail safe below */ }
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Clean up orphaned hook registrations from settings.json
 */
function cleanupOrphanedHooks(settings) {
  const orphanedHookPatterns = [
    'gsd-notify.sh',  // Removed in v1.6.x
    'hooks/statusline.js',  // Renamed to gsd-statusline.js in v1.9.0
    'gsd-intel-index.js',  // Removed in v1.9.2
    'gsd-intel-session.js',  // Removed in v1.9.2
    'gsd-intel-prune.js',  // Removed in v1.9.2
  ];

  let cleanedHooks = false;

  // Check all hook event types (Stop, SessionStart, etc.)
  if (settings.hooks) {
    for (const eventType of Object.keys(settings.hooks)) {
      const hookEntries = settings.hooks[eventType];
      if (Array.isArray(hookEntries)) {
        // Filter out entries that contain orphaned hooks
        const filtered = hookEntries.filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            // Check if any hook in this entry matches orphaned patterns
            const hasOrphaned = entry.hooks.some(h =>
              h.command && orphanedHookPatterns.some(pattern => h.command.includes(pattern))
            );
            if (hasOrphaned) {
              cleanedHooks = true;
              return false;  // Remove this entry
            }
          }
          return true;  // Keep this entry
        });
        settings.hooks[eventType] = filtered;
      }
    }
  }

  if (cleanedHooks) {
    console.log(`  ${green}✓${reset} Removed orphaned hook registrations`);
  }

  // Fix #330: Update statusLine if it points to old GSD statusline.js path
  // Only match the specific old GSD path pattern (hooks/statusline.js),
  // not third-party statusline scripts that happen to contain 'statusline.js'
  if (settings.statusLine && settings.statusLine.command &&
      /hooks[\/\\]statusline\.js/.test(settings.statusLine.command)) {
    settings.statusLine.command = settings.statusLine.command.replace(
      /hooks([\/\\])statusline\.js/,
      'hooks$1gsd-statusline.js'
    );
    console.log(`  ${green}✓${reset} Updated statusline path (hooks/statusline.js → hooks/gsd-statusline.js)`);
  }

  return settings;
}

/**
 * Validate hook field requirements to prevent silent settings.json rejection.
 *
 * Claude Code validates the entire settings file with a strict Zod schema.
 * If ANY hook has an invalid schema (e.g., type: "agent" missing "prompt"),
 * the ENTIRE settings.json is silently discarded — disabling all plugins,
 * env vars, and other configuration.
 *
 * This defensive check removes invalid hook entries and cleans up empty
 * event arrays to prevent this. It validates:
 *   - agent hooks require a "prompt" field
 *   - command hooks require a "command" field
 *   - entries must have a valid "hooks" array (non-array/missing is removed)
 *
 * @param {object} settings - The settings object (mutated in place)
 * @returns {object} The same settings object
 */
function validateHookFields(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') return settings;

  let fixedHooks = false;
  const emptyKeys = [];

  for (const [eventType, hookEntries] of Object.entries(settings.hooks)) {
    if (!Array.isArray(hookEntries)) continue;

    // Pass 1: validate each entry, building a new array without mutation
    const validated = [];
    for (const entry of hookEntries) {
      // Entries without a hooks sub-array are structurally invalid — remove them
      if (!entry.hooks || !Array.isArray(entry.hooks)) {
        fixedHooks = true;
        continue;
      }

      // Filter invalid hooks within the entry
      const validHooks = entry.hooks.filter(h => {
        if (h.type === 'agent' && !h.prompt) {
          fixedHooks = true;
          return false;
        }
        if (h.type === 'command' && !h.command) {
          fixedHooks = true;
          return false;
        }
        return true;
      });

      // Drop entries whose hooks are now empty
      if (validHooks.length === 0) {
        fixedHooks = true;
        continue;
      }

      // Build a clean copy instead of mutating the original entry
      validated.push({ ...entry, hooks: validHooks });
    }

    settings.hooks[eventType] = validated;

    // Collect empty event arrays for removal (avoid delete during iteration)
    if (validated.length === 0) {
      emptyKeys.push(eventType);
      fixedHooks = true;
    }
  }

  // Pass 2: remove empty event arrays
  for (const key of emptyKeys) {
    delete settings.hooks[key];
  }

  if (fixedHooks) {
    console.log(`  ${green}✓${reset} Fixed invalid hook entries (prevents settings.json schema rejection)`);
  }

  return settings;
}

/**
 * Parse JSONC (JSON with Comments) by stripping comments and trailing commas.
 * OpenCode supports JSONC format via jsonc-parser, so users may have comments.
 * This is a lightweight inline parser to avoid adding dependencies.
 */
function parseJsonc(content) {
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Remove single-line and block comments while preserving strings
  let result = '';
  let inString = false;
  let i = 0;
  while (i < content.length) {
    const char = content[i];
    const next = content[i + 1];

    if (inString) {
      result += char;
      // Handle escape sequences
      if (char === '\\' && i + 1 < content.length) {
        result += next;
        i += 2;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      i++;
    } else {
      if (char === '"') {
        inString = true;
        result += char;
        i++;
      } else if (char === '/' && next === '/') {
        // Skip single-line comment until end of line
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
      } else if (char === '/' && next === '*') {
        // Skip block comment
        i += 2;
        while (i < content.length - 1 && !(content[i] === '*' && content[i + 1] === '/')) {
          i++;
        }
        i += 2; // Skip closing */
      } else {
        result += char;
        i++;
      }
    }
  }

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(result);
}

/**
 * Check if a hook with the given command path is already registered for an event.
 * Uses exact command-path comparison to avoid fragile substring matching.
 * Part of the write-once registration contract: components register once at startup,
 * duplicates are no-ops with warnings.
 */
function isHookRegistered(settings, event, commandPath) {
  if (!settings.hooks || !settings.hooks[event]) return false;
  return settings.hooks[event].some(entry =>
    (entry.hooks || []).some(h => h.command && h.command === commandPath)
  );
}

module.exports = {
  readSettings,
  writeSettings,
  cleanupOrphanedHooks,
  validateHookFields,
  parseJsonc,
  isHookRegistered,
};
