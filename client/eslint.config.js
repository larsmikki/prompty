import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Legitimate uses (e.g. URL.createObjectURL with revoke on cleanup) trip
      // this rule. Keep as a warning so it still surfaces but doesn't fail CI.
      'react-hooks/set-state-in-effect': 'warn',
      // Co-locating a context Provider with its consumer hook works fine; the
      // only cost is HMR state preservation on edit. Warning is enough.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
