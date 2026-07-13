# Codebase Concerns

**Analysis Date:** 2026-07-12

## Tech Debt

**P1 — CLAUDE.md's own Architecture section describes a `lib/` layout that does not exist:**
- Issue: CLAUDE.md documents `lib/core.cjs`, `lib/security.cjs`, `lib/governance.cjs`, `lib/classify.cjs`, `lib/model-profiles.cjs`, `lib/history.cjs` as "Core runtime." None of these files live in `lib/`. `lib/` (repo root) contains exactly two files — `ci-patterns.json` and `injection-patterns.json` (build-time pattern sources, not runtime code). The actual modules live under `get-shit-done/bin/lib/`. `governance.cjs` does not exist anywhere in the repository — governance is implemented as bash scripts (`governance/scripts/*.sh`) plus PreToolUse/PostToolUse hooks (`hooks/*.js`), not a `.cjs` module.
- Files: `CLAUDE.md` (Architecture section), `lib/` (actual contents), `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/security.cjs`, `get-shit-done/bin/lib/classify.cjs`, `get-shit-done/bin/lib/model-profiles.cjs`, `get-shit-done/bin/lib/history.cjs`
- Why: `scripts/check-doc-drift.cjs` (the CI-enforced doc-accuracy gate) only validates 9 *numeric* claims (test/suite/coverage/agent/command/skill/hook counts) via regex — it has no mechanism to verify that a file path mentioned in prose actually exists. `scripts/validate-doc-links.cjs` only parses Markdown link syntax (bracketed label + parenthesized target), not backtick code-spans inside a fenced tree diagram. Both CI-blocking validators structurally cannot catch this class of drift.
- Impact: Every session (including this one) receives this architecture block as authoritative system-prompt context and will misdirect file edits or explanations toward `lib/` and a nonexistent `governance.cjs`.
- Fix approach: Correct the Architecture section to point at `get-shit-done/bin/lib/` and describe governance as bash + hooks, not a `.cjs` module. If path-accuracy enforcement is wanted going forward, extend `check-doc-drift.cjs` (or a new lightweight check) to assert that backtick-quoted paths in CLAUDE.md's architecture block resolve on disk.

**P1 — `bin/install.js` is a 5,300-line monolith:**
- Issue: Single file contains all installer logic for 6+ runtimes (Claude Code, Copilot, Cursor, Windsurf, Codex, Gemini, OpenCode, Antigravity). 26 `convert*` functions (`convertToolName`, `convertGeminiToolName`, `convertClaudeToCopilotContent`, `convertClaudeAgentToAntigravityAgent`, etc., spanning lines 516–1087 and 2335–2450) follow near-identical patterns with per-runtime tool-name mappings and content transformations. The top-level `install(isGlobal, runtime)` function alone is 605 lines (from line 4336).
- Files: `bin/install.js`
- Impact: High maintenance burden when adding a runtime or changing cross-runtime behavior. Bug fixes must be applied to each runtime's converter independently; a missed one silently produces wrong output for that platform only.
- Fix approach: Extract a runtime-adapter pattern — one base converter driven by a per-runtime config object (tool-name map, frontmatter format, content transforms). Decompose `install()` into `installHooks()`, `installAgents()`, `installCommands()`, `installGovernance()` helpers.

**P2 — `get-shit-done/bin/lib/init.cjs` is 2,101 lines:**
- Issue: 30+ `cmdInit*` functions covering every GSD subcommand's initialization logic, mixing project-state reading, plan-inventory scanning, context assembly, and skill-metadata operations in one file.
- Files: `get-shit-done/bin/lib/init.cjs`
- Impact: Adding a command requires touching this file. Skill-related functions (`parseSkillMetadata`, `discoverSkills`, `resolveSkillComposition`, `auditSkills`, `checkSkillVersions`) are a distinct concern from command initialization.
- Fix approach: Extract skill operations into `get-shit-done/bin/lib/skills.cjs`. Group remaining `cmdInit*` functions into logical submodules or add clear section banners if extraction cost is too high.

