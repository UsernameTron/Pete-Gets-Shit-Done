# Requirements: v2.3 Hook Ecosystem + Security Guardian + Agent Quality

## Source

v2.3 charter: `.planning/v2.3-prompt-chain.md`. Derived from ECC diamond hunt (hook ports) + NOC security gap + Inside Claude Code skill ports (threat modeler, architecture review).

## Requirements

### HOOK-01: Prompt Injection Detection Hook

**Priority:** High
**Phase:** 41
**Source:** `gsd-prompt-guard.js` in `connor-innovate-platform/scripts/hooks/` (18 regex patterns).
**Acceptance criteria:**
- `PreToolUse` hook under `hooks/src/` following existing GSD hook patterns
- 18 regex patterns for injection detection (jailbreaks, role overrides, system prompt leaks, instruction smuggling)
- Fail-closed on match: block the tool call, emit structured audit log entry
- Bundled via `npm run build:hooks` into `hooks/dist/`
- Registered in `bin/install.js` alongside existing hooks
- Tests under `tests/` covering all 18 patterns + negative cases
- Zero external deps (Node.js built-ins only)
- ~50 LOC adapted

### HOOK-02: Config Protection Hook

**Priority:** High
**Phase:** 41
**Source:** `config-protection.js` in `BACKUPS/everything-claude-code-clean/scripts/hooks/` (~110 LOC, has tests).
**Acceptance criteria:**
- `PreToolUse` hook matching `Write|Edit` events
- Blocks edits to linter/formatter configs: eslint (.eslintrc*, eslint.config.*), prettier (.prettierrc*, prettier.config.*), biome (biome.json*), ruff (ruff.toml, pyproject.toml ruff section)
- Returns actionable error message when blocked
- Bundled via `npm run build:hooks`
- Registered in installer
- Tests ported from source repo (all must pass)
- Zero external deps

### HOOK-03: Cost Tracker Hook

**Priority:** High
**Phase:** 41
**Source:** `cost-tracker.js` in `BACKUPS/everything-claude-code-clean/scripts/hooks/` (~80 LOC, has tests).
**Acceptance criteria:**
- `PostToolUse` hook (all tools)
- Appends JSONL entries to `~/.claude/metrics/costs.jsonl` with: timestamp, tool, input_tokens, output_tokens, estimated_usd
- Cost table uses current Claude pricing tiers (Opus/Sonnet/Haiku)
- Creates `~/.claude/metrics/` dir if missing (no error on create)
- Bundled via `npm run build:hooks`
- Registered in installer
- Tests ported from source repo (all must pass)
- Zero external deps

### SEC3-01: `gsd-security-guardian` Agent

**Priority:** High
**Phase:** 42
**Source:** NOC security.md gap + Inside Claude Code `security-threat-modeler` skill.
**Acceptance criteria:**
- New agent file at `get-shit-done/agents/gsd-security-guardian.md`
- 6-category threat model: prompt injection, shell injection, path traversal, credential leakage, sandbox escape, resource exhaustion
- Defense-in-depth 10/10 standard (match plugin-developer/test-runner/docs-sync shape): frontmatter with `model`, `maxTurns`, `isolation: worktree`, `disallowedTools`; body sections `<role>`, `<model_rationale>`, `<scope_guard>`, `<project_context>`, `<anti_patterns>` (10 rules), `<completion_criteria>`
- Scope: reviews other agents and hooks for security issues at design-time (NOT runtime — that is HOOK-01)
- Registered in installer
- Model: `sonnet` (pattern-matching against known threat categories)
- Referenced from README.md / CLAUDE.md agent inventory

### SEC3-02: Agent Threat Model Reference Doc

**Priority:** High
**Phase:** 42
**Source:** Inside Claude Code `security-threat-modeler` skill at `/Users/cpconnor/projects/Inside Claude Code/.claude/skills/security-threat-modeler/`.
**Acceptance criteria:**
- Reference doc at `get-shit-done/references/agent-threat-model.md`
- Each of 6 threat categories documented with: attack vectors (examples), detection patterns (regex/heuristic), mitigation strategies (controls)
- Citable by any GSD agent via `@file:` reference
- Included in plugin distribution (installer copies to installed location)
- No external deps, no code — pure reference

