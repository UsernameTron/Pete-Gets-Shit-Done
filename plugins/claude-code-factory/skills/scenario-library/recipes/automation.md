# Automation Recipes (Hook-Based)

12 recipes for things that happen AUTOMATICALLY when Claude acts.

---

### A01: auto-lint
**Name**: Auto-lint after every edit
**Type**: PostToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write|Edit, handler: command, command: `npx eslint --fix`, blocking: false, timeout: 10
**Customize**: linter command (eslint/prettier/ruff/gofmt), file type filter, blocking vs fire-and-forget
**Verify**: Edit any file and confirm it gets auto-formatted

---

### A02: test-on-change
**Name**: Run tests after every code change
**Type**: PostToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write|Edit, handler: command, command: `npm test`, blocking: false, timeout: 30
**Customize**: test command (npm test/pytest/go test/cargo test), file type filter, blocking behavior
**Verify**: Edit a source file and watch for test output

---

### A03: commit-gate
**Name**: Review code before committing
**Type**: COMBO — PreToolUse Hook + Reference Skill | **Generators**: hook-factory + skill-factory
**Pre-resolved**: hook: event: PreToolUse, matcher: Bash, command: grep "git commit" → exit 2, blocking: true; skill: name: commit-review-standards, user-invocable: false
**Customize**: review criteria, which branches to gate, auto-approve patterns
**Verify**: Try `git commit` and confirm Claude reviews changes first

---

### A04: block-dangerous-commands
**Name**: Block dangerous shell commands
**Type**: PreToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PreToolUse, matcher: Bash, handler: command, command: grep for `rm -rf|git push --force|git reset --hard|drop table` → exit 2, blocking: true
**Customize**: which commands to block, allow-list exceptions
**Verify**: Try a blocked command and confirm it's denied

---

### A05: session-setup
**Name**: Run setup tasks when Claude starts
**Type**: SessionStart Hook | **Generator**: hook-factory
**Pre-resolved**: event: SessionStart, handler: command, command: `echo "Session started at $(date)" >> .claude/session.log`
**Customize**: what runs at startup (git pull, env check, status display, branch info)
**Verify**: Start a new Claude session and check the log

---

### A06: auto-type-check
**Name**: Type-check after TypeScript changes
**Type**: PostToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write|Edit, handler: command, command: `npx tsc --noEmit`, blocking: true, timeout: 30
**Customize**: TypeScript config path, blocking behavior, file extension filter
**Verify**: Edit a .ts file and watch for type-check output

---

### A07: notify-on-completion
**Name**: Get notified when Claude finishes a task
**Type**: Stop Hook | **Generator**: hook-factory
**Pre-resolved**: event: Stop, handler: command, command: `osascript -e 'display notification "Claude finished" with title "Claude Code"'`
**Customize**: notification method (macOS notification, terminal bell, Slack webhook, sound)
**Verify**: Let Claude finish a task and check for the notification

---

### A08: auto-add-tests
**Name**: Remind to add tests for new functions
**Type**: PostToolUse Hook (prompt handler) | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write, handler: prompt, prompt: "A new file was just written. If it contains functions without tests, remind the user to add test coverage."
**Customize**: what triggers the reminder (new files only vs all edits), test framework conventions
**Verify**: Write a new file with functions and check for the test reminder

---

### A09: prevent-secret-commits
**Name**: Block committing secrets or env files
**Type**: PreToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PreToolUse, matcher: Bash, handler: command, command: grep for `git add` + `.env|.pem|.key|.secret` → exit 2, blocking: true
**Customize**: file patterns to protect, allow-list for specific env files
**Verify**: Try to `git add .env` and confirm it's blocked

---

### A10: log-all-changes
**Name**: Keep an audit log of all file changes
**Type**: PostToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write|Edit, handler: command, command: log timestamp + file path to `.claude/audit.log`, async: true
**Customize**: log format, log location, what details to capture
**Verify**: Edit a file and check `.claude/audit.log` for the entry

---

### A11: auto-doc-update
**Name**: Update documentation when code changes
**Type**: PostToolUse Hook (prompt handler) | **Generator**: hook-factory
**Pre-resolved**: event: PostToolUse, matcher: Write|Edit, handler: prompt, prompt: "A source file was just modified. Check if any documentation references the changed code and needs updating."
**Customize**: which docs to check (README, JSDoc, docstrings), scope of updates
**Verify**: Modify a documented function and check if docs get flagged for update

---

### A12: branch-protection
**Name**: Prevent edits on main branch
**Type**: PreToolUse Hook | **Generator**: hook-factory
**Pre-resolved**: event: PreToolUse, matcher: Write|Edit, handler: command, command: `git branch --show-current | grep -qE '^(main|master)$' && exit 2 || exit 0`, blocking: true
**Customize**: protected branch names, exceptions for specific files
**Verify**: Switch to main and try to edit a file — confirm it's blocked
