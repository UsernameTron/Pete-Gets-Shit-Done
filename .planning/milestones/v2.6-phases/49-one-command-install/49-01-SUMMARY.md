---
phase: 49-one-command-install
plan: "01"
subsystem: installer
tags: [install, dx, idempotent, orchestrator]
dependency_graph:
  requires: [bin/install.js, scripts/build-hooks.js, lib/injection-patterns.json]
  provides: [bin/setup-from-clone.js, npm run setup]
  affects: [package.json]
tech_stack:
  added: []
  patterns: [zero-dependency CommonJS, execFileSync subprocess orchestration, mtime-based idempotency, Buffer.equals content dedup]
key_files:
  created:
    - bin/setup-from-clone.js
  modified:
    - package.json
decisions:
  - "execFileSync over exec/spawn — no shell injection risk; subprocess output inherited to terminal (stdio: inherit)"
  - "mtime comparison for npm install skip — package.json mtime vs node_modules/.package-lock.json mtime is the npm-canonical freshness signal"
  - "Buffer.compare for injection-patterns.json dedup — content-hash approach over mtime avoids false-positive updates when mtime drifts"
  - "build-hooks always runs — it is fast (<1s) and ensures dist hooks are in sync; skipping would risk stale hook installs"
  - "Verification counts .md files in commands/gsd — this matches how the installer creates them (one .md per command)"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-17"
  tasks_completed: 2
  files_modified: 2
  commits: 2
---

# Phase 49 Plan 01: One-Command Install Orchestrator Summary

One-command install script (`npm run setup`) that orchestrates the full GSD developer setup — npm install, hook build, Claude installer, injection-patterns copy — with idempotency, fail-fast error handling, and a pass/fail verification table.

## What Was Built

**`bin/setup-from-clone.js`** (342 lines, zero external dependencies):

A CommonJS Node.js orchestration script that takes a fresh `git clone` to a fully working GSD install in one command. It sequences:

1. `npm install` — skipped if `node_modules` is fresh (mtime comparison against `.package-lock.json`)
2. `node scripts/build-hooks.js` — always runs; ensures `hooks/dist/` is current before installer copies them
3. `node bin/install.js --claude` — delegates all symlink/hook/plugin work to the existing installer
4. Copy `lib/injection-patterns.json` → `~/.claude/get-shit-done/bin/lib/injection-patterns.json` — skipped if content is identical (Buffer.compare)
5. Verification pass: command count, 6 hook files, plugin registration, injection-patterns presence
6. GSD UAT-style results table (PASS/SKIP/FAIL/WARN columns) with summary counts

**`package.json`**: Added `"setup": "node bin/setup-from-clone.js"` as the first entry in the scripts object.

## Decisions Made

1. **execFileSync over exec/spawn**: Avoids shell injection risk; `stdio: 'inherit'` passes subprocess output directly to terminal. No promise chains or callback complexity.

2. **mtime comparison for npm install skip**: `package.json` mtime vs `node_modules/.package-lock.json` mtime is npm's own canonical freshness signal. If `package-lock.json` is older than `package.json`, npm would re-install anyway.

3. **Buffer.compare for injection-patterns.json dedup**: Content-equality check avoids false-positive copies when file timestamps drift (git checkout changes mtime but not content). More reliable than mtime for a static JSON asset.

4. **build-hooks always runs**: The hook build is sub-second and idempotent. The risk of shipping stale `hooks/dist/` to install is higher than the cost of always re-building.

5. **Verification uses .md file count**: The installer creates one `.md` file per command in `~/.claude/commands/gsd/`. Counting `.md` files in both the repo source and the install target gives a precise install completeness check without needing to know the exact 63-command list.

## Deviations from Plan

None — plan executed exactly as written. All 16 decisions from CONTEXT.md implemented.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create bin/setup-from-clone.js | b3a70df | bin/setup-from-clone.js |
| 2 | Add setup script entry to package.json | 7f7a932 | package.json |

## Verification Results

- `node -c bin/setup-from-clone.js` — syntax valid
- `node -e "require('./package.json').scripts.setup"` — returns `"node bin/setup-from-clone.js"`
- All existing package.json scripts preserved
- Zero external dependencies (fs, path, os, child_process only)
- 342 lines (requirement: >= 150)
- Contains all required integration points: npm install, build-hooks, install.js --claude, injection-patterns copy, verification table, process.exit(1)

## Self-Check: PASSED

- `bin/setup-from-clone.js` — EXISTS (342 lines)
- `package.json` updated with setup script — CONFIRMED
- Commit b3a70df — EXISTS
- Commit 7f7a932 — EXISTS
- Zero stubs or TODOs in created files
