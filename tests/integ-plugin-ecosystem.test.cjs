/**
 * Integration Tests — Plugin Ecosystem Coherence
 *
 * Validates cross-plugin properties that individual unit tests cannot catch:
 * no command/skill/agent name collisions, all declared assets exist on disk,
 * and no dangling references to removed commands.
 *
 * Read-only: scans the real project filesystem, creates nothing.
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PLUGINS_DIR = path.join(PROJECT_ROOT, 'plugins');
const GSD_COMMANDS_DIR = path.join(PROJECT_ROOT, 'get-shit-done', 'commands');

// ─── Discovery helpers ──────────────────────────────────────────────────────

/** Discover plugins with a plugin.json (top-level or .claude-plugin/). */
function discoverPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) return [];
  const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
  const plugins = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidates = [
      path.join(PLUGINS_DIR, entry.name, 'plugin.json'),
      path.join(PLUGINS_DIR, entry.name, '.claude-plugin', 'plugin.json'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const manifest = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        plugins.push({ name: entry.name, dir: path.join(PLUGINS_DIR, entry.name), manifest });
        break;
      }
    }
  }
  return plugins;
}

/** Collect command filenames (without extension) from a directory tree. */
function collectCommands(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectCommands(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push({ name: path.basename(entry.name, '.md'), file: fullPath });
    }
  }
  return results;
}

/** Collect skill directory names from a plugin's skills/ directory. */
function collectSkills(pluginDir) {
  const skillsDir = path.join(pluginDir, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ name: e.name, dir: path.join(skillsDir, e.name) }));
}

/** Collect agent .md files from agents/ dirs (including nested paths like subagent-lifecycle/agents/). */
function collectAgents(pluginDir) {
  const results = [];
  const directAgents = path.join(pluginDir, 'agents');
  if (fs.existsSync(directAgents)) {
    for (const f of fs.readdirSync(directAgents).filter(f => f.endsWith('.md'))) {
      results.push({ name: path.basename(f, '.md'), file: path.join(directAgents, f) });
    }
  }
  // Also check nested agent directories (e.g. subagent-lifecycle/agents/)
  const topEntries = fs.readdirSync(pluginDir, { withFileTypes: true });
  for (const entry of topEntries) {
    if (!entry.isDirectory() || entry.name === 'agents') continue;
    const nestedAgents = path.join(pluginDir, entry.name, 'agents');
    if (fs.existsSync(nestedAgents) && fs.statSync(nestedAgents).isDirectory()) {
      for (const f of fs.readdirSync(nestedAgents).filter(f => f.endsWith('.md'))) {
        results.push({ name: path.basename(f, '.md'), file: path.join(nestedAgents, f) });
      }
    }
  }
  return results;
}

const allPlugins = discoverPlugins();

// ─── Describe block 1: cross-plugin command name uniqueness ─────────────────

describe('cross-plugin command name uniqueness', () => {
  it('no command name collisions across all plugins and GSD', () => {
    const seen = new Map(); // name -> source

    for (const plugin of allPlugins) {
      const cmds = collectCommands(path.join(plugin.dir, 'commands'));
      for (const cmd of cmds) {
        const key = cmd.name;
        if (seen.has(key)) {
          assert.fail(`Command name collision: "${key}" exists in both ${seen.get(key)} and ${plugin.name}`);
        }
        seen.set(key, plugin.name);
      }
    }

    // GSD commands
    const gsdCmds = collectCommands(GSD_COMMANDS_DIR);
    for (const cmd of gsdCmds) {
      const key = cmd.name;
      if (seen.has(key)) {
        assert.fail(`Command name collision: "${key}" exists in both ${seen.get(key)} and get-shit-done`);
      }
      seen.set(key, 'get-shit-done');
    }

    assert.ok(seen.size > 0, 'Should discover at least one command across all plugins and GSD');
  });

  it('no skill name collisions across all plugins', () => {
    const seen = new Map(); // name -> plugin

    for (const plugin of allPlugins) {
      const skills = collectSkills(plugin.dir);
      for (const skill of skills) {
        if (seen.has(skill.name)) {
          assert.fail(`Skill name collision: "${skill.name}" exists in both ${seen.get(skill.name)} and ${plugin.name}`);
        }
        seen.set(skill.name, plugin.name);
      }
    }

    assert.ok(seen.size > 0, 'Should discover at least one skill across all plugins');
  });

  it('no agent name collisions across all plugins', () => {
    const seen = new Map(); // name -> plugin

    for (const plugin of allPlugins) {
      const agents = collectAgents(plugin.dir);
      for (const agent of agents) {
        if (seen.has(agent.name)) {
          assert.fail(`Agent name collision: "${agent.name}" exists in both ${seen.get(agent.name)} and ${plugin.name}`);
        }
        seen.set(agent.name, plugin.name);
      }
    }

    assert.ok(seen.size > 0, 'Should discover at least one agent across all plugins');
  });
});

