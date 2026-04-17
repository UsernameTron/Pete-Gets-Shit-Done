<purpose>
Poll GitHub Actions CI runs for the current branch, wait for completion, surface
pass/fail results inline with a GSD-formatted table, fetch failed logs, match
against the CI failure pattern library, and provide actionable fix suggestions.

Activated by `/gsd:ci-watch`. No arguments required; optional `--interval N` to
override the default 15-second poll interval.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="detect_branch">
**Detect current branch:**

```bash
BRANCH=$(git branch --show-current)
```

If `$BRANCH` is empty (detached HEAD), report the error and exit:

```
Error: HEAD is detached. ci-watch requires a named branch.
Tip: Run `git checkout -b <branch-name>` to create a branch, then push.
```

If `git` is not installed or the directory is not a git repository, report:

```
Error: Not inside a git repository. ci-watch must be run from a project directory.
```

Otherwise store `$BRANCH` for use in all subsequent steps.
</step>

<step name="parse_args">
**Parse optional arguments from $ARGUMENTS:**

```
INTERVAL=15   # default poll interval in seconds

if $ARGUMENTS contains "--interval <N>"; then
  INTERVAL=<N>
fi
```

Accepted range: 5–300 seconds. If out of range, clamp to nearest bound and warn:

```
Warning: --interval <N> is outside the supported range (5–300). Using <clamped>.
```
</step>

<step name="initial_poll">
**Fetch current CI runs for the branch:**

```bash
gh run list \
  --branch "$BRANCH" \
  --limit 10 \
  --json databaseId,name,status,conclusion,url,createdAt
```

**Error handling:**
- If `gh` is not installed: `Error: GitHub CLI (gh) is not installed. Install it from https://cli.github.com`
- If not authenticated: `Error: Not authenticated with GitHub CLI. Run: gh auth login`
- If not inside a GitHub repository: `Error: This directory is not linked to a GitHub repository. Run: gh repo set-default`

Parse the JSON array. Each element has:
- `databaseId` — integer run ID
- `name` — workflow name (e.g., "Tests")
- `status` — "queued" | "in_progress" | "completed"
- `conclusion` — "success" | "failure" | "cancelled" | "skipped" | null (null while running)
- `url` — HTTPS URL to the run page
- `createdAt` — ISO 8601 timestamp

If the array is empty, print and exit:

```
No CI runs found for branch: $BRANCH

If you just pushed, GitHub Actions may need a moment to queue. Try again in 30s.
```

Store the run list as `RUNS`.
</step>

<step name="polling_loop">
**Poll until all runs reach terminal state:**

Terminal states: `status === "completed"` (regardless of conclusion).

Initialize tracking variables:
```
ALL_TERMINAL = false
POLL_COUNT = 0
```

Loop:

```
while ALL_TERMINAL is false:

  POLL_COUNT += 1

  Run the same gh run list command from initial_poll (reuse $BRANCH and limit).

  For each run, update RUNS with the latest status/conclusion.

  Count terminal runs (status === "completed").

  Build progress line:
    TOTAL = length of RUNS
    DONE  = count of runs where status === "completed"
    PASS  = count of runs where conclusion === "success"
    FAIL  = count of runs where conclusion === "failure" or "cancelled"
    IN_PROGRESS = TOTAL - DONE

  Display streaming status (overwrite previous line if terminal supports it):

    CI Watch [$BRANCH]: $DONE/$TOTAL complete ($PASS pass, $FAIL fail, $IN_PROGRESS running) — polling in ${INTERVAL}s...

  If DONE === TOTAL:
    ALL_TERMINAL = true
    break

  Sleep $INTERVAL seconds, then loop.
```

**SIGINT / Ctrl+C handling:**

If the user presses Ctrl+C during the polling loop, catch the interrupt signal and:

1. Print a blank line (to clear the streaming status line)
2. Print: `Interrupted. Showing results so far...`
3. Continue to the format_results step with whatever RUNS data is currently available
4. Mark any run still showing `status !== "completed"` with conclusion `"interrupted"` for display purposes

Do NOT exit silently on Ctrl+C — always show partial results.
</step>

<step name="format_results">
**Build and display the GSD-formatted results table:**

