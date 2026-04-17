/**
 * Profile Output Tests
 *
 * Tests for profile rendering commands and PROFILING_QUESTIONS data.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, createTempGitProject, cleanup } = require('./helpers.cjs');

const {
  PROFILING_QUESTIONS,
  CLAUDE_INSTRUCTIONS,
} = require('../get-shit-done/bin/lib/profile-output.cjs');

// ─── PROFILING_QUESTIONS data ─────────────────────────────────────────────────

describe('PROFILING_QUESTIONS', () => {
  test('is a non-empty array', () => {
    assert.ok(Array.isArray(PROFILING_QUESTIONS));
    assert.ok(PROFILING_QUESTIONS.length > 0);
  });

  test('each question has required fields', () => {
    for (const q of PROFILING_QUESTIONS) {
      assert.ok(q.dimension, `question missing dimension`);
      assert.ok(q.header, `${q.dimension} missing header`);
      assert.ok(q.question, `${q.dimension} missing question`);
      assert.ok(Array.isArray(q.options), `${q.dimension} options should be array`);
      assert.ok(q.options.length >= 2, `${q.dimension} should have at least 2 options`);
    }
  });

  test('each option has label, value, and rating', () => {
    for (const q of PROFILING_QUESTIONS) {
      for (const opt of q.options) {
        assert.ok(opt.label, `${q.dimension} option missing label`);
        assert.ok(opt.value, `${q.dimension} option missing value`);
        assert.ok(opt.rating, `${q.dimension} option missing rating`);
      }
    }
  });

  test('all dimension keys are unique', () => {
    const dims = PROFILING_QUESTIONS.map(q => q.dimension);
    const unique = [...new Set(dims)];
    assert.strictEqual(dims.length, unique.length);
  });
});

// ─── CLAUDE_INSTRUCTIONS ──────────────────────────────────────────────────────

describe('CLAUDE_INSTRUCTIONS', () => {
  test('is a non-empty object', () => {
    assert.ok(typeof CLAUDE_INSTRUCTIONS === 'object');
    assert.ok(Object.keys(CLAUDE_INSTRUCTIONS).length > 0);
  });

  test('each dimension has at least one instruction', () => {
    for (const [dim, instructions] of Object.entries(CLAUDE_INSTRUCTIONS)) {
      assert.ok(typeof instructions === 'object', `${dim} should be an object`);
      assert.ok(Object.keys(instructions).length > 0, `${dim} should have instructions`);
    }
  });

  test('every PROFILING_QUESTIONS dimension has CLAUDE_INSTRUCTIONS', () => {
    for (const q of PROFILING_QUESTIONS) {
      assert.ok(
        CLAUDE_INSTRUCTIONS[q.dimension],
        `${q.dimension} has questions but no CLAUDE_INSTRUCTIONS`
      );
    }
  });
});

// ─── write-profile command ────────────────────────────────────────────────────

describe('write-profile command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('writes USER-PROFILE.md from analysis JSON', () => {
    const analysis = {
      profile_version: '1.0',
      dimensions: {
        communication_style: { rating: 'terse-direct', confidence: 'HIGH' },
        decision_speed: { rating: 'fast-intuitive', confidence: 'MEDIUM' },
        explanation_depth: { rating: 'concise', confidence: 'HIGH' },
        debugging_approach: { rating: 'fix-first', confidence: 'LOW' },
        ux_philosophy: { rating: 'function-first', confidence: 'MEDIUM' },
        vendor_philosophy: { rating: 'pragmatic', confidence: 'HIGH' },
        frustration_triggers: { rating: 'over-explanation', confidence: 'LOW' },
        learning_style: { rating: 'hands-on', confidence: 'MEDIUM' },
      },
    };

    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));

    const result = runGsdTools(['write-profile', '--input', analysisPath, '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out.profile_path, 'should return profile_path');
    assert.ok(out.dimensions_scored > 0, 'should have scored dimensions');
  });

  test('errors when --input is missing', () => {
    const result = runGsdTools('write-profile --raw', tmpDir);
    assert.ok(!result.success, 'should fail without --input');
    assert.ok(result.error.includes('--input'), 'should mention --input');
  });
});

// ─── generate-claude-md command ───────────────────────────────────────────────

describe('generate-claude-md command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'PROJECT.md'),
      '# My Project\n\nA test project.\n\n## Tech Stack\n\n- Node.js\n- TypeScript\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('generates CLAUDE.md with --auto flag', () => {
    const outputPath = path.join(tmpDir, 'CLAUDE.md');
    const result = runGsdTools(['generate-claude-md', '--output', outputPath, '--auto', '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);

    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      assert.ok(content.length > 0, 'should have content');
    }
  });

  test('does not overwrite existing CLAUDE.md without --force', () => {
    const outputPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(outputPath, '# Custom CLAUDE.md\n\nUser content.\n');

    const result = runGsdTools(['generate-claude-md', '--output', outputPath, '--auto', '--raw'], tmpDir);
    // Should merge, not overwrite
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.length > 0, 'should still have content');
  });
});

// ─── generate-dev-preferences ─────────────────────────────────────────────────

describe('generate-dev-preferences command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors when --analysis is missing', () => {
    const result = runGsdTools('generate-dev-preferences --raw', tmpDir);
    assert.ok(!result.success, 'should fail without --analysis');
    assert.ok(result.error.includes('--analysis'), 'should mention --analysis');
  });

  test('generates preferences from analysis file', () => {
    const analysis = {
      profile_version: '1.0',
      dimensions: {
        communication_style: { rating: 'terse-direct', confidence: 'HIGH' },
        decision_speed: { rating: 'fast-intuitive', confidence: 'MEDIUM' },
      },
    };
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));

    const result = runGsdTools(['generate-dev-preferences', '--analysis', analysisPath, '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out.command_path || out.command_name, 'should return command output');
  });
});

// ─── profile-questionnaire with --answers ────────────────────────────────────

describe('profile-questionnaire --answers', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns analysis with all 8 dimensions when given valid answers', () => {
    const answers = 'a,b,c,d,a,b,c,d';
    const result = runGsdTools(['profile-questionnaire', '--answers', answers, '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.profile_version, '1.0');
    assert.ok(out.dimensions, 'should have dimensions object');
    const dims = Object.keys(out.dimensions);
    assert.strictEqual(dims.length, 8, `should have 8 dimensions, got ${dims.length}`);
    assert.ok(out.dimensions.communication_style, 'should have communication_style');
    assert.ok(out.dimensions.decision_speed, 'should have decision_speed');
    assert.ok(out.dimensions.learning_style, 'should have learning_style');
  });

  test('rejects wrong answer count', () => {
    const answers = 'a,b,c';
    const result = runGsdTools(['profile-questionnaire', '--answers', answers, '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail with wrong answer count');
    assert.ok(result.error.includes('Expected'), `should mention expected count: ${result.error}`);
  });

  test('rejects invalid answer value', () => {
    const answers = 'a,b,c,z,a,b,c,d';
    const result = runGsdTools(['profile-questionnaire', '--answers', answers, '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail with invalid answer');
    assert.ok(result.error.includes('Invalid'), `should mention invalid answer: ${result.error}`);
  });

  test('marks ambiguous answer as LOW confidence', () => {
    // 'd' for communication_style has rating='mixed' which isAmbiguousAnswer returns true for
    const answers = 'd,a,a,a,a,a,a,a';
    const result = runGsdTools(['profile-questionnaire', '--answers', answers, '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(
      out.dimensions.communication_style.confidence,
      'LOW',
      'ambiguous answer should get LOW confidence'
    );
    // Non-ambiguous answers should get MEDIUM
    assert.strictEqual(
      out.dimensions.decision_speed.confidence,
      'MEDIUM',
      'non-ambiguous answer should get MEDIUM confidence'
    );
  });

  test('each dimension has claude_instruction', () => {
    const answers = 'a,a,a,a,a,a,a,a';
    const result = runGsdTools(['profile-questionnaire', '--answers', answers, '--raw'], tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    for (const [dim, data] of Object.entries(out.dimensions)) {
      assert.ok(data.claude_instruction, `${dim} should have claude_instruction`);
    }
  });
});

// ─── generate-claude-profile command ─────────────────────────────────────────

describe('generate-claude-profile command', () => {
  let tmpDir;

  const makeAnalysis = () => ({
    profile_version: '1.0',
    data_source: 'session_analysis',
    dimensions: {
      communication_style: { rating: 'terse-direct', confidence: 'HIGH', claude_instruction: 'Be concise.' },
      decision_speed: { rating: 'fast-intuitive', confidence: 'MEDIUM', claude_instruction: 'Recommend quickly.' },
      explanation_depth: { rating: 'concise', confidence: 'HIGH' },
      debugging_approach: { rating: 'fix-first', confidence: 'LOW' },
      ux_philosophy: { rating: 'function-first', confidence: 'MEDIUM' },
      vendor_philosophy: { rating: 'pragmatic', confidence: 'HIGH' },
      frustration_triggers: { rating: 'over-explanation', confidence: 'LOW' },
      learning_style: { rating: 'hands-on', confidence: 'MEDIUM' },
    },
  });

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates section in new file', () => {
    const analysis = makeAnalysis();
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'NEW-CLAUDE.md');

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.action, 'created');
    assert.ok(fs.existsSync(outputPath), 'should create the file');
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('<!-- GSD:profile-start -->'), 'should have profile start marker');
    assert.ok(content.includes('<!-- GSD:profile-end -->'), 'should have profile end marker');
    assert.ok(content.includes('## Developer Profile'), 'should have Developer Profile heading');
  });

  test('updates existing profile section', () => {
    const analysis = makeAnalysis();
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'CLAUDE.md');

    // Create file with existing profile markers
    fs.writeFileSync(outputPath, [
      '# My CLAUDE.md',
      '',
      '<!-- GSD:profile-start -->',
      '## Developer Profile',
      '',
      '> Old content here.',
      '<!-- GSD:profile-end -->',
      '',
      '## Other Section',
      'Keep this.',
    ].join('\n'));

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.action, 'updated');
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('terse-direct'), 'should contain new rating');
    assert.ok(content.includes('## Other Section'), 'should preserve other sections');
    assert.ok(!content.includes('Old content here'), 'should replace old profile content');
  });

  test('appends to existing file without markers', () => {
    const analysis = makeAnalysis();
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'CLAUDE.md');

    fs.writeFileSync(outputPath, '# My CLAUDE.md\n\nSome existing content.\n');

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.action, 'appended');
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('Some existing content'), 'should preserve existing content');
    assert.ok(content.includes('<!-- GSD:profile-start -->'), 'should have profile markers');
  });

  test('errors without --analysis', () => {
    const result = runGsdTools(['generate-claude-profile', '--raw'], tmpDir);
    assert.ok(!result.success, 'should fail without --analysis');
    assert.ok(result.error.includes('--analysis'), 'should mention --analysis');
  });

  test('includes all dimensions in output', () => {
    const analysis = makeAnalysis();
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'CLAUDE.md');

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.dimensions_included.length, 8, 'should include all 8 dimensions');
  });
});

// ─── generate-claude-md extended tests ───────────────────────────────────────

describe('generate-claude-md extended', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'PROJECT.md'),
      '# Test Project\n\nA test project.\n\n## What This Is\n\nA unit-test fixture.\n\n## Tech Stack\n\n- Node.js\n- TypeScript\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates new file with all managed sections', () => {
    const outputPath = path.join(tmpDir, 'NEW-CLAUDE.md');
    const result = runGsdTools(
      ['generate-claude-md', '--output', outputPath, '--auto', '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.action, 'created');
    assert.ok(fs.existsSync(outputPath), 'should create the file');
    const content = fs.readFileSync(outputPath, 'utf-8');
    // Check all 5 managed sections have markers
    for (const section of ['project', 'stack', 'conventions', 'architecture', 'workflow']) {
      assert.ok(
        content.includes(`<!-- GSD:${section}-start`),
        `should have ${section} start marker`
      );
      assert.ok(
        content.includes(`<!-- GSD:${section}-end -->`),
        `should have ${section} end marker`
      );
    }
    // Should also have profile placeholder
    assert.ok(content.includes('<!-- GSD:profile-start -->'), 'should have profile placeholder');
  });

  test('with --auto skips manually edited sections', () => {
    const outputPath = path.join(tmpDir, 'CLAUDE.md');

    // First, generate a fresh CLAUDE.md
    const firstResult = runGsdTools(
      ['generate-claude-md', '--output', outputPath, '--auto', '--raw'],
      tmpDir
    );
    assert.ok(firstResult.success, `First generate failed: ${firstResult.error}`);

    // Now manually edit the project section content (between markers)
    let content = fs.readFileSync(outputPath, 'utf-8');
    content = content.replace(
      /<!-- GSD:project-start[^>]*-->([\s\S]*?)<!-- GSD:project-end -->/,
      '<!-- GSD:project-start source:PROJECT.md -->\n## Project\n\nI manually edited this section with completely different content.\n<!-- GSD:project-end -->'
    );
    fs.writeFileSync(outputPath, content, 'utf-8');

    // Re-run with --auto — should skip the manually edited section
    const secondResult = runGsdTools(
      ['generate-claude-md', '--output', outputPath, '--auto', '--raw'],
      tmpDir
    );
    assert.ok(secondResult.success, `Second generate failed: ${secondResult.error}`);
    const out = JSON.parse(secondResult.output);
    assert.strictEqual(out.action, 'updated');
    assert.ok(
      out.sections_skipped.includes('project'),
      `should skip manually edited project section, got skipped: ${out.sections_skipped}`
    );

    // Verify the manual edit is preserved
    const finalContent = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      finalContent.includes('I manually edited this section'),
      'should preserve manually edited content'
    );
  });

  test('relative --output path resolves from cwd', () => {
    const result = runGsdTools(
      ['generate-claude-md', '--output', 'subdir/CLAUDE.md', '--auto', '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out.claude_md_path.includes(path.join('subdir', 'CLAUDE.md')), 'should resolve relative path');
    assert.ok(fs.existsSync(path.join(tmpDir, 'subdir', 'CLAUDE.md')), 'file should exist at resolved path');
  });
});

// ─── generate-dev-preferences branch coverage ───────────────────────────────

describe('generate-dev-preferences branch coverage', () => {
  let tmpDir;

  const makeAnalysis = (overrides = {}) => ({
    profile_version: '1.0',
    data_source: 'session_analysis',
    dimensions: {
      communication_style: { rating: 'terse-direct', confidence: 'HIGH', claude_instruction: 'Be concise.' },
      decision_speed: { rating: 'fast-intuitive', confidence: 'MEDIUM', claude_instruction: 'Recommend quickly.' },
    },
    ...overrides,
  });

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('questionnaire data_source uses questionnaire stack block', () => {
    const analysis = makeAnalysis({ data_source: 'questionnaire' });
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'dev-prefs.md');

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      content.includes('Stack preferences not available (questionnaire-only profile)'),
      'should use questionnaire stack block'
    );
  });

  test('session_analysis without --stack uses default stack block', () => {
    const analysis = makeAnalysis({ data_source: 'session_analysis' });
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'dev-prefs.md');

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      content.includes('Stack preferences will be populated from session analysis'),
      'should use default stack block when no --stack provided'
    );
  });

  test('--stack flag provides custom stack block', () => {
    const analysis = makeAnalysis({ data_source: 'session_analysis' });
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'dev-prefs.md');

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--output', outputPath, '--stack', 'Python,Node.js,React', '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      content.includes('Python,Node.js,React'),
      'should include custom stack from --stack flag'
    );
  });

  test('relative --output path resolves from cwd', () => {
    const analysis = makeAnalysis();
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--output', 'subdir/dev-prefs.md', '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(
      out.command_path.includes(path.join('subdir', 'dev-prefs.md')),
      'should resolve relative output path from cwd'
    );
    assert.ok(fs.existsSync(path.join(tmpDir, 'subdir', 'dev-prefs.md')), 'file should exist at resolved path');
  });

  test('errors on invalid JSON in analysis file', () => {
    const analysisPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(analysisPath, '{{{ not json');

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--raw'],
      tmpDir
    );
    assert.ok(!result.success, 'should fail on invalid JSON');
    assert.ok(result.error.includes('Failed to parse analysis JSON'), 'should mention parse error');
  });

  test('errors when analysis lacks dimensions object', () => {
    const analysisPath = path.join(tmpDir, 'no-dims.json');
    fs.writeFileSync(analysisPath, JSON.stringify({ profile_version: '1.0' }));

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--raw'],
      tmpDir
    );
    assert.ok(!result.success, 'should fail without dimensions');
    assert.ok(result.error.includes('dimensions'), 'should mention missing dimensions');
  });

  test('uses fallback instruction when rating has no CLAUDE_INSTRUCTIONS entry', () => {
    // Use a rating value that does not exist in CLAUDE_INSTRUCTIONS lookup
    const analysis = makeAnalysis({
      dimensions: {
        communication_style: { rating: 'nonexistent-rating-value', confidence: 'HIGH' },
      },
    });
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));
    const outputPath = path.join(tmpDir, 'dev-prefs.md');

    const result = runGsdTools(
      ['generate-dev-preferences', '--analysis', analysisPath, '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      content.includes('Adapt to this developer\'s communication style preference'),
      'should use fallback instruction text'
    );
  });
});

// ─── generate-claude-profile error branches ─────────────────────────────────

describe('generate-claude-profile error branches', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('errors on invalid JSON in analysis file', () => {
    const analysisPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(analysisPath, 'NOT VALID JSON {{{');

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--raw'],
      tmpDir
    );
    assert.ok(!result.success, 'should fail on invalid JSON');
    assert.ok(result.error.includes('Failed to parse analysis JSON'), 'should mention parse error');
  });

  test('errors when analysis lacks dimensions object', () => {
    const analysisPath = path.join(tmpDir, 'no-dims.json');
    fs.writeFileSync(analysisPath, JSON.stringify({ profile_version: '1.0' }));

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--raw'],
      tmpDir
    );
    assert.ok(!result.success, 'should fail without dimensions');
    assert.ok(result.error.includes('dimensions'), 'should mention missing dimensions');
  });

  test('--global flag targets ~/.claude/CLAUDE.md', () => {
    const analysis = {
      profile_version: '1.0',
      data_source: 'session_analysis',
      dimensions: {
        communication_style: { rating: 'terse-direct', confidence: 'HIGH', claude_instruction: 'Be concise.' },
      },
    };
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));

    // Sandbox HOME so --global writes to tmpDir/.claude/CLAUDE.md
    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--global', '--raw'],
      tmpDir,
      { HOME: tmpDir }
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const globalPath = path.join(tmpDir, '.claude', 'CLAUDE.md');
    assert.ok(fs.existsSync(globalPath), 'should create file at ~/.claude/CLAUDE.md');
    const content = fs.readFileSync(globalPath, 'utf-8');
    assert.ok(content.includes('<!-- GSD:profile-start -->'), 'should have profile markers');
  });

  test('defaults output to cwd/CLAUDE.md when no --output or --global', () => {
    const analysis = {
      profile_version: '1.0',
      data_source: 'session_analysis',
      dimensions: {
        communication_style: { rating: 'terse-direct', confidence: 'HIGH', claude_instruction: 'Be concise.' },
      },
    };
    const analysisPath = path.join(tmpDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis));

    const result = runGsdTools(
      ['generate-claude-profile', '--analysis', analysisPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const defaultPath = path.join(tmpDir, 'CLAUDE.md');
    assert.ok(fs.existsSync(defaultPath), 'should create CLAUDE.md in cwd by default');
    const content = fs.readFileSync(defaultPath, 'utf-8');
    assert.ok(content.includes('<!-- GSD:profile-start -->'), 'should have profile markers');
  });
});

// ─── generate-claude-md branch coverage ─────────────────────────────────────

describe('generate-claude-md branch coverage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'PROJECT.md'),
      '# Test Project\n\nA test project.\n\n## What This Is\n\nA unit-test fixture.\n\n## Tech Stack\n\n- Node.js\n- TypeScript\n'
    );
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('defaults output to cwd/CLAUDE.md when no --output', () => {
    const result = runGsdTools(
      ['generate-claude-md', '--auto', '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    const defaultPath = path.join(tmpDir, 'CLAUDE.md');
    assert.ok(fs.existsSync(defaultPath), 'should create CLAUDE.md in cwd by default');
    assert.ok(out.claude_md_path.endsWith('CLAUDE.md'), 'output path should end with CLAUDE.md');
  });

  test('non-auto mode appends profile placeholder on update', () => {
    // First create file without profile markers
    const outputPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(outputPath, '# Existing CLAUDE.md\n\nSome content.\n');

    // Run without --auto to trigger the profile placeholder insertion (line 904-906)
    const result = runGsdTools(
      ['generate-claude-md', '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(
      content.includes('<!-- GSD:profile-start'),
      'should insert profile placeholder in non-auto mode when markers missing'
    );
  });

  test('non-auto mode does not duplicate profile placeholder', () => {
    // Create file that already has profile markers
    const outputPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(outputPath, [
      '# Existing CLAUDE.md',
      '',
      '<!-- GSD:profile-start -->',
      '## Developer Profile',
      '<!-- GSD:profile-end -->',
      '',
    ].join('\n'));

    const result = runGsdTools(
      ['generate-claude-md', '--output', outputPath, '--raw'],
      tmpDir
    );
    assert.ok(result.success, `Failed: ${result.error}`);
    const content = fs.readFileSync(outputPath, 'utf-8');
    const markerCount = (content.match(/<!-- GSD:profile-start/g) || []).length;
    assert.strictEqual(markerCount, 1, 'should not duplicate profile placeholder');
  });
});
