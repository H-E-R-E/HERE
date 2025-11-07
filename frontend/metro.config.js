const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Limit parallelism to reduce memory spikes
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
};
config.maxWorkers = 1;

module.exports = config;