// ─── Describe block 2: cross-reference integrity ────────────────────────────

describe('cross-reference integrity', () => {
  it('all command files are non-empty and readable', () => {
    let total = 0;
    for (const plugin of allPlugins) {
      const cmds = collectCommands(path.join(plugin.dir, 'commands'));
      for (const cmd of cmds) {
        total++;
        const content = fs.readFileSync(cmd.file, 'utf8');
        assert.ok(content.length > 0, `${plugin.name}: command file ${cmd.name}.md is empty`);
      }
    }
    // GSD commands
    const gsdCmds = collectCommands(GSD_COMMANDS_DIR);
    for (const cmd of gsdCmds) {
      total++;
      const content = fs.readFileSync(cmd.file, 'utf8');
      assert.ok(content.length > 0, `get-shit-done: command file ${cmd.name}.md is empty`);
    }
    assert.ok(total > 0, 'Should find at least one command file across the ecosystem');
  });

  it('all skill directories have valid SKILL.md', () => {
    let total = 0;
    for (const plugin of allPlugins) {
      const skills = collectSkills(plugin.dir);
      for (const skill of skills) {
        total++;
        const skillMd = path.join(skill.dir, 'SKILL.md');
        assert.ok(
          fs.existsSync(skillMd),
          `${plugin.name}: skills/${skill.name}/SKILL.md does not exist`
        );
        const content = fs.readFileSync(skillMd, 'utf8');
        assert.ok(
          content.length > 0,
          `${plugin.name}: skills/${skill.name}/SKILL.md is empty`
        );
      }
    }
    assert.ok(total > 0, 'Should find at least one skill directory across all plugins');
  });

  it('all agent .md files have name and description frontmatter', () => {
    let total = 0;
    for (const plugin of allPlugins) {
      const agents = collectAgents(plugin.dir);
      for (const agent of agents) {
        total++;
        const content = fs.readFileSync(agent.file, 'utf8');

        assert.ok(
          content.startsWith('---'),
          `${plugin.name}/agents/${agent.name}.md: must start with YAML frontmatter ---`
        );

        const endIdx = content.indexOf('---', 3);
        assert.ok(
          endIdx > 3,
          `${plugin.name}/agents/${agent.name}.md: must have closing --- for frontmatter`
        );

        const frontmatter = content.substring(3, endIdx);
        assert.ok(
          /^name\s*:/m.test(frontmatter),
          `${plugin.name}/agents/${agent.name}.md: frontmatter must contain "name:" field`
        );
        assert.ok(
          /^description\s*:/m.test(frontmatter),
          `${plugin.name}/agents/${agent.name}.md: frontmatter must contain "description:" field`
        );
      }
    }
    assert.ok(total > 0, 'Should find at least one agent file across all plugins');
  });

  it('GSD commands directory exists and has workflow files', () => {
    assert.ok(
      fs.existsSync(GSD_COMMANDS_DIR),
      'get-shit-done/commands/ directory must exist'
    );
    const allMd = collectCommands(GSD_COMMANDS_DIR);
    assert.ok(
      allMd.length >= 1,
      `GSD should have at least 1 workflow .md file, found ${allMd.length}`
    );
  });

  it('cross-plugin skill references resolve', () => {
    // If any SKILL.md references another skill by name, verify it exists.
    const allSkillNames = new Set();
    for (const plugin of allPlugins) {
      for (const skill of collectSkills(plugin.dir)) {
        allSkillNames.add(skill.name);
      }
    }

    let crossRefCount = 0;
    for (const plugin of allPlugins) {
      const skills = collectSkills(plugin.dir);
      for (const skill of skills) {
        const skillMd = path.join(skill.dir, 'SKILL.md');
        if (!fs.existsSync(skillMd)) continue;
        const content = fs.readFileSync(skillMd, 'utf8');

        // Look for @skill:skillname patterns
        const refs = content.match(/@skill:([a-z0-9-]+)/g) || [];
        for (const ref of refs) {
          const refName = ref.replace('@skill:', '');
          crossRefCount++;
          assert.ok(
            allSkillNames.has(refName),
            `${plugin.name}/skills/${skill.name}: references @skill:${refName} but that skill does not exist`
          );
        }
      }
    }
    // Test passes trivially if no cross-references found — that's coherent.
    assert.ok(true, `Checked ${crossRefCount} cross-plugin skill references`);
  });
});