For each run in RUNS, compute:
- **Job** — `run.name`
- **Status** — Map conclusion to display label:
  - `"success"` → `pass`
  - `"failure"` → `FAIL`
  - `"cancelled"` → `cancelled`
  - `"skipped"` → `skipped`
  - `"interrupted"` (local flag) → `interrupted`
  - `null` (still running) → `running`
- **Duration** — Compute from `createdAt` to now (or fetch precise time via `gh run view <id> --json createdAt,updatedAt`)
  - Format as `Xm Ys` (e.g., `2m 31s`)
- **URL** — `run.url`

Display table:

```
+---------------------------+--------+----------+------------------------------------------+
| Job                       | Status | Duration | URL                                      |
+---------------------------+--------+----------+------------------------------------------+
| Tests (ubuntu-latest, 20) | pass   | 2m 31s   | https://github.com/.../runs/12345        |
| Tests (ubuntu-latest, 22) | pass   | 2m 45s   | https://github.com/.../runs/12346        |
| Tests (macos-latest, 22)  | FAIL   | 1m 12s   | https://github.com/.../runs/12347        |
| governance                | pass   | 0m 52s   | https://github.com/.../runs/12348        |
+---------------------------+--------+----------+------------------------------------------+
```

Column widths auto-pad to fit the widest value.

**If all runs passed (all conclusions are "success" or "skipped"):**

```
All CI runs passed.
```

Exit cleanly.

**If any runs failed (conclusion is "failure" or "cancelled"):**

Collect failed run IDs into `FAILED_RUNS`. Continue to fetch_failed_logs.
</step>

<step name="fetch_failed_logs">
**Fetch and extract error lines from failed runs:**

For each run ID in `FAILED_RUNS`:

```bash
gh run view <databaseId> --log-failed
```

**Do NOT dump the raw log output.** It can be thousands of lines.

Instead, scan the raw log output line by line and keep only lines that match these error markers:

- Lines containing `not ok`
- Lines containing `FAIL `
- Lines containing `Error:`
- Lines containing `exit code`
- Lines containing `AssertionError`
- Lines containing `SyntaxError`
- Lines containing `Cannot find module`
- Lines containing `EXDEV`

Keep at most **30 error-relevant lines** per failed run. If more than 30 lines match, keep the first 15 and last 15 (to capture both the root error and the final state).

Store extracted lines as `EXTRACTED_ERRORS[<databaseId>]`.

**Error handling:**
- If `gh run view` returns a non-zero exit code, store the error message in `EXTRACTED_ERRORS[<databaseId>]` as: `[Log fetch failed: <error message>]`
</step>

<step name="diagnose_and_suggest">
**Match extracted errors against the CI failure pattern library:**

Load the pattern library:

```bash
# Path relative to GSD install root
PATTERNS_FILE="$HOME/.claude/get-shit-done/lib/ci-patterns.json"
```

Read and parse `ci-patterns.json`. Each pattern has:
- `source` — regex string
- `flags` — regex flags (e.g., "i")
- `category` — short category name
- `description` — human-readable failure description
- `fix` — actionable fix suggestion

**Tier 1 — Pattern match (preferred):**

For each failed run's `EXTRACTED_ERRORS[<id>]`:

1. Concatenate all extracted lines into a single string
2. For each pattern in `ci-patterns.json`:
   - Construct `new RegExp(pattern.source, pattern.flags)`
   - Test against the concatenated error text
   - On first match, store: `DIAGNOSIS[<id>] = { matched: true, pattern: <pattern>, tier: 1 }`
   - Break (first-match wins)
3. If no pattern matched: `DIAGNOSIS[<id>] = { matched: false, tier: 2 }`

**Tier 2 — LLM fallback (no pattern matched):**

If `DIAGNOSIS[<id>].matched === false`, present the extracted error lines to Claude and ask:

```
These error lines were extracted from a failed CI run for the "$BRANCH" branch.
Analyze the errors and suggest a concrete fix.

Errors:
<extracted lines>
```

Claude analyzes and provides a suggested fix. Store result as:
`DIAGNOSIS[<id>] = { matched: false, tier: 2, suggestion: "<Claude's suggestion>" }`
</step>

<step name="format_failure_report">
**Display failure diagnosis below the results table:**

For each failed run, output a structured failure section:

```
## Failed: <run.name>

**Error:**
  <extracted error lines, indented 2 spaces each>

**Diagnosis:** <pattern.description OR "LLM analysis">
**Category:** <pattern.category OR "llm">
**Suggested Fix:** <pattern.fix OR Claude's suggestion>
```

