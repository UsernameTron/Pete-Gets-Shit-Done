const { detectLineEnding, findTomlCommentStart } = require('./toml-lexer');
const { findTomlAssignmentBlockEnd, findTomlAssignmentEquals, getTomlLineRecords, getTomlTableSections, removeContentRanges } = require('./toml');

// Codex config.toml constants
const GSD_CODEX_MARKER = '# GSD Agent Configuration \u2014 managed by get-shit-done installer';
const GSD_CODEX_HOOKS_OWNERSHIP_PREFIX = '# GSD codex_hooks ownership: ';

function stripCodexHooksFeatureAssignments(content, ownership = null) {
  const lineRecords = getTomlLineRecords(content);
  const tableSections = getTomlTableSections(content);
  const removalRanges = [];
  const featuresSection = tableSections.find((section) => !section.array && section.path === 'features');
  const shouldStripSectionKey = ownership === 'section' || ownership === 'all';
  const shouldStripRootDottedKey = ownership === 'root_dotted' || ownership === 'all';

  if (featuresSection && shouldStripSectionKey) {
    const sectionRecords = lineRecords.filter((record) =>
      !record.tableHeader &&
      record.start >= featuresSection.headerEnd &&
      record.end + record.eol.length <= featuresSection.end
    );

    const codexHookRecords = sectionRecords.filter((record) =>
      !record.startsInMultilineString &&
      record.keySegments &&
      record.keySegments.length === 1 &&
      record.keySegments[0] === 'codex_hooks'
    );

    for (const record of codexHookRecords) {
      removalRanges.push({
        start: record.start,
        end: findTomlAssignmentBlockEnd(content, record),
      });
    }

    if (codexHookRecords.length > 0) {
      const removedStarts = new Set(codexHookRecords.map((record) => record.start));
      const hasRemainingContent = sectionRecords.some((record) => {
        if (removedStarts.has(record.start)) {
          return false;
        }

        const trimmed = record.text.trim();
        return trimmed !== '' && !trimmed.startsWith('#');
      });
      const hasRemainingComments = sectionRecords.some((record) => {
        if (removedStarts.has(record.start)) {
          return false;
        }

        return record.text.trim().startsWith('#');
      });

      if (!hasRemainingContent && !hasRemainingComments) {
        removalRanges.push({
          start: featuresSection.start,
          end: featuresSection.end,
        });
      }
    }
  }

  if (shouldStripRootDottedKey) {
    const rootCodexHookRecords = lineRecords.filter((record) =>
      !record.tableHeader &&
      !record.startsInMultilineString &&
      record.tablePath === null &&
      record.keySegments &&
      record.keySegments.length === 2 &&
      record.keySegments[0] === 'features' &&
      record.keySegments[1] === 'codex_hooks'
    );

    for (const record of rootCodexHookRecords) {
      removalRanges.push({
        start: record.start,
        end: findTomlAssignmentBlockEnd(content, record),
      });
    }
  }

  return removeContentRanges(content, removalRanges);
}

