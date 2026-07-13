# GSD Workflow Design Recommendations

**Purpose:** Group existing GSD commands into named autonomous workflows — the same pattern as W1–W6 — so common multi-command sequences become one intent. No code changes: every workflow is a routing/orchestration layer (a `get-shit-done/workflows/*.md` file plus a `/gsd:do` routing-table entry) that invokes existing commands verbatim.

**Method:** All 67 commands were mapped against the 6 foundational workflows (W1 daily-startup, W2 idea-to-shipped, W3 bug-to-branch, W4 quick-change, W5 smart-discuss, W6 wrap-and-sync — numbering per the shipped files).

**Implementation status (2026-07-13):** W1–W6 shipped via the autonomous-workflows build-out (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) as `get-shit-done/workflows/<name>.md` files routed as `workflow:<name>` rows in `/gsd:do`. W8–W13 below were then implemented in that same convention. W7 (milestone-rollover) is NOT built — its `ship-milestone` equivalent was shelved by the operator on 2026-07-12 until `/gsd:finalize`'s ungated pushes are repaired. W14 was folded into W10 as `--deep`.

---

## Design principles (extracted from W1–W6)

These are the rules the existing workflows already follow. New workflows should match them so the suite stays coherent:

1. **One intent, one workflow.** Each workflow answers a single sentence a user would actually say ("close out this milestone"), not a category of work.
2. **Compose, never reimplement.** The workflow file only sequences existing commands and passes arguments through. If a step needs new logic, that's a command change — out of scope.
3. **Gates only at irreversible points.** Human confirmation before anything that pushes, merges, deletes, archives, or tags. Everything read-only or local-commit runs unattended. W2 proved two gates is the right ceiling.
4. **Fail loud, hand off clean.** On any step failure: stop, write state (checkpoint/pause-work), tell the user which command to resume with. Never push through a broken step.
5. **First match wins in `/gsd:do`.** Every new workflow gets 2–3 trigger phrases added to the routing table, ordered above the single commands they supersede.

---

## Coverage map — what W1–W6 already own

| Lifecycle moment | Owned by |
|---|---|
| Session start | daily-startup (W1) |
| Idea → PR | idea-to-shipped (W2) |
| Bug → shipped fix | bug-to-branch (W3) |
| Small verified change | quick-change (W4) |
| Session end | wrap-and-sync (W5) |
| Discussion intake | smart-discuss (W6) |

**The gaps:** milestone transitions, brownfield adoption, the ship/merge tail, quality sweeps, frontend phases, review-hardened planning, backlog grooming, and ecosystem health. Eight candidates below, ranked.

---

## Recommended workflows

### W7 — `milestone-rollover` (highest value)

**Intent:** "Close out this milestone and start the next one."
**Why:** This is the longest hand-chained sequence in GSD today — 6 to 8 commands, run maybe monthly, easy to do out of order (completing before auditing, forgetting cleanup, losing seeds).

**Chain:**
```
/gsd:audit-milestone
  → if gaps: /gsd:plan-milestone-gaps → [GATE 1: execute gap phases or defer?]
/gsd:audit-uat
/gsd:milestone-summary
[GATE 2: archive + tag]
/gsd:complete-milestone
/gsd:cleanup
/gsd:new-milestone            # scans planted seeds automatically
```
**Gates:** 2 — gap disposition, and the irreversible archive/tag.
**`/gsd:do` triggers:** "close out this milestone", "wrap the milestone", "start the next version".

---

### W8 — `adopt-codebase`

**Intent:** "Put this existing repo under GSD."
**Why:** Brownfield onboarding is GSD's front door for every non-greenfield project, and today it's tribal knowledge which commands to run in which order.

**Chain:**
```
/gsd:map-codebase             # parallel mappers → .planning/codebase/
/gsd:new-project --auto       # seeded from the codebase map
/gsd:health                   # validate the .planning/ it just built
/agent-setup                  # governance layer: deploy project agents
/gsd:profile-user             # optional, offered not forced
[GATE: review PROJECT.md + ROADMAP.md before first phase]
```
**Gates:** 1 — accept the generated project definition.
**Triggers:** "adopt this repo", "put this codebase under GSD", "onboard this project".

---

### W9 — `ship-and-merge`

**Intent:** "This phase is done — get it merged."
**Why:** The verified-phase → merged-PR tail is 4–5 commands with a wait state (CI) in the middle. bug-to-branch covers this only for bugs; regular phases still chain it manually.

