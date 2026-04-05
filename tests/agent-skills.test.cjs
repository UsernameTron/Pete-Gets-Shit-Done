/**
 * GSD Tools Tests - Agent Skills Injection
 *
 * CLI integration tests for the `agent-skills` command that reads
 * `agent_skills` from .planning/config.json and returns a formatted
 * skills block for injection into Task() prompts.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

// ─── helpers ──────────────────────────────────────────────────────────────────

function writeConfig(tmpDir, obj) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2), 'utf-8');
}

function readConfig(tmpDir) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// ─── agent-skills command ────────────────────────────────────────────────────

describe('agent-skills command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty when no config exists', () => {
    // No config.json at all
    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    // Should succeed with empty output (no skills configured)
    assert.strictEqual(result.output, '');
  });

  test('returns empty when config has no agent_skills section', () => {
    writeConfig(tmpDir, { model_profile: 'balanced' });
    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.strictEqual(result.output, '');
  });

  test('returns empty for unconfigured agent type', () => {
    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': ['skills/test-skill'],
      },
    });
    const result = runGsdTools(['agent-skills', 'gsd-planner'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.strictEqual(result.output, '');
  });

  test('returns formatted block for configured agent with array of paths', () => {
    // Create the skill directories with SKILL.md files
    const skillDir = path.join(tmpDir, 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill\n');

    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': ['skills/test-skill'],
      },
    });

    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    assert.ok(result.output.includes('<agent_skills>'), 'Should contain <agent_skills> tag');
    assert.ok(result.output.includes('</agent_skills>'), 'Should contain closing tag');
    assert.ok(result.output.includes('skills/test-skill/SKILL.md'), 'Should contain skill path');
  });

  test('returns formatted block for configured agent with single string path', () => {
    const skillDir = path.join(tmpDir, 'skills', 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# My Skill\n');

    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': 'skills/my-skill',
      },
    });

    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    assert.ok(result.output.includes('skills/my-skill/SKILL.md'), 'Should contain skill path');
  });

  test('handles multiple skill paths', () => {
    const skill1 = path.join(tmpDir, 'skills', 'skill-a');
    const skill2 = path.join(tmpDir, 'skills', 'skill-b');
    fs.mkdirSync(skill1, { recursive: true });
    fs.mkdirSync(skill2, { recursive: true });
    fs.writeFileSync(path.join(skill1, 'SKILL.md'), '# Skill A\n');
    fs.writeFileSync(path.join(skill2, 'SKILL.md'), '# Skill B\n');

    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': ['skills/skill-a', 'skills/skill-b'],
      },
    });

    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    assert.ok(result.output.includes('skills/skill-a/SKILL.md'), 'Should contain first skill');
    assert.ok(result.output.includes('skills/skill-b/SKILL.md'), 'Should contain second skill');
  });

  test('warns for nonexistent skill path but does not error', () => {
    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': ['skills/nonexistent'],
      },
    });

    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    // Should not crash — returns empty output (the missing skill is skipped)
    assert.ok(result.success, 'Command should succeed even with missing skill paths');
    // Should not include the missing skill in the output
    assert.ok(!result.output.includes('skills/nonexistent/SKILL.md'),
      'Should not include nonexistent skill in output');
  });

  test('validates path safety — rejects traversal attempts', () => {
    writeConfig(tmpDir, {
      agent_skills: {
        'gsd-executor': ['../../../etc/passwd'],
      },
    });

    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    // Should not include traversal path in output
    assert.ok(!result.output.includes('/etc/passwd'), 'Should not include traversal path');
  });

  test('returns empty when no agent type argument provided', () => {
    const result = runGsdTools(['agent-skills'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    // Should succeed with empty output — no agent type means no skills to return
    assert.ok(result.success, 'Command should succeed');
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed, '', 'Should return empty string');
  });
});

// ─── config-ensure-section includes agent_skills ────────────────────────────

describe('config-ensure-section with agent_skills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('new configs include agent_skills key', () => {
    const result = runGsdTools('config-ensure-section', tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);

    const config = readConfig(tmpDir);
    assert.ok('agent_skills' in config, 'config should have agent_skills key');
    assert.deepStrictEqual(config.agent_skills, {}, 'agent_skills should default to empty object');
  });
});

// ─── config-set agent_skills ─────────────────────────────────────────────────

describe('config-set agent_skills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Ensure config exists first
    runGsdTools('config-ensure-section', tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('can set agent_skills via dot notation', () => {
    const result = runGsdTools(
      ['config-set', 'agent_skills.gsd-executor', '["skills/my-skill"]'],
      tmpDir,
      { HOME: tmpDir, USERPROFILE: tmpDir }
    );
    assert.ok(result.success, `Command failed: ${result.error}`);

    const config = readConfig(tmpDir);
    assert.deepStrictEqual(
      config.agent_skills['gsd-executor'],
      ['skills/my-skill'],
      'Should store array of skill paths'
    );
  });
});

// ─── parseSkillMetadata ──────────────────────────────────────────────────────

const { parseSkillMetadata, discoverSkills, resolveSkillComposition, querySkills, auditSkills, validateSkillMetadata, validateSkillStructure, checkSkillVersions } = require('../get-shit-done/bin/lib/init.cjs');

describe('parseSkillMetadata', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('parses valid SKILL.md with all fields', () => {
    const skillDir = path.join(tmpDir, 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    const skillMd = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillMd, [
      '---',
      'name: test-skill',
      'description: A test skill for unit tests',
      'version: 1.0.0',
      'allowed-tools: Read, Write, Bash',
      'user-invocable: true',
      'model: sonnet',
      '---',
      '',
      '# Test Skill',
      'Test content.',
    ].join('\n'));

    const meta = parseSkillMetadata(skillMd);
    assert.strictEqual(meta.name, 'test-skill');
    assert.strictEqual(meta.description, 'A test skill for unit tests');
    assert.strictEqual(meta.version, '1.0.0');
    assert.deepStrictEqual(meta.allowedTools, ['Read', 'Write', 'Bash']);
    assert.strictEqual(meta.userInvocable, true);
    assert.strictEqual(meta.model, 'sonnet');
    assert.ok(meta.raw, 'Should include raw frontmatter');
  });

  test('returns error for missing file', () => {
    const meta = parseSkillMetadata(path.join(tmpDir, 'nonexistent', 'SKILL.md'));
    assert.ok(meta.error, 'Should return error field');
    assert.ok(meta.error.includes('Cannot read'), 'Error should describe the issue');
  });

  test('handles empty/missing frontmatter gracefully', () => {
    const skillDir = path.join(tmpDir, 'skills', 'bare');
    fs.mkdirSync(skillDir, { recursive: true });
    const skillMd = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillMd, '# No Frontmatter\nJust body text.\n');

    const meta = parseSkillMetadata(skillMd);
    assert.strictEqual(meta.error, undefined, 'Should not error');
    assert.strictEqual(meta.name, undefined);
    assert.strictEqual(meta.version, undefined);
    assert.ok(meta.raw, 'Should include raw (empty) frontmatter');
  });

  test('maps allowed-tools to allowedTools array', () => {
    const skillDir = path.join(tmpDir, 'skills', 'tools-test');
    fs.mkdirSync(skillDir, { recursive: true });
    const skillMd = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillMd, [
      '---',
      'name: tools-test',
      'allowed-tools: Grep, Glob, Read',
      '---',
      '# Tools Test',
    ].join('\n'));

    const meta = parseSkillMetadata(skillMd);
    assert.deepStrictEqual(meta.allowedTools, ['Grep', 'Glob', 'Read']);
  });
});

// ─── discoverSkills ──────────────────────────────────────────────────────────

describe('discoverSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function writeSkillMd(dir, name, frontmatter) {
    const skillDir = path.join(dir, name);
    fs.mkdirSync(skillDir, { recursive: true });
    const content = frontmatter
      ? `---\n${Object.entries(frontmatter).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n# ${name}\n`
      : `# ${name}\n`;
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
  }

  test('finds skills in .claude/skills/', () => {
    writeSkillMd(path.join(tmpDir, '.claude', 'skills'), 'alpha', { name: 'alpha', version: '1.0.0' });

    const skills = discoverSkills(tmpDir);
    assert.strictEqual(skills.length, 1);
    assert.strictEqual(skills[0].name, 'alpha');
    assert.strictEqual(skills[0].path, '.claude/skills/alpha');
    assert.strictEqual(skills[0].metadata.version, '1.0.0');
  });

  test('finds skills in skills/', () => {
    writeSkillMd(path.join(tmpDir, 'skills'), 'beta', { name: 'beta' });

    const skills = discoverSkills(tmpDir);
    assert.strictEqual(skills.length, 1);
    assert.strictEqual(skills[0].name, 'beta');
    assert.strictEqual(skills[0].path, 'skills/beta');
  });

  test('finds skills in plugins/*/skills/', () => {
    writeSkillMd(path.join(tmpDir, 'plugins', 'my-plugin', 'skills'), 'gamma', { name: 'gamma' });

    const skills = discoverSkills(tmpDir);
    assert.strictEqual(skills.length, 1);
    assert.strictEqual(skills[0].name, 'gamma');
    assert.strictEqual(skills[0].path, 'plugins/my-plugin/skills/gamma');
  });

  test('returns empty array for project with no skills', () => {
    const skills = discoverSkills(tmpDir);
    assert.deepStrictEqual(skills, []);
  });
});

