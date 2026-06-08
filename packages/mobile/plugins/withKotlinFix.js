const { withProjectBuildGradle } = require("@expo/config-plugins");

function withKotlinFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      config.modResults.contents = config.modResults.contents.replace(
        /ext\.kotlinVersion\s*=\s*['"][^'"]+['"]/,
        "ext.kotlinVersion = '1.9.25'"
      );
    }
    return config;
  });
}

module.exports = withKotlinFix;
