#!/bin/bash
# Test script for scripts/scaffold-project.sh
# Verifies: directory creation, template file copying, git initialization

set -euo pipefail

GOVERNANCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GSD_ROOT="$(cd "$GOVERNANCE_DIR/.." && pwd)"
SCAFFOLD_SCRIPT="$GOVERNANCE_DIR/scripts/scaffold-project.sh"

PASS=0
FAIL=0
TOTAL=0

pass() {
  TOTAL=$((TOTAL + 1))
  PASS=$((PASS + 1))
  echo "  PASS: $1"
}

fail() {
  TOTAL=$((TOTAL + 1))
  FAIL=$((FAIL + 1))
  echo "  FAIL: $1"
}

check_dir() {
  if [ -d "$TMPDIR/$1" ]; then
    pass "Directory exists: $1"
  else
    fail "Directory missing: $1"
  fi
}

check_file() {
  if [ -f "$TMPDIR/$1" ]; then
    pass "File exists: $1"
  else
    fail "File missing: $1"
  fi
}

check_file_nonempty() {
  if [ -f "$TMPDIR/$1" ] && [ -s "$TMPDIR/$1" ]; then
    pass "File exists and non-empty: $1"
  elif [ -f "$TMPDIR/$1" ]; then
    fail "File exists but is empty: $1"
  else
    fail "File missing: $1"
  fi
}

# --- Setup ---
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "=== scaffold-project.sh Test Suite ==="
echo "Temp dir: $TMPDIR"
echo ""

# --- Run scaffold ---
echo "Running scaffold..."
cd "$TMPDIR"
if bash "$SCAFFOLD_SCRIPT" > /dev/null 2>&1; then
  pass "Script exited successfully"
else
  fail "Script exited with error (exit code $?)"
fi
echo ""

# --- Check directories (10 expected) ---
echo "Checking directories..."
check_dir "tasks"
check_dir "context"
check_dir "state"
check_dir ".claude/agents"
check_dir ".claude/skills"
check_dir "plans"
check_dir "outputs"
check_dir "decisions"
check_dir "docs"
check_dir ".planning"
echo ""

# --- Check template files (4 required + 1 optional) ---
echo "Checking template files..."
check_file_nonempty "CLAUDE.md"
check_file_nonempty "README.md"
check_file_nonempty "tasks/lessons.md"
check_file_nonempty "docs/DEVOPS-HANDOFF.md"

# Optional: .gitignore (only if template exists)
if [ -f "$GOVERNANCE_DIR/templates/project/.gitignore" ]; then
  check_file_nonempty ".gitignore"
  echo "  (.gitignore is optional — source exists, so it should be copied)"
else
  echo "  SKIP: .gitignore (source not present in governance/templates/project/ — optional)"
fi

# Optional: decisions template
if [ -f "$GSD_ROOT/plugins/claude-code-factory/decisions/_template.md" ]; then
  check_file_nonempty "decisions/_template.md"
  echo "  (decisions/_template.md is optional — source exists, so it should be copied)"
else
  echo "  SKIP: decisions/_template.md (source not present in plugins/ — optional)"
fi
echo ""

# --- Check git initialization ---
echo "Checking git..."
if [ -d "$TMPDIR/.git" ]; then
  pass "Git repository initialized"
else
  fail "Git repository not initialized"
fi

# Check branch name is main
BRANCH=$(cd "$TMPDIR" && git branch --show-current 2>/dev/null || echo "")
if [ "$BRANCH" = "main" ]; then
  pass "Default branch is 'main'"
else
  fail "Default branch is '$BRANCH' (expected 'main')"
fi
echo ""

# --- Summary ---
echo "=== Results ==="
echo "  Total: $TOTAL"
echo "  Pass:  $PASS"
echo "  Fail:  $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "ALL TESTS PASSED"
  exit 0
else
  echo "SOME TESTS FAILED"
  exit 1
fi
