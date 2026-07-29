# GSD Chain Playbook

Ten composite chains built only from your active surface (42 commands + 14 workflows). Every command verified against `commands/gsd/*.md` and `get-shit-done/workflows/*.md` on 2026-07-29. Flags are copied from each command's real `argument-hint`.

---

## Read this first: what already chains itself

The single most expensive mistake is re-running a leg that a workflow already owns. Verified nesting:

| Surface | Already runs |
|---|---|
| `/gsd:confidence` | `health` → `workflow:quality-sweep` → real build/test/lint → `map-codebase` → `sync-docs` → repo cleanliness → scorecard → **gate** → `finalize` |
| `workflow:quality-sweep` | `health` + `audit-uat` + `audit-deps` + `audit-agents` + `validate-phase`. With `--deep`: + `crew` + agent status + ecosystem map + `stats` |
| `workflow:adopt-codebase` | `map-codebase` → `new-project --auto` → `health` → `/agent-setup` → optional `profile-user` → **gate** |
| `/gsd:closeout` | wraps `/gsd:finalize` — orient, audit, verify, capture, ship, finalize, polish (9 gates) |
| `workflow:wrap-and-sync` | coverage run → doc-drift fix → state refresh → todo handoff → lesson capture → checkpoint → `session-report` |

**Rules that follow from that table.** Never run `health`, `map-codebase`, `sync-docs`, `audit-deps`, `audit-agents`, `audit-uat`, or `validate-phase` immediately before `/gsd:confidence` — you pay for them twice. Never run `closeout` and `finalize` in the same chain. `--dry-run` on `confidence` and `closeout` makes zero mutations and prints the leg plan; use it as the first move on any repo you don't know.

**The gap every chain below has to bridge.** `/gsd:sync-docs` rewrites exactly five files — `README.md`, `CLAUDE.md`, `.planning/PROJECT.md`, `docs/DEVOPS-HANDOFF.md`, `CHANGELOG.md` — and only the numeric claims inside them (counts, version, coverage, changelog entries). It writes no prose, creates no missing file, and commits nothing. User guides, admin guides, executive overviews, and diagrams are not in its target list and never will be. GSD has no diagram command and no non-technical-audience command anywhere in either routing map. Those artifacts are produced by a normal GSD phase — `add-phase` → `plan-phase` → `execute-phase` → `verify-work` — which is what Chains 1, 3, and 6 do.

**Not on your active-42.** `/gsd:add-tests`, `/gsd:portfolio`, `/gsd:complete-milestone`, `/gsd:milestone-summary`, `/gsd:insert-phase`, `/gsd:forensics`, `/gsd:harden-repo`, `/gsd:profile-user`, `/gsd:workstreams`, `/gsd:thread` all exist in the repo and in `claude-code-routing-map.md`, but were not in the 42 you listed as live. Confirm with `/gsd:help` before putting any of them in a chain. Nothing below depends on them.

---

## Chain 1 — Full Reconciliation & Handover

**Trigger:** a codebase is "done" and now has to survive someone else owning it. Your original example, made real.
**Gates:** 2 confidence gates + phase gates + 9 closeout gates.
**Produces:** `.planning/codebase/*.md`, `.planning/CONFIDENCE.md`, `.planning/QUALITY-SWEEP.md`, `docs/USER-GUIDE.md`, `docs/ADMIN-GUIDE.md`, `docs/EXECUTIVE-OVERVIEW.md`, `docs/diagrams/system-overview.drawio`, archived milestone, clean tree.

```
/gsd:prime-patterns
  → /gsd:confidence --deep --dry-run     [leg plan, zero mutation — read it before you commit an hour]
  → /gsd:confidence --deep               [GATE: answer "Stop". Do not ship yet — docs don't exist]
  → fix ranked findings                  [/gsd:quick per finding, /gsd:debug for anything non-obvious]
  → /gsd:confidence --deep               [re-run to SHIP-READY. GATE: still answer "Stop"]
  → /gsd:add-phase "Handover documentation and executive artifacts"
  → /gsd:discuss-phase <N> --batch       [batch tables, not 20 sequential questions]
  → /gsd:plan-phase <N> --research
  → /gsd:execute-phase <N>
  → /gsd:verify-work <N>
  → /gsd:sync-docs                       [re-truth the numeric claims the new docs introduced]
  → /gsd:audit-agents                    [ecosystem reconciliation — quality-sweep audited, this fixes]
  → /gsd:cleanup                         [archive completed phase directories]
  → /gsd:closeout                        [9 gates: orient, audit, verify, capture, ship, finalize, polish]
```

