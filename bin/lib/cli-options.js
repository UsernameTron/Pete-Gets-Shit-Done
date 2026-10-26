// CLI flags the installer modules read at install time.
// bin/install.js parses argv and fills these in before any install/uninstall runs.
module.exports = {
  explicitConfigDir: null,
  hasNoGovernance: false,
  hasPlugins: false,
  hasScaffold: false,
  forceStatusline: false,
};
