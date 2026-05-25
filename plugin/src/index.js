let configPlugins = null;
try {
  configPlugins = require('@expo/config-plugins');
} catch (_error) {
  try {
    configPlugins = require('expo/config-plugins');
  } catch (_nestedError) {
    configPlugins = null;
  }
}

const createRunOncePlugin =
  configPlugins?.createRunOncePlugin ??
  ((plugin) => {
    return plugin;
  });
const withMainApplication = configPlugins?.withMainApplication;
const withAppDelegate = configPlugins?.withAppDelegate;
const WarningAggregator = configPlugins?.WarningAggregator;

const PACKAGE_NAME = 'react-native-network-tools';

// ─── Android ─────────────────────────────────────────────────────────────────

const KOTLIN_IMPORTS = [
  'import com.facebook.react.modules.network.NetworkingModule',
  'import com.networktools.NetworkToolsManager',
  'import okhttp3.OkHttpClient',
];

const JAVA_IMPORTS = [
  'import com.facebook.react.modules.network.NetworkingModule;',
  'import com.networktools.NetworkToolsManager;',
  'import okhttp3.OkHttpClient;',
];

const KOTLIN_SNIPPET = `    if (BuildConfig.DEBUG) {
      NetworkingModule.setCustomClientBuilder(
        object : NetworkingModule.CustomClientBuilder {
          override fun apply(builder: OkHttpClient.Builder) {
            NetworkToolsManager.addInterceptor(builder)
          }
        }
      )
    }`;

const JAVA_SNIPPET = `    if (BuildConfig.DEBUG) {
      NetworkingModule.setCustomClientBuilder(
        new NetworkingModule.CustomClientBuilder() {
          @Override
          public void apply(OkHttpClient.Builder builder) {
            NetworkToolsManager.addInterceptor(builder);
          }
        }
      );
    }`;

function ensureImport(src, importLine) {
  if (src.includes(importLine)) {
    return src;
  }

  const packageDeclarationMatch = src.match(/package [^\n]+\n/);
  if (!packageDeclarationMatch) {
    return src;
  }

  const insertionPoint =
    packageDeclarationMatch.index + packageDeclarationMatch[0].length;
  return `${src.slice(0, insertionPoint)}\n${importLine}${src.slice(insertionPoint)}`;
}

