<trigger>
Use when:
- User runs /gsd:harden-repo
- Setting up branch protection on a new repo
- Periodic governance audit of branch protection
- After a security incident or protection drift
</trigger>

<purpose>
Audit and enforce GitHub branch protection rules via the `gh` CLI.
Reads current protection, compares against GSD's standard policy, outputs a gap table,
and optionally applies fixes with user confirmation.

Key safety rule (from lessons.md): GitHub branch protection PUT replaces the entire
config. The CJS module handles read-merge-PUT internally — never call the API directly.
</purpose>

<process>

<step name="preflight">
**Parse arguments and verify gh CLI:**

Parse `$ARGUMENTS` for flags:
- `FIX` = true if `--fix` present, else false
- `DRY_RUN` = true if `--dry-run` present, else false
- `BRANCH` = value after `--branch`, default `main`

Verify gh is authenticated:

```bash
gh auth status 2>&1
```

If this fails, tell the user:
> gh CLI is not authenticated. Run `gh auth login` in your terminal, then retry.

Stop here if auth fails.
</step>

<step name="audit">
**Run the audit via gsd-tools:**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" harden-repo --branch BRANCH_VALUE
```

Replace `BRANCH_VALUE` with the parsed branch name.

Parse the JSON output. Extract:
- `gaps` array — each entry has `setting`, `expected`, `actual`, `pass`
- `allPass` boolean
- `passCount` and `totalCount`
- `noProtection` boolean — true if no protection is configured at all

Present the gap table to the user:

```
# Branch Protection Audit — {owner}/{repo} ({branch})

| Setting                                | Expected | Actual   | Result |
|----------------------------------------|----------|----------|--------|
| required_pull_request_reviews (exists)  | true     | ...      | PASS   |
| required_approving_review_count         | 0        | ...      | PASS   |
| ...                                     | ...      | ...      | ...    |

Result: X/Y settings compliant
```

If `noProtection` is true, add a warning:
> No branch protection is configured on this branch. All settings show FAIL.

If `allPass` is true and `FIX` is false:
> All branch protection settings match the standard policy. No action needed.

Stop here.
</step>

<step name="fix_decision">
**Determine fix path:**

If `FIX` is false and there are failures:
> To apply the standard policy: `/gsd:harden-repo --fix`
> To preview the payload first: `/gsd:harden-repo --fix --dry-run`

Stop here.

If `DRY_RUN` is true, proceed to dry run step.
If `FIX` is true without `DRY_RUN`, proceed to confirmation step.
</step>

<step name="dry_run">
**Show proposed payload (dry run):**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" harden-repo --branch BRANCH_VALUE --fix --dry-run
```

Parse the JSON output. Extract the `payload` field.

Present to the user:
> **Dry run** — this payload would be sent to GitHub via PUT:
>
> ```json
> {payload}
> ```
>
> To apply: `/gsd:harden-repo --fix --branch BRANCH_VALUE`

Stop here.
</step>

<step name="confirm">
**Ask for confirmation before applying:**

Use AskUserQuestion:
> Apply the standard policy to **{owner}/{repo}** branch **{branch}**?
>
> This will PUT the merged protection config (read-merge-PUT — existing status
> check contexts are preserved, no settings are lost).

Options:
- "Yes — apply protection rules"
- "Show payload first (dry run)"
- "Cancel"

If "Cancel": Stop.
If "Show payload first": Run the dry run step above.
If "Yes": Proceed to apply.
</step>

<step name="apply">
**Apply the policy:**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" harden-repo --branch BRANCH_VALUE --fix
```

Parse the JSON result. Check:
- `fixSuccess` — true if PUT succeeded
- `fixError` — error message if failed
- `verified` — true if post-fix audit shows all PASS
- `verifiedGaps` — the post-fix gap table

If `fixSuccess` is false:
> Failed to apply protection: {fixError}
>
> This may indicate insufficient permissions (admin access required) or a
> GitHub plan limitation.

Stop here.
</step>

<step name="verify">
**Post-fix verification:**

If `verified` is true:
> Protection applied and verified. All {totalCount} settings now compliant.

Present the post-fix gap table showing all PASS.

If `verified` is false:
> **WARNING:** Some settings did not apply correctly. Review the failures below:

Present the `verifiedGaps` table highlighting any remaining FAILs.

> This may indicate GitHub plan limitations (e.g., restrictions require GitHub
> Teams/Enterprise) or insufficient permissions. Check the GitHub settings UI
> to confirm the current state.
</step>

</process>

<success_criteria>
- [ ] gh CLI authenticated and repo detected
- [ ] Gap table displayed with all settings compared
- [ ] If --fix: user confirmed, policy applied, verification re-run shows all PASS
- [ ] If --dry-run: payload shown without applying
</success_criteria>
