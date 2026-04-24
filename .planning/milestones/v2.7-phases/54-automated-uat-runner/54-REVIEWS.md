---
phase: 54
reviewers: [codex]
reviewed_at: "2026-04-18T22:30:00Z"
plans_reviewed: [54-01-PLAN.md, 54-02-PLAN.md, 54-03-PLAN.md]
model: gpt-5.4
review_type: post-implementation
---

# Cross-AI Plan Review -- Phase 54 (Automated UAT Runner)

## Codex Review (gpt-5.4)

Overall, the three-wave breakdown is sensible: the work is layered, TDD-first, and aligned to the milestone goal of moving repetitive UAT into automation. The biggest weakness across all three plans is the safety model. Right now, "read-only" is treated as a property of shell text, but raw shell commands are not actually enforceable as read-only unless execution is constrained much more tightly. The second biggest gap is contract clarity between the pattern layer and the runner layer: several listed checks depend on exit codes rather than stdout, and that interface is not fully specified yet.

### Plan 54-01 -- Pattern Registry

**Summary:** This is a strong foundation plan with good separation of concerns, a clean leaf-module design, and an appropriate TDD scope for Wave 1. It should satisfy the basic matching requirement and gives the runner something deterministic to build on. However, the current command model is the main risk: several proposed patterns are not safely "read-only" in practice, and the contract for what a generated assertion contains is still too loose for the runner to consume reliably.

**Strengths:**
- Clear, bounded objective for Wave 1 with a pure-function module
- Good architectural choice to keep the registry dependency-free and isolated
- Explicit export surface keeps the module easy to test and reuse
- Pattern list is concrete and already covers the required 8+ pattern families
- TDD scope is solid and likely enough to stabilize regex matching behavior early
- Safety intent is visible, which is the right instinct for this feature

**Concerns:**
- **HIGH**: Raw shell command generation creates command-injection risk if any file path, string literal, or module path is interpolated without strict escaping
- **HIGH**: `npm test` is not reliably read-only; many test suites write temp files, snapshots, coverage artifacts, or caches
- **HIGH**: `module_export_count` via `node -p` can execute module side effects, which may write or mutate state
- **MEDIUM**: The assertion contract is underspecified; some patterns naturally compare exit status (`test`, `grep`, `diff`) while others compare stdout
- **MEDIUM**: Pattern precedence is not defined, so overlapping regexes may produce unstable or surprising matches
- **MEDIUM**: `coverage_threshold` is vague about data source, metric, and parsing strategy
- **MEDIUM**: `file_contains`/`file_not_contains` need literal-safe matching; naive `grep` can misinterpret regex characters
- **LOW**: Natural-language coverage may be narrower than expected, so many valid `must_haves` may still fall through to manual UAT

**Suggestions:**
- Replace `{ command, expected, compare }` with a stricter assertion shape like `{ program, args, observe, expected, compare }`, where `observe` is `status`, `stdout`, or `json`
- Use only allowlisted commands and argument arrays; avoid free-form shell strings entirely
- Rework risky patterns so they inspect existing artifacts only, or explicitly downgrade them to manual if safe execution cannot be guaranteed
- Define precedence rules for regex matches and add tests for ambiguous inputs
- Specify coverage behavior up front: source file, metric type, missing-file fallback, and threshold parsing
- Use literal matching for file-content checks and add tests for spaces, quotes, and special characters in filenames and search strings
- Add at least one test proving that every generated assertion conforms to the same runner-facing schema

**Risk Assessment:** HIGH -- The module shape is good, but the current command-generation design has foundational safety and contract issues that will cascade into Wave 2 if not fixed first.

### Plan 54-02 -- UAT Runner

**Summary:** This plan is directionally correct and maps well to the functional requirements: parse plans, classify truths, execute automated checks, and return structured results. The separation between matching, execution, comparison, and formatting is good. The main risks are execution safety, incomplete error handling, and a runner contract that assumes "actual vs expected" can be computed uniformly even though different assertions need different observation strategies.

**Strengths:**
- Good orchestration boundaries and sensible reuse of existing helpers
- Return shape directly supports the phase requirement for pass/fail/manual triage
- Timeout handling is explicitly planned, which is important for workflow reliability
- Failure payload includes the right debugging data for humans
- TDD plan covers comparison logic, formatting, timeout behavior, and orchestration
- Manual fallback for unmatched truths aligns well with the project's quality-gate philosophy

**Concerns:**
- **HIGH**: `execSync` over shell strings inherits the injection and read-only-enforcement problem from Wave 1
- **HIGH**: The runner flow does not specify behavior for missing plan files, malformed frontmatter, YAML parse failures, or absent `must_haves.truths`
- **HIGH**: The current model assumes all assertions yield a comparable "actual" value, but many commands are better evaluated by exit code rather than stdout
- **MEDIUM**: Timeout and non-zero exit handling need normalization; `execSync` error objects differ across exit failure, signal kill, and timeout cases
- **MEDIUM**: `compareResult()` needs explicit numeric normalization rules for `gt/gte`, including whitespace, percentages, and invalid values
- **MEDIUM**: Results lack source context like `planPath`, which will make multi-plan debugging harder
- **MEDIUM**: Heavy commands may be executed repeatedly, which could slow verification and undercut the usability goal of the phase
- **LOW**: `formatUATResults()` is underspecified, so output may drift from what `verify-work` actually needs

