/**
 * Task Classification & Adaptive Workflow Gates
 *
 * Layer 0 foundation module — ZERO intra-project dependencies.
 * Only Node.js builtins allowed.
 *
 * Provides:
 *   - COMPLEXITY_LEVELS: Canonical complexity tier names
 *   - PHASE_TYPE_KEYWORDS: Phase name → type mapping for signal extraction
 *   - extractSignals(): Extracts classification signals from phase/plan data
 *   - classifyTask(): Weighted scoring algorithm → complexity + confidence
 *   - adaptWorkflowGates(): Returns config overrides based on task complexity
 *
 * Requirements: INTEL-07 (classifyTask), INTEL-08 (extractSignals), INTEL-09 (adaptWorkflowGates)
 */
'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const COMPLEXITY_LEVELS = Object.freeze({
  TRIVIAL: 'trivial',
  STANDARD: 'standard',
  COMPLEX: 'complex',
  CRITICAL: 'critical',
});

/**
 * Maps phase name substrings to phase types for signal extraction.
 * First keyword match wins when scanning a phase name.
 */
const PHASE_TYPE_KEYWORDS = Object.freeze({
  research: 'research',
  plan: 'planning',
  execute: 'execution',
  verify: 'verification',
  test: 'verification',
  document: 'documentation',
  integration: 'integration',
  cleanup: 'maintenance',
});

// ─── Signal Extraction ───────────────────────────────────────────────────────

/**
 * Extract classification signals from phase info, plan inventory, and context.
 *
 * All fields have safe defaults for null/undefined inputs. Never throws.
 *
 * @param {Object|null} phaseInfo - Phase metadata (e.g., { name: 'Research & Analysis' })
 * @param {Array|null} planInventory - Array of plan objects with optional files_to_modify and depends_on
 * @param {Object|null} context - Additional context (reqIds, failureRate)
 * @returns {{ file_count: number, requirement_count: number, phase_type: string, dependency_depth: number, historical_failure_rate: number|null, plan_count: number }}
 */
function extractSignals(phaseInfo, planInventory, context) {
  const plans = Array.isArray(planInventory) ? planInventory : [];
  const ctx = context && typeof context === 'object' ? context : {};
  const phase = phaseInfo && typeof phaseInfo === 'object' ? phaseInfo : {};

  // file_count: sum of files_to_modify arrays across plans, fallback to plan count
  let fileCount = 0;
  let hasFileInfo = false;
  for (const plan of plans) {
    if (plan && Array.isArray(plan.files_to_modify)) {
      fileCount += plan.files_to_modify.length;
      hasFileInfo = true;
    }
  }
  if (!hasFileInfo) {
    fileCount = plans.length;
  }

  // requirement_count: parse comma-separated reqIds string
  let requirementCount = 0;
  if (typeof ctx.reqIds === 'string' && ctx.reqIds.trim().length > 0) {
    requirementCount = ctx.reqIds.split(',').filter(s => s.trim().length > 0).length;
  }

  // phase_type: first keyword match in phase name, default 'execution'
  let phaseType = 'execution';
  const phaseName = typeof phase.name === 'string' ? phase.name.toLowerCase() : '';
  for (const [keyword, type] of Object.entries(PHASE_TYPE_KEYWORDS)) {
    if (phaseName.includes(keyword)) {
      phaseType = type;
      break;
    }
  }

  // dependency_depth: count of plans that have non-empty depends_on arrays
  let dependencyDepth = 0;
  for (const plan of plans) {
    if (plan && Array.isArray(plan.depends_on) && plan.depends_on.length > 0) {
      dependencyDepth++;
    }
  }

  // historical_failure_rate: passthrough from context, null if absent
  const historicalFailureRate = typeof ctx.failureRate === 'number' ? ctx.failureRate : null;

  return {
    file_count: fileCount,
    requirement_count: requirementCount,
    phase_type: phaseType,
    dependency_depth: dependencyDepth,
    historical_failure_rate: historicalFailureRate,
    plan_count: plans.length,
  };
}

// ─── Task Classification ─────────────────────────────────────────────────────

/**
 * Score a single signal on its defined scale.
 * @param {string} signalName
 * @param {*} value
 * @returns {number}
 */
