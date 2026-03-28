import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        $: 'readonly',
        chiiApp: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
    },
    settings: {
      react: {
        version: '999.999.999',
      },
    },
  },
];