Paste-ready — the doc phase is the whole trick, so spec it before `plan-phase` sees it:

```
Run a full reconciliation and handover on this repo.

STEP 1 — Establish truth.
Run /gsd:confidence --deep --dry-run first and show me the leg plan. Then run
/gsd:confidence --deep for real. At the ship gate, answer "Stop" — I am not
shipping until handover docs exist. Show me .planning/CONFIDENCE.md and the
ranked fix list. Work the ranked list top-down with /gsd:quick for mechanical
fixes and /gsd:debug for anything where the root cause isn't obvious. Re-run
/gsd:confidence --deep until the verdict is SHIP-READY, answering "Stop" each time.

STEP 2 — Add the handover phase.
Run /gsd:add-phase "Handover documentation and executive artifacts".
Then /gsd:discuss-phase <N> --batch and /gsd:plan-phase <N> --research.

The phase must produce exactly these four artifacts, every one written FROM
.planning/codebase/*.md (the map refreshed in step 1) and from the live code —
never from README prose, which is the thing we're checking:

  docs/USER-GUIDE.md — task-oriented, for the person who USES this.
    One section per user-facing capability. Each: what it does in one line,
    when to reach for it, a worked example with real input and real output,
    and the most common way it fails plus the fix. No architecture. No
    "as an AI" hedging. If a capability has no example, it is not documented.

  docs/ADMIN-GUIDE.md — for the person who RUNS this.
    Install and prerequisites with exact versions. Every config key: name,
    type, default, blast radius if wrong. Secrets and where they live. Upgrade
    and rollback procedures, both tested. Backup and restore. What to monitor
    and the threshold that means page someone. A troubleshooting runbook keyed
    on the actual error strings this codebase emits — grep for them, don't invent.

  docs/EXECUTIVE-OVERVIEW.md — for a non-technical executive.
    No jargon, no acronyms without expansion, no implementation detail.
    What this system does in business terms. Who it serves and what they did
    before it existed. Five capabilities max, each with the benefit it delivers
    stated as an outcome, not a feature. Operating risk in plain language.
    What it costs to run and what it would cost to stop. One page equivalent.

  docs/diagrams/system-overview.drawio — draw.io XML (mxGraphModel), executive audience.
    GSD has no diagram command; write the XML directly. One box per subsystem
    named in .planning/codebase/ARCHITECTURE.md, grouped by the audience-visible
    capability it serves rather than by directory. Edges labelled with what flows,
    in business nouns. Colour-code by maturity: shipped / in progress / planned.
    Acceptance: the file opens at app.diagrams.net with zero parse errors and
    every box traces to a real module path recorded in the map.

STEP 3 — Verify and close.
/gsd:verify-work <N>, then /gsd:sync-docs, then /gsd:audit-agents, then
/gsd:cleanup, then /gsd:closeout.

STANDING CONSTRAINTS:
- Do not push, tag, publish, or archive without stopping at the gate for me.
- If any doc claim can't be traced to code or to the codebase map, cut the
  claim. An accurate short guide beats a plausible long one.
- Flag scope drift beyond these four artifacts instead of absorbing it.

ONE THING TO FLAG BACK: the four new docs are owned by no drift check.
scripts/check-doc-drift.cjs and /gsd:sync-docs both target a fixed five-file
list. Tell me what it would take to add USER-GUIDE, ADMIN-GUIDE, and
EXECUTIVE-OVERVIEW to that list so they rot loudly instead of silently.
```

---

## Chain 2 — Inherit & Prove

**Trigger:** a repo you didn't write. Client handoff, acquisition, or the thing that landed on your desk.
**Gates:** 1 adoption gate + 1 confidence gate + plan gates.
**Produces:** `.planning/` from nothing, `PROJECT.md`, `ROADMAP.md`, codebase map, deployed agents, a first green build you can point at.

