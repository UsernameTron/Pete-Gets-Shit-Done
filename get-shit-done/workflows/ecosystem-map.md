<purpose>
Regenerate the GSD ecosystem map: scan the live filesystem for every component, reconcile counts against the previous run (drift history), assign each component to exactly one canonical lifecycle cluster, and write `.planning/GSD-ECOSYSTEM-MAP.md` (plus the executive one-pager with --exec).

Discovery is filesystem-first and zero-trust: nothing enters the inventory from memory, every count is derived from files actually read this run, and missing surfaces are recorded as `NOT FOUND — <path checked>` rather than guessed.
</purpose>

<philosophy>
**Script-first inventory, judgment second.** Derive ids, paths, counts, and cross-links mechanically (Bash/Glob), then apply clustering judgment on top. A wrong description is an anomaly to report, not a value to invent.

**The live system wins.** The baseline is only a reconciliation target. Every non-zero delta gets a one-line reason; surfaces that cannot be verified in the current environment are labeled unverifiable, never zeroed.

**Regenerate, never hand-edit.** Each run overwrites both output files completely and appends one dated row to the Drift History table. Hand edits to the outputs will be lost by design.
</philosophy>

<process>

<step name="parse_flags" priority="first">
Parse $ARGUMENTS for `--exec`, `--dry-run`, `--review`, and `--baseline <path>`. Unknown flags: warn and continue.
</step>

<step name="discover">
Scan these populations from the repo root. Record the exact source path and count for each; a missing directory is `NOT FOUND — <path checked>`.

| Population | Path | Notes |
|---|---|---|
| Core commands | `commands/gsd/*.md` | user-facing `/gsd:` namespace |
| Engine commands | `get-shit-done/commands/gsd/*.md` | engine-internal; flag any name that collides with a core command as `shadowed` |
| Ecosystem commands | `plugins/claude-mcp-ecosystem/commands/*.md` | `/` namespace |
| Workflows | `get-shit-done/workflows/*.md` | parse each command's `@...workflows/<x>.md` reference to build command→workflow links |
| Built-in agents | `agents/*.md` (excluding `_archived/`) | capture frontmatter `model` |
| Archived agents | `agents/_archived/*.md` | status `archived`; cluster by function, tag archived |
| Project agents | `.claude/agents/*.md` | |
| Plugin agents | `plugins/*/**/agents/*.md` | owner = plugin directory |
| Skills | `plugins/*/**/SKILL.md` + `.claude/skills/**/SKILL.md` | flag byte-identical duplicates and loose SKILL.md files |
| Hook sources | `hooks/*.js` (excluding `dist/`) | event + purpose from the header comment |
| Hook registrations | `.claude/settings.json` `hooks` key + any `**/hooks.json` | one record per live registration, event from the key |
| Local hooks | `.claude/hooks/*` | `unwired` when not referenced by any registration |
| Plugins | `plugins/*/.claude-plugin/plugin.json` + root `package.json` | name + version |
| Marketplace | `**/marketplace.json` | registered plugin list |
| MCP servers | `**/.mcp.json` + `mcpServers` key in settings | usually NOT FOUND in repo scope — say so |

Frontmatter parsing must tolerate leading HTML comments before the `---` fence and YAML block scalars (`description: >` / `|`). Descriptions come from frontmatter, then a `<purpose>` tag, then the first heading outside code fences; otherwise `NO DESCRIPTION IN SOURCE`.

Supporting assets (references, templates, `get-shit-done/bin`, `hooks/dist`, governance templates, tests, scripts) are counted for an appendix but excluded from the component matrix.
</step>

<step name="reconcile">
Resolve the baseline: `--baseline <path>` if given, else the most recent row of the existing map's Drift History table, else report `first run — no baseline`.

Produce a drift table: `Component type | Baseline | Discovered | Δ | Reason`. Every baseline row must appear; every non-zero Δ gets a one-line reason (shipped since baseline, renamed, moved, or UNVERIFIED — scan returned nothing). Also extract the numeric ecosystem claims from CLAUDE.md, README.md, and docs/DEVOPS-HANDOFF.md with `grep -n` line numbers and report claim-vs-measured as a three-way drift subsection (`scripts/check-doc-drift.cjs` is the CI-enforced subset).
</step>

