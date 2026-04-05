/**
 * history.cjs — Execution History Module (Layer 2)
 *
 * Manages JSONL-based execution history for GSD phases:
 * - recordExecution(): append execution records
 * - queryHistory(): filter and retrieve records
 * - detectPatterns(): analyze execution patterns
 *
 * Layer 2: imports core.cjs (Layer 1) for debugLog. No Layer 3 imports.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { debugLog } = require('./core.cjs');

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTCOME_VALUES = Object.freeze({
  PASS: 'pass',
  FAIL: 'fail',
  PARTIAL: 'partial',
});

const HISTORY_DIR = '.planning/history';
const HISTORY_FILE = 'executions.jsonl';

const ROTATION_THRESHOLD = 1000;
const ROTATION_KEEP = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the full path to the history JSONL file.
 * Does NOT create directories — callers handle that.
 */
function getHistoryPath(cwd) {
  return path.join(cwd, HISTORY_DIR, HISTORY_FILE);
}

/**
 * Reads a JSONL file and returns an array of parsed objects.
 * Skips blank lines and malformed JSON lines.
 * Returns empty array if file doesn't exist.
 */
function parseJsonlSafe(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const records = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      debugLog('HIST-001', 'Skipping malformed JSONL line', { line: trimmed.slice(0, 80) });
    }
  }
  return records;
}

// ─── recordExecution ──────────────────────────────────────────────────────────

/**
 * Append an execution record to the history JSONL file.
 *
 * @param {string} cwd - Project root directory
 * @param {number|string} phaseNum - Phase number (coerced to number)
 * @param {number|string} planNum - Plan number (coerced to number)
 * @param {object} outcome - Execution outcome details
 * @param {string} outcome.outcome - One of OUTCOME_VALUES (required)
 * @param {string} [outcome.agent='unknown'] - Agent name
 * @param {string|null} [outcome.model_used=null] - Model used
 * @param {number|null} [outcome.duration_ms=null] - Duration in milliseconds
 * @param {string|null} [outcome.error_code=null] - Error code if failed
 * @param {number} [outcome.files_changed=0] - Number of files changed
 * @returns {object} The recorded entry
 */
function recordExecution(cwd, phaseNum, planNum, outcome) {
  const validOutcomes = Object.values(OUTCOME_VALUES);
  if (!outcome || !validOutcomes.includes(outcome.outcome)) {
    throw new Error(
      `Invalid outcome value: "${outcome?.outcome}". Must be one of: ${validOutcomes.join(', ')}`
    );
  }

  const record = {
    timestamp: new Date().toISOString(),
    phase: Number(phaseNum),
    plan: Number(planNum),
    agent: outcome.agent || 'unknown',
    model_used: outcome.model_used || null,
    duration_ms: outcome.duration_ms ?? null,
    outcome: outcome.outcome,
    error_code: outcome.error_code || null,
    files_changed: outcome.files_changed || 0,
  };

  const historyPath = getHistoryPath(cwd);
  fs.mkdirSync(path.join(cwd, HISTORY_DIR), { recursive: true });
  fs.appendFileSync(historyPath, JSON.stringify(record) + '\n');

  debugLog('HIST-002', 'Recorded execution', { phase: record.phase, plan: record.plan, outcome: record.outcome });

  // Auto-rotate: keep latest ROTATION_KEEP when file exceeds ROTATION_THRESHOLD records
  const allRecords = parseJsonlSafe(historyPath);
  if (allRecords.length > ROTATION_THRESHOLD) {
    const kept = allRecords.slice(-ROTATION_KEEP);
    fs.writeFileSync(historyPath, kept.map(r => JSON.stringify(r)).join('\n') + '\n');
    debugLog('HIST-003', 'Auto-rotated history', { before: allRecords.length, after: kept.length });
  }

  return record;
}

// ─── queryHistory ─────────────────────────────────────────────────────────────

/**
 * Query execution history with optional filters.
 *
 * @param {string} cwd - Project root directory
 * @param {object} [filters={}] - Optional filter criteria
 * @param {string} [filters.agent] - Filter by agent name (exact match)
 * @param {number[]} [filters.phaseRange] - [min, max] inclusive phase range
 * @param {string} [filters.outcome] - Filter by outcome (exact match)
 * @param {string[]} [filters.dateRange] - [start, end] ISO date strings
 * @param {number} [filters.limit] - Max records to return (last N)
 * @returns {{ records: object[], total: number }}
 */
