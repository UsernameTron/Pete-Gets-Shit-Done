# [ADR-003] Specialist Subagents for Complex Tasks Only

**Status:** Accepted
**Date:** 2026-03-13

## Context

Simple extension requests (~80%) don't need subagent overhead. Complex requests (multi-event hooks, full plugins, read-only validation) benefit from dedicated context windows and specialized tool access.

## Decision

3 specialist agents (hook-engineer, plugin-builder, extension-validator) handle complex paths. Simple paths go directly to generator skills via the concierge. Follows Anthropic's three-part gate guidance added in Phase 7.

## Consequences

### Positive

- Token-efficient for common cases. Complex cases get full, clean context windows with role-specific system prompts.

### Negative

- Adding a new specialist requires creating an agent file and updating the concierge's routing logic.

### Neutral

- The concierge decides when to escalate to a specialist vs. handle directly — this decision point is the key routing judgment.
