import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'space-before-function-paren': 'off',
      '@typescript-eslint/space-before-function-paren': ['error', 'never'],
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
];