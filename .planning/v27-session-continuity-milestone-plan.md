# v2.7 Session Continuity & Operational Smoothness — Implementation Reference

**Generated:** 2026-04-17
**For:** Claude Code execution reference
**Project:** `~/projects/Pete-Gets-Shit-Done`
**Prerequisite:** v2.6 Developer Experience must ship first

---

## Why This Milestone Exists

Three friction points observed during v2.5 execution (2026-04-17):

1. **Context resets lose work.** Every `/clear` wipes Claude Code's memory. During v2.5, Plan 02 coverage fixes were lost and re-executed. The PR merge status had to be re-explained. Completed plans were re-presented for execution. Each reset costs 5-10 minutes of re-orientation.

2. **Verification is manual.** 9 UAT tests in Phase 47 required Pete to run terminal commands, paste output, and manually confirm pass/fail. Half found real issues that automated checks would have caught instantly. The human is acting as the test harness.

3. **Session start is slow.** Every session begins with 3-5 minutes reading STATE.md, checking git status, figuring out what's in progress. There's no single-screen summary of "where am I and what do I do next."

---

## Architecture Overview

Three new systems, layered:

```
┌─────────────────────────────────────────────┐
│  /gsd:daily (Phase 50)                      │
│  Reads checkpoint + state → dashboard       │
├─────────────────────────────────────────────┤
│  Automated UAT (Phase 51)                   │
│  Parses must_haves → generates assertions   │
├─────────────────────────────────────────────┤
│  Checkpoint Engine (Phase 49)               │
│  Writes .planning/CHECKPOINT.json           │
│  Consumed by /prime, resume-work, daily     │
└─────────────────────────────────────────────┘
```

Execution order matters: checkpoint is the foundation, daily consumes it, UAT is independent but benefits from both.

---

## Phase 49: Checkpoint Engine

### Problem

When Claude Code hits ~80% context and needs `/clear`, all session knowledge is lost. The current handoff mechanism (STATE.md, HANDOFF.json, .continue-here.md) is inconsistent — sometimes written, sometimes not, and `resume-work` doesn't reliably skip completed work.

### Solution

A deterministic checkpoint file (`.planning/CHECKPOINT.json`) written automatically before every context reset, consumed automatically by `/prime` and `/gsd:resume-work`.

### Files to Create

| File | Type | Purpose |
|------|------|---------|
| `get-shit-done/bin/lib/checkpoint.cjs` | New module | `writeCheckpoint(planningDir)` and `readCheckpoint(planningDir)` functions |
| `commands/gsd/checkpoint.md` | New command | `/gsd:checkpoint` slash command definition |
| `get-shit-done/workflows/checkpoint.md` | New workflow | Orchestration: gather state → call writeCheckpoint → confirm |
| `tests/checkpoint.test.cjs` | New tests | Full coverage of checkpoint module |

### Files to Modify

| File | Change |
|------|--------|
| `get-shit-done/workflows/resume-project.md` | Read CHECKPOINT.json as FIRST step before STATE.md. If checkpoint says plans are completed, skip them. |
| `get-shit-done/workflows/new-project.md` | `/prime` initialization reads CHECKPOINT.json when present, includes checkpoint data in initialization summary |

### CHECKPOINT.json Schema

```json
{
  "version": 1,
  "timestamp": "ISO-8601",
  "branch": "string — current git branch",
  "commit": "string — HEAD commit SHA (short)",
  "milestone": "string — e.g. v2.7",
  "phase": "number — current phase number",
  "phase_name": "string — phase slug",
  "plans": {
    "total": "number",
    "completed": ["array of plan IDs, e.g. '49-01', '49-02'"],
    "active": "string or null — currently executing plan ID",
    "pending": ["array of plan IDs not yet started"]
  },
  "tests": {
    "pass": "number",
    "fail": "number"
  },
  "files_modified": ["array of files changed this session"],
  "next_action": "string — exact command to run next, e.g. '/gsd:execute-phase 49 --interactive'",
  "context_note": "string — one sentence describing what just happened and what comes next"
}
```

### Implementation Details — checkpoint.cjs

