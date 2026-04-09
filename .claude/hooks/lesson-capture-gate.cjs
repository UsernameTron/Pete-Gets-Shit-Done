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
 *
 * Commit 2 — tiered matcher:
 *   - Strong user tokens fire regardless of speaker context.
 *   - Medium user tokens require a speaker-turn transition from assistant
 *     to operator AND a rebuttal marker in the current or prior sentence
 *     within the same turn.
 *   - Strong assistant tokens fire only sentence-initial or after ", ".
 *   - Session-level boot rule: if any of the first 5 user turns contains
 *     a Claude Code boot command marker, the whole session returns 0.
 *   - Per-turn boot detection handles mixed/concatenated transcripts.
 *   - stripCode also strips ≤200-char double-quoted spans to kill
 *     meta-quoted example phrases.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Frozen correction phrase sets ----------

const STRONG_USER = Object.freeze([
  "you're wrong",
  "that's wrong",
  "that's not right",
  "that's not correct",
  "that's not what i said",
  "you missed",
  "re-read",
  "incorrect",
]);

const STRONG_USER_SENTENCE_START = Object.freeze([
  "i said ",
]);

const MEDIUM_USER = Object.freeze([
  "don't",
  "stop",
  "try again",
]);

const STRONG_ASSISTANT = Object.freeze([
  "you're right",
  "my mistake",
  "i was wrong",
  "let me fix",
  "correcting",
]);

// Documented-for-audit: these tokens NEVER fire as correction signals.
// `no,`/`wrong.` still act as rebuttal markers inside hasRebuttalMarker.
const DROPPED_FROM_SIGNAL_SET = Object.freeze([
  "correction",
  "actually",
  "no,",
]);

const BOOT_COMMAND_MARKERS = Object.freeze([
  "<command-name>/gsd:prime-patterns",
  "<command-name>/clear",
  "<command-name>/prime",
  "<command-name>/wrap",
  "<command-name>/gsd:",
]);

const FOUR_HOURS_MS = 4 * 3600 * 1000;

// ---------- Pure helpers (exported for tests) ----------

/**
 * Strip fenced code blocks, inline backtick spans, and short double-quoted
 * spans (≤200 chars) so meta-discussion that quotes example phrases doesn't
 * fire correction signals.
 */
function stripCode(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/"[^"\n]{1,200}"/g, ' ');
}

/**
 * Split text into lowercased sentence-sized chunks on ., !, ?, newlines.
 * Returns a de-whitespaced, non-empty array.
 */
function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);
}

/**
 * Return true if the sentence contains a rebuttal marker — the signal
 * that what follows is a correction rather than a description.
 */
function hasRebuttalMarker(sentence) {
  if (typeof sentence !== 'string' || !sentence) return false;
  if (sentence.includes('no,') || sentence.includes('no.')) return true;
  if (sentence.includes('wrong,') || sentence.includes('wrong.')) return true;
  if (sentence.includes('— ')) return true;
  if (sentence.includes(' you ')) return true;
  if (sentence.startsWith('you ')) return true;
  return false;
}

/**
 * A turn is a boot turn if:
 *   (a) content contains a known Claude Code boot command marker, OR
 *   (b) both <command-name> and <local-command-stdout> sibling tags exist, OR
 *   (c) the turn was dominated by <system-reminder>/<command-*> blocks and
 *       the residual trimmed content is <20 chars.
 *
 * Clause (c) only triggers when such blocks were actually present — a bare
 * "you're wrong" message is NOT a boot turn.
 */
function isBootTurn(msg) {
  if (!msg || typeof msg.content !== 'string') return false;
  const content = msg.content;

  for (const marker of BOOT_COMMAND_MARKERS) {
    if (content.includes(marker)) return true;
  }

  if (content.includes('<command-name>') && content.includes('<local-command-stdout>')) {
    return true;
  }

  if (/<system-reminder>|<command-/.test(content)) {
    const stripped = content
      .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
      .replace(/<command-[a-z-]+>[\s\S]*?<\/command-[a-z-]+>/g, '')
      .trim();
    if (stripped.length < 20) return true;
  }

  return false;
}

/**
 * Classify a turn for tier matching.
 *   - 'skip'      — malformed / non-user-or-assistant
 *   - 'boot'      — boot or boot-dominated turn, contributes zero
 *   - 'assistant' — assistant turn, strong-assistant tier only
 *   - 'operator'  — user turn, full tier processing
 */
function classifyTurn(msg /* , prevRole */) {
  if (!msg || typeof msg.content !== 'string') return 'skip';
  if (msg.role !== 'user' && msg.role !== 'assistant') return 'skip';
  if (isBootTurn(msg)) return 'boot';
  return msg.role === 'assistant' ? 'assistant' : 'operator';
}

