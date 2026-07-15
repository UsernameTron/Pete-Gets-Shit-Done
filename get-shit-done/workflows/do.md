<purpose>
Analyze freeform text from the user and route to the most appropriate GSD command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate">
**Check for input.**

If `$ARGUMENTS` is empty, ask via AskUserQuestion:

```
What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSD command.
```

Wait for response before continuing.
</step>

<step name="check_project">
**Check if project exists.**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load 2>/dev/null)
```

Track whether `.planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to a target.**

Load the routing registry — every routable command and workflow, each carrying its own self-description:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" do-registry
```

Read the entries (`name`, `type`, `description`, `argument_hint`). Route `$ARGUMENTS` to the single best target using your own judgment of which description matches the user's intent. The descriptions are the routing signal — there are no keyword rules.

**Requires `.planning/` directory:** All routes except `/gsd:new-project`, `/gsd:map-codebase`, `/gsd:help`, `/gsd:join-discord`, `workflow:daily-startup` (which handles a missing `.planning/` itself and routes to project setup), and `workflow:adopt-codebase` (which creates `.planning/`). If the project doesn't exist and the route requires it, suggest `/gsd:new-project` first.

**Ambiguity handling:** If the text could genuinely match multiple targets, ask the user via AskUserQuestion with the top 2-3 options, one line each on what would happen.
</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```
</step>

<step name="dispatch">
**Invoke the chosen command.**

Run the selected `/gsd:*` command, passing `$ARGUMENTS` as args.

**Workflow routes:** Entries whose name is `workflow:<name>` dispatch to a named workflow file instead of a command — execute `@$HOME/.claude/get-shit-done/workflows/<name>.md` end-to-end (exactly as an `execution_context` reference), passing `$ARGUMENTS`. These named flows come from the autonomous-workflows build-out (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`).

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via AskUserQuestion.

After invoking the command, stop. The dispatched command handles everything from here.
</step>

</process>

<success_criteria>
- [ ] Input validated (not empty)
- [ ] Registry loaded via `do-registry`; intent matched to exactly one target from it
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
</success_criteria>
