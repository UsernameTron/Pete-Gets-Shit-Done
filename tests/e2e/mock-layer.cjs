/**
 * E2E Mock Layer — Deterministic mocks for end-to-end GSD pipeline tests
 *
 * Provides four factory functions for building isolated, stateless test
 * fixtures that simulate GSD subagent calls, context objects, core module
 * stubs, and canned scenario responses.
 *
 * Zero external dependencies — Node built-ins only.
 * All mocks are synchronous.
 * No shared mutable state at module level — every call returns fresh objects.
 */

'use strict';

const path = require('path');

// ─── 1. mockSubagent ────────────────────────────────────────────────────────

/**
 * Register a canned response for a named subagent call.
 *
 * @param {string} name - Subagent identifier (e.g. 'gsd-verifier')
 * @param {*} cannedResponse - The value returned when the mock is invoked
 * @returns {{ calls: Array<{ name: string, args: *, timestamp: number }>, invoke: Function }}
 */
function mockSubagent(name, cannedResponse) {
  const tracker = { calls: [] };

  /**
   * Invoke the mock subagent. Records the call and returns the canned response.
   *
   * @param {*} [args] - Arguments passed to the subagent
   * @returns {*} cannedResponse
   */
  tracker.invoke = function invoke(args) {
    tracker.calls.push({
      name,
      args: args !== undefined ? args : null,
      timestamp: Date.now(),
    });
    return cannedResponse;
  };

  return tracker;
}

// ─── 2. createMockContext ───────────────────────────────────────────────────

/**
 * Build a mock GSD context object with sensible defaults.
 * Every call returns a fresh object — no cross-test contamination.
 *
 * @param {object} [overrides] - Key/value pairs merged over defaults
 * @returns {object} Mock context
 */
function createMockContext(overrides) {
  const defaults = {
    projectRoot: '/tmp/mock-project',
    statePath: '.planning/STATE.md',
    roadmapPath: '.planning/ROADMAP.md',
    configPath: '.planning/config.json',
    config: {
      model_profile: 'balanced',
      commit_docs: false,
    },
  };

  // Shallow-merge top-level, but deep-merge config so callers can
  // override individual config keys without losing the rest.
  const merged = Object.assign({}, defaults, overrides);
  if (overrides && overrides.config) {
    merged.config = Object.assign({}, defaults.config, overrides.config);
  }

  return merged;
}

// ─── 3. interceptCoreExports ────────────────────────────────────────────────

/**
 * Stub specific exports on the cached core.cjs module object.
 *
 * Uses require.cache to find the already-loaded core.cjs module, saves the
 * original export values, and replaces them with the provided stubs.
 * Returns a restore() handle that puts the originals back.
 *
 * If core.cjs is not yet in require.cache, it is require()'d first so the
 * cache entry exists.
 *
 * @param {Object<string, Function>} stubs - Map of { exportName: stubFn }
 * @returns {{ restore: Function }}
 *
 * @example
 *   const { restore } = interceptCoreExports({ debugLog: () => {} });
 *   // ... test code that imports core.cjs gets the stub ...
 *   restore();
 */
function interceptCoreExports(stubs) {
  const corePath = require.resolve(
    path.join(__dirname, '..', '..', 'get-shit-done', 'bin', 'lib', 'core.cjs')
  );

  // Ensure the module is loaded so its cache entry exists.
  if (!require.cache[corePath]) {
    require(corePath);
  }

  const coreModule = require.cache[corePath];
  const originals = {};

  for (const name of Object.keys(stubs)) {
    if (name in coreModule.exports) {
      originals[name] = coreModule.exports[name];
      coreModule.exports[name] = stubs[name];
    } else {
      // Still allow stubbing — the test may be adding an export it expects.
      // Record undefined so restore() removes it cleanly.
      originals[name] = undefined;
      coreModule.exports[name] = stubs[name];
    }
  }

  return {
    /**
     * Restore all original export values. Safe to call multiple times.
     */
    restore() {
      for (const name of Object.keys(originals)) {
        if (originals[name] === undefined) {
          delete coreModule.exports[name];
        } else {
          coreModule.exports[name] = originals[name];
        }
      }
    },
  };
}

