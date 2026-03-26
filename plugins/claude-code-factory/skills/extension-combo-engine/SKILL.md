---
name: extension-combo-engine
description: |
  Detects when a request requires multiple coordinated Claude Code extensions
  and generates them as a unified system with explicit wiring between components.
  Handles Tier 2 requests from smart-scaffold: 2-4 extensions that work together.
  Use when a request maps to multiple extension types that reference each other.
  Triggers on: compound intents, "enforce standards", "deploy pipeline",
  "test gate", "review system", coordinated hooks, multi-type requests.
user-invocable: false
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---

# Extension Combo Engine — Coordinated Multi-Extension Generator

You generate coordinated sets of 2-4 Claude Code extensions that work together
as a system. Smart-scaffold routes Tier 2 requests here. The extension-concierge
invokes you for compound intents.

**You are NOT a sequential generator.** You produce a unified blueprint where
every component knows about every other component.

---

## 1. Combo Detection

### Pattern Matching

When you receive a request, compare it against the combo registry
(`combo-registry.md`). Check trigger phrases for matches.

| Match Quality | Action |
|---------------|--------|
| **Direct match** (trigger phrase hit) | Use the registry pattern as-is |
| **Partial match** (1-2 trigger words) | Use registry pattern as starting template, adapt |
| **No match** | Build custom combo from scratch using the 5-step workflow |

### Custom Combo Construction

If no registry pattern matches, decompose the request:

1. **List behaviors** — What distinct things should happen?
2. **Map to types** — Each behavior → extension type (hook, skill, agent, etc.)
3. **Find connections** — Which components reference each other?
4. **Determine order** — Dependencies dictate install order
5. **Check count** — If only 1 component needed, downgrade to Tier 1 (single generator). If 5+ needed, escalate to Tier 3 (plugin/architect).

---

## 2. Component Validation

Before generating, validate the combo makes sense:

### Compatibility Checks

| Check | Fail Condition | Action |
|-------|----------------|--------|
| **Circular dependency** | Component A needs B, B needs A | Restructure: merge into single component or add intermediary |
| **Redundant components** | Two components do the same thing | Merge into one |
| **Missing link** | Components don't actually reference each other | Is this really a combo? Maybe generate as independent extensions |
| **Over-engineering** | Request is simpler than it looks | Downgrade to Tier 1 with upgrade path mention |

### Count Validation

| Components | Classification | Action |
|------------|---------------|--------|
| 1 | Not a combo | Return to concierge for single-generator path |
| 2-4 | Valid combo | Proceed with generation |
| 5+ | System-level | Escalate to Tier 3 (`system-architect` agent) |

---

## 3. Generation Workflow

Execute these 5 steps for every combo:

### Step 1: Resolve Pattern
- Match against combo registry OR construct custom combo
- Identify all components, their types, and connections

### Step 2: Validate Components
- Run compatibility checks (Section 2)
- Confirm component count is 2-4
- Verify wiring makes sense

### Step 3: Plan Wiring
- Map data flow between components
- Identify shared resources (files, env vars, conventions)
- Determine install order (dependencies first)

### Step 3.5: Parallelization Analysis

For each pair of components in the combo, determine if they can be generated in parallel:

**Parallel-safe** (both conditions must be true):
- Component B does NOT read from Component A's output file
- Component B does NOT reference Component A's name or file path in its configuration

**Sequential-required** (any condition triggers sequential):
- Component B reads from Component A (e.g., a hook references a skill's name)
- Component B's configuration includes a file path to Component A
- Component B is a permission rule that Component A's hook event depends on

Group components into generation phases:
- **Phase 1**: All components with zero dependencies (generate in parallel)
- **Phase 2**: Components that depend only on Phase 1 outputs (parallel within phase)
- **Phase N**: Continue until all components assigned

Present the phase grouping as part of the combo blueprint.

### Step 4: Generate All Pieces (by phase)
For each generation phase:
1. Dispatch ALL components in this phase to their generators.
2. Within a phase, components are independent — dispatch as separate operations that can run concurrently.
3. Wait for all generators in the phase to complete before starting the next phase.
4. Pass wiring context to each generator. Include:
   - What other components exist in this combo
   - What this component reads from or writes to
   - Cross-references to other component files/paths

| Component Type | Generator |
|----------------|-----------|
| Hook | `hook-factory` |
| Skill | `skill-factory` |
| Reference skill | `skill-factory` (with `user-invocable: false`) |
| Subagent | `subagent-generator` agent |
| Permission rules | `settings-architect` |
| MCP config | `mcp-configurator` |
| Settings | `settings-architect` |

After ALL phases complete:
5. Run `extension-validator` subagent on ALL generated files together (not per-component). This catches cross-component reference issues.

### Step 5: Present Blueprint
- Use the blueprint template (`blueprint-template.md`)
- Show the system as a whole, then individual parts
- Include connection descriptions and customization pointers

---

## 4. Wiring Patterns

Common patterns for how components connect:

### Shared Source of Truth
```
Reference Skill (stores rules)
  ↓ reads from
Hook (enforces rules)
```
Hook's command reads the skill file for current rules. Single edit point.

### Chain (A triggers B)
```
PostToolUse Hook (detects change)
  ↓ triggers
Subagent (analyzes change)
```
Hook invokes subagent via script or passes context.

### Gate + Feedback
```
PreToolUse Hook (blocks if bad)
  ↑ checks result of
PostToolUse Hook (runs validator)
```
PostToolUse writes result to temp file. PreToolUse reads it before allowing.

### Orchestrator + Workers
```
Skill (coordinates workflow)
  ↓ invokes
Subagent A (analysis)
Subagent B (generation)
```
Skill manages the flow, subagents handle specialized work.

---

## 5. Error Handling

| Condition | Action |
|-----------|--------|
| Registry match but user wants different components | Adapt the pattern, don't force the template |
| Generator fails for one component | Generate remaining components, report partial failure |
| Wiring is unclear from request | Ask ONE question: "Should [A] happen before or after [B]?" |
| Components are independent (no wiring) | Generate as separate extensions, not a combo |
| User says "just give me the [one part]" | Downgrade to single generator, mention the full combo as upgrade path |

---

## 6. Integration Points

### From Smart-Scaffold (Tier 2 routing)
Smart-scaffold classifies as Tier 2 when it detects:
- Two distinct behaviors connected by "and"
- Reference + enforcement pattern
- Gate + reaction in same request

Smart-scaffold passes: the request text, detected tier, and any resolved
decisions (scope, timing signals). Use these — don't re-ask.

### From Extension-Concierge (compound intent)
The concierge detects compound intent when the intent-engine's decision tree
matches multiple branches. Concierge passes: the request, primary type,
secondary type, and resolved decisions. Generate coordinated components.

### To Extension-Installer
After presenting the blueprint, offer installation via `extension-installer`.
For combos, install in dependency order (install-order from blueprint).
The installer handles each component type appropriately.
