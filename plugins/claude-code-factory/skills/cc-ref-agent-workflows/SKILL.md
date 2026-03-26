---
name: cc-ref-agent-workflows
description: |
  Workflow patterns and reusable system prompt building blocks for application
  development agents across all domains. Includes review, optimization, audit,
  delegation, ML workflow, infrastructure, and composable prompt patterns.
user-invocable: false
---

# Agent Workflow Patterns Reference

Reusable workflow patterns and composable prompt building blocks for generating
application development agents.

## How to Use

This skill is background knowledge for the `agent-factory` generator skill.
When generating an agent's system prompt, compose the workflow section from
these patterns and build the prompt structure from the building blocks.

## Pattern Files

| File | Category | Patterns |
|------|----------|----------|
| [review-patterns.md](review-patterns.md) | Review & Analysis | Code review, PR review, security review, severity classification |
| [optimization-patterns.md](optimization-patterns.md) | Performance | Baseline-profile-fix-validate, metrics, regression detection, load testing |
| [audit-patterns.md](audit-patterns.md) | Audit & Compliance | Codebase audit, dependency audit, security audit, compliance audit |
| [delegation-patterns.md](delegation-patterns.md) | Orchestration | Task decomposition, parallel dispatch, sequential pipeline, conflict resolution |
| [ml-workflow-patterns.md](ml-workflow-patterns.md) | Data & ML | Data exploration, training, deployment, experiment tracking, data quality |
| [infrastructure-patterns.md](infrastructure-patterns.md) | Infrastructure | Provisioning, migration, scaling, disaster recovery, cost optimization |
| [prompt-building-blocks.md](prompt-building-blocks.md) | Composable Blocks | Role definition, workflow steps, output format, constraints, status protocol |

## Pattern Entry Format

Each pattern includes:
- **Name**: Pattern identifier
- **When to Use**: Which archetypes benefit from this pattern
- **Template**: Copy-paste-ready workflow steps
- **Output Format**: Expected output structure
- **Variations**: Common modifications for different domains
