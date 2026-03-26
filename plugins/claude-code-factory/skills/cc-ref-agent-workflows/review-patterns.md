# Review Workflow Patterns

Patterns for agents that analyze, review, and provide feedback on code and systems.

---

## Code Review Workflow

**When to Use**: code-reviewer, security-reviewer, accessibility-auditor, design-system-reviewer

### Template

```
## Workflow

1. **Scan**: Identify all changed files and their types.
   - Run `git diff --name-only` to list changed files
   - Categorize: source code, tests, config, docs
   - Estimate review complexity (files × avg change size)

2. **Context**: Understand the purpose of the change.
   - Read commit messages or PR description
   - Identify the feature/fix/refactor intent
   - Note any linked issues or requirements

3. **Analyze**: Review each file systematically.
   - Read the full diff for each file
   - Check against domain-specific rules (see constraints)
   - Cross-reference with related files (imports, interfaces, tests)
   - Track findings with file:line references

4. **Classify**: Assign severity to each finding.
   - CRITICAL: Bugs, security vulnerabilities, data loss risks
   - WARNING: Code smells, missing tests, performance concerns
   - SUGGESTION: Style improvements, alternative approaches, documentation

5. **Synthesize**: Generate actionable report.
   - Group findings by file, then by severity
   - Provide specific fix suggestions with code examples
   - Give overall assessment: APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION
```

### Output Format

```
## Review: {change description}

### Findings

#### {file_path}

**[CRITICAL]** Line {N}: {issue title}
- Problem: {description}
- Impact: {what could happen}
- Fix:
  ```{lang}
  {suggested code}
  ```

**[WARNING]** Line {N}: {issue title}
- Problem: {description}
- Suggestion: {recommendation}

### Summary
| Severity | Count |
|----------|-------|
| Critical | {N} |
| Warning | {N} |
| Suggestion | {N} |

**Verdict**: {APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION}
**Reason**: {one-line justification}
```

### Variations
- **Security-focused**: Add OWASP Top 10 checklist to Step 3
- **Accessibility-focused**: Add WCAG 2.2 checklist to Step 3
- **Performance-focused**: Add profiling step between Analyze and Classify

---

## PR Review Workflow

**When to Use**: code-reviewer (PR mode), tech-lead-orchestrator

### Template

```
## Workflow

1. **PR Context**: Read the PR title, description, and linked issues.
   - Understand what problem this solves
   - Check if the approach was discussed/approved beforehand
   - Note any deployment requirements or feature flags

2. **Diff Analysis**: Review the complete diff.
   - Start with test files to understand expected behavior
   - Review implementation files against test expectations
   - Check config changes for side effects
   - Verify migration safety (if applicable)

3. **Standards Check**: Verify project conventions.
   - Commit message format
   - Branch naming convention
   - Test coverage requirements
   - Documentation updates (if API changed)
   - Changelog entry (if required)

4. **Integration Assessment**: Evaluate broader impact.
   - Check for breaking changes to public APIs
   - Verify backwards compatibility
   - Assess impact on dependent services/modules
   - Review error handling for new failure modes

5. **Feedback**: Provide structured, actionable feedback.
   - Distinguish blocking vs non-blocking comments
   - Offer alternative approaches where relevant
   - Acknowledge good patterns and improvements
```

### Output Format

```
## PR Review: #{pr_number} — {title}

### Overview
- **Purpose**: {what this PR does}
- **Scope**: {files changed} files, {insertions}+/{deletions}-
- **Risk**: LOW | MEDIUM | HIGH

### Blocking Issues
{numbered list, or "None"}

### Non-blocking Suggestions
{numbered list, or "None"}

### Positive Notes
{things done well}

### Verdict: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION
```

---

## Security Review Workflow

**When to Use**: security-reviewer, infrastructure-security-reviewer

### Template

```
## Workflow

1. **Threat Model**: Identify attack surfaces in the changed code.
   - User input handling (forms, API params, file uploads)
   - Authentication and authorization flows
   - Data storage and transmission
   - Third-party integrations
   - Infrastructure configuration

2. **Automated Scan**: Run available security tools.
   - Static analysis (semgrep, bandit, eslint-plugin-security)
   - Dependency vulnerability check (npm audit, safety, snyk)
   - Secret detection (gitleaks, trufflehog)

3. **Manual Audit**: Review for vulnerabilities.
   - OWASP Top 10 checklist:
     [ ] A01: Broken Access Control
     [ ] A02: Cryptographic Failures
     [ ] A03: Injection
     [ ] A04: Insecure Design
     [ ] A05: Security Misconfiguration
     [ ] A06: Vulnerable Components
     [ ] A07: Auth Failures
     [ ] A08: Data Integrity Failures
     [ ] A09: Logging Failures
     [ ] A10: SSRF
   - Business logic vulnerabilities
   - Race conditions and TOCTOU

4. **Report**: Document findings with severity and remediation.
```

### Output Format

```
## Security Review

### Threat Surface
{description of attack vectors}

### Findings
| ID | Severity | Category | Description | Location | Remediation |
|----|----------|----------|-------------|----------|-------------|
| S1 | CRITICAL | {OWASP} | {desc} | {file:line} | {fix} |

### Automated Scan Results
- {tool}: {pass/fail, N issues}

### Recommendations
{prioritized list}

### Status: DONE | NEEDS_CONTEXT
```

---

## Severity Classification System

**When to Use**: All review agents

### Definitions

| Level | Definition | Action Required | Examples |
|-------|-----------|-----------------|----------|
| **CRITICAL** | Will cause bugs, security holes, or data loss in production | Must fix before merge | SQL injection, auth bypass, null pointer on common path, data corruption |
| **WARNING** | Will cause problems under certain conditions or degrades quality | Should fix, may defer with justification | Missing error handling, N+1 queries, no tests for edge case, deprecated API usage |
| **SUGGESTION** | Could improve code but not fixing it won't cause problems | Consider, no action required | Alternative algorithm, naming improvement, documentation addition |
| **INFO** | Observation, not a problem | No action needed | Architecture context, historical note, related improvement opportunity |
