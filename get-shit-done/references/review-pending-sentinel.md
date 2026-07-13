# Review-Pending Sentinel Protocol

`.planning/.review-pending` is an empty marker file recording explicit operator intent: uncommitted changes are deliberately held because the operator is mid-review and deferred committing. Stop-time automation cannot otherwise distinguish that state from "forgot to commit" (lesson 2026-04-10 [Hook Design] in `tasks/lessons.md`).

## Creating the sentinel

- Create it only when the operator explicitly defers committing pending their review ("let me see the diff first", "hold the commit").
- Command: `touch .planning/.review-pending`
- Never create it merely to end a session with a dirty tree. It records operator intent, not agent convenience.

## Consumers

| Consumer | Effect when the sentinel is present |
|----------|-------------------------------------|
| Governance Stop hook (`governance/templates/global/settings-hooks.json`) | A dirty working tree at Stop is approved with a "Deferred review" note instead of blocked. |
| Wrap gate (`get-shit-done/workflows/wrap-and-sync.md`) | Gate ceiling capped at "Commit local only"; the push option is removed. |
| W6 autonomous wrap (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) | Auto-commit of the wrap unit is skipped. |

## Scope limits

The sentinel affects only the Stop-event dirty-tree check. Every PreToolUse gate is sentinel-blind and fires regardless: the commit-on-main block, the private/generated staging block, the required-docs block, the secrets scan, the nested-.git check, and the pre-push dirty-tree check.

## Removing the sentinel

- Remove it as soon as the deferred review resolves (changes committed or discarded): `rm -f .planning/.review-pending`
- The sentinel is session-local state. Never commit it.
- A stale sentinel converts every future dirty-tree stop into a silent approve. Remove-on-resolve is part of the protocol; the Stop hook's deferred-review note names the sentinel so staleness stays visible.
