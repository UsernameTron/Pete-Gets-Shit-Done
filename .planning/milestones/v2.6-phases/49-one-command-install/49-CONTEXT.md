# Phase 49: One-Command Install - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A developer can go from a fresh `git clone` to a fully working, health-verified GSD install by running `npm run setup`. The setup script orchestrates npm install, runs the existing installer for Claude Code, and verifies everything is correctly installed. This is a thin orchestration layer on top of the existing `bin/install.js` — not a rewrite.

</domain>

<decisions>
## Implementation Decisions

### Entry Point Design
- **D-01:** Entry point is an npm script: `"setup": "node bin/setup-from-clone.js"` in package.json
- **D-02:** The one-command flow is: `git clone && cd Pete-Gets-Shit-Done && npm run setup`
- **D-03:** The setup script calls `npm install` internally (user does not run it separately)
- **D-04:** The setup script then runs `bin/install.js --claude` — Claude-only, no runtime prompt. This is a personal tool.
- **D-05:** No shell scripts, no Makefiles — everything stays in the Node ecosystem

### Health Verification Scope
- **D-06:** Comprehensive health check after install. The setup script verifies:
  - Commands exist at `~/.claude/commands/gsd/` (count matches repo command count)
  - Hooks exist and are executable at `~/.claude/hooks/`
  - Plugins registered in `settings.json` `enabledPlugins`
  - `lib/injection-patterns.json` copied to installed location
  - `npm test` runs and confirms 0 failures
- **D-07:** Report results in a pass/fail table (UAT format)

### Idempotency and Update Behavior
- **D-08:** Incremental — detect what's already done and skip it
- **D-09:** If symlinks exist and point to the right place, skip. If hooks match source, skip.
- **D-10:** If source is newer than installed (outdated), update it
- **D-11:** Report what was skipped vs what was updated
- **D-12:** Safe to run after every `git pull`

### Error Recovery
- **D-13:** Fail fast with diagnostics on critical steps (npm install, hook installation)
- **D-14:** Continue past non-critical failures (individual symlink permission issues) but collect them
- **D-15:** Report all collected non-critical failures at the end
- **D-16:** No rollback — partial installs are better than no install, and re-running fixes them (idempotent)

### Claude's Discretion
- Internal structure of `bin/setup-from-clone.js` (function decomposition, logging approach)
- How to detect "source newer than installed" (mtime comparison, content hash, or both)
- How to invoke `bin/install.js` from the setup script (subprocess spawn vs require and call directly)
- Pass/fail table formatting details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer Infrastructure
- `bin/install.js` — Existing installer (5,300 lines). Handles multi-runtime installs, symlink creation, hook copying, plugin registration, settings.json manipulation. The setup script orchestrates this, not replaces it.
- `scripts/build-hooks.js` — Builds hooks from source to `hooks/dist/`. Must run before hook installation.
- `package.json` — npm scripts, bin entry, files manifest. Setup script entry point goes here.

### Hook and Security Assets
- `hooks/dist/` — Built hooks (6 files: gsd-check-update.js, gsd-config-protection.js, gsd-context-monitor.js, gsd-cost-tracker.js, gsd-prompt-guard.js, gsd-statusline.js)
- `lib/injection-patterns.json` — Canonical injection pattern source (v2.4 SECPAT-01). Must be copied to installed location.

### Commands and Agents
- `commands/gsd/` — GSD slash command files (count must match after install)
- `agents/` — Agent definition files (17 active)

### Testing
- `scripts/run-tests.cjs` — Test runner (479 suites, 2,490 assertions). Setup script runs this as final health check.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/install.js` — Already handles all the heavy lifting: symlink creation, hook copying, plugin registration, settings.json manipulation. The setup script calls this rather than reimplementing.
- `scripts/build-hooks.js` — Hook build pipeline. Setup script should run this before invoking install.js.
- `scripts/run-tests.cjs` — Full test suite runner. Setup script runs this as final verification.

### Established Patterns
- Zero-dependency CommonJS — setup script must follow the same constraint
- `install.js` uses `process.exit(1)` on critical failures, stdout for progress, stderr for errors
- Color constants defined at top of install.js (cyan, green, yellow, dim, reset) — reuse or match style
- `install.js` already has `readSettings()`/`writeSettings()` for settings.json manipulation

### Integration Points
- `package.json` `"scripts"` — new `"setup"` entry runs `node bin/setup-from-clone.js`
- `bin/install.js --claude` — primary installer invocation (non-interactive when runtime is pre-selected)
- `~/.claude/commands/gsd/` — symlink target directory for command verification
- `~/.claude/hooks/` — hook installation target directory
- `~/.claude/settings.json` — plugin registration target

</code_context>

<specifics>
## Specific Ideas

- Pass/fail table should match GSD's UAT verification format (the table style used in `/gsd:verify-work` output)
- "Safe to run after every git pull" — this is the key UX requirement. Developer muscle memory should be: pull, setup, work.
- Claude-only install (no runtime prompt) because this is Pete's personal tool, not a general-purpose installer

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 49-one-command-install*
*Context gathered: 2026-04-17*