// ─── 4. createDeterministicResponses ────────────────────────────────────────

/**
 * Factory returning pre-built, realistic GSD response objects for a given
 * scenario. Every call produces fresh objects.
 *
 * @param {'plan-phase' | 'execute-phase' | 'verify-work'} scenario
 * @returns {object} Scenario-specific response fixture
 * @throws {Error} If scenario is unrecognized
 */
function createDeterministicResponses(scenario) {
  switch (scenario) {
    case 'plan-phase':
      return buildPlanPhaseResponses();
    case 'execute-phase':
      return buildExecutePhaseResponses();
    case 'verify-work':
      return buildVerifyWorkResponses();
    default:
      throw new Error(
        `createDeterministicResponses: unknown scenario "${scenario}". ` +
        'Expected one of: plan-phase, execute-phase, verify-work'
      );
  }
}

// ─── Scenario builders (private) ────────────────────────────────────────────

function buildPlanPhaseResponses() {
  return {
    planContent: [
      '---',
      'phase: 01',
      'plan: 01',
      'type: execute',
      'wave: 1',
      'title: Implement authentication module',
      'complexity: standard',
      'estimated_tasks: 3',
      '---',
      '',
      '# Plan 01-01: Implement Authentication Module',
      '',
      '## Context',
      '',
      'The application needs a session-based authentication module that supports',
      'email/password login, token refresh, and logout. This plan covers the core',
      'auth logic; UI integration is deferred to Plan 01-02.',
      '',
      '## Requirements',
      '',
      '- AUTH-01: Users can sign in with email and password',
      '- AUTH-02: Sessions persist via signed JWT tokens',
      '- AUTH-03: Token refresh occurs automatically before expiry',
      '- AUTH-04: Logout invalidates the current session',
      '',
      '## Tasks',
      '',
      '### Wave 1 (parallel)',
      '',
      '1. **Create `src/auth/session.js`** — Session manager with create, refresh, destroy',
      '2. **Create `src/auth/tokens.js`** — JWT sign/verify helpers using crypto module',
      '3. **Create `tests/auth.test.js`** — Unit tests covering all four requirements',
      '',
      '## Acceptance Criteria',
      '',
      '- [ ] All AUTH-* requirements have passing tests',
      '- [ ] No hardcoded secrets — all config via environment variables',
      '- [ ] Token expiry set to 15 minutes with 7-day refresh window',
      '',
      '## Risks',
      '',
      '- JWT library choice may affect token size; monitor payload under 4 KB',
      '',
    ].join('\n'),

    contextContent: [
      '# Context — Phase 01',
      '',
      '## Project State',
      '',
      'Fresh project with scaffolding complete. No existing auth system.',
      'Database schema includes a `users` table with `email` and `password_hash` columns.',
      '',
      '## Dependencies',
      '',
      '- Node.js 20+ (native crypto for JWT)',
      '- PostgreSQL 15 (user store)',
      '',
      '## Constraints',
      '',
      '- Zero external auth dependencies — use built-in crypto only',
      '- Must be stateless — no server-side session store',
      '',
      '## Prior Decisions',
      '',
      '- ADR-001: Chose JWT over opaque tokens for stateless scaling',
      '- ADR-002: Chose bcrypt-compatible hashing via crypto.scrypt',
      '',
    ].join('\n'),

    frontmatter: {
      phase: '01',
      plan: '01',
      type: 'execute',
      wave: 1,
      title: 'Implement authentication module',
      complexity: 'standard',
      estimated_tasks: 3,
    },
  };
}

