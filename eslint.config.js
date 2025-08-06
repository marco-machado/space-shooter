import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLRenderingContext: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        performance: 'readonly',
        Phaser: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
      },
    },
    rules: {
      'no-console': [
        'error',
        {
          allow: ['error'], // Only allow console.error, force Logger usage for everything else
        },
      ],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'arrow-spacing': 'error',
      'prefer-arrow-callback': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-constructor': 'error',
      'class-methods-use-this': 'off', // Allow methods that don't use 'this' in game classes
      'no-param-reassign': ['error', { props: false }], // Allow parameter property modification
      'no-prototype-builtins': 'off', // Allow hasOwnProperty usage
    },
  },
  {
    files: ['src/core/Logger.js'],
    rules: {
      'no-console': 'off', // Logger scopeName is allowed to use console methods
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        global: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in tests
    },
  },
];