// ─── Describe block 3: no dangling references to removed commands ───────────

describe('no dangling references to removed commands', () => {
  /**
   * Collect all scannable .md files across the ecosystem:
   * plugin commands, skills (SKILL.md), and agent files.
   */
  function collectAllMdFiles() {
    const files = [];
    for (const plugin of allPlugins) {
      // Command files
      for (const cmd of collectCommands(path.join(plugin.dir, 'commands'))) {
        files.push(cmd.file);
      }
      // Skill SKILL.md files
      for (const skill of collectSkills(plugin.dir)) {
        const skillMd = path.join(skill.dir, 'SKILL.md');
        if (fs.existsSync(skillMd)) files.push(skillMd);
      }
      // Agent files
      for (const agent of collectAgents(plugin.dir)) {
        files.push(agent.file);
      }
    }
    // GSD command files
    for (const cmd of collectCommands(GSD_COMMANDS_DIR)) {
      files.push(cmd.file);
    }
    return files;
  }

  /**
   * Check that a removed command does not appear as a standalone reference
   * in ecosystem files. Allows the command as part of longer command names
   * (e.g., /gsd:plan-phase is fine when checking /plan).
   */
  function assertNoStandaloneRef(removedCmd, validPrefixes) {
    const mdFiles = collectAllMdFiles();
    const escapedCmd = removedCmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the command followed by whitespace, end-of-line, punctuation, or backtick
    // but NOT preceded by colon (which would be /gsd:plan etc.)
    const pattern = new RegExp(`(?<![:\\w])${escapedCmd}(?=[\\s\`.,;:)\\]}\n]|$)`, 'gm');

    for (const file of mdFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(pattern) || [];

      // Filter out matches that are part of valid longer commands
      const lines = content.split('\n');
      for (const line of lines) {
        // Check if the line contains the bare command
        if (!pattern.test(line)) continue;
        // Reset regex lastIndex
        pattern.lastIndex = 0;

        // Skip if line contains a valid prefixed version
        const hasValidPrefix = validPrefixes.some(p => line.includes(p));
        if (hasValidPrefix) continue;

        // Skip documentation/changelog lines that describe the removal
        if (/removed|deprecated|replaced|was renamed|no longer/i.test(line)) continue;

        // Skip table rows in reference documentation (path examples, not commands)
        if (/^\s*\|/.test(line)) continue;

        // Skip lines where the match is inside backtick-quoted path examples
        if (new RegExp('`[^`]*' + escapedCmd + '[^`]*`').test(line) && /path|dir|folder|file/i.test(line)) continue;

        assert.fail(
          `Dangling reference to removed "${removedCmd}" found in ${path.relative(PROJECT_ROOT, file)}: "${line.trim().substring(0, 100)}"`
        );
      }
    }
  }

  it('no references to removed /plan command', () => {
    assertNoStandaloneRef('/plan', ['/gsd:plan', '/plan-phase']);
  });

  it('no references to removed /build command', () => {
    assertNoStandaloneRef('/build', ['/gsd:build', '/build-']);
  });

  it('no references to removed /status command', () => {
    assertNoStandaloneRef('/status', ['/gsd:status', '/agent-status', '/status-']);
  });

  it('ecosystem totals are reasonable', () => {
    let totalCommands = 0;
    let totalSkills = 0;
    let totalAgents = 0;

    for (const plugin of allPlugins) {
      totalCommands += collectCommands(path.join(plugin.dir, 'commands')).length;
      totalSkills += collectSkills(plugin.dir).length;
      totalAgents += collectAgents(plugin.dir).length;
    }
    totalCommands += collectCommands(GSD_COMMANDS_DIR).length;

    assert.ok(totalCommands > 0, `Expected at least 1 command, found ${totalCommands}`);
    assert.ok(totalSkills > 0, `Expected at least 1 skill, found ${totalSkills}`);
    assert.ok(totalAgents > 0, `Expected at least 1 agent, found ${totalAgents}`);

    // Log ecosystem summary for documentation
    console.log(`  Ecosystem: ${totalCommands} commands, ${totalSkills} skills, ${totalAgents} agents across ${allPlugins.length} plugins`);
  });
});