```
/gsd:do "adopt this repo"          [workflow:adopt-codebase — creates .planning/, GATE at accept]
  → /gsd:confidence --dry-run      [what CAN even be measured here — often: no test command exists]
  → /gsd:confidence --deep         [GATE: answer "Stop". The first score is the baseline, not a verdict]
  → /gsd:crew --assess             [what agents you have vs. what this stack actually needs]
  → /gsd:add-phase "Close the concerns surfaced by the codebase map"
  → /gsd:plan-phase <N> --research --reviews
  → /gsd:review                    [cross-AI peer review — inherited code is where you want Codex+Gemini]
  → /gsd:execute-phase <N>
  → /gsd:verify-work <N>
  → /gsd:confidence --deep         [prove the delta against the baseline]
```

```
Adopt this repo into GSD and get me to a defensible first assessment.

Run /gsd:do "adopt this repo". At the acceptance gate, show me PROJECT.md's
value statement and the full ROADMAP phase table before I answer — I am
approving a definition of what this codebase IS, and the map wrote it, not me.

Then /gsd:confidence --dry-run so I can see which legs are even measurable.
Call out explicitly if there is no build command, no test command, or no lint
config — on inherited code that absence IS the headline finding, not a skipped leg.

Then /gsd:confidence --deep. Answer "Stop" at the gate. Treat the resulting
score as a baseline measurement, not a pass/fail.

Then /gsd:crew --assess and tell me the gap between the agents deployed and
what this stack needs.

Then add one phase that closes the highest-severity items from
.planning/codebase/CONCERNS.md, plan it with --research --reviews, and run
/gsd:review before execution. I want Codex and Gemini on this plan specifically
because nobody in this session wrote the original code.

Deliver back, in this order: the three riskiest things about owning this
codebase, the confidence baseline number, and what one phase of work moves it most.
```

---

## Chain 3 — Docs Truth-Up

**Trigger:** quarterly, or the moment someone quotes your README back to you and it's wrong. No code changes.
**Gates:** phase gates only. Nothing ships.
**Produces:** refreshed map, corrected numeric claims across the five sync-docs targets, rewritten audience docs.

```
/gsd:map-codebase                  [refresh FIRST — docs from a stale map are worse than no docs]
  → /gsd:sync-docs --dry-run       [see the drift table before you accept it]
  → /gsd:sync-docs
  → /gsd:add-phase "Audience documentation refresh"
  → /gsd:plan-phase <N>
  → /gsd:execute-phase <N>
  → /gsd:verify-work <N>
  → /gsd:session-report
```

```
Truth-up every document in this repo against live code. No feature work.

/gsd:map-codebase first — refresh .planning/codebase/ before anything reads it.
Then /gsd:sync-docs --dry-run and show me the drift table. Then /gsd:sync-docs
for real. Note that sync-docs does not commit; I'll review before it does.

Then add and run one phase covering everything sync-docs structurally cannot:

1. Every code example in every markdown file: execute it. Delete or fix the
   ones that fail. Report the count of each.
2. Every internal link and file path referenced in docs: resolve it. List the dead ones.
3. Every stated capability in README.md and CLAUDE.md: trace it to a module.
   Anything unbacked gets cut or marked planned.
4. docs/ prose (not the five sync-docs targets) rewritten against the refreshed
   map — same audience, current facts.

Finish with /gsd:verify-work and /gsd:session-report.

Deliver: a table of every claim that was wrong, what it said, what it says now.
That table is the actual output — the diffs are just how it got there.
```

---

## Chain 4 — Agent Fleet Reconciliation

**Trigger:** agents behaving oddly, after a GSD update, or before you trust `/gsd:autonomous` with anything real.
**Gates:** none until you choose to commit fixes.
**Produces:** clean agent roster, resolved frontmatter and tool-permission drift, reapplied local patches.

```
/gsd:crew                          [roster + capability map + self-assessment]
  → /gsd:audit-agents              [frontmatter, tool mismatches, name collisions, install drift]
  → /gsd:quick "fix agent finding <n>"   [one per finding — atomic commits, GSD guarantees]
  → /gsd:audit-agents --quiet      [re-run to zero]
  → /gsd:reapply-patches           [if you carry local mods through updates — you do]
  → /gsd:do "deep quality sweep"   [workflow:quality-sweep --deep: crew, agent status, ecosystem, stats]
```

