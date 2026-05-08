---
phase: 56
reviewers: [gemini, codex]
reviewed_at: 2026-05-08T13:00:00Z
plans_reviewed:
  - 56-01-PLAN.md
  - 56-02-PLAN.md
  - 56-03-PLAN.md
notes: |
  Claude CLI skipped — running inside Claude Code, skipping the runtime CLI
  preserves reviewer independence per the workflow contract.
---

# Cross-AI Plan Review — Phase 56

Two independent AI systems reviewed plans 56-01, 56-02, and 56-03 against the locked decisions in CONTEXT.md (D-01..D-18), the regex shapes and Validation Architecture in RESEARCH.md, and the DOCDRIFT-01..05 requirements.

---

## Gemini Review

### Summary
The three plans for Phase 56 are exceptionally thorough, well-structured, and demonstrate a deep understanding of the project's conventions and constraints. They follow a logical TDD progression from pure functions to I/O integration and finally to real-world acceptance testing. The plans proactively mitigate risks, maintain strict scope discipline, and are built on a foundation of detailed research, resulting in a high-quality, low-risk, and executable strategy.

### Strengths
- **Rigorous TDD Approach:** The three-wave structure (56-01: Pure Functions, 56-02: I/O & Integration, 56-03: Real-Repo Acceptance) is a robust pattern that isolates complexity and de-risks implementation.
- **Consistency with Project Patterns:** The plans explicitly reuse successful architecture and testing patterns from the preceding Phase 55, ensuring codebase consistency and leveraging proven solutions.
- **Proactive Risk Mitigation:** Potential issues are identified and addressed within the plans. Key examples include using a `test-stats.json` fixture to bypass slow test runs during integration testing and providing a `--coverage-stale-secs 0` flag to reduce local development friction.
- **Exceptional Verifiability:** The `must_haves` for each plan are granular, objective, and written as executable shell commands, making progress verification unambiguous and automatable.
- **Excellent Scope Discipline:** The plans adhere strictly to the five DOCDRIFT requirements. The Deferred Ideas section in the context documents is a clear indicator that scope creep is being actively managed.
- **Data-Driven Planning:** The plans are based on concrete research, including pre-validated regexes for claim extraction and a confirmed list of existing drift, which provides a clear definition of success for the final wave.

### Concerns
- **[LOW]** The `measureTestCounts` function in Plan 56-02 relies on parsing TAP output from `err.stdout` when the test process exits non-zero. If the test runner fails catastrophically before generating a TAP summary (e.g., due to a syntax error in a test file), `err.stdout` could be empty. The `parseTapSummary` function should be resilient to this, which the Wave 1 test plan already ensures.
- **[LOW]** The `measureSkillCount` implementation in Plan 56-02's action description is slightly vague (`glob plugins/*/skills/*/`). However, the detailed implementation provided in the plan's `<interfaces>` and `<action>` sections is precise and correct, using nested `readdirSync` calls to ensure only directories are counted. This is a minor clarity issue in the description, not a flaw in the specified implementation.

