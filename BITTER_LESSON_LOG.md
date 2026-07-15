# BITTER_LESSON_LOG

Running memory file for the Bitter Lesson surgery on the GSD harness.
Branch: `bitter-lesson-surgery` (never pushed). Started 2026-07-15.

**Principle (Sutton):** scaffolding that encodes human judgment (routers, classifiers, keyword scoring, tier heuristics) loses to model capability — delete it. Scaffolding that provides leverage (deterministic gates, verification loops, environment facts, user config) compounds — keep it.

**Rubric tiebreak:** if it encodes WHAT exists (facts, paths, schemas, wiring) → LEVERAGE, keep. If it encodes WHICH to pick or HOW MUCH to think (keyword→choice mappings, scores, tiers, confidence thresholds) → JUDGMENT, delete.

## The Eight Steps (derived from operator directive 2026-07-15 — no external plan doc exists; verified against repo, git history, branches, PRs, sibling projects)

1. Load the harness surface into context (core inventory + 47 SKILL.md census).
2. Create branch `bitter-lesson-surgery` + Phase 57.1 planning artifacts + this log scaffold.
3. Replace the `/gsd:do` router's judgment table with a model-readable registry.
4. Delete the complexity classifier (`classify.cjs`) and rewire its sole consumer (`init.cjs`).
5. Split-cut model-profiles/history: delete dynamic tier judgment, keep static config + telemetry.
6. Sweep the 47 vendored skills in parallel work packages: strip judgment per rubric, preserve leverage.
7. Reconcile: tests green, coverage floors hold, living docs synced, log merged, DEFERRED consolidated.
8. Final report: totals, skills touched, 5 least-confident decisions.

## Pre-registered finding

- **Word-replacement tables: nothing to delete.** The directive named them as a judgment-scaffolding category; exhaustive search (skills, workflows, commands) found none. All near-misses are deterministic placeholder substitution (sync-docs live-value injection — leverage) or prose.

## Deletions — GSD core

| File | Lines deleted | Defense (why judgment, not leverage) |
|------|---------------|--------------------------------------|
| get-shit-done/workflows/do.md | ~35 (net −33, 118→85) | 30-row intent→command if-then table + worked ambiguity example encoding human routing judgment; replaced by per-target self-descriptions (do-registry) + model judgment. Kept: validate/check_project/display/dispatch gates, .planning/ exemption facts, dispatcher-never-works rule — all leverage. |
| get-shit-done/bin/lib/init.cjs | 133 (net −128) | buildTaskContext() plan/req-count→complexity thresholds are keyword-adjacent tier judgment; historyHints/failureRate feeding and classifyTask() wiring exist only to bias model choice by encoded heuristics. resolveModelInternal keeps user config (leverage); the taskContext arg that steered it was judgment. |
| tests/init.test.cjs | 507 | Tests pinning the deleted judgment (buildTaskContext thresholds, taskContext wiring, task_classification shape, INTEL-16/18 history wiring) — scaffolding-of-scaffolding; deleted with the behavior they froze. |
| tests/e2e/intelligence-pipeline.test.cjs | 357 (file) | End-to-end pin of the classify→route pipeline being excised; nothing left to exercise. |
| get-shit-done/bin/lib/core.cjs | 23 (net −20) | dynamicSelect step-3 branch in resolveModelInternal picked model tiers from complexity heuristics — HOW MUCH compute judgment. Kept steps 1/2/static: user overrides, resolve_model_ids runtime facts, user-set profile — all config/leverage. |
| tests/core.test.cjs | 202 | Dynamic-routing + MODEL_ROUTE debug-logging describes pinned the deleted judgment branch; static-profile describes (user config) kept. |
| get-shit-done/bin/lib/model-profiles.cjs | 64 (net −64) | MODEL_TIERS + dynamicSelect() encode "trivial tasks deserve cheap models" — a user-set profile is config, auto tier selection is judgment. Kept: _modelProfiles data, lazy init, MODEL_PROFILES/VALID_PROFILES getters, map/table helpers — facts about what exists. |
| tests/model-profiles.test.cjs | 212 | MODEL_TIERS + dynamicSelect describes pinned the deleted tier judgment; data-integrity describes kept. |
| tests/perf/routing-benchmark.test.cjs | 301 (file) | Perf pin ("dynamicSelect < 2ms") for a deleted judgment function; benchmarking judgment scaffolding is still judgment scaffolding. (Deletion landed via concurrent commit b730f8d — shared index.) |
| get-shit-done/bin/lib/classify.cjs | 278 (file) | Keyword scoring and score→tier thresholds are pure encoded judgment; adaptWorkflowGates had zero production consumers. Sole consumer (init.cjs) already rewired in commit 2. |
| tests/classify.test.cjs | 223 (file) | Pinned the deleted classifier's keyword scores and thresholds. |
| get-shit-done/bin/lib/config.cjs + core.cjs | 19 (net −16) | routing_strategy + workflow.adaptive keys validated, defaulted, migrated, and read — but wired to nothing after commits 2–5. A knob wired to nothing is deception, not config. 1→2 migration kept as no-op version bump (CONFIG_VERSION stays 2); migration never strips user keys. |
| tests/{config,core}.test.cjs (commit 6) | 131 (net −113) | Describes pinning the retired keys' validation/defaults/injection; migration tests rewritten to pin the no-op bump + user-key preservation instead. |
| docs + references (commit 6) | 154 (net −149) | CONFIGURATION.md / USER-GUIDE.md / DEVOPS-HANDOFF.md / references/model-profiles.md sections documenting the deleted routing machinery (classifyTask signals/scores, dynamicSelect tiers, routing_strategy/adaptive knobs). Stale docs describing deleted judgment are the paper trail of the deception. Execution-history telemetry docs kept. |

