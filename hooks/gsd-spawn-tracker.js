#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}
// GSD Spawn Tracker — PreToolUse hook
// Appends a subagent-spawn ledger entry to ~/.claude/metrics/spawns.jsonl.
// Records which agent was spawned (subagent_type) on every Task/Agent tool
// call, giving GSD first-class per-agent spawn attribution. The SubagentStop
// health hook cannot identify which agent completed, so spawn frequency was
// previously unmeasurable except by archaeological inference.
//
// Triggers on: PreToolUse events for the Task (or Agent) tool
// Action: Advisory only — writes JSONL and exits 0 (never blocks a spawn)
//
// Exit codes:
//   0 = always (non-blocking; spawn tracking must not interrupt workflows)

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Inlined utility functions — no external dependencies
function getClaudeDir() {
  return path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.claude');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const MAX_STDIN = 1024 * 1024;
let raw = '';

const stdinTimeout = setTimeout(() => process.exit(0), 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    const remaining = MAX_STDIN - raw.length;
    raw += chunk.substring(0, remaining);
  }
});

process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};

    // Only track subagent spawns (the Task/Agent tool). Everything else is a no-op.
    const toolName = input.tool_name;
    if (toolName !== 'Task' && toolName !== 'Agent') {
      process.exit(0);
    }

    const toolInput = input.tool_input || {};
    const subagentType = String(toolInput.subagent_type || 'unknown');
    const description = String(toolInput.description || '').slice(0, 200);
    const sessionId = String(process.env.CLAUDE_SESSION_ID || 'default');

    const metricsDir = path.join(getClaudeDir(), 'metrics');
    ensureDir(metricsDir);

    const row = {
      timestamp:     new Date().toISOString(),
      session_id:    sessionId,
      tool:          toolName,
      subagent_type: subagentType,
      description,
    };

    fs.appendFileSync(path.join(metricsDir, 'spawns.jsonl'), `${JSON.stringify(row)}\n`);
  } catch {
    // Keep hook non-blocking — spawn tracking must never interrupt tool execution.
  }

  process.exit(0);
});
