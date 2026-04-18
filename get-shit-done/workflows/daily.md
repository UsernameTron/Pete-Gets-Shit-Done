<trigger>
Use when:
- User runs /gsd:daily
- Session start orientation
- After context reset to re-orient
- Returning to project after time away
</trigger>

<purpose>
Print a formatted dashboard showing milestone progress, phase status, plan completion,
git state, warnings (dirty tree, stale checkpoint), and the exact next GSD command.
Completes in under 2 seconds. No side effects — read-only operation.
</purpose>

<process>

<step name="gather_state">
Call gatherDailyState to collect all dashboard data from CHECKPOINT.json or STATE.md fallback.

```bash
DAILY_STATE=$(node -e "
  const { gatherDailyState } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  const state = gatherDailyState('.planning');
  console.log(JSON.stringify(state));
")
```

Parse the JSON result. The `_source` field tells you where data came from:
- `checkpoint` — fresh checkpoint data
- `state` — STATE.md fallback (no checkpoint present)
- `none` — no project state found
</step>

<step name="determine_next">
Call determineNextAction to get the exact next command.

```bash
NEXT_CMD=$(node -e "
  const { determineNextAction } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  const state = JSON.parse(process.env.DAILY_STATE);
  console.log(determineNextAction(state));
" DAILY_STATE="$DAILY_STATE")
```
</step>

<step name="format_and_print">
Call formatDashboard to get the formatted output string.

```bash
DASHBOARD=$(node -e "
  const { formatDashboard } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  const state = JSON.parse(process.env.DAILY_STATE);
  console.log(formatDashboard(state));
" DAILY_STATE="$DAILY_STATE")
```

Print the dashboard output to the user verbatim. Do not add extra commentary — the dashboard is self-contained.

After the dashboard, add a single line:

```
<sub>Data source: {_source} | Run `/gsd:checkpoint` to refresh</sub>
```
</step>

</process>

<error_handling>
**If .planning/ directory does not exist:**
Report: "No .planning/ directory found. Run /gsd:new-project to initialize."

**If node fails (daily.cjs not found):**
Report: "daily.cjs module not found. Ensure get-shit-done plugin is installed."

**If JSON parsing fails:**
Fall back to a minimal report:
"Daily dashboard could not parse state. Run /gsd:progress for detailed status."
</error_handling>
