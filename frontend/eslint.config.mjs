import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'pnpm-lock.yaml']
  },
  // Base JS recommended rules with global environments
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // Next.js plugin rules (core web vitals)
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off'
    }
  },
  // TypeScript-specific overrides
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // Use TS-aware unused-vars and disable base rules for TS files
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  // File-specific overrides
  {
    files: ['lib/config-generator.ts'],
    rules: {
      'no-useless-escape': 'off',
    }
  }
];
