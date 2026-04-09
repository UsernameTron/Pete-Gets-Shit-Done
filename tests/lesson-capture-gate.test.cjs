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
  splitSentences,
  hasRebuttalMarker,
  isBootTurn,
  findFallbackTranscript,
  hasValidExemption,
  writeDebugLog,
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
  const slug = deriveSlug(dir);
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

// ============================================================================
// Commit 2 additive coverage: +73 tests for the tightened matcher.
// Block structure:
//   1) splitSentences unit (8)
//   2) hasRebuttalMarker unit (7)
//   3) isBootTurn unit (6)
//   4) matchStrongTier via countSignals (7)
//   5) matchMediumTier + T33 speaker-gate (8)
//   6) fixture integration via parseTranscript (4)
//   7) positive spec cases #1..#12 (12)
//   8) negative spec cases #1..#12 (12)
//   9) Tightening 1 — double-quote strip (3)
//  10) Tightening 2 — strong-assistant comma-precedent (3)
//  11) Tightening 3 — session-boot early return (3)
// ============================================================================

// ---------- Block 1: splitSentences (8) ----------

test('splitSentences: basic period split', () => {
  assert.deepEqual(splitSentences('hello. world.'), ['hello', 'world']);
});

test('splitSentences: mixed punctuation .!?', () => {
  assert.deepEqual(splitSentences('hi! how? ok.'), ['hi', 'how', 'ok']);
});

test('splitSentences: newlines split', () => {
  assert.deepEqual(splitSentences('a\nb\nc'), ['a', 'b', 'c']);
});

test('splitSentences: trims whitespace and lowercases', () => {
  assert.deepEqual(splitSentences('  HELLO  . WORLD '), ['hello', 'world']);
});

test('splitSentences: empty string yields empty array', () => {
  assert.deepEqual(splitSentences(''), []);
});

test('splitSentences: non-string inputs yield empty array', () => {
  assert.deepEqual(splitSentences(null), []);
  assert.deepEqual(splitSentences(undefined), []);
  assert.deepEqual(splitSentences(42), []);
});

test('splitSentences: consecutive delimiters collapse', () => {
  assert.deepEqual(splitSentences('a...b'), ['a', 'b']);
});

test('splitSentences: trailing delimiter drops empty tail', () => {
  assert.deepEqual(splitSentences('done.'), ['done']);
});

// ---------- Block 2: hasRebuttalMarker (7) ----------

test("hasRebuttalMarker: 'no,' fires", () => {
  assert.equal(hasRebuttalMarker('no, that is off'), true);
});

test("hasRebuttalMarker: 'no.' fires", () => {
  assert.equal(hasRebuttalMarker('no. try again'), true);
});

test("hasRebuttalMarker: 'wrong,' fires", () => {
  assert.equal(hasRebuttalMarker('wrong, fix it'), true);
});

test("hasRebuttalMarker: 'wrong.' fires", () => {
  assert.equal(hasRebuttalMarker('wrong. look again'), true);
});

test("hasRebuttalMarker: em-dash '— ' fires", () => {
  assert.equal(hasRebuttalMarker('actually — revisit this'), true);
});

test("hasRebuttalMarker: leading 'you ' fires", () => {
  assert.equal(hasRebuttalMarker('you missed this'), true);
});

test('hasRebuttalMarker: plain/empty/null inputs do not fire', () => {
  assert.equal(hasRebuttalMarker('plain descriptive text'), false);
  assert.equal(hasRebuttalMarker(''), false);
  assert.equal(hasRebuttalMarker(null), false);
});

// ---------- Block 3: isBootTurn (6) ----------

test('isBootTurn: gsd:prime-patterns marker', () => {
  assert.equal(
    isBootTurn({ content: 'prelude <command-name>/gsd:prime-patterns</command-name> trailing' }),
    true
  );
});

test('isBootTurn: /clear marker', () => {
  assert.equal(isBootTurn({ content: '<command-name>/clear</command-name>' }), true);
});

