# Skill Creation Guide

## When to Use Skills vs CLAUDE.md

| Use Skills For | Use CLAUDE.md For |
|----------------|-------------------|
| Domain expertise Claude lacks | Project-specific preferences |
| Complex multi-file workflows | Session defaults |
| Reusable capabilities | Personal shortcuts |
| Team-shared specialized tools | Quick reference imports |

**Key Insight**: Skills are for *teaching Claude new capabilities*, not documenting what it already knows.

---

## Skill Locations

| Type | Location | Scope |
|------|----------|-------|
| Personal | `~/.claude/skills/{name}/` | All your projects |
| Project | `.claude/skills/{name}/` | Current project, shared via git |

---

## SKILL.md Structure

```markdown
---
name: skill-name-here
description: What it does AND when to use it. Include trigger terms.
allowed-tools: Tool1, Tool2  # Optional - restricts available tools
---

# Skill Name

## Instructions
[Concise, actionable guidance]

## Examples
[Concrete input/output pairs]
```

### Field Requirements

**name** (required):
- Max 64 characters
- Lowercase letters, numbers, hyphens only
- No spaces, no reserved words ("anthropic", "claude")
- Good: `pdf-form-filler`, `api-doc-generator`
- Bad: `My Skill`, `claude_helper`, `ProcessDocuments`

**description** (required):
- Max 1024 characters
- Must include WHAT it does + WHEN to use it
- Include trigger terms users would actually say
- Written in third person

---

## Writing Effective Descriptions

**The description is critical** - Claude uses it to decide when to invoke the skill.

### Bad Examples
```
description: Helps with documents
description: Processes data
description: Useful tool
```

### Good Examples
```
description: Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

description: Generates TypeScript API clients from OpenAPI specs. Use when creating API clients, working with OpenAPI/Swagger files, or generating typed HTTP clients.

description: Analyzes BigQuery datasets for sales metrics. Use when querying sales data, building revenue reports, or analyzing pipeline metrics.
```

### Description Formula
```
[Action verbs describing capabilities]. Use when [specific trigger conditions].
```

---

## Conciseness Rules

1. **Challenge every paragraph**: "Does Claude really need this?"
2. **Don't explain basics**: Claude knows what PDFs are
3. **Keep SKILL.md under 500 lines**
4. **Use separate files for reference material**: Progressive disclosure

### Token Cost Awareness

| Level | When Loaded | Cost |
|-------|-------------|------|
| Metadata (name, description) | Always at startup | ~100 tokens |
| SKILL.md body | When triggered | Variable (keep under 5k) |
| Referenced files | Only when Claude reads them | Unlimited potential |

---

## Progressive Disclosure Pattern

For complex skills, use a hub-and-spoke model:

```
my-skill/
├── SKILL.md           # Overview + navigation (under 500 lines)
├── REFERENCE.md       # Detailed API reference
├── EXAMPLES.md        # Extended examples
├── TROUBLESHOOTING.md # Common issues
└── scripts/
    └── helper.py      # Utility scripts
```

**SKILL.md points to other files:**
```markdown
## Quick Start
[Basic instructions here]

## Advanced Usage
For detailed API reference, see [REFERENCE.md](REFERENCE.md)
For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
```

Claude loads additional files **only when needed**.

---

## Tool Restrictions

Limit tool access for focused, safer skills:

```yaml
---
name: code-analyzer
description: Analyzes code for quality issues. Read-only, never modifies files.
allowed-tools: Read, Grep, Glob, Bash
---
```

Common tool sets:
- **Read-only**: `Read, Grep, Glob`
- **Read + limited bash**: `Read, Grep, Glob, Bash`
- **Full editing**: `Read, Write, Edit, Bash`
- **Web-enabled**: `Read, WebFetch, WebSearch`

---

## Workflow Pattern

For multi-step processes, provide a checklist:

```markdown
## Processing Workflow

Copy this checklist to track progress:
```
- [ ] Step 1: Analyze input file
- [ ] Step 2: Validate structure  
- [ ] Step 3: Process data
- [ ] Step 4: Generate output
- [ ] Step 5: Verify results
```

**Step 1: Analyze input file**
Run: `python scripts/analyze.py input.pdf`
...
```

---

## Validation Checklist

Before finalizing any skill:

- [ ] **Name**: Lowercase, hyphens, ≤64 chars, no reserved words
- [ ] **Description**: Non-empty, ≤1024 chars, includes WHAT + WHEN
- [ ] **Body**: Under 500 lines, concise
- [ ] **No redundancy**: Doesn't explain things Claude already knows
- [ ] **No time-sensitive info**: No dates that will become stale
- [ ] **Consistent terminology**: Same terms throughout
- [ ] **One level of references**: Don't nest file references deeply
- [ ] **Tested**: Actually works with relevant queries

---

## Common Anti-Patterns

### ❌ Too Verbose
```markdown
PDF (Portable Document Format) files are a common file format 
that contains text, images, and other content. To extract text 
from a PDF, you'll need to use a library...
```

### ✅ Concise
```markdown
Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
```

### ❌ Multiple Options Without Guidance
```markdown
You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image...
```

### ✅ Clear Default With Escape Hatch
```markdown
Use pdfplumber for text extraction.
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
```

### ❌ Windows Paths
```markdown
See scripts\helper.py
```

### ✅ Unix Paths (Always)
```markdown
See scripts/helper.py
```

---

## Creation Commands

```bash
# Create personal skill
mkdir -p ~/.claude/skills/my-skill
# Edit: ~/.claude/skills/my-skill/SKILL.md

# Create project skill
mkdir -p .claude/skills/my-skill
# Edit: .claude/skills/my-skill/SKILL.md

# View available skills
> What skills are available?

# Test skill triggers
> [Use natural language that should trigger your skill]
```

---

## Example: Minimal Skill

```markdown
---
name: commit-message-generator
description: Generates descriptive git commit messages from diffs. Use when writing commits or reviewing staged changes.
---

# Commit Message Generator

## Instructions
1. Run `git diff --staged` to see changes
2. Generate commit message with:
   - Subject line under 50 chars (imperative mood)
   - Blank line
   - Body explaining what and why

## Format
```
type(scope): brief description

- Detail 1
- Detail 2
```

Types: feat, fix, docs, style, refactor, test, chore
```

---

## Example: Multi-File Skill

```
api-client-generator/
├── SKILL.md
├── TEMPLATES.md
└── scripts/
    └── generate.py
```

**SKILL.md:**
```markdown
---
name: api-client-generator
description: Generates TypeScript API clients from OpenAPI specs. Use when creating API clients or working with OpenAPI/Swagger definitions.
allowed-tools: Read, Write, Bash
---

# API Client Generator

## Quick Start
```bash
python scripts/generate.py openapi.yaml --output src/api/
```

## Templates
For customizing output, see [TEMPLATES.md](TEMPLATES.md)
```
