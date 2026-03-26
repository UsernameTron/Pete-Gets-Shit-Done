# [ADR-002] Reference Skills as Knowledge Backbone

**Status:** Accepted
**Date:** 2026-03-03

## Context

Generator skills need authoritative Claude Code documentation to produce correct output. Embedding documentation in each generator creates drift — when Claude Code updates, every generator must be updated independently.

## Decision

7 cc-ref-* reference skills hold all authoritative documentation. Generators preload them via the skills: frontmatter field. No generator embeds its own copy of Claude Code specs.

## Consequences

### Positive

- One update to a reference skill propagates to all generators. Phase 7 validated this — enriching references immediately improved generator output quality.

### Negative

- Generators depend on reference skills being loaded; if a reference skill is missing, the generator degrades silently.

### Neutral

- Reference skills add ~5k tokens each to generator context when preloaded.
