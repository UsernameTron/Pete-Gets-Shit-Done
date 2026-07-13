<trigger>
Use when:
- User runs /gsd:do with intent "groom the backlog" | "triage my notes" | "review everything captured"
- The capture surfaces have accumulated and the operator wants one review moment, not four
- Weekly tidiness pass over notes, todos, backlog phases, and planted seeds
</trigger>

<purpose>
Triage everything the operator has captured across GSD's four capture surfaces — quick notes
(`/gsd:note`), todos (`/gsd:add-todo`), 999.x backlog phases (`/gsd:add-backlog`), and planted
seeds (`/gsd:plant-seed`) — in ONE unified table, collect a disposition per item (promote /
defer / drop), then batch-confirm every roadmap mutation behind exactly ONE gate before
anything is applied.

This is W13 (`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`): four capture surfaces with no unified
review moment; small workflow, disproportionate tidiness payoff. Per the north star —
*"Automate the reversible; gate the irreversible"* (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) —
gathering and tabling are read-only and run unattended; the mutations (roadmap edits, phase
directories, file deletions) are batched behind the single gate, using the accept/override
table pattern from `smart-discuss.md` applied to triage. **Nothing mutates before the gate.**

Applied dispositions consume their source items (promoted notes are flagged, moved todos leave
`pending/`, dropped backlog dirs are gone), so an interrupted run resumed later re-gathers only
what remains — resume never duplicates.
</purpose>

<process>

<step name="preflight">
```bash
test -d .planning && echo present || echo absent
```

If absent: stop — "groom-backlog requires a GSD project (.planning/ not found). Run
/gsd:new-project first." Only globally-scoped notes could exist without one, and they alone
are not worth a triage pass with no roadmap to promote into.

Display banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► GROOM-BACKLOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="gather_surfaces">
Gather all four surfaces read-only. Each sub-step degrades to `(empty)` when its directory or
section is missing — an empty surface is normal, not an error.

**1. Notes** — replicate `note.md`'s `list` logic (read-only; do not invoke the skill — its
empty-argument form is the same listing, but reading directly keeps this step spawn-free and
guarantees zero writes): glob `.planning/notes/*.md` and `~/.claude/notes/*.md`, read each
file's frontmatter (`date`, `promoted`) and body. Items with `promoted: true` are already
consumed — exclude them from triage.

**2. Todos** — the read-only listing behind `check-todos.md`'s `init_context`:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init todos)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract `todos` (title, area, created) and `todo_count`. Do NOT run check-todos' interactive
selection loop — this workflow tables everything at once instead.

**3. Backlog phases** — `review-backlog.md`'s listing steps:

```bash
ls -d .planning/phases/999* 2>/dev/null || echo "No backlog items found"
```

Read `.planning/ROADMAP.md` and extract every `## Backlog` entry: phase number, description,
and any accumulated artifacts (CONTEXT.md, RESEARCH.md) in the phase directory.

**4. Seeds** — no list subcommand exists for seeds; `plant-seed.md`'s `write_seed` step defines
where they live, so read them from disk:

```bash
ls .planning/seeds/SEED-*.md 2>/dev/null
```

Parse each file's frontmatter: `id`, `status`, `trigger_when`, `scope`, `planted`. Only
`status: dormant` seeds are triage candidates — anything else is already resolved.

If all four surfaces are empty: report "Nothing to triage — all four capture surfaces are
clear." and END the workflow. No table, no gate.
</step>

<step name="triage_table">
Present ONE unified table, numbered continuously across surfaces, with a recommended
disposition per item — the recommendation is grounded (age, roadmap fit via ROADMAP.md phase
goals, seed trigger vs current milestone scope from STATE.md), never arbitrary:

```
## Backlog Grooming — {N} items across {S} surfaces

| # | Surface | Item | Age / Trigger | Recommended | Why |
|---|---------|------|---------------|-------------|-----|
| 1 | note    | {text} | {age} | promote → add-phase | matches milestone goal {X} |
| 2 | note    | {text} | {age} | drop | superseded by phase {N} |
| 3 | todo    | {title} ({area}) | {age} | defer | no trigger until {condition} |
| 4 | backlog | 999.{x} {desc} | {age} | promote → active | dependency {Y} now shipped |
| 5 | seed    | SEED-{NNN} {idea} | trigger: {when} | keep dormant | trigger not yet met |
...
```