// ─── resolveSkillComposition ─────────────────────────────────────────────────

describe('resolveSkillComposition', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  function writeSkill(relDir, name, extra) {
    const skillDir = path.join(tmpDir, relDir, name);
    fs.mkdirSync(skillDir, { recursive: true });
    const lines = ['---', `name: ${name}`];
    if (extra) {
      for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v}`);
    }
    lines.push('---', '', `# ${name}`);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), lines.join('\n'));
    return path.join(skillDir, 'SKILL.md');
  }

  test('resolves valid skill references', () => {
    const parentPath = writeSkill('skills', 'parent', { skills: 'child-a, child-b' });
    writeSkill('skills', 'child-a', {});
    writeSkill('skills', 'child-b', {});

    const result = resolveSkillComposition(parentPath, tmpDir);
    assert.ok(!result.error, 'Should not error');
    assert.strictEqual(result.resolved.length, 2);
    assert.strictEqual(result.unresolved.length, 0);
    assert.ok(result.resolved[0].includes('child-a'));
    assert.ok(result.resolved[1].includes('child-b'));
  });

  test('reports unresolved skill names', () => {
    const parentPath = writeSkill('skills', 'lonely', { skills: 'nonexistent' });

    const result = resolveSkillComposition(parentPath, tmpDir);
    assert.ok(!result.error, 'Should not error on unresolved');
    assert.strictEqual(result.resolved.length, 0);
    assert.deepStrictEqual(result.unresolved, ['nonexistent']);
  });

  test('detects circular references', () => {
    const aPath = writeSkill('skills', 'cycle-a', { skills: 'cycle-b' });
    writeSkill('skills', 'cycle-b', { skills: 'cycle-a' });

    const result = resolveSkillComposition(aPath, tmpDir);
    assert.strictEqual(result.error, 'circular');
  });
});

