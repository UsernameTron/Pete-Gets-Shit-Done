function detectLineEnding(content) {
  const firstNewlineIndex = content.indexOf('\n');
  if (firstNewlineIndex === -1) {
    return '\n';
  }
  return firstNewlineIndex > 0 && content[firstNewlineIndex - 1] === '\r' ? '\r\n' : '\n';
}

function splitTomlLines(content) {
  const lines = [];
  let start = 0;

  while (start < content.length) {
    const newlineIndex = content.indexOf('\n', start);
    if (newlineIndex === -1) {
      lines.push({
        start,
        end: content.length,
        text: content.slice(start),
        eol: '',
      });
      break;
    }

    const hasCr = newlineIndex > start && content[newlineIndex - 1] === '\r';
    const end = hasCr ? newlineIndex - 1 : newlineIndex;
    lines.push({
      start,
      end,
      text: content.slice(start, end),
      eol: hasCr ? '\r\n' : '\n',
    });
    start = newlineIndex + 1;
  }

  return lines;
}

function findTomlCommentStart(line) {
  let i = 0;
  let multilineState = null;

  while (i < line.length) {
    if (multilineState === 'literal') {
      const closeIndex = line.indexOf('\'\'\'', i);
      if (closeIndex === -1) {
        return -1;
      }
      i = closeIndex + 3;
      multilineState = null;
      continue;
    }

    if (multilineState === 'basic') {
      const closeIndex = findMultilineBasicStringClose(line, i);
      if (closeIndex === -1) {
        return -1;
      }
      i = closeIndex + 3;
      multilineState = null;
      continue;
    }

    const ch = line[i];

    if (ch === '#') {
      return i;
    }

    if (ch === '\'') {
      if (line.startsWith('\'\'\'', i)) {
        multilineState = 'literal';
        i += 3;
        continue;
      }
      const close = line.indexOf('\'', i + 1);
      if (close === -1) return -1;
      i = close + 1;
      continue;
    }

    if (ch === '"') {
      if (line.startsWith('"""', i)) {
        multilineState = 'basic';
        i += 3;
        continue;
      }
      i += 1;
      while (i < line.length) {
        if (line[i] === '\\') {
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    i += 1;
  }

  return -1;
}

function isEscapedInBasicString(line, index) {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && line[cursor] === '\\') {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
}

function findMultilineBasicStringClose(line, startIndex) {
  let searchIndex = startIndex;

  while (searchIndex < line.length) {
    const closeIndex = line.indexOf('"""', searchIndex);
    if (closeIndex === -1) {
      return -1;
    }
    if (!isEscapedInBasicString(line, closeIndex)) {
      return closeIndex;
    }
    searchIndex = closeIndex + 1;
  }

  return -1;
}

function advanceTomlMultilineStringState(line, multilineState) {
  let i = 0;
  let state = multilineState;

  while (i < line.length) {
    if (state === 'literal') {
      const closeIndex = line.indexOf('\'\'\'', i);
      if (closeIndex === -1) {
        return state;
      }
      i = closeIndex + 3;
      state = null;
      continue;
    }

    if (state === 'basic') {
      const closeIndex = findMultilineBasicStringClose(line, i);
      if (closeIndex === -1) {
        return state;
      }
      i = closeIndex + 3;
      state = null;
      continue;
    }

    const ch = line[i];

    if (ch === '#') {
      return state;
    }

    if (ch === '\'') {
      if (line.startsWith('\'\'\'', i)) {
        state = 'literal';
        i += 3;
        continue;
      }
      const close = line.indexOf('\'', i + 1);
      if (close === -1) {
        return state;
      }
      i = close + 1;
      continue;
    }

    if (ch === '"') {
      if (line.startsWith('"""', i)) {
        state = 'basic';
        i += 3;
        continue;
      }
      i += 1;
      while (i < line.length) {
        if (line[i] === '\\') {
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    i += 1;
  }

  return state;
}

module.exports = {
  detectLineEnding,
  splitTomlLines,
  findTomlCommentStart,
  findMultilineBasicStringClose,
  advanceTomlMultilineStringState,
};
