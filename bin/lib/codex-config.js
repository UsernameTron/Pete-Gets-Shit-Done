const fs = require('fs');
const path = require('path');
const { GSD_CODEX_MARKER, getManagedCodexHooksOwnership, stripCodexHooksFeatureAssignments } = require('./codex-hooks-feature');
const { extractFrontmatterAndBody, extractFrontmatterField, toSingleLine } = require('./converters/shared');
const { detectLineEnding } = require('./toml-lexer');
const { collapseTomlBlankLines, getTomlLineRecords, getTomlTableSections } = require('./toml');

const CODEX_AGENT_SANDBOX = {
  'gsd-executor': 'workspace-write',
  'gsd-planner': 'workspace-write',
  'gsd-research-orchestrator': 'workspace-write',
  'gsd-research-synthesizer': 'workspace-write',
  'gsd-verifier': 'workspace-write',
  'gsd-codebase-mapper': 'workspace-write',
  'gsd-roadmapper': 'workspace-write',
  'gsd-debugger': 'workspace-write',
  'gsd-ui-auditor': 'workspace-write',
  'gsd-ui-researcher': 'workspace-write',
  'gsd-advisor-researcher': 'read-only',
  'gsd-assumptions-analyzer': 'read-only',
  'gsd-ui-checker': 'read-only',
  'gsd-user-profiler': 'read-only',
  'gsd-validator-hub': 'read-only',
  'gsd-dependency-auditor': 'workspace-write',
  'gsd-ecosystem-auditor': 'read-only',
};

/**
 * Generate a per-agent .toml config file for Codex.
 * Sets required agent metadata, sandbox_mode, and developer_instructions
 * from the agent markdown content.
 */
