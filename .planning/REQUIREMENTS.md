# Requirements: get-shit-done

**Defined:** 2026-04-17
**Core Value:** Predictable, high-quality execution at scale -- turning ambiguous prompts into shipped, tested, documented code without skipped steps.

## v2.6 Requirements

Requirements for milestone v2.6 Developer Experience. Each maps to roadmap phases.

### Install

- [ ] **INST-01**: User can run a single command from a fresh git clone to get a fully working GSD install
- [ ] **INST-02**: Script runs npm install and verifies node_modules populated
- [ ] **INST-03**: Script creates symlinks in ~/.claude/commands/gsd/ for all GSD slash commands
- [ ] **INST-04**: Script copies built hooks to ~/.claude/hooks/ or registers them in settings.json
- [ ] **INST-05**: Script registers plugins in Claude Code plugin config
- [ ] **INST-06**: Script copies lib/injection-patterns.json to required locations
- [ ] **INST-07**: Script verifies install by running a health check and reporting pass/fail

### CI Watch

- [ ] **CIWATCH-01**: User can run /gsd:ci-watch to start polling gh run list for the current branch
- [ ] **CIWATCH-02**: Command polls on a configurable interval until all runs complete
- [ ] **CIWATCH-03**: Command surfaces pass/fail results inline with run names and URLs
- [ ] **CIWATCH-04**: On failure, command fetches workflow logs and diagnoses the failure
- [ ] **CIWATCH-05**: On failure, command suggests specific fixes based on log analysis

### Sync Docs

- [ ] **SDOCS-01**: User can run /gsd:sync-docs to update all project documentation
- [ ] **SDOCS-02**: Command updates test counts, agent counts, command counts, coverage numbers
- [ ] **SDOCS-03**: Command updates milestone status, phase history, architecture descriptions
- [ ] **SDOCS-04**: Command updates README.md, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF.md
- [ ] **SDOCS-05**: Command auto-generates/updates CHANGELOG.md entries from git history
- [ ] **SDOCS-06**: Command reports what changed with a summary of updates made

## Future Requirements

None -- all scoped features are in v2.6.

## Out of Scope

| Feature | Reason |
|---------|--------|
| GUI installer | CLI-only project, no graphical installer needed |
| CI provider abstraction | GitHub Actions only, no Jenkins/GitLab/Circle support this milestone |
| Auto-trigger CI watch on push | Adds hook complexity for marginal value; explicit invocation is clearer |
| Doc sync for external docs | Only project-internal docs (README, CLAUDE.md, PROJECT.md, DEVOPS-HANDOFF, CHANGELOG) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 49 | Pending |
| INST-02 | Phase 49 | Pending |
| INST-03 | Phase 49 | Pending |
| INST-04 | Phase 49 | Pending |
| INST-05 | Phase 49 | Pending |
| INST-06 | Phase 49 | Pending |
| INST-07 | Phase 49 | Pending |
| CIWATCH-01 | Phase 50 | Pending |
| CIWATCH-02 | Phase 50 | Pending |
| CIWATCH-03 | Phase 50 | Pending |
| CIWATCH-04 | Phase 50 | Pending |
| CIWATCH-05 | Phase 50 | Pending |
| SDOCS-01 | Phase 51 | Pending |
| SDOCS-02 | Phase 51 | Pending |
| SDOCS-03 | Phase 51 | Pending |
| SDOCS-04 | Phase 51 | Pending |
| SDOCS-05 | Phase 51 | Pending |
| SDOCS-06 | Phase 51 | Pending |

**Coverage:**
- v2.6 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-04-17*
*Last updated: 2026-04-17 after initial definition*
