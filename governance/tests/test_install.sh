#!/bin/bash
#
# test_install.sh — Validates install.sh logic in isolation
#
# Creates a temp directory to simulate ~/.claude/, tests JSON merge logic,
# placeholder replacement, and edge cases. Reports PASS/FAIL for each check.
#

set -u

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "  PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

# --- Setup ---
TMPDIR_ROOT=$(mktemp -d)
FAKE_HOME="$TMPDIR_ROOT/home"
FAKE_CLAUDE="$FAKE_HOME/.claude"
GOVERNANCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GSD_ROOT="$(cd "$GOVERNANCE_DIR/.." && pwd)"

cleanup() {
  rm -rf "$TMPDIR_ROOT"
}
trap cleanup EXIT

echo "=== install.sh Validation Tests ==="
echo "Temp dir: $TMPDIR_ROOT"
echo ""

# ============================================================
# Section 1: File Path Verification
# ============================================================
echo "--- Section 1: Referenced File Paths ---"

check_gov_path() {
  if [ -e "$GOVERNANCE_DIR/$1" ]; then
    pass "exists: governance/$1"
  else
    fail "MISSING: governance/$1"
  fi
}

check_gsd_path() {
  if [ -e "$GSD_ROOT/$1" ]; then
    pass "exists: $1"
  else
    fail "MISSING: $1"
  fi
}

check_gov_path "templates/global/CLAUDE.md"
check_gov_path "templates/global/settings-hooks.json"
check_gov_path "templates/global/settings-permissions.json"
check_gov_path "scripts/install-plugins.sh"
check_gov_path "scripts/health-check.sh"

# Context files — should be exactly 6
CONTEXT_COUNT=$(ls "$GOVERNANCE_DIR/templates/context/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONTEXT_COUNT" -eq 6 ]; then
  pass "templates/context/ has exactly 6 .md files"
else
  fail "templates/context/ has $CONTEXT_COUNT .md files (expected 6)"
fi

for f in cli-reference.md skill-creation-guide.md mcp-setup-guide.md \
         subagent-guide.md hooks-guide.md settings-reference.md; do
  check_gov_path "templates/context/$f"
done

# Docs at GSD repo root
check_gsd_path "docs"

# plugins/ directory at GSD repo root
check_gsd_path "plugins"

echo ""

# ============================================================
# Section 2: Sanitization — no personal data in templates
# ============================================================
echo "--- Section 2: Sanitization Check ---"

# The global CLAUDE.md template is a governance framework with no
# user-specific placeholders. Verify it contains no personal data.
TEMPLATE="$GOVERNANCE_DIR/templates/global/CLAUDE.md"

check_no_personal_data() {
  if grep -qi "$1" "$TEMPLATE"; then
    fail "personal data found in global template: $1"
  else
    pass "no personal data: $1"
  fi
}

check_no_personal_data "cpconnor"
check_no_personal_data "cpeteconnor"
check_no_personal_data "sk-ant-"
check_no_personal_data "sk-proj-"
check_no_personal_data "ghp_"

# Verify project templates DO have the expected placeholders
PROJECT_README="$GOVERNANCE_DIR/templates/project/README.md"
if [ -f "$PROJECT_README" ]; then
  if grep -qF "[YOUR NAME]" "$PROJECT_README"; then
    pass "project README.md has [YOUR NAME] placeholder"
  else
    fail "project README.md missing [YOUR NAME] placeholder"
  fi
else
  fail "templates/project/README.md not found"
fi

PROJECT_HANDOFF="$GOVERNANCE_DIR/templates/project/DEVOPS-HANDOFF.md"
if [ -f "$PROJECT_HANDOFF" ]; then
  if grep -qF "[YOUR NAME]" "$PROJECT_HANDOFF"; then
    pass "project DEVOPS-HANDOFF.md has [YOUR NAME] placeholder"
  else
    fail "project DEVOPS-HANDOFF.md missing [YOUR NAME] placeholder"
  fi
else
  fail "templates/project/DEVOPS-HANDOFF.md not found"
fi

echo ""

