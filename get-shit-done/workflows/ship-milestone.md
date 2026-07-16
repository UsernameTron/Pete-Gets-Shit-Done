---
name: workflow:ship-milestone
description: Close out the whole milestone end-to-end — health check, ecosystem audit, doc sync, coverage+drift, milestone audit, ship+CI to green, then complete-milestone — behind exactly 2 gates (a conditional audit-verdict gate and an authorization gate before the irreversible tag/archive/branch step). Wraps /gsd:complete-milestone, the bare archive/tag primitive; distinct from workflow:ship-and-merge, which ships a single phase, not a milestone.
---
<purpose>
Close out a milestone from one intent: health → ecosystem audit → doc sync → coverage+drift →
milestone audit → ship/CI → complete-milestone. This is W5
(`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`), autonomy level L2 — the read-only validation and
audit chain runs unattended; exactly two decisions stay human: accepting a non-passing audit
(GATE 1, conditional — a `passed` audit auto-continues) and authorizing the irreversible
completion cluster (GATE 2). *"Automate the reversible; gate the irreversible"*: nothing
irreversible happens before GATE 2 resolves, and `complete-milestone`'s own three internal
prompts (archive phases, branch handling, tag push) still fire and stay human — GATE 2
authorizes *starting* that sequence, never answers for it.

This workflow composes the proven finalizer critical path directly — step by step, with its
own gates — rather than delegating to the monolithic finalize command.
</purpose>

<process>

<step name="intake_and_version">

## 1. Intake

Parse `$ARGUMENTS` for a milestone version (e.g. `v2.9`) → `VERSION`. If absent, read it from
state:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load
```

Take the `milestone` field. If neither yields a version → stop: "No milestone version found —
pass one (e.g. `v2.9`) or set `.planning/STATE.md`."

If STATE.md status is already `archived` and `.planning/milestones/` holds the `${VERSION}`
record, report "Milestone ${VERSION} is already complete" and end.

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SHIP-MILESTONE ▸ ${VERSION}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Chain: health → audit-agents → sync-docs → coverage+drift → audit-milestone → [GATE 1?] → ship/ci → [GATE 2] → complete-milestone
```

</step>

<step name="health">

## 2. Health Check

```
Skill(skill="gsd:health")
```