```
Reconcile my agent fleet.

/gsd:crew for the roster and capability map. /gsd:audit-agents for the integrity
pass. Present findings as one severity-ordered table before fixing anything:
finding, which agent, what breaks in practice, one-line fix.

Then work them top-down with /gsd:quick, one commit per finding. Do not batch
unrelated agent fixes into one commit — when one of them regresses I want to
revert exactly it.

Re-run /gsd:audit-agents until it reports zero. Then /gsd:reapply-patches to
restore my local mods. Then /gsd:do "deep quality sweep" as the independent check.

Flag any agent whose declared tools exceed what its prompt actually uses. Over-
permissioned agents are the finding that never shows up as a failure until it does.
```

---

## Chain 5 — Client Demo Hardening

**Trigger:** external eyes on it inside 48 hours.
**Gates:** confidence gate + ship-and-merge gate.
**Produces:** SHIP-READY verdict, zero outstanding UAT, a rehearsed demo path, merged PR, green CI.

```
/gsd:confidence --deep             [GATE: nothing demos from a FIX-FIRST verdict]
  → /gsd:audit-uat                 [every outstanding acceptance item across every phase]
  → /gsd:verify-work               [conversational UAT — you play the client, not the author]
  → /gsd:add-phase "Demo path hardening"
  → /gsd:ui-phase <N>              [only if there's a UI — produces the UI-SPEC design contract]
  → /gsd:plan-phase <N>
  → /gsd:execute-phase <N>
  → /gsd:verify-work <N>
  → /gsd:do "ship and merge"       [workflow:ship-and-merge — PR, CI watch, merge]
  → /gsd:ci-watch --interval 30
```

```
Harden this for a client demo in 48 hours. Assume the client clicks the wrong
thing first.

/gsd:confidence --deep. If the verdict is not SHIP-READY, stop and give me the
ranked list — I decide what gets cut versus fixed, not you.

/gsd:audit-uat for every outstanding acceptance item. /gsd:verify-work with you
running the checks against acceptance criteria.

Then one phase, "Demo path hardening", scoped to exactly the path a client walks:
- The six actions they will actually take, each verified end to end on a cold start
- Every error state on that path: does it produce a message a non-engineer can act on
- The empty state and the first-run state, which is what a demo always starts from
- Seed or fixture data that makes the demo legible without being obviously fake

Explicitly out of scope: anything off the demo path. Flag it to backlog with
/gsd:review-backlog, don't fix it.

Then /gsd:do "ship and merge" and /gsd:ci-watch --interval 30.

Before the gate, give me the honest answer to: what is most likely to break
live, and what is the fallback if it does.
```

---

## Chain 6 — Milestone Close + Executive Readout

**Trigger:** a milestone is done and someone above you needs to know what they got for it.
**Gates:** confidence gate + phase gates + ship-milestone gates.
**Produces:** milestone audit against original intent, exec readout, archived milestone, clean state.

```
/gsd:audit-milestone <version>     [completion vs. what you actually said you'd do]
  → /gsd:review-backlog            [what slipped — promote or defer explicitly, never silently]
  → /gsd:confidence --deep         [GATE: answer "Stop"]
  → /gsd:add-phase "Milestone readout artifacts"
  → /gsd:plan-phase <N>
  → /gsd:execute-phase <N>         [exec readout + before/after .drawio]
  → /gsd:verify-work <N>
  → /gsd:do "ship the milestone"   [workflow:ship-milestone — end-to-end close]
  → /gsd:cleanup
  → /gsd:stats                     [the numbers that go in the readout]
  → /gsd:session-report
```

