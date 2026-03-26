#!/bin/bash
# Dry-run validation of scripts/install-plugins.sh
# Verifies plugin names, local paths, and structure — never runs actual installs.

set -uo pipefail

GOVERNANCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GSD_ROOT="$(cd "$GOVERNANCE_DIR/.." && pwd)"
SCRIPT="$GOVERNANCE_DIR/scripts/install-plugins.sh"
PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

echo "=== install-plugins.sh validation ==="
echo ""

# ------------------------------------------------------------------
# 1. Script exists and is readable
# ------------------------------------------------------------------
echo "[Check] Script exists"
if [[ -f "$SCRIPT" ]]; then
  pass "scripts/install-plugins.sh exists"
else
  fail "scripts/install-plugins.sh not found"
  echo "Cannot continue without the script."
  exit 1
fi

# ------------------------------------------------------------------
# 2. Extract official plugin names from the OFFICIAL=( ... ) array
# ------------------------------------------------------------------
echo ""
echo "[Check] Official plugin names"

# Extract lines between OFFICIAL=( and the closing )
EXTRACTED_OFFICIAL=()
in_array=false
while IFS= read -r line; do
  if [[ "$line" =~ ^OFFICIAL=\( ]]; then
    in_array=true
    continue
  fi
  if $in_array; then
    if [[ "$line" =~ ^\) ]]; then
      break
    fi
    # Strip leading whitespace and comments
    name="$(echo "$line" | sed 's/#.*//' | xargs)"
    [[ -n "$name" ]] && EXTRACTED_OFFICIAL+=("$name")
  fi
done < "$SCRIPT"

EXPECTED_OFFICIAL=(
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

# 2a. Verify count
if [[ ${#EXTRACTED_OFFICIAL[@]} -eq ${#EXPECTED_OFFICIAL[@]} ]]; then
  pass "Official plugin count is ${#EXTRACTED_OFFICIAL[@]} (expected ${#EXPECTED_OFFICIAL[@]})"
else
  fail "Official plugin count is ${#EXTRACTED_OFFICIAL[@]} (expected ${#EXPECTED_OFFICIAL[@]})"
fi

# 2b. Every extracted name must be in the expected list
for name in "${EXTRACTED_OFFICIAL[@]}"; do
  found=false
  for exp in "${EXPECTED_OFFICIAL[@]}"; do
    [[ "$name" == "$exp" ]] && found=true && break
  done
  if $found; then
    pass "Official plugin '$name' is in expected list"
  else
    fail "Official plugin '$name' is NOT in expected list"
  fi
done

# 2c. Every expected name must appear in the extracted list
for exp in "${EXPECTED_OFFICIAL[@]}"; do
  found=false
  for name in "${EXTRACTED_OFFICIAL[@]}"; do
    [[ "$name" == "$exp" ]] && found=true && break
  done
  if $found; then
    pass "Expected plugin '$exp' found in script"
  else
    fail "Expected plugin '$exp' MISSING from script"
  fi
done

# ------------------------------------------------------------------
# 3. Community / optional plugins referenced in the script
# ------------------------------------------------------------------
echo ""
echo "[Check] Community plugins"

EXPECTED_COMMUNITY=(eval-harness verification-loop)
for cp in "${EXPECTED_COMMUNITY[@]}"; do
  if grep -q "$cp" "$SCRIPT"; then
    pass "Community plugin '$cp' referenced in script"
  else
    fail "Community plugin '$cp' NOT referenced in script"
  fi
done

# ------------------------------------------------------------------
# 4. Local custom plugin engines
# ------------------------------------------------------------------
echo ""
echo "[Check] Local custom plugin engine directories"

LOCAL_PLUGINS=(
  plugins/claude-mcp-ecosystem
  plugins/claude-code-factory
)

for lp in "${LOCAL_PLUGINS[@]}"; do
  full="$GSD_ROOT/$lp"
  if [[ -d "$full" ]]; then
    pass "Local plugin directory '$lp' exists"
  else
    fail "Local plugin directory '$lp' MISSING"
  fi
done

# 4b. Verify local plugins have essential structure (skills/ or commands/)
echo ""
echo "[Check] Local plugin engines have skill or command directories"
for lp in "${LOCAL_PLUGINS[@]}"; do
  full="$GSD_ROOT/$lp"
  if [[ -d "$full/skills" ]] || [[ -d "$full/commands" ]]; then
    pass "Local plugin '$lp' has skills/ or commands/"
  else
    fail "Local plugin '$lp' MISSING skills/ and commands/"
  fi
done

# ------------------------------------------------------------------
# 5. Error handling
# ------------------------------------------------------------------
echo ""
echo "[Check] Error handling"

# Each official install should have || fallback
if grep -q '|| echo' "$SCRIPT"; then
  pass "Script has fallback warning on install failure"
else
  fail "Script lacks fallback handling on install failure"
fi

# Check that stderr is suppressed (2>/dev/null) to avoid noisy failures
if grep -q '2>/dev/null' "$SCRIPT"; then
  pass "Script suppresses stderr on install commands"
else
  fail "Script does not suppress stderr on install commands"
fi

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo ""
echo "=== Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "RESULT: SOME CHECKS FAILED"
  exit 1
else
  echo "RESULT: ALL CHECKS PASSED"
  exit 0
fi
