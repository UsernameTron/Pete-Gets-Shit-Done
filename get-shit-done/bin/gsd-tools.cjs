#!/usr/bin/env node

/**
 * GSD Tools — CLI utility for GSD workflow operations
 *
 * Replaces repetitive inline bash patterns across ~50 GSD command/workflow/agent files.
 * Centralizes: config parsing, model resolution, phase lookup, git commits, summary verification.
 *
 * Usage: node gsd-tools.cjs <command> [args] [--raw] [--pick <field>]
 *
 * Atomic Commands:
 *   state load                         Load project config + state
 *   state json                         Output STATE.md frontmatter as JSON
 *   state update <field> <value>       Update a STATE.md field
 *   state get [section]                Get STATE.md content or section
 *   state patch --field val ...        Batch update STATE.md fields
 *   state begin-phase --phase N --name S --plans C  Update STATE.md for new phase start
 *   state signal-waiting --type T --question Q --options "A|B" --phase P  Write WAITING.json signal
 *   state signal-resume                Remove WAITING.json signal
 *   resolve-model <agent-type>         Get model for agent based on profile
 *   find-phase <phase>                 Find phase directory by number
 *   commit <message> [--files f1 f2] [--no-verify]   Commit planning docs
 *   commit-to-subrepo <msg> --files f1 f2  Route commits to sub-repos
 *   verify-summary <path>              Verify a SUMMARY.md file
 *   generate-slug <text>               Convert text to URL-safe slug
 *   current-timestamp [format]         Get timestamp (full|date|filename)
 *   list-todos [area]                  Count and enumerate pending todos
 *   verify-path-exists <path>          Check file/directory existence
 *   config-ensure-section              Initialize .planning/config.json
 *   history-digest                     Aggregate all SUMMARY.md data
 *   do-registry                        List routable commands + workflows for /gsd:do
 *   summary-extract <path> [--fields]  Extract structured data from SUMMARY.md
 *   state-snapshot                     Structured parse of STATE.md
 *   phase-plan-index <phase>           Index plans with waves and status
 *   websearch <query>                  Search web via Brave API (if configured)
 *     [--limit N] [--freshness day|week|month]
 *
 * Phase Operations:
 *   phase next-decimal <phase>         Calculate next decimal phase number
 *   phase add <description> [--id ID]   Append new phase to roadmap + create dir
 *   phase insert <after> <description> Insert decimal phase after existing
 *   phase remove <phase> [--force]     Remove phase, renumber all subsequent
 *   phase complete <phase>             Mark phase done, update state + roadmap
 *
 * Roadmap Operations:
 *   roadmap get-phase <phase>          Extract phase section from ROADMAP.md
 *   roadmap analyze                    Full roadmap parse with disk status
 *   roadmap update-plan-progress <N>   Update progress table row from disk (PLAN vs SUMMARY counts)
 *
 * Requirements Operations:
 *   requirements mark-complete <ids>   Mark requirement IDs as complete in REQUIREMENTS.md
 *                                      Accepts: REQ-01,REQ-02 or REQ-01 REQ-02 or [REQ-01, REQ-02]
 *
 * Milestone Operations:
 *   milestone complete <version>       Archive milestone, create MILESTONES.md
 *     [--name <name>]
 *     [--archive-phases]               Move phase dirs to milestones/vX.Y-phases/
 *
 * Governance:
 *   harden-repo [--fix] [--dry-run]    Audit branch protection against standard policy
 *     [--branch <name>]                Optionally apply fixes via read-merge-PUT
 *
 * Validation:
 *   validate consistency               Check phase numbering, disk/roadmap sync
 *   validate health [--repair]         Check .planning/ integrity, optionally repair
 *   validate agents                    Check GSD agent installation status
 *
 * Progress:
 *   progress [json|table|bar]          Render progress in various formats
 *
 * Todos:
 *   todo complete <filename>           Move todo from pending to completed
 *
 * UAT Audit:
 *   audit-uat                           Scan all phases for unresolved UAT/verification items
 *   uat render-checkpoint --file <path> Render the current UAT checkpoint block
 *
 * Scaffolding:
 *   scaffold context --phase <N>       Create CONTEXT.md template
 *   scaffold uat --phase <N>           Create UAT.md template
 *   scaffold verification --phase <N>  Create VERIFICATION.md template
 *   scaffold phase-dir --phase <N>     Create phase directory
 *     --name <name>
 *
 * Frontmatter CRUD:
 *   frontmatter get <file> [--field k] Extract frontmatter as JSON
 *   frontmatter set <file> --field k   Update single frontmatter field
 *     --value jsonVal
 *   frontmatter merge <file>           Merge JSON into frontmatter
 *     --data '{json}'
 *   frontmatter validate <file>        Validate required fields
 *     --schema plan|summary|verification
 *
 * Verification Suite:
 *   verify plan-structure <file>       Check PLAN.md structure + tasks
 *   verify phase-completeness <phase>  Check all plans have summaries
 *   verify references <file>           Check @-refs + paths resolve
 *   verify commits <h1> [h2] ...      Batch verify commit hashes
 *   verify artifacts <plan-file>       Check must_haves.artifacts
 *   verify key-links <plan-file>       Check must_haves.key_links
 *
 * Template Fill:
 *   template fill summary --phase N    Create pre-filled SUMMARY.md
 *     [--plan M] [--name "..."]
 *     [--fields '{json}']
 *   template fill plan --phase N       Create pre-filled PLAN.md
 *     [--plan M] [--type execute|tdd]
 *     [--wave N] [--fields '{json}']
 *   template fill verification         Create pre-filled VERIFICATION.md
 *     --phase N [--fields '{json}']
 *
 * State Progression:
 *   state advance-plan                 Increment plan counter
 *   state record-metric --phase N      Record execution metrics
 *     --plan M --duration Xmin
 *     [--tasks N] [--files N]
 *   state update-progress              Recalculate progress bar
 *   state add-decision --summary "..."  Add decision to STATE.md
 *     [--phase N] [--rationale "..."]
 *     [--summary-file path] [--rationale-file path]
 *   state add-blocker --text "..."     Add blocker
 *     [--text-file path]
 *   state resolve-blocker --text "..." Remove blocker
 *   state record-session               Update session continuity
 *     --stopped-at "..."
 *     [--resume-file path]
 *
 * Compound Commands (workflow-specific initialization):
 *   init execute-phase <phase>         All context for execute-phase workflow
 *   init plan-phase <phase>            All context for plan-phase workflow
 *   init new-project                   All context for new-project workflow
 *   init new-milestone                 All context for new-milestone workflow
 *   init quick <description>           All context for quick workflow
 *   init resume                        All context for resume-project workflow
 *   init verify-work <phase>           All context for verify-work workflow
 *   init phase-op <phase>              Generic phase operation context
 *   init todos [area]                  All context for todo workflows
 *   init milestone-op                  All context for milestone operations
 *   init map-codebase                  All context for map-codebase workflow
 *   init progress                      All context for progress workflow
 */

