import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['.next/**', '.next', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
];
