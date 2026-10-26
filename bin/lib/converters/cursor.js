const { extractFrontmatterAndBody, extractFrontmatterField, toSingleLine, yamlIdentifier, yamlQuote } = require('./shared');

// Tool name mapping from Claude Code to Cursor CLI
const claudeToCursorTools = {
  Bash: 'Shell',
  Edit: 'StrReplace',
  AskUserQuestion: null, // No direct equivalent — use conversational prompting
  SlashCommand: null,    // No equivalent — skills are auto-discovered
};

/**
 * Convert a Claude Code tool name to Cursor CLI format
 * @returns {string|null} Cursor tool name, or null if tool should be excluded
 */
function convertCursorToolName(claudeTool) {
  if (claudeTool in claudeToCursorTools) {
    return claudeToCursorTools[claudeTool];
  }
  // MCP tools keep their format (Cursor supports MCP)
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Most tools share the same name (Read, Write, Glob, Grep, Task, WebSearch, WebFetch, TodoWrite)
  return claudeTool;
}

function convertSlashCommandsToCursorSkillMentions(content) {
  // Keep leading "/" for slash commands; only normalize gsd: -> gsd-.
  // This preserves rendered "next step" commands like "/gsd-execute-phase 17".
  return content.replace(/gsd:/gi, 'gsd-');
}

function convertClaudeToCursorMarkdown(content) {
  let converted = convertSlashCommandsToCursorSkillMentions(content);
  // Replace tool name references in body text
  converted = converted.replace(/\bBash\(/g, 'Shell(');
  converted = converted.replace(/\bEdit\(/g, 'StrReplace(');
  converted = converted.replace(/\bAskUserQuestion\b/g, 'conversational prompting');
  // Replace subagent_type from Claude to Cursor format
  converted = converted.replace(/subagent_type="general-purpose"/g, 'subagent_type="generalPurpose"');
  converted = converted.replace(/\$ARGUMENTS\b/g, '{{GSD_ARGS}}');
  // Replace project-level Claude conventions with Cursor equivalents
  converted = converted.replace(/`\.\/CLAUDE\.md`/g, '`.cursor/rules/`');
  converted = converted.replace(/\.\/CLAUDE\.md/g, '.cursor/rules/');
  converted = converted.replace(/`CLAUDE\.md`/g, '`.cursor/rules/`');
  converted = converted.replace(/\bCLAUDE\.md\b/g, '.cursor/rules/');
  converted = converted.replace(/\.claude\/skills\//g, '.cursor/skills/');
  // Remove Claude Code-specific bug workarounds before brand replacement
  converted = converted.replace(/\*\*Known Claude Code bug \(classifyHandoffIfNeeded\):\*\*[^\n]*\n/g, '');
  converted = converted.replace(/- \*\*classifyHandoffIfNeeded false failure:\*\*[^\n]*\n/g, '');
  // Replace "Claude Code" brand references with "Cursor"
  converted = converted.replace(/\bClaude Code\b/g, 'Cursor');
  return converted;
}

function getCursorSkillAdapterHeader(skillName) {
  return `<cursor_skill_adapter>
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
Use these Cursor tools when executing GSD workflows:
- \`Shell\` for running commands (terminal operations)
- \`StrReplace\` for editing existing files
- \`Read\`, \`Write\`, \`Glob\`, \`Grep\`, \`Task\`, \`WebSearch\`, \`WebFetch\`, \`TodoWrite\` as needed

## D. Subagent Spawning
When the workflow needs to spawn a subagent:
- Use \`Task(subagent_type="generalPurpose", ...)\`
- The \`model\` parameter maps to Cursor's model options (e.g., "fast")
</cursor_skill_adapter>`;
}

function convertClaudeCommandToCursorSkill(content, skillName) {
  const converted = convertClaudeToCursorMarkdown(content);
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
  const adapter = getCursorSkillAdapterHeader(skillName);

  return `---\nname: ${yamlIdentifier(skillName)}\ndescription: ${yamlQuote(shortDescription)}\n---\n\n${adapter}\n\n${body.trimStart()}`;
}

/**
 * Convert Claude Code agent markdown to Cursor agent format.
 * Strips frontmatter fields Cursor doesn't support (color, skills),
 * converts tool references, and adds a role context header.
 */
function convertClaudeAgentToCursorAgent(content) {
  let converted = convertClaudeToCursorMarkdown(content);

  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) return converted;

  const name = extractFrontmatterField(frontmatter, 'name') || 'unknown';
  const description = extractFrontmatterField(frontmatter, 'description') || '';

  const cleanFrontmatter = `---\nname: ${yamlIdentifier(name)}\ndescription: ${yamlQuote(toSingleLine(description))}\n---`;

  return `${cleanFrontmatter}\n${body}`;
}

module.exports = {
  convertClaudeToCursorMarkdown,
  convertClaudeCommandToCursorSkill,
  convertClaudeAgentToCursorAgent,
};
