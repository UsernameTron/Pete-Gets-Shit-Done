---
phase: 30
plan: 2
title: "Config Extension and resolveModelInternal() Dynamic Path"
requirements: ["INTEL-01", "INTEL-04", "INTEL-06"]
complexity: medium
created: "2026-04-05"
depends_on: [1]
---

# PLAN — Phase 30.2: Config Extension and resolveModelInternal() Dynamic Path

**Phase goal:** Add `routing_strategy` config key, extend `resolveModelInternal()` with optional `taskContext` parameter, and add debug logging for dynamic routing decisions.

**Requirements:** INTEL-01, INTEL-04, INTEL-06
**Complexity:** Medium — modifies core routing function, must preserve exact backward compatibility
**Target files:** `get-shit-done/bin/lib/config.cjs`, `get-shit-done/bin/lib/core.cjs`

---

## Tasks

### Task 1: Add routing_strategy to VALID_CONFIG_KEYS (INTEL-04)

**Files:**
- `get-shit-done/bin/lib/config.cjs` (modify)

**Actions:**
1. Add `'routing_strategy'` to the `VALID_CONFIG_KEYS` array (alphabetical insertion near other top-level keys).
2. Verify no conflicts with existing key patterns (no `routing_strategy.*` dynamic patterns needed — it's a flat string key).

**Design notes:**
- Valid values: `'static'`, `'dynamic'`, `'auto'`. Validation happens in `resolveModelInternal()` at read time, not in config.cjs — matches existing pattern where config.cjs validates key names but not values.
- No `workflow.*` nesting — `routing_strategy` is a top-level config key alongside `model_profile`, `resolve_model_ids`, etc. This is deliberate: it's a model routing concern, not a workflow concern.

**Acceptance criteria:**
- [ ] `'routing_strategy'` appears in VALID_CONFIG_KEYS
- [ ] `buildNewProjectConfig()` does not reject configs containing `routing_strategy`
- [ ] No other config.cjs changes needed

### Task 2: Add routing_strategy default to loadConfig() (INTEL-04)

**Files:**
- `get-shit-done/bin/lib/core.cjs` (modify)

**Actions:**
1. Add `routing_strategy: 'static'` to the defaults object inside `loadConfig()` (near `model_profile` and `resolve_model_ids` defaults).
2. Verify the default gets merged correctly through the 3-level merge in `buildNewProjectConfig()`.

**Design notes:**
- Default `'static'` means zero behavior change for all existing users. Dynamic routing is opt-in only.
- Follows the same pattern as `model_profile: 'balanced'` — string default, user overrides in config.json.

**Acceptance criteria:**
- [ ] `loadConfig(cwd)` returns `{ routing_strategy: 'static', ... }` when no user config exists
- [ ] User config `{ routing_strategy: 'dynamic' }` overrides the default
- [ ] Frozen config object includes `routing_strategy`

### Task 3: Extend resolveModelInternal() with optional taskContext (INTEL-01, INTEL-06)

**Files:**
- `get-shit-done/bin/lib/core.cjs` (modify)

**Actions:**
1. Change function signature from `resolveModelInternal(cwd, agentType)` to `resolveModelInternal(cwd, agentType, taskContext)`.
2. Add dynamic routing path **after** the existing override and omit checks, **before** the static profile lookup:
   ```javascript
   function resolveModelInternal(cwd, agentType, taskContext) {
     const config = loadConfig(cwd);

     // 1. User overrides always win (unchanged)
     const override = config.model_overrides?.[agentType];
     if (override) return override;

     // 2. Non-Claude runtime (unchanged)
     if (config.resolve_model_ids === 'omit') return '';

     // 3. Dynamic routing (NEW — only when taskContext provided AND routing_strategy !== 'static')
     const strategy = config.routing_strategy || 'static';
     if (taskContext && strategy !== 'static') {
       const { dynamicSelect } = require('./model-profiles.cjs');
       const result = dynamicSelect(agentType, taskContext, config);

       // INTEL-06: Log routing rationale via debugLog
       debugLog('MODEL_ROUTE', `agent=${agentType} strategy=${strategy} ${result.rationale} → ${result.alias}`, { agent: agentType, tier: result.tier });

       if (taskContext.complexity === 'critical') {
         debugLog('MODEL_ROUTE_CRITICAL', `CRITICAL override: agent=${agentType} forced to quality tier`, { agent: agentType });
       }

       const alias = result.alias;
       if (config.resolve_model_ids) return MODEL_ALIAS_MAP[alias] || alias;
       return alias;
     }

     // 4. Static profile lookup (unchanged — existing v1.9 behavior)
     const profile = String(config.model_profile || 'balanced').toLowerCase();
     const agentModels = MODEL_PROFILES[agentType];
     if (!agentModels) return 'sonnet';
     if (profile === 'inherit') return 'inherit';
     const alias = agentModels[profile] || agentModels['balanced'] || 'sonnet';
     if (config.resolve_model_ids) return MODEL_ALIAS_MAP[alias] || alias;
     return alias;
   }
   ```
3. The `require('./model-profiles.cjs')` is **inside** the dynamic branch — lazy-loaded only when dynamic routing is active. This avoids circular dependency issues and matches the existing lazy-require patterns (PERF-03).

**Design notes:**
- **Backward compatibility guarantee**: When `taskContext` is `undefined` (all existing callers), the function takes the exact same code path as v1.9. The `if (taskContext && strategy !== 'static')` guard ensures this.
- **Three routing strategies**:
  - `static` (default): Skip dynamic path entirely, use profile lookup
  - `dynamic`: Always use dynamic path when taskContext provided
  - `auto`: Same as dynamic for Phase 30. Phase 32 will add history-informed behavior for `auto`.
- **debugLog**: Already exists in core.cjs — signature is `debugLog(code, message, context)` (3 args). Use `'MODEL_ROUTE'` as code, rationale string as message, and `{ agent, tier }` as context object.
- **Critical logging (INTEL-06)**: Extra log line when complexity is `critical` for visibility — these are the decisions users will want to audit.

**Acceptance criteria:**
- [ ] `resolveModelInternal(cwd, 'gsd-executor')` — no taskContext — returns same result as v1.9
- [ ] `resolveModelInternal(cwd, 'gsd-executor', { complexity: 'complex' })` with `routing_strategy: 'dynamic'` — returns quality tier alias
- [ ] `resolveModelInternal(cwd, 'gsd-executor', { complexity: 'trivial' })` with `routing_strategy: 'dynamic'` — returns budget tier alias
- [ ] `resolveModelInternal(cwd, 'gsd-executor', { complexity: 'complex' })` with `routing_strategy: 'static'` — ignores taskContext, returns static profile result
- [ ] model_overrides still take precedence over dynamic routing
- [ ] `resolve_model_ids: 'omit'` still returns empty string
- [ ] `debugLog()` called with routing rationale when dynamic path taken
- [ ] Critical complexity produces extra debug log line

### Task 4: Unit tests for routing_strategy config and dynamic resolveModelInternal()

**Files:**
- `tests/core.test.cjs` (modify)
- `tests/config.test.cjs` (modify)

**Actions:**
1. In `config.test.cjs`:
   - Add test: `routing_strategy` is in VALID_CONFIG_KEYS
   - Add test: config with `routing_strategy: 'dynamic'` passes validation
2. In `core.test.cjs`:
   - Add test group `'resolveModelInternal — dynamic routing'`:
     - Backward compat: no taskContext returns same as v1.9 (test against known MODEL_PROFILES values)
     - routing_strategy: 'static' ignores taskContext
     - routing_strategy: 'dynamic' with taskContext uses dynamicSelect
     - routing_strategy: 'auto' behaves same as dynamic in Phase 30
     - model_overrides take precedence over dynamic routing
     - resolve_model_ids: 'omit' returns '' regardless of taskContext
     - resolve_model_ids: true with dynamic routing returns full model ID
   - Add test group `'resolveModelInternal — debug logging'`:
     - Verify debugLog called with routing rationale on dynamic path
     - Verify extra log line for critical complexity
     - Verify no debugLog calls on static path

**Acceptance criteria:**
- [ ] >= 10 new test cases for dynamic routing behavior
- [ ] >= 3 new test cases for debug logging
- [ ] All existing core.test.cjs and config.test.cjs tests pass unchanged
- [ ] `npm test` full suite passes

---

## Verification

After implementation:
1. `npm test` — full suite passes (2046+ tests, plus new tests)
2. Manually verify backward compatibility:
   ```bash
   node -e "
     const core = require('./get-shit-done/bin/lib/core.cjs');
     // No taskContext — v1.9 behavior
     console.log('static:', core.resolveModelInternal('/tmp/test', 'gsd-executor'));
   "
   ```
3. Verify dynamic path:
   ```bash
   node -e "
     // Would need a config with routing_strategy: 'dynamic' in /tmp/test/.planning/config.json
     const core = require('./get-shit-done/bin/lib/core.cjs');
     console.log('dynamic:', core.resolveModelInternal('/tmp/test', 'gsd-executor', { complexity: 'complex' }));
   "
   ```
4. No circular dependency warnings (model-profiles.cjs lazy-required inside branch)