test('isBootTurn: command-name + local-command-stdout sibling tags', () => {
  assert.equal(
    isBootTurn({
      content: '<command-name>foo</command-name><local-command-stdout>bar</local-command-stdout>',
    }),
    true
  );
});

test('isBootTurn: short residual after system-reminder strip', () => {
  assert.equal(
    isBootTurn({ content: '<system-reminder>lots and lots of content here</system-reminder>ok' }),
    true
  );
});

test('isBootTurn: bare correction signal is NOT a boot turn', () => {
  assert.equal(isBootTurn({ content: "you're wrong" }), false);
});

test('isBootTurn: null / missing-content / non-string content returns false', () => {
  assert.equal(isBootTurn(null), false);
  assert.equal(isBootTurn({}), false);
  assert.equal(isBootTurn({ content: 123 }), false);
});

// ---------- Block 4: strong tier via countSignals (7) ----------

test("strong user: 'that's not correct' fires as substring", () => {
  assert.equal(countSignals([{ role: 'user', content: "that's not correct" }]), 1);
});

test("strong user: 'i said ' sentence-start prefix fires", () => {
  assert.equal(countSignals([{ role: 'user', content: 'i said use a single dash' }]), 1);
});

test('strong user: opening turn (no prior assistant) still fires', () => {
  assert.equal(countSignals([{ role: 'user', content: "you're wrong" }]), 1);
});

test("strong assistant: 'my mistake' sentence-initial fires", () => {
  assert.equal(countSignals([{ role: 'assistant', content: 'my mistake' }]), 1);
});

test('strong assistant: comma-precedent enables mid-sentence match', () => {
  assert.equal(
    countSignals([{ role: 'assistant', content: 'correcting the spec, my mistake' }]),
    2
  );
});

test("strong assistant: mid-sentence without preceding ', ' does NOT fire", () => {
  assert.equal(
    countSignals([{ role: 'assistant', content: 'the spec was wrong my mistake' }]),
    0
  );
});

test("strong assistant: 'yes, my mistake' fires via comma-precedent", () => {
  assert.equal(countSignals([{ role: 'assistant', content: 'yes, my mistake' }]), 1);
});

// ---------- Block 5: medium tier + T33 speaker-gate (8) ----------

test("medium: 'no,' licenses 'don't' in same sentence after assistant", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "no, don't do that" },
    ]),
    1
  );
});

test("medium: bare 'don't' after assistant without marker → 0", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "don't touch auth" },
    ]),
    0
  );
});

test("medium: 'no, don't' in opening user turn (no prev assistant) → 0", () => {
  assert.equal(countSignals([{ role: 'user', content: "no, don't do that" }]), 0);
});

test("medium: 'wrong,' licenses 'try again' via rebuttal prefix", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'wrong, try again later' },
    ]),
    1
  );
});

test("medium: 'no,' licenses 'stop' via rebuttal prefix", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'no, stop that nonsense' },
    ]),
    1
  );
});

test('medium: prior-sentence rebuttal licenses current-sentence medium', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "no, wait. don't do that" },
    ]),
    1
  );
});

test('medium: priorSentence resets between turns (no cross-turn lookback)', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'a' },
      { role: 'user', content: 'no, wait' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: "don't do that" },
    ]),
    0
  );
});

test('medium: prev=user (T33 fails) blocks medium even with rebuttal marker', () => {
  assert.equal(
    countSignals([
      { role: 'user', content: 'first' },
      { role: 'user', content: "no, don't do that" },
    ]),
    0
  );
});

// ---------- Block 6: fixture integration via parseTranscript (4) ----------

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures', 'layer1-false-positives.jsonl');

test('fixture: parseTranscript → countSignals = 0 (Layer 1 regression contract)', () => {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const { messages } = parseTranscript(raw);
  assert.equal(countSignals(messages), 0);
});

