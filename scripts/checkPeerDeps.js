const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const requiredDeps = Object.keys(pkg.peerDependencies || {});
const missingDeps = requiredDeps.filter((dep) => {
  try {
    require.resolve(dep);
    return false;
  } catch (e) {
    return true;
  }
});

if (missingDeps.length > 0) {
  console.warn(
    `\n⚠️  react-native-network-tools: Missing required peer dependencies:\n` +
      missingDeps
        .map((dep) => `- ${dep}@${pkg.peerDependencies[dep]}`)
        .join('\n') +
      `\n\nPlease install them by running:\n` +
      `yarn add ${missingDeps.join(' ')}\n\n` +
      `Or set SKIP_PEER_DEPS=true to skip this check.\n`
  );
  process.exit(1);
}