**Suggestions:**
- Execute allowlisted programs with argument arrays and `shell: false`; do not run free-form shell text
- Expand the assertion contract to include what to observe (`status`, `stdout`, parsed number, etc.) so the runner is deterministic
- Define non-happy-path handling explicitly: unreadable plan, bad frontmatter, missing truths, timeout, command not found, and unsupported pattern
- Include `planPath` and optionally `durationMs` on every result object
- Cache results per unique assertion within a run so repeated truths do not rerun the same expensive command
- Add tests for malformed YAML, missing files, empty truths, duplicate truths, multiple plan files, and partial failures
- Decide whether parser/execution failures should be `failed` or `manual`, and keep that rule consistent

**Risk Assessment:** HIGH -- This is the execution layer, so unresolved safety and contract ambiguity here would directly affect correctness, trustworthiness, and workflow stability.

### Plan 54-03 -- Integration

**Summary:** The integration plan is appropriately small and correctly sequenced after the lower-level modules. It also captures the right product behavior: automated UAT should run first, present results clearly, and reduce conversational UAT to only what remains unmatched. The weakness is that the plan is too light on verification. CLI behavior, exit codes, and workflow routing semantics are important here, and "full suite green" alone is not enough to prove the integration behaves as intended.

**Strengths:**
- Correct dependency ordering across the three waves
- Integrates at the right workflow point: before conversational UAT
- Routing modes are thoughtfully identified and align with operational needs
- Keeps scope focused on CLI wiring and workflow behavior rather than redesigning the system
- Includes a full-suite gate, which is appropriate for a cross-cutting integration change

**Concerns:**
- **HIGH**: No explicit integration tests for the new CLI subcommand, output, or exit codes
- **MEDIUM**: Routing semantics need exact definitions; "block," "continue," and "skip conversational" should map to concrete workflow outcomes
- **MEDIUM**: It is unclear how verify-work.md is consumed; editing markdown alone may not guarantee runtime behavior unless tooling reads it directly
- **MEDIUM**: CLI contract is missing key details such as input paths, default discovery behavior, output format, and machine-readable options
- **MEDIUM**: The plan does not show how read-only guarantees are enforced or surfaced at integration time
- **LOW**: Help text or discoverability updates are not mentioned, which may make the new subcommand easy to miss

**Suggestions:**
- Add integration tests for gsd-tools.cjs covering command registration, argument handling, output, and exit code behavior
- Define the CLI interface explicitly: whether it accepts one or many plan paths, whether it auto-discovers plans, and whether it supports JSON output
- Specify the exact verify-work routing contract for all four cases: all-pass, some-fail, some-manual, and no-must-haves
- Add one end-to-end fixture test from plan frontmatter to final rendered automated-UAT output
- Consider a graceful degradation rule: if automated UAT itself errors, route safely rather than hard-breaking the entire verify workflow unless the error is truly blocking
- Confirm whether workflow docs need corresponding updates elsewhere, such as command help or operator-facing documentation

**Risk Assessment:** MEDIUM -- The scope is manageable and the sequencing is sound, but the absence of explicit integration tests and CLI/workflow contract detail makes behavioral regressions likely.

---

## Consensus Summary

*Single-reviewer session (Codex only). No cross-reviewer consensus to synthesize.*

### Top Concerns (by frequency across plans)

1. **Shell command injection risk** (HIGH, Plans 01+02) -- Raw shell strings with interpolated paths are not safe; need allowlisted commands with argument arrays or strict escaping
2. **"Read-only" enforcement gap** (HIGH, Plans 01+02) -- `npm test` and `node -p` can trigger side effects; treating text analysis of command strings as a safety guarantee is insufficient
3. **Assertion contract underspecification** (HIGH, Plans 01+02) -- Some patterns need exit-code observation, others stdout; the current `{ command, expected, compare }` shape doesn't distinguish
4. **Missing error-path handling** (HIGH, Plan 02) -- No specification for missing plans, malformed YAML, absent truths, or command-not-found scenarios
5. **No integration tests** (HIGH, Plan 03) -- CLI registration, output format, and routing behavior are untested

### Acknowledged Strengths

- Three-wave dependency ordering is correct and well-sequenced
- TDD approach for Plans 01-02 provides early stability
- Pure-function architecture for the pattern registry is the right design choice
- Manual fallback for unmatched patterns aligns with existing quality-gate philosophy
- Return shape supports the required pass/fail/manual triage

### Cross-Plan Recommendation

The plans are solid structurally, but the shared assertion contract should be tightened before considering these findings actionable. The most important adjustment is to stop thinking in terms of raw shell strings and instead use an allowlisted execution spec with `program + args + observe`. If that change is made, the three-wave plan becomes lower risk and more likely to meet phase goals cleanly.