**P2 — `scripts/ci-coverage-report.sh` cannot produce output — its required input is never generated:**
- Issue: The script hard-requires `coverage/coverage-summary.json` (its own comment: "Requires: coverage/coverage-summary.json (from c8 --reporter json)"). But `c8`'s `json` reporter writes `coverage-final.json`, not `coverage-summary.json` — that filename is only produced by the separate `json-summary` reporter. Neither `npm run test:coverage` nor `test:coverage:full` (`package.json`) nor `.c8rc.json` ever passes `--reporter json-summary`. A repo-wide grep for `json-summary` returns zero hits outside this script's own comments.
- Files: `scripts/ci-coverage-report.sh`, `package.json` (scripts section), `.c8rc.json`, `.github/workflows/test.yml` (lines 58–63, "Generate coverage report" step)
- Impact: Every CI run hits the `[[ ! -f "$COVERAGE_JSON" ]]` branch, prints `"WARNING: ... not found. Skipping coverage report."`, and exits 0. The GitHub Actions job-summary coverage table this script exists to produce has never actually rendered. It is dead tooling that looks like a working step in a green CI run.
- Fix approach: Add `--reporter json-summary` alongside the existing `--reporter json` in the `test:coverage` / `test:coverage:full` scripts (c8 accepts multiple `--reporter` flags), or rewrite the script to derive its table from the already-produced `coverage-final.json`.

**P2 — Coverage thresholds stated in CLAUDE.md are not enforced anywhere:**
- Issue: CLAUDE.md states "90% overall / 80% per module / 95% security-critical modules" as a hard rule ("Do not treat overall coverage as passing if any individual module is below its threshold"). `.c8rc.json` sets `include`/`exclude`/`all` only — no `lines`/`branches`/`check-coverage` keys. No script passes `--check-coverage` on any threshold. The one script that reads a coverage percentage for a pass/fail judgment (`ci-coverage-report.sh`, see above) uses a hardcoded 80% overall warning threshold — not 90% — and always `exit 0` regardless ("Advisory only — never fail the build (D-12)").
- Files: `.c8rc.json`, `package.json`, `scripts/ci-coverage-report.sh`
- Impact: `scripts/check-doc-drift.cjs` keeps the *stated numbers* in CLAUDE.md honest (it fails CI if the written percentage disagrees with measured reality), but nothing stops the measured number itself from dropping below the documented policy floor — a regression just needs its CLAUDE.md number updated to match, and CI stays green.
- Fix approach: Add `lines`/`branches`/`functions` threshold keys (with `check-coverage: true`) to `.c8rc.json`, or pass `--check-coverage --lines 90` in the CI-only `test:coverage:full` invocation, so a real coverage regression fails the `test` job independent of documentation accuracy.

**P3 — `.gitignore` lists `.planning/PROJECT.md` and `.planning/research/` as "local," but both are tracked and actively committed:**
- Issue: `.gitignore`'s "Internal planning documents (STATE.md is committed; everything else is local)" block lists `.planning/PROJECT.md` and `.planning/research/`. `git ls-files` shows both are tracked, and `git log -- .planning/PROJECT.md` shows 8+ deliberate commits including recent ones explicitly titled "sync PROJECT/DEVOPS/CHANGELOG to live state" (7a43f87). `.planning/config.json` and `.planning/phases/`, listed in the same block, are correctly untracked — only these two entries are stale.
- Files: `.gitignore` (lines ~40–45), `.planning/PROJECT.md`, `.planning/research/`
- Impact: Low — no evidence this exposes anything unintended (PROJECT.md is deliberately synced), but the ignore rule now misrepresents actual practice and could mislead a future contributor into thinking these files are local-only.
- Fix approach: Remove `.planning/PROJECT.md` and `.planning/research/` from the ignore block, or add an explicit comment noting they are intentionally force-tracked exceptions.

