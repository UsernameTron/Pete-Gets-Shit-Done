---
name: cc-ref-multi-agent
description: |
  Multi-agent system design reference — orchestration patterns (prompt chaining,
  routing, parallelization, orchestrator-workers, evaluator-optimizer), three-part
  gate for going multi-agent, context-centric decomposition, token economics,
  verification subagent pattern, eight prompt engineering principles.
  Background knowledge only — provides authoritative guidance for multi-agent
  architecture decisions. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: Multi-Agent Systems

## Three-Part Gate for Multi-Agent

All three gates must pass. If any fails, use a single agent.

| Gate | Question | Pass Condition |
|------|----------|----------------|
| Context Pollution | Does adding all context to one agent degrade performance? | Yes — information from one task confuses another |
| Parallelizability | Can subtasks run simultaneously? | Yes — independent work streams exist |
| Specialization | Does limiting tools/focus per agent improve outcomes? | Yes — specialized tool sets or domain focus helps |

Do not treat this as a loose suggestion. This is a strict gate. Multi-agent coordination costs (token overhead, latency, complexity) exceed benefits unless all three conditions hold.

## Five Orchestration Patterns

| Pattern | Description | Best When |
|---------|-------------|-----------|
| Prompt Chaining | Sequential steps, each processes prior output | Cleanly decomposable fixed subtasks |
| Routing | Input classification directs to specialized handlers | Distinct categories need separate treatment |
| Parallelization | Simultaneous via sectioning or voting | Subtasks independent OR multiple attempts boost confidence |
| Orchestrator-Workers | Central LLM dynamically decomposes and delegates | Subtasks cannot be predicted in advance |
| Evaluator-Optimizer | Generate-then-critique loop | Clear evaluation criteria exist, iteration adds value |

Key recommendation: **"Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when simpler solutions fall short."**

Patterns are listed in order of increasing complexity. Prefer the simplest pattern that satisfies the task requirements.

## Context-Centric vs Problem-Centric Decomposition

| Approach | Divides By | Example | Verdict |
|----------|-----------|---------|---------|
| Context-centric | Information boundaries | Feature agent handles its own code AND its tests | Correct |
| Problem-centric | Task type | Separate write/test/review agents | Wrong — fragments context |

**The rule**: agents should own all work related to a coherent context boundary, not a phase of the workflow.

**Exception — Verification subagent**: A dedicated verification agent is consistently effective because verification requires minimal context transfer (just the artifact to verify and the criteria). This is the one case where separating by task type works well.

## Token Economics

| Configuration | Token Multiplier vs Chat | When to Use |
|---------------|--------------------------|-------------|
| Single agent | ~4x | Most tasks — exhaust this first |
| Multi-agent | 3-10x | Only when three-part gate passes |
| Research multi-agent | ~15x | High-value research where quality justifies cost |

Key stats:
- Token usage explains **80% of performance variance** in multi-agent systems.
- Opus lead + Sonnet subagents outperformed single Opus by **90.2%** on internal research evaluations.
- Multi-agent overhead comes from each agent maintaining its own context window, coordination messages, and redundant context loading.

The implication: when multi-agent systems improve quality, it is primarily because they spend more tokens — not because of architectural cleverness. Budget tokens deliberately.

## Eight Prompt Engineering Principles

These principles apply specifically to multi-agent system design:

| # | Principle | Guidance |
|---|-----------|----------|
| 1 | Think like your agents | Mentally simulate the agent's perspective given only its context and tools |
| 2 | Teach the orchestrator to delegate | Make delegation criteria explicit in the orchestrator's prompt |
| 3 | Scale effort to query complexity | Simple queries should not trigger expensive multi-agent flows |
| 4 | Design tools carefully | Each agent's tool set should match its scope — no more, no less |
| 5 | Let agents improve themselves | Allow agents to refine their approach based on intermediate results |
| 6 | Start wide then narrow | Begin with broad exploration before converging on solutions |
| 7 | Guide the thinking process | Structure the agent's reasoning with explicit step-by-step instructions |
| 8 | Leverage parallel tool calling | Use simultaneous tool invocations to reduce latency and improve throughput |

## Authoritative Sources

- "Building Effective Agents" — Anthropic blog, December 2024 (orchestration pattern taxonomy, workflows vs agents distinction)
- "When to use multi-agent systems" — Anthropic blog, January 2026 (three-part gate, context-centric decomposition, token multipliers)
- "How we built our multi-agent research system" — Anthropic blog, June 2025 (Opus+Sonnet benchmarks, eight prompt engineering principles, 15x token finding)
- Claude Code subagent documentation — docs.anthropic.com (subagent frontmatter schema, context isolation, delegation mechanics)

The Quick Reference sections above contain the critical decision frameworks for most multi-agent architecture questions. Consult the full source documents only when the Quick Reference does not cover your specific question.

Read the actual documentation. Do not rely on training knowledge for token multipliers, orchestration pattern recommendations, or gate criteria.
