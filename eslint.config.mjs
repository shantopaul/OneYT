// OneYT — ESLint flat config (ESLint 9).
// No external `globals` package: browser + extension globals are
// listed inline so the config works with eslint alone.
// Rules that matter here: no eval, no console.log in production
// code (logger.js is the only sanctioned console user), no unused
// vars, single quotes to match Prettier.
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser / extension
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        MutationObserver: 'readonly',
        URL: 'readonly',
        Promise: 'readonly',
        chrome: 'readonly',
        importScripts: 'readonly',
        // Node (tests + tooling)
        globalThis: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'multi-line'],
      'no-console': 'error',
    },
  },
  {
    // logger.js is the sanctioned console user; service-worker
    // error reporting is allowed the same way.
    files: ['content/core/logger.js', 'background/service-worker.js', 'content/index.js'],
    rules: { 'no-console': 'off' },
  },
  {
    // Tests may use console for debugging output.
    files: ['tests/**/*.js'],
    rules: { 'no-console': 'off' },
  },
  {
    ignores: ['node_modules/', 'assets/'],
  },
];
