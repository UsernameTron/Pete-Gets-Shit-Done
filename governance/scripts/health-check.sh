#!/bin/bash
# Validate Claude Code governance installation

PASS=0
FAIL=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo "  ✅ $1"
    ((PASS++))
  else
    echo "  ❌ $1"
    ((FAIL++))
  fi
}

echo "Claude Code Governance Health Check"
echo "==================================="
echo ""

check "Claude Code installed" "which claude"
check "Python3 available" "which python3"
check "Git available" "which git"
check "Global CLAUDE.md exists" "[ -f ~/.claude/CLAUDE.md ]"
check "settings.json exists" "[ -f ~/.claude/settings.json ]"
check "Hooks configured" "python3 -c \"import json; d=json.load(open('$HOME/.claude/settings.json')); assert 'hooks' in d\""
check "Permissions configured" "python3 -c \"import json; d=json.load(open('$HOME/.claude/settings.json')); assert 'permissions' in d\""
check "Agent teams env var set" "python3 -c \"import json; d=json.load(open('$HOME/.claude/settings.json')); assert d.get('env',{}).get('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS') == '1'\""
check "GSD installed" "[ -d ~/.claude/skills ] || command -v npx > /dev/null"
check "Autocompact env var set" "grep -q CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ~/.zshrc 2>/dev/null || grep -q CLAUDE_AUTOCOMPACT_PCT_OVERRIDE ~/.bashrc 2>/dev/null"
check "Context files exist" "[ -f ~/.claude/context/cli-reference.md ]"
check "Context files complete (6)" "[ \$(ls ~/.claude/context/*.md 2>/dev/null | wc -l | tr -d ' ') -ge 6 ]"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "All checks passed!" || echo "Fix the failures above, then re-run."
