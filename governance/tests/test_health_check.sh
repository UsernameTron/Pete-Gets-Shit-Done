#!/bin/bash
# Tests for scripts/health-check.sh
#
# Strategy: The health-check script hardcodes ~/.claude and $HOME paths, so we
# can't redirect it with a simple flag. Instead, we extract the individual check
# logic into testable units, running each check against a controlled mock
# environment by overriding HOME to a temp directory.
#
# We create a wrapper that sources the check() function from health-check.sh
# but operates against a fake HOME.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GOVERNANCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HEALTH_CHECK="$GOVERNANCE_DIR/scripts/health-check.sh"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Colors (if terminal supports them)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

report() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo -e "  ${GREEN}PASS${NC} $label (expected=$expected, got=$actual)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "  ${RED}FAIL${NC} $label (expected=$expected, got=$actual)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# --------------------------------------------------------------------------
# Helper: run health-check.sh with a fake HOME, capture output, return
# the pass/fail count.
# --------------------------------------------------------------------------
run_health_check() {
  local fake_home="$1"
  # Run health-check.sh with overridden HOME.
  # We also override PATH to ensure 'which claude' fails in the empty env test
  # unless we explicitly place a mock binary.
  local output
  output=$(HOME="$fake_home" bash "$HEALTH_CHECK" 2>/dev/null) || true
  echo "$output"
}

count_passes() {
  # Count lines containing the pass marker (checkmark)
  echo "$1" | grep -c '✅' || echo 0
}

count_failures() {
  # Count lines containing the fail marker (cross)
  echo "$1" | grep -c '❌' || echo 0
}

check_line_status() {
  # Returns "pass" or "fail" for a specific check label in the output
  local output="$1"
  local label="$2"
  if echo "$output" | grep -q "✅ $label"; then
    echo "pass"
  elif echo "$output" | grep -q "❌ $label"; then
    echo "fail"
  else
    echo "missing"
  fi
}

# ==========================================================================
# TEST 1: Empty environment — most checks should FAIL
# ==========================================================================
echo ""
echo "======================================"
echo "TEST 1: Empty environment (nothing installed)"
echo "======================================"
echo ""

TMPDIR_1=$(mktemp -d)
trap "rm -rf '$TMPDIR_1'" EXIT

# Create empty fake home — no .claude directory, no .zshrc, no .bashrc
FAKE_HOME_1="$TMPDIR_1/fakehome"
mkdir -p "$FAKE_HOME_1"

OUTPUT_1=$(run_health_check "$FAKE_HOME_1")

# 'which' checks (claude, python3, git) depend on the real system PATH, not HOME.
# On the test machine, python3 and git are likely installed, claude may or may not be.
# So we skip asserting on which-based checks and focus on the HOME-dependent checks.

report "Global CLAUDE.md should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Global CLAUDE.md exists")"
report "settings.json should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "settings.json exists")"
report "Hooks configured should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Hooks configured")"
report "Permissions configured should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Permissions configured")"
report "Agent teams env var should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Agent teams env var set")"
report "Autocompact env var should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Autocompact env var set")"
report "Context files exist should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Context files exist")"
report "Context files complete should FAIL" "fail" "$(check_line_status "$OUTPUT_1" "Context files complete (6)")"

# Verify the output contains "Fix the failures" message (not "All checks passed")
if echo "$OUTPUT_1" | grep -q "Fix the failures"; then
  report "Output says 'Fix the failures'" "yes" "yes"
else
  report "Output says 'Fix the failures'" "yes" "no"
fi

# ==========================================================================
# TEST 2: Fully installed environment — HOME-dependent checks should PASS
# ==========================================================================
echo ""
echo "======================================"
echo "TEST 2: Fully installed environment"
echo "======================================"
echo ""

TMPDIR_2=$(mktemp -d)
# Update trap to clean both
trap "rm -rf '$TMPDIR_1' '$TMPDIR_2'" EXIT

