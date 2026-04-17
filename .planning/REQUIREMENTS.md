# Requirements: get-shit-done — v2.4 Foundation Hardening

**Defined:** 2026-04-16
**Core Value:** Predictable, high-quality execution at scale
**Source:** FOUNDATION-AUDIT-20260416.md (8-dimension structural integrity audit)

## v2.4 Requirements

### Phase 45 — Critical Fixes (top 3 structural risks)

- [ ] **PLUG-01**: Factory plugin loads from live source, not frozen orphaned cache — register claude-code-factory in local-plugin-marketplace/marketplace.json so Claude Code resolves the current source instead of the stale March 19 cache snapshot
- [ ] **SECPAT-01**: Shared injection pattern module consumed by both gsd-prompt-guard.js and lib/security.cjs — merge the bidirectional gap (18 hook-only + 17 lib-only patterns) into a single source of truth, maintaining zero-dependency independence for the hook via build-time inlining or a shared .json file
- [ ] **HOOK-04**: Resolve dead {{GSD_VERSION}} placeholder — either implement template substitution in scripts/build-hooks.js that replaces the placeholder at build time, or remove the placeholder comment from all 7 hook source files and the staleness-check skip logic in gsd-check-update.js

### Phase 46 — Housekeeping (remaining 4 WARN items)

- [ ] **DOC-01**: Update README.md and CLAUDE.md to reflect actual agent count (18, not 16) and command count (63, not 61) — audit-agents and audit-deps commands, gsd-dependency-auditor and gsd-ecosystem-auditor agents
- [ ] **COV-01**: Raise branch coverage for workstream.cjs (currently 50.68%) and build-hooks.js (currently 50.00%) above the 80% module threshold
- [ ] **LINK-01**: Resolve command/workflow linkage drift — document convention for when a command uses inline skill vs workflow delegation, and either create workflows for the 11 unlinked commands or add inline exemption annotations; remove or repurpose the 5 orphaned workflow files
- [ ] **REF-01**: Replace hardcoded ~/projects/Pete-Gets-Shit-Done/agents/ path in crew.md with a portable alternative (e.g., relative path or dynamic resolution)

## Future Requirements

None — this milestone closes the foundation audit findings. Post-v2.4 scope is TBD.

## Out of Scope

| Feature | Reason |
|---------|--------|
| D2 duplicate agents across scopes | User-level copies are redundant but harmless; no runtime impact |
| D3 lesson-capture-gate.cjs +x bit | Cosmetic for Node.js — hooks invoked via `node` command, not direct execution |
| D5 claude-mcp-ecosystem cache staleness | Minor metadata drift, skills match 7/7; lower risk than factory cache |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUG-01 | Phase 45 | Pending |
| SECPAT-01 | Phase 45 | Pending |
| HOOK-04 | Phase 45 | Pending |
| DOC-01 | Phase 46 | Pending |
| COV-01 | Phase 46 | Pending |
| LINK-01 | Phase 46 | Pending |
| REF-01 | Phase 46 | Pending |

**Coverage:**
- v2.4 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