```
Close this milestone and produce the executive readout.

/gsd:audit-milestone <version> — I want the gap between what the milestone said
it would deliver and what it delivered, stated plainly. Do not soften it.
/gsd:review-backlog for everything that slipped: each item promoted or deferred
on the record, nothing left ambiguous.

/gsd:confidence --deep, answer "Stop", and /gsd:stats for the raw numbers.

Then one phase producing two artifacts:

  docs/readouts/<version>-EXECUTIVE-READOUT.md
    What we set out to do, in the words we used at the start. What shipped.
    What didn't and why — the real reason, not the diplomatic one. What it
    changes for the people who use this. What the next milestone buys and what
    it costs. Non-technical throughout. Numbers from /gsd:stats and
    .planning/CONFIDENCE.md, cited, never estimated.

  docs/diagrams/<version>-before-after.drawio
    Two panels, same layout, same colour language. Left: system at milestone
    start. Right: system now. New subsystems in one accent colour, changed in
    another, removed struck through. An executive should read the delta in
    under ten seconds without narration. Raw mxGraphModel XML that opens clean
    at app.diagrams.net.

Then /gsd:do "ship the milestone", /gsd:cleanup, /gsd:session-report.

If the audit shows the milestone missed its original intent, say so in the
readout. A readout that hides a miss is worth less than no readout.
```

---

## Chain 7 — Supply Chain Reconciliation

**Trigger:** a CVE alert, an audit questionnaire, or six months since you last looked.
**Gates:** plan gate + ship gate.
**Produces:** `DEPENDENCIES-REPORT.md`, staged upgrades by blast radius, proof the suite still passes.

```
/gsd:audit-deps                    [CVEs, staleness, licenses → DEPENDENCIES-REPORT.md]
  → /gsd:add-phase "Dependency remediation"
  → /gsd:plan-phase <N> --research [batch by blast radius: security patch → patch → minor → major]
  → /gsd:execute-phase <N> --wave 1
  → /gsd:confidence                [the real suite is the only proof an upgrade didn't break you]
  → /gsd:execute-phase <N> --wave 2
  → /gsd:confidence
  → /gsd:do "ship and merge"
  → /gsd:ci-watch
```

```
Reconcile this project's dependencies.

/gsd:audit-deps. Present findings in four batches by blast radius, not by
package name: (1) security patches, (2) patch bumps, (3) minor bumps,
(4) major versions with breaking changes.

Plan one phase with those batches as waves, most-contained first. Execute wave
by wave, running /gsd:confidence between waves. A wave that turns the verdict
red stops the chain — do not proceed to the next wave to "see if it clears."

For every major version bump, before touching it: what breaks, what the
migration is, and what happens if we defer another quarter. Some of these
should be deferred and I want the case for it made, not assumed.

License findings surface separately from CVEs. A license change is a legal
question, not an engineering one, and I route it differently.
```

---

## Chain 8 — Test Debt Recovery

**Trigger:** the coverage number embarrasses you, or a bug shipped that a test should have caught.
**Gates:** plan gate.
**Produces:** honest baseline, closed validation gaps, measured delta.

```
/gsd:confidence --dry-run          [find out whether build/test/lint commands even exist]
  → /gsd:confidence                [leg 3 executes the real suite — this is the true baseline]
  → /gsd:audit-uat                 [untested acceptance criteria = highest-value gaps, already written]
  → /gsd:validate-phase <N>        [per phase with Nyquist validation gaps]
  → /gsd:add-phase "Coverage recovery"
  → /gsd:plan-phase <N>
  → /gsd:execute-phase <N>
  → /gsd:confidence                [prove the delta, don't claim it]
```

```
Recover this project's test debt.

/gsd:confidence --dry-run, then /gsd:confidence. Leg 3 runs the real suite —
that number is the baseline. If leg 3 records WARN because no build or test
commands are defined, that is the entire finding and the phase becomes "define
a test command," not "raise coverage."

/gsd:audit-uat next. Untested acceptance criteria are the highest-value gaps in
the repo — the assertion is already written in prose, it just has no test
behind it. /gsd:validate-phase on every phase with recorded validation gaps.

Plan one phase ordered by consequence, not by coverage percentage:
1. Paths where a failure is silent — data corruption, wrong-but-plausible output
2. Paths where a failure is expensive — auth, payments, anything writing to disk or a remote
3. Paths that changed most recently and have no test
4. Everything else, only if the first three are closed

Coverage percentage is a proxy and I will not chase it. Tell me what is
untested that would actually hurt, and we test that.

Finish with /gsd:confidence and show me baseline versus now, both numbers measured.
```

---

## Chain 9 — Stalled Project Rescue

