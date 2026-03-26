# Scope Flow — "Who is this for?"

Resolves: Installation SCOPE and file PATHS.

---

## Decision Tree

```
Q1: "Should this work across all your projects, or just this one?"

├── "All projects" → User scope
│   Paths: ~/.claude/skills/, ~/.claude/agents/, ~/.claude/settings.json
│
└── "Just this one" → Project scope. Continue:

    Q2: "Should your teammates have this too, or just you?"

    ├── "Teammates too" → Project shared
    │   Paths: .claude/skills/, .claude/agents/, .claude/settings.json (committed)
    │
    └── "Just me" → Project local
        Paths: .claude/settings.local.json (gitignored)
```

---

## Answer-to-Path Mapping

| Answer | Scope | Skills Path | Hooks/Settings Path | Committed? |
|--------|-------|------------|-------------------|-----------|
| All projects | user | ~/.claude/skills/ | ~/.claude/settings.json | N/A |
| This project, team | project-shared | .claude/skills/ | .claude/settings.json | Yes |
| This project, just me | project-local | .claude/skills/ | .claude/settings.local.json | No |

---

## Skip Conditions

| User said... | Skip | Already resolved |
|---|---|---|
| "all projects", "everywhere", "globally" | Q1 | user scope |
| "this project", "just here", "this repo" | Q1 | project scope |
| "for the team", "shared", "everyone on the team" | Q1+Q2 | project-shared |
| "just me", "personal", "don't share" | Q1+Q2 | project-local |

---

## Default Behavior

If scope is unknown after the max 3 questions (across all flows), default to
**project-local** (.claude/settings.local.json). Tell the user:

> "I'll set this up for just this project, just you. You can change the scope later."

This is the safest default — doesn't affect other projects or teammates.
