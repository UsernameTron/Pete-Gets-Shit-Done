---
name: gsd:crew
description: Agent roster, capability map, and self-assessment — show your team and find gaps
argument-hint: "[agent-name] [--assess] [--recommend 'task description']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Show the full GSD agent roster with capabilities, command mappings, and spawning relationships. Optionally assess the team for gaps, overlaps, and quality issues.

Four modes:
1. **Roster** (`/gsd:crew`) — Show all agents, grouped by function, with command mappings
2. **Detail** (`/gsd:crew gsd-planner`) — Deep dive on one agent: capabilities, tools, spawned by, works with
3. **Assess** (`/gsd:crew --assess`) — Diagnostic report only. Agents analyze themselves for gaps, overlaps, and quality. Writes findings to `.planning/CREW-ASSESSMENT.md`. Does NOT propose fixes, create plans, ask gray-area questions, or enter remediation mode.
4. **Recommend** (`/gsd:crew --recommend "add auth to my API"`) — Suggest which agents and commands fit a task

Output: Structured roster, and optionally a diagnostic report written to `.planning/CREW-ASSESSMENT.md`
</objective>

<context>
Arguments: $ARGUMENTS (optional)
- No args → Roster mode
- Agent name (e.g., `gsd-planner`) → Detail mode
- `--assess` → Self-assessment mode (diagnostic only)
- `--recommend "description"` → Task-to-agent recommendation

**Agent directory:** Read all .md files in the project's `agents/` directory. Fall back to `~/.claude/agents/` or `~/projects/Pete-Gets-Shit-Done/agents/` if no local agents/ exists.

**Workflow directory:** Cross-reference `~/.claude/get-shit-done/workflows/*.md` to find which workflows spawn which agents.
</context>

<process>

## Mode 1: Roster (default — no arguments)

1. Scan the agents directory. For each `.md` file, read the YAML frontmatter to extract:
   - `name` — agent identifier
   - `description` — one-line capability summary
   - `tools` — what tools the agent has access to
   - `color` — visual identifier

2. Classify each agent into a functional group by reading its `<role>` block:

   | Group | Agents | Signal in description/role |
   |-------|--------|--------------------------|
   | **Planning** | Agents that create plans, roadmaps, requirements | "plan", "roadmap", "requirements", "phase" |
   | **Research** | Agents that gather information before building | "research", "investigate", "analyze assumptions" |
   | **Execution** | Agents that write code or execute tasks | "execute", "build", "implement", "debug" |
   | **Validation** | Agents that verify, check, or audit work | "verify", "check", "audit", "validate" |
   | **UI/UX** | Agents focused on frontend/design | "ui", "visual", "design", "frontend" |
   | **Meta** | Agents that profile, synthesize, or operate on the system itself | "profile", "synthesize", "meta" |

3. Build the command-to-agent spawning map by scanning workflow files:
   ```bash
   # For each workflow .md, grep for agent names referenced
   grep -o "gsd-[a-z-]*" ~/.claude/get-shit-done/workflows/*.md | sort | uniq -c | sort -rn
   ```

