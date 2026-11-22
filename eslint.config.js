export default [
  { ignores: ['dist/**', 'public/**', 'test-results/**'] },
  { files: ['**/*.{js,jsx}'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { 'no-unreachable': 'error', 'no-constant-condition': ['error', { checkLoops: false }], 'no-dupe-keys': 'error' } },
];
