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
