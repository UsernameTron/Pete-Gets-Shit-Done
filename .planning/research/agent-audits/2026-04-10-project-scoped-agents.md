# Project-Scoped Agent Audit — 2026-04-10

**Scope**: 3 project-scoped agents in `.claude/agents/` — `plugin-developer`, `test-runner`, `docs-sync`
**Excluded**: 15 built-in GSD agents (already audited in GSD-AGENT-AUDIT-20260410)
**Framework**: 14 production design patterns, 12 anti-patterns, 6-category threat model, 4-dimension scoring

---

## Composite Score

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Security | 35% | 3.7 / 5 | 1.30 |
| Performance | 25% | 3.3 / 5 | 0.83 |
| Correctness | 25% | 3.7 / 5 | 0.93 |
| Maintainability | 15% | 4.3 / 5 | 0.65 |
| **Composite** | **100%** | | **3.70 / 5** |

**Rating**: Acceptable — no critical gaps, several medium-priority improvements available.

---

## Per-Agent Scorecard

### 1. plugin-developer (3.8 / 5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 4.0 | Tool grant is appropriate (Read, Write, Edit, Bash, Glob, Grep). No Bash restrictions beyond what Claude Code enforces. Has explicit constraints against adding external deps. Hardcoded absolute path is a mild info-disclosure vector but acceptable for project-scoped agent. |
| Performance | 3.5 | Model set to `sonnet` — appropriate for implementation work. No isolation mode declared; runs in main worktree, risking dirty-state conflicts during parallel execution. No `permissionMode` declared — inherits default, which is correct but implicit. |
| Correctness | 3.5 | Clear responsibility boundary: does NOT run tests or update docs, delegates to siblings. Structured output contract ("files changed, frontmatter validated, build status"). Missing: no explicit error-handling guidance for partial failures (e.g., hook build fails after command edit succeeds). |
| Maintainability | 4.0 | Clean single-responsibility design. Constraint list covers the critical gotchas (zero-dep, CommonJS, frontmatter validity, hook rebuild). Key locations section provides good navigation. |

**Pattern coverage**:
- P1 (Three-Factor Permissions): INHERITED — agent uses Claude Code's permission cascade; no agent-level override.
- P7 (Budget as Constructor): NOT CONFIGURED — no explicit token/cost budget. Relies on parent session budget.
- P14 (Lightweight State): N/A — stateless subagent, no persistent state.

**Anti-pattern exposure**:
- AP-1 (Trusted Model Output): LOW — agent edits code files, not security-critical config. Claude Code validates tool calls upstream.
- AP-8 (No Budget Constraint): MEDIUM — long implementation tasks could consume significant tokens without subagent-level budget cap.

**Findings**:
1. **No isolation mode** — parallel execution with test-runner or docs-sync could produce merge conflicts on shared files (e.g., `bin/install.js` edited by plugin-developer while docs-sync reads it).
2. **Hardcoded absolute path** — `/Users/cpconnor/projects/Pete-Gets-Shit-Done/get-shit-done` is non-portable. Not a bug for Pete's single-operator use, but would break if repo is cloned elsewhere.
3. **No permissionMode declaration** — inherits `default`, which is correct, but explicit declaration is better practice per P0 hygiene standard.
4. **Stale test count** — description says "295+" but CLAUDE.md says 454 suites / 2377 assertions. Cross-reference: this is test-runner's description, not plugin-developer's. Plugin-developer is clean on this point.

---

### 2. test-runner (3.5 / 5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 3.5 | Tool grant excludes Write — correctly prevents creating arbitrary files. Uses Edit for test fixes only. Has explicit constraint: "never modify source code." Bash access is unrestricted, which means test-runner could theoretically execute arbitrary commands. Coverage threshold in agent description (70%) contradicts CLAUDE.md standard (90% overall / 80% per module / 95% security-critical). |
| Performance | 3.0 | Model set to `sonnet`. No isolation mode. Running `npm test` from a subagent while plugin-developer is editing source files is a race condition. |
| Correctness | 3.5 | Good diagnostic workflow (5-step process). Clear output contract (test count, pass/fail, coverage, diagnostics). **Critical gap**: coverage threshold in agent prompt (70%) is 20 points below the project standard (90%). Agent will report "all clear" when project governance would flag a failure. |
| Maintainability | 4.0 | Single responsibility, clear constraints, explicit file-scope restriction (tests/ only). Diagnostic workflow is well-structured. |

