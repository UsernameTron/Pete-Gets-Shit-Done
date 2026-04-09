'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOOK_PATH = path.resolve(__dirname, '..', '.claude', 'hooks', 'lesson-capture-gate.cjs');
const {
  stripCode,
  countSignals,
  checkLessonsWindow,
  deriveSlug,
  parseTranscript,
} = require(HOOK_PATH);

// ---------- Fixture helpers ----------

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lcg-'));
  fs.mkdirSync(path.join(dir, 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  return dir;
}

function writeLessons(dir, content, mtimeMs) {
  const p = path.join(dir, 'tasks', 'lessons.md');
  fs.writeFileSync(p, content);
  if (mtimeMs !== undefined) {
    const t = new Date(mtimeMs);
    fs.utimesSync(p, t, t);
  }
  return p;
}

function writeTranscript(dir, lines) {
  const p = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(p, lines.map(l => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n'));
  return p;
}

function runHook(dir, payload) {
  return spawnSync('node', [HOOK_PATH], {
    cwd: dir,
    input: JSON.stringify(payload || {}),
    encoding: 'utf8',
  });
}

function userMsg(text, ts) {
  const o = { type: 'user', message: { role: 'user', content: text } };
  if (ts) o.timestamp = ts;
  return o;
}

function asstMsg(text, ts) {
  const o = { type: 'assistant', message: { role: 'assistant', content: text } };
  if (ts) o.timestamp = ts;
  return o;
}

// ---------- Pure function tests ----------

test('stripCode removes triple-backtick fenced blocks', () => {
  const input = "before ```\nyou're wrong\n``` after";
  assert.ok(!stripCode(input).toLowerCase().includes("you're wrong"));
});

test('stripCode removes triple-tilde fenced blocks', () => {
  const input = "before ~~~\nyou're wrong\n~~~ after";
  assert.ok(!stripCode(input).toLowerCase().includes("you're wrong"));
});

test('stripCode removes inline backtick spans', () => {
  const input = "before `no,` after";
  assert.ok(!stripCode(input).toLowerCase().includes('no,'));
});

test('deriveSlug: basic cwd', () => {
  assert.equal(deriveSlug('/Users/foo/projects/Bar'), '-Users-foo-projects-Bar');
});

test('deriveSlug: trailing slash is stripped', () => {
  assert.equal(deriveSlug('/Users/foo/projects/Bar/'), '-Users-foo-projects-Bar');
});

test('countSignals: dedup within a single message', () => {
  const msgs = [
    { role: 'user', content: "you're wrong you're wrong you're wrong you're wrong you're wrong" },
  ];
  assert.equal(countSignals(msgs), 1);
});

test('countSignals: case-insensitive match', () => {
  const lower = countSignals([{ role: 'user', content: "you're wrong" }]);
  const upper = countSignals([{ role: 'user', content: "YOU'RE WRONG" }]);
  assert.equal(lower, 1);
  assert.equal(upper, 1);
});

test('countSignals: sums across user and assistant turns', () => {
  const msgs = [
    { role: 'user', content: "that's wrong" },
    { role: 'assistant', content: "my mistake, let me fix this" },
  ];
  // user: "that's wrong" = 1; assistant: "my mistake" + "let me fix" = 2
  assert.equal(countSignals(msgs), 3);
});

test('countSignals: fenced code with signal is ignored', () => {
  const msgs = [
    { role: 'user', content: "here is the log: ```\nError: you're wrong input\n```" },
  ];
  assert.equal(countSignals(msgs), 0);
});

test('parseTranscript: skips malformed JSON lines without crashing', () => {
  const raw = [
    JSON.stringify(userMsg("that's wrong", '2026-04-09T10:00:00Z')),
    '{ not valid json',
    JSON.stringify(asstMsg('my mistake')),
  ].join('\n');
  const { messages, firstTimestamp } = parseTranscript(raw);
  assert.equal(messages.length, 2);
  assert.equal(firstTimestamp, '2026-04-09T10:00:00Z');
});

test('parseTranscript: empty input yields no messages', () => {
  const { messages, firstTimestamp } = parseTranscript('');
  assert.equal(messages.length, 0);
  assert.equal(firstTimestamp, null);
});

test('checkLessonsWindow: unparseable timestamp falls back to 4h window', () => {
  const dir = makeSandbox();
  const now = Date.now();
  const lessonsPath = writeLessons(dir, '# Lessons\n', now - 60 * 1000);
  const res = checkLessonsWindow(lessonsPath, 'not-a-date', now);
  assert.equal(res.reason, 'fallback-4h');
  assert.equal(res.updated, true);
});

test('checkLessonsWindow: >4h old with unparseable timestamp is not updated', () => {
  const dir = makeSandbox();
  const now = Date.now();
  const lessonsPath = writeLessons(dir, '# Lessons\n', now - 5 * 3600 * 1000);
  const res = checkLessonsWindow(lessonsPath, null, now);
  assert.equal(res.reason, 'fallback-4h');
  assert.equal(res.updated, false);
});

// ---------- Integration tests (spawned hook) ----------

test('zero correction signals → exit 0', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg('please add a feature', '2026-04-09T10:00:00Z'),
    asstMsg('done'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 0, res.stderr);
});

test('signals present + lessons newer than transcript start → exit 0', () => {
  const dir = makeSandbox();
  // Transcript says session started at T0; lessons.md is newer.
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  writeLessons(dir, '# Lessons\n- learned something new\n', sessionStart + 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("you're wrong", '2026-04-09T10:00:00Z'),
    asstMsg('fixed'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 0, res.stderr);
});

test('signals present + lessons unchanged in session → exit 2', () => {
  const dir = makeSandbox();
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  // lessons.md is OLDER than session start.
  writeLessons(dir, '# Lessons\n', sessionStart - 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("you're wrong", '2026-04-09T10:00:00Z'),
    asstMsg('ack'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /LESSON CAPTURE GATE/);
  assert.match(res.stderr, /1 correction signals/);
});

test('missing transcript payload AND no fallback → exit 0 with warning', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  // No transcript_path, and HOME pointed at a clean tmp dir so fallback glob is empty.
  const cleanHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lcg-home-'));
  const res = spawnSync('node', [HOOK_PATH], {
    cwd: dir,
    input: '{}',
    encoding: 'utf8',
    env: { ...process.env, HOME: cleanHome },
  });
  assert.equal(res.status, 0);
  assert.match(res.stderr, /no transcript found/);
});

test('session exemptions heading + recent mtime → exit 0 despite signals', () => {
  const dir = makeSandbox();
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  const content = '# Lessons\n\n## Session Exemptions\n- 2026-04-09: no actionable rule\n';
  writeLessons(dir, content, sessionStart + 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("that's wrong", '2026-04-09T10:00:00Z'),
    asstMsg('ok'),
  ]);
  // Roll back lessons mtime to BEFORE session start but add exemption — should still block
  // because exemption requires window check to pass. So test the PASS path: keep mtime recent.
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 0, res.stderr);
});

test('payload transcript_path wins over fallback glob', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  // Create a "fallback" transcript in a fake HOME that WOULD trigger block
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'lcg-home-'));
  const slug = '-' + dir.replaceAll('/', '-');
  const fakeProjDir = path.join(fakeHome, '.claude', 'projects', slug);
  fs.mkdirSync(fakeProjDir, { recursive: true });
  fs.writeFileSync(
    path.join(fakeProjDir, 'bad.jsonl'),
    JSON.stringify(userMsg("you're wrong", '2020-01-01T00:00:00Z')) + '\n'
  );
  // Payload points at a CLEAN transcript with no signals
  const goodTranscript = writeTranscript(dir, [
    userMsg('hello', '2026-04-09T10:00:00Z'),
  ]);
  const res = spawnSync('node', [HOOK_PATH], {
    cwd: dir,
    input: JSON.stringify({ transcript_path: goodTranscript }),
    encoding: 'utf8',
    env: { ...process.env, HOME: fakeHome },
  });
  assert.equal(res.status, 0, res.stderr);
});

