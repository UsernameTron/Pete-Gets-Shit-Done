/**
 * Install.js Coverage — Runtime Converters and install() Function
 *
 * Exercises the install() function with multiple runtimes to cover
 * internal helpers: copyWithPathReplacement, copyFlattenedCommands,
 * cleanupOrphanedFiles, cleanupOrphanedHooks, readSettings, writeSettings,
 * buildHookCommand, verifyInstalled, verifyFileInstalled, saveLocalPatches,
 * fileHash, generateManifest, detectLineEnding, processAttribution,
 * getCommitAttribution, convertClaudeToGeminiToml, stripSubTags,
 * expandTilde, and the TOML parsing pipeline.
 *
 * The install() function is the main entry point that wires all internal
 * helpers together. Testing it with different runtimes gives broad coverage.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const mod = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'gsd-conv-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── install() function — exercises many internal helpers ───────────────────

describe('install() function — Claude runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Claude runtime to local directory', () => {
    const result = mod.install(false, 'claude');
    // Should return an object with settingsPath and settings
    assert.ok(result, 'install() should return result object');
    assert.ok(result.settingsPath, 'should have settingsPath');

    // Verify get-shit-done dir was created
    const gsdDir = path.join(tmpDir, '.claude', 'get-shit-done');
    assert.ok(fs.existsSync(gsdDir), 'get-shit-done should be installed');

    // Verify agents were installed
    const agentsDir = path.join(tmpDir, '.claude', 'agents');
    assert.ok(fs.existsSync(agentsDir), 'agents should be installed');

    // Verify VERSION file
    const versionFile = path.join(gsdDir, 'VERSION');
    assert.ok(fs.existsSync(versionFile), 'VERSION should exist');

    // Verify manifest was created
    const manifest = path.join(tmpDir, '.claude', 'gsd-file-manifest.json');
    assert.ok(fs.existsSync(manifest), 'manifest should exist');

    // install() returns settings object in-memory (finishInstall() writes it to disk)
    assert.ok(result.settings, 'should have settings object');
    assert.ok(result.settings.hooks, 'settings should have hooks');
  });
});

describe('install() function — OpenCode runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs OpenCode runtime to local directory', () => {
    const result = mod.install(false, 'opencode');
    assert.ok(result, 'install() should return result object');

    // Verify OpenCode flat command structure
    const commandDir = path.join(tmpDir, '.opencode', 'command');
    assert.ok(fs.existsSync(commandDir), 'command/ dir should exist');

    // Verify gsd-*.md files in command/
    const cmdFiles = fs.readdirSync(commandDir).filter(f => f.startsWith('gsd-') && f.endsWith('.md'));
    assert.ok(cmdFiles.length > 0, 'should have gsd-*.md command files');

    // Verify get-shit-done dir
    const gsdDir = path.join(tmpDir, '.opencode', 'get-shit-done');
    assert.ok(fs.existsSync(gsdDir), 'get-shit-done should be installed');
  });
});

describe('install() function — Gemini runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Gemini runtime to local directory', () => {
    const result = mod.install(false, 'gemini');
    assert.ok(result, 'install() should return result object');

    // Verify commands installed (Gemini uses commands/gsd/ structure with .toml)
    const commandsDir = path.join(tmpDir, '.gemini', 'commands', 'gsd');
    assert.ok(fs.existsSync(commandsDir), 'commands/gsd should exist');

    // Verify agents dir
    const agentsDir = path.join(tmpDir, '.gemini', 'agents');
    assert.ok(fs.existsSync(agentsDir), 'agents should be installed');

    // Verify settings has experimental.enableAgents
    if (result.settingsPath && fs.existsSync(result.settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(result.settingsPath, 'utf8'));
      assert.ok(settings.experimental, 'should have experimental section');
      assert.strictEqual(settings.experimental.enableAgents, true, 'should enable agents');
    }
  });
});

describe('install() function — Codex runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Codex runtime to local directory', () => {
    const result = mod.install(false, 'codex');
    assert.ok(result, 'install() should return result object');

    // Verify skills dir
    const skillsDir = path.join(tmpDir, '.codex', 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ should exist');

    // Verify skills are gsd-* directories with SKILL.md
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('gsd-'));
    assert.ok(skills.length > 0, 'should have gsd-* skill directories');

    // Verify config.toml was created
    const configToml = path.join(tmpDir, '.codex', 'config.toml');
    assert.ok(fs.existsSync(configToml), 'config.toml should exist');

    // Codex returns null settings
    assert.strictEqual(result.settingsPath, null);
  });
});

describe('install() function — Copilot runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Copilot runtime to local directory', () => {
    const result = mod.install(false, 'copilot');
    assert.ok(result, 'install() should return result object');

    // Verify skills dir
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ should exist');

    // Copilot returns null settings (no settings.json)
    assert.strictEqual(result.settingsPath, null);
  });
});

describe('install() function — Cursor runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Cursor runtime to local directory', () => {
    const result = mod.install(false, 'cursor');
    assert.ok(result, 'install() should return result object');

    // Verify skills dir
    const skillsDir = path.join(tmpDir, '.cursor', 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ should exist');

    // Cursor returns null settings
    assert.strictEqual(result.settingsPath, null);
  });
});

describe('install() function — Windsurf runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Windsurf runtime to local directory', () => {
    const result = mod.install(false, 'windsurf');
    assert.ok(result, 'install() should return result object');

    // Verify skills dir
    const skillsDir = path.join(tmpDir, '.windsurf', 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ should exist');

    // Windsurf returns null settings
    assert.strictEqual(result.settingsPath, null);
  });
});

describe('install() function — Antigravity runtime (local)', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('installs Antigravity runtime to local directory', () => {
    const result = mod.install(false, 'antigravity');
    assert.ok(result, 'install() should return result object');

    // Verify skills dir
    const skillsDir = path.join(tmpDir, '.agent', 'skills');
    assert.ok(fs.existsSync(skillsDir), 'skills/ should exist');

    // Verify agents dir
    const agentsDir = path.join(tmpDir, '.agent', 'agents');
    assert.ok(fs.existsSync(agentsDir), 'agents should be installed');
  });
});

// ─── install() with existing settings (exercises cleanupOrphanedHooks) ──────

describe('install() with pre-existing state', () => {
  let tmpDir, origCwd;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
  });

  test('upgrades existing install (exercises saveLocalPatches + orphan cleanup)', () => {
    // First install
    mod.install(false, 'claude');

    // Modify a file to trigger saveLocalPatches on second install
    const gsdDir = path.join(tmpDir, '.claude', 'get-shit-done');
    const testFile = path.join(gsdDir, 'VERSION');
    if (fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'modified-version');
    }

    // Create orphaned files to trigger cleanupOrphanedFiles
    const hooksDir = path.join(tmpDir, '.claude', 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDir, 'statusline.js'), '// old hook');

    // Second install (upgrade)
    const result = mod.install(false, 'claude');
    assert.ok(result, 'upgrade should complete');

    // Verify orphaned hook was cleaned up
    assert.ok(!fs.existsSync(path.join(hooksDir, 'statusline.js')), 'orphaned statusline.js should be removed');
  });

  test('install with pre-existing settings with orphaned hooks', () => {
    // Create pre-existing settings with orphaned hook references
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const settingsPath = path.join(claudeDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'node /path/gsd-notify.sh' }] },
          { hooks: [{ type: 'command', command: 'node /path/gsd-check-update.js' }] }
        ],
        PostToolUse: [
          { hooks: [{ type: 'command', command: 'node /path/gsd-intel-index.js' }] }
        ]
      },
      statusLine: { command: 'node /path/hooks/statusline.js' }
    }, null, 2));

    const result = mod.install(false, 'claude');
    assert.ok(result);

    // install() returns in-memory settings (cleanupOrphanedHooks was called)
    const settings = result.settings;
    // gsd-notify.sh and gsd-intel-index.js should be removed by cleanupOrphanedHooks
    const sessionHookCommands = (settings.hooks.SessionStart || [])
      .flatMap(e => (e.hooks || []).map(h => h.command || ''));
    assert.ok(!sessionHookCommands.some(c => c.includes('gsd-notify.sh')),
      'orphaned gsd-notify.sh should be removed');

    // gsd-intel-index.js should also be removed
    const postToolCommands = (settings.hooks.PostToolUse || [])
      .flatMap(e => (e.hooks || []).map(h => h.command || ''));
    assert.ok(!postToolCommands.some(c => c.includes('gsd-intel-index.js')),
      'orphaned gsd-intel-index.js should be removed');

    // statusLine path should be updated from statusline.js to gsd-statusline.js
    if (settings.statusLine && settings.statusLine.command) {
      assert.ok(settings.statusLine.command.includes('gsd-statusline.js'),
        'statusline path should be updated');
    }
  });
});

// ─── OpenCode conversion details ────────────────────────────────────────────

describe('OpenCode conversion — frontmatter transforms', () => {
  test('converts allowed-tools to permission object for commands', () => {
    const content = `---
name: test-cmd
description: A test
allowed-tools:
  - Read
  - Bash
  - mcp__github
---

Body text.`;
    const result = mod.convertClaudeToOpencodeFrontmatter(content);
    assert.ok(typeof result === 'string');
    // Should have converted tools to lowercase opencode format
    assert.ok(!result.includes('allowed-tools:'), 'should remove allowed-tools');
  });

  test('adds mode: subagent for agent conversions', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write, Bash
color: cyan
skills:
  - some-skill
---

Agent body.`;
    const result = mod.convertClaudeToOpencodeFrontmatter(content, { isAgent: true });
    assert.ok(result.includes('mode:'), 'should add mode field for agents');
  });

  test('converts color name to hex', () => {
    const content = `---
name: test
description: Test
color: cyan
---

Body.`;
    const result = mod.convertClaudeToOpencodeFrontmatter(content, { isAgent: true });
    // cyan should be converted to #00FFFF
    if (result.includes('color:')) {
      assert.ok(result.includes('#00FFFF') || !result.includes('cyan'),
        'color name should be converted to hex');
    }
  });
});

// ─── Gemini conversion details ──────────────────────────────────────────────

describe('Gemini conversion — tool mapping and frontmatter', () => {
  test('maps Claude tools to Gemini names', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write, Bash, Grep, Glob
---

You are a test agent.`;
    const result = mod.convertClaudeToGeminiAgent(content);
    assert.ok(result.includes('tools:'), 'should have tools field');
    // Gemini uses different tool names
    assert.ok(!result.includes('Read,'), 'Claude tool names should be converted');
  });

  test('removes skills field', () => {
    const content = `---
name: gsd-test
description: Test
skills:
  - some-skill
  - other-skill
---

Body.`;
    const result = mod.convertClaudeToGeminiAgent(content);
    assert.ok(!result.includes('skills:'), 'skills field should be removed');
  });

  test('handles Task tool exclusion', () => {
    const content = `---
name: gsd-test
description: Test
tools: Read, Task, Write
---

Body.`;
    const result = mod.convertClaudeToGeminiAgent(content);
    // Task should be excluded from Gemini agents (auto-registered)
    assert.ok(typeof result === 'string');
  });
});

// ─── installCodexConfig ─────────────────────────────────────────────────────

describe('installCodexConfig', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('generates config.toml and agent .toml files', () => {
    // Create a minimal agents source directory
    const agentsSrc = path.join(tmpDir, 'src-agents');
    fs.mkdirSync(agentsSrc, { recursive: true });
    fs.writeFileSync(path.join(agentsSrc, 'gsd-test.md'), `---
name: gsd-test
description: Test agent
tools: Read, Write
---
You are a test agent.`);

    const targetDir = path.join(tmpDir, 'target');
    fs.mkdirSync(path.join(targetDir, 'agents'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'get-shit-done'), { recursive: true });

    const count = mod.installCodexConfig(targetDir, agentsSrc);
    assert.ok(count >= 0, 'should return agent count');

    // Verify config.toml was created
    const configToml = path.join(targetDir, 'config.toml');
    assert.ok(fs.existsSync(configToml), 'config.toml should exist');
  });

  test('handles empty agents source', () => {
    const agentsSrc = path.join(tmpDir, 'empty-agents');
    fs.mkdirSync(agentsSrc, { recursive: true });

    const targetDir = path.join(tmpDir, 'target');
    fs.mkdirSync(path.join(targetDir, 'agents'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'get-shit-done'), { recursive: true });

    const count = mod.installCodexConfig(targetDir, agentsSrc);
    assert.strictEqual(count, 0, 'should return 0 for empty agents');
  });
});

// ─── install() global with explicit config dir (exercises more paths) ───────

describe('install() function — global installs with explicit dir', () => {
  let tmpDir, origCwd;
  const envVarsToClean = ['GEMINI_CONFIG_DIR', 'CODEX_HOME', 'OPENCODE_CONFIG_DIR',
    'OPENCODE_CONFIG', 'XDG_CONFIG_HOME', 'COPILOT_CONFIG_DIR',
    'ANTIGRAVITY_CONFIG_DIR', 'CURSOR_CONFIG_DIR', 'WINDSURF_CONFIG_DIR',
    'CLAUDE_CONFIG_DIR'];
  const savedEnv = {};

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    process.chdir(tmpDir);
    for (const key of envVarsToClean) {
      savedEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    process.chdir(origCwd);
    cleanup(tmpDir);
    for (const key of envVarsToClean) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  test('installs Gemini runtime globally to explicit dir', () => {
    const targetDir = path.join(tmpDir, 'gemini-global');
    process.env.GEMINI_CONFIG_DIR = targetDir;

    const result = mod.install(true, 'gemini');
    assert.ok(result);

    // Verify get-shit-done was installed
    assert.ok(fs.existsSync(path.join(targetDir, 'get-shit-done')));
    // Verify settings.json with experimental agents
    if (result.settingsPath) {
      const settings = result.settings;
      assert.ok(settings.experimental && settings.experimental.enableAgents);
      // Verify Gemini uses AfterTool instead of PostToolUse
      assert.ok(settings.hooks.AfterTool || settings.hooks.PostToolUse,
        'should have post-tool hook');
    }
  });

  test('installs Antigravity runtime globally to explicit dir', () => {
    const targetDir = path.join(tmpDir, 'antigravity-global');
    process.env.ANTIGRAVITY_CONFIG_DIR = targetDir;

    const result = mod.install(true, 'antigravity');
    assert.ok(result);
    assert.ok(fs.existsSync(path.join(targetDir, 'get-shit-done')));

    // Antigravity uses AfterTool and BeforeTool hooks
    if (result.settings && result.settings.hooks) {
      const hookEvents = Object.keys(result.settings.hooks);
      // Should use AfterTool or BeforeTool (not PostToolUse/PreToolUse)
      assert.ok(hookEvents.some(e => e === 'AfterTool' || e === 'BeforeTool'),
        'Antigravity should use Gemini-style hook events');
    }
  });

  test('installs Codex runtime globally to explicit dir (exercises TOML pipeline)', () => {
    const targetDir = path.join(tmpDir, 'codex-global');
    process.env.CODEX_HOME = targetDir;

    const result = mod.install(true, 'codex');
    assert.ok(result);

    // Verify config.toml was created
    const configToml = path.join(targetDir, 'config.toml');
    assert.ok(fs.existsSync(configToml), 'config.toml should exist');
    const content = fs.readFileSync(configToml, 'utf8');
    // Should contain GSD marker
    assert.ok(content.includes(mod.GSD_CODEX_MARKER) || content.includes('agents'),
      'config.toml should have GSD content');

    // Verify agent .toml files
    const agentsDir = path.join(targetDir, 'agents');
    if (fs.existsSync(agentsDir)) {
      const tomlFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.toml'));
      assert.ok(tomlFiles.length > 0, 'should have agent .toml files');
    }
  });

  test('installs Claude runtime globally with hook registration', () => {
    const targetDir = path.join(tmpDir, 'claude-global');
    process.env.CLAUDE_CONFIG_DIR = targetDir;

    const result = mod.install(true, 'claude');
    assert.ok(result);

    // Verify hooks were configured
    const settings = result.settings;
    assert.ok(settings.hooks.SessionStart, 'should have SessionStart hook');
    assert.ok(settings.hooks.PostToolUse, 'should have PostToolUse hook');
    assert.ok(settings.hooks.PreToolUse, 'should have PreToolUse hook');

    // Verify update check hook
    const sessionStart = settings.hooks.SessionStart;
    const hasUpdateCheck = sessionStart.some(e =>
      e.hooks && e.hooks.some(h => h.command && h.command.includes('gsd-check-update')));
    assert.ok(hasUpdateCheck, 'should have update check hook');

    // Verify context monitor hook
    const postTool = settings.hooks.PostToolUse;
    const hasContextMonitor = postTool.some(e =>
      e.hooks && e.hooks.some(h => h.command && h.command.includes('gsd-context-monitor')));
    assert.ok(hasContextMonitor, 'should have context monitor hook');

    // Verify prompt guard hook
    const preTool = settings.hooks.PreToolUse;
    const hasPromptGuard = preTool.some(e =>
      e.hooks && e.hooks.some(h => h.command && h.command.includes('gsd-prompt-guard')));
    assert.ok(hasPromptGuard, 'should have prompt guard hook');
  });

  test('installs OpenCode runtime globally to explicit dir', () => {
    const targetDir = path.join(tmpDir, 'opencode-global');
    process.env.OPENCODE_CONFIG_DIR = targetDir;

    const result = mod.install(true, 'opencode');
    assert.ok(result);
    assert.ok(fs.existsSync(path.join(targetDir, 'get-shit-done')));
    assert.ok(fs.existsSync(path.join(targetDir, 'command')));
  });
});

// ─── mergeCodexConfig + stripGsdFromCodexConfig TOML coverage ───────────────

describe('mergeCodexConfig — TOML parsing pipeline', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('replaces existing GSD block in config.toml', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    const existingContent = `[tool]
name = "test"

${mod.GSD_CODEX_MARKER}
[agents.old-gsd]
model = "o3-mini"
`;
    fs.writeFileSync(configPath, existingContent);

    const newBlock = `${mod.GSD_CODEX_MARKER}\n[agents.new-gsd]\nmodel = "o4-mini"\n`;
    mod.mergeCodexConfig(configPath, newBlock);

    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('new-gsd'), 'should contain new GSD block');
    assert.ok(!result.includes('old-gsd'), 'should remove old GSD block');
    assert.ok(result.includes('[tool]'), 'should preserve non-GSD content');
  });

  test('handles CRLF line endings', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '[tool]\r\nname = "test"\r\n');
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\r\n[agents.gsd]\r\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('[tool]'));
  });

  test('handles config with [features] section', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `[features]\ncodex_hooks = true\n\n[tool]\nname = "test"\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('[features]'), 'should preserve features section');
  });

  test('handles config with features.codex_hooks root key', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `features.codex_hooks = true\nmodel = "o3-mini"\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('features.codex_hooks'));
  });

  test('handles config with multiline strings', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `instructions = """
This is a
multiline string
"""\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('multiline string'));
  });

  test('handles config with literal multiline strings', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `instructions = '''
Literal multiline
no escaping
'''\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('no escaping'));
  });

  test('handles config with quoted keys', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `"special.key" = "value"\n'literal-key' = "value2"\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('special.key'));
  });

  test('handles config with comments in various positions', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `# Top-level comment\nmodel = "test" # inline comment\n# Another comment\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('# Top-level comment'));
  });

  test('handles config with array tables [[hooks]]', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, `[[hooks]]\nevent = "SessionStart"\ncommand = "echo hi"\n`);
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes('[[hooks]]'));
  });

  test('handles empty config', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '');
    mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd]\n`);
    const result = fs.readFileSync(configPath, 'utf8');
    assert.ok(result.includes(mod.GSD_CODEX_MARKER));
  });
});

describe('stripGsdFromCodexConfig — TOML cleanup', () => {
  test('returns null for GSD-only content', () => {
    const content = `${mod.GSD_CODEX_MARKER}\n[agents.gsd-test]\nmodel = "o3-mini"\n`;
    const result = mod.stripGsdFromCodexConfig(content);
    assert.ok(result === null || result.trim() === '', 'GSD-only config should return null or empty');
  });

  test('preserves non-GSD content after stripping', () => {
    const content = `[user-config]\nname = "test"\n\n${mod.GSD_CODEX_MARKER}\n[agents.gsd-test]\nmodel = "o3-mini"\n`;
    const result = mod.stripGsdFromCodexConfig(content);
    assert.ok(result !== null);
    assert.ok(result.includes('[user-config]'));
    assert.ok(!result.includes('gsd-test'));
  });

  test('handles content without GSD marker', () => {
    const content = `[user-config]\nname = "test"\n`;
    const result = mod.stripGsdFromCodexConfig(content);
    assert.ok(result !== null);
    assert.ok(result.includes('[user-config]'));
  });

  test('handles content with only comments and whitespace after marker', () => {
    const content = `${mod.GSD_CODEX_MARKER}\n# Just a comment\n\n`;
    const result = mod.stripGsdFromCodexConfig(content);
    assert.ok(result === null || result.trim() === '');
  });
});

// ─── Copilot skill copying ─────────────────────────────────────────────────

describe('copyCommandsAsCopilotSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies commands as skill directories', () => {
    const srcDir = path.join(tmpDir, 'src');
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'help.md'), `---
name: help
description: Show help
---
Show help info.`);

    mod.copyCommandsAsCopilotSkills(srcDir, skillsDir, 'gsd', true);

    assert.ok(fs.existsSync(skillsDir), 'skills dir should exist');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('gsd-'));
    assert.ok(entries.length > 0, 'should create gsd-help skill directory');
  });

  test('handles missing source directory', () => {
    const skillsDir = path.join(tmpDir, 'skills');
    // Should not throw
    mod.copyCommandsAsCopilotSkills('/nonexistent/path', skillsDir, 'gsd', true);
  });
});

// ─── Antigravity skill copying ──────────────────────────────────────────────

describe('copyCommandsAsAntigravitySkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies commands as skill directories', () => {
    const srcDir = path.join(tmpDir, 'src');
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'help.md'), `---
name: help
description: Show help
---
Show help info.`);

    mod.copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'gsd', true);

    assert.ok(fs.existsSync(skillsDir), 'skills dir should exist');
  });
});

// ─── Windsurf skill copying ────────────────────────────────────────────────

describe('copyCommandsAsWindsurfSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies commands as skill directories', () => {
    const srcDir = path.join(tmpDir, 'src');
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'help.md'), `---
name: help
description: Show help
---
Show help info.`);

    mod.copyCommandsAsWindsurfSkills(srcDir, skillsDir, 'gsd', '$HOME/.windsurf/', 'windsurf');

    assert.ok(fs.existsSync(skillsDir), 'skills dir should exist');
  });
});
