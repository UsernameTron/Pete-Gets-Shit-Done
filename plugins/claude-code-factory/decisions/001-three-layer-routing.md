# [ADR-001] Three-Layer Routing Architecture

**Status:** Accepted
**Date:** 2026-03-13

## Context

With 19 skills and 3 agents, users shouldn't need to know which component handles their request. Direct skill invocation requires memorizing names and capabilities, creating friction.

## Decision

Three invisible routing layers — Layer 0 (extension-guide) silently detects intent and routes, Layer 1 (extension-concierge) orchestrates and selects the right generator/validator, Layer 2 generators and validators execute the actual work.

## Consequences

### Positive

- Users describe what they want in plain language. Adding new generators only requires updating Layer 1 mapping.

### Negative

- Three-layer indirection adds token cost for routing decisions. Debugging which layer misrouted requires checking multiple skills.

### Neutral

- Routing logic lives in skill descriptions and the concierge's mapping table rather than in code.
