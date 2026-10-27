const { withAppBuildGradle } = require('@expo/config-plugins');

function withAbiFilters(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (!buildGradle.includes("abiFilters 'arm64-v8a'")) {
      const ndkBlock = `
        ndk {
            abiFilters 'arm64-v8a'
        }
`;
      if (buildGradle.includes('defaultConfig {')) {
        buildGradle = buildGradle.replace(
          'defaultConfig {',
          `defaultConfig {${ndkBlock}`
        );
      }
    }

    config.modResults.contents = buildGradle;
    return config;
  });
}

module.exports = withAbiFilters;
