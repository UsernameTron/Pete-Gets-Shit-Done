---
phase: 55
passes:
  - pass: 1
    reviewers: [gemini, codex]
    reviewed_at: 2026-05-07T19:22:15Z
  - pass: 2
    reviewers: [gemini, codex]
    reviewed_at: 2026-05-07T20:33:06Z
    mode: adversarial — find issues prior pass missed
plans_reviewed:
  - 55-01-PLAN.md
  - 55-02-PLAN.md
  - 55-03-PLAN.md
runtime_excluded: claude (review invoked from inside Claude Code — excluded for independence)
---

# Cross-AI Plan Review — Phase 55: Internal Link Validator

Two external CLIs reviewed the Phase 55 plan set independently. Each received the
full prompt: PROJECT.md context, ROADMAP.md phase section, REQUIREMENTS.md
(DOCLINK-01..04), 55-RESEARCH.md, 55-VALIDATION.md, and the three PLAN.md files.

## Gemini Review

### Summary

This is an exemplary set of implementation plans. The approach is methodical, rigorous, and demonstrates a deep understanding of spec-driven development principles. It follows a strict TDD discipline, breaking the problem into three well-defined waves: core logic, CLI integration, and final acceptance. The research is exhaustive, proactively addressing potential edge cases, security concerns, and implementation trade-offs. Scope is tightly controlled, with clear boundaries that align perfectly with the project's roadmap.

### Strengths

- **TDD Enforcement:** The plans are structured to write failing tests first (RED) before implementing code (GREEN), particularly in plans 55-01 and 55-02. This enforces a high standard of quality and test coverage from the outset.
- **Thorough Research & Planning:** The `RESEARCH.md` file is outstanding. It justifies technical decisions (regex vs. parser), details algorithms (GFM slugs), defines a robust file discovery strategy (`git ls-files` with a glob fallback), and outlines a comprehensive test strategy, leaving very little to chance.
- **Rigorous Scope Management:** The plans are laser-focused on building the validator. Plan 55-03 correctly specifies that discovered broken links will be *recorded*, not fixed, explicitly deferring repair work to Phase 57 as defined in the roadmap. This is a critical discipline that prevents scope creep.
- **Comprehensive Testing:** The strategy includes unit tests for pure functions, integration tests for CLI behavior (exit codes, `--json` output), and a full suite of fixture files covering clean, broken, and edge-case scenarios. The `VALIDATION.md` file provides a clear, verifiable contract for success.
- **Security and Robustness:** The plan addresses security concerns like path traversal and uses safe practices like `execFileSync` to prevent shell injection. Edge cases like URL-encoded paths, code fences, and file discovery in non-git directories are handled.
- **Attention to Detail:** The plans account for crucial but often-missed details, such as adding the new script to the coverage configuration (`.c8rc.json` in plan 55-02) and updating project documentation (plan 55-03).

### Concerns

- **LOW: Regex Brittleness:** The choice of a hand-rolled regex is well-justified by the project's zero-dependency constraint. However, the chosen regex `\(([^)]+)\)` will incorrectly handle Markdown links that include a title (e.g., `[text](path/to/file.md "My Title")`), capturing `path/to/file.md "My Title"` as the reference. This could lead to false positives ("file not found"). While the project may not currently use link titles, this is a gap compared to the full Markdown spec.
- **LOW: Performance on Large Files:** The implementation reads entire files into memory at once (`fs.readFileSync`). For extremely large Markdown files (e.g., >100MB), this could be memory-intensive. This is a minor concern as documentation files of that size are rare in practice.
- **LOW: GFM Slug Algorithm Divergence:** The planned GFM slug generation algorithm is a very strong implementation. However, the official algorithm has subtle edge cases, particularly around Unicode character handling, that can evolve. There is a minimal risk of future divergence from GitHub's live behavior, which could cause false negatives for valid anchor links.

### Suggestions