const fs = require('fs');
const path = require('path');
const core = require('./lib/core.cjs');
const { error, findProjectRoot, getActiveWorkstream } = core;
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');
const profilePipeline = require('./lib/profile-pipeline.cjs');
const profileOutput = require('./lib/profile-output.cjs');
const workstream = require('./lib/workstream.cjs');

// ─── Arg parsing helpers ──────────────────────────────────────────────────────

/**
 * Extract named --flag <value> pairs from an args array.
 * Returns an object mapping flag names to their values (null if absent).
 * Flags listed in `booleanFlags` are treated as boolean (no value consumed).
 *
 * parseNamedArgs(args, 'phase', 'plan')        → { phase: '3', plan: '1' }
 * parseNamedArgs(args, [], ['amend', 'force'])  → { amend: true, force: false }
 */
function parseNamedArgs(args, valueFlags = [], booleanFlags = []) {
  const result = {};
  for (const flag of valueFlags) {
    const idx = args.indexOf(`--${flag}`);
    result[flag] = idx !== -1 && args[idx + 1] !== undefined && !args[idx + 1].startsWith('--')
      ? args[idx + 1]
      : null;
  }
  for (const flag of booleanFlags) {
    result[flag] = args.includes(`--${flag}`);
  }
  return result;
}

/**
 * Collect all tokens after --flag until the next --flag or end of args.
 * Handles multi-word values like --name Foo Bar Version 1.
 * Returns null if the flag is absent.
 */
function parseMultiwordArg(args, flag) {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1) return null;
  const tokens = [];
  for (let i = idx + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) break;
    tokens.push(args[i]);
  }
  return tokens.length > 0 ? tokens.join(' ') : null;
}

