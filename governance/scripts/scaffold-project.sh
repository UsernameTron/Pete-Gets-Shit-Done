#!/bin/bash
# Create standard Claude Code project structure in current directory

GOVERNANCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GSD_ROOT="$(cd "$GOVERNANCE_DIR/.." && pwd)"

echo "Scaffolding Claude Code project structure..."

# Create directories
mkdir -p tasks
mkdir -p context
mkdir -p state
mkdir -p .claude/agents
mkdir -p .claude/skills
mkdir -p plans
mkdir -p outputs
mkdir -p decisions
mkdir -p docs
mkdir -p .planning

# Copy project templates
cp "$GOVERNANCE_DIR/templates/project/CLAUDE.md" ./CLAUDE.md
cp "$GOVERNANCE_DIR/templates/project/README.md" ./README.md
[ -f "$GOVERNANCE_DIR/templates/project/.gitignore" ] && cp "$GOVERNANCE_DIR/templates/project/.gitignore" ./.gitignore
cp "$GOVERNANCE_DIR/templates/project/lessons.md" ./tasks/lessons.md
cp "$GOVERNANCE_DIR/templates/project/DEVOPS-HANDOFF.md" ./docs/DEVOPS-HANDOFF.md

# Copy decision template if available
if [ -f "$GSD_ROOT/plugins/claude-code-factory/decisions/_template.md" ]; then
  cp "$GSD_ROOT/plugins/claude-code-factory/decisions/_template.md" ./decisions/_template.md
fi

# Initialize git if not already
if [ ! -d .git ]; then
  git init && git branch -m main
  echo "  Git initialized on main branch"
fi

echo ""
echo "Project scaffolded. Open Claude Code and the SessionStart hook will detect everything."
echo "  Run: claude"
