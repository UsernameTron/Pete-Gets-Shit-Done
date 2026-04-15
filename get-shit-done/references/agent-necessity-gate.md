# Agent Necessity Gate

Three-part decision gate that runs before any new agent proposal. Prevents unnecessary agent proliferation by requiring justification across three independent dimensions.

Citable by any GSD workflow via `@get-shit-done/references/agent-necessity-gate.md`.

## When to Apply

Run this gate before:
- Proposing a new `agents/gsd-*.md` file
- Suggesting a subagent spawn in a workflow
- Recommending an agent in `/gsd:crew` assessments

## Gate Checks

### 1. Context Pollution

**Question:** Would doing this inline pollute the main context window?

| Signal | PASS | FAIL |
|--------|------|------|
| Intermediate output volume | >2000 tokens of scratch work | <500 tokens total |
| Files to read | >5 files across directories | 1-2 files in known locations |
| Exploration needed | Open-ended search required | Targeted lookup |
| Result reuse | Result discarded after use | Result needed in ongoing conversation |

**PASS** when: The task generates substantial intermediate output that would dilute the caller's working context. Example: scanning 16 agent files for frontmatter compliance.

**FAIL** when: The task is compact and its output is directly useful in the current conversation. Example: reading one config file and returning a value.

### 2. Parallelizability

**Question:** Can this run in parallel with other work?

| Signal | PASS | FAIL |
|--------|------|------|
| State dependency | Independent of conversation state | Requires sequential access |
| Shared resources | Reads only (no write conflicts) | Writes to shared files |
| Ordering constraint | No ordering requirement | Must complete before next step |
| Batch potential | One of several similar tasks | Unique, singular task |

**PASS** when: The task can execute simultaneously with other work without conflicts. Example: three independent file searches running concurrently.

**FAIL** when: The task must complete before the next step can start, and no other work can proceed meanwhile. Example: reading a config that determines the next action.

### 3. Specialization

**Question:** Does it need specialized tools, permissions, or isolation?

| Signal | PASS | FAIL |
|--------|------|------|
| Tool requirements | Different tool set than caller | Same tools suffice |
| Permission mode | Needs plan/acceptEdits/bypass | Same permission mode |
| Model requirements | Benefits from different model (e.g., haiku for speed) | Caller's model is appropriate |
| Isolation needs | Worktree isolation for safety | No isolation benefit |
| Domain expertise | Specialized system prompt adds value | General knowledge suffices |

**PASS** when: The task genuinely benefits from a different tool set, permission level, model, or system prompt. Example: a security review needs read-only mode and a threat-model prompt.

**FAIL** when: The caller already has everything needed. Example: writing a single file with the caller's existing Write tool access.

## Outcomes

| Check 1 | Check 2 | Check 3 | Outcome | Action |
|---------|---------|---------|---------|--------|
| PASS | PASS | PASS | **PASS** | Create the agent — all three dimensions justify it |
| FAIL | FAIL | FAIL | **FAIL** | Inline is correct — no dimension justifies an agent |
| PASS | PASS | FAIL | **AMBIGUOUS** | Prompt user — context + parallelism justify, but no specialization needed |
| PASS | FAIL | PASS | **AMBIGUOUS** | Prompt user — context + specialization justify, but must be sequential |
| FAIL | PASS | PASS | **AMBIGUOUS** | Prompt user — parallel + specialized but small context cost |
| PASS | FAIL | FAIL | **FAIL** | Context pollution alone is not sufficient — use /compact instead |
| FAIL | PASS | FAIL | **FAIL** | Parallelism alone is not sufficient — use background Bash instead |
| FAIL | FAIL | PASS | **AMBIGUOUS** | Prompt user — specialization alone may justify (e.g., security review) |

**Rule:** At least 2 of 3 checks must PASS for automatic approval. Single-PASS cases are AMBIGUOUS (except specialization-only, which may be promoted to PASS for security/compliance agents).

## Examples

### Example 1: PASS — Scanning 16 agent files for compliance

| Check | Result | Reasoning |
|-------|--------|-----------|
| Context pollution | PASS | 16 files x ~200 lines = ~3200 lines of intermediate output |
| Parallelizability | PASS | Can run alongside plan creation for another phase |
| Specialization | PASS | Benefits from read-only mode and compliance-focused prompt |
| **Outcome** | **PASS** | Create agent |

### Example 2: FAIL — Reading one config value

| Check | Result | Reasoning |
|-------|--------|-----------|
| Context pollution | FAIL | Single file, ~10 lines of output |
| Parallelizability | FAIL | Result needed immediately for next decision |
| Specialization | FAIL | Caller's Read tool is sufficient |
| **Outcome** | **FAIL** | Inline is correct |

### Example 3: AMBIGUOUS — Security review of a single file

| Check | Result | Reasoning |
|-------|--------|-----------|
| Context pollution | FAIL | Single file, moderate output |
| Parallelizability | FAIL | Must complete before approval |
| Specialization | PASS | Benefits from threat-model prompt and read-only isolation |
| **Outcome** | **AMBIGUOUS** | Specialization-only — promote to PASS for security agents per exception rule |
