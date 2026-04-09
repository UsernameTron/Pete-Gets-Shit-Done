# Todo

## Current Status: v2.0 Intelligence Layer -- Shipped

v2.0 milestone shipped and archived (2026-04-05). Tag: v2.0.
2069 tests passing across 403 suites. 15 active agents, 7 archived.

## Open Items

- [ ] Define next milestone (`/gsd:new-milestone`)

---

## Layer 2 Spec — Lesson-Capture Enforcement (DRAFT, awaiting approval)

**Branch**: `feat/lesson-capture-enforcement`
**Status**: Plan mode. Do not implement until Pete approves.
**Design brief**: 2026-04-09 Signal Detection lesson (`tasks/lessons.md`). Bare keyword matching inflates signal counts on instructional prose. Fix must distinguish correction *intent* from incidental mention.

### a. Phrase-Set Refinement — Intent-Aware Matcher

Replace `countSignals`' substring-includes loop with a two-stage matcher:

**Stage 1 — Sentence segmentation.** After `stripCode`, split message content into sentences on `.`, `!`, `?`, or newline. Trim + lowercase each sentence. The match unit becomes the *sentence*, not the whole message. This kills cross-sentence false positives where "stop" in one sentence and "don't" in another compound into noise.

**Stage 2 — Intent-gated phrase matcher.** Phrases are classified into three tiers, each with different firing rules:

| Tier | Phrases | Firing Rule |
|---|---|---|
| **Strong** (fire on bare sentence match) | `you're wrong`, `that's wrong`, `you're right` (asst), `my mistake` (asst), `i was wrong` (asst), `that's not right`, `that's not correct`, `that's not what i said`, `you missed`, `i said` (as sentence-start + following content), `re-read` | Sentence-level `includes` — these phrases are inherently corrective, no qualifier needed |
| **Medium** (require imperative-to-you structure) | `don't`, `stop`, `try again` | Must appear in a sentence that (a) starts with the phrase OR (b) is preceded within the sentence by one of: `no,`, `no.`, `wrong.`, `wrong,`, `you`, `— ` em-dash rebuttal marker. Example: `"don't touch auth"` → NO MATCH (bare imperative instruction). `"you're wrong — don't do that"` → MATCH (rebuttal context). `"no, don't"` → MATCH. |
| **Weak** (dropped entirely) | `correction`, `actually`, `no,` | Remove from the set. `correction` fires on its own category name in planning docs. `actually` is routine hedging. `no,` fires on every "no, let's do X instead" planning choice. |

**Speaker-turn adjacency gate.** A user sentence only counts if the *previous* message is an assistant turn. This is the "corrections come in response to something" insight. Implementation: in `countSignals`, track `prevRole`; if `role === 'user' && prevRole !== 'assistant'`, the sentence cannot contribute signals. This eliminates the entire opening user turn (task briefings, prompts) from counting, regardless of what phrases it contains.

**Assistant signals keep old semantics.** Assistant corrections ("my mistake", "i was wrong", "let me fix") remain simple sentence-level strong matches — assistant never speaks first in a correction context; the speaker-turn gate doesn't apply to them.

**Signatures (new):**

```js
/**
 * Split cleaned text into sentences. Keeps trailing punctuation off.
 * @param {string} text  Already-stripCode'd content.
 * @returns {string[]}
 */
function splitSentences(text) { /* … */ }

/**
 * Test whether a sentence contains a corrective rebuttal marker that
 * licenses medium-tier phrase matches.
 * @param {string} sentence  Lowercased sentence.
 * @returns {boolean}
 */
function hasRebuttalMarker(sentence) { /* … */ }

/**
 * Intent-aware signal detector. Replaces the old substring scanner.
 * @param {Array<{role, content}>} messages
 * @returns {number}
 */
function countSignals(messages) { /* new implementation */ }
```

`stripCode`, `parseTranscript`, `checkLessonsWindow`, `deriveSlug` are unchanged.

**Positive test cases (MUST fire):**
1. `[user follows assistant] "you're wrong about the slug format"` → 1 (strong)
2. `[user follows assistant] "that's not what I said. re-read the spec."` → 2 (strong × 2, different sentences)
3. `[user follows assistant] "no, don't do that — you missed the edge case"` → 2 (medium "don't" licensed by "no," + strong "you missed")
4. `[user follows assistant] "you're wrong. don't touch deriveSlug."` → 2 (strong + medium "don't" licensed by "wrong." preceding)
5. `[user follows assistant] "I said use a single dash"` → 1 (strong "i said")
6. `[user follows assistant] "try again. that's not right."` → 2 (medium "try again" at sentence-start + strong)
7. `[user follows assistant] "stop — that's wrong"` → 2 (medium "stop" at sentence-start + strong)
8. `[assistant turn] "my mistake, let me fix that"` → 2 (strong asst + strong asst)
9. `[assistant turn] "you're right, I was wrong about the spec"` → 2 (strong asst + strong asst)
10. `[user follows assistant] "you missed the test case for trailing slash"` → 1 (strong)
11. `[user follows assistant] "re-read the deriveSlug section"` → 1 (strong)
12. `[user follows assistant] "incorrect. try again."` → 2 — **requires adding `incorrect` to strong tier.** Capture this in the test suite and make sure it's in the phrase list.

