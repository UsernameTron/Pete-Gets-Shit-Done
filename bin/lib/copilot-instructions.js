const fs = require('fs');

// Copilot instructions marker constants
const GSD_COPILOT_INSTRUCTIONS_MARKER = '<!-- GSD Configuration \u2014 managed by get-shit-done installer -->';
const GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER = '<!-- /GSD Configuration -->';

/**
 * Merge GSD instructions into copilot-instructions.md.
 * Three cases: new file, existing with markers, existing without markers.
 * @param {string} filePath - Full path to copilot-instructions.md
 * @param {string} gsdContent - Template content (without markers)
 */
function mergeCopilotInstructions(filePath, gsdContent) {
  const gsdBlock = GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
    gsdContent.trim() + '\n' +
    GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER;

  // Case 1: No file — create fresh
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, gsdBlock + '\n');
    return;
  }

  const existing = fs.readFileSync(filePath, 'utf8');
  const openIndex = existing.indexOf(GSD_COPILOT_INSTRUCTIONS_MARKER);
  const closeIndex = existing.indexOf(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER);

  // Case 2: Has GSD markers — replace between markers
  if (openIndex !== -1 && closeIndex !== -1) {
    const before = existing.substring(0, openIndex).trimEnd();
    const after = existing.substring(closeIndex + GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER.length).trimStart();
    let newContent = '';
    if (before) newContent += before + '\n\n';
    newContent += gsdBlock;
    if (after) newContent += '\n\n' + after;
    newContent += '\n';
    fs.writeFileSync(filePath, newContent);
    return;
  }

  // Case 3: No markers — append at end
  const content = existing.trimEnd() + '\n\n' + gsdBlock + '\n';
  fs.writeFileSync(filePath, content);
}

/**
 * Strip GSD section from copilot-instructions.md content.
 * Returns cleaned content, or null if file should be deleted (was GSD-only).
 * @param {string} content - File content
 * @returns {string|null} - Cleaned content or null if empty
 */
function stripGsdFromCopilotInstructions(content) {
  const openIndex = content.indexOf(GSD_COPILOT_INSTRUCTIONS_MARKER);
  const closeIndex = content.indexOf(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER);

  if (openIndex !== -1 && closeIndex !== -1) {
    const before = content.substring(0, openIndex).trimEnd();
    const after = content.substring(closeIndex + GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER.length).trimStart();
    const cleaned = (before + (before && after ? '\n\n' : '') + after).trim();
    if (!cleaned) return null;
    return cleaned + '\n';
  }

  // No markers found — nothing to strip
  return content;
}

module.exports = {
  GSD_COPILOT_INSTRUCTIONS_MARKER,
  GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER,
  mergeCopilotInstructions,
  stripGsdFromCopilotInstructions,
};
