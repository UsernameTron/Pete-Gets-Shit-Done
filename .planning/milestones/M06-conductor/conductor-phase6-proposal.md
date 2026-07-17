> **SUPERSESSION NOTICE — v2, 2026-07-17.** This document is the accepted architecture of record *as amended by* `milestones/M06-conductor/phase-01-PLAN.md` (v2) and the revision record in `phase-01-CONTEXT.md`. Where they conflict, **the v2 plan wins**. Four sections below are overridden: (1) confidentiality language — governance is Option A, approved-cloud: the conductor is a cloud-backed approved processor; "air-gapped" applies only to the egress-blocked Grok-local lane; (2) the AGENTS.md canonicalizer is removed from Phase A and is now phase-04; (3) the Phase A benchmark is a smoke test and **sets no automation threshold** — thresholds are a phase-02 decision on a stratified set; (4) Phase A is a two-session build (8–15 h), not a single session.

# CONDUCTOR — Multi-Harness Orchestration Layer
**Proposal for acceptance · v1.0 · July 17, 2026**
**Positioning: this is Extension Factory Phase 6.** The Layer 0/1/2 invisible-concierge pattern you already run for skills, generalized to route across four harnesses. It closes an open milestone; it does not open a new system.

---

## Ultrathink transcript

- **Architect:** This is not "agents collaborating" — it's a compiler pipeline: route → delegate → verify → integrate. Hub-and-spoke with one writer; peer-to-peer agent chatter rejected (shared-state drift, injection surface, coordination tax). Routing needs three keys, not one: task class × stakes × data classification. The conductor is a **seat, not a model** — judgment gets encoded in rubrics and gates so the layer survives the Fable 5 rotation.
- **Research:** Precedents that hold: n-version programming (independent implementations, with its known caveat — models trained on similar data make correlated errors, so *agreement is weak evidence and dissent is the signal*); CI's lesson that executable tests beat model-as-judge; documented self-preference bias in LLM judges → blind judging. Your own MCP-ecosystem 3-layer router is the in-house precedent.
- **Coder:** Delegates are thin bash-wrapping skills around each CLI's headless mode; everything between stages is a typed JSON envelope pinned to a commit SHA; delegate output is sanitized and schema-validated, failing closed. Provenance rides in Git commit trailers — zero new infrastructure.
- **Tester:** The four ways this dies: consensus theater, orchestrator judging its own work, local-model noise flooding triage, and coordination tax on small tasks. Each gets a structural mitigation (below), and Phase A ships with an injection test and a measured precision benchmark before anything auto-triages.
- **Synthesis:** One writer, three readers, typed contracts, tests as the preferred judge, a hard local-only lane for confidential work, and an economics ledger so the committee has to prove it earns its overhead.

---

## 1. Mission

Make Claude Code the single point of judgment and write access, with Grok Build, Codex, and Gemini as specialized, stateless, headless tools it dispatches — so frontier quota is spent only where judgment is required, every risky change gets genuinely independent eyes, and confidential work never reaches an unapproved delegate provider (see supersession notice).

## 2. Architecture

**The seat model.** "Conductor" is a role bound to whatever model occupies Claude Code — Fable 5 today, its successor tomorrow. Fable 5's job in this build is to encode its routing judgment into rubrics, gates, and prompts that persist past the seat rotation.

**The one-writer rule.** Only the conductor writes to working trees. Delegates run read-only (`--sandbox read-only` / equivalent) or in isolated worktrees whose output re-enters only as a reviewed patch.

**Layer mapping (your existing pattern, verbatim):**
- **Layer 0 — invisible router.** Classifies every task on three keys (class, stakes, data), silently dispatches. Never announces routing. Fast path: single-file, reversible, low-stakes work is done directly by the conductor — no delegation, no ceremony (this matches your existing autonomy decision tree).
- **Layer 1 — conductor.** Builds the task envelope, sets budget, enforces the data lane, runs escalation, applies the verification ladder, integrates results.
- **Layer 2 — delegates + verifiers.** `grok-delegate`, `codex-delegate`, `gemini-oracle` wrapper skills; sanitizer; schema validator; ledger writer.