**Negative test cases (MUST NOT fire) — drawn from the 6 known false positives + real planning prose:**
1. `[user, opening turn, no prior assistant] "Layer 2 must tighten the phrase set and add a lesson-capture subagent. Do NOT pop the phase-34-scratch-preserve stash. Do NOT switch branches."` → 0 (speaker-turn gate blocks opening user turn entirely)
2. `[user follows assistant] "don't touch auth module"` → 0 (bare imperative, no rebuttal marker)
3. `[user follows assistant] "stop at Layer 1"` → 0 (imperative instruction, not rebuttal)
4. `[user follows assistant] "no, let's proceed with option B instead"` → 0 — **important edge case**. "no," is dropped entirely from the weak tier, so this sentence produces no match. Intentional.
5. `[user follows assistant] "the correction is in section 3"` → 0 (`correction` dropped from weak tier)
6. `[user follows assistant] "actually, that approach works"` → 0 (`actually` dropped from weak tier)
7. `[user follows assistant] "try to avoid coupling the two modules"` → 0 (no `try again`, just "try")
8. `[user follows assistant] "I said X earlier but let's revisit"` — ambiguous; spec says this SHOULD match as a strong signal. Edge case — acceptable false positive. Document it.
9. `[user follows assistant] "don't forget to run the full suite"` → 0 (imperative, no rebuttal)
10. `[user follows assistant] "the stop hook blocks on correction signals"` → 0 (descriptive, `correction` dropped, `stop` not sentence-initial, no rebuttal)
11. `[user follows assistant] "no phrase matching on 'don't' alone"` → 0 — meta-discussion of the hook itself
12. `[assistant turn] "I will stop after Layer 1"` → 0 (no assistant signal phrases present)

**Backwards compatibility:** The existing 25 tests must continue to pass except for the ones whose semantics intentionally change. The known changes:
- `countSignals: sums across user and assistant turns` — uses `{user: "that's wrong", assistant: "my mistake, let me fix this"}` and expects 3. Still passes because "that's wrong" is strong, "my mistake" is strong asst, "let me fix" is strong asst. All firing. Count = 3. ✓
- Tests that rely on `you're wrong` / `that's wrong` still pass.
- Tests that rely on `no,` alone (none exist currently) — N/A.
- Speaker-turn adjacency may break `signals present + lessons unchanged in session → exit 2` — that test has only a single user message. Fix: the test uses `you're wrong` as the sole content. That's a strong-tier phrase. The speaker-turn gate applies only when the previous turn is not an assistant — which is the case here (first message). **Decision: the speaker-turn gate must allow strong-tier phrases to fire even in opening turns.** Tier rule: strong phrases don't need speaker-turn context. Only medium-tier needs speaker-turn + rebuttal context. Update the rule table above: strong tier ignores speaker-turn adjacency; medium tier requires both.

### b. Lesson-Capture Subagent

**File**: `.claude/agents/lesson-capture.md` (project-scoped, joins the existing 3 specialists)

**Scope**: Read-only transcript analysis + surgical append to `tasks/lessons.md`. Does NOT modify source code, tests, docs, or planning files. The only write is to `tasks/lessons.md`.

**Tools allowed**: `Read`, `Grep`, `Edit` (restricted to `tasks/lessons.md` by instruction; no Write, no Bash, no MCP).

**Model**: `sonnet` (balance — needs judgment to distinguish rule-worthy from noise, not heavy reasoning).

**Input contract** (passed explicitly by the Stop hook when it invokes the agent, or by Pete manually):

```
{
  "transcript_path": "/absolute/path/to/session.jsonl",
  "signal_count": <integer>,
  "lessons_path": "/absolute/path/to/tasks/lessons.md",
  "session_start_iso": "2026-04-09T10:00:00Z"
}
```

**Output contract** (structured, not prose):

```json
{
  "action": "appended" | "exempted" | "no_rule",
  "entry": "- [YYYY-MM-DD] [Category]: <rule>. Triggered by: <what went wrong>.",
  "rationale": "<one sentence>"
}
```