```javascript
// get-shit-done/bin/lib/checkpoint.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHECKPOINT_FILE = 'CHECKPOINT.json';
const CHECKPOINT_VERSION = 1;

function writeCheckpoint(planningDir, overrides = {}) {
  // 1. Read git state
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

  // 2. Read STATE.md for milestone/phase info
  const statePath = path.join(planningDir, 'STATE.md');
  const stateData = parseStateFrontmatter(statePath);

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
    tests: { pass: 0, fail: 0 }, // populated by caller or from last npm test
    files_modified: [],
    next_action: '',
    context_note: '',
    ...overrides
  };

  // 5. Write
  const outPath = path.join(planningDir, CHECKPOINT_FILE);
  fs.writeFileSync(outPath, JSON.stringify(checkpoint, null, 2));
  return checkpoint;
}

function readCheckpoint(planningDir) {
  const filePath = path.join(planningDir, CHECKPOINT_FILE);
  if (!fs.existsSync(filePath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.version !== CHECKPOINT_VERSION) return null;

    // Calculate staleness
    const age = Date.now() - new Date(data.timestamp).getTime();
    data._stale = age > 24 * 60 * 60 * 1000; // >24h
    data._ageHours = Math.round(age / (60 * 60 * 1000));

    return data;
  } catch {
    return null;
  }
}

function scanPlanStatus(planningDir, phaseNum) {
  // Look for SUMMARY.md files — a plan with a SUMMARY is completed
  // Look for PLAN.md files without SUMMARY — pending or active
  const phaseDir = findPhaseDir(planningDir, phaseNum);
  if (!phaseDir) return { total: 0, completed: [], active: null, pending: [] };

  const files = fs.readdirSync(phaseDir);
  const plans = files.filter(f => f.match(/-PLAN\.md$/)).map(f => f.replace('-PLAN.md', ''));
  const summaries = files.filter(f => f.match(/-SUMMARY\.md$/)).map(f => f.replace('-SUMMARY.md', ''));

  const completed = plans.filter(p => summaries.includes(p));
  const incomplete = plans.filter(p => !summaries.includes(p));

  return {
    total: plans.length,
    completed,
    active: incomplete[0] || null,
    pending: incomplete.slice(1)
  };
}

module.exports = { writeCheckpoint, readCheckpoint, scanPlanStatus, CHECKPOINT_FILE };
```

### How resume-work.md Should Change

Current behavior: reads STATE.md and .continue-here.md, presents phase status, asks what to do.

New behavior (add to top of workflow, before existing logic):

```markdown
## Step 0 — Check for checkpoint

Read `.planning/CHECKPOINT.json` if it exists.

If checkpoint exists and is not stale (< 24 hours):
- Report: "Checkpoint found from {timestamp}. Phase {phase}, Plan {active} in progress. {completed.length} plans already completed."
- Set completed_plans = checkpoint.plans.completed
- When executing phase, SKIP any plan whose ID is in completed_plans
- Use checkpoint.next_action as the recommended command

If checkpoint exists but is stale (> 24 hours):
- Report: "⚠ Stale checkpoint ({_ageHours}h old). Reading STATE.md instead. Run /gsd:checkpoint to refresh."
- Fall through to existing STATE.md logic

If no checkpoint:
- Fall through to existing STATE.md logic (current behavior, unchanged)
```

### Tests — checkpoint.test.cjs

Minimum test cases:

1. `writeCheckpoint` produces valid JSON with all required fields
2. `readCheckpoint` returns null for missing file
3. `readCheckpoint` returns null for corrupt JSON
4. `readCheckpoint` returns null for wrong version
5. `readCheckpoint` marks >24h checkpoint as stale
6. `readCheckpoint` marks <24h checkpoint as not stale
7. Round-trip: write then read produces identical data
8. `scanPlanStatus` correctly identifies completed plans (SUMMARY exists)
9. `scanPlanStatus` correctly identifies pending plans (no SUMMARY)
10. `scanPlanStatus` identifies active plan as first incomplete
11. `scanPlanStatus` handles empty phase directory
12. `scanPlanStatus` handles missing phase directory
13. `writeCheckpoint` with overrides merges correctly
14. `writeCheckpoint` creates file in correct location
15. Integration: checkpoint consumed by resume-work skip logic