function generateCodexAgentToml(agentName, agentContent) {
  const sandboxMode = CODEX_AGENT_SANDBOX[agentName] || 'read-only';
  const { frontmatter, body } = extractFrontmatterAndBody(agentContent);
  const frontmatterText = frontmatter || '';
  const resolvedName = extractFrontmatterField(frontmatterText, 'name') || agentName;
  const resolvedDescription = toSingleLine(
    extractFrontmatterField(frontmatterText, 'description') || `GSD agent ${resolvedName}`
  );
  const instructions = body.trim();

  const lines = [
    `name = ${JSON.stringify(resolvedName)}`,
    `description = ${JSON.stringify(resolvedDescription)}`,
    `sandbox_mode = "${sandboxMode}"`,
    // Agent prompts contain raw backslashes in regexes and shell snippets.
    // TOML literal multiline strings preserve them without escape parsing.
    `developer_instructions = '''`,
    instructions,
    `'''`,
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generate the GSD config block for Codex config.toml.
 * @param {Array<{name: string, description: string}>} agents
 */
function generateCodexConfigBlock(agents, targetDir) {
  // Use absolute paths when targetDir is provided — Codex ≥0.116 requires
  // AbsolutePathBuf for config_file and cannot resolve relative paths.
  const agentsPrefix = targetDir
    ? path.join(targetDir, 'agents').replace(/\\/g, '/')
    : 'agents';
  const lines = [
    GSD_CODEX_MARKER,
    '',
  ];

  for (const { name, description } of agents) {
    lines.push(`[agents.${name}]`);
    lines.push(`description = ${JSON.stringify(description)}`);
    lines.push(`config_file = "${agentsPrefix}/${name}.toml"`);
    lines.push('');
  }

  return lines.join('\n');
}

function stripCodexGsdAgentSections(content) {
  return content.replace(/^\[agents\.gsd-[^\]]+\]\n(?:(?!\[)[^\n]*\n?)*/gm, '');
}

/**
 * Strip GSD sections from Codex config.toml content.
 * Returns cleaned content, or null if file would be empty.
 */
function stripGsdFromCodexConfig(content) {
  const eol = detectLineEnding(content);
  const markerIndex = content.indexOf(GSD_CODEX_MARKER);
  const codexHooksOwnership = getManagedCodexHooksOwnership(content);

  if (markerIndex !== -1) {
    // Has GSD marker — remove everything from marker to EOF
    let before = content.substring(0, markerIndex);
    before = stripCodexHooksFeatureAssignments(before, codexHooksOwnership);
    // Also strip GSD-injected feature keys above the marker (Case 3 inject)
    before = before.replace(/^multi_agent\s*=\s*true\s*(?:\r?\n)?/m, '');
    before = before.replace(/^default_mode_request_user_input\s*=\s*true\s*(?:\r?\n)?/m, '');
    before = before.replace(/^\[features\]\s*\n(?=\[|$)/m, '');
    before = before.replace(/^\[agents\]\s*\n(?=\[|$)/m, '');
    before = before.replace(/^(?:\r?\n)+/, '').trimEnd();
    if (!before) return null;
    return before + eol;
  }

  // No marker but may have GSD-injected feature keys
  let cleaned = content;
  cleaned = stripCodexHooksFeatureAssignments(cleaned, codexHooksOwnership);
  cleaned = cleaned.replace(/^multi_agent\s*=\s*true\s*(?:\r?\n)?/m, '');
  cleaned = cleaned.replace(/^default_mode_request_user_input\s*=\s*true\s*(?:\r?\n)?/m, '');

  // Remove [agents.gsd-*] sections (from header to next section or EOF)
  cleaned = stripCodexGsdAgentSections(cleaned);

  // Remove [features] section if now empty (only header, no keys before next section)
  cleaned = cleaned.replace(/^\[features\]\s*\n(?=\[|$)/m, '');

  // Remove [agents] section if now empty
  cleaned = cleaned.replace(/^\[agents\]\s*\n(?=\[|$)/m, '');

  cleaned = cleaned.replace(/^(?:\r?\n)+/, '').trimEnd();

  if (!cleaned) return null;
  return cleaned + eol;
}

function isLegacyGsdAgentsSection(body) {
  const lineRecords = getTomlLineRecords(body);
  const legacyKeys = new Set(['max_threads', 'max_depth']);
  let sawLegacyKey = false;

  for (const record of lineRecords) {
    if (record.startsInMultilineString) {
      return false;
    }

    if (record.tableHeader) {
      return false;
    }

    const trimmed = record.text.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (!record.keySegments || record.keySegments.length !== 1 || !legacyKeys.has(record.keySegments[0])) {
      return false;
    }

    sawLegacyKey = true;
  }

  return sawLegacyKey;
}

function stripLeakedGsdCodexSections(content) {
  const leakedSections = getTomlTableSections(content)
    .filter((section) =>
      section.path.startsWith('agents.gsd-') ||
      (
        section.path === 'agents' &&
        isLegacyGsdAgentsSection(content.slice(section.headerEnd, section.end))
      )
    );

  if (leakedSections.length === 0) {
    return content;
  }

  let cleaned = '';
  let cursor = 0;

  for (const section of leakedSections) {
    cleaned += content.slice(cursor, section.start);
    cursor = section.end;
  }

  cleaned += content.slice(cursor);
  return collapseTomlBlankLines(cleaned);
}

/**
 * Merge GSD config block into an existing or new config.toml.
 * Three cases: new file, existing with GSD marker, existing without marker.
 */
function mergeCodexConfig(configPath, gsdBlock) {
  // Case 1: No config.toml — create fresh
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, gsdBlock + '\n');
    return;
  }

  const existing = fs.readFileSync(configPath, 'utf8');
  const eol = detectLineEnding(existing);
  const normalizedGsdBlock = gsdBlock.replace(/\r?\n/g, eol);
  const markerIndex = existing.indexOf(GSD_CODEX_MARKER);

  // Case 2: Has GSD marker — truncate and re-append
  if (markerIndex !== -1) {
    let before = existing.substring(0, markerIndex).trimEnd();
    if (before) {
      // Strip any GSD-managed sections that leaked above the marker from previous installs
      before = stripLeakedGsdCodexSections(before).trimEnd();

      fs.writeFileSync(configPath, before + eol + eol + normalizedGsdBlock + eol);
    } else {
      fs.writeFileSync(configPath, normalizedGsdBlock + eol);
    }
    return;
  }

  // Case 3: No marker — append GSD block
  let content = stripLeakedGsdCodexSections(existing).trimEnd();
  if (content) {
    content = content + eol + eol + normalizedGsdBlock + eol;
  } else {
    content = normalizedGsdBlock + eol;
  }

  fs.writeFileSync(configPath, content);
}

/**
 * Generate config.toml and per-agent .toml files for Codex.
 * Reads agent .md files from source, extracts metadata, writes .toml configs.
 */
function installCodexConfig(targetDir, agentsSrc) {
  const configPath = path.join(targetDir, 'config.toml');
  const agentsTomlDir = path.join(targetDir, 'agents');
  fs.mkdirSync(agentsTomlDir, { recursive: true });

  const agentEntries = fs.readdirSync(agentsSrc).filter(f => f.startsWith('gsd-') && f.endsWith('.md'));
  const agents = [];

  // Compute the Codex GSD install path (absolute, so subagents with empty $HOME work — #820)
  const codexGsdPath = `${path.resolve(targetDir, 'get-shit-done').replace(/\\/g, '/')}/`;

  for (const file of agentEntries) {
    let content = fs.readFileSync(path.join(agentsSrc, file), 'utf8');
    // Replace full .claude/get-shit-done prefix so path resolves to codex GSD install
    content = content.replace(/~\/\.claude\/get-shit-done\//g, codexGsdPath);
    content = content.replace(/\$HOME\/\.claude\/get-shit-done\//g, codexGsdPath);
    const { frontmatter } = extractFrontmatterAndBody(content);
    const name = extractFrontmatterField(frontmatter, 'name') || file.replace('.md', '');
    const description = extractFrontmatterField(frontmatter, 'description') || '';

    agents.push({ name, description: toSingleLine(description) });

    const tomlContent = generateCodexAgentToml(name, content);
    fs.writeFileSync(path.join(agentsTomlDir, `${name}.toml`), tomlContent);
  }

  const gsdBlock = generateCodexConfigBlock(agents, targetDir);
  mergeCodexConfig(configPath, gsdBlock);

  return agents.length;
}

module.exports = {
  CODEX_AGENT_SANDBOX,
  generateCodexAgentToml,
  generateCodexConfigBlock,
  stripGsdFromCodexConfig,
  mergeCodexConfig,
  installCodexConfig,
};
