/**
 * checkpoint.cjs — Session Checkpoint Module
 *
 * Layer 3 — Application (depends on core.cjs Layer 1, frontmatter.cjs Layer 2)
 *
 * Writes and reads .planning/CHECKPOINT.json to capture deterministic session
 * state so /prime and resume-work can restore position after context resets
 * without re-reading everything from scratch.
 *
 * Exports: writeCheckpoint, readCheckpoint, scanPlanStatus, CHECKPOINT_FILE, CHECKPOINT_VERSION
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { safeReadFile, execGit, filterPlanFiles, filterSummaryFiles } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

// ─── Constants ────────────────────────────────────────────────────────────────

const CHECKPOINT_FILE = 'CHECKPOINT.json';
const CHECKPOINT_VERSION = 1;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Find the phase directory that matches the given phase number prefix.
 * Phase dirs are named like "52-checkpoint-engine" — starts with phaseNum + '-'.
 * Returns the full path to the phase directory, or null if not found.
 *
 * @param {string} planningDir - Path to .planning/ directory
 * @param {string|number} phaseNum - Phase number to match (e.g. '52' or 52)
 * @returns {string|null}
 */
function findPhaseDir(planningDir, phaseNum) {
  const phasesDir = path.join(planningDir, 'phases');
  if (!fs.existsSync(phasesDir)) return null;

  let entries;
  try {
    entries = fs.readdirSync(phasesDir);
  } catch {
    return null;
  }

  const prefix = String(phaseNum) + '-';
  const exactMatch = String(phaseNum);

  const match = entries.find(e => {
    if (e === exactMatch) return true;
    if (e.startsWith(prefix)) return true;
    return false;
  });

  if (!match) return null;
  return path.join(phasesDir, match);
}

/**
 * Parse STATE.md frontmatter to extract milestone and phase fields.
 * Returns safe defaults if STATE.md is missing or malformed.
 *
 * @param {string} planningDir - Path to .planning/ directory
 * @returns {{ milestone: string, phase: number|string, phase_name: string }}
 */
