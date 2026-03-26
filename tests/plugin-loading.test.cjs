/**
 * GSD Tools Tests - Plugin Loading
 *
 * Tests runtime plugin behavior: JSON validity, command/skill/agent file
 * existence, command routing, and frontmatter validation.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

const PROJECT_ROOT = path.join(__dirname, '..');
const PLUGINS_DIR = path.join(PROJECT_ROOT, 'plugins');

// ─── Discover plugins ────────────────────────────────────────────────────────

/** Return array of { name, dir, manifest } for each plugin with a plugin.json. */
function discoverPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) return [];
  const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
  const plugins = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // plugin.json may be at top level or inside .claude-plugin/
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

const allPlugins = discoverPlugins();

// ─── Plugin manifest validation ──────────────────────────────────────────────

describe('plugin manifest validation', () => {
  test('each plugin.json loads and has required fields', () => {
    assert.ok(allPlugins.length > 0, 'Should discover at least one plugin');

    for (const plugin of allPlugins) {
      assert.ok(plugin.manifest.name, `${plugin.name}: plugin.json must have "name"`);
      assert.ok(plugin.manifest.version, `${plugin.name}: plugin.json must have "version"`);
      assert.ok(plugin.manifest.description, `${plugin.name}: plugin.json must have "description"`);

      // Each plugin should have at least one of commands/, skills/, or agents/
      const hasCommands = fs.existsSync(path.join(plugin.dir, 'commands'));
      const hasSkills = fs.existsSync(path.join(plugin.dir, 'skills'));
      const hasAgents = fs.existsSync(path.join(plugin.dir, 'agents'));
      assert.ok(
        hasCommands || hasSkills || hasAgents,
        `${plugin.name}: must have at least one of commands/, skills/, or agents/`
      );
    }
  });
});

// ─── Plugin command files ────────────────────────────────────────────────────

describe('plugin command files', () => {
  test('command files exist and are readable', () => {
    for (const plugin of allPlugins) {
      const commandsDir = path.join(plugin.dir, 'commands');
      if (!fs.existsSync(commandsDir)) continue;

      const files = fs.readdirSync(commandsDir);
      assert.ok(files.length > 0, `${plugin.name}: commands/ should not be empty`);

      for (const file of files) {
        const filePath = path.join(commandsDir, file);
        const stat = fs.statSync(filePath);
        assert.ok(stat.isFile(), `${plugin.name}: commands/${file} should be a file`);
        const content = fs.readFileSync(filePath, 'utf8');
        assert.ok(content.length > 0, `${plugin.name}: commands/${file} should not be empty`);
      }
    }
  });
});

// ─── Plugin skill files ──────────────────────────────────────────────────────

describe('plugin skill files', () => {
  test('skill directories exist with SKILL.md', () => {
    for (const plugin of allPlugins) {
      const skillsDir = path.join(plugin.dir, 'skills');
      if (!fs.existsSync(skillsDir)) continue;

      const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory());

      assert.ok(dirs.length > 0, `${plugin.name}: skills/ should contain subdirectories`);

      for (const dir of dirs) {
        const skillMd = path.join(skillsDir, dir.name, 'SKILL.md');
        assert.ok(
          fs.existsSync(skillMd),
          `${plugin.name}: skills/${dir.name}/SKILL.md should exist`
        );
      }
    }
  });
});

// ─── Command routing ─────────────────────────────────────────────────────────

describe('command routing', () => {
  let tmpDir;

  test('known command routes correctly — state', () => {
    tmpDir = createTempProject();
    try {
      const result = runGsdTools('state', tmpDir);
      assert.ok(result.success, 'state command should succeed');
      assert.ok(result.output.length > 0, 'state output should not be empty');
      // state returns JSON
      const parsed = JSON.parse(result.output);
      assert.ok(parsed.state_exists !== undefined, 'state output should contain state_exists field');
    } finally {
      cleanup(tmpDir);
    }
  });

  test('plugin-defined command routes — stats', () => {
    tmpDir = createTempProject();
    try {
      const result = runGsdTools('stats', tmpDir);
      // stats may succeed or fail depending on project state,
      // but it should produce output (not crash silently)
      assert.ok(
        result.output.length > 0 || (result.error && result.error.length > 0),
        'stats command should produce output or a meaningful error'
      );
    } finally {
      cleanup(tmpDir);
    }
  });
});

// ─── Skill directories discoverable ─────────────────────────────────────────

describe('skill directories discoverable', () => {
  test('each skill subdirectory has SKILL.md', () => {
    // Check all plugins for skill directories
    let totalSkills = 0;

    for (const plugin of allPlugins) {
      const skillsDir = path.join(plugin.dir, 'skills');
      if (!fs.existsSync(skillsDir)) continue;

      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory());

      for (const dir of skillDirs) {
        totalSkills++;
        const skillMd = path.join(skillsDir, dir.name, 'SKILL.md');
        assert.ok(
          fs.existsSync(skillMd),
          `Missing SKILL.md: ${plugin.name}/skills/${dir.name}/`
        );

        // Verify SKILL.md has content
        const content = fs.readFileSync(skillMd, 'utf8');
        assert.ok(
          content.length > 0,
          `Empty SKILL.md: ${plugin.name}/skills/${dir.name}/SKILL.md`
        );
      }
    }

    assert.ok(totalSkills > 0, 'Should find at least one skill directory across all plugins');
  });
});

// ─── Agent file frontmatter ─────────────────────────────────────────────────

describe('agent files have valid frontmatter', () => {
  test('each .md agent file has name and description in frontmatter', () => {
    let totalAgents = 0;

    for (const plugin of allPlugins) {
      const agentsDir = path.join(plugin.dir, 'agents');
      if (!fs.existsSync(agentsDir)) continue;

      const mdFiles = fs.readdirSync(agentsDir)
        .filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        totalAgents++;
        const filePath = path.join(agentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for YAML frontmatter delimiters
        assert.ok(
          content.startsWith('---'),
          `${plugin.name}/agents/${file}: should start with YAML frontmatter ---`
        );

        const endIdx = content.indexOf('---', 3);
        assert.ok(
          endIdx > 3,
          `${plugin.name}/agents/${file}: should have closing --- for frontmatter`
        );

        const frontmatter = content.substring(3, endIdx);

        // Check for name field
        assert.ok(
          /^name\s*:/m.test(frontmatter),
          `${plugin.name}/agents/${file}: frontmatter must contain "name:" field`
        );

        // Check for description field
        assert.ok(
          /^description\s*:/m.test(frontmatter),
          `${plugin.name}/agents/${file}: frontmatter must contain "description:" field`
        );
      }
    }

    assert.ok(totalAgents > 0, 'Should find at least one agent .md file across all plugins');
  });
});