- **Refine Link Extraction Regex:** Modify the regex in `scripts/validate-doc-links.cjs` to correctly parse links with optional titles. A more robust regex would be `/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g`. This captures only the URL part and ignores the optional quoted title, preventing the issue described in the "Concerns" section. Add a corresponding fixture and test case in Plan 55-01 to validate this.
- **Cache Heading Slug Computations:** In `validateLink`, the script calls `extractHeadingSlugs(targetFile)` for every link pointing to that file. For documents with many inbound links, this results in redundant file reads and processing. Introduce a simple in-memory cache (`Map<filePath, Set<slugs>>`) within the main loop to compute each file's slugs only once.
- **Add Test for Path Traversal Normalization:** The research notes mention normalizing paths to handle Windows separators (`path.sep`). Add an explicit unit test in Plan 55-01 for `validateLink` that uses a mock `path.sep = '\\'` and confirms that a path like `..\\clean\\target.md` is still correctly resolved and validated.

### Risk Assessment

**LOW.**

The planning is exceptionally thorough, mitigating most risks before implementation begins. The TDD approach, comprehensive test strategy, and clear separation of concerns across the three waves ensure a high-quality outcome. The primary risks are minor and relate to the long-term maintenance of the hand-rolled regex and slug algorithm against evolving Markdown specifications. These risks are acceptable given the project's explicit zero-dependency constraint. The plan is sound, well-structured, and has a very high probability of successfully delivering on all stated requirements.

---

## Codex Review

### 1. Summary

The Phase 55 planning set is strong overall: it is explicit, test-driven, and heavily operationalized with verifiable acceptance checks. The wave split (55-01 core functions, 55-02 wiring/CLI/coverage, 55-03 repo acceptance + doc updates) is coherent and mostly aligned to DOCLINK-01..04. The biggest risks are over-prescription and some internal inconsistencies (especially JSON schema wording, commit requirements inside execution plans, and a few brittle test assumptions) that could create process friction without improving requirement coverage.

### 2. Strengths

- Clear dependency ordering across waves:
  - 55-01 establishes tested primitives.
  - 55-02 adds discovery + entrypoint + integration behavior.
  - 55-03 handles real-repo evidence and living-doc propagation.
- Strong TDD intent with explicit RED→GREEN checkpoints in 55-01 Task 2/3 and 55-02 Task 1/2.
- Requirements traceability is unusually good:
  - `must_haves`, artifacts, and verify commands map directly to DOCLINK-01..04.
- Acceptance criteria are mostly machine-verifiable (`grep`, `node --test`, exit codes, JSON parse).
- Good security posture in design:
  - `execFileSync('git', [...])` avoids shell interpolation.
  - Explicit traversal check in `validateLink`.
- Good CI readiness:
  - `--json` output, non-zero exit on broken links, `.c8rc.json` inclusion, and coverage gates.
- Explicitly scoped known limitations (reference links, HTML anchors) avoids silent ambiguity.
- Real-repo validation in 55-03 is a solid operational gate before claiming completion.

### 3. Concerns

- **HIGH**: JSON contract inconsistency between requirement text and plan details.
  - Phase success criteria says `--json` should be an "array of objects," but research/55-02 defines an object envelope `{status, checked, files, broken:[...]}`.
  - This can cause false "done" claims if reviewers interpret DOCLINK-04 literally.
- **HIGH**: Over-constraining implementation details in 55-01 Task 3.
  - "EXACT implementation" blocks necessary adaptations if tests expose edge failures; this is brittle and discourages correct fixes.
- **MEDIUM**: Commit-level enforcement inside plan tasks is process-heavy.
  - Required RED/GREEN/coverage commit boundaries are useful, but hard-gating on exact commit choreography can block progress in fast iteration or squash-based workflows.
- **MEDIUM**: File discovery tests in 55-02 Task 1 are environment brittle.
  - Git-path test asserting presence of `CLAUDE.md` in `process.cwd()` can fail in alternate checkout roots/subdirs.
- **MEDIUM**: Missing anchor normalization for URL-encoded anchors.
  - Path is decoded, anchor is not; links like `#some%20heading` can false-fail.
- **MEDIUM**: Slug algorithm may diverge from GitHub edge behavior.
  - Uses `[^\w\s-]` and custom markdown stripping; may differ for Unicode/punctuation combinations and escaped entities.
- **LOW**: Performance scaling not fully addressed.
  - `extractHeadingSlugs` can re-read same target file repeatedly; no required cache in 55-02 despite repo-wide scan.
- **LOW**: Regex grammar intentionally narrow but could miss valid markdown forms.
  - Nested parentheses in URLs/titles and reference-style links are deferred; acceptable, but needs explicit non-goal wording in user-facing docs too.
- **LOW**: 55-03 "no real fixes" rule is clean for scope, but can leave main branch red if validator is already strict and docs are currently broken.