**Chain:**
```
/gsd:verify-work N            # skip if UAT already passed
/gsd:add-tests N              # only if phase lacks test coverage
/gsd:pr-branch                # clean branch, .planning/ filtered
[GATE 1: open the PR]
/gsd:ship N
/gsd:ci-watch                 # poll, stream, auto-diagnose failures
  → on red: /gsd:debug with the CI failure, then re-run suite
[GATE 2: merge]
```
**Gates:** 2 — PR creation and merge. CI failure loops back through debug without a gate (matches W3's philosophy).
**Triggers:** "ship phase N", "get this merged", "phase is done, PR it".

---

### W10 — `quality-sweep`

**Intent:** "Audit everything and tell me what's broken."
**Why:** GSD has five audit commands that are all read-only and independent — a textbook parallel group. Run individually they get skipped; run as one sweep they become a habit.

**Chain (all parallel, then one consolidated report):**
```
/gsd:health          ─┐
/gsd:audit-uat        ├─ parallel → consolidated findings report
/gsd:audit-deps       │
/gsd:audit-agents     │
/gsd:validate-phase  ─┘  (last executed phase)
[GATE: apply repairs?] → /gsd:health --repair, /gsd:add-tests for gaps
```
**Gates:** 1 — findings are read-only; only remediation gates.
**Triggers:** "quality sweep", "audit everything", "health check the project".
**Note:** ideal candidate for a weekly scheduled run — findings-only, zero mutation risk.

---

### W11 — `frontend-phase`

**Intent:** "Run phase N, it's UI work."
**Why:** Frontend phases have two extra commands (ui-phase before, ui-review after) that idea-to-shipped doesn't include. Users either forget the UI-SPEC contract or bolt on the review late.

**Chain:**
```
/gsd:ui-phase N               # design contract first
/gsd:discuss-phase N          # (smart-discuss variant)
/gsd:plan-phase N
[GATE 1: approve plan + UI spec]
/gsd:execute-phase N
/gsd:ui-review N              # 6-pillar visual audit
/gsd:verify-work N
[GATE 2: accept or route fixes]
```
**Gates:** 2 — mirrors idea-to-shipped exactly, with the UI contract folded into gate 1.
**Triggers:** "build the UI phase", "run phase N with UI review", "frontend phase N".

---

### W12 — `hardened-plan`

**Intent:** "Plan this phase with cross-AI review baked in."
**Why:** The review loop (plan → /gsd:review --all → plan-phase --reviews) exists but nobody remembers the replan flag. For high-stakes phases it should be one intent.

**Chain:**
```
/gsd:discuss-phase N --batch
/gsd:list-phase-assumptions N
[GATE 1: assumptions correct?]
/gsd:plan-phase N
/gsd:review --phase N --all
/gsd:plan-phase N --reviews   # fold feedback back in
[GATE 2: approve final plan]
```
**Gates:** 2 — assumptions check (cheap, early) and final plan approval.
**Triggers:** "plan phase N carefully", "hardened plan", "plan with review".

---

### W13 — `groom-backlog` (lower priority)

**Intent:** "Triage everything I've captured."
**Why:** Four capture surfaces (notes, todos, backlog, seeds) with no unified review moment. Small workflow, disproportionate tidiness payoff.

**Chain:**
```
/gsd:note list  +  /gsd:check-todos  +  /gsd:review-backlog   # unified triage table
per item: promote → /gsd:add-phase | /gsd:insert-phase | /gsd:add-backlog
          defer   → /gsd:plant-seed
          drop
[GATE: confirm roadmap mutations in one batch]
```
**Gates:** 1 — batch-confirm all roadmap changes (smart-discuss's accept/override table pattern applied to triage).
**Triggers:** "groom the backlog", "triage my notes", "review everything captured".

---

### W14 — `ecosystem-checkup` (lower priority)

**Intent:** "Is the agent/plugin infrastructure healthy?"
**Chain:** `/gsd:crew` → `/gsd:audit-agents` → `/agent-status` → `/gsd:ecosystem-map` → `/gsd:stats`, all read-only, one report; `/agent-diagnose` offered on findings.
**Gates:** 0 — pure diagnostics.
**Triggers:** "ecosystem checkup", "agent health", "infrastructure audit".
**Note:** could fold into W10 as a `--deep` flag instead of a separate workflow — decide by whether agent health is checked on a different cadence than project health.

---

## Priority and sequencing

| Order | Workflow | Frequency × pain | Build effort |
|---|---|---|---|
| 1 | W7 milestone-rollover | Monthly × very high | Medium (2 gates, gap branch) |
| 2 | W9 ship-and-merge | Per phase × high | Medium (CI wait state) |
| 3 | W10 quality-sweep | Weekly × medium | Low (parallel read-only) |
| 4 | W8 adopt-codebase | Per project × high | Low (linear) |
| 5 | W11 frontend-phase | Per UI phase × medium | Low (W2 variant) |
| 6 | W12 hardened-plan | Occasional × medium | Low (linear) |
| 7 | W13 groom-backlog | Weekly × low | Low |
| 8 | W14 ecosystem-checkup | Monthly × low | Low (or fold into W10) |

Build W7 and W9 first: together with W1–W6 they close the full lifecycle loop — every moment from "adopt a repo" to "tag the release" becomes a single `/gsd:do` sentence.

## Routing-table additions

New `/gsd:do` rows, placed above the single-command routes they supersede:

| User says… | Routes to |
|---|---|
| "close out / finish this milestone", "start v2" | W7 milestone-rollover |
| "adopt / onboard this repo into GSD" | W8 adopt-codebase |
| "ship phase N", "get this merged" | W9 ship-and-merge |
| "audit everything", "quality sweep" | W10 quality-sweep |
| "build the UI phase", "frontend phase N" | W11 frontend-phase |
| "plan carefully", "plan with review" | W12 hardened-plan |
| "groom backlog", "triage my notes" | W13 groom-backlog |
| "agent health", "ecosystem checkup" | W14 ecosystem-checkup |

Ambiguity rule stays as-is: "ship it" with a pasted error still hits bug-to-branch first; "ship phase 4" hits W9.

## What NOT to wrap

- `/gsd:fast`, `/gsd:quick`, `/gsd:next`, `/gsd:progress` — already atomic single intents; wrapping adds latency, not value.
- `/gsd:autonomous` — it already IS the maximal workflow; layering on top duplicates it.
- Anything destructive standalone (`remove-phase`, `remove-workspace`) — keep these deliberate, never reachable as a side effect of a workflow.
- `/gsd:settings`, `/gsd:update`, `/gsd:reapply-patches` — config/maintenance, no sequencing benefit.
