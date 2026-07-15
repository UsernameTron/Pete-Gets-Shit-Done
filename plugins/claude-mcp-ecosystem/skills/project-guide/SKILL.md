---
name: project-guide
description: |
  Invisible router for project organization and specialist management in Claude Code.
  Detects when a project needs subagent specialists, routes to setup (concierge) or
  management (companion) workflows, and handles the "I don't know what I need" case.
  Catches frustration signals, implicit complexity indicators, and direct agent requests.
  Also proactively suggests specialist setup when the project has visibly outgrown
  a single thread.

  This skill is the single entry point for the subagent lifecycle suite. Non-coders
  never need to know which downstream skill or subagent handles their request — this
  skill figures it out and routes silently.

  REFUSES: Domain-specific work (route to appropriate specialist). Skill creation
  (redirect to skill-factory). Running pipeline subagents directly (those are internal
  components invoked by the concierge).

  TRIGGERS: "set up agents", "set up specialists", "organize my project",
  "I need specialists", "agent status", "how are my agents", "remove an agent",
  "add a specialist", "what are my agents doing", "agent help", "manage my agents",
  "this isn't working right", "why is it slower now", "quality is getting worse",
  "I keep having to repeat myself", "Claude keeps forgetting", "context is full",
  "too many files", "this project is a mess", "I'm losing track of everything",
  "it was better when the project was small", "I feel like I'm fighting the tool",
  "can you handle these things separately", "I wish different parts could work
  independently", "is there a way to split this up", "this project does X and Y and Z",
  "project getting unwieldy", "vibecoding getting messy", "I'm new to agents",
  "what do specialists actually do", "show me a demo"
---

# Project Guide — Invisible Routing Skill

## QUICK START

1. Read `.claude/agents/` to determine if specialists already exist
2. Read `.claude/project-health.md` for cross-session state (if it exists)
3. Silently judge whether project complexity warrants suggesting specialists
4. Decide the right path for the user's request
5. Execute the appropriate path: concierge skill, companion skill, or direct response
6. Never announce which skill is handling the request — the infrastructure is invisible

## WHEN TO USE

Invoke when the user says anything related to project organization, specialist management,
or shows signs of project complexity. This includes explicit requests ("set up agents,"
"agent status"), frustration signals ("quality is dropping," "context keeps filling up"),
and implicit complexity indicators ("this project does frontend and backend and data
processing"). Also invoke when observable complexity thresholds are exceeded and the user
has no specialists deployed.

## WHEN NOT TO USE

Do not invoke for domain-specific work that specialists handle (CSS questions, API
implementation, data analysis). Do not invoke for skill creation — redirect to skill-factory.
Do not invoke when the user is clearly doing simple, focused work in a project small
enough that specialists would add overhead.

---

## PROCESS

### Step 1: Read Ecosystem State

Check `.claude/agents/` for existing subagent .md files. If the directory exists and
contains files, record the agent roster. If the directory is missing or empty, record
that no specialists are deployed.

Check `.claude/project-health.md` for cross-session state. If it exists, read the
complexity observations, suggestion cooldowns, and session patterns. If it doesn't
exist, this is either a first interaction or the file hasn't been created yet.

Expected output: `{ecosystem_state}` — agents present (yes/no), agent count,
cross-session state loaded (yes/no).

### Step 2: Passive Complexity Check

Before responding to the user's message, run a silent assessment. This check does NOT
produce visible output unless a suggestion is warranted.

If no specialists are deployed, judge for yourself — from the project you can observe
and from how the user is talking — whether the project has grown complex enough, or the
user frustrated enough, that specialist setup is worth suggesting. If so, check
`.claude/project-health.md` for a suggestion cooldown; suggest only if no cooldown is
active, and always AFTER answering the user's actual question.

**Suggestion rules:**
- One suggestion per session maximum
- Never suggest during the user's first session with a project
- Never interrupt urgent work ("quick fix", "deploy now", "this is broken")
- If the user declines, write a cooldown to `.claude/project-health.md`

**Suggestion format (always AFTER the normal response):**

```
By the way — your project has grown to [N] files across [N] different areas.
Setting up specialists for each area would help keep quality consistent.
Want me to do that?
```

### Step 3: Route the Request

Decide the correct path yourself from what the user wants and whether `.claude/agents/`
contains .md files. When specialists exist, management requests (status, add/remove/
change/reset, diagnosis, memory inspection) are the companion's domain, while fresh
starts and demos are the concierge's. When none exist, setup requests — explicit or
implied by real complexity — go to the concierge. If the project is simple enough that
specialists would add overhead, do NOT invoke either skill; say: "Your project is still
small enough that specialists would add overhead. Keep building — I'll suggest splitting
things up if it gets more complex."

**Critical: invisible delegation.** Never say "I'm handing this to the concierge" or
"Let me bring in the companion." Since this skill and the concierge/companion are all
skills running in the main conversation context, the routing is invisible. The user
asks a question and gets an answer. They never see the infrastructure.

### Step 4: Expert Escape Hatch

If at any point the user demonstrates expert knowledge of agent architecture,
acknowledge their expertise and offer the choice:

"Looks like you know your way around this. Want me to keep handling things automatically,
or would you prefer full control over the architecture decisions?"

If they choose full control, step back and let them invoke the architect subagent directly
or work with the pipeline skills manually.

### Step 5: Update Cross-Session State

After every interaction where the complexity check ran, update `.claude/project-health.md`:

```markdown
## Complexity Observations
- [date]: File count [N], domains [list], depth [N]
- [date]: User declined setup suggestion
- [date]: Setup suggestion cooldown until [date + 3 sessions]

## Session Patterns
- [date]: User re-explained [topic] — potential memory candidate
- [date]: Quality complaint about [domain] — possible routing gap
```

---

## ERROR HANDLING

| Condition | Action |
|:----------|:-------|
| Cannot determine if specialists exist (permission error reading .claude/) | Respond normally to user's request. Do not surface the error. |
| User asks something completely unrelated to agents | Do NOT fire. Let the request pass to the main thread or specialist. |
| User has agents but doesn't know they exist (inherited project) | Fire on frustration signals. Companion introduces agents gently: "Your project has specialists set up — here's what they handle." |
| Cross-session state file is corrupted | Delete and recreate with empty state. |

---

## RELATIONSHIP TO OTHER SKILLS

| Skill/Subagent | Relationship |
|:---------------|:-------------|
| subagent-concierge (skill) | Project-guide routes setup requests to concierge |
| subagent-companion (skill) | Project-guide routes management requests to companion |
| architect (subagent) | Invoked by concierge, never by project-guide directly |
| scaffolder (subagent) | Invoked by concierge, never by project-guide directly |
| memory-seeder (subagent) | Invoked by concierge, never by project-guide directly |
| validator (subagent) | Invoked by concierge, never by project-guide directly |
| auditor (subagent) | Invoked by companion, never by project-guide directly |
| skill-factory | Project-guide redirects skill creation requests there |

---

## MANIFEST

```yaml
name: project-guide
version: "3.0.0"
created: "2026-03-03"
author: "Pete Connor"
pattern: "context-aware-branching"
forge_gate_scores:
  specificity: 3
  trigger_clarity: 3
  scope_boundary: 3
  differentiation: 3
  total: "12/12"
deployment:
  scope: "user"
  rationale: "Routing applies to any Claude Code project with complexity"
chain_position: "Layer 0 — entry point above concierge and companion"
```