**P3 — `prepublishOnly` still does not run tests:**
- Issue: `"prepublishOnly": "npm run build:hooks"` (`package.json`) — no test step. Unchanged from prior audits.
- Files: `package.json` (scripts section)
- Impact: Reduced since CI now gates `main` (5 required status checks on PRs), but a local `npm publish` run from a branch with a passing build and failing tests would still succeed.
- Fix approach: Add `npm test` to `prepublishOnly`.

## Known Bugs

**`lesson-capture-gate.cjs` (the Stop-event self-improvement gate) is not registered to fire in this repository:**
- Symptoms: `tasks/lessons.md` is updated only when a session manually chooses to (per CLAUDE.md's "Self-Improvement Loop" instruction), never enforced by the hook whose entire purpose is to block `Stop` until a correction is logged.
- Files: `.claude/hooks/lesson-capture-gate.cjs` (605 lines, its own docstring: "Fires on Stop event"), `.claude/settings.json`
- Trigger: `.claude/settings.json` registers only a `SubagentStop` hook (`scripts/gsd-agent-health-check.sh`). It has no `Stop` key at all. `bin/install.js` — the installer that wires hooks into a user's `settings.json` — contains zero references to `lesson-capture-gate`, confirming this hook was never intended to be installer-managed; it is meant to be registered directly in this repo's own `.claude/settings.json` (it is deliberately excluded from `package.json`'s `files` list, same as the three project-scoped agents). `$HOME/.claude/settings.json` in this environment also has no matching entry.
- Workaround: None currently in effect; lesson capture relies entirely on the operating instructions in CLAUDE.md being followed voluntarily each session.
- Root cause: This is not a new failure mode — `tasks/lessons.md` already documents this exact defect once: "[2026-04-13] [Integration]: lesson-capture-gate.cjs shipped in PR #34 with code + tests but was never registered in settings.json Stop hooks. Hook was inert for 3 days." Current on-disk state shows the same gap persists (or has recurred) with no `Stop` entry anywhere in scope.
- Fix approach: Add a `Stop` hook entry to `.claude/settings.json` invoking `node .claude/hooks/lesson-capture-gate.cjs`, then verify by triggering an actual Stop event and confirming the block fires (per the project's own 2026-04-24 lesson: "acceptance criteria that claim enforcement must be tested by attempting the blocked action, not by confirming the setting appears").

No TODO/FIXME/HACK/XXX markers exist in any `.cjs`/`.js` source file (repo-wide grep, zero hits) and no tests carry `.skip()`/`.todo()` markers other than one environment-conditional skip in `tests/validate-doc-links.test.cjs` (git unavailable). Inline debt markers are not how issues surface in this codebase — they surface as gaps between documented behavior and actual wiring, as above.

## Security Considerations

**P1 — `uat-patterns.cjs` builds shell command strings by unsanitized regex-capture interpolation, then `uat-runner.cjs` runs them with `execSync`:**
- Risk: Every `generate()` function in the pattern registry splices a regex capture group (`\S+`, which matches any non-whitespace run — including `$(...)`, backticks, and other shell metacharacters) directly into a template string: `` `test -f "${match[1]}" && echo "present" || echo "absent"` `` (line 74), `` `grep -c "${match[2]}" "${match[1]}" 2>/dev/null || echo "0"` `` (line 129), and four more sites (lines 46, 60, 87, 142). `uat-runner.cjs` line 76 then passes the fully-built string to `execSync(matched.assertion.command, ...)`, which shells out via `/bin/sh -c`. Double-quoting does not stop `$()` command substitution. The captured values originate from `must_haves.truths` strings in `PLAN.md` frontmatter — content authored by the `gsd-planner` agent (an LLM), not a human-reviewed literal.
- Files: `get-shit-done/bin/lib/uat-patterns.cjs` (lines 45–142), `get-shit-done/bin/lib/uat-runner.cjs` (line 76)
- Current mitigation: None implemented, despite being claimed. `uat-runner.cjs`'s own header comment asserts: "All commands are structurally verified to contain no write operators" — no such verification exists in either file; `generate()` performs no validation on its inputs at all. `get-shit-done/bin/lib/security.cjs` already exports `validateShellArg(value, label)` — which rejects `` $ ` ``, `;|&><`, newlines, and null bytes, exactly the shape of check this call site needs — but `uat-patterns.cjs` never imports it (its own docstring declares it "a pure function module... no intra-project imports — Layer 0 leaf node," which is presumably why the existing safe-arg helper was never wired in). This is the one `execSync`-with-a-template-string call site in the codebase; every other `child_process` call (`core.cjs`, `harden-repo.cjs`) uses `execFileSync` with an argv array, which is immune to this class of injection.
- Recommendations: Apply `validateShellArg()` (or an equivalent inline check) to every regex-captured value before template interpolation. This is the automated verification engine invoked by `/gsd:verify-work` and the unattended `idea-to-shipped` autonomous flow — it should not trust planner-generated text with unsanitized shell interpolation, independent of how likely a malicious `PLAN.md` is in practice.

**P2 — `security-scan.yml`'s `security` job is not among the branch-protection-required checks CLAUDE.md documents:**
- Risk: `.github/workflows/security-scan.yml` runs prompt-injection, base64-obfuscation, and secret scanning (`scripts/prompt-injection-scan.sh`, `scripts/base64-scan.sh`, `scripts/secret-scan.sh`) on every PR to `main`. CLAUDE.md enumerates exactly five required status checks for merge: `test (macos-latest, 22, false)`, `test (ubuntu-latest, 20, true)`, `test (ubuntu-latest, 22, true)`, `governance`, `docs-integrity`. The `security` job is not in that list. There is no `.github/settings.yml` or other in-repo source of truth for branch protection — `get-shit-done/bin/lib/harden-repo.cjs`'s `STANDARD_POLICY` deliberately preserves whatever `required_status_checks.contexts` are already live on GitHub (`'__PRESERVE_EXISTING__'`) rather than asserting a list, so nothing in the repo can confirm or deny whether `security` is actually required.
- Files: `.github/workflows/security-scan.yml`, `CLAUDE.md` (GitHub Repository Security section), `get-shit-done/bin/lib/harden-repo.cjs` (`STANDARD_POLICY`)
- Current mitigation: The scan runs and would be visible as a failed check on any PR; a maintainer would very likely notice before merging.
- Recommendations: Either add `security` to the documented and enforced required-checks list, or state explicitly in CLAUDE.md that it is advisory-only if that is the intent — the current state is ambiguous rather than deliberately one or the other.

**P3 — `.gitignore` has no generic secret-file patterns:**
- Risk: No `.env*`, `*.key`, `*.pem`, or `credentials.*` glob in `.gitignore`. The project currently has zero `.env` files and zero runtime secrets by design, so there is no active exposure, but there is also no defensive backstop if a fork or contributor adds one.
- Files: `.gitignore`
- Current mitigation: `.secretscanignore`-driven CI scanning (`scripts/secret-scan.sh` in `security-scan.yml`) catches secret-shaped strings in diffs regardless of `.gitignore`; that is a content scan, not a path exclusion.
- Recommendations: Add standard patterns (`.env*`, `*.key`, `*.pem`) as defense-in-depth.

## Performance Bottlenecks

**P3 — File-based planning lock uses busy-wait polling:**
- Problem: `withPlanningLock()` spins in a loop calling `spawnSync('sleep', ['0.1'])` while the lock is held, up to a 10-second timeout (100 iterations at 100ms).
- Files: `get-shit-done/bin/lib/core.cjs` (lines 769–820)
- Cause: Node.js has no native "wait for file change" primitive for synchronous CommonJS code; the implementation spawns a `sleep` process per retry instead.
- Improvement path: Low priority — lock contention is rare (single-user, sequential command execution). No action needed unless parallel subagent/workstream execution starts causing measurable contention.

## Fragile Areas

**P2 — Multi-runtime converter functions in `bin/install.js`:**
- Files: `bin/install.js` (lines 516–1087, 2335–2450)
- Why fragile: Adding or changing a tool-name mapping requires updating all 26 `convert*` functions in parallel. Each runtime has subtly different frontmatter/tool-name/content-transform rules; missing one during a change silently produces wrong output for only that platform.
- Safe modification: When touching tool mappings or content transforms, grep for every `convert*ToolName` / `convert*Content` function and update each; run `npm run test:e2e` to exercise installation flows end to end.
- Test coverage: 81.98% statement / 82.08% branch — the lowest of any large module in the repo (see Test Coverage Gaps).

**P2 — `harden-repo.cjs` mutates live GitHub branch-protection settings with the weakest branch coverage in the security-relevant surface:**
- Files: `get-shit-done/bin/lib/harden-repo.cjs`
- Why fragile: `applyFix()` performs a read-current → merge → PUT-full-object cycle against the GitHub API via the `gh` CLI (`execFileSync('gh', args, ...)`, line 68) — a real, external, stateful side effect, not a local file write. Branch coverage is 71.62% (53/74); the untested branches are concentrated in the gap-detection `check()` helper's null-coalescing paths (lines ~198–236) for when GitHub's API response is missing an expected field entirely (e.g., `required_pull_request_reviews` absent) — exactly the shape of response most likely from a repo whose protection was only partially configured, which is a realistic real-world input this tool exists to handle correctly.
- Common failures: An unexercised null-handling branch misjudging "already correct" vs "needs fix" would either skip a needed fix or, per the read-merge-PUT contract, submit a merge built from an incompletely-understood current state.
- Safe modification: Add fixture-driven tests for a GitHub API response with each top-level protection field individually absent (not just falsy) before changing `check()` or `mergePolicy()`.
- Test coverage: 83.33% statement / 71.62% branch (`tests/harden-repo.test.cjs`).

**P2 — UAT pattern-registry command generation (see Security Considerations):**
- Files: `get-shit-done/bin/lib/uat-patterns.cjs`, `get-shit-done/bin/lib/uat-runner.cjs`
- Why fragile: Independent of adversarial intent, any legitimate `must_have` truth string whose captured substring happens to contain a shell metacharacter (e.g., a file path or grep pattern with `$`, `` ` ``, or unbalanced quotes) will either break the generated command's syntax or silently change its meaning. There is no test fixture exercising a truth string with shell-special characters in the captured groups.
- Safe modification: Add the input-validation fix described above before extending the pattern registry with new `generate()` templates.

## Scaling Limits

**Execution history JSONL rotation:**
- Current capacity: 1,000 records before auto-rotation trims to the latest 500 (`ROTATION_THRESHOLD` / `ROTATION_KEEP`, unchanged from prior audits).
- Files: `get-shit-done/bin/lib/history.cjs`
- Scaling path: Current limits are appropriate for single-user CLI usage; no action needed.

## Dependencies at Risk

**P0 — Zero runtime dependencies (strength, not risk):**
- The project has zero production dependencies (`package.json` has no `dependencies` key, only 2 `devDependencies`: `c8@^11.0.0`, `esbuild@^0.28.1`). This eliminates supply-chain risk entirely. Maintain this.

**P3 — `.planning/dependencies/DEPENDENCIES-REPORT.md` is two months stale:**
- Risk: Last generated 2026-05-08; its only flagged finding (esbuild 0.25.12 lag) was already resolved in `package.json` (now 0.28.1, per commit 6406b0e / PR #30) without the report being regenerated. No new CVE or staleness scan has run since, so a real new finding could exist undetected.
- Files: `.planning/dependencies/DEPENDENCIES-REPORT.md`
- Migration plan: Re-run `/gsd:audit-deps` to refresh the report; low urgency given the zero-runtime-dependency surface.

## Missing Critical Features

No missing feature was found that blocks a documented GSD workflow. The gaps identified this pass are all *existing* mechanisms that don't fire or verify as documented (coverage enforcement, the coverage-report script, the lesson-capture Stop hook) rather than absent capability — see Tech Debt and Known Bugs.

## Test Coverage Gaps

**P2 — `bin/install.js`: 81.98% statement / 82.08% branch — the largest, most complex file in the repo sitting just above the documented 80% per-module floor:**
- What's not tested: Not independently reported per-`convert*` function; given the file's size (5,300 lines) and the CI branch-protection matrix testing macOS/ubuntu × Node 20/22, thin margin above the floor leaves little room before a routine change silently trips it — and nothing would fail CI if it did (see Tech Debt: coverage thresholds unenforced).
- Files: `bin/install.js`
- Risk: This is the actual `bin` entry point (`get-shit-done-cc`) every new user runs.
- Priority: Medium-High

**P2 — `harden-repo.cjs`: 71.62% branch coverage on a module that PUTs live GitHub branch-protection state:**
- What's not tested: Null/absent-field paths in the GitHub API response merge logic (see Fragile Areas).
- Files: `get-shit-done/bin/lib/harden-repo.cjs`
- Risk: Misconfigured branch protection with no test to catch it before a live `gh api ... PUT`.
- Priority: High

**P2 — `profile-pipeline.cjs`: 83.67% statement / 70.14% branch — the weakest branch coverage in the repo:**
- What's not tested: Edge cases in session-JSONL scanning/sampling (`scanProjectDir`, message extraction, recency-weighted sampling) — malformed lines, empty sessions, permission errors. Reads real `~/.claude/projects/*.jsonl` session history.
- Files: `get-shit-done/bin/lib/profile-pipeline.cjs`
- Risk: Silent garbling of behavioral-profiling output; low severity (UX only, no destructive writes) but currently the single lowest-branch-coverage module measured.
- Priority: Medium

**P3 — `smart-discuss.md` (306-line workflow, called from both `/gsd:autonomous` and `idea-to-shipped`) has no dedicated contract test:**
- What's not tested: `smart-discuss.md`'s own step logic in isolation. It is only incidentally exercised through `tests/idea-to-shipped.test.cjs`'s exercise of the caller path — unlike its sibling new workflows (`daily-startup.md`, `wrap-and-sync.md`, `idea-to-shipped.md`), each of which has its own dedicated test file (`tests/daily-startup.test.cjs`, `tests/wrap-and-sync.test.cjs`, `tests/idea-to-shipped.test.cjs`).
- Files: `get-shit-done/workflows/smart-discuss.md`
- Risk: A regression in `smart-discuss.md` reachable only from the `/gsd:autonomous` entry point (not via `idea-to-shipped`) could pass CI undetected.
- Priority: Low-Medium

## Summary Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 1 | Zero runtime dependencies (strength, not a risk) |
| P1 | 3 | CLAUDE.md architecture section describes a nonexistent `lib/` layout and a fictional `governance.cjs`; `bin/install.js` 5,300-line monolith; unsanitized shell interpolation in the UAT pattern registry |
| P2 | 9 | `init.cjs` size; broken `ci-coverage-report.sh`; unenforced coverage thresholds; security-scan not in documented required checks; `install.js`/`harden-repo.cjs`/`profile-pipeline.cjs` coverage gaps; multi-runtime converter fragility; UAT pattern-registry fragility |
| P3 | 6 | Stale `.gitignore` planning-doc entries; `prepublishOnly` skips tests; missing generic secret patterns in `.gitignore`; busy-wait lock; stale dependency report; untested `smart-discuss.md` |
| Bug | 1 | `lesson-capture-gate.cjs` Stop hook not registered — self-improvement loop is not enforced (recurrence of a previously logged-and-presumed-fixed defect) |

---

*Concerns audit: 2026-07-12*
*Update as issues are fixed or new ones discovered*
