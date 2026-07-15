---
name: workflow:daily-startup
description: Session-start orientation — "start my day", "where am I", or after a /clear. Boots the project, prints the read-only daily dashboard, restores checkpoint/handoff context when present, and recommends exactly one next command. Read-only end to end, zero gates; handles a missing .planning/ itself.
---
<trigger>
Use when:
- User runs /gsd:do with intent "start my day" | "where am I"
- Session start orientation, before any other GSD command
- After a `/clear` or context reset, before diving back into work
</trigger>

<purpose>
Chain the three existing session-boundary primitives — project boot, the read-only dashboard,
and a conditional context restore — into one intent with **zero gates**. This workflow is
**read-only end to end**: the only write anywhere in the chain is `state/pattern-context.md`,
written by the `prime` step's `prime-patterns` boot, and that write is idempotent (overwrite,
never append — re-running this workflow is always safe).

Zero gates is valid here, not a shortcut: per the project's north star — *"Automate the
reversible; gate the irreversible"* (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) — nothing
irreversible is touched by any step below, so there is nothing to gate. The workflow ends by
presenting exactly one recommended next command. Choosing to run that command is the operator's
next intent, not a gate inside this workflow.
</purpose>

<process>

<step name="prime">
Run the standard session boot plus KB pattern injection:

```
Skill(skill="gsd:prime-patterns")
```

Full sequence documented in `commands/gsd/prime-patterns.md`: CLAUDE.md, `tasks/lessons.md`,
`.planning/STATE.md`, deployed agents, git state, then pattern auto-detection and injection.

This is the **only write in the entire daily-startup workflow**. `prime-patterns` composes a
Pattern Context Block and writes it to `state/pattern-context.md`. That write is idempotent by
the source command's own rule ("Running twice should overwrite state/pattern-context.md, not
append. Safe to re-run.") — daily-startup relies on that guarantee and performs no write of its
own.
</step>

<step name="dashboard">
Run the `/gsd:daily` dashboard logic directly, exactly as specified in
`get-shit-done/workflows/daily.md` — zero spawns, direct library calls against
`get-shit-done/bin/lib/daily.cjs`'s exported `gatherDailyState`, `determineNextAction`, and
`formatDashboard`:

```bash
DAILY_STATE=$(node -e "
  const { gatherDailyState } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  console.log(JSON.stringify(gatherDailyState('.planning')));
")
NEXT_CMD=$(node -e "
  const { determineNextAction } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  console.log(determineNextAction(JSON.parse(process.env.DAILY_STATE)));
" DAILY_STATE="$DAILY_STATE")
DASHBOARD=$(node -e "
  const { formatDashboard } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  console.log(formatDashboard(JSON.parse(process.env.DAILY_STATE)));
" DAILY_STATE="$DAILY_STATE")
```

Print `$DASHBOARD` verbatim — milestone/phase progress, plan counts, git state, checkpoint
freshness warning. `$NEXT_CMD` is the provisional recommended next command, held pending the
conditional restore step below, which may supersede it with a more specific handoff-derived
action.
</step>

<step name="conditional_context_restore">
Check whether either resumption artifact is present under `.planning/`:

```bash
test -f .planning/CHECKPOINT.json -o -f .planning/HANDOFF.json && echo present || echo absent
```

**If absent (the normal case):** skip this step silently. `$NEXT_CMD` from `dashboard` stands.
An absent checkpoint/handoff is not a warning condition — do not mention the skip to the operator.

**If present:** this is the point where `/gsd:resume-work` would normally take over. That
command (`commands/gsd/resume-work.md`) routes to `get-shit-done/workflows/resume-project.md`
— command and workflow names differ intentionally (the command is the user-facing verb, the
workflow is the internal action). Run only its **CONTEXT-RESTORE portion**: the
`check_checkpoint`, `load_state`, and `check_incomplete_work` steps of
`get-shit-done/workflows/resume-project.md`. **Do NOT run its `offer_options` step** — the
interactive branching menu — daily-startup surfaces exactly one recommended command at `route`,
it never offers a menu of its own.

- **Checkpoint present and fresh:** report timestamp, phase, and plan-completion counts per
  resume-project.md's `check_checkpoint` step. Let `checkpoint.next_action` supersede
  `$NEXT_CMD`.
- **Checkpoint present and stale (age_hours > 24, resume-project.md's own threshold):** flag it
  verbatim per that step: "Stale checkpoint ({age_hours}h old). Loading from STATE.md instead.
  Run /gsd:checkpoint to refresh." **Never auto-delete the stale checkpoint file** — flag only,
  then fall through to STATE.md as resume-project.md itself does.
- **`.planning/HANDOFF.json` present:** parse `status`, `phase`, `plan`, `task`, `next_action`,
  `blockers`, `human_actions_pending` per resume-project.md's `check_incomplete_work` step.
  Surface any blockers or pending human actions immediately. Let `next_action` supersede
  `$NEXT_CMD`. Do **not** delete `.planning/HANDOFF.json` here — the one-shot
  delete-after-resumption behavior belongs to the full resume-project workflow when actually
  driving resumption; daily-startup only reads.
</step>

<step name="route">
End the workflow by presenting exactly one recommended next command — the final value of
`$NEXT_CMD` (from `dashboard`, superseded by `conditional_context_restore`'s `next_action` if a
checkpoint or handoff was present):

```
Next: {NEXT_CMD}
```

Choosing to run that command is the operator's next intent — it is not a gate inside
daily-startup. daily-startup's own job ends here; nothing further is read, written, or executed.
</step>

</process>

<error_handling>
**If `.planning/` does not exist:** report "No .planning/ directory found." — same wording as
`get-shit-done/workflows/daily.md`'s own contract — but still complete the `prime` step (project
boot has value with no GSD state) and route to `/gsd:new-project` or `/gsd:new-milestone` in
place of a dashboard.

**If `get-shit-done/bin/lib/daily.cjs` fails to load:** report "daily.cjs module not found.
Ensure get-shit-done plugin is installed." — verbatim from `get-shit-done/workflows/daily.md`'s
`error_handling` — and skip straight to `conditional_context_restore` (the checkpoint/handoff
check does not depend on the dashboard library).

**If JSON parsing of `$DAILY_STATE` fails:** fall back to "Daily dashboard could not parse
state. Run /gsd:progress for detailed status." per `get-shit-done/workflows/daily.md`, and still
run `conditional_context_restore`.

**If neither `.planning/CHECKPOINT.json` nor `.planning/HANDOFF.json` is present:** not an
error — see `conditional_context_restore`, skip silently.

**If `prime-patterns` cannot write `state/pattern-context.md`** (permissions, missing `state/`
parent): report the failure plainly and continue to `dashboard` regardless — neither the
dashboard nor the restore step depends on the pattern-context file.
</error_handling>

<success_criteria>
- [ ] `prime-patterns` boot completed; `state/pattern-context.md` overwritten idempotently —
      the only write performed anywhere in this workflow
- [ ] `/gsd:daily` dashboard printed read-only, exactly per `get-shit-done/workflows/daily.md`
- [ ] Context restore ran only when `.planning/CHECKPOINT.json` or `.planning/HANDOFF.json` was
      present, and never invoked resume-project.md's `offer_options` menu
- [ ] Stale checkpoint (>24h) flagged, never auto-deleted
- [ ] Exactly one recommended next command presented at `route` — zero gates end to end
</success_criteria>
