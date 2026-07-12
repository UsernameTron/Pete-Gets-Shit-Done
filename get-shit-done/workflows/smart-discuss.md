<purpose>

Autonomous-optimized variant of the `gsd:discuss-phase` skill. Proposes grey area answers in batch tables — the user accepts or overrides per area — instead of sequential questioning. Produces **identical CONTEXT.md output** to regular discuss-phase: same template, same sections, same commit shape.

> **Note (CTRL-03):** Smart discuss is an autonomous-optimized variant of the `gsd:discuss-phase` skill. It produces identical CONTEXT.md output but uses batch table proposals instead of sequential questioning. The original `discuss-phase` skill remains unchanged. This workflow is the extraction anticipated by `get-shit-done/workflows/autonomous.md`'s original `smart_discuss` step note ("Future milestones may extract this to a separate skill file") — `autonomous.md` now invokes this file as a thin caller, and `get-shit-done/workflows/idea-to-shipped.md` invokes it directly as a second caller.

</purpose>

<input_contract>

**Required:** `PHASE_NUM` — the phase number to run smart discuss for, supplied by the caller (e.g., `autonomous.md`'s `execute_phase` step, or `idea-to-shipped.md`'s discuss step).

Run init to get phase paths:

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

Parse from JSON: `phase_dir`, `phase_slug`, `padded_phase`, `phase_name`.

**Output:** `${phase_dir}/${padded_phase}-CONTEXT.md`, written and committed. Callers should re-run `init phase-op ${PHASE_NUM}` after this workflow completes and check `has_context` to confirm the write succeeded — this workflow does not return a structured result of its own.

</input_contract>

<process>

### Sub-step 1: Load prior context

Read project-level and prior phase context to avoid re-asking decided questions.

**Read project files:**

```bash
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/STATE.md 2>/dev/null || true
```

Extract from these:
- **PROJECT.md** — Vision, principles, non-negotiables, user preferences
- **REQUIREMENTS.md** — Acceptance criteria, constraints, must-haves vs nice-to-haves
- **STATE.md** — Current progress, decisions logged so far

**Read all prior CONTEXT.md files:**

```bash
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort
```

For each CONTEXT.md where phase number < current phase:
- Read the `<decisions>` section — these are locked preferences
- Read `<specifics>` — particular references or "I want it like X" moments
- Note patterns (e.g., "user consistently prefers minimal UI", "user rejected verbose output")

**Build internal prior_decisions context** (do not write to file):

```
<prior_decisions>
## Project-Level
- [Key principle or constraint from PROJECT.md]
- [Requirement affecting this phase from REQUIREMENTS.md]

## From Prior Phases
### Phase N: [Name]
- [Decision relevant to current phase]
- [Preference that establishes a pattern]
</prior_decisions>
```

If no prior context exists, continue without — expected for early phases.

---

### Sub-step 2: Scout Codebase

Lightweight codebase scan to inform grey area identification and proposals. Keep under ~5% context.

**Check for existing codebase maps:**

```bash
ls .planning/codebase/*.md 2>/dev/null || true
```

**If codebase maps exist:** Read the most relevant ones (CONVENTIONS.md, STRUCTURE.md, STACK.md based on phase type). Extract reusable components, established patterns, integration points. Skip to building context below.

**If no codebase maps, do targeted grep:**

Extract key terms from the phase goal. Search for related files:

```bash
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10 || true
ls src/components/ src/hooks/ src/lib/ src/utils/ 2>/dev/null || true
```

Read the 3-5 most relevant files to understand existing patterns.

**Build internal codebase_context** (do not write to file):
- **Reusable assets** — existing components, hooks, utilities usable in this phase
- **Established patterns** — how the codebase does state management, styling, data fetching
- **Integration points** — where new code connects (routes, nav, providers)

---

### Sub-step 3: Analyze Phase and Generate Proposals

**Get phase details:**

```bash
DETAIL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase ${PHASE_NUM})
```

Extract `goal`, `requirements`, `success_criteria` from the JSON response.

**Infrastructure detection — check FIRST before generating grey areas:**

A phase is pure infrastructure when ALL of these are true:
1. Goal keywords match: "scaffolding", "plumbing", "setup", "configuration", "migration", "refactor", "rename", "restructure", "upgrade", "infrastructure"
2. AND success criteria are all technical: "file exists", "test passes", "config valid", "command runs"
3. AND no user-facing behavior is described (no "users can", "displays", "shows", "presents")

**If infrastructure-only:** Skip Sub-step 4. Jump directly to Sub-step 5 with minimal CONTEXT.md. Display:

```
Phase ${PHASE_NUM}: Infrastructure phase — skipping discuss, writing minimal context.
```

Use these defaults for the CONTEXT.md:
- `<domain>`: Phase boundary from ROADMAP goal
- `<decisions>`: Single "### Claude's Discretion" subsection — "All implementation choices are at Claude's discretion — pure infrastructure phase"
- `<code_context>`: Whatever the codebase scout found
- `<specifics>`: "No specific requirements — infrastructure phase"
- `<deferred>`: "None"

**If NOT infrastructure — generate grey area proposals:**

Determine domain type from the phase goal:
- Something users **SEE** → visual: layout, interactions, states, density
- Something users **CALL** → interface: contracts, responses, errors, auth
- Something users **RUN** → execution: invocation, output, behavior modes, flags
- Something users **READ** → content: structure, tone, depth, flow
- Something being **ORGANIZED** → organization: criteria, grouping, exceptions, naming

Check prior_decisions — skip grey areas already decided in prior phases.

