# check-doc-drift guards too few README claims

- **Status:** open
- **Owner:** unassigned
- **Earliest pickup:** any time

## Context

The 2026-10-26 README audit found 27 stale claims; `scripts/check-doc-drift.cjs` guarded only 2, so the `docs-integrity`/drift CI gate stayed green while the README listed 12 skills that had moved to `_absorbed/`, wrong subagent counts, 6 of 8 runtimes, and invented hooks.

## Proposed fix

Add drift metrics for the claims that rotted:
- README skill-section headers (`## Code Factory Skills (N)`, its three `(N skills)` subsections) vs `plugins/claude-code-factory/skills/`
- plugin-inventory Skills/Subagents columns vs `plugins/*/skills/`, `plugins/**/agents/`, `agents/gsd-*.md`
- `### GSD Commands (N)` and "the N commands" vs `commands/gsd/*.md`
- hook total (`### The N Hooks`) vs `hooks/*.js` + governance settings-hooks + MCP hooks.json
- skill rows: every `| name |` in the skill tables must exist on disk