**Pattern coverage**:
- P1: INHERITED.
- P7: NOT CONFIGURED.
- P14: N/A.

**Anti-pattern exposure**:
- AP-1: LOW — test execution, not security-sensitive.
- AP-8: MEDIUM — `npm test` on 454 suites can run long; no timeout guidance in agent prompt.

**Findings**:
1. **CRITICAL: Coverage threshold mismatch** — Agent says "flag any module below 70% lines." Project CLAUDE.md says 90%/80%/95%. This is a governance gap: test-runner will pass modules that CLAUDE.md would fail. The 70% threshold matches the c8 `--lines 70` flag in package.json, which is the floor enforced by tooling — but the agent should enforce the higher project standard, not the CI floor.
2. **Stale suite count** — Description says "295+" but actual count is ~454 suites. Misleading but low-impact (description is a trigger hint, not a runtime value).
3. **No isolation mode** — same parallel execution risk as plugin-developer.
4. **No permissionMode** — implicit default, should be explicit.
5. **No Write tool** — correct security posture, but means test-runner cannot create new test files, only edit existing ones. If coverage gaps require new test suites, test-runner must hand off to plugin-developer or the orchestrator.

---

### 3. docs-sync (3.8 / 5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 3.5 | Tool grant: Read, Write, Edit, Glob, Grep — no Bash. This is the most restrictive of the three agents. Excellent: explicitly cannot execute commands, only read/write files. Constraint: never modify source code, tests, or package.json. Mild concern: Write access to CLAUDE.md means a prompt-injected docs-sync could alter project governance. |
| Performance | 3.5 | Model set to `sonnet`. No isolation mode. Write conflicts possible if docs-sync updates README.md while another agent reads it. |
| Correctness | 4.0 | Best-defined workflow of the three: 5-step process with explicit source-of-truth cross-referencing (command count, agent count, test stats, version, package size). Clear rule: "update docs to match code, never the reverse." Output contract: files updated, sections changed, discrepancies found. |
| Maintainability | 4.5 | Cleanest agent definition. Single responsibility, explicit document inventory, clear constraints, well-structured workflow. CHANGELOG conventions included. |

**Pattern coverage**:
- P1: INHERITED.
- P7: NOT CONFIGURED.
- P14: N/A.

**Anti-pattern exposure**:
- AP-1: LOW — documentation updates, not executable code.
- AP-8: LOW — docs updates are small token footprints.

**Findings**:
1. **No Bash tool** — docs-sync's workflow (step 2-3) references `git log`, `git diff`, `ls | wc -l`, `npm test`, and `npm pack` commands. Without Bash access, the agent cannot execute these commands. It must rely on the orchestrator to provide this data, or the commands fail silently. This is a functional gap.
2. **No isolation mode** — lower risk than the other two since docs-sync is less likely to run concurrently with destructive operations.
3. **No permissionMode** — implicit default.
4. **Governance file write access** — docs-sync can write to CLAUDE.md. This is intentional (it maintains CLAUDE.md), but the agent prompt should include a constraint that CLAUDE.md changes must preserve existing governance rules and only update factual sections (counts, version, structure).

---

## Pattern Gap Analysis (All 3 Agents)

| Pattern | Status | Impact |
|---------|--------|--------|
| P1: Three-Factor Permissions | Inherited from Claude Code | No action needed |
| P2: Adaptive Denial Tracking | Inherited | No action needed |
| P3: Streaming Tool Execution | Inherited | No action needed |
| P4: Cache-Stable Ordering | N/A for subagents | No action needed |
| P5: Dual-Position Context | N/A for subagents | No action needed |
| P6: Four-Layer Security | Inherited (3 of 4 layers; no sandbox per agent) | MEDIUM — subagents inherit session sandbox but have no agent-level write-path restrictions |
| P7: Budget as Constructor | **MISSING on all 3** | MEDIUM — no per-agent token budget; relies on parent session limits |
| P8: Hybrid Token Estimation | Inherited | No action needed |
| P9: Auto-Compact | Inherited | No action needed |
| P10: Self-Referential Protection | PARTIAL — no constraint preventing agents from editing their own definitions | LOW — agents have Edit access to `.claude/agents/`, including their own .md file |
| P11: Feature Flags | N/A | No action needed |
| P12: Cryptographic Nonce Paths | Inherited | No action needed |
| P13: Shell Expansion Rejection | Inherited for Bash-equipped agents | No action needed |
| P14: Lightweight State | N/A — stateless subagents | No action needed |

