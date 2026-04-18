# Phase 51: Sync Docs - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A single command (`/gsd:sync-docs`) that audits all project documentation against live codebase state, rewrites stale sections with accurate values, auto-generates CHANGELOG entries from git history, and reports what changed — all inline in the terminal.

</domain>

<decisions>
## Implementation Decisions

### Measurement Strategy
- **D-01:** Run live counts every time — accuracy over speed. No caching. Stale cache is the problem being solved. 30 seconds is acceptable for a command run once per milestone.
- **D-02:** Count agents via `ls agents/gsd-*.md` (exclude `_archived/`), commands via `ls commands/gsd/*.md`, skills via `ls -d plugins/*/skills/*/`.
- **D-03:** Run `npm test` and parse output for test count and pass/fail. Run `npm run test:coverage` and parse the "All files" summary line for coverage percentages.

### CHANGELOG Generation
- **D-04:** Parse conventional commit prefixes since last git tag (`git describe --tags --abbrev=0`). If no tag exists, since initial commit.
- **D-05:** Mapping: `feat:` -> Added, `fix:` -> Fixed, `docs:` -> Changed, `chore:` -> Changed. Group by prefix category, not by milestone.
- **D-06:** Output in Keep a Changelog format. Don't try to be clever — just list the commits.

### Diff Reporting
- **D-07:** Inline terminal output only. No report file — this is a terminal command, not an audit artifact.
- **D-08:** Table format: file name | section updated | old value -> new value. Example: `README.md | agent count | 18 -> 17`.
- **D-09:** Show actual before/after values so the operator can eyeball correctness.

### Execution Model
- **D-10:** Standalone workflow. Do not delegate to the docs-sync agent or any other agent. Build a clean workflow that reads live counts, diffs against each doc file, makes surgical edits, and reports.
- **D-11:** No agent delegation overhead. This is fundamentally a find-and-replace operation with live inputs — keep it simple and testable.

### Claude's Discretion
- Regex patterns for extracting current values from doc files (test counts, agent counts, etc.)
- Order of operations (which docs to update first)
- How to handle docs that don't exist yet (create vs. skip)
- Internal structure of the command skill file

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SDOCS-01 through SDOCS-06 define acceptance criteria

### Target Documents (files the command will update)
- `README.md` — Public-facing project doc with install, usage, status
- `CLAUDE.md` — Project governance consumed by Claude Code
- `.planning/PROJECT.md` — Milestone history, current state, requirements
- `docs/DEVOPS-HANDOFF.md` — Environment, configuration, security, deployment

### Source of Truth References
- `Petes-Get-Shit-Done-Coding-Automation/commands/gsd/` — Command count source
- `Petes-Get-Shit-Done-Coding-Automation/agents/` — Agent count source (exclude `_archived/`)
- `Petes-Get-Shit-Done-Coding-Automation/plugins/*/skills/*/` — Skill count source
- `package.json` — Version source

### Prior Art
- `.claude/agents/docs-sync.md` — Existing docs-sync agent (different purpose but similar source-of-truth patterns)
- Phase 48 CONTEXT.md — Prior documentation sync decisions (D-04 target audience, D-05 verified counts pattern)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs-sync` agent has established source-of-truth commands (file counts via `ls`, test stats via `npm test`, coverage via `npm run test:coverage`, version via `package.json`). Same commands apply here but executed inline, not via agent.
- `gsd-tools.cjs` CLI provides `commit`, `state`, and `init` utilities for post-update operations.

### Established Patterns
- Commands are `.md` skill files in `commands/gsd/` with frontmatter
- CommonJS for any lib-level code (`lib/*.cjs`)
- `node:test` for test files (`tests/*.test.cjs`)
- Surgical doc edits: find the stale section, replace only that section, preserve surrounding structure

### Integration Points
- New command file: `commands/gsd/sync-docs.md`
- Target docs: README.md, CLAUDE.md, .planning/PROJECT.md, docs/DEVOPS-HANDOFF.md, CHANGELOG.md
- Test file: `tests/` directory for any testable lib logic

</code_context>

<specifics>
## Specific Ideas

- Agent count uses `gsd-*.md` glob pattern (not all `.md` in agents/)
- CHANGELOG uses Keep a Changelog format with conventional commit prefix mapping
- Diff report uses inline table with old -> new values for operator verification
- Command runs once per milestone, not frequently — optimize for accuracy, not speed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 51-sync-docs*
*Context gathered: 2026-04-17*
