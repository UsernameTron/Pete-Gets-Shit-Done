#!/usr/bin/env bash
# ci-coverage-report.sh — Generate coverage summary for GitHub Actions job summary
# Reads c8 JSON output and produces markdown table
#
# Usage: scripts/ci-coverage-report.sh
# Requires: coverage/coverage-summary.json (from c8 --reporter json)
# Outputs: Markdown to $GITHUB_STEP_SUMMARY (or stdout if not in CI)
set -euo pipefail

COVERAGE_JSON="coverage/coverage-summary.json"
THRESHOLD=80

if [[ ! -f "$COVERAGE_JSON" ]]; then
  echo "WARNING: $COVERAGE_JSON not found. Skipping coverage report."
  exit 0
fi

# Use Node.js to parse JSON and generate markdown table
# (zero new dependencies — Node.js is already in CI)
REPORT=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$COVERAGE_JSON', 'utf8'));
const lines = [];
lines.push('## Coverage Report');
lines.push('');
lines.push('| Module | Lines | Branches |');
lines.push('|--------|-------|----------|');

const total = data.total;
const entries = Object.entries(data).filter(([k]) => k !== 'total').sort(([a],[b]) => a.localeCompare(b));

for (const [file, info] of entries) {
  const linePct = info.lines ? info.lines.pct : 0;
  const branchPct = info.branches ? info.branches.pct : 0;
  // Show short path
  const short = file.replace(process.cwd() + '/', '');
  lines.push('| ' + short + ' | ' + linePct + '% | ' + branchPct + '% |');
}

lines.push('');
lines.push('| **Total** | **' + total.lines.pct + '%** | **' + total.branches.pct + '%** |');
lines.push('');

if (total.lines.pct < $THRESHOLD) {
  lines.push('> **WARNING:** Overall line coverage (' + total.lines.pct + '%) is below ' + $THRESHOLD + '% threshold.');
  lines.push('');
}

console.log(lines.join('\n'));
")

# Output to GitHub Actions job summary or stdout
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "$REPORT" >> "$GITHUB_STEP_SUMMARY"
  echo "Coverage report written to job summary"
else
  echo "$REPORT"
fi

# Extract overall line coverage for exit message
OVERALL=$(node -e "
const data = JSON.parse(require('fs').readFileSync('$COVERAGE_JSON', 'utf8'));
console.log(data.total.lines.pct);
")

echo "Overall line coverage: ${OVERALL}%"

# Advisory only — never fail the build (D-12)
exit 0
