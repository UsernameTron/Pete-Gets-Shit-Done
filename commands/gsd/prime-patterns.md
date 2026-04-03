---
name: gsd:prime-patterns
description: Boot session with full context + KB pattern library injection — one command, any project
argument-hint: "[--patterns 1,7,10 to force specific patterns]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Single-command session boot that loads project state AND injects the relevant Claude Code design patterns from KB v2.1. Replaces running `/prime` then manually pasting a KB prompt.

After this command, the session has:
1. Full project context (CLAUDE.md, lessons, state, agents, git)
2. Matched design patterns from the knowledge base, tailored to this project
3. Clear next action

This is project-agnostic. Works on any project in ~/projects/.
</objective>

<context>
Arguments: $ARGUMENTS (optional)
- `--patterns 1,7,10` — Force specific pattern numbers instead of auto-detect
- No arguments — auto-detect relevant patterns from project CLAUDE.md

**Knowledge Base location:** `~/projects/Inside Claude Code/claude-code-technical-knowledge-base-v2.1.md`
- Section 37 (line 1384): 14 undocumented design patterns — names, definitions, when-to-use
- Section 43 (line 1664): Cross-domain application map — pattern-to-domain mappings
- Section 44 (line 1726): Pattern implementation packages — pattern-to-package table with LOC and test counts
</context>

<process>

## Phase 1: Standard Session Boot (/prime equivalent)

Execute the full /prime sequence:

1. Read `CLAUDE.md` in full — understand what this project is, its commands, conventions
2. Read `tasks/lessons.md` — load accumulated lessons (create if missing)
3. Read `.planning/STATE.md` if it exists for GSD project state; fall back to `tasks/todo.md`
4. Load operator context files (skip any that don't exist):
   - `context/role.md`
   - `context/org.md`
   - `context/priorities.md`
   - `context/metrics.md`
5. Check `.claude/agents/` for deployed specialists
6. Check git state (current branch, uncommitted changes, last commit)
7. Check `state/session-log.md` for last session's handoff notes

## Phase 2: Pattern Detection

**If `--patterns` flag provided:** Use those pattern numbers directly. Skip to Phase 3.

**If no flag (auto-detect):** Read the project's CLAUDE.md and determine which design patterns are relevant by matching against these domain signals:

| Signal in CLAUDE.md | Patterns to inject |
|---|---|
| permissions, auth, access control, roles, deny/allow | **Pattern 1** (Model-Watching-Model), **Pattern 2** (Zero-Trust on Model Output) |
| sandbox, isolation, restricted, container, security boundary | **Pattern 3** (Self-Referential Security), **Pattern 14** (DNS Delegation) |
| cache, prompt, token, API cost, LLM calls | **Pattern 4** (Cache-Stable Ordering), **Pattern 12** (Lazy Prompt Loading) |
| context, injection, system prompt, CLAUDE.md, memory | **Pattern 5** (Dual-Position Context Injection) |
| streaming, async, tool execution, concurrent, parallel | **Pattern 6** (Streaming Tool Execution) |
| retry, backoff, failure, denial, circuit breaker, fallback | **Pattern 7** (Adaptive Denial Tracking) |
| bash, shell, command, subprocess, pipe, dangerous | **Pattern 8** (Compound Command Decomposition) |
| type safety, governance, compile-time, attestation | **Pattern 9** (Type Names as Governance) |
| registry, plugin, circular dependency, init, bootstrap | **Pattern 10** (Write-Once Registration) |
| feature flag, toggle, perimeter, enable/disable | **Pattern 11** (Feature Flags as Security Perimeters) |
| nonce, random, predictable path, temp files | **Pattern 13** (Cryptographic Nonce Paths) |
| Genesys, IVR, queue, agent routing, call flow, ACD | **Patterns 7, 8** + cross-domain contact center map |
| churn, scoring, ML, prediction, pipeline, adapter | **Patterns 2, 7** + cross-domain AI app map |
| CLI, terminal, keyboard, rendering, TUI | **Patterns 6, 9** + cross-domain CLI map |
| agent, multi-agent, coordinator, subagent, orchestration | **Patterns 6, 10, 11, 12** |
| hook, lifecycle, event, pre/post, guard | **Patterns 9, 10, 11** |
| config, migration, settings, environment | **Pattern 11** (Feature Flags as Perimeters) |

**Rules:**
- Match 3-5 patterns maximum. More than 5 dilutes focus.
- If nothing matches, inject the 3 most universally applicable: Patterns 2 (Zero-Trust), 5 (Dual-Position Injection), 7 (Adaptive Denial Tracking).
- If the project IS Inside Claude Code itself, skip injection — the KB is the project.

## Phase 3: Pattern Injection

For each matched pattern:

1. Read the pattern's entry from KB Section 37 (definition + when-to-use)
2. Read the pattern's row from KB Section 44 (package, tier, language, LOC, tests, proof statement)
3. If the pattern appears in Section 43's cross-domain map for this project's domain, read that expanded guidance too

Compose a **Pattern Context Block** — a structured summary injected into session memory:

```markdown
## Active Design Patterns (from KB v2.1)

Loaded by /gsd:prime-patterns — these patterns apply to this project.

### Pattern [N]: [Name]
**Definition:** [one-line from Section 37]
**When to use:** [from Section 37]
**Reference package:** @claude-patterns/[name] ([tier], [lang], [LOC] lines, [N] tests)
**Proof:** [one-sentence from Section 44]
**Project application:** [one sentence explaining how this pattern applies to THIS project specifically]

[Repeat for each matched pattern]

### Cross-Domain Guidance
[If any Section 43 expanded entries match this project's domain, include them here]

### How to Use These Patterns
When Pete describes what he wants to build, check if any active pattern applies before implementing.
- Reference the pattern's package for working code examples
- Apply the pattern's architecture, not just its concept
- If unsure whether a pattern applies, apply it — false positives are cheaper than missed security or performance
```

Write this block to `state/pattern-context.md` (create state/ dir if needed). This file persists across the session and can be referenced later.

## Phase 4: Session Report

Present the combined boot report:

```
Session initialized.
- Project: [name from CLAUDE.md]
- [N] active lessons loaded
- [Current task status or "No active task"]
- [N] specialists deployed (or "No specialists")
- Branch: [current branch] | [clean/dirty]
- Last session: [date and summary if available, or "First session"]

Patterns loaded: [N] from KB v2.1
  → Pattern [N]: [Name] — [one-line project application]
  → Pattern [N]: [Name] — [one-line project application]
  → Pattern [N]: [Name] — [one-line project application]
  [Cross-domain: [domain] guidance included]

Saved to: state/pattern-context.md
Next action: [from STATE.md or todo.md]
```

</process>

<critical_rules>

- **Project-agnostic:** Never hardcode project names, pattern lists, or file paths beyond the KB location. Read everything from the current project's own files.
- **KB path is fixed:** The knowledge base lives at `~/projects/Inside Claude Code/claude-code-technical-knowledge-base-v2.1.md`. If this file doesn't exist, warn and run standard /prime only.
- **3-5 pattern cap:** Auto-detect should never inject more than 5 patterns. Rank by relevance and take the top matches.
- **Don't modify CLAUDE.md:** Pattern context goes to `state/pattern-context.md`, never into CLAUDE.md. CLAUDE.md is the project's permanent identity; patterns are session-level context.
- **Idempotent:** Running twice should overwrite state/pattern-context.md, not append. Safe to re-run.
- **Fast:** This is a session boot command. Target under 30 seconds. Read KB sections by line range, don't read the entire 1800-line file.
- **Skip self:** If the current project IS Inside Claude Code (detected by CLAUDE.md containing "claude-code-patterns" or "@claude-patterns"), skip pattern injection — report "This IS the pattern library. No injection needed."

</critical_rules>

<success_criteria>
- [ ] All /prime boot steps completed (CLAUDE.md, lessons, state, agents, git)
- [ ] Patterns auto-detected or manually specified
- [ ] Pattern context block written to state/pattern-context.md
- [ ] Session report displayed with both project state and active patterns
- [ ] Next action identified
</success_criteria>