// ─── CLI Router ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  // Resolve worktree root: in a linked worktree, .planning/ lives in the main worktree.
  // However, in monorepo worktrees where the subdirectory itself owns .planning/,
  // skip worktree resolution — the CWD is already the correct project root.
  const { resolveWorktreeRoot } = require('./lib/core.cjs');
  if (!fs.existsSync(path.join(cwd, '.planning'))) {
    const worktreeRoot = resolveWorktreeRoot(cwd);
    if (worktreeRoot !== cwd) {
      cwd = worktreeRoot;
    }
  }

  // Optional workstream override for parallel milestone work.
  // Priority: --ws flag > GSD_WORKSTREAM env var > active-workstream file > null (flat mode)
  const wsEqArg = args.find(arg => arg.startsWith('--ws='));
  const wsIdx = args.indexOf('--ws');
  let ws = null;
  if (wsEqArg) {
    ws = wsEqArg.slice('--ws='.length).trim();
    if (!ws) error('Missing value for --ws');
    args.splice(args.indexOf(wsEqArg), 1);
  } else if (wsIdx !== -1) {
    ws = args[wsIdx + 1];
    if (!ws || ws.startsWith('--')) error('Missing value for --ws');
    args.splice(wsIdx, 2);
  } else if (process.env.GSD_WORKSTREAM) {
    ws = process.env.GSD_WORKSTREAM.trim();
  } else {
    ws = getActiveWorkstream(cwd);
  }
  // Validate workstream name to prevent path traversal attacks.
  if (ws && !/^[a-zA-Z0-9_-]+$/.test(ws)) {
    error('Invalid workstream name: must be alphanumeric, hyphens, and underscores only');
  }
  // Set env var so all modules (planningDir, planningPaths) auto-resolve workstream paths
  if (ws) {
    process.env.GSD_WORKSTREAM = ws;
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  // --pick <name>: extract a single field from JSON output (replaces jq dependency).
  // Supports dot-notation (e.g., --pick workflow.research) and bracket notation
  // for arrays (e.g., --pick directories[-1]).
  const pickIdx = args.indexOf('--pick');
  let pickField = null;
  if (pickIdx !== -1) {
    pickField = args[pickIdx + 1];
    if (!pickField || pickField.startsWith('--')) error('Missing value for --pick');
    args.splice(pickIdx, 2);
  }

  const command = args[0];

  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--pick <field>] [--cwd <path>] [--ws <name>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, config-new-project, init, workstream');
  }

  // Multi-repo guard: resolve project root for commands that read/write .planning/.
  // Skip for pure-utility commands that don't touch .planning/ to avoid unnecessary
  // filesystem traversal on every invocation.
  const SKIP_ROOT_RESOLUTION = new Set([
    'generate-slug', 'current-timestamp', 'verify-path-exists',
    'verify-summary', 'template', 'frontmatter', 'do-registry',
  ]);
  if (!SKIP_ROOT_RESOLUTION.has(command)) {
    cwd = findProjectRoot(cwd);
  }

  // When --pick is active, intercept stdout to extract the requested field.
  if (pickField) {
    const origWriteSync = fs.writeSync;
    const chunks = [];
    fs.writeSync = function (fd, data, ...rest) {
      if (fd === 1) { chunks.push(String(data)); return; }
      return origWriteSync.call(fs, fd, data, ...rest);
    };
    const cleanup = () => {
      fs.writeSync = origWriteSync;
      const captured = chunks.join('');
      let jsonStr = captured;
      if (jsonStr.startsWith('@file:')) {
        const filePath = jsonStr.slice(6);
        // SEC2-01: Allowlist — only project dir or gsd-*.json in tmpdir
        const resolvedFile = path.resolve(filePath);
        const tmpDir = require('os').tmpdir();
        const inProject = resolvedFile.startsWith(path.resolve(cwd) + path.sep);
        const inTmpGsd = resolvedFile.startsWith(tmpDir + path.sep)
          && path.basename(resolvedFile).startsWith('gsd-')
          && resolvedFile.endsWith('.json');
        if (!inProject && !inTmpGsd) {
          throw new Error(`@file: path not in allowlist: ${filePath}`);
        }
        jsonStr = fs.readFileSync(resolvedFile, 'utf-8');
      }
      try {
        const obj = JSON.parse(jsonStr);
        const value = extractField(obj, pickField);
        const result = value === null || value === undefined ? '' : String(value);
        origWriteSync.call(fs, 1, result);
      } catch {
        origWriteSync.call(fs, 1, captured);
      }
    };
    try {
      await runCommand(command, args, cwd, raw);
      cleanup();
    } catch (e) {
      fs.writeSync = origWriteSync;
      throw e;
    }
    return;
  }

  await runCommand(command, args, cwd, raw);
}

/**
 * Extract a field from an object using dot-notation and bracket syntax.
 * Supports: 'field', 'parent.child', 'arr[-1]', 'arr[0]'
 */
function extractField(obj, fieldPath) {
  const parts = fieldPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const bracketMatch = part.match(/^(.+?)\[(-?\d+)]$/);
    if (bracketMatch) {
      const key = bracketMatch[1];
      const index = parseInt(bracketMatch[2], 10);
      current = current[key];
      if (!Array.isArray(current)) return undefined;
      current = index < 0 ? current[current.length + index] : current[index];
    } else {
      current = current[part];
    }
  }
  return current;
}

// ─── Command dispatch ─────────────────────────────────────────────────────────

/**
 * Own-property lookup, so inherited keys (e.g. `constructor`) stay unknown
 * exactly as they did under the old switch statement.
 */