### 4. Suggestions

- Resolve DOCLINK-04 JSON ambiguity now:
  - Either change requirement text to "JSON object with `broken` array" or update implementation/tests to output raw array in `--json`.
- Relax "exact code block" mandates in 55-01 Task 3:
  - Keep behavioral contracts exact, not line-by-line implementation.
- Harden 55-02 git-path test:
  - Assert non-empty `.md` list and absolute paths only; avoid hard dependency on `CLAUDE.md`.
- Add anchor decode/normalize rule:
  - Decode anchor fragment via `decodeURIComponent` before slug comparison.
- Require heading slug cache in `validateLink`/`main`:
  - Cache `extractHeadingSlugs(targetFile)` results to avoid repeated disk reads on large docs.
- Add a max-link-length guard or safe-fail around regex extraction for pathological lines (defensive against regex DoS-style giant inputs).
- Clarify 55-03 acceptance wording:
  - If real repo has broken links, explicitly mark Phase 55 as "validator complete, backfill pending Phase 57" to avoid ambiguity about milestone completeness.
- Simplify commit acceptance checks:
  - Verify outcomes (tests green, files present, behavior correct) rather than exact number/order of commits unless audit requires it.

### 5. Risk Assessment

**Overall risk: MEDIUM**

The plans are high quality and likely to succeed technically, with excellent testability and traceability. The main risk is governance/process friction and contract mismatch rather than core engineering failure: JSON schema inconsistency, overly rigid implementation prescriptions, and brittle environment assumptions can create avoidable rework or disputed acceptance. If those are corrected early, execution risk drops to LOW.

---

## Consensus Summary

Two reviewers, two different verdicts on overall risk: **Gemini → LOW**, **Codex → MEDIUM**. Both agree the plans are well-structured, test-driven, and traceable to the four DOCLINK requirements. They diverge sharply on what kinds of risk matter most:

- **Gemini** treats this as engineering-ready and flags only LOW-severity Markdown-spec edge cases (link titles, Unicode slugs, large-file memory).
- **Codex** treats two issues as HIGH-severity contract problems — a real divergence between ROADMAP wording and implementation, plus over-prescription of "exact" code that may block legitimate fixes during execution.

### Agreed Strengths (both reviewers)

- **Strong TDD discipline**: explicit RED → GREEN sequencing across 55-01 and 55-02
- **Clean wave dependency graph**: 55-01 (primitives) → 55-02 (CLI + coverage) → 55-03 (real-repo + docs), no cycles, no skipped layers
- **Verifiable acceptance criteria**: `grep`, `node --test`, exit codes, JSON parse — minimal subjective language
- **Sound security posture**: `execFileSync` over `execSync`, path traversal check, no shell interpolation
- **Tight scope management**: Phase 55 explicitly defers backfill to Phase 57; explicitly defers reference-style links and HTML anchors
- **Operational completeness**: `.c8rc.json` coverage tracking included; living-doc updates planned

### Agreed Concerns (raised by both reviewers — these are the real signal)

These concerns appeared in both reviews and warrant action before execution:

| Severity | Concern | Source plan(s) | Suggested fix |
|----------|---------|---------------|--------------|
| MEDIUM-HIGH | **No heading-slug cache** — `validateLink` will re-read the same target file every time it sees a link to that file (e.g., 50 links to README.md = 50 reads + 50 slug computations). | 55-02 (`main` loop) | Pass a `Map<filePath, Set<slugs>>` cache through `validateLink`; populate lazily on first lookup per target. |
| MEDIUM | **GFM slug algorithm may diverge from GitHub** for Unicode, punctuation, and escaped-entity edge cases. Risk is false-negative anchor reports against valid GitHub-rendered anchors. | 55-01 (`toGfmSlug`) | Acknowledge as known limitation in script header comment; add a fixture with a Unicode-headed anchor and document the expected slug output. Defer full GFM parity. |
| LOW | **Regex doesn't handle Markdown link titles** `[text](path "title")` — Gemini and Codex both note this. Codex frames it as "narrow grammar," Gemini gives a concrete fix regex. | 55-01 (`extractLinks`) | Replace `\(([^)]+)\)` with `/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g` (Gemini's suggestion). Add a fixture with a titled link. |

### Codex-Only Concerns (worth addressing — single reviewer but specific and actionable)

