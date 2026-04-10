#!/bin/bash
# gsd-agent-health-check.sh — SubagentStop hook for Pete-Gets-Shit-Done
# Runs automatically after every subagent completes.
# Catches: corrupted agent frontmatter, install drift between repo and ~/.claude/agents/.
# Logs findings to .planning/agent-health.log. Always exits 0 — hooks must not block.

set -u

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
AGENTS_DIR="$PROJECT_ROOT/agents"
INSTALLED_AGENTS_DIR="$HOME/.claude/agents"
LOG_DIR="$PROJECT_ROOT/.planning"
LOG_FILE="$LOG_DIR/agent-health.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
MAX_LOG_LINES=300

mkdir -p "$LOG_DIR"
if [ ! -f "$LOG_FILE" ]; then
  echo "# GSD Agent Health Log" > "$LOG_FILE"
  echo "# Written by scripts/gsd-agent-health-check.sh (SubagentStop hook)" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
fi

# Skip silently if not in a GSD repo context (no agents/ directory at project root)
[ -d "$AGENTS_DIR" ] || exit 0

# Check 1: Frontmatter delimiter integrity on repo source of truth
for agent_file in "$AGENTS_DIR"/*.md; do
  [ -f "$agent_file" ] || continue
  filename=$(basename "$agent_file")

  first_line=$(head -1 "$agent_file")
  if [ "$first_line" != "---" ]; then
    echo "- $TIMESTAMP FRONTMATTER: $filename missing opening delimiter" >> "$LOG_FILE"
    continue
  fi

  closing_count=$(grep -c "^---$" "$agent_file")
  if [ "$closing_count" -lt 2 ]; then
    echo "- $TIMESTAMP FRONTMATTER: $filename missing closing delimiter" >> "$LOG_FILE"
  fi
done

# Check 2: Install drift between repo ./agents/ and ~/.claude/agents/
# This is the check that would have caught today's gsd-verifier and
# gsd-research-orchestrator stale-install bugs in real time.
if [ -d "$INSTALLED_AGENTS_DIR" ]; then
  for agent_file in "$AGENTS_DIR"/*.md; do
    [ -f "$agent_file" ] || continue
    filename=$(basename "$agent_file")
    installed_file="$INSTALLED_AGENTS_DIR/$filename"

    if [ -f "$installed_file" ] && ! diff -q "$agent_file" "$installed_file" >/dev/null 2>&1; then
      diff_lines=$(diff "$agent_file" "$installed_file" | wc -l | tr -d ' ')
      echo "- $TIMESTAMP DRIFT: $filename differs between repo and installed (~$diff_lines diff lines)" >> "$LOG_FILE"
    fi
  done
fi

# Check 3: Self-truncate log if it exceeds the limit
log_lines=$(wc -l < "$LOG_FILE" | tr -d ' ')
if [ "$log_lines" -gt "$MAX_LOG_LINES" ]; then
  head -3 "$LOG_FILE" > "${LOG_FILE}.tmp"
  tail -150 "$LOG_FILE" >> "${LOG_FILE}.tmp"
  mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

exit 0
