const { uninstallGovernance } = require('../governance');
const { installNestedCommands, installPayload } = require('../install-steps');
const { loadRuntimeSettings, registerSettingsHooks } = require('../settings-hooks');
const { removeNestedCommands, removeSharedArtifacts } = require('../uninstall-steps');

// Claude Code is also the fallback for unrecognised runtime names, so the
// claude-only governance steps key off ctx.runtime rather than this module.
const PROFILE = { installsHooks: true };

function install(ctx) {
  installNestedCommands(ctx);
  installPayload(ctx, PROFILE);
  const result = loadRuntimeSettings(ctx);
  registerSettingsHooks(ctx, result.settings, { post: 'PostToolUse', pre: 'PreToolUse' });
  return result;
}

function uninstall(ctx) {
  removeNestedCommands(ctx);
  removeSharedArtifacts(ctx);
  // Remove governance layer if it was installed (Claude runtime only)
  if (ctx.runtime === 'claude') {
    uninstallGovernance(ctx.targetDir);
  }
}

module.exports = { install, uninstall };