### QUAL-01: 4D Architecture Scoring Rubric for `gsd-verifier`

**Priority:** High
**Phase:** 43
**Source:** `agent-architecture-review` skill references at `/Users/cpconnor/projects/Inside Claude Code/.claude/skills/agent-architecture-review/references/`.
**Acceptance criteria:**
- Extends existing `get-shit-done/agents/gsd-verifier.md` (not a new agent)
- 4 scoring dimensions with weights: security 35%, performance 25%, correctness 25%, maintainability 15%
- 14 design patterns as scoring criteria, grouped under the 4 dimensions
- Verifier emits score per dimension + total score in VERIFICATION.md output
- Passing threshold defined (default: >= 70 overall, no dimension below 50)
- Tests cover rubric application on at least one fixture per dimension

### QUAL-02: Three-Part Agent Necessity Gate

**Priority:** High
**Phase:** 43
**Source:** Subagent design best practices (inline in charter).
**Acceptance criteria:**
- Gate added to the subagent creation workflow (e.g., `/gsd:crew` add path + any command that proposes creating a new agent)
- Three checks, all must pass to justify a new agent:
  1. **Context pollution** — would doing this inline pollute the main context window?
  2. **Parallelizability** — can this run in parallel with other work?
  3. **Specialization** — does it need specialized tools, permissions, or isolation?
- Gate output: `PASS` (create the agent), `FAIL` (inline is correct), `AMBIGUOUS` (prompt user)
- Documented in `references/` so other skills can cite the gate
- Tests cover all three branches

### QUAL-03: Two-Mode Verification in `/gsd:verify-work`

**Priority:** High
**Phase:** 43
**Source:** Existing `/gsd:verify-work` command.
**Acceptance criteria:**
- Mode 1 (spec compliance — existing behavior): Does implementation match the plan?
- Mode 2 (schema quality — new): Does it follow GSD conventions (frontmatter, commit style, file locations, test patterns)?
- Both modes run by default; can be invoked separately via flag (`--mode=compliance` or `--mode=schema`)
- VERIFICATION.md output includes a section per mode
- Tests cover both modes independently + combined default

## Traceability

| REQ | Phase | Status |
|-----|-------|--------|
| HOOK-01 | 41 | Complete |
| HOOK-02 | 41 | Complete |
| HOOK-03 | 41 | Pending |
| SEC3-01 | 42 | Pending |
| SEC3-02 | 42 | Pending |
| QUAL-01 | 43 | Pending |
| QUAL-02 | 43 | Pending |
| QUAL-03 | 43 | Pending |

## Deferred to v2.4+

Captured in `.planning/v2.3-prompt-chain.md` → "Deferred Backlog" section. Summary:

- **v2.4 Developer Experience:** gsd-pr-opener port, jargon-free discuss flows, doc drift detection, ECC operational lessons (worktree stall warning, stalled-agent kill, SOUL.md identity).
- **v2.5+ Architecture Evolution:** Feature-branch pipeline mode, TaskList/SendMessage live coordination, hub-and-spoke skill restructure, control-plane handoff block format, loop patterns.
- **Hook backlog:** governance-capture, pre-bash-commit-quality, stop-format-typecheck, post-edit-format, auto-tmux-dev pair, post-bash-command-log.

## Out of Scope (v2.3)

- Runtime security enforcement beyond the 3 ported hooks (handled by hooks, not the new Guardian agent)
- Restructuring existing 47+ skills (v2.5+)
- Changing phase numbering or REQ prefix scheme (continue SEC3-xx to avoid collision with v1.3 SEC-xx and v2.2 SEC2-xx)
- New execution engine behavior (intelligence layer was v2.0)

---
*Created: 2026-04-13*
