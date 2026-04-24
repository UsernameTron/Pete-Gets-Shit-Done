/**
 * harden-repo.cjs — GitHub Branch Protection Auditor + Enforcer
 *
 * Layer 3 — Application (depends on core.cjs Layer 1, security.cjs Layer 0)
 *
 * Audits and enforces GitHub branch protection rules via the `gh` CLI.
 * Reads current protection, compares against a standard policy, and
 * optionally applies fixes via read-merge-PUT (never partial PUT).
 *
 * Exports: cmdHardenRepo, STANDARD_POLICY, buildGapTable, mergePolicy
 */

'use strict';

const { execFileSync } = require('child_process');
const { output, error } = require('./core.cjs');
const { validateShellArg } = require('./security.cjs');

// ─── Standard Policy ──────────────────────────────────────────────────────────

/**
 * The hardcoded default branch protection policy.
 *
 * Design rationale (from tasks/lessons.md):
 * - required_pull_request_reviews with count 0 forces the PR path for single-dev
 *   repos without requiring human approval (~30s overhead per commit batch).
 * - required_status_checks.contexts uses a sentinel: existing contexts are preserved
 *   on merge, never invented.
 * - Both PR reviews AND status checks must be present — status checks alone
 *   only gate PR merges, not direct pushes.
 */
const STANDARD_POLICY = {
  required_pull_request_reviews: {
    required_approving_review_count: 0,
    dismiss_stale_reviews: false,
    require_code_owner_reviews: false,
  },
  required_status_checks: {
    strict: true,
    contexts: '__PRESERVE_EXISTING__',
  },
  enforce_admins: false,
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  required_linear_history: false,
};

// ─── gh CLI wrapper ───────────────────────────────────────────────────────────

/**
 * Execute a gh CLI command via execFileSync (no shell interpolation).
 *
 * @param {string[]} args - Arguments to pass to `gh`
 * @param {object} [opts] - Options
 * @param {string} [opts.input] - Data to pipe to stdin
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function execGh(args, opts = {}) {
  try {
    const execOpts = {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    };
    if (opts.input) {
      execOpts.input = opts.input;
    }
    const stdout = execFileSync('gh', args, execOpts);
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ? err.stdout.toString().trim() : '',
      stderr: err.stderr ? err.stderr.toString().trim() : err.message,
      exitCode: err.status || 1,
    };
  }
}

// ─── Pre-flight ───────────────────────────────────────────────────────────────

/**
 * Verify gh authentication and detect owner/repo from git remote.
 *
 * @param {string} _cwd - Project root (unused, gh reads git remote from process.cwd)
 * @returns {{ owner: string, repo: string }}
 */
function preflight(_cwd) {
  const auth = execGh(['auth', 'status']);
  if (auth.exitCode !== 0) {
    error('gh CLI not authenticated. Run: gh auth login');
  }

  const view = execGh(['repo', 'view', '--json', 'owner,name']);
  if (view.exitCode !== 0) {
    error('Could not detect repo. Ensure you are in a git directory with a GitHub remote. Error: ' + view.stderr);
  }

  let parsed;
  try {
    parsed = JSON.parse(view.stdout);
  } catch {
    error('Failed to parse gh repo view output: ' + view.stdout);
  }

  const owner = parsed.owner && parsed.owner.login ? parsed.owner.login : parsed.owner;
  const repo = parsed.name;

  if (!owner || !repo) {
    error('Could not determine owner/repo from gh repo view output');
  }

  validateShellArg(String(owner), 'repo owner');
  validateShellArg(String(repo), 'repo name');

  return { owner: String(owner), repo: String(repo) };
}

// ─── Read Protection ──────────────────────────────────────────────────────────

/**
 * Read current branch protection from GitHub API.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {object|null} Parsed protection object, or null if no protection.
 */
