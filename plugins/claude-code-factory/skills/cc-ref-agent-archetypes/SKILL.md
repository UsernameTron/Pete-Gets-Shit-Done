---
name: cc-ref-agent-archetypes
description: |
  72 application development agent archetypes across 10 domains — system prompt
  templates, tool configs, model selections, and evaluation criteria. Background
  knowledge for generating app dev agents. Domains: core team, web frameworks,
  mobile, data/ML, systems, cloud/infra, DevOps, universal, domain specialists,
  orchestrators.
user-invocable: false
---

# Agent Archetypes Reference

72 archetypes across 10 domains for application development agent generation.

## How to Use

This skill is background knowledge for the `agent-factory` generator skill.
When generating an agent, look up the archetype in the appropriate domain file
to get the system prompt template, tool configuration, and model recommendation.

## Archetype Files

| File | Domain | Count |
|------|--------|-------|
| [core-team.md](core-team.md) | Code quality & documentation | 4 |
| [web-frameworks.md](web-frameworks.md) | Django, Rails, Laravel, React, Vue | 13 |
| [mobile.md](mobile.md) | iOS, Android, Flutter, React Native | 6 |
| [data-ml.md](data-ml.md) | Pipelines, ML frameworks, MLOps | 8 |
| [systems.md](systems.md) | Rust, C++, embedded, OS-level | 6 |
| [cloud-infra.md](cloud-infra.md) | AWS, GCP, Terraform, K8s | 7 |
| [devops.md](devops.md) | CI/CD, monitoring, SRE | 6 |
| [universal-experts.md](universal-experts.md) | Language-agnostic generalists | 4 |
| [domain-specialists.md](domain-specialists.md) | Security, testing, DB, a11y, etc. | 16 |
| [orchestrators.md](orchestrators.md) | Tech lead, team configurator | 2 |

**Total: 72 archetypes**

## Archetype Entry Format

Each archetype includes:
- **Name**: kebab-case identifier
- **Description**: One-line purpose
- **Model**: Recommended model (sonnet/haiku/opus)
- **Tools**: Recommended tool list
- **System Prompt Template**: Role, workflow, output format, constraints
- **Key Conventions**: Domain-specific patterns