FAKE_HOME_2="$TMPDIR_2/fakehome"
mkdir -p "$FAKE_HOME_2/.claude/context"

# Create CLAUDE.md
cat > "$FAKE_HOME_2/.claude/CLAUDE.md" << 'MDEOF'
# Global Claude Code Configuration
Placeholder content.
MDEOF

# Create settings.json with hooks, permissions, and agent teams env var
cat > "$FAKE_HOME_2/.claude/settings.json" << 'JSONEOF'
{
  "hooks": {
    "PostToolUse": []
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
JSONEOF

# Create .zshrc with autocompact env var
echo 'export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50' > "$FAKE_HOME_2/.zshrc"

# Create 6 context files
for f in cli-reference hooks-guide mcp-setup-guide settings-reference skill-creation-guide subagent-guide; do
  echo "# $f" > "$FAKE_HOME_2/.claude/context/${f}.md"
done

OUTPUT_2=$(run_health_check "$FAKE_HOME_2")

report "Global CLAUDE.md should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Global CLAUDE.md exists")"
report "settings.json should PASS" "pass" "$(check_line_status "$OUTPUT_2" "settings.json exists")"
report "Hooks configured should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Hooks configured")"
report "Permissions configured should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Permissions configured")"
report "Agent teams env var should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Agent teams env var set")"
report "Autocompact env var should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Autocompact env var set")"
report "Context files exist should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Context files exist")"
report "Context files complete should PASS" "pass" "$(check_line_status "$OUTPUT_2" "Context files complete (6)")"

# ==========================================================================
# TEST 3: Partial install — settings exists but missing keys
# ==========================================================================
echo ""
echo "======================================"
echo "TEST 3: Partial install (settings without hooks/permissions)"
echo "======================================"
echo ""

TMPDIR_3=$(mktemp -d)
trap "rm -rf '$TMPDIR_1' '$TMPDIR_2' '$TMPDIR_3'" EXIT

FAKE_HOME_3="$TMPDIR_3/fakehome"
mkdir -p "$FAKE_HOME_3/.claude/context"

cat > "$FAKE_HOME_3/.claude/CLAUDE.md" << 'MDEOF'
# Minimal CLAUDE.md
MDEOF

# settings.json exists but is missing hooks, permissions, and env
cat > "$FAKE_HOME_3/.claude/settings.json" << 'JSONEOF'
{
  "model": "claude-sonnet-4-5-20250929"
}
JSONEOF

# Only 3 context files (not the required 6)
for f in cli-reference hooks-guide mcp-setup-guide; do
  echo "# $f" > "$FAKE_HOME_3/.claude/context/${f}.md"
done

OUTPUT_3=$(run_health_check "$FAKE_HOME_3")

report "Global CLAUDE.md should PASS" "pass" "$(check_line_status "$OUTPUT_3" "Global CLAUDE.md exists")"
report "settings.json should PASS" "pass" "$(check_line_status "$OUTPUT_3" "settings.json exists")"
report "Hooks configured should FAIL" "fail" "$(check_line_status "$OUTPUT_3" "Hooks configured")"
report "Permissions configured should FAIL" "fail" "$(check_line_status "$OUTPUT_3" "Permissions configured")"
report "Agent teams env var should FAIL" "fail" "$(check_line_status "$OUTPUT_3" "Agent teams env var set")"
report "Autocompact env var should FAIL" "fail" "$(check_line_status "$OUTPUT_3" "Autocompact env var set")"
report "Context files exist should PASS" "pass" "$(check_line_status "$OUTPUT_3" "Context files exist")"
report "Context files complete should FAIL" "fail" "$(check_line_status "$OUTPUT_3" "Context files complete (6)")"

# ==========================================================================
# SUMMARY
# ==========================================================================
echo ""
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo "All tests passed!"
  exit 0
else
  echo "Some tests failed. Review output above."
  exit 1
fi
