---
phase: 31
plan: 1
title: "classify.cjs Module — Task Classification & Adaptive Gates"
status: complete
requirements_covered: ["INTEL-07", "INTEL-08", "INTEL-09"]
tests_added: 21
tests_total: 1987
---

# SUMMARY — Phase 31.1: classify.cjs Module

## What Was Built

Created `get-shit-done/bin/lib/classify.cjs` as a Layer 0 foundation module with zero intra-project dependencies. Exports three functions and two frozen constant objects:

- **COMPLEXITY_LEVELS** — Frozen enum: trivial, standard, complex, critical
- **PHASE_TYPE_KEYWORDS** — Frozen keyword-to-phase-type mapping (8 entries)
- **extractSignals(phaseInfo, planInventory, context)** — Extracts 6 signals: file_count, requirement_count, phase_type, dependency_depth, historical_failure_rate, plan_count. All fields have safe defaults for null/undefined inputs. Never throws.
- **classifyTask(phaseInfo, planInventory, context)** — Weighted scoring algorithm using 5 signal sources with configurable weights. Returns `{ complexity, signals, confidence }`. Thresholds: <3 trivial, <6 standard, <10 complex, >=10 critical. Confidence: 0.5 base + 0.1 per non-null signal, capped at 1.0.
- **adaptWorkflowGates(taskContext, config)** — Returns config overrides gated by `config.adaptive`. Trivial: skip_research, disable plan_checker, light verification. Standard: no overrides. Complex: thorough verification, wave size 2. Critical: thorough verification, sequential execution (wave size 1), force quality tier.

Added `classify.cjs` to Layer 0 in `tests/architecture.test.cjs`.

## Tests

21 new tests in `tests/classify.test.cjs`:
- COMPLEXITY_LEVELS: 2 tests (exports, frozen)
- PHASE_TYPE_KEYWORDS: 2 tests (exports, frozen)
- extractSignals: 7 tests (null safety, file_count, requirement_count, phase_type, dependency_depth, failure_rate, default phase_type)
- classifyTask: 6 tests (trivial/standard/complex/critical scenarios, confidence range, return shape)
- adaptWorkflowGates: 4 tests (feature flag gate, trivial overrides, complex overrides, critical overrides)

## Requirements

- **INTEL-07**: classifyTask returns { complexity, signals, confidence } — Complete
- **INTEL-08**: Signal extraction with all 6 signal sources — Complete
- **INTEL-09**: adaptWorkflowGates with complexity-based config overrides — Complete
