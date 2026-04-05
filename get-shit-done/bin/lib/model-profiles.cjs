/**
 * Mapping of GSD agent to model for each profile.
 *
 * MODEL_PROFILES and VALID_PROFILES are lazily initialized on first access
 * via Object.defineProperty getters, then cached for all subsequent accesses.
 * This defers parsing cost until a caller actually needs agent metadata (PERF-03).
 *
 * Should be in sync with the profiles table in `get-shit-done/references/model-profiles.md`. But
 * possibly worth making this the single source of truth at some point, and removing the markdown
 * reference table in favor of programmatically determining the model to use for an agent (which
 * would be faster, use fewer tokens, and be less error-prone).
 */

const MODEL_TIERS = Object.freeze({
  trivial: 'budget',
  standard: 'balanced',
  complex: 'quality',
  critical: 'quality',
});

let _initCount = 0;
let _modelProfiles = null;
let _validProfiles = null;

function _initialize() {
  if (_modelProfiles !== null) return;
  _initCount++;
  _modelProfiles = {
    'gsd-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet' },
    'gsd-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'gsd-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'gsd-research-orchestrator': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
    'gsd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'gsd-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
    'gsd-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
    'gsd-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'gsd-ui-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
    'gsd-ui-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
    'gsd-ui-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  };
  _validProfiles = Object.keys(_modelProfiles['gsd-planner']);
}

/**
 * Formats the agent-to-model mapping as a human-readable table (in string format).
 *
 * @param {Object<string, string>} agentToModelMap - A mapping from agent to model
 * @returns {string} A formatted table string
 */
function formatAgentToModelMapAsTable(agentToModelMap) {
  const agentWidth = Math.max('Agent'.length, ...Object.keys(agentToModelMap).map((a) => a.length));
  const modelWidth = Math.max(
    'Model'.length,
    ...Object.values(agentToModelMap).map((m) => m.length)
  );
  const sep = '─'.repeat(agentWidth + 2) + '┼' + '─'.repeat(modelWidth + 2);
  const header = ' ' + 'Agent'.padEnd(agentWidth) + ' │ ' + 'Model'.padEnd(modelWidth);
  let agentToModelTable = header + '\n' + sep + '\n';
  for (const [agent, model] of Object.entries(agentToModelMap)) {
    agentToModelTable += ' ' + agent.padEnd(agentWidth) + ' │ ' + model.padEnd(modelWidth) + '\n';
  }
  return agentToModelTable;
}

/**
 * Returns a mapping from agent to model for the given model profile.
 *
 * @param {string} normalizedProfile - The normalized (lowercase and trimmed) profile name
 * @returns {Object<string, string>} A mapping from agent to model for the given profile
 */
function getAgentToModelMapForProfile(normalizedProfile) {
  _initialize();
  const agentToModelMap = {};
  for (const [agent, profileToModelMap] of Object.entries(_modelProfiles)) {
    agentToModelMap[agent] = profileToModelMap[normalizedProfile];
  }
  return agentToModelMap;
}

/**
 * Select model tier based on task complexity signals.
 * @param {string} agentType - Agent name (e.g., 'gsd-executor')
 * @param {Object} taskContext - { complexity, signals, phase_name }
 * @param {Object} config - Loaded config object
 * @returns {{ alias: string, tier: string, rationale: string }}
 */
function dynamicSelect(agentType, taskContext, config) {
  const complexity = taskContext?.complexity || 'standard';
  const targetTier = MODEL_TIERS[complexity] || 'balanced';

  _initialize();
  const agentModels = _modelProfiles[agentType];
  if (!agentModels) {
    return { alias: 'sonnet', tier: 'balanced', rationale: 'unknown agent — default sonnet' };
  }

  const currentProfile = String(config.model_profile || 'balanced').toLowerCase();
  let effectiveTier = targetTier;

  if (currentProfile === 'quality') {
    effectiveTier = 'quality';
  } else if (currentProfile === 'budget' && targetTier === 'quality') {
    effectiveTier = 'balanced';
  }

  let rationale = `complexity=${complexity} targetTier=${targetTier} effectiveTier=${effectiveTier} profile=${currentProfile}`;

  // History-based tier promotion (INTEL-16)
  // When routing_strategy is 'auto' and history shows high failure rates,
  // promote the tier to reduce failures
  if (taskContext?.historyHints) {
    const hints = taskContext.historyHints;
    // Check if this specific agent has a tier mismatch pattern
    const agentPattern = hints.patterns.find(
      p => p.type === 'agent_tier_mismatch' && p.agent === agentType
    );
    if (agentPattern && effectiveTier !== 'quality') {
      effectiveTier = 'quality';
      rationale += ` history-promoted=true (${agentPattern.evidence})`;
    }
    // Check if the current phase has high failure rate
    const phasePattern = hints.patterns.find(
      p => p.type === 'failing_phase'
    );
    if (phasePattern && hints.failureRate > 0.3 && effectiveTier === 'budget') {
      effectiveTier = 'balanced';
      rationale += ` phase-promoted=true (failure_rate=${hints.failureRate})`;
    }
  }

  const alias = agentModels[effectiveTier] || agentModels['balanced'] || 'sonnet';
  return { alias, tier: effectiveTier, rationale };
}

const _exports = {
  formatAgentToModelMapAsTable,
  getAgentToModelMapForProfile,
  dynamicSelect,
  MODEL_TIERS,
  _getInitCount: () => _initCount,
};

Object.defineProperty(_exports, 'MODEL_PROFILES', {
  get() {
    _initialize();
    return _modelProfiles;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(_exports, 'VALID_PROFILES', {
  get() {
    _initialize();
    return _validProfiles;
  },
  enumerable: true,
  configurable: true,
});

module.exports = _exports;