function parseStateMd(planningDir) {
  const statePath = path.join(planningDir, 'STATE.md');
  const content = safeReadFile(statePath);

  if (!content) {
    return { milestone: '', phase: 0, phase_name: '' };
  }

  const fm = extractFrontmatter(content);

  const milestone = fm.milestone || '';
  const phase = fm.phase || 0;

  // Try to extract phase_name from frontmatter (milestone_name or phase_name)
  // or from body text matching "Phase: 52 — checkpoint-engine"
  let phase_name = fm.phase_name || fm.milestone_name || '';

  if (!phase_name) {
    // Try body: "Phase: 52 — checkpoint-engine" or "Current focus: Phase 52 — checkpoint-engine"
    const phaseLineMatch = content.match(/[Pp]hase[:\s]+\d+\s*[-—]\s*(.+)/);
    if (phaseLineMatch) {
      phase_name = phaseLineMatch[1].trim();
    }
  }

  return { milestone, phase, phase_name };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Write session state to .planning/CHECKPOINT.json.
 *
 * Reads git branch/commit, STATE.md milestone/phase, and scans the phase
 * directory for plan completion status. Merges caller overrides last.
 *
 * @param {string} planningDir - Path to .planning/ directory
 * @param {object} [overrides={}] - Fields to merge into checkpoint (caller wins)
 * @returns {object} The checkpoint object that was written
 */
function writeCheckpoint(planningDir, overrides = {}) {
  // 1. Read git state — cwd is the project root (parent of .planning/)
  const cwd = path.dirname(planningDir);

  let branch = 'unknown';
  let commit = '0000000';

  try {
    const branchResult = execGit(cwd, ['branch', '--show-current']);
    if (branchResult.exitCode === 0 && branchResult.stdout.trim()) {
      branch = branchResult.stdout.trim();
    }
  } catch { /* not a git repo — use defaults */ }

  try {
    const commitResult = execGit(cwd, ['rev-parse', '--short', 'HEAD']);
    if (commitResult.exitCode === 0 && commitResult.stdout.trim()) {
      commit = commitResult.stdout.trim();
    }
  } catch { /* not a git repo — use defaults */ }

  // 2. Read STATE.md for milestone/phase info
  const stateData = parseStateMd(planningDir);

  // 3. Scan phase directory for plan completion status
  const plans = scanPlanStatus(planningDir, stateData.phase);

  // 4. Build checkpoint object
  const checkpoint = {
    version: CHECKPOINT_VERSION,
    timestamp: new Date().toISOString(),
    branch,
    commit,
    milestone: stateData.milestone || '',
    phase: stateData.phase || 0,
    phase_name: stateData.phase_name || '',
    plans,
    tests: { pass: 0, fail: 0 },
    files_modified: [],
    next_action: '',
    context_note: '',
    ...overrides,
  };

  // 5. Write JSON file
  const outPath = path.join(planningDir, CHECKPOINT_FILE);
  fs.writeFileSync(outPath, JSON.stringify(checkpoint, null, 2));

  return checkpoint;
}

/**
 * Read and validate .planning/CHECKPOINT.json.
 *
 * Returns null for: missing file, corrupt JSON, wrong version number.
 * Adds _stale (boolean) and _ageHours (number) metadata to valid checkpoints.
 *
 * @param {string} planningDir - Path to .planning/ directory
 * @returns {object|null} Checkpoint data with staleness metadata, or null
 */
function readCheckpoint(planningDir) {
  const filePath = path.join(planningDir, CHECKPOINT_FILE);

  // 1. File must exist
  if (!fs.existsSync(filePath)) return null;

  // 2. Must parse as JSON
  let data;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  // 3. Must have correct version
  if (data.version !== CHECKPOINT_VERSION) return null;

  // 4. Calculate staleness
  const age = Date.now() - new Date(data.timestamp).getTime();
  data._stale = age > STALE_THRESHOLD_MS;
  data._ageHours = Math.round(age / (60 * 60 * 1000));

  return data;
}

/**
 * Scan the phase directory for plan completion status.
 *
 * A plan is "completed" if a SUMMARY.md with a matching plan ID exists.
 * The first incomplete plan is "active"; remaining incomplete are "pending".
 *
 * @param {string} planningDir - Path to .planning/ directory
 * @param {string|number} phaseNum - Phase number to scan (e.g. '52' or 52)
 * @returns {{ total: number, completed: string[], active: string|null, pending: string[] }}
 */
function scanPlanStatus(planningDir, phaseNum) {
  if (!phaseNum && phaseNum !== 0) {
    return { total: 0, completed: [], active: null, pending: [] };
  }

  const phaseDir = findPhaseDir(planningDir, phaseNum);
  if (!phaseDir) {
    return { total: 0, completed: [], active: null, pending: [] };
  }

  let files;
  try {
    files = fs.readdirSync(phaseDir);
  } catch {
    return { total: 0, completed: [], active: null, pending: [] };
  }

  // Extract plan IDs from *-PLAN.md filenames (e.g. '52-01' from '52-01-PLAN.md')
  const planFiles = filterPlanFiles(files).sort();
  const summaryFiles = filterSummaryFiles(files);

  const planIds = planFiles.map(f => f.replace('-PLAN.md', '').replace('PLAN.md', ''));
  const summaryIds = new Set(
    summaryFiles.map(f => f.replace('-SUMMARY.md', '').replace('SUMMARY.md', ''))
  );

  const completed = planIds.filter(id => summaryIds.has(id));
  const incomplete = planIds.filter(id => !summaryIds.has(id));

  return {
    total: planIds.length,
    completed,
    active: incomplete[0] || null,
    pending: incomplete.slice(1),
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  writeCheckpoint,
  readCheckpoint,
  scanPlanStatus,
  CHECKPOINT_FILE,
  CHECKPOINT_VERSION,
};
