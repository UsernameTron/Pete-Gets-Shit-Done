---
name: gsd:sync-docs
description: Audit and rewrite all project documentation from live codebase state, then report what changed
argument-hint: "[--dry-run]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Edit
  - Glob
  - Grep
---

## Objective

Synchronize all project documentation to match live codebase reality. Updates README.md, CLAUDE.md, .planning/PROJECT.md, docs/DEVOPS-HANDOFF.md, and CHANGELOG.md with accurate counts, stats, and milestone state derived from live measurements. Produces an inline diff-style terminal report showing every change made.

This command runs inline — no agent delegation. It is designed to be run once per milestone or whenever documentation drift is suspected.

If `$ARGUMENTS` contains `--dry-run`, collect all proposed changes but do not write any files. Report what would change instead of what was changed.

---

## Process

### Step 0: Parse Arguments

Check `$ARGUMENTS` for the `--dry-run` flag.

```bash
echo "$ARGUMENTS" | grep -q "\-\-dry-run" && echo "DRY_RUN=true" || echo "DRY_RUN=false"
```

If `--dry-run` is present, set dry-run mode for all subsequent steps. No file writes will occur. The final report will say "would update" instead of "updated".

---

### Step 1: Measure Live Codebase State

Run each measurement fresh. No caching. Accuracy is the point — 30 seconds is acceptable for a command run once per milestone.

**Command count:**
```bash
ls commands/gsd/*.md | wc -l
```
Store as `command_count`.

**Agent count (gsd-*.md only, exclude _archived/):**
```bash
ls agents/gsd-*.md 2>/dev/null | wc -l
```
Store as `agent_count`.

**Skill count:**
```bash
ls -d plugins/*/skills/*/ 2>/dev/null | wc -l
```
Store as `skill_count`.

**Version:**
```bash
node -e "console.log(require('./package.json').version)"
```
Store as `version`.

**Test stats (run npm test, parse suite count and assertion count):**
```bash
npm test 2>&1 | tail -20
```
Parse the output for:
- Number of test suites (look for patterns like `N suites`, `N passing`, or the test runner summary line)
- Number of assertions (look for `N assertions`, `N tests`, or assertion count in summary)

Store as `test_suite_count` and `test_assertion_count`.

**Coverage (run test:coverage, parse "All files" line):**
```bash
npm run test:coverage 2>&1 | grep "All files"
```
Parse the statement coverage percentage from the "All files" summary line.
Store as `coverage_pct` (e.g., `90.79%`).

**Planning state:**
```bash
# Current milestone
grep "^milestone:" .planning/STATE.md | head -1

# Phase count in this milestone
ls -d .planning/phases/*/ 2>/dev/null | wc -l

# Completed plan count (SUMMARY.md files = completed plans)
find .planning/phases/ -name "*-SUMMARY.md" 2>/dev/null | wc -l
```

Store as `milestone_name`, `phase_count`, `completed_plan_count`.

---

### Step 2: Read Current Doc Values

For each target document, extract current numeric values and compare against live measurements. Build a comparison table tracking what is stale.

**Search README.md for stale values:**
```bash
grep -n "slash commands\|built-in agents\|Claude Code skills\|test suites\|assertions\|coverage" README.md | head -30
```

Extract:
- Current command count (e.g., `63 slash commands` → `63`)
- Current agent count (e.g., `17 built-in agents` → `17`)
- Current skill count (e.g., `45 Claude Code skills` → `45`)
- Current test suite count
- Current assertion count
- Current coverage percentage
- Current version references

**Search CLAUDE.md for stale values:**
```bash
grep -n "slash commands\|built-in agents\|Claude Code skills\|test suites\|assertions" CLAUDE.md | head -30
```

**Search .planning/PROJECT.md for stale milestone state:**
```bash
grep -n "milestone\|phases\|plans\|shipped\|coverage\|tests" .planning/PROJECT.md | head -30
```

**Search docs/DEVOPS-HANDOFF.md for stale values:**
```bash
grep -n "suites\|assertions\|coverage\|version\|commands\|agents" docs/DEVOPS-HANDOFF.md | head -30
```

Record every value found, its file, and its line number. Compare each against the live measurement. Build an internal change list:

```
changes = [
  { file: "README.md", section: "command count", old: "63", new: "64", line: N },
  { file: "CLAUDE.md", section: "test stats", old: "479 test suites, 2,490 assertions", new: "...", line: N },
  ...
]
```