Read-only validation of `.planning/` integrity. Never pass `--repair` — repairs happen only
through health's own existing prompt if the operator invokes it separately. **If health reports
broken structure:** → `handle_step_failure` ("Planning directory unhealthy — fix via
/gsd:health --repair before closing out").

</step>

<step name="audit_agents">

## 3. Ecosystem Audit

```
Skill(skill="gsd:audit-agents", args="--no-commit")
```

`--no-commit` — this chain batches nothing into commits before GATE 2; the report file is
enough. **If the verdict is BLOCK:** → `handle_step_failure` ("Agent ecosystem BLOCK verdict —
resolve before closing out"). FLAG verdicts continue (they surface again in the audit summary
at GATE 1 if the milestone audit is not `passed`).

</step>

<step name="sync_docs">

## 4. Sync Living Docs

```
Skill(skill="gsd:sync-docs")
```

Refreshes README/CLAUDE/DEVOPS-HANDOFF and friends from live codebase state with line-cited
diffs. No commit here — changes ride to `complete-milestone`'s own flow after GATE 2.

</step>

<step name="coverage_and_drift">

## 5. Coverage + Drift (after the last change, same unit)

Lesson 2026-05-11: run these AFTER the last doc-touching step, as one unit:

```bash
npm run test:coverage
[ -f scripts/check-doc-drift.cjs ] && node scripts/check-doc-drift.cjs || echo "[skip] no drift detector in this project"
```

**If the suite fails or coverage floors break:** → `handle_step_failure` ("Suite/coverage red —
never close a milestone on a red build"). **If check-doc-drift exits non-zero:** fix the drifted
claims from the live numbers just measured (never guess numbers), re-run to exit 0, then
continue. If the drift is not a simple count sync → `handle_step_failure`.

</step>

<step name="audit_milestone">

## 6. Milestone Audit

```
Skill(skill="gsd:audit-milestone")
```

Then read the verdict — frontmatter `status:` line of `.planning/v${VERSION#v}-MILESTONE-AUDIT.md`
(canonical single-version filename):

```bash
AUDIT_STATUS=$(grep -m1 "^status:" ".planning/v${VERSION#v}-MILESTONE-AUDIT.md" | cut -d: -f2 | tr -d ' ')
```

Values: `passed` | `gaps_found` | `tech_debt` (anything else → treat as `gaps_found`).

</step>

<step name="gate_1_audit_verdict">

## 7. GATE 1 — Audit Verdict (conditional)

**If `AUDIT_STATUS` is `passed`: skip this gate entirely** — print
`[skip] GATE 1: audit passed — auto-continue` and proceed to `ship_and_ci`. A forced pause on a
green audit would be a rubber stamp.

**Only if `AUDIT_STATUS` is not `passed`**, present the audit status plus its gap/tech-debt
summary and prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Milestone audit: {status}. {N} gaps / {M} tech-debt items:
{summary}. [Continue anyway / Stop — fix first]"

```
AskUserQuestion:
  question: "Milestone audit: ${AUDIT_STATUS}. {N} gaps / {M} tech-debt items: {summary}. Continue anyway?"
  options:
    - label: "Continue anyway"
      description: "Accept the audit findings as-is and proceed toward completion — GATE 2 still guards the irreversible step"
    - label: "Stop — fix first"
      description: "End the workflow; close the gaps (e.g. /gsd:plan-milestone-gaps) and re-run ship-milestone"
```

**On "Stop — fix first":** → `handle_step_failure` ("Audit ${AUDIT_STATUS} — operator chose to
fix first. Suggested: /gsd:plan-milestone-gaps").

</step>

<step name="ship_and_ci">

## 8. Ship Unshipped Work + CI to Green

Check for branch-local work the close-out depends on:

```bash
git log origin/$(git branch --show-current)..HEAD --oneline
```

**If the current branch is `main` and nothing is unpushed:** skip with a receipt
(`[skip] nothing unshipped`). **Otherwise**, for any unshipped docs/phase branch:

```
Skill(skill="gsd:ship")
```

then watch CI to green:

```
Skill(skill="gsd:ci-watch")
```

**If CI ends red:** → `handle_step_failure` ("CI red on the close-out branch — a milestone
never completes on a red build"). No fix loop here — milestone close-out is not the place to
debug; resolve separately and re-run.

</step>

<step name="gate_2_complete_authorization">

## 9. GATE 2 — Complete the Milestone

Present everything about to become permanent: tag name (`v${VERSION#v}`), branches that
`complete-milestone` will offer to squash/delete, archive destination
(`.planning/milestones/`), phase count, and the requirements score from the audit. Then prompt
via **AskUserQuestion**.

**Prompt text (verbatim):** "Ready to complete {version}: tag v{X.Y} + push, squash-merge
{branch}, archive {N} phases. This is the irreversible step. [Complete milestone / Hold]"

```
AskUserQuestion:
  question: "Ready to complete ${VERSION}: tag v${VERSION#v} + push, squash-merge {branch}, archive {N} phases. This is the irreversible step."
  options:
    - label: "Complete milestone"
      description: "Authorize starting complete-milestone — its own 3 prompts (archive phases, branch handling, tag push) still fire and stay yours to answer"
    - label: "Hold"
      description: "End the workflow; the milestone stays open and resumable, nothing irreversible has happened"
```

**On "Hold":** end cleanly — everything before this gate was read-only or local; the milestone
remains open.

</step>

<step name="complete_milestone">

## 10. Complete Milestone

```
Skill(skill="gsd:complete-milestone", args="${VERSION}")
```

**GATE 2 authorized starting this sequence — nothing more.** The workflow passes no
pre-answers and no auto-flags; `complete-milestone`'s three internal prompts remain live human
prompts, answered by the operator in the moment:

1. **Archive phases** — "Archive phase directories to milestones/?"
2. **Branch handling** — squash merge / merge with history / delete / keep (PR-merge path replaces the local merges when `main` is branch-protected)
3. **Tag push** — "Push tag to remote? (y/n)"

Never auto-answer, suppress, or pre-approve any of them. If a future flag could bypass them, do
not pass it.

Then report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SHIP-MILESTONE ▸ ${VERSION} — COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Audit: ${AUDIT_STATUS} · Gates fired: {1 or 2 of 2} · complete-milestone prompts answered live: 3
 Next: /gsd:new-milestone
```

</step>

</process>

<error_handling>

**`handle_step_failure`** — used for: unhealthy planning directory, ecosystem BLOCK verdict,
red suite/coverage, unresolvable doc drift, operator "Stop — fix first" at GATE 1, and red CI.

Fail loud: stop immediately, report the exact failure, and write state so the run is
resumable:

```
Skill(skill="gsd:pause-work")
```

Then display the exact resume command and stop:

```
Resume with: /gsd:do "close out milestone ${VERSION}"
(completed steps re-verify cheaply on re-entry — health, audits, and doc sync are idempotent)
```

**Rollback:** everything before GATE 2 is read-only, local, or resumable — the milestone stays
open; nothing irreversible has happened yet. The irreversible cluster (tag push, branch
deletion, archive) lives entirely inside `complete-milestone`, behind GATE 2 *and* behind its
own three live prompts.

**This workflow holds exactly 2 gates** — GATE 1 (conditional, audit verdict) and GATE 2
(completion authorization). It composes the close-out chain itself (the finalize command is
excluded by design), and it never answers `complete-milestone`'s internal prompts.

</error_handling>

<success_criteria>
- [ ] `VERSION` resolved from `$ARGUMENTS` or STATE.md; already-archived milestones exit early
- [ ] Chain order held: health → audit-agents (`--no-commit`) → sync-docs → coverage+drift
      (same unit, after last change) → audit-milestone → GATE 1 → ship/ci-watch → GATE 2 →
      complete-milestone
- [ ] GATE 1 fires only when audit `status` is not `passed`; a `passed` audit prints
      `[skip] GATE 1: audit passed — auto-continue`
- [ ] GATE 1 carries the exact verbatim prompt text: "Milestone audit: {status}. {N} gaps /
      {M} tech-debt items: {summary}. [Continue anyway / Stop — fix first]"
- [ ] GATE 2 carries the exact verbatim prompt text: "Ready to complete {version}: tag v{X.Y}
      + push, squash-merge {branch}, archive {N} phases. This is the irreversible step.
      [Complete milestone / Hold]"
- [ ] `complete-milestone` invoked only after GATE 2 "Complete milestone"; no pre-answers, no
      auto-flags — its 3 internal prompts (archive phases, branch handling, tag push) stay live
- [ ] Exactly 2 AskUserQuestion gates in this workflow; the finalize command is never referenced
- [ ] Every failure path stops, writes a `gsd:pause-work` handoff, and prints the exact resume
      command
</success_criteria>
