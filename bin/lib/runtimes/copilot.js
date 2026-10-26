const fs = require('fs');
const path = require('path');
const { green, reset } = require('../colors');
const { convertClaudeAgentToCopilotAgent } = require('../converters/copilot');
const { mergeCopilotInstructions, stripGsdFromCopilotInstructions } = require('../copilot-instructions');
const { copyCommandsAsCopilotSkills } = require('../copy');
const { installPayload, installScopedSkills, noSettingsResult } = require('../install-steps');
const { removeSharedArtifacts, removeSkillDirs } = require('../uninstall-steps');

const PROFILE = {
  convertAgent: (content, isGlobal) => convertClaudeAgentToCopilotAgent(content, isGlobal),
  keepClaudePaths: true, // the agent converter rewrites paths per install scope
  agentFileName: name => name.replace('.md', '.agent.md'),
};

function install(ctx) {
  installScopedSkills(ctx, copyCommandsAsCopilotSkills);
  installPayload(ctx, PROFILE);

  // Generate copilot-instructions.md
  const templatePath = path.join(ctx.targetDir, 'get-shit-done', 'templates', 'copilot-instructions.md');
  const instructionsPath = path.join(ctx.targetDir, 'copilot-instructions.md');
  if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, 'utf8');
    mergeCopilotInstructions(instructionsPath, template);
    console.log(`  ${green}✓${reset} Generated copilot-instructions.md`);
  }
  // Copilot: no settings.json, no hooks, no statusline (like Codex)
  return noSettingsResult(ctx);
}

/**
 * Clean GSD section from copilot-instructions.md
 */
function removeCopilotInstructions(ctx) {
  const instructionsPath = path.join(ctx.targetDir, 'copilot-instructions.md');
  if (!fs.existsSync(instructionsPath)) return;
  const content = fs.readFileSync(instructionsPath, 'utf8');
  const cleaned = stripGsdFromCopilotInstructions(content);
  if (cleaned === null) {
    fs.unlinkSync(instructionsPath);
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Removed copilot-instructions.md (was GSD-only)`);
  } else if (cleaned !== content) {
    fs.writeFileSync(instructionsPath, cleaned);
    ctx.removedCount++;
    console.log(`  ${green}✓${reset} Cleaned GSD section from copilot-instructions.md`);
  }
}

function uninstall(ctx) {
  removeSkillDirs(ctx);
  removeCopilotInstructions(ctx);
  removeSharedArtifacts(ctx);
}

module.exports = { install, uninstall };
