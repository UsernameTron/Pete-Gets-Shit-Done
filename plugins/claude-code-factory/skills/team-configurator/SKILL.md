---
name: team-configurator
description: |
  Detects the technology stack of the current project across all domains and
  assembles an optimal team of development agents. Scans 25+ config file types
  covering web, mobile, data/ML, systems, cloud, and DevOps. Writes team
  configuration to CLAUDE.md.
user-invocable: true
argument-hint: "[scope: project|global] [--detect-only]"
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Team Configurator — Stack Detection + Team Assembly

Detects your project's technology stack and assembles an optimal team of development agents tailored to it.

**Usage**: Invoke with optional arguments:
- `project` or `global` — scope for generated agent files (default: project)
- `--detect-only` — print detection results without generating agents

If `$ARGUMENTS` contains `--detect-only`, execute only §1-2 and print results. Otherwise execute §1-5.

---

## 1. Stack Detection

Scan the project root for these files. For each match, record the detection.

### Config File Detection Matrix (25+ file types)

| File / Pattern | Detects |
|----------------|---------|
| `package.json` | Node.js, React, Vue, Next.js, Express, Vite, TypeScript |
| `requirements.txt` / `pyproject.toml` / `Pipfile` | Python, Django, Flask, FastAPI |
| `Gemfile` | Ruby, Rails |
| `composer.json` | PHP, Laravel |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `build.gradle` / `pom.xml` | Java, Spring, Kotlin |
| `.csproj` / `*.sln` | C#, .NET, ASP.NET |
| `Podfile` / `*.xcodeproj` | iOS (Swift/ObjC) |
| `build.gradle` (android block) | Android (Kotlin/Java) |
| `pubspec.yaml` | Flutter (Dart) |
| `setup.py` / `setup.cfg` with ML deps | Data Science / ML |
| `*.ipynb` (Jupyter notebooks) | Jupyter / Data exploration |
| `CMakeLists.txt` / `Makefile` | C/C++ / Systems |
| `*.tf` / `terraform/` | Terraform / IaC |
| `k8s/` or K8s manifests (`*.yaml` with `apiVersion`) | Kubernetes |
| `serverless.yml` / `sam.yaml` | Serverless |
| `.aws/` or `aws-cdk.json` | AWS |
| `Dockerfile` / `docker-compose.yml` | Docker |
| `.github/workflows/` | CI/CD (GitHub Actions) |
| `.gitlab-ci.yml` | CI/CD (GitLab) |
| `tsconfig.json` | TypeScript |
| `tailwind.config.*` | Tailwind CSS |
| `jest.config.*` / `vitest.config.*` / `pytest.ini` | Testing frameworks |
| `prometheus.yml` / `grafana/` | Monitoring / Observability |

### Detection Procedure

1. Run `Glob` for each pattern above. Record hits.
2. For `package.json`, read and check `dependencies` + `devDependencies` for framework packages:
   - `react`, `react-dom` → React
   - `next` → Next.js
   - `vue` → Vue
   - `nuxt` → Nuxt
   - `express` → Express
   - `@angular/core` → Angular
   - `svelte` → Svelte
   - `vite` → Vite
3. For `requirements.txt` / `pyproject.toml` / `Pipfile`, grep for:
   - `django` → Django
   - `flask` → Flask
   - `fastapi` → FastAPI
   - `torch`, `pytorch` → PyTorch
   - `tensorflow` → TensorFlow
   - `scikit-learn`, `sklearn` → Scikit-learn
   - `pandas` → Pandas
   - `airflow`, `prefect` → Data pipelines
   - `mlflow`, `wandb` → MLOps
4. For `Gemfile`, grep for `rails` → Rails
5. For `composer.json`, read and check for `laravel/framework` → Laravel
6. For `build.gradle`, check for:
   - `com.android` plugin → Android
   - `org.jetbrains.kotlin` → Kotlin
   - `org.springframework` → Spring
7. For Kubernetes, check for YAML files containing `apiVersion:` + `kind:` patterns
8. Count total files with `find . -type f | wc -l` (exclude node_modules, .git, vendor, __pycache__)
9. Estimate LOC with `find . -type f -name '*.{detected-extensions}' | xargs wc -l` (sample if >1000 files)

---

## 2. Detection Output Format