<step name="cluster">
Assign every component to exactly ONE cluster. Definitions are canonical — do not invent clusters. Components genuinely fitting none go to C-UNMAPPED with a mandatory rationale and a coverage-gap recommendation.

- **C0 — Session & Context Lifecycle**: boot, checkpoint, resume, close-out. Anchors: /gsd:prime-patterns, /prime, /gsd:session-report, /wrap, /gsd:pause-work, /gsd:resume-work, /gsd:checkpoint, /gsd:daily, /gsd:note, /gsd:settings, /gsd:help, /gsd:stats; SessionStart + PreCompact hooks; workspace-lifecycle-ref, project-guide skills.
- **C1 — Discuss & Define**: requirements, research, assumptions, UX definition. Anchors: /gsd:discuss-phase, /gsd:research-phase, /gsd:list-phase-assumptions, /gsd:ui-phase, /gsd:profile-user; agents gsd-research-orchestrator, gsd-research-synthesizer, gsd-advisor-researcher, gsd-assumptions-analyzer, gsd-ui-researcher, gsd-user-profiler.
- **C2 — Plan & Architect**: intent into committed plan + phase structure. Anchors: /gsd:plan-phase, /gsd:plan-milestone-gaps, /gsd:validate-phase, /gsd:set-profile, /gsd:add-phase, /gsd:insert-phase, /gsd:remove-phase; agents gsd-planner, gsd-roadmapper.
- **C3 — Execute & Build**: doing the work. Anchors: /gsd:execute-phase, /gsd:do, /gsd:quick, /gsd:fast, /gsd:autonomous, /gsd:crew, /gsd:manager, /gsd:thread, /gsd:debug, /gsd:reapply-patches, /gsd:next, /gsd:progress; agents gsd-executor, gsd-debugger, gsd-ui-checker; write-time guard hooks (branch safety, staged-files, secrets scanner, nested-repo, prompt-injection, config-protection).
- **C4 — Verify & Review**: proving correctness before ship. Anchors: /gsd:verify-work, /gsd:add-tests, /gsd:review, /gsd:finalize, /gsd:ui-review, /gsd:audit-uat; agents gsd-verifier, gsd-validator-hub, gsd-ui-auditor; project agent test-runner; post-edit file-type advisor hook.
- **C5 — Ship & Release**: PR, CI, release, framework updates. Anchors: /gsd:ship, /gsd:pr-branch, /gsd:ci-watch, /gsd:update; pre-push / required-docs / uncommitted-files gate hooks.
- **C6 — Milestone & Workstream Orchestration**: managing the units that ship. Anchors: /gsd:new-milestone, /gsd:complete-milestone, /gsd:milestone-summary, /gsd:new-workspace, /gsd:list-workspaces, /gsd:remove-workspace, /gsd:workstreams, /gsd:portfolio.
- **C7 — Governance, Health & Audit**: keeping the system honest. Anchors: /gsd:health, /gsd:audit-agents, /gsd:audit-deps, /gsd:audit-milestone, /gsd:forensics, /gsd:map-codebase, /gsd:sync-docs, /gsd:cleanup, /gsd:ecosystem-map; agents gsd-codebase-mapper, gsd-dependency-auditor, gsd-ecosystem-auditor; project agent docs-sync; audit/observability hooks (MCP tool logger, context monitor, cost tracker, lesson-capture gate).
- **C8 — Backlog & Task Management**: capturing and triaging what's next. Anchors: /gsd:add-todo, /gsd:add-backlog, /gsd:check-todos, /gsd:review-backlog, /gsd:plant-seed.
- **C9 — Agent Lifecycle & Team Ops** (operator layer — MCP Ecosystem): day-to-day roster management. Anchors: /agents, /agent-setup, /agent-status, /agent-diagnose, /agent-add, /agent-remove, /agent-reset; skills subagent-concierge, subagent-companion, agent-design-patterns, frontmatter-reference, mcp-catalog; the subagent-lifecycle pipeline agents.
- **C10 — Extension & Agent Engineering** (meta layer — Claude Code Factory): building the tools that build the software. Anchors: all Factory skills (reference / generator / routing-diagnostic layers), Factory subagents, and the project-scoped plugin-developer agent.

