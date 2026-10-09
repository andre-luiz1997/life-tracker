const shared = {
  setupFiles: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/test/(.*)$': '<rootDir>/test/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    // Native JSI modules are replaced by Node's crypto, which exposes the same API.
    '^react-native-quick-crypto$': '<rootDir>/test/mocks/quick-crypto.ts',
    '^expo-crypto$': '<rootDir>/test/mocks/expo-crypto.ts',
    '^react-native-quick-base64$': '<rootDir>/test/mocks/quick-base64.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};

/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/migrations/**', '!src/app/**'],
  projects: [
    {
      ...shared,
      displayName: 'app',
      preset: 'jest-expo',
      // Loads the JS (non-native) build of react-native-worklets used by Reanimated.
      resolver: 'react-native-worklets/jest/resolver.js',
      testPathIgnorePatterns: [...shared.testPathIgnorePatterns, '\\.skia\\.test\\.ts$'],
    },
    {
      // Real Skia on CanvasKit (WASM): needs web/node module resolution instead of .native files.
      ...shared,
      displayName: 'skia',
      preset: 'jest-expo/node',
      testMatch: ['**/*.skia.test.ts'],
    },
  ],
};