function getManagedCodexHooksOwnership(content) {
  const markerIndex = content.indexOf(GSD_CODEX_MARKER);
  if (markerIndex === -1) {
    return null;
  }

  const afterMarker = content.slice(markerIndex + GSD_CODEX_MARKER.length);
  const match = afterMarker.match(/^\r?\n# GSD codex_hooks ownership: (section|root_dotted)\r?\n/);
  return match ? match[1] : null;
}

function setManagedCodexHooksOwnership(content, ownership) {
  const markerIndex = content.indexOf(GSD_CODEX_MARKER);
  if (markerIndex === -1) {
    return content;
  }

  const eol = detectLineEnding(content);
  const markerEnd = markerIndex + GSD_CODEX_MARKER.length;
  const afterMarker = content.slice(markerEnd);
  const normalizedAfterMarker = afterMarker.replace(
    /^\r?\n# GSD codex_hooks ownership: (?:section|root_dotted)\r?\n/,
    eol
  );

  if (!ownership) {
    return content.slice(0, markerEnd) + normalizedAfterMarker;
  }

  const remainder = normalizedAfterMarker.replace(/^\r?\n/, '');
  return content.slice(0, markerEnd) +
    eol +
    `${GSD_CODEX_HOOKS_OWNERSHIP_PREFIX}${ownership}${eol}` +
    remainder;
}

function normalizeCodexHooksLine(line, key) {
  const leadingWhitespace = line.match(/^\s*/)[0];
  const commentStart = findTomlCommentStart(line);
  const comment = commentStart === -1 ? '' : line.slice(commentStart);
  return `${leadingWhitespace}${key} = true${comment ? ` ${comment}` : ''}`;
}

function rewriteTomlKeyLines(content, matches, key) {
  if (matches.length === 0) {
    return content;
  }

  let rewritten = '';
  let cursor = 0;

  matches.forEach((match, index) => {
    rewritten += content.slice(cursor, match.start);
    if (index === 0) {
      const blockEnd = findTomlAssignmentBlockEnd(content, match);
      const blockEol = blockEnd > 0 && content[blockEnd - 1] === '\n'
        ? (blockEnd > 1 && content[blockEnd - 2] === '\r' ? '\r\n' : '\n')
        : '';
      rewritten += normalizeCodexHooksLine(match.text, match.keyRaw || key) + blockEol;
      cursor = blockEnd;
      return;
    }
    cursor = findTomlAssignmentBlockEnd(content, match);
  });

  rewritten += content.slice(cursor);
  return rewritten;
}

function ensureCodexHooksFeature(configContent) {
  const eol = detectLineEnding(configContent);
  const lineRecords = getTomlLineRecords(configContent);

  const featuresSection = getTomlTableSections(configContent)
    .find((section) => !section.array && section.path === 'features');

  if (featuresSection) {
    const sectionLines = lineRecords
      .filter((record) =>
        !record.tableHeader &&
        !record.startsInMultilineString &&
        record.tablePath === 'features' &&
        record.start >= featuresSection.headerEnd &&
        record.end + record.eol.length <= featuresSection.end &&
        record.keySegments &&
        record.keySegments.length === 1 &&
        record.keySegments[0] === 'codex_hooks'
      );

    if (sectionLines.length > 0) {
      return {
        content: rewriteTomlKeyLines(configContent, sectionLines, 'codex_hooks'),
        ownership: null,
      };
    }

    const sectionBody = configContent.slice(featuresSection.headerEnd, featuresSection.end);
    const needsSeparator = sectionBody.length > 0 && !sectionBody.endsWith('\n') && !sectionBody.endsWith('\r\n');
    const insertPrefix = sectionBody.length === 0 && featuresSection.headerEnd === configContent.length ? eol : '';
    const insertText = `${insertPrefix}${needsSeparator ? eol : ''}codex_hooks = true${eol}`;
    return {
      content: configContent.slice(0, featuresSection.end) + insertText + configContent.slice(featuresSection.end),
      ownership: 'section',
    };
  }

  const rootFeatureLines = lineRecords
    .filter((record) =>
      !record.tableHeader &&
      !record.startsInMultilineString &&
      record.tablePath === null &&
      record.keySegments &&
      record.keySegments[0] === 'features'
    );

  const rootCodexHooksLines = rootFeatureLines
    .filter((record) => record.keySegments.length === 2 && record.keySegments[1] === 'codex_hooks');

  if (rootCodexHooksLines.length > 0) {
    return {
      content: rewriteTomlKeyLines(configContent, rootCodexHooksLines, 'features.codex_hooks'),
      ownership: null,
    };
  }

  const rootFeaturesValueLines = rootFeatureLines
    .filter((record) => record.keySegments.length === 1);

  if (rootFeaturesValueLines.length > 0) {
    return { content: configContent, ownership: null };
  }

  if (rootFeatureLines.length > 0) {
    const lastFeatureLine = rootFeatureLines[rootFeatureLines.length - 1];
    const insertAt = findTomlAssignmentBlockEnd(configContent, lastFeatureLine);
    const prefix = insertAt > 0 && configContent[insertAt - 1] === '\n' ? '' : eol;
    return {
      content: configContent.slice(0, insertAt) +
        `${prefix}features.codex_hooks = true${eol}` +
        configContent.slice(insertAt),
      ownership: 'root_dotted',
    };
  }

  const featuresBlock = `[features]${eol}codex_hooks = true${eol}`;
  if (!configContent) {
    return { content: featuresBlock, ownership: 'section' };
  }
  // Insert [features] before the first table header, preserving bare top-level keys.
  // Prepending would trap them under [features] where Codex expects only booleans (#1202).
  const firstTableHeader = lineRecords.find(r => r.tableHeader);
  if (firstTableHeader) {
    const before = configContent.slice(0, firstTableHeader.start);
    const after = configContent.slice(firstTableHeader.start);
    const needsGap = before.length > 0 && !before.endsWith(eol + eol);
    return {
      content: before + (needsGap ? eol : '') + featuresBlock + eol + after,
      ownership: 'section',
    };
  }
  // No table headers — append [features] after top-level keys
  const needsGap = configContent.length > 0 && !configContent.endsWith(eol + eol);
  return { content: configContent + (needsGap ? eol : '') + featuresBlock, ownership: 'section' };
}

function hasEnabledCodexHooksFeature(configContent) {
  const lineRecords = getTomlLineRecords(configContent);

  return lineRecords.some((record) => {
    if (record.tableHeader || record.startsInMultilineString || !record.keySegments) {
      return false;
    }

    const isSectionKey = record.tablePath === 'features' &&
      record.keySegments.length === 1 &&
      record.keySegments[0] === 'codex_hooks';
    const isRootDottedKey = record.tablePath === null &&
      record.keySegments.length === 2 &&
      record.keySegments[0] === 'features' &&
      record.keySegments[1] === 'codex_hooks';

    if (!isSectionKey && !isRootDottedKey) {
      return false;
    }

    const equalsIndex = findTomlAssignmentEquals(record.text);
    if (equalsIndex === -1) {
      return false;
    }

    const commentStart = findTomlCommentStart(record.text);
    const valueText = record.text.slice(equalsIndex + 1, commentStart === -1 ? record.text.length : commentStart).trim();
    return valueText === 'true';
  });
}

module.exports = {
  GSD_CODEX_MARKER,
  stripCodexHooksFeatureAssignments,
  getManagedCodexHooksOwnership,
  setManagedCodexHooksOwnership,
  ensureCodexHooksFeature,
  hasEnabledCodexHooksFeature,
};
