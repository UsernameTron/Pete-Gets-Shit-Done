# Quick Task 260326-j9x: Fix plugin placeholders + bump to v1.29.0

**Completed:** 2026-03-26
**PR:** #20

## Changes

1. **MCP Ecosystem plugin** — Replaced `[YOUR NAME]` with "Pete Connor" in 3 skill files:
   - `plugins/claude-mcp-ecosystem/skills/subagent-companion/SKILL.md`
   - `plugins/claude-mcp-ecosystem/skills/subagent-concierge/SKILL.md`
   - `plugins/claude-mcp-ecosystem/skills/project-guide/SKILL.md`

2. **Code Factory plugin** — Replaced `[YOUR GITHUB USERNAME]` with "UsernameTron" in:
   - `plugins/claude-code-factory/docs/getting-started.md`

3. **Version bump** — `package.json` version 1.28.0 → 1.29.0

## Verification

- `grep -r '\[YOUR NAME\]\|\[YOUR USERNAME\]\|\[YOUR GITHUB USERNAME\]' plugins/` returns zero matches
- `package.json` version confirmed as `1.29.0`

## Notes

- `[YOUR ORG]` placeholders in subagent-concierge SKILL.md and architecture.md are intentional template examples for end-users — left as-is
- No `[YOUR USERNAME]` placeholders existed anywhere in the codebase
