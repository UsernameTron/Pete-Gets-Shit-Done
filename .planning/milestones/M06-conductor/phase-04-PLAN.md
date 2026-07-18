# CONDUCTOR — Phase 04 (stub)
# Repo Migration — AGENTS.md Canonicalization

**GSD lifecycle state:** stub — flesh out at PHASE_DISCUSSING.

## What you're building
Idempotent per-repo migration to a single canonical AGENTS.md with CLAUDE.md/GEMINI.md symlinks, applied repo-by-repo with explicit rollback per repo. Deliberately excluded from phase-01 so its rollback claim ("nothing outside the factory repo and ~/.claude/skills/") stays true.

## Gates (summary)
Second run on any migrated repo = zero changes; git revert restores any repo independently; no repo with divergent instruction files is auto-merged.
