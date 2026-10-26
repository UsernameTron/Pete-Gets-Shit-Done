# Uninstall leaves orphaned hook registrations in settings.json

- **Status:** FIXED 2026-10-26 (`fix/reliability-sweep-2026-10-26`) — three entries added to `GSD_HOOK_REMOVALS` in `bin/lib/uninstall-steps.js`; `tests/install-cli-matrix.test.cjs` now asserts no `gsd-*` registration survives uninstall in any settings.json runtime
- **Owner:** unassigned
- **Earliest pickup:** after `refactor/install-split` merges (fix it in `bin/lib/uninstall-steps.js` there, not in the old monolith)

## Context

`--uninstall` deletes `gsd-cost-tracker.js`, `gsd-config-protection.js`, and `gsd-spawn-tracker.js` from `hooks/` (`bin/install.js:3466` on main), but the settings cleanup only strips statusline, check-update, context-monitor, and prompt-guard entries. The registrations added at `bin/install.js:4879-4886` / `4969-5031` stay in `settings.json`, pointing at files that no longer exist — every matching tool call then runs a missing-file hook.

## Proposed fix

Add the three hook names to the removal table (`GSD_HOOK_REMOVALS` on the split branch) and add one uninstall test asserting no `gsd-*` command survives in `settings.json` after uninstall.