# ============================================================
# Section 3: JSON Merge — Hooks (additive)
# ============================================================
echo "--- Section 3: JSON Merge — Hooks ---"

mkdir -p "$FAKE_CLAUDE"

# Test 3a: settings.json does not exist — create from scratch
SETTINGS="$FAKE_CLAUDE/settings-3a.json"
echo '{}' > "$SETTINGS"

HOOKS_SOURCE="$TMPDIR_ROOT/hooks-source.json"
cat > "$HOOKS_SOURCE" <<'ENDJSON'
{
  "hooks": {
    "PreToolUse": [
      {"matcher": "Bash", "hooks": [{"type": "command", "command": "echo test"}]}
    ]
  }
}
ENDJSON

python3 -c "
import json, sys

target_path = sys.argv[1]
source_path = sys.argv[2]
key = sys.argv[3]

with open(target_path) as f:
    settings = json.load(f)
with open(source_path) as f:
    new_data = json.load(f)

if key == 'hooks':
    existing = settings.get('hooks', {})
    for event, handlers in new_data.get('hooks', {}).items():
        if event in existing:
            existing[event].extend(handlers)
        else:
            existing[event] = handlers
    settings['hooks'] = existing

with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" "$HOOKS_SOURCE" hooks

if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    s = json.load(f)
assert 'hooks' in s
assert 'PreToolUse' in s['hooks']
assert len(s['hooks']['PreToolUse']) == 1
" "$SETTINGS" 2>/dev/null; then
  pass "hooks merge into empty settings.json"
else
  fail "hooks merge into empty settings.json"
fi

# Test 3b: Additive merge — existing hooks preserved
SETTINGS="$FAKE_CLAUDE/settings-3b.json"
cat > "$SETTINGS" <<'ENDJSON'
{
  "hooks": {
    "PreToolUse": [
      {"matcher": "Write", "hooks": [{"type": "command", "command": "echo existing"}]}
    ]
  }
}
ENDJSON

python3 -c "
import json, sys

target_path = sys.argv[1]
source_path = sys.argv[2]
key = sys.argv[3]

with open(target_path) as f:
    settings = json.load(f)
with open(source_path) as f:
    new_data = json.load(f)

if key == 'hooks':
    existing = settings.get('hooks', {})
    for event, handlers in new_data.get('hooks', {}).items():
        if event in existing:
            existing[event].extend(handlers)
        else:
            existing[event] = handlers
    settings['hooks'] = existing

with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" "$HOOKS_SOURCE" hooks

if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    s = json.load(f)
assert len(s['hooks']['PreToolUse']) == 2, f'Expected 2, got {len(s[\"hooks\"][\"PreToolUse\"])}'
" "$SETTINGS" 2>/dev/null; then
  pass "hooks merge is additive (preserves existing)"
else
  fail "hooks merge is additive (preserves existing)"
fi

echo ""

# ============================================================
# Section 4: JSON Merge — Permissions (deduplication)
# ============================================================
echo "--- Section 4: JSON Merge — Permissions ---"

# Test 4a: Into empty settings
SETTINGS="$FAKE_CLAUDE/settings-4a.json"
echo '{}' > "$SETTINGS"

PERMS_SOURCE="$TMPDIR_ROOT/perms-source.json"
cat > "$PERMS_SOURCE" <<'ENDJSON'
{
  "permissions": {
    "allow": ["Bash(git *)", "Read(*)"]
  }
}
ENDJSON

python3 -c "
import json, sys

target_path = sys.argv[1]
source_path = sys.argv[2]
key = sys.argv[3]

with open(target_path) as f:
    settings = json.load(f)
with open(source_path) as f:
    new_data = json.load(f)

if key == 'permissions':
    existing_allow = settings.get('permissions', {}).get('allow', [])
    new_allow = new_data.get('permissions', {}).get('allow', [])
    merged = list(dict.fromkeys(existing_allow + new_allow))
    settings.setdefault('permissions', {})['allow'] = merged

with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" "$PERMS_SOURCE" permissions

if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    s = json.load(f)
assert s['permissions']['allow'] == ['Bash(git *)', 'Read(*)']
" "$SETTINGS" 2>/dev/null; then
  pass "permissions merge into empty settings.json"
