# GSD Foundation Health Audit — 2026-04-16

**Scope:** Structural integrity audit across 8 dimensions. Read-only — no fixes applied.
**Branch:** `main` @ 816fd5b (clean)
**Methodology:** 8 parallel audit agents, each dimension independently verified.

---

## Overall Health Score: 1/8 PASS | 7/8 WARN | 0/8 FAIL

| # | Dimension | Verdict | Key Finding |
|---|-----------|---------|-------------|
| D1 | Command-Workflow Linkage | WARN | 11 commands lack workflow backing; 5 orphaned workflows |
| D2 | Agent Integrity | PASS | All 54 agents across 3 locations have valid frontmatter |
| D3 | Hook Chain | WARN | All hooks resolve; project-level lesson-capture-gate.cjs lacks +x (cosmetic for Node) |
| D4 | Test Suite | WARN | 2474/0 pass/fail; 9 modules below 80% branch coverage |
| D5 | Symlink Plugin Chain | WARN | claude-code-factory orphaned cache, detached from live source |
| D6 | Security Red Flags | WARN | GSD_VERSION placeholder dead; injection patterns diverged between hook and lib |
| D7 | Stale References | WARN | One hardcoded project-name path in crew.md; otherwise clean |
| D8 | Plugin Completeness | WARN | README undercounts agents (16 vs 18) and commands (61 vs 63) |

**Functional health:** All 8 dimensions are operational — no hard runtime failures. But only D2 is fully clean. The remaining 7 carry structural drift, documentation staleness, or design gaps that compound over time.

---

## D1: Command-Workflow Linkage

**Command files:** 64
**Workflow files:** 56

### Broken Forward Links (command exists, workflow missing)

11 commands have no workflow file and no documented inline exemption:

| Command | Notes |
|---------|-------|
| add-backlog | No workflow, no inline notation |
| debug | No workflow, no inline notation |
| finalize | Delegates inline to other commands |
| join-discord | No workflow, no inline notation |
| portfolio | No workflow, no inline notation |
| prime-patterns | No workflow, no inline notation |
| reapply-patches | No workflow, no inline notation |
| review-backlog | No workflow, no inline notation |
| set-profile | No workflow, no inline notation |
| thread | No workflow, no inline notation |
| workstreams | No workflow, no inline notation |

Two additional commands (audit-agents, audit-deps) are intentionally inline — each contains a self-documenting convention note.

### Orphaned Workflows (no command references them)

5 workflow files exist with zero references from any command:
- diagnose-issues.md
- discovery-phase.md
- node-repair.md
- transition.md
- verify-phase.md

### Dangling Path References
None. All cross-references between command and workflow files resolve on disk.

**Verdict:** WARN
**Impact:** No runtime failures. The 11 unlinked commands work (they are self-contained skill files), but the command/workflow split is inconsistent — some commands are pure skill files, some delegate to workflows, and there is no convention documented for which approach to use.

---

## D2: Agent Integrity

**Project agents:** 3 files checked (.claude/agents/)
**Built-in agents:** 18 files checked (agents/)
**User agents:** 33 files checked (~/.claude/agents/)
**Total active agents audited:** 54

### Findings
- All 54 files have valid YAML frontmatter with required name and description fields
- Model distribution: sonnet (28), haiku (16), opus (9), inherit (1) — all valid values
- 7 archived agents in agents/_archived/ excluded (superseded by consolidated agents)

### Observation (non-blocking)
GSD built-in agents and user-level agents have duplicate names (e.g., gsd-advisor-researcher, gsd-debugger). Per Claude Code precedence rules, project agents override user agents. The user-level copies are redundant when the project is active.

**Verdict:** PASS

---

## D3: Hook Chain

**Settings files checked:** 3 (global settings.json, project settings.json, project settings.local.json)
**Total hook entries:** 18

### Hook Count by Event

| Event | Count | Source |
|-------|-------|--------|
| SessionStart | 2 | global |
| PreToolUse | 8 | global |
| PostToolUse | 3 | global |
| Stop | 3 | global (2) + project (1) |
| SubagentStop | 1 | project |
| PreCompact | 1 | global |

### Broken References
- **Stop (project):** .claude/hooks/lesson-capture-gate.cjs — file exists but lacks executable bit (-rw-r--r--). Harmless for Node.js (the hook command invokes node directly), but inconsistent with the global copy at ~/.claude/hooks/ which has +x.

### Inline Commands
10 hooks use inline shell commands (no file path to verify).

**Verdict:** WARN
**Impact:** Cosmetic. All hooks fire correctly. The +x discrepancy is a drift item per the CLAUDE.md hook-drift rule.

