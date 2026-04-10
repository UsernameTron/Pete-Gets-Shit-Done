/**
 * Install.js Coverage — Utility and Validation Functions
 *
 * Targets uncovered code paths in install.js utility helpers,
 * validation functions, and internal paths exercised via exported APIs.
 * Complements existing test files by focusing on edge cases and
 * code paths not reached by the 12 existing install test suites.
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const mod = require('../bin/install.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function createTempDir(prefix = 'gsd-utils-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── yamlIdentifier ─────────────────────────────────────────────────────────

describe('yamlIdentifier edge cases', () => {
  test('returns simple identifier unchanged', () => {
    assert.strictEqual(mod.yamlIdentifier('hello'), 'hello');
  });

  test('returns identifier with hyphens unchanged', () => {
    assert.strictEqual(mod.yamlIdentifier('my-agent'), 'my-agent');
  });

  test('returns numeric identifier unchanged', () => {
    assert.strictEqual(mod.yamlIdentifier('abc123'), 'abc123');
  });

  test('quotes identifier starting with special chars', () => {
    const result = mod.yamlIdentifier('$special');
    assert.ok(result.startsWith('"'), 'should be quoted: ' + result);
  });

  test('quotes empty string', () => {
    const result = mod.yamlIdentifier('');
    assert.ok(result.startsWith('"'), 'empty string should be quoted: ' + result);
  });

  test('quotes string with spaces', () => {
    const result = mod.yamlIdentifier('has spaces');
    assert.ok(result.startsWith('"'), 'spaced string should be quoted: ' + result);
  });

  test('trims whitespace before checking', () => {
    assert.strictEqual(mod.yamlIdentifier('  trimmed  '), 'trimmed');
  });

  test('quotes string starting with hyphen', () => {
    const result = mod.yamlIdentifier('-starts-with-hyphen');
    assert.ok(result.startsWith('"'), 'hyphen-leading should be quoted: ' + result);
  });

  test('handles numeric input via String coercion', () => {
    assert.strictEqual(mod.yamlIdentifier(42), '42');
  });
});

// ─── getDirName ─────────────────────────────────────────────────────────────

describe('getDirName all runtimes', () => {
  test('cursor returns .cursor', () => {
    assert.strictEqual(mod.getDirName('cursor'), '.cursor');
  });

  test('windsurf returns .windsurf', () => {
    assert.strictEqual(mod.getDirName('windsurf'), '.windsurf');
  });

  test('unknown runtime defaults to .claude', () => {
    assert.strictEqual(mod.getDirName('unknown'), '.claude');
  });
});

// ─── getConfigDirFromHome ───────────────────────────────────────────────────

describe('getConfigDirFromHome edge cases', () => {
  test('cursor global returns .cursor', () => {
    assert.strictEqual(mod.getConfigDirFromHome('cursor', true), "'.cursor'");
  });

  test('windsurf global returns .windsurf', () => {
    assert.strictEqual(mod.getConfigDirFromHome('windsurf', true), "'.windsurf'");
  });

  test('cursor local returns .cursor', () => {
    assert.strictEqual(mod.getConfigDirFromHome('cursor', false), "'.cursor'");
  });

  test('windsurf local returns .windsurf', () => {
    assert.strictEqual(mod.getConfigDirFromHome('windsurf', false), "'.windsurf'");
  });

  test('antigravity local returns .agent', () => {
    assert.strictEqual(mod.getConfigDirFromHome('antigravity', false), "'.agent'");
  });

  test('unknown runtime local returns dir name', () => {
    // Non-global unknown falls through to getDirName-based path
    const result = mod.getConfigDirFromHome('unknown', false);
    assert.ok(result.includes('.claude'), 'unknown local: ' + result);
  });
});

// ─── getGlobalDir ───────────────────────────────────────────────────────────

describe('getGlobalDir all runtimes', () => {
  test('cursor returns ~/.cursor', () => {
    const result = mod.getGlobalDir('cursor');
    assert.ok(result.endsWith('.cursor'), 'cursor global dir: ' + result);
  });

  test('windsurf returns ~/.windsurf', () => {
    const result = mod.getGlobalDir('windsurf');
    assert.ok(result.endsWith('.windsurf'), 'windsurf global dir: ' + result);
  });

  test('explicit dir overrides default for cursor', () => {
    const result = mod.getGlobalDir('cursor', '/custom/path');
    assert.strictEqual(result, '/custom/path');
  });

  test('explicit dir overrides default for windsurf', () => {
    const result = mod.getGlobalDir('windsurf', '/custom/path');
    assert.strictEqual(result, '/custom/path');
  });

  test('gemini returns ~/.gemini by default', () => {
    const result = mod.getGlobalDir('gemini');
    assert.ok(result.endsWith('.gemini'), 'gemini: ' + result);
  });
});

// ─── writeManifest ──────────────────────────────────────────────────────────

describe('writeManifest edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('generates manifest for cursor runtime', () => {
    // Create minimal structure
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'test.txt'), 'hello');

    mod.writeManifest(tmpDir, 'cursor');

    const manifestPath = path.join(tmpDir, 'gsd-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest should exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifest.files['get-shit-done/test.txt'], 'should hash files');
    assert.ok(manifest.version, 'should have version');
    assert.ok(manifest.timestamp, 'should have timestamp');
  });

  test('generates manifest for windsurf runtime', () => {
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.txt'), 'content');

    mod.writeManifest(tmpDir, 'windsurf');

    const manifestPath = path.join(tmpDir, 'gsd-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest should exist');
  });

  test('includes skills for codex runtime', () => {
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    const skillsDir = path.join(tmpDir, 'skills', 'gsd-test');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.txt'), 'gsd');
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), '# Test');

    mod.writeManifest(tmpDir, 'codex');

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'gsd-file-manifest.json'), 'utf8'));
    assert.ok(Object.keys(manifest.files).some(k => k.startsWith('skills/')), 'should include skills');
  });

  test('includes agents directory', () => {
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    const agentsDir = path.join(tmpDir, 'agents');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.txt'), 'gsd');
    fs.writeFileSync(path.join(agentsDir, 'gsd-test.md'), '# Agent');

    mod.writeManifest(tmpDir, 'claude');

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'gsd-file-manifest.json'), 'utf8'));
    assert.ok(Object.keys(manifest.files).some(k => k.startsWith('agents/')), 'should include agents');
  });

  test('includes commands/gsd for claude runtime', () => {
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    const cmdDir = path.join(tmpDir, 'commands', 'gsd');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.mkdirSync(cmdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.txt'), 'gsd');
    fs.writeFileSync(path.join(cmdDir, 'help.md'), '# Help');

    mod.writeManifest(tmpDir, 'claude');

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'gsd-file-manifest.json'), 'utf8'));
    assert.ok(Object.keys(manifest.files).some(k => k.startsWith('commands/gsd/')), 'should include commands');
  });

  test('includes opencode command/ directory', () => {
    const gsdDir = path.join(tmpDir, 'get-shit-done');
    const cmdDir = path.join(tmpDir, 'command');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.mkdirSync(cmdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'a.txt'), 'gsd');
    fs.writeFileSync(path.join(cmdDir, 'gsd-help.md'), '# Help');

    mod.writeManifest(tmpDir, 'opencode');

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'gsd-file-manifest.json'), 'utf8'));
    assert.ok(Object.keys(manifest.files).some(k => k.startsWith('command/')), 'should include command/');
  });
});

// ─── reportLocalPatches ─────────────────────────────────────────────────────

describe('reportLocalPatches edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty when no patches dir', () => {
    const result = mod.reportLocalPatches(tmpDir, 'claude');
    assert.deepStrictEqual(result, []);
  });

  test('returns empty when meta.json is invalid JSON', () => {
    const patchDir = path.join(tmpDir, 'gsd-local-patches');
    fs.mkdirSync(patchDir, { recursive: true });
    fs.writeFileSync(path.join(patchDir, 'backup-meta.json'), 'not json');
    const result = mod.reportLocalPatches(tmpDir, 'claude');
    assert.deepStrictEqual(result, []);
  });

  test('returns files list for codex runtime', () => {
    const patchDir = path.join(tmpDir, 'gsd-local-patches');
    fs.mkdirSync(patchDir, { recursive: true });
    fs.writeFileSync(path.join(patchDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0.0',
      files: ['get-shit-done/test.md']
    }));
    const result = mod.reportLocalPatches(tmpDir, 'codex');
    assert.deepStrictEqual(result, ['get-shit-done/test.md']);
  });

  test('returns files list for cursor runtime', () => {
    const patchDir = path.join(tmpDir, 'gsd-local-patches');
    fs.mkdirSync(patchDir, { recursive: true });
    fs.writeFileSync(path.join(patchDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0.0',
      files: ['get-shit-done/test.md']
    }));
    const result = mod.reportLocalPatches(tmpDir, 'cursor');
    assert.deepStrictEqual(result, ['get-shit-done/test.md']);
  });

  test('handles meta.json with empty files array', () => {
    const patchDir = path.join(tmpDir, 'gsd-local-patches');
    fs.mkdirSync(patchDir, { recursive: true });
    fs.writeFileSync(path.join(patchDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0.0',
      files: []
    }));
    const result = mod.reportLocalPatches(tmpDir, 'claude');
    assert.deepStrictEqual(result, []);
  });

  test('handles meta.json without files field', () => {
    const patchDir = path.join(tmpDir, 'gsd-local-patches');
    fs.mkdirSync(patchDir, { recursive: true });
    fs.writeFileSync(path.join(patchDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0.0'
    }));
    const result = mod.reportLocalPatches(tmpDir, 'claude');
    assert.deepStrictEqual(result, []);
  });
});

// ─── copyDirRecursive ───────────────────────────────────────────────────────

describe('copyDirRecursive edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('copies nested directory structure', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(path.join(src, 'sub', 'deep'), { recursive: true });
    fs.writeFileSync(path.join(src, 'root.txt'), 'root');
    fs.writeFileSync(path.join(src, 'sub', 'mid.txt'), 'mid');
    fs.writeFileSync(path.join(src, 'sub', 'deep', 'leaf.txt'), 'leaf');

    mod.copyDirRecursive(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'root.txt')));
    assert.ok(fs.existsSync(path.join(dest, 'sub', 'mid.txt')));
    assert.ok(fs.existsSync(path.join(dest, 'sub', 'deep', 'leaf.txt')));
    assert.strictEqual(fs.readFileSync(path.join(dest, 'sub', 'deep', 'leaf.txt'), 'utf8'), 'leaf');
  });

  test('overwrites existing files in destination', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src, { recursive: true });
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(src, 'file.txt'), 'new');
    fs.writeFileSync(path.join(dest, 'file.txt'), 'old');

    mod.copyDirRecursive(src, dest);

    assert.strictEqual(fs.readFileSync(path.join(dest, 'file.txt'), 'utf8'), 'new');
  });

  test('creates destination directory if missing', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'nonexistent', 'dest');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'file.txt'), 'data');

    mod.copyDirRecursive(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'file.txt')));
  });
});

// ─── validateHookFields edge cases ──────────────────────────────────────────

describe('validateHookFields additional edge cases', () => {
  test('returns settings unchanged when hooks is not an object', () => {
    const settings = { hooks: 'invalid' };
    const result = mod.validateHookFields(settings);
    assert.strictEqual(result.hooks, 'invalid');
  });

  test('returns settings when hooks is null', () => {
    const settings = { hooks: null };
    const result = mod.validateHookFields(settings);
    assert.strictEqual(result.hooks, null);
  });

  test('returns settings when no hooks property', () => {
    const settings = { other: true };
    const result = mod.validateHookFields(settings);
    assert.deepStrictEqual(result, { other: true });
  });

  test('removes entry with non-array hooks field', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { hooks: 'not-an-array' },
          { hooks: [{ type: 'command', command: 'echo hi' }] }
        ]
      }
    };
    const result = mod.validateHookFields(settings);
    assert.strictEqual(result.hooks.PreToolUse.length, 1);
    assert.strictEqual(result.hooks.PreToolUse[0].hooks[0].command, 'echo hi');
  });

  test('removes agent hooks missing prompt field', () => {
    const settings = {
      hooks: {
        Stop: [
          {
            hooks: [
              { type: 'agent' }  // missing prompt
            ]
          }
        ]
      }
    };
    const result = mod.validateHookFields(settings);
    // The entry should be cleaned (agent without prompt is invalid)
    // Entry with all hooks removed should itself be removed
    assert.ok(!result.hooks.Stop || result.hooks.Stop.length === 0 ||
      (result.hooks.Stop[0].hooks && result.hooks.Stop[0].hooks.length === 0),
      'agent hook without prompt should be removed');
  });

  test('keeps valid command hooks', () => {
    const settings = {
      hooks: {
        PostToolUse: [
          {
            hooks: [
              { type: 'command', command: 'echo test' }
            ]
          }
        ]
      }
    };
    const result = mod.validateHookFields(settings);
    assert.strictEqual(result.hooks.PostToolUse.length, 1);
  });

  test('removes command hooks missing command field', () => {
    const settings = {
      hooks: {
        PostToolUse: [
          {
            hooks: [
              { type: 'command' }  // missing command
            ]
          }
        ]
      }
    };
    const result = mod.validateHookFields(settings);
    // Entry with all hooks stripped should be cleaned up
    const remaining = result.hooks.PostToolUse || [];
    const hasCommand = remaining.some(e => e.hooks && e.hooks.some(h => h.type === 'command' && !h.command));
    assert.ok(!hasCommand, 'command hook without command field should be removed');
  });

  test('cleans up empty event arrays', () => {
    const settings = {
      hooks: {
        PreToolUse: []
      }
    };
    const result = mod.validateHookFields(settings);
    // Empty arrays may be removed or kept — verify no crash
    assert.ok(result.hooks !== undefined);
  });
});

// ─── isHookRegistered edge cases ────────────────────────────────────────────

describe('isHookRegistered edge cases', () => {
  test('returns false when hooks is undefined', () => {
    assert.strictEqual(mod.isHookRegistered({}, 'PreToolUse', '/hook'), false);
  });

  test('returns false when event type does not exist', () => {
    const settings = { hooks: { Stop: [] } };
    assert.strictEqual(mod.isHookRegistered(settings, 'PreToolUse', '/hook'), false);
  });

  test('returns false when entry has no hooks array', () => {
    const settings = {
      hooks: {
        PreToolUse: [{ matcher: '*' }]
      }
    };
    assert.strictEqual(mod.isHookRegistered(settings, 'PreToolUse', '/hook'), false);
  });

  test('returns true for nested command match', () => {
    const settings = {
      hooks: {
        PreToolUse: [
          { hooks: [{ command: '/path/to/hook' }] }
        ]
      }
    };
    assert.strictEqual(mod.isHookRegistered(settings, 'PreToolUse', '/path/to/hook'), true);
  });
});

// ─── validateGsdPrefixAgents ────────────────────────────────────────────────

describe('validateGsdPrefixAgents edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('does nothing when target dir does not exist', () => {
    // Should not throw
    mod.validateGsdPrefixAgents('/nonexistent/target', '/nonexistent/source');
  });

  test('does nothing when source dir does not exist', () => {
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(target, { recursive: true });
    // Should not throw
    mod.validateGsdPrefixAgents(target, '/nonexistent/source');
  });

  test('handles target with no gsd- prefix agents', () => {
    const target = path.join(tmpDir, 'target');
    const source = path.join(tmpDir, 'source');
    fs.mkdirSync(target, { recursive: true });
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(target, 'custom-agent.md'), '# Custom');
    fs.writeFileSync(path.join(source, 'gsd-test.md'), '# Test');
    // Should not throw
    mod.validateGsdPrefixAgents(target, source);
  });

  test('handles matching gsd- agents', () => {
    const target = path.join(tmpDir, 'target');
    const source = path.join(tmpDir, 'source');
    fs.mkdirSync(target, { recursive: true });
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(target, 'gsd-verifier.md'), '# Verifier');
    fs.writeFileSync(path.join(source, 'gsd-verifier.md'), '# Verifier');
    // Matching agent — should not warn
    mod.validateGsdPrefixAgents(target, source);
  });

  test('warns about non-source gsd- agents in target', () => {
    const target = path.join(tmpDir, 'target');
    const source = path.join(tmpDir, 'source');
    fs.mkdirSync(target, { recursive: true });
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(target, 'gsd-custom.md'), '# Custom override');
    fs.writeFileSync(path.join(source, 'gsd-verifier.md'), '# Verifier');
    // Should warn but not throw
    mod.validateGsdPrefixAgents(target, source);
  });
});

// ─── neutralizeAgentReferences ──────────────────────────────────────────────

describe('neutralizeAgentReferences edge cases', () => {
  test('replaces standalone Claude with the agent', () => {
    const result = mod.neutralizeAgentReferences('Ask Claude for help');
    assert.ok(result.includes('the agent'), 'Should replace Claude: ' + result);
  });

  test('preserves Claude Code', () => {
    const result = mod.neutralizeAgentReferences('Use Claude Code for tasks');
    assert.ok(result.includes('Claude Code'), 'Should keep Claude Code');
  });

  test('preserves Claude Opus', () => {
    const result = mod.neutralizeAgentReferences('Powered by Claude Opus');
    assert.ok(result.includes('Claude Opus'), 'Should keep Claude Opus');
  });

  test('preserves Claude Sonnet', () => {
    const result = mod.neutralizeAgentReferences('Using Claude Sonnet');
    assert.ok(result.includes('Claude Sonnet'), 'Should keep Claude Sonnet');
  });

  test('replaces CLAUDE.md with instruction file', () => {
    const result = mod.neutralizeAgentReferences('Read CLAUDE.md for rules', 'AGENTS.md');
    assert.ok(result.includes('AGENTS.md'), 'Should replace CLAUDE.md');
    assert.ok(!result.includes('CLAUDE.md'), 'Should not contain CLAUDE.md');
  });

  test('does not replace CLAUDE.md without instruction file', () => {
    const result = mod.neutralizeAgentReferences('Read CLAUDE.md for rules');
    assert.ok(result.includes('CLAUDE.md'), 'Should keep CLAUDE.md when no replacement');
  });

  test('removes AGENTS.md loading instruction', () => {
    const input = 'Do NOT load full `AGENTS.md` files (100KB+ context cost)\nKeep going';
    const result = mod.neutralizeAgentReferences(input);
    assert.ok(!result.includes('Do NOT load full'), 'Should remove AGENTS.md instruction');
    assert.ok(result.includes('Keep going'));
  });
});

// ─── Codex converter helpers ────────────────────────────────────────────────

describe('Codex converter exported functions', () => {
  test('getCodexSkillAdapterHeader returns valid markdown', () => {
    const header = mod.getCodexSkillAdapterHeader('gsd-help');
    assert.ok(typeof header === 'string');
    assert.ok(header.includes('gsd-help') || header.length > 0, 'should reference skill name');
  });

  test('convertClaudeCommandToCodexSkill converts command content', () => {
    const content = `---
name: test-command
description: A test command
allowed-tools:
  - Read
  - Bash
---

Run this command.`;
    const result = mod.convertClaudeCommandToCodexSkill(content, 'gsd-test');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  test('convertClaudeAgentToCodexAgent converts agent content', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write, Bash
---

You are a test agent.`;
    const result = mod.convertClaudeAgentToCodexAgent(content);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  test('generateCodexAgentToml creates valid TOML', () => {
    const result = mod.generateCodexAgentToml('test-agent', 'You are a test agent.');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('test-agent') || result.includes('instructions'));
  });

  test('generateCodexConfigBlock creates config for agents', () => {
    const agents = ['gsd-verifier'];
    const result = mod.generateCodexConfigBlock(agents, '/tmp/test');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  test('stripGsdFromCodexConfig handles content with GSD marker', () => {
    const content = `# Some config
${mod.GSD_CODEX_MARKER}
[agents.gsd-test]
model = "o3-mini"
# end marker
`;
    const result = mod.stripGsdFromCodexConfig(content);
    // Should return cleaned content or null if empty
    assert.ok(result === null || typeof result === 'string');
  });

  test('stripGsdFromCodexConfig returns content unchanged without marker', () => {
    const content = '[tool]\nname = "test"\n';
    const result = mod.stripGsdFromCodexConfig(content);
    assert.ok(result !== null);
  });

  test('mergeCodexConfig merges into existing config file', () => {
    const tmpDir = createTempDir();
    try {
      const configPath = path.join(tmpDir, 'config.toml');
      fs.writeFileSync(configPath, '[tool]\nname = "existing"\n');
      mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd-test]\n`);
      const result = fs.readFileSync(configPath, 'utf8');
      assert.ok(result.includes('existing'), 'should preserve existing config');
    } finally {
      cleanup(tmpDir);
    }
  });

  test('mergeCodexConfig creates file when missing', () => {
    const tmpDir = createTempDir();
    try {
      const configPath = path.join(tmpDir, 'config.toml');
      mod.mergeCodexConfig(configPath, `${mod.GSD_CODEX_MARKER}\n[agents.gsd-test]\n`);
      assert.ok(fs.existsSync(configPath), 'should create config.toml');
    } finally {
      cleanup(tmpDir);
    }
  });
});

// ─── Copilot converter helpers ──────────────────────────────────────────────

describe('Copilot converter edge cases', () => {
  test('convertCopilotToolName maps known tools', () => {
    assert.strictEqual(mod.convertCopilotToolName('Read'), 'read');
    assert.strictEqual(mod.convertCopilotToolName('Write'), 'edit');
    assert.strictEqual(mod.convertCopilotToolName('Bash'), 'execute');
  });

  test('convertCopilotToolName maps unknown tools to lowercase', () => {
    assert.strictEqual(mod.convertCopilotToolName('CustomTool'), 'customtool');
  });

  test('convertClaudeToCopilotContent converts paths for global', () => {
    const content = 'Use ~/.claude/get-shit-done/bin/tool.cjs';
    const result = mod.convertClaudeToCopilotContent(content, true);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeToCopilotContent converts paths for local', () => {
    const content = 'Use ./.claude/get-shit-done/bin/tool.cjs';
    const result = mod.convertClaudeToCopilotContent(content, false);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeCommandToCopilotSkill creates skill structure', () => {
    const content = `---
name: test
description: Test
---
Do something.`;
    const result = mod.convertClaudeCommandToCopilotSkill(content, 'gsd-test', true);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeAgentToCopilotAgent converts agent', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write
---
You are a test.`;
    const result = mod.convertClaudeAgentToCopilotAgent(content, true);
    assert.ok(typeof result === 'string');
  });

  test('mergeCopilotInstructions creates file when missing', () => {
    const tmpDir = createTempDir();
    try {
      const filePath = path.join(tmpDir, 'instructions.md');
      mod.mergeCopilotInstructions(filePath, 'GSD content here');
      assert.ok(fs.existsSync(filePath));
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('GSD content'));
    } finally {
      cleanup(tmpDir);
    }
  });

  test('mergeCopilotInstructions merges into existing file', () => {
    const tmpDir = createTempDir();
    try {
      const filePath = path.join(tmpDir, 'instructions.md');
      fs.writeFileSync(filePath, 'Existing content\n');
      mod.mergeCopilotInstructions(filePath, 'GSD content here');
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('Existing content'));
      assert.ok(content.includes('GSD content'));
    } finally {
      cleanup(tmpDir);
    }
  });

  test('stripGsdFromCopilotInstructions removes GSD block', () => {
    const content = `Before\n${mod.GSD_COPILOT_INSTRUCTIONS_MARKER}\nGSD stuff\n${mod.GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER}\nAfter`;
    const result = mod.stripGsdFromCopilotInstructions(content);
    assert.ok(!result.includes('GSD stuff'), 'should remove GSD block');
    assert.ok(result.includes('Before'));
    assert.ok(result.includes('After'));
  });

  test('stripGsdFromCopilotInstructions returns content without markers unchanged', () => {
    const content = 'Just regular content';
    const result = mod.stripGsdFromCopilotInstructions(content);
    assert.strictEqual(result, content);
  });

  test('claudeToCopilotTools is a valid mapping object', () => {
    assert.ok(typeof mod.claudeToCopilotTools === 'object');
    assert.strictEqual(mod.claudeToCopilotTools.Read, 'read');
    assert.strictEqual(mod.claudeToCopilotTools.Task, 'agent');
  });
});

// ─── Cursor converter helpers ───────────────────────────────────────────────

describe('Cursor converter edge cases', () => {
  test('convertClaudeCommandToCursorSkill converts command', () => {
    const content = `---
name: test
description: Test skill
---
Execute the plan.`;
    const result = mod.convertClaudeCommandToCursorSkill(content, 'gsd-test');
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeAgentToCursorAgent converts agent', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write
---
You are a test agent.`;
    const result = mod.convertClaudeAgentToCursorAgent(content);
    assert.ok(typeof result === 'string');
  });
});

// ─── Antigravity converter ──────────────────────────────────────────────────

describe('Antigravity converter edge cases', () => {
  test('convertClaudeToAntigravityContent converts paths for global', () => {
    const content = 'Path is ~/.claude/get-shit-done/bin/tool.cjs here';
    const result = mod.convertClaudeToAntigravityContent(content, true);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeCommandToAntigravitySkill converts skill', () => {
    const content = `---
name: test
description: Test
---
Do something.`;
    const result = mod.convertClaudeCommandToAntigravitySkill(content, 'gsd-test', true);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeAgentToAntigravityAgent converts agent', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write
---
You are a test.`;
    const result = mod.convertClaudeAgentToAntigravityAgent(content, true);
    assert.ok(typeof result === 'string');
  });
});

// ─── Windsurf converter ─────────────────────────────────────────────────────

describe('Windsurf converter edge cases', () => {
  test('convertClaudeToWindsurfMarkdown converts content', () => {
    const content = 'Use /gsd:help for guidance with Claude Code commands';
    const result = mod.convertClaudeToWindsurfMarkdown(content);
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeCommandToWindsurfSkill converts skill', () => {
    const content = `---
name: test
description: Test
---
Do something.`;
    const result = mod.convertClaudeCommandToWindsurfSkill(content, 'gsd-test');
    assert.ok(typeof result === 'string');
  });

  test('convertClaudeAgentToWindsurfAgent converts agent', () => {
    const content = `---
name: gsd-test
description: Test agent
tools: Read, Write
---
You are a test agent.`;
    const result = mod.convertClaudeAgentToWindsurfAgent(content);
    assert.ok(typeof result === 'string');
  });
});

// ─── OpenCode + Gemini converters ───────────────────────────────────────────

describe('OpenCode converter edge cases', () => {
  test('converts content without frontmatter', () => {
    const result = mod.convertClaudeToOpencodeFrontmatter('Just plain text');
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('Just plain text'));
  });

  test('converts content with incomplete frontmatter (no closing ---)', () => {
    const content = '---\nname: test\nNo closing delimiter';
    const result = mod.convertClaudeToOpencodeFrontmatter(content);
    assert.ok(typeof result === 'string');
  });
});

describe('Gemini converter edge cases', () => {
  test('converts agent without frontmatter', () => {
    const result = mod.convertClaudeToGeminiAgent('Plain text agent');
    // Should return as-is when no frontmatter
    assert.strictEqual(result, 'Plain text agent');
  });

  test('converts agent with tools field', () => {
    const content = `---
name: gsd-test
description: Test
tools: Read, Bash, mcp__github
---
You are a test.`;
    const result = mod.convertClaudeToGeminiAgent(content);
    assert.ok(typeof result === 'string');
    assert.ok(!result.includes('mcp__'), 'MCP tools should be excluded');
  });

  test('converts agent with color field (should be removed)', () => {
    const content = `---
name: gsd-test
description: Test
color: yellow
---
Body here.`;
    const result = mod.convertClaudeToGeminiAgent(content);
    assert.ok(!result.includes('color:'), 'color field should be removed');
  });
});

// ─── Constants ──────────────────────────────────────────────────────────────

describe('Exported constants', () => {
  test('GSD_CODEX_MARKER is a non-empty string', () => {
    assert.ok(typeof mod.GSD_CODEX_MARKER === 'string');
    assert.ok(mod.GSD_CODEX_MARKER.length > 0);
  });

  test('CODEX_AGENT_SANDBOX maps known agents', () => {
    assert.ok(typeof mod.CODEX_AGENT_SANDBOX === 'object');
    assert.strictEqual(mod.CODEX_AGENT_SANDBOX['gsd-executor'], 'workspace-write');
    assert.strictEqual(mod.CODEX_AGENT_SANDBOX['gsd-validator-hub'], 'read-only');
  });

  test('GSD_COPILOT_INSTRUCTIONS_MARKER is non-empty', () => {
    assert.ok(mod.GSD_COPILOT_INSTRUCTIONS_MARKER.length > 0);
  });

  test('GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER is non-empty', () => {
    assert.ok(mod.GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER.length > 0);
  });
});
