import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Advisory React-Compiler / fast-refresh rules: keep them visible as
      // warnings, but don't fail the build (and thus the CI gate) on them. The
      // patterns they flag (setState in data-loading effects, the Home useMemo,
      // useAuth co-located with AuthProvider) are intentional here.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Backend + tooling run on Node, not in the browser, so they use Node
    // globals (process, Buffer, etc.). Without this, server files report
    // `no-undef` for those and `npm run lint` is unusable for the API.
    files: ['server/**/*.js', 'api/**/*.js', '*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Test files: Vitest globals (`globals: true` in vitest.config.js) + Node.
    // Also relax the react-refresh rule, which only matters for HMR of component
    // modules, not tests.
    files: ['**/*.test.{js,jsx}', 'tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
