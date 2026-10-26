const fs = require('fs');
const path = require('path');
const { getCommitAttribution, processAttribution } = require('./attribution');
const { convertClaudeCommandToAntigravitySkill, convertClaudeToAntigravityContent } = require('./converters/antigravity');
const { convertClaudeCommandToCodexSkill, convertClaudeToCodexMarkdown } = require('./converters/codex');
const { convertClaudeCommandToCopilotSkill, convertClaudeToCopilotContent } = require('./converters/copilot');
const { convertClaudeCommandToCursorSkill, convertClaudeToCursorMarkdown } = require('./converters/cursor');
const { convertClaudeToGeminiToml } = require('./converters/gemini');
const { convertClaudeToOpencodeFrontmatter } = require('./converters/opencode');
const { stripSubTags } = require('./converters/shared');
const { convertClaudeCommandToWindsurfSkill, convertClaudeToWindsurfMarkdown } = require('./converters/windsurf');
const { getDirName } = require('./paths');

/**
 * Copy commands to a flat structure for OpenCode
 * OpenCode expects: command/gsd-help.md (invoked as /gsd-help)
 * Source structure: commands/gsd/help.md
 * 
 * @param {string} srcDir - Source directory (e.g., commands/gsd/)
 * @param {string} destDir - Destination directory (e.g., command/)
 * @param {string} prefix - Prefix for filenames (e.g., 'gsd')
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude' or 'opencode')
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }
  
  // Remove old gsd-*.md files before copying new ones
  if (fs.existsSync(destDir)) {
    for (const file of fs.readdirSync(destDir)) {
      if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(destDir, file));
      }
    }
  } else {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse into subdirectories, adding to prefix
      // e.g., commands/gsd/debug/start.md -> command/gsd-debug-start.md
      copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      // Flatten: help.md -> gsd-help.md
      const baseName = entry.name.replace('.md', '');
      const destName = `${prefix}-${baseName}.md`;
      const destPath = path.join(destDir, destName);

      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const globalClaudeHomeRegex = /\$HOME\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      const opencodeDirRegex = /~\/\.opencode\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(globalClaudeHomeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
      content = content.replace(opencodeDirRegex, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeToOpencodeFrontmatter(content);

      fs.writeFileSync(destPath, content);
    }
  }
}

function listCodexSkillNames(skillsDir, prefix = 'gsd-') {
  if (!fs.existsSync(skillsDir)) return [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith(prefix))
    .filter(entry => fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
    .map(entry => entry.name)
    .sort();
}

function copyCommandsAsCodexSkills(srcDir, skillsDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Remove previous GSD Codex skills to avoid stale command skills.
  const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
    }
  }

  function recurse(currentSrcDir, currentPrefix) {
    const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrcDir, entry.name);
      if (entry.isDirectory()) {
        recurse(srcPath, `${currentPrefix}-${entry.name}`);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const baseName = entry.name.replace('.md', '');
      const skillName = `${currentPrefix}-${baseName}`;
      const skillDir = path.join(skillsDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const globalClaudeHomeRegex = /\$HOME\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      const codexDirRegex = /~\/\.codex\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(globalClaudeHomeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
      content = content.replace(codexDirRegex, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeCommandToCodexSkill(content, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

function copyCommandsAsCursorSkills(srcDir, skillsDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Remove previous GSD Cursor skills to avoid stale command skills
  const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
    }
  }

  function recurse(currentSrcDir, currentPrefix) {
    const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrcDir, entry.name);
      if (entry.isDirectory()) {
        recurse(srcPath, `${currentPrefix}-${entry.name}`);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const baseName = entry.name.replace('.md', '');
      const skillName = `${currentPrefix}-${baseName}`;
      const skillDir = path.join(skillsDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const globalClaudeHomeRegex = /\$HOME\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      const cursorDirRegex = /~\/\.cursor\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(globalClaudeHomeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
      content = content.replace(cursorDirRegex, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeCommandToCursorSkill(content, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

/**
 * Copy Claude commands as Windsurf skills — one folder per skill with SKILL.md.
 * Mirrors copyCommandsAsCursorSkills but uses Windsurf converters.
 */
