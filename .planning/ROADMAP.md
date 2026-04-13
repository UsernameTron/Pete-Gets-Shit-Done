# Roadmap: get-shit-done-cc

## Current Milestone: v2.2 Security Hardening

**Started:** 2026-04-12
**Goal:** Fix 4 high-severity security findings from the full system audit (H-01, H-10, H-09, H-08).
**Requirements:** 4 (SEC2-01 through SEC2-04)

### Phase 39: Path Validation
- **Goal:** Contain `@file:` protocol arbitrary file read (H-01) and add path validation to unprotected commands (H-10)
- **Requirements:** SEC2-01, SEC2-02
- **Success criteria:**
  - `@file:` protocol validates against allowlist (project dir + gsd-*.json in tmpdir)
  - `cmdSummaryExtract` and `cmdTodoComplete` validate paths via `requireSafePath`
  - Path traversal rejection tests pass
- **Status:** not started
- **Complete:** false

### Phase 40: Execution & Parser Hardening
- **Goal:** Replace raw `execSync` with safe wrappers (H-09) and harden frontmatter parser against ReDoS (H-08)
- **Requirements:** SEC2-03, SEC2-04
- **Success criteria:**
  - All 3 `execSync` calls in init.cjs replaced with `safeExec`/`execGitValidated`
  - Frontmatter regex parser replaced with indexOf scanner (O(n))
  - `escapeRegex` applied to blockName injection point
  - 1MB input size guard on frontmatter functions
  - ReDoS timing tests confirm no catastrophic backtracking
  - All existing tests pass
- **Status:** not started
- **Complete:** false

## Completed Milestones

- **v1.0 Post-Merge Cleanup** (2026-03-25 -> 2026-03-26) -- 1 phase, 3 requirements. [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Testing & Hardening** (2026-03-26) -- 4 phases, 13 requirements. [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Agent Quality & Consolidation** (2026-04-03 -> 2026-04-04) -- 1 phase, 7 requirements. [Archive](milestones/v1.2-ROADMAP.md)
- **v1.3 Security Hardening & Coverage** (2026-04-04) -- 4 phases, 6 requirements. [Archive](milestones/v1.3-ROADMAP.md)
- **v1.4 Correctness & Robustness** (2026-04-04) -- 4 phases, 14 requirements. [Archive](milestones/v1.4-ROADMAP.md)
- **v1.5 Performance** (2026-04-04) -- 3 phases, 6 requirements. [Archive](milestones/v1.5-ROADMAP.md)
- **v1.6 Maintainability** (2026-04-04) -- 4 phases, 12 requirements. [Archive](milestones/v1.6-ROADMAP.md)
- **v1.7 End-to-End Integration Testing** (2026-04-04) -- 4 phases, 13 requirements. [Archive](milestones/v1.7-ROADMAP.md)
- **v1.8 Documentation & Accuracy** (2026-04-05) -- 2 phases, 7 requirements. [Archive](milestones/v1.8-ROADMAP.md)
- **v1.9 Ship Readiness & Hygiene** (2026-04-05) -- 2 phases, 5 requirements. [Archive](milestones/v1.9-ROADMAP.md)
- **v2.0 Intelligence Layer** (2026-04-05) -- 4 phases, 23 requirements. [Archive](milestones/v2.0-ROADMAP.md)
- **v2.1 System Audit & Debt Closure** (2026-04-09 -> 2026-04-10) -- 5 phases, 10 requirements. [Archive](milestones/v2.1-ROADMAP.md)

---
*Last updated: 2026-04-12 -- v2.2 milestone started*
