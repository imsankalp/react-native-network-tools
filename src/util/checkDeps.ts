// These will be filled at runtime
let reanimatedVersion = '0.0.0';
let gestureHandlerVersion = '0.0.0';

try {
  // @ts-ignore - We'll handle the error case
  reanimatedVersion = require('react-native-reanimated/package.json').version;
  // @ts-ignore - We'll handle the error case
  gestureHandlerVersion =
    require('react-native-gesture-handler/package.json').version;
} catch (e) {
  // These will be caught by the peer dependency check
}

const MIN_REANIMATED_VERSION = '2.0.0';
const MIN_GESTURE_HANDLER_VERSION = '2.0.0';

function checkDependency(name: string, current: string, min: string): boolean {
  console.log('name: ', name);

  const [currentMajor] = current.split('.').map(Number);
  const [minMajor] = min.split('.').map(Number);
  if (
    currentMajor !== undefined &&
    minMajor !== undefined &&
    currentMajor >= minMajor
  )
    return true;
  return false;
}

export function checkDependencies(): boolean {
  if (__DEV__) {
    const reanimatedValid = checkDependency(
      'react-native-reanimated',
      reanimatedVersion,
      MIN_REANIMATED_VERSION
    );

    const gestureHandlerValid = checkDependency(
      'react-native-gesture-handler',
      gestureHandlerVersion,
      MIN_GESTURE_HANDLER_VERSION
    );

    if (!reanimatedValid || !gestureHandlerValid) {
      console.warn(
        `\n⚠️ react-native-network-tools: Some peer dependencies are not met.\n` +
          `- react-native-reanimated@^${MIN_REANIMATED_VERSION} is required (found ${reanimatedVersion})\n` +
          `- react-native-gesture-handler@^${MIN_GESTURE_HANDLER_VERSION} is required (found ${gestureHandlerVersion})\n\n` +
          `Please update your dependencies to avoid potential issues.\n` +
          `Run: yarn add react-native-reanimated@^${MIN_REANIMATED_VERSION} react-native-gesture-handler@^${MIN_GESTURE_HANDLER_VERSION}\n`
      );
      return false;
    }
  }
  return true;
}