else
  fail "permissions merge into empty settings.json"
fi

# Test 4b: Deduplication
SETTINGS="$FAKE_CLAUDE/settings-4b.json"
cat > "$SETTINGS" <<'ENDJSON'
{
  "permissions": {
    "allow": ["Bash(git *)", "Write(*)"]
  }
}
ENDJSON

python3 -c "
import json, sys

target_path = sys.argv[1]
source_path = sys.argv[2]
key = sys.argv[3]

with open(target_path) as f:
    settings = json.load(f)
with open(source_path) as f:
    new_data = json.load(f)

if key == 'permissions':
    existing_allow = settings.get('permissions', {}).get('allow', [])
    new_allow = new_data.get('permissions', {}).get('allow', [])
    merged = list(dict.fromkeys(existing_allow + new_allow))
    settings.setdefault('permissions', {})['allow'] = merged

with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" "$PERMS_SOURCE" permissions

if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    s = json.load(f)
allow = s['permissions']['allow']
# Should have 3 unique: Bash(git *), Write(*), Read(*)
assert len(allow) == 3, f'Expected 3, got {len(allow)} — dedup failed'
assert allow.count('Bash(git *)') == 1, 'Bash(git *) duplicated'
" "$SETTINGS" 2>/dev/null; then
  pass "permissions merge deduplicates"
else
  fail "permissions merge deduplicates"
fi

# Test 4c: Existing non-permission keys are preserved
SETTINGS="$FAKE_CLAUDE/settings-4c.json"
cat > "$SETTINGS" <<'ENDJSON'
{
  "model": "opus",
  "permissions": {
    "allow": ["Write(*)"],
    "deny": ["Read(.env)"]
  }
}
ENDJSON

python3 -c "
import json, sys

target_path = sys.argv[1]
source_path = sys.argv[2]
key = sys.argv[3]

with open(target_path) as f:
    settings = json.load(f)
with open(source_path) as f:
    new_data = json.load(f)

if key == 'permissions':
    existing_allow = settings.get('permissions', {}).get('allow', [])
    new_allow = new_data.get('permissions', {}).get('allow', [])
    merged = list(dict.fromkeys(existing_allow + new_allow))
    settings.setdefault('permissions', {})['allow'] = merged

with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" "$PERMS_SOURCE" permissions

if python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    s = json.load(f)
assert s.get('model') == 'opus', 'model key was lost'
assert 'Read(.env)' in s.get('permissions', {}).get('deny', []), 'deny key was lost'
" "$SETTINGS" 2>/dev/null; then
  pass "permissions merge preserves other keys (model, deny)"
else
  fail "permissions merge preserves other keys (model, deny)"
fi

echo ""

# ============================================================
# Section 5: Placeholder Replacement with sed
# ============================================================
echo "--- Section 5: sed Placeholder Replacement ---"

MOCK_MD="$TMPDIR_ROOT/test-claude.md"
cat > "$MOCK_MD" <<'ENDMD'
Author: [YOUR NAME]
User: [YOUR USERNAME]
GitHub: [YOUR GITHUB USERNAME]
Email: [YOUR EMAIL]
Org: [YOUR ORG]
Portfolio: [YOUR PORTFOLIO URL]
Updated: [DATE]
ENDMD

USER_NAME="Test User"
GITHUB_USERNAME="testuser"
USER_EMAIL="test@example.com"
ORG_NAME="TestOrg"

# Use the same sed approach as install.sh
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_CMD=(sed -i '')
else
  SED_CMD=(sed -i)
fi

"${SED_CMD[@]}" \
  -e "s/\[YOUR NAME\]/$USER_NAME/g" \
  -e "s/\[YOUR USERNAME\]/$USER_NAME/g" \
  -e "s/\[YOUR GITHUB USERNAME\]/$GITHUB_USERNAME/g" \
  -e "s/\[YOUR EMAIL\]/$USER_EMAIL/g" \
  -e "s/\[YOUR ORG\]/$ORG_NAME/g" \
  -e "s/\[YOUR PORTFOLIO URL\]/github.com\/$GITHUB_USERNAME/g" \
  -e "s/\[DATE\]/$(date +%Y-%m-%d)/g" \
  "$MOCK_MD"