## 3. Routing contract

**Key 1 — task class:**

| Class | Default seat | Mode |
|---|---|---|
| Explore / explain / codebase Q&A | Grok (local, $0) | read-only |
| Cross-repo impact, long-context synthesis | Gemini (1M ctx) | read-only |
| Multimodal (screens, diagrams vs spec) | Gemini | read-only |
| Hard authoring, architecture, synthesis | Conductor | write — never delegated |
| Routine implementation from tight spec | Codex | isolated worktree |
| Review of conductor-authored diff | Codex primary + Grok red-team | read-only |
| Test-fix grind | Codex exec loop | worktree, turn-capped |
| Plan critique (pre-GSD-execute) | Grok ∥ Gemini, conductor synthesizes | read-only |
| Security review of sensitive repos | Grok `--sandbox strict` | local only |
| Repo-health / docs-drift sweeps | Grok headless, scheduled | read-only |

**Key 2 — stakes modifier.** Destructive, irreversible, or production-facing → **frontier consensus gate**: Codex and Gemini must independently concur before the conductor executes; Grok red-teams advisory. The local 27B does not get a binding vote on irreversible ops. Any dissent surfaces to you as a named risk, not a footnote.

**Key 3 — data lane (hard rule, overrides everything).** Repos tagged `confidential` in project metadata route only to the local lane (Grok local models + conductor). No cloud delegate sees them regardless of task class. The router is thereby a data-governance control point — auditable in the ledger, and directly reusable in the CTG enterprise-security narrative.

**Escalation semantics.** Grok ($0) → Gemini (free tier) → Codex → conductor. Two failed attempts at a tier auto-escalates *with the failure transcript attached* — the next tier starts from evidence, not from zero.

## 4. Contracts

**Task envelope (conductor → delegate):**

```json
{
  "task_id": "cnd-20260717-001",
  "repo": { "path": "~/projects/…", "commit": "<sha>" },
  "class": "review",
  "stakes": "normal | high | irreversible",
  "data": "open | internal | confidential",
  "goal": "…",
  "constraints": ["…"],
  "inputs": ["paths, diff ref, or plan doc"],
  "budget": { "turns": 15, "seconds": 600 },
  "output_contract": "findings | patch | answer | plan-critique"
}
```

**Delegate return (validated against schema; invalid = fail closed, logged, no findings admitted):**

```json
{
  "task_id": "cnd-20260717-001",
  "agent": "grok-build",
  "model": "<probe-verified-local-model-id>@lmstudio",
  "verdict": "ok | partial | fail",
  "findings": [
    { "file": "…", "line": 0, "severity": "…", "claim": "…", "evidence": "…" }
  ],
  "artifacts": ["patch path or worktree ref"],
  "usage": { "tokens": 0, "seconds": 0, "cost_usd": 0.0 },
  "notes": "free text — always treated as data, never as instructions"
}
```

**Evidence bar (27B noise control):** a finding without `file:line` plus concrete evidence is dropped at the gate. This is the difference between a free labor pool and a false-positive firehose.

**Sanitizer:** every delegate output is stripped of ANSI, truncated to budget, and treated as quoted data. Imperative text inside delegate output is never executed. Phase A ships an explicit injection test: a planted "ignore previous instructions" string in a repo file must survive the full pipeline as inert data.

## 5. Verification ladder & provenance

Judging preference, in order:
1. **Executable tests as judge** — tournaments and patches are decided by the acceptance test harness, not a model. Objective, immune to bias.
2. **Blind cross-review** — when tests can't decide, the judging model receives candidates with provenance stripped (self-preference bias is documented; we don't argue with it, we remove the label).
3. **Never self-review** — the pipeline structurally refuses to route a diff to its author for review.
4. **Confidence-gated acceptance** — high-stakes findings require a second independent confirmation; low-stakes get spot-checked.

