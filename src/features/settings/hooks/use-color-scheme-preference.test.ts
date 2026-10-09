import type { AppDatabase } from '@/core/db';
import { writeSetting } from '@/core/db';
import { createTestDatabase } from '@/test/db';

import { readColorSchemePreference, setColorSchemePreference } from './use-color-scheme-preference';

let mockDb: AppDatabase;
jest.mock('@/core/db', () => ({
  ...jest.requireActual('@/core/db'),
  getDatabase: () => mockDb,
}));

describe('color scheme preference', () => {
  beforeEach(async () => {
    mockDb = await createTestDatabase();
  });

  it('follows the device by default', () => {
    expect(readColorSchemePreference()).toBe('system');
  });

  it('saves the chosen scheme', () => {
    setColorSchemePreference('dark');
    expect(readColorSchemePreference()).toBe('dark');
    setColorSchemePreference('light');
    expect(readColorSchemePreference()).toBe('light');
  });

  it('ignores unknown stored values', () => {
    writeSetting(mockDb, 'appearance.colorScheme', 'sepia');
    expect(readColorSchemePreference()).toBe('system');
  });
});
