import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const appFiles = [
  '*.{ts,tsx}',
  'api/**/*.ts',
  'apps/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'contexts/**/*.{ts,tsx}',
  'data/**/*.ts',
  'hooks/**/*.{ts,tsx}',
  'lib/**/*.ts',
  'packages/**/*.ts',
  'services/**/*.ts',
  'tests/**/*.ts',
  'utils/**/*.ts',
];

export default [
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'node_modules/**',
      'remotion/**',
      'supabase/functions/**',
      'validation/**',
      'MEMORY.md.tmp.*',
    ],
  },
  {
    files: appFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'preserve-caught-error': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.{js,mjs}', 'apps/**/*.{js,mjs}', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['apps/web/public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
];