## Deletions — Vendored skills

### Package 1 — Classification core (claude-code-factory)

| file | lines deleted | defense |
|------|--------------|---------|
| skills/intent-engine/SKILL.md | 171 (343→172) | Gutted: keyword decision tree (Sec 3), 11-category phrase→type signal taxonomy + extraction rules (Sec 4), scripted Q1-Q5 question bank with answers→type columns (Sec 5), compound signal-combination table (Sec 6), "block" phrase-disambiguation table, expertise-keyword list, ≥0.85 scenario threshold, phrase-mapped edge cases. Replaced classifier with judgment sentences. Kept: frontmatter (description reworded "walks a decision tree"→"decides"), pipeline stages/wiring, interaction guardrails (max 2 questions, confirm before generating, expert bypass, never expose jargon), compound dependency-ordering principle, Cap 2/Cap 5 routing facts, two hook facts salvaged from deleted references (matcher matches tool name only → handler checks tool_input.command; gate exit 2 / info exit 0), full intent-resolution YAML + handoff rules untouched. |
| skills/intent-engine/references/decision-tree.md | 163 (rm) | Pure judgment: full keyword decision tree, hook-event resolution sub-tree with "Signals:" lines, phrase→matcher table, signal→exit-code gate table, scenario→handler-type selection table. The two genuine facts (tool_input.command check, exit-code semantics) relocated to SKILL.md; event/handler facts already owned by cc-ref-hooks (declared dependency). |
| skills/intent-engine/references/signal-catalog.md | 350 (rm) | Pure judgment: 11 phrase→type signal tables with strength scores, compound signal-combination patterns, disambiguation question decision tree, 20 worked examples existing solely to demonstrate the deleted classifier. |
| skills/smart-scaffold/SKILL.md | 14 (171→157) | Deleted: pointers to 4 deleted support files, tier signal-extraction/sufficiency-check/beginner-detection step, "MEDIUM or LOW confidence" activation wording, phrase→action escalation table ("yes"→escalate, "simpler"→Tier 1), keyword rules ("simple"→Tier 1, "complete"→Tier 3, beginner-language bias). Added: one-paragraph factual tier definition (1=one extension, 2=2-3, 3=full system) so the resolved-spec `tier` field stays meaningful; scope→path fact table salvaged from scope-flow.md. Kept: question guardrails (max 3, either/or, no jargon), summary template, resolved-spec output schema, upgrade-path templates, user-controls-escalation rules, expert override. |
| skills/smart-scaffold/tier-classifier.md | 98 (rm) | Pure judgment: Tier 2/3 signal-detection tables with counting rules ("2+ signals → Tier 3 candidate"), sufficiency checklists, beginner/expert phrase-detection table, scoring summary. |
| skills/smart-scaffold/question-flows/timing-flow.md | 100 (rm) | Scripted question bank with answers→type/field columns, phrase→answer skip-condition tables, worked examples. Config facts it encoded (exit 2, async, permissionMode: plan) are owned by cc-ref-hooks/cc-ref-skills/cc-ref-subagents. |
| skills/smart-scaffold/question-flows/scope-flow.md | 56 (rm) | Scripted question bank + phrase skip-conditions. Factual kernel (scope→path mapping, project-local default) preserved as a 3-row table in smart-scaffold SKILL.md Step 4. |
| skills/smart-scaffold/question-flows/behavior-flow.md | 101 (rm) | Scripted trigger/tool-access question bank, phrase→matcher and phrase→allowed-tools mapping tables, skip-condition keyword tables, worked examples. |
| skills/scenario-library/SKILL.md | 2 (96→94) | Deleted: word-count confidence rubric ("HIGH ≥ 3 trigger phrase words match / MEDIUM 1-2 / LOW"), "score by number of matching words/phrases" search scoring, dangling trigger-phrase references. Kept: three-outcome contract (direct match / top 3 / null fallback), all usage modes, frontmatter "Triggers on:" description list (load-bearing for skill invocation), rules, recipe registry. |
| skills/scenario-library/recipes/automation.md | 12 (123→111) | Stripped 12 `**Triggers**:` keyword lines only; all pre-resolved configs, customization points, verify steps intact. |
| skills/scenario-library/recipes/commands.md | 8 (83→75) | Stripped 8 trigger-keyword lines; configs intact. |
| skills/scenario-library/recipes/knowledge.md | 5 (53→48) | Stripped 5 trigger-keyword lines; configs intact. |
| skills/scenario-library/recipes/specialists.md | 5 (53→48) | Stripped 5 trigger-keyword lines; configs (tools, model, maxTurns) intact. |
| skills/scenario-library/recipes/connections.md | 5 (53→48) | Stripped 5 trigger-keyword lines; transport/auth configs intact. |
| skills/scenario-library/recipes/security.md | 5 (53→48) | Stripped 5 trigger-keyword lines; permission/settings configs intact. |
| skills/scenario-library/recipes/teams.md | 3 (46→43) | Stripped 3 `**Trigger phrases**:` lines; orchestration patterns intact. |

