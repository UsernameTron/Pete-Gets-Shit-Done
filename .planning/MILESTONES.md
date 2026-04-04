# Milestones

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