### Acceptance Criteria

- [ ] **CP-01**: `writeCheckpoint()` produces valid JSON consumable by `readCheckpoint()`
- [ ] **CP-02**: `/gsd:resume-work` reads CHECKPOINT.json and skips completed plans
- [ ] **CP-03**: `/prime` surfaces checkpoint data in initialization summary
- [ ] **CP-04**: Stale checkpoint (>24h) generates warning but still loads
- [ ] **CP-05**: Missing checkpoint is graceful no-op (no error, no stack trace)
- [ ] **CP-06**: 15+ tests passing with >80% branch coverage
- [ ] **CP-07**: Full test suite still green after integration

---

## Phase 50: `/gsd:daily` — Morning Dashboard

### Problem

Every session starts with orientation: read STATE.md, check git, run `/gsd:progress`, figure out next step. This takes 3-5 minutes of cognitive overhead before any real work begins.

### Solution

One command, one screen, every morning. Shows project state and the exact next command to run.

### Files to Create

| File | Type | Purpose |
|------|------|---------|
| `get-shit-done/bin/lib/daily.cjs` | New module | `generateDashboard(planningDir)` — aggregates state from multiple sources |
| `commands/gsd/daily.md` | New command | `/gsd:daily` slash command |
| `get-shit-done/workflows/daily.md` | New workflow | Calls generateDashboard, formats output |
| `tests/daily.test.cjs` | New tests | Dashboard generation across all state variants |

### Implementation Details — daily.cjs

