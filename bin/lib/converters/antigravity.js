const { convertGeminiToolName } = require('./gemini');
const { extractFrontmatterAndBody, extractFrontmatterField, neutralizeAgentReferences } = require('./shared');

/**
 * Apply Antigravity-specific content conversion — path replacement + command name conversion.
 * Path mappings depend on install mode:
 *   Global: ~/.claude/ → ~/.gemini/antigravity/, ./.claude/ → ./.agent/
 *   Local:  ~/.claude/ → .agent/, ./.claude/ → ./.agent/
 * Applied to ALL Antigravity content (skills, agents, engine files).
 * @param {string} content - Source content to convert
 * @param {boolean} [isGlobal=false] - Whether this is a global install
 */
function convertClaudeToAntigravityContent(content, isGlobal = false) {
  let c = content;
  if (isGlobal) {
    c = c.replace(/\$HOME\/\.claude\//g, '$HOME/.gemini/antigravity/');
    c = c.replace(/~\/\.claude\//g, '~/.gemini/antigravity/');
  } else {
    c = c.replace(/\$HOME\/\.claude\//g, '.agent/');
    c = c.replace(/~\/\.claude\//g, '.agent/');
  }
  c = c.replace(/\.\/\.claude\//g, './.agent/');
  c = c.replace(/\.claude\//g, '.agent/');
  // Command name conversion (all gsd: references → gsd-)
  c = c.replace(/gsd:/g, 'gsd-');
  // Runtime-neutral agent name replacement (#766)
  c = neutralizeAgentReferences(c, 'GEMINI.md');
  return c;
}

/**
 * Convert a Claude command (.md) to an Antigravity skill (SKILL.md).
 * Transforms frontmatter to minimal name + description only.
 * Body passes through with path/command conversions applied.
 */
function convertClaudeCommandToAntigravitySkill(content, skillName, isGlobal = false) {
  const converted = convertClaudeToAntigravityContent(content, isGlobal);
  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) return converted;

  const name = skillName || extractFrontmatterField(frontmatter, 'name') || 'unknown';
  const description = extractFrontmatterField(frontmatter, 'description') || '';

  const fm = `---\nname: ${name}\ndescription: ${description}\n---`;
  return `${fm}\n${body}`;
}

/**
 * Convert a Claude agent (.md) to an Antigravity agent.
 * Uses Gemini tool names since Antigravity runs on Gemini 3 backend.
 */
function convertClaudeAgentToAntigravityAgent(content, isGlobal = false) {
  const converted = convertClaudeToAntigravityContent(content, isGlobal);
  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) return converted;

  const name = extractFrontmatterField(frontmatter, 'name') || 'unknown';
  const description = extractFrontmatterField(frontmatter, 'description') || '';
  const color = extractFrontmatterField(frontmatter, 'color');
  const toolsRaw = extractFrontmatterField(frontmatter, 'tools') || '';

  // Map tools to Gemini equivalents (reuse existing convertGeminiToolName)
  const claudeTools = toolsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const mappedTools = claudeTools.map(t => convertGeminiToolName(t)).filter(Boolean);

  let fm = `---\nname: ${name}\ndescription: ${description}\ntools: ${mappedTools.join(', ')}\n`;
  if (color) fm += `color: ${color}\n`;
  fm += '---';

  return `${fm}\n${body}`;
}

module.exports = {
  convertClaudeToAntigravityContent,
  convertClaudeCommandToAntigravitySkill,
  convertClaudeAgentToAntigravityAgent,
};
