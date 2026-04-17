---
name: cc-ref-cicd
description: |
  Claude Code CI/CD reference — GitHub Actions (claude-code-action@v1 inputs,
  trigger events, permissions, secrets), GitLab CI/CD (job configuration,
  runner setup, CI variables), headless CLI flags (--print, --output-format,
  --max-turns), cloud provider auth (Bedrock OIDC, Vertex WIF), cost controls.
  Background knowledge only — provides authoritative Claude Code documentation
  for CI/CD integration. NOT a user-invoked command.
user-invocable: false
---

# Claude Code Reference: CI/CD Integration

## Quick Reference

### GitHub Actions — claude-code-action@v1

**Action**: `anthropics/claude-code-action@v1` (GA release — never use `@beta`)

#### Action Inputs

| Input | Required | Purpose | Example |
|-------|----------|---------|---------|
| `anthropic_api_key` | Yes* | API key secret | `${{ secrets.ANTHROPIC_API_KEY }}` |
| `prompt` | No | Instructions for Claude | `"Review this PR for security issues"` |
| `claude_args` | No | CLI flags passed through | `"--max-turns 5 --model claude-sonnet-4-6"` |
| `settings` | No | JSON settings object | `'{"permissions": {"allow": ["Read"]}}'` |

*Not required when using Bedrock or Vertex AI authentication.

#### Trigger Events

| Use Case | Trigger Config |
|----------|---------------|
| @claude mentions | `issue_comment: [created]`, `pull_request_review_comment: [created]` |
| Auto-review PRs | `pull_request: [opened, synchronize]` |
| Scheduled | `schedule: [{cron: "0 9 * * *"}]` |
| On push | `push: {branches: [main]}` |
| Manual | `workflow_dispatch` |

#### CLI Flags (via claude_args)

| Flag | Purpose |
|------|---------|
| `--max-turns N` | Limit agentic turns (cost control) |
| `--model <model>` | Model selection (e.g., `claude-sonnet-4-6`, `claude-opus-4-6`) |
| `--append-system-prompt "..."` | Add custom instructions |
| `--allowedTools "Read,Grep,Glob"` | Restrict available tools |
| `--disallowedTools "Write,Bash"` | Block specific tools |
| `--permission-mode plan` | Read-only analysis mode |
| `--output-format json` | Structured output |

#### Required Permissions
```yaml
permissions:
  contents: read        # Minimum for read-only analysis
  pull-requests: write  # For PR comments/reviews
  issues: write         # For issue responses
```

#### Breaking Changes from Beta

| Old Beta Input | New v1.0 Input |
|----------------|---------------|
| `mode` | *(Removed — auto-detected)* |
| `direct_prompt` | `prompt` |
| `custom_instructions` | `claude_args: --append-system-prompt` |
| `max_turns` | `claude_args: --max-turns` |
| `model` | `claude_args: --model` |
| `allowed_tools` | `claude_args: --allowedTools` |
| `claude_env` | `settings` JSON format |

### GitLab CI/CD

#### Minimal Job Configuration
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
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    - claude -p "$PROMPT" --permission-mode acceptEdits --output-format json
```

#### Key Differences from GitHub Actions

| Aspect | GitHub Actions | GitLab CI/CD |
|--------|---------------|-------------|
| Claude invocation | `anthropics/claude-code-action@v1` | `claude -p` (CLI directly) |
| Installation | Pre-installed in action | `curl -fsSL https://claude.ai/install.sh \| bash` in before_script |
| API key | `${{ secrets.ANTHROPIC_API_KEY }}` | Masked CI/CD variable `ANTHROPIC_API_KEY` |
| Triggers | Workflow `on:` events | `rules:` with `$CI_PIPELINE_SOURCE` |

### Cloud Provider Authentication

| Provider | Setup |
|----------|-------|
| **Anthropic API** | `ANTHROPIC_API_KEY` in secrets/variables |
| **AWS Bedrock** | OIDC federation, set `CLAUDE_CODE_USE_BEDROCK=1` |
| **Google Vertex AI** | Workload Identity Federation, set `CLAUDE_CODE_USE_VERTEX=1` |

### Headless CLI Flags

For non-interactive (CI) usage:

| Flag | Purpose |
|------|---------|
| `-p "prompt"` | Single-shot prompt, then exit |
| `--output-format json` | Machine-parseable output |
| `--input-format stream-json` | Pipe structured input |
| `--max-turns N` | Limit turns to control costs |
| `--permission-mode acceptEdits` | Auto-accept file changes |
| `--allowedTools "..."` | Whitelist specific tools |
| `--verbose` | Detailed execution logging |

## Authoritative Sources

When you need complete documentation beyond the Quick Reference above, read the official Claude Code documentation for CI/CD. Key pages to consult:

- GitHub Actions documentation — action inputs, trigger events, permissions, setup, examples, security
- GitLab CI/CD documentation — job configuration, runner setup, provider authentication
- CLI reference — headless flags, output formats, permission modes

The Quick Reference section above contains the critical schemas for most tasks. Consult the full documentation only when the Quick Reference does not cover your specific question.

Read the actual documentation files. Do not rely on training knowledge for action input names, trigger event syntax, CLI flags, or provider authentication setup.