**Total: 1,942 → 844 lines. Net 1,098 lines deleted (56.5%).** Two whole files + one directory pair removed (`intent-engine/references/`, `smart-scaffold/question-flows/`).

**Notes:**
- Cross-package references spotted (do not edit; other executors own these files):
  - plugins/claude-code-factory/skills/extension-concierge/SKILL.md:44 → "High-confidence match (≥ 0.85)" — points at intent-engine's deleted Stage-1 threshold.
  - plugins/claude-code-factory/skills/extension-concierge/SKILL.md:47 → "Walk the decision tree. Use the intent-engine's behavioral…" — points at deleted decision tree.
  - plugins/claude-code-factory/skills/extension-concierge/SKILL.md:183, 211 → "When smart-scaffold classifies as Tier 2/3" — still valid (tier semantics retained in smart-scaffold).
  - plugins/claude-code-factory/skills/extension-combo-engine/SKILL.md:204 → "the intent-engine's decision tree detects a multi-type request" — deleted mechanism.
  - plugins/claude-code-factory/skills/extension-combo-engine/SKILL.md:6, 200 → tier handoff from smart-scaffold — still valid.
  - README.md:1371/1404/1406, docs/governance-customization.md:248, .planning/GSD-ECOSYSTEM-MAP.md:270/274/278/726/730/734/983/987/991 → name/description listings only; no deleted mechanism referenced.
- smart-scaffold `resolved-spec:` schema kept intact (handoff/output schema per rubric); its `tier` field stays meaningful via the retained one-paragraph tier definition.
- Pre-existing inconsistency (not introduced, not fixed): scenario-library/SKILL.md advertises "40 recipes" across 6 files but recipes/teams.md (T01-T03) exists and is not listed in Supporting Files.
- Verification: all 3 SKILL.md files start with `---` and contain `name:` + `description:` (checked via head/grep). `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` from repo root: **19/19 pass, 0 fail** (run 2026-07-15, after all edits).

### Package 2 — Concierges & routers (claude-code-factory)

