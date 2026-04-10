/**
 * Profile Pipeline Tests
 *
 * Tests for session scanning, message extraction, and profile sampling.
 * Uses synthetic session data in temp directories via --path override.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runGsdTools, createTempDir, createTempProject, cleanup } = require('./helpers.cjs');

// ─── scan-sessions ────────────────────────────────────────────────────────────

describe('scan-sessions command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-test-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns empty array for empty sessions directory', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    fs.mkdirSync(sessionsDir, { recursive: true });
    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(Array.isArray(out), 'should return an array');
    assert.strictEqual(out.length, 0, 'should be empty');
  });

  test('scans synthetic project directory', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'test-project-abc123');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create a synthetic session file
    const sessionData = [
      JSON.stringify({ type: 'user', userType: 'external', message: { content: 'hello' }, timestamp: Date.now() }),
      JSON.stringify({ type: 'assistant', message: { content: 'hi' }, timestamp: Date.now() }),
    ].join('\n');
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), sessionData);

    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(Array.isArray(out), 'should return array');
    assert.strictEqual(out.length, 1, 'should find 1 project');
    assert.strictEqual(out[0].sessionCount, 1, 'should have 1 session');
  });

  test('reports multiple sessions and sizes', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'multi-session-project');
    fs.mkdirSync(projectDir, { recursive: true });

    for (let i = 1; i <= 3; i++) {
      const data = JSON.stringify({ type: 'user', userType: 'external', message: { content: `msg ${i}` }, timestamp: Date.now() });
      fs.writeFileSync(path.join(projectDir, `session-${i}.jsonl`), data + '\n');
    }

    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out[0].sessionCount, 3);
    assert.ok(out[0].totalSize > 0, 'should have non-zero size');
  });
});

// ─── extract-messages ─────────────────────────────────────────────────────────

describe('extract-messages command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-test-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('extracts user messages from synthetic session', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'my-project');
    fs.mkdirSync(projectDir, { recursive: true });

    const messages = [
      { type: 'user', userType: 'external', message: { content: 'fix the login bug' }, timestamp: Date.now() },
      { type: 'assistant', message: { content: 'I will fix it.' }, timestamp: Date.now() },
      { type: 'user', userType: 'external', message: { content: 'add dark mode' }, timestamp: Date.now() },
      { type: 'user', userType: 'internal', isMeta: true, message: { content: '<local-command' }, timestamp: Date.now() },
    ];
    fs.writeFileSync(
      path.join(projectDir, 'session-001.jsonl'),
      messages.map(m => JSON.stringify(m)).join('\n')
    );

    const result = runGsdTools(`extract-messages my-project --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.messages_extracted, 2, 'should extract 2 genuine user messages');
    assert.strictEqual(out.project, 'my-project');
    assert.ok(out.output_file, 'should have output file path');
  });

  test('filters out meta and internal messages', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'filter-test');
    fs.mkdirSync(projectDir, { recursive: true });

    const messages = [
      { type: 'user', userType: 'external', message: { content: 'real message' }, timestamp: Date.now() },
      { type: 'user', userType: 'internal', message: { content: 'internal msg' }, timestamp: Date.now() },
      { type: 'user', userType: 'external', isMeta: true, message: { content: 'meta msg' }, timestamp: Date.now() },
      { type: 'user', userType: 'external', message: { content: '<local-command test' }, timestamp: Date.now() },
      { type: 'user', userType: 'external', message: { content: '' }, timestamp: Date.now() },
      { type: 'user', userType: 'external', message: { content: 'second real' }, timestamp: Date.now() },
    ];
    fs.writeFileSync(
      path.join(projectDir, 'session-001.jsonl'),
      messages.map(m => JSON.stringify(m)).join('\n')
    );

    const result = runGsdTools(`extract-messages filter-test --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.messages_extracted, 2, 'should only extract 2 genuine external messages');
  });
});

// ─── profile-questionnaire ────────────────────────────────────────────────────

describe('profile-questionnaire command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns questionnaire structure', () => {
    const result = runGsdTools('profile-questionnaire --raw', tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out.questions, 'should have questions array');
    assert.ok(out.questions.length > 0, 'should have at least one question');
    assert.ok(out.questions[0].dimension, 'each question should have a dimension');
    assert.ok(out.questions[0].options, 'each question should have options');
  });
});

// ─── profile-sample ──────────────────────────────────────────────────────────

/**
 * Helper: create a synthetic session .jsonl file with genuine user messages.
 * @param {string} dir - Project directory to write into.
 * @param {string} filename - Session filename (e.g. 'session-001.jsonl').
 * @param {string[]} contents - Array of message content strings.
 * @param {number} [baseTimestamp] - Optional base timestamp for messages.
 */
