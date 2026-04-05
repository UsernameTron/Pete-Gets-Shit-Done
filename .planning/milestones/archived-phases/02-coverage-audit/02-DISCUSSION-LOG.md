# Phase 2: Coverage Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-coverage-audit
**Areas discussed:** Coverage scope

---

## Coverage Scope

### Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Coverage scope | Current c8 config only measures get-shit-done/bin/lib/*.cjs (17 files). Biggest decision — shapes everything else. | Yes |
| Report & threshold config | c8 reporters, thresholds, per-module vs aggregate. | |
| Gap analysis structure | How to format the gap analysis doc, priority tiers. | |
| Baseline document format | Where to store baseline, format, diff-friendliness. | |

### Q1: Coverage scope approach

| Option | Description | Selected |
|--------|-------------|----------|
| JS modules only | Expand c8 to all .cjs/.js. Shell scripts get manual audit. | |
| Full inventory, JS instrumented | Same JS expansion + catalog every shell script with tested/untested status. | Yes |
| Lib-only baseline | Keep c8 scoped to get-shit-done/bin/lib/. Cheaper but incomplete. | |

**User's choice:** Full inventory, JS instrumented
**Notes:** Comprehensive approach — JS files get c8 line/branch coverage, shell scripts get binary tested/untested catalog.

### Q2: Hook file handling

| Option | Description | Selected |
|--------|-------------|----------|
| Source only (hooks/*.js) | hooks/dist/ appears to be compiled copies. Instrumenting both double-counts. | Yes |
| Both source and dist | Coverage on both catches drift but adds noise. | |
| You decide | Claude picks based on whether dist/ has diverged. | |

**User's choice:** Source only (hooks/*.js)
**Notes:** dist/ excluded as compiled copies — no double-counting.

---

## Claude's Discretion

- Report format and reporters (not discussed — Claude decides)
- Gap analysis structure and priority tiers (not discussed — Claude decides)
- Baseline document format and location (not discussed — Claude decides)
- c8 threshold configuration (not discussed — Claude decides)

## Deferred Ideas

None — discussion stayed within phase scope