function lookup(table, key) {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/** Route on args[1] through `table`; anything unmatched goes to `fallback`. */
function subcommands(table, fallback) {
  return (args, cwd, raw) => (lookup(table, args[1]) || fallback)(args, cwd, raw);
}

/** Fallback that rejects an unknown subcommand with a fixed message. */
function unknownSubcommand(message) {
  return () => error(message);
}

/** Value following --flag, or `fallback` when the flag is absent. */
function flagValue(args, flag, fallback = null) {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? args[idx + 1] : fallback;
}

/** Integer following --flag, or `fallback` when the flag is absent. */
function flagInt(args, flag, fallback) {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? parseInt(args[idx + 1], 10) : fallback;
}

/** Positional args after `--files`, or [] when the flag is absent. */
function filesAfterFlag(args) {
  const filesIndex = args.indexOf('--files');
  return filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
}

// ─── state ────────────────────────────────────────────────────────────────────

function handleStatePatch(args, cwd, raw) {
  const patches = {};
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (key && value !== undefined) {
      patches[key] = value;
    }
  }
  state.cmdStatePatch(cwd, patches, raw);
}

function handleStateAddDecision(args, cwd, raw) {
  const { phase: p, summary, 'summary-file': summary_file, rationale, 'rationale-file': rationale_file } = parseNamedArgs(args, ['phase', 'summary', 'summary-file', 'rationale', 'rationale-file']);
  state.cmdStateAddDecision(cwd, { phase: p, summary, summary_file, rationale: rationale || '', rationale_file }, raw);
}

function handleStateRecordSession(args, cwd, raw) {
  const { 'stopped-at': stopped_at, 'resume-file': resume_file } = parseNamedArgs(args, ['stopped-at', 'resume-file']);
  state.cmdStateRecordSession(cwd, { stopped_at, resume_file: resume_file || 'None' }, raw);
}

function handleStateBeginPhase(args, cwd, raw) {
  const { phase: p, name, plans } = parseNamedArgs(args, ['phase', 'name', 'plans']);
  state.cmdStateBeginPhase(cwd, p, name, plans !== null ? parseInt(plans, 10) : null, raw);
}

function handleStateSignalWaiting(args, cwd, raw) {
  const { type, question, options, phase: p } = parseNamedArgs(args, ['type', 'question', 'options', 'phase']);
  state.cmdSignalWaiting(cwd, type, question, options, p, raw);
}

const STATE_SUBCOMMANDS = {
  'json': (args, cwd, raw) => state.cmdStateJson(cwd, raw),
  'update': (args, cwd) => state.cmdStateUpdate(cwd, args[2], args[3]),
  'get': (args, cwd, raw) => state.cmdStateGet(cwd, args[2], raw),
  'patch': handleStatePatch,
  'advance-plan': (args, cwd, raw) => state.cmdStateAdvancePlan(cwd, raw),
  'record-metric': (args, cwd, raw) => state.cmdStateRecordMetric(cwd, parseNamedArgs(args, ['phase', 'plan', 'duration', 'tasks', 'files']), raw),
  'update-progress': (args, cwd, raw) => state.cmdStateUpdateProgress(cwd, raw),
  'add-decision': handleStateAddDecision,
  'add-blocker': (args, cwd, raw) => {
    const { text, 'text-file': text_file } = parseNamedArgs(args, ['text', 'text-file']);
    state.cmdStateAddBlocker(cwd, { text, text_file }, raw);
  },
  'resolve-blocker': (args, cwd, raw) => state.cmdStateResolveBlocker(cwd, parseNamedArgs(args, ['text']).text, raw),
  'record-session': handleStateRecordSession,
  'begin-phase': handleStateBeginPhase,
  'signal-waiting': handleStateSignalWaiting,
  'signal-resume': (args, cwd, raw) => state.cmdSignalResume(cwd, raw),
};

// ─── commit / verify-summary / template / frontmatter / verify ───────────────

function handleCommit(args, cwd, raw) {
  const amend = args.includes('--amend');
  const noVerify = args.includes('--no-verify');
  const filesIndex = args.indexOf('--files');
  // Collect all positional args between command name and first flag,
  // then join them — handles both quoted ("multi word msg") and
  // unquoted (multi word msg) invocations from different shells
  const endIndex = filesIndex !== -1 ? filesIndex : args.length;
  const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
  const message = messageArgs.join(' ') || undefined;
  commands.cmdCommit(cwd, message, filesAfterFlag(args), raw, amend, noVerify);
}

function handleTemplateFill(args, cwd, raw) {
  const templateType = args[2];
  const { phase, plan, name, type, wave, fields: fieldsRaw } = parseNamedArgs(args, ['phase', 'plan', 'name', 'type', 'wave', 'fields']);
  let fields = {};
  if (fieldsRaw) {
    const { safeJsonParse } = require('./lib/security.cjs');
    const result = safeJsonParse(fieldsRaw, { label: '--fields' });
    if (!result.ok) error(result.error);
    fields = result.value;
  }
  template.cmdTemplateFill(cwd, templateType, {
    phase, plan, name, fields,
    type: type || 'execute',
    wave: wave || '1',
  }, raw);
}

function handleFrontmatterSet(args, cwd, raw) {
  const { field, value } = parseNamedArgs(args, ['field', 'value']);
  frontmatter.cmdFrontmatterSet(cwd, args[2], field, value !== null ? value : undefined, raw);
}

