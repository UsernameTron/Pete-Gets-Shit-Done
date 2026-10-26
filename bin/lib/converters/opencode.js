const { neutralizeAgentReferences } = require('./shared');

// Color name to hex mapping for opencode compatibility
const colorNameToHex = {
  cyan: '#00FFFF',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  yellow: '#FFFF00',
  magenta: '#FF00FF',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
};

// Tool name mapping from Claude Code to OpenCode
// OpenCode uses lowercase tool names; special mappings for renamed tools
const claudeToOpencodeTools = {
  AskUserQuestion: 'question',
  SlashCommand: 'skill',
  TodoWrite: 'todowrite',
  WebFetch: 'webfetch',
  WebSearch: 'websearch',  // Plugin/MCP - keep for compatibility
};

/**
 * Convert a Claude Code tool name to OpenCode format
 * - Applies special mappings (AskUserQuestion -> question, etc.)
 * - Converts to lowercase (except MCP tools which keep their format)
 */
function convertToolName(claudeTool) {
  // Check for special mapping first
  if (claudeToOpencodeTools[claudeTool]) {
    return claudeToOpencodeTools[claudeTool];
  }
  // MCP tools (mcp__*) keep their format
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Default: convert to lowercase
  return claudeTool.toLowerCase();
}

// Agent frontmatter fields OpenCode does not support (stripped with their continuation lines)
const OPENCODE_STRIPPED_AGENT_FIELDS = /^(skills|color|memory|maxTurns|permissionMode|disallowedTools):/;

/**
 * Rewrite Claude-specific references in the whole file (body and frontmatter)
 */
function replaceOpencodeReferences(content) {
  // Replace tool name references in content (applies to all files)
  let convertedContent = content;
  convertedContent = convertedContent.replace(/\bAskUserQuestion\b/g, 'question');
  convertedContent = convertedContent.replace(/\bSlashCommand\b/g, 'skill');
  convertedContent = convertedContent.replace(/\bTodoWrite\b/g, 'todowrite');
  // Replace /gsd:command with /gsd-command for opencode (flat command structure)
  convertedContent = convertedContent.replace(/\/gsd:/g, '/gsd-');
  // Replace ~/.claude and $HOME/.claude with OpenCode's config location
  convertedContent = convertedContent.replace(/~\/\.claude\b/g, '~/.config/opencode');
  convertedContent = convertedContent.replace(/\$HOME\/\.claude\b/g, '$HOME/.config/opencode');
  // Replace general-purpose subagent type with OpenCode's equivalent "general"
  convertedContent = convertedContent.replace(/subagent_type="general-purpose"/g, 'subagent_type="general"');
  // Runtime-neutral agent name replacement (#766)
  return neutralizeAgentReferences(convertedContent, 'AGENTS.md');
}

/**
 * Handle a `tools:` line: agents drop it, commands collect its comma-separated tools
 */
function handleOpencodeToolsField(trimmed, state, isAgent) {
  if (isAgent) {
    // Agents: strip tools entirely (not supported in OpenCode agent frontmatter)
    state.inSkippedArray = true;
    return;
  }
  const toolsValue = trimmed.substring(6).trim();
  if (toolsValue) {
    // Parse comma-separated tools
    const tools = toolsValue.split(',').map(t => t.trim()).filter(t => t);
    state.allowedTools.push(...tools);
  }
}

/**
 * Convert color names to hex for opencode (commands only; agents strip color earlier)
 */
function pushOpencodeColor(line, trimmed, newLines) {
  const colorValue = trimmed.substring(6).trim().toLowerCase();
  const hexColor = colorNameToHex[colorValue];
  if (hexColor) {
    newLines.push(`color: "${hexColor}"`);
  } else if (colorValue.startsWith('#') && /^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(colorValue)) {
    // Already hex and valid (#RGB or #RRGGBB), keep as is
    newLines.push(line);
  }
  // Skip invalid hex colors and unknown color names
}

/**
 * Collect an allowed-tools list item; returns true when the line was consumed
 */
