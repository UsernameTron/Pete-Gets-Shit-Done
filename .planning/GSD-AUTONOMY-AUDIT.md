# GSD Autonomy Audit — Friction Ledger and Findings

Run: Frontier Autonomy Audit, 2026-07-12, fully autonomous single session.
Mandate: find every place GSD depends on a human interface it doesn't need; classify each; leave execution-ready improvements. Companion artifacts: `FRONTIER-AUDIT-DECISIONS.md` (decision journal), `GSD-IMPROVEMENT-BLUEPRINTS.md` (fix packages).

Claim tags used throughout: `VERIFIED (file:line)` = an agent physically opened the cited location during classification; `INFERRED (basis)` = derived, basis stated. File references are rendered as code spans, never links.

## Phase 0 — Baseline

Measured on disk at `7a43f87` (branch point, == origin/main tip):

| Corpus | Count | Location |
|--------|-------|----------|
| Slash-command definitions | 67 + 4 | `commands/gsd/` + `get-shit-done/commands/gsd/` (checkpoint, daily, harden-repo, workstreams; workstreams duplicated) |
| Engine workflows | 66 | `get-shit-done/workflows/` |
| Runtime lib modules | 24 + CLI | `get-shit-done/bin/lib/*.cjs` + `get-shit-done/bin/gsd-tools.cjs` |
| Hook sources | 6 | `hooks/*.js` (plus unregistered `.claude/hooks/lesson-capture-gate.cjs`, SubagentStop script `scripts/gsd-agent-health-check.sh`, installed-to-user set `governance/templates/global/settings-hooks.json`) |
| Agents | 17 active / 8 archived | `agents/` |

README.md self-report agrees: "67 commands, 17 agents, 6 hooks". The audit prompt's expectations (~76 commands, ~62 workflows, "17 runtime hooks") were stale; "17 hooks" conflates agents with hooks. VERIFIED (measured this run).

Reconciliation anchors — global greps recorded with their exact patterns, for Phase 2 coverage self-checks:

| Pattern (grep -E, case as shown) | Scope | Count |
|---|---|---|
| `AskUserQuestion` | `get-shit-done/workflows/*.md` | 136 occurrences / 34 files |
| `AskUserQuestion` | both command trees | 31 occurrences (mostly `allowed-tools` grants — tracked separately from interaction sites) |
| `\((y/n\|yes/no)\)\|\[y/N\]` (case-insensitive) | workflows + both command trees | 3 |
| `wait for (user\|confirmation\|response\|approval)` (case-insensitive) | workflows + both command trees | 23 occurrences / 14 files |
| `createInterface\|rl\.question` | `bin/install.js` | 6 |

## Phase 1 — Self-Instrumentation Telemetry

Ten GSD commands driven as a user would (emulation protocol per Decision 2). Auto-defaults per Decisions 7–8. Every prompt/wait a human would have absorbed is a row; "flags I had to know" = knowledge the invocation demanded up front.

| Command | Prompts/confirmations hit | Flags I had to know | Wait points | Notes |
|---|---|---|---|---|
| stats | 0 | `json` output mode | 0 | Fully automated. Surfaced state drift: `STATE.md` milestone v2.6 / 0 phases while last-activity records a v2.8 closeout |
| health | 1 (repair consent, workflow layer) | `--repair` | 0 | CLI itself never prompts; W003 (missing config.json) healed; created file is gitignored |
| daily | 0 | none | 0 | Dashboard works via lib; the workflow md's own 3-step env relay is broken as written (see defects) |
| checkpoint | 0 | `--next-action` optional | 0 | `writeCheckpoint` clean; used as the run's phase-boundary anchor |
| check-todos | 1 (todo selection + routing menu, workflow layer) | area filter | 1 | CLI scan is pure JSON; todos dir absent → 0 todos |
| verify-work (automated UAT) | 0 | `--phase N` | 0 | CRASHED — see defects. The automation-residue pattern itself could not be measured on this repo state |
| prime-patterns | 0 | `--patterns` | 0 | Inline command (workflow-exempt). KB at `~/projects/Inside Claude Code/` absent → pattern injection degraded; boot reads succeed |
| audit-agents | 0 prompts — inverse finding: default is an UNGATED auto-commit to a fresh `chore/ecosystem-audit-<ts>` branch (`commands/gsd/audit-agents.md:24`, `:111`) | `--no-commit` to suppress | 0 | Verdict FLAG. 17/17 installed; 8/17 install drift (tilde-vs-$HOME only); 3 description flags unremediated since 2026-05-08 |
| map-codebase | 1 (Refresh/Update/Skip menu, `map-codebase.md:56`) + secrets-scan pause designed at `:301-304` (not hit) | none | 2 | 4 mappers ran parallel per the workflow's own prescription; 7 docs refreshed |
| ecosystem-map | 4 (invocation flags; `--exec` offer `:85`; `--review` offer `:106`; no-commit handoff `:111`) | `--exec/--dry-run/--review/--baseline` | 1 | Full run: 241 components, zero count drift, exactly one drift-history row appended; 5 doc-claim rows refreshed |

