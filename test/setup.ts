jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'pt-BR', languageCode: 'pt' }],
}));