---

## Threat Model Assessment

| Threat Category | Exposure | Notes |
|-----------------|----------|-------|
| 1. Prompt Injection → Tool Exec | LOW | Subagents operate on trusted local files, not external/user-uploaded content |
| 2. Shell Injection | LOW | Only plugin-developer and test-runner have Bash; Claude Code validates upstream |
| 3. Path Traversal | LOW | All agents hardcode project root; path validation inherited from Claude Code |
| 4. Credential Leakage | LOW | No agents handle secrets; no .env reads; no credential file access |
| 5. Sandbox Escape | LOW | Subagents inherit session sandbox; no agent-level sandbox weakening possible |
| 6. Resource Exhaustion | MEDIUM | No per-agent budgets; long test runs or large doc rewrites could consume tokens |

---

## Prioritized Action List

### P0 — Must Fix (ship blockers)

| # | Agent | Finding | Fix |
|---|-------|---------|-----|
| 1 | test-runner | Coverage threshold mismatch: 70% vs project standard 90%/80%/95% | Update agent prompt: replace "Flag any module below 70% lines" with "Flag any module below 80% lines. Security-critical modules (security.cjs, auth, input validation) must be >=95%. Overall project coverage must be >=90%." |

### P1 — Should Fix (next session)

| # | Agent | Finding | Fix |
|---|-------|---------|-----|
| 2 | docs-sync | No Bash tool but workflow requires shell commands | Add `Bash` to tools list, OR rewrite workflow steps 2-3 to use Glob/Grep equivalents (e.g., `Glob` for command/agent counts, `Read` for package.json version). Recommendation: add Bash — the commands are read-only and low-risk. |
| 3 | test-runner | Stale suite count in description (295+ vs 454) | Update description to reflect current count or use "400+" |
| 4 | all | No explicit `permissionMode` declaration | Add `permissionMode: default` to all three agent frontmatter blocks |

### P2 — Nice to Have (backlog)

| # | Agent | Finding | Fix |
|---|-------|---------|-----|
| 5 | all | Hardcoded absolute path to project root | Replace with relative path or `$CLAUDE_PROJECT_DIR` if supported in agent context |
| 6 | all | No isolation mode for parallel safety | Add `isolation: worktree` to agents that may run concurrently with editing agents. Tradeoff: worktree creation adds ~2s overhead per invocation. |
| 7 | plugin-developer | No partial-failure guidance | Add constraint: "If hook build fails after source edit, revert the edit and report. Do not leave source in an inconsistent state." |
| 8 | docs-sync | No CLAUDE.md governance preservation constraint | Add constraint: "When updating CLAUDE.md, preserve all governance rules, workflow definitions, and standards. Only update factual sections (counts, version, file structure, command inventory)." |
| 9 | all | No self-referential protection | Add to all three: "Do not modify files in .claude/agents/." |

---

## Positive Observations

1. **Clean single-responsibility design** — each agent has one job, explicit boundaries, and defined handoff points to siblings. This is textbook subagent architecture.
2. **Explicit "do NOT" constraints** — all three agents declare what they must not touch. This is more valuable than listing what they can touch, because it prevents scope creep.
3. **Structured output contracts** — all three define what their return format should contain. This enables the orchestrator to consume results programmatically.
4. **Appropriate tool grants** — docs-sync has no Bash (though it needs read-only Bash); test-runner has no Write (only Edit). Tool minimization is the right instinct.
5. **Model selection** — all three use `sonnet`, which is the correct choice for implementation-tier subagents (fast enough for productivity, capable enough for code editing).