const TEMPLATE_SUBCOMMANDS = {
  'select': (args, cwd, raw) => template.cmdTemplateSelect(cwd, args[2], raw),
  'fill': handleTemplateFill,
};

const FRONTMATTER_SUBCOMMANDS = {
  'get': (args, cwd, raw) => frontmatter.cmdFrontmatterGet(cwd, args[2], parseNamedArgs(args, ['field']).field, raw),
  'set': handleFrontmatterSet,
  'merge': (args, cwd, raw) => frontmatter.cmdFrontmatterMerge(cwd, args[2], parseNamedArgs(args, ['data']).data, raw),
  'validate': (args, cwd, raw) => frontmatter.cmdFrontmatterValidate(cwd, args[2], parseNamedArgs(args, ['schema']).schema, raw),
};

const VERIFY_SUBCOMMANDS = {
  'plan-structure': (args, cwd, raw) => verify.cmdVerifyPlanStructure(cwd, args[2], raw),
  'phase-completeness': (args, cwd, raw) => verify.cmdVerifyPhaseCompleteness(cwd, args[2], raw),
  'references': (args, cwd, raw) => verify.cmdVerifyReferences(cwd, args[2], raw),
  'commits': (args, cwd, raw) => verify.cmdVerifyCommits(cwd, args.slice(2), raw),
  'artifacts': (args, cwd, raw) => verify.cmdVerifyArtifacts(cwd, args[2], raw),
  'key-links': (args, cwd, raw) => verify.cmdVerifyKeyLinks(cwd, args[2], raw),
};

// ─── harden-repo / skills / history ──────────────────────────────────────────

function handleHardenRepo(args, cwd, raw) {
  const hardenRepo = require('./lib/harden-repo.cjs');
  const flags = parseNamedArgs(args, ['branch'], ['fix', 'dry-run']);
  hardenRepo.cmdHardenRepo(cwd, {
    fix: flags.fix,
    dryRun: flags['dry-run'],
    branch: flags.branch || 'main',
  }, raw);
}

function handleSkillQuery(args, cwd, raw) {
  const filterArgs = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i] && args[i].startsWith('--')) {
      filterArgs[args[i].slice(2)] = args[i + 1];
    }
  }
  const results = init.querySkills(cwd, filterArgs);
  core.output(results, raw);
}

function handleHistoryList(args, cwd, raw) {
  const history = require('./lib/history.cjs');
  const flags = parseNamedArgs(args, ['agent', 'outcome', 'limit'], []);
  const filters = {};
  if (flags.agent) filters.agent = flags.agent;
  if (flags.outcome) filters.outcome = flags.outcome;
  if (flags.limit) filters.limit = parseInt(flags.limit, 10);
  const result = history.queryHistory(cwd, filters);
  history.formatHistoryList(result.records, raw);
}

function handleHistoryStats(args, cwd, raw) {
  const history = require('./lib/history.cjs');
  const result = history.queryHistory(cwd, {});
  const patterns = history.detectPatterns(cwd);
  history.formatHistoryStats(result.records, patterns, raw);
}

function handleHistoryPrune(args, cwd, raw) {
  const history = require('./lib/history.cjs');
  const keepFlag = parseNamedArgs(args, ['keep'], []);
  const keepCount = keepFlag.keep ? parseInt(keepFlag.keep, 10) : 500;
  const result = history.pruneHistory(cwd, keepCount);
  if (raw) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`Pruned ${result.pruned} records. ${result.remaining} remaining.`);
  }
}

const HISTORY_SUBCOMMANDS = {
  'list': handleHistoryList,
  'stats': handleHistoryStats,
  'prune': handleHistoryPrune,
};

// ─── phases / roadmap / requirements / phase / milestone / validate ──────────

function handlePhasesList(args, cwd, raw) {
  const options = {
    type: flagValue(args, 'type'),
    phase: flagValue(args, 'phase'),
    includeArchived: args.includes('--include-archived'),
  };
  phase.cmdPhasesList(cwd, options, raw);
}

function handlePhaseAdd(args, cwd, raw) {
  let customId = null;
  const descArgs = [];
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--id' && i + 1 < args.length) {
      customId = args[i + 1];
      i++; // skip value
    } else {
      descArgs.push(args[i]);
    }
  }
  phase.cmdPhaseAdd(cwd, descArgs.join(' '), raw, customId);
}

function handleMilestoneComplete(args, cwd, raw) {
  const milestoneName = parseMultiwordArg(args, 'name');
  const archivePhases = args.includes('--archive-phases');
  milestone.cmdMilestoneComplete(cwd, args[2], { name: milestoneName, archivePhases }, raw);
}