- **HIGH: JSON contract mismatch**. ROADMAP success criterion 3 says `--json` produces "an array of objects." RESEARCH.md and 55-02 implement an envelope `{status, checked, files, broken: [...]}`. **This is a genuine ambiguity that should be resolved before execution.** Recommended action: update ROADMAP wording to match the envelope (the envelope has more diagnostic value — counts, status flag — and aligns with industry tooling). REQUIREMENTS.md DOCLINK-04 doesn't constrain shape, so only ROADMAP needs the wording tweak.
- **MEDIUM: 55-02 Task 1 brittle test for `CLAUDE.md`**. The git-path test fixture pins on `CLAUDE.md` being in `process.cwd()`. Should assert "non-empty result, all paths absolute, contains at least one `.md` file" instead.
- **MEDIUM: Missing anchor URL-decode**. Paths are URL-decoded before fs check, but anchors are not before slug comparison. `[link](file.md#some%20heading)` would false-fail. Add `decodeURIComponent()` to the anchor branch in `validateLink`.

### Gemini-Only Concerns (lower priority — single reviewer, lower severity)

- **LOW: Path-traversal Windows test**. Gemini suggests an explicit unit test mocking `path.sep = '\\'`. Worth doing if cross-platform tests are part of the project's value proposition; lower priority since CI is Linux/macOS only.
- **LOW: Large-file memory pressure**. `fs.readFileSync` reads entire `.md` files into memory. Project docs are well under any reasonable threshold; deferable.

### Divergent Views

- **Codex flags "exact implementation" mandates as HIGH-severity over-prescription**; Gemini treats the same prescriptive RESEARCH.md content as a strength ("very little to chance"). This is a genuine design philosophy disagreement: does prescriptive planning prevent shallow execution (Gemini view) or does it block legitimate fixes during execution (Codex view)? **Recommendation:** keep the prescription for function signatures, regex patterns, and JSON schemas (Codex agrees these should be exact), but soften the "exact implementation" language in the action prose to allow the executor to adjust the body if the tests demand it.
- **Codex flags commit-level choreography as MEDIUM friction**; Gemini doesn't comment. The recent revision (FLAG-2 fix in plan-verifier iteration 1) added explicit "commit SUMMARY.md as its own commit before Task 2." Codex would simplify this; Gemini implicitly endorses it. **Recommendation:** keep the explicit commit step — it's three lines of plan text and prevents a real `git diff HEAD~1 HEAD` ambiguity in Task 2's acceptance check.

### Recommended Next Action

`/gsd:plan-phase 55 --reviews` to incorporate the consensus concerns (slug cache, regex titles, anchor decode, JSON contract resolution, brittle CLAUDE.md test) into a revised plan set. Run before `/gsd:execute-phase 55`.

If running short on time, the **two highest-leverage** changes are:

1. **Resolve the JSON envelope vs. array ambiguity** (one-line ROADMAP edit + confirm 55-02 spec stays as envelope)
2. **Add the slug cache to 55-02** (one extra task or one extra `read_first` instruction)

The other items are improvements but not blockers.

---

# Second Pass — Adversarial Review

**Reviewed:** 2026-05-07T20:33:06Z
**Mode:** Both reviewers were given the prior pass's findings and asked to find NEW issues they would miss. They were instructed not to repeat the prior list and to focus on race conditions, phase-boundary leakage, UAT must_have ambiguity, and acceptance criteria that are "grep-true but behaviorally insufficient."

## Gemini Review (Second Pass)

### Summary

The prior review pass correctly identified several implementation-level risks, including JSON contract mismatches, performance issues due to lack of caching, and subtle bugs in GFM slug generation and URL decoding. However, it missed higher-level procedural and environmental risks. The plan's reliance on shared fixtures for parallel tests creates a race condition risk, its verification steps use brittle, non-portable shell commands, and it introduces scope creep (`.doclinkignore`) not covered by the phase's explicit requirements.

### Newly Identified Concerns

1. **HIGH: Test Isolation in Parallel Execution.**
   - **Plan/Task:** 55-02-T1
   - **Issue:** The integration test for `discoverTrackedFiles`'s git-based discovery path is planned to run against the live project directory (`process.cwd()`). Since `node:test` runs files in parallel, this test is not isolated and could be affected by file system operations from other concurrent tests, leading to flakes.