```javascript
// get-shit-done/bin/lib/daily.cjs
const { readCheckpoint } = require('./checkpoint.cjs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateDashboard(planningDir) {
  const dashboard = {
    project: path.basename(process.cwd()),
    milestone: '',
    phase: null,
    phase_name: '',
    plan: null,
    branch: '',
    ahead: 0,
    dirty: false,
    dirty_count: 0,
    tests: { pass: 0, fail: 0 },
    coverage: '',
    last_session: '',
    next_action: '',
    warnings: [],
    state: 'unknown' // active_phase | between_milestones | maintenance | no_gsd
  };

  // 1. Try checkpoint first (fastest, most current)
  const checkpoint = readCheckpoint(planningDir);
  if (checkpoint) {
    dashboard.milestone = checkpoint.milestone;
    dashboard.phase = checkpoint.phase;
    dashboard.phase_name = checkpoint.phase_name;
    dashboard.plan = checkpoint.plans;
    dashboard.tests = checkpoint.tests;
    dashboard.next_action = checkpoint.next_action;
    dashboard.last_session = checkpoint.timestamp;
    dashboard.state = 'active_phase';

    if (checkpoint._stale) {
      dashboard.warnings.push(`Checkpoint is ${checkpoint._ageHours}h old — run /gsd:checkpoint to refresh`);
    }
  }

  // 2. Fall back to STATE.md
  if (!checkpoint) {
    const stateData = parseStateMd(planningDir);
    if (stateData) {
      dashboard.milestone = stateData.milestone;
      dashboard.phase = stateData.phase;
      dashboard.state = stateData.status === 'completed' ? 'maintenance' : 'active_phase';
      // ... populate from state
    }
  }

  // 3. Git state (always fresh)
  try {
    dashboard.branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const status = execSync('git status --short', { encoding: 'utf8' }).trim();
    dashboard.dirty = status.length > 0;
    dashboard.dirty_count = status ? status.split('\n').length : 0;
    const ahead = execSync('git rev-list --count @{u}..HEAD 2>/dev/null || echo 0', { encoding: 'utf8' }).trim();
    dashboard.ahead = parseInt(ahead, 10);
  } catch { /* not a git repo or no upstream */ }

  // 4. Warnings
  if (dashboard.dirty) {
    dashboard.warnings.push(`${dashboard.dirty_count} uncommitted files — commit or stash before starting`);
  }

  // 5. Determine next action if not set by checkpoint
  if (!dashboard.next_action) {
    dashboard.next_action = deriveNextAction(dashboard);
  }

  return dashboard;
}

function deriveNextAction(dashboard) {
  if (dashboard.state === 'maintenance') return 'Project in maintenance mode. /gsd:review-backlog or /gsd:new-milestone';
  if (dashboard.state === 'between_milestones') return '/gsd:new-milestone to start next version';
  if (!dashboard.phase) return '/gsd:discuss-phase to begin';
  if (dashboard.plan && dashboard.plan.active) return `/gsd:execute-phase ${dashboard.phase} --interactive`;
  if (dashboard.plan && dashboard.plan.pending.length > 0) return `/gsd:execute-phase ${dashboard.phase}`;
  return `/gsd:verify-work ${dashboard.phase}`;
}

function formatDashboard(dashboard) {
  const lines = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(` GSD Daily — ${dashboard.project}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dashboard.state === 'maintenance') {
    lines.push(' Status:  Maintenance mode');
    lines.push(` Milestone: ${dashboard.milestone} (shipped)`);
  } else if (dashboard.state === 'active_phase') {
    lines.push(` Milestone: ${dashboard.milestone}`);
    if (dashboard.phase) {
      lines.push(` Phase:     ${dashboard.phase} — ${dashboard.phase_name}`);
    }
    if (dashboard.plan) {
      const done = dashboard.plan.completed ? dashboard.plan.completed.length : 0;
      lines.push(` Plans:     ${done}/${dashboard.plan.total} complete`);
    }
    lines.push(` Branch:    ${dashboard.branch} (${dashboard.ahead} ahead${dashboard.dirty ? ', DIRTY' : ', clean'})`);
    if (dashboard.tests.pass > 0) {
      lines.push(` Tests:     ${dashboard.tests.pass} pass / ${dashboard.tests.fail} fail`);
    }
  } else {
    lines.push(' Status:  Between milestones');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(` Next: ${dashboard.next_action}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dashboard.warnings.length > 0) {
    lines.push('');
    for (const w of dashboard.warnings) {
      lines.push(` ⚠ ${w}`);
    }
  }

  return lines.join('\n');
}

module.exports = { generateDashboard, formatDashboard, deriveNextAction };
```

### Dashboard Output by State

**Active phase:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD Daily — ctg-ai-platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Milestone: v2.0 Executive Email Agents
 Phase:     3 — email-template-engine
 Plans:     1/3 complete
 Branch:    feat/phase-3 (3 ahead, clean)
 Tests:     847 pass / 0 fail
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Next: /gsd:execute-phase 3 --interactive
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Maintenance mode:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD Daily — Pete-Gets-Shit-Done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Status:  Maintenance mode
 Milestone: v2.5 (shipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Next: Project in maintenance mode. /gsd:review-backlog or /gsd:new-milestone
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Dirty tree warning:**
```
 ⚠ 3 uncommitted files — commit or stash before starting
```

### Tests — daily.test.cjs

Minimum test cases:

1. Dashboard with active phase and checkpoint
2. Dashboard with active phase, no checkpoint (STATE.md fallback)
3. Dashboard in maintenance mode
4. Dashboard between milestones
5. Dashboard with dirty git tree shows warning
6. Dashboard with stale checkpoint shows warning
7. Dashboard with no GSD state (empty project)
8. `deriveNextAction` for each state
9. `formatDashboard` output contains all required fields
10. Dashboard handles missing STATE.md gracefully

### Acceptance Criteria

- [ ] **DAILY-01**: `/gsd:daily` produces dashboard in under 2 seconds
- [ ] **DAILY-02**: Reads CHECKPOINT.json first, falls back to STATE.md
- [ ] **DAILY-03**: Shows correct next-action for every GSD state
- [ ] **DAILY-04**: Handles missing files gracefully (no stack traces)
- [ ] **DAILY-05**: Dirty tree and stale checkpoint produce warnings
- [ ] **DAILY-06**: 10+ tests passing with >80% branch coverage

---

## Phase 51: Automated UAT Runner

### Problem

GSD's verify-work workflow asks "does this look right?" — conversational UAT that requires the human to run terminal commands and paste output. During v2.5, 9 manual checks found 5 real issues. The human is the test harness.

### Solution

Parse `must_haves` from plan frontmatter, translate them into executable shell assertions via a pattern registry, run them automatically, and present a pass/fail summary. Only fall through to conversational UAT for must_haves that can't be automated.

### Files to Create

| File | Type | Purpose |
|------|------|---------|
| `get-shit-done/bin/lib/uat-runner.cjs` | New module | `runAutomatedUAT(planDir)` — orchestrates pattern matching → command generation → execution → reporting |
| `get-shit-done/bin/lib/uat-patterns.cjs` | New module | Pattern registry: maps must_have text → verification commands |
| `tests/uat-runner.test.cjs` | New tests | Runner integration tests |
| `tests/uat-patterns.test.cjs` | New tests | Pattern matching unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `get-shit-done/workflows/verify-work.md` | Before conversational UAT, call `runAutomatedUAT()`. Present auto results. Only ask user about items marked `manual`. |

### Pattern Registry — uat-patterns.cjs

Each pattern has: a regex that matches must_have text, a function that extracts parameters, and a function that generates a shell command + expected result.

```javascript
// get-shit-done/bin/lib/uat-patterns.cjs

const patterns = [
  {
    name: 'module_export_count',
    // Matches: "model-profiles.cjs contains 17 entries"
    // Matches: "CODEX_AGENT_SANDBOX has 17 agents"
    regex: /(?:^|\s)(\S+\.cjs)\s+(?:contains?|has)\s+(\d+)\s+/i,
    generate: (match) => ({
      command: `node -p "Object.keys(require('./${findModulePath(match[1])}').${guessExport(match[1])}).length"`,
      expected: match[2],
      compare: 'equals'
    })
  },
  {
    name: 'file_not_exists',
    // Matches: "X does not exist", "X should not exist"
    regex: /(\S+)\s+(?:does not|should not|must not)\s+exist/i,
    generate: (match) => ({
      command: `test ! -f "${match[1]}" && echo "absent" || echo "present"`,
      expected: 'absent',
      compare: 'equals'
    })
  },
  {
    name: 'file_exists',
    // Matches: "X exists", "X should exist", "X must exist"
    regex: /(\S+)\s+(?:exists|should exist|must exist)/i,
    generate: (match) => ({
      command: `test -f "${match[1]}" && echo "present" || echo "absent"`,
      expected: 'present',
      compare: 'equals'
    })
  },
  {
    name: 'files_identical',
    // Matches: "X and Y are byte-identical", "X matches Y"
    regex: /(\S+)\s+and\s+(\S+)\s+are\s+(?:byte-)?identical/i,
    generate: (match) => ({
      command: `diff "${match[1]}" "${match[2]}" > /dev/null 2>&1 && echo "identical" || echo "different"`,
      expected: 'identical',
      compare: 'equals'
    })
  },
  {
    name: 'test_suite_green',
    // Matches: "N tests pass", "test suite passes", "all tests green"
    regex: /(\d+)\s+tests?\s+pass|test suite passes|all tests green/i,
    generate: (match) => ({
      command: `npm test 2>&1 | grep "# fail" | head -1`,
      expected: '# fail 0',
      compare: 'contains'
    })
  },
  {
    name: 'coverage_threshold',
    // Matches: "coverage >= 90%", "coverage above 80%"
    regex: /coverage\s*(?:>=?|above|at least)\s*(\d+)%/i,
    generate: (match) => ({
      command: `npm run test:coverage 2>&1 | grep "All files" | awk '{print $4}'`,
      expected: match[1],
      compare: 'gte'
    })
  },
  {
    name: 'file_contains',
    // Matches: "X contains Y", "X includes Y"
    regex: /(\S+)\s+(?:contains?|includes?)\s+"([^"]+)"/i,
    generate: (match) => ({
      command: `grep -c "${match[2]}" "${match[1]}"`,
      expected: '0',
      compare: 'gt'
    })
  },
  {
    name: 'file_not_contains',
    // Matches: "X does not contain Y"
    regex: /(\S+)\s+does not contain\s+"([^"]+)"/i,
    generate: (match) => ({
      command: `grep -c "${match[2]}" "${match[1]}" 2>/dev/null || echo "0"`,
      expected: '0',
      compare: 'equals'
    })
  }
];

function matchPattern(mustHave) {
  for (const pattern of patterns) {
    const match = mustHave.match(pattern.regex);
    if (match) {
      return {
        pattern: pattern.name,
        assertion: pattern.generate(match),
        original: mustHave
      };
    }
  }
  return { pattern: null, assertion: null, original: mustHave };
}

module.exports = { patterns, matchPattern };
```

### Runner — uat-runner.cjs

```javascript
// get-shit-done/bin/lib/uat-runner.cjs
const { execSync } = require('child_process');
const { matchPattern } = require('./uat-patterns.cjs');
const fs = require('fs');
const path = require('path');
const yaml = require('./yaml-parse.cjs'); // existing GSD yaml parser

function runAutomatedUAT(planPaths) {
  const results = { passed: [], failed: [], manual: [], total: 0 };

  for (const planPath of planPaths) {
    const frontmatter = parsePlanFrontmatter(planPath);
    if (!frontmatter.must_haves) continue;

    for (const mustHave of frontmatter.must_haves) {
      results.total++;
      const matched = matchPattern(mustHave);

      if (!matched.pattern) {
        results.manual.push({ mustHave, reason: 'No automated pattern match' });
        continue;
      }

      try {
        const actual = execSync(matched.assertion.command, {
          encoding: 'utf8',
          timeout: 30000 // 30s max per check
        }).trim();

        const pass = compareResult(actual, matched.assertion.expected, matched.assertion.compare);

        if (pass) {
          results.passed.push({ mustHave, pattern: matched.pattern, actual });
        } else {
          results.failed.push({
            mustHave,
            pattern: matched.pattern,
            expected: matched.assertion.expected,
            actual,
            command: matched.assertion.command
          });
        }
      } catch (err) {
        results.failed.push({
          mustHave,
          pattern: matched.pattern,
          expected: matched.assertion.expected,
          actual: `ERROR: ${err.message}`,
          command: matched.assertion.command
        });
      }
    }
  }

  return results;
}

function compareResult(actual, expected, mode) {
  switch (mode) {
    case 'equals': return actual === expected;
    case 'contains': return actual.includes(expected);
    case 'gt': return parseFloat(actual) > parseFloat(expected);
    case 'gte': return parseFloat(actual) >= parseFloat(expected);
    default: return actual === expected;
  }
}

function formatUATResults(results) {
  const lines = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(' Automated UAT Results');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const p of results.passed) {
    lines.push(` ✓ ${p.mustHave}`);
  }
  for (const f of results.failed) {
    lines.push(` ✗ ${f.mustHave}`);
    lines.push(`   Expected: ${f.expected} | Got: ${f.actual}`);
    lines.push(`   Command: ${f.command}`);
  }
  for (const m of results.manual) {
    lines.push(` ? ${m.mustHave} — manual verification needed`);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(` ${results.passed.length} pass / ${results.failed.length} fail / ${results.manual.length} manual`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}

module.exports = { runAutomatedUAT, formatUATResults, compareResult };
```

### How verify-work.md Should Change

Add to the beginning of the verify workflow, before the conversational UAT loop:

```markdown
## Step 0 — Automated verification

Before presenting tests to the user, run automated checks:

1. Find all PLAN.md files for this phase
2. Call `runAutomatedUAT(planPaths)` from `lib/uat-runner.cjs`
3. Present the formatted results table
4. If ALL must_haves passed automatically: "All automated checks passed. Phase verified."
5. If some failed: Present failures with expected/actual/command. Fix before continuing.
6. If some are manual: Present only the manual items for conversational verification.
   Skip any must_have that was already verified automatically.
```

### Tests

**uat-patterns.test.cjs** (minimum 12 tests):

1. `module_export_count` matches "X.cjs contains N entries"
2. `file_not_exists` matches "X does not exist"
3. `file_exists` matches "X exists"
4. `files_identical` matches "X and Y are byte-identical"
5. `test_suite_green` matches "N tests pass"
6. `coverage_threshold` matches "coverage >= 90%"
7. `file_contains` matches 'X contains "Y"'
8. `file_not_contains` matches 'X does not contain "Y"'
9. Unrecognized must_have returns null pattern
10. Case insensitivity works
11. Multiple patterns don't conflict (first match wins)
12. Generated commands are valid shell syntax

**uat-runner.test.cjs** (minimum 10 tests):

1. `runAutomatedUAT` with all-passing must_haves
2. `runAutomatedUAT` with one failing must_have
3. `runAutomatedUAT` with unrecognized must_have → manual
4. `runAutomatedUAT` with command timeout → failed
5. `runAutomatedUAT` with empty must_haves array
6. `compareResult` equals mode
7. `compareResult` contains mode
8. `compareResult` gte mode
9. `formatUATResults` includes all sections
10. `formatUATResults` shows expected/actual for failures

### Acceptance Criteria

- [ ] **UAT-01**: Parses must_haves from plan YAML frontmatter
- [ ] **UAT-02**: Matches at least 8 pattern types from registry
- [ ] **UAT-03**: Executes commands in read-only mode (no writes)
- [ ] **UAT-04**: Returns structured `{ passed, failed, manual }` results
- [ ] **UAT-05**: Failed checks include expected, actual, and command
- [ ] **UAT-06**: Unrecognized must_haves fall through to manual UAT
- [ ] **UAT-07**: verify-work.md presents auto results before conversational UAT
- [ ] **UAT-08**: 20+ tests across patterns and runner
- [ ] **UAT-09**: Command timeout (30s) prevents hanging
- [ ] **UAT-10**: Full test suite still green after integration

---

## Milestone-Level Requirements Summary

| ID | Requirement | Phase |
|----|-------------|-------|
| CP-01 | writeCheckpoint produces valid JSON | 49 |
| CP-02 | resume-work skips completed plans via checkpoint | 49 |
| CP-03 | /prime surfaces checkpoint in init summary | 49 |
| CP-04 | Stale checkpoint warns but loads | 49 |
| CP-05 | Missing checkpoint is graceful no-op | 49 |
| CP-06 | 15+ checkpoint tests, >80% branch coverage | 49 |
| CP-07 | Full test suite green after checkpoint integration | 49 |
| DAILY-01 | /gsd:daily under 2 seconds | 50 |
| DAILY-02 | Reads checkpoint first, STATE.md fallback | 50 |
| DAILY-03 | Correct next-action for every GSD state | 50 |
| DAILY-04 | Handles missing files gracefully | 50 |
| DAILY-05 | Dirty tree and stale checkpoint produce warnings | 50 |
| DAILY-06 | 10+ daily tests, >80% branch coverage | 50 |
| UAT-01 | Parses must_haves from plan frontmatter | 51 |
| UAT-02 | Matches 8+ pattern types | 51 |
| UAT-03 | Read-only execution (no writes) | 51 |
| UAT-04 | Structured pass/fail/manual results | 51 |
| UAT-05 | Failed checks show expected/actual/command | 51 |
| UAT-06 | Unrecognized must_haves fall to manual UAT | 51 |
| UAT-07 | verify-work auto-checks before conversational | 51 |
| UAT-08 | 20+ UAT tests | 51 |
| UAT-09 | 30s command timeout | 51 |
| UAT-10 | Full test suite green after integration | 51 |

---

## Prompt for Claude Code

When ready to execute (after v2.6 ships), paste this in Claude Code from `~/projects/Pete-Gets-Shit-Done`:

```
/gsd:new-milestone

Name: v2.7 Session Continuity
Description: Three-phase operational smoothness layer. Phase 49: Checkpoint Engine — new lib/checkpoint.cjs writes .planning/CHECKPOINT.json before every context reset, resume-work and /prime consume it to skip completed work. Phase 50: /gsd:daily — one-command morning dashboard showing milestone, phase, plan, branch, tests, next action. Phase 51: Automated UAT Runner — new lib/uat-runner.cjs with pattern registry parses plan must_haves into shell assertions, executes them, presents pass/fail table before falling through to conversational UAT. Reference doc at .planning/v27-session-continuity-milestone-plan.md has full implementation details including code sketches, schemas, test cases, and acceptance criteria. Read it before planning any phase.
```

Before running this, copy the reference doc into the repo:

```bash
cp ~/path/to/v27-session-continuity-milestone-plan.md ~/projects/Pete-Gets-Shit-Done/.planning/
```
