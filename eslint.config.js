const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  // Ignore build artifacts
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/.cache/**'],
  },

  // Base TypeScript rules (fast; no type info required)
  ...tseslint.configs.recommended,

  // Type-aware TS rules (flat config: no "extends")
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions || {}),
        projectService: true,
      },
    },
  })),

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    }
  },

  // General JS/TS settings for the project
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // React + Hooks (works with the modern JSX transform)
  {
    files: ['src/**/*.{jsx,tsx,ts}'],
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      // New JSX transform: no need to import React in scope
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Hooks best practices
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Test files (Mocha/Chai)
  {
    files: ['test/**/*.{js,jsx,ts,tsx}', 'src/**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      // Mocha globals (so ESLint won’t complain about describe/it/etc.)
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      // Allow chai-style assertions like: expect(x).to.be.true
      'no-unused-expressions': 'off',
    }
  }
];
