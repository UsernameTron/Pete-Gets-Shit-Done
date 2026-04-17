# Merge Strategies

How to safely merge extensions into existing configuration files.

---

## General Principle

Always **read → merge → write**. Never write from scratch if the file exists.

---

## Hooks (Append to Event Arrays)

1. Read existing settings JSON (or create `{}` if absent)
2. Ensure `hooks` object exists (create if not)
3. Ensure the event array exists (e.g., `hooks.PostToolUse` — create `[]` if not)
4. **APPEND** the new hook entry to the event array
5. Never replace the existing array — existing hooks must be preserved
6. Write updated JSON back to the file
7. If handler is `command` type with a script file:
   - Write script to `.claude/hooks/` or `~/.claude/hooks/`
   - Run `chmod +x` on the script

**Minimal valid structure** (new file):
```json
{
  "hooks": {
    "PostToolUse": []
  }
}
```

**Conflict detection**: If a hook with the same matcher AND command already exists in the array, warn instead of duplicating.

---

## Permissions (Append + Deduplicate)

1. Read existing settings JSON (or create `{}` if absent)
2. Ensure `permissions` object exists
3. Ensure the target array exists (`allow`, `deny`, or `ask`)
4. **APPEND** new rules to the array
5. **DEDUPLICATE** by exact string match
6. Write updated JSON

**Minimal valid structure** (new file):
```json
{
  "permissions": {
    "allow": [],
    "deny": [],
    "ask": []
  }
}
```

**Conflict detection**: If adding an `allow` rule that conflicts with an existing `deny` rule (or vice versa), warn the user: "This conflicts with an existing [deny/allow] rule: [rule]. The deny rule takes precedence."

---

## Settings Scalars (Overwrite with Warning)

1. Read existing settings JSON
2. Check if the key already has a non-default value
3. If yes: **WARN** — "This will change [key] from [old] to [new]. OK?"
4. On confirmation: set the key
5. Write updated JSON

**Never silently overwrite** an existing value the user may have set intentionally.

---

## MCP Servers (Add with Collision Check)

1. Read `.mcp.json` or create `{ "mcpServers": {} }` if absent
2. Check if a server with the same name already exists
3. If yes: **WARN** — "An MCP server named [name] already exists. Overwrite?"
4. On confirmation (or no collision): add server entry to `mcpServers`
5. Write updated JSON
6. For stdio transport: verify the command binary exists with `which`

---

## Rollback

If any write fails mid-operation:
- Settings JSON was read before modification — the original content is known
- Instruct: "The write failed. Your original settings are unchanged."
- If a partial write occurred: show the user the original JSON to restore manually