---

## D4: Test Suite

**Command:** npm test
**Suites:** 472
**Passed:** 2474
**Failed:** 0
**Duration:** ~7.6s

### Coverage

| Metric | Value |
|--------|-------|
| Statements | 90.49% |
| Branches | 82.28% |
| Functions | 97.2% |
| Lines | 90.49% |

### Modules Below 80% Branch Coverage

| Module | Stmts | Branch | Severity |
|--------|-------|--------|----------|
| workstream.cjs | 82.28% | 50.68% | Critical |
| build-hooks.js | 82.14% | 50.00% | Critical |
| profile-output.cjs | 90.54% | 61.67% | High |
| phase.cjs | 90.41% | 69.44% | Medium |
| profile-pipeline.cjs | 83.67% | 70.13% | Medium |
| commands.cjs | 93.40% | 73.42% | Medium |
| template.cjs | 99.09% | 74.28% | Low |
| uat.cjs | 92.19% | 78.20% | Low |
| verify.cjs | 93.35% | 78.31% | Low |

### Security Modules
All at or above 95%. security.cjs at 100%.

**Verdict:** WARN
**Impact:** All tests pass. Statement/line coverage meets the 90% threshold. Branch coverage masks 9 modules with gaps, two critically low (workstream.cjs and build-hooks.js at ~50% branch). The overall branch average (82.28%) is technically above 80% but only because high-coverage modules pull it up.

---

## D5: Symlink Plugin Chain

### Enabled Plugins (from settings.json)
11 plugins enabled across 3 marketplace sources.

### Chain Verification

| Plugin | Source | Symlink Resolves? | plugin.json? | skills/ | agents/ |
|--------|--------|-------------------|--------------|---------|---------|
| claude-mcp-ecosystem | local-marketplace | YES | YES | 7 skills | N/A |
| claude-code-factory | local-marketplace | YES | YES | 1 skill | 1 agent |
| 9 others | official/external | N/A (cache) | YES | YES | varies |

### Critical Finding: claude-code-factory Orphaned Cache

The claude-code-factory plugin has a structural break:
1. The **orphaned cache** at ~/.claude/plugins/cache/local-plugin-marketplace/claude-code-factory/1.0.0/ was marked .orphaned_at: 2026-04-14
2. The cache contains **38 skills and 10 agents** (the full factory payload from March 19)
3. The **live source** at plugins/claude-code-factory/ has been stripped to **1 skill and 1 agent**
4. **Root cause:** local-plugin-marketplace/marketplace.json only registers claude-mcp-ecosystem — claude-code-factory is absent from the marketplace registry. Claude Code cannot resolve or refresh it.
5. Claude Code is loading the frozen orphaned cache, not the current live source.

### Minor Finding: claude-mcp-ecosystem Cache Stale
Cache was snapshotted March 22; live source plugin.json last modified April 5. Skills match (7/7) but metadata differs.

**Verdict:** WARN
**Impact:** Functionally degraded. The factory plugin works only because of a frozen cache. Any cache invalidation (version bump, reinstall, new machine) would reduce it from 38 skills to 1. The marketplace registration gap is the root cause.

---

## D6: Security Red Flags

### 6a. Hook Version Tracking Placeholder
**Status:** PRESENT — unreplaced in all 7 hook source files

Every hook in hooks/ contains `// gsd-hook-version: {{GSD_VERSION}}` on line 2. The scripts/build-hooks.js build script performs plain fs.copyFileSync with no template substitution. The gsd-check-update.js hook explicitly skips staleness checks when hookVersion includes '{{', making the entire version-tracking feature inoperative. Dead code by design gap — the substitution mechanism was never implemented.

### 6b. Shell Injection Risk (gsd-check-update.js)
**Status:** LOW RISK

Two shell-adjacent patterns exist:
1. spawn with interpolated paths — inputs come from os.homedir(), process.cwd(), and CLAUDE_CONFIG_DIR (escaped via JSON.stringify). Not user-controlled from hook stdin.
2. Hardcoded npm view command — no injection vector.

No untrusted hook input flows into shell commands.

### 6c. Prompt Injection Pattern Duplication
**Status:** DIVERGED — bidirectional gap

| Source | Patterns | Unique to this source |
|--------|----------|-----------------------|
| hooks/gsd-prompt-guard.js | 18 | base64 fragment, instruction delimiter, markdown role, multilingual, prompt leaking |
| lib/security.cjs | 17 | act as, what are your instructions, exfiltration, tool manipulation |

