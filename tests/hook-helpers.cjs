/**
 * GSD Hook Test Helpers
 *
 * Shared utilities for testing hook scripts that read stdin JSON
 * and return structured output via stdout/stderr with exit codes.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Run a hook script by spawning node with the given stdin JSON.
 *
 * @param {string} hookPath - Absolute path to the hook .js file.
 * @param {object|string} stdinObj - Object (JSON-stringified) or raw string piped to stdin.
 * @param {object} [opts] - Optional overrides.
 * @param {object} [opts.env] - Extra env vars merged onto process.env.
 * @param {string} [opts.cwd] - Working directory for the child process.
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function runHook(hookPath, stdinObj, opts = {}) {
  const stdinStr = typeof stdinObj === 'string' ? stdinObj : JSON.stringify(stdinObj);
  const childEnv = { ...process.env, ...(opts.env || {}) };
  const cwd = opts.cwd || process.cwd();

  try {
    const stdout = execFileSync(process.execPath, [hookPath], {
      input: stdinStr,
      env: childEnv,
      encoding: 'utf8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return { exitCode: 0, stdout: stdout || '', stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
    };
  }
}

/**
 * Create a temp directory with .planning/config.json containing the given config.
 *
 * @param {object} configObj - Config object written to .planning/config.json.
 * @returns {string} Absolute path to the temp directory.
 */
function createTempWithConfig(configObj) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-hook-test-'));
  const planningDir = path.join(tmpDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(
    path.join(planningDir, 'config.json'),
    JSON.stringify(configObj, null, 2),
    'utf8'
  );
  return tmpDir;
}

/**
 * Write a context bridge file for the given session ID.
 *
 * @param {string} sessionId - Session identifier.
 * @param {object} metricsObj - Metrics payload.
 * @returns {string} Absolute path to the written bridge file.
 */
function writeBridgeFile(sessionId, metricsObj) {
  const filePath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(metricsObj, null, 2), 'utf8');
  return filePath;
}

/**
 * Remove a temp directory recursively.
 *
 * @param {string} tmpDir - Directory to remove.
 */
function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

module.exports = { runHook, createTempWithConfig, writeBridgeFile, cleanup };
