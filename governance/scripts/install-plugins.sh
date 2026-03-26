#!/bin/bash
# Install official Claude Code plugins

OFFICIAL=(
  claude-code-setup
  claude-md-management
  hookify
  security-guidance
  pyright-lsp
  frontend-design
  code-review
  pr-review-toolkit
  commit-commands
  agent-sdk-dev
  explanatory-output-style
  ralph-loop
)

echo "Installing ${#OFFICIAL[@]} official plugins..."
for plugin in "${OFFICIAL[@]}"; do
  echo "  Installing $plugin..."
  claude plugin install "${plugin}@claude-plugins-official" 2>/dev/null || echo "    Warning: Could not install $plugin"
done

# Community plugins (optional)
echo ""
read -p "Install community plugins (eval-harness, verification-loop)? [y/N] " COMMUNITY
if [[ "$COMMUNITY" =~ ^[Yy]$ ]]; then
  for plugin in eval-harness verification-loop; do
    echo "  Installing $plugin..."
    claude plugin install "${plugin}@agentskill-sh" 2>/dev/null || echo "    Warning: Could not install $plugin"
  done
fi

# Optional integrations
echo ""
read -p "Install GitHub integration? [y/N] " GITHUB
[[ "$GITHUB" =~ ^[Yy]$ ]] && claude plugin install github@claude-plugins-official 2>/dev/null

read -p "Install Slack integration? [y/N] " SLACK
[[ "$SLACK" =~ ^[Yy]$ ]] && claude plugin install slack@claude-plugins-official 2>/dev/null

echo ""
echo "Plugin installation complete."
