---
name: workflow:adopt-codebase
description: Put an existing repo under GSD (brownfield onboarding) — map the codebase, synthesize PROJECT.md/ROADMAP.md from the map, health-check, deploy agents, optional developer profile, then one gate accepting the project definition. Creates .planning/ — does not require it; greenfield setup belongs to new-project.
---
<purpose>
Put an existing repo under GSD: map → project definition → health check → agents → optional
profile → accept. This is W8 (`docs/WORKFLOW-DESIGN-RECOMMENDATIONS.md`) — brownfield
onboarding as one intent instead of tribal knowledge about command order. *"Automate the
reversible; gate the irreversible"*: everything here is local writes under `.planning/` and
`.claude/` — nothing is pushed, ever — so a single gate suffices: accepting the generated
PROJECT.md + ROADMAP.md as the project's definition before any phase runs against it. This
workflow does NOT require `.planning/` to exist; creating it is the job.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-codebase-mapper — spawned internally by `gsd:map-codebase`, listed for visibility only
</available_agent_types>

<process>

<step name="intake_and_guard">

## 1. Intake

```bash
git rev-parse --is-inside-work-tree 2>/dev/null
ls .planning/PROJECT.md 2>/dev/null
```

**If not a git repository:** stop — "adopt-codebase expects an existing repo. Run `git init`
first, or use /gsd:new-project for greenfield."

**If `.planning/PROJECT.md` already exists:** the repo is already adopted. Stop and route:
"Already under GSD. Use /gsd:progress to see where it stands." (`new-project` would refuse
with `project_exists` anyway — stopping here is the same check, earlier and plainer.)

