/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/test/(.*)$': '<rootDir>/test/$1',
    // Native JSI modules are replaced by Node's crypto, which exposes the same API.
    '^react-native-quick-crypto$': '<rootDir>/test/mocks/quick-crypto.ts',
    '^expo-crypto$': '<rootDir>/test/mocks/expo-crypto.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/migrations/**', '!src/app/**'],
};