const ROADMAP_SUBCOMMANDS = {
  'get-phase': (args, cwd, raw) => roadmap.cmdRoadmapGetPhase(cwd, args[2], raw),
  'analyze': (args, cwd, raw) => roadmap.cmdRoadmapAnalyze(cwd, raw),
  'update-plan-progress': (args, cwd, raw) => roadmap.cmdRoadmapUpdatePlanProgress(cwd, args[2], raw),
};

const PHASE_SUBCOMMANDS = {
  'next-decimal': (args, cwd, raw) => phase.cmdPhaseNextDecimal(cwd, args[2], raw),
  'add': handlePhaseAdd,
  'insert': (args, cwd, raw) => phase.cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw),
  'remove': (args, cwd, raw) => phase.cmdPhaseRemove(cwd, args[2], { force: args.includes('--force') }, raw),
  'complete': (args, cwd, raw) => phase.cmdPhaseComplete(cwd, args[2], raw),
};

const VALIDATE_SUBCOMMANDS = {
  'consistency': (args, cwd, raw) => verify.cmdValidateConsistency(cwd, raw),
  'health': (args, cwd, raw) => verify.cmdValidateHealth(cwd, { repair: args.includes('--repair') }, raw),
  'agents': (args, cwd, raw) => verify.cmdValidateAgents(cwd, raw),
};

// ─── uat / todo / scaffold / init ─────────────────────────────────────────────

function handleUatRunAutomated(args, cwd, raw) {
  const runner = require('./lib/uat-runner.cjs');
  const options = parseNamedArgs(args, ['phase']);
  const phaseArg = options.phase;
  if (!phaseArg) { error('--phase required for uat run-automated'); }
  const phasesDir = path.join(core.planningDir(cwd), 'phases');
  if (!fs.existsSync(phasesDir)) { error('No phases directory found in planning directory'); }
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const phaseDir = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .find(d => d.startsWith(phaseArg + '-') || d === phaseArg);
  if (!phaseDir) { error('Phase not found: ' + phaseArg); }
  const fullPhaseDir = path.join(phasesDir, phaseDir);
  const planFiles = fs.readdirSync(fullPhaseDir)
    .filter(f => f.endsWith('-PLAN.md'))
    .map(f => path.join(fullPhaseDir, f));
  const results = runner.runAutomatedUAT(planFiles);
  if (raw) {
    core.output(results, raw);
  } else {
    core.output(null, false, runner.formatUATResults(results));
  }
}

const UAT_SUBCOMMANDS = {
  'render-checkpoint': (args, cwd, raw) => require('./lib/uat.cjs').cmdRenderCheckpoint(cwd, parseNamedArgs(args, ['file']), raw),
  'run-automated': handleUatRunAutomated,
};

const TODO_SUBCOMMANDS = {
  'complete': (args, cwd, raw) => commands.cmdTodoComplete(cwd, args[2], raw),
  'match-phase': (args, cwd, raw) => commands.cmdTodoMatchPhase(cwd, args[2], raw),
};

function handleScaffold(args, cwd, raw) {
  const scaffoldOptions = {
    phase: parseNamedArgs(args, ['phase']).phase,
    name: parseMultiwordArg(args, 'name'),
  };
  commands.cmdScaffold(cwd, args[1], scaffoldOptions, raw);
}

const INIT_WORKFLOWS = {
  'execute-phase': (args, cwd, raw) => init.cmdInitExecutePhase(cwd, args[2], raw),
  'plan-phase': (args, cwd, raw) => init.cmdInitPlanPhase(cwd, args[2], raw),
  'new-project': (args, cwd, raw) => init.cmdInitNewProject(cwd, raw),
  'new-milestone': (args, cwd, raw) => init.cmdInitNewMilestone(cwd, raw),
  'quick': (args, cwd, raw) => init.cmdInitQuick(cwd, args.slice(2).join(' '), raw),
  'resume': (args, cwd, raw) => init.cmdInitResume(cwd, raw),
  'verify-work': (args, cwd, raw) => init.cmdInitVerifyWork(cwd, args[2], raw),
  'phase-op': (args, cwd, raw) => init.cmdInitPhaseOp(cwd, args[2], raw),
  'todos': (args, cwd, raw) => init.cmdInitTodos(cwd, args[2], raw),
  'milestone-op': (args, cwd, raw) => init.cmdInitMilestoneOp(cwd, raw),
  'map-codebase': (args, cwd, raw) => init.cmdInitMapCodebase(cwd, raw),
  'progress': (args, cwd, raw) => init.cmdInitProgress(cwd, raw),
  'manager': (args, cwd, raw) => init.cmdInitManager(cwd, raw),
  'new-workspace': (args, cwd, raw) => init.cmdInitNewWorkspace(cwd, raw),
  'list-workspaces': (args, cwd, raw) => init.cmdInitListWorkspaces(cwd, raw),
  'remove-workspace': (args, cwd, raw) => init.cmdInitRemoveWorkspace(cwd, args[2], raw),
};

// ─── summary-extract / websearch / profiling ─────────────────────────────────

