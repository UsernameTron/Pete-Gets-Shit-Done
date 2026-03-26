---
quick_id: 260326-kaw
description: Merge all branches to main and confirm
tasks: 3
---

# Plan: Merge all branches to main and confirm

## Task 1: Create PR for unmerged GSD table commit

The commit c3c203a (docs: add consolidated 57-command GSD quick-reference table) was pushed to `docs/readme-governance-plugins` after PR #21 was already merged. Create a new branch from this commit, open a PR, and merge it.

- Create branch `docs/readme-gsd-command-table` from current HEAD
- Push and create PR
- Merge PR

## Task 2: Update local main

- Checkout main
- Pull latest (includes PR #21 merge + new PR merge)

## Task 3: Clean up stale branches

- Delete local `chore/session-wrap-v1.1` (fully merged)
- Delete local `docs/readme-governance-plugins` (will be merged)
- Prune remote tracking branches
- Confirm clean state with `git branch -a`
