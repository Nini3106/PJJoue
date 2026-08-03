const globals = require('globals');

module.exports = [
  {
    ignores: [
      'donnees/donnees-pjj.js',
      'node_modules/**'
    ]
  },
  {
    files: ['ressources/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.browser
    },
    rules: {
      'no-constant-condition': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-loss-of-precision': 'error',
      'no-redeclare': 'error',
      'no-self-assign': 'error',
      'no-sparse-arrays': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-useless-backreference': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error'
    }
  }
];