function applyKotlinPatch(mainApplicationSrc) {
  if (
    mainApplicationSrc.includes('NetworkToolsManager.addInterceptor(builder)')
  ) {
    return mainApplicationSrc;
  }

  let patched = mainApplicationSrc;
  KOTLIN_IMPORTS.forEach((importLine) => {
    patched = ensureImport(patched, importLine);
  });

  const onCreateRegex =
    /override fun onCreate\(\)\s*\{\s*\n(\s*)super\.onCreate\(\)\s*\n/;
  if (!onCreateRegex.test(patched)) {
    return null;
  }

  patched = patched.replace(onCreateRegex, (match, indent) => {
    return `${match}\n${KOTLIN_SNIPPET.split('\n').join(`\n${indent}`)}\n`;
  });

  return patched;
}

function applyJavaPatch(mainApplicationSrc) {
  if (
    mainApplicationSrc.includes('NetworkToolsManager.addInterceptor(builder)')
  ) {
    return mainApplicationSrc;
  }

  let patched = mainApplicationSrc;
  JAVA_IMPORTS.forEach((importLine) => {
    patched = ensureImport(patched, importLine);
  });

  const onCreateRegex =
    /public void onCreate\(\)\s*\{\s*\n(\s*)super\.onCreate\(\);\s*\n/;
  if (!onCreateRegex.test(patched)) {
    return null;
  }

  patched = patched.replace(onCreateRegex, (match, indent) => {
    return `${match}\n${JAVA_SNIPPET.split('\n').join(`\n${indent}`)}\n`;
  });

  return patched;
}

// ─── iOS ──────────────────────────────────────────────────────────────────────

const SWIFT_IMPORT = 'import NetworkTools';

// The snippet is deliberately un-indented; applySwiftAppDelegatePatch reindents
// it to match the surrounding code via the captured indent group.
const SWIFT_SNIPPET = `    #if DEBUG
    NetworkToolsManager.activate()
    #endif`;

const OBJC_IMPORT = '#import <NetworkTools/NetworkToolsManager.h>';

const OBJC_SNIPPET = `  #if DEBUG
  [NetworkToolsManager activate];
  #endif`;

function ensureSwiftImport(src) {
  if (src.includes(SWIFT_IMPORT)) {
    return src;
  }
  // Insert after the last `import ...` line.
  const importMatches = [...src.matchAll(/^import .+$/gm)];
  if (importMatches.length === 0) {
    return src;
  }
  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  return `${src.slice(0, insertAt)}\n${SWIFT_IMPORT}${src.slice(insertAt)}`;
}

function ensureObjcImport(src) {
  if (src.includes(OBJC_IMPORT)) {
    return src;
  }
  // Insert after the last #import line.
  const importMatches = [...src.matchAll(/^#import .+$/gm)];
  if (importMatches.length === 0) {
    return src;
  }
  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;
  return `${src.slice(0, insertAt)}\n${OBJC_IMPORT}${src.slice(insertAt)}`;
}

/**
 * Patches a Swift AppDelegate by:
 *   1. Adding `import NetworkTools` after the last existing import.
 *   2. Inserting a `#if DEBUG NetworkToolsManager.activate() #endif` block
 *      at the start of `application(_:didFinishLaunchingWithOptions:)`.
 */
function applySwiftAppDelegatePatch(src) {
  if (src.includes('NetworkToolsManager.activate()')) {
    return src; // idempotent
  }

  let patched = ensureSwiftImport(src);

  // Match the closing `) -> Bool {` of the function signature, followed by a
  // newline and the first line's leading whitespace.
  const didFinishRegex =
    /(\bdidFinishLaunchingWithOptions\b[\s\S]*?->\s*Bool\s*\{)\s*\n(\s*)/;
  if (!didFinishRegex.test(patched)) {
    return null;
  }

  patched = patched.replace(didFinishRegex, (match, signature, indent) => {
    const indented = SWIFT_SNIPPET.split('\n').join(`\n${indent}`);
    return `${signature}\n${indent}${indented}\n\n${indent}`;
  });

  return patched;
}

/**
 * Patches an Objective-C AppDelegate (.m / .mm) by:
 *   1. Adding `#import <NetworkTools/NetworkToolsManager.h>` after the last import.
 *   2. Inserting `[NetworkToolsManager activate]` inside
 *      `application:didFinishLaunchingWithOptions:`.
 */
function applyObjcAppDelegatePatch(src) {
  if (src.includes('[NetworkToolsManager activate]')) {
    return src; // idempotent
  }

  let patched = ensureObjcImport(src);

  const didFinishRegex =
    /(-\s*\(BOOL\)\s*application[\s\S]*?didFinishLaunchingWithOptions[\s\S]*?\{)\s*\n(\s*)/;
  if (!didFinishRegex.test(patched)) {
    return null;
  }

  patched = patched.replace(didFinishRegex, (match, signature, indent) => {
    const indented = OBJC_SNIPPET.split('\n').join(`\n${indent}`);
    return `${signature}\n${indent}${indented}\n\n${indent}`;
  });

  return patched;
}

// ─── Plugin wiring ────────────────────────────────────────────────────────────

const withNetworkTools = (config) => {
  if (!withMainApplication || !WarningAggregator) {
    throw new Error(
      'react-native-network-tools Expo plugin requires expo/config-plugins or @expo/config-plugins'
    );
  }

  // Android — patch MainApplication
  let updated = withMainApplication(config, (mod) => {
    const { language, contents } = mod.modResults;
    const patchedContents =
      language === 'kt' ? applyKotlinPatch(contents) : applyJavaPatch(contents);

    if (patchedContents == null) {
      WarningAggregator.addWarningAndroid(
        PACKAGE_NAME,
        `Could not automatically patch MainApplication.${language}. ` +
          'Please add NetworkingModule.setCustomClientBuilder manually.'
      );
      return mod;
    }

    mod.modResults.contents = patchedContents;
    return mod;
  });

  // iOS — patch AppDelegate (Swift or ObjC)
  if (withAppDelegate) {
    updated = withAppDelegate(updated, (mod) => {
      const { language, contents } = mod.modResults;
      const patchedContents =
        language === 'swift'
          ? applySwiftAppDelegatePatch(contents)
          : applyObjcAppDelegatePatch(contents);

      if (patchedContents == null) {
        WarningAggregator.addWarningIOS(
          PACKAGE_NAME,
          `Could not automatically patch AppDelegate.${language}. ` +
            'Please add [NetworkToolsManager activate] (ObjC) or ' +
            'NetworkToolsManager.activate() (Swift) manually inside ' +
            'application:didFinishLaunchingWithOptions:, wrapped in #if DEBUG.'
        );
        return mod;
      }

      mod.modResults.contents = patchedContents;
      return mod;
    });
  }

  return updated;
};

const pkg = require('../../package.json');

module.exports = createRunOncePlugin(withNetworkTools, pkg.name, pkg.version);
module.exports.withNetworkTools = withNetworkTools;
module.exports.applyKotlinPatch = applyKotlinPatch;
module.exports.applyJavaPatch = applyJavaPatch;
module.exports.applySwiftAppDelegatePatch = applySwiftAppDelegatePatch;
module.exports.applyObjcAppDelegatePatch = applyObjcAppDelegatePatch;