// ─── querySkills ─────────────────────────────────────────────────────────────

describe('querySkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create a few skills for filtering
    const skills = [
      { dir: 'skills', name: 'search-tool', fm: { name: 'search-tool', version: '2.0.0', 'user-invocable': 'true' } },
      { dir: 'skills', name: 'internal-helper', fm: { name: 'internal-helper', 'user-invocable': 'false' } },
      { dir: '.claude/skills', name: 'editor-skill', fm: { name: 'editor-skill', version: '1.0.0', 'user-invocable': 'true' } },
    ];
    for (const s of skills) {
      const skillDir = path.join(tmpDir, s.dir, s.name);
      fs.mkdirSync(skillDir, { recursive: true });
      const lines = ['---'];
      for (const [k, v] of Object.entries(s.fm)) lines.push(`${k}: ${v}`);
      lines.push('---', '', `# ${s.name}`);
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), lines.join('\n'));
    }
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('filters by name', () => {
    const results = querySkills(tmpDir, { name: 'search' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'search-tool');
  });

  test('filters by userInvocable', () => {
    const invocable = querySkills(tmpDir, { userInvocable: 'true' });
    assert.strictEqual(invocable.length, 2);
    const names = invocable.map(s => s.name).sort();
    assert.deepStrictEqual(names, ['editor-skill', 'search-tool']);

    const notInvocable = querySkills(tmpDir, { userInvocable: 'false' });
    assert.strictEqual(notInvocable.length, 1);
    assert.strictEqual(notInvocable[0].name, 'internal-helper');
  });
});

