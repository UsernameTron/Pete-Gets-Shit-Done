const fs = require('fs');
const path = require('path');
const { cyan, dim, green, reset, yellow } = require('./colors');
const { isHookRegistered, readSettings, validateHookFields, writeSettings } = require('./settings');

/**
 * Validate that gsd- prefix agents in target dir are GSD-owned.
 * Warns on collision — does not block (consumer may have legitimate overrides).
 * Part of the type-name governance contract: gsd- prefix is reserved for core routing.
 */
function validateGsdPrefixAgents(targetAgentsDir, sourceAgentsDir) {
  if (!fs.existsSync(targetAgentsDir) || !fs.existsSync(sourceAgentsDir)) return;
  const sourceAgents = new Set(
    fs.readdirSync(sourceAgentsDir)
      .filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  );
  const targetAgents = fs.readdirSync(targetAgentsDir)
    .filter(f => f.startsWith('gsd-') && f.endsWith('.md'));

  for (const agent of targetAgents) {
    if (!sourceAgents.has(agent)) {
      console.log(`  ${yellow}\u26a0  Prefix collision: ${agent} uses gsd- prefix but is not a GSD core agent${reset}`);
      console.log(`  ${yellow}     gsd- prefix is reserved for core routing. Rename to avoid conflicts.${reset}`);
    }
  }
}

/**
 * Merge governance hooks/permissions JSON into existing settings.json.
 * Additive only — never overwrites existing hooks or permissions.
 * Idempotent: running twice produces the same result (write-once contract).
 */
