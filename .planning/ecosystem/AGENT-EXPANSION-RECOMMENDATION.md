---
title: GSD Agent-Expansion Recommendation
date: 2026-07-13
question: "Does this project need new or special sub-agents?"
verdict: NO net-new agents recommended
method: get-shit-done/references/agent-necessity-gate.md (2-of-3 gate)
scope: 17 product agents (agents/gsd-*.md) + 3 dev-meta agents (.claude/agents/)
inputs: crew --assess refresh (coverage/overlap/quality/efficiency) + ecosystem hygiene audit (FLAG)
status: local/uncommitted (advisory)
---

# GSD Agent-Expansion Recommendation — 2026-07-13

## Verdict

**No net-new agents recommended.** Zero candidates clear GSD's own necessity gate (≥2 of 3 checks must PASS). The roster is healthy — hygiene audit returns **FLAG, no BLOCK** — and, if anything, **over-provisioned**: 8+ agents have no trigger surface in the current context. Every actionable gap resolves to **wiring, hygiene, or instrumentation — not a missing agent.**

This is not a "we looked and shrugged" answer. It is what GSD's own governance is designed to produce: the necessity gate exists explicitly to *prevent* agent proliferation, the active 9-blueprint autonomy initiative proposes zero new agents, and a candidate workflow named `stand-up-agents` was already evaluated and dropped for lack of evidenced demand.

## Execution status — 2026-07-13

Acted on this recommendation the same day (commit `94879d4` on `claude/agent-execution-plan-p87klo`):

- **Items 1 & 2 (forensics, plan-milestone-gaps wiring) — WITHDRAWN as false positives.** Reading the two workflows plus `git log` showed neither ever spawned an agent to "regress" from. `/gsd:forensics` is a read-only *interactive* investigation whose evidence must stay in the main context for follow-up (and `gsd-debugger` is a code-bug debugger — wrong role); `/gsd:plan-milestone-gaps` is roadmap bookkeeping that already defers planning to `/gsd:plan-phase`. Both are inline by correct design. The "zero spawns" signal was a coverage heuristic, not a defect.
- **Item 3 (5 phantom `agent-skills` refs) — DONE.** 9 lookups across 8 workflows realigned to the real agent each spawns.
- **Item 4 (install drift) — DONE (env-local).** 8 drifted installed copies resynced to 0.
- **Item 5 (frontmatter hygiene) — DONE.** `disallowedTools: Edit` ×2, dispatch keywords ×3.
- **Item 6 (spawn-telemetry instrument) — PENDING operator decision.** Only a PreToolUse(Task) hook can attribute the spawning agent, so it is a net-new hook + dist build + settings registration + tests + doc-count updates — a feature, not a fix. Recommended as its own change rather than folded into the autonomy PR.

Verified green before commit: 2945/2945 tests, coverage thresholds, doc-drift 23/23, doc-links 299 valid, security scans 0 findings.

## Method

Each candidate is scored against the three-part gate in `get-shit-done/references/agent-necessity-gate.md`:

1. **Context Pollution** — would doing this inline dilute the main context? (>2000 tokens scratch / >5 files / open-ended search → PASS)
2. **Parallelizability** — can it run concurrently, independent of conversation state? (PASS) or must it complete before the next step? (FAIL)
3. **Specialization** — does it need a *different* tool set, permission mode, model, or isolation than the caller already has? (PASS) or do the caller's tools suffice? (FAIL)

**Rule:** ≥2 PASS → build. Single-PASS → AMBIGUOUS (ask the operator), except a security/compliance specialization-only case may be promoted. All-FAIL → inline is correct.

## Roster at a glance

| | Count | State |
|---|---|---|
| Product agents (`agents/gsd-*.md`) | 17 | All spawned by a real command/workflow; 0 orphans. opus×3, sonnet×8, haiku×6 |
| Dev-meta agents (`.claude/agents/`) | 3 | plugin-developer, test-runner, docs-sync — all 10/10 hygiene; invoked by Claude Code description-matching, not GSD routing |
| Archived (`agents/_archived/`) | 8 | Install-safe; consolidation lineage documented |
| Hygiene verdict (2026-07-13 audit) | FLAG | 2 tool/perm nits, 3 description nits, 7 benign install-drift items. No BLOCK |
| Spawn distribution | verifier-dominant | verifier(48) > research-orchestrator(37) > planner(35) > executor(23); UI trio, roadmapper, synthesizer, mapper, profiler, advisor, assumptions, dep-auditor effectively dormant in current context |

## Candidate evaluation

Candidates were sourced from the refreshed coverage gaps, the efficiency analysis, and the ad-hoc patterns in recent work. Each is run through the gate:

| Candidate (source) | Context | Parallel | Special | Gate outcome | Verdict |
|---|:---:|:---:|:---:|---|---|
| **Forensics investigator** — `/gsd:forensics` spawns zero agents (regressed since April) | PASS | FAIL | FAIL | **FAIL** (context alone insufficient) | **DON'T BUILD** → the existing `gsd-debugger` already *is* the specialist (scientific-method investigation, WebSearch). Restore the regressed spawn. |
| **Milestone-gaps planner** — `/gsd:plan-milestone-gaps` spawns zero agents | PASS | FAIL | FAIL | **FAIL** | **DON'T BUILD** → route to existing `gsd-planner` / `gsd-roadmapper`. |
| **Milestone-completion auditor** — `/gsd:audit-milestone` (April gap) | PASS | FAIL | FAIL | **FAIL** | **ALREADY RESOLVED** → now routes to `gsd-verifier` (`audit-milestone.md:84`). No action. |
| **Parallel-audit-slice agent** — Frontier Audit used 21 ad-hoc slice subagents | PASS | PASS | **FAIL** | **AMBIGUOUS** (2/3; no specialization) | **DON'T BUILD (as agent)** → the slices are a *prompt*, not a distinct tool/model/permission need. Capture as a **workflow** or reusable slice-prompt template — which is exactly GSD's current direction. |
| **Workflow-author agent** — the dominant current work | FAIL | FAIL | FAIL | **FAIL** | **DON'T BUILD** → `plugin-developer` covers it, and CLAUDE.md explicitly says the main context should own authoring/orchestration. |
| **docs-sync → `/gsd:sync-docs`** wiring | — | — | — | n/a (wire-existing) | **NO ACTION** → running sync-docs inline is a deliberate decision (D-10/D-11: "fundamentally a find-and-replace"). The agent exists if you ever want delegated sync. |
| **Spawn-telemetry / observability** — no per-agent spawn ledger exists | — | — | — | n/a (not an agent) | **OUT OF SCOPE** → this is a hook/JSONL *instrument*, not an agent. Noted as a possible future improvement. |
| **5 phantom `agent-skills` refs** — gsd-checker, gsd-synthesizer, gsd-researcher, gsd-advisor, gsd-ui-reviewer | — | — | — | n/a (naming bug) | **FIX NAMING** → correct the `agent-skills <name>` lookup strings to the real agent filenames. Not new agents. |

**Result: 0 of 8 candidates clear the gate.** The only non-FAIL case (parallel-audit-slice) is AMBIGUOUS and fails precisely on the dimension that distinguishes an agent from a prompt — specialization — so per the gate it does not become an agent.

## Why the answer is "no," in one paragraph

The evidence points the same direction from four independent angles. **Governance:** GSD ships a necessity gate whose stated purpose is to stop agent proliferation, and nothing clears it. **Direction:** the last ~12 commits touch workflows, gates, config, and docs — zero touch `agents/`; the 324KB autonomy audit recommends zero new agents; `stand-up-agents` was dropped. **Utilization:** the roster is verifier-heavy with a long tail of dormant agents (the UI trio has no frontend surface in a CLI plugin), so capacity is surplus, not scarce. **Gaps:** every real gap is a severed wire (forensics, plan-milestone-gaps), a naming bug (5 agent-skills refs), or stale install copies (7 drift items) — all fixable without authoring a single new `.md`.

## Actionable items (all non-agent, in priority order)

1. **Restore `/gsd:forensics` → `gsd-debugger` spawn** (regression; the workflow currently investigates with no agent).
2. **Wire `/gsd:plan-milestone-gaps`** to `gsd-planner`/`gsd-roadmapper` (currently spawns nothing).
3. **Fix the 5 phantom `agent-skills` lookup names** so the skills-hint variable is populated (low-severity live bug — real spawns already use correct agents).
4. **Resync the 7 drifted installed agent copies** (`cp agents/gsd-*.md ~/.claude/agents/` or reinstall) — clears the standing drift signal that dominates `agent-health.log`.
5. *(Optional hygiene)* Add `disallowedTools: Edit` to `gsd-research-orchestrator` and `gsd-ui-researcher`; add dispatch keywords to the 3 parametrized agents' descriptions (verifier, validator-hub, research-orchestrator).
6. *(Optional)* Add a first-class spawn-telemetry instrument (hook + persisted JSONL) — the one genuinely missing capability, and it is an instrument, not an agent.

None of these is a new agent. Items 1–3 are wiring fixes; 4–5 are hygiene; 6 is instrumentation.

## What would change this answer

A new agent becomes justified only when a candidate clears ≥2 gate checks — realistically when a **genuinely new domain with distinct tooling** appears:

- A **security/compliance reviewer** with read-only isolation and a threat-model prompt — the gate's explicit specialization-only promotion case. (GSD retired `gsd-security-guardian` when runtime enforcement moved to hooks; a design-time reviewer could return if design-time security review becomes a recurring need.)
- A **new product surface** — e.g., if GSD grows a real frontend, the dormant UI trio reactivates (no new agent needed) or a genuinely new UI specialization emerges.
- A **recurring large-scale parallel workload** that needs a *distinct tool set or model* (not just a slice prompt) — at which point the parallel-audit-slice candidate would flip from AMBIGUOUS to PASS.

Until one of those appears, the correct move is to keep solving recurring work with **workflows, gates, config, and agent-wiring** — which is what the project is already doing.

---
*Generated by an agent-necessity-gate synthesis over a refreshed `/gsd:crew --assess` and the 2026-07-13 ecosystem hygiene audit. Diagnostic + advisory; no agents were created or modified. Kept local/uncommitted per operator choice.*
