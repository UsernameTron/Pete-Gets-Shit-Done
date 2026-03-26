# Team Pattern Registry — 14 Proven Patterns

## TQ01: Full-Stack Web Team

**Trigger**: "full-stack team", "web development team", "frontend and backend"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Backend | backend-developer | sonnet |
| Frontend | frontend-developer | sonnet |
| Quality Gate | code-reviewer | inherit |
| Coordinator | tech-lead-orchestrator | opus |

**Wiring**:
```
tech-lead-orchestrator
  ├── assigns backend tasks → backend-developer
  ├── assigns frontend tasks → frontend-developer
  └── triggers review → code-reviewer
backend-developer ↔ frontend-developer (API contract sync)
code-reviewer ← receives diffs from backend + frontend
```

**Interaction Protocol**:
- Orchestrator breaks features into backend/frontend tasks
- Backend publishes API changes; frontend consumes them
- All code passes through reviewer before merge
- Orchestrator resolves conflicts between backend/frontend decisions

**Scaling Notes**:
- Add `database-expert` if complex schema work needed
- Add `api-architect` if building public API
- Add `test-writer` if coverage is low

---

## TQ02: Review Pipeline

**Trigger**: "review pipeline", "multi-pass review", "comprehensive review"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Code Quality | code-reviewer | inherit |
| Security | security-reviewer | sonnet |
| Performance | performance-optimizer | sonnet |

**Wiring**:
```
code-reviewer (pass 1: style, bugs, patterns)
  → security-reviewer (pass 2: vulnerabilities, auth, injection)
    → performance-optimizer (pass 3: bottlenecks, complexity)
      → merged report
```

**Interaction Protocol**:
- Sequential pipeline: each reviewer annotates, passes to next
- Each pass adds findings with severity (critical/warning/info)
- Final merged report combines all passes with deduplication
- Critical findings from any pass block the pipeline

**Scaling Notes**:
- Add `accessibility-auditor` for frontend code
- Add `dependency-auditor` for supply chain checks
- Replace sequential with parallel for speed (trade off thoroughness)

---

## TQ03: Optimization Team

**Trigger**: "optimization team", "performance team", "speed team"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Profiler | performance-optimizer | sonnet |
| Explorer | code-archaeologist | sonnet |
| DB Tuner | database-expert | sonnet |

**Wiring**:
```
code-archaeologist (maps codebase, finds hotspots)
  → performance-optimizer (profiles, measures, fixes)
  → database-expert (optimizes queries, indexes, schema)
  → combined optimization report
```

**Interaction Protocol**:
- Archaeologist provides codebase map to optimizer and DB expert
- Optimizer identifies application-level bottlenecks
- DB expert handles data-layer optimizations
- All three collaborate on cross-cutting concerns

**Scaling Notes**:
- Add `caching-strategist` for cache-layer optimization
- Add `monitoring-specialist` for production profiling data
- Add `code-reviewer` as quality gate for optimization PRs

---

## TQ04: Framework Team (Parameterized)

**Trigger**: "framework team", "Django team", "Rails team", "React team", "Vue team", "Laravel team", "Next.js team"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Specialist | {framework}-specialist | sonnet |
| Quality Gate | code-reviewer | inherit |
| Coordinator | tech-lead-orchestrator | opus |

**Slot Resolution**:
- "Django" → `django-backend` (+ `django-api` if DRF, + `django-orm` if complex models)
- "Rails" → `rails-backend` (+ `rails-api` if API-only, + `rails-activerecord` if complex models)
- "React" → `react-components` (+ `nextjs-specialist` if Next.js)
- "Vue" → `vue-components` (+ `nuxt-specialist` if Nuxt, + `vue-state` if Pinia)
- "Laravel" → `laravel-backend` (+ `laravel-eloquent` if complex models)

**Wiring**:
```
tech-lead-orchestrator
  ├── assigns framework tasks → {framework}-specialist
  └── triggers review → code-reviewer
{framework}-specialist → code-reviewer (all changes)
```

**Interaction Protocol**:
- Orchestrator translates user requirements into framework-specific tasks
- Specialist implements following framework conventions
- Reviewer validates framework best practices
- Orchestrator arbitrates when convention conflicts with requirements

**Scaling Notes**:
- Add `test-writer` for coverage
- Add `documentation-specialist` for API docs
- Add variant specialists for multi-concern frameworks (e.g., Django API + ORM)

---

## TQ05: Legacy Modernization

**Trigger**: "legacy modernization", "refactoring team", "code modernization", "tech debt"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Explorer | code-archaeologist | sonnet |
| Refactorer | refactoring-advisor | sonnet |
| Safety Net | test-writer | sonnet |
| Documenter | documentation-specialist | sonnet |

**Wiring**:
```
code-archaeologist (audits codebase, maps dependencies)
  → refactoring-advisor (plans changes, identifies patterns)
    → test-writer (adds coverage before refactoring)
      → refactoring-advisor (executes refactoring)
        → documentation-specialist (updates docs)
```