test('fixture: parseTranscript yields ≥10 messages (routing sanity)', () => {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const { messages } = parseTranscript(raw);
  assert.ok(messages.length >= 10, `expected ≥10 messages, got ${messages.length}`);
});

test('fixture: parsed messages contain both user and assistant roles', () => {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const { messages } = parseTranscript(raw);
  const roles = new Set(messages.map(m => m.role));
  assert.ok(roles.has('user'), 'expected user messages');
  assert.ok(roles.has('assistant'), 'expected assistant messages');
});

test('fixture: runHook exits 0 when fed the Layer 1 fixture transcript', () => {
  const dir = makeSandbox();
  writeLessons(dir, '# Lessons\n', Date.now() - 10 * 3600 * 1000);
  const fixtureRaw = fs.readFileSync(FIXTURE_PATH, 'utf8');
  const p = path.join(dir, 'transcript.jsonl');
  fs.writeFileSync(p, fixtureRaw);
  const res = runHook(dir, { transcript_path: p });
  assert.equal(res.status, 0, res.stderr);
});

// ---------- Block 7: 12 positive spec cases ----------

test("positive #1: \"you're wrong about the slug format\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "you're wrong about the slug format" },
    ]),
    1
  );
});

test("positive #2: \"that's not what I said. re-read the spec.\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "that's not what I said. re-read the spec." },
    ]),
    2
  );
});

test("positive #3: \"no, don't do that — you missed the edge case\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "no, don't do that — you missed the edge case" },
    ]),
    2
  );
});

test("positive #4 (reconciled): \"you're wrong. don't touch deriveSlug.\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "you're wrong. don't touch deriveSlug." },
    ]),
    1
  );
});

test('positive #5: "I said use a single dash"', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'I said use a single dash' },
    ]),
    1
  );
});

test("positive #6 (reconciled): \"try again. that's not right.\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "try again. that's not right." },
    ]),
    1
  );
});

test("positive #7: \"stop — that's wrong\"", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "stop — that's wrong" },
    ]),
    2
  );
});

test('positive #8: assistant "my mistake, let me fix that"', () => {
  assert.equal(
    countSignals([{ role: 'assistant', content: 'my mistake, let me fix that' }]),
    2
  );
});

test('positive #9: assistant "you\'re right, I was wrong about the spec"', () => {
  assert.equal(
    countSignals([{ role: 'assistant', content: "you're right, I was wrong about the spec" }]),
    2
  );
});

test('positive #10: "you missed the test case for trailing slash"', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'you missed the test case for trailing slash' },
    ]),
    1
  );
});

test('positive #11: "re-read the deriveSlug section"', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 're-read the deriveSlug section' },
    ]),
    1
  );
});

test('positive #12 (reconciled): "incorrect. try again."', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'incorrect. try again.' },
    ]),
    1
  );
});

// ---------- Block 8: 12 negative spec cases ----------

test('negative #1: opening user turn (no prior asst), long imperative → 0', () => {
  assert.equal(
    countSignals([
      {
        role: 'user',
        content:
          'Layer 2 must tighten the phrase set. Do NOT pop the stash. Do NOT switch branches.',
      },
    ]),
    0
  );
});

test("negative #2: bare \"don't touch auth module\" → 0", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "don't touch auth module" },
    ]),
    0
  );
});

test('negative #3: "stop at Layer 1" → 0', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'stop at Layer 1' },
    ]),
    0
  );
});

test("negative #4: \"no, let's proceed with option B instead\" → 0", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "no, let's proceed with option B instead" },
    ]),
    0
  );
});

test('negative #5: "the correction is in section 3" → 0', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'the correction is in section 3' },
    ]),
    0
  );
});

test('negative #6: "actually, that approach works" → 0', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'actually, that approach works' },
    ]),
    0
  );
});

test('negative #7: "try to avoid coupling the two modules" → 0', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'try to avoid coupling the two modules' },
    ]),
    0
  );
});

