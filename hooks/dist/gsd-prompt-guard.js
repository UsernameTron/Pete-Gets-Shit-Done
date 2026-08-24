#!/usr/bin/env node
// gsd-hook-version: 1.30.0
// GSD Prompt Injection Guard — PreToolUse hook
// Scans file content being written to .planning/ for prompt injection patterns.
// Defense-in-depth: catches injected instructions before they enter agent context.
//
// Triggers on: Write and Edit tool calls targeting .planning/ files
// Action: Fail-closed blocking — blocks tool calls matching injection patterns
//
// Exit codes:
//   0 = allow (no injection detected, non-.planning/ path, or non-Write/Edit tool)
//   2 = block (injection pattern matched — permissionDecision: "deny")

const path = require('path');

// Source of truth: lib/injection-patterns.json — edit patterns there, not here.
// build-hooks.js inlines patterns between the delimiters at build time.
// --- BEGIN_INJECTION_PATTERNS ---
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your\s+)?instructions/i,
  /override\s+(system|previous)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(?:a|an|the)\s+/i,
  /act\s+as\s+(?:a|an|the)\s+(?!plan|phase|wave)/i,
  /pretend\s+(?:you(?:'re| are)\s+|to\s+be\s+)/i,
  /from\s+now\s+on,?\s+you\s+(?:are|will|should|must)/i,
  /(?:print|output|reveal|show|display|repeat)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i,
  /what\s+(?:are|is)\s+your\s+(?:system\s+)?(?:prompt|instructions)/i,
  /(?:write|save|output|dump)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions|rules)\s+(?:to|into|in)\s+/i,
  /<\/?(?:system|assistant|human)>/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<\s*SYS\s*>>/i,
  /(?:aWdub3Jl|ZG8gbm90|b3ZlcnJpZGU)/,
  /={3,}\s*(?:BEGIN|START|NEW)\s+(?:INSTRUCTION|SYSTEM|PROMPT)/i,
  /^#+\s*(?:SYSTEM|ASSISTANT|HUMAN)\s*$/im,
  /(?:ignorar|ignorer|ignorieren)\s+(?:todas?|toutes?|alle)\s+(?:las?|les?|die)\s+(?:instrucciones|instructions|Anweisungen)/i,
  /(?:send|post|fetch|curl|wget)\s+(?:to|from)\s+https?:\/\//i,
  /(?:base64|btoa|encode)\s+(?:and\s+)?(?:send|exfiltrate|output)/i,
  /(?:run|execute|call|invoke)\s+(?:the\s+)?(?:bash|shell|exec|spawn)\s+(?:tool|command)/i,
];
// --- END_INJECTION_PATTERNS ---

// Files that legitimately document injection patterns (security docs describing an
// attack must be able to quote it). Mirrors ALLOWLIST in tests/prompt-injection-scan.test.cjs.
// Exact repo-relative paths only — never globs; a broad entry silently disarms the guard.
const ALLOWLIST = [
  '.planning/milestones/M06-conductor/conductor-phase6-proposal.md',
];

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;

    // Only scan Write and Edit operations
    if (toolName !== 'Write' && toolName !== 'Edit') {
      process.exit(0);
    }

    const filePath = data.tool_input?.file_path || '';

    // Only scan files going into .planning/ (agent context files)
    if (!filePath.includes('.planning/') && !filePath.includes('.planning\\')) {
      process.exit(0);
    }

    // Allowlisted security docs may quote injection patterns verbatim.
    // Match on a path boundary — a bare endsWith() lets `evil.planning/...`
    // and any other unanchored suffix collision inherit the exemption.
    const normalized = filePath.replace(/\\/g, '/');
    if (ALLOWLIST.some(allowed => normalized === allowed || normalized.endsWith('/' + allowed))) {
      process.exit(0);
    }

    // Get the content being written
    const content = data.tool_input?.content || data.tool_input?.new_string || '';
    if (!content) {
      process.exit(0);
    }

    // Scan for injection patterns
    const findings = [];
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(content)) {
        findings.push(pattern.source);
      }
    }

    // Check for suspicious invisible Unicode
    if (/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/.test(content)) {
      findings.push('invisible-unicode-characters');
    }

    if (findings.length === 0) {
      process.exit(0);
    }

    // Fail-closed blocking — deny the tool call
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        additionalContext: `PROMPT INJECTION WARNING: Content being written to ${path.basename(filePath)} ` +
          `triggered ${findings.length} injection detection pattern(s): ${findings.join(', ')}. ` +
          'This content appears to contain embedded instructions that could manipulate agent behavior. ' +
          'Tool call blocked. If the content is legitimate (e.g., documentation about prompt injection), ' +
          'add its exact repo-relative path to ALLOWLIST in hooks/gsd-prompt-guard.js — do not disable the hook.',
      },
    };

    process.stdout.write(JSON.stringify(output));
    process.exit(2);
  } catch {
    // Silent fail — never block tool execution on error
    process.exit(0);
  }
});