**Interaction Protocol**:
- Archaeologist provides dependency map and risk assessment
- Refactoring advisor plans changes with minimal blast radius
- Test writer adds coverage BEFORE any refactoring begins
- After refactoring, doc specialist updates affected documentation
- Iterative: small safe changes, validated at each step

**Scaling Notes**:
- Add `migration-specialist` for framework/language upgrades
- Add `code-reviewer` as additional quality gate
- Add `performance-optimizer` to ensure refactoring doesn't regress performance

---

## TQ06: API Development Team

**Trigger**: "API team", "API development", "service development", "API-first"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Designer | api-architect | sonnet |
| Builder | backend-developer | sonnet |
| Documenter | api-doc-writer | sonnet |
| Quality Gate | code-reviewer | inherit |

**Wiring**:
```
api-architect (designs API contract, schemas)
  → backend-developer (implements endpoints)
  → api-doc-writer (generates documentation)
  → code-reviewer (validates implementation)
```

**Interaction Protocol**:
- Architect defines API contract first (OpenAPI/GraphQL schema)
- Backend implements against the contract
- Doc writer generates docs from contract + implementation
- Reviewer validates contract adherence and quality

**Scaling Notes**:
- Add `security-reviewer` for API security audit
- Add `test-writer` for contract testing
- Add `graphql-specialist` if GraphQL API

---

## TQ07: Security Audit Team

**Trigger**: "security team", "security audit", "vulnerability assessment", "pen test"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Code Auditor | security-reviewer | sonnet |
| Surface Mapper | code-archaeologist | sonnet |
| Supply Chain | dependency-auditor | sonnet |

**Wiring**:
```
code-archaeologist (maps attack surface, entry points)
  → security-reviewer (reviews code for vulnerabilities)
  → dependency-auditor (audits packages, licenses)
  → combined security report
```

**Interaction Protocol**:
- Archaeologist identifies all entry points and data flows
- Security reviewer examines each path for vulnerabilities
- Dependency auditor checks all packages against CVE databases
- Combined report with unified severity ratings

**Scaling Notes**:
- Add `infrastructure-security-reviewer` for cloud/infra audit
- Add `error-handler` to review error handling for info leaks
- Add `test-writer` for security test cases

---

## TQ08: Custom Team

**Trigger**: "custom team", "build my own team", "pick agents", "choose agents"

**Components**: User-defined (2–6 agents from any archetype)

**Slot Resolution**:
1. Present available archetype categories
2. User selects agents (minimum 2, maximum 6)
3. Auto-add `code-reviewer` if not selected (recommended)
4. Auto-add `tech-lead-orchestrator` if 3+ agents selected

**Wiring**: Auto-generated based on agent roles:
- Identify builders (agents that produce code)
- Identify reviewers (agents that validate)
- Identify coordinators (orchestrators)
- Wire: builders → reviewers → coordinators
- Add cross-links for related domains

**Interaction Protocol**:
- Generated dynamically from agent descriptions
- Follows general pattern: coordinate → implement → review

**Scaling Notes**:
- Maximum 6 user-selected + auto-added reviewer/orchestrator
- Total hard cap: 8 agents

---

## TQ09: Mobile App Team

**Trigger**: "mobile team", "app team", "iOS and Android", "mobile development"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Builder | {platform}-specialist | sonnet |
| Tester | mobile-testing-expert | sonnet |
| Pipeline | mobile-ci-cd-architect | sonnet |
| Quality Gate | code-reviewer | inherit |

**Slot Resolution**:
- "iOS" → `ios-specialist`
- "Android" → `android-specialist`
- "Flutter" → `flutter-specialist`
- "React Native" → `react-native-specialist`
- "both" or "cross-platform" → `flutter-specialist` or `react-native-specialist` (ask preference)

**Wiring**:
```
{platform}-specialist (builds features)
  → mobile-testing-expert (validates on device/simulator)
  → code-reviewer (reviews code quality)
  → mobile-ci-cd-architect (automates build/deploy)
```

**Interaction Protocol**:
- Specialist implements features with platform conventions
- Tester validates functionality, accessibility, performance
- Reviewer checks code quality and platform best practices
- CI/CD architect maintains pipeline for builds and releases

**Scaling Notes**:
- Add second platform specialist for iOS + Android native
- Add `accessibility-auditor` for a11y compliance
- Add `api-architect` if building API alongside app

---

## TQ10: ML Pipeline Team

**Trigger**: "ML team", "data science team", "machine learning", "model training"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Data Engineer | data-pipeline-engineer | sonnet |
| ML Specialist | {ml-framework}-specialist | sonnet |
| MLOps | ml-ops-engineer | sonnet |
| Quality Gate | code-reviewer | inherit |

**Slot Resolution**:
- "PyTorch" or "deep learning" → `pytorch-specialist`
- "scikit-learn" or "classical ML" → `sklearn-specialist`
- "pandas" or "data analysis" → `pandas-specialist`
- Ambiguous → check `requirements.txt` / `pyproject.toml` for imports

**Wiring**:
```
data-pipeline-engineer (ingests, transforms, validates data)
  → {ml-framework}-specialist (trains, evaluates models)
  → ml-ops-engineer (deploys, monitors, versions)
  → code-reviewer (reviews all code changes)
```

