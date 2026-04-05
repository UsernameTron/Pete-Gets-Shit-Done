/**
 * Init — Compound init commands for workflow bootstrapping
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig, resolveModelInternal, findPhaseInternal, getRoadmapPhaseInternal, pathExistsInternal, generateSlugInternal, getMilestoneInfo, getMilestonePhaseFilter, stripShippedMilestones, extractCurrentMilestone, normalizePhaseName, matchesPhaseDir, planningPaths, planningDir, planningRoot, toPosixPath, output, error, checkAgentsInstalled, createFeatureFlags } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');

function getLatestCompletedMilestone(cwd) {
  const milestonesPath = path.join(planningRoot(cwd), 'MILESTONES.md');
  if (!fs.existsSync(milestonesPath)) return null;

  try {
    const content = fs.readFileSync(milestonesPath, 'utf-8');
    const match = content.match(/^##\s+(v[\d.]+)\s+(.+?)\s+\(Shipped:/m);
    if (!match) return null;
    return {
      version: match[1],
      name: match[2].trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Inject `project_root` into an init result object.
 * Workflows use this to prefix `.planning/` paths correctly when Claude's CWD
 * differs from the project root (e.g., inside a sub-repo).
 */
function withProjectRoot(cwd, result) {
  result.project_root = cwd;
  // Inject agent installation status into all init outputs (#1371).
  // Workflows that spawn named subagents use this to detect when agents
  // are missing and would silently fall back to general-purpose.
  const agentStatus = checkAgentsInstalled();
  result.agents_installed = agentStatus.agents_installed;
  result.missing_agents = agentStatus.missing_agents;
  return result;
}

