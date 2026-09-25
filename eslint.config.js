const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

const layer = (type) => ({ element: { type } });

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'coverage/*', 'src/core/db/migrations/*']),
  expoConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'core', pattern: 'src/core' },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'types', pattern: 'src/types' },
      ],
    },
    rules: {
      // app → features → (core, shared); core ↛ features; shared ↛ core/features.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: '{{from.element.type}} não pode importar {{to.element.type}}',
          policies: [
            {
              from: layer('app'),
              allow: { to: [layer('feature'), layer('core'), layer('shared')] },
            },
            {
              from: layer('feature'),
              allow: {
                to: [
                  {
                    element: {
                      type: 'feature',
                      captured: { feature: '{{from.element.captured.feature}}' },
                    },
                  },
                  layer('core'),
                  layer('shared'),
                ],
              },
            },
            { from: layer('core'), allow: { to: [layer('core'), layer('shared')] } },
            { from: layer('shared'), allow: { to: [layer('shared')] } },
            { from: layer('types'), allow: { to: [layer('core')] } },
          ],
        },
      ],
      // Features only talk to each other through their public index.ts.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/**'],
              message: 'Importe apenas de @/features/<nome> (index.ts).',
            },
          ],
        },
      ],
    },
  },
]);