**Interaction Protocol**:
- Pipeline engineer ensures clean, validated data
- ML specialist trains and evaluates models
- MLOps handles deployment, versioning, monitoring
- All share experiment tracking (MLflow/W&B)

**Scaling Notes**:
- Add `feature-engineering-specialist` for complex feature pipelines
- Add `data-visualization-expert` for reporting
- Add `jupyter-workflow-expert` for notebook-heavy workflows

---

## TQ11: Cloud Migration Team

**Trigger**: "cloud migration", "move to cloud", "infrastructure team", "cloud setup"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Architect | {cloud}-architect | sonnet |
| IaC Engineer | terraform-specialist | sonnet |
| Orchestrator | kubernetes-specialist | sonnet |
| Security | infrastructure-security-reviewer | sonnet |

**Slot Resolution**:
- "AWS" → `aws-architect`
- "GCP" → `gcp-architect`
- Multi-cloud → use both, `terraform-specialist` as unifier

**Wiring**:
```
{cloud}-architect (designs architecture, selects services)
  → terraform-specialist (provisions infrastructure)
  → kubernetes-specialist (orchestrates workloads)
  → infrastructure-security-reviewer (audits security posture)
```

**Interaction Protocol**:
- Architect designs target state and migration plan
- Terraform engineer implements IaC for all resources
- K8s specialist configures container orchestration
- Security reviewer audits at each phase

**Scaling Notes**:
- Add `containerization-specialist` for Docker optimization
- Add `monitoring-specialist` for observability setup
- Add `cloud-cost-optimizer` for cost management

---

## TQ12: SRE/Reliability Team

**Trigger**: "SRE team", "reliability team", "observability", "on-call setup"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| SRE Lead | sre-practices-advisor | sonnet |
| Monitoring | monitoring-specialist | sonnet |
| Incident | incident-response-expert | sonnet |
| Logging | logging-specialist | sonnet |

**Wiring**:
```
sre-practices-advisor (sets SLOs, error budgets, toil targets)
  → monitoring-specialist (instruments metrics, alerts, dashboards)
  → logging-specialist (structures logs, sets up aggregation)
  → incident-response-expert (defines runbooks, escalation paths)
```

**Interaction Protocol**:
- SRE advisor defines reliability targets and priorities
- Monitoring specialist implements observability stack
- Logging specialist ensures structured, queryable logs
- Incident expert creates runbooks and handles failures

**Scaling Notes**:
- Add `containerization-specialist` for container health
- Add `performance-optimizer` for capacity planning
- Add `ci-cd-architect` for deployment safety (canary, blue/green)

---

## TQ13: Systems Development Team

**Trigger**: "systems team", "embedded team", "low-level", "systems programming"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Builder | {language}-specialist | sonnet |
| Memory | memory-safety-auditor | sonnet |
| Concurrency | concurrency-expert | sonnet |
| Safety Net | test-writer | sonnet |

**Slot Resolution**:
- "Rust" → `rust-specialist`
- "C++" → `cpp-specialist`
- "Embedded" → `embedded-systems-expert`
- "OS/kernel" → `os-level-specialist`

**Wiring**:
```
{language}-specialist (implements features)
  → memory-safety-auditor (reviews memory usage, leaks, safety)
  → concurrency-expert (validates thread safety, deadlocks)
  → test-writer (adds unit, integration, fuzz tests)
```

**Interaction Protocol**:
- Specialist implements with language idioms
- Memory auditor reviews allocations, lifetimes, safety
- Concurrency expert checks for races, deadlocks, liveness
- Test writer adds coverage with emphasis on edge cases

**Scaling Notes**:
- Add `performance-optimizer` for benchmarking
- Add `documentation-specialist` for API docs
- Add `code-archaeologist` for legacy systems work

---

## TQ14: Full Platform Team

**Trigger**: "full platform", "complete team", "everything", "all domains"

**Components**:
| Role | Agent | Model |
|------|-------|-------|
| Backend | backend-developer | sonnet |
| Frontend | frontend-developer | sonnet |
| Mobile | {mobile}-specialist | sonnet |
| DevOps | devops-engineer | sonnet |
| Coordinator | tech-lead-orchestrator | opus |

**Slot Resolution**:
- Mobile slot resolved by platform detection or user choice
- Backend/Frontend are universal (language-agnostic)

**Wiring**:
```
tech-lead-orchestrator
  ├── backend-developer (server, API, data)
  ├── frontend-developer (web UI)
  ├── {mobile}-specialist (native/cross-platform app)
  └── devops-engineer (CI/CD, infra, deployment)
All → code-reviewer (optional, recommended as 6th agent)
```

**Interaction Protocol**:
- Orchestrator coordinates all domain specialists
- Backend publishes APIs consumed by frontend and mobile
- Frontend and mobile share design system and state contracts
- DevOps manages deployment for all platforms
- Optional code-reviewer gates all merge requests

**Scaling Notes**:
- Add `code-reviewer` (strongly recommended, brings team to 6)
- Add `api-architect` if API design is complex
- Hard cap: 8 agents total — prioritize by project needs