---

### Step 3: Update README.md

For each stale value identified in Step 2 for README.md, use the Edit tool to replace the old value with the live value. Preserve all surrounding text. Only touch the specific line where the value appears.

**Patterns to update in README.md:**

Command count — look for patterns like:
- `**N slash commands**` → replace N with `command_count`
- `N commands` in key stats sections

Agent count — look for patterns like:
- `**N built-in agents**` → replace N with `agent_count`

Skill count — look for patterns like:
- `**N Claude Code skills**` → replace N with `skill_count`

Test stats — look for patterns like:
- `**N test suites, N assertions**` → replace both numbers with live values

Coverage — look for patterns like:
- `N% overall / N% per module / N% security` → replace with live coverage values

Version — look for patterns like:
- `v1.30.0` or `Version: N.N.N` → replace with live `version`

For each edit:
- Record the old value string
- Record the new value string
- Add to changes list with `file: "README.md"`, `section: [description]`

If a value already matches the live measurement, skip it (no edit needed, no entry in changes).

---

### Step 4: Update CLAUDE.md

Same pattern as Step 3 for CLAUDE.md. Update:

**Command count references:**
```
"63 slash commands" → "[command_count] slash commands"
```

**Agent count references:**
```
"17 built-in agents" → "[agent_count] built-in agents"
```

**Skill count references:**
```
"45 Claude Code skills" → "[skill_count] Claude Code skills"
```

**Test stats:**
```
"479 test suites, 2,490 assertions" → "[test_suite_count] test suites, [test_assertion_count] assertions"
```

Record each change with `file: "CLAUDE.md"` and the section description.

---

### Step 5: Update .planning/PROJECT.md

Read `.planning/STATE.md` and `.planning/ROADMAP.md` as the authoritative source for milestone state.

Update PROJECT.md sections that reference:

**Current milestone name and version:**
Look for `**Current milestone:**` line → update with live value from STATE.md.

**Test and coverage stats:**
Look for `**Tests:**` or `**Coverage:**` lines → update with live values.

**Package version:**
Look for `**Package:**` line → update with live `version`.

**Phase and plan counts:**
Look for `**Total phases executed:**` → update with live `phase_count` plus previously completed phases.

For each edit, record the change with `file: ".planning/PROJECT.md"` and section description.

---

### Step 6: Update docs/DEVOPS-HANDOFF.md

Update DevOps-facing doc with live values. Read the file and locate these sections:

**Version header:**
```
Last verified: [date] | Version: [version] | Milestone: [milestone]
```
Update `Version:` and `Milestone:` fields with live values. Update date to today.

**Version in summary table:**
```
| Version | 1.30.0 |
```
Update with live `version`.

**Command count in installation table:**
```
| Commands | ... | 63 GSD slash commands |
```
Update with live `command_count`.

**Agent count in installation table:**
```
| Agents | ... | 17 specialized agent definitions |
```
Update with live `agent_count`.

**Test stats (if present):**
Look for test suite count and assertion count references → update with live values.

**Coverage (if present):**
Look for coverage percentage references → update with live `coverage_pct`.

For each edit, record the change with `file: "docs/DEVOPS-HANDOFF.md"` and section description.

---

### Step 7: Update CHANGELOG.md

Generate new changelog entries from git history since the last recorded version tag.

**Find last tag:**
```bash
git describe --tags --abbrev=0 2>/dev/null || echo "none"
```

**Get commits since that tag (or all commits if no tag):**
```bash
# If tag exists:
git log [last-tag]..HEAD --oneline --no-merges

# If no tag:
git log --oneline --no-merges | head -100
```

**Parse conventional commit prefixes and group:**

| Prefix | Changelog Section |
|--------|------------------|
| `feat:` | `### Added` |
| `fix:` | `### Fixed` |
| `docs:` | `### Changed` |
| `chore:` | `### Changed` |
| `refactor:` | `### Changed` |
| `test:` | `### Changed` |
| `perf:` | `### Changed` |

**Check existing [Unreleased] section:**
```bash
grep -n "## \[Unreleased\]" CHANGELOG.md | head -1
```

If an `[Unreleased]` section exists, read its current content to avoid duplicates — compare commit message text against existing entries to skip already-recorded commits.

