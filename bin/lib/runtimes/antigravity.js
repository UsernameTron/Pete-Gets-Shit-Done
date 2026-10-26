const { convertClaudeAgentToAntigravityAgent } = require('../converters/antigravity');
const { copyCommandsAsAntigravitySkills } = require('../copy');
const { installPayload, installScopedSkills } = require('../install-steps');
const { loadRuntimeSettings, registerSettingsHooks } = require('../settings-hooks');
const { removeSharedArtifacts, removeSkillDirs } = require('../uninstall-steps');

const PROFILE = {
  convertAgent: (content, isGlobal) => convertClaudeAgentToAntigravityAgent(content, isGlobal),
  keepClaudePaths: true, // the agent converter rewrites paths per install scope
  installsHooks: true,
};

function install(ctx) {
  installScopedSkills(ctx, copyCommandsAsAntigravitySkills);
  installPayload(ctx, PROFILE);
  const result = loadRuntimeSettings(ctx);
  // Antigravity uses AfterTool/BeforeTool instead of PostToolUse/PreToolUse
  registerSettingsHooks(ctx, result.settings, { post: 'AfterTool', pre: 'BeforeTool' });
  return result;
}

function uninstall(ctx) {
  removeSkillDirs(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