function buildExecutePhaseResponses() {
  return {
    summaryContent: [
      '# Summary — Plan 01-01: Implement Authentication Module',
      '',
      '## What was built',
      '',
      '- Created `src/auth/session.js` with create, refresh, and destroy methods',
      '- Created `src/auth/tokens.js` with JWT sign/verify using Node crypto',
      '- Created `tests/auth.test.js` covering AUTH-01 through AUTH-04',
      '',
      '## Files changed',
      '',
      '| File | Action | Lines |',
      '|------|--------|-------|',
      '| `src/auth/session.js` | Created | 87 |',
      '| `src/auth/tokens.js` | Created | 54 |',
      '| `tests/auth.test.js` | Created | 112 |',
      '',
      '## Self-Check',
      '',
      '- [x] AUTH-01: Email/password sign-in — verified via test',
      '- [x] AUTH-02: JWT session persistence — verified via test',
      '- [x] AUTH-03: Automatic token refresh — verified via test',
      '- [x] AUTH-04: Logout invalidation — verified via test',
      '- [x] No hardcoded secrets — all via `process.env`',
      '- [x] Token expiry 15 min / refresh 7 days — verified in config',
      '',
      '## Notes',
      '',
      'JWT payload averages 320 bytes — well under the 4 KB risk threshold.',
      '',
    ].join('\n'),

    taskResults: [
      {
        taskId: '01-01-W1-T1',
        title: 'Create src/auth/session.js',
        wave: 1,
        status: 'complete',
        filesCreated: ['src/auth/session.js'],
        filesModified: [],
        duration_ms: 4200,
      },
      {
        taskId: '01-01-W1-T2',
        title: 'Create src/auth/tokens.js',
        wave: 1,
        status: 'complete',
        filesCreated: ['src/auth/tokens.js'],
        filesModified: [],
        duration_ms: 2800,
      },
      {
        taskId: '01-01-W1-T3',
        title: 'Create tests/auth.test.js',
        wave: 1,
        status: 'complete',
        filesCreated: ['tests/auth.test.js'],
        filesModified: [],
        duration_ms: 5100,
      },
    ],
  };
}

function buildVerifyWorkResponses() {
  return {
    verificationContent: [
      '# Verification — Phase 01',
      '',
      '## Overall Result: PASS',
      '',
      '**Verified by:** gsd-verifier',
      '**Timestamp:** 2026-04-04T12:00:00Z',
      '',
      '## Criteria Results',
      '',
      '| # | Criterion | Result | Evidence |',
      '|---|-----------|--------|----------|',
      '| 1 | All AUTH-* requirements have passing tests | PASS | `npm test` exits 0, 4/4 tests pass |',
      '| 2 | No hardcoded secrets | PASS | grep for API_KEY, SECRET, PASSWORD returns 0 hits in src/ |',
      '| 3 | Token expiry configured correctly | PASS | `tokens.js` line 12: `expiresIn: 900` (15 min) |',
      '',
      '## Test Output',
      '',
      '```',
      'TAP version 13',
      '# auth module',
      'ok 1 - signs in with valid email and password',
      'ok 2 - persists session via JWT',
      'ok 3 - refreshes token before expiry',
      'ok 4 - logout invalidates session',
      '',
      '1..4',
      '# tests 4',
      '# pass  4',
      '# fail  0',
      '```',
      '',
      '## Notes',
      '',
      'All acceptance criteria met. No issues found during verification.',
      '',
    ].join('\n'),

    passed: true,

    criteria: [
      {
        id: 1,
        description: 'All AUTH-* requirements have passing tests',
        result: 'pass',
        evidence: '`npm test` exits 0, 4/4 tests pass',
      },
      {
        id: 2,
        description: 'No hardcoded secrets',
        result: 'pass',
        evidence: 'grep for API_KEY, SECRET, PASSWORD returns 0 hits in src/',
      },
      {
        id: 3,
        description: 'Token expiry configured correctly',
        result: 'pass',
        evidence: '`tokens.js` line 12: `expiresIn: 900` (15 min)',
      },
    ],
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  mockSubagent,
  createMockContext,
  interceptCoreExports,
  createDeterministicResponses,
};