**Trigger:** you opened a project you haven't touched in weeks and GSD itself looks wrong.
**Gates:** none — this chain is diagnostic.
**Produces:** repaired `.planning/`, restored context, honest position, a next action.

```
/gsd:health --repair               [fix .planning/ integrity first — nothing downstream is trustworthy]
  → /gsd:resume-work               [restore full context from the last handoff]
  → /gsd:progress                  [where it stands — compare against what STATE.md claims]
  → /gsd:stats                     [phases, plans, requirements, git metrics, timeline]
  → /gsd:audit-milestone           [is the original intent still the right intent?]
  → /gsd:do "groom the backlog"    [workflow:groom-backlog — notes, todos, 999.x into one table]
  → /gsd:debug "<whatever stalled it>"   [state survives context resets — that's the point]
  → /gsd:next
```

```
This project stalled. Get me oriented before I touch anything.

/gsd:health --repair first. If .planning/ is structurally broken, everything
downstream reports fiction.

Then /gsd:resume-work, /gsd:progress, /gsd:stats. Where STATE.md's claim and
git's reality disagree, git wins — show me every disagreement.

Then /gsd:audit-milestone. Projects stall for two different reasons and the fix
is opposite: either it got hard, or the goal stopped being worth it. Tell me
which one this is, from the evidence, before recommending work.

Then /gsd:do "groom the backlog" so notes, todos, and 999.x items land in one
promote/defer/drop table.

If a specific failure stalled it, /gsd:debug it — debug state survives context
resets, which is the whole reason to use it instead of poking at it manually.

End with /gsd:next and one paragraph: what this project is, why it stopped,
and whether it's worth restarting. I would rather kill it cleanly than let it
sit for another quarter.
```

---

## Chain 10 — Weekly Autopilot

**Trigger:** a scheduled task. Read-only by construction — a run that ends at an unanswered gate has still done its whole job.
**Gates:** one, and ignoring it costs nothing.
**Produces:** a severity-ordered findings report you read Monday instead of discovering in October.

```
/gsd:do "deep quality sweep"       [workflow:quality-sweep --deep — every read-only audit surface]
  → /gsd:audit-deps --no-commit    [CVE drift since last week]
  → /gsd:stats
  → /gsd:session-report
```

```
Weekly read-only health run on this project. Change nothing.

/gsd:do "deep quality sweep". At its single gate — the one guarding repair
application — decline. I want findings, not unattended mutations.

/gsd:audit-deps --no-commit for CVE and staleness drift.
/gsd:stats and /gsd:session-report for the trend.

Report exactly three things, nothing else:
1. What is newly broken since last week
2. What has been broken for more than three weeks — that one is a decision, not a bug
3. The single highest-value hour of work available right now

If nothing changed, say "no change" and stop. Do not manufacture findings to
justify the run.
```

**Schedule it:** ask me to set this up as a Cowork scheduled task and I'll wire it — Monday 7am Central is the obvious slot, so the report is waiting before the week starts.

---

## Composing your own

Four rules, all derived from the doctrine in `workflows/confidence.md` and `workflows/adopt-codebase.md`:

**Automate the reversible, gate the irreversible.** Reports, doc syncs, map refreshes, audits — chain them freely, the next commit absorbs any mistake. Push, tag, merge, and archive get a gate every time. This is why `confidence` runs seven legs and gates once.

**Read-only before mutating, always.** `--dry-run` first on `confidence` and `closeout`. `sync-docs --dry-run` before `sync-docs`. The dry run costs a minute and tells you whether the real run is worth an hour.

**Refresh the map before anything reads it.** `map-codebase` feeds every doc, plan, and diagram downstream. A chain that writes documentation from a stale map produces confident, wrong documents — strictly worse than none.

**One phase per audience, not one phase per artifact.** A user guide and an admin guide want different verification, different reviewers, and different acceptance criteria. Bundling them into one phase means one of them gets the other's standard.

**Where GSD ends.** Anything requiring a rendered visual, a Word or PowerPoint deliverable, or executive-audience prose in a specific house style leaves Claude Code. `.drawio` and `.md` are text and belong in the repo under a phase, which is what these chains do. Rendered PDFs, decks, and branded assets are a Cowork handoff — say the word and I'll build that bridge as a separate chain.