function createSessionFile(dir, filename, contents, baseTimestamp) {
  const ts = baseTimestamp || Date.now();
  const lines = contents.map((content, i) =>
    JSON.stringify({
      type: 'user',
      userType: 'external',
      message: { content },
      timestamp: ts + i * 1000,
    })
  );
  fs.writeFileSync(path.join(dir, filename), lines.join('\n') + '\n');
}

describe('profile-sample error paths', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-err-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('fails when override path does not exist', () => {
    const result = runGsdTools('profile-sample --path /tmp/nonexistent-gsd-dir-99999 --raw', tmpDir);
    assert.ok(!result.success, 'should fail for nonexistent path');
    assert.ok(result.error.includes('No Claude Code sessions found'), `error should mention no sessions: ${result.error}`);
  });

  test('fails when sessions directory has no project subdirectories', () => {
    const emptyDir = path.join(tmpDir, 'empty-sessions');
    fs.mkdirSync(emptyDir, { recursive: true });
    // Create a file (not a directory) so it's not empty but has no valid project dirs
    fs.writeFileSync(path.join(emptyDir, 'not-a-dir.txt'), 'hello');

    const result = runGsdTools(`profile-sample --path ${emptyDir} --raw`, tmpDir);
    assert.ok(!result.success, 'should fail for empty sessions dir');
    assert.ok(result.error.includes('No project'), `error should mention no projects: ${result.error}`);
  });

  test('handles project directory with no session .jsonl files', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'empty-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'readme.txt'), 'no sessions here');

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(!result.success, 'should fail when no projects have sessions');
    assert.ok(result.error.includes('No projects with sessions'), `error: ${result.error}`);
  });
});

