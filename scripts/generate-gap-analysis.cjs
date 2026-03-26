'use strict';

const fs = require('fs');
const path = require('path');

// --- Configuration ---

const COVERAGE_FILE = path.join('coverage', 'coverage-final.json');
const GAPS_OUTPUT = path.join('docs', 'coverage-gaps.md');
const BASELINE_OUTPUT = path.join('docs', 'coverage-baseline.md');

// Priority tier classification
const SECURITY_CRITICAL_PATTERNS = [
  'security.cjs',
  'prompt-injection',
  'base64-scan',
  'secret-scan',
  'gsd-prompt-guard'
];

const OPERATIONAL_PATTERNS = [
  'core.cjs',
  'commands.cjs',
  'state.cjs',
  'phase.cjs',
  'init.cjs',
  'verify.cjs',
  'gsd-tools.cjs',
  'install.js',
  'gsd-workflow-guard'
];

// Shell script inventory (hardcoded mapping per 02-RESEARCH.md Pattern 2)
const SHELL_SCRIPTS = [
  { script: 'governance/scripts/health-check.sh', testFile: 'governance/tests/test_health_check.sh' },
  { script: 'governance/scripts/install-plugins.sh', testFile: 'governance/tests/test_install_plugins.sh' },
  { script: 'governance/scripts/scaffold-project.sh', testFile: 'governance/tests/test_scaffold.sh' },
  { script: 'scripts/base64-scan.sh', testFile: null },
  { script: 'scripts/prompt-injection-scan.sh', testFile: 'tests/prompt-injection-scan.test.cjs' },
  { script: 'scripts/secret-scan.sh', testFile: 'tests/security-scan.test.cjs' }
];

// --- Helpers ---

