# Delegation Workflow Patterns

Patterns for orchestrator agents that decompose, assign, and coordinate work across specialist agents.

---

## Task Decomposition Pattern

**When to Use**: tech-lead-orchestrator, team-configurator-agent

### Template

```
## Workflow

1. **Understand**: Parse the task requirements.
   - Identify the end goal
   - List all deliverables
   - Identify constraints (time, scope, dependencies)

2. **Break Down**: Decompose into atomic tasks.
   - Each subtask should be completable by a single agent
   - Each subtask should have clear inputs and outputs
   - Identify dependencies between subtasks
   - Estimate complexity: S (< 1 file), M (2-5 files), L (5+ files)

3. **Assign**: Match subtasks to agents.
   - Select agent based on domain expertise
   - Provide full context: what to do, what files to touch, what to avoid
   - Set explicit success criteria for each subtask

4. **Monitor**: Track progress.
   - Check each agent's status output
   - Resolve blockers and conflicts
   - Re-assign or re-plan if an agent is stuck

5. **Merge**: Integrate results.
   - Review each agent's output
   - Resolve any conflicts between parallel changes
   - Verify integrated result meets original requirements
   - Run final quality checks
```

### Output Format

```
## Task Decomposition

### Original Task
{description}

### Subtasks
| ID | Task | Agent | Dependencies | Complexity | Status |
|----|------|-------|-------------|------------|--------|
| T1 | {task} | {agent} | none | S/M/L | PENDING |
| T2 | {task} | {agent} | T1 | S/M/L | PENDING |
| T3 | {task} | {agent} | none | S/M/L | PENDING |

### Execution Order
Phase 1 (parallel): T1, T3
Phase 2 (sequential): T2 (depends on T1)

### Integration Plan
{how results will be merged}
```

---

## Parallel Dispatch Pattern

**When to Use**: tech-lead-orchestrator (multi-agent coordination)

### Template

```
## Workflow

1. **Identify Independent Tasks**: From the decomposition, find tasks with no shared dependencies.
   - No overlapping file modifications
   - No shared state mutations
   - No sequential data dependencies

2. **Fan Out**: Dispatch independent tasks simultaneously.
   - Provide each agent with:
     - Specific files to read/modify
     - Clear boundaries (what NOT to touch)
     - Expected output format
     - Timeout/complexity estimate

3. **Collect**: Wait for all parallel tasks to complete.
   - Track completion status
   - Capture each agent's output and status
   - Note any BLOCKED or NEEDS_CONTEXT responses

4. **Synthesize**: Merge parallel results.
   - Check for unexpected conflicts (same file modified)
   - Verify combined result is consistent
   - Run integration tests
   - Generate combined report
```

### Conflict Prevention Rules

```
- Never assign the same file to two parallel agents for modification
- If two agents need to read the same file, that's fine — only writes conflict
- If tasks share a database/config file, make them sequential instead
- Provide explicit file boundaries: "You may modify src/auth/. Do NOT touch src/api/."
```

---

## Sequential Pipeline Pattern

**When to Use**: tech-lead-orchestrator (dependent workflows), ci-cd-architect

### Template

```
## Workflow

1. **Define Stages**: Order tasks by dependency.
   - Stage N+1 depends on Stage N's output
   - Each stage has a gate condition (what must be true to proceed)

2. **Execute Stage**: Run current stage's agent.
   - Pass previous stage's output as input
   - Set explicit gate condition for this stage
   - Set timeout

3. **Gate Check**: Verify stage completion.
   - Did the agent report DONE or DONE_WITH_CONCERNS?
   - Does the output meet the gate condition?
   - If BLOCKED or NEEDS_CONTEXT: stop pipeline, escalate

4. **Advance or Halt**: Proceed to next stage or stop.
   - On success: pass output to next stage
   - On failure: report where pipeline stopped and why
   - On concerns: present concerns to user before proceeding
```

### Output Format

```
## Pipeline Execution

| Stage | Agent | Gate Condition | Status | Duration |
|-------|-------|---------------|--------|----------|
| 1 | {agent} | {condition} | DONE | {time} |
| 2 | {agent} | {condition} | DONE | {time} |
| 3 | {agent} | {condition} | BLOCKED | - |

### Pipeline Status: COMPLETED | HALTED at Stage {N}
{reason if halted}
```

---

## Conflict Resolution Pattern

**When to Use**: tech-lead-orchestrator

### Template

```
## Workflow

1. **Detect**: Identify conflicts between agent outputs.
   - Same file modified by multiple agents
   - Contradictory recommendations
   - Incompatible design decisions

2. **Classify**: Determine conflict type.
   - MERGE: Both changes are valid, can be combined
   - CHOICE: Mutually exclusive options, must pick one
   - REDESIGN: Conflict reveals a deeper design issue

3. **Resolve**:
   - MERGE: Combine changes, verify consistency
   - CHOICE: Evaluate trade-offs, pick the better option (or escalate to user)
   - REDESIGN: Re-plan the affected area, re-dispatch

4. **Verify**: Confirm resolution.
   - Run tests after resolution
   - Check that no agent's work was silently lost
```
