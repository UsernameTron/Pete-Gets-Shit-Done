# Connection Recipes (MCP-Based)

5 recipes for connecting Claude to external tools and services.

---

### X01: github
**Name**: Connect to GitHub
**Triggers**: "connect GitHub", "GitHub integration", "use GitHub API", "access repos"
**Type**: MCP Configuration | **Generator**: mcp-configurator
**Pre-resolved**: transport: http, server_name: github, scope: user, auth_type: oauth, url: https://api.githubcopilot.com/mcp/
**Customize**: scope (user vs project), specific repo access, permission restrictions
**Verify**: Run `/mcp` to confirm connection, then try a GitHub tool

---

### X02: postgres
**Name**: Connect to PostgreSQL database
**Triggers**: "connect database", "Postgres connection", "query database", "SQL access"
**Type**: MCP Configuration | **Generator**: mcp-configurator
**Pre-resolved**: transport: stdio, server_name: postgres-db, command: `npx -y @bytebase/dbhub`, scope: project
**Customize**: connection string, read-only mode, schema filter, specific tables
**Verify**: Run `/mcp` to confirm connection, then try querying a table

---

### X03: slack
**Name**: Connect to Slack
**Triggers**: "connect Slack", "Slack integration", "post to Slack", "read Slack messages"
**Type**: MCP Configuration | **Generator**: mcp-configurator
**Pre-resolved**: transport: http, server_name: slack, scope: user, auth_type: oauth
**Customize**: channel restrictions, message permissions, workspace selection
**Verify**: Run `/mcp` to confirm connection, then try reading a channel

---

### X04: notion
**Name**: Connect to Notion
**Triggers**: "connect Notion", "Notion integration", "read Notion pages", "Notion workspace"
**Type**: MCP Configuration | **Generator**: mcp-configurator
**Pre-resolved**: transport: http, server_name: notion, scope: user, auth_type: oauth
**Customize**: workspace selection, page/database access restrictions
**Verify**: Run `/mcp` to confirm connection, then try reading a Notion page

---

### X05: filesystem
**Name**: Connect to additional directories
**Triggers**: "access another folder", "add directory", "read from path", "more folders"
**Type**: Settings change (additionalDirectories) | **Generator**: settings-architect
**Pre-resolved**: setting: permissions.additionalDirectories, scope: .claude/settings.local.json
**Customize**: which directories to add, read-only vs read-write access
**Verify**: Try reading a file from the added directory to confirm access