function handleSummaryExtract(args, cwd, raw) {
  const fieldsIndex = args.indexOf('--fields');
  const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
  commands.cmdSummaryExtract(cwd, args[1], fields, raw);
}

function handleWebsearch(args, cwd, raw) {
  return commands.cmdWebsearch(args[1], {
    limit: flagInt(args, 'limit', 10),
    freshness: flagValue(args, 'freshness'),
  }, raw);
}

function handleScanSessions(args, cwd, raw) {
  const options = { verbose: args.includes('--verbose'), json: args.includes('--json') };
  return profilePipeline.cmdScanSessions(flagValue(args, 'path'), options, raw);
}

function handleExtractMessages(args, cwd, raw) {
  const sessionId = flagValue(args, 'session');
  const limit = flagInt(args, 'limit', null);
  const sessionsPath = flagValue(args, 'path');
  const projectArg = args[1];
  if (!projectArg || projectArg.startsWith('--')) {
    error('Usage: gsd-tools extract-messages <project> [--session <id>] [--limit N] [--path <dir>]\nRun scan-sessions first to see available projects.');
  }
  return profilePipeline.cmdExtractMessages(projectArg, { sessionId, limit }, raw, sessionsPath);
}

function handleProfileSample(args, cwd, raw) {
  const options = {
    limit: flagInt(args, 'limit', 150),
    maxPerProject: flagInt(args, 'max-per-project', null),
    maxChars: flagInt(args, 'max-chars', 500),
  };
  return profilePipeline.cmdProfileSample(flagValue(args, 'path'), options, raw);
}

function handleWriteProfile(args, cwd, raw) {
  const inputPath = flagValue(args, 'input');
  if (!inputPath) error('--input <analysis-json-path> is required');
  profileOutput.cmdWriteProfile(cwd, { input: inputPath, output: flagValue(args, 'output') }, raw);
}

function handleGenerateDevPreferences(args, cwd, raw) {
  const options = { analysis: flagValue(args, 'analysis'), output: flagValue(args, 'output'), stack: flagValue(args, 'stack') };
  profileOutput.cmdGenerateDevPreferences(cwd, options, raw);
}

function handleGenerateClaudeProfile(args, cwd, raw) {
  const options = { analysis: flagValue(args, 'analysis'), output: flagValue(args, 'output'), global: args.includes('--global') };
  profileOutput.cmdGenerateClaudeProfile(cwd, options, raw);
}

function handleGenerateClaudeMd(args, cwd, raw) {
  const options = { output: flagValue(args, 'output'), auto: args.includes('--auto'), force: args.includes('--force') };
  profileOutput.cmdGenerateClaudeMd(cwd, options, raw);
}

// ─── workstream ───────────────────────────────────────────────────────────────

function handleWorkstreamCreate(args, cwd, raw) {
  workstream.cmdWorkstreamCreate(cwd, args[2], {
    migrate: !args.includes('--no-migrate'),
    migrateName: flagValue(args, 'migrate-name'),
  }, raw);
}

const WORKSTREAM_SUBCOMMANDS = {
  'create': handleWorkstreamCreate,
  'list': (args, cwd, raw) => workstream.cmdWorkstreamList(cwd, raw),
  'status': (args, cwd, raw) => workstream.cmdWorkstreamStatus(cwd, args[2], raw),
  'complete': (args, cwd, raw) => workstream.cmdWorkstreamComplete(cwd, args[2], {}, raw),
  'set': (args, cwd, raw) => workstream.cmdWorkstreamSet(cwd, args[2], raw),
  'get': (args, cwd, raw) => workstream.cmdWorkstreamGet(cwd, raw),
  'progress': (args, cwd, raw) => workstream.cmdWorkstreamProgress(cwd, raw),
};

// ─── Top-level command table ──────────────────────────────────────────────────

