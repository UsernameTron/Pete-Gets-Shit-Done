# Requirements: get-shit-done

**Defined:** 2026-04-18
**Core Value:** Predictable, high-quality execution at scale

## v2.7 Requirements

Requirements for v2.7 Session Continuity. Each maps to roadmap phases.

### Checkpoint Engine

- [x] **CP-01**: writeCheckpoint() produces valid JSON consumable by readCheckpoint()
- [x] **CP-02**: /gsd:resume-work reads CHECKPOINT.json and skips completed plans
- [x] **CP-03**: /prime surfaces checkpoint data in initialization summary
- [x] **CP-04**: Stale checkpoint (>24h) generates warning but still loads
- [x] **CP-05**: Missing checkpoint is graceful no-op (no error, no stack trace)
- [x] **CP-06**: 15+ checkpoint tests passing with >80% branch coverage
- [x] **CP-07**: Full test suite green after checkpoint integration

### Daily Dashboard

- [x] **DAILY-01**: /gsd:daily produces dashboard in under 2 seconds
- [x] **DAILY-02**: Reads CHECKPOINT.json first, falls back to STATE.md
- [x] **DAILY-03**: Shows correct next-action for every GSD state
- [x] **DAILY-04**: Handles missing files gracefully (no stack traces)
- [x] **DAILY-05**: Dirty tree and stale checkpoint produce warnings
- [x] **DAILY-06**: 10+ daily tests passing with >80% branch coverage

### Automated UAT Runner

- [ ] **UAT-01**: Parses must_haves from plan YAML frontmatter
- [ ] **UAT-02**: Matches at least 8 pattern types from registry
- [ ] **UAT-03**: Executes commands in read-only mode (no writes)
- [ ] **UAT-04**: Returns structured { passed, failed, manual } results
- [ ] **UAT-05**: Failed checks include expected, actual, and command
- [ ] **UAT-06**: Unrecognized must_haves fall through to manual UAT
- [ ] **UAT-07**: verify-work.md presents auto results before conversational UAT
- [ ] **UAT-08**: 20+ tests across patterns and runner
- [ ] **UAT-09**: Command timeout (30s) prevents hanging
- [ ] **UAT-10**: Full test suite green after integration

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

- **CP-08**: Automatic checkpoint on /compact (beyond /clear)
- **DAILY-07**: /gsd:daily --json for scripting integration
- **UAT-11**: LLM fallback for unrecognized must_haves (generate shell commands via model)

## Out of Scope

| Feature | Reason |
|---------|--------|
| GUI checkpoint viewer | CLI-only project |
| Real-time dashboard (auto-refresh) | Single-shot command is sufficient |
| UAT pattern hot-reload | Pattern registry is static; restart is fine |
| Cross-project checkpoint aggregation | Each project manages its own state |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CP-01 | Phase 52 | Complete |
| CP-02 | Phase 52 | Complete |
| CP-03 | Phase 52 | Complete |
| CP-04 | Phase 52 | Complete |
| CP-05 | Phase 52 | Complete |
| CP-06 | Phase 52 | Complete |
| CP-07 | Phase 52 | Complete |
| DAILY-01 | Phase 53 | Complete |
| DAILY-02 | Phase 53 | Complete |
| DAILY-03 | Phase 53 | Complete |
| DAILY-04 | Phase 53 | Complete |
| DAILY-05 | Phase 53 | Complete |
| DAILY-06 | Phase 53 | Complete |
| UAT-01 | Phase 54 | Pending |
| UAT-02 | Phase 54 | Pending |
| UAT-03 | Phase 54 | Pending |
| UAT-04 | Phase 54 | Pending |
| UAT-05 | Phase 54 | Pending |
| UAT-06 | Phase 54 | Pending |
| UAT-07 | Phase 54 | Pending |
| UAT-08 | Phase 54 | Pending |
| UAT-09 | Phase 54 | Pending |
| UAT-10 | Phase 54 | Pending |

**Coverage:**
- v2.7 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-04-18*
*Last updated: 2026-04-18 after initial definition*
