const { extractFrontmatterAndBody, extractFrontmatterField, toSingleLine, yamlIdentifier, yamlQuote } = require('./shared');

// --- Windsurf converters ---
// Windsurf (by Codeium) uses a tool set similar to Cursor (both VS Code-based).
// Config lives in .windsurf/ (local) and ~/.windsurf/ (global).

// Tool name mapping from Claude Code to Windsurf Cascade
const claudeToWindsurfTools = {
  Bash: 'Shell',
  Edit: 'StrReplace',
  AskUserQuestion: null, // No direct equivalent — use conversational prompting
  SlashCommand: null,    // No equivalent — skills are auto-discovered
};

/**
 * Convert a Claude Code tool name to Windsurf Cascade format
 * @returns {string|null} Windsurf tool name, or null if tool should be excluded
 */
function convertWindsurfToolName(claudeTool) {
  if (claudeTool in claudeToWindsurfTools) {
    return claudeToWindsurfTools[claudeTool];
  }
  // MCP tools keep their format (Windsurf supports MCP)
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Most tools share the same name (Read, Write, Glob, Grep, Task, WebSearch, WebFetch, TodoWrite)
  return claudeTool;
}

function convertSlashCommandsToWindsurfSkillMentions(content) {
  // Keep leading "/" for slash commands; only normalize gsd: -> gsd-.
  return content.replace(/gsd:/gi, 'gsd-');
}

function convertClaudeToWindsurfMarkdown(content) {
  let converted = convertSlashCommandsToWindsurfSkillMentions(content);
  // Replace tool name references in body text
  converted = converted.replace(/\bBash\(/g, 'Shell(');
  converted = converted.replace(/\bEdit\(/g, 'StrReplace(');
  converted = converted.replace(/\bAskUserQuestion\b/g, 'conversational prompting');
  // Replace subagent_type from Claude to Windsurf format
  converted = converted.replace(/subagent_type="general-purpose"/g, 'subagent_type="generalPurpose"');
  converted = converted.replace(/\$ARGUMENTS\b/g, '{{GSD_ARGS}}');
  // Replace project-level Claude conventions with Windsurf equivalents
  converted = converted.replace(/`\.\/CLAUDE\.md`/g, '`.windsurf/rules/`');
  converted = converted.replace(/\.\/CLAUDE\.md/g, '.windsurf/rules/');
  converted = converted.replace(/`CLAUDE\.md`/g, '`.windsurf/rules/`');
  converted = converted.replace(/\bCLAUDE\.md\b/g, '.windsurf/rules/');
  converted = converted.replace(/\.claude\/skills\//g, '.windsurf/skills/');
  // Remove Claude Code-specific bug workarounds before brand replacement
  converted = converted.replace(/\*\*Known Claude Code bug \(classifyHandoffIfNeeded\):\*\*[^\n]*\n/g, '');
  converted = converted.replace(/- \*\*classifyHandoffIfNeeded false failure:\*\*[^\n]*\n/g, '');
  // Replace "Claude Code" brand references with "Windsurf"
  converted = converted.replace(/\bClaude Code\b/g, 'Windsurf');
  return converted;
}

function getWindsurfSkillAdapterHeader(skillName) {
  return `<windsurf_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions \`${skillName}\` or describes a task matching this skill.
- Treat all user text after the skill mention as \`{{GSD_ARGS}}\`.
- If no arguments are present, treat \`{{GSD_ARGS}}\` as empty.

## B. User Prompting
When the workflow needs user input, prompt the user conversationally:
- Present options as a numbered list in your response text
- Ask the user to reply with their choice
- For multi-select, ask for comma-separated numbers

## C. Tool Usage
Use these Windsurf tools when executing GSD workflows:
- \`Shell\` for running commands (terminal operations)
- \`StrReplace\` for editing existing files
- \`Read\`, \`Write\`, \`Glob\`, \`Grep\`, \`Task\`, \`WebSearch\`, \`WebFetch\`, \`TodoWrite\` as needed

## D. Subagent Spawning
When the workflow needs to spawn a subagent:
- Use \`Task(subagent_type="generalPurpose", ...)\`
- The \`model\` parameter maps to Windsurf's model options (e.g., "fast")
</windsurf_skill_adapter>`;
}

function convertClaudeCommandToWindsurfSkill(content, skillName) {
  const converted = convertClaudeToWindsurfMarkdown(content);
  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  let description = `Run GSD workflow ${skillName}.`;
  if (frontmatter) {
    const maybeDescription = extractFrontmatterField(frontmatter, 'description');
    if (maybeDescription) {
      description = maybeDescription;
    }
  }
  description = toSingleLine(description);
  const shortDescription = description.length > 180 ? `${description.slice(0, 177)}...` : description;
  const adapter = getWindsurfSkillAdapterHeader(skillName);

  return `---\nname: ${yamlIdentifier(skillName)}\ndescription: ${yamlQuote(shortDescription)}\n---\n\n${adapter}\n\n${body.trimStart()}`;
}

/**
 * Convert Claude Code agent markdown to Windsurf agent format.
 * Strips frontmatter fields Windsurf doesn't support (color, skills),
 * converts tool references, and adds a role context header.
 */
function convertClaudeAgentToWindsurfAgent(content) {
  let converted = convertClaudeToWindsurfMarkdown(content);

  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) return converted;

  const name = extractFrontmatterField(frontmatter, 'name') || 'unknown';
  const description = extractFrontmatterField(frontmatter, 'description') || '';

  const cleanFrontmatter = `---\nname: ${yamlIdentifier(name)}\ndescription: ${yamlQuote(toSingleLine(description))}\n---`;

  return `${cleanFrontmatter}\n${body}`;
}

module.exports = {
  convertClaudeToWindsurfMarkdown,
  convertClaudeCommandToWindsurfSkill,
  convertClaudeAgentToWindsurfAgent,
};
