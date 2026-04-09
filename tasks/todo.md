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

### Resume Checkpoint

- **Current commit**: `f2b0e22`
- **Branch**: `feat/lesson-capture-enforcement` (6 ahead of main, clean)
- **Status**: Plan committed, awaiting implementation approval — **APPROVAL GIVEN** (2026-04-09 session 2). Paused before Commit 1 due to context budget, per spec-vs-reality discipline.
- **Next action**: **Commit 1** — `feat(hooks): tighten lesson-capture phrase matcher`.
  - Scope: rewrite `countSignals`; add tiered matcher with imperative + subject + negation-proximity rules; add speaker-turn gate; build replay fixture from the 6 known 2026-04-09 false positives; +42 tests; prove 0 false positives on replay; full suite must stay green (currently 2094/2094).
- **Following action**: **Commit 2** — `feat(agents): add lesson-capture subagent`.
  - Scope per Layer 2 spec section b (this doc, above).
- **Hard rule on resume**: Do NOT start Commit 2 until Commit 1 ships green. Do NOT open PR until both commits land + `.planning/STATE.md` Session Handoff updated. Fresh session: run `/prime`, then re-read this "Resume Checkpoint" and section (a) of the Layer 2 spec before touching code.

### Risk Register

| Risk | Mitigation |
|---|---|
| New matcher breaks one of the 25 existing tests | Audit each existing test against new tier rules BEFORE coding. The audit above identifies one potential issue (speaker-turn gate on first-message tests) and resolves it by exempting strong tier from speaker-turn gate. |
| Subagent clobbers existing lessons.md content | Anchored Edit with read-before-write + fail-closed on ambiguous anchor. |
| Fixture drift — replay fixture becomes stale as phrase list changes | Co-locate fixture with tests; update both in the same commit. |
| Scope creep into v2.1 | Hard rule: no touches to `lib/core.cjs`, `lib/classify.cjs`, `lib/model-profiles.cjs`, `lib/history.cjs`. |
| Spec-vs-reality repeat (2026-04-09 lesson) | Before coding: write the new `countSignals` by hand against the 24 test cases. If any case refuses to fit the tier model, STOP and re-plan. Don't ship a detector that fights its own spec. |

---

## Commit 1 Implementation Plan — `feat(hooks): tighten lesson-capture phrase matcher`

**Status:** Awaiting approval. Do not implement until Pete signs off.
**Branch:** `feat/lesson-capture-enforcement` @ `18cf220` (8 ahead of main, clean, full suite 2094/2094 green).
**Architecture:** Pattern 8 (Compound Command Decomposition) from KB v2.1 — primary design. A session transcript is a compound input; the unit of decomposition is the sentence; each sentence is validated for correction intent independently.

**Spec reconciliation — Option 1 (charitable reading).** This plan adopts the committed Layer 2 spec tier model (Strong / Medium / dropped) and maps today's execution instructions (Tier 1 / 2 / 3) onto it by treating Tier 3 (boot exclusion) as **new work** layered on top. If the operator overrides to Option 2 (strict reading) or rewrites the committed tier model, this plan is invalidated and requires re-planning. See the SPEC DELTA flag in the session response.

### A. Unit decomposition strategy (Pattern 8)

Decomposition layers, outermost to innermost:

1. **Transcript → messages.** Existing `parseTranscript`. Unchanged.
2. **Message → turn classification.** New helper `classifyTurn(msg, prevRole)` → `'boot' | 'operator' | 'assistant' | 'skip'`.
3. **Turn content → sentences.** New helper `splitSentences(text)` — splits on `.`, `!`, `?`, hard newlines; trims; lowercases; drops empty strings.
4. **Sentence → tier match.** New helpers `matchStrongTier(sentence)`, `matchMediumTier(sentence, licensed)`, `hasRebuttalMarker(sentence)`.

**Pattern 8 analog:** `docker ps && curl evil.com` is decomposed into `docker ps` and `curl evil.com`, each validated independently. Here, a multi-sentence user turn is decomposed into individual sentences, each validated for corrective intent independently. A Medium-tier phrase in sentence A cannot license a phrase match in sentence B — same as how `docker ps` passing a permission check cannot license `curl evil.com`.

### B. Tiered matcher design

**Phrase set constants** (exported for testability):