function collectOpencodeAllowedTool(trimmed, state) {
  if (!state.inAllowedTools) return false;
  if (trimmed.startsWith('- ')) {
    state.allowedTools.push(trimmed.substring(2).trim());
    return true;
  }
  if (trimmed && !trimmed.startsWith('-')) {
    // End of array, new field started
    state.inAllowedTools = false;
  }
  return false;
}

/**
 * Apply one frontmatter line to the conversion state (simple YAML parsing)
 */
function convertOpencodeFrontmatterLine(line, state, isAgent) {
  const trimmed = line.trim();

  // For agents: skip commented-out lines (e.g. hooks blocks)
  if (isAgent && trimmed.startsWith('#')) return;

  // Detect start of allowed-tools array
  if (trimmed.startsWith('allowed-tools:')) {
    state.inAllowedTools = true;
    return;
  }

  // Detect inline tools: field (comma-separated string)
  if (trimmed.startsWith('tools:')) {
    handleOpencodeToolsField(trimmed, state, isAgent);
    return;
  }

  // For agents: strip skills:, color:, memory:, maxTurns:, permissionMode:, disallowedTools:
  if (isAgent && OPENCODE_STRIPPED_AGENT_FIELDS.test(trimmed)) {
    state.inSkippedArray = true;
    return;
  }

  // Skip continuation lines of a stripped array/object field
  if (state.inSkippedArray) {
    if (trimmed.startsWith('- ') || trimmed.startsWith('#') || /^\s/.test(line)) return;
    state.inSkippedArray = false;
  }

  // For commands: remove name: field (opencode uses filename for command name)
  // For agents: keep name: (required by OpenCode agents)
  if (!isAgent && trimmed.startsWith('name:')) return;

  // Strip model: field — OpenCode doesn't support Claude Code model aliases
  // like 'haiku', 'sonnet', 'opus', or 'inherit'. Omitting lets OpenCode use
  // its configured default model. See #1156.
  if (trimmed.startsWith('model:')) return;

  if (trimmed.startsWith('color:')) {
    pushOpencodeColor(line, trimmed, state.newLines);
    return;
  }

  if (collectOpencodeAllowedTool(trimmed, state)) return;

  // Keep other fields
  if (!state.inAllowedTools) {
    state.newLines.push(line);
  }
}

/**
 * Convert Claude Code frontmatter to opencode format
 * - Converts 'allowed-tools:' array to 'permission:' object
 * @param {string} content - Markdown file content with YAML frontmatter
 * @returns {string} - Content with converted frontmatter
 */
function convertClaudeToOpencodeFrontmatter(content, { isAgent = false } = {}) {
  const convertedContent = replaceOpencodeReferences(content);

  // Check if content has frontmatter
  if (!convertedContent.startsWith('---')) {
    return convertedContent;
  }

  // Find the end of frontmatter
  const endIndex = convertedContent.indexOf('---', 3);
  if (endIndex === -1) {
    return convertedContent;
  }

  const frontmatter = convertedContent.substring(3, endIndex).trim();
  const body = convertedContent.substring(endIndex + 3);

  const state = { inAllowedTools: false, inSkippedArray: false, allowedTools: [], newLines: [] };
  for (const line of frontmatter.split('\n')) {
    convertOpencodeFrontmatterLine(line, state, isAgent);
  }
  const { newLines, allowedTools } = state;

  // For agents: add required OpenCode agent fields
  // Note: Do NOT add 'model: inherit' — OpenCode does not recognize the 'inherit'
  // keyword and throws ProviderModelNotFoundError. Omitting model: lets OpenCode
  // use its default model for subagents. See #1156.
  if (isAgent) {
    newLines.push('mode: subagent');
  }

  // For commands: add tools object if we had allowed-tools or tools
  if (!isAgent && allowedTools.length > 0) {
    newLines.push('tools:');
    for (const tool of allowedTools) {
      newLines.push(`  ${convertToolName(tool)}: true`);
    }
  }

  // Rebuild frontmatter (body already has tool names converted)
  const newFrontmatter = newLines.join('\n').trim();
  return `---\n${newFrontmatter}\n---${body}`;
}

module.exports = {
  convertClaudeToOpencodeFrontmatter,
};