Neither is a superset of the other. The hook comment acknowledges the duplication: "inlined for hook zero-dependency independence." No shared source of truth exists.

### 6d. Security Guards Advisory-Only
**Status:** ENFORCING (resolved)

Both gsd-prompt-guard.js and gsd-config-protection.js exit with code 2 (blocking) on detection. Both use hookSpecificOutput with permissionDecision: deny. Fail-closed behavior confirmed.

**Verdict:** WARN
**Impact:** Version tracking (6a) is dead — not a security risk but a maintenance gap. Pattern divergence (6c) means the hook layer catches attacks the lib layer misses and vice versa — inconsistent protection surface. Shell injection (6b) is low risk. Security enforcement (6d) is correct.

---

## D7: Stale References

**Command files scanned:** 64
**Workflow files scanned:** 56

### Dangling Path References
None. All hardcoded paths resolve to existing files on disk.

### Stale Structural References

**One low-severity finding:**
- crew.md:33 — references ~/projects/Pete-Gets-Shit-Done/agents/ as a fallback path. This is a hardcoded project-specific absolute path in a nominally project-agnostic command. Would silently fail if GSD were installed under a different project directory name.

### Design-Intent Absences (not stale)
- Multiple files reference .planning/REQUIREMENTS.md which does not exist between milestones. All references include 2>/dev/null guards or treat as optional. Expected absent state.

**Verdict:** WARN
**Impact:** Negligible today. The crew.md hardcoded path is a portability concern, not a runtime failure.

---

## D8: Plugin Completeness

### get-shit-done (main plugin)

| Metric | Disk | README | Delta |
|--------|------|--------|-------|
| Commands | 63 | 61 | +2 (audit-agents, audit-deps undocumented) |
| Agents | 18 | 16 | +2 (gsd-dependency-auditor, gsd-ecosystem-auditor undocumented) |

CLAUDE.md also states 16 agents — same stale count.

### claude-code-factory
- Skills on disk (GSD repo): 1 (extension-guide)
- Skills on disk (external project): 38 (full factory; since consolidated into ~/projects/Pete-Gets-Shit-Done/plugins/claude-code-factory/)
- README: Documents 38 — matches the external project, not the GSD repo copy
- Mismatches: None against external project

### claude-mcp-ecosystem
- Skills on disk: 7
- Skills in README: 7
- Mismatches: None

### plugin.json Integrity
- claude-code-factory: valid
- claude-mcp-ecosystem: valid
- get-shit-done: no plugin.json (installed via bin/install.js — by design)

**Verdict:** WARN
**Impact:** Documentation drift. README and CLAUDE.md undercount by 2 commands and 2 agents.

---

## Priority Matrix

### High Priority (structural risk)
1. **D5 — Factory plugin orphaned cache.** If the cache invalidates, 37 skills and 9 agents disappear. Fix: register claude-code-factory in marketplace.json or accept the stripped-down source as canonical.
2. **D6c — Diverged injection patterns.** Neither the hook nor the lib covers the full pattern set. Fix: create a shared INJECTION_PATTERNS module or merge the sets into both files.
3. **D6a — Dead version tracking.** The GSD_VERSION feature was designed but never implemented. Fix: implement template substitution in build-hooks.js or remove the placeholders.

### Medium Priority (quality/maintenance)
4. **D4 — Branch coverage gaps.** workstream.cjs (50.68%) and build-hooks.js (50%) are well below the 80% module threshold.
5. **D1 — Command/workflow drift.** 11 commands without workflow backing, 5 orphaned workflows. Needs a convention decision.
6. **D8 — Documentation undercount.** README and CLAUDE.md both say 16 agents / 61 commands. Actual: 18 agents / 63 commands.

### Low Priority (cosmetic/portability)
7. **D3 — lesson-capture-gate.cjs +x bit.** Cosmetic for Node.js hooks.
8. **D7 — crew.md hardcoded path.** Portability concern only.
9. **D2 — Duplicate agents across scopes.** User-level copies redundant when project is active.

---

## Recommendation

The audit reveals a codebase that is **functionally sound but carrying accumulated drift** across documentation, plugin infrastructure, and security pattern management. No runtime failures. No test failures. But 7 of 8 dimensions show entropy that will compound if not addressed.

The single highest-risk item is the **claude-code-factory orphaned cache** (D5) — it is a time bomb that will surface on any cache invalidation event. The **injection pattern divergence** (D6c) is a security coverage gap that should be resolved before the next milestone ships.

These findings are suitable as input to /gsd:new-milestone scoping for v2.4.