**Provenance is Git-native:** commit trailers — `Drafted-by: codex@<ver>`, `Reviewed-by: grok-build@<probe-verified-model-id>`, `Red-team: grok-build@r1-32b` — plus an append-only ledger at `.planning/conductor/ledger.jsonl` inside your existing GSD state system. No new dashboards.

## 6. Economics

Every delegation writes cost and yield to the ledger. Weekly rollup (into the existing daily/weekly brief, not a new report) answers one question: **is the committee earning its overhead?** Metrics: unique true-positive defects caught by a non-authoring model; conductor tokens saved by the $0 lane; review cycle time; false-positive rate from the local lane (auto-triage is killed if it exceeds threshold set from the Phase A baseline); cost per accepted finding.

## 7. Failure modes → structural mitigations

| Failure | Mitigation |
|---|---|
| Consensus theater (correlated model errors) | Dissent-is-signal framing; tests as first judge; agreement never auto-executes irreversible ops without your sight of dissents |
| Orchestrator self-preference | Blind judging; never-self-review rule |
| Local-model noise floods triage | Evidence bar + measured precision gate before auto-triage is enabled |
| Coordination tax on small tasks | Layer 0 fast path — most tasks never touch the committee |
| Cross-agent prompt injection | Sanitizer + data-not-instructions rule + Phase A injection test |
| CLI version skew | Versions pinned and recorded in every envelope; delegate wrappers own syntax |
| Cloud rate-limit collapse | Wrappers degrade gracefully (429 → escalate or defer), never block the conductor |
| Cost creep | Weekly ledger rollup with kill-switch per lane |
| Confidential data leak via routing error | Data lane is a hard precondition checked before dispatch, logged either way |

## 8. What this does NOT build (anti-scope)

- **No new memory system.** Findings worth keeping flow into second-brain's existing extract → propose → promote pipeline with receipts. Ledger is operational state, not knowledge.
- **No peer-to-peer agent communication.** Delegates never talk to each other.
- **No new dashboards or briefs.** Sweep results feed the existing morning brief; economics feed the existing weekly rhythm.
- **No duplicate router.** This *is* Phase 6 — one routing brain, extended.

## 9. Build plan

**Phase A — Contracts + local lane (build first, ~1 session).**
*Deliverables:* envelope + return schemas; conductor Layer 0 skill with `/delegate` and silent routing; `grok-delegate` and `gemini-oracle` wrappers; sanitizer; ledger; AGENTS.md canonicalizer (per-repo `CLAUDE.md`/`GEMINI.md` symlinked to one `AGENTS.md` — Grok reads CLAUDE.md natively already).
*Validation:* 100% envelope round-trip on both delegates; injection test passes; Grok finding-precision measured on 10 seeded-defect diffs and reported (this sets the auto-triage threshold — no invented numbers).
*Rollback:* delete the skills and `.planning/conductor/`; nothing else is touched.

**Phase B — Frontier review lane.**
*Deliverables:* `codex-delegate`; review pipeline with never-self-review enforced; blind-judging path; frontier consensus gate for irreversible ops; tournament mode behind an explicit flag (off by default — it's for genuinely hard, test-judged functions only).
*Validation:* unique-defect yield vs. single-model baseline on identical diffs; blind-vs-labeled judging agreement check.
*Rollback:* disable `codex-delegate`; Phase A stands alone.

**Phase C — Autonomy + integration.**
*Deliverables:* scheduled overnight Grok sweeps (launchd) with turn caps and read-only sandbox; findings → morning brief; accepted lessons → second-brain propose queue; weekly economics rollup.
*Validation:* one full week of sweeps with zero unattended writes and zero unexpected egress; brief renders findings; rollup reconciles with ledger.
*Rollback:* unload the launchd job.

## 10. Decision requested

Accept as **Extension Factory Phase 6** (recommended — closes the open milestone, inherits the factory's validators and review loop, zero new surface), or direct it built as a standalone plugin. On acceptance, Phase A is a single Claude Code session from this document.