### Suggestions
- For Plan 56-02, Task 2: When implementing `measureTestCounts`, explicitly confirm the `catch` block handles cases where `err.stdout` is undefined or empty, returning `{ tests: 0, suites: 0 }`. This will make the function maximally robust.
- For Plan 56-03, Task 2: When updating the living docs, consider adding a comment near the updated values (where appropriate, e.g., in a table's Markdown source) like `<!-- GSD-SYNC-TARGET:test_count -->`. This is out of scope for the current plan but could be a valuable enhancement for a future `gsd:sync-docs` command to make updates even more reliable. This is a forward-looking thought, not a critique of the current plan.

### Risk Assessment
**LOW.** The implementation risk is minimal. The plans are meticulously detailed, based on prior art within the project, and follow a sound, incremental development process. The scope is narrow and well-defined. Success criteria are objective and tied directly to verifiable artifacts and command outputs. The most significant risks (regex fragility, test performance, developer friction) have already been identified and effectively mitigated in the planning stage.

### Focus Areas
1. **DOCDRIFT-01..05 coverage:** Yes, the plans comprehensively cover all five requirements. Each requirement is mapped to specific tasks, functions, and verification steps across the three waves.
2. **Regex robustness:** The regexes are robust. By anchoring them to surrounding contextual text (e.g., `**Scale**:`, `| Test assertions |`) and handling comma-formatted numbers, the risk of false positives is very low. The detailed inventory in the research phase minimizes the risk of false negatives.
3. **`node --test` reliability:** The approach is reliable. The plans confirm TAP output stability across target Node versions (20/22) and correctly implement cross-platform file discovery to avoid shell-dependency issues.
4. **Coverage-staleness friction:** This is well-managed. The 1-hour default is a sensible guard for CI, while the explicit error message and the `--coverage-stale-secs 0` escape hatch provide developers with the necessary control to avoid local friction.
5. **Wave dependencies:** The dependencies are correct: Wave 1 (pure functions) is independent, Wave 2 (I/O) depends on Wave 1, and Wave 3 (acceptance) depends on the completed script from Wave 2.
6. **Over-engineering/scope creep:** There is no evidence of over-engineering. The plans stick to the zero-dependency constraint, reuse existing patterns, and explicitly defer numerous related features (e.g., checking more docs, auto-fixing) to future phases.
7. **Translation of D-01..D-18:** The plans are an exemplary translation of the 18 locked decisions from CONTEXT.md into concrete, actionable tasks. Every decision, from the script's architecture (D-01) and exit codes (D-15) to the JSON output envelope (D-13), is correctly reflected in the implementation and verification steps.

---

## Codex Review

### Summary
The three-wave plan set is strong, largely complete, and closely aligned with Phase 55 patterns and the locked Phase 56 decisions. It should deliver a working detector with test coverage, CLI behavior, and real-repo validation. Main risks are around regex brittleness over time, TAP output handling under large stdout, and a few places where fixture convenience logic could hide production failure modes if not bounded carefully.

### Strengths
- Clear wave decomposition: pure-function TDD (56-01), integration wiring (56-02), real-repo acceptance/docs (56-03).
- Excellent requirement traceability to DOCDRIFT-01..05 with explicit test mapping.
- Strong reuse of proven sibling architecture (`validate-doc-links.cjs`) reduces design risk.
- Good output contract discipline (table + JSON envelope + exit codes 0/1/2).
- Explicit handling of numeric normalization (`stripCommas`) and percent tolerance (`±0.01`).
- Real-repo drift capture before fixes is a strong acceptance pattern, not just fixture-only validation.

### Concerns
- **[MEDIUM]** `measureTestCounts` uses `execFileSync` TAP capture without explicit `maxBuffer`; large TAP output can trigger buffer errors in bigger suites.
- **[MEDIUM]** Regexes are anchored but still text-fragile; small doc wording changes can silently create false negatives.
- **[MEDIUM]** `extractClaims` line-by-line matching may miss claims if formatting wraps across lines.
- **[LOW]** In 56-02 `main()` skips missing target docs for fixture convenience; that behavior should be explicitly gated for fixtures to avoid masking real repo issues.
- **[LOW]** 56-03 has heavy repeated full-suite/coverage runs; operationally expensive but not functionally wrong.

### Suggestions
- Add `maxBuffer` to `execFileSync` in **56-02 Task 2 (`measureTestCounts`)** to prevent TAP truncation/buffer failures.
- In **56-02 Task 2 (`main`)**, enforce missing living docs as exit `2` for normal repo runs; allow skip only under fixture-root mode (or explicit flag).
- In **56-01 Task 3 (`extractClaims`)**, consider whole-file regex scan with index-to-line mapping for multiline resilience while preserving line reporting.
- In **56-01 METRICS tests**, add a guard test that fails if any metric intended to be enforced has `claims.length === 0` unexpectedly (except explicitly allowed `branch_coverage`/`function_coverage`).
- In **56-03 Task 2**, add one negative check ensuring newly added `check-doc-drift` documentation lines do not accidentally match claim regexes.
- In **56-02 Task 1/2**, add a test for TAP spawn failure path (non-zero test run but parseable TAP) to ensure robust behavior.

### Risk Assessment
**Overall risk: MEDIUM.** The implementation strategy is solid and highly executable, with strong TDD and acceptance rigor. Risks are mostly maintenance/robustness concerns (regex drift, TAP buffering, and fixture-vs-real behavior boundaries), not foundational architecture problems. With a few hardening tweaks in Wave 2, this can be reduced to LOW.

### Focus Areas
1. **DOCDRIFT-01..05 coverage:** Yes, plans fully cover all five requirements with both unit and integration evidence, plus real-repo acceptance in 56-03.
2. **Regex robustness:** Good contextual anchoring, but medium long-term false-negative risk from doc wording/layout drift; multiline handling is a gap.
3. **`node --test --test-reporter=tap` reliability (Node 20/22):** Approach is valid and consistent with research; add `maxBuffer` hardening and keep anchored summary regexes.
4. **Coverage staleness friction:** Acceptable in CI if ordered correctly; local friction exists but mitigated by `--coverage-stale-secs 0`.
5. **Wave dependencies:** Correct and logical; Wave 3 appropriately depends on Waves 1/2 outputs.
6. **Over-engineering / Phase 57 creep:** Mostly disciplined. CI wiring is deferred correctly; no major scope creep detected.
7. **D-01..D-18 translation fidelity:** High fidelity overall. Key decisions (single CJS script, exports, registry shape, output/exit contracts, canonical doc order, flags) are translated correctly. Potential mismatch: missing-doc skip behavior should be clarified against strict runtime-error semantics.

---

## Consensus Summary

Both reviewers independently agree the plans are executable, scope-disciplined, and faithfully translate CONTEXT.md decisions D-01..D-18. Risk verdicts diverge: Gemini says LOW, Codex says MEDIUM. The MEDIUM verdict comes entirely from operational hardening concerns Gemini either missed or rated LOW; neither reviewer found foundational architecture issues.

### Agreed Strengths

Both reviewers cite the same five strengths:

1. **Three-wave TDD decomposition** — pure functions → integration → real-repo acceptance is a proven pattern from Phase 55.
2. **Sibling-phase reuse** — `validate-doc-links.cjs` patterns reduce design and review risk.
3. **DOCDRIFT-01..05 traceability** — every requirement appears in at least one plan's `requirements:` field with corresponding test mappings.
4. **Output contract discipline** — table + `--json` envelope + exit codes 0/1/2 cleanly defined.
5. **Numeric normalization** — `stripCommas` and `±0.01` percent epsilon explicitly handle the two real-world false-positive vectors.

### Agreed Concerns

Only one concern was raised by both reviewers (with different severities):

| Concern | Gemini | Codex | Plan / Task |
|---------|--------|-------|-------------|
| `measureTestCounts` resilience to empty/missing TAP stdout | LOW (catch block coverage) | MEDIUM (`maxBuffer` truncation) | 56-02 Task 2 |

**Resolution path:** Add an explicit `maxBuffer: 16 * 1024 * 1024` (or `Infinity`) to the `execFileSync` options object in `measureTestCounts`, plus a TAP-failure-path test asserting the catch block returns `{ tests: 0, suites: 0 }` when stdout is empty. This single fix addresses both reviewers' versions of the concern.

### Divergent Views

Codex flagged three MEDIUM concerns Gemini did not surface:

| Concern | Codex | Gemini | Action |
|---------|-------|--------|--------|
| Regex fragility over time (long-term false negatives if doc wording shifts) | MEDIUM | (assessed as already mitigated) | **Accept divergence.** Long-term doc-wording stability is a maintenance concern, not a Phase 56 implementation concern. Drift in regex match (no claim found where one should be) would be caught by Phase 57's CI gate. |
| `extractClaims` line-by-line vs whole-file scan (multi-line claim risk) | MEDIUM | (not raised) | **Investigate.** Worth a 30-second grep across CLAUDE.md/README.md/DEVOPS-HANDOFF.md to confirm no current claim wraps across lines. If true, current line-by-line approach is fine; if false, switch to whole-file regex with index-to-line mapping. |
| Missing living docs in `main()` — fixture vs production behavior | LOW | (not raised) | **Accept and harden.** Add an explicit check: in non-fixture mode (`--root` not set, or set to repo root), missing living doc → exit 2 with remediation message. In fixture mode, missing doc is silent skip. |

Codex also suggested two additive test guardrails Gemini did not raise:

- **METRICS empty-claims guard test** — a test that fails if any metric intended to be enforced has `claims.length === 0` (except `branch_coverage` / `function_coverage` which are intentionally empty in v1). Cheap to add, prevents silent registry regressions.
- **Wave 3 negative regex test** — confirm newly added `check-doc-drift.cjs` reference text in the three living docs doesn't accidentally match a claim regex. Cheap to add, prevents the "documenting the detector breaks the detector" footgun.

### Recommended Replanning

The MEDIUM concerns are confined to **56-02 Task 2 (`measureTestCounts` + `main`)** and **56-01 Task 3 (`extractClaims`)** plus two small additive tests. The architecture (D-01..D-18) is sound. **Recommendation: incorporate these specific hardening edits via `/gsd:plan-phase 56 --reviews` rather than a full replan.**

Specifically:

1. **56-02 Task 2 — `measureTestCounts`**: add `maxBuffer: 16 * 1024 * 1024` to `execFileSync` options; add a test that asserts `{ tests: 0, suites: 0 }` when the spawn fails with empty stdout.
2. **56-02 Task 2 — `main()`**: add an explicit `missingDocPolicy` derived from `--root`: if `--root` resolves to the repo root or no `--root` flag, missing living docs exit 2; otherwise (fixture mode) silent skip.
3. **56-01 Task 3 — `extractClaims`**: stay with line-by-line, but add a test asserting that none of the live CLAUDE.md / README.md / DEVOPS-HANDOFF.md claims currently wrap across lines (sanity check); document the constraint in the function's JSDoc.
4. **56-01 METRICS tests**: add the empty-claims guard test (whitelist `branch_coverage` and `function_coverage`).
5. **56-03 Task 2**: add a "newly added reference text doesn't match claim regexes" check to the must_haves.

These are five surgical edits across three tasks. Estimated authoring time: ~20 minutes. Estimated executor delta vs current plan: minimal — same code paths, additional asserts.

---

## Sign-Off

- **Gemini:** Risk LOW, ready to execute.
- **Codex:** Risk MEDIUM, ready to execute with hardening edits.
- **Recommended path:** `/gsd:plan-phase 56 --reviews` to apply the five surgical edits in the Recommended Replanning section, then `/gsd:execute-phase 56`.
- **Alternative path:** Execute as-is; treat the MEDIUM concerns as known-deferred items. The architecture is sound and the MEDIUM items are operational hardening, not correctness blockers. If Phase 56 ships and Phase 57's CI gate catches the long-term concerns, the cost of deferral is bounded.