function loadCoverage() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error(`Error: ${COVERAGE_FILE} not found. Run 'npm run test:coverage' first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
}

function calcCoverage(data) {
  const s = data.s;
  const b = data.b;
  const f = data.f;

  const totalStmts = Object.keys(s).length;
  const coveredStmts = Object.values(s).filter(v => v > 0).length;

  const branchPairs = Object.values(b).flat();
  const totalBranches = branchPairs.length;
  const coveredBranches = branchPairs.filter(v => v > 0).length;

  const totalFns = Object.keys(f).length;
  const coveredFns = Object.values(f).filter(v => v > 0).length;

  // Lines: derive from statementMap
  const lineSet = new Set();
  const coveredLineSet = new Set();
  if (data.statementMap) {
    for (const [id, loc] of Object.entries(data.statementMap)) {
      for (let line = loc.start.line; line <= loc.end.line; line++) {
        lineSet.add(line);
        if (s[id] > 0) coveredLineSet.add(line);
      }
    }
  }

  const totalLines = lineSet.size || totalStmts;
  const coveredLines = coveredLineSet.size || coveredStmts;

  return {
    lines: totalLines ? ((coveredLines / totalLines) * 100) : 0,
    branches: totalBranches ? ((coveredBranches / totalBranches) * 100) : 0,
    functions: totalFns ? ((coveredFns / totalFns) * 100) : 0,
    statements: totalStmts ? ((coveredStmts / totalStmts) * 100) : 0,
    raw: {
      totalLines, coveredLines,
      totalBranches, coveredBranches,
      totalFns, coveredFns,
      totalStmts, coveredStmts
    }
  };
}

function classifyTier(shortPath) {
  const lower = shortPath.toLowerCase();
  for (const pat of SECURITY_CRITICAL_PATTERNS) {
    if (lower.includes(pat.toLowerCase())) return 'Security-Critical';
  }
  for (const pat of OPERATIONAL_PATTERNS) {
    if (lower.includes(pat.toLowerCase())) return 'Operational';
  }
  return 'Utility';
}

function gapPriority(linePct) {
  if (linePct < 50) return 'HIGH';
  if (linePct <= 80) return 'MEDIUM';
  return 'LOW';
}

function pct(val) {
  return val.toFixed(2) + '%';
}

function shortName(filePath) {
  return filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
}

function moduleName(shortPath) {
  return shortPath.split('/').pop();
}

// --- Data Processing ---

function processModules(coverageData) {
  const modules = [];
  for (const [file, data] of Object.entries(coverageData)) {
    const short = shortName(file);
    const cov = calcCoverage(data);
    const tier = classifyTier(short);
    modules.push({ path: short, name: moduleName(short), tier, coverage: cov });
  }
  return modules;
}

function getShellScriptInventory() {
  return SHELL_SCRIPTS.map(entry => {
    const tested = entry.testFile && fs.existsSync(entry.testFile);
    if (entry.testFile && !tested) {
      console.warn(`Warning: Expected test file ${entry.testFile} not found for ${entry.script}`);
    }
    return {
      script: entry.script,
      testFile: entry.testFile,
      status: (entry.testFile && tested) ? 'TESTED' : 'UNTESTED'
    };
  });
}

// --- Gap Analysis Document ---

function generateGapAnalysis(modules, shellScripts) {
  const now = new Date().toISOString().split('T')[0];
  const tiers = ['Security-Critical', 'Operational', 'Utility'];

  let md = `# Coverage Gap Analysis\n\n`;
  md += `**Generated:** ${now}\n`;
  md += `**Source:** coverage/coverage-final.json from \`npm run test:coverage\`\n`;
  md += `**Total modules measured:** ${modules.length}\n\n`;
  md += `## Priority Ranking\n\n`;
  md += `Modules ranked by coverage gap severity within each tier.\n`;
  md += `Priority: Security-Critical > Operational > Utility.\n\n`;

  for (const tier of tiers) {
    const tierModules = modules
      .filter(m => m.tier === tier)
      .sort((a, b) => a.coverage.lines - b.coverage.lines);

    md += `### ${tier}\n\n`;
    md += `| Module | Lines | Branches | Functions | Gap Priority |\n`;
    md += `|--------|-------|----------|-----------|-------------|\n`;

    for (const m of tierModules) {
      md += `| ${m.name} | ${pct(m.coverage.lines)} | ${pct(m.coverage.branches)} | ${pct(m.coverage.functions)} | ${gapPriority(m.coverage.lines)} |\n`;
    }
    md += `\n`;
  }

  md += `## Shell Script Inventory\n\n`;
  md += `Per D-02: binary tested/untested status only. No line-coverage numbers for bash.\n\n`;
  md += `| Script | Test File | Status |\n`;
  md += `|--------|-----------|--------|\n`;

  for (const s of shellScripts) {
    const testDisplay = s.testFile || '(none)';
    md += `| ${s.script} | ${testDisplay} | ${s.status} |\n`;
  }
  md += `\n`;

  // Summary section
  const zeroCov = modules.filter(m => m.coverage.lines === 0).map(m => m.name);
  const below80 = modules.filter(m => m.coverage.lines < 80 && m.coverage.lines > 0).map(m => m.name);
  const secGaps = modules.filter(m => m.tier === 'Security-Critical' && m.coverage.lines < 95);

  md += `## Summary\n\n`;
  md += `- **Modules with 0% line coverage:** ${zeroCov.length > 0 ? zeroCov.join(', ') : 'None'}\n`;
  md += `- **Modules below 80% line coverage:** ${below80.length > 0 ? below80.join(', ') : 'None'}\n`;
  md += `- **Security-critical gaps:** ${secGaps.length} module(s) below 95% target`;
  if (secGaps.length > 0) {
    md += ` (${secGaps.map(m => m.name + ' at ' + pct(m.coverage.lines)).join(', ')})`;
  }
  md += `\n`;

  // Recommended priority order
  md += `- **Recommended Phase 3 priority order:**\n`;
  const priorityOrder = modules
    .filter(m => m.coverage.lines < 95)
    .sort((a, b) => {
      const tierOrder = { 'Security-Critical': 0, 'Operational': 1, 'Utility': 2 };
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      return a.coverage.lines - b.coverage.lines;
    });
  for (let i = 0; i < priorityOrder.length; i++) {
    md += `  ${i + 1}. ${priorityOrder[i].name} (${priorityOrder[i].tier}, ${pct(priorityOrder[i].coverage.lines)} lines)\n`;
  }
  md += `\n`;

  md += `## Baseline Reference\n\n`;
  md += `See [coverage-baseline.md](coverage-baseline.md) for the full per-module coverage snapshot.\n`;

  return md;
}

// --- Baseline Document ---