describe('profile-sample command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-sample-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns structured result from synthetic sessions', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectA = path.join(sessionsDir, 'project-alpha');
    const projectB = path.join(sessionsDir, 'project-beta');
    fs.mkdirSync(projectA, { recursive: true });
    fs.mkdirSync(projectB, { recursive: true });

    createSessionFile(projectA, 'session-001.jsonl', ['fix the login page', 'add error handling']);
    createSessionFile(projectB, 'session-001.jsonl', ['implement search feature']);

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    assert.ok(out.output_file, 'should have output_file');
    assert.strictEqual(out.projects_sampled, 2, 'should sample 2 projects');
    assert.strictEqual(out.messages_sampled, 3, 'should sample 3 messages total');
    assert.ok(out.per_project_cap > 0, 'should have positive per_project_cap');
    assert.strictEqual(out.message_char_limit, 500, 'default char limit should be 500');
    assert.ok(Array.isArray(out.project_breakdown), 'should have project_breakdown array');
    assert.strictEqual(out.project_breakdown.length, 2, 'breakdown should have 2 projects');

    // Verify output JSONL file exists and has correct line count
    assert.ok(fs.existsSync(out.output_file), 'output JSONL file should exist');
    const jsonlLines = fs.readFileSync(out.output_file, 'utf-8').trim().split('\n');
    assert.strictEqual(jsonlLines.length, 3, 'JSONL file should have 3 lines');
  });

  test('respects --limit', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'big-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create session with many messages
    const msgs = Array.from({ length: 10 }, (_, i) => `user message number ${i + 1}`);
    createSessionFile(projectDir, 'session-001.jsonl', msgs);

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --limit 3 --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    assert.ok(out.messages_sampled <= 3, `messages_sampled should be <= 3, got ${out.messages_sampled}`);
  });

  test('filters context dump messages', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'context-dump-project');
    fs.mkdirSync(projectDir, { recursive: true });

    const messages = [
      'This session is being continued from a previous conversation. Here is the context...',
      'genuine user request here',
      'another genuine request',
    ];
    createSessionFile(projectDir, 'session-001.jsonl', messages);

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    assert.ok(out.skipped_context_dumps > 0, 'should have skipped at least one context dump');
    assert.strictEqual(out.messages_sampled, 2, 'should only sample the 2 genuine messages');
  });

  test('filters log-heavy messages', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'log-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create a message where >80% of lines are log-like (needs >3 lines to trigger)
    const logMessage = [
      '[INFO] Starting server on port 3000',
      '[DEBUG] Loading configuration from /etc/app.conf',
      '[INFO] Database connection established',
      '[ERROR] Failed to load module xyz',
      '[WARN] Memory usage above 80%',
    ].join('\n');

    const messages = [
      logMessage,
      'genuine user request',
    ];
    createSessionFile(projectDir, 'session-001.jsonl', messages);

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    // The log-heavy message should be filtered, leaving only the genuine one
    assert.strictEqual(out.messages_sampled, 1, 'should only sample the genuine message');
    assert.ok(out.skipped_context_dumps >= 1, 'log-heavy message should be counted as skipped');
  });

  test('respects --max-chars', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'long-msg-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create a message with 1000+ characters
    const longContent = 'A'.repeat(1200);
    createSessionFile(projectDir, 'session-001.jsonl', [longContent]);

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --max-chars 100 --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    assert.strictEqual(out.message_char_limit, 100, 'char limit should reflect --max-chars value');
    assert.strictEqual(out.messages_sampled, 1, 'should sample 1 message');

    // Read the JSONL file and verify truncation
    const jsonlLines = fs.readFileSync(out.output_file, 'utf-8').trim().split('\n');
    const sampled = JSON.parse(jsonlLines[0]);
    assert.ok(sampled.content.length <= 120, `content should be truncated (got ${sampled.content.length} chars)`);
    assert.ok(sampled.content.includes('... [truncated]'), 'should have truncation marker');
  });

  test('errors on empty sessions directory', () => {
    const sessionsDir = path.join(tmpDir, 'empty-projects');
    fs.mkdirSync(sessionsDir, { recursive: true });

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(!result.success, 'should fail for empty sessions directory');
  });

  test('handles projects with no session files', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'empty-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Only write a sessions-index.json, no .jsonl files
    fs.writeFileSync(
      path.join(projectDir, 'sessions-index.json'),
      JSON.stringify({ entries: [] })
    );

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --raw`, tmpDir);
    // No sessions means no projects with sessions, which triggers the error path
    assert.ok(!result.success, 'should fail when no projects have sessions');
  });

  test('respects --max-per-project', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'many-sessions-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Create 10 session files, each with a unique message
    for (let i = 1; i <= 10; i++) {
      createSessionFile(projectDir, `session-${String(i).padStart(3, '0')}.jsonl`, [`message from session ${i}`]);
    }

    const result = runGsdTools(`profile-sample --path ${sessionsDir} --max-per-project 2 --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);

    assert.ok(out.messages_sampled <= 2, `should sample at most 2 messages, got ${out.messages_sampled}`);
    assert.strictEqual(out.per_project_cap, 2, 'per_project_cap should be 2');

    // Verify breakdown shows limited sessions
    const breakdown = out.project_breakdown[0];
    assert.ok(breakdown.sessions <= 2, `should use at most 2 sessions, got ${breakdown.sessions}`);
  });
});

// ─── extract-messages edge cases ─────────────────────────────────────────────

