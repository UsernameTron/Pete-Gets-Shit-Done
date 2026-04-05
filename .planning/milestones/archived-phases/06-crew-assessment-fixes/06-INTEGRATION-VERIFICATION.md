---
phase: 06-crew-assessment-fixes
milestone: v1.2-agent-quality-consolidation
verified: 2026-04-04T05:00:00Z
status: gaps_found
scope: integration
score: 6/8 checks passed
gaps:
  - truth: "Tool-access tiers match CREW-ASSESSMENT specification for all 15 source agents"
    status: failed
    reason: "6 agents have tier labels that contradict the documented tier table in CREW-ASSESSMENT.md"
    artifacts:
      - path: "agents/gsd-codebase-mapper.md"
        issue: "Tier: Modify — expected Explore per CREW-ASSESSMENT"
      - path: "agents/gsd-ui-auditor.md"
        issue: "Tier: Modify — expected Explore per CREW-ASSESSMENT"
      - path: "agents/gsd-ui-checker.md"
        issue: "Tier: Explore — expected Modify per CREW-ASSESSMENT"
      - path: "agents/gsd-validator-hub.md"
        issue: "Tier: Explore — expected Modify per CREW-ASSESSMENT"
      - path: "agents/gsd-research-synthesizer.md"
        issue: "Tier: Modify — expected Research per CREW-ASSESSMENT"
    missing:
      - "Correct tier comment on gsd-codebase-mapper.md to Explore"
      - "Correct tier comment on gsd-ui-auditor.md to Explore"
      - "Correct tier comment on gsd-ui-checker.md to Modify"
      - "Correct tier comment on gsd-validator-hub.md to Modify"
      - "Correct tier comment on gsd-research-synthesizer.md to Research"
  - truth: "gsd-validator-hub is wired into GSD workflows"
    status: failed
    reason: "gsd-validator-hub does not appear in any workflow file under /Users/cpconnor/.claude/get-shit-done/workflows/. The extension-validator and validator agents it absorbed also have no workflow entries. This agent has no workflow surface."
    artifacts:
      - path: "agents/gsd-validator-hub.md"
        issue: "Agent exists but no workflow references it"
    missing:
      - "Add gsd-validator-hub to relevant workflow available_agent_types list (likely new-project.md or a dedicated validate-extension workflow)"
---

# Phase 6: Crew Assessment Fixes — Integration Verification Report

**Phase Goal:** Consolidate agent roster from 37 to 29, wire consolidated agents into GSD workflows, ensure ecosystem self-consistency.
**Verified:** 2026-04-04
**Scope:** Cross-phase integration and E2E flow consistency (single-phase milestone)
**Status:** GAPS FOUND
**Previous verification:** 06-VERIFICATION.md (plan-quality check, pre-execution) — this is the post-execution integration check.

---

## Integration Checks

### Check 1: No Stale References to Absorbed Agents in Workflow Files

**Result: PASS**

Searched all 54 files in `/Users/cpconnor/.claude/get-shit-done/workflows/` for references to the 7 absorbed agent names:
- `gsd-plan-checker`
- `gsd-integration-checker`
- `gsd-nyquist-auditor`
- `gsd-phase-researcher`
- `gsd-project-researcher`
- `extension-validator`
- `validator` (as agent name)

Zero matches found. All workflow files reference only the consolidated agents.

---

### Check 2: Consolidated Agents Referenced in GSD Workflows

**Result: PASS (with caveat on gsd-validator-hub — see Check 5)**

| Consolidated Agent | Workflows Referencing It | Status |
| ------------------ | ------------------------ | ------ |
| `gsd-verifier` | verify-work.md, execute-phase.md, plan-phase.md, validate-phase.md, quick.md, manager.md, audit-milestone.md | WIRED |
| `gsd-research-orchestrator` | research-phase.md, discuss-phase.md, plan-phase.md, execute-phase.md, new-project.md, new-milestone.md, quick.md, discuss-phase-assumptions.md | WIRED |
| `gsd-validator-hub` | 0 workflow files | NOT WIRED |

---

### Check 3: gsd-verifier Handles All 4 Scopes

**Result: PASS**

Verified `gsd-verifier` description and body contain all four scope branches:
- `scope: general` — post-execution goal verification (line 45, `<scope_general>` block)
- `scope: plan` — pre-execution plan quality (line 718, `<scope_plan>` block)
- `scope: integration` — cross-phase wiring (line 1295, `<scope_integration>` block)
- `scope: nyquist` — validation gap filling (line 1696, `<scope_nyquist>` block)

Scope detection logic present at line 22. All 4 scopes operational.

---

### Check 4: Archived Agents Have Absorption Notes

**Result: PASS**

All 7 archived agents exist in `agents/_archived/`. Absorption metadata verified:

| Agent | Absorption Note |
| ----- | --------------- |
| `gsd-plan-checker.md` | HTML comment at top: "ABSORBED into gsd-verifier.md (scope: plan)" |
| `gsd-integration-checker.md` | HTML comment at top: "ABSORBED into gsd-verifier.md (scope: integration)" |
| `gsd-nyquist-auditor.md` | HTML comment at top: "ABSORBED into gsd-verifier.md (scope: nyquist)" |
| `gsd-phase-researcher.md` | Body text notes absorption into gsd-research-orchestrator |
| `gsd-project-researcher.md` | Body text notes absorption into gsd-research-orchestrator |
| `extension-validator.md` | Body text notes absorption into gsd-validator-hub |
| `validator.md` | Body text notes absorption into gsd-validator-hub |

---

### Check 5: gsd-validator-hub Wired into Workflows