**Behavior**:
1. Read the transcript at `transcript_path`. Find the user turns following assistant turns where `countSignals` > 0.
2. For each candidate, judge: is there a *rule* that would prevent this correction from recurring? A rule is a constraint on future behavior, not a description of what happened.
3. If yes → compose a single-line entry in the exact format from `CLAUDE.md` (`- **[Category]**: [Rule]. Triggered by: [what went wrong].`). Append to `lessons.md` under `## Active Rules > ### Learned Rules`. Do NOT touch existing entries. Do NOT reorder. Do NOT deduplicate on the fly — if a rule looks similar to an existing one, still append and let Pete merge.
4. If no rule-worthy correction → write a single-line exemption under `## Session Exemptions` with the date and a one-sentence justification.
5. Return the JSON output contract. The Stop hook or Pete decides what happens next.

**Clobber safety**:
- Agent always reads lessons.md in full before editing.
- Agent uses `Edit` with `old_string` anchored on existing headers (`### Learned Rules\n` or `## Session Exemptions\n<!-- Single-line justifications when a session legitimately has no rule to capture -->\n`) and appends after them. Never replaces.
- If the anchor is missing, agent reports `action: "no_rule"` with `rationale: "lessons.md structure drifted; manual capture required"` and exits without writing.
- Agent operates only in edit-append mode. If the `Edit` fails due to ambiguous anchor, agent retries once with a larger anchor context, then gives up.

