/**
 * daily.cjs — Daily Dashboard Module
 *
 * Layer 3 — Application (depends on checkpoint.cjs Layer 3, core.cjs Layer 1, frontmatter.cjs Layer 2)
 *
 * Gathers session state from CHECKPOINT.json (primary) or STATE.md (fallback),
 * determines the correct next GSD command, and formats a human-readable dashboard.
 *
 * Exports: gatherDailyState, determineNextAction, formatDashboard
 */

'use strict';

const path = require('path');
const { safeReadFile, execGit } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { readCheckpoint, scanPlanStatus } = require('./checkpoint.cjs');

// ─── Safe defaults ─────────────────────────────────────────────────────────────

/**
 * Return the empty-state object used when neither checkpoint nor STATE.md is available.
 *
 * @returns {object}
 */
function emptyState() {
  return {
    _source: 'none',
    milestone: '',
    phase: 0,
    phase_name: '',
    plans: { total: 0, completed: [], active: null, pending: [] },
    branch: 'unknown',
    commit: '0000000',
    _stale: false,
    _ageHours: 0,
    _gitDirty: false,
    next_action: '',
    context_note: '',
  };
}

// ─── Git helpers ───────────────────────────────────────────────────────────────

/**
 * Read git branch, commit, and dirty status from the project root (parent of planningDir).
 * Returns safe defaults if not in a git repo.
 *
 * @param {string} cwd - Project root directory
 * @returns {{ branch: string, commit: string, _gitDirty: boolean }}
 */
