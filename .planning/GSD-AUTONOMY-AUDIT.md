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

<!-- populated in Phase 1 -->

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
