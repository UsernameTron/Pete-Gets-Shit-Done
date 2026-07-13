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

<step name="gather_and_render">
Gather and render in one self-contained node invocation. Shell variables set in one Bash step
do not survive into the next tool call, and formatDashboard already computes the next action
internally, so a separate determine-next step is unnecessary.

```bash
node -e "
  const { gatherDailyState, formatDashboard } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
  const state = gatherDailyState('.planning');
  console.log(JSON.stringify({ _source: state._source, dashboard: formatDashboard(state) }));
"
```

Parse the single-line JSON result into `_source` and `dashboard`. The `_source` field tells you where data came from:
- `checkpoint` — fresh checkpoint data
- `state` — STATE.md fallback (no checkpoint present)
- `none` — no project state found

Print `dashboard` to the user verbatim. Do not add extra commentary — the dashboard is self-contained.

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