function cmdInitExecutePhase(cwd, phase, raw) {
  if (!phase) {
    error('phase required for init execute-phase');
  }

  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase);
  const milestone = getMilestoneInfo(cwd);

  const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);

  // Fallback to ROADMAP.md if no phase directory exists yet
  if (!phaseInfo && roadmapPhase?.found) {
    const phaseName = roadmapPhase.phase_name;
    phaseInfo = {
      found: true,
      directory: null,
      phase_number: roadmapPhase.phase_number,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans: [],
      summaries: [],
      incomplete_plans: [],
      has_research: false,
      has_context: false,
      has_verification: false,
      has_reviews: false,
    };
  }
  const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
  const reqExtracted = reqMatch
    ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean).join(', ')
    : null;
  const phase_req_ids = (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),

    // Config flags
    commit_docs: config.commit_docs,
    sub_repos: config.sub_repos,
    parallelization: config.parallelization,
    context_window: config.context_window,
    branching_strategy: config.branching_strategy,
    phase_branch_template: config.phase_branch_template,
    milestone_branch_template: config.milestone_branch_template,
    verifier_enabled: config.verifier,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    phase_req_ids,

    // Plan inventory
    plans: phaseInfo?.plans || [],
    summaries: phaseInfo?.summaries || [],
    incomplete_plans: phaseInfo?.incomplete_plans || [],
    plan_count: phaseInfo?.plans?.length || 0,
    incomplete_count: phaseInfo?.incomplete_plans?.length || 0,

    // Branch name (pre-computed)
    branch_name: config.branching_strategy === 'phase' && phaseInfo
      ? config.phase_branch_template
          .replace('{phase}', phaseInfo.phase_number)
          .replace('{slug}', phaseInfo.phase_slug || 'phase')
      : config.branching_strategy === 'milestone'
        ? config.milestone_branch_template
            .replace('{milestone}', milestone.version)
            .replace('{slug}', generateSlugInternal(milestone.name) || 'milestone')
        : null,

    // Milestone info
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    milestone_slug: generateSlugInternal(milestone.name),

    // File existence
    state_exists: fs.existsSync(path.join(planningDir(cwd), 'STATE.md')),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    config_exists: fs.existsSync(path.join(planningDir(cwd), 'config.json')),
    // File paths
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    config_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'config.json'))),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitPlanPhase(cwd, phase, raw) {
  if (!phase) {
    error('phase required for init plan-phase');
  }

  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase);

  const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);

  // Fallback to ROADMAP.md if no phase directory exists yet
  if (!phaseInfo && roadmapPhase?.found) {
    const phaseName = roadmapPhase.phase_name;
    phaseInfo = {
      found: true,
      directory: null,
      phase_number: roadmapPhase.phase_number,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans: [],
      summaries: [],
      incomplete_plans: [],
      has_research: false,
      has_context: false,
      has_verification: false,
      has_reviews: false,
    };
  }
  const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
  const reqExtracted = reqMatch
    ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean).join(', ')
    : null;
  const phase_req_ids = (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-phase-researcher'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Workflow flags
    research_enabled: config.research,
    plan_checker_enabled: config.plan_checker,
    nyquist_validation_enabled: config.nyquist_validation,
    commit_docs: config.commit_docs,
    text_mode: config.text_mode,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number ? normalizePhaseName(phaseInfo.phase_number) : null,
    phase_req_ids,

    // Existing artifacts
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_reviews: phaseInfo?.has_reviews || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    plan_count: phaseInfo?.plans?.length || 0,

    // Environment
    planning_exists: fs.existsSync(planningDir(cwd)),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),

    // File paths
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    requirements_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'REQUIREMENTS.md'))),
  };

  if (phaseInfo?.directory) {
    // Find *-CONTEXT.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_path = toPosixPath(path.join(phaseInfo.directory, contextFile));
      }
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(phaseInfo.directory, researchFile));
      }
      const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
      if (verificationFile) {
        result.verification_path = toPosixPath(path.join(phaseInfo.directory, verificationFile));
      }
      const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
      if (uatFile) {
        result.uat_path = toPosixPath(path.join(phaseInfo.directory, uatFile));
      }
      const reviewsFile = files.find(f => f.endsWith('-REVIEWS.md') || f === 'REVIEWS.md');
      if (reviewsFile) {
        result.reviews_path = toPosixPath(path.join(phaseInfo.directory, reviewsFile));
      }
    } catch { /* intentional: phase directory file listing is best-effort for UAT/review paths */ }
  }

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitNewProject(cwd, raw) {
  const config = loadConfig(cwd);

  // Detect Brave Search API key availability
  const homedir = require('os').homedir();
  const braveKeyFile = path.join(homedir, '.gsd', 'brave_api_key');
  const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs.existsSync(braveKeyFile));

  // Detect Firecrawl API key availability
  const firecrawlKeyFile = path.join(homedir, '.gsd', 'firecrawl_api_key');
  const hasFirecrawl = !!(process.env.FIRECRAWL_API_KEY || fs.existsSync(firecrawlKeyFile));

  // Detect Exa API key availability
  const exaKeyFile = path.join(homedir, '.gsd', 'exa_api_key');
  const hasExaSearch = !!(process.env.EXA_API_KEY || fs.existsSync(exaKeyFile));

  // Detect existing code (cross-platform — no Unix `find` dependency)
  let hasCode = false;
  let hasPackageFile = false;
  try {
    const codeExtensions = new Set([
      '.ts', '.js', '.py', '.go', '.rs', '.swift', '.java',
      '.kt', '.kts',           // Kotlin (Android, server-side)
      '.c', '.cpp', '.h',      // C/C++
      '.cs',                   // C#
      '.rb',                   // Ruby
      '.php',                  // PHP
      '.dart',                 // Dart (Flutter)
      '.m', '.mm',             // Objective-C / Objective-C++
      '.scala',                // Scala
      '.groovy',               // Groovy (Gradle build scripts)
      '.lua',                  // Lua
      '.r', '.R',              // R
      '.zig',                  // Zig
      '.ex', '.exs',           // Elixir
      '.clj',                  // Clojure
    ]);
    const skipDirs = new Set(['node_modules', '.git', '.planning', '.claude', '__pycache__', 'target', 'dist', 'build']);
    function findCodeFiles(dir, depth) {
      if (depth > 3) return false;
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* intentional: unreadable directory treated as no code files */ return false; }
      for (const entry of entries) {
        if (entry.isFile() && codeExtensions.has(path.extname(entry.name))) return true;
        if (entry.isDirectory() && !skipDirs.has(entry.name)) {
          if (findCodeFiles(path.join(dir, entry.name), depth + 1)) return true;
        }
      }
      return false;
    }
    hasCode = findCodeFiles(cwd, 0);
  } catch { /* intentional: code file detection is best-effort for project type heuristic */ }

  hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                   pathExistsInternal(cwd, 'requirements.txt') ||
                   pathExistsInternal(cwd, 'Cargo.toml') ||
                   pathExistsInternal(cwd, 'go.mod') ||
                   pathExistsInternal(cwd, 'Package.swift') ||
                   pathExistsInternal(cwd, 'build.gradle') ||
                   pathExistsInternal(cwd, 'build.gradle.kts') ||
                   pathExistsInternal(cwd, 'pom.xml') ||
                   pathExistsInternal(cwd, 'Gemfile') ||
                   pathExistsInternal(cwd, 'composer.json') ||
                   pathExistsInternal(cwd, 'pubspec.yaml') ||
                   pathExistsInternal(cwd, 'CMakeLists.txt') ||
                   pathExistsInternal(cwd, 'Makefile') ||
                   pathExistsInternal(cwd, 'build.zig') ||
                   pathExistsInternal(cwd, 'mix.exs') ||
                   pathExistsInternal(cwd, 'project.clj');

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'gsd-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'gsd-roadmapper'),

    // Config
    commit_docs: config.commit_docs,

    // Existing state
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    has_codebase_map: pathExistsInternal(cwd, '.planning/codebase'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    // Brownfield detection
    has_existing_code: hasCode,
    has_package_file: hasPackageFile,
    is_brownfield: hasCode || hasPackageFile,
    needs_codebase_map: (hasCode || hasPackageFile) && !pathExistsInternal(cwd, '.planning/codebase'),

    // Git state
    has_git: pathExistsInternal(cwd, '.git'),

    // Enhanced search
    brave_search_available: hasBraveSearch,
    firecrawl_available: hasFirecrawl,
    exa_search_available: hasExaSearch,

    // File paths
    project_path: '.planning/PROJECT.md',
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitNewMilestone(cwd, raw) {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);
  const latestCompleted = getLatestCompletedMilestone(cwd);
  const phasesDir = path.join(planningDir(cwd), 'phases');
  let phaseDirCount = 0;

  try {
    if (fs.existsSync(phasesDir)) {
      phaseDirCount = fs.readdirSync(phasesDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .length;
    }
  } catch { /* intentional: phases directory may not exist for phase count */ }

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'gsd-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'gsd-roadmapper'),

    // Config
    commit_docs: config.commit_docs,
    research_enabled: config.research,

    // Current milestone
    current_milestone: milestone.version,
    current_milestone_name: milestone.name,
    latest_completed_milestone: latestCompleted?.version || null,
    latest_completed_milestone_name: latestCompleted?.name || null,
    phase_dir_count: phaseDirCount,
    phase_archive_path: latestCompleted ? toPosixPath(path.relative(cwd, path.join(planningRoot(cwd), 'milestones', `${latestCompleted.version}-phases`))) : null,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    state_exists: fs.existsSync(path.join(planningDir(cwd), 'STATE.md')),

    // File paths
    project_path: '.planning/PROJECT.md',
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitQuick(cwd, description, raw) {
  const config = loadConfig(cwd);
  const now = new Date();
  const slug = description ? generateSlugInternal(description)?.substring(0, 40) : null;

  // Generate collision-resistant quick task ID: YYMMDD-xxx
  // xxx = 2-second precision blocks since midnight, encoded as 3-char Base36 (lowercase)
  // Range: 000 (00:00:00) to xbz (23:59:58), guaranteed 3 chars for any time of day.
  // Provides ~2s uniqueness window per user — practically collision-free across a team.
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = yy + mm + dd;
  const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const timeBlocks = Math.floor(secondsSinceMidnight / 2);
  const timeEncoded = timeBlocks.toString(36).padStart(3, '0');
  const quickId = dateStr + '-' + timeEncoded;
  const branchSlug = slug || 'quick';
  const quickBranchName = config.quick_branch_template
    ? config.quick_branch_template
        .replace('{num}', quickId)
        .replace('{quick}', quickId)
        .replace('{slug}', branchSlug)
    : null;

  const result = {
    // Models
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),
    verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),

    // Config
    commit_docs: config.commit_docs,
    branch_name: quickBranchName,

    // Quick task info
    quick_id: quickId,
    slug: slug,
    description: description || null,

    // Timestamps
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),

    // Paths
    quick_dir: '.planning/quick',
    task_dir: slug ? `.planning/quick/${quickId}-${slug}` : null,

    // File existence
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    planning_exists: fs.existsSync(planningRoot(cwd)),

  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitResume(cwd, raw) {
  const config = loadConfig(cwd);

  // Check for interrupted agent
  let interruptedAgentId = null;
  try {
    interruptedAgentId = fs.readFileSync(path.join(planningRoot(cwd), 'current-agent-id.txt'), 'utf-8').trim();
  } catch { /* intentional: interrupted agent ID file may not exist */ }

  const result = {
    // File existence
    state_exists: fs.existsSync(path.join(planningDir(cwd), 'STATE.md')),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    planning_exists: fs.existsSync(planningRoot(cwd)),

    // File paths
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    project_path: '.planning/PROJECT.md',

    // Agent state
    has_interrupted_agent: !!interruptedAgentId,
    interrupted_agent_id: interruptedAgentId,

    // Config
    commit_docs: config.commit_docs,
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitVerifyWork(cwd, phase, raw) {
  if (!phase) {
    error('phase required for init verify-work');
  }

  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase);

  // Fallback to ROADMAP.md if no phase directory exists yet
  if (!phaseInfo) {
    const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);
    if (roadmapPhase?.found) {
      const phaseName = roadmapPhase.phase_name;
      phaseInfo = {
        found: true,
        directory: null,
        phase_number: roadmapPhase.phase_number,
        phase_name: phaseName,
        phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
        plans: [],
        summaries: [],
        incomplete_plans: [],
        has_research: false,
        has_context: false,
        has_verification: false,
      };
    }
  }

  const result = {
    // Models
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Config
    commit_docs: config.commit_docs,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,

    // Existing artifacts
    has_verification: phaseInfo?.has_verification || false,
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitPhaseOp(cwd, phase, raw) {
  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase);

  // If the only disk match comes from an archived milestone, prefer the
  // current milestone's ROADMAP entry so discuss-phase and similar flows
  // don't attach to shipped work that reused the same phase number.
  if (phaseInfo?.archived) {
    const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);
    if (roadmapPhase?.found) {
      const phaseName = roadmapPhase.phase_name;
      phaseInfo = {
        found: true,
        directory: null,
        phase_number: roadmapPhase.phase_number,
        phase_name: phaseName,
        phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
        plans: [],
        summaries: [],
        incomplete_plans: [],
        has_research: false,
        has_context: false,
        has_verification: false,
      };
    }
  }

  // Fallback to ROADMAP.md if no directory exists (e.g., Plans: TBD)
  if (!phaseInfo) {
    const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);
    if (roadmapPhase?.found) {
      const phaseName = roadmapPhase.phase_name;
      phaseInfo = {
        found: true,
        directory: null,
        phase_number: roadmapPhase.phase_number,
        phase_name: phaseName,
        phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
        plans: [],
        summaries: [],
        incomplete_plans: [],
        has_research: false,
        has_context: false,
        has_verification: false,
      };
    }
  }

  const result = {
    // Config
    commit_docs: config.commit_docs,
    brave_search: config.brave_search,
    firecrawl: config.firecrawl,
    exa_search: config.exa_search,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number ? normalizePhaseName(phaseInfo.phase_number) : null,

    // Existing artifacts
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    has_verification: phaseInfo?.has_verification || false,
    has_reviews: phaseInfo?.has_reviews || false,
    plan_count: phaseInfo?.plans?.length || 0,

    // File existence
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    planning_exists: fs.existsSync(planningDir(cwd)),

    // File paths
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    requirements_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'REQUIREMENTS.md'))),
  };

  if (phaseInfo?.directory) {
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_path = toPosixPath(path.join(phaseInfo.directory, contextFile));
      }
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(phaseInfo.directory, researchFile));
      }
      const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
      if (verificationFile) {
        result.verification_path = toPosixPath(path.join(phaseInfo.directory, verificationFile));
      }
      const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
      if (uatFile) {
        result.uat_path = toPosixPath(path.join(phaseInfo.directory, uatFile));
      }
      const reviewsFile = files.find(f => f.endsWith('-REVIEWS.md') || f === 'REVIEWS.md');
      if (reviewsFile) {
        result.reviews_path = toPosixPath(path.join(phaseInfo.directory, reviewsFile));
      }
    } catch { /* intentional: phase directory file listing is best-effort for verification/UAT paths */ }
  }

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitTodos(cwd, area, raw) {
  const config = loadConfig(cwd);
  const now = new Date();

  // List todos (reuse existing logic)
  const pendingDir = path.join(planningDir(cwd), 'todos', 'pending');
  let count = 0;
  const todos = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);
        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'todos', 'pending', file))),
        });
      } catch { /* intentional: skip unreadable individual todo files */ }
    }
  } catch { /* intentional: pending todos directory may not exist */ }

  const result = {
    // Config
    commit_docs: config.commit_docs,

    // Timestamps
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),

    // Todo inventory
    todo_count: count,
    todos,
    area_filter: area || null,

    // Paths
    pending_dir: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'todos', 'pending'))),
    completed_dir: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'todos', 'completed'))),

    // File existence
    planning_exists: fs.existsSync(planningDir(cwd)),
    todos_dir_exists: fs.existsSync(path.join(planningDir(cwd), 'todos')),
    pending_dir_exists: fs.existsSync(path.join(planningDir(cwd), 'todos', 'pending')),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitMilestoneOp(cwd, raw) {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  // Count phases
  let phaseCount = 0;
  let completedPhases = 0;
  const phasesDir = path.join(planningDir(cwd), 'phases');
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    phaseCount = dirs.length;

    // Count phases with summaries (completed)
    for (const dir of dirs) {
      try {
        const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
        const hasSummary = phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
        if (hasSummary) completedPhases++;
      } catch { /* intentional: skip unreadable phase directories during summary count */ }
    }
  } catch { /* intentional: phases directory may not exist for milestone progress */ }

  // Check archive
  const archiveDir = path.join(planningRoot(cwd), 'archive');
  let archivedMilestones = [];
  try {
    archivedMilestones = fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch { /* intentional: archive directory may not exist */ }

  const result = {
    // Config
    commit_docs: config.commit_docs,

    // Current milestone
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    milestone_slug: generateSlugInternal(milestone.name),

    // Phase counts
    phase_count: phaseCount,
    completed_phases: completedPhases,
    all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,

    // Archive
    archived_milestones: archivedMilestones,
    archive_count: archivedMilestones.length,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    state_exists: fs.existsSync(path.join(planningDir(cwd), 'STATE.md')),
    archive_exists: fs.existsSync(path.join(planningRoot(cwd), 'archive')),
    phases_dir_exists: fs.existsSync(path.join(planningDir(cwd), 'phases')),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitMapCodebase(cwd, raw) {
  const config = loadConfig(cwd);

  // Check for existing codebase maps
  const codebaseDir = path.join(planningRoot(cwd), 'codebase');
  let existingMaps = [];
  try {
    existingMaps = fs.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
  } catch { /* intentional: codebase maps directory may not exist */ }

  const result = {
    // Models
    mapper_model: resolveModelInternal(cwd, 'gsd-codebase-mapper'),

    // Config
    commit_docs: config.commit_docs,
    search_gitignored: config.search_gitignored,
    parallelization: config.parallelization,

    // Paths
    codebase_dir: '.planning/codebase',

    // Existing maps
    existing_maps: existingMaps,
    has_maps: existingMaps.length > 0,

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    codebase_dir_exists: pathExistsInternal(cwd, '.planning/codebase'),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitManager(cwd, raw) {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  // Use planningPaths for forward-compatibility with workstream scoping (#1268)
  const paths = planningPaths(cwd);

  // Validate prerequisites
  if (!fs.existsSync(paths.roadmap)) {
    error('No ROADMAP.md found. Run /gsd:new-milestone first.');
  }
  if (!fs.existsSync(paths.state)) {
    error('No STATE.md found. Run /gsd:new-milestone first.');
  }
  const rawContent = fs.readFileSync(paths.roadmap, 'utf-8');
  const content = extractCurrentMilestone(rawContent, cwd);
  const phasesDir = paths.phases;
  const isDirInMilestone = getMilestonePhaseFilter(cwd);

  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phases = [];
  let match;

  while ((match = phasePattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();

    const sectionStart = match.index;
    const restOfContent = content.slice(sectionStart);
    const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    const dependsMatch = section.match(/\*\*Depends on(?::\*\*|\*\*:)\s*([^\n]+)/i);
    const depends_on = dependsMatch ? dependsMatch[1].trim() : null;

    const normalized = normalizePhaseName(phaseNum);
    let diskStatus = 'no_directory';
    let planCount = 0;
    let summaryCount = 0;
    let hasContext = false;
    let hasResearch = false;
    let lastActivity = null;
    let isActive = false;

    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).filter(isDirInMilestone);
      const dirMatch = dirs.find(d => matchesPhaseDir(d, normalized));

      if (dirMatch) {
        const fullDir = path.join(phasesDir, dirMatch);
        const phaseFiles = fs.readdirSync(fullDir);
        planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
        summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
        hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
        hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

        if (summaryCount >= planCount && planCount > 0) diskStatus = 'complete';
        else if (summaryCount > 0) diskStatus = 'partial';
        else if (planCount > 0) diskStatus = 'planned';
        else if (hasResearch) diskStatus = 'researched';
        else if (hasContext) diskStatus = 'discussed';
        else diskStatus = 'empty';

        // Activity detection: check most recent file mtime
        const now = Date.now();
        let newestMtime = 0;
        for (const f of phaseFiles) {
          try {
            const stat = fs.statSync(path.join(fullDir, f));
            if (stat.mtimeMs > newestMtime) newestMtime = stat.mtimeMs;
          } catch { /* intentional: file stat may fail for deleted or inaccessible files */ }
        }
        if (newestMtime > 0) {
          lastActivity = new Date(newestMtime).toISOString();
          isActive = (now - newestMtime) < 300000; // 5 minutes
        }
      }
    } catch { /* intentional: phase directory reading is best-effort for progress status */ }

    // Check ROADMAP checkbox status
    const checkboxPattern = new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${phaseNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:\\s]`, 'i');
    const checkboxMatch = content.match(checkboxPattern);
    const roadmapComplete = checkboxMatch ? checkboxMatch[1] === 'x' : false;
    if (roadmapComplete && diskStatus !== 'complete') {
      diskStatus = 'complete';
    }

    phases.push({
      number: phaseNum,
      name: phaseName,
      goal,
      depends_on,
      disk_status: diskStatus,
      has_context: hasContext,
      has_research: hasResearch,
      plan_count: planCount,
      summary_count: summaryCount,
      roadmap_complete: roadmapComplete,
      last_activity: lastActivity,
      is_active: isActive,
    });
  }

  // Compute display names: truncate to keep table aligned
  const MAX_NAME_WIDTH = 20;
  for (const phase of phases) {
    if (phase.name.length > MAX_NAME_WIDTH) {
      phase.display_name = phase.name.slice(0, MAX_NAME_WIDTH - 1) + '…';
    } else {
      phase.display_name = phase.name;
    }
  }

  // Dependency satisfaction: check if all depends_on phases are complete
  const completedNums = new Set(phases.filter(p => p.disk_status === 'complete').map(p => p.number));
  for (const phase of phases) {
    if (!phase.depends_on || /^none$/i.test(phase.depends_on.trim())) {
      phase.deps_satisfied = true;
    } else {
      // Parse "Phase 1, Phase 3" or "1, 3" formats
      const depNums = phase.depends_on.match(/\d+(?:\.\d+)*/g) || [];
      phase.deps_satisfied = depNums.every(n => completedNums.has(n));
      phase.dep_phases = depNums;
    }
  }

  // Compact dependency display for dashboard
  for (const phase of phases) {
    phase.deps_display = (phase.dep_phases && phase.dep_phases.length > 0)
      ? phase.dep_phases.join(',')
      : '—';
  }

  // Sliding window: discuss is sequential — only the first undiscussed phase is available
  let foundNextToDiscuss = false;
  for (const phase of phases) {
    if (!foundNextToDiscuss && (phase.disk_status === 'empty' || phase.disk_status === 'no_directory')) {
      phase.is_next_to_discuss = true;
      foundNextToDiscuss = true;
    } else {
      phase.is_next_to_discuss = false;
    }
  }

  // Check for WAITING.json signal
  let waitingSignal = null;
  try {
    const waitingPath = path.join(cwd, '.planning', 'WAITING.json');
    if (fs.existsSync(waitingPath)) {
      waitingSignal = JSON.parse(fs.readFileSync(waitingPath, 'utf-8'));
    }
  } catch { /* intentional: WAITING.json may not exist or be malformed */ }

  // Compute recommended actions (execute > plan > discuss)
  const recommendedActions = [];
  for (const phase of phases) {
    if (phase.disk_status === 'complete') continue;

    if (phase.disk_status === 'planned' && phase.deps_satisfied) {
      recommendedActions.push({
        phase: phase.number,
        phase_name: phase.name,
        action: 'execute',
        reason: `${phase.plan_count} plans ready, dependencies met`,
        command: `/gsd:execute-phase ${phase.number}`,
      });
    } else if (phase.disk_status === 'discussed' || phase.disk_status === 'researched') {
      recommendedActions.push({
        phase: phase.number,
        phase_name: phase.name,
        action: 'plan',
        reason: 'Context gathered, ready for planning',
        command: `/gsd:plan-phase ${phase.number}`,
      });
    } else if ((phase.disk_status === 'empty' || phase.disk_status === 'no_directory') && phase.is_next_to_discuss) {
      recommendedActions.push({
        phase: phase.number,
        phase_name: phase.name,
        action: 'discuss',
        reason: 'Unblocked, ready to gather context',
        command: `/gsd:discuss-phase ${phase.number}`,
      });
    }
  }

  // Filter recommendations: no parallel execute/plan unless phases are independent
  // Two phases are "independent" if neither depends on the other (directly or transitively)
  const phaseMap = new Map(phases.map(p => [p.number, p]));

  function reaches(from, to, visited = new Set()) {
    if (visited.has(from)) return false;
    visited.add(from);
    const p = phaseMap.get(from);
    if (!p || !p.dep_phases || p.dep_phases.length === 0) return false;
    if (p.dep_phases.includes(to)) return true;
    return p.dep_phases.some(dep => reaches(dep, to, visited));
  }

  function hasDepRelationship(numA, numB) {
    return reaches(numA, numB) || reaches(numB, numA);
  }

  // Detect phases with active work (file modified in last 5 min)
  const activeExecuting = phases.filter(p =>
    p.disk_status === 'partial' ||
    (p.disk_status === 'planned' && p.is_active)
  );
  const activePlanning = phases.filter(p =>
    p.is_active && (p.disk_status === 'discussed' || p.disk_status === 'researched')
  );

  const filteredActions = recommendedActions.filter(action => {
    if (action.action === 'execute' && activeExecuting.length > 0) {
      // Only allow if independent of ALL actively-executing phases
      return activeExecuting.every(active => !hasDepRelationship(action.phase, active.number));
    }
    if (action.action === 'plan' && activePlanning.length > 0) {
      // Only allow if independent of ALL actively-planning phases
      return activePlanning.every(active => !hasDepRelationship(action.phase, active.number));
    }
    return true;
  });

  const completedCount = phases.filter(p => p.disk_status === 'complete').length;
  const result = {
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    phases,
    phase_count: phases.length,
    completed_count: completedCount,
    in_progress_count: phases.filter(p => ['partial', 'planned', 'discussed', 'researched'].includes(p.disk_status)).length,
    recommended_actions: filteredActions,
    waiting_signal: waitingSignal,
    all_complete: completedCount === phases.length && phases.length > 0,
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: true,
    state_exists: true,
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitProgress(cwd, raw) {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  // Analyze phases — filter to current milestone and include ROADMAP-only phases
  const phasesDir = path.join(planningDir(cwd), 'phases');
  const phases = [];
  let currentPhase = null;
  let nextPhase = null;

  // Build set of phases defined in ROADMAP for the current milestone
  const roadmapPhaseNums = new Set();
  const roadmapPhaseNames = new Map();
  try {
    const roadmapContent = extractCurrentMilestone(
      fs.readFileSync(path.join(planningDir(cwd), 'ROADMAP.md'), 'utf-8'), cwd
    );
    const headingPattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
    let hm;
    while ((hm = headingPattern.exec(roadmapContent)) !== null) {
      roadmapPhaseNums.add(hm[1]);
      roadmapPhaseNames.set(hm[1], hm[2].replace(/\(INSERTED\)/i, '').trim());
    }
  } catch { /* intentional: ROADMAP.md may not exist for phase name extraction */ }

  const isDirInMilestone = getMilestonePhaseFilter(cwd);
  const seenPhaseNums = new Set();

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name)
      .filter(isDirInMilestone)
      .sort((a, b) => {
        const pa = a.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
        const pb = b.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
        if (!pa || !pb) return a.localeCompare(b);
        return parseInt(pa[1], 10) - parseInt(pb[1], 10);
      });

    for (const dir of dirs) {
      const match = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
      const phaseNumber = match ? match[1] : dir;
      const phaseName = match && match[2] ? match[2] : null;
      seenPhaseNums.add(phaseNumber.replace(/^0+/, '') || '0');

      const phasePath = path.join(phasesDir, dir);
      const phaseFiles = fs.readdirSync(phasePath);

      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' :
                     hasResearch ? 'researched' : 'pending';

      const phaseInfo = {
        number: phaseNumber,
        name: phaseName,
        directory: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'phases', dir))),
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
        has_research: hasResearch,
      };

      phases.push(phaseInfo);

      // Find current (first incomplete with plans) and next (first pending)
      if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
        currentPhase = phaseInfo;
      }
      if (!nextPhase && status === 'pending') {
        nextPhase = phaseInfo;
      }
    }
  } catch { /* intentional: phases directory may not exist for execute-phase enumeration */ }

  // Add phases defined in ROADMAP but not yet scaffolded to disk
  for (const [num, name] of roadmapPhaseNames) {
    const stripped = num.replace(/^0+/, '') || '0';
    if (!seenPhaseNums.has(stripped)) {
      const phaseInfo = {
        number: num,
        name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        directory: null,
        status: 'not_started',
        plan_count: 0,
        summary_count: 0,
        has_research: false,
      };
      phases.push(phaseInfo);
      if (!nextPhase && !currentPhase) {
        nextPhase = phaseInfo;
      }
    }
  }

  // Re-sort phases by number after adding ROADMAP-only phases
  phases.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

  // Check for paused work
  let pausedAt = null;
  try {
    const state = fs.readFileSync(path.join(planningDir(cwd), 'STATE.md'), 'utf-8');
    const pauseMatch = state.match(/\*\*Paused At:\*\*\s*(.+)/);
    if (pauseMatch) pausedAt = pauseMatch[1].trim();
  } catch { /* intentional: STATE.md may not exist for paused work detection */ }

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),

    // Config
    commit_docs: config.commit_docs,

    // Milestone
    milestone_version: milestone.version,
    milestone_name: milestone.name,

    // Phase overview
    phases,
    phase_count: phases.length,
    completed_count: phases.filter(p => p.status === 'complete').length,
    in_progress_count: phases.filter(p => p.status === 'in_progress').length,

    // Current state
    current_phase: currentPhase,
    next_phase: nextPhase,
    paused_at: pausedAt,
    has_work_in_progress: !!currentPhase,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: fs.existsSync(path.join(planningDir(cwd), 'ROADMAP.md')),
    state_exists: fs.existsSync(path.join(planningDir(cwd), 'STATE.md')),
    // File paths
    state_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'STATE.md'))),
    roadmap_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'ROADMAP.md'))),
    project_path: '.planning/PROJECT.md',
    config_path: toPosixPath(path.relative(cwd, path.join(planningDir(cwd), 'config.json'))),
  };

  output(withProjectRoot(cwd, result), raw);
}

/**
 * Detect child git repos in a directory (one level deep).
 * Returns array of { name, path, has_uncommitted } objects.
 */
function detectChildRepos(dir) {
  const repos = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* intentional: directory may not be readable */ return repos; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const gitDir = path.join(fullPath, '.git');
    if (fs.existsSync(gitDir)) {
      let hasUncommitted = false;
      try {
        const status = execSync('git status --porcelain', { cwd: fullPath, encoding: 'utf8', timeout: 5000 });
        hasUncommitted = status.trim().length > 0;
      } catch { /* intentional: git status check is best-effort for child repo detection */ }
      repos.push({ name: entry.name, path: fullPath, has_uncommitted: hasUncommitted });
    }
  }
  return repos;
}

function cmdInitNewWorkspace(cwd, raw) {
  const homedir = process.env.HOME || require('os').homedir();
  const defaultBase = path.join(homedir, 'gsd-workspaces');

  // Detect child git repos for interactive selection
  const childRepos = detectChildRepos(cwd);

  // Check if git worktree is available
  let worktreeAvailable = false;
  try {
    execSync('git --version', { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
    worktreeAvailable = true;
  } catch { /* intentional: git may not be installed — feature detection */ }

  const result = {
    default_workspace_base: defaultBase,
    child_repos: childRepos,
    child_repo_count: childRepos.length,
    worktree_available: worktreeAvailable,
    is_git_repo: pathExistsInternal(cwd, '.git'),
    cwd_repo_name: path.basename(cwd),
  };

  output(withProjectRoot(cwd, result), raw);
}

function cmdInitListWorkspaces(cwd, raw) {
  const homedir = process.env.HOME || require('os').homedir();
  const defaultBase = path.join(homedir, 'gsd-workspaces');

  const workspaces = [];
  if (fs.existsSync(defaultBase)) {
    let entries;
    try { entries = fs.readdirSync(defaultBase, { withFileTypes: true }); } catch { /* intentional: workspace base directory may not be readable */ entries = []; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const wsPath = path.join(defaultBase, entry.name);
      const manifestPath = path.join(wsPath, 'WORKSPACE.md');
      if (!fs.existsSync(manifestPath)) continue;

      let repoCount = 0;
      let hasProject = false;
      let strategy = 'unknown';
      try {
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        const strategyMatch = manifest.match(/^Strategy:\s*(.+)$/m);
        if (strategyMatch) strategy = strategyMatch[1].trim();
        // Count table rows (lines starting with |, excluding header and separator)
        const tableRows = manifest.split('\n').filter(l => l.match(/^\|\s*\w/) && !l.includes('Repo') && !l.includes('---'));
        repoCount = tableRows.length;
      } catch { /* intentional: workspace manifest parsing is best-effort */ }
      hasProject = fs.existsSync(path.join(wsPath, '.planning', 'PROJECT.md'));

      workspaces.push({
        name: entry.name,
        path: wsPath,
        repo_count: repoCount,
        strategy,
        has_project: hasProject,
      });
    }
  }

  const result = {
    workspace_base: defaultBase,
    workspaces,
    workspace_count: workspaces.length,
  };

  output(result, raw);
}

function cmdInitRemoveWorkspace(cwd, name, raw) {
  const homedir = process.env.HOME || require('os').homedir();
  const defaultBase = path.join(homedir, 'gsd-workspaces');

  if (!name) {
    error('workspace name required for init remove-workspace');
  }

  const wsPath = path.join(defaultBase, name);
  const manifestPath = path.join(wsPath, 'WORKSPACE.md');

  if (!fs.existsSync(wsPath)) {
    error(`Workspace not found: ${wsPath}`);
  }

  // Parse manifest for repo info
  const repos = [];
  let strategy = 'unknown';
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = fs.readFileSync(manifestPath, 'utf8');
      const strategyMatch = manifest.match(/^Strategy:\s*(.+)$/m);
      if (strategyMatch) strategy = strategyMatch[1].trim();

      // Parse table rows for repo names and source paths
      const lines = manifest.split('\n');
      for (const line of lines) {
        const match = line.match(/^\|\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|$/);
        if (match && match[1] !== 'Repo' && !match[1].includes('---')) {
          repos.push({ name: match[1], source: match[2], branch: match[3], strategy: match[4] });
        }
      }
    } catch { /* intentional: workspace manifest table parsing is best-effort */ }
  }

  // Check for uncommitted changes in workspace repos
  const dirtyRepos = [];
  for (const repo of repos) {
    const repoPath = path.join(wsPath, repo.name);
    if (!fs.existsSync(repoPath)) continue;
    try {
      const status = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
      if (status.trim().length > 0) {
        dirtyRepos.push(repo.name);
      }
    } catch { /* intentional: git status in workspace repo is best-effort */ }
  }

  const result = {
    workspace_name: name,
    workspace_path: wsPath,
    has_manifest: fs.existsSync(manifestPath),
    strategy,
    repos,
    repo_count: repos.length,
    dirty_repos: dirtyRepos,
    has_dirty_repos: dirtyRepos.length > 0,
  };

  output(result, raw);
}

// ─── Skill extensibility ─────────────────────────────────────────────────────

/**
 * Parse SKILL.md frontmatter into structured metadata.
 *
 * @param {string} skillMdPath - Absolute path to SKILL.md
 * @returns {object} Parsed metadata with name, description, version, allowedTools, skills, model, userInvocable, raw
 */
function parseSkillMetadata(skillMdPath) {
  let content;
  try {
    content = fs.readFileSync(skillMdPath, 'utf-8');
  } catch (e) {
    return { error: `Cannot read ${skillMdPath}: ${e.code || e.message}` };
  }

  const raw = extractFrontmatter(content);

  // Map frontmatter fields to structured metadata
  const meta = {
    name: raw.name || undefined,
    description: raw.description || undefined,
    version: raw.version || undefined,
    allowedTools: undefined,
    skills: undefined,
    model: raw.model || undefined,
    userInvocable: undefined,
    raw,
  };

  // allowed-tools: comma-separated string → array
  const allowedTools = raw['allowed-tools'];
  if (typeof allowedTools === 'string') {
    meta.allowedTools = allowedTools.split(/,\s*/).map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(allowedTools)) {
    meta.allowedTools = allowedTools;
  }

  // skills: comma-separated string → array
  const skills = raw.skills;
  if (typeof skills === 'string') {
    meta.skills = skills.split(/,\s*/).map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(skills)) {
    meta.skills = skills;
  }

  // user-invocable: parse as boolean
  const userInvocable = raw['user-invocable'];
  if (userInvocable !== undefined) {
    meta.userInvocable = userInvocable === 'true' || userInvocable === true;
  }

  return meta;
}

/**
 * Discover SKILL.md files across standard skill directories.
 *
 * Scans:
 *   1. {projectRoot}/.claude/skills/STAR/SKILL.md
 *   2. {projectRoot}/skills/STAR/SKILL.md
 *   3. {projectRoot}/plugins/STAR/skills/STAR/SKILL.md
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Array<{path: string, name: string, metadata: object}>}
 */
function discoverSkills(projectRoot) {
  const results = [];

  // Helper: scan a directory for subdirs containing SKILL.md
  function scanDir(baseDir, relativePrefixFn) {
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillMd = path.join(baseDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          results.push({
            path: relativePrefixFn(entry.name),
            name: entry.name,
            metadata: parseSkillMetadata(skillMd),
          });
        }
      }
    } catch (e) {
      // Directory doesn't exist or isn't readable — skip silently
    }
  }

  // 1. .claude/skills/*/SKILL.md
  scanDir(path.join(projectRoot, '.claude', 'skills'), (name) => `.claude/skills/${name}`);

  // 2. skills/*/SKILL.md
  scanDir(path.join(projectRoot, 'skills'), (name) => `skills/${name}`);

  // 3. plugins/*/skills/*/SKILL.md
  try {
    const pluginsDir = path.join(projectRoot, 'plugins');
    const pluginEntries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const pluginEntry of pluginEntries) {
      if (!pluginEntry.isDirectory()) continue;
      const pluginSkillsDir = path.join(pluginsDir, pluginEntry.name, 'skills');
      scanDir(pluginSkillsDir, (name) => `plugins/${pluginEntry.name}/skills/${name}`);
    }
  } catch (e) {
    // plugins/ doesn't exist — skip silently
  }

  return results;
}

/**
 * Resolve skill composition: follow the `skills` field in frontmatter to
 * build a dependency tree of skill paths.
 *
 * @param {string} skillPath - Absolute path to the SKILL.md to resolve
 * @param {string} projectRoot - Absolute path to project root
 * @returns {object} { resolved: string[], unresolved: string[] } or { error: string }
 */
function resolveSkillComposition(skillPath, projectRoot) {
  const allSkills = discoverSkills(projectRoot);
  const nameToPath = {};
  for (const s of allSkills) {
    nameToPath[s.name] = path.join(projectRoot, s.path, 'SKILL.md');
  }

  const resolved = [];
  const unresolved = [];
  const visited = new Set();

  function resolve(currentPath, depth) {
    if (depth > 3) return; // Depth limit
    if (visited.has(currentPath)) return { error: 'circular' };
    visited.add(currentPath);

    const meta = parseSkillMetadata(currentPath);
    if (meta.error || !meta.skills || meta.skills.length === 0) return null;

    for (const depName of meta.skills) {
      const depPath = nameToPath[depName];
      if (!depPath) {
        if (!unresolved.includes(depName)) unresolved.push(depName);
        continue;
      }

      // Circular detection
      if (visited.has(depPath)) {
        return { error: 'circular' };
      }

      if (!resolved.includes(depPath)) {
        resolved.push(depPath);
      }

      const sub = resolve(depPath, depth + 1);
      if (sub && sub.error) return sub;
    }
    return null;
  }

  const err = resolve(skillPath, 0);
  if (err && err.error) return err;

  return { resolved, unresolved };
}

/**
 * Query discovered skills with optional filters.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @param {object} filter - Optional filter: { name, hasVersion, userInvocable }
 * @returns {Array} Filtered skill discovery results
 */
function querySkills(projectRoot, filter) {
  let skills = discoverSkills(projectRoot);
  if (!filter || Object.keys(filter).length === 0) return skills;

  if (filter.name) {
    skills = skills.filter(s => s.name.includes(filter.name));
  }

  if (filter.hasVersion !== undefined) {
    const wantVersion = filter.hasVersion === 'true' || filter.hasVersion === true;
    skills = skills.filter(s => {
      const has = !!(s.metadata && s.metadata.version);
      return wantVersion ? has : !has;
    });
  }

  if (filter.userInvocable !== undefined) {
    const want = filter.userInvocable === 'true' || filter.userInvocable === true;
    skills = skills.filter(s => {
      return s.metadata && s.metadata.userInvocable === want;
    });
  }

  return skills;
}

/**
 * Audit skills: cross-reference discovered skills with config references.
 *
 * @param {string} cwd - Project root (used to load config and discover skills)
 * @returns {object} { orphaned, missing, broken_refs, total_discovered, total_configured }
 */
function auditSkills(cwd) {
  const config = loadConfig(cwd);
  const discovered = discoverSkills(cwd);
  const discoveredPaths = new Set(discovered.map(s => s.path));

  // Collect all configured skill path references across all agent types
  const configuredPaths = new Set();
  if (config && config.agent_skills) {
    for (const agentType of Object.keys(config.agent_skills)) {
      let paths = config.agent_skills[agentType];
      if (typeof paths === 'string') paths = [paths];
      if (Array.isArray(paths)) {
        for (const p of paths) {
          if (typeof p === 'string') configuredPaths.add(p);
        }
      }
    }
  }

  // Orphaned: on disk but not in any config reference
  const orphaned = discovered
    .filter(s => !configuredPaths.has(s.path))
    .map(s => s.path);

  // Missing: in config but SKILL.md not found on disk
  const missing = [];
  for (const cfgPath of configuredPaths) {
    const skillMdPath = path.join(cwd, cfgPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      missing.push(cfgPath);
    }
  }

  // Broken refs: skills whose `skills` composition field references non-existent skills
  const brokenRefs = [];
  for (const s of discovered) {
    if (s.metadata && s.metadata.skills && Array.isArray(s.metadata.skills)) {
      const discoveredNames = new Set(discovered.map(d => d.name));
      for (const ref of s.metadata.skills) {
        if (!discoveredNames.has(ref)) {
          brokenRefs.push({ skill: s.path, missing_ref: ref });
        }
      }
    }
  }

  return {
    orphaned,
    missing,
    broken_refs: brokenRefs,
    total_discovered: discovered.length,
    total_configured: configuredPaths.size,
  };
}

/**
 * Command: audit-skills — report orphaned, missing, and broken skill refs.
 */
function cmdAuditSkills(cwd, raw) {
  const result = auditSkills(cwd);
  output(result, raw);
}

/**
 * Validate skill metadata against quality rules.
 *
 * @param {object} metadata - Parsed metadata object (from parseSkillMetadata)
 * @returns {object} { valid: boolean, warnings: [...], errors: [...] }
 */
function validateSkillMetadata(metadata) {
  const errors = [];
  const warnings = [];

  if (!metadata || metadata.error) {
    errors.push(metadata ? metadata.error : 'No metadata provided');
    return { valid: false, warnings, errors };
  }

  // Required: name
  if (!metadata.name) {
    errors.push('Missing required field: name');
  } else {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(metadata.name)) {
      errors.push(`Invalid name format: "${metadata.name}" — must be lowercase alphanumeric with hyphens, starting with alphanumeric`);
    }
    if (metadata.name.length > 64) {
      errors.push(`Name too long: ${metadata.name.length} chars (max 64)`);
    }
  }

  // Required: description
  if (!metadata.description) {
    errors.push('Missing required field: description');
  } else {
    if (metadata.description.length > 1024) {
      errors.push(`Description too long: ${metadata.description.length} chars (max 1024)`);
    }
    if (metadata.description.length < 20) {
      warnings.push(`Description is short: ${metadata.description.length} chars (recommend >= 20)`);
    }
  }

  // Optional warning: missing version
  if (!metadata.version) {
    warnings.push('Missing version field — consider adding for tracking');
  }

  return { valid: errors.length === 0, warnings, errors };
}

/**
 * Validate skill file structure on disk.
 *
 * @param {string} skillPath - Relative path to skill directory (e.g., "skills/my-skill")
 * @param {string} projectRoot - Absolute path to project root
 * @returns {object} { valid: boolean, warnings: [...], errors: [...], files: [...] }
 */
function validateSkillStructure(skillPath, projectRoot) {
  const errors = [];
  const warnings = [];
  const files = [];
  const absDir = path.join(projectRoot, skillPath);
  const skillMd = path.join(absDir, 'SKILL.md');

  // Check SKILL.md exists
  if (!fs.existsSync(skillMd)) {
    errors.push(`SKILL.md not found at ${skillPath}/SKILL.md`);
    return { valid: false, warnings, errors, files };
  }

  // Check SKILL.md is readable and non-empty
  let content;
  try {
    content = fs.readFileSync(skillMd, 'utf-8');
  } catch (e) {
    errors.push(`SKILL.md not readable: ${e.message}`);
    return { valid: false, warnings, errors, files };
  }

  if (content.trim().length === 0) {
    errors.push('SKILL.md is empty');
    return { valid: false, warnings, errors, files };
  }

  files.push('SKILL.md');

  // Check file size (warn if > 50KB)
  const stats = fs.statSync(skillMd);
  if (stats.size > 50 * 1024) {
    warnings.push(`SKILL.md is large: ${Math.round(stats.size / 1024)}KB (recommend < 50KB)`);
  }

  // Check for supporting files
  try {
    const entries = fs.readdirSync(absDir);
    for (const f of entries) {
      if (f !== 'SKILL.md') files.push(f);
    }
  } catch { /* intentionally empty */ }

  return { valid: errors.length === 0, warnings, errors, files };
}

/**
 * Command: validate-skill — run metadata and structure validation.
 */
function cmdValidateSkill(cwd, skillPath, raw) {
  if (!skillPath) {
    error('skill path required for validate-skill');
  }

  const skillMdPath = path.join(cwd, skillPath, 'SKILL.md');
  const metadata = parseSkillMetadata(skillMdPath);
  const metaResult = validateSkillMetadata(metadata);
  const structResult = validateSkillStructure(skillPath, cwd);

  const combined = {
    skill_path: skillPath,
    valid: metaResult.valid && structResult.valid,
    metadata_errors: metaResult.errors,
    metadata_warnings: metaResult.warnings,
    structure_errors: structResult.errors,
    structure_warnings: structResult.warnings,
    files: structResult.files,
  };

  output(combined, raw);

  // Exit code 1 if errors found
  if (!combined.valid) {
    process.exitCode = 1;
  }
}

/**
 * Check skill version drift between config pinned versions and on-disk metadata.
 *
 * @param {string} cwd - Project root
 * @returns {object} { matches, drifts, unversioned, missing_version }
 */
function checkSkillVersions(cwd) {
  const config = loadConfig(cwd);
  const matches = [];
  const drifts = [];
  const unversioned = [];
  const missingVersion = [];

  if (!config || !config.agent_skills) {
    return { matches, drifts, unversioned, missing_version: missingVersion };
  }

  for (const agentType of Object.keys(config.agent_skills)) {
    let paths = config.agent_skills[agentType];
    if (typeof paths === 'string') paths = [paths];
    if (!Array.isArray(paths)) continue;

    for (const ref of paths) {
      if (typeof ref !== 'string') continue;

      // Parse path@version
      const atIdx = ref.indexOf('@');
      if (atIdx === -1 || atIdx === ref.length - 1) {
        unversioned.push({ agent_type: agentType, ref });
        continue;
      }

      const skillPath = ref.slice(0, atIdx);
      const expectedVersion = ref.slice(atIdx + 1);

      if (!expectedVersion) {
        unversioned.push({ agent_type: agentType, ref });
        continue;
      }

      // Read actual version from SKILL.md
      const skillMdPath = path.join(cwd, skillPath, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) {
        drifts.push({ agent_type: agentType, ref, error: 'SKILL.md not found' });
        continue;
      }

      const meta = parseSkillMetadata(skillMdPath);
      if (!meta.version) {
        missingVersion.push({ agent_type: agentType, ref, skill_path: skillPath, expected: expectedVersion });
        continue;
      }

      if (meta.version === expectedVersion) {
        matches.push({ agent_type: agentType, ref, skill_path: skillPath, version: expectedVersion });
      } else {
        drifts.push({ agent_type: agentType, ref, skill_path: skillPath, expected: expectedVersion, actual: meta.version });
      }
    }
  }

  return { matches, drifts, unversioned, missing_version: missingVersion };
}

/**
 * Command: check-skill-versions — report version drift.
 */
function cmdCheckSkillVersions(cwd, raw) {
  const result = checkSkillVersions(cwd);
  output(result, raw);
}

/**
 * Build a formatted agent skills block for injection into Task() prompts.
 *
 * Reads `config.agent_skills[agentType]` and validates each skill path exists
 * within the project root. Returns a formatted `<agent_skills>` block or empty
 * string if no skills are configured.
 *
 * @param {object} config - Loaded project config
 * @param {string} agentType - The agent type (e.g., 'gsd-executor', 'gsd-planner')
 * @param {string} projectRoot - Absolute path to project root (for path validation)
 * @returns {string} Formatted skills block or empty string
 */
function buildAgentSkillsBlock(config, agentType, projectRoot) {
  const { validatePath } = require('./security.cjs');

  if (!config || !config.agent_skills || !agentType) return '';

  let skillPaths = config.agent_skills[agentType];
  if (!skillPaths) return '';

  // Normalize single string to array
  if (typeof skillPaths === 'string') skillPaths = [skillPaths];
  if (!Array.isArray(skillPaths) || skillPaths.length === 0) return '';

  const featureFlags = createFeatureFlags(config);
  const doValidation = featureFlags.isEnabled('skill_validation');

  const validPaths = [];
  for (const ref of skillPaths) {
    if (typeof ref !== 'string') continue;

    // Parse path@version syntax (Plan 20-03)
    let skillPath = ref;
    let expectedVersion = null;
    const atIdx = ref.indexOf('@');
    if (atIdx > 0 && atIdx < ref.length - 1) {
      skillPath = ref.slice(0, atIdx);
      expectedVersion = ref.slice(atIdx + 1);
    }

    // Validate path safety — must resolve within project root
    const pathCheck = validatePath(skillPath, projectRoot);
    if (!pathCheck.safe) {
      process.stderr.write(`[agent-skills] WARNING: Skipping unsafe path "${skillPath}": ${pathCheck.error}\n`);
      continue;
    }

    // Check that the skill directory and SKILL.md exist
    const skillMdPath = path.join(projectRoot, skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      process.stderr.write(`[agent-skills] WARNING: Skill not found at "${skillPath}/SKILL.md" — skipping\n`);
      continue;
    }

    // Version drift check (Plan 20-03)
    if (expectedVersion) {
      const meta = parseSkillMetadata(skillMdPath);
      if (meta.version && meta.version !== expectedVersion) {
        process.stderr.write(`[agent-skills] WARNING: Version drift for "${skillPath}": expected ${expectedVersion}, found ${meta.version}\n`);
      }
    }

    // Feature-flagged validation (Plan 20-04)
    if (doValidation) {
      const meta = parseSkillMetadata(skillMdPath);
      const valResult = validateSkillMetadata(meta);
      for (const w of valResult.warnings) {
        process.stderr.write(`[agent-skills] VALIDATION WARNING (${skillPath}): ${w}\n`);
      }
      for (const e of valResult.errors) {
        process.stderr.write(`[agent-skills] VALIDATION ERROR (${skillPath}): ${e}\n`);
      }
    }

    validPaths.push(skillPath);
  }

  if (validPaths.length === 0) return '';

  const lines = validPaths.map(p => `- @${p}/SKILL.md`).join('\n');
  return `<agent_skills>\nRead these user-configured skills:\n${lines}\n</agent_skills>`;
}

/**
 * Command: output the agent skills block for a given agent type.
 * Used by workflows: SKILLS=$(node "$TOOLS" agent-skills gsd-executor 2>/dev/null)
 */
function cmdAgentSkills(cwd, agentType, raw) {
  if (!agentType) {
    // No agent type — output empty string silently
    output('', raw, '');
    return;
  }

  const config = loadConfig(cwd);
  const block = buildAgentSkillsBlock(config, agentType, cwd);
  // Output raw text (not JSON) so workflows can embed it directly
  if (block) {
    process.stdout.write(block);
  }
  process.exit(0);
}

module.exports = {
  cmdInitExecutePhase,
  cmdInitPlanPhase,
  cmdInitNewProject,
  cmdInitNewMilestone,
  cmdInitQuick,
  cmdInitResume,
  cmdInitVerifyWork,
  cmdInitPhaseOp,
  cmdInitTodos,
  cmdInitMilestoneOp,
  cmdInitMapCodebase,
  cmdInitProgress,
  cmdInitManager,
  cmdInitNewWorkspace,
  cmdInitListWorkspaces,
  cmdInitRemoveWorkspace,
  detectChildRepos,
  buildAgentSkillsBlock,
  cmdAgentSkills,
  parseSkillMetadata,
  discoverSkills,
  resolveSkillComposition,
  querySkills,
  auditSkills,
  cmdAuditSkills,
  validateSkillMetadata,
  validateSkillStructure,
  cmdValidateSkill,
  checkSkillVersions,
  cmdCheckSkillVersions,
};
