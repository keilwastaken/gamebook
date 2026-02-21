// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      'lib/game-store.ts',
      'lib/board/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/board/engine',
              message:
                "Import board engine through '@/lib/game-store' or '@/lib/board' boundaries only.",
            },
            {
              name: '@/lib/board/engine.ts',
              message:
                "Import board engine through '@/lib/game-store' or '@/lib/board' boundaries only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['components/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**'],
              message: 'components/ must not import app/ modules.',
            },
            {
              group: ['@/lib/game-store', '@/lib/games-context', '@/lib/board/engine'],
              message: 'components/ must not import stateful lib runtime modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['lib/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', '@/components', '@/components/**'],
              message: 'lib/ must stay UI-agnostic and not import app/ or components/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['constants/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app', '@/app/**'], message: 'constants/ cannot import app/.' },
            {
              group: ['@/components', '@/components/**'],
              message: 'constants/ cannot import components/.',
            },
            { group: ['@/hooks', '@/hooks/**'], message: 'constants/ cannot import hooks/.' },
            { group: ['@/lib', '@/lib/**'], message: 'constants/ cannot import lib/.' },
            { group: ['@/utils', '@/utils/**'], message: 'constants/ cannot import utils/.' },
          ],
        },
      ],
    },
  },
  {
    files: ['hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app', '@/app/**'], message: 'hooks/ cannot import app/.' },
            {
              group: ['@/components', '@/components/**'],
              message: 'hooks/ should not import components/.',
            },
          ],
        },
      ],
    },
  },
]);