function queryHistory(cwd, filters = {}) {
  const historyPath = getHistoryPath(cwd);
  let records = parseJsonlSafe(historyPath);

  if (filters.agent) {
    records = records.filter(r => r.agent === filters.agent);
  }

  if (filters.phaseRange && Array.isArray(filters.phaseRange) && filters.phaseRange.length === 2) {
    const [min, max] = filters.phaseRange;
    records = records.filter(r => r.phase >= min && r.phase <= max);
  }

  if (filters.outcome) {
    records = records.filter(r => r.outcome === filters.outcome);
  }

  if (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
    const [start, end] = filters.dateRange;
    records = records.filter(r => r.timestamp >= start && r.timestamp <= end);
  }

  const total = records.length;

  if (filters.limit && typeof filters.limit === 'number' && filters.limit > 0) {
    records = records.slice(-filters.limit);
  }

  return { records, total };
}

// ─── detectPatterns ───────────────────────────────────────────────────────────

/**
 * Analyze execution history to detect actionable patterns.
 *
 * @param {string} cwd - Project root directory
 * @returns {object} Pattern analysis results
 */
function detectPatterns(cwd) {
  const historyPath = getHistoryPath(cwd);
  const records = parseJsonlSafe(historyPath);

  if (records.length < 5) {
    return { patterns: [], insufficient_data: true };
  }

  const patterns = [];

  // ── Frequently-failing phases ──
  const phaseStats = {};
  for (const r of records) {
    if (!phaseStats[r.phase]) {
      phaseStats[r.phase] = { total: 0, failures: 0 };
    }
    phaseStats[r.phase].total++;
    if (r.outcome === OUTCOME_VALUES.FAIL) {
      phaseStats[r.phase].failures++;
    }
  }

  for (const [phase, stats] of Object.entries(phaseStats)) {
    const failureRate = stats.failures / stats.total;
    if (failureRate > 0.3 && stats.total >= 3) {
      patterns.push({
        type: 'failing_phase',
        phase: Number(phase),
        failure_rate: Math.round(failureRate * 100) / 100,
        executions: stats.total,
      });
    }
  }

  // ── Agent tier mismatch ──
  const agentModelStats = {};
  for (const r of records) {
    const agent = r.agent || 'unknown';
    if (!agentModelStats[agent]) {
      agentModelStats[agent] = { total: 0, failures: 0, byModel: {} };
    }
    agentModelStats[agent].total++;
    if (r.outcome === OUTCOME_VALUES.FAIL) {
      agentModelStats[agent].failures++;
    }
    const model = r.model_used || 'unknown';
    if (!agentModelStats[agent].byModel[model]) {
      agentModelStats[agent].byModel[model] = { total: 0, failures: 0 };
    }
    agentModelStats[agent].byModel[model].total++;
    if (r.outcome === OUTCOME_VALUES.FAIL) {
      agentModelStats[agent].byModel[model].failures++;
    }
  }

  const budgetTiers = ['haiku', 'budget', 'balanced'];
  for (const [agent, stats] of Object.entries(agentModelStats)) {
    // Check if agent has >50% failures on budget/balanced tier models
    let budgetTotal = 0;
    let budgetFailures = 0;
    for (const [model, modelStats] of Object.entries(stats.byModel)) {
      if (budgetTiers.some(tier => model && model.toLowerCase().includes(tier))) {
        budgetTotal += modelStats.total;
        budgetFailures += modelStats.failures;
      }
    }
    if (budgetTotal > 0 && budgetFailures / budgetTotal > 0.5) {
      const pct = Math.round((budgetFailures / budgetTotal) * 100);
      patterns.push({
        type: 'agent_tier_mismatch',
        agent,
        recommended_tier: 'quality',
        evidence: `${pct}% fail on budget`,
      });
    }
  }

  // ── Summary ──
  const totalExecutions = records.length;
  const passCount = records.filter(r => r.outcome === OUTCOME_VALUES.PASS).length;
  const overallPassRate = Math.round((passCount / totalExecutions) * 100) / 100;

  // Average duration (skip null)
  const durations = records.filter(r => r.duration_ms != null).map(r => r.duration_ms);
  const avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  // Model distribution
  const modelDistribution = {};
  for (const r of records) {
    const model = r.model_used || 'unknown';
    modelDistribution[model] = (modelDistribution[model] || 0) + 1;
  }

  return {
    patterns,
    summary: {
      total_executions: totalExecutions,
      overall_pass_rate: overallPassRate,
      avg_duration_ms: avgDurationMs,
      model_distribution: modelDistribution,
    },
    insufficient_data: false,
  };
}

// ─── formatHistoryList ───────────────────────────────────────────────────────

