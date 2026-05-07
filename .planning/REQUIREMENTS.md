# Requirements: get-shit-done

**Defined:** 2026-05-07
**Core Value:** Predictable, high-quality execution at scale

## v2.8 Documentation Integrity Requirements

**Goal:** Turn documentation accuracy from manually-maintained to CI-enforced. Broken links, stale counts, and cross-doc inconsistencies must fail CI before merge.

**Motivating evidence:** PR #20 (b590634) shipped just to refresh stale test counts (2,644 → 2,667, 533 → 536) across 3 living docs. `/gsd:sync-docs` provides measurement primitives but no enforcement gate. Cross-references to relocated docs sat broken until manually noticed.

### Internal Link Validator

- [ ] **DOCLINK-01**: Validator script identifies broken relative-path refs in tracked `.md` files (e.g., `[text](path/to/file.md)` where target does not exist)
- [ ] **DOCLINK-02**: Validator script identifies broken anchor refs within and across files (e.g., `#section-name` not present in target document)
- [ ] **DOCLINK-03**: Validator outputs structured table — file, line, broken-ref, reason
- [ ] **DOCLINK-04**: Validator exits non-zero on any broken link, zero on clean run, with `--json` flag for machine-readable output

### Doc Drift Detector

- [ ] **DOCDRIFT-01**: Detector measures live test count, suite count, line/branch/function coverage from `npm test` and c8 output
- [ ] **DOCDRIFT-02**: Detector measures live agent count, command count, skill count, hook count from filesystem inventory
- [ ] **DOCDRIFT-03**: Detector compares measured values against numeric claims in `CLAUDE.md`, `README.md`, `docs/DEVOPS-HANDOFF.md` using regex-anchored extractors
- [ ] **DOCDRIFT-04**: Detector outputs structured drift table — doc, file:line, claimed value, actual value, metric name
- [ ] **DOCDRIFT-05**: Detector exits non-zero on any drift, zero on agreement, with `--json` flag for machine-readable output

### Cross-Reference Backfill

- [ ] **DOCREF-01**: All references to relocated `docs/health-reports/full-audit-2026-04-11.md` are repaired or removed across the repo
- [ ] **DOCREF-02**: All references to relocated `.planning/codebase/STRUCTURE.md` are repaired or removed across the repo

### CI Integration

- [ ] **DOCCI-01**: `validate-doc-links.cjs` runs as a dedicated step in `.github/workflows/test.yml` on every PR
- [ ] **DOCCI-02**: `check-doc-drift.cjs` runs as a dedicated step in `.github/workflows/test.yml` on every PR
- [ ] **DOCCI-03**: Both checks fail the workflow on non-zero exit, blocking merge via existing branch protection

## Future Requirements

Deferred to a later milestone:

- **DOCLIVE-01**: Living-docs cross-doc consistency check (same fact stated differently across CLAUDE.md / README.md / DEVOPS-HANDOFF.md beyond numeric counts handled by DOCDRIFT) — would require structured fact registry, larger scope than v2.8
- **DOCMAP-01**: Codebase map staleness detection (`.planning/codebase/CODEBASE-MAP-*.md` drift vs. live structure) — separate from living docs, distinct measurement strategy
- **DOCEXT-01**: External link validator (HTTP refs) — flaky in CI, separate concern from internal integrity

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-fix mode | Validators are read-only/report-only by design; auto-rewriting docs introduces risk and conflicts with `/gsd:sync-docs` |
| Markdown style linting | Separate concern; project follows informal conventions, adding linter is bigger than docs integrity |
| Spell check / grammar | Out of scope for an integrity-focused milestone |
| Auto-PR for drift fixes | Existing `/gsd:sync-docs` already provides guided fix flow; CI gate is the missing piece, not auto-fix |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCLINK-01 | Phase 55 | Pending |
| DOCLINK-02 | Phase 55 | Pending |
| DOCLINK-03 | Phase 55 | Pending |
| DOCLINK-04 | Phase 55 | Pending |
| DOCDRIFT-01 | Phase 56 | Pending |
| DOCDRIFT-02 | Phase 56 | Pending |
| DOCDRIFT-03 | Phase 56 | Pending |
| DOCDRIFT-04 | Phase 56 | Pending |
| DOCDRIFT-05 | Phase 56 | Pending |
| DOCREF-01 | Phase 57 | Pending |
| DOCREF-02 | Phase 57 | Pending |
| DOCCI-01 | Phase 57 | Pending |
| DOCCI-02 | Phase 57 | Pending |
| DOCCI-03 | Phase 57 | Pending |

## Acceptance Criteria

This milestone is complete when:

1. Both validator scripts exist, are unit-tested, and pass on a clean repo
2. Both validators run as blocking CI steps on every PR (visible in GitHub Actions)
3. Cross-reference backfill is shipped — no broken refs to relocated docs remain
4. Test suite green; coverage holds at ≥ 91% line / ≥ 83% branch
5. CLAUDE.md, README.md, DEVOPS-HANDOFF.md updated to reflect new scripts and CI gates

---
*Requirements defined: 2026-05-07 — v2.8 Documentation Integrity*
*Previous milestone (v2.7) requirements archived: `.planning/milestones/v2.7-REQUIREMENTS.md`*
