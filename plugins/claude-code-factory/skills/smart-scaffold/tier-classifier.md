# Tier Classification Rules

Classify every request by minimum viable complexity. Default to Tier 1.

---

## Signal Detection

### Tier 3 Signals (need 2+ to classify as Tier 3)

| Signal | Detection | Examples |
|--------|-----------|---------|
| System language | "system", "pipeline", "complete", "comprehensive", "full solution", "end-to-end" | "Build me a complete deploy system" |
| Multiple types named | User explicitly mentions 4+ extension types | "I need hooks, skills, an agent, and permissions" |
| Multi-lifecycle | Request spans 3+ lifecycle events | "On session start, after edits, and before commits" |
| Distribution intent | "plugin", "distribute", "package", "share with team", "marketplace" | "Package this as a plugin" |
| Cross-cutting | CI/CD + runtime + permissions in same request | "PR review pipeline with hooks and access control" |

**Scoring**: Count matching signals.
- 0-1 signals → NOT Tier 3, evaluate Tier 2
- 2+ signals → Tier 3 candidate → run sufficiency check

### Tier 2 Signals (need 1+ AND fail Tier 1 sufficiency)

| Signal | Detection | Examples |
|--------|-----------|---------|
| Dual behavior | Two distinct verbs/actions connected by "and" | "Check code AND block commits" |
| Reference + enforce | Standards/rules mentioned WITH enforcement | "Enforce our coding standards" |
| Gate + react | Prevention AND reaction in same request | "Prevent bad commits and fix formatting" |
| Cross-session | Persistent state needed across sessions | "Remember project context every session" |
| Explicit conjunction | "also", "and also", "plus", "additionally" | "Auto-format and also run tests" |

**Scoring**: Any signal present → Tier 2 candidate → run sufficiency check

### Tier 1 (Default — everything not classified above)

Any request that:
- Describes a single behavior
- Maps to one hook event, one skill, one config change
- Uses beginner language without conjunctions
- Asks for "a thing" (singular) not "things" (plural)

---

## Sufficiency Checks

### Can Tier 1 Handle It?

Ask these in order. If ANY is YES → Tier 1 is sufficient:

1. Can a single PostToolUse hook cover the core behavior?
   (auto-format, lint, validate, log, notify — all single-hook cases)
2. Can a single PreToolUse hook cover it?
   (block, prevent, gate, restrict — all single-hook cases)
3. Can a single skill cover it?
   (reference knowledge, slash command, workflow orchestration)
4. Can a single settings/permission change cover it?
   (lock model, deny command, allow tool, sandbox mode)

If YES to any: stay Tier 1 even if Tier 2 signals are present.
Mention upgrade path but don't escalate.

### Can Tier 2 Handle It?

Can 2-3 extensions cover everything the user described?
- YES → Tier 2 (route to combo engine or concierge)
- NO → Tier 3 (4+ pieces genuinely needed)

---

## Beginner vs Expert Detection

| Signal | Classification | Effect |
|--------|---------------|--------|
| "I want Claude to..." | Beginner | Bias toward Tier 1 |
| "Make Claude..." | Beginner | Bias toward Tier 1 |
| "How do I get Claude to..." | Beginner | Bias toward Tier 1 |
| Describes behavior, not mechanism | Beginner | Bias toward Tier 1 |
| Names specific hook events | Expert | Respect literal request |
| Uses frontmatter field names | Expert | Respect literal request |
| Mentions matcher syntax | Expert | Respect literal request |
| References settings.json paths | Expert | Respect literal request |

**Expert override**: If the user's request contains Claude Code vocabulary,
do NOT downgrade. Classify based on what they literally requested.
Skip upgrade path offers for experts — they don't need them.

---

## Scoring Summary

```
Tier 3: 2+ tier-3 signals → run sufficiency → confirmed or downgrade
Tier 2: 1+ tier-2 signal AND Tier 1 sufficiency fails → confirmed or downgrade
Tier 1: everything else (DEFAULT)
Tie-breaking: always choose the LOWER tier
Ambiguity: always choose the LOWER tier
```
