/**
 * Performance Benchmark — Dynamic Routing Overhead
 *
 * Proves that the intelligence pipeline (classify + route) adds < 5ms median
 * overhead vs static routing. Uses process.hrtime.bigint() for nanosecond
 * precision. Requires classify.cjs and model-profiles.cjs directly (no CLI
 * shelling out) to isolate computation cost from process-spawn overhead.
 *
 * Zero external dependencies — node:test + node:assert/strict only.
 *
 * Requirement: INTEL-20
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { classifyTask, extractSignals } = require('../../get-shit-done/bin/lib/classify.cjs');
const { dynamicSelect } = require('../../get-shit-done/bin/lib/model-profiles.cjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute median of a BigInt array.
 *
 * @param {bigint[]} arr - Array of BigInt durations (nanoseconds)
 * @returns {bigint} Median value
 */
function median(arr) {
  const sorted = [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2n;
}

/**
 * Representative phase info for benchmark inputs.
 */
function makePhaseInfo() {
  return {
    name: 'Integration Testing',
    phase_number: 33,
    plan_count: 3,
    status: 'in-progress',
  };
}

/**
 * Representative plan inventory for benchmark inputs.
 */
function makePlanInventory() {
  return [
    {
      plan_number: 1,
      title: 'E2E Intelligence Pipeline',
      files_to_modify: ['tests/e2e/intelligence-pipeline.test.cjs'],
      depends_on: [],
    },
    {
      plan_number: 2,
      title: 'Performance Benchmark',
      files_to_modify: ['tests/perf/routing-benchmark.test.cjs'],
      depends_on: [1],
    },
    {
      plan_number: 3,
      title: 'Coverage Gate',
      files_to_modify: [],
      depends_on: [1, 2],
    },
  ];
}

/**
 * Representative context for benchmark inputs.
 */
function makeContext() {
  return {
    reqIds: ['INTEL-19', 'INTEL-20', 'INTEL-23'],
    failureRate: 0.1,
  };
}

/**
 * Build a taskContext object matching what dynamicSelect expects.
 */
function makeTaskContext() {
  return {
    complexity: 'standard',
    signals: {
      file_count: 3,
      requirement_count: 3,
      phase_type: 'integration',
      dependency_depth: 2,
      historical_failure_rate: 0.1,
      plan_count: 3,
    },
    confidence: 0.72,
  };
}

/**
 * Representative config for dynamic routing.
 */
function makeDynamicConfig() {
  return {
    model_profile: 'balanced',
    routing_strategy: 'dynamic',
    adaptive: true,
  };
}

const WARM_UP = 10;
const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Routing Performance Benchmark (INTEL-20)', () => {

  // -------------------------------------------------------------------------
  // Test 1: classifyTask median < 2ms
  // -------------------------------------------------------------------------

  it('classifyTask median < 2ms over 200 iterations', () => {
    const phaseInfo = makePhaseInfo();
    const planInventory = makePlanInventory();
    const context = makeContext();

    // Warm up V8 JIT
    for (let i = 0; i < WARM_UP; i++) {
      classifyTask(phaseInfo, planInventory, context);
    }

    // Measure
    const durations = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = process.hrtime.bigint();
      classifyTask(phaseInfo, planInventory, context);
      const end = process.hrtime.bigint();
      durations.push(end - start);
    }

    const med = median(durations);
    const medMs = Number(med) / 1_000_000;

    assert.ok(
      med < 2_000_000n,
      `classifyTask median should be < 2ms, got ${medMs.toFixed(3)}ms`
    );
  });

  // -------------------------------------------------------------------------
  // Test 2: dynamicSelect median < 2ms
  // -------------------------------------------------------------------------

  it('dynamicSelect median < 2ms over 200 iterations', () => {
    const taskContext = makeTaskContext();
    const config = makeDynamicConfig();

    // Warm up
    for (let i = 0; i < WARM_UP; i++) {
      dynamicSelect('gsd-executor', taskContext, config);
    }

    // Measure
    const durations = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = process.hrtime.bigint();
      dynamicSelect('gsd-executor', taskContext, config);
      const end = process.hrtime.bigint();
      durations.push(end - start);
    }

    const med = median(durations);
    const medMs = Number(med) / 1_000_000;

    assert.ok(
      med < 2_000_000n,
      `dynamicSelect median should be < 2ms, got ${medMs.toFixed(3)}ms`
    );
  });

  // -------------------------------------------------------------------------
  // Test 3: Combined classify + route median < 5ms
  // -------------------------------------------------------------------------

  it('combined classify + dynamicSelect median < 5ms over 200 iterations', () => {
    const phaseInfo = makePhaseInfo();
    const planInventory = makePlanInventory();
    const context = makeContext();
    const config = makeDynamicConfig();

    // Warm up
    for (let i = 0; i < WARM_UP; i++) {
      const classification = classifyTask(phaseInfo, planInventory, context);
      dynamicSelect('gsd-executor', classification, config);
    }

    // Measure
    const durations = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = process.hrtime.bigint();
      const classification = classifyTask(phaseInfo, planInventory, context);
      dynamicSelect('gsd-executor', classification, config);
      const end = process.hrtime.bigint();
      durations.push(end - start);
    }

    const med = median(durations);
    const medMs = Number(med) / 1_000_000;

    assert.ok(
      med < 5_000_000n,
      `combined classify+route median should be < 5ms, got ${medMs.toFixed(3)}ms`
    );
  });

  // -------------------------------------------------------------------------
  // Test 4: No GC pressure from routing (heap growth < 5MB over 1000 iters)
  // -------------------------------------------------------------------------

  it('no significant GC pressure: heap growth < 5MB over 1000 iterations', () => {
    const phaseInfo = makePhaseInfo();
    const planInventory = makePlanInventory();
    const context = makeContext();
    const config = makeDynamicConfig();

    // Warm up and stabilize heap
    for (let i = 0; i < WARM_UP; i++) {
      const classification = classifyTask(phaseInfo, planInventory, context);
      dynamicSelect('gsd-executor', classification, config);
    }

    // Force GC if available to get clean baseline
    if (global.gc) global.gc();
    const heapBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      const classification = classifyTask(phaseInfo, planInventory, context);
      dynamicSelect('gsd-executor', classification, config);
    }

    const heapAfter = process.memoryUsage().heapUsed;
    const growthBytes = heapAfter - heapBefore;
    const growthMB = growthBytes / (1024 * 1024);

    // Heap growth can be negative (GC reclaimed). Only flag if > 5MB growth.
    assert.ok(
      growthBytes < 5 * 1024 * 1024,
      `heap growth should be < 5MB, got ${growthMB.toFixed(2)}MB`
    );
  });

  // -------------------------------------------------------------------------
  // Test 5: Static routing near-zero overhead (median < 0.5ms)
  // -------------------------------------------------------------------------

  it('static routing (dynamicSelect with trivial complexity) median < 0.5ms', () => {
    // Static routing in production skips dynamicSelect entirely,
    // but we measure dynamicSelect with a trivial-complexity context
    // to prove even the dynamic path is fast for simple cases.
    const trivialContext = {
      complexity: 'trivial',
      signals: { file_count: 1, requirement_count: 1, phase_type: 'execution', dependency_depth: 0, historical_failure_rate: null, plan_count: 1 },
      confidence: 0.95,
    };
    const staticConfig = {
      model_profile: 'balanced',
      routing_strategy: 'static',
      adaptive: false,
    };

    // Warm up
    for (let i = 0; i < WARM_UP; i++) {
      dynamicSelect('gsd-executor', trivialContext, staticConfig);
    }

    // Measure
    const durations = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = process.hrtime.bigint();
      dynamicSelect('gsd-executor', trivialContext, staticConfig);
      const end = process.hrtime.bigint();
      durations.push(end - start);
    }

    const med = median(durations);
    const medMs = Number(med) / 1_000_000;

    assert.ok(
      med < 500_000n,
      `static routing median should be < 0.5ms, got ${medMs.toFixed(3)}ms`
    );
  });
});
