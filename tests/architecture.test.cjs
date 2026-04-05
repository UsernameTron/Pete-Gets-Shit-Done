/**
 * Architecture Boundary Tests
 *
 * Enforces the layered module architecture documented in core.cjs.
 * Layers flow downward: Layer 3 → 2 → 1 → 0. Never upward.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const LIB_DIR = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib');

// Layer map — Layer 3 is dynamically computed from whatever is left
const LAYERS = {
  0: ['model-profiles.cjs', 'security.cjs', 'classify.cjs'],
  1: ['core.cjs'],
  2: ['frontmatter.cjs', 'config.cjs', 'state.cjs', 'history.cjs'],
};

/**
 * Extract all intra-project require() targets from a source file.
 * Handles both top-level and lazy (in-function) requires.
 * Returns an array of filenames like ['core.cjs', 'config.cjs'].
 */
function extractRequires(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const re = /require\(\s*['"]\.\/([^'"]+)['"]\s*\)/g;
  const deps = new Set();
  let m;
  while ((m = re.exec(src)) !== null) {
    deps.add(m[1]);
  }
  return [...deps];
}

/**
 * Build a map: filename → layer number.
 * Any .cjs file in lib/ not assigned to layers 0-2 is layer 3.
 */
function buildLayerMap() {
  const allFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.cjs'));
  const assigned = new Set([
    ...LAYERS[0],
    ...LAYERS[1],
    ...LAYERS[2],
  ]);
  const layer3 = allFiles.filter(f => !assigned.has(f));
  const map = {};
  for (const f of LAYERS[0]) map[f] = 0;
  for (const f of LAYERS[1]) map[f] = 1;
  for (const f of LAYERS[2]) map[f] = 2;
  for (const f of layer3) map[f] = 3;
  return map;
}

describe('Module Architecture', () => {
  const layerMap = buildLayerMap();

  test('core.cjs only requires model-profiles.cjs as intra-project dep', () => {
    const deps = extractRequires(path.join(LIB_DIR, 'core.cjs'));
    const intraProject = deps.filter(d => d.endsWith('.cjs'));
    assert.deepStrictEqual(
      intraProject,
      ['model-profiles.cjs'],
      `core.cjs should only require model-profiles.cjs but found: [${intraProject.join(', ')}]`
    );
  });

  test('no circular dependencies between any module pair', () => {
    const allFiles = Object.keys(layerMap);
    const violations = [];

    for (const fileA of allFiles) {
      const depsA = extractRequires(path.join(LIB_DIR, fileA));
      for (const depB of depsA) {
        if (!allFiles.includes(depB)) continue;
        const depsB = extractRequires(path.join(LIB_DIR, depB));
        if (depsB.includes(fileA)) {
          violations.push(`${fileA} ↔ ${depB}`);
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Circular dependencies found:\n  ${violations.join('\n  ')}`
    );
  });

  test('all lib modules are assigned to a layer', () => {
    const allFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.cjs'));
    const unmapped = allFiles.filter(f => layerMap[f] === undefined);
    assert.strictEqual(
      unmapped.length,
      0,
      `Modules not in any layer: [${unmapped.join(', ')}]`
    );
  });

  test('no upward imports (lower layer requiring higher layer)', () => {
    const violations = [];

    for (const [file, layer] of Object.entries(layerMap)) {
      const deps = extractRequires(path.join(LIB_DIR, file));
      for (const dep of deps) {
        const depLayer = layerMap[dep];
        if (depLayer === undefined) continue; // external or missing
        if (depLayer > layer) {
          violations.push(
            `${file} (layer ${layer}) requires ${dep} (layer ${depLayer})`
          );
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Upward imports found:\n  ${violations.join('\n  ')}`
    );
  });
});
