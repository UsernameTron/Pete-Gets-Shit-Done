=== GSD ECOSYSTEM AUDIT REPORT ===
Generated: 2026-07-13T00:00:00Z
Scope: 17 agents in /home/user/Pete-Gets-Shit-Done/agents
Installed: /root/.claude/agents

--- SUMMARY ---
Overall verdict: FLAG
Frontmatter:    PASS — 0 findings
Tool/Perms:     FLAG — 2 findings
Hygiene:        PASS — 0 findings
Description:    FLAG — 3 findings
Naming:         PASS — 0 findings
Install drift:  FLAG — 7 findings

--- FRONTMATTER FINDINGS ---
(none)

--- TOOL/PERMISSION FINDINGS ---
FLAG gsd-research-orchestrator — tools includes Bash and Write without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via `cat >`, bypassing an Edit restriction if one were added later.
  Fix: Add `disallowedTools: Edit` to frontmatter (or if Edit is needed, document why Edit is explicitly allowed).

FLAG gsd-ui-researcher — tools includes Bash and Write without disallowedTools: Edit. Defense-in-depth gap: Bash can write files via `cat >`, bypassing an Edit restriction if one were added later.
  Fix: Add `disallowedTools: Edit` to frontmatter (or if Edit is needed, document why Edit is explicitly allowed).

--- HYGIENE FINDINGS ---
(none)

--- DESCRIPTION FINDINGS ---
FLAG gsd-research-orchestrator — description lacks dispatch keyword (Spawned by, Triggered by, Use when, Invoked by). Agent is parametrized and dispatch is implicit in scope parameter, making discovery harder for agent pickers.
  Fix: Add "Spawned by /gsd:plan-phase or /gsd:research-phase (parametrized by scope: phase|project)" to description for clarity.

FLAG gsd-validator-hub — description lacks dispatch keyword (Spawned by, Triggered by, Use when, Invoked by). Agent is parametrized and dispatch is implicit in target parameter, making discovery harder for agent pickers.
  Fix: Add "Spawned by validation workflows or user request (parametrized by target: extension|ecosystem)" to description for clarity.

FLAG gsd-verifier — description lacks dispatch keyword (Spawned by, Triggered by, Use when, Invoked by). Agent is parametrized and dispatch is implicit in scope parameter, making discovery harder for agent pickers.
  Fix: Add "Spawned by verification workflows (parametrized by scope: general|plan|integration|nyquist)" to description for clarity.

--- NAMING FINDINGS ---
(none)

--- INSTALL DRIFT FINDINGS ---
FLAG gsd-debugger.md — differs between repo and installed (~10 diff lines). Likely contains recent updates not yet synced to install directory.
  Fix: Reinstall the plugin or `cp agents/gsd-debugger.md $HOME/.claude/agents/gsd-debugger.md`

FLAG gsd-ecosystem-auditor.md — differs between repo and installed (~48 diff lines). Significant drift detected (this agent itself). Install copy appears to be stale.
  Fix: Reinstall the plugin or `cp agents/gsd-ecosystem-auditor.md $HOME/.claude/agents/gsd-ecosystem-auditor.md`

FLAG gsd-executor.md — differs between repo and installed (~12 diff lines). Likely contains recent updates not yet synced to install directory.
  Fix: Reinstall the plugin or `cp agents/gsd-executor.md $HOME/.claude/agents/gsd-executor.md`

FLAG gsd-planner.md — differs between repo and installed (~6 diff lines). Minor drift detected. Install copy may be slightly outdated.
  Fix: Reinstall the plugin or `cp agents/gsd-planner.md $HOME/.claude/agents/gsd-planner.md`

FLAG gsd-research-synthesizer.md — differs between repo and installed (~12 diff lines). Likely contains recent updates not yet synced to install directory.
  Fix: Reinstall the plugin or `cp agents/gsd-research-synthesizer.md $HOME/.claude/agents/gsd-research-synthesizer.md`

FLAG gsd-roadmapper.md — differs between repo and installed (~8 diff lines). Likely contains recent updates not yet synced to install directory.
  Fix: Reinstall the plugin or `cp agents/gsd-roadmapper.md $HOME/.claude/agents/gsd-roadmapper.md`

FLAG gsd-ui-researcher.md — differs between repo and installed (~8 diff lines). Likely contains recent updates not yet synced to install directory.
  Fix: Reinstall the plugin or `cp agents/gsd-ui-researcher.md $HOME/.claude/agents/gsd-ui-researcher.md`

FLAG gsd-validator-hub.md — differs between repo and installed (~4 diff lines). Minor drift detected. Install copy may be slightly outdated.
  Fix: Reinstall the plugin or `cp agents/gsd-validator-hub.md $HOME/.claude/agents/gsd-validator-hub.md`

--- TOOL STATUS ---
(all checks completed)

--- RECOMMENDATIONS ---
1. Resync all 7 drifted agents with a single bulk copy: `cp agents/gsd-*.md $HOME/.claude/agents/` or reinstall the plugin to bring all agents in sync.
2. Add `disallowedTools: Edit` to gsd-research-orchestrator and gsd-ui-researcher frontmatter to close the defense-in-depth gap (Bash can bypass Edit restrictions via cat redirection).
3. Clarify dispatch contracts in descriptions for gsd-research-orchestrator, gsd-validator-hub, and gsd-verifier by explicitly naming their parametrized invocation points.

=== END REPORT ===
