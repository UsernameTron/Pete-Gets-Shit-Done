# Security Recipes (Permission/Settings-Based)

5 recipes for controlling what Claude can and can't do.

---

### P01: read-only-mode
**Name**: Make Claude read-only
**Type**: Settings change | **Generator**: settings-architect
**Pre-resolved**: defaultMode: plan, scope: .claude/settings.local.json
**Customize**: permanent vs session-only, exceptions for specific files
**Verify**: Try to edit a file and confirm Claude operates in read-only mode

---

### P02: protect-production-files
**Name**: Block edits to production configs
**Type**: Permission deny rules | **Generator**: settings-architect
**Pre-resolved**: permissions.deny: [Edit(.env*), Edit(*.production.*), Edit(docker-compose.prod.yml)], scope: .claude/settings.json (project)
**Customize**: which file patterns to protect, additional production file paths
**Verify**: Try to edit a protected file and confirm Claude refuses

---

### P03: lock-model
**Name**: Lock Claude to a specific model
**Type**: Settings change | **Generator**: settings-architect
**Pre-resolved**: model: [user-specified], scope: .claude/settings.json or managed
**Customize**: which model to lock to (sonnet, opus, haiku), scope of lock
**Verify**: Check `/config` and confirm the model is locked

---

### P04: allow-test-commands
**Name**: Pre-approve test and build commands
**Type**: Permission allow rules | **Generator**: settings-architect
**Pre-resolved**: permissions.allow: [Bash(npm test *), Bash(npm run build), Bash(npm run lint), Bash(npx tsc *)], scope: .claude/settings.local.json
**Customize**: which commands to auto-approve, package manager (npm/yarn/pnpm)
**Verify**: Run a test command and confirm Claude doesn't ask for permission

---

### P05: sandbox-network
**Name**: Restrict Claude's network access
**Type**: Settings change (sandbox) | **Generator**: settings-architect
**Pre-resolved**: sandbox.enabled: true, sandbox.network.allowedDomains: [], scope: .claude/settings.json
**Customize**: allowed domains list, allow Unix sockets, local binding rules
**Verify**: Try a network request and confirm it's blocked by sandbox
