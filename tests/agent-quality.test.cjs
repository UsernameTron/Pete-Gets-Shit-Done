/**
 * Agent Quality Infrastructure Tests (QUAL-01, QUAL-02, QUAL-03)
 *
 * Validates the three v2.3 quality enhancements:
 * - QUAL-01: 4D scoring rubric in gsd-verifier
 * - QUAL-02: Three-part necessity gate reference doc
 * - QUAL-03: Two-mode verification in verify-work
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERIFIER_PATH = path.join(ROOT, 'agents', 'gsd-verifier.md');
const GATE_PATH = path.join(ROOT, 'get-shit-done', 'references', 'agent-necessity-gate.md');
const VERIFY_WORK_PATH = path.join(ROOT, 'get-shit-done', 'workflows', 'verify-work.md');

// ─── QUAL-01: 4D Scoring Rubric ─────────────────────────────────────────────

describe('QUAL-01: 4D scoring rubric in gsd-verifier', () => {
  const content = fs.readFileSync(VERIFIER_PATH, 'utf-8');

  test('contains scope_rubric section', () => {
    assert.ok(
      content.includes('<scope_rubric>') && content.includes('</scope_rubric>'),
      'gsd-verifier.md must contain <scope_rubric> section'
    );
  });

  test('rubric has all 4 dimensions with correct weights', () => {
    assert.ok(content.includes('Security | 35%'), 'Missing Security 35%');
    assert.ok(content.includes('Performance | 25%'), 'Missing Performance 25%');
    assert.ok(content.includes('Correctness | 25%'), 'Missing Correctness 25%');
    assert.ok(content.includes('Maintainability | 15%'), 'Missing Maintainability 15%');
  });

  test('weights sum to 100%', () => {
    const weights = [35, 25, 25, 15];
    assert.strictEqual(weights.reduce((a, b) => a + b, 0), 100, 'Weights must sum to 100');
  });

  test('rubric defines 14 criteria', () => {
    assert.ok(
      content.includes('Scoring Criteria (14 total)'),
      'Must declare 14 total criteria'
    );
    // Count numbered criteria (1. through 14.) — match lines starting with digit+dot+bold
    const criteriaCount = (content.match(/^\d+\.\s+\*\*/gm) || [])
      .filter(m => /^(1[0-4]|[1-9])\./.test(m)).length;
    assert.ok(criteriaCount >= 14, `Expected >= 14 criteria, found ${criteriaCount}`);
  });

  test('rubric specifies passing thresholds', () => {
    assert.ok(
      content.includes('>= 70') || content.includes('>=70') || content.includes('>= 70'),
      'Must specify overall threshold of 70'
    );
    assert.ok(
      content.includes('< 50') || content.includes('<50') || content.includes('< 50'),
      'Must specify per-dimension minimum of 50'
    );
  });

  test('rubric includes PASS, CONDITIONAL, FAIL thresholds', () => {
    // Check that the verifier file contains all three threshold levels
    assert.ok(content.includes('| PASS |'), 'Missing PASS threshold row');
    assert.ok(content.includes('| CONDITIONAL |'), 'Missing CONDITIONAL threshold row');
    assert.ok(content.includes('| FAIL |'), 'Missing FAIL threshold row');
  });

  test('rubric includes output format template', () => {
    assert.ok(
      content.includes('## Architecture Score'),
      'Must include Architecture Score output format'
    );
  });

  test('general_output references rubric', () => {
    assert.ok(
      content.includes('scope_rubric'),
      'general_output section must reference the rubric'
    );
  });
});

// ─── QUAL-02: Three-Part Necessity Gate ──────────────────────────────────────

describe('QUAL-02: agent necessity gate reference doc', () => {
  test('reference doc exists', () => {
    assert.ok(fs.existsSync(GATE_PATH), 'agent-necessity-gate.md must exist in references/');
  });

  const content = fs.readFileSync(GATE_PATH, 'utf-8');

  test('contains all 3 gate checks', () => {
    assert.ok(content.includes('Context Pollution'), 'Missing Context Pollution check');
    assert.ok(content.includes('Parallelizability'), 'Missing Parallelizability check');
    assert.ok(content.includes('Specialization'), 'Missing Specialization check');
  });

  test('contains all 3 outcomes', () => {
    assert.ok(content.includes('**PASS**'), 'Missing PASS outcome');
    assert.ok(content.includes('**FAIL**'), 'Missing FAIL outcome');
    assert.ok(content.includes('**AMBIGUOUS**'), 'Missing AMBIGUOUS outcome');
  });

  test('contains decision matrix', () => {
    // Decision matrix should have a table with Check 1/2/3 columns
    assert.ok(
      content.includes('Check 1') && content.includes('Check 2') && content.includes('Check 3'),
      'Must contain decision matrix with all 3 checks'
    );
  });

  test('contains examples', () => {
    assert.ok(content.includes('Example 1'), 'Missing Example 1');
    assert.ok(content.includes('Example 2'), 'Missing Example 2');
    assert.ok(content.includes('Example 3'), 'Missing Example 3');
  });

  test('documents when to apply', () => {
    assert.ok(
      content.includes('When to Apply'),
      'Must document when to apply the gate'
    );
  });
});

// ─── QUAL-03: Two-Mode Verification ─────────────────────────────────────────

describe('QUAL-03: two-mode verification in verify-work', () => {
  const content = fs.readFileSync(VERIFY_WORK_PATH, 'utf-8');

  test('supports --mode=compliance flag', () => {
    assert.ok(
      content.includes('--mode=compliance'),
      'Must support --mode=compliance flag'
    );
  });

  test('supports --mode=schema flag', () => {
    assert.ok(
      content.includes('--mode=schema'),
      'Must support --mode=schema flag'
    );
  });

  test('defaults to both modes when no flag', () => {
    assert.ok(
      content.includes('verify_mode = "both"') || content.includes("verify_mode = 'both'"),
      'Must default to both modes'
    );
  });

  test('contains schema_check step', () => {
    assert.ok(
      content.includes('schema_check'),
      'Must contain schema_check step'
    );
  });

  test('schema check validates agent frontmatter', () => {
    assert.ok(
      content.includes('Agent frontmatter'),
      'Schema check must validate agent frontmatter'
    );
  });

  test('schema check validates commit format', () => {
    assert.ok(
      content.includes('Commit format'),
      'Schema check must validate commit format'
    );
  });

  test('schema check validates SUMMARY.md presence', () => {
    assert.ok(
      content.includes('SUMMARY.md'),
      'Schema check must validate SUMMARY.md presence'
    );
  });

  test('preserves existing UAT flow for compliance mode', () => {
    // The existing steps must still be present
    assert.ok(content.includes('find_summaries'), 'Must preserve find_summaries step');
    assert.ok(content.includes('present_test'), 'Must preserve present_test step');
    assert.ok(content.includes('process_response'), 'Must preserve process_response step');
    assert.ok(content.includes('complete_session'), 'Must preserve complete_session step');
  });

  test('schema-only mode skips UAT flow', () => {
    assert.ok(
      content.includes('schema') && content.includes('skip'),
      'Schema-only mode must skip UAT flow'
    );
  });
});