Disposition vocabulary (what each means at apply time):
- **promote** — into the roadmap, with a route: `add-phase` (end of current milestone),
  `insert-phase after {N}` (urgent, mid-milestone), or `add-backlog` (roadmap parking lot,
  for notes/todos not yet phase-worthy). A 999.x backlog item promotes via review-backlog's
  own mechanism (to the active milestone); "promote to backlog" for one is a no-op — never
  recommend it.
- **defer** — plant a seed with an explicit trigger condition. A seed deferring is just
  "keep dormant" (no-op).
- **drop** — remove from the owning surface.

Then collect overrides **in conversation, not via a gate**: "Reply with overrides (e.g. `2
promote`, `5 drop`, `3 defer when we add auth`) or `ok` to accept all recommendations." For
every item ending up **defer**, a trigger condition must exist in the table before the gate —
ask for it in this same exchange if the operator's override didn't supply one, and derive
`why` and a Small/Medium/Large scope estimate from the item's own text. These pre-collected
answers are what lets the apply step run unattended.

Re-display the updated table after each override round until the operator accepts. This
exchange is scope-setting conversation (the accept/override pattern from `smart-discuss.md`);
the workflow's single gate is the batch mutation confirm below.
</step>

<step name="gate_confirm_mutations">
The single gate. Nothing has been written, moved, deleted, or committed yet.

Present the final disposition set as a mutation plan — only items whose disposition actually
mutates something (promotes, defers, drops; keeps and keep-dormants are listed once as
"untouched: {count}"):

**Prompt text (verbatim):** "Triage set: {P} promote, {D} defer, {K} drop across {S} surfaces ({U} untouched). Apply all roadmap mutations? [Apply all / Adjust dispositions / Cancel — keep everything]"

```
AskUserQuestion:
  question: "Triage set: {P} promote, {D} defer, {K} drop across {S} surfaces ({U} untouched). Apply all roadmap mutations?"
  options:
    - label: "Apply all"
      description: "Execute every disposition in table order — roadmap edits, phase directories, seed files, and source-item consumption"
    - label: "Adjust dispositions"
      description: "Back to the triage table for another override round, then this same gate re-presents"
    - label: "Cancel — keep everything"
      description: "Stop. All four surfaces stay exactly as found; nothing was modified"
```

**"Adjust dispositions"** returns to `triage_table`'s override exchange and re-presents this
gate — still the one gate, re-asked, never a second one.

**"Cancel"** ends the workflow with: "Cancelled — nothing modified. Re-run any time; the same
items will resurface."
</step>

<step name="apply_dispositions">
Runs only on "Apply all". Apply in table order, maintaining an APPLIED ledger (`item # →
done`) as each item completes — the ledger is what makes a mid-apply failure reportable (see
`error_handling`). Compose the owning commands; reimplement nothing.

**Promote → add-phase:** `Skill(skill="gsd:add-phase", args="{item description}")` — the CLI
(`gsd-tools phase add`) handles numbering, slug, directory, and ROADMAP entry per
`add-phase.md`.

**Promote → insert-phase:** `Skill(skill="gsd:insert-phase", args="{after} {item
description}")` — decimal numbering with (INSERTED) marker per `insert-phase.md`. `{after}`
was fixed in the triage table.

**Promote → add-backlog** (notes/todos only): `Skill(skill="gsd:add-backlog", args="{item
description}")` — 999.x parking-lot entry per `add-backlog.md` (it commits itself).

**Promote a 999.x backlog item to active** — review-backlog's own promote mechanism
(`review-backlog.md` step 4): `NEW_NUM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"
phase add "${DESCRIPTION}" --raw)`, move accumulated artifacts from the `999.x-slug` directory
into the new phase directory, remove the old directory, move the ROADMAP entry out of `##
Backlog` into the active phase list, strip the `(BACKLOG)` marker, add a `**Depends on:**`
field.

**Defer → plant seed:** follow `plant-seed.md`'s `create_seed_dir` → `generate_seed_id` →
`write_seed` → `commit_seed` steps using the trigger, why, and scope already collected at
`triage_table`. Do NOT re-run its `gather_context` AskUserQuestions — those answers were
pre-collected precisely so no question fires after the gate.

