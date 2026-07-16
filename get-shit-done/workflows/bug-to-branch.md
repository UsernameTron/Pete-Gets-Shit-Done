---
name: workflow:bug-to-branch
description: Fix a bug end-to-end from a pasted error or bug report through to a shipped fix — debug to confirmed root cause, gated fix-path choice, full test suite, then a gated push/draft-PR. Two gates; everything stays branch-local until "Ship it".
---
<purpose>
Turn a pasted error into a shipped fix: debug → fix → full suite → ship. This is W3
(`.planning/GSD-AUTONOMOUS-WORKFLOWS.md:102-118`), autonomy level L2 — investigation and fix run
unattended; only the two path-changing decisions (fix path at root cause, push/PR) stay human.
*"Automate the reversible; gate the irreversible"*: everything before GATE 2 is branch-local —
no push, no PR, nothing leaves the machine until "Ship it".
</purpose>

<process>

<step name="intake_and_branch_guard">
Parse `$ARGUMENTS` as the bug report. The paste IS the intake — zero context switching
(CLAUDE.md's autonomous-bug-fixing contract).

```bash
CURRENT_BRANCH=$(git branch --show-current)
FIX_BASE_SHA=$(git rev-parse HEAD)
```

If on `main`/`master`: create and switch to `fix/{slug}` first and re-record both variables so
every debug-state and fix commit lands on a working branch; otherwise stay — rapid fix
iteration on the active branch is the evidenced pattern. `FIX_BASE_SHA` is the rollback point
printed for the operator on suite failure (never reset automatically).
</step>

<step name="debug">
Run the debug flow from `commands/gsd/debug.md` with the bug report as the issue description —
same orchestrator steps by reference: init, active-session check, symptom gathering, spawn
`gsd-debugger` (persistent state in `.planning/debug/{slug}.md`, survives context resets).

Symptom intake from the paste: pre-fill each of the five symptom answers (expected / actual /
errors / reproduction / timeline) the pasted text already states — the debugger prompt carries
`symptoms_prefilled: true` — and ask only the underivable residue.

**If the debugger returns `## INVESTIGATION INCONCLUSIVE`:** stop-and-report — show what was
checked and eliminated plus the resumable state file path; never fix without a confirmed root cause.
</step>

<step name="gate_1_fix_path">
## GATE 1 — Root cause found → choose fix path

`commands/gsd/debug.md:110-116`'s existing ROOT CAUSE FOUND gate, kept — the answer changes the downstream path.

**Prompt text (verbatim):** "Root cause: {cause} (evidence: {file:line}). Fix approach:
{approach}, touches {N} files. [Fix now / Plan the fix / I'll take it manual]"

- **"Fix now"** (small, self-contained) → `fix_quick`
- **"Plan the fix"** (structural) → `fix_planned`
- **"I'll take it manual"** → end here; the debug state file stays on disk, resumable.
</step>

<step name="fix_quick">
```
Skill(skill="gsd:quick", args="--full {root-cause fix description from the debug file}")
```

`--full` is non-negotiable: quick's default path runs zero automated verification — plan check
(`quick.md` step 5.5) and verifier (step 6.5) run only under `--full`. Then → `full_suite`.
</step>

<step name="fix_planned">
Derive `PHASE_NUM` from `.planning/STATE.md`'s current phase — derive, never ask
(checkpoint/resume precedent). Then, per debug.md's own "Plan fix" suggestion:

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --gaps")
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

`Skill()`-not-`Task()` and `--no-transition` per `idea-to-shipped.md`'s execute-step rationale. Then → `full_suite`.
</step>

<step name="full_suite">
Lesson 2026-03-25 [Testing]: "Run the full test suite, not just tests for the changed module."

```bash
npm test
```

**If the suite fails:** stop-and-report; do NOT auto-revert. The fix commits stay
branch-local for inspection; print the exact rollback command
(`git reset --hard ${FIX_BASE_SHA}` on `${CURRENT_BRANCH}`) **without executing it**,
keep the debug state file, report what failed, stop. Discarding uncommitted work is
the operator's call at a gate, never automatic (mirrors `quick-change.md`'s
suite-failure contract). **If it passes:** → `gate_2_approve_ship`.
</step>

<step name="gate_2_approve_ship">
## GATE 2 — Approve Ship

Same shape and prompt as `idea-to-shipped.md`'s `gate_2_approve_ship`: present verification result, diff stat vs `${FIX_BASE_SHA}`, suite result, and target branch, then ask.

**Prompt text (verbatim):** "Verification passed (X/Y must-haves; review: PASS). Push branch
and open draft PR? [Ship it / Fix issues first / Stop — keep local]"

- **"Ship it"** → `ship_and_watch`
- **"Fix issues first"** → loop to the chosen fix step, then `full_suite`; re-present this gate
- **"Stop — keep local"** → end; fix commits stay on the local branch, nothing is pushed.
</step>

<step name="ship_and_watch">
Planned path: `Skill(skill="gsd:ship", args="${PHASE_NUM} --draft")`. Quick path:
`Skill(skill="gsd:ship", args="--draft")` — `ship`'s own preflight asks (no phase
VERIFICATION.md, etc.) are `ship.md`'s, not new gates owned here. Then:

```
Skill(skill="gsd:ci-watch")
```

`--draft`: nothing is marked ready-for-review. On CI red, follow `idea-to-shipped.md`'s `ci_watch`
contract — one automated fix retry within GATE-2-approved scope, then stop-and-report via
`gsd:pause-work`. Merge stays human, on GitHub, forever.
</step>

</process>

<success_criteria>
- [ ] Branch guard before any commit; `FIX_BASE_SHA` recorded; `main` never receives a commit
- [ ] Debug flow reused by reference; symptoms pre-filled from the paste, only residue asked
- [ ] GATE 1 is debug.md's existing root-cause gate carrying W3's verbatim prompt text
- [ ] Fix path is `quick --full` or `plan-phase --gaps` + `execute-phase --no-transition`; full `npm test` after either
- [ ] No push, no PR before GATE 2 resolves "Ship it"; PR is draft; merge stays human
- [ ] `INVESTIGATION INCONCLUSIVE` stops-and-reports with the resumable debug state file
</success_criteria>