function readProtection(owner, repo, branch) {
  const result = execGh(['api', `repos/${owner}/${repo}/branches/${branch}/protection`]);

  if (result.exitCode !== 0) {
    // 404 means no protection configured
    if (result.stderr.includes('404') || result.stderr.includes('Not Found') ||
        result.stdout.includes('404') || result.stdout.includes('Branch not protected')) {
      return null;
    }
    error(`Failed to read branch protection: ${result.stderr}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    error('Failed to parse branch protection response: ' + result.stdout.slice(0, 200));
  }
}

// ─── Gap Analysis ─────────────────────────────────────────────────────────────

/**
 * Extract actual value from a GET response field that may be wrapped in
 * { enabled: <value> } (GitHub's GET response format for boolean fields).
 */
function extractEnabled(value) {
  if (value && typeof value === 'object' && 'enabled' in value) {
    return value.enabled;
  }
  return value;
}

/**
 * Normalize restrictions from GET response.
 * GitHub returns { users: [], teams: [], apps: [] } for "no restrictions"
 * but the PUT payload uses null to mean the same thing.
 */
function normalizeRestrictions(restrictions) {
  if (restrictions == null) return null;
  if (typeof restrictions !== 'object') return restrictions;
  const users = restrictions.users || [];
  const teams = restrictions.teams || [];
  const apps = restrictions.apps || [];
  if (users.length === 0 && teams.length === 0 && apps.length === 0) {
    return null;
  }
  return restrictions;
}

/**
 * Compare current protection against the standard policy.
 *
 * Handles the GET-vs-PUT schema mismatch: GET response wraps booleans in
 * { enabled: true/false } objects, while PUT expects flat booleans.
 *
 * @param {object|null} current - GET response, or null if unprotected
 * @param {object} policy - Standard policy
 * @returns {{ gaps: Array<{setting: string, expected: *, actual: *, pass: boolean}>, allPass: boolean, passCount: number, totalCount: number }}
 */
function buildGapTable(current, policy) {
  const gaps = [];

  function check(setting, expected, actual) {
    // Normalize undefined to null so JSON.stringify doesn't drop the field
    const normalizedActual = actual === undefined ? null : actual;
    const pass = JSON.stringify(expected) === JSON.stringify(normalizedActual);
    gaps.push({ setting, expected, actual: normalizedActual, pass });
  }

  // required_pull_request_reviews
  const prReviews = current ? current.required_pull_request_reviews : null;

  check(
    'required_pull_request_reviews (exists)',
    true,
    prReviews != null,
  );

  check(
    'required_approving_review_count',
    policy.required_pull_request_reviews.required_approving_review_count,
    prReviews ? (prReviews.required_approving_review_count ?? null) : null,
  );

  check(
    'dismiss_stale_reviews',
    policy.required_pull_request_reviews.dismiss_stale_reviews,
    prReviews ? (prReviews.dismiss_stale_reviews ?? null) : null,
  );

  check(
    'require_code_owner_reviews',
    policy.required_pull_request_reviews.require_code_owner_reviews,
    prReviews ? (prReviews.require_code_owner_reviews ?? null) : null,
  );

  // required_status_checks
  const statusChecks = current ? current.required_status_checks : null;

  check(
    'required_status_checks (exists)',
    true,
    statusChecks != null,
  );

  check(
    'required_status_checks.strict',
    policy.required_status_checks.strict,
    statusChecks ? (statusChecks.strict ?? null) : null,
  );

  // enforce_admins — GET returns { enabled: bool }
  check(
    'enforce_admins',
    policy.enforce_admins,
    current ? extractEnabled(current.enforce_admins) : null,
  );

  // allow_force_pushes — GET returns { enabled: bool }
  check(
    'allow_force_pushes',
    policy.allow_force_pushes,
    current ? extractEnabled(current.allow_force_pushes) : null,
  );

  // allow_deletions — GET returns { enabled: bool }
  check(
    'allow_deletions',
    policy.allow_deletions,
    current ? extractEnabled(current.allow_deletions) : null,
  );

  // required_linear_history — GET returns { enabled: bool }
  check(
    'required_linear_history',
    policy.required_linear_history,
    current ? extractEnabled(current.required_linear_history) : null,
  );

  // restrictions — GitHub returns { users: [], teams: [], apps: [] } for "no restrictions",
  // which is functionally equivalent to null in the PUT payload.
  check(
    'restrictions',
    policy.restrictions,
    current ? normalizeRestrictions(current.restrictions) : null,
  );

  const passCount = gaps.filter(g => g.pass).length;
  return {
    gaps,
    allPass: passCount === gaps.length,
    passCount,
    totalCount: gaps.length,
  };
}

// ─── Merge Policy ─────────────────────────────────────────────────────────────

/**
 * Build a complete PUT payload by merging standard policy onto current protection.
 *
 * CRITICAL: GitHub branch protection PUT replaces the entire config.
 * This function reads current settings, overlays the standard policy, and
 * returns the full payload. It never sends a partial payload.
 *
 * @param {object|null} current - GET response, or null if creating from scratch
 * @param {object} policy - Standard policy
 * @returns {{ payload: object, warnings: string[] }}
 */
function mergePolicy(current, policy) {
  const warnings = [];

  // Resolve status check contexts: preserve existing or warn
  let contexts = [];
  if (current && current.required_status_checks) {
    // GitHub API may use 'contexts' (legacy) or 'checks' (newer)
    if (current.required_status_checks.contexts && current.required_status_checks.contexts.length > 0) {
      contexts = current.required_status_checks.contexts;
    } else if (current.required_status_checks.checks && current.required_status_checks.checks.length > 0) {
      // Convert checks format to contexts format for the PUT payload
      contexts = current.required_status_checks.checks.map(c => c.context || c);
    }
  }

  if (contexts.length === 0) {
    warnings.push('No existing status check contexts found. Status checks will be required but no specific checks are configured.');
  }

  const payload = {
    required_pull_request_reviews: {
      required_approving_review_count: policy.required_pull_request_reviews.required_approving_review_count,
      dismiss_stale_reviews: policy.required_pull_request_reviews.dismiss_stale_reviews,
      require_code_owner_reviews: policy.required_pull_request_reviews.require_code_owner_reviews,
    },
    required_status_checks: {
      strict: policy.required_status_checks.strict,
      contexts,
    },
    enforce_admins: policy.enforce_admins,
    restrictions: policy.restrictions,
    allow_force_pushes: policy.allow_force_pushes,
    allow_deletions: policy.allow_deletions,
    required_linear_history: policy.required_linear_history,
  };

  return { payload, warnings };
}

// ─── Apply Fix ────────────────────────────────────────────────────────────────

/**
 * Apply protection policy via PUT.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @param {object} payload - Complete PUT payload
 * @param {boolean} dryRun - If true, return payload without calling API
 * @returns {{ applied: boolean, payload: object, success?: boolean, error?: string }}
 */
function applyFix(owner, repo, branch, payload, dryRun) {
  if (dryRun) {
    return { applied: false, payload };
  }

  const result = execGh(
    ['api', '-X', 'PUT', `repos/${owner}/${repo}/branches/${branch}/protection`, '--input', '-'],
    { input: JSON.stringify(payload) },
  );

  if (result.exitCode !== 0) {
    return { applied: true, payload, success: false, error: result.stderr };
  }

  return { applied: true, payload, success: true };
}

// ─── Format ───────────────────────────────────────────────────────────────────

/**
 * Format a gap table as a human-readable string.
 */
function formatGapTable(owner, repo, branch, gapResult) {
  const lines = [];
  lines.push(`Branch Protection Audit: ${owner}/${repo} (${branch})`);
  lines.push('');
  lines.push('Setting                                 | Expected | Actual   | Result');
  lines.push('----------------------------------------|----------|----------|-------');

  for (const gap of gapResult.gaps) {
    const setting = gap.setting.padEnd(40);
    const expected = String(gap.expected).padEnd(9);
    const actual = String(gap.actual).padEnd(9);
    const result = gap.pass ? 'PASS' : 'FAIL';
    lines.push(`${setting}| ${expected}| ${actual}| ${result}`);
  }

  lines.push('');
  lines.push(`Result: ${gapResult.passCount}/${gapResult.totalCount} settings compliant`);
  return lines.join('\n');
}

// ─── Main Command ─────────────────────────────────────────────────────────────

/**
 * Audit and optionally enforce branch protection.
 *
 * @param {string} cwd - Project root
 * @param {object} options
 * @param {boolean} options.fix - Apply standard policy
 * @param {boolean} options.dryRun - Show PUT payload without applying
 * @param {string} options.branch - Target branch (default: main)
 * @param {boolean} raw - Raw output mode
 */
function cmdHardenRepo(cwd, options, raw) {
  const { owner, repo } = preflight(cwd);
  const branch = options.branch || 'main';

  validateShellArg(branch, 'branch name');

  // Read current protection
  const current = readProtection(owner, repo, branch);
  const noProtection = current === null;

  // Build gap table
  const gapResult = buildGapTable(current, STANDARD_POLICY);

  const result = {
    owner,
    repo,
    branch,
    noProtection,
    gaps: gapResult.gaps,
    allPass: gapResult.allPass,
    passCount: gapResult.passCount,
    totalCount: gapResult.totalCount,
  };

  // Fix path
  if (options.fix) {
    const { payload, warnings } = mergePolicy(current, STANDARD_POLICY);
    result.mergeWarnings = warnings;

    const fixResult = applyFix(owner, repo, branch, payload, options.dryRun);
    result.payload = fixResult.payload;
    result.applied = fixResult.applied;
    result.dryRun = options.dryRun || false;

    if (fixResult.applied) {
      result.fixSuccess = fixResult.success;
      result.fixError = fixResult.error || null;

      // Post-fix verification: re-read and re-check
      if (fixResult.success) {
        const verified = readProtection(owner, repo, branch);
        const verifyResult = buildGapTable(verified, STANDARD_POLICY);
        result.verified = verifyResult.allPass;
        result.verifiedGaps = verifyResult.gaps;
        result.verifiedPassCount = verifyResult.passCount;
      }
    }
  }

  const humanTable = formatGapTable(owner, repo, branch, gapResult);
  output(result, raw, humanTable);
}

module.exports = {
  cmdHardenRepo,
  STANDARD_POLICY,
  buildGapTable,
  mergePolicy,
};