4. Present the roster:

   ```
   ╔══════════════════════════════════════════════════════════════════╗
   ║  GSD CREW ROSTER — [N] agents deployed                        ║
   ╚══════════════════════════════════════════════════════════════════╝

   PLANNING
     gsd-planner .............. Creates executable phase plans with task breakdown
     gsd-roadmapper ........... Creates project roadmaps with phase breakdown
     gsd-assumptions-analyzer . Analyzes codebase for assumptions with evidence
     gsd-plan-checker ......... Verifies plans achieve phase goal before execution

   RESEARCH
     gsd-advisor-researcher ... Researches gray areas, produces comparison tables
     gsd-phase-researcher ..... Researches how to implement a phase before planning
     gsd-project-researcher ... Researches domain ecosystem before roadmap creation
     gsd-research-synthesizer . Synthesizes parallel researcher outputs into SUMMARY.md

   EXECUTION
     gsd-executor ............. Executes plan tasks
     gsd-debugger ............. Investigates bugs using scientific method
     gsd-codebase-mapper ...... Explores codebase, writes analysis to .planning/codebase/

   VALIDATION
     gsd-verifier ............. Verifies phase goal achievement (goal-backward)
     gsd-integration-checker .. Checks cross-phase integration
     gsd-nyquist-auditor ...... Fills validation gaps in completed phases

   UI/UX
     gsd-ui-researcher ........ Produces UI-SPEC.md design contracts
     gsd-ui-checker ........... Validates UI-SPEC against 6 quality dimensions
     gsd-ui-auditor ........... Retroactive 6-pillar visual audit of frontend code

   META
     gsd-user-profiler ........ Analyzes session messages across 8 behavioral dimensions

   ─────────────────────────────────────────────────
   SPAWNING MAP (command → agents)
   ─────────────────────────────────────────────────
     /gsd:new-project ...... project-researcher (×4) → research-synthesizer → roadmapper
     /gsd:discuss-phase .... advisor-researcher, phase-researcher, assumptions-analyzer
     /gsd:plan-phase ....... phase-researcher → planner → plan-checker
     /gsd:execute-phase .... executor (+ debugger, verifier, nyquist-auditor on failure)
     /gsd:verify-work ...... verifier, integration-checker
     /gsd:map-codebase ..... codebase-mapper (×4 parallel: tech, arch, quality, concerns)
     /gsd:quick ............ planner → executor → verifier (compressed pipeline)
     /gsd:ui-phase ......... ui-researcher → ui-checker
     /gsd:ui-review ........ ui-auditor
     /gsd:debug ............ debugger
     /gsd:profile-user ..... user-profiler
     /gsd:validate-phase ... nyquist-auditor
   ```

## Mode 2: Detail (agent name provided)

1. Read the full agent .md file (not just frontmatter)
2. Present:

   ```
   ═══ gsd-planner ═══

   Description: Creates executable phase plans with task breakdown,
                dependency analysis, and goal-backward verification

   Tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
   Color: green

   Spawned by:
     /gsd:plan-phase (primary)
     /gsd:quick (compressed mode)
     /gsd:execute-phase (re-planning on failure)

   Works with:
     ← gsd-phase-researcher (provides RESEARCH.md input)
     → gsd-plan-checker (validates output)
     → gsd-executor (consumes plans)

   Key responsibilities:
     [extracted from <role> block — 3-5 bullet points]

   Recent activity:
     [check .planning/phases/ for most recent PLAN.md files this agent produced]
   ```

## Mode 3: Assess (--assess flag)

**THIS MODE IS DIAGNOSTIC ONLY. Report findings. Do not propose fixes, ask design questions, enter remediation planning, or prompt the user for architectural decisions.**

Spawn subagents to analyze the crew from multiple perspectives, then synthesize into a diagnostic report.

1. **Spawn 4 assessment subagents in parallel using Task():**

   **Coverage Analyst:**
   - Read all agent .md files in the agents directory
   - Read all workflow .md files
   - Map every workflow step to the agent that handles it
   - Identify workflow steps with NO dedicated agent (gaps)
   - Identify agents that are never spawned by any workflow (orphans)
   - Return: coverage gaps list and orphan agents list

   **Overlap Detector:**
   - Read all agent .md files
   - Compare role descriptions pairwise
   - Identify agents with >60% responsibility overlap
   - Identify tools lists that are identical across agents
   - Return: overlap pairs with severity (low/medium/high)
   - **DO NOT propose consolidation plans or ask gray-area questions. Report overlaps only.**

   **Capability Auditor:**
   - Read all agent .md files
   - Check for: missing error handling instructions, missing output format specs, missing "what NOT to do" sections, missing tool justifications
   - Compare agent quality against the best-written agent (likely gsd-planner or gsd-verifier)
   - Return: per-agent quality scores and specific deficiencies

   **Workflow Efficiency Analyst:**
   - Read recent .planning/ execution history (STATE.md, phase SUMMARY.md files)
   - Check for patterns: which agents are spawned most often, which produce the most revision cycles, which fail most
   - Identify bottlenecks (agents that slow down pipelines)
   - Return: efficiency metrics and bottleneck analysis

