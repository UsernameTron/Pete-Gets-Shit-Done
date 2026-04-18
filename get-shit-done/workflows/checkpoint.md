<trigger>
Use when:
- User runs /gsd:checkpoint
- Before context reset (/clear)
- Context window approaches 75%
- Session is ending
- A plan just completed and next session will continue from a different plan
</trigger>

<purpose>
Write a deterministic checkpoint to .planning/CHECKPOINT.json capturing current session state
so the next session can resume without re-reading everything from scratch.
</purpose>

<process>

<step name="gather_state">
Determine the current state and any user-provided overrides.

1. Identify the .planning/ directory path (usually `.planning/` relative to project root).
2. Parse any arguments from $ARGUMENTS:
   - If free text is present (not a flag), treat it as `context_note`
   - If `--next-action` flag is present, extract its value as `next_action`
   - If `--files` flag is present, extract the list as `files_modified`

If no `context_note` is provided, the module derives state from current files.
If no `next_action` is provided, the module infers it from plan completion status.

Example argument patterns:
- `/gsd:checkpoint` → no overrides, all auto-derived
- `/gsd:checkpoint Completed plan 52-01` → context_note = "Completed plan 52-01"
- `/gsd:checkpoint --next-action "/gsd:execute-phase 52"` → next_action override
</step>

<step name="write_checkpoint">
Call writeCheckpoint via node to write CHECKPOINT.json.

**Option A — no overrides (most common):**
```bash
node -e "
  const { writeCheckpoint } = require('$HOME/.claude/get-shit-done/bin/lib/checkpoint.cjs');
  const result = writeCheckpoint('.planning');
  console.log(JSON.stringify(result, null, 2));
"
```

**Option B — with context_note override:**
```bash
CONTEXT_NOTE="[user provided text]"
node -e "
  const { writeCheckpoint } = require('$HOME/.claude/get-shit-done/bin/lib/checkpoint.cjs');
  const result = writeCheckpoint('.planning', { context_note: process.env.CONTEXT_NOTE });
  console.log(JSON.stringify(result, null, 2));
" CONTEXT_NOTE="$CONTEXT_NOTE"
```

**Option C — with next_action override:**
```bash
NEXT_ACTION="[user provided action]"
node -e "
  const { writeCheckpoint } = require('$HOME/.claude/get-shit-done/bin/lib/checkpoint.cjs');
  const result = writeCheckpoint('.planning', { next_action: process.env.NEXT_ACTION });
  console.log(JSON.stringify(result, null, 2));
" NEXT_ACTION="$NEXT_ACTION"
```

**Option D — with multiple overrides:**
```bash
node -e "
  const { writeCheckpoint } = require('$HOME/.claude/get-shit-done/bin/lib/checkpoint.cjs');
  const result = writeCheckpoint('.planning', {
    context_note: 'Completed plan 52-01, starting 52-02 next',
    next_action: '/gsd:execute-phase 52'
  });
  console.log(JSON.stringify(result, null, 2));
"
```

The writeCheckpoint function automatically reads git state (branch, commit), STATE.md
(milestone, phase, phase_name), and scans the phase directory for completed plans.
Caller overrides win — they are merged last.
</step>

<step name="confirm">
Parse the returned checkpoint JSON and report to the user:

```
Checkpoint written to .planning/CHECKPOINT.json

Branch:  {branch}
Phase:   {phase} — {phase_name}
Plans:   {plans.completed.length}/{plans.total} completed
         Completed: {plans.completed.join(', ') or 'none'}
         Active:    {plans.active or 'none'}
         Pending:   {plans.pending.join(', ') or 'none'}
Next:    {next_action or '(not set — update with --next-action)'}
```

If a context_note was set:
```
Note:    {context_note}
```

Then add:
```
Next session: /gsd:resume-work will pick up from here and skip completed plans.
```
</step>

</process>

<error_handling>
**If .planning/ directory does not exist:**
Report: "No .planning/ directory found. Is this a GSD project? Run /gsd:new-project first."

**If git is not initialized:**
The module uses safe defaults (branch: 'unknown', commit: '0000000'). Report the checkpoint
was written but git state could not be read.

**If STATE.md is missing:**
The module uses empty defaults for milestone/phase. The checkpoint is still written — it will
have empty milestone/phase fields. Report that STATE.md was not found.

**If node fails:**
Run the verification step manually:
```bash
cat .planning/CHECKPOINT.json
```
If the file was written, the checkpoint succeeded despite the output error.
</error_handling>
