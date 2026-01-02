import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// Create an async function to handle the dynamic import
async function getConfig() {
  const { default: noExampleImportsRule } =
    await import('./eslint-rules/no-example-imports.mjs');

  return defineConfig([
    {
      files: ['src/**/*.{js,jsx,ts,tsx}'],
      plugins: {
        'no-example-imports': {
          rules: {
            'no-example-imports': noExampleImportsRule,
          },
        },
      },
      rules: {
        'no-example-imports/no-example-imports': 'error',
        'react/react-in-jsx-scope': 'off',
        'prettier/prettier': 'error',
      },
    },
    {
      extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
      plugins: { prettier },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'prettier/prettier': 'error',
      },
    },
    {
      ignores: ['node_modules/', 'lib/'],
    },
  ]);
}

// Export the config by immediately invoking the async function
export default getConfig().then((config) => config);