2. **Synthesize assessment results into a diagnostic report:**

   Combine all 4 subagent reports into a structured assessment:

   ```
   ╔══════════════════════════════════════════════════════════════════╗
   ║  GSD CREW ASSESSMENT — [date]                                  ║
   ╚══════════════════════════════════════════════════════════════════╝

   COVERAGE
     ✓ [N] workflow steps covered by dedicated agents
     ✗ [N] gaps found:
       - [gap description + which workflow]

   OVERLAPS
     ⚠ [N] overlapping agent pairs:
       - [agent-a] ↔ [agent-b]: [description of overlap + severity]

   QUALITY SCORES
     | Agent                    | Score | Key Deficiency        |
     |--------------------------|-------|-----------------------|
     | gsd-planner              | 9/10  | —                     |
     | gsd-executor             | 7/10  | No error recovery     |
     | ...                      |       |                       |

   BOTTLENECKS
     - [agent]: [N] revision cycles in last [N] phases
     - [workflow step]: average [N]min, outlier at [N]min
   ```

3. **Write to `.planning/CREW-ASSESSMENT.md`** with today's date

4. **Present summary to user.** End with: "Assessment complete. Run `/gsd:plan-phase` on a specific finding if you want to act on it."

   **DO NOT:**
   - Ask the user which findings to discuss
   - Propose consolidation plans
   - Present gray-area decision matrices
   - Enter interactive planning mode
   - Suggest creating improvement phases
   - Ask "Want me to create phase plans?"

## Mode 4: Recommend (--recommend flag)

1. Parse the task description from arguments
2. Read all agent descriptions
3. Match task keywords against agent capabilities
4. Present recommendation:

   ```
   Task: "add auth to my API"

   Recommended workflow: /gsd:plan-phase → /gsd:execute-phase

   Agents that will activate:
     gsd-phase-researcher — will research auth patterns (OAuth2, JWT, API keys)
     gsd-planner — will create implementation plan
     gsd-plan-checker — will verify plan covers security requirements
     gsd-executor — will implement the auth layer
     gsd-verifier — will confirm auth works end-to-end

   Patterns from KB v2.1 (if prime-patterns loaded):
     Pattern 2 (Zero-Trust on Model Output) — validate all auth tokens server-side
     Pattern 3 (Self-Referential Security) — prevent auth config from being modified by API

   Start with: /gsd:prime-patterns then /gsd:plan-phase [phase-number]
   ```

</process>

<critical_rules>

- **ASSESS MODE IS DIAGNOSTIC ONLY.** The --assess flag produces a report of findings. It does NOT enter remediation planning, propose architectural changes, present decision matrices, ask gray-area questions, or prompt the user for design choices. It reports what it found and stops. The user decides what to do next.
- **No interactive follow-ups from assess.** Subagents return findings. The synthesizer writes the report. The command ends. No "which of these 6 areas would you like to discuss?" prompts.
- **Read-only in roster/detail/recommend modes.** Only --assess writes files (the assessment report only).
- **Graceful on missing agents.** If agents/ directory doesn't exist or has fewer than expected files, show what's there and note the gap.
- **Subagents for assess only.** Roster, detail, and recommend modes run inline — no Task() spawning. Only --assess spawns subagents.
- **Respect agent file structure.** Agent .md files use YAML frontmatter + `<role>` blocks. Parse both. Don't assume fields exist — degrade gracefully.
- **Cross-reference workflows.** The spawning map must come from actual grep of workflow files, not from hardcoded assumptions. Workflows change; the map must be live.
- **Keep assess findings factual.** Every finding in the assessment must cite the specific agent file(s) and line numbers that evidence the finding. No vague "consider improving X."

</critical_rules>

<success_criteria>
- [ ] Roster: All agents listed with descriptions and functional grouping
- [ ] Roster: Spawning map shows which commands activate which agents
- [ ] Detail: Full agent profile with upstream/downstream relationships
- [ ] Assess: 4 subagent perspectives gathered (coverage, overlap, quality, efficiency)
- [ ] Assess: Synthesized into diagnostic report (findings only, no remediation)
- [ ] Assess: Written to .planning/CREW-ASSESSMENT.md
- [ ] Assess: Ends with one-line guidance, no interactive follow-up
- [ ] Recommend: Task description matched to agents and commands
</success_criteria>