**Consume the source item** after each successful promote or defer, using the owning surface's
own mechanism:
- note → set frontmatter `promoted: true` (note.md's consumption flag)
- todo → `mv .planning/todos/pending/{file} .planning/todos/done/` (check-todos' mechanism)
- backlog item → directory already moved/removed by the promote above
- seed → set frontmatter `status: promoted`

**Drop** — the owning surface's removal mechanism:
- note → delete the note file (`note.md` defines no softer removal; the file IS the item)
- todo → `mv` to `.planning/todos/done/` (the surface's only removal path — record the drop in
  the final commit message so done/ isn't mistaken for completed work)
- backlog item → delete the `999.x` phase directory and remove its `## Backlog` ROADMAP entry
  (review-backlog.md step 5)
- seed → delete the seed file

**Commit:** delegated commands that commit themselves (add-backlog, plant-seed) already have.
Sweep everything residual — ROADMAP.md edits, STATE.md, deleted/flagged notes, moved todos,
removed seed/backlog directories — into one closing commit:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: groom backlog — promoted {P}, deferred {D}, dropped {K}" --files .planning/ROADMAP.md .planning/STATE.md {residual paths}
```
</step>

<step name="report">
```
## Grooming Complete

Promoted: {list — item → new phase number / backlog number}
Deferred: {list — item → SEED-{NNN} (trigger: {when})}
Dropped:  {list}
Untouched: {count} (kept / dormant)

Surfaces now: notes {n} · todos {n} · backlog {n} · seeds {n} dormant
```

If any promotion created a phase: `▶ Next: /gsd:plan-phase {first new phase number}`.
</step>

</process>

<error_handling>
**If `.planning/` does not exist:** stop at `preflight` — see that step's wording.

**If all four surfaces are empty:** clean exit at `gather_surfaces` — "Nothing to triage."

**If a surface partially fails to parse** (malformed frontmatter in a note or seed): list the
unparseable file in the triage table with disposition locked to `skip (unreadable — fix by
hand: {path})`; never guess its content, never delete what could not be read.

**If a disposition fails mid-apply:** STOP immediately — fail loud, no continue-on-error past
a mutation failure. Print the APPLIED ledger so resume never duplicates:

```
Apply halted at item {#} ({disposition}): {error}

| # | Item | Disposition | Applied |
|---|------|-------------|---------|
| 1 | ...  | promote     | yes     |
| 2 | ...  | drop        | yes     |
| 3 | ...  | defer       | FAILED HERE |
| 4 | ...  | promote     | no      |

Applied items are already consumed from their surfaces and will NOT resurface.
Resume: re-run /gsd:do "groom backlog" — only unapplied items remain to triage.
Or apply item {#} standalone: {the owning command, e.g. /gsd:plant-seed "{idea}"}
```

Then commit whatever partial residue exists with an honest message
(`docs: groom backlog (partial) — halted at item {#}`) so the working tree is never left
half-mutated and unexplained.

**If the closing commit fails:** the dispositions themselves succeeded — report the exact
`gsd-tools commit` command for the operator to retry; do not roll back applied dispositions
over a commit error.
</error_handling>

<success_criteria>
- [ ] All four capture surfaces gathered read-only (notes, todos via `init todos`, 999.x
      backlog entries, dormant seeds read from `.planning/seeds/` on disk)
- [ ] ONE unified, continuously-numbered triage table with grounded recommendations
- [ ] Dispositions collected via accept/override conversation; every `defer` carries a trigger
      condition before the gate
- [ ] Exactly ONE gate (batch mutation confirm); zero writes, moves, deletes, or commits
      before it; zero AskUserQuestions after it
- [ ] Promotes routed through /gsd:add-phase, /gsd:insert-phase, /gsd:add-backlog, or
      review-backlog's promote mechanism — never a hand-rolled ROADMAP edit path
- [ ] Defers wrote seeds in plant-seed.md's exact format from pre-collected answers
- [ ] Every applied promote/defer consumed its source item via the owning surface's mechanism
- [ ] Mid-apply failure produced the APPLIED ledger with per-item resume commands; resume
      cannot duplicate applied items
- [ ] Closing commit swept all residual mutation into one honest commit message
</success_criteria>
