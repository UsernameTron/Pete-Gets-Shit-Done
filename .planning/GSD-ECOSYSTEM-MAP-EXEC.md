# GSD Ecosystem — Executive One-Pager

**GSD wraps software delivery in a governed 5-phase lifecycle — 241 components, 11 clusters, one map.**

```mermaid
%%{init: {'theme':'base','themeVariables':{'background':'#09090b','primaryColor':'#111113','primaryBorderColor':'#27272a','primaryTextColor':'#e4e4e7','lineColor':'#34d399','secondaryColor':'#22d3ee','tertiaryColor':'#18181b','fontFamily':'Plus Jakarta Sans, JetBrains Mono, monospace'}}}%%
flowchart LR
  C0(["C0 Session & Context Lifecycle (30)"])
  C1["C1 Discuss & Define (21)"] --> C2["C2 Plan & Architect (15)"] --> C3["C3 Execute & Build (30)"] --> C4["C4 Verify & Review (20)"] --> C5["C5 Ship & Release (8)"]
  C0 --> C1
  C5 --> C0
  C8["C8 Backlog & Task Management (8)"] --> C1
  C6["C6 Milestone & Workstream Orchestration (17)"] --> C2
  C7["C7 Governance, Health & Audit (29)"] -.-> C3
  C7 -.-> C5
  subgraph META["Supporting meta lane"]
    C10["C10 Extension & Agent Engineering (42)"] -.-> C9["C9 Agent Lifecycle & Team Ops (19)"]
  end
  C9 -.-> C3
  C10 -.-> C3
  classDef spine fill:#111113,stroke:#34d399,color:#e4e4e7,stroke-width:2px;
  classDef wrap fill:#18181b,stroke:#22d3ee,color:#e4e4e7;
  class C1,C2,C3,C4,C5 spine;
  class C0,C6,C7,C8,C9,C10 wrap;
```

| Cluster | Components |
|---|---|
| C1 — Discuss & Define | 21 |
| C2 — Plan & Architect | 15 |
| C3 — Execute & Build | 30 |
| C4 — Verify & Review | 20 |
| C5 — Ship & Release | 8 |
| C0 — Session & Context Lifecycle | 30 |
| C6 — Milestone & Workstream Orchestration | 17 |
| C7 — Governance, Health & Audit | 29 |
| C8 — Backlog & Task Management | 8 |
| C9 — Agent Lifecycle & Team Ops | 19 |
| C10 — Extension & Agent Engineering | 42 |
| C-UNMAPPED — Unmapped | 2 |

Counts equal the full map's 241-row Master matrix; 8 archived components stay in their functional clusters. Full detail: `.planning/GSD-ECOSYSTEM-MAP.md`

> [!warning] Gap 1 — Hook enforcement is workstation-bound
> Of the baseline's 17 runtime hooks, the repo registers only 2 live hooks and ships 6 sources wired solely by the installer; lesson-capture-gate.cjs sits unwired. Fix: version the hook registrations (or a settings template + installer contract test) so enforcement is reproducible from a fresh clone.

> [!note] Gap 2 — Docs disagree with the filesystem and each other
> README states 66, 64, and 30 commands and 6, 10, and 15 hooks in different sections; CLAUDE.md describes lib/*.cjs modules that are not in lib/ (it holds 2 JSON pattern files; engine logic lives in get-shit-done/bin). Fix: extend scripts/check-doc-drift.cjs to these surfaces.

> [!note] Gap 3 — Duplicate and shadowed component names
> .claude/skills/SKILL.md is byte-identical to dream-memory-consolidation/SKILL.md, and get-shit-done/commands/gsd/workstreams.md name-shadows commands/gsd/workstreams.md. Fix: delete the loose duplicate; rename or fold the engine copy.

