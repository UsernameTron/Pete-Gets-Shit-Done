# Workspace residue inventory — 2026-10-26

Filed by the session close-down sweep (Gate 1b). No action taken; disposition is separate maintenance.

## Branches

| Branch | Head | Classification |
|---|---|---|
| `main` | `657804f` (tracks `origin/main`) | — |
| `refactor/install-split` | `2c4b3bd` | intentionally retained — this session's installer split, unpushed by instruction ("Do not push"); awaiting Pete's coverage decision before PR (see `install-split-followups.md`) |

## Stashes

| Ref | Created | Message | Classification |
|---|---|---|---|
| stash@{0} | 2026-10-26 | On main: untracked audit outputs `_code_audit/` `_radon_audit/` | created this session; pending Pete's gitignore-vs-delete call (recommend gitignore) |
| stash@{1} | 2026-07-28 | On feat/confidence-sweep: session-end: Stop-hook artifact + stray CTG audit prompt | pre-existing |
| stash@{2} | 2026-07-15 | On main: STATUS.md generated snapshot (untracked, ephemeral) | pre-existing, likely droppable |
| stash@{3} | 2026-05-08 | On main: stray Tracks-snapshot README — investigate later | pre-existing |

The stash stack is shared across worktrees and sessions; drop by SHA, not by index.
