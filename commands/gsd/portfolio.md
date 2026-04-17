---
name: gsd:portfolio
description: Cross-project dashboard — scan all projects, show status, recommend what to work on next
argument-hint: "[--path ~/projects] [--include-unmanaged]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
---
<!-- workflow-exemption: inline — cross-project scanning is self-contained -->

<objective>
Scan all projects in a directory, read their GSD state, check git health, and present a ranked dashboard showing which projects need attention. Replaces manually cd-ing into each project to check status.

Output: Ranked table of all projects with milestone, status, progress, staleness, and git state. Ends with a recommendation for what to work on next.
</objective>

<context>
Arguments: $ARGUMENTS (optional)
- `--path ~/other/dir` — Scan a different directory (default: `~/projects/`)
- `--include-unmanaged` — Include directories without .planning/STATE.md (default: skip)

**What it reads per project (all optional — graceful skip if missing):**
- `.planning/STATE.md` — milestone, status, percent, last_activity
- `.planning/MILESTONES.md` — shipped milestone history
- `CLAUDE.md` — project identity (first line or heading)
- `tasks/todo.md` — open item count
- Git state — branch, clean/dirty, unpushed commit count, last commit date
</context>

<process>

## Step 1: Discover Projects

1. List all directories in the scan path (default `~/projects/`)
2. Filter out non-project entries:
   - Skip files (not directories)
   - Skip hidden directories (starting with `.`)
   - Skip `node_modules`, `.git`, `__pycache__`
   - Skip known non-project directories: `tasks`, `portfolio`, `context`
3. Count total directories found

## Step 2: Read Each Project

For each project directory, collect data into a record. Use subagents or parallel reads where possible for speed.

**For each project:**

```bash
# 1. Project name — directory basename
name=$(basename "$dir")

# 2. GSD state (if managed)
# Read .planning/STATE.md YAML frontmatter for: milestone, status, percent, last_activity
# If no STATE.md → mark as "unmanaged"

# 3. Project identity
# Read first heading from CLAUDE.md (line starting with #)
# If no CLAUDE.md → use directory name

# 4. Open todos
# Count lines matching "- [ ]" in tasks/todo.md
# If no todo.md → 0

# 5. Git state
# Branch: git -C "$dir" branch --show-current 2>/dev/null
# Dirty: git -C "$dir" status --porcelain 2>/dev/null | wc -l
# Unpushed: git -C "$dir" log origin/$(git -C "$dir" branch --show-current)..HEAD --oneline 2>/dev/null | wc -l
# Last commit: git -C "$dir" log -1 --format="%ar" 2>/dev/null
# If not a git repo → mark git as "none"
```

## Step 3: Classify and Rank

Assign each project a **priority class** based on its state:

| Priority | Condition | Sort within class |
|----------|-----------|-------------------|
| 1. **Stale active** | status = executing/verifying AND last_activity > 3 days ago | Oldest first |
| 2. **Dirty** | Git has uncommitted changes or unpushed commits | Most unpushed first |
| 3. **Active** | status = executing/verifying/planning AND last_activity ≤ 3 days | Lowest percent first |
| 4. **Ready** | status = complete (milestone done, not archived) | Oldest first |
| 5. **Archived** | status = archived | Most recently archived first |
| 6. **Unmanaged** | No .planning/STATE.md | Alphabetical |

## Step 4: Present Dashboard

Display the ranked table:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  PROJECT PORTFOLIO — ~/projects/                                           ║
║  Scanned: [N] projects | [date]                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

| # | Project                    | Milestone | Status     | Progress | Last Active | Git          | Todos |
|---|----------------------------|-----------|------------|----------|-------------|--------------|-------|
| 1 | NOC-Self-Evolving-Agents   | v1.0      | executing  | 40%      | 5d ago      | 2 unpushed   | 3     |
| 2 | Customer-Churn             | v1.2      | verifying  | 90%      | 1d ago      | dirty (4)    | 1     |
| 3 | Inside Claude Code         | v2.2      | archived   | 100%     | today       | clean        | 0     |
| 4 | RSM                        | —         | unmanaged  | —        | 3d ago      | dirty (7)    | —     |
```

**Column definitions:**
- **Progress**: percent from STATE.md (or `—` if unmanaged)
- **Last Active**: last_activity from STATE.md, falling back to last git commit date
- **Git**: `clean`, `dirty (N files)`, `N unpushed`, or `none`
- **Todos**: count of open `- [ ]` items in tasks/todo.md

## Step 5: Recommendation

After the table, provide a single recommendation:

```
Recommendation: [Project name]
  Reason: [why this project needs attention first]
  Resume with: cd ~/projects/[name] && claude
  Then run: /gsd:prime-patterns (or /gsd:resume-work if mid-phase)
```

**Recommendation logic (first match wins):**
1. If any project has stale active status (>3 days, mid-execution) → recommend that one
2. If any project has dirty git with unpushed work → recommend pushing/finalizing that one
3. If any project is in verifying status → recommend finishing verification
4. If any project is in executing status → recommend continuing execution
5. If nothing is active → recommend the most recently active unmanaged project or suggest `/gsd:new-project`

## Step 6: Optional Detail

If the user appended a project name to the command (e.g., `/gsd:portfolio Customer-Churn`), after the dashboard, show expanded detail for that one project:

- Full STATE.md contents
- Recent git log (last 5 commits)
- Open todo items
- Active patterns (if state/pattern-context.md exists)

</process>

<critical_rules>

- **Read-only:** This command never modifies any project. It only reads state and presents it.
- **Graceful degradation:** If STATE.md, CLAUDE.md, todo.md, or git aren't available for a project, fill in `—` and move on. Never error out on a missing file.
- **Speed:** Use `git -C` with the project path instead of cd-ing. Run git commands with 2>/dev/null to suppress errors on non-git directories. Parallelize where possible.
- **No secrets:** Never display file contents, environment variables, or credentials. Only display metadata (status, counts, dates).
- **Respect .gitignore:** Don't scan inside node_modules, .git, or other ignored directories when counting files.
- **Stable sort:** Projects with the same priority class maintain their sort order (oldest-first for stale, alphabetical for unmanaged).
- **Default excludes unmanaged:** Unless `--include-unmanaged` is passed, only show projects with .planning/STATE.md. Mention the count of unmanaged projects at the bottom: "[N] unmanaged projects not shown. Use --include-unmanaged to see all."

</critical_rules>

<success_criteria>
- [ ] All project directories scanned
- [ ] Each project classified by priority
- [ ] Dashboard table displayed with all columns populated
- [ ] Single recommendation with actionable next step
- [ ] No errors from missing files or non-git directories
</success_criteria>
