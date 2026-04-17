# Team Patterns

Orchestration recipes for coordinating multiple agents and skills.

---

## T01: Generation Team
**Category**: Team Pattern
**Trigger phrases**: "generate everything in parallel", "build all components", "parallel generation"
**Extension type**: Combo (Tier 2)
**Pattern**: Combo engine dispatches generators in parallel phases + extension-validator as quality gate
**Pre-resolved decisions**:
- Phase grouping: automatic via combo engine parallelization analysis
- Validation: batch validation after all phases complete
- Review: two-stage review loop with circuit breaker
**How it works**: This is the default complex path. When the combo engine generates 2-4 components, it automatically groups them into parallel phases and validates them together.
**Customization**: Adjust combo registry patterns or add custom combos.

---

## T02: Audit Team
**Category**: Team Pattern
**Trigger phrases**: "full environment audit", "check everything", "comprehensive review", "audit all my extensions"
**Extension type**: Multi-agent coordination
**Pattern**: recommendation-engine orchestrates setup-explainer + upgrade-scanner + extension-validator in parallel
**Pre-resolved decisions**:
- Scope: all (global + project) by default
- Depth: full scan with recommendations
- Output: ranked findings + prioritized action items
**How it works**: The recommendation-engine dispatches three analysis agents concurrently: setup-explainer inventories current extensions, upgrade-scanner checks for deprecations, and extension-validator audits structural quality. The recommendation engine synthesizes all findings into a prioritized report.
**Customization**: Limit scope to project-only or global-only.

---

## T03: Build Team
**Category**: Team Pattern
**Trigger phrases**: "build a complete system", "end-to-end solution", "full pipeline", "everything I need for"
**Extension type**: System (Tier 3)
**Pattern**: system-architect designs blueprint → generators execute per phase → extension-validator reviews all
**Pre-resolved decisions**:
- Architecture: blueprint-first (no generation without approval)
- Execution: phased parallel generation
- Validation: batch validation after all phases
- Install: unified installation guide with dependency ordering
**How it works**: The system-architect agent decomposes the request into components, maps dependencies, groups into parallel phases, and presents a blueprint. On approval, it coordinates generation across phases, then validates everything together.
**Customization**: Modify the blueprint before approving. Add or remove components.