REMAINING=$(grep -c '\[YOUR' "$MOCK_MD" 2>/dev/null || true)
if [ "$REMAINING" -eq 0 ]; then
  pass "all [YOUR ...] placeholders replaced"
else
  fail "$REMAINING [YOUR ...] placeholders remain after sed"
fi

if grep -q '\[DATE\]' "$MOCK_MD" 2>/dev/null; then
  fail "[DATE] placeholder was not replaced"
else
  pass "[DATE] placeholder replaced"
fi

if grep -q "Test User" "$MOCK_MD"; then
  pass "USER_NAME correctly inserted"
else
  fail "USER_NAME not found in output"
fi

if grep -q "testuser" "$MOCK_MD"; then
  pass "GITHUB_USERNAME correctly inserted"
else
  fail "GITHUB_USERNAME not found in output"
fi

echo ""

# ============================================================
# Section 6: Edge Cases
# ============================================================
echo "--- Section 6: Edge Cases ---"

# Test 6a: mkdir -p handles missing ~/.claude/
NESTED="$TMPDIR_ROOT/deep/nested/path"
mkdir -p "$NESTED" 2>/dev/null
if [ -d "$NESTED" ]; then
  pass "mkdir -p creates nested directories"
else
  fail "mkdir -p failed for nested directories"
fi

# Test 6b: JSON merge with malformed (empty) settings.json
SETTINGS="$FAKE_CLAUDE/settings-6b.json"
echo '{}' > "$SETTINGS"

if python3 -c "
import json, sys
target_path = sys.argv[1]
with open(target_path) as f:
    settings = json.load(f)
settings.setdefault('env', {})
settings['env']['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'] = '1'
with open(target_path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" "$SETTINGS" 2>/dev/null; then
  pass "env merge into empty settings.json"
else
  fail "env merge into empty settings.json"
fi

# Test 6c: settings-hooks.json is valid JSON
if python3 -c "
import json
with open('$GOVERNANCE_DIR/templates/global/settings-hooks.json') as f:
    json.load(f)
" 2>/dev/null; then
  pass "settings-hooks.json is valid JSON"
else
  fail "settings-hooks.json is invalid JSON"
fi

# Test 6d: settings-permissions.json is valid JSON
if python3 -c "
import json
with open('$GOVERNANCE_DIR/templates/global/settings-permissions.json') as f:
    json.load(f)
" 2>/dev/null; then
  pass "settings-permissions.json is valid JSON"
else
  fail "settings-permissions.json is valid JSON"
fi

# Test 6e: Marketplace registration preserves existing settings
SETTINGS="$FAKE_CLAUDE/settings-6e.json"
cat > "$SETTINGS" <<'ENDJSON'
{
  "model": "sonnet",
  "hooks": {"Stop": []}
}
ENDJSON

python3 -c "
import json
with open('$SETTINGS') as f:
    settings = json.load(f)
settings.setdefault('extraKnownMarketplaces', {})
settings['extraKnownMarketplaces']['gsd-governance-local'] = {
    'source': {
        'source': 'directory',
        'path': '/tmp/gsd-governance'
    }
}
with open('$SETTINGS', 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')
" 2>/dev/null

if python3 -c "
import json
with open('$SETTINGS') as f:
    s = json.load(f)
assert s['model'] == 'sonnet', 'model lost'
assert 'Stop' in s['hooks'], 'hooks lost'
assert 'gsd-governance-local' in s.get('extraKnownMarketplaces', {}), 'marketplace not added'
" 2>/dev/null; then
  pass "marketplace registration preserves existing settings"
else
  fail "marketplace registration preserves existing settings"
fi

echo ""

# ============================================================
# Summary
# ============================================================
echo "==================================="
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "Results: $PASS_COUNT/$TOTAL passed, $FAIL_COUNT failed"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "SOME TESTS FAILED — review output above"
  exit 1
else
  echo "ALL TESTS PASSED"
  exit 0
fi