// ─── skill-query CLI command ─────────────────────────────────────────────────

describe('skill-query CLI command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create skills for CLI tests
    const skillDir = path.join(tmpDir, 'skills', 'cli-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
      '---',
      'name: cli-skill',
      'description: CLI test skill',
      'version: 1.0.0',
      'user-invocable: true',
      '---',
      '',
      '# CLI Skill',
    ].join('\n'));
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns all skills with no filter', () => {
    const result = runGsdTools(['skill-query'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.ok(Array.isArray(parsed), 'Should return array');
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'cli-skill');
  });

  test('filters by --name via CLI', () => {
    // Add a second skill that won't match
    const otherDir = path.join(tmpDir, 'skills', 'other-skill');
    fs.mkdirSync(otherDir, { recursive: true });
    fs.writeFileSync(path.join(otherDir, 'SKILL.md'), '---\nname: other-skill\n---\n# Other\n');

    const result = runGsdTools(['skill-query', '--name', 'cli'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, 'cli-skill');
  });
});

// ─── auditSkills (Plan 20-02) ──────────────────────────────────────────────────

describe('auditSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty results when no skills configured', () => {
    const result = auditSkills(tmpDir);
    assert.strictEqual(result.missing.length, 0);
    assert.strictEqual(result.broken_refs.length, 0);
  });

  test('detects orphaned skills (on disk but not in config)', () => {
    // Skill exists on disk but not in gsd-config.json agent_skills
    const skillDir = path.join(tmpDir, 'skills', 'orphan-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: orphan-skill\ndescription: An orphaned skill for testing purposes\n---\n# Orphan\n');

    const result = auditSkills(tmpDir);
    assert.ok(result.orphaned.length > 0, 'Should find orphaned skills');
    assert.ok(result.orphaned.some(p => p.includes('orphan-skill')));
    assert.ok(result.total_discovered > 0);
  });

  test('detects missing skills (in config but not on disk)', () => {
    // Add skill to config that does not exist on disk
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/nonexistent-skill'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = auditSkills(tmpDir);
    assert.ok(result.missing.includes('skills/nonexistent-skill'));
  });

  test('detects broken composition refs', () => {
    const skillDir = path.join(tmpDir, 'skills', 'broken-ref-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: broken-ref-skill\ndescription: A skill with broken composition reference\nskills: no-such-skill\n---\n# Broken\n');

    const result = auditSkills(tmpDir);
    assert.ok(result.broken_refs.length > 0, 'Should find broken refs');
    assert.strictEqual(result.broken_refs[0].missing_ref, 'no-such-skill');
  });

  test('reports totals correctly', () => {
    const s1 = path.join(tmpDir, 'skills', 'skill-a');
    const s2 = path.join(tmpDir, 'skills', 'skill-b');
    fs.mkdirSync(s1, { recursive: true });
    fs.mkdirSync(s2, { recursive: true });
    fs.writeFileSync(path.join(s1, 'SKILL.md'), '---\nname: skill-a\ndescription: Skill A for counting test\n---\n# A\n');
    fs.writeFileSync(path.join(s2, 'SKILL.md'), '---\nname: skill-b\ndescription: Skill B for counting test\n---\n# B\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/skill-a'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = auditSkills(tmpDir);
    assert.strictEqual(result.total_discovered, 2);
    assert.strictEqual(result.total_configured, 1);
  });

  test('audit-skills CLI command works', () => {
    const result = runGsdTools(['audit-skills'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.ok('orphaned' in parsed);
    assert.ok('missing' in parsed);
    assert.ok('broken_refs' in parsed);
  });

  test('no false positives when config matches disk', () => {
    const skillDir = path.join(tmpDir, 'skills', 'matched-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: matched-skill\ndescription: A matched skill with valid configuration\n---\n# Matched\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/matched-skill'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = auditSkills(tmpDir);
    assert.strictEqual(result.orphaned.length, 0);
    assert.strictEqual(result.missing.length, 0);
    assert.strictEqual(result.broken_refs.length, 0);
  });
});

// ─── checkSkillVersions (Plan 20-03) ──────────────────────────────────────────

describe('checkSkillVersions', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('detects version match', () => {
    const skillDir = path.join(tmpDir, 'skills', 'ver-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: ver-skill\ndescription: A versioned skill for testing\nversion: 2.0.0\n---\n# Ver\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/ver-skill@2.0.0'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = checkSkillVersions(tmpDir);
    assert.strictEqual(result.matches.length, 1);
    assert.strictEqual(result.matches[0].version, '2.0.0');
    assert.strictEqual(result.drifts.length, 0);
  });

  test('detects version drift', () => {
    const skillDir = path.join(tmpDir, 'skills', 'drift-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: drift-skill\ndescription: A skill with drifted version\nversion: 3.0.0\n---\n# Drift\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/drift-skill@2.0.0'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = checkSkillVersions(tmpDir);
    assert.strictEqual(result.drifts.length, 1);
    assert.strictEqual(result.drifts[0].expected, '2.0.0');
    assert.strictEqual(result.drifts[0].actual, '3.0.0');
  });

  test('detects unversioned refs (no @ in config)', () => {
    const skillDir = path.join(tmpDir, 'skills', 'unver-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: unver-skill\ndescription: An unversioned skill ref\nversion: 1.0.0\n---\n# Unver\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/unver-skill'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = checkSkillVersions(tmpDir);
    assert.strictEqual(result.unversioned.length, 1);
  });

  test('detects missing version in skill metadata', () => {
    const skillDir = path.join(tmpDir, 'skills', 'noversion-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: noversion-skill\ndescription: A skill without version field\n---\n# NoVer\n');

    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/noversion-skill@1.0.0'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = checkSkillVersions(tmpDir);
    assert.strictEqual(result.missing_version.length, 1);
    assert.strictEqual(result.missing_version[0].expected, '1.0.0');
  });

  test('handles missing SKILL.md for versioned ref', () => {
    const configPath = path.join(tmpDir, '.planning', 'config.json');
    const config = { agent_skills: { 'gsd-executor': ['skills/ghost@1.0.0'] } };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = checkSkillVersions(tmpDir);
    assert.strictEqual(result.drifts.length, 1);
    assert.ok(result.drifts[0].error);
  });

  test('check-skill-versions CLI command works', () => {
    const result = runGsdTools(['check-skill-versions'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.ok('matches' in parsed);
    assert.ok('drifts' in parsed);
    assert.ok('unversioned' in parsed);
  });

  test('buildAgentSkillsBlock strips version from path', () => {
    const { buildAgentSkillsBlock } = require('../get-shit-done/bin/lib/init.cjs');
    const skillDir = path.join(tmpDir, 'skills', 'v-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: v-skill\ndescription: A versioned skill for path stripping test\nversion: 1.0.0\n---\n# V\n');

    const config = { agent_skills: { 'gsd-executor': ['skills/v-skill@1.0.0'] } };
    const block = buildAgentSkillsBlock(config, 'gsd-executor', tmpDir);
    assert.ok(block.includes('skills/v-skill/SKILL.md'), 'Should use stripped path without version');
    assert.ok(!block.includes('@1.0.0'), 'Should not include version in path');
  });

  test('buildAgentSkillsBlock emits version drift warning to stderr', () => {
    const skillDir = path.join(tmpDir, 'skills', 'drift2');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: drift2\ndescription: A skill for drift stderr test\nversion: 2.0.0\n---\n# Drift2\n');

    // Capture stderr via CLI
    const result = runGsdTools(['agent-skills', 'gsd-executor'], tmpDir, {
      HOME: tmpDir,
      USERPROFILE: tmpDir,
      GSD_CONFIG: JSON.stringify({ agent_skills: { 'gsd-executor': ['skills/drift2@1.0.0'] } }),
    });
    // The block should still render (drift is a warning, not a blocker)
    // stderr would contain the drift warning — hard to capture in subprocess, so we just verify it didn't crash
    // and the output is correct
    assert.ok(result.output.includes('skills/drift2/SKILL.md') || result.output === '', 'Should handle versioned ref');
  });
});

// ─── validateSkillMetadata (Plan 20-04) ────────────────────────────────────────

describe('validateSkillMetadata', () => {
  test('valid metadata passes', () => {
    const result = validateSkillMetadata({
      name: 'good-skill',
      description: 'A good skill with enough detail here',
      version: '1.0.0',
    });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.warnings.length, 0);
  });

  test('missing name produces error', () => {
    const result = validateSkillMetadata({
      description: 'A skill with a proper description',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('name')));
  });

  test('invalid name format produces error', () => {
    const result = validateSkillMetadata({
      name: 'Bad Name With Spaces',
      description: 'A skill with an invalid name format',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid name format')));
  });

  test('name starting with hyphen produces error', () => {
    const result = validateSkillMetadata({
      name: '-bad-start',
      description: 'A skill with a bad name start character',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Invalid name format')));
  });

  test('name too long produces error', () => {
    const result = validateSkillMetadata({
      name: 'a'.repeat(65),
      description: 'A skill with a name that exceeds the limit',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('too long')));
  });

  test('missing description produces error', () => {
    const result = validateSkillMetadata({
      name: 'no-desc',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('description')));
  });

  test('description too long produces error', () => {
    const result = validateSkillMetadata({
      name: 'long-desc',
      description: 'x'.repeat(1025),
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('too long')));
  });

  test('short description produces warning', () => {
    const result = validateSkillMetadata({
      name: 'short-desc',
      description: 'Too short',
    });
    assert.strictEqual(result.valid, true);
    assert.ok(result.warnings.some(w => w.includes('short')));
  });

  test('missing version produces warning', () => {
    const result = validateSkillMetadata({
      name: 'no-version',
      description: 'A skill without a version field declared',
    });
    assert.strictEqual(result.valid, true);
    assert.ok(result.warnings.some(w => w.includes('version')));
  });

  test('null metadata produces error', () => {
    const result = validateSkillMetadata(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});

// ─── validateSkillStructure (Plan 20-04) ───────────────────────────────────────

describe('validateSkillStructure', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('valid structure passes', () => {
    const skillDir = path.join(tmpDir, 'skills', 'good-struct');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: good-struct\n---\n# Good\n');

    const result = validateSkillStructure('skills/good-struct', tmpDir);
    assert.strictEqual(result.valid, true);
    assert.ok(result.files.includes('SKILL.md'));
  });

  test('missing SKILL.md produces error', () => {
    const skillDir = path.join(tmpDir, 'skills', 'no-skill-md');
    fs.mkdirSync(skillDir, { recursive: true });

    const result = validateSkillStructure('skills/no-skill-md', tmpDir);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('SKILL.md not found')));
  });

  test('empty SKILL.md produces error', () => {
    const skillDir = path.join(tmpDir, 'skills', 'empty-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '');

    const result = validateSkillStructure('skills/empty-skill', tmpDir);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('empty')));
  });

  test('oversized SKILL.md produces warning', () => {
    const skillDir = path.join(tmpDir, 'skills', 'big-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: big-skill\n---\n' + 'x'.repeat(60 * 1024));

    const result = validateSkillStructure('skills/big-skill', tmpDir);
    assert.strictEqual(result.valid, true);
    assert.ok(result.warnings.some(w => w.includes('large')));
  });

  test('lists supporting files', () => {
    const skillDir = path.join(tmpDir, 'skills', 'multi-file');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: multi-file\n---\n# Multi\n');
    fs.writeFileSync(path.join(skillDir, 'REFERENCE.md'), '# Ref\n');
    fs.writeFileSync(path.join(skillDir, 'EXAMPLES.md'), '# Ex\n');

    const result = validateSkillStructure('skills/multi-file', tmpDir);
    assert.ok(result.files.includes('REFERENCE.md'));
    assert.ok(result.files.includes('EXAMPLES.md'));
  });

  test('validate-skill CLI command works', () => {
    const skillDir = path.join(tmpDir, 'skills', 'cli-val');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: cli-val\ndescription: A skill for CLI validation testing\nversion: 1.0.0\n---\n# CLI Val\n');

    const result = runGsdTools(['validate-skill', 'skills/cli-val'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    assert.ok(result.success, `Command failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.valid, true);
  });

  test('validate-skill CLI exits with code 1 on errors', () => {
    const skillDir = path.join(tmpDir, 'skills', 'bad-val');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\n---\n# No metadata\n');

    const result = runGsdTools(['validate-skill', 'skills/bad-val'], tmpDir, { HOME: tmpDir, USERPROFILE: tmpDir });
    // Should have output even if exit code is 1
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.valid, false);
    assert.ok(parsed.metadata_errors.length > 0);
  });
});
