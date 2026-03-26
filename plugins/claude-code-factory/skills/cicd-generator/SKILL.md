---
name: cicd-generator
description: |
  Generates CI/CD pipeline configurations for Claude Code — GitHub Actions
  workflows and GitLab CI/CD jobs. Produces correct YAML with action versions,
  trigger events, secrets, permissions, Claude CLI flags, and cost controls.
  Use when setting up automated code review, PR automation, issue triage,
  or any CI/CD pipeline using Claude Code. Triggers on: "GitHub Actions",
  "CI/CD pipeline", "automate PRs", "code review action", "GitLab CI",
  "set up CI/CD with Claude", "deploy with Claude".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
user-invocable: true
skills: cc-ref-cicd
---

# CI/CD Generator — Claude Code Pipeline Generator

## 1. Role & Workflow

You generate CI/CD pipeline configurations that integrate Claude Code into
GitHub Actions or GitLab CI/CD workflows.

**4-step process — execute every time:**

1. **IDENTIFY** — Determine platform (GitHub/GitLab) and use case.
   Announce: "I'll create a **[platform]** workflow for **[use case]**."
2. **LOAD** — Read the `cc-ref-cicd` reference skill if loaded in your context,
   or read the official Claude Code documentation for the relevant platform.
   Key topics: GitHub Actions integration, GitLab CI/CD setup,
   and headless/non-interactive CLI usage.
3. **RESOLVE** — Make all decisions using the Resolution Engine.
   Present the workflow to the user before writing.
4. **OUTPUT** — Write the workflow file and provide setup instructions.

---

## 2. Platform Selection

| Platform | When to Use | File Location |
|----------|------------|---------------|
| **GitHub Actions** | GitHub repos, PR automation, issue triage | `.github/workflows/<name>.yml` |
| **GitLab CI/CD** | GitLab repos, MR automation | `.gitlab-ci.yml` |

Default to GitHub Actions unless the user specifies GitLab or the project
has a `.gitlab-ci.yml` file.

---

## 3. Resolution Engine — GitHub Actions

### Action Version

Use `anthropics/claude-code-action@v1` (GA release). Never use `@beta`.

### Trigger Events

| Use Case | Trigger | Events |
|----------|---------|--------|
| Respond to @claude mentions | issue/PR comments | `issue_comment`, `pull_request_review_comment` |
| Auto-review PRs | PR opened/updated | `pull_request: [opened, synchronize]` |
| Daily reports | Scheduled | `schedule: [{cron: "0 9 * * *"}]` |
| On push | Code pushed | `push: {branches: [main]}` |
| Manual | Workflow dispatch | `workflow_dispatch` |

### Action Inputs

| Input | Purpose | Example |
|-------|---------|---------|
| `anthropic_api_key` | API key secret | `${{ secrets.ANTHROPIC_API_KEY }}` |
| `prompt` | Instructions for Claude | `"Review this PR for security issues"` |
| `claude_args` | CLI flags passed through | `"--max-turns 5 --model claude-sonnet-4-6"` |
| `settings` | JSON settings | `'{"permissions": {"allow": ["Read"]}}'` |

### Key CLI Flags (via claude_args)

| Flag | Purpose | Example |
|------|---------|---------|
| `--max-turns N` | Limit agentic turns | `--max-turns 10` |
| `--model` | Model selection | `--model claude-opus-4-6` |
| `--append-system-prompt` | Custom instructions | `--append-system-prompt "Follow our coding standards"` |
| `--allowedTools` | Restrict tools | `--allowedTools "Read,Grep,Glob"` |
| `--permission-mode plan` | Read-only analysis | `--permission-mode plan` |
| `--output-format json` | Structured output | `--output-format json` |

### Permissions & Security

- Always use `${{ secrets.ANTHROPIC_API_KEY }}` — never hardcode
- For Bedrock/Vertex, configure OIDC federation
- Set `permissions:` block to minimum required
- Consider `--max-turns` to control costs

---

## 4. Resolution Engine — GitLab CI/CD

### Job Configuration

```yaml
stages:
  - ai

claude:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - npm install -g @anthropic-ai/claude-code
  script:
    - claude -p "$PROMPT" --output-format json
```

### Key Differences from GitHub

- Claude Code installed via npm in `before_script`
- API key via masked CI/CD variable `ANTHROPIC_API_KEY`
- Uses `claude -p` directly (no action wrapper)
- Trigger rules use GitLab CI/CD syntax

---

## 5. Common Workflow Templates

### @claude Mention Responder (GitHub)
```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Automated PR Review (GitHub)
```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR for code quality, correctness, and security.
            Post findings as review comments.
          claude_args: "--max-turns 5"
```

### Scheduled Analysis (GitHub)
```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
```

---

## 6. Output Protocol

### Step 1: Write Workflow File

- GitHub: `.github/workflows/<name>.yml`
- GitLab: append to or create `.gitlab-ci.yml`

### Step 2: Summary

Provide:
- **File created**: absolute path
- **Setup steps**:
  1. Add `ANTHROPIC_API_KEY` to repository secrets (GitHub) or CI/CD variables (GitLab)
  2. Install Claude GitHub App (if using @claude mentions)
  3. Commit and push the workflow file
- **Cost controls**: `--max-turns` recommendation, timeout settings
- **Test it**: how to trigger the workflow (e.g., "@claude review this PR")
- **Security**: remind about secret management and minimum permissions

---

## 7. Validation Checklist

- [ ] Action version is `@v1` (not `@beta`)
- [ ] API key uses secrets/variables, never hardcoded
- [ ] Trigger events match the use case
- [ ] `prompt` is clear and specific
- [ ] `--max-turns` set to prevent runaway costs
- [ ] Permissions block is minimal
- [ ] YAML is valid and correctly indented
- [ ] For GitLab: `before_script` installs Claude Code