```js
STRONG_USER = [
  "you're wrong", "that's wrong", "that's not right", "that's not correct",
  "that's not what i said", "you missed", "re-read", "incorrect"
];

STRONG_USER_SENTENCE_START = ["i said "];  // prefix match only

MEDIUM_USER = ["don't", "stop", "try again"];

STRONG_ASSISTANT = [
  "you're right", "my mistake", "i was wrong", "let me fix", "correcting"
];

DROPPED_FROM_SIGNAL_SET = ["correction", "actually", "no,"];
// These NEVER fire. `no,` and `wrong.` still act as rebuttal markers.
```

**Firing rules (per sentence, after `stripCode` and lowercasing):**

- **Strong user.** Sentence contains any `STRONG_USER` phrase as substring → +1. **Ignores speaker-turn gate** — fires even in opening operator turn (preserves committed spec behavior: a lone `"you're wrong"` in the first turn must still produce exit 2 to pass existing integration test `signals present + lessons unchanged in session → exit 2`).
- **Strong user sentence-start.** Sentence (after trim) starts with a `STRONG_USER_SENTENCE_START` prefix → +1. Prevents `"I said X earlier but let's revisit"` from matching in the middle of prose; requires sentence-initial position. Acceptable edge case (committed spec negative #8): `"I said X earlier"` sentence-initial will still fire — documented.
- **Medium user.** Sentence contains a `MEDIUM_USER` phrase AND one of:
  - (a) the phrase is at sentence start (prefix), AND the sentence is more than just the phrase itself (prevents single-word `"stop."` firing in boot instructional text); OR
  - (b) a rebuttal marker appears BEFORE the phrase in the sentence (`no,`, `no.`, `wrong.`, `wrong,`, `— ` em-dash, `you` as word boundary).
  AND the turn is classified `'operator'` AND `prevRole === 'assistant'`. Medium NEVER fires in boot turns or opening operator turns.
- **Strong assistant.** Sentence contains any `STRONG_ASSISTANT` phrase as substring → +1. No speaker-turn gate (assistant can self-correct).
- **Dropped phrases.** `correction`, `actually`, `no,` never contribute to the signal count on their own. `no,` and `wrong.` / `wrong,` still license Medium-tier matches as rebuttal markers.

**Dedup rule.** Per-sentence phrase-match `Set`, summed across sentences within a turn, summed across turns. No cross-sentence dedup within a turn (committed spec positive #2: `"that's not what I said. re-read the spec."` must sum to 2).

### C. Speaker-turn gate (includes new Tier 3 boot exclusion)

**`classifyTurn(msg, prevRole)`** — new pure helper, returns one of:

- `'boot'` — user turn matching the boot detection predicate (see below). Drop entirely from signal counting.
- `'assistant'` — role is assistant.
- `'operator'` — role is user AND not a boot turn.
- `'skip'` — malformed, empty, or non-string content.

**`isBootTurn(msg)`** — new pure helper. Returns true if any of:

1. Content contains `<command-name>/prime`, `<command-name>/wrap`, `<command-name>/clear`, OR `<command-name>/gsd:` as substring.
2. Content contains `<command-name>` with a `<local-command-stdout>` sibling tag (indicates slash-command invocation turn).
3. After stripping all `<system-reminder>...</system-reminder>` blocks AND all `<command-*>...</command-*>` blocks, the remaining trimmed content is empty OR under 20 characters. This catches harness-injected turns that contain no real operator prose (e.g., the third 2026-04-09 false positive: the `/gsd:prime-patterns` boot reminder payload).

Boot detection runs BEFORE sentence segmentation. A boot turn contributes zero to signal counting regardless of what phrases are inside it.

**Rationale:** the third 2026-04-09 false positive (this session) fires because `/gsd:prime-patterns` injects CLAUDE.md content containing `"don't"`, `"stop"`, etc. as instructional prose. None of those turns carry operator correction intent — they're harness output. Tier 3 removes the entire turn from the signal pool.

**Speaker-turn adjacency** (enforced in rewritten `countSignals`):

- Strong user fires regardless of `prevRole`.
- Strong assistant fires regardless of `prevRole`.
- Medium user fires only if `prevRole === 'assistant'` AND the current turn is `'operator'`.

### D. Replay fixture

**New file:** `tests/fixtures/layer1-false-positives.jsonl`

**Format:** JSONL, one message per line, matching the Claude Code transcript shape `{type, message: {role, content}, timestamp?}` so `parseTranscript` consumes it directly.

**Contents — three sections, self-contained:**

**Section 1 — Layer 1 build session replay (synthesized).**
Synthesized recreation of the original 6-false-positive session (raw transcript was never captured). Structure:
- Operator opening turn: Layer 2 work briefing. Contains phrases like `"Layer 2 must tighten the phrase set"`, `"Do NOT pop the phase-34-scratch-preserve stash"`, `"Do NOT switch branches"`, `"stop at Layer 1"`.
- Assistant planning turn: contains `"don't touch auth module"`, `"correction is in section 3"`, `"no, let's proceed with option B"`, `"actually, that approach works"`.
- Operator follow-up: `"try to avoid coupling the two modules"`, `"don't forget to run the full suite"`.

**Raw input excerpt (first section):**
```jsonl
{"type":"user","timestamp":"2026-04-09T08:00:00Z","message":{"role":"user","content":"Layer 2 must tighten the phrase set and add a lesson-capture subagent. Do NOT pop the phase-34-scratch-preserve stash. Do NOT switch branches. stop at Layer 1 until I review."}}
{"type":"assistant","timestamp":"2026-04-09T08:00:05Z","message":{"role":"assistant","content":"Understood. don't touch auth module while Layer 2 lands. The correction is in section 3 of the spec. no, let's proceed with option B instead of A. actually, that approach works fine."}}
{"type":"user","timestamp":"2026-04-09T08:05:00Z","message":{"role":"user","content":"try to avoid coupling the two modules. don't forget to run the full suite."}}
```
**Expected classification:** turn 1 = opening operator (no `prevRole='assistant'`, Medium gate blocks `stop`), turn 2 = assistant (no STRONG_ASSISTANT phrases, all planning prose), turn 3 = operator with `prevRole='assistant'` BUT no rebuttal markers preceding `don't` or `try`.
**Expected count:** `countSignals === 0`.
**Rationale:** reproduces the 6 false positives reported in the 2026-04-09 signal-detection lesson. Previously fired on `stop`, `don't` (×2 across turns), `correction`, `no,`, `actually` = 6. New matcher drops all six because (a) Medium never fires in opening turn, (b) opening turn contains no Strong phrases, (c) assistant turn contains no STRONG_ASSISTANT phrases, (d) follow-up operator turn has no rebuttal markers, (e) `correction`/`no,`/`actually` are dropped entirely.

**Section 2 — First /gsd:prime-patterns boot (synthesized, from earlier today).**
Structure:
- Operator turn: `/gsd:prime-patterns` slash command invocation with full `<command-name>` / `<command-message>` / `<command-args>` payload.
- Assistant turn: boot report listing loaded lessons + active design patterns. Quotes lesson content containing phrases like `"don't"`, `"stop"` from the KB pattern descriptions.

**Raw input excerpt (second section):**
```jsonl
{"type":"user","timestamp":"2026-04-09T12:00:00Z","message":{"role":"user","content":"<command-name>/gsd:prime-patterns</command-name>\n<command-message>gsd:prime-patterns</command-message>\n<command-args></command-args>"}}
{"type":"assistant","timestamp":"2026-04-09T12:00:10Z","message":{"role":"assistant","content":"Session initialized. 5 patterns loaded from KB v2.1. Pattern 8 Compound Command Decomposition: break compound shell commands and validate each one independently. Next action: start Commit 1."}}
```
**Expected classification:** turn 1 = `'boot'` (contains `<command-name>/gsd:prime-patterns`), dropped entirely. Turn 2 = assistant, scanned for STRONG_ASSISTANT phrases only — contains none.
**Expected count:** `countSignals === 0`.

**Section 3 — Second /gsd:prime-patterns boot (this session, synthesized from today's 1-signal false positive).**
Structure:
- Operator turn: `/clear` slash command.
- Operator turn: `/gsd:prime-patterns` with full command payload containing the prompt text (which includes `"don't"`, `"stop"`, `"correction"` as instructional prose inside the prompt).
- Assistant turn: boot report.

**Raw input excerpt (third section):**
```jsonl
{"type":"user","timestamp":"2026-04-09T18:00:00Z","message":{"role":"user","content":"<command-name>/clear</command-name>\n<command-message>clear</command-message>\n<command-args></command-args>\n<local-command-stdout></local-command-stdout>"}}
{"type":"user","timestamp":"2026-04-09T18:00:05Z","message":{"role":"user","content":"<command-name>/gsd:prime-patterns</command-name>\n<command-message>gsd:prime-patterns</command-message>\n<command-args></command-args>\n<objective>Single-command session boot that loads project state AND injects the relevant Claude Code design patterns from KB v2.1. don't bare-match session blobs. stop at the right tier.</objective>"}}
{"type":"assistant","timestamp":"2026-04-09T18:00:10Z","message":{"role":"assistant","content":"Session initialized. 5 patterns loaded. Next action: Commit 1 of Layer 2."}}
```
**Expected classification:** turn 1 = `'boot'` (`<command-name>/clear`), turn 2 = `'boot'` (`<command-name>/gsd:prime-patterns`), turn 3 = assistant with no STRONG_ASSISTANT phrases.
**Expected count:** `countSignals === 0`. Previously fired 1 signal on the prompt payload.

**Rationale for all three sections:** each is a high-value regression test because it proves the matcher does not fire on (1) instructional operator prose, (2) slash-command boot payloads, (3) boot text that embeds correction-adjacent keywords as examples.

**Target:** `countSignals` on the concatenated fixture (all three sections parsed together) === **0**.

### E. Test plan — +63 tests (minimum target was +42)

Broken out by tier and helper, each test has explicit provenance.

**`splitSentences` — 8 tests (T1–T8):**
- T1 splits on `.` — `"a. b. c."` → `["a", "b", "c"]`
- T2 splits on `!`
- T3 splits on `?`
- T4 splits on `\n`
- T5 mixed delimiters `"a. b! c?\nd"` → 4 sentences
- T6 no punctuation returns single sentence
- T7 empty string returns `[]`
- T8 leading/trailing whitespace stripped per sentence

**`hasRebuttalMarker` — 7 tests (T9–T15):**
- T9 `"no, don't"` → true
- T10 `"no. don't"` → true
- T11 `"wrong, try again"` → true
- T12 `"wrong. try again"` → true
- T13 `"a — don't"` (em-dash) → true
- T14 `"you don't"` (word boundary) → true; `"your"` alone → false
- T15 bare text without any marker → false

**`isBootTurn` — 6 tests (T16–T21):**
- T16 `<command-name>/gsd:prime-patterns` → true
- T17 `<command-name>/prime` → true
- T18 `<command-name>/wrap` → true
- T19 `<command-name>/clear` → true
- T20 only `<system-reminder>` wrapping → true (after block strip, empty)
- T21 normal operator prose without tags → false

**`matchStrongTier` — 7 tests (T22–T28):**
- T22 `"you're wrong about the slug"` → 1
- T23 `"that's not right"` → 1
- T24 `"re-read the spec"` → 1
- T25 `"you missed the edge case"` → 1
- T26 `"i said use a single dash"` (sentence-start) → 1
- T27 `"i said X earlier but revisit"` (sentence-start) → 1 (documented acceptable edge)
- T28 `"the correction is in section 3"` → 0 (`correction` dropped)

**`matchMediumTier` + speaker-turn gate — 8 tests (T29–T36):**
- T29 `"don't touch auth"` after assistant turn, no rebuttal → 0
- T30 `"don't."` lone sentence after assistant → 0 (prefix match requires more than just the phrase)
- T31 `"no, don't do that"` after assistant → 1
- T32 `"you're wrong — don't do that"` after assistant → 2 (Strong + Medium)
- T33 `"stop at Layer 1"` after assistant → 0 (sentence-start `stop` but committed spec says no — see below)
- T34 `"stop — that's wrong"` after assistant → 2 (Medium via sentence-start + `—` license AND Strong `that's wrong`)
- T35 `"don't forget to run the full suite"` after assistant → 0
- T36 `"no, don't do that"` in OPENING operator turn → 0 (Medium blocked by speaker-turn gate)

**Note on T33:** committed spec negative case #3 says `"stop at Layer 1"` → 0, and positive case #7 says `"stop — that's wrong"` → 2. Reconciliation: sentence-start Medium fires **only when followed by a rebuttal marker or 2nd-person subject in the same sentence**, OR the sentence-start position is accompanied by `—`. Bare sentence-start imperatives like `"stop at Layer 1"` do not fire. This tightens the committed spec's rule (committed spec is ambiguous on bare sentence-start `stop`); I am explicitly adopting the stricter reading because it kills a known false positive from the Layer 1 replay fixture. **Flag to Pete: this is a small tightening of the committed spec. Approve or override.**

**Replay fixture integration — 3 tests (T37–T39):**
- T37 Section 1 (Layer 1 build session) parsed standalone → `countSignals === 0`
- T38 Section 2 (first prime-patterns boot) parsed standalone → `countSignals === 0`
- T39 Section 3 (second prime-patterns boot, this session) parsed standalone → `countSignals === 0`

**Committed spec regression — positive cases, 12 tests (T40–T51):**
Exactly the 12 positive cases from committed spec lines 66-78, each asserted to produce the expected count. Two changes from committed spec:
- Committed case #6: `"try again. that's not right."` → 2. New matcher: `try again` at sentence-start fires Medium (sentence-start + more content than just the phrase). Still 2.
- Committed case #7: `"stop — that's wrong"` → 2. Still 2 under the T33 reconciliation rule (sentence-start `stop` with `—` license).

**Committed spec regression — negative cases, 12 tests (T52–T63):**
Exactly the 12 negative cases from committed spec lines 80-92, each asserted to produce 0 (or the documented acceptable-false-positive for case #8).

**Total new tests:** 8 + 7 + 6 + 7 + 8 + 3 + 12 + 12 = **63 tests**.

**Existing 25 tests — audit:**
- `stripCode` tests (3) — unchanged helper. PASS.
- `deriveSlug` tests (2) — unchanged helper. PASS.
- `parseTranscript` tests (2) — unchanged helper. PASS.
- `checkLessonsWindow` tests (2) — unchanged helper. PASS.
- `countSignals: dedup within single message` — `"you're wrong"` ×5 in one message. Strong fires once per sentence; all ×5 are in one sentence (no `.` separator). Per-sentence Set dedupes to 1. PASS.
- `countSignals: case-insensitive match` — Strong user `"you're wrong"`, lower + upper. PASS (matcher lowercases via `stripCode` output → `.toLowerCase()`).
- `countSignals: sums across user and assistant turns` — `{user: "that's wrong"}` (Strong = 1) + `{assistant: "my mistake, let me fix this"}` (Strong asst `"my mistake"` = 1, Strong asst `"let me fix"` = 1). Total = 3. PASS.
- `countSignals: fenced code ignored` — `stripCode` unchanged. PASS.
- Integration `zero correction signals → exit 0` — user turn `"please add a feature"`. No Strong, no Medium. PASS.
- Integration `signals present + lessons newer → exit 0` — user `"you're wrong"` (Strong, fires opening-turn). Signals > 0 BUT lessons newer. Exit 0. PASS.
- Integration `signals present + lessons unchanged → exit 2` — user `"you're wrong"` (Strong, fires opening-turn). Exit 2 with "1 correction signals" message. **PASS under the Strong-fires-opening-turn rule. This is the reason Strong cannot enforce speaker-turn gate.**
- Integration `missing transcript` — PASS.
- Integration `session exemptions → exit 0` — user `"that's wrong"` (Strong = 1) + exemption heading + recent mtime. PASS.
- Integration `payload wins over fallback glob` — user `"hello"`. No signals. PASS.
- Integration `debug log on allow path` — PASS.
- Integration `debug log on block path` — user `"you're wrong"`. Block path. PASS.
- Integration `malformed JSONL` — PASS.
- Integration `empty transcript file` — PASS.
- Integration `uppercase correction signal` — `"YOU'RE WRONG about this"` (Strong). PASS.
- Integration `signals in fenced code block do NOT trigger` — code-stripped. PASS.

**All 25 existing tests preserved.** New total: 25 + 63 = **88 tests in `lesson-capture-gate.test.cjs`**.

**Full suite target:** 2094 + 63 = **2157/2157 passing**.

**Coverage target:** `.claude/hooks/lesson-capture-gate.cjs` ≥95% line coverage (security-critical threshold). Verified via `npm run test:coverage`.

### F. Order of operations (atomicity — no red mid-commit)

All changes land in a SINGLE commit. Intra-commit order:

1. Edit `.claude/hooks/lesson-capture-gate.cjs`:
   a. Add new phrase set constants at the top of the "Correction signal sets" block.
   b. Add new helpers above `countSignals`: `splitSentences`, `hasRebuttalMarker`, `isBootTurn`, `classifyTurn`, `matchStrongTier`, `matchMediumTier`.
   c. Rewrite `countSignals` body to use decomposition + new helpers.
   d. Update `exports` block to add new helpers. Existing 5 exports untouched.
   e. Do NOT touch `main()`, `stripCode`, `parseTranscript`, `checkLessonsWindow`, `deriveSlug`, `findFallbackTranscript`, `hasValidExemption`, `writeDebugLog`.
2. Create `tests/fixtures/layer1-false-positives.jsonl` with the three sections.
3. Edit `tests/lesson-capture-gate.test.cjs`: append T1–T63 after the existing 25 tests. Do NOT reorder or delete existing tests.
4. Run `npm test` from project root. Must see 2157/2157.
5. Run `npm run test:coverage`. Must see ≥95% on `lesson-capture-gate.cjs`.
6. `git add .claude/hooks/lesson-capture-gate.cjs tests/lesson-capture-gate.test.cjs tests/fixtures/layer1-false-positives.jsonl tasks/todo.md` → single commit `feat(hooks): tighten lesson-capture phrase matcher`.

**Failure handling during step 4:**
- If any of the 25 existing tests breaks: STOP, diagnose, re-audit matcher. Do NOT disable tests. Do NOT commit partial state.
- If any of the 63 new tests fails: STOP, re-audit the matcher OR the test expectation (not both). Flag any spec disagreement back to Pete before touching code.
- If fixture integration tests fail (T37/T38/T39 > 0 signals): the matcher is letting a false positive through. STOP and re-plan.

**Atomicity guarantee:** because implementation + tests + fixture land together, there is no moment where the repo contains a broken matcher. Previous commit `18cf220` is always the instant rollback.

**Scope guarantee — files NOT touched in Commit 1:**
- `.claude/agents/*` — subagent is Commit 2.
- `.claude/settings.json` — hook wiring already correct.
- `lib/*.cjs` — no core changes.
- `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` — docs sync is post-Commit-2.
- `.planning/STATE.md` — handoff update is post-Commit-2.
- Any other hook file.

### G. Rollback plan if Pattern 8 decomposition is wrong

**Signals that Pattern 8 is the wrong architecture:**
- Sentence segmentation produces false negatives on multi-line prose because rebuttal markers cross sentence boundaries (`"you're wrong. don't do that"` — the `wrong.` rebuttal marker is in sentence A but `don't` is in sentence B, so Medium won't fire on `don't`; but committed spec positive #4 requires it to fire). **Pre-flight mitigation:** the committed spec positive #4 says `"you're wrong. don't touch deriveSlug."` → 2 (Strong + Medium). Under per-sentence decomposition, Medium cannot use the prior sentence's `wrong.` marker. **This is a real risk.** Resolution option: extend rebuttal marker lookup to the immediately-prior sentence within the same turn. Add this as a T64 test if it comes up. If even with prior-sentence lookup the committed spec positive #4 fails, STOP.
- Boot turn detection has edge cases that miss a real false positive → add to fixture, tighten `isBootTurn`. Not a rollback trigger.
- More than 2 committed spec test cases cannot be satisfied simultaneously under the tier model → rollback trigger.

**Rollback mechanics (if triggered):**
1. `git reset --hard 18cf220` — reverts Commit 1 entirely. Safe: Commit 1 is local-only, not pushed.
2. Append a new "Commit 1 Retrospective" subsection to `tasks/todo.md` describing which test cases broke and why Pattern 8 decomposition doesn't fit.
3. Propose an alternative architecture in the retrospective (candidates: LLM-classified rebuttal detection via a micro-agent at Stop time; per-turn correction-token voted by both user and assistant content; full transcript window analysis with learned thresholds).
4. Re-enter plan mode with Pete before touching code again.

**Rollback trigger threshold:** if during implementation I hit more than 2 committed spec test cases that cannot be satisfied simultaneously under the tier model WITH the prior-sentence rebuttal marker extension, STOP and rollback.

### Pre-flight check (self-audit before implementing)

Per the 2026-04-09 spec-vs-reality lesson risk row: "Before coding: write the new `countSignals` by hand against the 24 test cases. If any case refuses to fit the tier model, STOP and re-plan."

**Hand-trace pre-flight (I will do this at the top of Commit 1 implementation, before writing any code):**

For each of the 24 committed spec cases (12 positive + 12 negative), trace the decomposition path:
1. Turn classification (boot / operator / assistant / skip).
2. Sentence split.
3. Per-sentence tier matches.
4. Speaker-turn gate application.
5. Final count.

If any case fails, STOP and re-plan before writing code. Known flag: positive case #4 requires prior-sentence rebuttal marker lookup.

### Approval gate

**Pete must explicitly approve this plan before implementation begins.** Specifically:
1. Confirm Option 1 spec reconciliation is correct (or override).
2. Confirm the T33 tightening (bare sentence-start `stop` does not fire) is acceptable (or override).
3. Confirm the prior-sentence rebuttal marker extension (for committed spec positive #4) is acceptable (or override to a different resolution).
4. Confirm the 3-section fixture contents are a fair recreation of the known false positives (I am synthesizing because raw transcripts were never captured).

Once all four are signed off, implementation proceeds per section F.

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
