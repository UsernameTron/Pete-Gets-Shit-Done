# CONDUCTOR — Phase 01 (v2)
# Contracts & Local Lane

**Revision:** v2 — integrates the independent review of 2026-07-17; see phase-01-CONTEXT.md revision record.
**Solution:** Hub-and-spoke multi-harness router — Claude Code as sole writer and approved processor of record; Grok Build (local) and Gemini as contract-bound, structurally read-only delegates.
**Owner:** Connor · **Date:** 2026-07-17
**Estimated build time:** 8–15 hours across two sessions; first value (first logged delegation) in session one.
**GSD lifecycle state:** PHASE_PLANNED → PHASE_EXECUTING on first commit.

## Success condition (the gate this phase is judged by)

Phase 01 succeeds when one pilot repository can be classified deterministically from local metadata, routed to either the approved local Grok lane or a read-only Gemini lane, returned through a versioned internal contract, recorded with traceable provenance, and evaluated without any delegate modifying source files.

## What you're building

The contracts, two delegate adapters, classification gate, router, fixtures, and log that let Claude Code hand work to a fully local Grok Build lane and a read-only Gemini lane and get back structured findings it treats as untrusted data until verified. One pilot repository. No cross-repo changes.

## Strategic frame

Frontier quota reserved for judgment; high-volume work on a $0 local lane; a data-classification gate that decides which *delegate providers* may see content, with Claude Code as the approved processor under Anthropic commercial terms. The word "air-gapped" applies only to the Grok-local lane with egress technically blocked — nowhere else. Built by the factory's own generators.

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │ CLAUDE CODE — conductor (cloud, APPROVED │
                    │ processor of record) · sole writer       │
                    │  classification gate → route → verify    │
                    └────────┬─────────────────┬──────────────┘
     envelope (JSON, SHA-pinned) ▼             ▼
      ┌─────────────────────────┐   ┌─────────────────────────────┐
      │ grok-delegate (LOCAL)    │   │ gemini-oracle (CLOUD,        │
      │ loopback-only endpoint   │   │ approved-data classes only)  │
      │ read-only sandbox        │   │ plan mode + write-stripped   │
      │ web/MCP tools disabled   │   │ snapshot (fs-level RO)       │
      └───────────┬─────────────┘   └──────────────┬──────────────┘
                  ▼  provider JSON = TRANSPORT ONLY ▼
      ┌───────────────────────────────────────────────────────────┐
      │ adapter: extract → normalize → validate return.v1 →        │
      │ fail closed · findings = UNTRUSTED DATA (allowlisted        │
      │ fields, length-limited, no tool call ever triggered by      │
      │ delegate output alone)                                      │
      └───────────────────────┬───────────────────────────────────┘
                              ▼
      │ append-only application log (hash-chained JSONL)            │
      │ .planning/conductor/ledger.jsonl                            │

