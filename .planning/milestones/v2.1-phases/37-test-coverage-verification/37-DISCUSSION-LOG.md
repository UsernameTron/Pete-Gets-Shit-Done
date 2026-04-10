# Phase 37: Test & Coverage Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 37-test-coverage-verification
**Areas discussed:** install.js strategy, Coverage gap prioritization, Branch coverage gaps

---

## install.js Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted 80% push (Recommended) | Write tests for high-risk utility functions and conversion logic. Skip interactive CLI prompts and pure I/O glue. | |
| Full 80% push | Test everything including edge paths in all runtime converters. | |
| Exclude from threshold | Adjust c8rc.json to exclude install.js from per-module 80% rule. | |
| You decide | Claude picks the most pragmatic approach. | selected |

**User's choice:** You decide (Claude's discretion)
**Notes:** Claude selected "Targeted 80% push" as the pragmatic approach -- highest ROI, focuses on testable utility functions and conversion logic rather than interactive CLI prompts.

---

## Coverage Gap Prioritization

| Option | Description | Selected |
|--------|-------------|----------|
| Quick wins first (Recommended) | build-hooks.js -> state.cjs -> uat.cjs -> phase.cjs -> workstream.cjs -> profile-pipeline.cjs -> install.js | |
| Biggest gaps first | install.js -> workstream.cjs -> profile-pipeline.cjs -> rest | |
| You decide | Claude sequences for maximum efficiency. | selected |

**User's choice:** You decide (Claude's discretion)
**Notes:** Claude selected quick-wins-first sequencing -- lift overall above 90% fast with small modules, then backfill the large install.js file.

---

## Branch Coverage Gaps

| Option | Description | Selected |
|--------|-------------|----------|
| Line coverage only (Recommended) | Stick to ROADMAP.md success criteria. Branch coverage improves naturally. | selected |
| Add 70% branch floor | Add a formal branch coverage threshold. More rigorous but expands scope. | |
| You decide | Claude picks based on pragmatism. | |

**User's choice:** Line coverage only (Recommended)
**Notes:** Matches ROADMAP.md success criteria exactly. Branch coverage improves naturally as line-coverage tests hit more conditional paths.

---

## Claude's Discretion

- install.js test targeting and file organization
- Coverage priority order within each module
- Whether to create new test files vs. extend existing ones
- Test naming/grouping conventions

## Deferred Ideas

None -- discussion stayed within phase scope.
