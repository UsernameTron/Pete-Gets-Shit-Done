# Blueprint Template — Combo Presentation Format

Use this format when presenting a coordinated extension combo to the user.
Every combo gets a blueprint that explains the system, not just the parts.

---

## Blueprint Structure

```
## [Combo Name]

[One sentence: what the system does as a whole]

### How It Works

[2-3 sentence plain-English explanation of the flow. No jargon.
Describe the behavior from the user's perspective.]

### Components (install in this order)

1. **[Component Name]** — [type]
   [What it does in one sentence]
   File: [path]

2. **[Component Name]** — [type]
   [What it does in one sentence]
   File: [path]

3. **[Component Name]** — [type] (optional)
   [What it does in one sentence]
   File: [path]

### How They Connect

- [Component A] reads from [Component B] to [do what]
- [Component C] triggers [Component A] when [condition]
- [Optional component] adds [additional behavior]

### To Test

1. [Specific action that triggers the system]
2. [What the user should observe]
3. [How to verify each component is working]

### To Customize

- **Change what triggers it**: modify the `matcher` in [component]
- **Adjust strictness**: change [specific field] in [component]
- **Remove optional pieces**: delete [component] without affecting the rest

### Install

> Want me to install all [N] pieces now?
>   1. **All my projects** — available everywhere
>   2. **Just this project, for the team** — teammates get it too
>   3. **Just this project, just me** — personal only
>   (or 'no' to just keep the files)
```

---

## Guidelines

### Ordering
- Present components in install order (dependencies first)
- Number components sequentially
- Mark optional components explicitly

### Connection Descriptions
- Use active voice: "reads from", "triggers", "blocks unless"
- Name both the source and target component
- Explain the data flow, not the mechanism

### Customization Pointers
- Point to specific fields, not abstract concepts
- Use "change X to Y" format
- Explain which components can be removed safely

### Complexity Awareness
- For 2-component combos: keep brief, merge "How They Connect" into component descriptions
- For 3-component combos: full blueprint
- For 4+ component combos: add a "Quick Start" section before the full breakdown

### Diff From Single-Extension Output
The blueprint replaces the standard concierge output format (Section 4) for combos.
Key differences:
- "How They Connect" section (combos only)
- Install-order numbering (combos only)
- "To Customize" with cross-component guidance (combos only)
- Teaching annotations still apply (Section 4 post-processing)
