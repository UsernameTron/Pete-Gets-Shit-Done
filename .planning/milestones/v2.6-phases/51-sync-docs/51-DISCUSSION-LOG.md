# Phase 51: Sync Docs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 51-sync-docs
**Areas discussed:** Measurement strategy, CHANGELOG generation, Diff reporting, Execution model

---

## Measurement Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Live counts every time | Run npm test, npm run test:coverage, ls counts on every invocation — 30s acceptable | ✓ |
| Cached results | Parse cached test output or stored counts for speed | |
| Hybrid (cache + refresh flag) | Cache by default, --refresh to force live | |

**User's choice:** Live counts every time — accuracy over speed. No caching.
**Notes:** "Stale cache is the problem we're solving. 30 seconds is fine for a command you run once per milestone, not per minute." Specific count commands: `ls agents/gsd-*.md`, `ls commands/gsd/*.md`, `ls -d plugins/*/skills/*/`, `npm test` output parsing, `npm run test:coverage` "All files" line parsing.

---

## CHANGELOG Generation

| Option | Description | Selected |
|--------|-------------|----------|
| Conventional commit parsing since last tag | Parse feat:/fix:/docs:/chore: prefixes, group by category | ✓ |
| Milestone-based grouping | Group commits by milestone rather than prefix category | |
| Manual entry only | Don't auto-generate, just prompt the user | |

**User's choice:** Parse conventional commit prefixes since last git tag.
**Notes:** Mapping: feat: -> Added, fix: -> Fixed, docs: -> Changed, chore: -> Changed. Date range: since `git describe --tags --abbrev=0`, or initial commit if no tag. "Don't try to be clever — just list the commits in Keep a Changelog format."

---

## Diff Reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Inline terminal table | file | section | old -> new values | ✓ |
| Report file | Write a sync-report.md artifact | |
| Git diff only | Let git diff show the changes | |

**User's choice:** Inline terminal output with old -> new values.
**Notes:** "No report file — this is a terminal command, not an audit artifact. Show the actual before/after values so I can eyeball whether the changes are correct."

---

## Execution Model

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone workflow | Clean skill file, no agent delegation, find-and-replace with live inputs | ✓ |
| Delegate to docs-sync agent | Reuse existing agent with CHANGELOG additions | |
| Hybrid (agent + new logic) | Agent handles doc updates, new code handles CHANGELOG + reporting | |

**User's choice:** Standalone workflow.
**Notes:** "Don't overload [the agent]. Build a clean workflow that reads live counts, diffs against each doc file, makes surgical edits, and reports. Simpler, testable, no agent delegation overhead for what is fundamentally a find-and-replace operation with live inputs."

---

## Claude's Discretion

- Regex patterns for extracting current values from doc files
- Order of operations for doc updates
- Handling of missing docs (create vs. skip)
- Internal structure of the command skill file

## Deferred Ideas

None — discussion stayed within phase scope