2. **MEDIUM: Inconsistent and Brittle Verification Logic.**
   - **Plan/Task:** 55-01-T3 (verify), 55-02-T2 (verify)
   - **Issue:** Per-task `verify` blocks use `grep` to check for function signatures. This is brittle and can return false positives for commented-out code. The more robust `node -e "require(...)"` check is only used in the final, end-of-plan verification, delaying feedback and using an inconsistent quality standard within the same plan.

3. **MEDIUM: Scope Creep via `.doclinkignore`.**
   - **Plan/Task:** 55-03-T1
   - **Issue:** The plan for Wave 3 introduces the concept of a `.doclinkignore` file, which is not part of the phase's documented requirements (DOCLINK-01 through -04). This constitutes scope creep. The decision to add an ignore mechanism should be a separate, planned feature based on the findings of this phase, not an ad-hoc addition.

4. **LOW: Unhandled File Encodings.**
   - **Plan/Task:** 55-01-T3
   - **Issue:** The script reads files assuming UTF-8 encoding. It does not handle potential errors if a file is saved with a different encoding (e.g., UTF-16), which would cause the script to crash or mis-parse content. A robust file processor should anticipate and gracefully handle such edge cases.

5. **LOW: Non-Portable Verification Commands.**
   - **Plan/Task:** All `verify` blocks (e.g., 55-01-T1).
   - **Issue:** The `verify` blocks use Unix-specific shell commands (`test`, `wc`, `grep`). While CI may run on Unix-like systems, this makes local plan verification for developers on standard Windows environments impossible without special shells, creating friction and inconsistency.

### Strengthening Recommendations

1. **Test Isolation:** In Plan 55-02-T1, the acceptance criteria for testing the git-based discovery path must be changed. Instead of targeting `process.cwd()`, the test must use a temp git repo helper (e.g., `createTempGitProject` style) to create a fully isolated git repository for the test to run within.
2. **Verification Logic:** In all plans, replace `grep`-based function existence checks in `verify` and `acceptance_criteria` blocks with the more robust `node -e "..."` pattern. For example: `node -e "const m = require('./scripts/validate-doc-links.cjs'); if (typeof m.toGfmSlug !== 'function') process.exit(1);"` to confirm the export is a function.
3. **Scope Creep:** In Plan 55-03-T1, the `55-03-SUMMARY.md` template must be modified. Remove the "Decisions" section regarding `.doclinkignore`. Replace it with a "Future Work Recommendations" section, stating that an ignore-file mechanism could be considered in a future phase based on the real-world findings.
4. **File Encodings:** In Plan 55-01-T3, the implementation of `extractLinks` and `extractHeadingSlugs` must wrap the `fs.readFileSync` call in a `try...catch` block. On failure, it should log the error to `stderr` and return an empty result for that file. A corresponding unit test with a non-UTF8 file must be added in Plan 55-01-T2.
5. **Cross-Platform Verification:** In all plans, all `verify` blocks must be updated to replace Unix-style shell commands with cross-platform `node -e "..."` equivalents. For example, `test -f file.md` becomes `node -e "process.exit(require('fs').existsSync('file.md') ? 0 : 1)"`.

### Sanity Check on Prior Review Findings

The prior review's findings are correct and valuable. They focus on implementation correctness (JSON schema, slug algorithm, URL decoding) and performance (caching). The new findings are complementary, focusing on process robustness, test isolation, and environmental factors. Both sets of feedback should be incorporated.

### Risk Re-Assessment

**MEDIUM.** The core plan is sound, but the newly identified issues, particularly the test isolation flaw, elevate the execution risk. A flaky test suite can undermine the entire milestone's goal of CI-enforced integrity. The other issues point to a pattern of "happy path" planning that could lead to a brittle final product and a frustrating developer experience. The proposed recommendations are necessary to harden the development and verification process, bringing the risk down to LOW.

---

## Codex Review (Second Pass)

### 1. Summary

The first-pass review caught data-contract and parsing quality issues, but it missed execution-risk gaps: several checks are "grep-true" without proving behavior, some task instructions are internally contradictory across phases, and a few workflow details can create flaky or misleading evidence (especially around real-repo runs, summary artifacts, and UAT/must_have automations).

### 2. Newly Identified Concerns