/**
 * Strong tier — returns a Set of matched phrases for the given sentence.
 * For user turns: STRONG_USER as substring + STRONG_USER_SENTENCE_START as prefix.
 * For assistant turns: STRONG_ASSISTANT only sentence-initial OR preceded by ", ".
 */
function matchStrongTier(sentence, role) {
  const matches = new Set();
  if (typeof sentence !== 'string' || !sentence) return matches;

  if (role === 'user') {
    for (const phrase of STRONG_USER) {
      if (sentence.includes(phrase)) matches.add(phrase);
    }
    for (const phrase of STRONG_USER_SENTENCE_START) {
      if (sentence.startsWith(phrase)) matches.add(phrase);
    }
    return matches;
  }

  if (role === 'assistant') {
    for (const phrase of STRONG_ASSISTANT) {
      if (sentence.startsWith(phrase)) {
        matches.add(phrase);
        continue;
      }
      const idx = sentence.indexOf(phrase);
      if (idx > 0 && sentence.slice(0, idx).includes(', ')) {
        matches.add(phrase);
      }
    }
  }

  return matches;
}

/**
 * Medium tier — only contributes when `licensed` is true (caller has
 * verified speaker-turn adjacency + rebuttal marker).
 * A phrase fires if it is sentence-initial with content after it, OR
 * a rebuttal marker appears before the phrase in the sentence.
 */
function matchMediumTier(sentence, licensed) {
  const matches = new Set();
  if (!licensed || typeof sentence !== 'string' || !sentence) return matches;

  for (const phrase of MEDIUM_USER) {
    if (sentence.startsWith(phrase)) {
      if (sentence.length > phrase.length) matches.add(phrase);
      continue;
    }
    const idx = sentence.indexOf(phrase);
    if (idx > 0) {
      const prefix = sentence.slice(0, idx);
      if (/(no[,.]|wrong[,.]|— )/.test(prefix)) {
        matches.add(phrase);
      }
    }
  }

  return matches;
}

/**
 * Count distinct correction signals in a list of messages using the
 * tiered matcher. Session-level boot early return + per-turn classification
 * + per-sentence Set dedup with one-sentence rebuttal lookback.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {number}
 */
function countSignals(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 0;

  // Tightening 3: session-level boot early return.
  // If any of the first 5 user turns matches a boot command marker,
  // the whole session is contractually non-correcting.
  let userTurnsSeen = 0;
  for (let i = 0; i < messages.length && userTurnsSeen < 5; i++) {
    const m = messages[i];
    if (!m || m.role !== 'user' || typeof m.content !== 'string') continue;
    userTurnsSeen++;
    for (const marker of BOOT_COMMAND_MARKERS) {
      if (m.content.includes(marker)) return 0;
    }
  }

  let total = 0;
  let prevRole = null;

  for (const msg of messages) {
    const cls = classifyTurn(msg, prevRole);
    if (cls === 'skip' || cls === 'boot') {
      if (msg && msg.role) prevRole = msg.role;
      continue;
    }

    const cleaned = stripCode(msg.content);
    const sentences = splitSentences(cleaned);

    let priorSentence = '';
    for (const sentence of sentences) {
      const matches = new Set();

      for (const hit of matchStrongTier(sentence, msg.role)) {
        matches.add(hit);
      }

      if (cls === 'operator' && prevRole === 'assistant') {
        const licensed =
          hasRebuttalMarker(sentence) || hasRebuttalMarker(priorSentence);
        for (const hit of matchMediumTier(sentence, licensed)) {
          matches.add(hit);
        }
      }

      total += matches.size;
      priorSentence = sentence;
    }

    prevRole = msg.role;
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
  // Normalize Windows backslashes to forward slashes and strip drive colons
  normalized = normalized.replace(/\\/g, '/').replace(/:/g, '');
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

exports.STRONG_USER = STRONG_USER;
exports.STRONG_USER_SENTENCE_START = STRONG_USER_SENTENCE_START;
exports.MEDIUM_USER = MEDIUM_USER;
exports.STRONG_ASSISTANT = STRONG_ASSISTANT;
exports.DROPPED_FROM_SIGNAL_SET = DROPPED_FROM_SIGNAL_SET;
exports.splitSentences = splitSentences;
exports.hasRebuttalMarker = hasRebuttalMarker;
exports.isBootTurn = isBootTurn;
exports.classifyTurn = classifyTurn;
exports.findFallbackTranscript = findFallbackTranscript;
exports.hasValidExemption = hasValidExemption;
exports.writeDebugLog = writeDebugLog;

if (require.main === module) {
  main();
}
