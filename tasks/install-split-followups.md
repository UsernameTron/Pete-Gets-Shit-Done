# Installer split (`refactor/install-split`) — follow-ups

- **Status:** closed — all items done
- **Owner:** Pete (decision), Claude (execution)
- **Earliest pickup:** next session

## Context

`bin/install.js` (5,414 lines) split into 34 modules under `bin/lib/`. Suite 2,946/2,946 before and after; 29-scenario old-vs-new install matrix byte-identical.

## Open items

1. **DONE (#87)** — **Decision — per-module coverage floor (80%).** Six modules land below it once split out: `bin/install.js` 53%, `runtimes/opencode.js` 30%, `uninstall-steps.js` 63%, `runtimes/codex.js` 64%, `runtimes/claude.js` 70%, `settings.js` 78%. Same lines were untested before. Recommended: one follow-up commit with per-runtime uninstall + CLI error-path tests, then PR.
2. **DONE (docs/readme-sync-2026-10-26)** — **Docs:** `docs/ARCHITECTURE.md`, `docs/DEVOPS-HANDOFF.md`, `docs/README-technical.md` still describe a single `bin/install.js`. Run `/gsd:sync-docs` after merge.
3. **DONE (reliability sweep)** — **`scripts/generate-gap-analysis.cjs`:** `OPERATIONAL_PATTERNS` matches only `install.js`; add `bin/lib/`.
4. **DONE (#87)** — **Push/PR when ready:** `cd ~/projects/Pete-Gets-Shit-Done && gh auth switch -u UsernameTron && git push -u origin refactor/install-split && gh pr create --fill`