- **HIGH — Phase-boundary contradiction can force scope leak into Phase 57 work**
  **Plan 55-03, Task 2** says to fix any broken links introduced by doc edits before commit, while **Plan 55-03 must_haves** says no genuine broken links are fixed in this phase. This is ambiguous in practice when "introduced" vs "genuine/pre-existing" is unclear during same run.
  Risk: accidental remediation work in Phase 55.

- **HIGH — UAT `must_haves` are not consistently machine-verifiable for v2.7 runner patterns**
  **Plan 55-03 (must_haves truths + done criteria), Plan 55-01/55-02 truths** include narrative assertions like "No genuine broken links are auto-fixed…" and "Acceptance criteria … satisfied" that are hard to convert into deterministic shell assertions.
  Risk: false green UAT or skipped enforcement despite "must_have" labeling.

- **MEDIUM — Real-repo JSON artifact is intentionally corrupted by appending exit code**
  **Plan 55-03, Task 1, Step 2** writes JSON to `/tmp/validate-doc-links.json` then appends `EXIT: $?` to same file.
  Risk: artifact cannot be re-parsed; downstream manual checks may rely on invalid data.

- **MEDIUM — Fixed `/tmp` filenames are collision-prone**
  **Plan 55-03, Task 1** uses global filenames (`/tmp/validate-doc-links-text.txt`, `/tmp/validate-doc-links.json`).
  Risk: concurrent runs overwrite each other and contaminate summary evidence.

- **MEDIUM — Acceptance criteria allow behavior regressions while still passing**
  **Plan 55-03, Task 2 acceptance** checks `grep -c "validate-doc-links" ... outputs 1 or more` although task intent says "single concise reference."
  Risk: duplicate/conflicting doc statements pass validation.

- **MEDIUM — CLI arg validation gap (`--root` missing value) is untested in acceptance**
  **Plan 55-02, Task 2** defines parsing logic but has no explicit acceptance for `--root` without argument.
  Risk: accidental fallback to CWD silently, producing misleading test outcomes.

- **LOW — Shell verification commands are POSIX-specific and not portable**
  **Plan 55-02 verification** uses `/dev/stdin`, brace grouping, and shell idioms not Windows-compatible.
  Risk: contributor friction outside Linux/macOS despite repo scripts being Node-based.

### 3. Strengthening Recommendations

- Add explicit boundary rule to **55-03 Task 2**: "Only revert/fix links added in this task's diff; do not modify pre-existing broken refs. Verify with `git diff --name-only` scope lock."
- Rewrite non-deterministic `must_haves` in all plans into automatable predicates (exit code, file match, JSON schema checks, diff scope checks).
- In **55-03 Task 1**, store exit code separately (`/tmp/...exit`) or embed in wrapper JSON object; never append text to JSON artifact.
- Use unique temp filenames (`mktemp` or timestamp/PID suffix) in **55-03 Task 1**.
- Tighten doc acceptance in **55-03 Task 2** to exact-count checks where intended (`== 1`) and exact line-match assertions.
- Add an explicit **55-02 Task 2** test/acceptance for malformed args: `--root` without value should exit non-zero with clear stderr.
- Prefer Node-based verification snippets over shell-specific constructs for portability.

### 4. Sanity Check on Prior Review Findings

- Prior findings are mostly correct.
- JSON contract divergence: valid concern (plan text is inconsistent).
- Missing slug cache: valid performance concern.
- GFM slug fidelity: valid correctness risk.
- CLAUDE.md git-path test brittleness: valid.
- Anchor decode asymmetry: valid.
- Markdown title parsing gap: valid but lower priority.

### 5. Risk Re-Assessment

Overall risk remains **MEDIUM-HIGH**. Core implementation is feasible, but acceptance integrity is weaker than it appears: ambiguous phase boundaries, partially non-automatable must_haves, and evidence-generation flaws can allow "green" completion with latent process and CI-quality defects.

---

## Second-Pass Consensus

Both pass-2 reviewers agree the first pass missed **process-level and acceptance-integrity issues** rather than algorithmic bugs. New consensus concerns:

### Agreed Second-Pass Concerns (raised by both)

