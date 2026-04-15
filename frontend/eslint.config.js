import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'warn', // noisy in data-fetching patterns
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Auto-remove unused imports on --fix
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Disable the TS rule that duplicates unused-vars (to avoid double-reporting)
      '@typescript-eslint/no-unused-vars': 'off',

      // Allow ternary expressions used for side-effects (e.g. canvas drawing)
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
)
