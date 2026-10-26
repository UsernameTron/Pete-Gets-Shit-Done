const { convertClaudeAgentToWindsurfAgent } = require('../converters/windsurf');
const { copyCommandsAsWindsurfSkills } = require('../copy');
const { installPayload, installPrefixedSkills, noSettingsResult } = require('../install-steps');
const { removeSharedArtifacts, removeSkillDirs } = require('../uninstall-steps');

const PROFILE = { convertAgent: content => convertClaudeAgentToWindsurfAgent(content) };

function install(ctx) {
  installPrefixedSkills(ctx, copyCommandsAsWindsurfSkills);
  installPayload(ctx, PROFILE);
  // Windsurf uses skills — no config.toml, no settings.json hooks needed
  return noSettingsResult(ctx);
}

function uninstall(ctx) {
  removeSkillDirs(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
