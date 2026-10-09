import { useEffect } from 'react';
import { Appearance } from 'react-native';

import { useColorSchemePreference } from '../hooks/use-color-scheme-preference';

/**
 * Applies the saved light/dark preference app-wide. Overriding React Native's Appearance makes
 * `useColorScheme` (and so the ThemeProvider), the navigation theme and native UI follow it.
 * Must render inside the DatabaseProvider.
 */
export function ColorSchemeSync() {
  const preference = useColorSchemePreference();
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);
  return null;
}