function readGitState(cwd) {
  let branch = 'unknown';
  let commit = '0000000';
  let _gitDirty = false;

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

  try {
    const statusResult = execGit(cwd, ['status', '--porcelain']);
    if (statusResult.exitCode === 0 && statusResult.stdout.trim().length > 0) {
      _gitDirty = true;
    }
  } catch { /* not a git repo — assume clean */ }

  return { branch, commit, _gitDirty };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Gather daily dashboard state.
 *
 * Priority:
 * 1. Read CHECKPOINT.json — if valid, return it with _source='checkpoint'
 * 2. Read STATE.md — if present, parse frontmatter and build state object with _source='state'
 * 3. Return safe defaults with _source='none'
 *
 * @param {string} planningDir - Path to the .planning/ directory
 * @returns {object} State object with _source, milestone, phase, plans, branch, etc.
 */
function gatherDailyState(planningDir) {
  const cwd = path.dirname(planningDir);

  // 1. Try checkpoint first
  const checkpoint = readCheckpoint(planningDir);
  if (checkpoint !== null) {
    // Augment with live git dirty status (checkpoint only captures point-in-time)
    const { _gitDirty } = readGitState(cwd);
    return {
      ...checkpoint,
      _source: 'checkpoint',
      _gitDirty,
    };
  }

  // 2. Try STATE.md
  const statePath = path.join(planningDir, 'STATE.md');
  const stateContent = safeReadFile(statePath);

  if (stateContent) {
    const fm = extractFrontmatter(stateContent);

    const milestone = fm.milestone || '';
    const phase = typeof fm.phase === 'number' ? fm.phase : (parseInt(fm.phase, 10) || 0);

    // Extract phase_name from frontmatter or body
    let phase_name = fm.phase_name || fm.milestone_name || '';
    if (!phase_name) {
      // Body pattern: "Current focus: Phase 53 — daily-dashboard" or "Phase: 53 — daily-dashboard"
      const bodyMatch = stateContent.match(/[Pp]hase[:\s]+\d+\s*[-—]\s*(.+)/);
      if (bodyMatch) {
        phase_name = bodyMatch[1].trim();
      }
    }

    // Scan plan status if we have a valid phase
    const plans = phase > 0
      ? scanPlanStatus(planningDir, phase)
      : { total: 0, completed: [], active: null, pending: [] };

    // Read git state
    const gitState = readGitState(cwd);

    return {
      _source: 'state',
      milestone,
      phase,
      phase_name,
      plans,
      branch: gitState.branch,
      commit: gitState.commit,
      _gitDirty: gitState._gitDirty,
      _stale: false,
      _ageHours: 0,
      next_action: '',
      context_note: '',
    };
  }

  // 3. Neither file found — safe defaults
  return emptyState();
}

/**
 * Determine the next recommended GSD command based on current state.
 *
 * Decision tree (ordered by priority):
 * 1. _source === 'none' → /gsd:new-project
 * 2. Explicit next_action in state (from checkpoint) → return it
 * 3. No plans at all → /gsd:plan-phase N
 * 4. Active plan → /gsd:execute-phase N
 * 5. Pending plans → /gsd:execute-phase N
 * 6. All plans complete → /gsd:verify-work N
 * 7. Fallback → /gsd:progress
 *
 * @param {object} state - State object from gatherDailyState
 * @returns {string} The next recommended /gsd: command
 */
function determineNextAction(state) {
  // Rule 1: No project state at all
  if (state._source === 'none') {
    return '/gsd:new-project';
  }

  // Rule 2: Explicit next_action set in checkpoint
  if (state.next_action && state.next_action.trim()) {
    return state.next_action.trim();
  }

  const phase = state.phase || 0;
  const plans = state.plans || { total: 0, completed: [], active: null, pending: [] };

  // Rule 3: No plans created yet
  if (plans.total === 0) {
    return `/gsd:plan-phase ${phase}`;
  }

  // Rule 4: Active plan in progress
  if (plans.active) {
    return `/gsd:execute-phase ${phase}`;
  }

  // Rule 5: Pending plans remaining
  if (plans.pending && plans.pending.length > 0) {
    return `/gsd:execute-phase ${phase}`;
  }

  // Rule 6: All plans complete — time to verify
  if (plans.completed.length === plans.total && plans.total > 0) {
    return `/gsd:verify-work ${phase}`;
  }

  // Rule 7: Fallback
  return '/gsd:progress';
}

/**
 * Format a human-readable daily dashboard string.
 *
 * @param {object} state - State object from gatherDailyState
 * @returns {string} Multi-line dashboard string
 */
function formatDashboard(state) {
  // Special case: no project state
  if (state._source === 'none') {
    return [
      '# Daily Dashboard',
      '',
      'No project state found.',
      'Run /gsd:new-project to initialize.',
    ].join('\n');
  }

  const plans = state.plans || { total: 0, completed: [], active: null, pending: [] };
  const nextAction = determineNextAction(state);

  const completedCount = plans.completed ? plans.completed.length : 0;
  const completedList = plans.completed && plans.completed.length > 0
    ? plans.completed.join(', ')
    : 'none';
  const activePlan = plans.active || 'none';
  const pendingList = plans.pending && plans.pending.length > 0
    ? plans.pending.join(', ')
    : 'none';

  const lines = [
    '# Daily Dashboard',
    '',
    `**Milestone:** ${state.milestone || '(none)'}`,
    `**Phase:** ${state.phase} — ${state.phase_name || '(unnamed)'}`,
    `**Branch:** ${state.branch}`,
    '',
    '## Plan Progress',
    `${completedCount}/${plans.total} plans complete`,
    `Completed: ${completedList}`,
    `Active:    ${activePlan}`,
    `Pending:   ${pendingList}`,
    '',
    '## Next Action',
    nextAction,
  ];

  // Append warnings
  if (state._gitDirty) {
    lines.push('');
    lines.push('WARNING: dirty working tree — uncommitted changes detected');
  }

  if (state._stale) {
    lines.push('');
    lines.push(`WARNING: checkpoint is stale (${state._ageHours}h old) — run /gsd:checkpoint to refresh`);
  }

  return lines.join('\n');
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = { gatherDailyState, determineNextAction, formatDashboard };
