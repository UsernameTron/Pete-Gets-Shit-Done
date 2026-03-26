# Behavior Flow — "What should it do?"

Resolves: TRIGGER CONDITIONS (matcher), TOOL ACCESS (allowed-tools), and file type filters.

---

## Trigger Resolution

```
Q1: "What action should trigger this? For example:
     - When Claude edits a file
     - When Claude runs a shell command
     - When Claude reads something
     - Something else (describe it)"

├── "Edits a file" → matcher: Write|Edit
├── "Runs a command" → matcher: Bash
│   Q2: "Any specific commands? For example, 'only git commands'
│        or 'any command'?"
│   ├── Specific → matcher: Bash(git *) or Bash(npm *)
│   └── Any → matcher: Bash (no filter)
├── "Reads something" → matcher: Read
└── "Something else" → describe → infer matcher or omit
```

---

## Tool Access Resolution

```
Q2 (if tool access undetermined):
"Should Claude be able to change files when doing this, or just read them?"

├── "Just read" → allowed-tools: Read, Glob, Grep
├── "Change files" → allowed-tools: Read, Write, Edit, Glob, Grep
└── "Full access" → allowed-tools: Read, Write, Edit, Bash, Glob, Grep
```

---

## File Type Filtering

```
Q3 (if file type filter needed):
"Should this apply to all files, or specific types?
 For example: only .ts files, only .py files"

├── Specific → add file extension filter to command/matcher
└── All → no filter
```

---

## Answer-to-Field Mapping

| Trigger Answer | matcher |
|----------------|---------|
| "edits a file" / "writes code" | Write\|Edit |
| "runs a command" / "shell" | Bash |
| "specific commands" | Bash(pattern *) |
| "reads a file" | Read |
| "any tool" / no preference | (omit — fires on all) |

| Access Answer | allowed-tools |
|---------------|--------------|
| "Just read" | Read, Glob, Grep |
| "Read and change" | Read, Write, Edit, Glob, Grep |
| "Full access" | Read, Write, Edit, Bash, Glob, Grep |
| "Plus web" | Add WebFetch to above |

---

## Skip Conditions

| User said... | Skip | Already resolved |
|---|---|---|
| "edits a file", "on save", "when code changes" | Trigger Q1 | Write\|Edit |
| "runs a command", "shell", "terminal" | Trigger Q1 | Bash |
| "git commit", "npm test" | Trigger Q1+Q2 | Bash(specific) |
| "read only", "just analyze" | Access Q2 | Read, Glob, Grep |
| "make changes", "fix", "edit" | Access Q2 | Read, Write, Edit, Glob, Grep |

---

## Worked Examples

**"Block dangerous shell commands"**
- "shell commands" → skip trigger Q1 (Bash)
- "block" → this is about preventing, not tool access
- No tool access question needed (hooks don't have allowed-tools)
- Resolved: matcher: Bash

**"Create a specialist that reviews code"**
- No trigger (subagent, not hook) → skip trigger questions entirely
- "reviews" → read-only behavior → allowed-tools: Read, Glob, Grep
- Resolved: tools: Read, Glob, Grep, permissionMode: plan

**"Something to help with TypeScript"**
- No clear trigger → might ask trigger Q1 if it's a hook
- If skill → ask access Q2: "Should it change files or just read?"
- Resolved after 1-2 questions
