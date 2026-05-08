# Phase 57: Backfill and CI Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 57-backfill-and-ci-integration
**Areas discussed:** Backfill scope + repair strategy, Exemption mechanism for intentional broken refs, CI step structure, Failure mode

---

## Pre-discussion: scout findings (sets the gray-area framing)

Run of `node scripts/validate-doc-links.cjs` against the live repo:
- **109 broken refs total**
- 83 archived-roadmap cross-refs (`.planning/milestones/v*-ROADMAP.md` cross-references using `milestones/v1.x-ROADMAP.md` prefix that no longer resolves from inside `milestones/`)
- 9 anchor issues
- 3 intentional template/example refs (`.claude/skills/SKILL.md`, `.claude/skills/dream-memory-consolidation/SKILL.md`, `.planning/REQUIREMENTS.md` line 14)
- 3 intentional test fixtures in `tests/fixtures/doc-links/{broken,edge}/`
- 1 regex example in `.planning/milestones/v2.7-phases/54-automated-uat-runner/54-03-PLAN.md` line 278
- 6 real broken in `docs/README-technical.md` (assets/terminal.svg, docs/USER-GUIDE.md, docs/workflow-discuss-mode.md, docs/governance-customization.md, LICENSE, USER-GUIDE.md#configuration-reference)
- 3 i18n placeholders in `docs/README.md` (pt-BR, ja-JP, zh-CN README.md)
- 1 archived ref in `.planning/milestones/archived-phases/02-coverage-audit/02-VERIFICATION.md` (coverage-baseline.md)

Run of `node scripts/check-doc-drift.cjs` against the live repo:
- **Clean**: 23/23 numeric claims match across CLAUDE.md, README.md, docs/DEVOPS-HANDOFF.md.

DOCREF-01 / DOCREF-02 grep:
- Both named docs (`docs/health-reports/full-audit-2026-04-11.md` and `.planning/codebase/STRUCTURE.md`) **exist on disk**.
- Validator reports zero broken refs to either path.
- Only mentions are descriptive (REQUIREMENTS.md / ROADMAP.md / tasks/todo.md describing the requirement) and template/workflow descriptions (`get-shit-done/templates/codebase/structure.md`, `get-shit-done/workflows/map-codebase.md`).

This reframes the phase: real work is the **109 broken refs the validator finds**, not the 2 docs the requirements name (which already pass).

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Backfill scope + repair strategy | What gets fixed: just DOCREF-01/02, archived sweep, real broken, or all three | ✓ |
| Exemption mechanism for intentional broken refs | --exclude flag, hardcoded skip, or .docslinkignore | ✓ |
| CI step structure (placement, matrix, coverage flow) | Which job runs what, on which matrix combos | ✓ |
| Failure mode: strict-block vs ratchet | Day-1 blocking or warn-first | ✓ |

**Operator selected all four areas for discussion.**

---

## Area 1: Backfill scope + repair strategy

### Q1: How aggressive should the backfill be?

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive: drive validator to 0 broken refs | Sweep-fix archived, fix real broken, exempt intentional via (B). Ships day-1 strict-blocking. | ✓ |
| Pragmatic: fix archived sweep + DOCREF-01/02, defer the rest | Mechanical sweep + literal req cleanup. CI ships ratchet-mode. Risk: another phase. | |
| Strict literal: fix only DOCREF-01/02 as written | Near no-op since refs aren't broken. CI cannot block (109 remain). Not recommended. | |
| Comprehensive + delete archived refs entirely | Same as (1) but delete cross-ref sections. Lower long-term maintenance. Loses navigability. | |

**User's choice:** Comprehensive: drive validator to 0 broken refs.

**Notes:** Pairs with the day-1 strict-block decision in Area 4 — comprehensive backfill makes ratcheting unnecessary.

---

### Q2: How should the 83 archived-roadmap cross-refs be repaired?

| Option | Description | Selected |
|--------|-------------|----------|
| Sed-sweep prefix removal | Replace `(milestones/v` → `(v` and `]: milestones/v` → `]: v` across `.planning/milestones/v*-ROADMAP.md`. Lowest blast radius, preserves navigability. | ✓ |
| Delete archived cross-ref sections | Strip the "Previous Milestones" navigation block. Smaller diff long-term. Loses inter-milestone nav. | |
| Replace with absolute paths from repo root | `/.planning/milestones/v1.0-ROADMAP.md`. Works from any depth but inconsistent with relative-link convention. | |

**User's choice:** Sed-sweep prefix removal.

**Notes:** Pure mechanical fix. Reviewer can confirm the diff is purely path-prefix removal across the listed files.

---

### Q3: How should DOCREF-01/02 be interpreted?

| Option | Description | Selected |
|--------|-------------|----------|
| Mark complete via clarification in CONTEXT/SUMMARY | Validator confirms zero broken refs to either path. Mark complete with evidence (validator output, file existence). Honors requirement intent without busy-work. | ✓ |
| Strip descriptive references from REQUIREMENTS / ROADMAP / todo | Take "zero references in repo" literally. Awkward — the requirement description loses specificity. | |
| Move both docs to confirm relocation, repair refs | Actually relocate and fix refs. More disruptive than the requirement implies. | |

**User's choice:** Mark complete via clarification in CONTEXT/SUMMARY.

**Notes:** 57-SUMMARY.md will embed validator output as proof. Pattern generalizes to future "no broken X" requirements.

---

### Q4: How should the ~10 real broken refs in docs/README-technical.md and docs/README.md be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Repair where target exists, remove ref where target is gone | Case-by-case audit of assets/terminal.svg, docs/USER-GUIDE.md, etc. README.md i18n refs removed or stub-created. | ✓ |
| Bulk-remove all 10 refs | Faster but loses context. Reader sees content without nav links. | |
| Defer to a follow-up phase | Phase 57 ships archived-sweep + CI gates only. Contradicts Q1 (Comprehensive). | |

**User's choice:** Repair where target exists, remove ref where target is gone.

**Notes:** Specific items enumerated in CONTEXT.md D-04. i18n placeholders likely removed (no translations planned).

---

### Q5: For the 9 anchor issues, repair strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| Repair anchors to existing headings | Find closest matching heading, rewrite anchor or rename heading. Fixes intent, no link removal. | ✓ |
| Drop the anchor part, keep file ref | Convert `[text](file.md#section)` → `[text](file.md)`. Loses precision but always resolves. | |
| Audit the 9 individually now and decide per-case | Read each in context during execution. Slowest but highest fidelity. | |

**User's choice:** Repair anchors to existing headings.

**Notes:** Of the 9 anchor issues, 6 originate inside `tests/fixtures/doc-links/` and validator self-tests — those are exempted via Area 2's `--exclude` mechanism, not repaired. Real repairs apply to 3.

---

## Area 2: Exemption mechanism for intentional broken refs

### Q1: Which exemption mechanism?

| Option | Description | Selected |
|--------|-------------|----------|
| Add --exclude <glob> CLI flag (multi-value) | Validator gains `--exclude` flag. CI passes the list. Most flexible, no in-validator policy. | ✓ |
| Hardcode tests/fixtures/ skip into validator | Always skip `tests/fixtures/`. Simpler but adds policy to a generic tool. Doesn't help with templates. | |
| Wrap template examples in code fences + .gitignore fixtures | Wrap examples in ```` ``` ````. Move test fixtures behind .gitignore. Higher disruption. | |
| Combination: --exclude flag for fixtures, code-fence the template examples | Cleanest separation but two mechanisms to learn. | |

**User's choice:** Add --exclude <glob> CLI flag (multi-value).

**Notes:** Single mechanism, validator stays generic, exemption is a CI-call-site policy.

---

### Q2: How should --exclude match paths?

| Option | Description | Selected |
|--------|-------------|----------|
| Gitignore-style globs (** for any dir, * for path segment) | Match `tests/fixtures/doc-links/**` recursively. Familiar to devs, hand-rollable. | ✓ |
| Plain prefix match (no glob expansion) | `--exclude tests/fixtures/doc-links/` — string-prefix match. Simplest, least flexible. | |
| Full regex | `--exclude '^tests/fixtures/.*'`. Most expressive, least friendly. | |

**User's choice:** Gitignore-style globs.

**Notes:** Hand-rolled `gitignoreGlobToRegex(pattern)` converter. Zero-dep, mirrors validator's existing style.

---

### Q3: Where should the exclude list live for CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Pass via CLI flag in test.yml step | CI step has `node scripts/validate-doc-links.cjs --exclude X --exclude Y`. Easy to read, easy to evolve. | ✓ |
| Hardcoded default exclude list inside validator | DEFAULT_EXCLUDES = [...] in validator. Pro: local runs are clean too. Con: bakes policy into a generic tool. | |
| Read from .docslinkignore file at repo root | Like .gitignore. Standard pattern but another file to maintain. | |

**User's choice:** Pass via CLI flag in test.yml step.

**Notes:** `.docslinkignore` deferred to a future phase if multiple call sites need DRY.

---

## Area 3: CI step structure (placement, matrix, coverage flow)

### Q1: Where should drift detector run in CI?

| Option | Description | Selected |
|--------|-------------|----------|
| In `test` job, only ubuntu-latest/22 leg, after coverage step | Drift after `npm run test:coverage:full`. Single matrix combo. Drift is platform-independent. | ✓ |
| In `test` job, all 3 matrix combos | Drift runs in every leg. Wasteful — drift output identical across OS/Node. | |
| New `docs-integrity` job, download coverage artifact | Separate job. Adds CI plumbing for marginal gain. | |

**User's choice:** In `test` job, only ubuntu-latest/22 leg, after coverage step.

**Notes:** `if: matrix.full_suite && matrix.os == 'ubuntu-latest' && matrix.node-version == 22`. Reuses pattern at lines 54-66 of test.yml.

---

### Q2: Where should link validator run?

| Option | Description | Selected |
|--------|-------------|----------|
| New `docs-integrity` job, single ubuntu/22, parallel with `test` | Lightweight. Runs in parallel — doesn't block on tests. Distinct branch-protection check. | ✓ |
| In `test` job, ubuntu/22 leg only, before tests | Faster fail-fast on doc breakage. Couples doc gate to test infra. | |
| In `governance` job, alongside the existing shell tests | No new job. Mixes concerns (governance uses python). | |

**User's choice:** New `docs-integrity` job.

**Notes:** Single runner, no matrix, parallel with `test` and `governance`. Signals stay readable separately.

---

### Q3: Branch-protection — should `docs-integrity` be added as a required status check?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add `docs-integrity` to required checks (now 5 instead of 4) | Operator runs `gh api ... -X PATCH`. Satisfies DOCCI-03 directly. | ✓ |
| No — rely on `test` job failing if docs-integrity fails (via job dependency) | Slows critical path. Branch protection still only checks test/governance. | |
| Phase 57 ships workflow only; branch-protection update is a separate operator action documented in SUMMARY | Defers the gh API call to ship time. Acceptable but means non-blocking until that call runs. | |

**User's choice:** Yes — add `docs-integrity` to required checks.

**Notes:** Branch-protection PATCH timing is operator-invoked at ship time per CONTEXT.md D-13 (safer than workflow-invoked PATCH; no admin-PAT exposure in CI).

---

### Q4: Should drift detector also run on push to main (not just PR)?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same triggers as test job (push to main + PR + workflow_dispatch) | Inherits existing trigger pattern. Captures direct-main drift. | ✓ |
| PR only | Cheaper but main can drift undetected. | |

**User's choice:** Yes — same triggers as test job.

**Notes:** Consistent with existing CI culture. Branch protection makes direct main pushes rare anyway, but admin-merge or hotfix flow is still possible.

---

## Area 4: Failure mode (strict-block vs ratchet)

### Q1: Failure mode for the new CI gates on day 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict-block from day 1 | Backfill clears existing issues. Both gates ship blocking immediately. | ✓ |
| Ratchet: warn-only first PR, blocking after | `continue-on-error: true` initially. Risk of forgetting to flip. | |
| Link validator strict, drift detector ratchet | Drift harder to verify in CI. Hedges against CI-only surprises. Split policy. | |

**User's choice:** Strict-block from day 1.

**Notes:** Pairs with the comprehensive backfill choice from Area 1. Comprehensive backfill brings repo to validator-clean before the workflow change merges, so the first PR after merge sees a green gate.

---

### Q2: How should exit code 2 (runtime error) be treated?

| Option | Description | Selected |
|--------|-------------|----------|
| Treat exit 2 same as exit 1 (block merge) | Any non-zero fails the step. Matches DOCCI-03 verbatim. | ✓ |
| Treat exit 2 as warning (skip block, surface in logs) | `if: failure() && steps.drift.outcome == '...'`. More complex CI; risks masking real drift. | |

**User's choice:** Treat exit 2 same as exit 1.

**Notes:** Operator investigates by reading the step output — the validator's error messages are explicit (`coverage data missing or stale — run 'npm run test:coverage' before check-doc-drift.cjs`).

---

## Claude's Discretion

The following implementation details are left to the planner / executor judgment:

- Wrapping REQUIREMENTS.md line 14 example in inline backticks vs adding to `--exclude` (CONTEXT.md D-08).
- Exact regex used for the gitignore-glob converter (Phase 55's hand-rolled style applies).
- Step naming in `test.yml` (e.g., `Run drift detector` vs `Validate documentation drift`).
- Whether to stub-create `pt-BR/`, `ja-JP/`, `zh-CN/` README.md placeholders or remove the i18n links.
- Internal helper organization in the validator's new `--exclude` code path.

---

## Deferred Ideas

Captured during discussion as out-of-scope but worth preserving:

- `.docslinkignore` repo-local config — out of v2.8 scope; CI-step list is single source of truth for now.
- Hardcoded `DEFAULT_EXCLUDES` inside the validator — explicitly rejected (adds policy to generic tool).
- Negation patterns (`!path/**`) in `--exclude` — not needed for current 4-pattern use case.
- Workflow-invoked branch-protection PATCH — rejected (security exposure via admin PAT in CI secrets).
- Drift detector running on full matrix — rejected (single-leg gating is sufficient).
- README badge for docs-integrity status — nice-to-have, post-ship if desired.
- Stub-creating i18n README placeholders (pt-BR, ja-JP, zh-CN) — separate i18n phase if translations are planned.
- Test fixtures moved to non-default-scanned path — minor cleanup, not blocking.
