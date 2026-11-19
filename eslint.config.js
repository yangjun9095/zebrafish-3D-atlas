import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// AR-04 and QP-04: src/core and src/state never import React or three.
const restrictedUiImports = {
  patterns: [
    { group: ['react', 'react-dom', 'react/*', 'react-dom/*'], message: 'src/core and src/state stay free of React.' },
    { group: ['@react-three/*'], message: 'src/core and src/state stay free of react-three.' },
    { group: ['three', 'three/*'], message: 'Only src/core/primitives/toBufferGeometry.ts imports three.' },
  ],
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'docs', 'test-results', 'playwright-report', 'data', 'public']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator'],
      'no-restricted-imports': ['error', restrictedUiImports],
    },
  },
  {
    files: ['src/state/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', restrictedUiImports],
    },
  },
  {
    files: ['src/core/primitives/toBufferGeometry.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
])
