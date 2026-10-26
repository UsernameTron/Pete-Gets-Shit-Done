const { convertClaudeAgentToCursorAgent } = require('../converters/cursor');
const { copyCommandsAsCursorSkills } = require('../copy');
const { installPayload, installPrefixedSkills, noSettingsResult } = require('../install-steps');
const { removeSharedArtifacts, removeSkillDirs } = require('../uninstall-steps');

const PROFILE = { convertAgent: content => convertClaudeAgentToCursorAgent(content) };

function install(ctx) {
  installPrefixedSkills(ctx, copyCommandsAsCursorSkills);
  installPayload(ctx, PROFILE);
  // Cursor uses skills — no config.toml, no settings.json hooks needed
  return noSettingsResult(ctx);
}

function uninstall(ctx) {
  removeSkillDirs(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
