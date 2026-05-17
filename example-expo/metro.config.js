const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const MONOREPO_ROOT = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Watch the monorepo root so library source changes are reflected immediately
config.watchFolders = [MONOREPO_ROOT];

// Resolve modules from both the app's node_modules and the monorepo root's node_modules.
// This prevents duplicate module errors and allows the library to be resolved from source.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(MONOREPO_ROOT, 'node_modules'),
];

// Prefer the 'source' export condition so react-native-network-tools resolves
// to src/ directly, enabling live editing without a yarn prepare step.
config.resolver.unstable_conditionNames = ['source', 'require', 'default'];

module.exports = wrapWithReanimatedMetroConfig(config);