function copyCommandsAsWindsurfSkills(srcDir, skillsDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Remove previous GSD Windsurf skills to avoid stale command skills
  const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
    }
  }

  function recurse(currentSrcDir, currentPrefix) {
    const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrcDir, entry.name);
      if (entry.isDirectory()) {
        recurse(srcPath, `${currentPrefix}-${entry.name}`);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const baseName = entry.name.replace('.md', '');
      const skillName = `${currentPrefix}-${baseName}`;
      const skillDir = path.join(skillsDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      const globalClaudeRegex = /~\/\.claude\//g;
      const globalClaudeHomeRegex = /\$HOME\/\.claude\//g;
      const localClaudeRegex = /\.\/\.claude\//g;
      const windsurfDirRegex = /~\/\.windsurf\//g;
      content = content.replace(globalClaudeRegex, pathPrefix);
      content = content.replace(globalClaudeHomeRegex, pathPrefix);
      content = content.replace(localClaudeRegex, `./${getDirName(runtime)}/`);
      content = content.replace(windsurfDirRegex, pathPrefix);
      content = processAttribution(content, getCommitAttribution(runtime));
      content = convertClaudeCommandToWindsurfSkill(content, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

/**
 * Copy Claude commands as Copilot skills — one folder per skill with SKILL.md.
 * Applies CONV-01 (structure), CONV-02 (allowed-tools), CONV-06 (paths), CONV-07 (command names).
 */
function copyCommandsAsCopilotSkills(srcDir, skillsDir, prefix, isGlobal = false) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Remove previous GSD Copilot skills
  const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
    }
  }

  function recurse(currentSrcDir, currentPrefix) {
    const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrcDir, entry.name);
      if (entry.isDirectory()) {
        recurse(srcPath, `${currentPrefix}-${entry.name}`);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const baseName = entry.name.replace('.md', '');
      const skillName = `${currentPrefix}-${baseName}`;
      const skillDir = path.join(skillsDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      content = convertClaudeCommandToCopilotSkill(content, skillName, isGlobal);
      content = processAttribution(content, getCommitAttribution('copilot'));

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

/**
 * Recursively install GSD commands as Antigravity skills.
 * Each command becomes a skill-name/ folder containing SKILL.md.
 * Mirrors copyCommandsAsCopilotSkills but uses Antigravity converters.
 * @param {string} srcDir - Source commands directory
 * @param {string} skillsDir - Target skills directory
 * @param {string} prefix - Skill name prefix (e.g. 'gsd')
 * @param {boolean} isGlobal - Whether this is a global install
 */
function copyCommandsAsAntigravitySkills(srcDir, skillsDir, prefix, isGlobal = false) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Remove previous GSD Antigravity skills
  const existing = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
    }
  }

  function recurse(currentSrcDir, currentPrefix) {
    const entries = fs.readdirSync(currentSrcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrcDir, entry.name);
      if (entry.isDirectory()) {
        recurse(srcPath, `${currentPrefix}-${entry.name}`);
        continue;
      }

      if (!entry.name.endsWith('.md')) {
        continue;
      }

      const baseName = entry.name.replace('.md', '');
      const skillName = `${currentPrefix}-${baseName}`;
      const skillDir = path.join(skillsDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      content = convertClaudeCommandToAntigravitySkill(content, skillName, isGlobal);
      content = processAttribution(content, getCommitAttribution('antigravity'));

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }

  recurse(srcDir, prefix);
}

/**
 * Recursively copy directory, replacing paths in .md files
 * Deletes existing destDir first to remove orphaned files from previous versions
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {string} pathPrefix - Path prefix for file references
 * @param {string} runtime - Target runtime ('claude', 'opencode', 'gemini', 'codex')
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix, runtime, isCommand = false, isGlobal = false) {
  const isOpencode = runtime === 'opencode';
  const isCodex = runtime === 'codex';
  const isCopilot = runtime === 'copilot';
  const isAntigravity = runtime === 'antigravity';
  const isCursor = runtime === 'cursor';
  const isWindsurf = runtime === 'windsurf';
  const dirName = getDirName(runtime);

  // Clean install: remove existing destination to prevent orphaned files
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix, runtime, isCommand, isGlobal);
    } else if (entry.name.endsWith('.md')) {
      // Replace ~/.claude/ and $HOME/.claude/ and ./.claude/ with runtime-appropriate paths
      // Skip generic replacement for Copilot — convertClaudeToCopilotContent handles all paths
      let content = fs.readFileSync(srcPath, 'utf8');
      if (!isCopilot && !isAntigravity) {
        const globalClaudeRegex = /~\/\.claude\//g;
        const globalClaudeHomeRegex = /\$HOME\/\.claude\//g;
        const localClaudeRegex = /\.\/\.claude\//g;
        content = content.replace(globalClaudeRegex, pathPrefix);
        content = content.replace(globalClaudeHomeRegex, pathPrefix);
        content = content.replace(localClaudeRegex, `./${dirName}/`);
      }
      content = processAttribution(content, getCommitAttribution(runtime));

      // Convert frontmatter for opencode compatibility
      if (isOpencode) {
        content = convertClaudeToOpencodeFrontmatter(content);
        fs.writeFileSync(destPath, content);
      } else if (runtime === 'gemini') {
        if (isCommand) {
          // Convert to TOML for Gemini (strip <sub> tags — terminals can't render subscript)
          content = stripSubTags(content);
          const tomlContent = convertClaudeToGeminiToml(content);
          // Replace extension with .toml
          const tomlPath = destPath.replace(/\.md$/, '.toml');
          fs.writeFileSync(tomlPath, tomlContent);
        } else {
          fs.writeFileSync(destPath, content);
        }
      } else if (isCodex) {
        content = convertClaudeToCodexMarkdown(content);
        fs.writeFileSync(destPath, content);
      } else if (isCopilot) {
        content = convertClaudeToCopilotContent(content, isGlobal);
        content = processAttribution(content, getCommitAttribution(runtime));
        fs.writeFileSync(destPath, content);
      } else if (isAntigravity) {
        content = convertClaudeToAntigravityContent(content, isGlobal);
        content = processAttribution(content, getCommitAttribution(runtime));
        fs.writeFileSync(destPath, content);
      } else if (isCursor) {
        content = convertClaudeToCursorMarkdown(content);
        fs.writeFileSync(destPath, content);
      } else if (isWindsurf) {
        content = convertClaudeToWindsurfMarkdown(content);
        fs.writeFileSync(destPath, content);
      } else {
        fs.writeFileSync(destPath, content);
      }
    } else if (isCopilot && (entry.name.endsWith('.cjs') || entry.name.endsWith('.js'))) {
      // Copilot: also transform .cjs/.js files for CONV-06 and CONV-07
      let content = fs.readFileSync(srcPath, 'utf8');
      content = convertClaudeToCopilotContent(content, isGlobal);
      fs.writeFileSync(destPath, content);
    } else if (isAntigravity && (entry.name.endsWith('.cjs') || entry.name.endsWith('.js'))) {
      // Antigravity: also transform .cjs/.js files for path/command conversions
      let content = fs.readFileSync(srcPath, 'utf8');
      content = convertClaudeToAntigravityContent(content, isGlobal);
      fs.writeFileSync(destPath, content);
    } else if (isCursor && (entry.name.endsWith('.cjs') || entry.name.endsWith('.js'))) {
      // For Cursor, also convert Claude references in JS/CJS utility scripts
      let jsContent = fs.readFileSync(srcPath, 'utf8');
      jsContent = jsContent.replace(/gsd:/gi, 'gsd-');
      jsContent = jsContent.replace(/\.claude\/skills\//g, '.cursor/skills/');
      jsContent = jsContent.replace(/CLAUDE\.md/g, '.cursor/rules/');
      jsContent = jsContent.replace(/\bClaude Code\b/g, 'Cursor');
      fs.writeFileSync(destPath, jsContent);
    } else if (isWindsurf && (entry.name.endsWith('.cjs') || entry.name.endsWith('.js'))) {
      // For Windsurf, also convert Claude references in JS/CJS utility scripts
      let jsContent = fs.readFileSync(srcPath, 'utf8');
      jsContent = jsContent.replace(/gsd:/gi, 'gsd-');
      jsContent = jsContent.replace(/\.claude\/skills\//g, '.windsurf/skills/');
      jsContent = jsContent.replace(/CLAUDE\.md/g, '.windsurf/rules/');
      jsContent = jsContent.replace(/\bClaude Code\b/g, 'Windsurf');
      fs.writeFileSync(destPath, jsContent);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = {
  copyFlattenedCommands,
  listCodexSkillNames,
  copyCommandsAsCodexSkills,
  copyCommandsAsCursorSkills,
  copyCommandsAsWindsurfSkills,
  copyCommandsAsCopilotSkills,
  copyCommandsAsAntigravitySkills,
  copyWithPathReplacement,
};
