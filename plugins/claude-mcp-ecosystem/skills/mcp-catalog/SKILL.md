---
name: mcp-catalog
description: Catalog of available MCP servers and their capabilities. Injected into the architect agent so it can recommend MCP integrations (Gmail, Slack, Netlify, Google Calendar, Canva, Indeed) when designing agent rosters based on what the user describes.
user-invocable: false
---

# MCP Server Catalog

Available Model Context Protocol servers that agents can access when configured in the
project's settings.json.

## Communication & Productivity

**Gmail** — Read, search, send, and manage emails. Use for agents that need to send
notifications, read incoming data from email, or manage communication workflows.
Server name: gmail

**Slack** — Read channels, post messages, manage threads. Use for agents that need to
post updates, read team discussions, or integrate with Slack workflows.
Server name: slack

**Google Calendar** — Read, create, and manage calendar events. Use for agents that
need scheduling awareness or create calendar entries.
Server name: google-calendar

## Development & Deployment

**Netlify** — Deploy sites, manage builds, configure domains. Use for agents that
handle web deployment and hosting.
Server name: netlify

## Design & Content

**Canva** — Create and manage designs, presentations, and visual content.
Server name: canva

## Data & Research

**Indeed** — Search jobs, get company data, access resume information.
Server name: indeed

## Configuration

To add an MCP server to an agent, include it in the agent's frontmatter:

```yaml
mcpServers:
  - gmail
  - slack
```

The server must also be configured in the project's `.claude/settings.json` or the
user's global settings. If a referenced MCP server is not configured, the agent will
function without it — MCP access is an enhancement, not a requirement.

Only suggest MCPs the user has mentioned or implied. Never add MCPs speculatively.
If an MCP is suggested but not configured, note the capability gap in the setup
summary: "Your deployer could also push to Netlify if you connect it."
