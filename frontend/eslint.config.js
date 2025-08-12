import next from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'pnpm-lock.yaml']
  },
  ...next,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off'
    }
  }
];
