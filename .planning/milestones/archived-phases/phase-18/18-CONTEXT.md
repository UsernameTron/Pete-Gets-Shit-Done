# Phase 18 Context: Architecture & Module Boundaries

## Module Dependency Map

```
core.cjs (hub — 1542 lines, 50+ exports)
  └─ model-profiles.cjs (only dependency)

Consumers of core.cjs (all 14 other modules):
  config.cjs → core.cjs, model-profiles.cjs
  init.cjs → core.cjs, security.cjs (lazy)
  state.cjs → core.cjs, frontmatter.cjs, security.cjs (lazy)
  phase.cjs → core.cjs, frontmatter.cjs, state.cjs
  commands.cjs → core.cjs, frontmatter.cjs, model-profiles.cjs, security.cjs (lazy)
  verify.cjs → core.cjs, frontmatter.cjs, state.cjs, model-profiles.cjs (lazy)
  milestone.cjs → core.cjs, frontmatter.cjs, state.cjs
  roadmap.cjs → core.cjs
  workstream.cjs → core.cjs, state.cjs
  uat.cjs → core.cjs, frontmatter.cjs, security.cjs
  template.cjs → core.cjs, frontmatter.cjs
  profile-output.cjs → core.cjs
  profile-pipeline.cjs → core.cjs
  frontmatter.cjs → core.cjs
```

## Import Direction Rules

Allowed:
- Any module → core.cjs (hub)
- Any module → model-profiles.cjs (shared data)
- Higher-level modules → lower-level modules (e.g., phase.cjs → state.cjs → frontmatter.cjs)

Forbidden:
- core.cjs → any consumer module (except model-profiles.cjs)
- Circular dependencies between any pair of modules

## Existing Section Markers in core.cjs

18 section markers already exist:
- Error Infrastructure (line 11)
- Debug logging (line 43)
- Deep freeze utility (line 62)
- Path helpers (line 83)
- Output helpers (line 193)
- File & Config utilities (line 259)
- Git utilities (line 445)
- Markdown normalization (line 465)
- Common path helpers (line 601)
- Active Workstream Detection (line 732)
- Phase utilities (line 766)
- Roadmap milestone scoping (line 937)
- Roadmap & model utilities (line 1050)
- Agent installation validation (line 1087)
- Model alias resolution (line 1139)
- Summary body helpers (line 1185)
- Misc utilities (line 1202)
- Phase file helpers (line 1296)

## Key Integration Points

- safeExec (line 569): sync subprocess wrapper, uses spawnSync with timeout — CancelToken should integrate here
- execGit (line 591): wraps safeExec for git commands
- withPlanningLock: file-based lock for state mutations
- No cancel/abort patterns exist anywhere in codebase currently
