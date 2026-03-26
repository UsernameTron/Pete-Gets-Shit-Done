#!/bin/bash
# Integration test: end-to-end scaffold + verify simulation
# Runs scaffold-project.sh in a temp directory and validates the full result.

set -uo pipefail

GOVERNANCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GSD_ROOT="$(cd "$GOVERNANCE_DIR/.." && pwd)"
SCAFFOLD_SCRIPT="$GOVERNANCE_DIR/scripts/scaffold-project.sh"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

echo "=== Integration Test: End-to-End Scaffold ==="
echo ""

# --- Setup ---
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# ------------------------------------------------------------------
# 1. Run scaffold in temp directory
# ------------------------------------------------------------------
echo "--- Section 1: Scaffold Execution ---"
cd "$WORKDIR"
if bash "$SCAFFOLD_SCRIPT" > /dev/null 2>&1; then
  pass "scaffold-project.sh completed successfully"
else
  fail "scaffold-project.sh exited with error"
fi

# ------------------------------------------------------------------
# 2. Directory structure completeness
# ------------------------------------------------------------------
echo ""
echo "--- Section 2: Directory Structure ---"
EXPECTED_DIRS=(
  tasks
  .planning
  context
  state
  .claude/agents
  .claude/skills
  plans
  outputs
  decisions
  docs
)
for d in "${EXPECTED_DIRS[@]}"; do
  if [ -d "$WORKDIR/$d" ]; then
    pass "Directory: $d"
  else
    fail "Missing directory: $d"
  fi
done

# ------------------------------------------------------------------
# 3. Template files copied and non-empty
# ------------------------------------------------------------------
echo ""
echo "--- Section 3: Template Files ---"
EXPECTED_FILES=(
  CLAUDE.md
  README.md
  tasks/lessons.md
  docs/DEVOPS-HANDOFF.md
)
for f in "${EXPECTED_FILES[@]}"; do
  if [ -f "$WORKDIR/$f" ] && [ -s "$WORKDIR/$f" ]; then
    pass "File non-empty: $f"
  elif [ -f "$WORKDIR/$f" ]; then
    fail "File empty: $f"
  else
    fail "File missing: $f"
  fi
done

# ------------------------------------------------------------------
# 4. Git repository correctly initialized
# ------------------------------------------------------------------
echo ""
echo "--- Section 4: Git Initialization ---"
if [ -d "$WORKDIR/.git" ]; then
  pass "Git repository initialized"
else
  fail "Git repository not initialized"
fi

BRANCH=$(cd "$WORKDIR" && git branch --show-current 2>/dev/null || echo "")
if [ "$BRANCH" = "main" ]; then
  pass "Default branch is 'main'"
else
  fail "Default branch is '$BRANCH' (expected 'main')"
fi

# ------------------------------------------------------------------
# 5. Template content integrity — files match source templates
# ------------------------------------------------------------------
echo ""
echo "--- Section 5: Template Content Integrity ---"
TEMPLATE_MAP=(
  "CLAUDE.md:templates/project/CLAUDE.md"
  "README.md:templates/project/README.md"
  "tasks/lessons.md:templates/project/lessons.md"
  "docs/DEVOPS-HANDOFF.md:templates/project/DEVOPS-HANDOFF.md"
)
for mapping in "${TEMPLATE_MAP[@]}"; do
  dest="${mapping%%:*}"
  src="${mapping##*:}"
  if [ -f "$GOVERNANCE_DIR/$src" ] && [ -f "$WORKDIR/$dest" ]; then
    if diff -q "$GOVERNANCE_DIR/$src" "$WORKDIR/$dest" > /dev/null 2>&1; then
      pass "Content matches: $dest == $src"
    else
      fail "Content mismatch: $dest != $src"
    fi
  else
    fail "Cannot compare: $dest or $src not found"
  fi
done

# ------------------------------------------------------------------
# 6. No personal data leaked into scaffolded project
# ------------------------------------------------------------------
echo ""
echo "--- Section 6: Sanitization ---"
PATTERNS=(cpconnor cpeteconnor "sk-ant-" "sk-proj-" "ghp_" "hf_")
LEAKED=false
for pat in "${PATTERNS[@]}"; do
  if grep -rq "$pat" "$WORKDIR/" 2>/dev/null; then
    fail "Personal data found in scaffolded project: $pat"
    LEAKED=true
  fi
done
if [ "$LEAKED" = false ]; then
  pass "No personal data patterns in scaffolded project"
fi

# ------------------------------------------------------------------
# 7. Placeholder tokens present (templates should have them)
# ------------------------------------------------------------------
echo ""
echo "--- Section 7: Placeholder Tokens ---"
if grep -qF "[YOUR NAME]" "$WORKDIR/README.md"; then
  pass "README.md has [YOUR NAME] placeholder"
else
  fail "README.md missing [YOUR NAME] placeholder"
fi

if grep -qF "[YOUR NAME]" "$WORKDIR/docs/DEVOPS-HANDOFF.md"; then
  pass "DEVOPS-HANDOFF.md has [YOUR NAME] placeholder"
else
  fail "DEVOPS-HANDOFF.md missing [YOUR NAME] placeholder"
fi

# ------------------------------------------------------------------
# 8. Idempotency — running scaffold again should not fail
# ------------------------------------------------------------------
echo ""
echo "--- Section 8: Idempotency ---"
cd "$WORKDIR"
if bash "$SCAFFOLD_SCRIPT" > /dev/null 2>&1; then
  pass "scaffold-project.sh is idempotent (second run succeeds)"
else
  fail "scaffold-project.sh failed on second run"
fi

# Verify files still intact after second run
if [ -f "$WORKDIR/CLAUDE.md" ] && [ -s "$WORKDIR/CLAUDE.md" ]; then
  pass "CLAUDE.md still intact after second scaffold"
else
  fail "CLAUDE.md damaged after second scaffold"
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo ""
echo "=== Integration Test Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "RESULT: ALL INTEGRATION CHECKS PASSED"
  exit 0
else
  echo "RESULT: SOME INTEGRATION CHECKS FAILED"
  exit 1
fi