test("negative #8: \"I said X earlier but let's revisit\" → ≥1 (documented accepted FP)", () => {
  // Spec-documented acceptable false positive: "i said " is strong-tier sentence-start.
  assert.ok(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "I said X earlier but let's revisit" },
    ]) >= 1
  );
});

test("negative #9: \"don't forget to run the full suite\" → 0", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "don't forget to run the full suite" },
    ]),
    0
  );
});

test('negative #10: "the stop hook blocks on correction signals" → 0', () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: 'the stop hook blocks on correction signals' },
    ]),
    0
  );
});

test("negative #11: \"no phrase matching on 'don't' alone\" → 0", () => {
  assert.equal(
    countSignals([
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "no phrase matching on 'don't' alone" },
    ]),
    0
  );
});

test('negative #12: assistant "I will stop after Layer 1" → 0', () => {
  assert.equal(countSignals([{ role: 'assistant', content: 'I will stop after Layer 1' }]), 0);
});

// ---------- Block 9: Tightening 1 — double-quote strip (3) ----------

test('T1: short double-quoted signal phrase is stripped (≤200 chars)', () => {
  assert.equal(
    countSignals([{ role: 'user', content: 'he said "you\'re wrong" about it earlier' }]),
    0
  );
});

test('T1: >200 char quoted span is NOT stripped (regex bound)', () => {
  const padding = 'x'.repeat(220);
  const content = `he said "${padding} you're wrong ${padding}" about it`;
  assert.equal(countSignals([{ role: 'user', content }]), 1);
});

test('T1: unterminated double-quote is NOT stripped', () => {
  assert.equal(
    countSignals([{ role: 'user', content: 'he opened with "you\'re wrong and kept going' }]),
    1
  );
});

// ---------- Block 10: Tightening 2 — strong-assistant comma-precedent (3) ----------

test('T2: strong-assistant sentence-initial fires', () => {
  assert.equal(countSignals([{ role: 'assistant', content: 'let me fix this bug now' }]), 1);
});

test("T2: strong-assistant fires when preceded by ', '", () => {
  assert.equal(countSignals([{ role: 'assistant', content: 'yes, i was wrong here' }]), 1);
});

test("T2: strong-assistant mid-sentence without ', ' does NOT fire", () => {
  assert.equal(
    countSignals([{ role: 'assistant', content: 'the thing is i was wrong here' }]),
    0
  );
});

// ---------- Block 11: Tightening 3 — session-boot early return (3) ----------

test('T3: first user turn with /gsd:prime-patterns marker suppresses whole session', () => {
  assert.equal(
    countSignals([
      { role: 'user', content: '<command-name>/gsd:prime-patterns</command-name>' },
      { role: 'user', content: "you're wrong" },
    ]),
    0
  );
});

test('T3: boot marker in 3rd user turn (within first 5) suppresses whole session', () => {
  assert.equal(
    countSignals([
      { role: 'user', content: 'hello' },
      { role: 'user', content: 'ok' },
      { role: 'user', content: '<command-name>/clear</command-name>' },
      { role: 'user', content: "you're wrong" },
    ]),
    0
  );
});

test('T3: first 5 user turns non-boot → later strong signal still fires', () => {
  assert.equal(
    countSignals([
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
      { role: 'user', content: 'c' },
      { role: 'user', content: 'd' },
      { role: 'user', content: 'e' },
      { role: 'assistant', content: 'ack' },
      { role: 'user', content: "you're wrong" },
    ]),
    1
  );
});

// ========== Infrastructure coverage: findFallbackTranscript ==========

test('findFallbackTranscript returns null for nonexistent directory', () => {
  assert.equal(findFallbackTranscript('/tmp/does-not-exist-lcg-test-' + Date.now()), null);
});