**Stop hook invocation wiring**:
- Layer 1 hook currently exits 2 with a human-facing message telling Pete to invoke the subagent manually via the Task tool.
- Layer 2 hook keeps that behavior by default (the subagent cannot be auto-invoked from a bash hook — it requires Claude's Task tool). The message is updated to point at the new agent filename. No automatic invocation.
- Future work (not in Layer 2 scope): investigate whether a prompt-based Stop hook (`type: prompt`) can auto-invoke the subagent. Out of scope for this branch.

### c. Test Plan

**Unit tests** (extend `tests/lesson-capture-gate.test.cjs`):
- `splitSentences` — 8 tests covering `.`, `!`, `?`, newlines, multiple sentences, no punctuation, edge whitespace, empty string.
- `hasRebuttalMarker` — 6 tests covering each rebuttal marker (`no,`, `no.`, `wrong.`, `wrong,`, `you`, `— `), plus 2 negative cases.
- `countSignals` (intent-aware) — 24 tests: the 12 positive + 12 negative cases above.
- Speaker-turn adjacency — 4 tests: strong signal in opening user turn (fires), medium signal in opening user turn (does not fire), medium signal after assistant turn with rebuttal (fires), medium signal after assistant turn without rebuttal (does not fire).

**Integration test — Layer 1 replay**:
- New file: `tests/fixtures/layer1-build-session.jsonl`. Hand-constructed fixture that mimics the 6-false-positive session. Contents: user briefings + assistant planning prose containing "don't touch", "stop at Layer 1", "correction", "no, let's", "actually" — all non-corrective.
- Test: `test('Layer 1 build session replay produces 0 signals')`. Asserts `countSignals(messages) === 0` on the fixture. This is the acceptance criterion for the phrase-set refinement.
- The fixture is NOT the actual captured transcript — synthetic so we can commit it without leaking session data.

**Regression**:
- Full `npm test` must produce 2094/2094 + however many tests we add. No pre-existing failures.
- `npm run test:coverage` — confirm `lesson-capture-gate.cjs` coverage stays ≥95% (security-critical threshold; this is a gate hook).

**Subagent tests**:
- Manual only for Layer 2 — subagent behavior is hard to unit-test without mocking Claude. Verified by invoking the agent against the Layer 1 fixture transcript and confirming it either produces a valid exemption or a valid rule entry. Document the manual verification in the commit message.

### d. Rollout Gate

The hook stays in "dev-only" mode (active on `feat/lesson-capture-enforcement` branch only) until ALL of the following are true:

1. **Zero false positives on the Layer 1 replay fixture** (unit-tested).
2. **Zero false positives on 3 consecutive real sessions** (Pete manually confirms after running 3 sessions on the branch). Any false positive → back to plan mode.
3. **Subagent successfully captures at least 1 real lesson** end-to-end (Pete runs a session with a genuine correction, invokes the subagent, subagent produces a valid `lessons.md` append).
4. **Full test suite green**: 2094+ tests passing, coverage thresholds met.
5. **Pete explicit sign-off** before merging to main.

When all 5 conditions hold, the rollout mechanism is: merge branch → hook is active globally for this project → no other flag change needed. The hook is already wired via `.claude/settings.json` at the project level.

**Kill switch**: If the hook produces a false positive after merge, immediate fix is to delete the `Stop` matcher from `.claude/settings.json` (one-line revert) and open a `fix/lesson-capture-false-positive` branch. Document this in the commit message.

### Scope Boundaries — What Layer 2 Does NOT Touch

- **No v2.1 write-once-perimeters work.** That's a separate milestone. Do not pattern-apply Pattern 10/11 into core.cjs as part of this branch.
- **No changes to `.planning/STATE.md` milestone fields.** Layer 2 is inside the existing milestone drift window; STATE.md gets a Session Handoff update only.
- **No changes to user-global `~/.claude/hooks/gsd-lessons-check.sh`.** This is the project-scoped hook only.
- **No changes to `CLAUDE.md` governance rules.** The lesson format already exists.
- **No new plan files in `.planning/phases/`.** Layer 2 is tracked here in `tasks/todo.md` + commits, not as a formal phase (that would be scope creep for a hook refinement).

### Execution Order (after approval)

1. Commit 1 — `feat(hooks): tighten lesson-capture phrase matcher`
   - Update `.claude/hooks/lesson-capture-gate.cjs` (`countSignals` + helpers + phrase tiers)
   - Add `tests/fixtures/layer1-build-session.jsonl`
   - Extend `tests/lesson-capture-gate.test.cjs` (+42 tests)
   - Run `npm test` → expect 2136/2136 (2094 + 42)
   - Prove 0 false positives on replay fixture (explicit test)
2. Commit 2 — `feat(agents): add lesson-capture subagent`
   - Add `.claude/agents/lesson-capture.md`
   - Update hook's block-path stderr message to reference the new agent file
   - Run `npm test` → expect 2136/2136 (no hook logic changes this time)
3. Update `tasks/lessons.md` if any new lessons emerge from the work.
4. Update `.planning/STATE.md` Session Handoff block.
5. **STOP** — do not open a PR. Pete reviews the diff.

### Risk Register

| Risk | Mitigation |
|---|---|
| New matcher breaks one of the 25 existing tests | Audit each existing test against new tier rules BEFORE coding. The audit above identifies one potential issue (speaker-turn gate on first-message tests) and resolves it by exempting strong tier from speaker-turn gate. |
| Subagent clobbers existing lessons.md content | Anchored Edit with read-before-write + fail-closed on ambiguous anchor. |
| Fixture drift — replay fixture becomes stale as phrase list changes | Co-locate fixture with tests; update both in the same commit. |
| Scope creep into v2.1 | Hard rule: no touches to `lib/core.cjs`, `lib/classify.cjs`, `lib/model-profiles.cjs`, `lib/history.cjs`. |
| Spec-vs-reality repeat (2026-04-09 lesson) | Before coding: write the new `countSignals` by hand against the 24 test cases. If any case refuses to fit the tier model, STOP and re-plan. Don't ship a detector that fights its own spec. |

---


## Completed

- [x] v1.0 Post-Merge Cleanup (2026-03-26)
- [x] v1.1 Testing & Hardening (2026-03-26)
- [x] v1.2 Agent Quality & Consolidation (2026-04-04)
- [x] v1.3 Security Hardening & Coverage (2026-04-04)
- [x] v1.4 Correctness & Robustness (2026-04-04)
- [x] v1.5 Performance (2026-04-04)
- [x] v1.6 Maintainability (2026-04-04)
- [x] v1.7 End-to-End Integration Testing (2026-04-04)
- [x] v1.8 Documentation & Accuracy (2026-04-05)
- [x] v1.9 Ship Readiness & Hygiene (2026-04-05)
- [x] v2.0 Intelligence Layer (2026-04-05)
- [x] Codebase mapping refresh (2026-04-06)
- [x] README.md and CLAUDE.md refresh (2026-04-06)
- [x] Merged PR #31 to main (2026-04-06)

## Session Handoff

**State tracking**: `.planning/STATE.md` is canonical.
**Branch**: `feat/lesson-capture-enforcement` (clean, 2 commits ahead of main)
**Last session (2026-04-09)**: Layer 1 of lesson-capture Stop gate
- Built `.claude/hooks/lesson-capture-gate.cjs` (364 lines, 5 exported pure helpers)
- Wired project-scoped Stop hook in `.claude/settings.json` (additive to user-global `gsd-lessons-check.sh`)
- 25 tests in `tests/lesson-capture-gate.test.cjs`, all green; full suite 2094/2094 across 403 suites
- Caught and fixed `deriveSlug` spec-vs-reality bug (spec said `'-' + cwd.replaceAll('/', '-')` which double-dashes; actual Claude Code slug uses single leading dash)
- Captured 2 lessons: spec-vs-reality discipline, signal-detection false-positive findings
- Commits: `d0ae43c` (feat: hook + tests), `5a0de6f` (docs: lessons)
**Layer 2 deferred**: Phrase-set tightening — bare keyword matching on `don't`/`stop`/`no,` inflates false positives on instructional text. Gate fired on its own build session with 6 false signals. Refine before long-term enablement.
**Next**: Layer 2 of lesson-capture-enforcement (phrase-set refinement + lesson-capture subagent), OR resume `/gsd:discuss-phase 34` on `feat/v2.1-write-once-perimeters`. Pete's call.
