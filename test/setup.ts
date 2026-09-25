jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'pt-BR', languageCode: 'pt' }],
}));

// Change notifications come from the native module; tests query the database directly.
jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: () => ({ remove: () => {} }),
  openDatabaseSync: () => {
    throw new Error('Use createTestDatabase() from test/db in tests');
  },
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