Example (pattern match):

```
## Failed: Tests (macos-latest, 22)

**Error:**
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  not ok 47 phase.test.cjs > moveSync falls back on EXDEV

**Diagnosis:** Cross-device rename failed (EXDEV) — typically moveSync across filesystem boundaries
**Category:** cross-device
**Suggested Fix:** Use copySync + removeSync fallback instead of moveSync/renameSync. See lib/phase.cjs for the established pattern.
```

Example (LLM fallback):

```
## Failed: Tests (ubuntu-latest, 20)

**Error:**
  Error: Cannot find module '../lib/new-feature'
  Require stack:
    - /home/runner/work/project/tests/unit/new-feature.test.cjs

**Diagnosis:** LLM analysis
**Category:** llm
**Suggested Fix:** The module '../lib/new-feature' does not exist. Check that the file was committed and the path is correct relative to the test file.
```

After displaying all failure reports, print a final action prompt:

```
───────────────────────────────────────────────────────────────
Fix suggestions above. To investigate further:

  gh run view <databaseId> --log       # Full log for a run
  gh run rerun <databaseId>            # Re-run a failed job

Run /gsd:debug if you need a systematic debugging session.
───────────────────────────────────────────────────────────────
```
</step>

</process>

<configuration>

| Option | Default | Description |
|--------|---------|-------------|
| `--interval N` | 15 | Poll interval in seconds (range: 5–300) |
| `--limit N` | 10 | Max runs to fetch per poll (passed to `gh run list --limit`) |

</configuration>

<pattern_library>

The CI failure pattern library lives at:

```
$HOME/.claude/get-shit-done/lib/ci-patterns.json
```

It is a JSON array of objects with fields: `source`, `flags`, `category`, `description`, `fix`.

To add a new pattern without touching code, append a new object to `ci-patterns.json`.
The workflow loads and applies patterns dynamically on each invocation — no restart required.

Current seeded patterns:
- `cross-device` — EXDEV cross-device rename
- `missing-module` — Cannot find module / MODULE_NOT_FOUND
- `sha-pin` — GitHub Actions SHA pin mismatch
- `node-version` — Node.js version incompatibility
- `test-failure` — Test assertion failures
- `exit-code` — Non-zero process exit codes

</pattern_library>

<gh_commands_reference>

Commands used by this workflow:

| Command | Purpose |
|---------|---------|
| `gh run list --branch <branch> --limit <n> --json databaseId,name,status,conclusion,url,createdAt` | List recent runs for a branch |
| `gh run view <id> --log-failed` | Fetch only the failed step logs |
| `gh run view <id> --json createdAt,updatedAt` | Fetch precise timing for duration calculation |
| `gh run rerun <id>` | Re-trigger a failed run (shown in action prompt) |

All commands require `gh` to be installed and authenticated:
- Install: https://cli.github.com
- Auth: `gh auth login`

</gh_commands_reference>

<error_handling>

| Condition | Response |
|-----------|----------|
| `gh` not installed | Exit with install URL |
| Not authenticated | Exit with `gh auth login` instruction |
| Not a GitHub repo | Exit with `gh repo set-default` instruction |
| Detached HEAD | Exit with branch creation tip |
| No runs found | Print message and exit (runs may be queued) |
| Log fetch fails | Store error message, continue to next run |
| Pattern file missing | Skip pattern matching, fall through to LLM analysis |

</error_handling>

<success_criteria>
- [ ] Branch detected or error reported cleanly
- [ ] `gh run list` polled until all runs reach terminal state
- [ ] Streaming progress line displayed during polling
- [ ] Ctrl+C handled: shows partial results, never silently exits
- [ ] Results table formatted with columns: Job, Status, Duration, URL
- [ ] All-pass: prints summary line and exits
- [ ] Failures: `gh run view --log-failed` called for each failed run
- [ ] Error lines extracted (max 30 per run), raw log NOT dumped
- [ ] `ci-patterns.json` loaded and tested against extracted errors
- [ ] Pattern match used if available (Tier 1)
- [ ] LLM fallback used if no pattern matches (Tier 2)
- [ ] Failure report formatted with Error / Diagnosis / Suggested Fix sections
- [ ] Action prompt shown after failure reports
</success_criteria>
