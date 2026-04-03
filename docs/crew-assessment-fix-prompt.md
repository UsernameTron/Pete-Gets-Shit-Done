# CREW-ASSESSMENT Fix Prompt

Paste this into Claude Code terminal. Run from `~/airealitycheck.org obsidian/` or any project directory — the agent paths are absolute.

---

```
I just ran /gsd:crew --assess and got the CREW-ASSESSMENT.md with 7 priorities to fix. I want to execute all 7, in order. Use the GSD commands and agent files directly — don't ask me what to do, just do it.

Here's the context you need:

## File Locations
- GSD agents (source of truth): ~/projects/Pete-Gets-Shit-Done/agents/*.md
- GSD agents (global copy): ~/.claude/agents/*.md
- GSD workflows: ~/.claude/get-shit-done/workflows/*.md
- GSD commands (source): ~/projects/Pete-Gets-Shit-Done/commands/gsd/*.md
- GSD commands (global): ~/.claude/commands/gsd/*.md
- Command registry: ~/.claude/CLAUDE.md
- Assessment file: .planning/CREW-ASSESSMENT.md

## The 7 Priorities — Execute In Order

### Priority 1: Fix YAML Parsing (8 agents, ~30 min)
Convert all multi-line `description: >` blocks to single-line strings in these agent files:
- architect.md
- scaffolder.md
- auditor.md
- validator.md
- memory-seeder.md
- extension-validator.md
- hook-engineer.md
- plugin-builder.md

For each agent: read the file, find the `description: >` block in the YAML frontmatter, collapse it to a single-line `description: "..."` string. Preserve the meaning, just make it one line. Edit both the source copy in ~/projects/Pete-Gets-Shit-Done/agents/ AND the global copy in ~/.claude/agents/. Verify each file's YAML parses cleanly after editing.

### Priority 2: Consolidate Verification Agents (4 → 1)
Merge gsd-plan-checker, gsd-integration-checker, and gsd-nyquist-auditor INTO gsd-verifier as configurable modes.

Steps:
1. Read all 4 agent files to understand their current responsibilities
2. Redesign gsd-verifier.md to support a `scope` parameter: plan | integration | nyquist | general (default)
3. Each mode inherits the specific instructions from the agent it replaces
4. Add a "what NOT to do" section covering scope creep between modes
5. Add output format specs for each mode
6. Update these workflow files to reference gsd-verifier with scope instead of the old agents:
   - The plan-phase workflow should use `gsd-verifier scope:plan` instead of `gsd-plan-checker`
   - The verify-work workflow should use `gsd-verifier scope:integration` instead of `gsd-integration-checker`
   - The execute-phase and validate-phase workflows should use `gsd-verifier scope:nyquist` instead of `gsd-nyquist-auditor`
7. Archive the 3 absorbed agents (move to ~/projects/Pete-Gets-Shit-Done/agents/_archived/ with a note at the top saying "Absorbed into gsd-verifier — see Priority 2 of CREW-ASSESSMENT")
8. Update both source and global copies

### Priority 3: Consolidate Research Agents (2 → 1)
Merge gsd-phase-researcher and gsd-project-researcher into gsd-research-orchestrator with a scope parameter.

Steps:
1. Read both agent files
2. Create gsd-research-orchestrator.md with `scope: phase | project` parameter
3. Phase scope = research scoped to current phase plan and codebase
4. Project scope = broad research for new-project bootstrapping (the ×4 parallel pattern)
5. Update workflows:
   - discuss-phase and plan-phase workflows: replace gsd-phase-researcher with gsd-research-orchestrator scope:phase
   - new-project workflow: replace gsd-project-researcher with gsd-research-orchestrator scope:project
6. Archive gsd-phase-researcher and gsd-project-researcher to _archived/
7. Update both source and global copies

### Priority 4: Merge Validator Agents (2 → 1)
Merge extension-validator and validator into gsd-validator-hub.

Steps:
1. Read both agent files
2. Create gsd-validator-hub.md with `target: extension | general` parameter
3. Archive extension-validator and validator to _archived/
4. Update any workflows that reference them
5. Update both source and global copies

### Priority 5: Wire Utility Agents into GSD Workflows
1. Read repo-doc-architect.md — integrate its capabilities into the /gsd:finalize workflow so documentation is auto-generated during finalization
2. Read repo-commit-documenter.md — integrate its capabilities into the /gsd:ship workflow so commit documentation happens during shipping
3. Update the workflow files, not the agent files — the agents stay standalone but get spawned by these workflows

### Priority 6: Introduce Tool-Access Tiers
Define 4 tiers and assign every agent:
- **Explore**: Read, Glob, Grep, Bash (read-only commands only)
- **Research**: Explore + WebSearch, WebFetch
- **Modify**: Read, Write, Edit, Bash, Glob, Grep
- **Full**: All tools including MCP integrations

For each agent:
1. Determine the minimum tier needed for its job
2. Update the `allowed-tools` in the agent's YAML frontmatter to match the tier
3. Add a comment `# Tier: [name]` in the frontmatter for visibility
4. Flag any agent currently granted Full that could operate at a lower tier

### Priority 7: Add Quality Sections to Low-Scoring Agents
For every agent scoring 6-7/10 in the assessment, add these sections if missing:
- **"What NOT to do"** — 3-5 explicit anti-patterns for this agent's role
- **Output format spec** — exact structure of what the agent should produce
- **Error handling instructions** — what to do when tools fail, files are missing, or scope is ambiguous

Use gsd-planner.md and gsd-verifier.md (both 9/10) as the quality reference.

## Execution Rules
- Work through priorities 1-7 in sequence. Complete each before starting the next.
- For every file change, edit BOTH the source (~/projects/Pete-Gets-Shit-Done/agents/) AND the global copy (~/.claude/agents/).
- After all 7 priorities, run a verification pass: parse all agent YAML frontmatter and confirm zero parsing errors.
- Single commit at the end in Pete-Gets-Shit-Done with message: "crew-assessment: execute all 7 improvement priorities — consolidate agents 37→31, fix YAML, add quality sections"
- Update .planning/CREW-ASSESSMENT.md with a "## Execution Log" section at the bottom documenting what was done for each priority.
```
