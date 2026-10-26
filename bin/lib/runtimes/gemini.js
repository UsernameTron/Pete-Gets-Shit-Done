const { green, reset } = require('../colors');
const { convertClaudeToGeminiAgent } = require('../converters/gemini');
const { installNestedCommands, installPayload } = require('../install-steps');
const { loadRuntimeSettings, registerSettingsHooks } = require('../settings-hooks');
const { removeNestedCommands, removeSharedArtifacts } = require('../uninstall-steps');

const PROFILE = {
  convertAgent: content => convertClaudeToGeminiAgent(content),
  installsHooks: true,
};

/**
 * Enable experimental agents for Gemini CLI (required for custom sub-agents)
 */
function enableExperimentalAgents(settings) {
  if (!settings.experimental) {
    settings.experimental = {};
  }
  if (!settings.experimental.enableAgents) {
    settings.experimental.enableAgents = true;
    console.log(`  ${green}✓${reset} Enabled experimental agents`);
  }
}

function install(ctx) {
  installNestedCommands(ctx);
  installPayload(ctx, PROFILE);
  const result = loadRuntimeSettings(ctx);
  enableExperimentalAgents(result.settings);
  // Gemini uses AfterTool/BeforeTool instead of PostToolUse/PreToolUse
  registerSettingsHooks(ctx, result.settings, { post: 'AfterTool', pre: 'BeforeTool' });
  return result;
}

function uninstall(ctx) {
  removeNestedCommands(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
