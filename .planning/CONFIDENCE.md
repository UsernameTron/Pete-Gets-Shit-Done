---
verdict: BLOCKED
score: n/a
generated: 2026-10-26
---
# Confidence Report

No executed phases in the current milestone (v3.1 CONDUCTOR, status planning), so there are no 4D phase scores; the verdict rests on the six legs.

| Leg | Surface | Result | Detail |
|-----|---------|--------|--------|
| 1 | Planning health | PASS | `validate health`: healthy, 0 errors / 0 warnings; UAT audit 0 items; validate-phase skipped (no executed phase) |
| 2 | Quality audits | FAIL | 1 blocking / 2 flagged — agents BLOCK (`.planning/ecosystem/ECOSYSTEM-REPORT.md`), deps FLAG (`.planning/dependencies/DEPENDENCIES-REPORT.md`) |
| 3 | Build/test/lint | PASS | `build:hooks` clean; 2,977/2,977 tests; 94.39% lines / 84.57% branches, every module ≥ 80%; doc-drift 19/19; doc links valid; lint not configured |
| 4 | Codebase map | PASS | All 7 `.planning/codebase/*.md` regenerated 2026-10-26 (installer split, dispatch table, classify.cjs removal captured) |
| 5 | Docs | PASS | clean — `/gsd:sync-docs` ran this session (PR #90); drift 19/19 |
| 6 | Repo cleanliness | WARN | 0 untracked, 0 gone branches, 0 tracked files > 5 MB, 0 orphans, 0 debug files; 50 TODO/FIXME/XXX markers (info) |

## Ranked fixes

1. **Ecosystem BLOCK — `agents/gsd-dependency-auditor.md:243`** says the agent is read-only with `disallowedTools: Write, Edit`, but its frontmatter grants `Write` (needed to write its report) and disallows only `Edit`. Fix: reword line 243 to "Do not modify anything except the single report file." (Leg 2)
2. **Dependency FLAG — `brace-expansion@5.0.8`** has 3 high + 1 moderate advisories (GHSA-rgw5-rvv9-x895, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr); dev-only via `c8 → test-exclude → minimatch`. Fix: bump to ≥ 5.0.12 (lockfile change, needs approval). (Leg 2)
3. **Ecosystem FLAGs** — 8 write-capable agents lack `disallowedTools`; 4 grant MCP namespace wildcards; installed agents also rewrite bare `~/.claude/` (not only `@~/.claude/`) — confirm the intended install transform. (Leg 2)
4. **CLAUDE.md Architecture section is stale** — lists `lib/core.cjs`, `lib/security.cjs`, `lib/governance.cjs`, `lib/classify.cjs` and a `skills/` directory; real modules live in `get-shit-done/bin/lib/`, `classify.cjs` was removed, `skills/` does not exist. (Leg 4)
5. **Open tickets still true** — uninstall orphans 3 hook registrations (`tasks/uninstall-orphaned-hook-registrations.md`); drift checker guards few README claims (`tasks/doc-drift-coverage-gaps.md`); gap-analysis patterns miss `bin/lib/` (`tasks/install-split-followups.md` item 3). (Leg 4)