/** Every handler takes (args, cwd, raw); async handlers return their promise. */
const COMMANDS = {
  'state': subcommands(STATE_SUBCOMMANDS, (args, cwd, raw) => state.cmdStateLoad(cwd, raw)),
  'resolve-model': (args, cwd, raw) => commands.cmdResolveModel(cwd, args[1], raw),
  'find-phase': (args, cwd, raw) => phase.cmdFindPhase(cwd, args[1], raw),
  'commit': handleCommit,
  'commit-to-subrepo': (args, cwd, raw) => commands.cmdCommitToSubrepo(cwd, args[1], filesAfterFlag(args), raw),
  'verify-summary': (args, cwd, raw) => verify.cmdVerifySummary(cwd, args[1], flagInt(args, 'check-count', 2), raw),
  'template': subcommands(TEMPLATE_SUBCOMMANDS, unknownSubcommand('Unknown template subcommand. Available: select, fill')),
  'frontmatter': subcommands(FRONTMATTER_SUBCOMMANDS, unknownSubcommand('Unknown frontmatter subcommand. Available: get, set, merge, validate')),
  'verify': subcommands(VERIFY_SUBCOMMANDS, unknownSubcommand('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links')),
  'generate-slug': (args, cwd, raw) => commands.cmdGenerateSlug(args[1], raw),
  'harden-repo': handleHardenRepo,
  'current-timestamp': (args, cwd, raw) => commands.cmdCurrentTimestamp(args[1] || 'full', raw),
  'list-todos': (args, cwd, raw) => commands.cmdListTodos(cwd, args[1], raw),
  'verify-path-exists': (args, cwd, raw) => commands.cmdVerifyPathExists(cwd, args[1], raw),
  'config-ensure-section': (args, cwd, raw) => config.cmdConfigEnsureSection(cwd, raw),
  'config-set': (args, cwd, raw) => config.cmdConfigSet(cwd, args[1], args[2], raw),
  'config-set-model-profile': (args, cwd, raw) => config.cmdConfigSetModelProfile(cwd, args[1], raw),
  'config-get': (args, cwd, raw) => config.cmdConfigGet(cwd, args[1], raw),
  'config-new-project': (args, cwd, raw) => config.cmdConfigNewProject(cwd, args[1], raw),
  'agent-skills': (args, cwd, raw) => init.cmdAgentSkills(cwd, args[1], raw),
  'skill-query': handleSkillQuery,
  'audit-skills': (args, cwd, raw) => init.cmdAuditSkills(cwd, raw),
  'check-skill-versions': (args, cwd, raw) => init.cmdCheckSkillVersions(cwd, raw),
  'validate-skill': (args, cwd, raw) => init.cmdValidateSkill(cwd, args[1], raw),
  'history-digest': (args, cwd, raw) => commands.cmdHistoryDigest(cwd, raw),
  'do-registry': (args, cwd, raw) => commands.cmdDoRegistry(raw),
  'history': subcommands(HISTORY_SUBCOMMANDS, unknownSubcommand('Unknown history subcommand. Available: list, stats, prune')),
  'phases': subcommands({ 'list': handlePhasesList }, unknownSubcommand('Unknown phases subcommand. Available: list')),
  'roadmap': subcommands(ROADMAP_SUBCOMMANDS, unknownSubcommand('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress')),
  'requirements': subcommands(
    { 'mark-complete': (args, cwd, raw) => milestone.cmdRequirementsMarkComplete(cwd, args.slice(2), raw) },
    unknownSubcommand('Unknown requirements subcommand. Available: mark-complete'),
  ),
  'phase': subcommands(PHASE_SUBCOMMANDS, unknownSubcommand('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete')),
  'milestone': subcommands({ 'complete': handleMilestoneComplete }, unknownSubcommand('Unknown milestone subcommand. Available: complete')),
  'validate': subcommands(VALIDATE_SUBCOMMANDS, unknownSubcommand('Unknown validate subcommand. Available: consistency, health, agents')),
  'progress': (args, cwd, raw) => commands.cmdProgressRender(cwd, args[1] || 'json', raw),
  'audit-uat': (args, cwd, raw) => require('./lib/uat.cjs').cmdAuditUat(cwd, raw),
  'uat': subcommands(UAT_SUBCOMMANDS, unknownSubcommand('Unknown uat subcommand. Available: render-checkpoint, run-automated')),
  'stats': (args, cwd, raw) => commands.cmdStats(cwd, args[1] || 'json', raw),
  'todo': subcommands(TODO_SUBCOMMANDS, unknownSubcommand('Unknown todo subcommand. Available: complete, match-phase')),
  'scaffold': handleScaffold,
  'init': subcommands(INIT_WORKFLOWS, args => error(`Unknown init workflow: ${args[1]}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress, manager, new-workspace, list-workspaces, remove-workspace`)),
  'phase-plan-index': (args, cwd, raw) => phase.cmdPhasePlanIndex(cwd, args[1], raw),
  'state-snapshot': (args, cwd, raw) => state.cmdStateSnapshot(cwd, raw),
  'summary-extract': handleSummaryExtract,
  'websearch': handleWebsearch,
  'scan-sessions': handleScanSessions,
  'extract-messages': handleExtractMessages,
  'profile-sample': handleProfileSample,
  'write-profile': handleWriteProfile,
  'profile-questionnaire': (args, cwd, raw) => profileOutput.cmdProfileQuestionnaire({ answers: flagValue(args, 'answers') }, raw),
  'generate-dev-preferences': handleGenerateDevPreferences,
  'generate-claude-profile': handleGenerateClaudeProfile,
  'generate-claude-md': handleGenerateClaudeMd,
  'workstream': subcommands(WORKSTREAM_SUBCOMMANDS, unknownSubcommand('Unknown workstream subcommand. Available: create, list, status, complete, set, get, progress')),
};

async function runCommand(command, args, cwd, raw) {
  const handler = lookup(COMMANDS, command);
  if (!handler) return error(`Unknown command: ${command}`);
  await handler(args, cwd, raw);
}

main();