/**
 * Print execution history records to stdout.
 * If raw is truthy, output JSON. Otherwise, output a human-readable table.
 *
 * @param {object[]} records - Array of execution records
 * @param {boolean} raw - If true, output JSON
 */
function formatHistoryList(records, raw) {
  if (raw) {
    console.log(JSON.stringify(records));
    return;
  }

  if (records.length === 0) {
    console.log('No execution history records found.');
    return;
  }

  // Table header
  const header = 'Phase | Plan | Outcome | Agent          | Duration | Model  | Timestamp';
  const sep    = '------|------|---------|----------------|----------|--------|--------------------';
  console.log(header);
  console.log(sep);

  for (const r of records) {
    const phase = String(r.phase).padStart(5);
    const plan = String(r.plan).padStart(4);
    const outcome = (r.outcome || '').padEnd(7);
    const agent = (r.agent || 'unknown').padEnd(14);
    const dur = r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s`.padStart(8) : '     N/A';
    const model = (r.model_used || 'N/A').padEnd(6);
    const ts = r.timestamp || '';
    console.log(`${phase} | ${plan} | ${outcome} | ${agent} | ${dur} | ${model} | ${ts}`);
  }
}

// ─── formatHistoryStats ──────────────────────────────────────────────────────

/**
 * Print execution history stats to stdout.
 * If raw is truthy, output JSON. Otherwise, output a human-readable summary.
 *
 * @param {object[]} records - Array of execution records
 * @param {object} patterns - Pattern analysis result from detectPatterns()
 * @param {boolean} raw - If true, output JSON
 */
function formatHistoryStats(records, patterns, raw) {
  if (raw) {
    console.log(JSON.stringify({ records_count: records.length, patterns }));
    return;
  }

  const total = records.length;
  if (total === 0) {
    console.log('No execution history records found.');
    return;
  }

  const passCount = records.filter(r => r.outcome === OUTCOME_VALUES.PASS).length;
  const passRate = ((passCount / total) * 100).toFixed(1);

  const durations = records.filter(r => r.duration_ms != null).map(r => r.duration_ms);
  const avgDur = durations.length > 0
    ? (durations.reduce((a, b) => a + b, 0) / durations.length / 1000).toFixed(1)
    : 'N/A';

  const modelDist = {};
  for (const r of records) {
    const model = r.model_used || 'unknown';
    modelDist[model] = (modelDist[model] || 0) + 1;
  }
  const modelStr = Object.entries(modelDist).map(([m, c]) => `${m}=${c}`).join(' ');

  console.log('Execution History Stats');
  console.log('=======================');
  console.log(`Total executions: ${total}`);
  console.log(`Pass rate: ${passRate}%`);
  console.log(`Avg duration: ${avgDur}s`);
  console.log(`Model usage: ${modelStr}`);

  if (patterns && patterns.patterns && patterns.patterns.length > 0) {
    console.log('');
    console.log('Detected Patterns:');
    for (const p of patterns.patterns) {
      if (p.type === 'failing_phase') {
        console.log(`  ! Phase ${p.phase}: ${Math.round(p.failure_rate * 100)}% failure rate (${p.executions} executions)`);
      } else if (p.type === 'agent_tier_mismatch') {
        console.log(`  ! Agent ${p.agent}: recommend ${p.recommended_tier} tier (${p.evidence})`);
      }
    }
  }
}

// ─── pruneHistory ────────────────────────────────────────────────────────────

/**
 * Manually prune history to keep the latest N records.
 *
 * @param {string} cwd - Project root directory
 * @param {number} [keepCount=500] - Number of records to keep
 * @returns {{ pruned: number, remaining: number }}
 */
function pruneHistory(cwd, keepCount = 500) {
  const historyPath = getHistoryPath(cwd);
  const records = parseJsonlSafe(historyPath);
  const originalCount = records.length;

  if (keepCount >= originalCount) {
    return { pruned: 0, remaining: originalCount };
  }

  const kept = records.slice(-keepCount);
  fs.writeFileSync(historyPath, kept.map(r => JSON.stringify(r)).join('\n') + '\n');

  debugLog('HIST-004', 'Manual prune', { before: originalCount, after: kept.length });

  return { pruned: originalCount - keepCount, remaining: keepCount };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  OUTCOME_VALUES,
  HISTORY_DIR,
  HISTORY_FILE,
  ROTATION_THRESHOLD,
  ROTATION_KEEP,
  getHistoryPath,
  parseJsonlSafe,
  recordExecution,
  queryHistory,
  detectPatterns,
  formatHistoryList,
  formatHistoryStats,
  pruneHistory,
};