test('debug log written on allow path', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  const transcript = writeTranscript(dir, [userMsg('hi', '2026-04-09T10:00:00Z')]);
  runHook(dir, { transcript_path: transcript });
  const logPath = path.join(dir, '.claude', 'hooks', 'lesson-capture-gate.log');
  assert.ok(fs.existsSync(logPath), 'debug log should exist');
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const entry = JSON.parse(lines[lines.length - 1]);
  assert.equal(entry.decision, 'allow');
});

test('debug log written on block path', () => {
  const dir = makeSandbox();
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  writeLessons(dir, '# Lessons\n', sessionStart - 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("you're wrong", '2026-04-09T10:00:00Z'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 2);
  const logPath = path.join(dir, '.claude', 'hooks', 'lesson-capture-gate.log');
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const entry = JSON.parse(lines[lines.length - 1]);
  assert.equal(entry.decision, 'block');
  assert.equal(entry.signals, 1);
});

test('malformed JSONL line does not crash the hook', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  const p = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(
    p,
    [
      JSON.stringify(userMsg('hello', '2026-04-09T10:00:00Z')),
      '{ not valid',
      JSON.stringify(asstMsg('world')),
    ].join('\n')
  );
  const res = runHook(dir, { transcript_path: p });
  assert.equal(res.status, 0, res.stderr);
});

test('empty transcript file → exit 0', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  const p = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(p, '');
  const res = runHook(dir, { transcript_path: p });
  assert.equal(res.status, 0, res.stderr);
});

test('uppercase correction signal triggers block', () => {
  const dir = makeSandbox();
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  writeLessons(dir, '# Lessons\n', sessionStart - 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("YOU'RE WRONG about this", '2026-04-09T10:00:00Z'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 2);
});

test('signals in fenced code block do NOT trigger block', () => {
  const dir = makeSandbox();
  const sessionStart = Date.parse('2026-04-09T10:00:00Z');
  writeLessons(dir, '# Lessons\n', sessionStart - 60 * 1000);
  const transcript = writeTranscript(dir, [
    userMsg("look at this log:\n```\nno, don't do that\n```", '2026-04-09T10:00:00Z'),
  ]);
  const res = runHook(dir, { transcript_path: transcript });
  assert.equal(res.status, 0, res.stderr);
});
