import '@/core/i18n';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import type { ColorSchemePreference } from '../hooks/use-color-scheme-preference';
import { AppearanceSettings } from './appearance-settings';
import { ColorSchemeSync } from './color-scheme-sync';

let mockPreference: ColorSchemePreference = 'system';
const mockSet = jest.fn();
jest.mock('../hooks/use-color-scheme-preference', () => ({
  ...jest.requireActual('../hooks/use-color-scheme-preference'),
  useColorSchemePreference: () => mockPreference,
  setColorSchemePreference: (value: ColorSchemePreference) => mockSet(value),
}));

describe('AppearanceSettings', () => {
  beforeEach(() => {
    mockPreference = 'system';
    mockSet.mockClear();
  });

  it('marks the current option and saves a new one', async () => {
    await render(<AppearanceSettings />);
    expect(screen.getByRole('radio', { name: 'Automático' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Escuro' }));
    expect(mockSet).toHaveBeenCalledWith('dark');
  });
});

describe('ColorSchemeSync', () => {
  const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

  beforeEach(() => setColorScheme.mockClear());

  it.each([
    ['system', 'unspecified'],
    ['light', 'light'],
    ['dark', 'dark'],
  ] as const)('applies %s as %s', async (preference, scheme) => {
    mockPreference = preference;
    await render(<ColorSchemeSync />);
    expect(setColorScheme).toHaveBeenLastCalledWith(scheme);
  });
});