function generateBaseline(modules, shellScripts) {
  const now = new Date().toISOString().split('T')[0];
  const tiers = ['Security-Critical', 'Operational', 'Utility'];
  const tierOrder = { 'Security-Critical': 0, 'Operational': 1, 'Utility': 2 };

  let md = `# Coverage Baseline\n\n`;
  md += `**Captured:** ${now}\n`;
  md += `**Test count:** 1,547 passing\n`;
  md += `**Tool:** c8 v11.0.0 wrapping Node.js built-in test runner\n`;
  md += `**Scope:** All JavaScript/CJS source files (expanded from lib-only)\n\n`;

  md += `## Per-Module Coverage\n\n`;

  for (const tier of tiers) {
    const tierModules = modules
      .filter(m => m.tier === tier)
      .sort((a, b) => a.name.localeCompare(b.name));

    md += `### ${tier} Modules\n\n`;
    md += `| Module | Lines | Branches | Functions | Statements |\n`;
    md += `|--------|-------|----------|-----------|------------|\n`;

    for (const m of tierModules) {
      md += `| ${m.name} | ${pct(m.coverage.lines)} | ${pct(m.coverage.branches)} | ${pct(m.coverage.functions)} | ${pct(m.coverage.statements)} |\n`;
    }
    md += `\n`;
  }

  // Summary by Tier
  md += `## Summary by Tier\n\n`;
  md += `| Tier | Modules | Avg Lines | Avg Branches | Avg Functions |\n`;
  md += `|------|---------|-----------|-------------|---------------|\n`;

  let totalModules = 0;
  let totalLines = 0;
  let totalBranches = 0;
  let totalFunctions = 0;

  for (const tier of tiers) {
    const tierModules = modules.filter(m => m.tier === tier);
    const count = tierModules.length;
    const avgLines = tierModules.reduce((s, m) => s + m.coverage.lines, 0) / (count || 1);
    const avgBranches = tierModules.reduce((s, m) => s + m.coverage.branches, 0) / (count || 1);
    const avgFunctions = tierModules.reduce((s, m) => s + m.coverage.functions, 0) / (count || 1);

    md += `| ${tier} | ${count} | ${pct(avgLines)} | ${pct(avgBranches)} | ${pct(avgFunctions)} |\n`;

    totalModules += count;
    totalLines += tierModules.reduce((s, m) => s + m.coverage.lines, 0);
    totalBranches += tierModules.reduce((s, m) => s + m.coverage.branches, 0);
    totalFunctions += tierModules.reduce((s, m) => s + m.coverage.functions, 0);
  }

  const overallLines = totalLines / (totalModules || 1);
  const overallBranches = totalBranches / (totalModules || 1);
  const overallFunctions = totalFunctions / (totalModules || 1);

  md += `| **Overall** | **${totalModules}** | **${pct(overallLines)}** | **${pct(overallBranches)}** | **${pct(overallFunctions)}** |\n`;
  md += `\n`;

  // Shell Script Inventory
  md += `## Shell Script Inventory\n\n`;
  md += `| Script | Test File | Status |\n`;
  md += `|--------|-----------|--------|\n`;

  for (const s of shellScripts) {
    const testDisplay = s.testFile || '(none)';
    md += `| ${s.script} | ${testDisplay} | ${s.status} |\n`;
  }
  md += `\n`;

  // Comparison Notes
  md += `## Comparison Notes\n\n`;
  md += `This baseline was captured BEFORE Phase 3 (Unit Test Expansion). Compare against this file after Phase 3 to measure coverage improvement.\n\n`;
  md += `Previous lib-only baseline: 91.32% lines, 78.23% branches, 96.36% functions (17 modules)\n`;
  md += `Expanded baseline: ${pct(overallLines)} lines, ${pct(overallBranches)} branches, ${pct(overallFunctions)} functions (${totalModules} modules)\n`;

  return md;
}

// --- Main ---

function main() {
  const coverageData = loadCoverage();
  const modules = processModules(coverageData);
  const shellScripts = getShellScriptInventory();

  // Ensure docs/ directory exists
  if (!fs.existsSync('docs')) {
    fs.mkdirSync('docs', { recursive: true });
  }

  // Generate gap analysis
  const gapsMd = generateGapAnalysis(modules, shellScripts);
  fs.writeFileSync(GAPS_OUTPUT, gapsMd, 'utf8');
  console.log(`Generated: ${GAPS_OUTPUT} (${modules.length} modules classified)`);

  // Generate baseline
  const baselineMd = generateBaseline(modules, shellScripts);
  fs.writeFileSync(BASELINE_OUTPUT, baselineMd, 'utf8');
  console.log(`Generated: ${BASELINE_OUTPUT}`);

  // Summary
  const tiers = ['Security-Critical', 'Operational', 'Utility'];
  for (const tier of tiers) {
    const count = modules.filter(m => m.tier === tier).length;
    console.log(`  ${tier}: ${count} modules`);
  }
}

main();