| file | lines deleted | defense |
|------|---------------|---------|
| extension-concierge/SKILL.md | 74 (−40 net) | §1A intake pipeline (decision-tree walk, ≥0.85 scenario threshold, keyword fallback `"hook"→hook…default→skill`) → one judgment paragraph; expert-bypass fact and intent-engine pre-classification contract kept. §1B Simple(80%)/Complex(20%) criteria table → judgment sentence; compound→Complex rule kept as pipeline fact. Subagent-generator routing heuristic → registry of the two generators + judgment. §4A tier-aware verbosity table + expert-signal phrase detection → scale-with-judgment sentence; the 4 annotation sections, ~15-line cap, and skip-on-request guardrail kept. §7 expert phrase-detection list → judgment. "Signals:" line removed from output schema. KEPT WHOLE: §5 Review Loop (SPEC→QUALITY, max-3 iterations, circuit breaker, §5G parallel validation), §1C/§2 registries, §1D config facts (model legal values now heuristic-free), §6 error table, §8 install offer, §9 boundaries. |
| extension-guide/SKILL.md | 0 | Pure schema/structure facts (frontmatter requirements, plugin layout, hook events). Nothing judgment-shaped. |
| dev-team-concierge/SKILL.md | 44 (−30 net) | §1 mode-signal table + 10-domain example-trigger table + compound-signal disambiguation steps → three-mode judgment classification pointing at §3's registry; max-2-questions guardrail kept. §2 model-selection rationale table → legal values (`haiku`/`sonnet` default/`opus`/inherit) + judgment. Permission-mode mapping table → legal values + least-privilege fact. Dangling "model selection table" reference in Required Fields repaired. KEPT: field schema, domain-specific fields, §3 reference-file registry, §4 dispatch pipelines, §5 output schemas, §6 quality gate (max-3 iterations), §7 error table. |
| dev-team-guide/SKILL.md | 13 (−2 net) | §1 priority-ordered signal-phrase routing table → 4-intent registry + judgment. §3 disambiguation clue detection (language/framework-mention → this router, CC-internals → extension-guide) → judgment; the single scripted clarifying question kept as interaction guardrail. KEPT: §2 archetype-library contents (registry), §3 domain boundary / out-of-scope facts, §4 frustration routing, frontmatter TRIGGERS. |
| team-configurator/SKILL.md | 158 (−130 net) | §1 25-row config-file→stack detection matrix + 9-step keyword-grep procedure (`react`→React, `django`→Django…) → detect-with-judgment paragraph; read-manifests-not-filenames fact, file-count exclusions, and >1000-file sampling kept. §2 Small/Medium/Large size-category line dropped from output schema. §3 always-include rule, 37-row detection→agent mapping, size-tier team constraints, priority ranking → judgment + preserved facts (72-archetype library pointer, hard cap 8 agents, orchestrator-when-coordination-needed). §4 TQ01–TQ14 stack-match table (duplicate of team-combo-engine's registry) → fact that the engine owns 14 patterns + judgment match. Frontmatter description body edited ("Scans 25+ config file types" advertised the deleted matrix). KEPT: detection output schema, wiring example, scope/write facts, blueprint contract, §5 output schema, §6 error table. |
| setup-explainer/SKILL.md | 0 | Workflow contracts, scan procedure, category schema, output guardrails (max 3 observations, no-jargon rules), error table — all facts. |
| setup-explainer/scan-locations.md | 0 | Pure path/glob/JSON-key registry + scan order. Facts. |
| setup-explainer/explanation-patterns.md | 1 (0 net) | "(O1-O3 are highest value)" ranking crumb → judgment. KEPT: entire file otherwise — plain-English translation dictionaries (event/matcher/scope/mode semantics, exit-2-blocks fact) are definitions=facts per rubric; O1–O15 observation table is a registry of gap types with output templates, not a classifier; max-3 cap is an output guardrail. No beginner/expert tiering found in this file. |
| extension-concierge/teaching-vocabulary.md | 0 | Plain-English definitions and customization pointers — facts per rubric. Model adjectives ("smartest/balanced/fastest") are user-facing definitional glosses, not model-selection heuristics for Claude; kept. No "when to explain what to whom" tiering present. |

**Notes:**
- cross-package references spotted: prior P2 pass already removed extension-concierge's references to the intent-engine decision tree and ≥0.85 scenario threshold (files P1 deleted); grep sweep for `decision tree|≥0.|confidence|classification-trace|threshold|score|User signals|**Trigger**:` across the package is clean (only benign "Frustration Signals" header remains). team-configurator's TQ table duplicated team-combo-engine's pattern registry (other package) — duplicate deleted here, canonical registry untouched.
- resume note: prior executor's uncommitted edits to extension-concierge, dev-team-concierge, dev-team-guide were verified against the rubric and adopted (with one dangling-reference repair in dev-team-concierge); extension-guide, team-configurator, setup-explainer completed fresh this pass.
- verification result: all six SKILL.md files start with `---` and carry `name:` + `description:`; `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` → 19/19 pass, 0 fail.
- package totals vs last commit: 290 lines deleted, 88 inserted (−202 net) across 5 files; no files deleted whole.

### Package 3 — Combo/team engines + registries (claude-code-factory)

| file | lines deleted | defense |
|------|---------------|---------|
| team-combo-engine/team-registry.md | 28 | 14 `**Trigger**:` keyword lines (+ trailing blanks). All 14 entries kept whole: components, models, wiring diagrams, interaction protocols, scaling notes. |
| team-combo-engine/SKILL.md | 4 (+1) | Trigger-phrase matching instruction and TQ08 keyword-fallback routing replaced with the one-sentence judgment instruction; "Trigger phrases" bullet dropped from registry contents list. Slot resolution, blueprint/agent generation, team wiring kept (pipeline contracts). |
| extension-combo-engine/combo-registry.md | 12 | 12 `**Trigger**:` keyword lines. All 12 entries kept whole: components, wiring, install order. |
| extension-combo-engine/SKILL.md | 18 (+3) | Match Quality keyword table (direct/partial/no-match → action) replaced with the one-sentence judgment instruction; error-handling rows deleted: scripted "Ask ONE question" and user-signal `"just give me the [one part]"` mapping; Integration Points: smart-scaffold's Tier-2 keyword-detection bullets and concierge's intent-engine decision-tree sentence deleted (mechanisms of upstream matchers), pass-contracts (what each caller hands over) kept. Kept: custom-combo decomposition procedure, compatibility checks, 1 / 2–4 / 5+ count boundaries (pipeline contracts between smart-scaffold → combo engine → system-architect, not think-budget heuristics), parallelization rules, generator mapping table, wiring patterns. |
| dev-recipes/SKILL.md | 2 (+2) | Frontmatter description advertised the deleted trigger-phrase mechanism; reworded. Frontmatter still parseable; $ARGUMENTS dispatch and execution wiring kept (interface contract). |
| dev-recipes/recipes/core-team.md | 4 | One `Trigger:` keyword line per recipe. Archetype/Pre-resolved/Customize/Quick-start kept (pre-resolved known-good configs = leverage). |
| dev-recipes/recipes/web-frameworks.md | 13 | Same: trigger lines only. |
| dev-recipes/recipes/mobile.md | 6 | Same: trigger lines only. |
| dev-recipes/recipes/data-ml.md | 8 | Same: trigger lines only. |
| dev-recipes/recipes/systems.md | 6 | Same: trigger lines only. |
| dev-recipes/recipes/cloud-infra.md | 7 | Same: trigger lines only. |
| dev-recipes/recipes/devops.md | 6 | Same: trigger lines only. |
| dev-recipes/recipes/universal-experts.md | 4 | Same: trigger lines only. |
| dev-recipes/recipes/domain-specialists.md | 16 | Same: trigger lines only. |
| dev-recipes/recipes/orchestrators.md | 2 | Same: trigger lines only. |
| dev-recipes/recipes/teams.md | 14 | Same: trigger lines only; Components/Pre-resolved/Customize kept. |

**Totals**: 150 lines deleted, 6 added, net −144. Entry counts intact after surgery: 14 TQ patterns, 12 CQ combos, 86 recipes.

**Notes:**
- Cross-package references spotted (not edited, all still valid — my registries kept every entry): `dev-team-concierge/SKILL.md` lines 7/133/153 (invokes team-combo-engine to match/compose patterns), `dev-team-guide/SKILL.md` lines 34/47/63 (routes to dev-recipes and team-combo-engine; its OWN keyword-routing table at line 34 is judgment in another package), `extension-concierge/SKILL.md` line 185 (routes to extension-combo-engine).
- Section 6 of extension-combo-engine/SKILL.md previously described smart-scaffold's and intent-engine's keyword matchers; those descriptions are deleted here, but the matchers themselves live outside this package — whoever owns smart-scaffold/intent-engine should confirm their side.
- No tests/lib/bin reference these files' content (grep clean); no assertions on Trigger lines or recipe counts.
- Verification: all three SKILL.md files start with `---` and contain `name:` + `description:` (checked). `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` → 19/19 pass, 0 fail.

### Package 4 — Generators & diagnostics (claude-code-factory)

| file | lines deleted | defense |
|------|--------------|---------|
| agent-factory/SKILL.md | 74 (74 replaced, net 0) | Prior P4 executor's work, verified complete and adopted: all 72 per-archetype `**Model**: X \|` picks and the tech-lead-orchestrator "Model rationale" line deleted (WHICH model = judgment); one-sentence intent replacement at §3 head. Kept: Tools facts, workflows, schemas, quality gates (objective: YAML parses, kebab-case, legal model values), archetype count table. |
| cc-factory/SKILL.md | 30 | §2 priority-ordered "trigger phrase → extension type" dispatch table deleted (detect-phrase chooser); replaced with one sentence naming the 8 legal types + judgment/confirm. §4.7 tone/format/length/audience user-signal mapping table deleted → one sentence. §4.8 Model row heuristic ("haiku fast/simple, opus complex") → legal values `sonnet\|opus\|haiku\|inherit` + judgment. §4.8 maxTurns complexity tiers (15/25/40) → field fact + judgment. §4.8 Complexity Routing simple-vs-complex criteria → route fact + judgment. KEPT: Three-Part Necessity Gate (WHEN-NOT-TO-USE facts, documented v2.3 infrastructure), §4.1–4.3 schema/field-semantics rows, timeout defaults, system-prompt template. |
| hook-factory/SKILL.md | 11 | §3 "Decision rules" 5-bullet chooser deleted — restated the handler-type facts table directly above it. §2 retitled "Intent-to-Event Mapping"→"Event & Matcher Reference", "first match wins" dispatch framing removed; table rows KEPT (event↔matcher schema facts, incl. which events lack matchers). §4 internal reference updated. |
| skill-factory/SKILL.md | 1 | §3 model row heuristic ("opus for complex reasoning, haiku for fast/simple, sonnet for balanced") → legal values + judgment. Everything else is schema facts, scaffolding templates, objective checklist. |
| mcp-configurator/SKILL.md | 9 | §2 "Decision rules" chooser deleted (restated When-to-Use column) → one intent sentence. §3 Scope Guide "User Says" phrase column dropped; scope→storage-path facts kept. Service→command fact map (§5) untouched. |
| output-style-creator/SKILL.md | 4 | §3 Tone/Format/Length/Audience user-signal→choice rows collapsed to one judgment sentence. Kept schema rows, style templates, paths, checklist. |
| upgrade-scanner/SKILL.md | 1 | §3.1 recommendation tail "— use `haiku` for simple tasks" trimmed (model pick); objective feature-gap check kept. |
| cicd-generator/, plugin-packager/, settings-architect/, extension-installer/ (4 files), extension-auditor/, extension-fixer/ (4 files), doc-sync/SKILL.md | 0 | scanned clean — generation/verification leverage. cicd: platform facts, action versions, flag tables, workflow templates. packager: manifest schema, directory structure, migration algorithm. settings-architect: intent→syntax cookbook = schema facts, path-prefix rules, merge precedence. installer: path lookup tables, deterministic merge strategies, verification tests. auditor: severity-graded but objective schema checks (no subjective point scoring). fixer: 30 deterministic fix templates + symptom→root-cause runbook facts + test-input JSON schemas. doc-sync: sync workflow, objective circuit breaker (<4/7 checked → INCOMPLETE); url-registry.md untouched per instruction. |

**Notes:**
- Resume: prior P4 executor's uncommitted agent-factory edit verified against rubric and adopted unchanged; this log written from final state.
- Cross-package: `subagent-generator` (referenced by cc-factory Complexity Routing) has no agent file in plugins/claude-code-factory/agents/ (only extension-builder.md) and is also referenced by extension-concierge/SKILL.md and extension-combo-engine/SKILL.md (outside P4) — reference kept, existence not arbitrated.
- Cross-package: agent-factory §2 Step 1 still says archetype templates in `cc-ref-agent-archetypes/` carry a "model recommendation" — cc-ref-* is outside P4; if that package strips model recommendations, this extraction line goes stale.
- Factual drift observed (not judgment, left alone): extension-fixer/diagnostic-procedures.md says "10 known events" / common-fixes.md "known 10-event list", while hook-factory and extension-auditor list 18.
- Working tree also had uncommitted edits to dev-team-concierge, dev-team-guide, extension-concierge SKILL.md files — outside P4, untouched.
- Verification: all 14 package SKILL.md files keep `---` fences + `name:` + `description:` + non-empty body (scripted check, 14/14 OK). `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` → 19 tests, 19 pass, 0 fail.

### Package 5 — cc-ref reference sweep (claude-code-factory)

| file | lines deleted | defense |
|------|---------------|---------|
| cc-ref-cicd/SKILL.md | 0 | scanned clean — pure schema/fact reference ("trigger" hits = GitHub Actions/GitLab trigger-event schemas) |
| cc-ref-hooks/SKILL.md | 0 | scanned clean — pure schema/fact reference ("trigger" = PreCompact matcher field name) |
| cc-ref-mcp/SKILL.md | 0 | scanned clean — pure schema/fact reference |
| cc-ref-multi-agent/SKILL.md | 0 | scanned clean — cited distillation of published Anthropic guidance (three-part gate, token multipliers, eight principles all carry named sources); the decision frameworks ARE the documented reference payload, not routing scaffolding grafted onto a skill |
| cc-ref-output-styles/SKILL.md | 0 | scanned clean — pure schema/fact reference |
| cc-ref-permissions/SKILL.md | 0 | scanned clean — pure schema/fact reference |
| cc-ref-plugins/SKILL.md | 0 | scanned clean — pure schema/fact reference (`keywords` = plugin.json manifest field) |
| cc-ref-settings/SKILL.md | 0 | scanned clean — pure schema/fact reference |
| cc-ref-skills/SKILL.md | 0 | scanned clean — pure schema/fact reference ("trigger phrases" line documents the platform fact that the description field drives auto-loading) |
| cc-ref-subagents/SKILL.md | 0 | scanned clean — pure schema/fact reference; contains the rubric's explicit keep-case (legal model values sonnet\|opus\|haiku\|inherit as frontmatter fact) |
| cc-ref-agent-archetypes/SKILL.md + 10 domain files | 0 | scanned clean — archetype catalog; all keyword hits are domain facts inside system-prompt template payload (Unix signals, SRE golden signals, CVSS scores, cyclomatic complexity, log-storage tiers, F1/confidence intervals, GraphQL complexity limits) |
| cc-ref-agent-workflows/SKILL.md + 7 pattern files | 0 | scanned clean — workflow-pattern catalog; hits are domain facts/formulas in template payload (retrain triggers, z-scores, S/M/L defined by file count = column schema definition) |

**Notes:**
- Scan method: mandated grep (`trigger|signal|if the user says|tier|score|confidence|beginner|complexity`) across all 30 files, plus supplemental sweeps for model-selection heuristics (`use haiku|sonnet for|opus for|model.*select`) and phrase-routing scaffolding (`user signals|if you hear|phrases like|keyword`). Zero "User signals:" lines, zero phrase→choice mapping tables, zero confidence thresholds governing skill behavior found anywhere in the package.
- Files edited: none. Deletions: 0 (expected verdict confirmed).
- Frontmatter check: all 12 SKILL.md files non-empty with parseable `---` fences + `name:` + `description:` — PASS.
- Verification: `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` from repo root — 19 tests, 19 pass, 0 fail.

### Package 6 — mcp-ecosystem + local skills

| file | lines deleted | defense |
|------|---------------|---------|
| plugins/claude-mcp-ecosystem/skills/subagent-concierge/SKILL.md | 140 (−92 net; incl. prior P6 run, verified + finished) | Deleted: 5-signal inference engine (extension→template + dependency→inference tables), confidence scoring (`+30`, `80+ →` tiers), scripted Q1–Q3 question bank, 7-rule decision engine (model/tool/memory-scope heuristics), demo-mode template→task table, wave-numbered progressive deployment, expert-mode keyword sniffing. Replaced each with one-sentence judgment intent. Kept: pipeline contract (architect → scaffolder + seeder → validator, Phases A–E whole), self-heal phase, maxTurns cap, "max 3 questions"/plain-English guardrails, error-handling table, frontmatter TRIGGERS/REFUSES. Fact edits verified against repo: templates really live at `subagent-lifecycle/templates/` and count 6 YAMLs. My additions: scrubbed 2 leftover "inference engine"/"decision engine" references (lines 74, 122). |
| plugins/claude-mcp-ecosystem/skills/project-guide/SKILL.md | 97 (−77 net) | Deleted: silent complexity watcher (`IF total files > 50 AND domain directories > 3`), frustration-signal phrase list, STEP A/B/C keyword routing tree, expert-hatch keyword list, `< 3 concerns` thresholds, TRIGGER TEST MATRIX (worked examples of deleted phrase-routing + "80% or more" firing threshold), description-body threshold advertisement. Kept: state check wiring (`.claude/agents/`, `.claude/project-health.md`), suggestion guardrails (one per session, never first session, never during urgent work, cooldown on decline), suggestion/decline message templates, invisible-delegation guardrail, cross-session state schema, error handling, relationship table, MANIFEST. |
| plugins/claude-mcp-ecosystem/skills/subagent-companion/SKILL.md | 19 (−2 net) | Deleted: "Trigger Pattern" phrase→operation column from the classification table (kept the 8-operation Operation→Action FACT list per brief); Check 4 staleness day-count tiers (30+/90+ days) replaced with one judgment sentence preserving the mechanism (timestamp check), both actions (suggest / remove clearly-abandoned), and log+inform guardrails. Kept whole: self-healing preflight Checks 1–3 (structural repair facts), 200-line memory fact + prune recipe, `model: haiku`/`disallowedTools` auditor line (verified as wiring fact in subagent-lifecycle/agents/auditor.md frontmatter), output templates, universal error format, one-suggestion rule, MANIFEST. |
| plugins/claude-mcp-ecosystem/skills/mcp-catalog/SKILL.md | 18 (−16 net) | Deleted: all 6 "User signals:" lines, "Detection Rules for the Concierge" section (phrase→MCP mappings), "maps user-described capabilities" mechanism advertisement in description + body intro. Kept: every server name/capability/config block, frontmatter `mcpServers` example, "never add MCPs speculatively" + capability-gap guardrail sentences (folded into Configuration section). |
| plugins/claude-mcp-ecosystem/skills/frontmatter-reference/SKILL.md | 2 (−2 net) | Deleted: "Use haiku for pattern-matching… Use sonnet for most creation…" model-selection heuristic sentences. Kept: FACT of legal values (`sonnet, haiku, opus, inherit`, default `inherit`) and the entire remaining schema (memory paths, permissionMode values, maxTurns cap documentation, isolation/background facts). |
| plugins/claude-mcp-ecosystem/skills/agent-design-patterns/SKILL.md | 0 | Confirmed leverage. The 7 archetypes are pattern DEFINITIONS (purpose/tools/model/examples bundled as named reference knowledge), not scripted classifiers — no scores, no keyword mappings. Composition examples are pattern knowledge, not demonstrations of a deleted classifier. |
| plugins/claude-mcp-ecosystem/skills/workspace-lifecycle-ref/SKILL.md | 0 | Confirmed leverage: command tables, branching conventions, state-file schema, health indicators — all environment facts. |
| .claude/skills/SKILL.md | 0 | Confirmed leverage: grep-based signal gathering methodology, 200-line/25KB platform caps, scope→directory table (explicitly on preserve list), error-handling guardrails. Byte-identical to dream-memory-consolidation copy; NOT deduplicated (out-of-scope per brief). |
| .claude/skills/dream-memory-consolidation/SKILL.md | 0 | Same as above (identical copy). |
| .claude/skills/_MANIFEST.md + dream-memory-consolidation/_MANIFEST.md | 0 | Provenance records (version history, past Gate 2 audit scores) — records of a past audit, not runtime decision procedures. |

**Notes:**
- **Cross-package references spotted (NOT edited — outside P6):** stale mentions of the deleted concierge "inference engine" / mcp-catalog "detection rules" remain in `plugins/claude-mcp-ecosystem/architecture.md` (lines ~271, ~300), `plugins/claude-mcp-ecosystem/subagent-lifecycle/docs/architecture.md` (~58), `plugins/claude-mcp-ecosystem/subagent-lifecycle/agents/architect.md` (~28), `plugins/claude-mcp-ecosystem/commands/agent-setup.md` (~23, ~27), and a full duplicate catalog with its own "Detection Rules" section at `plugins/claude-mcp-ecosystem/subagent-lifecycle/references/mcp-catalog.md`.
- `skill-factory` references in project-guide verified valid (`plugins/claude-code-factory/skills/skill-factory/` exists) — left intact.
- MANIFEST `forge_gate_scores` blocks in the three orchestration skills left in place: records of a past skill-forge audit (provenance metadata), not runtime scoring rubrics.
- Prior P6 executor's uncommitted concierge edits reviewed line-by-line against the rubric: all deletions rubric-compliant, both fact corrections (template path `subagent-lifecycle/templates/`, count 7→6) verified against the actual directory. Adopted; finished the 2 missed references.
- **Verification result:** all 9 SKILL.md files keep `---` fences + `name:` + `description:` (scripted check: 9/9 PASS, none empty); package grep for judgment markers (User signals / Detection Rules / Trigger Pattern / inference engine / decision engine / TRIGGER TEST) returns clean; `node --test tests/plugin-loading.test.cjs tests/integ-plugin-ecosystem.test.cjs` → **19/19 pass, 0 fail**.
- Net: 87 insertions, 276 deletions (−189 lines) across 5 edited files; no files rm'd; no git mutations performed.

## DEFERRED

### Core track
- [core] `recordExecution()` has no production writer — kept per locked decision, but nothing ever records an execution (`gsd-tools history` has no `record` subcommand). Wire a writer (execute-phase) or delete the recorder: operator call.
- [core] `detectPatterns()` survives as a sensor for `history stats`, but its `recommended_tier: 'quality'` field is a one-word encoded judgment in the display. Strip vs keep-as-advisory: operator call.
- [core] Leftover `routing_strategy`/`adaptive` keys in existing user config.json files stay inert (no config_version 3 migration). Cleanup migration: operator call.
- [core] model-profiles.cjs ↔ references/model-profiles.md dual source of truth (flagged in the code's own header) — out of surgery scope.
- [core] The 12 new workflow frontmatter descriptions are new human-authored routing data — review wording before merge; they are now the model's routing signal.
- [orchestration] tests/perf/routing-benchmark.test.cjs deletion (core commit 4 material) rode into skills commit b730f8d via the shared git index — history blemish only, content correct.
- [orchestration] ROADMAP Phase 59 success criterion 4 says "the /gsd:do routing table includes the ship-milestone row" — the table no longer exists; re-point at the do-registry (frontmatter on ship-milestone.md) when Phase 59 plans. *(RESOLVED 2026-07-15, Phase 59: criteria re-pointed at registry semantics; ship-milestone.md carries the frontmatter.)*
- [orchestration] Whole-directory deletion of intent-engine / smart-scaffold / project-guide — ~90% judgment by content, but dirs are load-bearing (frontmatter skills: lists, non-empty-SKILL.md tests). Gutted this pass; full removal is an operator call.
- [orchestration] Stale cross-refs to deleted mechanisms in non-skill docs: plugins/claude-mcp-ecosystem/{README.md,architecture.md}, subagent-lifecycle/{docs/architecture.md,agents/architect.md,references/mcp-catalog.md}, commands/agent-setup.md — deferred doc-sync, not chased in this pass.
- [orchestration] Duplicate .claude/skills/SKILL.md vs .claude/skills/dream-memory-consolidation/SKILL.md (byte-identical) — hygiene, out of bitter-lesson scope.
- [routing-eval 2026-07-15] `gsd:discuss-phase` description's "--auto skips questions, Claude picks recommended defaults" sentence overlaps `workflow:smart-discuss`'s purpose — blind judge correctly asked instead of picking (eval id 8). Description-quality fix or accept: operator call. Gate passed 24/25 (96%) after operator ratified registry-honest labels for gsd:fast/gsd:note (tests/routing/EVAL-2026-07-15.md).

### Skills track (from package fragments)
- [pkg-1] plugins/claude-code-factory/skills/intent-engine/SKILL.md : `intent-resolution:` YAML handoff schema (lines ~117-148, incl. `confidence: high|medium|low` and `classification-trace` with `tree-path`/`signals` example values) : cross-package contract with extension-concierge, owned by another executor — left byte-identical per instructions, even though the trace example values now describe a deleted mechanism.
- [pkg-2] extension-concierge/SKILL.md : §1A "Requests routed from the intent-engine may arrive pre-classified — respect that classification" (line 39) and §3 Tier 3 "any resolved context from the intent engine" (line 180) : cross-package contract with intent-engine's intent-resolution output (P1 territory); left in place per instruction.
- [pkg-2] extension-concierge/SKILL.md : §3 tier labels "Tier 2 (2-4 coordinated extensions)" / "Tier 3 (5+)" : borderline — reads as capability boundaries of extension-combo-engine and system-architect (which component handles what scale) and as wiring with smart-scaffold's classification (other package). Kept as pipeline wiring facts, not deleted as tier classifiers.
- [pkg-2] extension-concierge/SKILL.md : frontmatter `skills: intent-engine` preload : cross-package dependency; intent-engine SKILL.md still exists post-P1, left intact.
- [pkg-3] team-registry.md : Slot Resolution blocks (TQ04, TQ08, TQ09, TQ10, TQ11, TQ13, TQ14) : left in place. Shaped like keyword→choice maps ("Django" → `django-backend`), but they document which archetypes exist to fill each parameterized slot — non-derivable catalog facts ("React" → `react-components`, "Embedded" → `embedded-systems-expert`), i.e. registry components. Judged leverage, not routing; flagged here so the orchestrator can overrule.
- [pkg-3] extension-combo-engine/SKILL.md frontmatter : `Triggers on: ...` list in description : preserved per rubric (frontmatter name/description/TRIGGERS are parseability/discovery load-bearing).
- [pkg-5] cc-ref-agent-archetypes/orchestrators.md : team-configurator system-prompt template, lines 139-143 (project-size → agent-count guidelines) and line 161 ("haiku for simple tasks, sonnet for standard, opus for orchestration") : literal tier/model-selection heuristics, but they sit INSIDE the fenced archetype template that agent-factory copies into generated agents — in the reference frame they encode WHAT the archetype is (catalog payload, same class as "example documenting a schema"); in the generated-agent frame they preempt downstream model choice. Two-frame ambiguity → left in place per rubric ("ambiguous → DEFERRED, never guess").

## Totals

Measured via `git diff c4d04ab..HEAD` at Wave-2 reconcile (2026-07-15), before this closing commit:

- **Overall: 84 files changed, 654 insertions, 4,773 deletions — net −4,119 lines.**
- Core track (get-shit-done/, commands/, tests/, docs/): −2,467 net (2,748 del / 281 ins) across 34 files.
- Skills track (plugins/, .claude/skills/): −1,665 net (2,024 del / 359 ins) across 49 files; 22 of 47 SKILL.md files edited, 9 pure-judgment support files deleted whole, 25 SKILL.md files confirmed clean (leverage) with zero edits.
- Test suite: 2,969 → 2,862 assertions (−107), 586 → 570 suites (−16), 0 failures. Coverage 91.76% → 91.78% (flat), all modules ≥80%, model-profiles.cjs and security.cjs at 100%.
- Registry: `gsd-tools do-registry` emits 78 entries (66 commands + 12 workflows), byte-identical across runs.
- Gates at close: check-doc-drift 23/23 exit 0; validate-doc-links clean (CI excludes); cross-ref scrub clean; frontmatter 47/47 parseable; plugin manifests parse.
