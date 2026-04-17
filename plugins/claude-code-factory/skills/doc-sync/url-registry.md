# URL Registry — Doc Sync

> Single source of truth mapping each cc-ref-* reference skill to its authoritative
> Anthropic documentation URL(s). The doc-sync-checker subagent reads this file to
> know what to fetch and compare.

**Last verified**: 2026-03-14
**Discovery endpoint**: https://code.claude.com/docs/llms.txt
**Total known pages**: 64

---

## Skill-to-URL Mapping

| Reference Skill | Primary URL | Secondary URLs | Last Synced |
|-----------------|-------------|----------------|-------------|
| cc-ref-hooks | https://code.claude.com/docs/en/hooks | https://code.claude.com/docs/en/hooks-guide | — |
| cc-ref-skills | https://code.claude.com/docs/en/skills | — | — |
| cc-ref-settings | https://code.claude.com/docs/en/settings | https://code.claude.com/docs/en/env-vars | — |
| cc-ref-subagents | https://code.claude.com/docs/en/sub-agents | https://code.claude.com/docs/en/agent-teams | — |
| cc-ref-plugins | https://code.claude.com/docs/en/plugins | https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/discover-plugins, https://code.claude.com/docs/en/plugin-marketplaces | — |
| cc-ref-permissions | https://code.claude.com/docs/en/permissions | https://code.claude.com/docs/en/sandboxing | — |
| cc-ref-multi-agent | https://code.claude.com/docs/en/sub-agents | https://code.claude.com/docs/en/agent-teams | — |

## Secondary Pages

These pages contain cross-cutting content that may affect multiple reference skills.
Check for new content that should be reflected in existing skills.

- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/output-styles
- https://code.claude.com/docs/en/commands
- https://code.claude.com/docs/en/tools-reference
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/common-workflows
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/model-config

## Discovery

- Full index: https://code.claude.com/docs/llms.txt
- URL pattern: `https://code.claude.com/docs/en/{topic}`
- Redirect note: `docs.anthropic.com` 301-redirects to `code.claude.com`
- New pages appearing in llms.txt that are not mapped above should be flagged for triage
