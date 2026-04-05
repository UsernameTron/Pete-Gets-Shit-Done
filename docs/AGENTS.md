# GSD Agent Reference

> All 15 specialized agents — roles, tools, spawn patterns, and relationships. For architecture context, see [Architecture](ARCHITECTURE.md).

---

## Overview

GSD uses a multi-agent architecture where thin orchestrators (workflow files) spawn specialized agents with fresh context windows. Each agent has a focused role, limited tool access, and produces specific artifacts.

### Agent Categories

| Category | Count | Agents |
|----------|-------|--------|
| Researchers | 2 | research-orchestrator (scope: phase/project), ui-researcher |
| Analyzers | 2 | assumptions-analyzer, advisor-researcher |
| Synthesizers | 1 | research-synthesizer |
| Planners | 1 | planner |
| Roadmappers | 1 | roadmapper |
| Executors | 1 | executor |
| Checkers | 1 | ui-checker |
| Verifiers | 1 | verifier (scope: general/plan/integration/nyquist) |
| Auditors | 1 | ui-auditor |
| Mappers | 1 | codebase-mapper |
| Debuggers | 1 | debugger |

---

## Agent Details

### gsd-project-researcher

**Consolidated into gsd-research-orchestrator** (scope: project). See [gsd-research-orchestrator](#gsd-research-orchestrator) below.

---

### gsd-phase-researcher

**Consolidated into gsd-research-orchestrator** (scope: phase). See [gsd-research-orchestrator](#gsd-research-orchestrator) below.

---

### gsd-ui-researcher

**Role:** Produces UI design contracts for frontend phases.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:ui-phase` |
| **Parallelism** | Single instance |
| **Tools** | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp (context7) |
| **Model (balanced)** | Sonnet |
| **Color** | `#E879F9` (fuchsia) |
| **Produces** | `{phase}-UI-SPEC.md` |

**Capabilities:**
- Detects design system state (shadcn components.json, Tailwind config, existing tokens)
- Offers shadcn initialization for React/Next.js/Vite projects
- Asks only unanswered design contract questions
- Enforces registry safety gate for third-party components

---

### gsd-assumptions-analyzer

**Role:** Deeply analyzes codebase for a phase and returns structured assumptions with evidence, confidence levels, and consequences if wrong.

| Property | Value |
|----------|-------|
| **Spawned by** | `discuss-phase-assumptions` workflow (when `workflow.discuss_mode = 'assumptions'`) |
| **Parallelism** | Single instance |
| **Tools** | Read, Bash, Grep, Glob |
| **Model (balanced)** | Sonnet |
| **Color** | Cyan |
| **Produces** | Structured assumptions with decision statements, evidence file paths, confidence levels |

**Key behaviors:**
- Reads ROADMAP.md phase description and prior CONTEXT.md files
- Searches codebase for files related to the phase (components, patterns, similar features)
- Reads 5-15 most relevant source files to form evidence-based assumptions
- Classifies confidence: Confident (clear from code), Likely (reasonable inference), Unclear (could go multiple ways)
- Flags topics that need external research (library compatibility, ecosystem best practices)
- Output calibrated by tier: full_maturity (3-5 areas), standard (3-4), minimal_decisive (2-3)

---

### gsd-advisor-researcher

**Role:** Researches a single gray area decision during discuss-phase advisor mode and returns a structured comparison table.

| Property | Value |
|----------|-------|
| **Spawned by** | `discuss-phase` workflow (when ADVISOR_MODE = true) |
| **Parallelism** | Multiple instances (one per gray area) |
| **Tools** | Read, Bash, Grep, Glob, WebSearch, WebFetch, mcp (context7) |
| **Model (balanced)** | Sonnet |
| **Color** | Cyan |
| **Produces** | 5-column comparison table (Option / Pros / Cons / Complexity / Recommendation) with rationale paragraph |

**Key behaviors:**
- Researches a single assigned gray area using Claude's knowledge, Context7, and web search
- Produces genuinely viable options — no padding with filler alternatives
- Complexity column uses impact surface + risk (never time estimates)
- Recommendations are conditional ("Rec if X", "Rec if Y") — never single-winner ranking
- Output calibrated by tier: full_maturity (3-5 options with maturity signals), standard (2-4), minimal_decisive (2 options, decisive recommendation)

---

### gsd-research-synthesizer

**Role:** Combines outputs from parallel researchers into a unified summary.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:new-project` (after 4 researchers complete) |
| **Parallelism** | Single instance (sequential after researchers) |
| **Tools** | Read, Write, Bash |
| **Model (balanced)** | Sonnet |
| **Color** | Purple |
| **Produces** | `.planning/research/SUMMARY.md` |

---

### gsd-planner

**Role:** Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:plan-phase`, `/gsd:quick` |
| **Parallelism** | Single instance |
| **Tools** | Read, Write, Bash, Glob, Grep, WebFetch, mcp (context7) |
| **Model (balanced)** | Opus |
| **Color** | Green |
| **Produces** | `{phase}-{N}-PLAN.md` files |

**Key behaviors:**
- Reads PROJECT.md, REQUIREMENTS.md, CONTEXT.md, RESEARCH.md
- Creates 2-3 atomic task plans sized for single context windows
- Uses XML structure with `<task>` elements
- Includes `read_first` and `acceptance_criteria` sections
- Groups plans into dependency waves

---

### gsd-roadmapper

**Role:** Creates project roadmaps with phase breakdown and requirement mapping.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:new-project` |
| **Parallelism** | Single instance |
| **Tools** | Read, Write, Bash, Glob, Grep |
| **Model (balanced)** | Sonnet |
| **Color** | Purple |
| **Produces** | `ROADMAP.md` |

**Key behaviors:**
- Maps requirements to phases (traceability)
- Derives success criteria from requirements
- Respects granularity setting for phase count
- Validates coverage (every v1 requirement mapped to a phase)

---

### gsd-executor

**Role:** Executes GSD plans with atomic commits, deviation handling, and checkpoint protocols.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:execute-phase`, `/gsd:quick` |
| **Parallelism** | Multiple (parallel within waves, sequential across waves) |
| **Tools** | Read, Write, Edit, Bash, Grep, Glob |
| **Model (balanced)** | Sonnet |
| **Color** | Yellow |
| **Produces** | Code changes, git commits, `{phase}-{N}-SUMMARY.md` |

**Key behaviors:**
- Fresh 200K context window per plan
- Follows XML task instructions precisely
- Atomic git commit per completed task
- Handles checkpoint types: auto, human-verify, decision, human-action
- Reports deviations from plan in SUMMARY.md
- Invokes node repair on verification failure

---

### gsd-plan-checker

**Consolidated into gsd-verifier** (scope: plan). See [gsd-verifier](#gsd-verifier) below.

---

### gsd-integration-checker

**Consolidated into gsd-verifier** (scope: integration). See [gsd-verifier](#gsd-verifier) below.

---

### gsd-ui-checker

**Role:** Validates UI-SPEC.md design contracts against quality dimensions.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:ui-phase` (validation loop, max 2 iterations) |
| **Parallelism** | Single instance |
| **Tools** | Read, Bash, Glob, Grep |
| **Model (balanced)** | Sonnet |
| **Color** | `#22D3EE` (cyan) |
| **Produces** | BLOCK/FLAG/PASS verdict |

---

### gsd-verifier

**Role:** Unified verification agent handling plan validation, integration checks, Nyquist auditing, and general phase goal verification.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:execute-phase`, `/gsd:plan-phase`, `/gsd:audit-milestone`, `/gsd:validate-phase` |
| **Scope** | `general` (default), `plan`, `integration`, `nyquist` |
| **Parallelism** | Single instance |
| **Tools** | Read, Write, Bash, Grep, Glob |
| **Model (balanced)** | Sonnet |
| **Color** | Green |
| **Produces** | `{phase}-VERIFICATION.md`, PASS/FAIL verdicts, test files (nyquist scope) |

**Key behaviors:**
- **general**: Checks codebase against phase goals, not just task completion. PASS/FAIL with specific evidence.
- **plan**: Verifies plans will achieve phase goals before execution (8 dimensions: requirement coverage, task atomicity, dependency ordering, file scope, verification commands, context fit, gap detection, Nyquist compliance).
- **integration**: Verifies cross-phase integration and end-to-end flows.
- **nyquist**: Fills Nyquist validation gaps by generating tests. Never modifies implementation code — only test files. Max 3 attempts per gap.

---

### gsd-nyquist-auditor

**Consolidated into gsd-verifier** (scope: nyquist). See [gsd-verifier](#gsd-verifier) above.

---

### gsd-ui-auditor

**Role:** Retroactive 6-pillar visual audit of implemented frontend code.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:ui-review` |
| **Parallelism** | Single instance |
| **Tools** | Read, Write, Bash, Grep, Glob |
| **Model (balanced)** | Sonnet |
| **Color** | `#F472B6` (pink) |
| **Produces** | `{phase}-UI-REVIEW.md` with scores |

**6 Audit Pillars (scored 1-4):**
1. Copywriting
2. Visuals
3. Color
4. Typography
5. Spacing
6. Experience Design

---

### gsd-codebase-mapper

**Role:** Explores codebase and writes structured analysis documents.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:map-codebase` |
| **Parallelism** | 4 instances (tech, architecture, quality, concerns) |
| **Tools** | Read, Bash, Grep, Glob, Write |
| **Model (balanced)** | Haiku |
| **Color** | Cyan |
| **Produces** | `.planning/codebase/*.md` (7 documents) |

**Key behaviors:**
- Read-only exploration + structured output
- Writes documents directly to disk
- No reasoning required — pattern extraction from file contents

---

### gsd-debugger

**Role:** Investigates bugs using scientific method with persistent state.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:debug`, `/gsd:verify-work` (for failures) |
| **Parallelism** | Single instance (interactive) |
| **Tools** | Read, Write, Edit, Bash, Grep, Glob, WebSearch |
| **Model (balanced)** | Sonnet |
| **Color** | Orange |
| **Produces** | `.planning/debug/*.md`, knowledge-base updates |

**Debug Session Lifecycle:**
`gathering` → `investigating` → `fixing` → `verifying` → `awaiting_human_verify` → `resolved`

**Key behaviors:**
- Tracks hypotheses, evidence, and eliminated theories
- State persists across context resets
- Requires human verification before marking resolved
- Appends to persistent knowledge base on resolution
- Consults knowledge base on new sessions

---

### gsd-user-profiler

**Role:** Analyzes session messages across 8 behavioral dimensions to produce a scored developer profile.

| Property | Value |
|----------|-------|
| **Spawned by** | `/gsd:profile-user` |
| **Parallelism** | Single instance |
| **Tools** | Read |
| **Model (balanced)** | Sonnet |
| **Color** | Magenta |
| **Produces** | `USER-PROFILE.md`, `/gsd:dev-preferences`, `CLAUDE.md` profile section |

**Behavioral Dimensions:**
Communication style, decision patterns, debugging approach, UX preferences, vendor choices, frustration triggers, learning style, explanation depth.

**Key behaviors:**
- Read-only agent — analyzes extracted session data, does not modify files
- Produces scored dimensions with confidence levels and evidence citations
- Questionnaire fallback when session history is unavailable

---

## Agent Tool Permissions Summary

| Agent | Read | Write | Edit | Bash | Grep | Glob | WebSearch | WebFetch | MCP |
|-------|------|-------|------|------|------|------|-----------|----------|-----|
| research-orchestrator | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ui-researcher | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| assumptions-analyzer | ✓ | | | ✓ | ✓ | ✓ | | | |
| advisor-researcher | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| research-synthesizer | ✓ | ✓ | | ✓ | | | | | |
| planner | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| roadmapper | ✓ | ✓ | | ✓ | ✓ | ✓ | | | |
| executor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| ui-checker | ✓ | | | ✓ | ✓ | ✓ | | | |
| verifier | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| ui-auditor | ✓ | ✓ | | ✓ | ✓ | ✓ | | | |
| codebase-mapper | ✓ | ✓ | | ✓ | ✓ | ✓ | | | |
| debugger | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| user-profiler | ✓ | | | | | | | | |

**Principle of Least Privilege:**
- Checkers (ui-checker) are read-only (no Write/Edit) — they evaluate, never modify
- Researchers have web access — they need current ecosystem information
- Executors have Edit — they modify code but not web access
- Mappers have Write — they write analysis documents but not Edit (no code changes)
