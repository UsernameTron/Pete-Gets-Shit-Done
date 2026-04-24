---
phase: 46-housekeeping
plan: 02
status: complete
started: 2026-04-16
completed: 2026-04-16
---

## Summary

Added `<!-- workflow-exemption: ... -->` annotations to 15 command files that intentionally operate without companion workflows, and `<!-- orphan-workflow: ... -->` annotations to 2 workflows not referenced by any command or runtime workflow. The convention is now self-documenting and machine-parseable.

## Key Files

### Created
(none)

### Modified
- `commands/gsd/add-backlog.md` — workflow-exemption: inline
- `commands/gsd/crew.md` — workflow-exemption: inline
- `commands/gsd/debug.md` — workflow-exemption: inline
- `commands/gsd/finalize.md` — workflow-exemption: inline
- `commands/gsd/join-discord.md` — workflow-exemption: inline
- `commands/gsd/portfolio.md` — workflow-exemption: inline
- `commands/gsd/prime-patterns.md` — workflow-exemption: inline
- `commands/gsd/reapply-patches.md` — workflow-exemption: inline
- `commands/gsd/resume-work.md` — workflow-exemption: delegates to resume-project workflow
- `commands/gsd/review-backlog.md` — workflow-exemption: inline
- `commands/gsd/set-profile.md` — workflow-exemption: inline
- `commands/gsd/thread.md` — workflow-exemption: inline
- `commands/gsd/workstreams.md` — workflow-exemption: inline
- `commands/gsd/audit-agents.md` — workflow-exemption: inline (standardized comment added)
- `commands/gsd/audit-deps.md` — workflow-exemption: inline (standardized comment added)
- `get-shit-done/workflows/discovery-phase.md` — orphan-workflow annotation
- `get-shit-done/workflows/verify-phase.md` — orphan-workflow annotation

## Decisions
- Used HTML comments (`<!-- workflow-exemption: -->`) for machine parseability — future audits can grep for these
- Retained both orphaned workflows with rationale rather than removing them
- Documented name mismatch between resume-work.md command and resume-project.md workflow as intentional

## Self-Check: PASSED
- 15 commands with workflow-exemption annotations (grep confirmed)
- 2 workflows with orphan-workflow annotations (grep confirmed)
- 6 internal sub-workflows correctly left unmodified