After scanning, present results in this format:

```
═══════════════════════════════════════
  Stack Detection Results
═══════════════════════════════════════

  Language(s):          {detected languages, comma-separated}
  Backend framework:    {detected or "none"}
  Frontend framework:   {detected or "none"}
  Mobile platform:      {detected or "none"}
  Data/ML stack:        {detected or "none"}
  Systems language:     {detected or "none"}
  Cloud provider:       {detected or "none"}
  Infrastructure:       {detected or "none"}
  Database:             {detected or "unknown"}
  Testing:              {detected or "unknown"}
  CI/CD:                {detected or "none"}
  Monitoring:           {detected or "none"}

  Codebase size:        {file count} files (~{LOC estimate} LOC)
  Size category:        {Small (<100) | Medium (100-500) | Large (500+)}

═══════════════════════════════════════
```

If `--detect-only` was specified, STOP HERE. Print the results and exit.

---

## 3. Agent Selection Rules

Apply these rules against detection results to build the candidate agent list.

### Always Include

| Agent | Reason |
|-------|--------|
| `code-reviewer` | Every project benefits from automated code review |

### Include If Detected

| Detection | Agent(s) |
|-----------|----------|
| Django | `django-backend` (+ `django-api` if DRF detected, + `django-orm` if complex models) |
| Flask / FastAPI | `backend-developer` (Python) |
| Rails | `rails-backend` (+ `rails-api` if API-only, + `rails-activerecord` if complex models) |
| Laravel | `laravel-backend` (+ `laravel-eloquent` if complex models) |
| React | `react-components` |
| Next.js | `nextjs-specialist` |
| Vue | `vue-components` (+ `vue-state` if Pinia detected) |
| Nuxt | `nuxt-specialist` |
| iOS / Swift | `ios-specialist` |
| Android / Kotlin | `android-specialist` |
| Flutter | `flutter-specialist` |
| React Native | `react-native-specialist` |
| PyTorch / TensorFlow | `pytorch-specialist` + `ml-ops-engineer` |
| Scikit-learn / Pandas | `sklearn-specialist` OR `pandas-specialist` (based on primary usage) |
| Jupyter notebooks (5+) | `jupyter-workflow-expert` |
| Airflow / Prefect | `data-pipeline-engineer` |
| MLflow / W&B | `ml-ops-engineer` |
| Rust | `rust-specialist` |
| C / C++ | `cpp-specialist` |
| CMake + embedded patterns | `embedded-systems-expert` |
| Go | `backend-developer` (Go) |
| Terraform | `terraform-specialist` |
| Kubernetes | `kubernetes-specialist` |
| AWS CDK / CloudFormation | `aws-architect` |
| GCP (gcloud configs) | `gcp-architect` |
| Serverless framework | `serverless-expert` |
| Docker | `containerization-specialist` |
| Prometheus / Grafana | `monitoring-specialist` |
| GitHub Actions / GitLab CI | `ci-cd-architect` |
| >500 files | `code-archaeologist` |
| Performance-critical indicators | `performance-optimizer` |
| Poor/missing docs (no README or thin docs/) | `documentation-specialist` |
| Multiple backend languages | `backend-developer` (polyglot mode) |
| OpenAPI spec / GraphQL schema | `api-architect` |
| GraphQL detected | `graphql-specialist` |
| WebSocket usage | `websocket-expert` |
| 3+ agents selected | `tech-lead-orchestrator` (add as coordinator) |

### Team Size Constraints

| Codebase Size | Max Agents | Notes |
|---------------|------------|-------|
| Small (<100 files) | 2-3 | Focus on core needs only |
| Medium (100-500 files) | 3-5 | Add domain specialists |
| Large (500+ files) | 5-8 | Include orchestrator |
| Maximum | 8 | Beyond 8, orchestrator delegates dynamically |

### Priority Ranking (when trimming to max size)

If candidate list exceeds max team size, prioritize in this order:
1. **Core**: code-reviewer (always)
2. **Primary framework**: The main backend/frontend specialist
3. **Secondary framework**: If project is full-stack
4. **Orchestrator**: If 3+ specialists selected
5. **Domain experts**: Based on detected needs
6. **Nice-to-have**: documentation, performance, archaeology

---

## 4. Team Assembly

### Step 1 — Check Team Combo Patterns

