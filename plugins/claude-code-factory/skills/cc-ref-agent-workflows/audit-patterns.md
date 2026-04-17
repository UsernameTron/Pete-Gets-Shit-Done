# Audit Workflow Patterns

Patterns for agents that perform systematic reviews and assessments.

---

## Codebase Audit Workflow

**When to Use**: code-archaeologist, refactoring-advisor, tech-lead-orchestrator

### Template

```
## Workflow

1. **Map**: Inventory the codebase.
   - Count files by type and directory
   - Identify entry points and main modules
   - Map dependency graph (internal and external)
   - Measure: LOC, file count, directory depth

2. **Trace**: Follow key execution paths.
   - Identify the 3-5 most important user flows
   - Trace each from entry to exit, noting:
     - Files touched
     - Data transformations
     - External calls (DB, API, filesystem)
     - Error handling points

3. **Document**: Record architecture and patterns.
   - Architectural style (monolith, microservices, serverless)
   - Design patterns in use
   - Convention consistency (naming, structure, error handling)
   - Configuration management approach

4. **Assess**: Evaluate health.
   - Test coverage (if measurable)
   - Technical debt indicators:
     - TODO/FIXME/HACK comment count
     - Duplicated code (DRY violations)
     - Complexity hotspots (cyclomatic complexity)
     - Dependency age and vulnerability count
   - Documentation completeness

5. **Recommend**: Prioritize improvements.
   - Critical: Security issues, data integrity risks
   - High: Reliability, testability improvements
   - Medium: Maintainability, developer experience
   - Low: Code style, minor optimizations
```

### Output Format

```
## Codebase Audit Report

### Overview
| Metric | Value |
|--------|-------|
| Total files | {N} |
| Total LOC | {N} |
| Languages | {list} |
| Frameworks | {list} |
| Test coverage | {N}% or unknown |

### Architecture
{diagram or description}

### Key Flows
1. {flow name}: {entry} → {step} → ... → {exit}

### Health Assessment
| Area | Grade | Notes |
|------|-------|-------|
| Security | A-F | {notes} |
| Test coverage | A-F | {notes} |
| Documentation | A-F | {notes} |
| Dependencies | A-F | {notes} |
| Code quality | A-F | {notes} |

### Technical Debt
| Priority | Issue | Location | Effort |
|----------|-------|----------|--------|
| {level} | {issue} | {file:line} | S/M/L |

### Recommendations
{prioritized list with effort estimates}

### Status: DONE
```

---

## Dependency Audit Workflow

**When to Use**: dependency-auditor, security-reviewer

### Template

```
## Workflow

1. **Inventory**: List all dependencies.
   - Direct dependencies (in manifest files)
   - Transitive dependencies (in lock files)
   - Dev vs production dependencies
   - Record version, license, last update date

2. **Scan**: Check for known issues.
   - Vulnerability databases (CVE, GitHub Advisory)
   - Run: npm audit / pip audit / cargo audit / bundler-audit
   - Check for deprecated or unmaintained packages
   - Identify packages with no recent releases (>2 years)

3. **Classify**: Categorize risks.
   - CRITICAL: Known exploited vulnerability, no patch available
   - HIGH: Known vulnerability, patch available
   - MEDIUM: Deprecated dependency, unmaintained
   - LOW: Outdated but functional, minor version behind

4. **Remediate**: Propose fixes.
   - For vulnerabilities: upgrade to patched version
   - For deprecated: identify replacement package
   - For unmaintained: evaluate risk and alternatives
   - For license issues: flag and recommend alternatives
```

### Output Format

```
## Dependency Audit Report

### Summary
- Total dependencies: {N} (direct: {N}, transitive: {N})
- Vulnerabilities: {critical: N, high: N, medium: N, low: N}
- Deprecated: {N}
- Outdated: {N}

### Vulnerabilities
| Package | Version | Severity | CVE | Fix Version | Breaking? |
|---------|---------|----------|-----|-------------|-----------|
| {pkg} | {ver} | {sev} | {cve} | {fix} | {yes/no} |

### License Issues
| Package | License | Concern |
|---------|---------|---------|
| {pkg} | {license} | {issue} |

### Upgrade Plan
{ordered list of recommended upgrades with risk assessment}

### Status: DONE | DONE_WITH_CONCERNS
```

---

## Security Audit Workflow

**When to Use**: security-reviewer, infrastructure-security-reviewer

### Template

```
## Workflow

1. **Scope**: Define audit boundaries.
   - Application code, infrastructure, dependencies, or all
   - Identify sensitive data types handled
   - Map external interfaces (APIs, webhooks, file uploads)

2. **Enumerate**: Catalog attack surface.
   - Input points (user input, API params, file upload, environment vars)
   - Authentication mechanisms
   - Authorization rules and access control
   - Data storage (databases, files, caches, logs)
   - External integrations
   - Secret management

3. **Test**: Check each area.
   - Run automated scanners
   - Manual code review for logic vulnerabilities
   - Configuration review (headers, CORS, CSP, TLS)
   - Test authentication edge cases
   - Verify authorization at every access point

4. **Report**: Document findings and remediation.
   - Use CVSS scoring for consistency
   - Provide remediation with code examples
   - Estimate effort for each fix

5. **Verify**: Confirm fixes.
   - Re-test after remediation
   - Add regression tests for each finding
```

---

## Compliance Audit Workflow

**When to Use**: infrastructure-security-reviewer, sre-practices-advisor

### Template

```
## Workflow

1. **Framework Selection**: Identify applicable standards.
   - SOC 2 Type II, HIPAA, PCI DSS, GDPR, ISO 27001
   - Industry-specific requirements

2. **Gap Analysis**: Compare current state to requirements.
   - Map controls to implementation
   - Identify missing controls
   - Assess effectiveness of existing controls

3. **Remediate**: Address gaps.
   - Prioritize by risk and audit timeline
   - Implement technical controls
   - Document policies and procedures
   - Establish monitoring and alerting

4. **Evidence**: Collect audit artifacts.
   - Access logs, configuration snapshots
   - Policy documents, training records
   - Test results, scan reports
   - Change management records
```
