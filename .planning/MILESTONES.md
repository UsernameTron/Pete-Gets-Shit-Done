# Milestones

## v2.7 Session Continuity (Shipped: 2026-04-18)

**Phases completed:** 3 phases (52-54), 7 plans, 1,957 LOC (846 source + 1,111 tests)

**Key accomplishments:**

- Checkpoint Engine (`checkpoint.cjs`): deterministic session state capture before context resets, consumed by `/prime` and `/gsd:resume-work` to skip completed work
- Daily Dashboard (`daily.cjs` + `/gsd:daily`): one-command morning briefing showing milestone, phase, plan progress, branch state, and exact next action
- Automated UAT Runner (`uat-patterns.cjs` + `uat-runner.cjs`): 8-pattern registry maps natural-language must_haves to read-only shell assertions, runs automatically before conversational UAT via verify-work Step 0

**Shipped via:** PR #6 (Phase 52), PR #7 (Phase 53), PR #8 (Phase 54). UAT 16/16, 11/11, 6/6 passed. 2,621 tests green.

---

## v2.6 Developer Experience (Shipped: 2026-04-18)

**Phases completed:** 3 phases (49-51), 5 plans, 7 tasks

**Key accomplishments:**

- One-command install (`npm run setup`): takes a fresh git clone to a fully working, health-verified GSD install with idempotent npm install, hook build, plugin registration, and verification table
- `/gsd:ci-watch` command: polls GitHub Actions in real time, surfaces pass/fail results inline, fetches failure logs, and suggests concrete fixes from a 6-pattern diagnostic library
- `/gsd:sync-docs` command: audits and rewrites README.md, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF.md, and CHANGELOG.md from live codebase state, then reports what changed

**Shipped via:** PR #3 (Phase 49) + PR #4 (Phases 50-51). UAT 9/9 passed, 2,561 unit tests green.

---

## v2.5 Final Documentation Sync (Shipped: 2026-04-17)

**Phases completed:** 2 phases (47-48), 9 plans, 11 tasks

**Key accomplishments:**

- Agent roster assessment: explicit frontmatter (model, permissionMode, maxTurns, isolation) added to 10 agents following validator-hub gold standard
- `gsd-dependency-auditor` agent and `/gsd:audit-deps` command added for package security auditing
- Agent count corrected from 18 to 17 (gsd-security-guardian archived, gsd-dependency-auditor and gsd-ecosystem-auditor added to inventories)
- CI/CD pipeline established: GitHub Actions for Node 20+22 on Ubuntu and macOS with SHA-pinned actions
- All documentation aligned to verified counts: 63 commands, 17 agents, 45 skills, 6 hooks, 479 test suites, 2,490 assertions, 90.79% coverage
- CHANGELOG.md v2.5 section created; project enters maintenance mode

**Shipped via:** PR #1 (v2.4 phases 45-47) + PR #2 (v2.5 phase 48 + UAT fixes). 4 stale count references found and fixed during UAT.

---

## v2.4 Foundation Hardening (Shipped: 2026-04-17)

**Phases completed:** 2 phases, 6 plans, 8 tasks

**Key accomplishments:**

- Registered claude-code-factory in marketplace.json with validated source path resolution and integration test
- Merged diverged hook (18) and library (18) injection patterns into a 23-pattern canonical superset with build-time inlining
- build-hooks.js now stamps real package version (1.30.0) into all 7 dist hooks, making staleness detection operative

---

## v2.3 Hook Ecosystem + Security Guardian + Agent Quality (Shipped: 2026-04-15)

**Phases completed:** 4 phases (41-44), 5 plans, 8/8 requirements satisfied

**Key accomplishments:**

- HOOK-01: Prompt injection PreToolUse hook enhanced to 18 regex patterns with fail-closed blocking (Phase 41-01)
- HOOK-02: Config protection PreToolUse hook ported with 32-entry PROTECTED_FILES set and `Write|Edit` matcher (Phase 41-01)
- HOOK-03: Cost tracker PostToolUse hook writing zero-dep JSONL metrics; all 3 new hooks wired through `build-hooks.js` and `bin/install.js` (Phase 41-02)
- SEC3-01/02: `gsd-security-guardian` design-time review agent at 10/10 standard + shared `agent-threat-model.md` reference covering 6 threat categories (Phase 42-01)
- QUAL-01: 4D weighted scoring rubric (security 35%, perf 25%, correctness 25%, maint 15%) baked into `gsd-verifier` (Phase 43-01)
- QUAL-02: Three-part agent necessity gate (context pollution / parallelizability / specialization) with PASS/FAIL/AMBIGUOUS outcomes (Phase 43-01)
- QUAL-03: Two-mode verification (`--mode=compliance`, `--mode=schema`, default both) in `/gsd:verify-work` (Phase 43-01)

**Shipped via:** PR #49 (feat/v2.3-phase-41-hook-ports) merged 2026-04-15 at 75b29cd. CI allowlist patch 34b865b applied to unblock merge. Phase 44 covered milestone audit + docs sync (CLAUDE.md, README.md, DEVOPS-HANDOFF.md updated for 16 hooks / 16 agents / new rubric).

---

## v2.2 Security Hardening (Shipped: 2026-04-13)

**Phases completed:** 2 phases (39-40), 4 requirements

**Key accomplishments:**

