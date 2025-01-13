import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['node_modules/!**']
  },
  {
    // 9.0.0 版本中移除了--ext，文件拓展名在此处配置
    files: ['**/*.{js,ts,jsx,mjs,cjs,ts}']
  },
  {
    languageOptions: {
      globals: {
        browser: true,
        jest: true
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // 规则配置
    rules: {
      'no-undef': 'off',
      'prefer-const': 'off',
      'no-case-declarations': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-unused-vars': 'off'
    }
  }
];