describe('extract-messages edge cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-test-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('fuzzy matches project by partial name', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, '-Users-me-projects-my-cool-app');
    fs.mkdirSync(projectDir, { recursive: true });
    const msg = { type: 'user', userType: 'external', message: { content: 'hello' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    const result = runGsdTools(`extract-messages my-cool-app --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.messages_extracted, 1);
  });

  test('errors when no project matches', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'real-project');
    fs.mkdirSync(projectDir, { recursive: true });
    const msg = { type: 'user', userType: 'external', message: { content: 'hello' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    const result = runGsdTools(`extract-messages nonexistent-project --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(!result.success, 'should fail for non-matching project');
  });

  test('respects --session filter', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'test-project');
    fs.mkdirSync(projectDir, { recursive: true });

    for (const id of ['session-001', 'session-002', 'session-003']) {
      const msg = { type: 'user', userType: 'external', message: { content: `msg from ${id}` }, timestamp: Date.now() };
      fs.writeFileSync(path.join(projectDir, `${id}.jsonl`), JSON.stringify(msg) + '\n');
    }

    const result = runGsdTools(`extract-messages test-project --path ${sessionsDir} --session session-002 --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.sessions_processed, 1);
  });

  test('respects --limit for sessions', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'limit-test');
    fs.mkdirSync(projectDir, { recursive: true });

    for (let i = 1; i <= 5; i++) {
      const msg = { type: 'user', userType: 'external', message: { content: `msg ${i}` }, timestamp: Date.now() + i };
      fs.writeFileSync(path.join(projectDir, `session-00${i}.jsonl`), JSON.stringify(msg) + '\n');
    }

    const result = runGsdTools(`extract-messages limit-test --path ${sessionsDir} --limit 2 --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out.sessions_processed <= 2, 'should process at most 2 sessions');
  });

  test('disambiguates multiple partial matches via sessions-index.json', () => {
    const sessionsDir = path.join(tmpDir, 'projects');

    // Two dirs that both match "app"
    const dir1 = path.join(sessionsDir, '-Users-me-my-app-v1');
    const dir2 = path.join(sessionsDir, '-Users-me-my-app-v2');
    fs.mkdirSync(dir1, { recursive: true });
    fs.mkdirSync(dir2, { recursive: true });

    // Add sessions to both
    const msg = { type: 'user', userType: 'external', message: { content: 'hello' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(dir1, 'session-001.jsonl'), JSON.stringify(msg) + '\n');
    fs.writeFileSync(path.join(dir2, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    // Add index with originalPath so one resolves to exact name match
    fs.writeFileSync(path.join(dir1, 'sessions-index.json'), JSON.stringify({
      originalPath: '/Users/me/my-app-v1',
      entries: []
    }));
    fs.writeFileSync(path.join(dir2, 'sessions-index.json'), JSON.stringify({
      originalPath: '/Users/me/my-app-v2',
      entries: []
    }));

    // Search for exact name "my-app-v1" should match one
    const result = runGsdTools(`extract-messages my-app-v1 --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out.project, 'my-app-v1');
  });

  test('errors when sessions directory is unreadable', () => {
    const result = runGsdTools(`extract-messages test --path /nonexistent/path --raw`, tmpDir);
    assert.ok(!result.success);
  });
});

// ─── scan-sessions with index and verbose ────────────────────────────────────

describe('scan-sessions with sessions-index', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir('gsd-profile-test-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('uses originalPath from sessions-index.json for project name', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, '-Users-me-projects-cool-project-abc123');
    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'sessions-index.json'), JSON.stringify({
      originalPath: '/Users/me/projects/cool-project',
      entries: [{ sessionId: 'session-001', summary: 'test session', messageCount: 5 }]
    }));

    const msg = { type: 'user', userType: 'external', message: { content: 'hello' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.strictEqual(out[0].name, 'cool-project');
  });

  test('scan-sessions with --json flag works', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'json-test');
    fs.mkdirSync(projectDir, { recursive: true });

    const msg = { type: 'user', userType: 'external', message: { content: 'hi' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --json`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(Array.isArray(out));
  });

  test('scan-sessions includes verbose session details', () => {
    const sessionsDir = path.join(tmpDir, 'projects');
    const projectDir = path.join(sessionsDir, 'verbose-test');
    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'sessions-index.json'), JSON.stringify({
      originalPath: '/verbose/test',
      entries: [{ sessionId: 'session-001', summary: 'Did some work', messageCount: 10, created: '2025-01-01T00:00:00Z' }]
    }));

    const msg = { type: 'user', userType: 'external', message: { content: 'hi' }, timestamp: Date.now() };
    fs.writeFileSync(path.join(projectDir, 'session-001.jsonl'), JSON.stringify(msg) + '\n');

    const result = runGsdTools(`scan-sessions --path ${sessionsDir} --verbose --raw`, tmpDir);
    assert.ok(result.success, `Failed: ${result.error}`);
    const out = JSON.parse(result.output);
    assert.ok(out[0].sessions, 'verbose mode should include sessions array');
    assert.ok(out[0].sessions[0].summary === 'Did some work', 'should include session summary from index');
  });
});
