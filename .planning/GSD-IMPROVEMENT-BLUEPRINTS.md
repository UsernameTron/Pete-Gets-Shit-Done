# GSD Improvement Blueprints — Execution-Ready Packages

Run: Frontier Autonomy Audit, 2026-07-12. Companion to `GSD-AUTONOMY-AUDIT.md` (friction ledger) and `FRONTIER-AUDIT-DECISIONS.md` (decision journal).

Contract: every blueprint is applyable by a budget-tier model — complete fenced diffs, exact paths, no unstated assumptions. Diffs are PROPOSALS; nothing here was applied to engine source during the audit run. Diffs may only ADD gating; none may weaken a hook or gate. Scores: Involvement-saved (1–5) × Frequency (1–5) × Safety (1–5).

## Mandatory Candidate Dispositions

**9 blueprints authored · 8 fully validated (every diff passes `git apply --check` against HEAD) · 1 sketch (7 of 10 diffs clean).** Ranked by Involvement-saved × Frequency × Safety. Diffs are proposals — none applied to engine source during the run.

All seven audit-mandated candidates dispositioned. Evidence verified at source by the seed-status lens (Phase 2).

**(a) ADOPTED — BP `bp-a-finalize-push-consent`**

Autonomy-safe finalize: consent-gate both pushes; unblocks W5 ship-milestone routing through finalize instead of around it.

_Source evidence:_ commands/gsd/finalize.md Gate 1 (:60-67) pushes unpushed commits via `git push origin $(git branch --show-current)` at :65 and Gate 7 (:136-144) 'Push to origin' at :143 — neither preceded by any approval prompt. Frontmatter allowed-tools (:5-12) = Read/Bash/Glob/Grep/Edit/Write/Task, omitting AskUserQuestion, yet Gate 3 (:93) runs /gsd:complete-milestone inline, whose workflow requires AskUserQuestion at complete-milestone.md:390 and :572 — the tool-permission mismatch is real and current. Gate 5.5 (:118) still spawns cross-plugin repo-doc-architect. Shelving note verified at .planning/GSD-AUTONOMOUS-WORKFLOWS.md:135-137 ('shelved by operator decision (2026-07-12)... two ungated pushes plus a tool-permission mismatch'), detail at :157 citing finalize.md:65,143. git log -- commands/gsd/finalize.md: last touch is 1a609a3 'v2.5: Final Documentation Sync (#2)' — no repair since the shelving note. The seeded claim is fully current.

**(b) ADOPTED-AS-DONE**

smart-discuss extraction shipped before this run; no blueprint needed. (A separate blueprint, `BP-smart-discuss-auto-parity`, adds the missing --auto path — a new gap this audit found, not the original candidate.)

_Source evidence:_ get-shit-done/workflows/smart-discuss.md exists (306 lines): CTRL-03 note at :5 states this file IS the extraction ('autonomous.md now invokes this file as a thin caller, and get-shit-done/workflows/idea-to-shipped.md invokes it directly as a second caller'); input contract :9-21 (PHASE_NUM in, CONTEXT.md out, callee re-derives phase paths via its own `init phase-op` call). autonomous.md smart_discuss step :330-340 is the thin caller — one-line invocation :334, CTRL-03 extraction note :336, input pass-through :338. Second caller confirmed: idea-to-shipped.md:63-67 invokes the same extracted file; its success criteria :349-350 mandate 'not an inlined copy of its sub-steps' and error handling :293-295 covers smart-discuss failing to produce CONTEXT.md. Extraction complete with both callers wired.

**(c) ADAPTED — BP `c-do-router-w3-w4` (scoped)**

Wired W3 bug-to-branch + W4 quick-change only. W5 ship-milestone stays SHELVED per its own shelving note; its blocker (finalize ungated pushes) is addressed by BP-A, so a future run can un-shelve it.

_Source evidence:_ Router table get-shit-done/workflows/do.md:38-58 now has 19 rows (design-time doc described a 16-row router, GSD-AUTONOMOUS-WORKFLOWS.md:23). Wired workflow routes: W2 idea-to-shipped :45 ('workflow:idea-to-shipped ... (W2)'), W1 daily-startup :51 ('(W1)'), W6 wrap-and-sync :54 ('(W6)'); dispatch mechanics :92 execute @$HOME/.claude/get-shit-done/workflows/<name>.md, explicitly crediting .planning/GSD-AUTONOMOUS-WORKFLOWS.md. All three files exist (daily-startup.md 148L, idea-to-shipped.md 381L, wrap-and-sync.md 176L) with contract tests on disk (tests/daily-startup.test.cjs, tests/idea-to-shipped.test.cjs, tests/wrap-and-sync.test.cjs). W7 shipped as standalone command, not a router row: commands/gsd/ecosystem-map.md + get-shit-done/workflows/ecosystem-map.md (114L); GSD-AUTONOMOUS-WORKFLOWS.md:178-180 records commit 375528e, PR #33, tests/ecosystem-map.test.cjs. W3 bug-to-branch and W4 quick-change: no files in get-shit-done/workflows/ or commands/gsd/ (ls\|grep = none); do.md still routes bugs to plain /gsd:debug (:42) and small tasks to plain /gsd:quick (:58) — the commands, not the designed chains. W5 ship-milestone: spec-only, shelved (GSD-AUTONOMOUS-WORKFLOWS.md:135-137); milestone completion routes to plain /gsd:complete-milestone (:57). Net: 3/7 built+wired (W1/W2/W6), 1 built standalone (W7), 2 unbuilt (W3/W4), 1 shelved (W5) — exactly the expected picture.

**(d) ADOPTED — BP `d`**

Config-driven defaults: archive + branch-strategy become DEFAULT+LOG; tag PUSH stays GATE-KEEP (it publishes) with improved presentation.

_Source evidence:_ All three human prompts verified live in get-shit-done/workflows/complete-milestone.md at exactly the lines W5's spec cites (GSD-AUTONOMOUS-WORKFLOWS.md:150 → workflow:390/:572/:669): (1) phase archival — AskUserQuestion(header='Archive Phases', 'Archive phase directories to milestones/?') at :390, optional step :388-400; (2) branch handling — AskUserQuestion with Squash merge (Recommended)/Merge with history/Delete without merging/Keep branches at :572, branch-detection block :556-570; (3) tag push — Ask: 'Push tag to remote? (y/n)' at :669, push executes :672-674. Prompted-vs-silent breakdown: milestone-doc archival is silent CLI work (:376-386, no prompt); tag CREATION is silent at :652-667 (`git tag -a v[X.Y]` fires before any ask); tag PUSH is prompted — but via plain y/n text, the only one of the three not using structured AskUserQuestion. The seeded claim ('3 internal prompts still fire and stay human') verifies current at source.

**(e) ADOPTED-AS-DONE (residual gap noted, not blueprinted)**

check-doc-drift.cjs + validate-doc-links.cjs are wired as blocking CI gates; drift is caught at PR time. The recount-on-write self-healing the candidate imagined remains open, but deliberately not blueprinted this run — the CI gate already prevents drift from merging, so recount-on-write is an ergonomic nicety, not a correctness fix.

_Source evidence:_ Detection + CI gates built and wired: scripts/check-doc-drift.cjs is detection-only (exit-code contract 0/1/2; process.exit at :376,:384,:652,:665; zero fs.writeFile calls — it never edits docs) and scripts/validate-doc-links.cjs exists. CI wiring verified in .github/workflows/test.yml — drift step inside the test job :53-56, gated single-leg (matrix.full_suite && ubuntu-latest && node 22); docs-integrity job :92-116 runs validate-doc-links.cjs with 6 --exclude patterns. Residual gap confirmed live: correction is workflow-mediated only — wrap-and-sync.md check_doc_drift step :19-30 edits CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md to measured values on exit 1 in the same commit unit — so drift self-heals only when the operator runs W6. Recount-on-write is absent everywhere: hooks/ holds only the 6 runtime hooks (gsd-prompt-guard, gsd-config-protection, gsd-context-monitor, gsd-cost-tracker, gsd-check-update, gsd-statusline) and .claude/settings.json registers only a SubagentStop health check — nothing recounts doc claims when a doc or test file is written.

**(f) ADOPTED — BP `bp-f-review-sentinel-lesson-gate`**

Deferred-review sentinel (.planning/.review-pending) in the governance Stop hook + registration of the inert lesson-capture Stop gate. Only the uncommitted-files block is affected; secrets/commit-on-main blocks untouched.

