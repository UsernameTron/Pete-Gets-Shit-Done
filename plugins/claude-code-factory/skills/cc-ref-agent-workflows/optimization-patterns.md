# Optimization Workflow Patterns

Patterns for agents that measure, analyze, and improve system performance.

---

## Baseline-Profile-Fix-Validate Cycle

**When to Use**: performance-optimizer, database-expert, caching-strategist

### Template

```
## Workflow

1. **Baseline**: Establish current performance metrics.
   - Identify the specific operation or endpoint to optimize
   - Run benchmark N times (minimum 3) to get stable numbers
   - Record: P50, P95, P99 latency, throughput (req/s), memory peak, CPU usage
   - Save baseline results for comparison

2. **Profile**: Identify where time/resources are spent.
   - Use language-appropriate profiler:
     - Python: cProfile + snakeviz, py-spy (for live profiling)
     - JavaScript: Chrome DevTools Performance tab, clinic.js
     - Go: pprof (CPU + memory + goroutine profiles)
     - Rust: cargo flamegraph, criterion benchmarks
     - Java: async-profiler, JFR
     - Database: EXPLAIN ANALYZE, pg_stat_statements, slow query log
   - Generate flame graph or call tree
   - Identify top 3 hotspots by cumulative time

3. **Fix**: Apply targeted optimization.
   - Address hotspots in order of impact
   - Prefer these optimization categories (in order):
     a. Algorithm improvement (O(n²) → O(n log n))
     b. I/O reduction (batch queries, connection pooling)
     c. Caching (memoization, result caching, CDN)
     d. Concurrency (parallelize independent operations)
     e. Data structure optimization (hash map vs list, indexes)
     f. Memory optimization (streaming, lazy loading, pooling)
   - Change ONE thing at a time — measure after each change

4. **Validate**: Confirm improvement without regressions.
   - Re-run the same benchmark suite
   - Compare metrics: must show measurable improvement
   - Run full test suite — correctness is non-negotiable
   - Check for memory leaks (if applicable)
   - Document the optimization and its measured impact
```

### Output Format

```
## Performance Optimization Report

### Target
{description of what was optimized}

### Baseline Metrics
| Metric | Value | Measurement Method |
|--------|-------|--------------------|
| P50 latency | {value} | {tool/method} |
| P95 latency | {value} | |
| P99 latency | {value} | |
| Throughput | {value} ops/s | |
| Memory peak | {value} MB | |

### Profiling Results
Top hotspots:
1. {function/query} — {X}% of total time — {root cause}
2. {function/query} — {X}% of total time — {root cause}
3. {function/query} — {X}% of total time — {root cause}

### Optimization Applied
{description of change, category, and rationale}

### Results
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| P50 | {val} | {val} | {-X%} |
| P95 | {val} | {val} | {-X%} |
| P99 | {val} | {val} | {-X%} |
| Throughput | {val} | {val} | {+X%} |
| Memory | {val} | {val} | {-X%} |

### Verification
- Tests: {all passing / N failures}
- Memory leaks: {none detected / details}
- Regressions: {none / details}

### Status: DONE | DONE_WITH_CONCERNS
{if concerns: describe remaining issues}
```

---

## Metric Collection Pattern

**When to Use**: monitoring-specialist, sre-practices-advisor, performance-optimizer

### Template

```
## Metrics Framework

### RED Method (Request-driven services)
- **Rate**: Requests per second
- **Errors**: Error rate (errors/total × 100)
- **Duration**: Latency distribution (P50/P95/P99)

### USE Method (Resource-oriented)
- **Utilization**: % of resource capacity in use
- **Saturation**: Queue depth / backlog
- **Errors**: Error count per resource

### Collection Points
1. Application metrics (custom instrumentation)
2. Infrastructure metrics (CPU, memory, disk, network)
3. Database metrics (query time, connections, lock waits)
4. External dependency metrics (API latency, error rates)

### Instrumentation Pattern
```{lang}
// Wrap operations with timing
const start = performance.now();
try {
  const result = await operation();
  metrics.record('operation.duration', performance.now() - start);
  metrics.increment('operation.success');
  return result;
} catch (error) {
  metrics.increment('operation.error');
  throw error;
}
```
```

---

## Regression Detection Workflow

**When to Use**: performance-optimizer, ci-cd-architect

### Template

```
## Workflow

1. **Benchmark Suite**: Maintain a set of reproducible performance tests.
   - Cover critical user-facing operations
   - Include data setup/teardown for consistent state
   - Run on consistent hardware (CI runner with fixed specs)

2. **Threshold Definition**: Set acceptable ranges for each metric.
   - P95 latency: must not increase by more than 10%
   - Throughput: must not decrease by more than 5%
   - Memory: must not increase by more than 15%

3. **CI Integration**: Run benchmarks on every PR.
   - Compare PR results against main branch baseline
   - Flag violations as blocking or warning based on severity
   - Store historical data for trend analysis

4. **Triage**: When regression detected:
   - Identify the commit that introduced it (git bisect if needed)
   - Profile the specific operation that regressed
   - Determine if regression is acceptable (feature trade-off) or not
```

---

## Load Testing Integration Pattern

**When to Use**: performance-optimizer, sre-practices-advisor, backend-developer

### Template

```
## Workflow

1. **Scenario Design**: Define realistic load patterns.
   - Normal load: average traffic pattern
   - Peak load: expected maximum (e.g., 2x normal)
   - Stress test: beyond expected maximum (find breaking point)
   - Soak test: sustained normal load for extended period

2. **Tool Selection**:
   - k6: JavaScript-based, developer-friendly, good for CI
   - Locust: Python-based, good for complex scenarios
   - wrk/wrk2: C-based, high-performance HTTP benchmarking
   - Artillery: YAML config, good for quick tests

3. **Execution**: Run tests in a production-like environment.
   - Never load test production without explicit approval
   - Warm up the system before measuring
   - Run each scenario multiple times for consistency

4. **Analysis**: Interpret results.
   - Identify saturation point (where latency spikes)
   - Check error rates under load
   - Monitor resource utilization during test
   - Compare against SLOs
```