- SEC2-01, SEC2-02: `@file:` allowlist + `requireSafePath` enforcement for command paths (Phase 39)
- SEC2-03: `execSync` eliminated, `safeExec` everywhere with configurable timeouts (Phase 40)
- SEC2-04: `indexOf` scanner + `escapeRegex` + 1MB guard in parser hardening (Phase 40)
- All 4 high-severity audit findings (H-01, H-08, H-09, H-10) closed

**Shipped via:** PR #47 (code) + PR #48 (audit). No on-disk phase artifacts — v2.2 was executed as direct fixes against audit findings rather than the standard PLAN/SUMMARY flow. Canonical record: `.planning/v2.2-MILESTONE-AUDIT.md`.

**Deferred to v2.3:** H-06, H-07 (refactors, not exposure).

---

## v2.1 System Audit & Debt Closure (Shipped: 2026-04-10)

**Phases completed:** 5 phases, 7 plans, 8 tasks

**Key accomplishments:**

- Created 3 missing SUMMARY.md files for Phase 6 plans 02, 03, 04 using CREW-ASSESSMENT.md execution log data, closing the DEBT-06 project history gap
- Replaced deprecated agent references in global CLAUDE.md and created Nyquist gap analysis for Phase 6 with 7/7 priorities verified
- 15/15 GSD agents pass tier-vs-tools audit, gsd-validator-hub reachable via ship.md workflow routing
- Automated 4-dimension audit of all 15 GSD source agents: YAML validity, tier/tool consistency, quality sections, and stale reference scan -- all 15 PASS
- Audited 61 GSD commands for routing reachability and 16 hooks for configuration validity — all pass, 12 commands flagged as deployment gap

---

## v1.6 Maintainability (Shipped: 2026-04-04)

**Phases completed:** 4 phases (18-21), 12 plans, 12 requirements

**Key accomplishments:**

- 4-layer module architecture with documented boundaries — MAINT-01
- Sync-compatible cancel token pattern (createCancelToken) — MAINT-06
- Feature flag system with config-driven toggles (createFeatureFlags) — MAINT-02
- validateShellArg wired to 5 production call sites via execGitValidated — MAINT-07
- Truncation detection consumer (detectTruncation + GSD_TRUNCATED_SENTINEL) — MAINT-08
- Complete skills system overhaul: discovery, audit, versioning, forge consolidation — MAINT-03 through MAINT-09
- Package v1.30.0 marketplace-ready with aligned metadata — META-01 through META-03

---

## v1.5 Performance (Shipped: 2026-04-04)

**Phases completed:** 3 phases (15-17), 6 plans, 6 requirements

**Key accomplishments:**

- Streaming output helper (streamLines) for progressive line-by-line output — PERF-01
- Deterministic ordering utility (deterministicSort) for reproducible output — PERF-02
- Lazy-load MODEL_PROFILES and skill registry for faster cold starts — PERF-03, PERF-04
- Token estimation utility (estimateTokens) for budget-aware workflows — PERF-05
- Context budget helper (budgetContext) for token-aware context packing — PERF-06

---

## v1.4 Correctness & Robustness (Shipped: 2026-04-04)

**Phases completed:** 4 phases (11-14), 6 plans, 14 requirements

**Key accomplishments:**

- GsdError structured error class with code, context, cause fields — CORR-01
- Audited and documented 92 catch blocks across 12 files with intentional annotations — CORR-02
- deepFreeze() utility and module-boundary immutability for loadConfig/state returns — CORR-04, CORR-05
- safeExec() wrapper with configurable timeouts, execGit refactored through it — CORR-07, CORR-08
- Lock force-acquire diagnostics with debugLog — CORR-09
- Tech debt cleanup: tier labels, absorbed profiles, coverage, validator wiring, validation docs — DEBT-01 through DEBT-05

---

## v1.3 Security Hardening & Coverage (Shipped: 2026-04-04)

**Phases completed:** 4 phases (7-10), 4 plans, 260 tests passing

**Key accomplishments:**

- Cryptographic temp paths (crypto.randomBytes) replacing predictable Date.now() in output() — SEC-01
- Shell metacharacter blocking in validateShellArg() and output truncation sentinel (__GSD_TRUNCATED__) — SEC-03, SEC-04
- Branch coverage improved: core.cjs 82.82% to 87.11%, security.cjs to 100% line / 91.11% branch — SEC-05
- Config migration registry with version tracking + migration pipeline in loadConfig — SEC-06

---

## v1.2 Agent Quality & Consolidation (Shipped: 2026-04-04)

**Phases completed:** 1 phase (6), 5 plans, 7 requirements

**Key accomplishments:**

- Consolidated verification agents (4 to 1), research agents (2 to 1), validator agents (2 to 1)
- Applied 3-tier tool access model (Explore/Research/Modify) to all 15 source agents
- Added domain-specific guardrails and quality sections to 9 low-scoring agents

---

## v1.1 Testing & Hardening (Shipped: 2026-03-26)

**Phases completed:** 4 phases, 11 plans, 4 tasks

**Key accomplishments:**

- Expanded c8 coverage from 17 lib modules to 25 source files across lib, hooks, gsd-tools, bin/install.js, and scripts
- Prioritized gap analysis classifying 25 modules into 3 tiers with binary shell script inventory, plus pre-expansion baseline document for Phase 3 comparison
- cross-plugin command name uniqueness

---
