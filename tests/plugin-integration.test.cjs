/**
 * GSD Tools Tests - Plugin Integration
 *
 * Validates plugin structure, JSON validity, absence of Apex content,
 * and absence of removed commands from claude-mcp-ecosystem.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

describe('plugin structure', () => {
  test('claude-mcp-ecosystem plugin.json exists and is valid JSON', () => {
    const pluginPath = path.join(
      PLUGINS_DIR,
      'claude-mcp-ecosystem',
      '.claude-plugin',
      'plugin.json'
    );
    assert.ok(fs.existsSync(pluginPath), 'plugin.json should exist for claude-mcp-ecosystem');
    const content = fs.readFileSync(pluginPath, 'utf8');
    const parsed = JSON.parse(content); // throws if invalid
    assert.ok(parsed, 'Should parse successfully');
  });

  test('claude-code-factory plugin.json exists and is valid JSON', () => {
    const pluginPath = path.join(
      PLUGINS_DIR,
      'claude-code-factory',
      '.claude-plugin',
      'plugin.json'
    );
    assert.ok(fs.existsSync(pluginPath), 'plugin.json should exist for claude-code-factory');
    const content = fs.readFileSync(pluginPath, 'utf8');
    const parsed = JSON.parse(content); // throws if invalid
    assert.ok(parsed, 'Should parse successfully');
  });

  test('zero Apex content in plugins/ directory', () => {
    const apexPatterns = ['Apex', 'apex', 'IntelliSense Provider Network'];

    function scanDir(dir) {
      if (!fs.existsSync(dir)) return [];
      const violations = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === '.DS_Store' || entry.name === 'node_modules') continue;
        if (entry.isDirectory()) {
          violations.push(...scanDir(fullPath));
        } else {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const pattern of apexPatterns) {
              if (content.includes(pattern)) {
                violations.push(`${fullPath}: contains "${pattern}"`);
              }
            }
          } catch {
            // Skip binary files
          }
        }
      }
      return violations;
    }

    const violations = scanDir(PLUGINS_DIR);
    assert.strictEqual(
      violations.length,
      0,
      `Found Apex content in plugins:\n${violations.join('\n')}`
    );
  });

  test('marketplace.json registers all local plugins', () => {
    const marketplacePath = path.join(
      PLUGINS_DIR,
      'claude-mcp-ecosystem',
      '.claude-plugin',
      'marketplace.json'
    );
    assert.ok(fs.existsSync(marketplacePath), 'marketplace.json should exist');
    const content = fs.readFileSync(marketplacePath, 'utf8');
    const marketplace = JSON.parse(content);
    assert.ok(Array.isArray(marketplace.plugins), 'plugins should be an array');

    const pluginNames = marketplace.plugins.map(p => p.name);
    assert.ok(pluginNames.includes('claude-mcp-ecosystem'), 'marketplace should register claude-mcp-ecosystem');
    assert.ok(pluginNames.includes('claude-code-factory'), 'marketplace should register claude-code-factory');

    // Validate source paths resolve to existing directories
    for (const plugin of marketplace.plugins) {
      const resolvedSource = path.resolve(
        path.dirname(marketplacePath),
        plugin.source
      );
      assert.ok(
        fs.existsSync(resolvedSource),
        `Plugin "${plugin.name}" source path should resolve to existing directory: ${resolvedSource}`
      );
    }
  });

  test('no plan.md, build.md, or status.md in claude-mcp-ecosystem commands/', () => {
    const commandsDir = path.join(PLUGINS_DIR, 'claude-mcp-ecosystem', 'commands');
    assert.ok(fs.existsSync(commandsDir), 'commands/ directory should exist');

    const forbidden = ['plan.md', 'build.md', 'status.md'];
    const files = fs.readdirSync(commandsDir);

    for (const f of forbidden) {
      assert.ok(
        !files.includes(f),
        `commands/ should not contain ${f}`
      );
    }
  });
});