Compare detected stack against known team combos. If a match is found, use the combo as a starting point:

| Pattern | Stack Match | Team Composition |
|---------|------------|------------------|
| TQ01 - Full-Stack Web | Backend + Frontend + DB | backend + frontend + api-architect |
| TQ02 - Django Full | Django + React/Vue | django-backend + django-api + frontend |
| TQ03 - Rails Full | Rails + Frontend | rails-backend + rails-api + frontend |
| TQ04 - Mobile App | iOS or Android + API | mobile-specialist + api-architect + mobile-testing |
| TQ05 - Cross-Platform | Flutter or RN | mobile-specialist + mobile-testing + mobile-ci-cd |
| TQ06 - ML Pipeline | Python + ML libs + notebooks | data-pipeline + ml-specialist + ml-ops |
| TQ07 - Data Science | Jupyter + pandas/sklearn | pandas/sklearn + jupyter + visualization |
| TQ08 - Cloud Native | K8s + Cloud + Docker | cloud-architect + k8s + containerization |
| TQ09 - Serverless | Lambda/Functions + IaC | serverless + cloud-architect + ci-cd |
| TQ10 - Systems | Rust/C++ + low-level | language-specialist + memory-safety + concurrency |
| TQ11 - DevOps Platform | CI/CD + Docker + K8s + Monitoring | ci-cd + containerization + monitoring + sre |
| TQ12 - API Platform | OpenAPI + Multi-consumer | api-architect + security + test-writer |
| TQ13 - Microservices | Docker + K8s + Multiple services | backend + api-architect + k8s + monitoring |
| TQ14 - Monolith | Single large app | code-archaeologist + refactoring + test-writer |

### Step 2 — Build Custom Team (if no combo matches)

1. Start with always-include agents
2. Add detected-stack agents
3. Apply team size constraints
4. Trim by priority ranking

### Step 3 — Generate Agent Wiring

Define how agents interact:

```
Agent Workflow:
  code-reviewer ← receives diffs from all other agents
  tech-lead-orchestrator → delegates tasks to all specialists
  {backend-agent} → feeds API changes to {frontend-agent}
  {test-writer} ← receives implementation from all builders
  {security-reviewer} ← receives final output for audit
```

### Step 4 — Write Team Configuration

Determine scope from `$ARGUMENTS`:
- `project` (default): Write to `.claude/agents/`
- `global`: Write to `~/.claude/agents/`

For each selected agent:
1. Invoke `agent-factory` with the archetype specification and project context
2. Or if agent-factory is not available, write agent files directly using archetype templates from `cc-ref-agent-archetypes`

### Step 5 — Generate Team Blueprint

Write a summary document with:
- Team composition table (agent name, role, model)
- Workflow diagram (text-based, showing agent interactions)
- Estimated context cost per agent
- Scaling recommendations (what to add as project grows)

---

## 5. Output

Present the assembled team to the user:

```
═══════════════════════════════════════
  Development Team Configuration
═══════════════════════════════════════

  Stack: {summary}
  Team size: {N} agents
  Scope: {project|global}

  ┌─────────────────────────────┬──────────┬─────────┐
  │ Agent                       │ Role     │ Model   │
  ├─────────────────────────────┼──────────┼─────────┤
  │ code-reviewer               │ Core     │ inherit │
  │ {framework-specialist}      │ Primary  │ sonnet  │
  │ {other agents...}           │ ...      │ ...     │
  └─────────────────────────────┴──────────┴─────────┘

  Workflow:
    {tech-lead-orchestrator} → delegates to specialists
    {specialist-1} ↔ {specialist-2} (shared context)
    All agents → code-reviewer (review gate)

  Files written:
    .claude/agents/{agent-1}.md
    .claude/agents/{agent-2}.md
    ...

═══════════════════════════════════════
```

If `--detect-only`, only the §2 detection output is shown.

---

## 6. Error Handling

| Condition | Action |
|-----------|--------|
| No config files detected | Report "No recognized project files found" and suggest manual configuration |
| Conflicting detections | Report both and ask user to confirm primary stack |
| Agent factory unavailable | Fall back to direct file generation from archetype templates |
| Target directory not writable | Report error and suggest alternative scope |
| Existing agents in target | List existing agents, ask before overwriting |