**Live-caught engine defects (all hit while driving, not hypothesized):**

1. `uat run-automated --phase 0` crashes with an unhandled `ENOENT: scandir .planning/phases` raw stack at `get-shit-done/bin/gsd-tools.cjs:767` when the phases dir doesn't exist — no graceful error path. VERIFIED (live crash + source).
2. `get-shit-done/workflows/daily.md:30-45` passes `DAILY_STATE="$DAILY_STATE"` positionally after `node -e` (argv, not env) and never exports it — executed as separate Bash steps, step 2 dies on `JSON.parse(undefined)`. Reproduced live; lib works when the variable is properly exported. VERIFIED.
3. `commands/gsd/prime-patterns.md:31` hardcodes KB path `~/projects/Inside Claude Code/claude-code-technical-knowledge-base-v2.1.md` — non-portable home-directory dependency; boot degrades silently when absent. VERIFIED (live).
4. Agent-skills lookups reference 5 non-roster identifiers (`gsd-researcher`, `gsd-checker`, `gsd-synthesizer`, `gsd-advisor`, `gsd-ui-reviewer`) across 9 workflow call sites with stderr suppressed — silent skill-injection failure; `buildAgentSkillsBlock` at `get-shit-done/bin/lib/init.cjs:1978`. VERIFIED (audit-agents drive).
5. `gsd-verifier` frontmatter pins model `opus`, which matches no column of its `model-profiles.cjs` row (quality/balanced=sonnet, budget=haiku). VERIFIED (audit-agents drive).
6. Coverage policy is documented (CLAUDE.md thresholds 90/80/95) but enforced nowhere — no `check-coverage` keys in `.c8rc.json`/package scripts; `scripts/ci-coverage-report.sh` reads a `coverage-summary.json` that no script generates. Live coverage 91.74% vs documented 91.82%. VERIFIED (concerns mapper, live runs).
7. `uat-patterns.cjs` regex captures flow into `execSync` without sanitization; `security.cjs` exports an unused `validateShellArg()` that would close the gap. VERIFIED (concerns mapper read).
8. Ecosystem-map friction: supporting-asset counting rule doesn't specify recursion (flat `ls` undercounts 25-file dirs as 2); Drift History rows lack a commit column (two identical-date rows now distinguishable only by baseline text); the map's recorded generation commit `ba6e910` doesn't exist in this clone's history. VERIFIED (eco drive).
9. Session hook telemetry: the SubagentStop hook (`scripts/gsd-agent-health-check.sh`, the only hook registered in `.claude/settings.json`) fired on every subagent completion and logged real DRIFT lines to `.planning/agent-health.log` (8 agents differ repo-vs-installed, path-syntax only). The hook observed the audit observing the system. VERIFIED (live log, committed).

**Portability friction (Decision 2 substitutions):** every workflow invocation of the runtime hardcodes `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` (e.g. `map-codebase.md:34,:36,:315`, `research-phase.md:45`, `daily.md`, `checkpoint.md:41`) — the engine cannot run from a bare clone without path substitution; recorded per-command above.

## Phase 2 — Lens Findings

<!-- populated in Phase 2: ARCHITECT control-flow maps, RESEARCH precedent inventory, seed-staleness dossier -->

## Phase 3 — The Friction Ledger

<!-- populated in Phase 3: full classified table + headroom stat -->

## Gate List — Irreversibles Deferred to the Operator

<!-- populated in Phases 3-6 -->

## Open Disputes — Design Calls Awaiting the Operator

<!-- populated in Phase 5 -->

## Appendix A — Classified Interaction Inventory (raw)

<!-- serialized in Phase 2 -->
