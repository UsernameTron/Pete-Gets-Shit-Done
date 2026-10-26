const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pkg = require('../../package.json');
const { cyan, dim, reset, yellow } = require('./colors');
const { listCodexSkillNames } = require('./copy');

// ──────────────────────────────────────────────────────
// Local Patch Persistence
// ──────────────────────────────────────────────────────

const PATCHES_DIR_NAME = 'gsd-local-patches';
const MANIFEST_NAME = 'gsd-file-manifest.json';

/**
 * Compute SHA256 hash of file contents
 */
function fileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively collect all files in dir with their hashes
 */
function generateManifest(dir, baseDir) {
  if (!baseDir) baseDir = dir;
  const manifest = {};
  if (!fs.existsSync(dir)) return manifest;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      Object.assign(manifest, generateManifest(fullPath, baseDir));
    } else {
      manifest[relPath] = fileHash(fullPath);
    }
  }
  return manifest;
}

// Runtimes whose commands install as skills/gsd-*/ directories
const SKILL_RUNTIMES = new Set(['codex', 'copilot', 'antigravity', 'cursor', 'windsurf']);

/**
 * Add `prefix + rel` -> hash for every file under `dir` (recursive)
 */
function addTreeHashes(files, dir, prefix) {
  for (const [rel, hash] of Object.entries(generateManifest(dir))) {
    files[prefix + rel] = hash;
  }
}

/**
 * Add hashes for the gsd-*<ext> files directly inside `dir`
 */
function addGsdFileHashes(files, dir, prefix, ext) {
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith('gsd-') && file.endsWith(ext)) {
      files[prefix + file] = fileHash(path.join(dir, file));
    }
  }
}

/**
 * Add command hashes in the runtime's layout: skills/, flat command/, or nested commands/gsd/
 */
function addCommandHashes(files, configDir, runtime) {
  if (SKILL_RUNTIMES.has(runtime)) {
    const skillsDir = path.join(configDir, 'skills');
    if (!fs.existsSync(skillsDir)) return;
    for (const skillName of listCodexSkillNames(skillsDir)) {
      addTreeHashes(files, path.join(skillsDir, skillName), `skills/${skillName}/`);
    }
  } else if (runtime === 'opencode') {
    const commandDir = path.join(configDir, 'command');
    if (fs.existsSync(commandDir)) addGsdFileHashes(files, commandDir, 'command/', '.md');
  } else {
    const commandsDir = path.join(configDir, 'commands', 'gsd');
    if (fs.existsSync(commandsDir)) addTreeHashes(files, commandsDir, 'commands/gsd/');
  }
}

/**
 * Write file manifest after installation for future modification detection
 */
function writeManifest(configDir, runtime = 'claude') {
  const manifest = { version: pkg.version, timestamp: new Date().toISOString(), files: {} };
  addTreeHashes(manifest.files, path.join(configDir, 'get-shit-done'), 'get-shit-done/');
  addCommandHashes(manifest.files, configDir, runtime);
  const agentsDir = path.join(configDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    addGsdFileHashes(manifest.files, agentsDir, 'agents/', '.md');
  }
  // Track hook files so saveLocalPatches() can detect user modifications
  // Hooks are only installed for runtimes that use settings.json (not Codex/Copilot)
  const hooksDir = path.join(configDir, 'hooks');
  if (runtime !== 'codex' && runtime !== 'copilot' && fs.existsSync(hooksDir)) {
    addGsdFileHashes(manifest.files, hooksDir, 'hooks/', '.js');
  }

  fs.writeFileSync(path.join(configDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Detect user-modified GSD files by comparing against install manifest.
 * Backs up modified files to gsd-local-patches/ for reapply after update.
 */
function saveLocalPatches(configDir) {
  const manifestPath = path.join(configDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) return [];

  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return []; }

  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const modified = [];

  for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
    const fullPath = path.join(configDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const currentHash = fileHash(fullPath);
    if (currentHash !== originalHash) {
      const backupPath = path.join(patchesDir, relPath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);
      modified.push(relPath);
    }
  }

  if (modified.length > 0) {
    const meta = {
      backed_up_at: new Date().toISOString(),
      from_version: manifest.version,
      files: modified
    };
    fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify(meta, null, 2));
    console.log('  ' + yellow + 'i' + reset + '  Found ' + modified.length + ' locally modified GSD file(s) — backed up to ' + PATCHES_DIR_NAME + '/');
    for (const f of modified) {
      console.log('     ' + dim + f + reset);
    }
  }
  return modified;
}

/**
 * After install, report backed-up patches for user to reapply.
 */
function reportLocalPatches(configDir, runtime = 'claude') {
  const patchesDir = path.join(configDir, PATCHES_DIR_NAME);
  const metaPath = path.join(patchesDir, 'backup-meta.json');
  if (!fs.existsSync(metaPath)) return [];

  let meta;
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { return []; }

  if (meta.files && meta.files.length > 0) {
    const reapplyCommand = (runtime === 'opencode' || runtime === 'copilot')
      ? '/gsd-reapply-patches'
      : runtime === 'codex'
        ? '$gsd-reapply-patches'
        : runtime === 'cursor'
          ? 'gsd-reapply-patches (mention the skill name)'
          : '/gsd:reapply-patches';
    console.log('');
    console.log('  ' + yellow + 'Local patches detected' + reset + ' (from v' + meta.from_version + '):');
    for (const f of meta.files) {
      console.log('     ' + cyan + f + reset);
    }
    console.log('');
    console.log('  Your modifications are saved in ' + cyan + PATCHES_DIR_NAME + '/' + reset);
    console.log('  Run ' + cyan + reapplyCommand + reset + ' to merge them into the new version.');
    console.log('  Or manually compare and merge the files.');
    console.log('');
  }
  return meta.files || [];
}

module.exports = {
  MANIFEST_NAME,
  writeManifest,
  saveLocalPatches,
  reportLocalPatches,
};