**Format new entries in Keep a Changelog style:**
```markdown
## [Unreleased]

### Added
- feat: description (abc1234)

### Changed
- docs: description (def5678)
- chore: description (ghi9012)

### Fixed
- fix: description (jkl3456)
```

If no `[Unreleased]` section exists, create one at the top of the file (immediately after the file header, before the first versioned entry).

If `[Unreleased]` exists but is empty, append the new entries into it.

Do not create a new `[Unreleased]` header if one already exists — append into the existing one.

**Count new entries added.** Record change as `file: "CHANGELOG.md"`, `section: "unreleased entries"`, `old: "N entries"`, `new: "N+M entries added"`.

---

### Step 8: Generate Diff Report

After all updates are complete (or after all proposed changes are collected in dry-run mode), print an inline terminal report.

**Format:**
```
sync-docs Report
================

| File                    | Section Updated     | Old Value                           | New Value                           |
|-------------------------|---------------------|-------------------------------------|-------------------------------------|
| README.md               | command count       | 63 slash commands                   | 64 slash commands                   |
| CLAUDE.md               | test stats          | 479 suites, 2490 assertions         | 485 suites, 2510 assertions         |
| .planning/PROJECT.md    | milestone state     | v2.5 in progress                    | v2.6 in progress                    |
| docs/DEVOPS-HANDOFF.md  | version             | 1.30.0                              | 1.31.0                              |
| CHANGELOG.md            | unreleased entries  | 0 entries                           | 12 entries added                    |

Summary: [N] files updated, [M] sections changed, [K] files skipped (already current).
```

If `--dry-run` is active, prefix the entire output with:
```
DRY RUN — no files were modified. Changes that would have been made:
```
And change "updated" to "would update" in the summary line.

If all values already match live measurements (nothing stale), print:
```
All documentation is current. No changes needed.
```

---

## Completion

The command is complete when the diff report has been printed to the terminal. Do not commit the changes — the operator reviews the report and commits when satisfied.

If any target doc file is missing, skip it and note it as `SKIPPED — file not found` in the report. Do not create missing doc files.

---

## Reference: Measurement Commands Quick Reference

| Metric | Command |
|--------|---------|
| Command count | `ls commands/gsd/*.md \| wc -l` |
| Agent count | `ls agents/gsd-*.md \| wc -l` |
| Skill count | `ls -d plugins/*/skills/*/ \| wc -l` |
| Version | `node -e "console.log(require('./package.json').version)"` |
| Test stats | `npm test 2>&1 \| tail -20` |
| Coverage | `npm run test:coverage 2>&1 \| grep "All files"` |
| Last git tag | `git describe --tags --abbrev=0` |
| Commits since tag | `git log [tag]..HEAD --oneline --no-merges` |

---

## Reference: Target Documents

| File | Stale-Prone Sections |
|------|----------------------|
| `README.md` | Command count, agent count, skill count, test stats, coverage, version |
| `CLAUDE.md` | Command count, agent count, skill count, test stats |
| `.planning/PROJECT.md` | Milestone status, phase history, test stats, coverage, version |
| `docs/DEVOPS-HANDOFF.md` | Test stats, coverage, version, command count, agent count |
| `CHANGELOG.md` | [Unreleased] entries from git commits since last tag |

---

## Reference: Conventional Commit Prefix Mapping

Per D-05 (Phase 51 decisions):

| Commit Prefix | CHANGELOG Section |
|---------------|------------------|
| `feat:` | `### Added` |
| `fix:` | `### Fixed` |
| `docs:` | `### Changed` |
| `chore:` | `### Changed` |
| `refactor:` | `### Changed` |
| `test:` | `### Changed` |
| `perf:` | `### Changed` |

CHANGELOG uses Keep a Changelog format. The `[Unreleased]` section accumulates commits between tagged releases. Do not duplicate entries already present.

---

## Constraints

- **No agent delegation.** This command runs inline. All steps execute directly, not via spawned agents (per D-10, D-11).
- **Live measurements only.** Never use cached or hardcoded counts. Run the measurement commands every time (per D-01).
- **Surgical edits.** Only change the specific value that is stale. Preserve all surrounding text, formatting, and structure.
- **No commit.** This command reads and writes docs but does not git commit. The operator decides when to commit after reviewing the report.
- **Idempotent.** Running twice produces the same result. Already-current values are left untouched.
- **Skip missing files.** If a target doc does not exist, skip it and note it in the report. Do not create it.