Generate **3-4 grey areas** with **~4 questions each**. For each question:
- **Pre-select a recommended answer** based on: prior decisions (consistency), codebase patterns (reuse), domain conventions (standard approaches), ROADMAP success criteria
- Generate **1-2 alternatives** per question
- **Annotate** with prior decision context ("You decided X in Phase N") and code context ("Component Y exists with Z variants") where relevant

---

### Sub-step 4: Present Proposals Per Area

Present grey areas **one at a time**. For each area (M of N):

Display a table:

```
### Grey Area {M}/{N}: {Area Name}

| # | Question | ✅ Recommended | Alternative(s) |
|---|----------|---------------|-----------------|
| 1 | {question} | {answer} — {rationale} | {alt1}; {alt2} |
| 2 | {question} | {answer} — {rationale} | {alt1} |
| 3 | {question} | {answer} — {rationale} | {alt1}; {alt2} |
| 4 | {question} | {answer} — {rationale} | {alt1} |
```

Then prompt the user via **AskUserQuestion**:
- **header:** "Area {M}/{N}"
- **question:** "Accept these answers for {Area Name}?"
- **options:** Build dynamically — always "Accept all" first, then "Change Q1" through "Change QN" for each question (up to 4), then "Discuss deeper" last. Cap at 6 explicit options max (AskUserQuestion adds "Other" automatically).

**On "Accept all":** Record all recommended answers for this area. Move to next area.

**On "Change QN":** Use AskUserQuestion with the alternatives for that specific question:
- **header:** "{Area Name}"
- **question:** "Q{N}: {question text}"
- **options:** List the 1-2 alternatives plus "You decide" (maps to Claude's Discretion)

Record the user's choice. Re-display the updated table with the change reflected. Re-present the full acceptance prompt so the user can make additional changes or accept.

**On "Discuss deeper":** Switch to interactive mode for this area only — ask questions one at a time using AskUserQuestion with 2-3 concrete options per question plus "You decide". After 4 questions, prompt:
- **header:** "{Area Name}"
- **question:** "More questions about {area name}, or move to next?"
- **options:** "More questions" / "Next area"

If "More questions", ask 4 more. If "Next area", display final summary table of captured answers for this area and move on.

**On "Other" (free text):** Interpret as either a specific change request or general feedback. Incorporate into the area's decisions, re-display updated table, re-present acceptance prompt.

**Scope creep handling:** If user mentions something outside the phase domain:

```
"{Feature} sounds like a new capability — that belongs in its own phase.
I'll note it as a deferred idea.

Back to {current area}: {return to current question}"
```

Track deferred ideas internally for inclusion in CONTEXT.md.

---

### Sub-step 5: Write CONTEXT.md

After all areas are resolved (or infrastructure skip), write the CONTEXT.md file.

**File path:** `${phase_dir}/${padded_phase}-CONTEXT.md`

Use **exactly** this structure (identical to discuss-phase output):

```markdown
# Phase {PHASE_NUM}: {Phase Name} - Context

**Gathered:** {date}
**Status:** Ready for planning

<domain>
## Phase Boundary

{Domain boundary statement from analysis — what this phase delivers}

</domain>

<decisions>
## Implementation Decisions

### {Area 1 Name}
- {Accepted/chosen answer for Q1}
- {Accepted/chosen answer for Q2}
- {Accepted/chosen answer for Q3}
- {Accepted/chosen answer for Q4}

### {Area 2 Name}
- {Accepted/chosen answer for Q1}
- {Accepted/chosen answer for Q2}
...

### Claude's Discretion
{Any "You decide" answers collected — note Claude has flexibility here}

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- {From codebase scout — components, hooks, utilities}

### Established Patterns
- {From codebase scout — state management, styling, data fetching}

### Integration Points
- {From codebase scout — where new code connects}

</code_context>

<specifics>
## Specific Ideas

{Any specific references or "I want it like X" from discussion}
{If none: "No specific requirements — open to standard approaches"}

</specifics>

<deferred>
## Deferred Ideas

{Ideas captured but out of scope for this phase}
{If none: "None — discussion stayed within phase scope"}

</deferred>
```

Write the file.

**Commit:**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${PADDED_PHASE}): smart discuss context" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```

Display confirmation:

```
Created: {path}
Decisions captured: {count} across {area_count} areas
```

</process>

<success_criteria>
- [ ] `PHASE_NUM` accepted as the sole required input; phase paths re-derived via `init phase-op`
- [ ] Prior project and phase context loaded before any grey area is generated (Sub-step 1)
- [ ] Codebase scouted lightweight, under ~5% context (Sub-step 2)
- [ ] Infrastructure-only phases detected first and skip straight to minimal CONTEXT.md (Sub-step 3)
- [ ] Non-infrastructure phases generate 3-4 grey areas with ~4 questions each, each with a recommended answer and alternatives (Sub-step 3)
- [ ] Grey areas presented one at a time as batch tables via AskUserQuestion, not sequential single-question interrogation (Sub-step 4)
- [ ] "Accept all", "Change QN", "Discuss deeper", and free-text "Other" are all handled distinctly (Sub-step 4)
- [ ] Scope creep is deferred and tracked, never silently dropped or silently accepted into phase scope (Sub-step 4)
- [ ] CONTEXT.md written using the exact template shared with discuss-phase (Sub-step 5)
- [ ] CONTEXT.md committed via `gsd-tools.cjs commit` with the `docs({padded_phase}): smart discuss context` message shape (Sub-step 5)
- [ ] Relationship to `discuss-phase` and the extraction lineage documented via the CTRL-03 note
</success_criteria>