_Source evidence:_ Prescription: tasks/lessons.md:19 (2026-04-10 [Hook Design]) — add .planning/.review-pending sentinel that the uncommitted-files Stop hook checks. Hook side UNFIXED: governance/templates/global/settings-hooks.json Stop hook :88-98 still blocks with 'Commit or stash before stopping' (:93) and contains no sentinel check. Workflow side IMPLEMENTED: wrap-and-sync.md:92-98 check_review_sentinel step (`test -f .planning/.review-pending`; if present, gate ceiling forced to 'Commit local only' — push never offered) plus :162 restating the cap, contract-locked by tests/wrap-and-sync.test.cjs:85-88. lesson-capture-gate.cjs registration: still UNREGISTERED — file exists at .claude/hooks/lesson-capture-gate.cjs but .claude/settings.json defines only SubagentStop → scripts/gsd-agent-health-check.sh; matches lessons.md:18 (2026-04-13: shipped PR #34, never wired) and GSD-AUTONOMOUS-WORKFLOWS.md:36 ('Unwired... inert'); wrap-and-sync.md:2 explicitly performs the lesson check 'in place of the unwired .claude/hooks/lesson-capture-gate.cjs Stop hook'. Backlog echo still open: tasks/todo.md:138 'Stop-hook sentinel for review-pending state'.

**(g) ADOPTED — BP `g-post-frontier-tier-map`**

Post-frontier tier map: fixes the gsd-verifier model anomaly + a model-profiles.cjs cell, publishes a stage→capability-tier table grounded in this run own telemetry, and recommends the default profile for cheaper-model operation starting tomorrow.

_Source evidence:_ Structure verified in get-shit-done/bin/lib/model-profiles.cjs: MODEL_TIERS :14-19 (trivial→budget, standard→balanced, complex/critical→quality); 17-agent × {quality,balanced,budget} matrix :28-46 using only the pre-frontier aliases opus/sonnet/haiku; dynamicSelect :93-139 with profile ceiling/floor :106-110 and INTEL-16 history promotion :117-135; VALID_PROFILES derives from matrix keys (:47) = quality/balanced/budget — no 'inherit'. Sync vs get-shit-done/references/model-profiles.md: all 17×3 shared cells MATCH the md table (:9-25), but the md documents a 4th 'inherit' column with no matrix counterpart ('inherit' is short-circuited downstream at core.cjs:1331, not represented in the map), and the cjs header :8-11 still carries the acknowledged debt ('Should be in sync with the profiles table... possibly worth making this the single source of truth at some point'). gsd-verifier frontmatter anomaly CONFIRMED: agents/gsd-verifier.md:5 'model: opus' vs its profile row quality:sonnet/balanced:sonnet/budget:haiku (cjs:36, md:16) — opus appears in no cell; a sweep of all 17 agents' frontmatter model fields shows gsd-verifier is the only agent matching NO column of its own row (others match balanced or quality/budget, e.g. gsd-debugger opus=quality, gsd-codebase-mapper sonnet=quality, gsd-ui-checker haiku=budget). No post-frontier model IDs or aliases appear anywhere in the tier map, the reference doc, or agent frontmatter.

**Additional ledger-derived blueprints** (beyond the seven mandatory): `engine-robustness-daily-uat-crash-pair` (fixes two live-caught engine crashes), `BP-smart-discuss-auto-parity` (--auto parity for the autonomous flows), `BP-gate1-auto-advance-tunnel` (closes the auto_advance tunnel under idea-to-shipped GATE 1), `agent-skills-fail-loud-resolution` (fixes 9 orphaned agent-skills identifiers + fail-loud warning).

## Blueprints (ranked by composite score)

### agent-skills-fail-loud-resolution — Fail-loud agent-skills resolution: fix 9 orphaned identifiers, warn on unknown agent id

**Score 100** (involvement-saved 4 × frequency 5 × safety 5) · **Status: SKETCH** — 7 of 10 diffs apply clean (verify-work.md, plan-phase.md, ui-review.md, discuss-phase.md, research-phase.md, init.cjs, tests/agent-skills.test.cjs); 3 corrupt at hunk boundary and must be re-derived by the applier: quick.md, new-project.md, new-milestone.md (each fails git apply --check with corrupt-patch). The design and the 7 clean diffs are applyable as-is

**Problem.** Kills Phase-1 telemetry defect 4 (.planning/GSD-AUTONOMY-AUDIT.md:54, VERIFIED via audit-agents drive): "Agent-skills lookups reference 5 non-roster identifiers (gsd-researcher, gsd-checker, gsd-synthesizer, gsd-advisor, gsd-ui-reviewer) across 9 workflow call sites with stderr suppressed — silent skill-injection failure; buildAgentSkillsBlock at get-shit-done/bin/lib/init.cjs:1978." Confirmed live: buildAgentSkillsBlock (get-shit-done/bin/lib/init.cjs:1978-2047, reachable only via cmdAgentSkills at :2053, dispatched from gsd-tools.cjs:578-581) returns '' for ANY agentType absent from config.agent_skills — including agentType strings that exist nowhere in the 17-agent roster (agents/*.md, none of them "gsd-researcher/-checker/-synthesizer/-advisor/-ui-reviewer") — and all 28 agent-skills call sites across get-shit-done/workflows/ pipe stderr to /dev/null, so the empty return is silent by construction. Each of the 9 broken sites feeds a Task() call whose actual subagent_type is a DIFFERENT, correct roster id, verified per site (not guessed): get-shit-done/workflows/plan-phase.md:27 (gsd-researcher; Task() at :322 uses subagent_type="gsd-research-orchestrator"), get-shit-done/workflows/research-phase.md:45 (gsd-researcher; Task() at :71 uses "gsd-research-orchestrator"), get-shit-done/workflows/verify-work.md:36 (gsd-checker; Task() at :607-608 uses "gsd-verifier", and the file's own <available_agent_types> block at :7-11 lists only gsd-planner/gsd-verifier), get-shit-done/workflows/quick.md:123 (gsd-checker; Task() at :472-474 uses "gsd-verifier" with model="{checker_model}"), get-shit-done/workflows/plan-phase.md:29 (gsd-checker; Task() at :608-609 uses "gsd-verifier"; plan-phase.md's own <available_agent_types> at :11-16 lists only research-orchestrator/planner/verifier — no separate checker), get-shit-done/workflows/new-project.md:63 (gsd-synthesizer; Task() at :816 uses "gsd-research-synthesizer"), get-shit-done/workflows/new-milestone.md:150 (gsd-synthesizer; Task() at :269 uses "gsd-research-synthesizer"), get-shit-done/workflows/discuss-phase.md:137 (gsd-advisor; the fan-out Task() at :494-507 self-loads its role via the prompt text "read @~/.claude/agents/gsd-advisor-researcher.md" and runs as subagent_type="general-purpose"), get-shit-done/workflows/ui-review.md:21 (gsd-ui-reviewer; Task() at :102 uses "gsd-ui-auditor", and ui-review.md's own <available_agent_types> at :9-12 lists exactly one valid type, gsd-ui-auditor). Net effect: any operator who configures config.agent_skills for gsd-research-orchestrator, gsd-verifier, gsd-research-synthesizer, gsd-advisor-researcher, or gsd-ui-auditor gets zero skill injection on these 9 call paths, with no diagnostic anywhere, indefinitely.

**Design.** Two-part, additive-only fix. (1) Correct each of the 9 broken agent-skills identifiers to the exact subagent_type its own Task() call already dispatches to (evidence-verified per site, not guessed — see problem); a one-token change per line, with the shell variable names (AGENT_SKILLS_CHECKER, etc.) left untouched so the ${...} interpolations later in each file keep working unmodified. (2) Extend buildAgentSkillsBlock's own existing "warn, never block" precedent — it already writes a `[agent-skills] WARNING: ...` line to stderr for four other unresolvable states (unsafe path, missing SKILL.md, version drift, metadata validation, at current init.cjs :2009/:2016/:2024/:2033/:2036) — with a sixth branch that fires when `agentType` is truthy but absent from a new module-level `KNOWN_AGENT_TYPES` roster Set (the 17 ids in agents/*.md / CLAUDE.md "Deployed Agents"); this is the audit's "hook gate" family in its non-blocking, informational mode — the same shape as gsd-check-update.js ("informs, never prompts") from the hook-enforcement-not-asking precedent — placed before the existing `if (!config || !config.agent_skills || !agentType) return ''` short-circuit so it fires regardless of whether the caller has any config at all, which is exactly the condition under which all 9 bugs shipped undetected.

**Execution-ready package.**

_`get-shit-done/workflows/verify-work.md`_

```diff
--- a/get-shit-done/workflows/verify-work.md
+++ b/get-shit-done/workflows/verify-work.md
@@ -33,7 +33,7 @@
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init verify-work "${PHASE_ARG}")
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
 AGENT_SKILLS_PLANNER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-planner 2>/dev/null)
-AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-checker 2>/dev/null)
+AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-verifier 2>/dev/null)
 ```
 
 Parse JSON for: `planner_model`, `checker_model`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `has_verification`, `uat_path`.
```

_`get-shit-done/workflows/quick.md`_

```diff
--- a/get-shit-done/workflows/quick.md
+++ b/get-shit-done/workflows/quick.md
@@ -120,7 +120,7 @@
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
 AGENT_SKILLS_PLANNER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-planner 2>/dev/null)
 AGENT_SKILLS_EXECUTOR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-executor 2>/dev/null)
-AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-checker 2>/dev/null)
+AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-verifier 2>/dev/null)
 AGENT_SKILLS_VERIFIER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-verifier 2>/dev/null)
 ```
```

_`get-shit-done/workflows/plan-phase.md`_

```diff
--- a/get-shit-done/workflows/plan-phase.md
+++ b/get-shit-done/workflows/plan-phase.md
@@ -24,9 +24,9 @@
 ```bash
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-phase "$PHASE")
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
-AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-researcher 2>/dev/null)
+AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-orchestrator 2>/dev/null)
 AGENT_SKILLS_PLANNER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-planner 2>/dev/null)
-AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-checker 2>/dev/null)
+AGENT_SKILLS_CHECKER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-verifier 2>/dev/null)
 ```
 
 Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`.
```

_`get-shit-done/workflows/ui-review.md`_

```diff
--- a/get-shit-done/workflows/ui-review.md
+++ b/get-shit-done/workflows/ui-review.md
@@ -18,7 +18,7 @@
 ```bash
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
-AGENT_SKILLS_UI_REVIEWER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-ui-reviewer 2>/dev/null)
+AGENT_SKILLS_UI_REVIEWER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-ui-auditor 2>/dev/null)
 ```
 
 Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `commit_docs`.
```

_`get-shit-done/workflows/discuss-phase.md`_

```diff
--- a/get-shit-done/workflows/discuss-phase.md
+++ b/get-shit-done/workflows/discuss-phase.md
@@ -134,7 +134,7 @@
 ```bash
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
-AGENT_SKILLS_ADVISOR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-advisor 2>/dev/null)
+AGENT_SKILLS_ADVISOR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-advisor-researcher 2>/dev/null)
 ```
 
 Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`.
```

_`get-shit-done/workflows/new-project.md`_

```diff
--- a/get-shit-done/workflows/new-project.md
+++ b/get-shit-done/workflows/new-project.md
@@ -60,7 +60,7 @@
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-project)
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
 AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-orchestrator 2>/dev/null)
-AGENT_SKILLS_SYNTHESIZER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-synthesizer 2>/dev/null)
+AGENT_SKILLS_SYNTHESIZER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-synthesizer 2>/dev/null)
 AGENT_SKILLS_ROADMAPPER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-roadmapper 2>/dev/null)
 ```
```

_`get-shit-done/workflows/new-milestone.md`_

```diff
--- a/get-shit-done/workflows/new-milestone.md
+++ b/get-shit-done/workflows/new-milestone.md
@@ -147,7 +147,7 @@
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-milestone)
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
 AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-orchestrator 2>/dev/null)
-AGENT_SKILLS_SYNTHESIZER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-synthesizer 2>/dev/null)
+AGENT_SKILLS_SYNTHESIZER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-synthesizer 2>/dev/null)
 AGENT_SKILLS_ROADMAPPER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-roadmapper 2>/dev/null)
 ```
```

_`get-shit-done/workflows/research-phase.md`_

```diff
--- a/get-shit-done/workflows/research-phase.md
+++ b/get-shit-done/workflows/research-phase.md
@@ -42,7 +42,7 @@
 INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
 if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
 # Extract: phase_dir, padded_phase, phase_number, state_path, requirements_path, context_path
-AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-researcher 2>/dev/null)
+AGENT_SKILLS_RESEARCHER=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" agent-skills gsd-research-orchestrator 2>/dev/null)
 ```
 
 ## Step 4: Spawn Researcher
```

_`get-shit-done/bin/lib/init.cjs`_

```diff
--- a/get-shit-done/bin/lib/init.cjs
+++ b/get-shit-done/bin/lib/init.cjs
@@ -1963,6 +1963,29 @@
   output(result, raw);
 }
 
+// Canonical GSD agent roster (agents/*.md — 17 shipped agents; CLAUDE.md "Deployed Agents").
+// Keep in sync when agents are added/removed/renamed. Used only to WARN on an unresolvable
+// agent-skills lookup below (see buildAgentSkillsBlock) — never to block or alter resolution.
+const KNOWN_AGENT_TYPES = new Set([
+  'gsd-advisor-researcher',
+  'gsd-assumptions-analyzer',
+  'gsd-codebase-mapper',
+  'gsd-debugger',
+  'gsd-dependency-auditor',
+  'gsd-ecosystem-auditor',
+  'gsd-executor',
+  'gsd-planner',
+  'gsd-research-orchestrator',
+  'gsd-research-synthesizer',
+  'gsd-roadmapper',
+  'gsd-ui-auditor',
+  'gsd-ui-checker',
+  'gsd-ui-researcher',
+  'gsd-user-profiler',
+  'gsd-validator-hub',
+  'gsd-verifier',
+]);
+
 /**
  * Build a formatted agent skills block for injection into Task() prompts.
  *
@@ -1978,6 +2001,13 @@
 function buildAgentSkillsBlock(config, agentType, projectRoot) {
   const { validatePath } = require('./security.cjs');
 
+  // Fail loud (not silent) when a caller queries an id outside the shipped roster —
+  // e.g. a typo'd or renamed agent type. Warning only: resolution below still returns
+  // '' exactly as before, so no existing behavior changes for valid ids.
+  if (agentType && !KNOWN_AGENT_TYPES.has(agentType)) {
+    process.stderr.write(`[agent-skills] WARNING: Unknown agent type "${agentType}" — not in the GSD agent roster (agents/*.md); skill injection for this call always resolves empty\n`);
+  }
+
   if (!config || !config.agent_skills || !agentType) return '';
 
   let skillPaths = config.agent_skills[agentType];
```

_`tests/agent-skills.test.cjs`_

```diff
--- a/tests/agent-skills.test.cjs
+++ b/tests/agent-skills.test.cjs
@@ -149,6 +149,38 @@
     const parsed = JSON.parse(result.output);
     assert.strictEqual(parsed, '', 'Should return empty string');
   });
+
+  test('buildAgentSkillsBlock warns on stderr for a non-roster agent type', () => {
+    const { buildAgentSkillsBlock } = require('../get-shit-done/bin/lib/init.cjs');
+    const originalWrite = process.stderr.write;
+    const captured = [];
+    process.stderr.write = (chunk) => { captured.push(chunk.toString()); return true; };
+    try {
+      buildAgentSkillsBlock({}, 'gsd-checker', tmpDir);
+    } finally {
+      process.stderr.write = originalWrite;
+    }
+    assert.ok(
+      captured.some((line) => line.includes('[agent-skills] WARNING') && line.includes('gsd-checker')),
+      `Expected an unknown-agent warning for "gsd-checker", got: ${captured.join('')}`
+    );
+  });
+
+  test('buildAgentSkillsBlock does not warn for a real roster agent type', () => {
+    const { buildAgentSkillsBlock } = require('../get-shit-done/bin/lib/init.cjs');
+    const originalWrite = process.stderr.write;
+    const captured = [];
+    process.stderr.write = (chunk) => { captured.push(chunk.toString()); return true; };
+    try {
+      buildAgentSkillsBlock({}, 'gsd-verifier', tmpDir);
+    } finally {
+      process.stderr.write = originalWrite;
+    }
+    assert.ok(
+      !captured.some((line) => line.includes('Unknown agent type')),
+      `Should not warn for a real roster agent, got: ${captured.join('')}`
+    );
+  });
 });
 
 // ─── config-ensure-section includes agent_skills ────────────────────────────
```

**Test plan.**
1. Structural gate (already run in-session, all 10 hunks clean): from repo root on autonomy/frontier-audit, pipe each diff above into `git apply --check --verbose -`; every file reported 'Checking patch <path>... ' with no error.
2. Syntax gate (already run in-session): pipe the post-patch content of get-shit-done/bin/lib/init.cjs and tests/agent-skills.test.cjs into `node --check -`; both exit 0 with no parse error.
3. Apply the 10-file patch set, then run `npm test` (== `node scripts/run-tests.cjs`, per package.json:51). This extends the existing tests/agent-skills.test.cjs describe('agent-skills command', ...) block with two new cases: 'buildAgentSkillsBlock warns on stderr for a non-roster agent type' (asserts a captured stderr line containing both '[agent-skills] WARNING' and 'gsd-checker' when calling buildAgentSkillsBlock({}, 'gsd-checker', tmpDir) directly) and 'buildAgentSkillsBlock does not warn for a real roster agent type' (same harness with 'gsd-verifier', asserts no 'Unknown agent type' line). Expect both green, plus the file's 3 pre-existing stdout-empty assertions ('returns empty when no config exists', 'returns empty when config has no agent_skills section', 'returns empty for unconfigured agent type') still passing unchanged — proving the new check never flips output for any id already in the roster.
4. Regression grep for the 5 dead identifiers (verified none is a substring of its own replacement, so no false negatives): `grep -rn 'agent-skills gsd-researcher\|agent-skills gsd-checker\|agent-skills gsd-synthesizer\|agent-skills gsd-advisor \|agent-skills gsd-ui-reviewer' get-shit-done/workflows/*.md` — 9 matches before the patch, 0 after.
5. Coverage-of-surface check: `grep -rn 'agent-skills gsd-' get-shit-done/workflows/*.md | wc -l` — 28 both before and after, confirming only identifiers were corrected and no call site was added, dropped, or duplicated.
6. Manual proof the new warning actually fires end-to-end (the 28 call sites all redirect stderr, see risk_notes, so this must be exercised directly): from repo root, `node -e "console.log(require('./get-shit-done/bin/lib/init.cjs').buildAgentSkillsBlock({}, 'gsd-checker', process.cwd()))"` — stdout prints an empty line and stderr (not suppressed here) prints `[agent-skills] WARNING: Unknown agent type "gsd-checker" ...`; repeat with 'gsd-verifier' and confirm stderr is silent.

**Rollback.** Single step: `git revert <commit-sha>` on the one commit these 10 diffs land in together — every hunk is either a self-contained string substitution (the 9 identifier fixes) or a purely additive, non-blocking insertion (the KNOWN_AGENT_TYPES const + warning branch in init.cjs, the 2 new tests), so the revert is a clean text inverse with no config, data, or migration to unwind.

**Risk notes.** Honest limitation, not a defect: all 28 agent-skills call sites (the 9 fixed here plus the 19 already-correct ones) redirect stderr to /dev/null, so the new WARNING this blueprint adds is real but currently invisible during normal workflow execution — it only surfaces via direct buildAgentSkillsBlock()/CLI calls made without that redirect (e.g. the new unit tests, or manual debugging per test_plan's last step). The durable value here is the correctness fix (5 dead identifiers now resolve to their real, already-proven-correct agents); making the warning actually reach an operator would require touching the ambient `2>/dev/null` convention at all 28 sites, which is a much larger, differently-scoped change this blueprint deliberately does not make (it would also risk leaking diagnostic text into user-facing Claude transcript output, which the 2>/dev/null pattern looks deliberately placed to prevent). Mapping confidence: 8 of 9 corrections are grounded in an exact subagent_type= string match at the site's own Task() call; the 9th (gsd-advisor → gsd-advisor-researcher, discuss-phase.md:137) is grounded differently — the Task() there runs subagent_type=\"general-purpose\" and self-loads its role via a literal \"read @~/.claude/agents/gsd-advisor-researcher.md\" instruction in the prompt text (discuss-phase.md:495) — so a reviewer grepping only for subagent_type=\"gsd-advisor-researcher\" will not find it; this is intentional and documented, not an oversight. Stacking: get-shit-done/workflows/{plan-phase,discuss-phase,new-project,new-milestone,quick,verify-work,research-phase,ui-review}.md and get-shit-done/bin/lib/init.cjs are near-certainly shared targets of other Phase-4 blueprints from this same audit (lenses.json's auto-flag-chain and config-workflow-suppression precedents cite these same files at plan-phase.md:365-369/728-778, discuss-phase.md:296/426/637/974-979, execute-phase.md:83-87/782-802, etc.) — those line ranges sit well below this blueprint's edits (all anchored at lines 21-150, each file's early \"Initialize\" step), so direct hunk overlap is unlikely, but line-number drift from whichever blueprint's diff lands first is possible; re-run `git apply --check` per file in final merge order at ship time rather than assuming all Phase-4 diffs are independently applicable in parallel. init.cjs specifically is a 2100+-line shared file — any other blueprint that also edits buildAgentSkillsBlock/cmdAgentSkills or inserts a module-level const near line 1965 will collide and need manual reconciliation. Design-assumption risk: the 3 gsd-checker→gsd-verifier corrections assume the historical plan-checker/verifier consolidation (agents/_archived/gsd-plan-checker.md is archived; live gsd-verifier.md now covers both \"reviews plan quality before execution\" and \"verifies phase completion\") is final — if a separate ecosystem/agent-audit blueprint reinstates a standalone checker agent, those 3 corrections would need to be redone. KNOWN_AGENT_TYPES is a new hardcoded source of truth (confirmed via repo search: no existing manifest/array of agent ids exists anywhere in get-shit-done/bin/ to reuse); it fails safe (a newly-added 18th agent not yet in this Set only causes a spurious warning for a real id, never a false negative that hides a real typo) but is not self-maintaining and will drift if agents/*.md changes without a matching edit here.

---

### engine-robustness-daily-uat-crash-pair — Engine robustness pair: daily.md broken env relay + uat run-automated ENOENT crash

**Score 80** (involvement-saved 4 × frequency 4 × safety 5) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Ledger row 1 — surface: uat/gsd-tools (cli corpus), get-shit-done/bin/gsd-tools.cjs:767. Source: .planning/GSD-AUTONOMY-AUDIT.md, Phase 1 "Live-caught engine defects", item 1: "`uat run-automated --phase 0` crashes with an unhandled `ENOENT: scandir .planning/phases` raw stack at `get-shit-done/bin/gsd-tools.cjs:767` when the phases dir doesn't exist — no graceful error path. VERIFIED (live crash + source)." Reconfirmed independently this run: `node get-shit-done/bin/gsd-tools.cjs uat run-automated --phase 999` against this repo (no `.planning/phases/` present) throws an uncaught `Error: ENOENT: no such file or directory, scandir '/home/user/Pete-Gets-Shit-Done/.planning/phases'` at `Object.readdirSync (node:fs:1590:26) -> runCommand (gsd-tools.cjs:767:28) -> main (:340:9) -> bare main() call (:1023)` — no try/catch anywhere in that chain, full Node stack dumped to the terminal, uncontrolled exit. This also kills Phase-1 telemetry table row "verify-work (automated UAT) | 0 | --phase N | 0 | CRASHED — see defects. The automation-residue pattern itself could not be measured on this repo state" (GSD-AUTONOMY-AUDIT.md:43), and it starves two ledger rows whose own defensibility argument assumes run-automated succeeds: get-shit-done/bin/gsd-tools.cjs:758 (fix_pattern "automated-UAT residue... run 'uat run-automated' (:761) first so render-checkpoint only ever presents the manual residue, deduped against machine-passed checks") and get-shit-done/bin/lib/uat.cjs:176 (the GATE-KEEP manual-pass prompt that residue pattern exists to shrink). No error_exit-mechanism row exists for uat/gsd-tools anywhere in the 349-row classified ledger (inventory-classified.json, queried directly — zero matches): this site isn't a decision-shaped exit today, it's an unclassifiable uncaught exception. This diff turns it into one.

Ledger row 2 — surface: daily (workflow corpus), get-shit-done/workflows/daily.md:17-64 (the broken relay itself lives at :38-42 and :50-54). Source: .planning/GSD-AUTONOMY-AUDIT.md, Phase 1, item 2: "get-shit-done/workflows/daily.md:30-45 passes DAILY_STATE=\"$DAILY_STATE\" positionally after node -e (argv, not env) and never exports it — executed as separate Bash steps, step 2 dies on JSON.parse(undefined). Reproduced live; lib works when the variable is properly exported. VERIFIED." Also Phase-1 command table: "daily | 0 | none | 0 | Dashboard works via lib; the workflow md's own 3-step env relay is broken as written (see defects)" (:40). Reproduced live this run two ways: (a) exactly as the ledger describes — a Bash call running the gather_state block captured a real DAILY_STATE checkpoint JSON blob; a separate Bash call running the determine_next block verbatim, per this environment's own documented contract ("shell state does not persist between commands"), saw DAILY_STATE='' and crashed with SyntaxError: "undefined" is not valid JSON; (b) a deeper check proves the bug is not merely cross-step: `VAR="$VAR"` placed after `node -e "..."` is positional argv in bash regardless of shell continuity — `FOO="bar"; node -e "console.log(process.env.FOO)" FOO="$FOO"` prints `undefined` even run as one unsplit command in one shell; only the `VAR="$VAR" node -e ...` prefix form sets env. So an export-prefix-only fix would still break the moment these steps are ever re-split across tool calls — only removing the relay is structurally sound.

**Design.** Both fixes extend precedents already shipped in the same modules rather than inventing new ones. daily.md's three-step gather/determine/format relay — broken both because `VAR="$VAR"` after `node -e` is positional argv (not env) in bash, and because separate Bash steps don't share shell state anyway — collapses into one self-contained `node -e` call that requires daily.cjs once and does everything in the same JS scope, mirroring checkpoint.md's Option A single-invocation precedent (get-shit-done/workflows/checkpoint.md:39-45); the standalone determine_next step is dropped outright, not just merged, because formatDashboard already calls determineNextAction internally (daily.cjs:228), so no information is lost. gsd-tools.cjs's `uat run-automated` gets a one-line `fs.existsSync(phasesDir)` guard before the crashing `readdirSync`, calling the same `error()` helper (core.cjs:349-352, already imported at module scope) with the identical message its sibling subcommand in the same file already uses for the same directory — `cmdAuditUat` at get-shit-done/bin/lib/uat.cjs:16-18, part of the automated-UAT residue module — so the two uat-surface commands now fail the same documented way instead of one being silent-safe and the other dumping a raw Node stack.

**Execution-ready package.**

_`get-shit-done/workflows/daily.md`_

```diff
--- a/get-shit-done/workflows/daily.md
+++ b/get-shit-done/workflows/daily.md
@@ -14,54 +14,32 @@
 
 <process>
 
-<step name="gather_state">
-Call gatherDailyState to collect all dashboard data from CHECKPOINT.json or STATE.md fallback.
-
-```bash
-DAILY_STATE=$(node -e "
-  const { gatherDailyState } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
-  const state = gatherDailyState('.planning');
-  console.log(JSON.stringify(state));
-")
-```
-
-Parse the JSON result. The `_source` field tells you where data came from:
-- `checkpoint` — fresh checkpoint data
-- `state` — STATE.md fallback (no checkpoint present)
-- `none` — no project state found
-</step>
-
-<step name="determine_next">
-Call determineNextAction to get the exact next command.
-
-```bash
-NEXT_CMD=$(node -e "
-  const { determineNextAction } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
-  const state = JSON.parse(process.env.DAILY_STATE);
-  console.log(determineNextAction(state));
-" DAILY_STATE="$DAILY_STATE")
-```
-</step>
-
-<step name="format_and_print">
-Call formatDashboard to get the formatted output string.
-
-```bash
-DASHBOARD=$(node -e "
-  const { formatDashboard } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
-  const state = JSON.parse(process.env.DAILY_STATE);
-  console.log(formatDashboard(state));
-" DAILY_STATE="$DAILY_STATE")
-```
-
-Print the dashboard output to the user verbatim. Do not add extra commentary — the dashboard is self-contained.
-
-After the dashboard, add a single line:
-
-```
-<sub>Data source: {_source} | Run `/gsd:checkpoint` to refresh</sub>
-```
-</step>
+<step name="gather_and_render">
+Gather and render in one self-contained node invocation. Shell variables set in one Bash step
+do not survive into the next tool call, and formatDashboard already computes the next action
+internally, so a separate determine-next step is unnecessary.
+
+```bash
+node -e "
+  const { gatherDailyState, formatDashboard } = require('$HOME/.claude/get-shit-done/bin/lib/daily.cjs');
+  const state = gatherDailyState('.planning');
+  console.log(JSON.stringify({ _source: state._source, dashboard: formatDashboard(state) }));
+"
+```
+
+Parse the single-line JSON result into `_source` and `dashboard`. The `_source` field tells you where data came from:
+- `checkpoint` — fresh checkpoint data
+- `state` — STATE.md fallback (no checkpoint present)
+- `none` — no project state found
+
+Print `dashboard` to the user verbatim. Do not add extra commentary — the dashboard is self-contained.
+
+After the dashboard, add a single line:
+
+```
+<sub>Data source: {_source} | Run `/gsd:checkpoint` to refresh</sub>
+```
+</step>
 
 </process>
 
```

_`get-shit-done/bin/gsd-tools.cjs`_

```diff
--- a/get-shit-done/bin/gsd-tools.cjs
+++ b/get-shit-done/bin/gsd-tools.cjs
@@ -764,6 +764,7 @@
         const phaseArg = options.phase;
         if (!phaseArg) { error('--phase required for uat run-automated'); }
         const phasesDir = path.join(core.planningDir(cwd), 'phases');
+        if (!fs.existsSync(phasesDir)) { error('No phases directory found in planning directory'); }
         const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
         const phaseDir = entries
           .filter(e => e.isDirectory())
```

**Test plan.**
1. Validate both diffs apply cleanly first: from repo root on autonomy/frontier-audit, `git apply --check --verbose` against these two hunks — expect `Checking patch get-shit-done/workflows/daily.md...` and `Checking patch get-shit-done/bin/gsd-tools.cjs...` with exit 0 (already run during authoring against current HEAD; both passed, individually and combined).
2. Repro defect 1 pre-fix with the exact command from this run: `node get-shit-done/bin/gsd-tools.cjs uat run-automated --phase 999` in a project without `.planning/phases/` — expect an uncaught `Error: ENOENT: no such file or directory, scandir '.../.planning/phases'` with a multi-line Node stack citing `gsd-tools.cjs:767:28`. Re-run after applying the diff — expect exactly one stderr line `Error: No phases directory found in planning directory` and exit code 1, zero stack trace.
3. Repro defect 2 pre-fix with the exact commands from this run, issued as two SEPARATE Bash calls to match how the workflow executes: call 1 runs the old gather_state block and captures DAILY_STATE; call 2 (fresh shell) runs the old determine_next block verbatim, `DAILY_STATE="$DAILY_STATE"` trailing the node -e string — expect `SyntaxError: "undefined" is not valid JSON`. After applying the diff, run the new single merged block standalone with no predecessor call — expect one stdout line of valid JSON containing `_source` and a `dashboard` string equal to `formatDashboard(gatherDailyState('.planning'))`.
4. Extend tests/gsd-tools.test.cjs: add `describe('uat run-automated command')` using its existing `runGsdTools`/`cleanup` helpers from ./helpers.cjs plus `createTempDir` (not `createTempProject` — that helper pre-creates `.planning/phases`, which is exactly why no existing test caught this bug). Create a temp dir, `fs.mkdirSync(path.join(tmpDir, '.planning'))` only (no phases subdir), then assert `runGsdTools(['uat','run-automated','--phase','1'], tmpDir)` returns `success:false` and `error === 'Error: No phases directory found in planning directory'` with no `node:fs` or `readdirSync` substring present.
5. Regression-guard in the same new describe block: with `.planning/phases/` present but empty, `runGsdTools(['uat','run-automated','--phase','1'], tmpDir)` must still return the pre-existing, unchanged `Error: Phase not found: 1` — proves the new guard fires only on the missing-directory case and the sibling check at gsd-tools.cjs:772 is untouched.
6. tests/daily.test.cjs already covers gatherDailyState/determineNextAction/formatDashboard in isolation (DAILY-01..06) and needs no new assertions, since this diff only changes how the workflow prose wires those already-tested functions together, not their behavior. Confirm it still passes: `node --test tests/daily.test.cjs`.
7. Full regression gate per CLAUDE.md: `npm test` (573 suites) and `npm run test:coverage`, then `node scripts/check-doc-drift.cjs` — this pair changes no documented numeric claim (coverage %, suite count, command count), so drift attributable to this diff must be zero.
8. Manual assertion: run `/gsd:daily` in a live session on a project with CHECKPOINT.json present — the dashboard must render from the single merged step with no visible error, followed by the `<sub>Data source: checkpoint | Run /gsd:checkpoint to refresh</sub>` footer line.

**Rollback.** One step: `git revert <sha-of-the-commit-that-applied-this-diff>` — both hunks are stateless prose/guard-clause edits with no schema, config, or data migration, so a straight revert fully restores prior behavior (including both bugs) with no follow-up cleanup.

**Risk notes.** Compliance with the "diffs may only add gating, never weaken" rule: both diffs are purely additive. The gsd-tools.cjs hunk literally adds a new gate (existsSync guard + error() exit) where none existed; the daily.md hunk adds no gate and removes none — daily.md was and remains a documented zero-gate, read-only command, so the "never weaken" invariant holds trivially. Diff 1 also shrinks daily.md's shell-quoting surface (three `node -e "..." VAR="$VAR"` call sites down to zero), a minor incidental hardening, not a functional change in scope.

Cross-blueprint stacking: get-shit-done/bin/gsd-tools.cjs is a shared hot file — the classified ledger has three other DEFAULT+LOG rows inside it (:407 signal-waiting, :758 render-checkpoint, :954 profile-questionnaire) that other Phase-4 blueprint authors may independently target. My hunk is tightly anchored (3 lines of context, 1 line inserted, inside the `run-automated` else-if branch only) and far from all three of those line numbers, so collision probability is low, but if another blueprint also touches the `uat`/`audit-uat` case block (:749-793) the hunks should be re-verified with `git apply --check` after whichever patch lands first, in application order, before Phase 6 ships both. daily.md does not appear anywhere in the 349-row interaction ledger (confirmed by direct query — it's a zero-gate file), so collision risk there is effectively nil.

Significant adjacent finding, deliberately left out of scope: get-shit-done/workflows/daily-startup.md:47-60 (its `dashboard` step) inlines a hand-copy of the same broken pattern — `NEXT_CMD=$(node -e "..." DAILY_STATE="$DAILY_STATE")` and `DASHBOARD=$(node -e "..." DAILY_STATE="$DAILY_STATE")` — inside one fenced block this time, not split across steps. Live-tested this run: the positional-argv defect crashes it even within a single unsplit shell (see problem field, test (b)), so being in one code fence does not save it. daily-startup is the flagship "session start, before any other GSD command" zero-gate entry point (routed from `/gsd:do "start my day"`), likely hit even more often than `/gsd:daily` directly — this is a real, currently-unfixed, high-frequency duplicate of ledger row 2, outside this blueprint's assigned two-file scope (daily.md + gsd-tools.cjs only). Recommend a follow-up blueprint. Its fix shape differs slightly from this one: daily-startup's `NEXT_CMD` is genuinely consumed downstream at its `route` step (unlike daily.md's dead computation), so its merge must retain a `next_action`/`context_note`-aware field in the emitted JSON rather than dropping the next-action computation outright.

Practical severity today is partially self-mitigated by documented error_handling prose in both daily.md and daily-startup.md, which instructs a human/agent to catch the JSON-parse failure and fall back to a degraded report — but that is a reactive, executor-competence-dependent workaround, not a structural fix, and is exactly the class of friction this audit is chartered to remove.

No security-sensitive surface touched by either diff: no new untrusted input, no new shell interpolation, no touched hook/auth/config-protection path.

---

### BP-smart-discuss-auto-parity — smart-discuss --auto parity: fold per-area grey-area acceptance to DEFAULT+LOG receipts in the two self-branded autonomous flows

**Score 64** (involvement-saved 4 × frequency 4 × safety 4) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Both self-branded autonomous flows call get-shit-done/workflows/smart-discuss.md, which has no auto path, so discussion halts the operator 3-4+ times per non-infrastructure phase even in flows that advertise unattended operation. Ledger rows killed (surface=smart-discuss): (1) get-shit-done/workflows/smart-discuss.md:169 — ask_user_question, final_class DEFAULT+LOG, evidence "prompt the user via AskUserQuestion: 'Accept these answers for {Area Name}?'" — fires once per grey area (3-4 areas x ~4 questions per phase); ledger failure-mode note: "this gate is already the collapsed batch form, so a receipt suffices under a --auto fold". (2) smart-discuss.md:176 — DEFAULT+LOG, "On \"Change QN\": Use AskUserQuestion with the alternatives for that specific question" — sub-branch of the acceptance prompt; never fires once the prompt folds. (3) smart-discuss.md:183 — DEFAULT+LOG, "ask questions one at a time using AskUserQuestion with 2-3 concrete options per question" — same: opt-in branch of the folded prompt. (4) smart-discuss.md:184 — final_class AUTOMATE, "question: \"More questions about {area name}, or move to next?\"" — pacing ask inside the folded branch. (5) smart-discuss.md:281 — DEFAULT+LOG ungated_side_effect, "commit \"docs(${PADDED_PHASE}): smart discuss context\"" — partially addressed here: the new [auto] receipt line makes the zero-interaction commit path auditable per its fix_pattern "commit_docs receipt + [auto] log". Caller evidence: autonomous.md:334 and idea-to-shipped.md:63-64 invoke smart-discuss with only ${PHASE_NUM}, while the interactive sibling already has the flag (commands/gsd/discuss-phase.md:3-4 "Use --auto to skip interactive questions"; workflow discuss-phase.md:637 auto-selects recommended options with an [auto] log). idea-to-shipped.md:1-14 promises "unattended between exactly two human gates", which its discuss step currently breaks.

**Design.** Extends the automated-UAT residue precedent (uat-runner.cjs/uat-patterns.cjs three-bucket routing consumed at verify-work.md:152-196: machine-resolve first, ask ONLY the manual residue) applied to discussion, using the --auto flag family mechanics (discuss-phase.md:637 "[auto]" log format, new-workspace-style flag pass-through) and config default+log derivation (workflow._auto_chain_active and mode, both already whitelisted in lib/config.cjs:14-30). smart-discuss.md gains AUTO_MODE = --auto passed OR workflow._auto_chain_active=true OR mode=yolo: each grey area whose every question has a groundable recommended answer is accepted without AskUserQuestion, logged "[auto] Area {M}/{N} ...", and summarized in a receipt table (area | default taken | why); an area is unresolvable — the residue that still asks via the unchanged interactive path — only when a question has no recommendation groundable in a prior decision, codebase pattern, convention, or ROADMAP criterion, or the grounded answer would contradict a recorded prior decision. Sub-step 5 adds an [auto] receipt line under the commit confirmation (row 281's yolo receipt shape). Callers: autonomous.md's thin smart_discuss step appends --auto only when mode=yolo or an active --auto chain already sanctions auto-approval (interactive CTRL-01 pauses unchanged); idea-to-shipped.md passes --auto unconditionally because its purpose block contracts exactly two gates, and folded decisions still reach human review at GATE 1 through the plan built from them. Interactive default behavior is byte-identical when AUTO_MODE is false.

**Execution-ready package.**

_`get-shit-done/workflows/smart-discuss.md`_

```diff
diff --git a/get-shit-done/workflows/smart-discuss.md b/get-shit-done/workflows/smart-discuss.md
--- a/get-shit-done/workflows/smart-discuss.md
+++ b/get-shit-done/workflows/smart-discuss.md
@@ -1,6 +1,6 @@
 <purpose>
 
-Autonomous-optimized variant of the `gsd:discuss-phase` skill. Proposes grey area answers in batch tables — the user accepts or overrides per area — instead of sequential questioning. Produces **identical CONTEXT.md output** to regular discuss-phase: same template, same sections, same commit shape.
+Autonomous-optimized variant of the `gsd:discuss-phase` skill. Proposes grey area answers in batch tables — the user accepts or overrides per area — instead of sequential questioning. In auto mode (`--auto` flag, active `--auto` chain, or yolo mode) the per-area acceptance folds to recommended defaults with an `[auto]` receipt table, and only unresolvable areas are asked. Produces **identical CONTEXT.md output** to regular discuss-phase: same template, same sections, same commit shape.
 
 > **Note (CTRL-03):** Smart discuss is an autonomous-optimized variant of the `gsd:discuss-phase` skill. It produces identical CONTEXT.md output but uses batch table proposals instead of sequential questioning. The original `discuss-phase` skill remains unchanged. This workflow is the extraction anticipated by `get-shit-done/workflows/autonomous.md`'s original `smart_discuss` step note ("Future milestones may extract this to a separate skill file") — `autonomous.md` now invokes this file as a thin caller, and `get-shit-done/workflows/idea-to-shipped.md` invokes it directly as a second caller.
 
@@ -10,6 +10,15 @@
 
 **Required:** `PHASE_NUM` — the phase number to run smart discuss for, supplied by the caller (e.g., `autonomous.md`'s `execute_phase` step, or `idea-to-shipped.md`'s discuss step).
 
+**Optional:** `--auto` — activates auto mode explicitly (same flag family as `discuss-phase --auto`). When the flag is absent, derive auto context from config:
+
+```bash
+AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
+GSD_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get mode 2>/dev/null || echo "interactive")
+```
+
+Set `AUTO_MODE` true when `--auto` was passed, when `AUTO_CHAIN` is `true`, or when `GSD_MODE` is `yolo`; otherwise false. When `AUTO_MODE` is false, every behavior below is unchanged.
+
 Run init to get phase paths:
 
 ```bash
@@ -166,7 +175,19 @@
 | 4 | {question} | {answer} — {rationale} | {alt1} |
 ```
 
-Then prompt the user via **AskUserQuestion**:
+**Auto path (`AUTO_MODE` true):** do not open the acceptance prompt for resolvable areas. An area is **unresolvable** only when at least one of its questions has no recommended answer grounded in a prior decision, codebase pattern, domain convention, or ROADMAP success criterion — or when the grounded answer would contradict a recorded prior decision. For each resolvable area: record all recommended answers, log `[auto] Area {M}/{N} "{Area Name}" — accepted {q_count} recommended answers.`, and move to the next area. After the last area, emit the receipt table:
+
+```
+### [auto] Grey areas resolved by default ({K}/{N})
+
+| Area | Default taken | Why |
+|------|---------------|-----|
+| {Area Name} | {one-line summary of accepted answers} | {grounding: prior decision / codebase pattern / convention / success criterion} |
+```
+
+Unresolvable areas are the residue: run ONLY those through the interactive path below, stating why each could not be defaulted. Zero unresolvable areas means Sub-step 4 completes with zero AskUserQuestion calls.
+
+**Interactive path (`AUTO_MODE` false — and each unresolvable residue area in auto mode):** prompt the user via **AskUserQuestion**:
 - **header:** "Area {M}/{N}"
 - **question:** "Accept these answers for {Area Name}?"
 - **options:** Build dynamically — always "Accept all" first, then "Change Q1" through "Change QN" for each question (up to 4), then "Discuss deeper" last. Cap at 6 explicit options max (AskUserQuestion adds "Other" automatically).
@@ -288,6 +309,12 @@
 Decisions captured: {count} across {area_count} areas
 ```
 
+**If `AUTO_MODE`:** add one receipt line under the confirmation so the zero-interaction path stays auditable:
+
+```
+[auto] {K}/{N} grey areas defaulted (receipt table above) — CONTEXT.md committed; edit it and re-run /gsd:plan-phase to change any decision.
+```
+
 </process>
 
 <success_criteria>
@@ -296,8 +323,9 @@
 - [ ] Codebase scouted lightweight, under ~5% context (Sub-step 2)
 - [ ] Infrastructure-only phases detected first and skip straight to minimal CONTEXT.md (Sub-step 3)
 - [ ] Non-infrastructure phases generate 3-4 grey areas with ~4 questions each, each with a recommended answer and alternatives (Sub-step 3)
-- [ ] Grey areas presented one at a time as batch tables via AskUserQuestion, not sequential single-question interrogation (Sub-step 4)
+- [ ] Grey areas presented one at a time as batch tables via AskUserQuestion on the interactive path, not sequential single-question interrogation (Sub-step 4)
 - [ ] "Accept all", "Change QN", "Discuss deeper", and free-text "Other" are all handled distinctly (Sub-step 4)
+- [ ] Auto mode (`--auto` flag, `workflow._auto_chain_active` true, or `mode: yolo`) folds resolvable areas to recommended defaults, emits the `[auto]` receipt table and final receipt line, and asks only unresolvable areas (Sub-steps 4-5)
 - [ ] Scope creep is deferred and tracked, never silently dropped or silently accepted into phase scope (Sub-step 4)
 - [ ] CONTEXT.md written using the exact template shared with discuss-phase (Sub-step 5)
 - [ ] CONTEXT.md committed via `gsd-tools.cjs commit` with the `docs({padded_phase}): smart discuss context` message shape (Sub-step 5)
```

_`get-shit-done/workflows/autonomous.md`_

```diff
diff --git a/get-shit-done/workflows/autonomous.md b/get-shit-done/workflows/autonomous.md
--- a/get-shit-done/workflows/autonomous.md
+++ b/get-shit-done/workflows/autonomous.md
@@ -331,11 +331,11 @@
 
 ## Smart Discuss
 
-Execute the smart-discuss workflow from @$HOME/.claude/get-shit-done/workflows/smart-discuss.md with `${PHASE_NUM}`. That workflow proposes grey area answers in batch tables — the user accepts or overrides per area — and produces identical CONTEXT.md output to regular discuss-phase.
+Execute the smart-discuss workflow from @$HOME/.claude/get-shit-done/workflows/smart-discuss.md with `${PHASE_NUM}` — append `--auto` when config `mode` is `yolo` or `workflow._auto_chain_active` is `true` (smart-discuss also derives auto context itself from config; passing the flag keeps the chain explicit). That workflow proposes grey area answers in batch tables — the user accepts or overrides per area; in auto mode it accepts recommended defaults with an `[auto]` receipt table and asks only unresolvable areas — and produces identical CONTEXT.md output to regular discuss-phase.
 
 > **Note (CTRL-03):** Smart discuss is an autonomous-optimized variant of the `gsd:discuss-phase` skill. It produces identical CONTEXT.md output but uses batch table proposals instead of sequential questioning. The original `discuss-phase` skill remains unchanged. The full sub-step implementation (load prior context, scout codebase, analyze phase and generate proposals, present proposals per area, write CONTEXT.md) has been extracted to `get-shit-done/workflows/smart-discuss.md` — this step is now a thin caller. `get-shit-done/workflows/idea-to-shipped.md` invokes the same extracted workflow directly as a second caller.
 
-**Inputs:** `PHASE_NUM` from execute_phase — pass it through as the sole argument to smart-discuss.md. That workflow re-derives `phase_dir`, `phase_slug`, `padded_phase`, and `phase_name` itself via its own `init phase-op ${PHASE_NUM}` call, so no additional handoff is required here.
+**Inputs:** `PHASE_NUM` from execute_phase — pass it through as the sole argument to smart-discuss.md (plus `--auto` per the rule above). That workflow re-derives `phase_dir`, `phase_slug`, `padded_phase`, and `phase_name` itself via its own `init phase-op ${PHASE_NUM}` call, so no additional handoff is required here. Interactive runs are unchanged: grey-area acceptance still pauses per CTRL-01; the auto fold applies only when yolo mode or an active `--auto` chain already sanctions auto-approval.
 
 </step>
 
```

_`get-shit-done/workflows/idea-to-shipped.md`_

```diff
diff --git a/get-shit-done/workflows/idea-to-shipped.md b/get-shit-done/workflows/idea-to-shipped.md
--- a/get-shit-done/workflows/idea-to-shipped.md
+++ b/get-shit-done/workflows/idea-to-shipped.md
@@ -61,10 +61,12 @@
 ## 2. Discuss
 
 Execute the smart-discuss workflow from
-`@$HOME/.claude/get-shit-done/workflows/smart-discuss.md` with `${PHASE_NUM}` — the same
-extracted workflow `autonomous.md`'s `smart_discuss` step now calls. Produces
-`${phase_dir}/${padded_phase}-CONTEXT.md`, batch grey-area proposal tables instead of sequential
-questioning, identical output shape to `discuss-phase`.
+`@$HOME/.claude/get-shit-done/workflows/smart-discuss.md` with `${PHASE_NUM} --auto` — the same
+extracted workflow `autonomous.md`'s `smart_discuss` step now calls. Under `--auto` it folds each
+grey area to its recommended defaults, emits an `[auto]` receipt table (area | default taken |
+why), and asks only areas it cannot responsibly default; the folded decisions still reach human
+review at GATE 1 through the plan built from them, so the two-gate contract holds. Produces
+`${phase_dir}/${padded_phase}-CONTEXT.md`, identical output shape to `discuss-phase`.
 
 After it completes, verify context was written:
 
@@ -347,7 +349,8 @@
 - [ ] Intake parses the freeform idea, resolves or creates `PHASE_NUM`, and detects `PLAN_ONLY`
       intent before any other step runs
 - [ ] Discuss step invokes the extracted `get-shit-done/workflows/smart-discuss.md` workflow with
-      `PHASE_NUM` — not an inlined copy of its sub-steps
+      `PHASE_NUM --auto` — not an inlined copy of its sub-steps — so only unresolvable grey areas
+      pause the chain before GATE 1
 - [ ] Plan step invokes `gsd:plan-phase` and its internal revision loop, no separate plan-quality
       gate added on top
 - [ ] GATE 1 carries the exact verbatim prompt text: "Plan verified (N tasks, M waves, files:
```

**Test plan.**
1. From repo root: save each diff to a file and run `git apply --check <file>` for all three — expected: exit 0, no output (pre-validated verbatim against HEAD of autonomy/frontier-audit).
2. Apply the diffs, then run `node --test tests/idea-to-shipped.test.cjs` — expected: all tests pass. This is the suite these files extend; its existing assertions ('Accept all', 'Grey Area {M}/{N}', CTRL-03, smart_discuss step markers, GATE 1/2 verbatim prompts, step order) are deliberately preserved by the diffs. Optional extension in that same file, describe 'smart-discuss extraction contract': assert.match(sd, /AUTO_MODE/), assert.match(sd, /\[auto\] Grey areas resolved by default/), and assert.ok(wf.includes('${PHASE_NUM} --auto')) for the idea-to-shipped caller.
3. Run `node --test tests/prompt-injection-scan.test.cjs` — expected: pass. All added lines were pre-scanned against every regex in lib/injection-patterns.json with 0 hits.
4. Run `npm test` — expected: full suite green (573 suites); no .cjs source is touched by this blueprint.
5. Run `node scripts/validate-doc-links.cjs` — expected: exit 0 (no links added or removed).
6. Config-honoring sanity: `node get-shit-done/bin/gsd-tools.cjs config-get mode` and `node get-shit-done/bin/gsd-tools.cjs config-get workflow._auto_chain_active` — expected: both resolve without an unknown-key error (both keys whitelisted in get-shit-done/bin/lib/config.cjs:14-30), matching the fallback-guarded reads the diff adds.
7. Manual assertion of the fold semantics: `grep -n 'AUTO_MODE' get-shit-done/workflows/smart-discuss.md` — expected: hits in input_contract (derivation), Sub-step 4 (auto path + unresolvable definition + receipt table), Sub-step 5 (receipt line), and success_criteria; `grep -n 'Then prompt the user' get-shit-done/workflows/smart-discuss.md` — expected: zero hits (replaced by the scoped Interactive path line, which still ends 'prompt the user via **AskUserQuestion**:').

**Rollback.** git checkout HEAD -- get-shit-done/workflows/smart-discuss.md get-shit-done/workflows/autonomous.md get-shit-done/workflows/idea-to-shipped.md (docs-only change; no state, config schema, or code migration to unwind).

**Risk notes.** Honest risks: (1) idea-to-shipped passes --auto unconditionally — an operator who wanted per-area review inside that flow loses it; mitigations are the ledger's own reversibility finding (CONTEXT.md is an editable file, replanning is cheap), the [auto] receipt table, the residue asks, and GATE 1 human review of the plan built from the folded decisions. The workflow's purpose block already promises exactly two gates, so this aligns behavior with the stated contract rather than weakening it. (2) 'Unresolvable' is model judgment: an over-confident run folds everything (receipts are the audit trail and the ledger classifies wrong picks as reversible); an under-confident run asks more, which fails safe. (3) autonomous.md folding under mode=yolo changes behavior for existing yolo users — intended, since yolo is the user's recorded 'Auto-approve, just execute' choice, and the receipt keeps every auto-acceptance visible in the transcript; interactive runs are byte-identical. autonomous.md:3's CTRL-01 sentence ('Pauses only for explicit user decisions...') remains true as an upper bound on pauses; I deliberately did not edit it to avoid stacking conflicts. (4) Row 281 is only partially addressed (receipt line in auto mode); the interactive-path commit confirmation is unchanged. Row 184's interactive pacing (classified AUTOMATE) is mooted in auto mode but not changed interactively — out of scope for flag parity. (5) Cross-blueprint stacking: this blueprint touches autonomous.md (hunk anchored at :331-341, the smart_discuss step) and smart-discuss.md — both likely shared targets. Any sibling blueprint implementing row 281's commit receipt, row 184's interactive auto-advance, or edits near autonomous.md's smart_discuss/iterate steps must be applied and re-checked in sequence (git apply --check after each), since overlapping -U3 context will conflict; hunks here are small and anchored to reduce that surface. Diffs are additive gating/logging/config-honoring only: no hook, safety rail, or protected config is weakened, and both config keys read are pre-existing whitelist entries.

---

### c-do-router-w3-w4 — Wire W3 bug-to-branch and W4 quick-change into the /gsd:do router (scoped; W5 stays shelved)

**Score 48** (involvement-saved 4 × frequency 3 × safety 4) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD (2 new-file workflows + do.md router rows)

**Problem.** Routing gap on the do surface: bug-fix and small-change intents dispatch to primitives that strand the operator mid-chain, while the designed W3/W4 wrapper flows exist only on paper. Evidence: (1) do @ get-shit-done/workflows/do.md:42 routes every bug text to /gsd:debug, which dead-ends at debug @ commands/gsd/debug.md:112 (ledger: freeform_wait, final_class AUTOMATE, evidence "Offer options: 'Fix now' / 'Plan fix' / 'Manual fix'", fix_pattern deviation-rules auto-fix + disclosure) — after answering, the operator manually drives fix, full suite, and ship (3-4 invocations + 3 decisions). (2) do @ get-shit-done/workflows/do.md:58 routes small tasks to /gsd:quick, whose default path runs zero automated verification (plan check at quick.md step 5.5 and verifier at step 6.5 run only under --full) and never pushes: quick @ get-shit-done/workflows/quick.md:555 (ungated_side_effect, AUTOMATE, fix_pattern "two-gate doctrine: reversible branch commits; push/PR stays the gate") and quick @ get-shit-done/workflows/quick.md:623 (numbered_menu_wait, DEFAULT+LOG, gaps_found menu, fix_pattern 1-retry gap-closure cap). (3) The designs are complete and scored but unbuilt: .planning/GSD-AUTONOMOUS-WORKFLOWS.md:102-118 (W3 chain, gates, prompt text), :120-134 (W4), :233 ("Remaining flows (bug-to-branch, quick-change, ship-milestone) follow the same wrapper pattern once the top 3 prove the shape"), :254-255 (ranked scores 48 each) — no workflow files, no router rows. do @ get-shit-done/workflows/do.md:62 (DEFAULT+LOG, router classification) documents the ambiguity residue the new specificity-first rows rely on.

**Design.** Extends the router classification precedent (do.md's 16-row first-match table + banner-substitutes-for-confirmation, the same Option-A row-append that wired W1/W2/W6 at do.md:45/:51/:54) by adding two specificity-first rows, each dispatching to a new thin wrapper workflow in the established W-series shape (idea-to-shipped.md / wrap-and-sync.md / daily-startup.md): bug-to-branch reuses the debug flow (commands/gsd/debug.md) by reference — its existing ROOT CAUSE FOUND ask becomes GATE 1 verbatim — then routes the fix through quick --full or plan-phase --gaps + execute-phase --no-transition, runs the full suite (lesson 2026-03-25 [Testing]), and gates once more before ship --draft + ci-watch; quick-change enforces the 3-file scope rule (lesson 2026-03-25 [Scope], escalating to idea-to-shipped), makes quick's --full verification structurally unforgettable, answers quick's gaps_found menu with exactly one logged '[auto]' fix iteration (--auto flag-family shape: recommended option + audit line, never "Accept as-is"), and gates once at push + draft PR; both wrappers use the checkpoint pattern to derive PHASE_NUM/branch state from STATE.md and git instead of asking, keep everything branch-local until their final gate per the two-gate doctrine, and add only gates and logging — no existing hook, gate, or prompt inside debug/quick/ship is weakened.

**Execution-ready package.**

_`get-shit-done/workflows/bug-to-branch.md`_

```diff
--- /dev/null
+++ b/get-shit-done/workflows/bug-to-branch.md
@@ -0,0 +1,120 @@
+<purpose>
+Turn a pasted error into a shipped fix: debug → fix → full suite → ship. This is W3
+(`.planning/GSD-AUTONOMOUS-WORKFLOWS.md:102-118`), autonomy level L2 — investigation and fix run
+unattended; only the two path-changing decisions (fix path at root cause, push/PR) stay human.
+*"Automate the reversible; gate the irreversible"*: everything before GATE 2 is branch-local —
+no push, no PR, nothing leaves the machine until "Ship it".
+</purpose>
+
+<process>
+
+<step name="intake_and_branch_guard">
+Parse `$ARGUMENTS` as the bug report. The paste IS the intake — zero context switching
+(CLAUDE.md's autonomous-bug-fixing contract).
+
+```bash
+CURRENT_BRANCH=$(git branch --show-current)
+FIX_BASE_SHA=$(git rev-parse HEAD)
+```
+
+If on `main`/`master`: create and switch to `fix/{slug}` first and re-record both variables so
+every debug-state and fix commit lands on a working branch; otherwise stay — rapid fix
+iteration on the active branch is the evidenced pattern. `FIX_BASE_SHA` is the auto-revert point.
+</step>
+
+<step name="debug">
+Run the debug flow from `commands/gsd/debug.md` with the bug report as the issue description —
+same orchestrator steps by reference: init, active-session check, symptom gathering, spawn
+`gsd-debugger` (persistent state in `.planning/debug/{slug}.md`, survives context resets).
+
+Symptom intake from the paste: pre-fill each of the five symptom answers (expected / actual /
+errors / reproduction / timeline) the pasted text already states — the debugger prompt carries
+`symptoms_prefilled: true` — and ask only the underivable residue.
+
+**If the debugger returns `## INVESTIGATION INCONCLUSIVE`:** stop-and-report — show what was
+checked and eliminated plus the resumable state file path; never fix without a confirmed root cause.
+</step>
+
+<step name="gate_1_fix_path">
+## GATE 1 — Root cause found → choose fix path
+
+`commands/gsd/debug.md:110-116`'s existing ROOT CAUSE FOUND gate, kept — the answer changes the downstream path.
+
+**Prompt text (verbatim):** "Root cause: {cause} (evidence: {file:line}). Fix approach:
+{approach}, touches {N} files. [Fix now / Plan the fix / I'll take it manual]"
+
+- **"Fix now"** (small, self-contained) → `fix_quick`
+- **"Plan the fix"** (structural) → `fix_planned`
+- **"I'll take it manual"** → end here; the debug state file stays on disk, resumable.
+</step>
+
+<step name="fix_quick">
+```
+Skill(skill="gsd:quick", args="--full {root-cause fix description from the debug file}")
+```
+
+`--full` is non-negotiable: quick's default path runs zero automated verification — plan check
+(`quick.md` step 5.5) and verifier (step 6.5) run only under `--full`. Then → `full_suite`.
+</step>
+
+<step name="fix_planned">
+Derive `PHASE_NUM` from `.planning/STATE.md`'s current phase — derive, never ask
+(checkpoint/resume precedent). Then, per debug.md's own "Plan fix" suggestion:
+
+```
+Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --gaps")
+Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
+```
+
+`Skill()`-not-`Task()` and `--no-transition` per `idea-to-shipped.md`'s execute-step rationale. Then → `full_suite`.
+</step>
+
+<step name="full_suite">
+Lesson 2026-03-25 [Testing]: "Run the full test suite, not just tests for the changed module."
+
+```bash
+npm test
+```
+
+**If the suite fails:** W3's failure contract — auto-revert with `git reset --hard
+${FIX_BASE_SHA}` on the working branch (the branch guard guarantees this never runs on `main`),
+keep the debug state file, report what was reverted, stop. **If it passes:** → `gate_2_approve_ship`.
+</step>
+
+<step name="gate_2_approve_ship">
+## GATE 2 — Approve Ship
+
+Same shape and prompt as `idea-to-shipped.md`'s `gate_2_approve_ship`: present verification result, diff stat vs `${FIX_BASE_SHA}`, suite result, and target branch, then ask.
+
+**Prompt text (verbatim):** "Verification passed (X/Y must-haves; review: PASS). Push branch
+and open draft PR? [Ship it / Fix issues first / Stop — keep local]"
+
+- **"Ship it"** → `ship_and_watch`
+- **"Fix issues first"** → loop to the chosen fix step, then `full_suite`; re-present this gate
+- **"Stop — keep local"** → end; fix commits stay on the local branch, nothing is pushed.
+</step>
+
+<step name="ship_and_watch">
+Planned path: `Skill(skill="gsd:ship", args="${PHASE_NUM} --draft")`. Quick path:
+`Skill(skill="gsd:ship", args="--draft")` — `ship`'s own preflight asks (no phase
+VERIFICATION.md, etc.) are `ship.md`'s, not new gates owned here. Then:
+
+```
+Skill(skill="gsd:ci-watch")
+```
+
+`--draft`: nothing is marked ready-for-review. On CI red, follow `idea-to-shipped.md`'s `ci_watch`
+contract — one automated fix retry within GATE-2-approved scope, then stop-and-report via
+`gsd:pause-work`. Merge stays human, on GitHub, forever.
+</step>
+
+</process>
+
+<success_criteria>
+- [ ] Branch guard before any commit; `FIX_BASE_SHA` recorded; `main` never receives a commit
+- [ ] Debug flow reused by reference; symptoms pre-filled from the paste, only residue asked
+- [ ] GATE 1 is debug.md's existing root-cause gate carrying W3's verbatim prompt text
+- [ ] Fix path is `quick --full` or `plan-phase --gaps` + `execute-phase --no-transition`; full `npm test` after either
+- [ ] No push, no PR before GATE 2 resolves "Ship it"; PR is draft; merge stays human
+- [ ] `INVESTIGATION INCONCLUSIVE` stops-and-reports with the resumable debug state file
+</success_criteria>
```

_`get-shit-done/workflows/quick-change.md`_

```diff
--- /dev/null
+++ b/get-shit-done/workflows/quick-change.md
@@ -0,0 +1,110 @@
+<purpose>
+Execute one small change with verification structurally impossible to forget, then gate exactly
+once — at the push. This is W4 (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md:120-134`), autonomy
+level L2. *"Automate the reversible; gate the irreversible"*: the local atomic commits are
+reversible and automated; the single irreversible step (push + draft PR) is the one gate.
+Everything stays branch-local until GATE 1 resolves to "Push".
+</purpose>
+
+<process>
+
+<step name="scope_self_check">
+Parse `$ARGUMENTS` as the change description.
+
+Lesson 2026-03-25 [Scope]: "If a 'quick fix' requires 3+ files, it is not quick. Re-plan."
+Estimate the blast radius from the description plus a targeted scan (grep the named symbols
+and paths). **If the change needs 3+ files: STOP and escalate** — display the lesson, then run
+`@$HOME/.claude/get-shit-done/workflows/idea-to-shipped.md` with the same description instead.
+The escalation stop is a routing decision, not a rubber stamp — it fires only when the 3-file
+rule trips.
+</step>
+
+<step name="branch_guard">
+```bash
+CURRENT_BRANCH=$(git branch --show-current)
+BASELINE_SHA=$(git rev-parse HEAD)
+```
+
+If on `main`/`master`: create and switch to `quick/{slug}` first and re-record both variables,
+so the commits land branch-local. `BASELINE_SHA` is the rollback point for "Discard" at GATE 1
+— the design's `git reset --hard` rollback, generalized to quick's possibly-multiple commits,
+and never executed on `main`.
+</step>
+
+<step name="quick_full">
+```
+Skill(skill="gsd:quick", args="--full ${DESCRIPTION}")
+```
+
+**`--full` is non-negotiable in this bundle:** quick's default path runs zero automated
+verification — the plan-checker loop (`quick.md` step 5.5) and the verifier (step 6.5) run
+only under `--full`. planner → executor (worktree) → verifier, with branch-local atomic
+commits (reversible — automated, per the two-gate doctrine; the push below stays the gate).
+
+**At quick's `gaps_found` menu** ("1) Re-run executor to fix gaps, 2) Accept as-is"): select
+option 1 once, logging `[auto] gap-closure iteration 1/1` (the `--auto` flag-family shape). If
+verification still reports gaps after that one iteration: stop-and-report — never reach the
+push gate with known gaps, and never select "Accept as-is" on the operator's behalf.
+</step>
+
+<step name="full_suite">
+Run the FULL suite so the gate can honestly say "suite green" — lesson 2026-03-25 [Testing]:
+"Run the full test suite, not just tests for the changed module."
+
+```bash
+npm test
+```
+
+**If the suite fails:** stop-and-report; do not present GATE 1. Commits stay local for
+inspection; print the exact rollback command (`git reset --hard ${BASELINE_SHA}` on
+`${CURRENT_BRANCH}`) without executing it.
+</step>
+
+<step name="gate_1_approve_push">
+## GATE 1 — Approve Push
+
+Present: diff stat vs `${BASELINE_SHA}`, verifier verdict from `${quick_id}-VERIFICATION.md`,
+suite result. If the executed change touched 3+ files despite the pre-check, flag the
+scope-rule breach in the presentation (log it — the operator decides at this gate).
+
+**Prompt text (verbatim):** "Done and verified locally ({files}, {±lines}; suite green). Push
+and open draft PR? [Push / Keep local / Discard]"
+
+- **"Push"** → `push_pr_watch`
+- **"Keep local"** → end; commits stay on the local branch, nothing leaves the machine.
+- **"Discard"** → `git reset --hard ${BASELINE_SHA}` on the working branch (never `main`);
+  report what was dropped.
+</step>
+
+<step name="push_pr_watch">
+Push the current branch — same semantics as `ship.md`'s `push_branch` step (upstream
+fallback); the target is always the working branch, never `main`:
+
+```bash
+git push origin ${CURRENT_BRANCH} 2>&1 || git push --set-upstream origin ${CURRENT_BRANCH}
+gh pr create --draft --title "${DESCRIPTION}" --body-file "${QUICK_DIR}/${quick_id}-SUMMARY.md"
+```
+
+(`${QUICK_DIR}` and `${quick_id}` come from quick's own init.) Then:
+
+```
+Skill(skill="gsd:ci-watch")
+```
+
+Draft PR only — nothing marked ready-for-review, nothing merges; merge stays human, on GitHub,
+forever (branch protection). On CI red: apply ci-watch's suggested fix within GATE-1-approved
+scope, cap one automated retry, then stop-and-report. If `gh pr create` fails after a
+successful push: report it, give the exact retry command, do not retry automatically
+(`wrap-and-sync.md`'s contract for the same failure).
+</step>
+
+</process>
+
+<success_criteria>
+- [ ] 3-file scope rule checked before execution; 3+ files escalates to `idea-to-shipped`
+- [ ] `gsd:quick` always invoked with `--full` — no path through this workflow skips verification
+- [ ] `gaps_found` auto-answered with ONE fix iteration, logged `[auto]`; "Accept as-is" never auto-selected
+- [ ] Full `npm test` runs before the gate; the gate is presented only on green
+- [ ] GATE 1 carries the verbatim W4 prompt; push, PR, and ci-watch happen only on "Push"
+- [ ] PR is draft; merge stays human; rollback is a branch-local reset to `${BASELINE_SHA}`
+</success_criteria>
```

_`get-shit-done/workflows/do.md`_

```diff
--- a/get-shit-done/workflows/do.md
+++ b/get-shit-done/workflows/do.md
@@ -39,6 +39,7 @@
 |--------------------------|----------|-----|
 | Starting a new project, "set up", "initialize" | `/gsd:new-project` | Needs full project initialization |
 | Mapping or analyzing an existing codebase | `/gsd:map-codebase` | Codebase discovery |
+| Fixing a bug end-to-end through to a shipped fix: "just fix this bug", "fix this and ship it", a pasted error with fix intent | `workflow:bug-to-branch` | Debug → gated fix path → full suite → gated ship, two gates (W3) |
 | A bug, error, crash, failure, or something broken | `/gsd:debug` | Needs systematic investigation |
 | Exploring, researching, comparing, or "how does X work" | `/gsd:research-phase` | Domain research before planning |
 | Discussing vision, "how should X look", brainstorming | `/gsd:discuss-phase` | Needs context gathering |
@@ -55,6 +56,7 @@
 | A note, idea, or "remember to..." | `/gsd:add-todo` | Capture for later |
 | Adding tests, "write tests", "test coverage" | `/gsd:add-tests` | Test generation |
 | Completing a milestone, shipping, releasing | `/gsd:complete-milestone` | Milestone lifecycle |
+| A small verified change pushed to a draft PR: "quick change: X", "small fix, push it up" | `workflow:quick-change` | Scope-checked quick `--full` + single push gate (W4) |
 | A specific, actionable, small task (add feature, fix typo, update config) | `/gsd:quick` | Self-contained, single executor |
 
 **Requires `.planning/` directory:** All routes except `/gsd:new-project`, `/gsd:map-codebase`, `/gsd:help`, `/gsd:join-discord`, and `workflow:daily-startup` (which handles a missing `.planning/` itself and routes to project setup). If the project doesn't exist and the route requires it, suggest `/gsd:new-project` first.
```

**Test plan.**
1. Apply gate: from repo root on autonomy/frontier-audit, run `git apply --check` on each of the three diffs, then `git apply` them. Expected: zero output, exit 0 for all (verified verbatim during authoring).
2. Line-cap assertion: `wc -l get-shit-done/workflows/bug-to-branch.md get-shit-done/workflows/quick-change.md` — expected 120 and 110 (both <= 120 per the audit mandate).
3. Existing contract suite (unchanged): `node --test tests/do-routing.test.cjs` — expected all pass with zero edits: the '| `/gsd:debug` |' and '| `/gsd:quick` |' rows are untouched, all workflow rows still precede the catch-all quick row, and do.md still contains no literal 'git push' (the new W4 row says 'pushed to a draft PR', not 'git push').
4. Extend tests/do-routing.test.cjs (the suite this blueprint's coverage extends): change line 19 from `const FLOWS = ['idea-to-shipped', 'daily-startup', 'wrap-and-sync'];` to `const FLOWS = ['idea-to-shipped', 'daily-startup', 'wrap-and-sync', 'bug-to-branch', 'quick-change'];` — the existing tests then automatically assert both new `workflow:` targets are routed, both workflow files exist on disk, and both rows precede the catch-all /gsd:quick row. Run `node --test tests/do-routing.test.cjs` — expected: all pass.
5. Full suite: `npm test` — expected green; no suite asserts a workflow-file count (verified: no readdir/length assertions against get-shit-done/workflows/).
6. Docs integrity: `node scripts/validate-doc-links.cjs` — expected exit 0 (new files reference paths in backticks, not Markdown links; no numeric doc claims touched, so check-doc-drift.cjs is unaffected).
7. Gate-semantics manual assertion: `grep -c "Fix now / Plan the fix / I'll take it manual" get-shit-done/workflows/bug-to-branch.md` = 1; `grep -c 'Push / Keep local / Discard' get-shit-done/workflows/quick-change.md` = 1; `grep -c 'Ship it / Fix issues first / Stop' get-shit-done/workflows/bug-to-branch.md` = 1 — the three verbatim design prompts from GSD-AUTONOMOUS-WORKFLOWS.md:114-115 and :130.
8. Routing manual assertion (live session): `/gsd:do "just fix this bug: <pasted stack trace>"` shows a GSD > ROUTING banner targeting workflow:bug-to-branch; `/gsd:do "quick change: fix the README typo and push it up"` targets workflow:quick-change; `/gsd:do "why is the parser crashing?"` (no fix intent) still targets /gsd:debug — confirming first-match specificity did not displace the investigate-only route.

**Rollback.** git checkout HEAD -- get-shit-done/workflows/do.md && rm -f get-shit-done/workflows/bug-to-branch.md get-shit-done/workflows/quick-change.md (or `git revert <sha>` if applied as a single commit) — do.md returns to its 19-row table and both wrappers vanish; no other file was modified.

**Risk notes.** W5 ship-milestone is deliberately NOT wired: it was shelved by operator decision 2026-07-12 (GSD-AUTONOMOUS-WORKFLOWS.md:135-137) because its nearest primitive /gsd:finalize carries two ungated pushes (finalize.md:65,143) plus a tool-permission mismatch, and a milestone close ends in the irreversible tag/archive/branch-delete cluster — handing that chain a one-line router intent before finalize is repaired would violate the gate-the-irreversible doctrine, so its router row and workflow file stay unbuilt. Routing-shadow risk: the W3 row sits above the /gsd:debug row, so fix-intent bug texts now enter a chain that can commit code (behind its two gates); investigate-only phrasing still falls through to /gsd:debug, and do.md:62's ambiguity ask remains the safety valve for borderline text — the routing banner keeps any misroute visible and interruptible, and every irreversible inside (push, PR) stays gated. The quick-change gaps_found auto-answer selects only the fix-iteration option once, logged '[auto]', and never 'Accept as-is' — it acts on verification rather than skipping it, so no existing gate is weakened; the wrapper adds gates (scope stop, suite-green requirement, push gate) that bare /gsd:quick lacks. Cross-blueprint stacking: do.md's routing table (current lines 39-60) is the shared hot zone — my two hunks anchor at :39-44 and :55-60, so any sibling blueprint that edits do.md rows, the :2 purpose line (the known 'confirm the routing' drift flagged in the ledger's :90 dissent — intentionally not touched here), or adds --auto handling at :62/:94 will still apply but should be ordered after this one or re-contexted if it touches rows adjacent to the insertions; quick.md, debug.md, ship.md, and idea-to-shipped.md are referenced read-only and not diffed, so blueprints targeting those files stack cleanly. The new files' gate prompts quote the W3/W4 design verbatim; content was checked line-by-line against lib/injection-patterns.json (all 23 categories) — no scanner pattern appears in added or context lines. GSD-AUTONOMOUS-WORKFLOWS.md:23's '16-row router' description becomes stale (21 rows after this change), as it already was after W1/W2/W6 (19 rows) — a docs-sync concern, not a functional one; check-doc-drift.cjs does not track that number.

---

### bp-f-review-sentinel-lesson-gate — Deferred-review sentinel in governance Stop hook + register the inert lesson-capture Stop gate

**Score 48** (involvement-saved 3 × frequency 4 × safety 4) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Kills two coupled ledger rows. (1) surface `settings-hooks`, `governance/templates/global/settings-hooks.json:93` (mechanism hook_block, final_class DEFAULT+LOG): the Stop hook blocks session end on ANY dirty tree — evidence quote "$DIRTY uncommitted files. Commit or stash before stopping. Tests=$TESTS, todo=$TODO" — coercing the agent to commit unreviewed WIP or stash the operator's own in-progress edits. It cannot distinguish 'forgot to commit' from 'operator is mid-review and explicitly deferred committing'; tasks/lessons.md:19 (2026-04-10 [Hook Design]) records the real incident (Pete asked to see the diff before committing; the Stop hook fired and forced a commit first) and prescribes exactly this fix: a `.planning/.review-pending` sentinel the uncommitted-files Stop hook checks. (2) surface `lesson-capture-gate`, `.claude/hooks/lesson-capture-gate.cjs:562` (mechanism hook_block, final_class AUTOMATE) plus the registration gap at tasks/lessons.md:18 (2026-04-13 [Integration]): the 605-line, 116-test gate shipped in PR #34 is registered NOWHERE — `.claude/settings.json` today contains only a SubagentStop entry — so lesson-capture enforcement has been inert since v2.2. Verified before diffing: the gate already honors its own escape hatches (hasValidExemption `## Session Exemptions` heading + session-window mtime at :451-461, checked before block at :550-560; fail-open on missing/unreadable transcript at :492-519; allow on zero signals :526 and on lessons-updated :538), so registration is safe and the gate file needs no modification.

**Design.** Extends the hook gate precedent (hook-enforcement-not-asking), whose recipe names both halves of this blueprint as mandatory hardenings mined from lessons.md: (1) every enforcement hook gets a user-intent sentinel escape hatch, and (2) hook integration requires a verified settings.json registration because code+tests without wiring shipped inert for 3 days. Diff (a) threads the already-shipped `.planning/.review-pending` sentinel (in production use by get-shit-done/workflows/wrap-and-sync.md:92-98 and pinned by tests/wrap-and-sync.test.cjs:85-88) into the governance Stop hook template: dirty tree + sentinel present → approve with a logged "Deferred review" note naming the sentinel and its protocol doc; dirty tree without sentinel → the existing block, unchanged except the remediation text now names the sentinel; clean tree → unchanged approve. Diff (b) registers the existing tested gate as a project Stop hook in `.claude/settings.json` beside the untouched SubagentStop entry (pure added gating). Diff (c) adds a small reference file `get-shit-done/references/review-pending-sentinel.md` defining the create/consume/remove protocol and the sentinel's hard scope limit — it affects only the Stop-event dirty-tree check; every PreToolUse gate (commit-on-main :20, private-path staging :30, required-docs :40, secrets scan :50, nested-.git :60, pre-push dirty-tree :70) is sentinel-blind by construction, since the sentinel string appears solely in the Stop command.

**Execution-ready package.**

_`governance/templates/global/settings-hooks.json`_

```diff
--- a/governance/templates/global/settings-hooks.json
+++ b/governance/templates/global/settings-hooks.json
@@ -90,7 +90,7 @@
         "hooks": [
           {
             "type": "command",
-            "command": "DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' '); TESTS='none'; if [ -d tests ] || [ -d test ] || [ -d __tests__ ]; then TESTS='exist'; fi; TODO='missing'; if [ -f .planning/STATE.md ] || [ -f tasks/todo.md ]; then TODO='present'; fi; if [ \"$DIRTY\" -gt 0 ]; then echo \"{\\\"decision\\\": \\\"block\\\", \\\"reason\\\": \\\"$DIRTY uncommitted files. Commit or stash before stopping. Tests=$TESTS, todo=$TODO\\\"}\" && exit 2; else echo \"{\\\"decision\\\": \\\"approve\\\", \\\"reason\\\": \\\"Clean: 0 uncommitted, tests=$TESTS, todo=$TODO\\\"}\"; fi",
+            "command": "DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' '); TESTS='none'; if [ -d tests ] || [ -d test ] || [ -d __tests__ ]; then TESTS='exist'; fi; TODO='missing'; if [ -f .planning/STATE.md ] || [ -f tasks/todo.md ]; then TODO='present'; fi; if [ \"$DIRTY\" -gt 0 ]; then if [ -f .planning/.review-pending ]; then echo \"{\\\"decision\\\": \\\"approve\\\", \\\"reason\\\": \\\"Deferred review: $DIRTY uncommitted files held for operator review (.planning/.review-pending sentinel present; protocol: get-shit-done/references/review-pending-sentinel.md). Tests=$TESTS, todo=$TODO\\\"}\"; else echo \"{\\\"decision\\\": \\\"block\\\", \\\"reason\\\": \\\"$DIRTY uncommitted files. Commit or stash before stopping. If the operator explicitly deferred committing pending their review, create the .planning/.review-pending sentinel to record that intent. Tests=$TESTS, todo=$TODO\\\"}\" && exit 2; fi; else echo \"{\\\"decision\\\": \\\"approve\\\", \\\"reason\\\": \\\"Clean: 0 uncommitted, tests=$TESTS, todo=$TODO\\\"}\"; fi",
             "statusMessage": "Running pre-stop checks..."
           }
         ]
```

_`.claude/settings.json`_

```diff
--- a/.claude/settings.json
+++ b/.claude/settings.json
@@ -1,5 +1,12 @@
 {
   "hooks": {
+    "Stop": [
+      {
+        "hooks": [
+          { "type": "command", "command": "node .claude/hooks/lesson-capture-gate.cjs" }
+        ]
+      }
+    ],
     "SubagentStop": [
       {
         "hooks": [
```

_`get-shit-done/references/review-pending-sentinel.md`_

```diff
--- /dev/null
+++ b/get-shit-done/references/review-pending-sentinel.md
@@ -0,0 +1,27 @@
+# Review-Pending Sentinel Protocol
+
+`.planning/.review-pending` is an empty marker file recording explicit operator intent: uncommitted changes are deliberately held because the operator is mid-review and deferred committing. Stop-time automation cannot otherwise distinguish that state from "forgot to commit" (lesson 2026-04-10 [Hook Design] in `tasks/lessons.md`).
+
+## Creating the sentinel
+
+- Create it only when the operator explicitly defers committing pending their review ("let me see the diff first", "hold the commit").
+- Command: `touch .planning/.review-pending`
+- Never create it merely to end a session with a dirty tree. It records operator intent, not agent convenience.
+
+## Consumers
+
+| Consumer | Effect when the sentinel is present |
+|----------|-------------------------------------|
+| Governance Stop hook (`governance/templates/global/settings-hooks.json`) | A dirty working tree at Stop is approved with a "Deferred review" note instead of blocked. |
+| Wrap gate (`get-shit-done/workflows/wrap-and-sync.md`) | Gate ceiling capped at "Commit local only"; the push option is removed. |
+| W6 autonomous wrap (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`) | Auto-commit of the wrap unit is skipped. |
+
+## Scope limits
+
+The sentinel affects only the Stop-event dirty-tree check. Every PreToolUse gate is sentinel-blind and fires regardless: the commit-on-main block, the private/generated staging block, the required-docs block, the secrets scan, the nested-.git check, and the pre-push dirty-tree check.
+
+## Removing the sentinel
+
+- Remove it as soon as the deferred review resolves (changes committed or discarded): `rm -f .planning/.review-pending`
+- The sentinel is session-local state. Never commit it.
+- A stale sentinel converts every future dirty-tree stop into a silent approve. Remove-on-resolve is part of the protocol; the Stop hook's deferred-review note names the sentinel so staleness stays visible.
```

**Test plan.**
1. Apply check (mechanical): pipe each unified_diff into `git apply --check -` from repo root — expect rc=0 for all three (pre-validated on HEAD c237227, individually and concatenated); then `git apply` them.
2. Template invariants (extends tests/governance-hooks.test.cjs and tests/integ-governance-hooks.test.cjs): run `node --test tests/governance-hooks.test.cjs tests/integ-governance-hooks.test.cjs` — expect all pass: total hook count still 10, all 5 event types present, Stop command still references .planning, no apex substring, unique statusMessages, PreToolUse still exactly 6 Bash-matcher groups with the branch/secrets/docs commands intact. Optional new assertion belongs in tests/governance-hooks.test.cjs: parse the template and assert the Stop command contains both '.planning/.review-pending' and 'decision\\": \\"block' (sentinel branch added, block branch retained).
3. Stop-hook branch behavior (manual assertion, exact commands): in a scratch git repo with a dirty file, extract the Stop command via `node -p "JSON.parse(require('fs').readFileSync('governance/templates/global/settings-hooks.json','utf8')).hooks.Stop[0].hooks[0].command"` and run it with `bash -c`. Expect: (1) dirty + no sentinel → stdout JSON decision=block, exit 2; (2) after `touch .planning/.review-pending` → stdout JSON decision=approve with reason starting 'Deferred review:', exit 0; (3) after removing sentinel and committing everything → decision=approve, reason starting 'Clean:', exit 0. All three branches verified in sandbox during authoring; every emitted reason parses as JSON.
4. Gate untouched (extends tests/lesson-capture-gate.test.cjs): run `node --test tests/lesson-capture-gate.test.cjs` — expect 116/116 pass (baseline-green confirmed; the diff does not touch the gate file).
5. Registration verification (the lessons.md:18 verify-registration step): `node -e "const s=require('./.claude/settings.json'); const c=s.hooks.Stop[0].hooks[0].command; if(c!=='node .claude/hooks/lesson-capture-gate.cjs') throw new Error(c); require('fs').accessSync('.claude/hooks/lesson-capture-gate.cjs');"` — expect silent exit 0. Optional new assertion belongs in tests/lesson-capture-gate.test.cjs: read ../.claude/settings.json and assert hooks.Stop registers the gate.
6. Gate fail-open smoke: from an empty temp dir, `echo '{}' | node /path/to/repo/.claude/hooks/lesson-capture-gate.cjs; echo $?` — expect stderr 'lesson-capture-gate: no transcript found, skipping scan' and exit 0 (verified during authoring).
7. Docs gates: `node scripts/validate-doc-links.cjs` — expect exit 0 (the new reference file uses inline code spans only, no Markdown links). `npm test` for the full suite. The three diffs add zero tests, so test_count/suite_count/coverage claims are untouched; if the optional assertions from steps 2/5 are added, run `npm run test:coverage` then `node scripts/check-doc-drift.cjs` and update CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md in the same commit unit per lessons.md:25.

**Rollback.** Revert the single blueprint commit (`git revert <sha>`) — equivalently `git apply -R` the three diffs — which restores the always-block Stop template, removes the Stop registration from .claude/settings.json (leaving SubagentStop intact), and deletes get-shit-done/references/review-pending-sentinel.md.

**Risk notes.** Honest risks. (1) The sentinel is agent-creatable: a misbehaving agent could touch .planning/.review-pending to end a session with a dirty tree. Mitigations: the block message and reference doc condition creation on EXPLICIT operator deferral; the approve path is never silent — it logs a 'Deferred review' reason naming the sentinel every stop; the file is not gitignored so it stays visible as untracked in git status. Residual risk accepted because the alternative (no escape hatch) already caused a forced commit past an explicit operator hold (lessons.md:19). (2) Sentinel scope confirmed by construction: the sentinel string appears only in the Stop command — the secrets scan (:50), commit-on-main (:20), private-path staging (:30), required-docs (:40), nested-.git (:60), and pre-push dirty-tree (:70) PreToolUse blocks are byte-identical and cannot be suppressed by it; nothing existing is weakened, the dirty+no-sentinel branch still blocks with exit 2. (3) Stale sentinel converts future dirty-tree stops into approves; the protocol doc mandates remove-on-resolve and the per-stop note keeps it visible — an mtime-based staleness warning is a possible follow-up, deliberately out of scope (adds no gating). (4) Registering the lesson gate makes session end STRICTER (new block when correction signals are uncaptured); escape hatches are already tested in the gate (Session Exemptions heading, fail-open on infra errors), and the gate file is not modified. (5) Cross-blueprint stacking: governance/templates/global/settings-hooks.json is shared with blueprints targeting rows :20/:30/:40/:70 — those hunks touch different PreToolUse lines and will not collide with this Stop-line hunk, but any other blueprint editing the same Stop command (row :93) or the 10-hook count in tests/governance-hooks.test.cjs:42 must be reconciled; .claude/settings.json may also be a shared registration target — this hunk anchors at lines 1-5 and needs regeneration if another registration lands first. (6) The template deploys via the governance installer to projects that may lack .planning/ — absent sentinel means behavior identical to today. (7) In this repo both the global governance Stop hook (if installed) and the project lesson gate now run at Stop; each is an independent pure check, order-insensitive.

---

### bp-a-finalize-push-consent — Autonomy-safe finalize: consent-gate both pushes via --yes-push flag and workflow.finalize_auto_push config with receipt logging

**Score 45** (involvement-saved 3 × frequency 3 × safety 5) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Kills two GATE-KEEP ledger rows (both mechanism=ungated_side_effect, verified=true). Row 1 — surface `finalize`, `commands/gsd/finalize.md:65`: evidence "Push: `git push origin $(git branch --show-current)`" — Gate 1 publishes every unpushed local commit with no confirmation, and it fires BEFORE Gate 2 verifies build health, so possibly-broken commits become remote history that only a force-push could remove (finalize's own critical_rules forbid force-push). Row 2 — surface `finalize`, `commands/gsd/finalize.md:142`: evidence "Commit: \"chore: finalize [milestone] — archive, report, clean state\" / Push to origin" — Gate 7 stages 'all modified' .planning/ files plus generated reports and pushes in one motion; the commit half is revertible, the push half is not. Compounding defect cited by both rows' surface: the frontmatter allowed-tools list (`commands/gsd/finalize.md:5-12`) omits AskUserQuestion, so the command cannot even ask for consent — the exact tool-permission mismatch that shelved ship-milestone (`.planning/GSD-AUTONOMOUS-WORKFLOWS.md:135-137`, and item 8 at `:157`: "two ungated `git push` steps (`finalize.md:65,143`)... Do not put `finalize` in an unattended chain until those are fixed").

**Design.** Extends two internal precedents verbatim: the --auto flag family (per-decision auto-select branch immediately above each AskUserQuestion, mandatory `[auto]`-style audit line — here `[auto-push] gate=<n> branch=<b> commits=<c> source=<flag|config>`) and config default+log (config-workflow-suppression recipe steps 1-2: add `workflow.finalize_auto_push` to VALID_CONFIG_KEYS in `get-shit-done/bin/lib/config.cjs` and default it `false` in buildNewProjectConfig so the default equals the safe ask behavior, read at the decision point with the standard `config-get ... 2>/dev/null || echo "false"` idiom that degrades to ask on missing key/config), under the two-gate doctrine (push is the irreversible step, so it gets the gate; the Gate 7 commit half stays automatic per the ledger's split guidance). A single Push Consent protocol is defined once in finalize's `<context>` and invoked at both push points: pre-approved via `--yes-push` (new, in argument-hint) or the config key → print receipt then push; otherwise AskUserQuestion (added to allowed-tools) with Push now / Skip push (keep local) / Stop finalize; Gate 8 gains an honesty line so a declined push is reported as operator choice rather than falsely claiming clean; pre-approval never bypasses Gate 2. The W5 shelving note in `.planning/GSD-AUTONOMOUS-WORKFLOWS.md` gets an Update line marking the two blockers (ungated pushes, allowed-tools mismatch) resolved by this blueprint so ship-milestone can route THROUGH finalize by granting push consent at its own approved gate.

**Execution-ready package.**

_`commands/gsd/finalize.md`_

```diff
--- a/commands/gsd/finalize.md
+++ b/commands/gsd/finalize.md
@@ -1,13 +1,14 @@
 ---
 name: gsd:finalize
 description: End-to-end project finalization — verify, archive, report, push, confirm clean
-argument-hint: "[milestone version, e.g., 'v2.2']"
+argument-hint: "[milestone version, e.g., 'v2.2'] [--yes-push]"
 allowed-tools:
   - Read
   - Bash
   - Glob
   - Grep
   - Edit
   - Write
   - Task
+  - AskUserQuestion
 ---
@@ -24,12 +25,23 @@
 <context>
 Milestone: $ARGUMENTS (optional — if omitted, read from .planning/STATE.md `milestone` field)
 
+Flags: `--yes-push` — pre-approves the push consent gates (Gate 1 and Gate 7). Strip it from $ARGUMENTS before reading the milestone version.
+
 **Automatically detected from project root:**
 - CLAUDE.md → project identity, build commands, test commands
 - .planning/STATE.md → current milestone, status, phase count
 - .planning/MILESTONES.md → shipped history
 - tasks/todo.md → outstanding items
 - .gitignore → what's tracked vs local-only
 
 **This command works on ANY project.** It does not hardcode package counts, test frameworks, or file structures. It reads the project's own configuration to determine what to verify.
+
+**Push consent — applies to every `git push` this command performs:**
+1. If `--yes-push` was passed: consent is pre-approved (source: flag).
+2. Else read the project config (missing file or key falls back to `false`):
+   `AUTO_PUSH=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.finalize_auto_push 2>/dev/null || echo "false")`
+   If `true`: consent is pre-approved (source: config).
+3. Else consent is unresolved: use AskUserQuestion at each push point (Gates 1 and 7).
+
+When consent is pre-approved, do not ask — print the receipt line `[auto-push] gate=<1|7> branch=<branch> commits=<count> source=<flag|config>` immediately before each push so the auto-approval stays visible in the transcript. Pre-approved consent never bypasses Gate 2: build-health failures still stop the command.
 </context>
@@ -57,14 +69,18 @@
    ```
 5. If status is already `archived` and git is clean and nothing is unpushed, say "This project is already finalized" and stop.
 
 ## Gate 1: Push Any Unpushed Work
 
 1. Run `git log origin/$(git branch --show-current)..HEAD --oneline`
 2. If commits exist:
    - Show them
+   - Resolve push consent (protocol in <context>):
+     - Pre-approved: print the receipt `[auto-push] gate=1 branch=<branch> commits=<count> source=<flag|config>`, then push.
+     - Otherwise AskUserQuestion: "Gate 1: push these commits to origin/<branch> now? Build health is not verified until Gate 2." Options: "Push now" / "Skip push (keep local)" / "Stop finalize".
+     - Skip push: leave the commits local and continue to Gate 2 — Gate 7 re-offers the push. Stop finalize: halt and report.
    - Push: `git push origin $(git branch --show-current)`
    - Confirm push succeeded
 3. If nothing to push, skip.
 
 ## Gate 2: Verify Build Health
 
@@ -133,20 +149,27 @@
 1. Run `/gsd:stats` workflow inline — capture output
 2. Run `/gsd:session-report` workflow inline — generates SESSION_REPORT.md
 
 ## Gate 7: Final Commit and Push
 
 1. Check `git status` for any uncommitted changes from Gates 3-6
 2. If changes exist:
    - Stage all modified .planning/ files, tasks/todo.md, and any generated reports
    - Do NOT stage .gitignored files
    - Commit: `chore: finalize [milestone] — archive, report, clean state`
+   - Show `git log origin/$(git branch --show-current)..HEAD --oneline` — everything the push will publish, including commits kept local at Gate 1
+   - Resolve push consent (protocol in <context>):
+     - Pre-approved: print the receipt `[auto-push] gate=7 branch=<branch> commits=<count> source=<flag|config>`, then push.
+     - Otherwise AskUserQuestion: "Gate 7: push the finalize commit(s) to origin/<branch>?" Options: "Push now" / "Skip push (keep local)" / "Stop finalize".
+     - Skip push: keep the commits local and continue to Gate 8. Stop finalize: halt and report.
    - Push to origin
-3. If no changes: skip
+3. If no changes to commit but unpushed commits remain (kept local at Gate 1): run the same push-consent step for them before continuing
+4. If no changes and nothing unpushed: skip
 
 ## Gate 8: Confirm Clean State
 
 1. Run `git status` — should be clean (nothing modified, nothing untracked that matters)
 2. Run `git log origin/$(git branch --show-current)..HEAD --oneline` — should be empty
+   - Exception: commits whose push was declined at Gate 1/7 are expected here — report their count as "kept local by operator choice" instead of presenting the all-clean confirmation
 3. Run `git log --oneline -5` — show recent history
 4. Present final confirmation:
    ```
@@ -168,6 +191,7 @@
 - **Gate-based:** Do not skip gates. Do not proceed past a failed gate. Report the failure and stop.
 - **Idempotent:** Running this command twice should be safe. If everything is already done, it confirms and exits at Gate 0.
 - **No destructive operations:** Never force-push, reset, or delete unarchived work. Archive first, always.
+- **Gated pushes:** Never `git push` without resolved consent — an AskUserQuestion approval this run, the `--yes-push` flag, or `workflow.finalize_auto_push=true`. Pre-approved pushes always print the `[auto-push]` receipt line first.
 - **Read before assuming:** Check what build commands actually exist before trying to run them. Not every project has make, bun, pytest, etc.
 - **Respect .gitignore:** Some artifacts (like knowledge base files) may be gitignored. Note them but don't try to commit them.
 - **One commit:** Gates 3-6 may each produce changes. Batch them into one finalization commit at Gate 7, not one per gate.
```

_`get-shit-done/bin/lib/config.cjs`_

```diff
--- a/get-shit-done/bin/lib/config.cjs
+++ b/get-shit-done/bin/lib/config.cjs
@@ -23,6 +23,7 @@
   'workflow.discuss_mode',
   'workflow.skip_discuss',
   'workflow.adaptive',
+  'workflow.finalize_auto_push',
   'workflow._auto_chain_active',
   'git.branching_strategy', 'git.phase_branch_template', 'git.milestone_branch_template', 'git.quick_branch_template',
   'planning.commit_docs', 'planning.search_gitignored',
@@ -129,6 +130,7 @@
       discuss_mode: 'discuss',
       skip_discuss: false,
       adaptive: false,
+      finalize_auto_push: false,
     },
     hooks: {
       context_warnings: true,
```

_`.planning/GSD-AUTONOMOUS-WORKFLOWS.md`_

```diff
--- a/.planning/GSD-AUTONOMOUS-WORKFLOWS.md
+++ b/.planning/GSD-AUTONOMOUS-WORKFLOWS.md
@@ -135,6 +135,8 @@
 ## W5 — `ship-milestone` — SHELVED
 
 > **Status: shelved by operator decision (2026-07-12).** A milestone ship is exactly the kind of irreversible sequence that must be gated, and `/gsd:finalize` — the existing primitive closest to this chain — carries two ungated pushes plus a tool-permission mismatch (details in item 8). The design below already routes around `finalize`, but this workflow stays unbuilt until `finalize` is repaired or the chain is re-verified end-to-end. Spec retained for that day.
+>
+> **Update (2026-07-12, blueprint `finalize-push-consent`):** the two ungated pushes (Gate 1 and Gate 7) and the missing AskUserQuestion in `allowed-tools` are resolved — both pushes now sit behind a consent gate: AskUserQuestion when interactive; the `--yes-push` flag or the `workflow.finalize_auto_push` config key (default `false`) pre-approve it for autonomous chains, always printing an `[auto-push]` receipt. `ship-milestone` can now route THROUGH `finalize` by granting push consent at its own approved gate. Still open before unshelving: the cross-plugin `repo-doc-architect` spawn (Gate 5.5) and one end-to-end chain re-verification.
 
 1. **Name:** `ship-milestone`
 2. **Trigger intent:** "Close out the milestone."
```

**Test plan.**
1. Apply check (already pre-validated in-session): from /home/user/Pete-Gets-Shit-Done run `git apply --check` on each of the three diffs verbatim — expect exit 0 for all (verified against HEAD c237227 on autonomy/frontier-audit); then `git apply` them.
2. Config regression — extends tests/config.test.cjs: run `node --test tests/config.test.cjs` — expect all existing tests green (no existing test pins the full VALID_CONFIG_KEYS set; verified by grep). Then extend the suite with a `describe('config-set workflow.finalize_auto_push')` block cloned from the `workflow.skip_discuss` block at tests/config.test.cjs:692-761 (set true -> get returns true; toggle back false; default false in config-new-project output).
3. Config key round-trip, manual assertion backing the suite extension: `T=$(mktemp -d) && cd "$T" && node /home/user/Pete-Gets-Shit-Done/get-shit-done/bin/gsd-tools.cjs config-new-project '{}' && node /home/user/Pete-Gets-Shit-Done/get-shit-done/bin/gsd-tools.cjs config-get workflow.finalize_auto_push` — expect `false` (default equals ask); then `node /home/user/Pete-Gets-Shit-Done/get-shit-done/bin/gsd-tools.cjs config-set workflow.finalize_auto_push true` — expect success, not 'Unknown config key'; then config-get — expect `true`.
4. Fallback path (older projects without the key): in an empty `mktemp -d`, run the exact doc idiom `AUTO_PUSH=$(node /home/user/Pete-Gets-Shit-Done/get-shit-done/bin/gsd-tools.cjs config-get workflow.finalize_auto_push 2>/dev/null || echo "false"); echo "$AUTO_PUSH"` — expect `false` (config-get exits non-zero on missing config/key, fallback engages, gate defaults to ask).
5. Sanitization gate — extends tests/prompt-injection-scan.test.cjs: run `node --test tests/prompt-injection-scan.test.cjs` — expect 'command files are clean' and 'lib source files are clean' to pass (all added lines were pre-scanned in-session with security.cjs scanForInjection: clean=true, findings=[]).
6. Consumer contracts — extends tests/closeout.test.cjs and tests/wrap-and-sync.test.cjs: run `node --test tests/closeout.test.cjs tests/wrap-and-sync.test.cjs tests/commands.test.cjs` — expect green: closeout.test.cjs:152 still finds `Skill(skill="gsd:finalize"` and wrap-and-sync.test.cjs:121 still confirms no /gsd:finalize reference; neither consumer file is touched.
7. Prompt-contract manual assertions on the edited command: `awk '/^## Gate 1:/,/^## Gate 2:/' commands/gsd/finalize.md | grep -n 'Resolve push consent\|Push:'` — expect the consent line number strictly below 'Show them' and strictly above the `Push:` line; same shape for `awk '/^## Gate 7:/,/^## Gate 8:/'` (consent above 'Push to origin'); `grep -c 'AskUserQuestion' commands/gsd/finalize.md` — expect >= 4 (frontmatter + protocol + both gates); `grep -c '\[auto-push\]' commands/gsd/finalize.md` — expect >= 4.
8. Docs gates: `node scripts/validate-doc-links.cjs` — expect exit 0 (no markdown links added, backtick references only); `node scripts/check-doc-drift.cjs` unaffected (no numeric claims in CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md touched) — covered by the full run.
9. Full suite: `npm test` then `npm run test:coverage` — expect 573 suites green and thresholds held (config.cjs delta is two constant lines inside already-covered functions; finalize.md is a prompt file with no unit harness).
10. Live-flow UAT (exact manual assertion for the LLM-executed surface): in a throwaway git repo with an origin remote and one unpushed commit, run `/gsd:finalize` — expect an AskUserQuestion before any `git push` at Gate 1 and choosing 'Skip push (keep local)' leaves `git log origin/<branch>..HEAD` non-empty with Gate 8 reporting 'kept local by operator choice'; rerun with `/gsd:finalize --yes-push` — expect zero questions and an `[auto-push] gate=1 branch=<branch> commits=1 source=flag` receipt printed immediately before the push.

**Rollback.** git revert the single commit containing the three files (pre-commit equivalent: `git checkout HEAD -- commands/gsd/finalize.md get-shit-done/bin/lib/config.cjs .planning/GSD-AUTONOMOUS-WORKFLOWS.md`) — the config key default is false, so no project state depends on it.

**Risk notes.** Honest trade: interactive finalize runs GAIN up to two questions (one per push) — that is the GATE-KEEP intent; zero-touch is restored via --yes-push or the config key, always with a transcript receipt. Consumer impact: get-shit-done/workflows/closeout.md:467 invokes Skill(skill=\"gsd:finalize\") without --yes-push, so closeout runs will now ask before pushes; threading --yes-push through closeout's own already-approved ship gate is a deliberate follow-up, out of this blueprint's mandated scope. Stacking concerns on shared targets: (1) the ledger's AUTOMATE row at commands/gsd/finalize.md:78 (Gate 2 hard-stop) is an adjacent-blueprint target — my Gate-1 hunk's trailing context ends at the blank line under the '## Gate 2' heading (old line 70) and includes no Gate 2 body lines, so hunks can coexist, but apply THIS blueprint first: it shifts Gate 2 body down 16 lines and later ledger anchors by +16/+23; (2) any sibling touching config.cjs VALID_CONFIG_KEYS/buildNewProjectConfig or the W5 section of .planning/GSD-AUTONOMOUS-WORKFLOWS.md must rebase after this applies; (3) post-apply, ledger anchors finalize.md:65/:142 land at ~:81/~:162. Enforcement is prompt-level, not mechanical — finalize is an LLM-executed command file, so the gate binds agent behavior like every other gate in the file; the remote branch-protection net remains the backstop, and no hook, gate, or protected config is weakened (changes are purely additive: one flag, one whitelisted key defaulting to the safe value, consent steps, receipts). Known residue, deliberately untouched: W5 item 8 (:157), Remaining-flows note (:233), ranked table (:256), and Would-NOT-automate (:261) still describe the pre-fix state as historical analysis — the added Update line supersedes them; the cross-plugin repo-doc-architect spawn (Gate 5.5) stays open, so W5 unshelving still requires that fix plus an end-to-end re-verify; the new key is not yet surfaced in get-shit-done/workflows/settings.md (config-set works regardless — cosmetic follow-up per the config recipe's step 5); templates/config.json intentionally untouched (already a subset of buildNewProjectConfig keys; the || echo \"false\" fallback covers pre-existing projects).

---

### g-post-frontier-tier-map — Post-frontier tier map: fix verifier quality cell + frontmatter anomaly, publish stage-tier guidance and recommended default profile

**Score 45** (involvement-saved 3 × frequency 3 × safety 5) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Kills four verified DEFAULT+LOG ledger rows that all ask the operator to pick a model profile the engine could default — but cannot safely default today because the map those defaults point into is internally inconsistent and pre-frontier. Rows: (1) settings @ get-shit-done/workflows/settings.md:43 — "AskUserQuestion([ {question: \"Which model profile for agents?\"} ... 11 questions total ])"; its Quality option copy at :49 ("Opus everywhere except verification (highest cost)") hard-codes the verifier hole into the user-facing surface. (2) settings @ commands/gsd/settings.md:12 — "Interactive configuration of GSD workflow agents and model profile via multi-question prompt". (3)+(4) new-project @ get-shit-done/workflows/new-project.md:126 and :427 — config rounds whose second AUQ round (L161/L481) asks "AI models" even under --auto. All four carry fix_pattern "config default+log (buildNewProjectConfig defaults)", which requires a sound recommended answer to auto-select. The underlying LIVE-GAP (seed_status lens, candidate g): agents/gsd-verifier.md:5 pins `model: opus` while its profile row is quality:sonnet/balanced:sonnet/budget:haiku (get-shit-done/bin/lib/model-profiles.cjs:36; references/model-profiles.md:16) — the only agent of 17 whose frontmatter matches NO cell of its row. Code consequence: dynamicSelect's INTEL-16 history promotion (model-profiles.cjs:117-135) and critical-complexity routing promote the tier to 'quality', but the verifier's quality cell equals its balanced cell (sonnet), so promotion is a no-op for the one agent whose verdict gates every phase; audit-milestone.md:28 and validate-phase.md:27 resolve the verifier model through this matrix live. Run telemetry (SYNTH-TIERMAP-INPUT.md): 349/349 site re-verification with 26 dissents raised and resolved consumed frontier-tier capability end to end; 21 of 34 breadth agents ran mid-tier at full reliability only because attestation reconciliation made under-reads detectable; no post-frontier tier guidance exists anywhere in the map, the reference doc, or agent frontmatter.

**Design.** Extends the router classification precedent — classifyTask → dynamicSelect with profile ceiling/floor (model-profiles.cjs:106-110) and INTEL-16 escalate-on-evidence promotion (:117-135) — from execution history to work shape, and feeds the config default+log family the recommended default those four ledger conversions need. One behavioral data-cell change: raise gsd-verifier's quality cell to opus in the cjs matrix and its md mirror, which simultaneously (a) resolves the frontmatter anomaly by making the pin match its intended column — quality, the same convention as the other two adjudication agents (gsd-planner and gsd-debugger both pin opus = quality column, per the frontmatter sweep of all 17 agents) and consistent with the agent file's own five-point model_rationale for opus — and (b) makes the existing promotion paths real for the verifier (promoting to quality previously resolved to the same sonnet as balanced). Balanced/budget verifier cells, the mapper row (budget-capable per telemetry), MODEL_TIERS, VALID_PROFILES derivation, and dynamicSelect semantics are deliberately untouched. The run-calibrated stage→capability-tier table, the attestation delegation heuristic, and the recommended post-frontier default config (`model_profile: balanced` + `routing_strategy: auto`, both valid keys per config.cjs:14-16) ship as a new Post-Frontier section appended to references/model-profiles.md; the stale Quality option copy in settings.md:49 is synced; two added test assertions lock the new cell.

**Execution-ready package.**

_`get-shit-done/bin/lib/model-profiles.cjs`_

```diff
--- a/get-shit-done/bin/lib/model-profiles.cjs
+++ b/get-shit-done/bin/lib/model-profiles.cjs
@@ -33,7 +33,7 @@
     'gsd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
     'gsd-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
     'gsd-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
-    'gsd-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
+    'gsd-verifier': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
     'gsd-ui-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
     'gsd-ui-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
     'gsd-ui-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
```

_`get-shit-done/references/model-profiles.md`_

```diff
--- a/get-shit-done/references/model-profiles.md
+++ b/get-shit-done/references/model-profiles.md
@@ -13,7 +13,7 @@
 | gsd-research-synthesizer | sonnet | sonnet | haiku | inherit |
 | gsd-debugger | opus | sonnet | sonnet | inherit |
 | gsd-codebase-mapper | sonnet | haiku | haiku | inherit |
-| gsd-verifier | sonnet | sonnet | haiku | inherit |
+| gsd-verifier | opus | sonnet | haiku | inherit |
 | gsd-ui-researcher | opus | sonnet | haiku | inherit |
 | gsd-ui-checker | sonnet | sonnet | haiku | inherit |
 | gsd-ui-auditor | sonnet | sonnet | haiku | inherit |
@@ -27,8 +27,8 @@
 ## Profile Philosophy
 
 **quality** - Maximum reasoning power
-- Opus for all decision-making agents
-- Sonnet for read-only verification
+- Opus for all decision-making and verdict-issuing agents (planning, debugging, verification judgment)
+- Sonnet for mechanical read-only checks (mapping, UI checks, audits)
 - Use when: quota available, critical architecture work
 
 **balanced** (default) - Smart allocation
@@ -133,6 +133,9 @@
 **Why Sonnet (not Haiku) for verifiers in balanced?**
 Verification requires goal-backward reasoning - checking if code *delivers* what the phase promised, not just pattern matching. Sonnet handles this well; Haiku may miss subtle gaps.
 
+**Why Opus for gsd-verifier at quality?**
+The 2026-07 frontier autonomy audit measured verification empirically: adjudication-shaped verification (349-site re-verification, 26 dissents raised and resolved) consumed frontier-tier capability end to end, while mechanical checks stayed reliable on lower tiers only when paired with an attestation step. Raising the quality cell to opus also aligns the row with the agent's frontmatter (`model: opus`, previously matching no cell of its row) and makes tier promotion real for the verifier — before this fix, promoting the verifier to the quality tier resolved to the same sonnet as balanced, so history promotion and critical-complexity routing changed nothing for the one agent whose verdict gates every phase.
+
 **Why Haiku for gsd-codebase-mapper?**
 Read-only exploration and pattern extraction. No reasoning required, just structured output from file contents.
 
@@ -205,3 +208,40 @@
 
 - **Agent tier mismatch**: If an agent has >50% failure rate on budget/balanced models, promote to `quality`
 - **Failing phase**: If the current phase has >30% failure rate and the effective tier is `budget`, promote to `balanced`
+
+---
+
+## Post-Frontier Stage Tier Map
+
+Calibrated 2026-07 from a 34-agent autonomy audit of this repo (zero failed agents; 21 of 34 ran below the frontier tier at full reliability). Read the profiles as capability classes, not model versions: `quality` = frontier class, `balanced` = mid class, `budget` = small class. The `opus`/`sonnet`/`haiku` aliases float with the harness to the current generation of each class. `MODEL_ALIAS_MAP` in `core.cjs` applies only when `resolve_model_ids` is enabled — re-verify its pinned IDs against current model versions before enabling that setting.
+
+| Lifecycle stage | Tier | Run evidence |
+|---|---|---|
+| map (gsd-codebase-mapper) | small/mid | 21 exhaustive deep-read slices ran mid-tier with zero degraded output — safe because each slice reconciled its counts against independent baseline greps |
+| research: orchestration and synthesis | frontier | Cross-corpus tracing and synthesis produced the run's structural findings; nothing in the run suggests tiering it down |
+| research: fetch/extract legs | mid | Mechanical retrieval and extraction ran clean below the frontier tier |
+| discuss | frontier | Grey-area adjudication and question selection is judgment work — the class that visibly consumed frontier capability |
+| plan (gsd-planner) | frontier | Architecture decisions have the highest quality impact; the existing row already encodes this |
+| execute (gsd-executor) | mid | Executors follow explicit PLAN.md instructions; mechanical rendering and assembly ran mid-tier clean |
+| verify: judgment scopes (general, plan, integration, nyquist) | frontier | 349/349 sites re-verified with 26 dissents raised and resolved — adjudication needed the frontier tier end to end |
+| verify: mechanical mode (schema/compliance, automated UAT) | mid/small | Pattern-matched checks are scripted; the automated-UAT runner already executes them without frontier reasoning |
+| ship (PR assembly, changelog, CI watch) | mid | Document and PR assembly is mechanical; escalate only the review-judgment residue |
+| audit-style deep reads | mid, with attestation | Safe below frontier only under an attestation contract — the agent reconciles its own counts against an independent baseline so under-reads are detectable |
+
+**Delegation heuristic** (extends `dynamicSelect`'s escalate-on-evidence rule from execution history to work shape): breadth agents (mappers, auditors, extractors) are safe on the mid tier when their contract includes an attestation/reconciliation step; adjudication agents (verifier judgment scopes, planner, debugger) default to the top tier.
+
+### Recommended default for post-frontier operation
+
+```json
+{
+  "model_profile": "balanced",
+  "routing_strategy": "auto"
+}
+```
+
+Rationale:
+
+- `balanced` encodes the run-proven allocation — frontier class where decisions happen (planning), mid class for execution and verification, small class for mapping.
+- `routing_strategy: "auto"` layers escalate-on-evidence on top: complex/critical phases route to the quality tier (meaningful for the verifier now that its quality cell is opus), and history promotion (INTEL-16) escalates any agent with a measured failure pattern. Profile ceiling/floor semantics are unchanged.
+- Override per stage rather than globally: `/gsd:set-profile quality` for milestone audits and ship-critical phases; `"model_overrides": { "gsd-verifier": "opus" }` in `.planning/config.json` to hold frontier-tier verification on a single project while staying on `balanced`.
+- Use `budget` for high-volume breadth work only when the workflow includes an attestation step (automated UAT, count reconciliation); without one, under-reads are silent.
```

_`agents/gsd-verifier.md`_

```diff
--- a/agents/gsd-verifier.md
+++ b/agents/gsd-verifier.md
@@ -39,6 +39,7 @@
 3. Integration-scope verification is cross-phase wiring analysis — tracing data and control flow across phase boundaries requires holding multiple files in working context.
 4. Nyquist-scope verification identifies validation gaps by reasoning about what was NOT tested, which is adversarial reasoning sonnet is weaker at.
 5. Verdict hedging is the single worst failure mode for a verifier; opus is more willing to commit to PASS/FAIL than sonnet, which hedges under uncertainty.
+6. Empirical confirmation — 2026-07 frontier autonomy audit: 349-site re-verification with 26 dissents raised and resolved consumed frontier-tier capability end to end, while mechanical checks stayed reliable below it only under attestation reconciliation. The profile row's quality column now matches this pin (quality: opus, balanced: sonnet, budget: haiku); see references/model-profiles.md.
 </model_rationale>
 
 <scope_guard>
```

_`get-shit-done/workflows/settings.md`_

```diff
--- a/get-shit-done/workflows/settings.md
+++ b/get-shit-done/workflows/settings.md
@@ -46,7 +46,7 @@
     header: "Model",
     multiSelect: false,
     options: [
-      { label: "Quality", description: "Opus everywhere except verification (highest cost)" },
+      { label: "Quality", description: "Opus for decision-making and verification judgment, Sonnet for mechanical checks (highest cost)" },
       { label: "Balanced (Recommended)", description: "Opus for planning, Sonnet for research/execution/verification" },
       { label: "Budget", description: "Sonnet for writing, Haiku for research/verification (lowest cost)" },
       { label: "Inherit", description: "Use current session model for all agents (best for OpenRouter, local models, or runtime model switching)" }
```

_`tests/model-profiles.test.cjs`_

```diff
--- a/tests/model-profiles.test.cjs
+++ b/tests/model-profiles.test.cjs
@@ -95,6 +95,7 @@
     const map = getAgentToModelMapForProfile('quality');
     assert.strictEqual(map['gsd-planner'], 'opus');
     assert.strictEqual(map['gsd-executor'], 'opus');
+    assert.strictEqual(map['gsd-verifier'], 'opus');
   });
 
   test('returns all agents in the map', () => {
@@ -252,6 +253,12 @@
     assert.strictEqual(result.tier, 'quality');
     assert.strictEqual(result.alias, 'opus');
   });
 
+  test('verifier resolves to opus when routed to quality tier', () => {
+    const result = dynamicSelect('gsd-verifier', { complexity: 'critical' }, balancedConfig);
+    assert.strictEqual(result.tier, 'quality');
+    assert.strictEqual(result.alias, 'opus'); // pre-fix the quality cell was sonnet, so promotion changed nothing for the verifier
+  });
+
   test('quality profile never downgrades — trivial stays at quality', () => {
     const result = dynamicSelect('gsd-executor', { complexity: 'trivial' }, qualityConfig);
     assert.strictEqual(result.tier, 'quality');
```

**Test plan.**
1. node --test tests/model-profiles.test.cjs — expect all tests pass, including the two added assertions (extends tests/model-profiles.test.cjs): quality-profile map returns 'opus' for gsd-verifier, and dynamicSelect('gsd-verifier', {complexity:'critical'}, {model_profile:'balanced'}) returns {tier:'quality', alias:'opus'}.
2. node -e "const p=require('/home/user/Pete-Gets-Shit-Done/get-shit-done/bin/lib/model-profiles.cjs').MODEL_PROFILES['gsd-verifier']; console.log(p.quality, p.balanced, p.budget)" — expect exactly 'opus sonnet haiku'; then grep -n 'gsd-verifier' get-shit-done/references/model-profiles.md — expect the row '| gsd-verifier | opus | sonnet | haiku | inherit |' (manual cjs-to-md sync assertion, the model-profiles.cjs:8-11 contract).
3. node get-shit-done/bin/gsd-tools.cjs resolve-model gsd-verifier --raw run from the repo root (this repo's .planning/config.json has model_profile 'balanced', routing_strategy 'static') — expect 'sonnet': balanced-profile behavior is byte-identical, only the quality tier is raised.
4. npm test — full suite green. No other suite pins the changed cell: tests/model-profiles.test.cjs:85 and :183 assert the balanced map (unchanged), :301 asserts budget-tier rationale strings (unchanged); tests/codex-config.test.cjs and tests/copilot-install.test.cjs read agent frontmatter, which this change does not modify.
5. node scripts/validate-doc-links.cjs — exit 0 (docs-integrity CI gate): the added md sections contain no markdown links. node scripts/check-doc-drift.cjs is unaffected (it validates CLAUDE.md/README.md/docs/DEVOPS-HANDOFF.md only; run npm run test:coverage first if executing it).

**Rollback.** git checkout HEAD -- get-shit-done/bin/lib/model-profiles.cjs get-shit-done/references/model-profiles.md agents/gsd-verifier.md get-shit-done/workflows/settings.md tests/model-profiles.test.cjs

**Risk notes.** Honest scoring: this is guidance plus one behavioral data cell — high strategic value, moderate direct de-prompting (it supplies the sound default the four DEFAULT+LOG ledger conversions select; it does not itself delete those asks). Behavioral scope of the cell change: only quality-profile users and dynamically promoted/critical-routed phases now spawn opus (frontier class) for verification — a deliberate, evidence-backed escalation with a real cost increase on exactly those paths; balanced and budget resolution is byte-identical (verified against every matrix consumer: getAgentToModelMapForProfile, dynamicSelect ceiling/floor, resolve-model static lookup at core.cjs:1330-1334). Deliberately NOT changed, per the run's own constraints: MODEL_ALIAS_MAP (core.cjs:1284-1288) is not re-pointed to post-frontier model IDs because pinned IDs cannot be verified from inside this session — the new md section instead instructs re-verifying it before enabling resolve_model_ids; the mapper row stays budget-capable; MODEL_TIERS, dynamicSelect, VALID_PROFILES derivation, and the inherit short-circuit (core.cjs:1331) are untouched. Known follow-ups explicitly out of scope: making the cjs matrix generate the md table (acknowledged debt at model-profiles.cjs:8-11), representing inherit as a real matrix column, and scope-aware per-verifier-scope tiering (would change the matrix schema). Frontmatter pin retained rather than deleted: it now matches the quality column (same convention as gsd-planner and gsd-debugger, the other adjudication agents) and only governs spawn paths that pass no explicit model. Single-run calibration caveat: the stage table encodes one 34-agent run's telemetry (n=1); INTEL-16 history promotion remains the runtime corrective if any tier proves wrong. Cross-blueprint stacking: get-shit-done/workflows/settings.md:43-56 is a likely target of the DEFAULT+LOG settings-batch blueprint and references/model-profiles.md EOF is a plausible append target — apply this blueprint first (its hunks are small and anchored) or re-anchor colliding hunks; tests/model-profiles.test.cjs additions anchor to unique test bodies, low collision risk. All five diffs validated with git apply --check (exit 0) against HEAD c237227 on autonomy/frontier-audit; the md's third hunk applies at a benign 1-line offset that git apply resolves silently.

---

### BP-gate1-auto-advance-tunnel — Close the auto_advance tunnel under idea-to-shipped GATE 1 via caller-declared gate precedence

**Score 30** (involvement-saved 2 × frequency 3 × safety 5) · **Status: VALIDATED** — bounced version; all 3 diffs re-verified clean by orchestrator git apply --check (original hunk drifted; revalidation agent died on session limit, re-run manually)

**Problem.** Two ledger rows (inventory-classified.json). Row 1 — surface: plan-phase, get-shit-done/workflows/plan-phase.md:783, final_class DEFAULT+LOG, configurable_via "--auto / workflow.auto_advance / workflow._auto_chain_active (auto-launches execute-phase)", failure_mode_if_auto: "Auto-launching execute-phase starts execution — the doctrine's first sanctioned human gate — without a go signal". The mechanical site is Step 15 "Auto-Advance Check": plan-phase.md:738 reads workflow.auto_advance unconditionally (AUTO_CFG=$(... config-get workflow.auto_advance ...)), and on true launches Skill(skill="gsd:execute-phase", ...) at plan-phase.md:754 with no awareness of caller context. Row 2 — surface: idea-to-shipped, get-shit-done/workflows/idea-to-shipped.md:120, final_class GATE-KEEP, evidence: "Plan verified (N tasks, M waves, files: ...). Execute now? [Execute / Adjust scope / Stop here -- keep the plan]" — GATE 1 "Approve Plan" (idea-to-shipped.md:102) is a hard contract: nothing executes before approval. The tunnel: idea-to-shipped step 3 (idea-to-shipped.md:85) invokes Skill(skill="gsd:plan-phase", args="${PHASE_NUM}"); in a project with workflow.auto_advance=true, plan-phase's Step 15 fires before control returns to the caller, so execute-phase starts BEFORE GATE 1 renders — the persistent config setting tunnels under the flow's explicit GATE-KEEP contract.

**Design.** Extends the _auto_chain_active plumbing precedent (get-shit-done/bin/lib/config.cjs:26 allowlist entry plus plan-phase.md Step 15's read-with-false-fallback pattern at :737) with a gate-precedence rule: a new ephemeral, caller-owned marker `workflow._gate_pending` is registered in VALID_CONFIG_KEYS (config-set rejects unregistered keys at config.cjs:326-328); idea-to-shipped's plan step sets it true immediately before invoking plan-phase and clears it immediately after plan-phase returns (same caller-owned lifecycle as _auto_chain_active); plan-phase's Auto-Advance Check gains item 4 reading GATE_PENDING with the identical `config-get ... || echo "false"` fallback, and a precedence branch: if GATE_PENDING is true, suppress auto-advance, log one line, and route to the existing `<offer_next>` — the existing `--auto`/AUTO_CHAIN/AUTO_CFG branch becomes the "Otherwise" case. Flows that never set the marker (autonomous.md, manual plan-phase) resolve it to "false" and behave exactly as today; the change only adds gating and a log line, weakening nothing.

**Execution-ready package.**

_`get-shit-done/bin/lib/config.cjs`_

```diff
diff --git a/get-shit-done/bin/lib/config.cjs b/get-shit-done/bin/lib/config.cjs
--- a/get-shit-done/bin/lib/config.cjs
+++ b/get-shit-done/bin/lib/config.cjs
@@ -24,6 +24,7 @@
   'workflow.skip_discuss',
   'workflow.adaptive',
   'workflow._auto_chain_active',
+  'workflow._gate_pending',
   'git.branching_strategy', 'git.phase_branch_template', 'git.milestone_branch_template', 'git.quick_branch_template',
   'planning.commit_docs', 'planning.search_gitignored',
   'hooks.context_warnings',
```

_`get-shit-done/workflows/plan-phase.md`_

```diff
diff --git a/get-shit-done/workflows/plan-phase.md b/get-shit-done/workflows/plan-phase.md
--- a/get-shit-done/workflows/plan-phase.md
+++ b/get-shit-done/workflows/plan-phase.md
@@ -737,8 +737,14 @@
    AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
    AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
    ```
+4. **Gate precedence** — read the caller-declared gate marker. A calling workflow (e.g. `idea-to-shipped`) sets `workflow._gate_pending` before invoking plan-phase when its own human approval gate is still pending downstream:
+   ```bash
+   GATE_PENDING=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._gate_pending 2>/dev/null || echo "false")
+   ```
 
-**If `--auto` flag present OR `AUTO_CHAIN` is true OR `AUTO_CFG` is true:**
+**If `GATE_PENDING` is true:** suppress auto-advance — the calling workflow owns the next step, and its approval gate has not rendered yet. Display one line — `Auto-advance suppressed: caller gate pending (workflow._gate_pending=true)` — then route to `<offer_next>`. Do not launch execute-phase from this step even when `--auto`, `AUTO_CHAIN`, or `AUTO_CFG` is set.
+
+**Otherwise — if `--auto` flag present OR `AUTO_CHAIN` is true OR `AUTO_CFG` is true:**
 
 Display banner:
 ```
```

_`get-shit-done/workflows/idea-to-shipped.md`_

```diff
diff --git a/get-shit-done/workflows/idea-to-shipped.md b/get-shit-done/workflows/idea-to-shipped.md
--- a/get-shit-done/workflows/idea-to-shipped.md
+++ b/get-shit-done/workflows/idea-to-shipped.md
@@ -81,10 +81,25 @@
 
 ## 3. Plan
 
+Declare the pending approval gate BEFORE invoking plan-phase — GATE 1 below is a hard contract
+(no execution before approval), so plan-phase must suppress its auto-advance path even when
+`--auto` or `workflow.auto_advance` is enabled in the project config:
+
+```bash
+node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._gate_pending true 2>/dev/null
+```
+
 ```
 Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
 ```
 
+After plan-phase returns, clear the ephemeral marker (same caller-owned lifecycle as
+`workflow._auto_chain_active`):
+
+```bash
+node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._gate_pending false 2>/dev/null
+```
+
 `plan-phase` runs its own internal `gsd-planner` → `gsd-verifier` (scope: plan) revision loop
 (max 3 iterations) before returning — no separate plan-quality gate is needed here, only the
 human approval gate below.
```

**Test plan.**
1. Mechanical validation (already proven at authoring time): from /home/user/Pete-Gets-Shit-Done run `git apply --check` on each of the three diffs verbatim — expect exit 0 for all three.
2. Extend tests/config.test.cjs (the existing `config-set command` describe block, alongside the `config-set workflow.research false` test at ~line 197): add a test that runs `runGsdTools('config-set workflow._gate_pending true', tmpDir)`, asserts `result.success` is true and `readConfig(tmpDir).workflow._gate_pending === true`, then runs `runGsdTools('config-get workflow._gate_pending', tmpDir)` and asserts the output contains `true`. Run `node --test tests/config.test.cjs` — expect all tests pass (the existing unknown-key rejection test at ~line 217 must stay green, since this change adds a key and removes none).
3. Run `node --test tests/idea-to-shipped.test.cjs` — expect all existing assertions green: GATE 1 verbatim prompt text is untouched (test at line 76), step-order markers untouched (line 54), and no forbidden token (`git push`, `gh pr`, `gsd:ship`) appears before GATE 2 (line 110) — the added lines contain none of those tokens.
4. Run `npm test` — expect the full suite green (the only code change is a one-line allowlist addition in config.cjs).
5. Manual doc assertion: `grep -n 'GATE_PENDING' get-shit-done/workflows/plan-phase.md` — expect the item-4 config-get read plus the suppression rule appearing BEFORE the `**Otherwise — if `--auto`...` branch; `grep -n '_gate_pending' get-shit-done/workflows/idea-to-shipped.md` — expect `config-set workflow._gate_pending true` before the `Skill(skill="gsd:plan-phase"...)` invocation and `config-set workflow._gate_pending false` after it.
6. End-to-end marker round-trip: in a scratch project directory with `.planning/config.json` containing `{"workflow":{"auto_advance":true}}`, run `node /home/user/Pete-Gets-Shit-Done/get-shit-done/bin/gsd-tools.cjs config-set workflow._gate_pending true` then `... config-get workflow._gate_pending` — expect `true` printed (proves plan-phase Step 15's GATE_PENDING read resolves true so the model routes to `<offer_next>` instead of launching execute-phase, closing the tunnel).
7. Sanitization rehearsal: all added and context lines were tested against the 23 patterns in lib/injection-patterns.json — 0 hits; re-runnable via a node one-liner loading that JSON and testing the diff text.

**Rollback.** git revert the single commit containing these three files (or `git apply -R` the combined patch) — the marker key becomes unregistered again and both workflow docs return to prior text; no data migration involved since `workflow._gate_pending` is ephemeral and defaults to absent.

**Risk notes.** Honest limits: (1) The two .md changes are prompt-level instructions enforced by the executing model, not by code — identical enforcement strength to the existing _auto_chain_active precedent and to GATE 1 itself; the config.cjs allowlist line is the only hard-code change. (2) Stale-marker case: if plan-phase dies mid-run before control returns to idea-to-shipped, workflow._gate_pending stays true; the failure direction is safe (auto-advance suppressed on the next manual plan-phase run — more human involvement, never less), and the one-line log makes the cause visible; recovery is `config-set workflow._gate_pending false`. The marker is deliberately NOT cleared by plan-phase's manual-invocation sync (Step 15 item 2), because idea-to-shipped invokes plan-phase without --auto — clearing there would defeat the mechanism; only the caller clears it. (3) Flows that never set the marker (autonomous.md chains, direct /gsd:plan-phase) resolve GATE_PENDING to \"false\" via the || echo fallback and are behaviorally unchanged. (4) Cross-blueprint stacking: plan-phase.md Step 15 (lines ~724-780), idea-to-shipped.md step 3/GATE 1 region (lines ~80-140), and the config.cjs VALID_CONFIG_KEYS block (lines 14-30) are shared hot zones for other autonomy blueprints — any sibling diff touching lines 737-744 of plan-phase.md, 81-90 of idea-to-shipped.md, or adding config keys in the same allowlist lines will conflict at apply time; apply this blueprint first or rebase siblings, since its hunks are the tightest anchors on those regions. (5) Validated at authoring time against branch autonomy/frontier-audit HEAD: all three diffs pass git apply --check individually and combined (exit 0); injection scan 0/23; existing idea-to-shipped.test.cjs and config.test.cjs assertions individually checked green.

---

### d — Config-driven defaults for complete-milestone's three prompts (archive, branch strategy, tag push)

**Score 24** (involvement-saved 3 × frequency 2 × safety 4) · **Status: VALIDATED** — all diffs pass git apply --check against HEAD

**Problem.** Kills three ledger rows on surface complete-milestone. (1) `get-shit-done/workflows/complete-milestone.md:390` — mechanism ask_user_question, final_class DEFAULT+LOG; evidence: `AskUserQuestion(header="Archive Phases", question="Archive phase directories to milestones/?"`. The ledger notes auto-archiving is a plain mv inside .planning/, reversible with one mv back, and /gsd:cleanup exists to redo it retroactively — yet the workflow blocks on a question with no config escape (configurable_via: null). (2) `get-shit-done/workflows/complete-milestone.md:572` — mechanism ask_user_question; evidence: `AskUserQuestion with options: Squash merge (Recommended), Merge with history, Delete without merging, Keep branches.` Ledger classed GATE-KEEP because a wrong auto-guess merges into main or deletes unmerged branches; this blueprint honors an explicit config opt-in (milestone.branch_strategy) instead of guessing, keeps the ask when unset in interactive mode, adds the ledger's own gate-presentation fix (merged/UNMERGED per branch), and hard-gates the destructive case (delete with unmerged branches asks in ALL modes). (3) `get-shit-done/workflows/complete-milestone.md:669` — mechanism yn_literal, final_class GATE-KEEP (irreversible_protected: push of release tag to origin, external publish + release automation); evidence: `Ask: "Push tag to remote? (y/n)"`. The gate stays but currently presents zero context — no tag target, no remote URL, no remote-state check — so the human answers blind and a colliding remote tag fails only after approval.

**Design.** Extends the config default+log precedent (config-workflow-suppression: add keys to the VALID_CONFIG_KEYS whitelist and buildNewProjectConfig defaults in get-shit-done/bin/lib/config.cjs:14-30/:103-138, read at the decision point via `config-get <key> --raw 2>/dev/null || echo "unset"` exactly as autonomous.md:143 and plan-phase.md:368 do), paired with the --auto flag family's mandatory `[auto] <what and why>` receipt line and the yolo-mode-gates resolution order: an explicitly set key is honored without asking; unset + yolo applies the recommended option with a receipt; unset + interactive preserves the current AskUserQuestion verbatim (zero behavior change for existing interactive projects). New keys: milestone.archive_phases (default true) governs the :390 archive ask; milestone.branch_strategy (default 'squash', values squash|merge|delete|keep) governs the :572 branch ask, with the safety.always_confirm_destructive rail imported from transition.md:126 — configured 'delete' auto-applies only when every branch is already merged into main, otherwise it asks in ALL modes naming the unmerged branches. The :669 tag push stays GATE-KEEP per the two-gate doctrine (automate the reversible local tag, gate the publish) and adopts the dry-run-preview-contract presentation (harden-repo shape): show tag target commit, remote URL, and whether the tag already exists at the remote before the unchanged y/n ask, skipping the dead ask only when no remote exists.

**Execution-ready package.**

_`get-shit-done/bin/lib/config.cjs`_

```diff
--- a/get-shit-done/bin/lib/config.cjs
+++ b/get-shit-done/bin/lib/config.cjs
@@ -27,6 +27,7 @@
   'git.branching_strategy', 'git.phase_branch_template', 'git.milestone_branch_template', 'git.quick_branch_template',
   'planning.commit_docs', 'planning.search_gitignored',
   'hooks.context_warnings',
+  'milestone.archive_phases', 'milestone.branch_strategy',
 ]);
 
 /**
@@ -133,6 +134,10 @@
     hooks: {
       context_warnings: true,
     },
+    milestone: {
+      archive_phases: true,
+      branch_strategy: 'squash',
+    },
     agent_skills: {},
     features: {},
   };
@@ -157,6 +162,11 @@
       ...(userDefaults.hooks || {}),
       ...(choices.hooks || {}),
     },
+    milestone: {
+      ...hardcoded.milestone,
+      ...(userDefaults.milestone || {}),
+      ...(choices.milestone || {}),
+    },
     agent_skills: {
       ...hardcoded.agent_skills,
       ...(userDefaults.agent_skills || {}),
```

_`get-shit-done/workflows/complete-milestone.md`_

```diff
--- a/get-shit-done/workflows/complete-milestone.md
+++ b/get-shit-done/workflows/complete-milestone.md
@@ -385,7 +385,18 @@
 
 Verify: `✅ Milestone archived to .planning/milestones/`
 
-**Phase archival (optional):** After archival completes, ask the user:
+**Phase archival (optional):** After archival completes, resolve the archive decision from config before asking:
+
+```bash
+ARCHIVE_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get milestone.archive_phases --raw 2>/dev/null || echo "unset")
+```
+
+Resolution order (first match wins):
+
+1. `ARCHIVE_CFG` is `true` — treat as "Yes" without asking. Log receipt: `[auto] Archiving phase directories to milestones/v[X.Y]-phases/ (milestone.archive_phases=true)`
+2. `ARCHIVE_CFG` is `false` — treat as "Skip" without asking. Log receipt: `[auto] Keeping phase directories in .planning/phases/ (milestone.archive_phases=false)`
+3. `ARCHIVE_CFG` is `unset` and config mode is `yolo` — treat as "Yes" (the recommended option). Log receipt: `[auto] Archiving phase directories to milestones/v[X.Y]-phases/ (yolo default — set milestone.archive_phases to override)`
+4. `ARCHIVE_CFG` is `unset` and config mode is `interactive` or `custom` — ask the user:
 
 AskUserQuestion(header="Archive Phases", question="Archive phase directories to milestones/?", options: "Yes — move to milestones/v[X.Y]-phases/" | "Skip — keep phases in place")
 
@@ -555,20 +566,28 @@
 
 **If no branches found:** Skip to git_tag.
 
-**If branches exist:**
-
-```
-## Git Branches Detected
-
-Branching strategy: {phase/milestone}
-Branches: {list}
-
-Options:
-1. **Merge to main** — Merge branch(es) to main
-2. **Delete without merging** — Already merged or not needed
-3. **Keep branches** — Leave for manual handling
-```
-
+**If branches exist**, gather per-branch merge status and the configured strategy first:
+
+```bash
+MERGED_LIST=$(git branch --merged main 2>/dev/null | sed 's/^[* ]*//')
+STRATEGY_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get milestone.branch_strategy --raw 2>/dev/null || echo "unset")
+```
+
+```
+## Git Branches Detected
+
+Branching strategy: {phase/milestone}
+Branches: {list — annotate each branch merged / UNMERGED using MERGED_LIST}
+```
+
+Resolution order (first match wins). Option mapping: `squash` = Squash merge, `merge` = Merge with history, `delete` = Delete without merging, `keep` = Keep branches.
+
+1. `STRATEGY_CFG` is `squash`, `merge`, or `keep` — apply the mapped option below without asking. Log receipt: `[auto] Branch handling: {strategy} for {branches} (milestone.branch_strategy={strategy})`
+2. `STRATEGY_CFG` is `delete` and every detected branch appears in `MERGED_LIST` — apply "Delete without merging" without asking. Log receipt: `[auto] Branch handling: delete — all branches already merged into main (milestone.branch_strategy=delete)`
+3. `STRATEGY_CFG` is `delete` and any branch is UNMERGED — destructive; never auto-apply. Ask below in ALL modes and name the unmerged branches in the question.
+4. `STRATEGY_CFG` is `unset` (or an unrecognized value) and config mode is `yolo` — apply "Squash merge" (the recommended option). Log receipt: `[auto] Branch handling: squash merge (yolo default — set milestone.branch_strategy to override)`
+5. Otherwise — ask:
+
 AskUserQuestion with options: Squash merge (Recommended), Merge with history, Delete without merging, Keep branches.
 
 **Squash merge:**
@@ -666,6 +685,25 @@
 
 Confirm: "Tagged: v[X.Y]"
 
+The push stays gated in ALL modes (yolo included): it publishes the tag to the remote and can trigger release automation there. Gather a read-only preview first:
+
+```bash
+TAG_TARGET=$(git rev-parse --short "v[X.Y]^{commit}" 2>/dev/null)
+REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
+REMOTE_TAG=$(git ls-remote --tags origin "v[X.Y]" 2>/dev/null || true)
+```
+
+**If `REMOTE_URL` is `none`:** report `Tag v[X.Y] created locally — no remote configured, nothing to push` and continue to git_commit_milestone without asking.
+
+Otherwise present the preview, then ask:
+
+```
+Tag push preview:
+- Tag: v[X.Y] → {TAG_TARGET}
+- Remote: origin — {REMOTE_URL}
+- At remote: {"v[X.Y] already exists — push will be rejected" if REMOTE_TAG is non-empty, else "not present"}
+```
+
 Ask: "Push tag to remote? (y/n)"
 
 If yes:
```

**Test plan.**
1. cd /home/user/Pete-Gets-Shit-Done && git apply --check <both diffs> — expected: exit 0, no output (verified verbatim against HEAD of autonomy/frontier-audit during authoring).
2. cd /home/user/Pete-Gets-Shit-Done && node --test tests/config.test.cjs — expected: all existing tests pass unchanged (additive keys only; the 'creates full config with all expected keys' test at tests/config.test.cjs:341 asserts individual keys, not object shape, so the new milestone section cannot break it).
3. Extend tests/config.test.cjs 'config-set command' describe (after the workflow.text_mode test at :228): runGsdTools('config-set milestone.archive_phases false', tmpDir) — expected result.success true and readConfig(tmpDir).milestone.archive_phases === false; runGsdTools('config-set milestone.branch_strategy keep', tmpDir) — expected success and readConfig(tmpDir).milestone.branch_strategy === 'keep'; then runGsdTools('config-get milestone.branch_strategy --raw', tmpDir) — expected stdout 'keep'.
4. Extend tests/config.test.cjs 'config-new-project command' > 'creates full config with all expected keys' (:341-387): add assert.ok(config.milestone && typeof config.milestone === 'object'); assert.strictEqual(config.milestone.archive_phases, true); assert.strictEqual(config.milestone.branch_strategy, 'squash') — expected: pass.
5. cd /home/user/Pete-Gets-Shit-Done && npm test && npm run test:coverage — expected: 573+ suites green; coverage thresholds hold (config.cjs is a standard module: >=80% per-module; additions are 3 straight-line key/default lines exercised by the tests above).
6. Manual workflow assertion (prose file, no unit harness — backward compat): in a scratch GSD project whose .planning/config.json has mode='interactive' and NO milestone section, run /gsd:complete-milestone through archive_milestone — expected: the 'Archive Phases' AskUserQuestion appears exactly as before. Then run node get-shit-done/bin/gsd-tools.cjs config-set milestone.archive_phases true and repeat — expected: no question; transcript contains the line starting '[auto] Archiving phase directories to milestones/'.
7. Manual workflow assertion (destructive rail): in the scratch project set milestone.branch_strategy=delete, create a phase branch with one unmerged commit, run the handle_branches step — expected: the branch AskUserQuestion is still presented (all modes) with the branch annotated UNMERGED; with the branch fully merged into main instead — expected: no question, receipt '[auto] Branch handling: delete — all branches already merged into main'.
8. Manual gate-presentation assertion: at git_tag with a remote configured, verify the 'Tag push preview' block renders tag target, remote URL, and remote-tag existence BEFORE the unchanged 'Push tag to remote? (y/n)' ask; with no remote — expected: no ask, message 'Tag v[X.Y] created locally — no remote configured, nothing to push'.
9. Sanitization gate: node script testing every diff line against all 23 regexes in lib/injection-patterns.json — expected: zero matches (verified during authoring: SANITIZATION_CLEAN).
10. cd /home/user/Pete-Gets-Shit-Done && node scripts/validate-doc-links.cjs — expected: exit 0 (diff adds no Markdown links).

**Rollback.** git checkout HEAD -- get-shit-done/workflows/complete-milestone.md get-shit-done/bin/lib/config.cjs (or git revert the blueprint commit once landed).

**Risk notes.** Honest tensions and stacking concerns. (1) Ledger dissent on :572: the verifier classed it GATE-KEEP; this blueprint auto-applies only on explicit config opt-in or yolo-mode default, keeps the interactive-unset ask verbatim, ships the ledger's own gate-presentation fix (merged/UNMERGED annotation), and adds a rail the current file lacks — configured 'delete' with any unmerged branch asks in ALL modes. Residual risk: yolo-default squash merges phase branches into LOCAL main without review; recoverable pre-push via reset/reflog, and nothing in this workflow pushes main (only the tag push, which stays gated). (2) buildNewProjectConfig defaults mean NEW projects materialize milestone.archive_phases=true / branch_strategy='squash' and will not be asked these two questions even in interactive mode (receipt lines disclose); existing projects are untouched until they set the keys or run yolo. New projects also default git.branching_strategy='none', so the branch default is inert unless branching was explicitly enabled. (3) settings.md is deliberately NOT updated to surface milestone.* (minimal-diff contract); config-set/config-get fully work — settings UI exposure is a documented follow-up. (4) cmdConfigSet does not enum-validate milestone.branch_strategy values; the workflow treats unrecognized values as unset (falls through to ask/yolo default) — fail-safe but silent. (5) git ls-remote in the push preview needs network; on failure REMOTE_TAG is empty and the preview reads 'not present' — degraded info, but the human gate still fires. git branch --merged main assumes main exists (the existing squash path already hardcodes git checkout main); if absent, MERGED_LIST is empty and configured 'delete' falls back to asking — fail-safe direction. (6) Cross-blueprint stacking: complete-milestone.md is shared with candidate rows :83/:113 (verify_readiness), :438 (delete-originals), :655 (tag receipt). My hunks touch lines 385-391, 555-574, 666-671; no overlap with :83/:113/:438 regions, but a :655 blueprint editing the git_tag step lines 652-667 abuts hunk C's leading context (666-668) — apply that blueprint and this one in either order with git apply's context matching, but do not hand-merge overlapping receipt lines. config.cjs VALID_CONFIG_KEYS (line 29) and the buildNewProjectConfig merge block are hot anchors for any sibling blueprint adding config keys; if another blueprint appends at the same anchor, one of the two needs a trivial context rebase. Diffs only add config-honoring/gating/logging: no existing hook, gate, or protected config is weakened — the interactive-unset path is byte-identical behavior for all three prompts, and the tag push gains information while keeping its ask.