HARD PRECONDITIONS at dispatch: data-class check (missing = confidential)
+ secret pre-scan on any cloud-bound context. Ambiguity = NO DISPATCH.
```

## Phase 0 — Pre-flight & decisions

**0.1 Governance model.** ANSWER: Option A — approved-cloud governance. Confidential content may be processed by the conductor (approved processor) but never dispatched to a cloud *delegate*. Option B (local pre-router) deferred; recorded in CONTEXT.
**0.2 Classification taxonomy.** ANSWER: `.conductor/data-class` ∈ `open | internal-local-only | internal-cloud-approved | confidential`. **Missing marker = confidential.** Cross-repo tasks: highest classification wins. Marker classifies the repo; the secret pre-scan (0.7) guards the payload.
**0.3 Schemas.** ANSWER: JSON Schema draft-07; `envelope.v1` and `return.v1`; frozen at gate. `return.v1` uses the **location union**: `{type: line|file|repository|cross_repository, path?, line_start?, line_end?, content_hash?}`. Line findings require path + range + evidence snippet (+ snippet hash); broader findings require multiple cited artifacts or an explicit `unverified: true`.
**0.4 Grok locality criteria (all must hold).** ANSWER: configured `base_url` resolves to `localhost`/`127.0.0.1`; model ID matches the intended LM Studio model; a test completion **succeeds with outbound egress blocked**; web-search/web-fetch and remote MCP tools disabled in the wrapper invocation (exact flag names from the Phase 1 probe); `--sandbox read-only` active; wrapper records actual model + endpoint in every return. A model name in `grok inspect` proves nothing by itself.
**0.5 Gemini read-only mechanism.** ANSWER: plan/approval mode (probe-verified flag) **plus** filesystem enforcement — the wrapper exports a snapshot (`git archive` → temp dir, `chmod -R a-w`) and runs Gemini inside it. The patch-contract refusal remains as a third, application-level layer.
**0.6 Provenance & language.** ANSWER: every ledger entry and return carries `{repo_commit, model_id, model_file_hash?, provider_endpoint, cli_version, wrapper_version, prompt_hash, schema_version, runtime_settings, timestamp}`. Described as **traceable and repeatable under comparable conditions** — never "reproducible."
**0.7 Cloud-dispatch secret pre-scan.** ANSWER: outbound context for any cloud lane is scanned against a secret-shape regex set (key prefixes, PEM headers, token formats). Any hit blocks dispatch and logs. Deeper payload classification is phase-02 hardening.
**0.8 Ambiguity policy.** ANSWER: ambiguous or unresolvable classification → **no dispatch**, surface to Connor. Ambiguous capability route → local lane. Delegate unavailable → return `blocked`/`partial`. "Self" is a cloud lane and is never the ambiguity default.
**0.9 Pilot repository.** ANSWER: one non-confidential repo (operator's choice at session start). No other repository is read or modified in this phase.
**0.10 Locking & log.** ANSWER: mkdir-based lock is the portable default (macOS ships no `flock(1)` command). The ledger is an **append-only application log** — append-only by convention, tamper-evident by hash chain (`previous_entry_hash`, `entry_hash` per line). Two record kinds from day one: `delegation` and `adjudication` — the adjudication record captures the operator's accept/reject/unverified disposition per finding (`{record_kind, task_id, finding_ref, disposition, adjudicator, timestamp}`), chained identically. Rationale: capability profiles and the golden set (phase-02) inherit labeled ground truth instead of retrofitting labels onto unlabeled history.

## Session 1 — Contracts, adapters, first delegation (4–5 h)

### 1. Interface probe
**Where:** Claude Code terminal, factory repo. **Action:** capture real installed interfaces.
```bash
mkdir -p .planning/conductor && { echo "# CAPABILITIES — $(date -u +%F)"; grok --version; grok --help; echo ---; gemini --version; gemini --help; } > .planning/conductor/CAPABILITIES.md 2>&1
```
**Expect:** both version strings + help. **If it fails:** entry criteria unmet; stop.

### 2. Contracts
**Action:** author `schemas/envelope.v1.schema.json` and `schemas/return.v1.schema.json` per 0.3 and 0.6 (location union + provenance block). Validate fixtures:
```bash
npx ajv-cli validate -s .planning/conductor/schemas/return.v1.schema.json -d .planning/conductor/fixtures/return.sample.json
```
**Expect:** `valid`. **If it fails:** ajv names the field; schemas follow the spec, samples follow the schemas.

### 3. Shared library
**Action:** `lib/normalize.sh` (strip ANSI, length-limit, extract into allowlisted fields only), `lib/ledger.sh` (mkdir lock; compute `entry_hash = sha256(previous_entry_hash + line)`; append; supports both record kinds per 0.10). **Expect:** hash chain verifies with a 5-line replay check; two concurrent appends yield two intact chained lines. **If it fails:** fix before anything writes to the log.

### 4. grok-delegate (factory-generated skill)
**REQUIRES NEW SKILL — build via skill-factory, validate via extension-validator.**
**Action:** wrapper enforces every 0.4 criterion before dispatch (refuses non-loopback endpoints outright); invokes headless with read-only sandbox and tool-denylist flags from CAPABILITIES; treats CLI JSON as transport: extract result → normalize → validate `return.v1` → fail closed with raw output archived to `failures/`. **Expect:** locality self-check passes, then a schema-valid return on a sample envelope against the pilot repo. **If it fails:** parse failure = verdict `fail`, zero findings admitted, logged.

### 5. gemini-oracle (factory-generated skill)
**Action:** wrapper builds the write-stripped snapshot per 0.5, runs plan-mode headless inside it, same adapter pipeline; refuses `patch` contracts; 429 → `partial` with retry note, never blocks.
**Expect:** round-trip on a cross-file question; a deliberate write attempt inside the snapshot **fails at the filesystem**. **If it fails:** snapshot permissions wrong — fix before any real content flows.

**Session 1 exit:** first real delegation on the pilot repo, logged with full provenance. This is first value; it is not gate-ready.

## Session 2 — Router, fixtures, gates (4–6 h; +2–4 h hardening contingency)

### 6. Conductor Layer 0 skill (factory-generated)
**Action:** routing table from the proposal §3; three-key evaluation with 0.2/0.7/0.8 policies as hard preconditions; fast path for single-file reversible low-stakes work; `/delegate` command; silent otherwise. When the operator accepts or rejects a delegated finding in-session, the conductor writes an `adjudication` record for it. Prompt imports fable5 fragments verbatim: `boundaries`, `grounded-progress`, `scope-restraint`, `autonomous-continue`. **No tool call is ever triggered solely by delegate output; privileged actions require independent verification by the conductor.**
**Expect:** confidential-marked test repo + any cloud-suited class → local route with override logged; missing marker → treated confidential; unresolvable classification → no dispatch, surfaced. **If it fails:** router bug; gates cannot start.

### 7. Fixtures
**Action:** (a) Injection suite — six case classes: fake system messages, instruction-bearing JSON fields, malicious filenames, evidence snippets requesting tool use, encoded instructions, commands disguised as remediation advice. (b) Benchmark set — 10 seeded-defect diffs **plus 5 clean diffs**, with answer key. **Expect:** committed, key validates. 

### 8. Gates (all must pass before PHASE_AWAITING_VERIFY)

| Gate | Pass criterion | If fail |
|:---|:---|:---|
| Locality | Grok completion succeeds with egress blocked; endpoint recorded is loopback | Fix config; re-run |
| Read-only (Gemini) | Write attempt inside snapshot fails at filesystem; plan mode confirmed | Fix snapshot; re-run |
| Round-trip | 100% schema-valid `return.v1` from both adapters | Fix adapter |
| Injection suite | All six classes inert end-to-end — no derived tool call, no privileged action | Harden; re-run before any further use |
| Classification | Missing→confidential, highest-wins, secret pre-scan block, no-dispatch on ambiguity — each demonstrated | Fix router |
| Log integrity | Hash chain verifies over the session's entries; one `delegation` record per dispatch; adjudication records chain identically | Fix lib |
| Benchmark (smoke) | Report generated over 10 seeded + 5 clean diffs: precision, recall, clean-diff false-positive rate. **Sets no automation policy** — thresholds are a phase-02 decision on a stratified set | Report regardless; numbers are information |
| Factory + GSD | extension-validator green on all three skills; `/gsd:verify-work` green | Address findings |

## Security & governance

One writer, enforced structurally: Grok sandboxed read-only on a loopback-only endpoint with web/MCP disabled; Gemini in plan mode inside a write-stripped snapshot. Delegate output is untrusted data — allowlist-parsed, length-limited, never a trigger for tool calls, with the injection suite re-run on every wrapper change. Data lane governs delegate providers; the conductor is the approved processor of record; missing classification fails to confidential; cloud dispatch is secret-scanned; ambiguity never dispatches. The log is tamper-evident by hash chain. No secrets in the log.

## Cost projection

Local lane $0 marginal; Gemini free tier for tests; Codex $0 (phase-02). ~$0 this phase.

## Success metrics (measurement horizons — not phase-01 scope)

**Gate-pass:** all eight gates green; ≥1 real delegation with full provenance. **30 days (observed):** share of exploration/Q&A on the $0 lane; conductor-token savings. **90 days (observed):** unique true-positive findings per week from non-authoring models at acceptable false-positive cost.

## Risks & mitigations

| Risk | L | I | Mitigation |
|:---|:--|:--|:---|
| Cloud-lane data exposure via misroute | L | H | Missing=confidential; highest-wins; secret pre-scan; no-dispatch on ambiguity; log both ways |
| Injection via delegate output | L | H | Allowlist parse + no-derived-tool-calls rule + six-class suite as a standing gate |
| Local-model noise | M | M | Location-union evidence bar; benchmark reports; no auto-triage this phase |
| CLI flag/behavior drift | M | M | Probe re-run per CLI update; wrappers own syntax; snapshot/locality tests re-run |
| Cost creep | L | M | Per-call cost in log; per-lane kill switch (phase-03 rollup) |
| Vendor security incident | L | H | Confidential confined to local lane; conductor approved-processor terms on record |
| Key-person dependency | H | L | Everything in-repo, GSD-documented |
| Scope creep | M | M | Canonicalizer and thresholds explicitly out; `scope-restraint` fragment in router |

## Where each step lives

| Action | Tool |
|:---|:---|
| Phase 0 | This document (answered) |
| Steps 1–3, 7–8 | Claude Code terminal, factory repo |
| Steps 4–6 | Factory generators → extension-validator |
| Gate sign-off | Connor |

## Two-session checklist

```markdown
Session 1 (4–5 h)
- [ ] 0.4/0.5 verifications + Step 1 probe
- [ ] Step 2 schemas (location union + provenance) + fixture validation
- [ ] Step 3 lib (mkdir lock, hash chain) + replay check
- [ ] Step 4 grok-delegate + locality self-check
- [ ] Step 5 gemini-oracle + snapshot write-fail test
- [ ] First logged delegation on pilot repo → commit; STATE note "session 1 complete"

Session 2 (4–6 h, +2–4 h contingency)
- [ ] Step 6 conductor + classification demonstrations
- [ ] Step 7 fixtures (six-class injection suite; 10 seeded + 5 clean)
- [ ] Step 8 all eight gates; benchmark report to Connor
- [ ] /gsd:verify-work → advance STATE to PHASE_AWAITING_VERIFY
```

## Rollback plan

```bash
git -C ~/projects/Pete-Gets-Shit-Done revert <phase-01 commits>
rm -rf ~/.claude/skills/conductor ~/.claude/skills/grok-delegate ~/.claude/skills/gemini-oracle
rm -rf ~/projects/Pete-Gets-Shit-Done/.planning/conductor
```
Now true as stated: nothing outside the factory repo and `~/.claude/skills/` is touched in this phase. The pilot repo is read, never modified. Repo migration (formerly the canonicalizer) is phase-04, with its own per-repo git rollback.