Display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ADOPT-CODEBASE ▸ {repo directory name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Chain: map → new-project --auto → health → agents → profile (optional) → accept
```

</step>

<step name="map_codebase">

## 2. Map the Codebase

```
Skill(skill="gsd:map-codebase")
```

Parallel `gsd-codebase-mapper` agents write `.planning/codebase/` documents directly. If
`.planning/codebase/` already exists, `map-codebase` asks its own Refresh/Update/Skip question
— that prompt is the command's, not a gate owned here; any of the three answers leaves a
usable map behind.

Verify the map exists:

```bash
MAP_COUNT=$(ls .planning/codebase/*.md 2>/dev/null | wc -l | tr -d ' ')
```

**If `MAP_COUNT` = 0:** → `handle_step_failure` ("map-codebase produced no documents in
.planning/codebase/").

</step>

<step name="new_project">

## 3. Project Definition (seeded from the map)

```
Skill(skill="gsd:new-project", args="--auto @.planning/codebase/ARCHITECTURE.md @.planning/codebase/STACK.md @.planning/codebase/CONCERNS.md")
```

`--auto` requires an idea document (`new-project.md`'s auto-mode contract); here the codebase
map IS the idea document — the project definition is synthesized from what the repo already
is, not from a greenfield brief. Auto mode still asks its upfront config questions (Step 2a:
granularity/git/agents) and auto-approves requirements and roadmap — those auto-approvals are
safe precisely because this workflow's single gate reviews the results below before anything
executes.

**Suppress the auto-advance.** `new-project --auto` ends by invoking
`/gsd:discuss-phase 1 --auto`; do NOT follow it — adopt-codebase owns the chain, and the
acceptance gate has not run yet. Health, agents, and the gate come first; phase 1 is the
operator's next intent after "Accept".

Verify the definition was produced:

```bash
ls .planning/PROJECT.md .planning/ROADMAP.md 2>/dev/null
```

**If either is missing:** → `handle_step_failure` ("new-project --auto did not produce
PROJECT.md/ROADMAP.md").

</step>

<step name="health_check">

## 4. Health Check

Validate the `.planning/` directory new-project just built:

```
Skill(skill="gsd:health")
```

- **`healthy`:** continue.
- **`degraded`:** report the warnings inline and continue — warnings surface again at the gate.
- **`broken`:** run one repair pass — `Skill(skill="gsd:health", args="--repair")` — and
  re-read the status. Still `broken` → `handle_step_failure` ("health reports broken after
  one --repair pass").

</step>

<step name="agent_setup">

## 5. Agent Setup (non-fatal)

```
SlashCommand("/agent-setup")
```

`/agent-setup` is a session command from the **claude-mcp-ecosystem** plugin, not a GSD
command — it analyzes the codebase and deploys project specialists to `.claude/agents/`. It
may be unavailable (plugin not installed or disabled). **That is non-fatal:** if the command
is not recognized, print a receipt and continue —

```
[skip] /agent-setup unavailable (claude-mcp-ecosystem plugin not installed).
       Agents can be added later — this does not block adoption.
```

</step>

<step name="profile_user_offer">

## 6. Developer Profile (OPTIONAL — offered, never forced)

This is an offer, not the gate — it approves nothing irreversible and the workflow's gate
count does not include it:

```
AskUserQuestion:
  question: "Generate your developer behavioral profile now? It tunes how GSD agents communicate with you."
  options:
    - label: "Yes — profile me"
      description: "Runs /gsd:profile-user; it has its own consent gate for session analysis"
    - label: "Skip"
      description: "Continue to project acceptance; run /gsd:profile-user any time later"
```

**On "Yes":** `Skill(skill="gsd:profile-user")` — its internal consent gate (ACTV-06) and
questionnaire fallback are `profile-user.md`'s own. A declined consent inside it is not a
failure; continue either way.

**On "Skip":** continue.

</step>

<step name="gate_accept_project">

## 7. GATE — Accept the Project Definition

Present, in order: PROJECT.md's core value / goal one-liner, the ROADMAP.md phase table
(number, name, goal per phase), the health status line, agent-setup receipt, and where every
artifact lives (`.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/codebase/`). Then
prompt via **AskUserQuestion**.

**Prompt text (verbatim):** "Project definition generated from the codebase map — PROJECT.md
+ ROADMAP.md ({N} phases, health: {status}). Accept and take the first phase from here?
[Accept / Revise / Stop — keep artifacts]"

```
AskUserQuestion:
  question: "Project definition generated from the codebase map — PROJECT.md + ROADMAP.md ({N} phases, health: {status}). Accept and take the first phase from here?"
  options:
    - label: "Accept"
      description: "Adoption complete — the workflow ends by presenting the next command, not running it"
    - label: "Revise"
      description: "Tell me what's wrong with PROJECT.md or ROADMAP.md; I'll amend and re-present this gate"
    - label: "Stop — keep artifacts"
      description: "End now; everything generated stays on disk for later"
```

**On "Accept":**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ADOPT-CODEBASE — ADOPTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Next: /gsd:discuss-phase 1   (or `/gsd:do "take this idea to a PR"` for a fresh idea)
```

The workflow ENDS by presenting the routed next command; running it is the operator's next
intent, not a step inside this one (the W1 zero-trailing-gate pattern).

**On "Revise":** gather the corrections conversationally, apply them — edit
`.planning/PROJECT.md` directly, and reshape the roadmap through the existing primitives
(`/gsd:add-phase`, `/gsd:remove-phase`) rather than hand-editing phase numbering — then
re-present this gate with the updated summary.

**On "Stop — keep artifacts":** end. Everything generated (`.planning/`, any deployed
agents) stays on disk; re-running adopt-codebase later stops at the already-adopted guard and
routes to `/gsd:progress`.

</step>

</process>

<error_handling>

**`handle_step_failure`** — used for: map-codebase producing no documents, new-project
producing no PROJECT.md/ROADMAP.md, and health staying `broken` after one repair pass.

Fail loud: stop immediately and report the exact failure. If `.planning/` exists by the time
of failure, write a resumable handoff:

```
Skill(skill="gsd:pause-work")
```

If the failure happened before `.planning/` exists (the map step itself), there is no state
to write — report plainly instead. Either way, display the exact resume command and stop:

```
Resume with: /gsd:do "adopt this repo"
(completed steps detect their own output on re-entry — an existing map is offered for reuse
by map-codebase's own Skip option, and an existing PROJECT.md stops at the adopted guard)
```

Note: the already-adopted guard means a resume AFTER new-project succeeded routes to
`/gsd:progress` — correct, because from that point the remaining steps (`/gsd:health`,
`/agent-setup`, `/gsd:profile-user`) are each independently runnable by name; list them in
the failure report.

**Rollback:** everything this workflow writes is local — `.planning/`, `.claude/agents/`, and
new-project's local commits. Nothing is ever pushed; no remote exists in this chain at all.
Full rollback is `git reset` of the adoption commits plus deleting `.planning/` — always
operator-initiated, never automatic.

</error_handling>

<success_criteria>
- [ ] Guard stops non-git directories and already-adopted repos (`.planning/PROJECT.md`
      present → route to /gsd:progress) before any step runs
- [ ] `.planning/` is NOT required at entry — map-codebase creates it
- [ ] Map step invokes `gsd:map-codebase` and verifies `.planning/codebase/*.md` exists;
      map-codebase's own Refresh/Update/Skip prompt is not counted as a gate
- [ ] new-project runs with `--auto` seeded by `@`-references to the codebase map documents —
      the map IS the required idea document
- [ ] new-project's auto-advance to `/gsd:discuss-phase 1 --auto` is explicitly suppressed —
      the acceptance gate must run first
- [ ] Health validates the freshly built `.planning/`; `broken` gets exactly one `--repair`
      pass before failing loud
- [ ] `/agent-setup` invoked as a slash command (claude-mcp-ecosystem plugin); unavailability
      is non-fatal and produces a `[skip]` receipt
- [ ] profile-user is offered via AskUserQuestion, never forced; the offer is not a gate and
      a declined internal consent is not a failure
- [ ] Exactly ONE gate, carrying the exact verbatim prompt text: "Project definition generated
      from the codebase map — PROJECT.md + ROADMAP.md ({N} phases, health: {status}). Accept
      and take the first phase from here? [Accept / Revise / Stop — keep artifacts]"
- [ ] "Accept" ends by PRESENTING `/gsd:discuss-phase 1`, not running it; "Revise" amends via
      existing primitives and re-presents the gate; "Stop" keeps all artifacts
- [ ] No `git push`, `gh`, or any remote operation appears anywhere in this workflow
- [ ] Every failure path stops, reports exactly what failed, writes a `gsd:pause-work` handoff
      when `.planning/` exists, and prints the exact resume command
</success_criteria>