function _scoreSignal(signalName, value) {
  switch (signalName) {
    case 'plan_count': {
      const n = typeof value === 'number' ? value : 0;
      if (n <= 1) return 0;
      if (n <= 3) return 1;
      if (n <= 6) return 2;
      return 3;
    }
    case 'requirement_count': {
      const n = typeof value === 'number' ? value : 0;
      if (n <= 2) return 0;
      if (n <= 5) return 1;
      if (n <= 8) return 2;
      return 3;
    }
    case 'phase_type': {
      const t = typeof value === 'string' ? value : '';
      if (t === 'research' || t === 'documentation') return 0;
      if (t === 'execution' || t === 'planning' || t === 'maintenance') return 1;
      if (t === 'verification' || t === 'integration') return 2;
      return 1; // default for unknown types
    }
    case 'dependency_depth': {
      const n = typeof value === 'number' ? value : 0;
      if (n <= 0) return 0;
      if (n <= 2) return 1;
      return 2;
    }
    case 'historical_failure_rate': {
      if (value === null || value === undefined) return 0;
      const r = typeof value === 'number' ? value : 0;
      if (r <= 0) return 0;
      if (r <= 0.20) return 1;
      if (r <= 0.50) return 2;
      return 3;
    }
    default:
      return 0;
  }
}

/** Signal weights for the complexity scoring algorithm. */
const SIGNAL_WEIGHTS = {
  plan_count: 2.0,
  requirement_count: 2.0,
  phase_type: 1.5,
  dependency_depth: 1.0,
  historical_failure_rate: 1.5,
};

/**
 * Classify a task's complexity using a weighted scoring algorithm.
 *
 * Calls extractSignals() to gather raw data, scores each signal on its scale,
 * applies weights, and maps the raw score to a complexity level. Also computes
 * a confidence value based on how many signals have non-null data.
 *
 * @param {Object|null} phaseInfo - Phase metadata
 * @param {Array|null} planInventory - Array of plan objects
 * @param {Object|null} context - Additional context
 * @returns {{ complexity: string, signals: Object, confidence: number }}
 */
function classifyTask(phaseInfo, planInventory, context) {
  const signals = extractSignals(phaseInfo, planInventory, context);

  // Compute weighted raw score
  let rawScore = 0;
  for (const [signal, weight] of Object.entries(SIGNAL_WEIGHTS)) {
    const value = signal === 'phase_type' ? signals.phase_type :
      signal === 'historical_failure_rate' ? signals.historical_failure_rate :
        signals[signal];
    rawScore += _scoreSignal(signal, value) * weight;
  }

  // Map raw score to complexity level
  let complexity;
  if (rawScore < 3) {
    complexity = COMPLEXITY_LEVELS.TRIVIAL;
  } else if (rawScore < 6) {
    complexity = COMPLEXITY_LEVELS.STANDARD;
  } else if (rawScore < 10) {
    complexity = COMPLEXITY_LEVELS.COMPLEX;
  } else {
    complexity = COMPLEXITY_LEVELS.CRITICAL;
  }

  // Confidence: base 0.5 + 0.1 per non-null signal, capped at 1.0
  let confidence = 0.5;
  const signalChecks = [
    signals.plan_count,
    signals.requirement_count,
    signals.phase_type,
    signals.dependency_depth,
    signals.historical_failure_rate,
  ];
  for (const val of signalChecks) {
    if (val !== null && val !== undefined) {
      confidence += 0.1;
    }
  }
  confidence = Math.min(confidence, 1.0);

  return { complexity, signals, confidence };
}

// ─── Adaptive Workflow Gates ─────────────────────────────────────────────────

/**
 * Return config overrides based on task complexity.
 *
 * If config.adaptive is falsy, returns empty object (feature flag gate).
 * If taskContext is null/undefined, returns empty object.
 *
 * @param {Object|null} taskContext - Result of classifyTask() with .complexity
 * @param {Object|null} config - GSD config with optional .adaptive flag
 * @returns {Object} Config override keys for the given complexity level
 */
function adaptWorkflowGates(taskContext, config) {
  if (!taskContext || typeof taskContext !== 'object') return {};
  if (!config || !config.adaptive) return {};

  const { complexity } = taskContext;

  switch (complexity) {
    case COMPLEXITY_LEVELS.TRIVIAL:
      return {
        skip_research: true,
        plan_checker_enabled: false,
        verification_rigor: 'light',
      };

    case COMPLEXITY_LEVELS.STANDARD:
      return {};

    case COMPLEXITY_LEVELS.COMPLEX:
      return {
        verification_rigor: 'thorough',
        parallelization_wave_size: 2,
      };

    case COMPLEXITY_LEVELS.CRITICAL:
      return {
        verification_rigor: 'thorough',
        parallelization_wave_size: 1,
        force_quality_tier: true,
      };

    default:
      return {};
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  COMPLEXITY_LEVELS,
  PHASE_TYPE_KEYWORDS,
  extractSignals,
  classifyTask,
  adaptWorkflowGates,
};