**Result: FAIL**

`gsd-validator-hub` does not appear in any file under `/Users/cpconnor/.claude/get-shit-done/workflows/`. The agents it absorbed (`extension-validator`, `validator`) also had no workflow entries — this was explicitly noted as CREW-05 scope ("wire utility agents into workflows"), but the CREW-ASSESSMENT.md log only records wiring for `repo-doc-architect` (finalize) and `repo-commit-documenter` (ship).

`gsd-validator-hub` serves the extension and ecosystem validation use cases. Without a workflow entry it cannot be discovered or invoked through the standard GSD surface.

---

### Check 6: Tool-Access Tiers Match CREW-ASSESSMENT Specification

**Result: FAIL**

CREW-ASSESSMENT.md specifies these tier assignments. Actual `# Tier:` comments in agent files differ on 5 agents:

| Agent | Expected Tier | Actual Tier | Match |
| ----- | ------------- | ----------- | ----- |
| gsd-assumptions-analyzer | Explore | Explore | PASS |
| gsd-codebase-mapper | Explore | Modify | FAIL |
| gsd-user-profiler | Explore | Explore | PASS |
| gsd-ui-auditor | Explore | Modify | FAIL |
| gsd-advisor-researcher | Research | Research | PASS |
| gsd-research-orchestrator | Research | Research | PASS |
| gsd-research-synthesizer | Research | Modify | FAIL |
| gsd-ui-researcher | Research | Research | PASS |
| gsd-debugger | Modify | Modify | PASS |
| gsd-executor | Modify | Modify | PASS |
| gsd-planner | Modify | Modify | PASS |
| gsd-roadmapper | Modify | Modify | PASS |
| gsd-ui-checker | Modify | Explore | FAIL |
| gsd-validator-hub | Modify | Explore | FAIL |
| gsd-verifier | Modify | Modify | PASS |

**10/15 agents match. 5 mismatches.** The tier comment is a documentation label, not a runtime enforcement mechanism, so this does not break execution — but it creates a misleading governance record.

Note: The tier comment may conflict with the `tools:` frontmatter field in some cases. For example, `gsd-ui-checker` has `tools: Read, Write, Edit, Bash, Glob, Grep` (Modify-tier tools) but `# Tier: Explore`. The tier label is inconsistent with actual tool access.

---

### Check 7: Quality Sections Added to Target Agents

**Result: PASS**

All 9 target agents have "What NOT to Do" and "Error Handling" sections:

**Source agents (4):**
- `gsd-research-synthesizer.md` — sections present (3 matches each)
- `gsd-ui-auditor.md` — sections present (3 matches each)
- `gsd-ui-checker.md` — sections present (3 matches each)
- `gsd-ui-researcher.md` — sections present (3 matches each)

**Global-only agents (5) in `~/.claude/agents/`:**
- `architect.md` — sections present
- `scaffolder.md` — sections present
- `auditor.md` — sections present
- `memory-seeder.md` — sections present
- `hook-engineer.md` — sections present

---

### Check 8: Utility Agent Wiring (repo-doc-architect, repo-commit-documenter)

**Result: PASS**

- `repo-doc-architect` — wired into `commands/gsd/finalize.md` (line 117: spawned as subagent for documentation refresh)
- `repo-commit-documenter` — wired into `workflows/ship.md` (lines 138, 146: spawned when diff includes documentation-worthy changes)

---

## Observable Truths Summary

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | No stale references to absorbed agents in workflows | PASS | Zero grep matches across 54 workflow files |
| 2 | Consolidated agents referenced in GSD workflows | PARTIAL | gsd-verifier and gsd-research-orchestrator wired; gsd-validator-hub not wired |
| 3 | gsd-verifier handles all 4 scopes | PASS | All 4 scope blocks present in agent file |
| 4 | Archived agents have absorption notes | PASS | All 7 archives have absorption metadata |
| 5 | gsd-validator-hub wired into workflows | FAIL | Zero workflow references |
| 6 | Tool-access tiers match CREW-ASSESSMENT spec | FAIL | 5/15 agents have wrong tier label |
| 7 | Quality sections on all 9 target agents | PASS | All 9 confirmed |
| 8 | Utility agents wired into finalize/ship | PASS | Both confirmed present |

**Score: 6/8 checks passed**

---

## Gap Summary

Two gaps block full goal achievement:

**Gap 1 — Tier label mismatches (5 agents):** The `# Tier:` comment in the agent YAML frontmatter does not match the tier table documented in CREW-ASSESSMENT.md for 5 agents. This is a documentation consistency failure, not a runtime failure. The tier label has no enforcement mechanism — workflows do not filter agents by tier. Impact: governance confusion, not broken behavior.

**Gap 2 — gsd-validator-hub unwired:** The absorbed extension validation capability exists in `gsd-validator-hub.md` but no GSD workflow references it. Users have no discoverable entry point for extension or ecosystem validation via `/gsd:` commands. This is a workflow surface gap — the consolidation was completed but the wiring step for this specific agent was not executed.

---

## Known Out-of-Scope Issue (Documented, Not a Gap)

The CREW-ASSESSMENT.md documents a known issue: global CLAUDE.md files at `/Users/cpconnor/CLAUDE.md` and `/Users/cpconnor/.claude/CLAUDE.md` still reference `gsd-plan-checker` and `gsd-integration-checker` as standalone agents in the Quality Gates section. This was explicitly out-of-scope for Phase 6. It remains a documentation debt item.

---

## Human Verification Required

None — all checks were completable programmatically.

---

_Verified: 2026-04-04_
_Verifier: Claude (gsd-verifier scope:integration)_
