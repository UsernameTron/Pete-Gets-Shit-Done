---
name: dev-recipes
description: |
  Browse and execute 86 pre-built recipes for application development agents
  and teams across 11 categories: core team, web frameworks, mobile, data/ML,
  systems, cloud/infra, DevOps, universal experts, domain specialists,
  orchestrators, and teams. Each recipe includes trigger phrases, pre-resolved
  decisions, and customization points.
user-invocable: true
argument-hint: "[category|recipe-id|search-terms]"
---

# Dev Recipes — 86 Agent & Team Recipes

Browse and deploy pre-built agent and team configurations.

## Categories

| Category | Recipes | File |
|----------|---------|------|
| Core Team | CT01–CT04 (4) | [recipes/core-team.md](recipes/core-team.md) |
| Web Frameworks | WF01–WF13 (13) | [recipes/web-frameworks.md](recipes/web-frameworks.md) |
| Mobile | MB01–MB06 (6) | [recipes/mobile.md](recipes/mobile.md) |
| Data & ML | DM01–DM08 (8) | [recipes/data-ml.md](recipes/data-ml.md) |
| Systems | SY01–SY06 (6) | [recipes/systems.md](recipes/systems.md) |
| Cloud & Infra | CI01–CI07 (7) | [recipes/cloud-infra.md](recipes/cloud-infra.md) |
| DevOps | DO01–DO06 (6) | [recipes/devops.md](recipes/devops.md) |
| Universal Experts | UE01–UE04 (4) | [recipes/universal-experts.md](recipes/universal-experts.md) |
| Domain Specialists | DS01–DS16 (16) | [recipes/domain-specialists.md](recipes/domain-specialists.md) |
| Orchestrators | OR01–OR02 (2) | [recipes/orchestrators.md](recipes/orchestrators.md) |
| Teams | TQ01–TQ14 (14) | [recipes/teams.md](recipes/teams.md) |

**Total: 86 recipes**

## Usage

If `$ARGUMENTS` is provided, handle as follows:

### No arguments
Display the category table above with counts.

### Category name (e.g., "mobile", "data-ml")
Read the matching recipe file and display all recipes in that category.

### Recipe ID (e.g., "CT01", "WF05", "TQ03")
Read the matching recipe file, find the specific recipe, display its details, and offer to execute it by invoking `agent-factory` with the archetype specification.

### Search terms (e.g., "Django", "code review", "ML pipeline")
Search across all recipe files for matching terms. Display matching recipes with their IDs and one-line descriptions.

## Execution

When the user selects a recipe to execute:

1. **Individual agent recipe** (CT/WF/MB/DM/SY/CI/DO/UE/DS/OR prefix):
   - Load the recipe's pre-resolved settings
   - Ask about any customization points
   - Invoke `agent-factory` to generate the agent file

2. **Team recipe** (TQ prefix):
   - Load the team pattern from `team-combo-engine`
   - Resolve any parameterized slots (ask user for framework/platform choices)
   - Generate all team agents via `agent-factory`
   - Generate team blueprint via `team-combo-engine`