Tie-breakers, in order:
1. A hook goes to the stage its enforcement protects (secrets scanner → C3; pre-push gate → C5; lesson-capture → C7).
2. A command that spans stages goes to its center of gravity.
3. Reference/generator skills that build agents go to C10 even if the built agent serves another stage.
4. MCP-Ecosystem /agent-* machinery lands in C9; Factory agent-builders land in C10.
5. Components from other registered plugins cluster by capability, not origin — tag the owning plugin in the master matrix.
6. Cluster by the component's OWN primary verb, not its caller's; a command and its 1:1 workflow share a cluster; multi-stage orchestrators take the widest stage they own; remaining ties go to the earlier lifecycle stage, flagged `tie-broken`.
7. Archived components keep their functional cluster with an `archived` tag; every count surface shows "total (of which N archived)".
</step>

<step name="write_outputs">
If `--dry-run`: print the drift table and per-cluster counts to the terminal and STOP — write nothing.

Otherwise write `.planning/GSD-ECOSYSTEM-MAP.md` with, in order: header + provenance; executive summary (≤5 bullets); inventory-by-type tables each with a `Source:` path line; Drift Report (+ doc-claims subsection); one `##` section per cluster C0–C10 (+C-UNMAPPED if non-empty) with a component table and count line; a Master matrix (`Component | Type | Cluster | Owning plugin | Spawns / Spawned-by`) where every component appears exactly once; a Mermaid `flowchart LR` (C1→C5 spine, C0 wrapping, C6/C7/C8 feeding, C9/C10 meta lane, labels = name + count); Coverage gaps & recommendations; appendices (rulebook note, supporting assets, Drift History).

Drift History: append exactly one row — `Date | Total | Commands | Workflows | Agents | Skills | Hooks | Baseline | Non-zero Δ rows` — preserving all prior rows.

With `--exec`, also write `.planning/GSD-ECOSYSTEM-MAP-EXEC.md`: a ≤20-word lede with the total; the same Mermaid diagram prefixed with this exact init directive:

```
%%{init: {'theme':'base','themeVariables':{'background':'#09090b','primaryColor':'#111113','primaryBorderColor':'#27272a','primaryTextColor':'#e4e4e7','lineColor':'#34d399','secondaryColor':'#22d3ee','tertiaryColor':'#18181b','fontFamily':'Plus Jakarta Sans, JetBrains Mono, monospace'}}}%%
```

(emerald-stroked spine nodes, cyan wrap/meta nodes); a two-column `Cluster | Components` table with spine clusters first; the top 3 gaps as Obsidian callouts (`> [!warning]` for the top gap, `> [!note]` for the rest). Keep it to one screen (≈50 rendered lines). Citations in both files use backtick code spans, not markdown links, so `scripts/validate-doc-links.cjs` treats them as text.
</step>

<step name="gates">
All must pass before reporting success; fix and regenerate until green:

- [ ] Every inventory component appears exactly once in the Master matrix
- [ ] Every component has exactly one primary cluster; C0–C10 non-empty or explained in gaps
- [ ] Drift table covers every baseline row; every non-zero Δ has a reason
- [ ] Spot-check 5 components by re-opening their source files — zero fabrications
- [ ] Both Mermaid diagrams are balanced and start with `flowchart LR` (exec carries the init directive)
- [ ] Exec pager counts equal the map's Master matrix totals
- [ ] Drift History grew by exactly one row
</step>

<step name="review" condition="--review">
Prefer `/gsd:review --codex` scoped to the map file, directed at: wrong-stage filings, hooks on the wrong enforcement stage, C-UNMAPPED items that have a home, and mis-weighted spine clusters. If codex is unavailable (`command -v codex` empty), say so plainly — "--codex not available here" — and spawn one cold-context subagent (no shared conversation state; give it only the map files and this workflow's cluster step) with the same charter. Present findings as an unapplied `[ ]` checklist. Do NOT auto-apply reassignments.
</step>

<step name="report" priority="last">
Print to the terminal: the drift table, the per-cluster count line for all clusters, any C-UNMAPPED items, the absolute paths of the file(s) written, and the review checklist if `--review` ran. Do not commit — leave the working tree for the user's review.
</step>

</process>