function mergeGovernanceJson(settingsPath, governanceJsonPath, label) {
  if (!fs.existsSync(governanceJsonPath)) return false;

  const governance = JSON.parse(fs.readFileSync(governanceJsonPath, 'utf8'));
  const settings = readSettings(settingsPath);
  let changed = false;

  // Merge hooks — add new event arrays, append to existing
  if (governance.hooks) {
    if (!settings.hooks) settings.hooks = {};
    for (const [event, entries] of Object.entries(governance.hooks)) {
      if (!settings.hooks[event]) {
        settings.hooks[event] = entries;
        changed = true;
      } else {
        // Write-once registration: skip if exact command already exists
        for (const entry of entries) {
          const commands = (entry.hooks || []).map(h => h.command || '').filter(Boolean);
          const isDuplicate = commands.length > 0 && commands.every(cmd =>
            isHookRegistered(settings, event, cmd)
          );
          if (isDuplicate) {
            const hookName = commands[0] ? path.basename(commands[0].replace(/"/g, '')) : 'unknown';
            console.log(`  ${yellow}⚠${reset}  Hook already registered for ${event}: ${hookName} — skipping (write-once)`);
          } else {
            settings.hooks[event].push(entry);
            changed = true;
          }
        }
      }
    }
  }

  // Merge permissions — append rules without duplicating
  if (governance.permissions) {
    if (!settings.permissions) settings.permissions = {};
    for (const [key, rules] of Object.entries(governance.permissions)) {
      if (Array.isArray(rules)) {
        if (!settings.permissions[key]) {
          settings.permissions[key] = rules;
          changed = true;
        } else {
          for (const rule of rules) {
            if (!settings.permissions[key].includes(rule)) {
              settings.permissions[key].push(rule);
              changed = true;
            }
          }
        }
      }
    }
  }

  if (changed) {
    writeSettings(settingsPath, validateHookFields(settings));
  }
  return changed;
}

/**
 * Install governance layer: CLAUDE.md template, context docs, hooks, permissions.
 * Only runs for Claude Code runtime.
 */
function installGovernance(targetDir, src, isGlobal) {
  const governanceSrc = path.join(src, 'governance');
  if (!fs.existsSync(governanceSrc)) {
    console.log(`  ${yellow}⚠${reset}  Governance directory not found in package — skipping`);
    return ['governance/ (package source missing)'];
  }

  console.log(`\n  ${cyan}Installing governance layer...${reset}`);

  // Path model (fix 2b): CLAUDE.md + context are memory files that must sit
  // beside the runtime's memory root. For a GLOBAL install that root is
  // targetDir itself (~/.claude/CLAUDE.md — the path Claude Code actually
  // reads; the old ~/CLAUDE.md was never loaded). For a LOCAL install it is
  // the project root (./CLAUDE.md), so keep those two at the parent. settings
  // ALWAYS lives inside the config dir (targetDir/settings.json) — writing it
  // to the parent (~/settings.json) meant the governance hooks/permissions
  // never loaded.
  const memoryBase = isGlobal ? targetDir : path.dirname(targetDir);
  const settingsPath = path.join(targetDir, 'settings.json');
  const missing = [];

  // 1. Copy CLAUDE.md — never clobber an existing customized file.
  //    The old backup-then-overwrite contract replaced the user's global
  //    CLAUDE.md with the template on EVERY install run and minted unbounded
  //    CLAUDE.md.backup.<ts> files (2026-07-16: 122 of them, 20 install
  //    bursts). New contract: no file → install template; file identical to
  //    template → no-op; file differs → preserve it and say so. Template
  //    changes are adopted deliberately by diffing, not by force.
  const claudeMdSrc = path.join(governanceSrc, 'templates', 'global', 'CLAUDE.md');
  const claudeMdDest = path.join(memoryBase, 'CLAUDE.md');
  if (fs.existsSync(claudeMdSrc)) {
    fs.mkdirSync(memoryBase, { recursive: true });
    if (!fs.existsSync(claudeMdDest)) {
      fs.copyFileSync(claudeMdSrc, claudeMdDest);
      console.log(`  ${green}✓${reset} Installed CLAUDE.md`);
    } else if (fs.readFileSync(claudeMdDest, 'utf8') === fs.readFileSync(claudeMdSrc, 'utf8')) {
      console.log(`  ${dim}  CLAUDE.md already matches template — skipped${reset}`);
    } else {
      console.log(`  ${yellow}⚠${reset}  Existing CLAUDE.md preserved (differs from template). Adopt template changes manually: diff "${claudeMdDest}" "${claudeMdSrc}"`);
    }
  } else {
    missing.push('governance CLAUDE.md template');
  }

  // 2. Copy context reference docs (co-located with CLAUDE.md so its
  //    @context/... imports resolve)
  const contextSrc = path.join(governanceSrc, 'templates', 'context');
  const contextDest = path.join(memoryBase, 'context');
  if (fs.existsSync(contextSrc)) {
    fs.mkdirSync(contextDest, { recursive: true });
    const contextFiles = fs.readdirSync(contextSrc).filter(f => f.endsWith('.md'));
    for (const file of contextFiles) {
      fs.copyFileSync(path.join(contextSrc, file), path.join(contextDest, file));
    }
    console.log(`  ${green}✓${reset} Installed ${contextFiles.length} context reference docs`);
  } else {
    missing.push('governance context docs');
  }

  // 3. Merge hooks into settings.json
  const hooksJsonSrc = path.join(governanceSrc, 'templates', 'global', 'settings-hooks.json');
  if (fs.existsSync(hooksJsonSrc)) {
    const merged = mergeGovernanceJson(settingsPath, hooksJsonSrc, 'governance hooks');
    if (merged) {
      console.log(`  ${green}✓${reset} Merged governance hooks into settings.json`);
    } else {
      console.log(`  ${dim}  Governance hooks already present — skipped${reset}`);
    }
  } else {
    // The branch-protection / staged-secrets / private-file / docs gates all
    // live in settings-hooks.json — a missing template silently drops every
    // one of them. Record it instead of reporting success (fix 2a).
    missing.push('governance hooks (settings-hooks.json)');
  }

  // 4. Merge permissions into settings.json
  const permJsonSrc = path.join(governanceSrc, 'templates', 'global', 'settings-permissions.json');
  if (fs.existsSync(permJsonSrc)) {
    const merged = mergeGovernanceJson(settingsPath, permJsonSrc, 'governance permissions');
    if (merged) {
      console.log(`  ${green}✓${reset} Merged governance permissions into settings.json`);
    } else {
      console.log(`  ${dim}  Governance permissions already present — skipped${reset}`);
    }
  } else {
    missing.push('governance permissions (settings-permissions.json)');
  }

  if (missing.length > 0) {
    console.log(`\n  ${yellow}⚠  Governance did NOT fully install.${reset} Missing: ${missing.join(', ')}`);
    console.log(`  ${yellow}   The corresponding protections are NOT active.${reset}`);
  }
  return missing;
}

/**
 * Register governance plugins in settings.json.
 * Adds plugin directories as local marketplace entries.
 */
function installGovernancePlugins(targetDir, src) {
  const pluginsSrc = path.join(src, 'plugins');
  if (!fs.existsSync(pluginsSrc)) {
    console.log(`  ${yellow}⚠${reset}  Plugins directory not found in package — skipping`);
    return;
  }

  // Copy plugins to target
  const pluginsDest = path.join(targetDir, 'plugins');
  fs.mkdirSync(pluginsDest, { recursive: true });

  const pluginDirs = fs.readdirSync(pluginsSrc, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const dir of pluginDirs) {
    const destDir = path.join(pluginsDest, dir.name);
    copyDirRecursive(path.join(pluginsSrc, dir.name), destDir);
  }

  console.log(`  ${green}✓${reset} Installed ${pluginDirs.length} governance plugins (${pluginDirs.map(d => d.name).join(', ')})`);
}

/**
 * Recursively copy a directory.
 */
function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Scaffold project structure for GSD + governance.
 */
function scaffoldProject(cwd) {
  console.log(`\n  ${cyan}Scaffolding project structure...${reset}`);

  const dirs = [
    '.planning/phases',
    'tasks',
    'context',
    '.claude/agents',
    'docs',
  ];

  let created = 0;
  for (const dir of dirs) {
    const fullPath = path.join(cwd, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      created++;
    }
  }

  // Create tasks/lessons.md if not exists
  const lessonsPath = path.join(cwd, 'tasks', 'lessons.md');
  if (!fs.existsSync(lessonsPath)) {
    fs.writeFileSync(lessonsPath, `# Lessons

## Active Rules

### Seed Rules
- [Config]: Never modify shared config files without checking downstream consumers.
- [Scope]: If a "quick fix" requires 3+ files, it is not quick. Re-plan.
- [Testing]: Run the full test suite, not just tests for the changed module.
- [Dependencies]: Never add dependencies without explicit user approval.
- [Data]: Never delete production data, migrations, or seed data without approval.

### Learned Rules
<!-- Added during sessions when corrections occur -->

## Archived
<!-- Rules that no longer apply -->
`);
    console.log(`  ${green}✓${reset} Created tasks/lessons.md`);
  }

  console.log(`  ${green}✓${reset} Scaffolded ${created} directories`);
}

/**
 * Remove governance files during uninstall.
 */
function uninstallGovernance(targetDir) {
  // Install now places CLAUDE.md/context under targetDir for global installs
  // and under the parent (project root) for local ones (fix 2b). Uninstall does
  // not know isGlobal, so scan BOTH candidate bases — every removal below is
  // guarded (CLAUDE.md by content signature, context by known filenames) so
  // checking both is safe and also cleans up legacy (pre-fix) installs.
  const memoryBases = [targetDir, path.dirname(targetDir)];

  // Remove governance CLAUDE.md if it looks like ours
  for (const base of memoryBases) {
    const claudeMdPath = path.join(base, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      if (content.includes('Global Claude Code Configuration') && content.includes('gsd')) {
        fs.unlinkSync(claudeMdPath);
        console.log(`  ${green}✓${reset} Removed governance CLAUDE.md`);
      }
    }
  }

  // Remove context docs installed by governance
  const governanceContextFiles = [
    'cli-reference.md', 'hooks-guide.md', 'mcp-setup-guide.md',
    'settings-reference.md', 'skill-creation-guide.md', 'subagent-guide.md'
  ];
  for (const base of memoryBases) {
    const contextDir = path.join(base, 'context');
    if (fs.existsSync(contextDir)) {
      for (const file of governanceContextFiles) {
        const filePath = path.join(contextDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // Remove context dir if empty
      try {
        const remaining = fs.readdirSync(contextDir);
        if (remaining.length === 0) {
          fs.rmdirSync(contextDir);
        }
      } catch { /* ignore */ }
      console.log(`  ${green}✓${reset} Removed governance context docs`);
    }
  }

  // Remove ONLY the GSD-owned plugin subdirs — never the whole plugins/ dir.
  // For a global install targetDir is ~/.claude, so plugins/ is Claude Code's
  // native plugin store (repos/, config.json, cache/, other marketplaces).
  // Wiping it recursively destroyed all of that. Mirror the install-time
  // enumeration (installGovernancePlugins copies each subdir of the package
  // plugins/ into targetDir/plugins/<name>) and remove only those names.
  const pluginsDir = path.join(targetDir, 'plugins');
  if (fs.existsSync(pluginsDir)) {
    let gsdPluginNames;
    const pkgPluginsSrc = path.join(__dirname, '..', '..', 'plugins');
    try {
      gsdPluginNames = fs.readdirSync(pkgPluginsSrc, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
    } catch {
      // Package plugins dir not resolvable at uninstall — fall back to the
      // known constant list rather than touching anything we didn't install.
      gsdPluginNames = ['claude-code-factory', 'claude-mcp-ecosystem'];
    }
    let removed = 0;
    for (const name of gsdPluginNames) {
      const dir = path.join(pluginsDir, name);
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true });
          removed++;
        } catch (e) {
          console.log(`  ${yellow}⚠${reset} Could not remove plugin ${name}: ${e.message}`);
        }
      }
    }
    if (removed > 0) {
      console.log(`  ${green}✓${reset} Removed ${removed} governance plugin${removed === 1 ? '' : 's'} (${gsdPluginNames.join(', ')})`);
    }
  }

  // Clean up governance hooks from settings.json. Install writes settings to
  // targetDir/settings.json (fix 2b); scan the legacy parent location too so
  // pre-fix installs are also cleaned.
  const settingsPaths = [
    path.join(targetDir, 'settings.json'),
    path.join(path.dirname(targetDir), 'settings.json'),
  ];
  for (const settingsPath of settingsPaths) {
    if (!fs.existsSync(settingsPath)) continue;
    let settings = readSettings(settingsPath);
    let settingsModified = false;

    // Remove governance hooks — identify by inline bash commands (not external .js files)
    if (settings.hooks) {
      for (const eventName of Object.keys(settings.hooks)) {
        if (!Array.isArray(settings.hooks[eventName])) continue;
        const before = settings.hooks[eventName].length;
        settings.hooks[eventName] = settings.hooks[eventName].filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            // Governance hooks use inline bash commands, not .js files
            const isGovernanceHook = entry.hooks.some(h =>
              h.command && h.type === 'command' &&
              !h.command.includes('.js') &&
              (h.command.includes('HAS_TASKS') || h.command.includes('STAGED_DOCS') ||
               h.command.includes('SECRETS_FOUND') || h.command.includes('NESTED_GIT') ||
               h.command.includes('FILE_EXT') || h.command.includes('UNCOMMITTED') ||
               h.command.includes('TASK_STATE'))
            );
            return !isGovernanceHook;
          }
          return true;
        });
        if (settings.hooks[eventName].length < before) {
          settingsModified = true;
        }
        if (settings.hooks[eventName].length === 0) {
          delete settings.hooks[eventName];
        }
      }
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    if (settingsModified) {
      writeSettings(settingsPath, settings);
      console.log(`  ${green}✓${reset} Removed governance hooks from settings.json`);
    }
  }
}

module.exports = {
  validateGsdPrefixAgents,
  mergeGovernanceJson,
  installGovernance,
  installGovernancePlugins,
  copyDirRecursive,
  scaffoldProject,
  uninstallGovernance,
};
