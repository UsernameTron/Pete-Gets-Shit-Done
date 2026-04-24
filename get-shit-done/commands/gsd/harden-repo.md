---
name: gsd:harden-repo
description: |
  Audit and enforce GitHub branch protection rules for the current repo's default branch.
  Compares current settings against GSD's standard policy and reports gaps. Use --fix to
  apply the policy, --dry-run to preview the payload. Use when setting up a new repo,
  after changing branch protection in the UI, or as a periodic governance check.
user-invocable: true
---

# /gsd:harden-repo

Audit GitHub branch protection settings against GSD's standard policy. Optionally enforce the policy with `--fix`.

## When to Use

- Setting up a new repo — ensure branch protection is configured correctly from the start
- After changing protection in the GitHub UI — verify the changes match the standard
- Periodic governance audit — confirm protection has not drifted
- After a security incident — verify enforcement is real, not cosmetic

## Usage

```
/gsd:harden-repo                    # Audit current repo's default branch
/gsd:harden-repo --fix              # Audit and fix with confirmation prompt
/gsd:harden-repo --fix --dry-run    # Show the PUT payload without sending
/gsd:harden-repo --branch main      # Target a specific branch
```

## What It Checks

- `required_pull_request_reviews` exists (blocks direct pushes)
- `required_approving_review_count` is 0 (forces PR path, no human gate)
- `dismiss_stale_reviews` is false
- `require_code_owner_reviews` is false
- `required_status_checks` exists with `strict: true`
- Existing status check contexts are preserved (never invented)
- `enforce_admins` is false
- `allow_force_pushes` is false
- `allow_deletions` is false
- `required_linear_history` is false
- `restrictions` is null

## Instructions

Route to: `@get-shit-done/workflows/harden-repo.md`

Parse `$ARGUMENTS` for:
- `--fix` flag: apply the standard policy (requires confirmation)
- `--dry-run` flag: show what --fix would do without applying
- `--branch <name>`: target branch (default: main)