| Severity | Concern | Source plan(s) | Suggested fix |
|----------|---------|---------------|--------------|
| HIGH | **Verification is grep-true but behaviorally insufficient** — `grep` for a function name passes even if the function is commented out, broken, or stubbed; `must_haves` use narrative language that the v2.7 UAT runner cannot pattern-match deterministically | 55-01-T3, 55-02-T2, 55-03 must_haves | Replace `grep` function-name checks with `node -e "if (typeof m.fn !== 'function') process.exit(1)"`; rewrite narrative must_haves as exit-code / file-exists / regex-line predicates the UAT runner can actually evaluate |
| MEDIUM | **Cross-platform verification gap** — `verify` blocks use `test`, `wc`, `grep`, `/dev/stdin`, brace grouping. CI is Linux/macOS only, but local-developer friction on Windows is real and the project ships zero shell-specific code in `scripts/` already | All plans | Convert `verify` shell snippets to Node equivalents where the project is already Node-native |

### High-Severity Findings Unique to One Reviewer

**Gemini-only HIGH:**
- **55-02-T1 git-discovery test isolation**. The test for `discoverTrackedFiles` git-path runs against `process.cwd()` while `node:test` runs files in parallel. Other concurrent tests can mutate the working tree (uncommitted state, fixture writes elsewhere) and cause flakes. Fix: build a temp git repo per test (init, add, commit fixture `.md`s, point script at temp repo via `--root`).

**Codex-only HIGH:**
- **55-03-T2 phase-boundary contradiction**. Task 2 says "fix any broken links introduced by doc edits before commit" — but `must_haves` says "no genuine broken links auto-fixed in Phase 55." The line between "introduced by my edit" and "pre-existing genuine broken ref I noticed in this file" is fuzzy at execution time. Fix: add explicit scope lock `git diff --name-only HEAD` before/after Task 2, only allow modification of the lines diff produced.

### Codex-Only Medium Findings

- **JSON artifact corruption** in 55-03-T1 Step 2: writes JSON, then appends `EXIT: $?` to the same file → unreadable as JSON. Use `/tmp/validate-doc-links.json` for the JSON, separate `/tmp/validate-doc-links.exit` for the exit code (or embed the exit code in a wrapper object before writing).
- **Fixed `/tmp` filenames** collision-prone across concurrent runs. Use `mktemp -d` or a PID/timestamp suffix.
- **`grep -c >= 1`** in 55-03-T2 doc-update acceptance accepts duplicate references. Tighten to `== 1` per file or `<= 2` total to match the "single concise reference" intent.
- **Missing `--root` arg validation test** in 55-02-T2: the plan defines arg-parsing logic but no acceptance for `--root` without a value. Add an integration test that asserts non-zero exit + clear stderr when the arg is malformed.

### Gemini-Only Medium / Low Findings

- **55-03 `.doclinkignore` scope creep**. The ignore-file mechanism is mentioned in 55-03-T1 but not in any DOCLINK-XX requirement. Move from "Decisions" to "Future Work Recommendations" so it's not implemented inline as part of Phase 55.
- **File encoding crash risk** (LOW). `fs.readFileSync(file, 'utf8')` on a UTF-16 or binary `.md` file will produce garbage or throw. Wrap in try/catch, log to stderr, return empty extraction for the file. Add a UTF-16 fixture test.

### Pass-2 Risk Verdict

| Reviewer | Pass 1 Risk | Pass 2 Risk | Direction |
|----------|-------------|-------------|-----------|
| Gemini | LOW | MEDIUM | ↑ (test isolation flaw) |
| Codex | MEDIUM | MEDIUM-HIGH | ↑ (acceptance integrity gaps) |

Consensus: **the plans are technically correct but verification integrity is the actual risk** — green tests / passing acceptance gates can mask real regressions because the gates themselves are loose. Fix the verification tooling (Node-based checks, deterministic must_haves, isolated git fixtures, atomic temp files) before executing.

### Recommended Path

`/gsd:plan-phase 55 --reviews` to incorporate **all** findings from passes 1 and 2 into a revised plan set. The pass-2 issues are mechanical (regex → Node check, /tmp → mktemp, narrative must_haves → exit-code predicates) and apply uniformly across plans, so a single revision pass should resolve them. Run before `/gsd:execute-phase 55`.

If skipping the full revision cycle, the **two highest-leverage** pass-2 changes are:

1. **Replace `grep`-for-function with `node -e require check`** across all task `verify` and `acceptance_criteria` blocks. This is a search-and-replace style change.
2. **Add temp-git-repo isolation to 55-02-T1** so the `discoverTrackedFiles` git-path test does not race with parallel `node:test` execution against the live working tree.
