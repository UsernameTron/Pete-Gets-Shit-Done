#!/usr/bin/env node
/**
 * Lesson-Capture Stop Gate
 *
 * Fires on Stop event. Scans the active session transcript for correction
 * signals. If signals are present and tasks/lessons.md has not been updated
 * within the session window, blocks the Stop with exit 2.
 *
 * Escape hatch: a `## Session Exemptions` heading in lessons.md with a
 * recent mtime bypasses the block.
 *
 * Infrastructure failures (missing transcript, unreadable files) never
 * block — they log to stderr and exit 0.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Correction signal sets ----------

const USER_SIGNALS = [
  "you're wrong",
  "that's wrong",
  "no,",
  "incorrect",
  "don't",
  "stop",
  "actually",
  "re-read",
  "you missed",
  "try again",
  "that's not",
  "i said",
  "correction",
];

const ASSISTANT_SIGNALS = [
  "you're right",
  "my mistake",
  "i was wrong",
  "correcting",
  "let me fix",
];

const FOUR_HOURS_MS = 4 * 3600 * 1000;

// ---------- Pure helpers (exported for tests) ----------

/**
 * Strip fenced code blocks and inline backtick spans from text so
 * signal phrases inside code samples don't trigger false positives.
 */
function stripCode(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ');
}

/**
 * Count distinct correction signals in a list of messages.
 * Dedup is per (message_index, phrase) pair — the same phrase repeated
 * inside one message counts once.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {number}
 */
function countSignals(messages) {
  let total = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg.content !== 'string') continue;
    const cleaned = stripCode(msg.content).toLowerCase();
    const phrases = msg.role === 'assistant' ? ASSISTANT_SIGNALS : USER_SIGNALS;
    const matched = new Set();
    for (const phrase of phrases) {
      if (cleaned.includes(phrase)) matched.add(phrase);
    }
    total += matched.size;
  }
  return total;
}

/**
 * Decide whether lessons.md counts as "updated in the current session".
 *
 * Preferred: compare lessons.md mtime against the first transcript line's
 * timestamp. If the timestamp is unparseable, fall back to a 4-hour window
 * from now.
 *
 * @param {string} lessonsPath
 * @param {string|null} firstTimestamp - ISO string or null
 * @param {number} [now=Date.now()]
 * @returns {{updated: boolean, lessonsMtimeMs: number|null, reason: string}}
 */
function checkLessonsWindow(lessonsPath, firstTimestamp, now = Date.now()) {
  let lessonsMtimeMs = null;
  try {
    lessonsMtimeMs = fs.statSync(lessonsPath).mtimeMs;
  } catch (_err) {
    return { updated: false, lessonsMtimeMs: null, reason: 'lessons-missing' };
  }

  let startMs = null;
  if (firstTimestamp) {
    const parsed = Date.parse(firstTimestamp);
    if (!Number.isNaN(parsed)) startMs = parsed;
  }

  if (startMs !== null) {
    return {
      updated: lessonsMtimeMs >= startMs,
      lessonsMtimeMs,
      reason: 'timestamp-window',
    };
  }

  // Fallback: 4-hour window from now
  return {
    updated: now - lessonsMtimeMs < FOUR_HOURS_MS,
    lessonsMtimeMs,
    reason: 'fallback-4h',
  };
}

/**
 * Derive the Claude Code project slug from a working directory path.
 * Matches Claude Code's on-disk layout — the leading "/" of an absolute
 * path becomes the single leading "-" of the slug, e.g.
 *   /Users/foo/projects/Bar  →  -Users-foo-projects-Bar
 * Trailing slashes are stripped first.
 */
function deriveSlug(cwd) {
  let normalized = String(cwd || '');
  while (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized.replaceAll('/', '-');
}

/**
 * Parse a JSONL transcript string into a list of {role, content} messages
 * plus the first line's timestamp (if any). Malformed lines are skipped.
 *
 * @param {string} raw
 * @returns {{messages: Array<{role: string, content: string}>, firstTimestamp: string|null}}
 */
function parseTranscript(raw) {
  const messages = [];
  let firstTimestamp = null;
  if (!raw) return { messages, firstTimestamp };

  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (_err) {
      continue;
    }

    if (firstTimestamp === null) {
      firstTimestamp = obj.timestamp || obj.ts || null;
    }

    // Claude Code transcripts: {type: "user"|"assistant", message: {role, content}}
    // Also support simpler {role, content} shapes for tests.
    const role = obj.role || (obj.message && obj.message.role) || obj.type;
    if (role !== 'user' && role !== 'assistant') continue;

    const rawContent = obj.content !== undefined
      ? obj.content
      : (obj.message && obj.message.content);

    let contentText = '';
    if (typeof rawContent === 'string') {
      contentText = rawContent;
    } else if (Array.isArray(rawContent)) {
      contentText = rawContent
        .map(part => (typeof part === 'string' ? part : (part && part.text) || ''))
        .join('\n');
    }
    messages.push({ role, content: contentText });
  }

  return { messages, firstTimestamp };
}

