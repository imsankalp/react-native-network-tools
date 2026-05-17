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
const WarningAggregator = configPlugins?.WarningAggregator;

const PACKAGE_NAME = 'react-native-network-tools';

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

const KOTLIN_SNIPPET = `    NetworkingModule.setCustomClientBuilder(
      object : NetworkingModule.CustomClientBuilder {
        override fun apply(builder: OkHttpClient.Builder) {
          NetworkToolsManager.addInterceptor(builder)
        }
      }
    )`;

const JAVA_SNIPPET = `    NetworkingModule.setCustomClientBuilder(
      new NetworkingModule.CustomClientBuilder() {
        @Override
        public void apply(OkHttpClient.Builder builder) {
          NetworkToolsManager.addInterceptor(builder);
        }
      }
    );`;

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

const withNetworkTools = (config) => {
  if (!withMainApplication || !WarningAggregator) {
    throw new Error(
      'react-native-network-tools Expo plugin requires expo/config-plugins or @expo/config-plugins'
    );
  }

  return withMainApplication(config, (mod) => {
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
};

const pkg = require('../../package.json');

module.exports = createRunOncePlugin(withNetworkTools, pkg.name, pkg.version);
module.exports.withNetworkTools = withNetworkTools;
module.exports.applyKotlinPatch = applyKotlinPatch;
module.exports.applyJavaPatch = applyJavaPatch;