test('findFallbackTranscript returns most recent .jsonl from slug directory', () => {
  const sandbox = makeSandbox();
  const slug = deriveSlug(sandbox);
  const projDir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(projDir, { recursive: true });
  try {
    const older = path.join(projDir, 'aaa.jsonl');
    const newer = path.join(projDir, 'bbb.jsonl');
    fs.writeFileSync(older, '{"type":"user"}\n');
    // Ensure different mtime
    const past = Date.now() - 5000;
    fs.utimesSync(older, new Date(past), new Date(past));
    fs.writeFileSync(newer, '{"type":"assistant"}\n');
    const result = findFallbackTranscript(sandbox);
    assert.equal(result, newer);
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
  }
});

test('findFallbackTranscript returns null when directory has no .jsonl files', () => {
  const sandbox = makeSandbox();
  const slug = deriveSlug(sandbox);
  const projDir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(projDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(projDir, 'readme.txt'), 'not a jsonl');
    assert.equal(findFallbackTranscript(sandbox), null);
  } finally {
    fs.rmSync(projDir, { recursive: true, force: true });
  }
});

// ========== Infrastructure coverage: hasValidExemption ==========

test('hasValidExemption returns false when lessons file does not exist', () => {
  assert.equal(hasValidExemption('/tmp/no-such-file-lcg-' + Date.now(), Date.now()), false);
});

test('hasValidExemption returns false when no Session Exemptions heading exists', () => {
  const sandbox = makeSandbox();
  const lpath = path.join(sandbox, 'tasks', 'lessons.md');
  fs.writeFileSync(lpath, '# Lessons\n\n## Active Rules\n- some rule\n');
  assert.equal(hasValidExemption(lpath, Date.now() - 1000), false);
});

test('hasValidExemption returns true when heading exists and file was recently modified', () => {
  const sandbox = makeSandbox();
  const lpath = path.join(sandbox, 'tasks', 'lessons.md');
  fs.writeFileSync(lpath, '# Lessons\n\n## Session Exemptions\n- exempt\n');
  // File was just written, so mtime > firstTimestamp
  assert.equal(hasValidExemption(lpath, Date.now() - 60000), true);
});

// ========== Infrastructure coverage: writeDebugLog ==========

test('writeDebugLog writes JSON line to log file', () => {
  const sandbox = makeSandbox();
  const origCwd = process.cwd();
  try {
    process.chdir(sandbox);
    writeDebugLog({ test: true, ts: 'now' });
    const logPath = path.join(sandbox, '.claude', 'hooks', 'lesson-capture-gate.log');
    assert.ok(fs.existsSync(logPath));
    const content = fs.readFileSync(logPath, 'utf8').trim();
    const parsed = JSON.parse(content);
    assert.equal(parsed.test, true);
  } finally {
    process.chdir(origCwd);
  }
});

test('writeDebugLog silently succeeds even on read-only directory', () => {
  // Calling with a cwd that lacks .claude/hooks should not throw
  const origCwd = process.cwd();
  try {
    process.chdir(os.tmpdir());
    // Should not throw — the catch block swallows the error
    writeDebugLog({ test: 'noop' });
  } finally {
    process.chdir(origCwd);
  }
});

// ========== Infrastructure coverage: main() via subprocess ==========

test('main() exits 0 with no transcript (stdin empty, no fallback)', () => {
  const result = spawnSync(process.execPath, [HOOK_PATH], {
    input: JSON.stringify({ transcript_path: '/tmp/nonexistent-lcg-' + Date.now() + '.jsonl' }),
    cwd: os.tmpdir(),
    timeout: 5000,
  });
  assert.equal(result.status, 0);
});

test('main() exits 0 with empty stdin (parse fallback)', () => {
  const result = spawnSync(process.execPath, [HOOK_PATH], {
    input: '',
    cwd: os.tmpdir(),
    timeout: 5000,
  });
  assert.equal(result.status, 0);
});

test('main() exits 0 with malformed JSON stdin', () => {
  const result = spawnSync(process.execPath, [HOOK_PATH], {
    input: '{{not json}}',
    cwd: os.tmpdir(),
    timeout: 5000,
  });
  assert.equal(result.status, 0);
});