// ---------- Transcript location ----------

function findFallbackTranscript(cwd) {
  const slug = deriveSlug(cwd);
  const dir = path.join(os.homedir(), '.claude', 'projects', slug);
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (_err) {
    return null;
  }
  const jsonls = entries
    .filter(n => n.endsWith('.jsonl'))
    .map(n => {
      const full = path.join(dir, n);
      try {
        return { full, mtime: fs.statSync(full).mtimeMs };
      } catch (_err) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
  return jsonls.length ? jsonls[0].full : null;
}

// ---------- Session Exemptions check ----------

function hasValidExemption(lessonsPath, firstTimestamp, now = Date.now()) {
  let raw;
  try {
    raw = fs.readFileSync(lessonsPath, 'utf8');
  } catch (_err) {
    return false;
  }
  if (!/^##\s+Session Exemptions/im.test(raw)) return false;
  const { updated } = checkLessonsWindow(lessonsPath, firstTimestamp, now);
  return updated;
}

// ---------- Debug log ----------

function writeDebugLog(entry) {
  try {
    const logPath = path.join(process.cwd(), '.claude', 'hooks', 'lesson-capture-gate.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  } catch (_err) {
    // Logging must never block the hook
  }
}

// ---------- Main ----------

function main() {
  // Read JSON payload from stdin
  let payload = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (raw.trim()) payload = JSON.parse(raw);
  } catch (_err) {
    payload = {};
  }

  const cwd = process.cwd();
  let transcriptPath = payload.transcript_path || null;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    transcriptPath = findFallbackTranscript(cwd);
  }

  if (!transcriptPath) {
    process.stderr.write('lesson-capture-gate: no transcript found, skipping scan\n');
    writeDebugLog({
      ts: new Date().toISOString(),
      signals: 0,
      lessons_mtime: null,
      transcript: null,
      decision: 'allow',
      reason: 'no-transcript',
    });
    process.exit(0);
  }

  let transcriptRaw;
  try {
    transcriptRaw = fs.readFileSync(transcriptPath, 'utf8');
  } catch (_err) {
    process.stderr.write('lesson-capture-gate: transcript unreadable, skipping scan\n');
    writeDebugLog({
      ts: new Date().toISOString(),
      signals: 0,
      lessons_mtime: null,
      transcript: transcriptPath,
      decision: 'allow',
      reason: 'transcript-unreadable',
    });
    process.exit(0);
  }

  const { messages, firstTimestamp } = parseTranscript(transcriptRaw);
  const signals = countSignals(messages);
  const lessonsPath = path.join(cwd, 'tasks', 'lessons.md');
  const { updated, lessonsMtimeMs } = checkLessonsWindow(lessonsPath, firstTimestamp);

  if (signals === 0) {
    writeDebugLog({
      ts: new Date().toISOString(),
      signals,
      lessons_mtime: lessonsMtimeMs,
      transcript: transcriptPath,
      decision: 'allow',
      reason: 'no-signals',
    });
    process.exit(0);
  }

  if (updated) {
    writeDebugLog({
      ts: new Date().toISOString(),
      signals,
      lessons_mtime: lessonsMtimeMs,
      transcript: transcriptPath,
      decision: 'allow',
      reason: 'lessons-updated',
    });
    process.exit(0);
  }

  if (hasValidExemption(lessonsPath, firstTimestamp)) {
    writeDebugLog({
      ts: new Date().toISOString(),
      signals,
      lessons_mtime: lessonsMtimeMs,
      transcript: transcriptPath,
      decision: 'allow',
      reason: 'session-exemption',
    });
    process.exit(0);
  }

  const msg =
    `LESSON CAPTURE GATE: ${signals} correction signals detected in this session ` +
    `and tasks/lessons.md has no new entries.\n` +
    `Run the lesson-capture subagent before closing the session:\n` +
    `  Task tool → lesson-capture-subagent\n` +
    `Or append a single-line justification to tasks/lessons.md under a ` +
    `"## Session Exemptions" section.\n`;
  process.stderr.write(msg);
  writeDebugLog({
    ts: new Date().toISOString(),
    signals,
    lessons_mtime: lessonsMtimeMs,
    transcript: transcriptPath,
    decision: 'block',
    reason: 'signals-no-capture',
  });
  process.exit(2);
}

// ---------- Exports for tests ----------

exports.stripCode = stripCode;
exports.countSignals = countSignals;
exports.checkLessonsWindow = checkLessonsWindow;
exports.deriveSlug = deriveSlug;
exports.parseTranscript = parseTranscript;

if (require.main === module) {
  main();
}
